-- Run this once in Supabase SQL Editor for existing projects.
-- It is safe to re-run.

BEGIN;

-- Ensure required auth column exists for backend signup/login.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'APPROVED';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_docs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT '';
UPDATE public.users SET password_hash = '' WHERE password_hash IS NULL;
ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;
UPDATE public.users SET approval_status = 'APPROVED' WHERE approval_status IS NULL;

-- Trucking persistence compatibility columns.
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(100);
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS special_requirements TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.users(id);
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS assigned_truck_id UUID REFERENCES public.trucks(id);
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS rating INT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS review TEXT;

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS bid_id UUID;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.users(id);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS start_location VARCHAR(255);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS end_location VARCHAR(255);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS current_location VARCHAR(255);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10, 8);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS current_lng DECIMAL(11, 8);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS speed_kmh DECIMAL(10, 2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS heading DECIMAL(10, 2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS accuracy_m DECIMAL(10, 2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15, 2);

ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS document_key VARCHAR(100);
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(120);

CREATE TABLE IF NOT EXISTS public.trip_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed_kmh DECIMAL(10, 2),
  heading DECIMAL(10, 2),
  accuracy_m DECIMAL(10, 2),
  distance_km DECIMAL(10, 2),
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_locations_trip_id ON public.trip_locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_recorded_at ON public.trip_locations(recorded_at);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS trip_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_provider VARCHAR(100);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_reference VARCHAR(150);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_redirect_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status_message TEXT;

DO $$
DECLARE
  payment_status_constraint RECORD;
BEGIN
  FOR payment_status_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS %I', payment_status_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'AWAITING_GATEWAY'));

-- Ensure corporate role is allowed in users.role check constraint.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('customer', 'fleet_owner', 'driver', 'agent', 'admin', 'corporate'));

COMMIT;
