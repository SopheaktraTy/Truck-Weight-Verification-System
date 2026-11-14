-- Migration: Add approval_status column to truck_records
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tdrohatnwtgkvpkdbdoj/sql

-- Add approval tracking columns
ALTER TABLE truck_records
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_truck_records_approval_status ON truck_records(approval_status);

-- View results
SELECT id, plate_number, status, approval_status, approved_at FROM truck_records ORDER BY created_at DESC LIMIT 10;
