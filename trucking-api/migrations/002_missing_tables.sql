-- =============================================
-- TruckApp Pakistan — Missing Tables Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. RATINGS TABLE
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  rater_id UUID NOT NULL REFERENCES auth.users(id),
  rated_user_id UUID NOT NULL REFERENCES auth.users(id),
  rater_role TEXT NOT NULL CHECK (rater_role IN ('customer', 'driver', 'fleet_owner')),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  category_ratings JSONB DEFAULT '{}',
  review_text TEXT,
  response_text TEXT,
  response_by UUID REFERENCES auth.users(id),
  response_at TIMESTAMPTZ,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX idx_ratings_booking ON ratings(booking_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_id);

-- RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view ratings" ON ratings FOR SELECT USING (is_visible = true);
CREATE POLICY "Users can create ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Users can respond to ratings" ON ratings FOR UPDATE USING (auth.uid() = rated_user_id);


-- 2. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);


-- 3. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS (admin only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON audit_logs FOR ALL USING (auth.role() = 'service_role');


-- 4. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'TOPUP', 'WITHDRAWAL', 'REFUND', 'COMMISSION')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  method TEXT,
  reference TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_status ON wallet_transactions(user_id, status);

-- RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service insert" ON wallet_transactions FOR INSERT WITH CHECK (true);


-- 5. GEOFENCES TABLE
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  type TEXT NOT NULL DEFAULT 'restricted' CHECK (type IN ('restricted', 'waypoint', 'delivery_zone', 'toll')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geofences_active ON geofences(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view geofences" ON geofences FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage geofences" ON geofences FOR ALL USING (auth.role() = 'service_role');


-- 6. DISPUTES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  complainant_id UUID NOT NULL REFERENCES auth.users(id),
  respondent_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('cargo_damage', 'late_delivery', 'driver_behavior', 'wrong_delivery', 'overcharge', 'no_show', 'other')),
  description TEXT NOT NULL,
  amount_claimed DECIMAL(12,2) DEFAULT 0,
  evidence_urls JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated', 'denied')),
  resolution_type TEXT,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  compensation_amount DECIMAL(12,2) DEFAULT 0,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disputes_booking ON disputes(booking_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own disputes" ON disputes FOR SELECT USING (auth.uid() = complainant_id OR auth.uid() = respondent_id);
CREATE POLICY "Users can create disputes" ON disputes FOR INSERT WITH CHECK (auth.uid() = complainant_id);


-- 7. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'flat')),
  value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_order DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code) WHERE is_active = true;

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can validate coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage coupons" ON coupons FOR ALL USING (auth.role() = 'service_role');
