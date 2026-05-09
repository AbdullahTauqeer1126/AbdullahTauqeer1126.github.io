-- Migration: Add truck verification columns
-- Run this in Supabase SQL Editor

-- Add status column for approval workflow
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';

-- Add image_urls column for truck photos (stored as JSON array of Supabase Storage URLs)
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Add documents column for compliance documents (stored as JSON array of {name, type, url})
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Add rejection_reason for admin feedback
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trucks' 
  AND column_name IN ('status', 'image_urls', 'documents', 'rejection_reason');
