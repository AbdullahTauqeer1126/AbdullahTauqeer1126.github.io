-- Add support for Admin Management features
-- Execute this in Supabase SQL Editor

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (id, value) VALUES ('platform_config', '{
  "platformName": "TruckApp Pakistan",
  "maintenanceMode": false,
  "commissionRate": 15,
  "minBookingAmount": 1000,
  "emailNotifications": true,
  "smsNotifications": true
}'::jsonb) ON CONFLICT (id) DO NOTHING;

-- Fraud Alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('flat', 'percentage')),
  value DECIMAL(15, 2) NOT NULL,
  max_discount DECIMAL(15, 2),
  min_order DECIMAL(15, 2),
  max_uses INT DEFAULT 0,
  current_uses INT DEFAULT 0,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Pages
CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'Published' CHECK (status IN ('Draft', 'Published')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Content
INSERT INTO content_pages (title, slug, content, status) VALUES 
('About Us', '/about', 'Welcome to TruckApp Pakistan.', 'Published'),
('Terms & Conditions', '/terms', 'Terms and conditions...', 'Published'),
('Privacy Policy', '/privacy', 'Privacy policy...', 'Published'),
('FAQ', '/faq', 'Frequently asked questions...', 'Published')
ON CONFLICT (slug) DO NOTHING;
