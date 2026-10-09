import {
  User,
  Campaign,
  Donation,
  BloodDonor,
  BloodRequest,
  Volunteer,
  Beneficiary,
  BlogPost,
  GalleryItem,
  ChatMessage,
  Conversation,
  AppNotification,
  AuditLog,
  PaymentTransaction
} from '../../src/types/index.js';

import {
  INITIAL_CAMPAIGNS,
  INITIAL_BLOOD_DONORS,
  INITIAL_BLOOD_REQUESTS,
  INITIAL_BENEFICIARIES,
  INITIAL_BLOG_POSTS,
  INITIAL_GALLERY_ITEMS,
  INITIAL_VOLUNTEERS
} from '../../src/data/bangladeshData.js';

import { authService } from '../services/authService.js';

export class DatabaseStore {
  public users: Map<string, User & { passwordHash: string }> = new Map();
  public campaigns: Map<string, Campaign> = new Map();
  public donations: Map<string, Donation> = new Map();
  public paymentTransactions: Map<string, PaymentTransaction> = new Map();
  public bloodDonors: Map<string, BloodDonor> = new Map();
  public bloodRequests: Map<string, BloodRequest> = new Map();
  public volunteers: Map<string, Volunteer> = new Map();
  public beneficiaries: Map<string, Beneficiary> = new Map();
  public blogPosts: Map<string, BlogPost> = new Map();
  public galleryItems: Map<string, GalleryItem> = new Map();
  public conversations: Map<string, Conversation> = new Map();
  public messages: Map<string, ChatMessage> = new Map();
  public notifications: Map<string, AppNotification> = new Map();
  public contactMessages: Map<string, any> = new Map();
  public auditLogs: Map<string, AuditLog> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Zero demo accounts, zero demo data.
    // Every user registers authentically.
    this.users.clear();
    this.campaigns.clear();
    this.bloodDonors.clear();
    this.bloodRequests.clear();
    this.donations.clear();
    this.paymentTransactions.clear();
    this.volunteers.clear();
    this.beneficiaries.clear();
    this.blogPosts.clear();
    this.galleryItems.clear();
    this.conversations.clear();
    this.messages.clear();
    this.notifications.clear();
    this.contactMessages.clear();
    this.auditLogs.clear();

    const initialLog: AuditLog = {
      id: 'log-1',
      adminId: 'system',
      adminName: 'System Kernel',
      action: 'SYSTEM_INITIALIZED',
      entity: 'DATABASE',
      details: 'Fresh clean database initialized. Zero demo accounts. Live registration active.',
      timestamp: new Date().toISOString()
    };
    this.auditLogs.set(initialLog.id, initialLog);
  }

  public clearAllRecords() {
    this.campaigns.clear();
    this.bloodDonors.clear();
    this.bloodRequests.clear();
    this.donations.clear();
    this.paymentTransactions.clear();
    this.volunteers.clear();
    this.beneficiaries.clear();
    this.blogPosts.clear();
    this.galleryItems.clear();
    this.conversations.clear();
    this.messages.clear();
    this.notifications.clear();
    this.contactMessages.clear();
  }

  public seedSampleRecords() {
    INITIAL_CAMPAIGNS.forEach(c => this.campaigns.set(c.id, { ...c }));
    INITIAL_BLOOD_DONORS.forEach(bd => this.bloodDonors.set(bd.id, { ...bd }));
    INITIAL_BLOOD_REQUESTS.forEach(br => this.bloodRequests.set(br.id, { ...br }));
    INITIAL_BENEFICIARIES.forEach(b => this.beneficiaries.set(b.id, { ...b }));
    INITIAL_BLOG_POSTS.forEach(bp => this.blogPosts.set(bp.id, { ...bp }));
    INITIAL_GALLERY_ITEMS.forEach(gi => this.galleryItems.set(gi.id, { ...gi }));
    INITIAL_VOLUNTEERS.forEach(v => this.volunteers.set(v.id, { ...v }));
  }
}

export const dbStore = new DatabaseStore();
