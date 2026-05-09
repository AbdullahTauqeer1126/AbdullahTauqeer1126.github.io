-- ============================================================
-- FINAL PRODUCTION READINESS MIGRATION
-- Permanent Storage for OTPs, Ratings, and GPS Updates
-- ============================================================

-- 1. Create OTPs Table
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
CREATE INDEX IF NOT EXISTS idx_otps_created_at ON otps(created_at);

-- 2. Update Trucks Table (Add missing production columns)
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS plate_number_pakistan VARCHAR(50); -- Optional for local format

-- 3. Enhance Notifications Table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'in_app';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Enhance Reviews Table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rater_role VARCHAR(50);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS category_ratings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_text TEXT;

-- 5. Trip Enhancements
ALTER TABLE trips ADD COLUMN IF NOT EXISTS planned_route JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS alerts JSONB DEFAULT '[]'::jsonb;

-- 6. Wallet Enhancements
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS method VARCHAR(100);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';

-- Enable RLS for OTPs (though it's usually server-side only)
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
