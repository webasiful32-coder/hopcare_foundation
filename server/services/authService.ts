import crypto from 'crypto';
import { User, UserRole } from '../../src/types';

export class AuthService {
  // Hash password using PBKDF2 with unique salt
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  // Verify password against stored hash
  verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return originalHash === testHash;
  }

  // Generate lightweight secure session token
  generateSessionToken(userId: string, role: UserRole): string {
    const payload = `${userId}.${role}.${Date.now()}`;
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'hopecare-secret-key-2026')
      .update(payload)
      .digest('hex');
    return Buffer.from(`${payload}.${signature}`).toString('base64');
  }

  // Verify and parse session token
  verifyToken(token: string): { userId: string; role: UserRole } | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('ascii');
      const parts = decoded.split('.');
      if (parts.length !== 4) return null;
      const [userId, role, timestamp, signature] = parts;
      const expectedPayload = `${userId}.${role}.${timestamp}`;
      const expectedSignature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'hopecare-secret-key-2026')
        .update(expectedPayload)
        .digest('hex');

      if (signature !== expectedSignature) return null;
      return { userId, role: role as UserRole };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
