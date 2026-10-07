export type UserRole = 'DONOR' | 'VOLUNTEER' | 'ADMIN';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type CampaignCategory =
  | 'Medical Support'
  | 'Education'
  | 'Food'
  | 'Disaster Relief'
  | 'Orphan Support'
  | 'Elderly Support'
  | 'Emergency Support'
  | 'Community Development'
  | 'Other';

export type CampaignStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export type EmergencyLevel = 'Normal' | 'Urgent' | 'Critical';

export type BloodRequestStatus =
  | 'Pending'
  | 'Searching'
  | 'Donor Found'
  | 'Fulfilled'
  | 'Cancelled'
  | 'Expired';

export type PaymentGateway = 'bKash' | 'Nagad' | 'SSLCommerz' | 'Stripe' | 'Bank Transfer';

export type PaymentStatus = 'Pending' | 'Successful' | 'Failed' | 'Refunded';

export type VolunteerStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  division: string;
  district: string;
  upazila: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isBloodDonor?: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  category: CampaignCategory;
  shortDescription: string;
  fullDescription: string;
  targetAmount: number;
  collectedAmount: number;
  donorCount: number;
  featuredImageUrl: string;
  galleryImages: string[];
  status: CampaignStatus;
  deadline: string;
  organizerName: string;
  beneficiarySummary?: string;
  isUrgent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  userId?: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  paymentGateway: PaymentGateway;
  paymentStatus: PaymentStatus;
  transactionId: string;
  createdAt: string;
  receiptNumber: string;
}

export interface PaymentTransaction {
  id: string;
  donationId: string;
  gateway: PaymentGateway;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayResponse?: any;
  createdAt: string;
  verifiedAt?: string;
}

export interface BloodDonor {
  id: string;
  userId?: string;
  fullName: string;
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  division: string;
  district: string;
  upazila: string;
  addressArea: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  lastDonationDate?: string;
  isAvailable: boolean;
  emergencyContactPreference: 'Call' | 'SMS' | 'WhatsApp';
  totalDonationCount: number;
  status: 'Active' | 'Inactive' | 'Under_Review';
  createdAt: string;
}

export interface BloodRequest {
  id: string;
  userId?: string;
  patientName: string;
  bloodGroup: BloodGroup;
  requiredUnits: number;
  hospitalName: string;
  hospitalAddress: string;
  division: string;
  district: string;
  upazila: string;
  requiredDate: string;
  requiredTime: string;
  emergencyLevel: EmergencyLevel;
  contactPerson: string;
  contactPhone: string;
  patientCondition: string;
  additionalInfo?: string;
  status: BloodRequestStatus;
  matchedDonorsCount: number;
  createdAt: string;
}

export interface Volunteer {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  skills: string[];
  availability: string;
  motivation: string;
  preferredActivities: string[];
  status: VolunteerStatus;
  assignedTasksCount: number;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  photoUrl: string;
  location: string;
  category: 'Child' | 'Student' | 'Patient' | 'Elderly' | 'Family' | 'Disaster affected' | 'Other';
  story: string;
  supportRequired: number;
  supportReceived: number;
  campaignId?: string;
  status: 'Active' | 'Funded' | 'Closed';
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  publishedDate: string;
  status: 'Draft' | 'Published';
  readTimeMinutes: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'Health Camp' | 'Disaster Relief' | 'Blood Drive' | 'Education' | 'Food Distribution';
  campaignId?: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    role: UserRole;
  }[];
  subject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  userId?: string;
  type:
    | 'donation_success'
    | 'blood_request'
    | 'blood_matched'
    | 'volunteer_update'
    | 'campaign_update'
    | 'announcement'
    | 'message';
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}
