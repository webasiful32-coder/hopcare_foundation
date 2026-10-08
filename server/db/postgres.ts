import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1].trim();
        return match[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

export class PostgresService {
  private pool: pg.Pool | null = null;
  public isConnected: boolean = false;
  public connectionError: string | null = null;
  public connectionString: string | null = null;

  constructor() {
    this.connect();
  }

  public async connect(customUrl?: string): Promise<{ success: boolean; message: string }> {
    const connStr = customUrl || getDatabaseUrl();
    this.connectionString = connStr || null;

    if (this.pool) {
      try {
        await this.pool.end();
      } catch {
        // ignore
      }
      this.pool = null;
    }

    if (connStr && !connStr.includes('username:password@ep-sample-pool')) {
      try {
        this.pool = new Pool({
          connectionString: connStr,
          ssl: connStr.includes('neon.tech') || connStr.includes('sslmode=require') 
            ? { rejectUnauthorized: false } 
            : undefined,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 7000,
        });

        this.pool.on('error', (err) => {
          console.error('[Neon Postgres Error]', err.message);
          this.connectionError = err.message;
        });

        const res = await this.pool.query('SELECT NOW(), current_database() as db_name');
        this.isConnected = true;
        this.connectionError = null;
        console.log(`[Neon Postgres] Connected to database "${res.rows[0].db_name}" at`, res.rows[0].now);

        await this.ensureTables();

        // If customUrl was passed, write it to .env so it persists across restarts
        if (customUrl) {
          try {
            const envPath = path.resolve(process.cwd(), '.env');
            let envContent = '';
            if (fs.existsSync(envPath)) {
              envContent = fs.readFileSync(envPath, 'utf8');
              if (envContent.includes('DATABASE_URL=')) {
                envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${customUrl}"`);
              } else {
                envContent += `\nDATABASE_URL="${customUrl}"\n`;
              }
            } else {
              envContent = `DATABASE_URL="${customUrl}"\n`;
            }
            fs.writeFileSync(envPath, envContent, 'utf8');
            process.env.DATABASE_URL = customUrl;
          } catch (envErr: any) {
            console.warn('[Env file update warn]:', envErr.message);
          }
        }

        return {
          success: true,
          message: `Successfully connected to Neon PostgreSQL (${res.rows[0].db_name})`
        };
      } catch (err: any) {
        this.isConnected = false;
        this.connectionError = err.message;
        console.warn('[Postgres Init Warning]:', err.message);
        return {
          success: false,
          message: `Connection failed: ${err.message}`
        };
      }
    } else {
      this.isConnected = false;
      this.connectionError = 'No DATABASE_URL configured or still using placeholder';
      console.log('[Database Layer] No active DATABASE_URL provided. Operating with in-memory persistence layer.');
      return {
        success: false,
        message: 'No active DATABASE_URL provided. Operating with in-memory persistence layer.'
      };
    }
  }

  // Ensure ALL essential tables exist in Neon
  public async ensureTables() {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(this.getNeonSqlScript());
      console.log('[Neon Postgres] Complete schema verification succeeded for all tables.');
    } catch (err: any) {
      console.warn('[Neon Postgres] Schema verification skipped:', err.message);
    }
  }

  public getNeonSqlScript(): string {
    return `
-- ============================================================
-- HopeCare Foundation - Complete Neon PostgreSQL Schema
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'DONOR',
  division VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  upazila VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL,
  collected_amount NUMERIC(14, 2) DEFAULT 0.00,
  donor_count INTEGER DEFAULT 0,
  featured_image_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  deadline DATE NOT NULL,
  organizer_name VARCHAR(150) NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Donations Table
CREATE TABLE IF NOT EXISTS donations (
  id VARCHAR(100) PRIMARY KEY,
  campaign_id VARCHAR(100),
  user_id VARCHAR(100),
  donor_name VARCHAR(150) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(50) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  payment_gateway VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'Successful',
  transaction_id VARCHAR(100) NOT NULL,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Blood Donors Table
CREATE TABLE IF NOT EXISTS blood_donors (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  full_name VARCHAR(150) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  division VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  upazila VARCHAR(100),
  address_area TEXT,
  gender VARCHAR(20) DEFAULT 'Male',
  date_of_birth DATE,
  last_donation_date DATE,
  is_available BOOLEAN DEFAULT TRUE,
  emergency_contact_preference VARCHAR(30) DEFAULT 'Call',
  total_donation_count INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
  id VARCHAR(100) PRIMARY KEY,
  patient_name VARCHAR(150) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  required_units INTEGER NOT NULL,
  hospital_name VARCHAR(200) NOT NULL,
  hospital_address TEXT NOT NULL,
  division VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  upazila VARCHAR(100) NOT NULL,
  emergency_level VARCHAR(30) DEFAULT 'Urgent',
  contact_person VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  status VARCHAR(50) DEFAULT 'Searching',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  division VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  upazila VARCHAR(100),
  skills TEXT[],
  availability VARCHAR(100),
  motivation TEXT,
  preferred_activities TEXT[],
  status VARCHAR(50) DEFAULT 'Pending',
  assigned_tasks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Beneficiaries Table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  age INTEGER,
  location VARCHAR(200) NOT NULL,
  story TEXT NOT NULL,
  assistance_type VARCHAR(100) NOT NULL,
  grant_amount NUMERIC(12, 2) NOT NULL,
  date_assisted DATE NOT NULL,
  image_url TEXT NOT NULL,
  verification_doc_id VARCHAR(100)
);

-- 8. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(150) NOT NULL,
  read_time VARCHAR(50),
  publish_date DATE NOT NULL,
  cover_image TEXT NOT NULL,
  category VARCHAR(100) NOT NULL
);

-- 9. Gallery Items Table
CREATE TABLE IF NOT EXISTS gallery_items (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  date DATE,
  location VARCHAR(150),
  description TEXT
);
`;
  }

  public async getTableCounts(): Promise<Record<string, number>> {
    if (!this.pool || !this.isConnected) return {};
    const tables = ['users', 'campaigns', 'donations', 'blood_donors', 'blood_requests', 'volunteers', 'beneficiaries', 'blog_posts', 'gallery_items'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const res = await this.pool.query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(res.rows[0].count, 10);
      } catch {
        counts[table] = 0;
      }
    }
    return counts;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool || !this.isConnected) {
      return null;
    }
    return this.pool.query(text, params);
  }

  public getStatus() {
    const dbUrl = getDatabaseUrl();
    const hasConfiguredUrl = !!dbUrl && !dbUrl.includes('username:password@ep-sample-pool');
    return {
      isConnected: this.isConnected,
      hasConfiguredUrl,
      provider: this.isConnected ? 'Neon Serverless PostgreSQL (Cloud)' : 'In-Memory Store (Neon Standby)',
      message: this.isConnected 
        ? 'Connected to live Neon PostgreSQL database. All mutations persist in Neon cloud.'
        : hasConfiguredUrl
        ? `Database connection error: ${this.connectionError || 'Unable to establish socket connection to Neon'}`
        : 'Running on in-memory persistence. To connect Neon, enter your DATABASE_URL in the Database Manager.'
    };
  }
}

export const postgresService = new PostgresService();

