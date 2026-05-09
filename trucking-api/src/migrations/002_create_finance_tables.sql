-- Finance Tables & Columns Migration
-- Created: May 9, 2026

-- 1. Create fraud_alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- SUSPICIOUS_LOCATION, MULTIPLE_PAYMENTS, FAKE_TRIP, etc.
  severity VARCHAR(20) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '{}', -- store any supporting data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  INDEX idx_fraud_user (user_id),
  INDEX idx_fraud_status (is_resolved),
  INDEX idx_fraud_created (created_at)
);

-- 2. Create device_tokens table for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL, -- ios, android, web
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_user (user_id),
  INDEX idx_device_active (is_active)
);

-- 3. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conv_p1 (participant1_id),
  INDEX idx_conv_p2 (participant2_id),
  INDEX idx_conv_updated (updated_at)
);

-- 4. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(20) DEFAULT 'SENT', -- SENT, DELIVERED, READ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  INDEX idx_msg_conv (conversation_id),
  INDEX idx_msg_sender (sender_id),
  INDEX idx_msg_status (status),
  INDEX idx_msg_created (created_at)
);

-- 5. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- PAYMENT, EARNING, REFUND, WITHDRAWAL
  method VARCHAR(50), -- JAZZCASH, EASYPAISA, CARD, WALLET, BANK
  status VARCHAR(20) DEFAULT 'COMPLETED', -- COMPLETED, PENDING, FAILED
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_txn_user (user_id),
  INDEX idx_txn_booking (booking_id),
  INDEX idx_txn_type (type),
  INDEX idx_txn_status (status),
  INDEX idx_txn_created (created_at)
);

-- 6. Alter trips table - add ETA columns
ALTER TABLE trips ADD COLUMN IF NOT EXISTS eta_time TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_remaining_km DECIMAL(8,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS average_speed_kmh DECIMAL(8,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS eta_updated_at TIMESTAMP;

-- 7. Alter bookings table - add finance columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_fare DECIMAL(10,2) DEFAULT 100;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS distance_charge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 500;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS surge_multiplier DECIMAL(3,2) DEFAULT 1.00;

-- 8. Alter wallets table - add pending earnings
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS pending_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_balance ON wallets(user_id, balance);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_status ON bookings(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_locations_trip_time ON locations(trip_id, created_at);

-- 10. Grant permissions
-- GRANT ALL PRIVILEGES ON fraud_alerts TO authenticated;
-- GRANT ALL PRIVILEGES ON device_tokens TO authenticated;
-- GRANT ALL PRIVILEGES ON conversations TO authenticated;
-- GRANT ALL PRIVILEGES ON messages TO authenticated;
-- GRANT ALL PRIVILEGES ON transactions TO authenticated;

-- Verification: Run these queries to verify migration
-- SELECT COUNT(*) FROM fraud_alerts;
-- SELECT COUNT(*) FROM device_tokens;
-- SELECT COUNT(*) FROM conversations;
-- SELECT COUNT(*) FROM messages;
-- SELECT COUNT(*) FROM transactions;
-- SELECT column_name FROM information_schema.columns WHERE table_name='trips' AND column_name='eta_time';
-- SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name='driver_earnings';
