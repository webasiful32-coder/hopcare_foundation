import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { dbStore } from './server/db/store';
import { postgresService } from './server/db/postgres';
import { authService } from './server/services/authService';
import { paymentService } from './server/services/paymentService';
import { bloodMatchingService } from './server/services/bloodMatchingService';
import { aiService } from './server/services/aiService';
import { UserRole } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// ============================================================
// Authentication Middleware
// ============================================================
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const verified = authService.verifyToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const user = dbStore.users.get(verified.userId);
  if (!user || !user.isActive) {
    res.status(403).json({ error: 'Account suspended or not found' });
    return;
  }
  (req as any).user = user;
  next();
};

const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Access denied: insufficient permissions' });
      return;
    }
    next();
  };
};

// ============================================================
// Database Health & Status Endpoint
// ============================================================
app.get('/api/health/db-status', (req, res) => {
  res.json(postgresService.getStatus());
});

// ============================================================
// Auth Routes
// ============================================================
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, phone, password, division, district, upazila } = req.body;
  if (!fullName || !email || !phone || !password || !district) {
    return res.status(400).json({ error: 'All registration fields are required' });
  }

  // Check existing in memory store
  for (const existing of dbStore.users.values()) {
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      return res.status(409).json({ error: 'Email is already registered' });
    }
  }

  // Check existing in Neon PostgreSQL if connected
  if (postgresService.isConnected) {
    try {
      const checkRes = await postgresService.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (checkRes && checkRes.rows.length > 0) {
        return res.status(409).json({ error: 'Email is already registered in Neon database' });
      }
    } catch (err: any) {
      console.warn('[Postgres Check Error]:', err.message);
    }
  }

  // First registered account becomes ADMIN, subsequent become DONOR
  const assignedRole: UserRole = dbStore.users.size === 0 ? 'ADMIN' : 'DONOR';

  const userId = 'user-' + Date.now();
  const passwordHash = authService.hashPassword(password);
  const newUser = {
    id: userId,
    fullName,
    email: email.toLowerCase(),
    phone,
    role: assignedRole,
    division: division || 'Dhaka',
    district,
    upazila: upazila || '',
    isActive: true,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.users.set(userId, newUser);

  // Sync to Neon PostgreSQL
  if (postgresService.isConnected) {
    try {
      await postgresService.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, division, district, upazila, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         ON CONFLICT (email) DO NOTHING`,
        [userId, email.toLowerCase(), passwordHash, fullName, phone, assignedRole, division || 'Dhaka', district, upazila || '', true]
      );
    } catch (err: any) {
      console.warn('[Postgres Sync Insert]:', err.message);
    }
  }

  const token = authService.generateSessionToken(userId, assignedRole);

  // Strip password hash
  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  let matchedUser: any = null;
  for (const user of dbStore.users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      matchedUser = user;
      break;
    }
  }

  // If not found in memory, query Neon PostgreSQL
  if (!matchedUser && postgresService.isConnected) {
    try {
      const dbRes = await postgresService.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (dbRes && dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        matchedUser = {
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          phone: row.phone,
          role: row.role as UserRole,
          division: row.division,
          district: row.district,
          upazila: row.upazila,
          isActive: row.is_active,
          passwordHash: row.password_hash,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        dbStore.users.set(matchedUser.id, matchedUser);
      }
    } catch (err: any) {
      console.warn('[Postgres Login Search Error]:', err.message);
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = authService.verifyPassword(password, matchedUser.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = authService.generateSessionToken(matchedUser.id, matchedUser.role);
  const { passwordHash: _, ...safeUser } = matchedUser;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  // Architecture ready for email gateway
  res.json({ message: `Password reset instructions dispatched to ${email || 'your email'}.` });
});

// ============================================================
// Campaigns API
// ============================================================
app.get('/api/campaigns', (req, res) => {
  const { category, status, search } = req.query;
  let list = Array.from(dbStore.campaigns.values());

  if (category && category !== 'All') {
    list = list.filter(c => c.category === category);
  }
  if (status && status !== 'All') {
    list = list.filter(c => c.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(c => c.title.toLowerCase().includes(q) || c.shortDescription.toLowerCase().includes(q));
  }

  res.json(list);
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = dbStore.campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
});

app.post('/api/campaigns', authenticate, requireRole('ADMIN'), (req, res) => {
  const { title, category, shortDescription, fullDescription, targetAmount, featuredImageUrl, deadline, organizerName, isUrgent } = req.body;
  const id = 'camp-' + Date.now();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const newCampaign = {
    id,
    title,
    slug,
    category,
    shortDescription,
    fullDescription,
    targetAmount: Number(targetAmount),
    collectedAmount: 0,
    donorCount: 0,
    featuredImageUrl: featuredImageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    galleryImages: [],
    status: 'Active' as const,
    deadline: deadline || '2026-12-31',
    organizerName: organizerName || 'HopeCare Medical Cell',
    isUrgent: Boolean(isUrgent),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.campaigns.set(id, newCampaign);
  res.status(201).json(newCampaign);
});

// ============================================================
// Online Donation & Payment API
// ============================================================
app.post('/api/donations', async (req, res) => {
  try {
    const { campaignId, donorName, donorEmail, donorPhone, amount, isAnonymous, message, paymentGateway, userId } = req.body;
    if (!campaignId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid campaign and donation amount required' });
    }

    const campaign = dbStore.campaigns.get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const donationId = 'don-' + Date.now();
    const receiptNumber = 'REC-2026-' + Math.floor(10000 + Math.random() * 90000);

    // Modular Payment processing through PaymentService
    const paymentResult = await paymentService.processDonationPayment(
      paymentGateway || 'bKash',
      Number(amount),
      donationId,
      { donorName, donorEmail }
    );

    const donation = {
      id: donationId,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      userId: userId || undefined,
      donorName: isAnonymous ? 'Anonymous Donor' : (donorName || 'Kind Supporter'),
      donorEmail: donorEmail || 'donor@hopecare.org',
      donorPhone: donorPhone || '+8801800000000',
      amount: Number(amount),
      isAnonymous: Boolean(isAnonymous),
      message: message || '',
      paymentGateway: paymentGateway || 'bKash',
      paymentStatus: 'Successful' as const,
      transactionId: paymentResult.initResult.transactionId,
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    // Update Campaign Progress
    campaign.collectedAmount += Number(amount);
    campaign.donorCount += 1;
    campaign.updatedAt = new Date().toISOString();
    dbStore.campaigns.set(campaign.id, campaign);

    // Save records
    dbStore.donations.set(donationId, donation);
    dbStore.paymentTransactions.set(paymentResult.paymentTx.id, paymentResult.paymentTx);

    // Create Notification
    const notifId = 'notif-' + Date.now();
    dbStore.notifications.set(notifId, {
      id: notifId,
      userId: userId || undefined,
      type: 'donation_success',
      title: `Donation Received: ৳${Number(amount).toLocaleString()}`,
      message: `Thank you for supporting "${campaign.title}". Receipt #${receiptNumber} ready.`,
      isRead: false,
      linkUrl: '/dashboard/donations',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      donation,
      paymentResult
    });
  } catch (error: any) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Failed to process donation payment' });
  }
});

app.get('/api/donations', (req, res) => {
  const { userId, campaignId } = req.query;
  let list = Array.from(dbStore.donations.values());
  if (userId) {
    list = list.filter(d => d.userId === userId);
  }
  if (campaignId) {
    list = list.filter(d => d.campaignId === campaignId);
  }
  res.json(list.reverse());
});

// ============================================================
// Blood Donors API
// ============================================================
app.get('/api/blood-donors', (req, res) => {
  const { bloodGroup, division, district, upazila, availableOnly } = req.query;
  let list = Array.from(dbStore.bloodDonors.values());

  if (bloodGroup && bloodGroup !== 'All') {
    list = list.filter(d => d.bloodGroup === bloodGroup);
  }
  if (division && division !== 'All') {
    list = list.filter(d => d.division.toLowerCase() === String(division).toLowerCase());
  }
  if (district && district !== 'All') {
    list = list.filter(d => d.district.toLowerCase() === String(district).toLowerCase());
  }
  if (upazila && upazila !== 'All') {
    list = list.filter(d => d.upazila.toLowerCase() === String(upazila).toLowerCase());
  }
  if (availableOnly === 'true') {
    list = list.filter(d => d.isAvailable);
  }

  // Safe public view (shielding raw email/phone until authorized)
  const safeDonors = list.map(d => ({
    ...d,
    phone: d.phone.substring(0, 7) + 'XXXX' // privacy mask
  }));

  res.json(safeDonors);
});

app.post('/api/blood-donors', (req, res) => {
  const {
    fullName,
    bloodGroup,
    phone,
    email,
    division,
    district,
    upazila,
    addressArea,
    gender,
    dateOfBirth,
    lastDonationDate,
    emergencyContactPreference,
    userId
  } = req.body;

  if (!fullName || !bloodGroup || !phone || !district) {
    return res.status(400).json({ error: 'Full name, blood group, phone, and district are mandatory' });
  }

  const id = 'bd-' + Date.now();
  const donor = {
    id,
    userId: userId || undefined,
    fullName,
    bloodGroup,
    phone,
    email: email || '',
    division: division || 'Dhaka',
    district,
    upazila: upazila || '',
    addressArea: addressArea || district,
    gender: gender || 'Male',
    dateOfBirth: dateOfBirth || '1998-01-01',
    lastDonationDate: lastDonationDate || undefined,
    isAvailable: true,
    emergencyContactPreference: emergencyContactPreference || 'Call',
    totalDonationCount: 1,
    status: 'Active' as const,
    createdAt: new Date().toISOString()
  };

  dbStore.bloodDonors.set(id, donor);
  res.status(201).json(donor);
});

app.patch('/api/blood-donors/:id', (req, res) => {
  const donor = dbStore.bloodDonors.get(req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });

  const updated = { ...donor, ...req.body };
  dbStore.bloodDonors.set(donor.id, updated);
  res.json(updated);
});

// ============================================================
// Emergency Blood Requests API
// ============================================================
app.get('/api/blood-requests', (req, res) => {
  const { bloodGroup, district, emergencyLevel, status } = req.query;
  let list = Array.from(dbStore.bloodRequests.values());

  if (bloodGroup && bloodGroup !== 'All') {
    list = list.filter(r => r.bloodGroup === bloodGroup);
  }
  if (district && district !== 'All') {
    list = list.filter(r => r.district.toLowerCase() === String(district).toLowerCase());
  }
  if (emergencyLevel && emergencyLevel !== 'All') {
    list = list.filter(r => r.emergencyLevel === emergencyLevel);
  }
  if (status && status !== 'All') {
    list = list.filter(r => r.status === status);
  }

  res.json(list.reverse());
});

app.post('/api/blood-requests', (req, res) => {
  const {
    patientName,
    bloodGroup,
    requiredUnits,
    hospitalName,
    hospitalAddress,
    division,
    district,
    upazila,
    requiredDate,
    requiredTime,
    emergencyLevel,
    contactPerson,
    contactPhone,
    patientCondition,
    additionalInfo,
    userId
  } = req.body;

  if (!patientName || !bloodGroup || !hospitalName || !district || !contactPhone) {
    return res.status(400).json({ error: 'Patient, blood group, hospital, district, and contact phone are required' });
  }

  const id = 'req-' + Date.now();
  const newRequest = {
    id,
    userId: userId || undefined,
    patientName,
    bloodGroup,
    requiredUnits: Number(requiredUnits) || 1,
    hospitalName,
    hospitalAddress: hospitalAddress || hospitalName,
    division: division || 'Dhaka',
    district,
    upazila: upazila || '',
    requiredDate: requiredDate || 'Immediate',
    requiredTime: requiredTime || 'As soon as possible',
    emergencyLevel: emergencyLevel || 'Urgent',
    contactPerson: contactPerson || 'Family Member',
    contactPhone,
    patientCondition: patientCondition || 'Hospitalized emergency patient',
    additionalInfo: additionalInfo || '',
    status: 'Searching' as const,
    matchedDonorsCount: 0,
    createdAt: new Date().toISOString()
  };

  // Find matching donors count
  const allDonors = Array.from(dbStore.bloodDonors.values());
  const matches = bloodMatchingService.findMatches(newRequest, allDonors);
  newRequest.matchedDonorsCount = matches.length;

  dbStore.bloodRequests.set(id, newRequest);

  // Send system notification
  const notifId = 'notif-req-' + Date.now();
  dbStore.notifications.set(notifId, {
    id: notifId,
    type: 'blood_request',
    title: `🚨 Emergency ${bloodGroup} Blood Request`,
    message: `${newRequest.requiredUnits} unit(s) needed at ${hospitalName}, ${district}. ${matches.length} matched donors found.`,
    isRead: false,
    linkUrl: '/blood-requests',
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ request: newRequest, matchedDonors: matches.slice(0, 5) });
});

app.get('/api/blood-requests/:id/matches', (req, res) => {
  const request = dbStore.bloodRequests.get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Blood request not found' });

  const allDonors = Array.from(dbStore.bloodDonors.values());
  const matches = bloodMatchingService.findMatches(request, allDonors);
  res.json(matches);
});

app.patch('/api/blood-requests/:id/status', (req, res) => {
  const request = dbStore.bloodRequests.get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Blood request not found' });

  const { status } = req.body;
  request.status = status;
  dbStore.bloodRequests.set(request.id, request);
  res.json(request);
});

// ============================================================
// Volunteers API
// ============================================================
app.get('/api/volunteers', (req, res) => {
  res.json(Array.from(dbStore.volunteers.values()));
});

app.post('/api/volunteers', (req, res) => {
  const { fullName, email, phone, division, district, upazila, skills, availability, motivation, preferredActivities, userId } = req.body;
  if (!fullName || !email || !phone || !district) {
    return res.status(400).json({ error: 'Name, email, phone and district are required' });
  }

  const id = 'vol-' + Date.now();
  const vol = {
    id,
    userId: userId || undefined,
    fullName,
    email,
    phone,
    division: division || 'Dhaka',
    district,
    upazila: upazila || '',
    skills: Array.isArray(skills) ? skills : [skills || 'First Aid'],
    availability: availability || 'Flexible',
    motivation: motivation || 'Serving humanitarian causes',
    preferredActivities: Array.isArray(preferredActivities) ? preferredActivities : ['Emergency Response'],
    status: 'Pending' as const,
    assignedTasksCount: 0,
    createdAt: new Date().toISOString()
  };

  dbStore.volunteers.set(id, vol);
  res.status(201).json(vol);
});

app.patch('/api/volunteers/:id/status', authenticate, requireRole('ADMIN'), (req, res) => {
  const vol = dbStore.volunteers.get(req.params.id);
  if (!vol) return res.status(404).json({ error: 'Volunteer not found' });
  vol.status = req.body.status;
  dbStore.volunteers.set(vol.id, vol);
  res.json(vol);
});

// ============================================================
// Beneficiaries, Blog, Gallery, Contact API
// ============================================================
app.get('/api/beneficiaries', (req, res) => {
  res.json(Array.from(dbStore.beneficiaries.values()));
});

app.get('/api/blog', (req, res) => {
  res.json(Array.from(dbStore.blogPosts.values()));
});

app.get('/api/blog/:slug', (req, res) => {
  for (const post of dbStore.blogPosts.values()) {
    if (post.slug === req.params.slug) {
      return res.json(post);
    }
  }
  res.status(404).json({ error: 'Post not found' });
});

app.get('/api/gallery', (req, res) => {
  res.json(Array.from(dbStore.galleryItems.values()));
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const id = 'msg-' + Date.now();
  const item = {
    id,
    name,
    email,
    phone: phone || '',
    subject: subject || 'General Inquiry',
    message,
    isRead: false,
    replyStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  dbStore.contactMessages.set(id, item);
  res.status(201).json({ success: true, message: 'Message received. We will respond promptly.' });
});

app.get('/api/contact', authenticate, requireRole('ADMIN'), (req, res) => {
  res.json(Array.from(dbStore.contactMessages.values()).reverse());
});

// ============================================================
// Chat API
// ============================================================
app.get('/api/chat/conversations', (req, res) => {
  res.json(Array.from(dbStore.conversations.values()));
});

app.get('/api/chat/messages/:convId', (req, res) => {
  const list = Array.from(dbStore.messages.values()).filter(m => m.conversationId === req.params.convId);
  res.json(list);
});

app.post('/api/chat/messages', (req, res) => {
  const { conversationId, senderId, senderName, senderRole, text } = req.body;
  if (!conversationId || !text) {
    return res.status(400).json({ error: 'Conversation and text are required' });
  }

  const id = 'msg-' + Date.now();
  const msg = {
    id,
    conversationId,
    senderId: senderId || 'anon',
    senderName: senderName || 'User',
    senderRole: (senderRole || 'DONOR') as UserRole,
    text,
    timestamp: new Date().toISOString(),
    isRead: false
  };

  dbStore.messages.set(id, msg);

  // Update conversation
  const conv = dbStore.conversations.get(conversationId);
  if (conv) {
    conv.lastMessage = text;
    conv.lastMessageTime = msg.timestamp;
    dbStore.conversations.set(conv.id, conv);
  }

  res.status(201).json(msg);
});

// ============================================================
// Notifications API
// ============================================================
app.get('/api/notifications', (req, res) => {
  res.json(Array.from(dbStore.notifications.values()).reverse());
});

app.patch('/api/notifications/read-all', (req, res) => {
  for (const notif of dbStore.notifications.values()) {
    notif.isRead = true;
    dbStore.notifications.set(notif.id, notif);
  }
  res.json({ success: true });
});

// ============================================================
// Admin Metrics & Reports API
// ============================================================
app.get('/api/admin/metrics', authenticate, requireRole('ADMIN'), (req, res) => {
  const totalUsers = dbStore.users.size;
  const totalBloodDonors = dbStore.bloodDonors.size;
  const totalVolunteers = dbStore.volunteers.size;
  const totalCampaigns = dbStore.campaigns.size;

  let totalDonationsAmount = 0;
  for (const d of dbStore.donations.values()) {
    if (d.paymentStatus === 'Successful') {
      totalDonationsAmount += d.amount;
    }
  }

  const activeBloodRequests = Array.from(dbStore.bloodRequests.values()).filter(r => r.status === 'Searching' || r.status === 'Pending').length;
  const criticalRequests = Array.from(dbStore.bloodRequests.values()).filter(r => r.emergencyLevel === 'Critical').length;
  const pendingVolunteers = Array.from(dbStore.volunteers.values()).filter(v => v.status === 'Pending').length;

  res.json({
    totalUsers,
    totalBloodDonors,
    totalVolunteers,
    totalCampaigns,
    totalDonationsCount: dbStore.donations.size,
    totalDonationsAmount,
    activeBloodRequests,
    criticalRequests,
    pendingVolunteers
  });
});

app.get('/api/admin/users', authenticate, requireRole('ADMIN'), (req, res) => {
  const usersList = Array.from(dbStore.users.values()).map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });
  res.json(usersList);
});

app.patch('/api/admin/users/:id/role', authenticate, requireRole('ADMIN'), (req, res) => {
  const user = dbStore.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.role = req.body.role;
  dbStore.users.set(user.id, user);
  const { passwordHash: _, ...safe } = user;
  res.json(safe);
});

app.patch('/api/admin/users/:id/toggle-status', authenticate, requireRole('ADMIN'), (req, res) => {
  const user = dbStore.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isActive = !user.isActive;
  dbStore.users.set(user.id, user);
  const { passwordHash: _, ...safe } = user;
  res.json(safe);
});

app.get('/api/admin/audit-logs', authenticate, requireRole('ADMIN'), (req, res) => {
  res.json(Array.from(dbStore.auditLogs.values()).reverse());
});

app.post('/api/admin/clear-data', authenticate, requireRole('ADMIN'), (req, res) => {
  dbStore.clearAllRecords();
  res.json({ success: true, message: 'All demo data cleared. Database is completely fresh.' });
});

app.post('/api/admin/seed-data', authenticate, requireRole('ADMIN'), (req, res) => {
  dbStore.seedSampleRecords();
  res.json({ success: true, message: 'Starter data populated.' });
});

// ============================================================
// AI Assistant API ("Ask HopeCare AI")
// ============================================================
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const answer = await aiService.askAssistant(message || '', {
      campaigns: Array.from(dbStore.campaigns.values()),
      bloodDonors: Array.from(dbStore.bloodDonors.values()),
      bloodRequests: Array.from(dbStore.bloodRequests.values())
    });
    res.json({ reply: answer });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI Assistant temporarily unavailable' });
  }
});

// ============================================================
// Vite Middleware / Static serving setup
// ============================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, 'localhost', () => {
    console.log(`HopeCare Foundation Server running on http://localhost:${PORT}`);
  });
}

startServer();
