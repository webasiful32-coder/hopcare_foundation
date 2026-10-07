-- ============================================================
-- HopeCare Foundation - Production PostgreSQL Database Schema
-- Ready for Neon PostgreSQL / Scalable Cloud Architecture
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
('DONOR', 'Standard user who can donate, request blood, and message'),
('VOLUNTEER', 'Registered humanitarian field volunteer with tasks'),
('ADMIN', 'Full system management and audit control')
ON CONFLICT (name) DO NOTHING;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'DONOR' REFERENCES roles(name) ON UPDATE CASCADE,
    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);

-- 3. Campaign Categories Table
CREATE TABLE IF NOT EXISTS campaign_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50)
);

-- 4. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
    collected_amount NUMERIC(14, 2) DEFAULT 0.00 CHECK (collected_amount >= 0),
    donor_count INTEGER DEFAULT 0 CHECK (donor_count >= 0),
    featured_image_url TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Completed', 'Cancelled')),
    deadline DATE NOT NULL,
    organizer_name VARCHAR(150) NOT NULL,
    beneficiary_summary TEXT,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);

-- 5. Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id VARCHAR(100) PRIMARY KEY,
    campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    donor_name VARCHAR(150) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_phone VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    payment_gateway VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Successful', 'Failed', 'Refunded')),
    transaction_id VARCHAR(100) NOT NULL,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_receipt ON donations(receipt_number);

-- 6. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(100) PRIMARY KEY,
    donation_id VARCHAR(100) REFERENCES donations(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    status VARCHAR(50) NOT NULL,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 7. Blood Donors Table
CREATE TABLE IF NOT EXISTS blood_donors (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    address_area TEXT NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE NOT NULL,
    last_donation_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    emergency_contact_preference VARCHAR(30) DEFAULT 'Call',
    total_donation_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_blood_donors_group ON blood_donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_donors_district ON blood_donors(district);
CREATE INDEX IF NOT EXISTS idx_blood_donors_upazila ON blood_donors(upazila);
CREATE INDEX IF NOT EXISTS idx_blood_donors_avail ON blood_donors(is_available);

-- 8. Emergency Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    required_units INTEGER NOT NULL CHECK (required_units > 0),
    hospital_name VARCHAR(200) NOT NULL,
    hospital_address TEXT NOT NULL,
    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    required_date VARCHAR(100) NOT NULL,
    required_time VARCHAR(100) NOT NULL,
    emergency_level VARCHAR(30) DEFAULT 'Urgent' CHECK (emergency_level IN ('Normal', 'Urgent', 'Critical')),
    contact_person VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    patient_condition TEXT NOT NULL,
    additional_info TEXT,
    status VARCHAR(50) DEFAULT 'Searching' CHECK (status IN ('Pending', 'Searching', 'Donor Found', 'Fulfilled', 'Cancelled', 'Expired')),
    matched_donors_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_blood_requests_group ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_district ON blood_requests(district);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);

-- 9. Blood Request Matches Table
CREATE TABLE IF NOT EXISTS blood_request_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(100) REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_id VARCHAR(100) REFERENCES blood_donors(id) ON DELETE CASCADE,
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    donor_response VARCHAR(50) DEFAULT 'Pending' CHECK (donor_response IN ('Pending', 'Accepted', 'Declined', 'Completed')),
    notes TEXT
);

-- 10. Beneficiaries Table
CREATE TABLE IF NOT EXISTS beneficiaries (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    photo_url TEXT NOT NULL,
    location VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    story TEXT NOT NULL,
    support_required NUMERIC(12, 2) NOT NULL,
    support_received NUMERIC(12, 2) DEFAULT 0.00,
    campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    skills JSONB DEFAULT '[]'::jsonb,
    availability VARCHAR(100) NOT NULL,
    motivation TEXT NOT NULL,
    preferred_activities JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Suspended')),
    assigned_tasks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Chat Conversations and Messages
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY,
    subject VARCHAR(200) NOT NULL,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(100) NOT NULL,
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    cover_image TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    author VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    published_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Published',
    read_time_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Gallery Items Table
CREATE TABLE IF NOT EXISTS gallery_items (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reply_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Admin Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    admin_id VARCHAR(100) NOT NULL,
    admin_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 18. Auto-Updating Timestamps Trigger Function
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_campaigns ON campaigns;
CREATE TRIGGER set_timestamp_campaigns
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- ============================================================
-- 19. Neon Analytics Views
-- ============================================================
CREATE OR REPLACE VIEW view_campaign_progress AS
SELECT 
    c.id,
    c.title,
    c.category,
    c.target_amount,
    COALESCE(SUM(d.amount), 0) AS actual_collected_amount,
    COUNT(d.id) AS total_donations,
    ROUND((COALESCE(SUM(d.amount), 0) / NULLIF(c.target_amount, 0)) * 100, 2) AS completion_percentage,
    c.status,
    c.deadline
FROM campaigns c
LEFT JOIN donations d ON c.id = d.campaign_id AND d.payment_status = 'Successful'
GROUP BY c.id;

CREATE OR REPLACE VIEW view_blood_availability_by_district AS
SELECT 
    district,
    blood_group,
    COUNT(*) AS available_donors_count
FROM blood_donors
WHERE is_available = TRUE AND status = 'Active'
GROUP BY district, blood_group
ORDER BY district, blood_group;

