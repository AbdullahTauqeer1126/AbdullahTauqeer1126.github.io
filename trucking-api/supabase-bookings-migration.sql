-- ============================================================
-- Bookings Table Migration
-- Run this in Supabase SQL Editor if you use the booking service
-- (separate from the shipments table used by trucking controller)
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id),
  pickup_address VARCHAR(500) NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  drop_address VARCHAR(500) NOT NULL,
  drop_latitude DECIMAL(10, 8),
  drop_longitude DECIMAL(11, 8),
  cargo_type VARCHAR(100) NOT NULL,
  weight_tons DECIMAL(10, 2) NOT NULL,
  estimated_distance_km DECIMAL(10, 2),
  total_amount_prs DECIMAL(15, 2) NOT NULL,
  booking_status VARCHAR(50) DEFAULT 'PENDING' CHECK (booking_status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
  assigned_driver_id UUID REFERENCES users(id),
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  pickup_time TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH TIME ZONE,
  special_instructions TEXT,
  gst_amount DECIMAL(15, 2) GENERATED ALWAYS AS (total_amount_prs * 0.17) STORED,
  platform_commission DECIMAL(15, 2) GENERATED ALWAYS AS (total_amount_prs * 0.15) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_truck_id ON bookings(truck_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Notifications Table
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Saved Locations Table (for customers)
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Wallet Transactions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'REFUND', 'WITHDRAWAL', 'BONUS')),
  amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  description VARCHAR(500),
  reference_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Announcements Table (for admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_role VARCHAR(50) DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Promotions / Promo Codes Table
-- ============================================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_booking_amount DECIMAL(15, 2) DEFAULT 0,
  max_discount_amount DECIMAL(15, 2),
  usage_limit INT,
  usage_count INT DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Expenses Table (for fleet owners)
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(500),
  receipt_url VARCHAR(500),
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_fleet_owner_id ON expenses(fleet_owner_id);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
