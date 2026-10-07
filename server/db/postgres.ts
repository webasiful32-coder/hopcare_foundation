import pg from 'pg';
const { Pool } = pg;
import { User, Campaign, Donation, BloodDonor, BloodRequest } from '../../src/types';

export class PostgresService {
  private pool: pg.Pool | null = null;
  public isConnected: boolean = false;
  public connectionError: string | null = null;

  constructor() {
    this.connect();
  }

  public connect() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString && !connectionString.includes('username:password@ep-sample-pool')) {
      try {
        this.pool = new Pool({
          connectionString,
          ssl: connectionString.includes('neon.tech') || connectionString.includes('sslmode=require') 
            ? { rejectUnauthorized: false } 
            : undefined,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        this.pool.on('error', (err) => {
          console.error('[Neon Postgres Error]', err.message);
          this.connectionError = err.message;
        });

        this.pool.query('SELECT NOW()')
          .then(async (res) => {
            this.isConnected = true;
            this.connectionError = null;
            console.log('[Neon Postgres] Successfully connected at', res.rows[0].now);
            await this.ensureTables();
          })
          .catch((err) => {
            this.isConnected = false;
            this.connectionError = err.message;
            console.warn('[Neon Postgres] Connection check warning:', err.message);
          });
      } catch (err: any) {
        this.isConnected = false;
        this.connectionError = err.message;
        console.warn('[Postgres Init Warning]:', err.message);
      }
    } else {
      console.log('[Database Layer] No active DATABASE_URL provided. Operating with in-memory persistence layer.');
    }
  }

  // Ensure essential tables exist in Neon
  private async ensureTables() {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS donations (
          id VARCHAR(100) PRIMARY KEY,
          campaign_id VARCHAR(100),
          donor_name VARCHAR(150) NOT NULL,
          donor_email VARCHAR(255) NOT NULL,
          donor_phone VARCHAR(50) NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          payment_gateway VARCHAR(50) NOT NULL,
          payment_status VARCHAR(50) DEFAULT 'Successful',
          transaction_id VARCHAR(100) NOT NULL,
          receipt_number VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

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
      `);
      console.log('[Neon Postgres] Auto-schema verification completed.');
    } catch (err: any) {
      console.warn('[Neon Postgres] Schema verification skipped:', err.message);
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool || !this.isConnected) {
      return null;
    }
    return this.pool.query(text, params);
  }

  public getStatus() {
    const hasConfiguredUrl = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('username:password@ep-sample-pool');
    return {
      isConnected: this.isConnected,
      hasConfiguredUrl,
      provider: this.isConnected ? 'Neon Serverless PostgreSQL (Cloud)' : 'Production In-Memory Data Store',
      message: this.isConnected 
        ? 'Connected to live Neon PostgreSQL database. All mutations persist in Neon cloud.'
        : hasConfiguredUrl
        ? `Database connection error: ${this.connectionError || 'Unable to establish socket connection to Neon'}`
        : 'Running on in-memory persistence. To connect Neon, set your DATABASE_URL secret in AI Studio.'
    };
  }
}

export const postgresService = new PostgresService();
