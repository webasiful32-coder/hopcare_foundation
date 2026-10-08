import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

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
// Config (from .env)
// ============================================================
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const AUTO_APPROVE_DONATIONS = process.env.AUTO_APPROVE_DONATIONS === 'true';

const VALID_ROLES = ['DONOR', 'VOLUNTEER', 'ADMIN'] as UserRole[];

// ============================================================
// Small helpers
// ============================================================
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: any): boolean => typeof v === 'string' && UUID_RE.test(v);

const toDateStr = (v: any): string => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().split('T')[0];
  return String(v).slice(0, 10);
};

const toIso = (v: any): string => {
  if (!v) return new Date().toISOString();
  if (v instanceof Date) return v.toISOString();
  return String(v);
};

const rowToUser = (row: any) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  role: row.role as UserRole,
  division: row.division,
  district: row.district,
  upazila: row.upazila,
  avatarUrl: row.avatar_url || undefined,
  isActive: row.is_active,
  passwordHash: row.password_hash,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

/**
 * Safe Neon query
 */
const neon = async (label: string, sql: string, params: any[] = []): Promise<any | null> => {
  if (!postgresService.isConnected) return null;
  try {
    const result = await postgresService.query(sql, params);
    return result || null;
  } catch (err: any) {
    console.warn(`[Neon ${label}]`, err.message);
    return null;
  }
};

// ============================================================
// Neon save helpers
// ============================================================
const saveUserToNeon = (u: any) =>
  neon(
    'User Save',
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, division, district, upazila, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (email) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       division = EXCLUDED.division,
       district = EXCLUDED.district,
       upazila = EXCLUDED.upazila,
       updated_at = NOW()`,
    [u.id, u.email, u.passwordHash, u.fullName, u.phone, u.role, u.division, u.district, u.upazila, u.isActive]
  );

const saveCampaignToNeon = (c: any) =>
  neon(
    'Campaign Save',
    `INSERT INTO campaigns (id, title, slug, category, short_description, full_description, target_amount, collected_amount, donor_count, featured_image_url, gallery_images, status, deadline, organizer_name, is_urgent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       category = EXCLUDED.category,
       short_description = EXCLUDED.short_description,
       full_description = EXCLUDED.full_description,
       target_amount = EXCLUDED.target_amount,
       collected_amount = EXCLUDED.collected_amount,
       donor_count = EXCLUDED.donor_count,
       featured_image_url = EXCLUDED.featured_image_url,
       status = EXCLUDED.status,
       deadline = EXCLUDED.deadline,
       organizer_name = EXCLUDED.organizer_name,
       is_urgent = EXCLUDED.is_urgent,
       updated_at = NOW()`,
    [
      c.id, c.title, c.slug, c.category, c.shortDescription, c.fullDescription,
      c.targetAmount, c.collectedAmount || 0, c.donorCount || 0, c.featuredImageUrl,
      JSON.stringify(c.galleryImages || []), c.status, c.deadline, c.organizerName, Boolean(c.isUrgent)
    ]
  );

const saveDonationToNeon = (d: any) =>
  neon(
    'Donation Save',
    `INSERT INTO donations (id, campaign_id, user_id, donor_name, donor_email, donor_phone, amount, is_anonymous, message, payment_gateway, payment_status, transaction_id, receipt_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO UPDATE SET payment_status = EXCLUDED.payment_status`,
    [
      d.id, d.campaignId, isUuid(d.userId) ? d.userId : null, d.donorName, d.donorEmail, d.donorPhone,
      d.amount, Boolean(d.isAnonymous), d.message || '', d.paymentGateway, d.paymentStatus,
      d.transactionId, d.receiptNumber
    ]
  );

const saveBloodDonorToNeon = (d: any) =>
  neon(
    'Blood Donor Save',
    `INSERT INTO blood_donors (id, user_id, full_name, blood_group, phone, email, division, district, upazila, address_area, gender, date_of_birth, last_donation_date, is_available, emergency_contact_preference, total_donation_count, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       blood_group = EXCLUDED.blood_group,
       phone = EXCLUDED.phone,
       email = EXCLUDED.email,
       division = EXCLUDED.division,
       district = EXCLUDED.district,
       upazila = EXCLUDED.upazila,
       address_area = EXCLUDED.address_area,
       gender = EXCLUDED.gender,
       date_of_birth = EXCLUDED.date_of_birth,
       last_donation_date = EXCLUDED.last_donation_date,
       is_available = EXCLUDED.is_available,
       emergency_contact_preference = EXCLUDED.emergency_contact_preference,
       total_donation_count = EXCLUDED.total_donation_count,
       status = EXCLUDED.status`,
    [
      d.id, isUuid(d.userId) ? d.userId : null, d.fullName, d.bloodGroup, d.phone, d.email || '',
      d.division, d.district, d.upazila || '', d.addressArea || d.district, d.gender || 'Male',
      d.dateOfBirth || '1998-01-01', d.lastDonationDate || null, d.isAvailable !== false,
      d.emergencyContactPreference || 'Call', d.totalDonationCount || 0, d.status || 'Active'
    ]
  );

const saveBloodRequestToNeon = (r: any) =>
  neon(
    'Blood Request Save',
    `INSERT INTO blood_requests (id, user_id, patient_name, blood_group, required_units, hospital_name, hospital_address, division, district, upazila, required_date, required_time, emergency_level, contact_person, contact_phone, patient_condition, additional_info, status, matched_donors_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     ON CONFLICT (id) DO UPDATE SET
       patient_name = EXCLUDED.patient_name,
       blood_group = EXCLUDED.blood_group,
       required_units = EXCLUDED.required_units,
       hospital_name = EXCLUDED.hospital_name,
       hospital_address = EXCLUDED.hospital_address,
       emergency_level = EXCLUDED.emergency_level,
       contact_person = EXCLUDED.contact_person,
       contact_phone = EXCLUDED.contact_phone,
       patient_condition = EXCLUDED.patient_condition,
       additional_info = EXCLUDED.additional_info,
       status = EXCLUDED.status,
       matched_donors_count = EXCLUDED.matched_donors_count`,
    [
      r.id, isUuid(r.userId) ? r.userId : null, r.patientName, r.bloodGroup, r.requiredUnits,
      r.hospitalName, r.hospitalAddress || r.hospitalName, r.division || 'Dhaka', r.district, r.upazila || '',
      r.requiredDate || 'Immediate', r.requiredTime || 'As soon as possible', r.emergencyLevel || 'Urgent',
      r.contactPerson || 'Family Member', r.contactPhone, r.patientCondition || 'Hospitalized emergency patient',
      r.additionalInfo || '', r.status || 'Searching', r.matchedDonorsCount || 0
    ]
  );

const saveVolunteerToNeon = (v: any) =>
  neon(
    'Volunteer Save',
    `INSERT INTO volunteers (id, user_id, full_name, email, phone, division, district, upazila, skills, availability, motivation, preferred_activities, status, assigned_tasks_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       skills = EXCLUDED.skills,
       availability = EXCLUDED.availability,
       motivation = EXCLUDED.motivation,
       preferred_activities = EXCLUDED.preferred_activities,
       status = EXCLUDED.status,
       assigned_tasks_count = EXCLUDED.assigned_tasks_count`,
    [
      v.id, isUuid(v.userId) ? v.userId : null, v.fullName, v.email, v.phone, v.division || 'Dhaka',
      v.district, v.upazila || '', JSON.stringify(v.skills || []), v.availability || 'Flexible',
      v.motivation || '', JSON.stringify(v.preferredActivities || []), v.status || 'Pending',
      v.assignedTasksCount || 0
    ]
  );

const saveBeneficiaryToNeon = (b: any) =>
  neon(
    'Beneficiary Save',
    `INSERT INTO beneficiaries (id, name, photo_url, location, category, story, support_required, support_received, campaign_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       photo_url = EXCLUDED.photo_url,
       location = EXCLUDED.location,
       category = EXCLUDED.category,
       story = EXCLUDED.story,
       support_required = EXCLUDED.support_required,
       support_received = EXCLUDED.support_received,
       status = EXCLUDED.status`,
    [
      b.id, b.name, b.photoUrl, b.location, b.category, b.story,
      Number(b.supportRequired || 0), Number(b.supportReceived || 0), b.campaignId || null, b.status || 'Active'
    ]
  );

const saveBlogToNeon = (p: any) =>
  neon(
    'Blog Save',
    `INSERT INTO blog_posts (id, title, slug, cover_image, content, excerpt, author, category, tags, published_date, status, read_time_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       cover_image = EXCLUDED.cover_image,
       content = EXCLUDED.content,
       excerpt = EXCLUDED.excerpt,
       author = EXCLUDED.author,
       category = EXCLUDED.category,
       tags = EXCLUDED.tags,
       status = EXCLUDED.status,
       read_time_minutes = EXCLUDED.read_time_minutes`,
    [
      p.id, p.title, p.slug, p.coverImage, p.content, p.excerpt || p.title, p.author || 'HopeCare Editorial',
      p.category || 'Updates', JSON.stringify(p.tags || []), p.publishedDate || toDateStr(new Date()),
      p.status || 'Published', Number(p.readTimeMinutes || 4)
    ]
  );

const saveGalleryToNeon = (g: any) =>
  neon(
    'Gallery Save',
    `INSERT INTO gallery_items (id, title, description, image_url, category, campaign_id, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       image_url = EXCLUDED.image_url,
       category = EXCLUDED.category`,
    [g.id, g.title, g.description || '', g.imageUrl, g.category || 'General', g.campaignId || null, g.date || toDateStr(new Date())]
  );

const saveContactToNeon = (m: any) =>
  neon(
    'Contact Save',
    `INSERT INTO contact_messages (id, name, email, phone, subject, message, is_read, reply_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [m.id, m.name, m.email, m.phone || '', m.subject, m.message, Boolean(m.isRead), m.replyStatus || 'Pending']
  );

// ============================================================
// Audit log helper
// ============================================================
const logAudit = (req: Request, action: string, entity: string, entityId: string | undefined, details: string) => {
  const admin = (req as any).user;
  const id = 'audit-' + crypto.randomUUID();
  const now = new Date().toISOString();
  const log: any = {
    id,
    adminId: admin?.id || 'system',
    adminName: admin?.fullName || 'System',
    action,
    entity,
    entityId,
    details,
    ipAddress: req.ip,
    timestamp: now,
    createdAt: now
  };
  dbStore.auditLogs.set(id, log);
  neon(
    'Audit Save',
    `INSERT INTO audit_logs (id, admin_id, admin_name, action, entity, entity_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, log.adminId, log.adminName, action, entity, entityId || null, details, req.ip || null]
  );
};

// ============================================================
// Authentication Middleware
// ============================================================
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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

    let user: any = dbStore.users.get(verified.userId);

    if (postgresService.isConnected && isUuid(verified.userId)) {
      const dbRes = await neon('Auth User Load', 'SELECT * FROM users WHERE id = $1', [verified.userId]);
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        user = rowToUser(dbRes.rows[0]);
        dbStore.users.set(user.id, user);
      }
    }

    if (!user || !user.isActive) {
      res.status(403).json({ error: 'Account suspended or not found' });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error('[Auth Error]', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
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

  for (const existing of dbStore.users.values()) {
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      return res.status(409).json({ error: 'Email is already registered' });
    }
  }

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

  const assignedRole: UserRole = ADMIN_EMAILS.includes(email.toLowerCase().trim()) ? 'ADMIN' : 'DONOR';
  const userId = crypto.randomUUID();
  const passwordHash = authService.hashPassword(password);
  const safeDivision = (division && division.trim()) || 'Dhaka';
  const safeDistrict = (district && district.trim()) || 'Dhaka';
  const safeUpazila = (upazila && upazila.trim()) || 'Sadar';

  const newUser = {
    id: userId,
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    role: assignedRole,
    division: safeDivision,
    district: safeDistrict,
    upazila: safeUpazila,
    isActive: true,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.users.set(userId, newUser);

  if (postgresService.isConnected) {
    await saveUserToNeon(newUser);
  }

  const token = authService.generateSessionToken(userId, assignedRole);
  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailLower = String(email).toLowerCase().trim();
  let matchedUser: any = null;

  if (postgresService.isConnected) {
    const dbRes = await neon('Login Search', 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [emailLower]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      matchedUser = rowToUser(dbRes.rows[0]);
      dbStore.users.set(matchedUser.id, matchedUser);
    }
  }

  if (!matchedUser) {
    for (const user of dbStore.users.values()) {
      if (user.email.toLowerCase() === emailLower) {
        matchedUser = user;
        break;
      }
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (matchedUser.isActive === false) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }

  const isValid = authService.verifyPassword(password, matchedUser.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (ADMIN_EMAILS.includes(emailLower) && matchedUser.role !== 'ADMIN') {
    matchedUser.role = 'ADMIN';
    dbStore.users.set(matchedUser.id, matchedUser);
    if (isUuid(matchedUser.id)) {
      await neon('Admin Promote', 'UPDATE users SET role=$1 WHERE id=$2', ['ADMIN', matchedUser.id]);
    }
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
  res.json({ message: `Password reset instructions dispatched to ${email || 'your email'}.` });
});

// ============================================================
// Campaigns API
// ============================================================
app.get('/api/campaigns', (req, res) => {
  const { category, status, search } = req.query;
  let list = Array.from(dbStore.campaigns.values());

  if (category && category !== 'All') list = list.filter(c => c.category === category);
  if (status && status !== 'All') list = list.filter(c => c.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(c => c.title.toLowerCase().includes(q) || c.shortDescription.toLowerCase().includes(q));
  }
  res.json(list);
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = dbStore.campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

app.post('/api/campaigns', authenticate, requireRole('ADMIN'), (req, res) => {
  const { title, category, shortDescription, fullDescription, targetAmount, featuredImageUrl, deadline, organizerName, isUrgent } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Title and category are required' });

  const id = crypto.randomUUID();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || id;

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
  saveCampaignToNeon(newCampaign);
  logAudit(req, 'CREATE_CAMPAIGN', 'campaign', id, `Created campaign "${title}"`);
  res.status(201).json(newCampaign);
});

app.put('/api/campaigns/:id', authenticate, requireRole('ADMIN'), (req, res) => {
  const campaign = dbStore.campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const { title, category, shortDescription, fullDescription, targetAmount, featuredImageUrl, status, deadline, organizerName, isUrgent } = req.body;
  if (title) campaign.title = title;
  if (category) campaign.category = category;
  if (shortDescription) campaign.shortDescription = shortDescription;
  if (fullDescription) campaign.fullDescription = fullDescription;
  if (targetAmount !== undefined) campaign.targetAmount = Number(targetAmount);
  if (featuredImageUrl) campaign.featuredImageUrl = featuredImageUrl;
  if (status) campaign.status = status;
  if (deadline) campaign.deadline = deadline;
  if (organizerName) campaign.organizerName = organizerName;
  if (isUrgent !== undefined) campaign.isUrgent = Boolean(isUrgent);
  campaign.updatedAt = new Date().toISOString();

  dbStore.campaigns.set(campaign.id, campaign);
  saveCampaignToNeon(campaign);
  logAudit(req, 'UPDATE_CAMPAIGN', 'campaign', campaign.id, `Updated campaign "${campaign.title}"`);
  res.json(campaign);
});

app.delete('/api/campaigns/:id', authenticate, requireRole('ADMIN'), (req, res) => {
  const campaign = dbStore.campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  dbStore.campaigns.delete(req.params.id);
  neon('Campaign Delete', 'DELETE FROM campaigns WHERE id=$1', [req.params.id]);
  logAudit(req, 'DELETE_CAMPAIGN', 'campaign', req.params.id, `Deleted campaign "${campaign.title}"`);
  res.json({ success: true, message: 'Campaign deleted successfully' });
});

// ============================================================
// Donations API
// ============================================================
app.post('/api/donations', async (req, res) => {
  try {
    const {
      campaignId, donorName, donorEmail, donorPhone, amount, isAnonymous,
      message, paymentGateway, userId, transactionId: submittedTxnId
    } = req.body;

    if (!campaignId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid campaign and donation amount required' });
    }
    if (Number(amount) < 50) {
      return res.status(400).json({ error: 'Minimum donation amount is ৳50' });
    }

    const campaign = dbStore.campaigns.get(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const gateway = paymentGateway || 'bKash';
    const isManual = gateway === 'bKash' || gateway === 'Nagad';
    const cleanTxn = String(submittedTxnId || '').trim();

    if (isManual) {
      if (!cleanTxn) return res.status(400).json({ error: `Please enter your ${gateway} Transaction ID` });
      if (!/^[A-Za-z0-9]{6,30}$/.test(cleanTxn)) {
        return res.status(400).json({ error: 'Transaction ID looks invalid. Use letters and numbers only.' });
      }

      let duplicate = false;
      for (const d of dbStore.donations.values()) {
        if (d.paymentGateway === gateway && String(d.transactionId).toLowerCase() === cleanTxn.toLowerCase()) {
          duplicate = true;
          break;
        }
      }
      if (!duplicate) {
        const dupRes = await neon(
          'Txn Duplicate Check',
          'SELECT id FROM donations WHERE LOWER(transaction_id) = LOWER($1) AND payment_gateway = $2',
          [cleanTxn, gateway]
        );
        duplicate = Boolean(dupRes && dupRes.rows && dupRes.rows.length > 0);
      }
      if (duplicate) {
        return res.status(409).json({ error: 'This Transaction ID has already been submitted.' });
      }
    }

    const donationId = crypto.randomUUID();
    const receiptNumber = 'REC-2026-' + Math.floor(10000 + Math.random() * 90000);

    const paymentResult = await paymentService.processDonationPayment(
      gateway,
      Number(amount),
      donationId,
      { donorName, donorEmail }
    );

    const needsApproval = isManual && !AUTO_APPROVE_DONATIONS;
    const paymentStatus = needsApproval ? 'Pending' : 'Successful';

    const donation: any = {
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
      paymentGateway: gateway,
      paymentStatus,
      transactionId: isManual ? cleanTxn : paymentResult.initResult.transactionId,
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    if (paymentStatus === 'Successful') {
      campaign.collectedAmount += Number(amount);
      campaign.donorCount += 1;
      campaign.updatedAt = new Date().toISOString();
      dbStore.campaigns.set(campaign.id, campaign);
    }

    dbStore.donations.set(donationId, donation);
    dbStore.paymentTransactions.set(paymentResult.paymentTx.id, paymentResult.paymentTx);

    saveCampaignToNeon(campaign).then(() => saveDonationToNeon(donation));

    const notifId = 'notif-' + Date.now();
    dbStore.notifications.set(notifId, {
      id: notifId,
      userId: userId || undefined,
      type: 'donation_success',
      title: needsApproval ? `Donation Submitted: ৳${Number(amount).toLocaleString()}` : `Donation Received: ৳${Number(amount).toLocaleString()}`,
      message: `Thank you for supporting "${campaign.title}". Receipt #${receiptNumber}.`,
      isRead: false,
      linkUrl: '/dashboard/donations',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, pendingApproval: needsApproval, donation, paymentResult });
  } catch (error: any) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Failed to process donation payment' });
  }
});

app.get('/api/donations', (req, res) => {
  const { userId, campaignId } = req.query;
  let list = Array.from(dbStore.donations.values());
  if (userId) list = list.filter(d => d.userId === userId);
  if (campaignId) list = list.filter(d => d.campaignId === campaignId);
  res.json(list.reverse());
});

app.get('/api/admin/donations', authenticate, requireRole('ADMIN'), (req, res) => {
  const { status } = req.query;
  let list = Array.from(dbStore.donations.values());
  if (status && status !== 'All') list = list.filter(d => d.paymentStatus === status);
  res.json(list.reverse());
});

app.patch('/api/admin/donations/:id/status', authenticate, requireRole('ADMIN'), (req, res) => {
  const donation: any = dbStore.donations.get(req.params.id);
  if (!donation) return res.status(404).json({ error: 'Donation not found' });

  const { status } = req.body;
  if (!['Pending', 'Successful', 'Failed', 'Refunded'].includes(status)) {
    return res.status(400).json({ error: 'Invalid donation status' });
  }

  const wasCounted = donation.paymentStatus === 'Successful';
  const willCount = status === 'Successful';

  const campaign = dbStore.campaigns.get(donation.campaignId);
  if (campaign) {
    if (!wasCounted && willCount) {
      campaign.collectedAmount += donation.amount;
      campaign.donorCount += 1;
    } else if (wasCounted && !willCount) {
      campaign.collectedAmount = Math.max(0, campaign.collectedAmount - donation.amount);
      campaign.donorCount = Math.max(0, campaign.donorCount - 1);
    }
    campaign.updatedAt = new Date().toISOString();
    dbStore.campaigns.set(campaign.id, campaign);
  }

  donation.paymentStatus = status;
  dbStore.donations.set(donation.id, donation);

  if (campaign) {
    saveCampaignToNeon(campaign).then(() => saveDonationToNeon(donation));
  } else {
    saveDonationToNeon(donation);
  }

  res.json(donation);
});

// ============================================================
// Blood Donors API
// ============================================================
app.get('/api/blood-donors', (req, res) => {
  const { bloodGroup, division, district, upazila, availableOnly } = req.query;
  let list = Array.from(dbStore.bloodDonors.values());

  if (bloodGroup && bloodGroup !== 'All') list = list.filter(d => d.bloodGroup === bloodGroup);
  if (division && division !== 'All') list = list.filter(d => d.division.toLowerCase() === String(division).toLowerCase());
  if (district && district !== 'All') list = list.filter(d => d.district.toLowerCase() === String(district).toLowerCase());
  if (upazila && upazila !== 'All') list = list.filter(d => d.upazila.toLowerCase() === String(upazila).toLowerCase());
  if (availableOnly === 'true') list = list.filter(d => d.isAvailable);

  const safeDonors = list.map(d => ({
    ...d,
    phone: d.phone.substring(0, 7) + 'XXXX'
  }));

  res.json(safeDonors);
});

app.post('/api/blood-donors', (req, res) => {
  const { fullName, bloodGroup, phone, email, division, district, upazila, addressArea, gender, dateOfBirth, lastDonationDate, emergencyContactPreference, userId } = req.body;
  if (!fullName || !bloodGroup || !phone || !district) {
    return res.status(400).json({ error: 'Full name, blood group, phone, and district are mandatory' });
  }

  const id = crypto.randomUUID();
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
  saveBloodDonorToNeon(donor);
  res.status(201).json(donor);
});

app.patch('/api/blood-donors/:id', (req, res) => {
  const donor = dbStore.bloodDonors.get(req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  const updated = { ...donor, ...req.body };
  dbStore.bloodDonors.set(donor.id, updated);
  saveBloodDonorToNeon(updated);
  res.json(updated);
});

app.delete('/api/blood-donors/:id', authenticate, requireRole('ADMIN'), (req, res) => {
  const donor = dbStore.bloodDonors.get(req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  dbStore.bloodDonors.delete(req.params.id);
  neon('Blood Donor Delete', 'DELETE FROM blood_donors WHERE id=$1', [req.params.id]);
  res.json({ success: true, message: 'Blood donor deleted' });
});

// ============================================================
// Blood Requests API
// ============================================================
app.get('/api/blood-requests', (req, res) => {
  const { bloodGroup, district, emergencyLevel, status } = req.query;
  let list = Array.from(dbStore.bloodRequests.values());

  if (bloodGroup && bloodGroup !== 'All') list = list.filter(r => r.bloodGroup === bloodGroup);
  if (district && district !== 'All') list = list.filter(r => r.district.toLowerCase() === String(district).toLowerCase());
  if (emergencyLevel && emergencyLevel !== 'All') list = list.filter(r => r.emergencyLevel === emergencyLevel);
  if (status && status !== 'All') list = list.filter(r => r.status === status);

  res.json(list.reverse());
});

app.post('/api/blood-requests', (req, res) => {
  const { patientName, bloodGroup, requiredUnits, hospitalName, hospitalAddress, division, district, upazila, requiredDate, requiredTime, emergencyLevel, contactPerson, contactPhone, patientCondition, additionalInfo, userId } = req.body;
  if (!patientName || !bloodGroup || !hospitalName || !district || !contactPhone) {
    return res.status(400).json({ error: 'Patient, blood group, hospital, district, and contact phone are required' });
  }

  const id = crypto.randomUUID();
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

  const allDonors = Array.from(dbStore.bloodDonors.values());
  const matches = bloodMatchingService.findMatches(newRequest, allDonors);
  newRequest.matchedDonorsCount = matches.length;

  dbStore.bloodRequests.set(id, newRequest);
  saveBloodRequestToNeon(newRequest);

  res.status(201).json({ request: newRequest, matchedDonors: matches.slice(0, 5) });
});

app.patch('/api/blood-requests/:id/status', (req, res) => {
  const request = dbStore.bloodRequests.get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Blood request not found' });
  const { status } = req.body;
  request.status = status;
  dbStore.bloodRequests.set(request.id, request);
  neon('Blood Request Status', 'UPDATE blood_requests SET status=$1 WHERE id=$2', [status, request.id]);
  res.json(request);
});

// ============================================================
// Volunteers, Beneficiaries, Blog, Gallery, Contact API
// ============================================================
app.get('/api/volunteers', (req, res) => res.json(Array.from(dbStore.volunteers.values())));
app.post('/api/volunteers', (req, res) => {
  const { fullName, email, phone, division, district, upazila, skills, availability, motivation, preferredActivities, userId } = req.body;
  if (!fullName || !email || !phone || !district) return res.status(400).json({ error: 'Required fields missing' });

  const id = crypto.randomUUID();
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
  saveVolunteerToNeon(vol);
  res.status(201).json(vol);
});

app.get('/api/beneficiaries', (req, res) => res.json(Array.from(dbStore.beneficiaries.values())));
app.get('/api/blog', (req, res) => res.json(Array.from(dbStore.blogPosts.values())));
app.get('/api/gallery', (req, res) => res.json(Array.from(dbStore.galleryItems.values())));

app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required' });

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
  saveContactToNeon(item);
  res.status(201).json({ success: true, message: 'Message received.' });
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
// AI Assistant API
// ============================================================
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const answer = await aiService.askAssistant(message || '', {
      campaigns: Array.from(dbStore.campaigns.values()),
      bloodDonors: Array.from(dbStore.bloodDonors.values()),
      bloodRequests: Array.from(dbStore.bloodRequests.values())
    });
    res.json({ reply: answer });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Assistant temporarily unavailable' });
  }
});

// ============================================================
// Neon Database Initialization
// ============================================================
async function initNeon() {
  if (process.env.DATABASE_URL && !postgresService.isConnected) {
    try {
      const result = await postgresService.connect(process.env.DATABASE_URL.trim());
      console.log('[Neon Postgres] Auto-connect:', result.success ? 'connected' : result.message);
    } catch (err: any) {
      console.warn('[Neon Postgres] Auto-connect failed:', err.message);
    }
  }
}

// Connect Neon in background
initNeon();

// ============================================================
// Standalone Server (Local Development Only)
// Vercel-এ app.listen() কল করা যাবে না
// ============================================================
if (!process.env.VERCEL) {
  import('vite').then(({ createServer: createViteServer }) => {
    if (process.env.NODE_ENV !== 'production') {
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then((vite) => {
        app.use(vite.middlewares);
        app.listen(PORT, 'localhost', () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      });
    } else {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
      app.listen(PORT, 'localhost', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  });
}

export default app;