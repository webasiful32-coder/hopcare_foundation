import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
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
// Config & Default Admin Setup
// asifulcse22@gmail.com সর্বদা ADMIN প্রিভিলেজ পাবে
// ============================================================
const DEFAULT_ADMIN_EMAILS = [
  'asifulcse22@gmail.com',
  'admin@hopecare.org'
];

const ENV_ADMINS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAILS = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...ENV_ADMINS]));

const AUTO_APPROVE_DONATIONS = process.env.AUTO_APPROVE_DONATIONS === 'true';
const VALID_ROLES = ['DONOR', 'VOLUNTEER', 'ADMIN'] as UserRole[];

// ------------------------------------------------------------
// Serverless (Vercel) support
// ------------------------------------------------------------
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const SYNC_TTL_MS = 2000;
const SKIP_SYNC_PREFIXES = ['/health', '/notifications', '/ai', '/chat'];

app.use('/api', async (req, res, next) => {
  try {
    await initOnce();
    if (IS_SERVERLESS && !SKIP_SYNC_PREFIXES.some((p) => req.path.startsWith(p))) {
      await refreshFromNeon(req.method !== 'GET');
    }
  } catch (err: any) {
    console.warn('[Init Error]', err.message);
  }
  next();
});

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
  role: (ADMIN_EMAILS.includes(String(row.email).toLowerCase().trim()) ? 'ADMIN' : (row.role || 'DONOR')) as UserRole,
  division: row.division,
  district: row.district,
  upazila: row.upazila,
  avatarUrl: row.avatar_url || undefined,
  isActive: row.is_active !== false,
  passwordHash: row.password_hash,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

/**
 * Robust Neon query helper with auto-connect ensure
 */
const neon = async (label: string, sql: string, params: any[] = []): Promise<any | null> => {
  if (!postgresService.isConnected && process.env.DATABASE_URL) {
    try {
      await postgresService.connect(process.env.DATABASE_URL.trim());
    } catch (e: any) {
      console.warn(`[Neon ${label} Connect Retry Failed]:`, e.message);
    }
  }

  if (!postgresService.isConnected) return null;
  try {
    const result = await postgresService.query(sql, params);
    return result || null;
  } catch (err: any) {
    console.error(`[Neon ${label} SQL Error]:`, err.message);
    return null;
  }
};

// ============================================================
// Neon save helpers
// ============================================================
const saveUserToNeon = async (u: any) => {
  return neon(
    'User Save',
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, division, district, upazila, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (email) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       role = EXCLUDED.role,
       division = EXCLUDED.division,
       district = EXCLUDED.district,
       upazila = EXCLUDED.upazila,
       updated_at = NOW()`,
    [u.id, u.email, u.passwordHash, u.fullName, u.phone, u.role, u.division, u.district, u.upazila, u.isActive]
  );
};

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
  return neon(
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
      if (dbRes && dbRes.rows) {
        if (dbRes.rows.length > 0) {
          user = rowToUser(dbRes.rows[0]);
          dbStore.users.set(user.id, user);
        }
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
app.get('/api/health/db-status', async (req, res) => {
  res.json(postgresService.getStatus());
});

// ============================================================
// Auth Routes (১০০% ডাটাবেজ সেভ ও অটো অ্যাডমিন রোল নিশ্চিত)
// ============================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    await initOnce();

    const { fullName, email, phone, password, division, district, upazila } = req.body;
    if (!fullName || !email || !phone || !password || !district) {
      return res.status(400).json({ error: 'All registration fields are required' });
    }

    const emailLower = String(email).toLowerCase().trim();

    // Check existing in Neon PostgreSQL
    if (postgresService.isConnected) {
      const checkRes = await neon('Check Email Duplicate', 'SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [emailLower]);
      if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
        return res.status(409).json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' });
      }
    }

    // Role Assignment: asifulcse22@gmail.com বা ADMIN_EMAILS এ থাকলে সাথে সাথে ADMIN
    const assignedRole: UserRole = ADMIN_EMAILS.includes(emailLower) ? 'ADMIN' : 'DONOR';

    const userId = crypto.randomUUID();
    const passwordHash = authService.hashPassword(password);
    const safeDivision = (division && division.trim()) || 'Dhaka';
    const safeDistrict = (district && district.trim()) || 'Dhaka';
    const safeUpazila = (upazila && upazila.trim()) || 'Sadar';

    const newUser = {
      id: userId,
      fullName: fullName.trim(),
      email: emailLower,
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

    // Neon PostgreSQL-এ বাধ্যতামূলক সেভ করা
    if (postgresService.isConnected) {
      const saveResult = await saveUserToNeon(newUser);
      if (saveResult) {
        console.log(`[Neon Postgres] Saved user to Neon DB: ${newUser.email} (Role: ${assignedRole})`);
      } else {
        console.error('[Neon Postgres Error] Failed to persist user to Neon DB.');
      }
    } else {
      console.warn('[Neon Notice] Neon is not connected. User saved in memory only.');
    }

    const token = authService.generateSessionToken(userId, assignedRole);
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await initOnce();

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailLower = String(email).toLowerCase().trim();
    let matchedUser: any = null;

    // 1. Neon DB থেকে তাজা ডাটা রিড করা
    if (postgresService.isConnected) {
      const dbRes = await neon('Login Search', 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [emailLower]);
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        matchedUser = rowToUser(dbRes.rows[0]);
        dbStore.users.set(matchedUser.id, matchedUser);
      }
    }

    // 2. মেমরি ব্যাকআপ
    if (!matchedUser) {
      for (const user of dbStore.users.values()) {
        if (user.email.toLowerCase() === emailLower) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
    }

    if (matchedUser.isActive === false) {
      return res.status(403).json({ error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে।' });
    }

    const isValid = authService.verifyPassword(password, matchedUser.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
    }

    // যদি ব্যবহারকারীর ইমেইল ADMIN_EMAILS এ থাকে, রোল আপডেট করে দেওয়া
    if (ADMIN_EMAILS.includes(emailLower) && matchedUser.role !== 'ADMIN') {
      matchedUser.role = 'ADMIN';
      dbStore.users.set(matchedUser.id, matchedUser);
      if (isUuid(matchedUser.id)) {
        await neon('Admin Promote', 'UPDATE users SET role=$1 WHERE id=$2', ['ADMIN', matchedUser.id]);
      }
    }

    console.log(`[Login Success] ${emailLower} -> Role: ${matchedUser.role}`);

    const token = authService.generateSessionToken(matchedUser.id, matchedUser.role);
    const { passwordHash: _, ...safeUser } = matchedUser;
    res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('[Login Catch Error]:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  res.json({ message: `Password reset instructions dispatched to ${email || 'your email'}.` });
});

// ============================================================
// Campaigns API
// ============================================================
app.get('/api/campaigns', async (req, res) => {
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

app.get('/api/campaigns/:id', async (req, res) => {
  const campaign = dbStore.campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

app.post('/api/campaigns', authenticate, requireRole('ADMIN'), async (req, res) => {
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
  await saveCampaignToNeon(newCampaign);
  await logAudit(req, 'CREATE_CAMPAIGN', 'campaign', id, `Created campaign "${title}"`);
  res.status(201).json(newCampaign);
});

app.put('/api/campaigns/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
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
  await saveCampaignToNeon(campaign);
  await logAudit(req, 'UPDATE_CAMPAIGN', 'campaign', campaign.id, `Updated campaign "${campaign.title}"`);
  res.json(campaign);
});

app.delete('/api/campaigns/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const campaign = dbStore.campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  dbStore.campaigns.delete(req.params.id);
  await neon('Campaign Delete', 'DELETE FROM campaigns WHERE id=$1', [req.params.id]);
  await logAudit(req, 'DELETE_CAMPAIGN', 'campaign', req.params.id, `Deleted campaign "${campaign.title}"`);
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

    await saveCampaignToNeon(campaign);
    await saveDonationToNeon(donation);

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

app.get('/api/donations', async (req, res) => {
  const { userId, campaignId } = req.query;
  let list = Array.from(dbStore.donations.values());
  if (userId) list = list.filter(d => d.userId === userId);
  if (campaignId) list = list.filter(d => d.campaignId === campaignId);
  res.json(list.reverse());
});

app.get('/api/admin/donations', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { status } = req.query;
  let list = Array.from(dbStore.donations.values());
  if (status && status !== 'All') list = list.filter(d => d.paymentStatus === status);
  res.json(list.reverse());
});

app.patch('/api/admin/donations/:id/status', authenticate, requireRole('ADMIN'), async (req, res) => {
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
    await saveCampaignToNeon(campaign);
    await saveDonationToNeon(donation);
  } else {
    await saveDonationToNeon(donation);
  }

  res.json(donation);
});

// ============================================================
// Blood Donors & Blood Requests API
// ============================================================
app.get('/api/blood-donors', async (req, res) => {
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

app.post('/api/blood-donors', async (req, res) => {
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
  await saveBloodDonorToNeon(donor);
  res.status(201).json(donor);
});

app.get('/api/blood-requests', async (req, res) => {
  const { bloodGroup, district, emergencyLevel, status } = req.query;
  let list = Array.from(dbStore.bloodRequests.values());

  if (bloodGroup && bloodGroup !== 'All') list = list.filter(r => r.bloodGroup === bloodGroup);
  if (district && district !== 'All') list = list.filter(r => r.district.toLowerCase() === String(district).toLowerCase());
  if (emergencyLevel && emergencyLevel !== 'All') list = list.filter(r => r.emergencyLevel === emergencyLevel);
  if (status && status !== 'All') list = list.filter(r => r.status === status);

  res.json(list.reverse());
});

app.post('/api/blood-requests', async (req, res) => {
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
  await saveBloodRequestToNeon(newRequest);

  res.status(201).json({ request: newRequest, matchedDonors: matches.slice(0, 5) });
});

// ============================================================
// Volunteers, Beneficiaries, Blog, Gallery, Contact, Notifications API
// ============================================================
app.get('/api/volunteers', async (req, res) => res.json(Array.from(dbStore.volunteers.values())));
app.get('/api/beneficiaries', async (req, res) => res.json(Array.from(dbStore.beneficiaries.values())));
app.get('/api/blog', async (req, res) => res.json(Array.from(dbStore.blogPosts.values())));
app.get('/api/gallery', async (req, res) => res.json(Array.from(dbStore.galleryItems.values())));

app.get('/api/notifications', async (req, res) => {
  res.json(Array.from(dbStore.notifications.values()).reverse());
});

app.patch('/api/notifications/read-all', async (req, res) => {
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
// Admin Metrics & Reports API
// ============================================================
app.get('/api/admin/metrics', authenticate, requireRole('ADMIN'), async (req, res) => {
  const totalUsers = dbStore.users.size;
  const totalBloodDonors = dbStore.bloodDonors.size;
  const totalVolunteers = dbStore.volunteers.size;
  const totalCampaigns = dbStore.campaigns.size;

  let totalDonationsAmount = 0;
  let pendingDonations = 0;
  for (const d of dbStore.donations.values()) {
    if (d.paymentStatus === 'Successful') {
      totalDonationsAmount += d.amount;
    } else if (d.paymentStatus === 'Pending') {
      pendingDonations += 1;
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
    pendingDonations,
    activeBloodRequests,
    criticalRequests,
    pendingVolunteers
  });
});

app.get('/api/admin/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  if (postgresService.isConnected) {
    try {
      const dbRes = await postgresService.query(
        'SELECT id, full_name as "fullName", email, phone, role, division, district, upazila, avatar_url as "avatarUrl", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt" FROM users ORDER BY created_at DESC'
      );
      if (dbRes && dbRes.rows) {
        return res.json(dbRes.rows);
      }
    } catch (err: any) {
      console.warn('[Postgres Users Query Error]:', err.message);
    }
  }

  const usersList = Array.from(dbStore.users.values()).map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });
  res.json(usersList);
});

// ============================================================
// Load saved data from Neon into memory on server start
// ============================================================
async function loadFromNeon(label: string, sql: string, target: Map<string, any>, mapper: (row: any) => any) {
  const res = await neon(`Load ${label}`, sql);
  if (res && res.rows && res.rows.length > 0) {
    target.clear();
    for (const row of res.rows) {
      const item = mapper(row);
      target.set(item.id, item);
    }
    console.log(`[Neon Postgres] Loaded ${res.rows.length} ${label} from Neon.`);
  }
}

async function syncFromNeon() {
  if (!postgresService.isConnected) return;

  const usersRes = await neon('Load users', 'SELECT * FROM users');
  if (usersRes && usersRes.rows && usersRes.rows.length > 0) {
    for (const row of usersRes.rows) {
      dbStore.users.set(row.id, rowToUser(row));
    }
    console.log(`[Neon Postgres] Initialized ${usersRes.rows.length} users from Neon.`);
  }

  await loadFromNeon('campaigns', 'SELECT * FROM campaigns ORDER BY created_at', dbStore.campaigns, (r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    category: r.category,
    shortDescription: r.short_description,
    fullDescription: r.full_description,
    targetAmount: Number(r.target_amount),
    collectedAmount: Number(r.collected_amount || 0),
    donorCount: Number(r.donor_count || 0),
    featuredImageUrl: r.featured_image_url,
    galleryImages: Array.isArray(r.gallery_images) ? r.gallery_images : [],
    status: r.status,
    deadline: toDateStr(r.deadline),
    organizerName: r.organizer_name,
    beneficiarySummary: r.beneficiary_summary || undefined,
    isUrgent: Boolean(r.is_urgent),
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at)
  }));
}

// ============================================================
// Startup / refresh logic
// ============================================================
let initPromise: Promise<void> | null = null;

function initOnce(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (process.env.DATABASE_URL && !postgresService.isConnected) {
        try {
          const result = await postgresService.connect(process.env.DATABASE_URL.trim());
          console.log('[Neon Postgres] Auto-connect:', result.success ? 'connected' : result.message);
        } catch (err: any) {
          console.warn('[Neon Postgres] Auto-connect failed:', err.message);
        }
      }
      await refreshFromNeon(true);
    })();
  }
  return initPromise;
}

let lastSyncAt = 0;
let syncInFlight: Promise<void> | null = null;

function refreshFromNeon(force = false): Promise<void> {
  if (!postgresService.isConnected) return Promise.resolve();
  if (syncInFlight) return syncInFlight;
  if (!force && Date.now() - lastSyncAt < SYNC_TTL_MS) return Promise.resolve();

  syncInFlight = (async () => {
    try {
      await syncFromNeon();
      lastSyncAt = Date.now();
    } catch (err: any) {
      console.warn('[Neon Refresh Error]', err.message);
    } finally {
      syncInFlight = null;
    }
  })();
  return syncInFlight;
}

// ============================================================
// Standalone Server (Local Development Only)
// ============================================================
async function startServer() {
  await initOnce();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', async (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, 'localhost', () => {
    console.log(`HopeCare Foundation Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;

if (!process.env.VERCEL) {
  startServer();
}