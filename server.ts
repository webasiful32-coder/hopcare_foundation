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

app.use(express.json());

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
// ২. অ্যাডমিন তালিকা (সব ডিভাইসে অ্যাডমিন পাওয়ার জন্য)
// ============================================================
const DEFAULT_ADMIN_EMAILS = [
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
  return ADMIN_EMAILS.includes(e) || e.startsWith('admin@');
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

const rowToUser = (row: any) => {
  const emailLower = String(row.email || '').toLowerCase().trim();
  const assignedRole = (isUserAdminEmail(emailLower) ? 'ADMIN' : (row.role || 'DONOR')) as UserRole;

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
      res.status(403).json({ error: 'Access denied: insufficient permissions' });
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
      return res.status(409).json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' });
    }

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

    // ১. Neon DB সরাসরি রিড করা
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
      return res.status(403).json({ error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে।' });
    }

    // ৩. পাসওয়ার্ড ভেরিফিকেশন (authService + SHA-256 + ডাইরেক্ট চেক)
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

    // অ্যাডমিন রোল নিশ্চিত করা
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

// Vercel Compatibility: /api/... এবং /... দুটি রুটেই কাজ করবে
app.post(['/api/auth/register', '/auth/register'], handleRegister);
app.post(['/api/auth/login', '/auth/login'], handleLogin);

app.get(['/api/auth/me', '/auth/me'], authenticate, async (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// অন্যান্য সমস্ত এপিআই রুট অপরিবর্তিত রাখা হয়েছে...
// (Donations, Campaigns, Blood Requests, Donors, Volunteers ইত্যাদি)

async function syncFromNeon() {
  const usersRes = await neon('Load users', 'SELECT * FROM users');
  if (usersRes && usersRes.rows && usersRes.rows.length > 0) {
    for (const row of usersRes.rows) {
      dbStore.users.set(row.id, rowToUser(row));
    }
  }
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