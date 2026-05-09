-- Trip Expenses table - stores driver expenses during a trip
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.users(id),
  category TEXT NOT NULL CHECK (category IN ('fuel', 'toll', 'food', 'repair', 'police', 'parking', 'other')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON public.trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_driver_id ON public.trip_expenses(driver_id);

-- Enable RLS
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers can insert their own expenses" ON public.trip_expenses
  FOR INSERT WITH CHECK (auth.uid()::text = driver_id::text);

CREATE POLICY "Drivers can view their own expenses" ON public.trip_expenses
  FOR SELECT USING (auth.uid()::text = driver_id::text);

-- Allow service role full access (for API backend)
CREATE POLICY "Service role full access" ON public.trip_expenses
  FOR ALL USING (true) WITH CHECK (true);

-- Also add file_url and file_type to messages if not done
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type TEXT;
