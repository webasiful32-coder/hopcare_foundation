import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { dbStore } from './server/db/store.js';
import { postgresService } from './server/db/postgres.js';
import { authService } from './server/services/authService.js';
import { paymentService } from './server/services/paymentService.js';
import { bloodMatchingService } from './server/services/bloodMatchingService.js';
import { aiService } from './server/services/aiService.js';
import { UserRole } from './src/types/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// [CHANGED] base64 image upload-er jonno limit 10mb
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// ১. CORS & Mobile Preflight
// ============================================================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// ============================================================
// ২. প্রাথমিক সুপার অ্যাডমিন তালিকা (mdarfanahmed97@gmail.com প্রধান)
// ============================================================
const DEFAULT_ADMIN_EMAILS = [
  'mdarfanahmed97@gmail.com',
  'asifulcse@gmail.com',
  'asifulcse22@gmail.com',
  'admin@hopecare.org'
];

const ENV_ADMINS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAILS = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...ENV_ADMINS]));

const isUserAdminEmail = (email: string): boolean => {
  const e = String(email || '').toLowerCase().trim();
  return ADMIN_EMAILS.includes(e);
};

const AUTO_APPROVE_DONATIONS = process.env.AUTO_APPROVE_DONATIONS === 'true';

// ------------------------------------------------------------
// ৩. Vercel Serverless রিকানেকশন হ্যান্ডলার
// ------------------------------------------------------------
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const SYNC_TTL_MS = 2000;
const SKIP_SYNC_PREFIXES = ['/health', '/notifications', '/ai', '/chat'];

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    try {
      await initOnce();
      if (IS_SERVERLESS && !SKIP_SYNC_PREFIXES.some((p) => req.path.startsWith(p))) {
        await refreshFromNeon(req.method !== 'GET');
      }
    } catch (err: any) {
      console.warn('[Init Error]', err.message);
    }
  }
  next();
});

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

// ইউজার অবজেক্ট তৈরি: যদি ডাটাবেজে রোল ADMIN থাকে অথবা তালিকায় থাকে, তবে ADMIN
const rowToUser = (row: any) => {
  const emailLower = String(row.email || '').toLowerCase().trim();
  const isDbAdmin = String(row.role || '').toUpperCase().trim() === 'ADMIN';
  const assignedRole: UserRole = (isUserAdminEmail(emailLower) || isDbAdmin) ? 'ADMIN' : (row.role || 'DONOR');

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: assignedRole,
    division: row.division,
    district: row.district,
    upazila: row.upazila,
    avatarUrl: row.avatar_url || undefined,
    isActive: row.is_active !== false,
    passwordHash: row.password_hash,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
};

/**
 * Robust Neon Query Helper
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

// ============================================================
// [NEW] Neon persistence layer: Campaign, Blood, Volunteer,
// Beneficiary, Blog, Gallery, Contact, Audit
// (memory Map <-> Neon table mapping)
// ============================================================
const slugify = (s: string): string =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
const num = (v: any, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const todayStr = (): string => new Date().toISOString().split('T')[0];
const dateOnly = (v: any, fallback: string): string => {
  const s = toDateStr(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fallback;
};
const dateOrNull = (v: any): string | null => {
  const s = toDateStr(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};
const arr = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);

// Neon connected thakle save fail hole false, na hole (memory mode) true
const ok = async (p: Promise<any>): Promise<boolean> => {
  const r = await p;
  return !postgresService.isConnected || r !== null;
};

const delFromNeon = (table: string, id: string) =>
  neon(`Delete ${table}`, `DELETE FROM ${table} WHERE id = $1`, [id]);

// ---------- Campaigns ----------
const saveCampaignToNeon = (c: any) =>
  neon(
    'Campaign Save',
    `INSERT INTO campaigns (id, title, slug, category, short_description, full_description, target_amount, collected_amount, donor_count, featured_image_url, status, deadline, organizer_name, is_urgent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
      c.id,
      c.title || 'Untitled',
      c.slug || `${slugify(c.title)}-${String(c.id).slice(0, 6)}`,
      c.category || 'Medical Support',
      c.shortDescription || String(c.fullDescription || '').substring(0, 120) || '-',
      c.fullDescription || '-',
      num(c.targetAmount),
      num(c.collectedAmount),
      num(c.donorCount),
      c.featuredImageUrl || '',
      c.status || 'Active',
      dateOnly(c.deadline, '2026-12-31'),
      c.organizerName || 'HopeCare Foundation',
      Boolean(c.isUrgent)
    ]
  );

const rowToCampaign = (r: any) => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  category: r.category,
  shortDescription: r.short_description,
  fullDescription: r.full_description,
  targetAmount: num(r.target_amount),
  collectedAmount: num(r.collected_amount),
  donorCount: num(r.donor_count),
  featuredImageUrl: r.featured_image_url,
  status: r.status,
  deadline: toDateStr(r.deadline),
  organizerName: r.organizer_name,
  isUrgent: r.is_urgent === true,
  createdAt: toIso(r.created_at),
  updatedAt: toIso(r.updated_at)
});

// ---------- Blood Requests ----------
const saveBloodRequestToNeon = (r: any) =>
  neon(
    'Blood Request Save',
    `INSERT INTO blood_requests (id, patient_name, blood_group, required_units, hospital_name, hospital_address, division, district, upazila, emergency_level, contact_person, contact_phone, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO UPDATE SET
       patient_name = EXCLUDED.patient_name,
       blood_group = EXCLUDED.blood_group,
       required_units = EXCLUDED.required_units,
       hospital_name = EXCLUDED.hospital_name,
       hospital_address = EXCLUDED.hospital_address,
       division = EXCLUDED.division,
       district = EXCLUDED.district,
       upazila = EXCLUDED.upazila,
       emergency_level = EXCLUDED.emergency_level,
       contact_person = EXCLUDED.contact_person,
       contact_phone = EXCLUDED.contact_phone,
       status = EXCLUDED.status`,
    [
      r.id,
      r.patientName || 'Unknown',
      r.bloodGroup || 'A+',
      num(r.requiredUnits, 1),
      r.hospitalName || '-',
      r.hospitalAddress || r.hospitalName || '-',
      r.division || 'Dhaka',
      r.district || 'Dhaka',
      r.upazila || 'Sadar',
      r.emergencyLevel || 'Urgent',
      r.contactPerson || 'Hospital Attendant',
      r.contactPhone || '-',
      r.status || 'Searching'
    ]
  );

const rowToBloodRequest = (r: any) => ({
  id: r.id,
  patientName: r.patient_name,
  bloodGroup: r.blood_group,
  requiredUnits: num(r.required_units, 1),
  hospitalName: r.hospital_name,
  hospitalAddress: r.hospital_address,
  division: r.division,
  district: r.district,
  upazila: r.upazila,
  emergencyLevel: r.emergency_level,
  contactPerson: r.contact_person,
  contactPhone: r.contact_phone,
  status: r.status,
  createdAt: toIso(r.created_at)
});

// ---------- Blood Donors ----------
const saveBloodDonorToNeon = (d: any) =>
  neon(
    'Blood Donor Save',
    `INSERT INTO blood_donors (id, user_id, full_name, blood_group, phone, email, division, district, upazila, address_area, gender, date_of_birth, last_donation_date, is_available, emergency_contact_preference, total_donation_count, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
      d.id,
      d.userId || null,
      d.fullName || 'Unknown',
      d.bloodGroup || 'A+',
      d.phone || '-',
      d.email || null,
      d.division || 'Dhaka',
      d.district || 'Dhaka',
      d.upazila || null,
      d.addressArea || null,
      d.gender || 'Male',
      dateOrNull(d.dateOfBirth),
      dateOrNull(d.lastDonationDate),
      d.isAvailable !== false,
      d.emergencyContactPreference || 'Call',
      num(d.totalDonationCount, 1),
      d.status || 'Active'
    ]
  );

const rowToBloodDonor = (r: any) => ({
  id: r.id,
  userId: r.user_id || undefined,
  fullName: r.full_name,
  bloodGroup: r.blood_group,
  phone: r.phone,
  email: r.email || '',
  division: r.division,
  district: r.district,
  upazila: r.upazila || '',
  addressArea: r.address_area || '',
  gender: r.gender,
  dateOfBirth: toDateStr(r.date_of_birth),
  lastDonationDate: toDateStr(r.last_donation_date),
  isAvailable: r.is_available !== false,
  emergencyContactPreference: r.emergency_contact_preference,
  totalDonationCount: num(r.total_donation_count, 1),
  status: r.status,
  createdAt: toIso(r.created_at)
});

// ---------- Volunteers ----------
const saveVolunteerToNeon = (v: any) =>
  neon(
    'Volunteer Save',
    `INSERT INTO volunteers (id, user_id, full_name, email, phone, division, district, upazila, skills, availability, motivation, preferred_activities, status, assigned_tasks_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       division = EXCLUDED.division,
       district = EXCLUDED.district,
       upazila = EXCLUDED.upazila,
       skills = EXCLUDED.skills,
       availability = EXCLUDED.availability,
       motivation = EXCLUDED.motivation,
       preferred_activities = EXCLUDED.preferred_activities,
       status = EXCLUDED.status,
       assigned_tasks_count = EXCLUDED.assigned_tasks_count`,
    [
      v.id,
      v.userId || null,
      v.fullName || 'Unknown',
      v.email || '-',
      v.phone || '-',
      v.division || 'Dhaka',
      v.district || 'Dhaka',
      v.upazila || null,
      arr(v.skills),
      v.availability || null,
      v.motivation || '',
      arr(v.preferredActivities),
      v.status || 'Pending',
      num(v.assignedTasksCount)
    ]
  );

const rowToVolunteer = (r: any) => ({
  id: r.id,
  userId: r.user_id || undefined,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  division: r.division,
  district: r.district,
  upazila: r.upazila || '',
  skills: r.skills || [],
  availability: r.availability || '',
  motivation: r.motivation || '',
  preferredActivities: r.preferred_activities || [],
  status: r.status,
  assignedTasksCount: num(r.assigned_tasks_count),
  createdAt: toIso(r.created_at)
});

// ---------- Beneficiaries ----------
// Dashboard field-gulo (category, supportRequired, photoUrl) ar types field-gulo
// (assistanceType, grantAmount, imageUrl) dutoi support kore
const saveBeneficiaryToNeon = (b: any) =>
  neon(
    'Beneficiary Save',
    `INSERT INTO beneficiaries (id, name, age, location, story, assistance_type, grant_amount, date_assisted, image_url, verification_doc_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       age = EXCLUDED.age,
       location = EXCLUDED.location,
       story = EXCLUDED.story,
       assistance_type = EXCLUDED.assistance_type,
       grant_amount = EXCLUDED.grant_amount,
       date_assisted = EXCLUDED.date_assisted,
       image_url = EXCLUDED.image_url,
       verification_doc_id = EXCLUDED.verification_doc_id`,
    [
      b.id,
      b.name || 'Unknown',
      b.age !== undefined && b.age !== null && b.age !== '' ? num(b.age) : null,
      b.location || 'Dhaka',
      b.story || '-',
      b.assistanceType || b.category || 'Other',
      num(b.grantAmount ?? b.supportRequired),
      dateOnly(b.dateAssisted, todayStr()),
      b.imageUrl || b.photoUrl || '',
      b.verificationDocId || null
    ]
  );

const rowToBeneficiary = (r: any) => ({
  id: r.id,
  name: r.name,
  age: r.age ?? undefined,
  location: r.location,
  story: r.story,
  assistanceType: r.assistance_type,
  category: r.assistance_type,
  grantAmount: num(r.grant_amount),
  supportRequired: num(r.grant_amount),
  dateAssisted: toDateStr(r.date_assisted),
  imageUrl: r.image_url,
  photoUrl: r.image_url,
  verificationDocId: r.verification_doc_id || undefined
});

// ---------- Blog ----------
const saveBlogToNeon = (p: any) =>
  neon(
    'Blog Save',
    `INSERT INTO blog_posts (id, title, slug, summary, content, author, read_time, publish_date, cover_image, category)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       content = EXCLUDED.content,
       author = EXCLUDED.author,
       read_time = EXCLUDED.read_time,
       publish_date = EXCLUDED.publish_date,
       cover_image = EXCLUDED.cover_image,
       category = EXCLUDED.category`,
    [
      p.id,
      p.title || 'Untitled',
      p.slug || `${slugify(p.title)}-${String(p.id).slice(0, 6)}`,
      p.summary || p.excerpt || String(p.content || '').substring(0, 120) || '-',
      p.content || '-',
      p.author || 'HopeCare Team',
      p.readTime || `${Math.max(1, Math.ceil(String(p.content || '').split(/\s+/).length / 200))} min read`,
      dateOnly(p.publishDate || p.publishedDate, todayStr()),
      p.coverImage || '',
      p.category || 'Updates'
    ]
  );

const rowToBlog = (r: any) => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  summary: r.summary,
  excerpt: r.summary,
  content: r.content,
  author: r.author,
  readTime: r.read_time,
  publishDate: toDateStr(r.publish_date),
  publishedDate: toDateStr(r.publish_date),
  coverImage: r.cover_image,
  category: r.category
});

// ---------- Gallery ----------
const saveGalleryToNeon = (g: any) =>
  neon(
    'Gallery Save',
    `INSERT INTO gallery_items (id, title, category, image_url, date, location, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       category = EXCLUDED.category,
       image_url = EXCLUDED.image_url,
       date = EXCLUDED.date,
       location = EXCLUDED.location,
       description = EXCLUDED.description`,
    [
      g.id,
      g.title || 'Untitled',
      g.category || 'Health Camp',
      g.imageUrl || '',
      dateOrNull(g.date) || todayStr(),
      g.location || null,
      g.description || ''
    ]
  );

const rowToGallery = (r: any) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  imageUrl: r.image_url,
  date: toDateStr(r.date),
  location: r.location || '',
  description: r.description || ''
});

// ---------- Contact messages ----------
const saveContactToNeon = (c: any) =>
  neon(
    'Contact Save',
    `INSERT INTO contact_messages (id, name, email, message, created_at)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO NOTHING`,
    [c.id, c.name, c.email, c.message, c.createdAt || new Date().toISOString()]
  );

const rowToContact = (r: any) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  message: r.message,
  createdAt: toIso(r.created_at)
});

// ---------- Audit logs ----------
const saveAuditToNeon = (l: any) =>
  neon(
    'Audit Save',
    `INSERT INTO audit_logs (id, admin_id, admin_name, action, entity, details, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO NOTHING`,
    [l.id, l.adminId || null, l.adminName || null, l.action, l.entity || null, l.details || '', l.timestamp]
  );

const rowToAudit = (r: any) => ({
  id: r.id,
  adminId: r.admin_id || 'system',
  adminName: r.admin_name || 'System',
  action: r.action,
  entity: r.entity || '',
  details: r.details || '',
  timestamp: toIso(r.created_at)
});

// Audit log helper (memory + Neon, fire-and-forget)
const logAudit = (admin: any, action: string, details: string) => {
  const log: any = {
    id: crypto.randomUUID(),
    adminId: admin?.id || 'system',
    adminName: admin?.fullName || 'Admin',
    action,
    entity: action.split('_')[0],
    details,
    timestamp: new Date().toISOString()
  };
  dbStore.auditLogs.set(log.id, log);
  void saveAuditToNeon(log);
};

// ============================================================
// ৪. Authentication Middleware
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

    if (isUuid(verified.userId)) {
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
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Access denied: You do not have permission to access Admin resources' });
      return;
    }
    next();
  };
};

// ============================================================
// ৫. রেজিস্ট্রেশন এবং লগইন হ্যান্ডলার
// ============================================================
const handleRegister = async (req: Request, res: Response) => {
  try {
    await initOnce();

    const { fullName, email, phone, password, division, district, upazila } = req.body;
    if (!fullName || !email || !phone || !password || !district) {
      return res.status(400).json({ error: 'সকল তথ্য পূরণ করা আবশ্যক' });
    }

    const emailLower = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();

    // Check duplicate
    const checkRes = await neon(
      'Check Duplicate',
      'SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
      [emailLower]
    );
    if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
      return res.status(409).json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' });
    }

    // রেজিস্ট্রেশনের সময় সাধারণ ইউজাররা DONOR হবে, শুধু অনুমোদিত ইমেইল হলে ADMIN
    const assignedRole: UserRole = isUserAdminEmail(emailLower) ? 'ADMIN' : 'DONOR';
    const userId = crypto.randomUUID();
    const passwordHash = authService.hashPassword(cleanPassword);

    const newUser = {
      id: userId,
      fullName: fullName.trim(),
      email: emailLower,
      phone: phone.trim(),
      role: assignedRole,
      division: division || 'Dhaka',
      district: district || 'Dhaka',
      upazila: upazila || 'Sadar',
      isActive: true,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbStore.users.set(userId, newUser);
    await saveUserToNeon(newUser);

    const token = authService.generateSessionToken(userId, assignedRole);
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
};

const handleLogin = async (req: Request, res: Response) => {
  try {
    await initOnce();

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'ইমেইল এবং পাসওয়ার্ড আবশ্যক' });
    }

    const emailLower = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();
    let matchedUser: any = null;

    // ১. Neon DB থেকে রিড করা
    const dbRes = await neon(
      'Login Search',
      'SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
      [emailLower]
    );
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      matchedUser = rowToUser(dbRes.rows[0]);
      dbStore.users.set(matchedUser.id, matchedUser);
    }

    // ২. মেমরি ব্যাকআপ
    if (!matchedUser) {
      for (const user of dbStore.users.values()) {
        if (user.email.toLowerCase().trim() === emailLower) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
    }

    if (matchedUser.isActive === false) {
      return res.status(403).json({ error: 'আপনার অ্যাকাউন্টটি স্থগিত (Block/Suspended) করা হয়েছে।' });
    }

    // ৩. পাসওয়ার্ড ভেরিফিকেশন
    const sha256Hex = crypto.createHash('sha256').update(cleanPassword).digest('hex');
    let isValid = false;

    try {
      isValid = authService.verifyPassword(cleanPassword, matchedUser.passwordHash);
    } catch {
      isValid = false;
    }

    if (!isValid && matchedUser.passwordHash) {
      if (
        matchedUser.passwordHash === sha256Hex ||
        matchedUser.passwordHash.toLowerCase() === sha256Hex.toLowerCase() ||
        matchedUser.passwordHash === cleanPassword
      ) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
    }

    // mdarfanahmed97@gmail.com হলে রোলে ADMIN নিশ্চিত করা
    if (isUserAdminEmail(emailLower) && matchedUser.role !== 'ADMIN') {
      matchedUser.role = 'ADMIN';
      dbStore.users.set(matchedUser.id, matchedUser);
      if (isUuid(matchedUser.id)) {
        await neon('Admin Promote', 'UPDATE users SET role=$1 WHERE id=$2', ['ADMIN', matchedUser.id]);
      }
    }

    const token = authService.generateSessionToken(matchedUser.id, matchedUser.role);
    const { passwordHash: _, ...safeUser } = matchedUser;
    res.json({ token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
};

app.post(['/api/auth/register', '/auth/register'], handleRegister);
app.post(['/api/auth/login', '/auth/login'], handleLogin);

app.get(['/api/auth/me', '/auth/me'], authenticate, async (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ============================================================
// ৬. সম্পূর্ণ ADMIN USER MANAGEMENT CRUD (অন্য কাউকে ADMIN বানানো সহ)
// ============================================================

// ১. সমস্ত ইউজারের তালিকা দেখা
app.get(['/api/admin/users', '/admin/users'], authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const dbRes = await neon(
      'Admin Users Query',
      'SELECT id, full_name as "fullName", email, phone, role, division, district, upazila, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt" FROM users ORDER BY created_at DESC'
    );
    if (dbRes && dbRes.rows) {
      return res.json(dbRes.rows);
    }
  } catch (err: any) {
    console.warn('[Postgres Users Query Error]:', err.message);
  }

  const usersList = Array.from(dbStore.users.values()).map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });
  res.json(usersList);
});

// ২. যে কাউকে ADMIN বানানো বা রোল পরিবর্তন করা (PROMOTE TO ADMIN)
app.patch(['/api/admin/users/:id/role', '/admin/users/:id/role'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles: UserRole[] = ['ADMIN', 'DONOR', 'VOLUNTEER'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'সঠিক রোল নির্বাচন করুন (ADMIN, DONOR, VOLUNTEER)' });
  }

  try {
    // Neon ডাটাবেজে রোল আপডেট করা
    await neon('Update User Role', 'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);

    // মেমরিতে আপডেট
    const u = dbStore.users.get(id);
    if (u) {
      u.role = role;
      dbStore.users.set(id, u);
      // যদি অ্যাডমিন বানানো হয়, তবে অ্যাডমিন তালিকায় যুক্ত করা
      if (role === 'ADMIN' && u.email && !ADMIN_EMAILS.includes(u.email.toLowerCase().trim())) {
        ADMIN_EMAILS.push(u.email.toLowerCase().trim());
      }
    }

    logAudit((req as any).user, 'ROLE_CHANGED', `User ${id} -> ${role}`);
    res.json({ success: true, message: `ব্যবহারকারীকে সফলভাবে ${role} রোল প্রদান করা হয়েছে` });
  } catch (err: any) {
    res.status(500).json({ error: 'রোল পরিবর্তন ব্যর্থ হয়েছে' });
  }
});

// ৩. ইউজার ব্লক / আনব্লক করা (Block / Unblock User)
app.patch(['/api/admin/users/:id/status', '/admin/users/:id/status'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    await neon('Update User Status', 'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [Boolean(isActive), id]);
    
    const u = dbStore.users.get(id);
    if (u) {
      u.isActive = Boolean(isActive);
      dbStore.users.set(id, u);
    }

    res.json({ success: true, message: `ইউজার স্ট্যাটাস পরিবর্তন হয়েছে` });
  } catch (err: any) {
    res.status(500).json({ error: 'ইউজার স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে' });
  }
});

// ৩.১ Dashboard "toggle-status" button (Active <-> Suspended)
app.patch(['/api/admin/users/:id/toggle-status', '/admin/users/:id/toggle-status'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    let u: any = dbStore.users.get(id);
    if (!u) {
      const dbRes = await neon('Toggle Load', 'SELECT * FROM users WHERE id = $1', [id]);
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        u = rowToUser(dbRes.rows[0]);
        dbStore.users.set(id, u);
      }
    }
    if (!u) return res.status(404).json({ error: 'User not found' });

    const next = !(u.isActive !== false);
    await neon('Toggle User Status', 'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [next, id]);
    u.isActive = next;
    dbStore.users.set(id, u);

    logAudit((req as any).user, 'USER_STATUS', `${u.email} -> ${next ? 'Active' : 'Suspended'}`);
    res.json({ success: true, isActive: next });
  } catch {
    res.status(500).json({ error: 'Status change failed' });
  }
});

// ৪. ইউজার ডিলিট করা (Delete User)
app.delete(['/api/admin/users/:id', '/admin/users/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;

  if ((req as any).user?.id === id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    await neon('Delete User', 'DELETE FROM users WHERE id = $1', [id]);
    dbStore.users.delete(id);
    logAudit((req as any).user, 'USER_DELETED', `User ${id} deleted`);
    res.json({ success: true, message: 'ইউজার ডাটাবেজ থেকে মুছে ফেলা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ error: 'ইউজার ডিলিট করা সম্ভব হয়নি' });
  }
});

// ৫. অ্যাডমিন ড্যাশবোর্ড পরিসংখ্যান
app.get(['/api/admin/metrics', '/admin/metrics'], authenticate, requireRole('ADMIN'), async (req, res) => {
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

  let activeBloodRequests = 0;
  let criticalRequests = 0;
  for (const r of dbStore.bloodRequests.values() as Iterable<any>) {
    if (r.status === 'Searching' || r.status === 'Donor Found') {
      activeBloodRequests += 1;
      if (r.emergencyLevel === 'Critical') criticalRequests += 1;
    }
  }
  let pendingVolunteers = 0;
  for (const v of dbStore.volunteers.values() as Iterable<any>) {
    if (v.status === 'Pending') pendingVolunteers += 1;
  }

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

// ============================================================
// ৭. CAMPAIGNS, DONATIONS & BLOOD APIS
// ============================================================
app.get(['/api/campaigns', '/campaigns'], async (req, res) => {
  res.json(Array.from(dbStore.campaigns.values()));
});

// Campaign তৈরি (শুধু ADMIN) — Neon-e save hoy
app.post(['/api/campaigns', '/campaigns'], authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const {
      title,
      category,
      shortDescription,
      fullDescription,
      targetAmount,
      featuredImageUrl,
      deadline,
      isUrgent
    } = req.body;

    if (!title || !fullDescription || !Number(targetAmount)) {
      return res.status(400).json({ error: 'Title, description এবং target amount আবশ্যক' });
    }

    const admin = (req as any).user;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const campaign: any = {
      id,
      title: String(title).trim(),
      slug: `${slugify(title)}-${id.slice(0, 6)}`,
      category: category || 'Medical Support',
      shortDescription: shortDescription || String(fullDescription).substring(0, 120),
      fullDescription,
      targetAmount: Number(targetAmount),
      collectedAmount: 0,
      donorCount: 0,
      featuredImageUrl: featuredImageUrl || '',
      deadline: deadline || '2026-12-31',
      isUrgent: Boolean(isUrgent),
      status: 'Active',
      organizerName: admin.fullName || 'HopeCare Foundation',
      createdAt: now,
      updatedAt: now
    };

    if (!(await ok(saveCampaignToNeon(campaign)))) {
      return res.status(500).json({ error: 'Failed to save campaign to database' });
    }
    dbStore.campaigns.set(id, campaign);
    logAudit(admin, 'CAMPAIGN_CREATED', campaign.title);
    res.status(201).json(campaign);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create campaign' });
  }
});

// Campaign আপডেট
app.put(['/api/campaigns/:id', '/campaigns/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const existing: any = dbStore.campaigns.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });

    const b = req.body;
    const updated: any = {
      ...existing,
      title: b.title ?? existing.title,
      category: b.category ?? existing.category,
      shortDescription: b.shortDescription ?? existing.shortDescription,
      fullDescription: b.fullDescription ?? existing.fullDescription,
      targetAmount: b.targetAmount !== undefined ? Number(b.targetAmount) : existing.targetAmount,
      featuredImageUrl: b.featuredImageUrl || existing.featuredImageUrl,
      deadline: b.deadline ?? existing.deadline,
      isUrgent: b.isUrgent !== undefined ? Boolean(b.isUrgent) : existing.isUrgent,
      updatedAt: new Date().toISOString()
    };
    updated.status = updated.collectedAmount >= updated.targetAmount ? 'Completed' : 'Active';

    if (!(await ok(saveCampaignToNeon(updated)))) {
      return res.status(500).json({ error: 'Failed to update campaign in database' });
    }
    dbStore.campaigns.set(req.params.id, updated);
    logAudit((req as any).user, 'CAMPAIGN_UPDATED', updated.title);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update campaign' });
  }
});

// Campaign ডিলিট
app.delete(['/api/campaigns/:id', '/campaigns/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const existing: any = dbStore.campaigns.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  if (!(await ok(delFromNeon('campaigns', req.params.id)))) {
    return res.status(500).json({ error: 'Failed to delete campaign from database' });
  }
  dbStore.campaigns.delete(req.params.id);
  logAudit((req as any).user, 'CAMPAIGN_DELETED', existing.title);
  res.json({ success: true });
});

app.post(['/api/donations', '/donations'], async (req, res) => {
  try {
    const { campaignId, donorName, donorEmail, donorPhone, amount, isAnonymous, message, paymentGateway, userId, transactionId } = req.body;
    const donationId = crypto.randomUUID();
    const receiptNumber = 'REC-2026-' + Math.floor(10000 + Math.random() * 90000);

    const donation: any = {
      id: donationId,
      campaignId,
      donorName: isAnonymous ? 'Anonymous Donor' : (donorName || 'Kind Supporter'),
      donorEmail: donorEmail || 'donor@hopecare.org',
      donorPhone: donorPhone || '',
      amount: Number(amount),
      isAnonymous: Boolean(isAnonymous),
      message: message || '',
      paymentGateway: paymentGateway || 'bKash',
      paymentStatus: 'Pending',
      transactionId: transactionId || '',
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    dbStore.donations.set(donationId, donation);
    res.status(201).json({ success: true, donation });
  } catch {
    res.status(500).json({ error: 'Donation failed' });
  }
});

// ------------------------- Blood donors -------------------------
app.get(['/api/blood-donors', '/blood-donors'], async (req, res) => {
  res.json(Array.from(dbStore.bloodDonors.values()));
});

// Public blood donor registration
app.post(['/api/blood-donors', '/blood-donors'], async (req, res) => {
  try {
    const b = req.body;
    if (!b.fullName || !b.bloodGroup || !b.phone) {
      return res.status(400).json({ error: 'Name, blood group এবং phone আবশ্যক' });
    }
    const donor: any = {
      id: crypto.randomUUID(),
      userId: b.userId || undefined,
      fullName: String(b.fullName).trim(),
      bloodGroup: b.bloodGroup,
      phone: String(b.phone).trim(),
      email: b.email || '',
      division: b.division || 'Dhaka',
      district: b.district || 'Dhaka',
      upazila: b.upazila || '',
      addressArea: b.addressArea || '',
      gender: b.gender || 'Male',
      dateOfBirth: b.dateOfBirth || '',
      lastDonationDate: b.lastDonationDate || '',
      isAvailable: b.isAvailable !== false,
      emergencyContactPreference: b.emergencyContactPreference || 'Call',
      totalDonationCount: num(b.totalDonationCount, 1),
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    if (!(await ok(saveBloodDonorToNeon(donor)))) {
      return res.status(500).json({ error: 'Failed to save donor to database' });
    }
    dbStore.bloodDonors.set(donor.id, donor);
    res.status(201).json(donor);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register donor' });
  }
});

app.delete(['/api/blood-donors/:id', '/blood-donors/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  if (!dbStore.bloodDonors.has(req.params.id)) {
    return res.status(404).json({ error: 'Donor not found' });
  }
  if (!(await ok(delFromNeon('blood_donors', req.params.id)))) {
    return res.status(500).json({ error: 'Failed to delete donor from database' });
  }
  dbStore.bloodDonors.delete(req.params.id);
  logAudit((req as any).user, 'BLOODDONOR_DELETED', req.params.id);
  res.json({ success: true });
});

// ------------------------- Blood requests -------------------------
app.get(['/api/blood-requests', '/blood-requests'], async (req, res) => {
  res.json(Array.from(dbStore.bloodRequests.values()).reverse());
});

app.post(['/api/blood-requests', '/blood-requests'], authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const b = req.body;
    if (!b.patientName || !b.hospitalName || !b.contactPhone) {
      return res.status(400).json({ error: 'Patient, hospital এবং phone আবশ্যক' });
    }
    const id = crypto.randomUUID();
    const reqObj: any = {
      id,
      patientName: b.patientName,
      bloodGroup: b.bloodGroup || 'A+',
      requiredUnits: Number(b.requiredUnits) || 1,
      hospitalName: b.hospitalName,
      hospitalAddress: b.hospitalAddress || b.hospitalName,
      division: b.division || 'Dhaka',
      district: b.district || 'Dhaka',
      upazila: b.upazila || 'Sadar',
      emergencyLevel: b.emergencyLevel || 'Urgent',
      contactPerson: b.contactPerson || 'Hospital Attendant',
      contactPhone: b.contactPhone,
      status: 'Searching',
      createdAt: new Date().toISOString()
    };
    if (!(await ok(saveBloodRequestToNeon(reqObj)))) {
      return res.status(500).json({ error: 'Failed to save blood request to database' });
    }
    dbStore.bloodRequests.set(id, reqObj);
    logAudit((req as any).user, 'BLOODREQUEST_CREATED', `${reqObj.patientName} (${reqObj.bloodGroup})`);
    res.status(201).json(reqObj);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create blood request' });
  }
});

app.patch(['/api/blood-requests/:id/status', '/blood-requests/:id/status'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const r: any = dbStore.bloodRequests.get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  const valid = ['Searching', 'Donor Found', 'Fulfilled', 'Cancelled'];
  if (!valid.includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const updated = { ...r, status: req.body.status };
  if (!(await ok(saveBloodRequestToNeon(updated)))) {
    return res.status(500).json({ error: 'Failed to update request in database' });
  }
  dbStore.bloodRequests.set(req.params.id, updated);
  logAudit((req as any).user, 'BLOODREQUEST_STATUS', `${r.patientName} -> ${updated.status}`);
  res.json(updated);
});

app.delete(['/api/blood-requests/:id', '/blood-requests/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  if (!dbStore.bloodRequests.has(req.params.id)) {
    return res.status(404).json({ error: 'Request not found' });
  }
  if (!(await ok(delFromNeon('blood_requests', req.params.id)))) {
    return res.status(500).json({ error: 'Failed to delete request from database' });
  }
  dbStore.bloodRequests.delete(req.params.id);
  logAudit((req as any).user, 'BLOODREQUEST_DELETED', req.params.id);
  res.json({ success: true });
});

app.get(['/api/notifications', '/notifications'], async (req, res) => {
  res.json(Array.from(dbStore.notifications.values()).reverse());
});

// ============================================================
// ৭.১ VOLUNTEERS
// ============================================================
app.get(['/api/volunteers', '/volunteers'], async (req, res) => {
  res.json(Array.from(dbStore.volunteers.values()).reverse());
});

// Public volunteer application
app.post(['/api/volunteers', '/volunteers'], async (req, res) => {
  try {
    const b = req.body;
    if (!b.fullName || !b.email || !b.phone) {
      return res.status(400).json({ error: 'Name, email এবং phone আবশ্যক' });
    }
    const v: any = {
      id: crypto.randomUUID(),
      userId: b.userId || undefined,
      fullName: String(b.fullName).trim(),
      email: String(b.email).trim(),
      phone: String(b.phone).trim(),
      division: b.division || 'Dhaka',
      district: b.district || 'Dhaka',
      upazila: b.upazila || '',
      skills: arr(b.skills),
      availability: b.availability || '',
      motivation: b.motivation || '',
      preferredActivities: arr(b.preferredActivities),
      status: 'Pending',
      assignedTasksCount: 0,
      createdAt: new Date().toISOString()
    };
    if (!(await ok(saveVolunteerToNeon(v)))) {
      return res.status(500).json({ error: 'Failed to save application to database' });
    }
    dbStore.volunteers.set(v.id, v);
    res.status(201).json(v);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit application' });
  }
});

app.patch(['/api/volunteers/:id/status', '/volunteers/:id/status'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const v: any = dbStore.volunteers.get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Volunteer not found' });
  if (!['Approved', 'Rejected', 'Pending'].includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const updated = { ...v, status: req.body.status };
  if (!(await ok(saveVolunteerToNeon(updated)))) {
    return res.status(500).json({ error: 'Failed to update volunteer in database' });
  }
  dbStore.volunteers.set(req.params.id, updated);
  logAudit((req as any).user, 'VOLUNTEER_STATUS', `${v.fullName} -> ${updated.status}`);
  res.json(updated);
});

app.delete(['/api/volunteers/:id', '/volunteers/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  if (!dbStore.volunteers.has(req.params.id)) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }
  if (!(await ok(delFromNeon('volunteers', req.params.id)))) {
    return res.status(500).json({ error: 'Failed to delete volunteer from database' });
  }
  dbStore.volunteers.delete(req.params.id);
  logAudit((req as any).user, 'VOLUNTEER_DELETED', req.params.id);
  res.json({ success: true });
});

// ============================================================
// ৭.২ BENEFICIARIES
// ============================================================
app.get(['/api/beneficiaries', '/beneficiaries'], async (req, res) => {
  res.json(Array.from(dbStore.beneficiaries.values()).reverse());
});

app.post(['/api/beneficiaries', '/beneficiaries'], authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.story) {
      return res.status(400).json({ error: 'Name এবং story আবশ্যক' });
    }
    const item: any = {
      id: crypto.randomUUID(),
      name: b.name,
      location: b.location || 'Dhaka',
      story: b.story,
      assistanceType: b.category || 'Other',
      category: b.category || 'Other',
      grantAmount: Number(b.supportRequired) || 0,
      supportRequired: Number(b.supportRequired) || 0,
      dateAssisted: todayStr(),
      imageUrl: b.photoUrl || '',
      photoUrl: b.photoUrl || ''
    };
    if (!(await ok(saveBeneficiaryToNeon(item)))) {
      return res.status(500).json({ error: 'Failed to save beneficiary to database' });
    }
    dbStore.beneficiaries.set(item.id, item);
    logAudit((req as any).user, 'BENEFICIARY_CREATED', item.name);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create beneficiary' });
  }
});

app.delete(['/api/beneficiaries/:id', '/beneficiaries/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  if (!dbStore.beneficiaries.has(req.params.id)) {
    return res.status(404).json({ error: 'Beneficiary not found' });
  }
  if (!(await ok(delFromNeon('beneficiaries', req.params.id)))) {
    return res.status(500).json({ error: 'Failed to delete beneficiary from database' });
  }
  dbStore.beneficiaries.delete(req.params.id);
  logAudit((req as any).user, 'BENEFICIARY_DELETED', req.params.id);
  res.json({ success: true });
});

// ============================================================
// ৭.৩ BLOG
// ============================================================
app.get(['/api/blog', '/blog'], async (req, res) => {
  res.json(Array.from(dbStore.blogPosts.values()).reverse());
});

app.post(['/api/blog', '/blog'], authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const b = req.body;
    if (!b.title || !b.content) {
      return res.status(400).json({ error: 'Title এবং content আবশ্যক' });
    }
    const id = crypto.randomUUID();
    const post: any = {
      id,
      title: b.title,
      slug: `${slugify(b.title)}-${id.slice(0, 6)}`,
      summary: String(b.content).substring(0, 120),
      excerpt: String(b.content).substring(0, 120),
      content: b.content,
      category: b.category || 'Updates',
      coverImage: b.coverImage || '',
      author: (req as any).user.fullName || 'HopeCare Team',
      readTime: `${Math.max(1, Math.ceil(String(b.content).split(/\s+/).length / 200))} min read`,
      publishDate: todayStr(),
      publishedDate: todayStr()
    };
    if (!(await ok(saveBlogToNeon(post)))) {
      return res.status(500).json({ error: 'Failed to save article to database' });
    }
    dbStore.blogPosts.set(id, post);
    logAudit((req as any).user, 'BLOG_PUBLISHED', post.title);
    res.status(201).json(post);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to publish article' });
  }
});

app.delete(['/api/blog/:id', '/blog/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  if (!dbStore.blogPosts.has(req.params.id)) {
    return res.status(404).json({ error: 'Article not found' });
  }
  if (!(await ok(delFromNeon('blog_posts', req.params.id)))) {
    return res.status(500).json({ error: 'Failed to delete article from database' });
  }
  dbStore.blogPosts.delete(req.params.id);
  logAudit((req as any).user, 'BLOG_DELETED', req.params.id);
  res.json({ success: true });
});

// ============================================================
// ৭.৪ GALLERY
// ============================================================
app.get(['/api/gallery', '/gallery'], async (req, res) => {
  res.json(Array.from(dbStore.galleryItems.values()).reverse());
});

app.post(['/api/gallery', '/gallery'], authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const b = req.body;
    if (!b.title || !b.imageUrl) {
      return res.status(400).json({ error: 'Title এবং image আবশ্যক' });
    }
    const item: any = {
      id: crypto.randomUUID(),
      title: b.title,
      imageUrl: b.imageUrl,
      category: b.category || 'Health Camp',
      description: b.description || '',
      date: todayStr(),
      location: ''
    };
    if (!(await ok(saveGalleryToNeon(item)))) {
      return res.status(500).json({ error: 'Failed to save photo to database' });
    }
    dbStore.galleryItems.set(item.id, item);
    logAudit((req as any).user, 'GALLERY_PHOTO_ADDED', item.title);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add photo' });
  }
});

app.delete(['/api/gallery/:id', '/gallery/:id'], authenticate, requireRole('ADMIN'), async (req, res) => {
  if (!dbStore.galleryItems.has(req.params.id)) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  if (!(await ok(delFromNeon('gallery_items', req.params.id)))) {
    return res.status(500).json({ error: 'Failed to delete photo from database' });
  }
  dbStore.galleryItems.delete(req.params.id);
  logAudit((req as any).user, 'GALLERY_PHOTO_DELETED', req.params.id);
  res.json({ success: true });
});

// ============================================================
// ৭.৫ CONTACT & AUDIT LOGS
// ============================================================
app.post(['/api/contact', '/contact'], async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'সকল তথ্য পূরণ করুন' });
  }
  const c: any = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString()
  };
  if (!(await ok(saveContactToNeon(c)))) {
    return res.status(500).json({ error: 'Failed to save message' });
  }
  dbStore.contactMessages.set(c.id, c);
  res.status(201).json({ success: true });
});

app.get(['/api/contact', '/contact'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const list = Array.from(dbStore.contactMessages.values()) as any[];
  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(list);
});

app.get(['/api/admin/audit-logs', '/admin/audit-logs'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const logs = Array.from(dbStore.auditLogs.values()) as any[];
  logs.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  res.json(logs.slice(0, 200));
});

// ============================================================
// ৭.৬ ADMIN: CLEAR / SEED DATA
// ============================================================
const NEON_DATA_TABLES = [
  'campaigns', 'donations', 'blood_requests', 'blood_donors', 'volunteers',
  'beneficiaries', 'blog_posts', 'gallery_items', 'contact_messages'
];

app.post(['/api/admin/clear-data', '/admin/clear-data'], authenticate, requireRole('ADMIN'), async (req, res) => {
  dbStore.clearAllRecords();
  for (const t of NEON_DATA_TABLES) {
    await neon(`Clear ${t}`, `DELETE FROM ${t}`);
  }
  logAudit((req as any).user, 'DATA_CLEARED', 'All records cleared (users kept)');
  res.json({ success: true });
});

app.post(['/api/admin/seed-data', '/admin/seed-data'], authenticate, requireRole('ADMIN'), async (req, res) => {
  dbStore.seedSampleRecords();
  // sample data-o Neon-e save kori, jate restart-er por haray na
  for (const c of dbStore.campaigns.values() as Iterable<any>) await saveCampaignToNeon(c);
  for (const d of dbStore.bloodDonors.values() as Iterable<any>) await saveBloodDonorToNeon(d);
  for (const r of dbStore.bloodRequests.values() as Iterable<any>) await saveBloodRequestToNeon(r);
  for (const b of dbStore.beneficiaries.values() as Iterable<any>) await saveBeneficiaryToNeon(b);
  for (const p of dbStore.blogPosts.values() as Iterable<any>) await saveBlogToNeon(p);
  for (const g of dbStore.galleryItems.values() as Iterable<any>) await saveGalleryToNeon(g);
  for (const v of dbStore.volunteers.values() as Iterable<any>) await saveVolunteerToNeon(v);
  logAudit((req as any).user, 'DATA_SEEDED', 'Sample data loaded');
  res.json({ success: true });
});

// ============================================================
// ৭.৭ NEON DATABASE MANAGEMENT (Admin Dashboard "Neon Database" tab)
// ============================================================
app.get(['/api/health/db-status', '/health/db-status'], async (req, res) => {
  res.json(postgresService.getStatus());
});

app.get(['/api/admin/database/table-counts', '/admin/database/table-counts'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const counts = await postgresService.getTableCounts();
  res.json({ counts });
});

app.get(['/api/admin/database/sql-script', '/admin/database/sql-script'], authenticate, requireRole('ADMIN'), async (req, res) => {
  res.json({ sql: postgresService.getNeonSqlScript() });
});

app.post(['/api/admin/database/connect', '/admin/database/connect'], authenticate, requireRole('ADMIN'), async (req, res) => {
  const connectionString = String(req.body?.connectionString || '').trim();
  if (!connectionString) {
    return res.status(400).json({ success: false, message: 'Connection string required' });
  }
  const result = await postgresService.connect(connectionString);
  if (!result.success) {
    return res.status(400).json(result);
  }
  logAudit((req as any).user, 'DB_CONNECTED', 'Neon database connected');
  res.json(result);
});

app.post(['/api/admin/database/sync-all', '/admin/database/sync-all'], authenticate, requireRole('ADMIN'), async (req, res) => {
  if (!postgresService.isConnected) {
    return res.status(400).json({ error: 'Database not connected' });
  }
  let synced = 0;
  const run = async (p: Promise<any>) => {
    if ((await p) !== null) synced += 1;
  };
  for (const u of dbStore.users.values() as Iterable<any>) await run(saveUserToNeon(u));
  for (const c of dbStore.campaigns.values() as Iterable<any>) await run(saveCampaignToNeon(c));
  for (const d of dbStore.bloodDonors.values() as Iterable<any>) await run(saveBloodDonorToNeon(d));
  for (const r of dbStore.bloodRequests.values() as Iterable<any>) await run(saveBloodRequestToNeon(r));
  for (const v of dbStore.volunteers.values() as Iterable<any>) await run(saveVolunteerToNeon(v));
  for (const b of dbStore.beneficiaries.values() as Iterable<any>) await run(saveBeneficiaryToNeon(b));
  for (const p of dbStore.blogPosts.values() as Iterable<any>) await run(saveBlogToNeon(p));
  for (const g of dbStore.galleryItems.values() as Iterable<any>) await run(saveGalleryToNeon(g));
  for (const m of dbStore.contactMessages.values() as Iterable<any>) await run(saveContactToNeon(m));
  logAudit((req as any).user, 'DB_SYNC', `${synced} records synced`);
  res.json({ success: true, message: `${synced} records synced to Neon.` });
});

// ============================================================
// ৮. ডাটাবেজ সিঙ্ক ও সার্ভার স্টার্ট
// ============================================================
// [NEW] Neon table theke memory Map-e load (query fail hole memory ager moto thake)
async function loadTable(label: string, sql: string, map: Map<string, any>, mapper: (row: any) => any) {
  const r = await neon(label, sql);
  if (!r || !r.rows) return;
  map.clear();
  for (const row of r.rows) {
    map.set(row.id, mapper(row));
  }
}

async function syncFromNeon() {
  const usersRes = await neon('Load users', 'SELECT * FROM users');
  if (usersRes && usersRes.rows && usersRes.rows.length > 0) {
    for (const row of usersRes.rows) {
      dbStore.users.set(row.id, rowToUser(row));
    }
  }

  if (!postgresService.isConnected) return;

  await loadTable('Load campaigns', 'SELECT * FROM campaigns ORDER BY created_at ASC', dbStore.campaigns as any, rowToCampaign);
  await loadTable('Load blood donors', 'SELECT * FROM blood_donors ORDER BY created_at ASC', dbStore.bloodDonors as any, rowToBloodDonor);
  await loadTable('Load blood requests', 'SELECT * FROM blood_requests ORDER BY created_at ASC', dbStore.bloodRequests as any, rowToBloodRequest);
  await loadTable('Load volunteers', 'SELECT * FROM volunteers ORDER BY created_at ASC', dbStore.volunteers as any, rowToVolunteer);
  await loadTable('Load beneficiaries', 'SELECT * FROM beneficiaries', dbStore.beneficiaries as any, rowToBeneficiary);
  await loadTable('Load blog', 'SELECT * FROM blog_posts ORDER BY publish_date ASC', dbStore.blogPosts as any, rowToBlog);
  await loadTable('Load gallery', 'SELECT * FROM gallery_items', dbStore.galleryItems as any, rowToGallery);
  await loadTable('Load contacts', 'SELECT * FROM contact_messages ORDER BY created_at ASC', dbStore.contactMessages as any, rowToContact);
  await loadTable('Load audit logs', 'SELECT * FROM (SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200) t ORDER BY created_at ASC', dbStore.auditLogs as any, rowToAudit);
}

let initPromise: Promise<void> | null = null;
function initOnce(): Promise<void> {
  if (!initPromise || !postgresService.isConnected) {
    initPromise = (async () => {
      if (process.env.DATABASE_URL && !postgresService.isConnected) {
        try {
          await postgresService.connect(process.env.DATABASE_URL.trim());
        } catch (err: any) {
          console.warn('[Neon Postgres] Connect failed:', err.message);
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

export default app;

if (!process.env.VERCEL) {
  startServer();
}