-- ============================================================
-- Driver & Trip Management Upgrade Schema
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- 1. Add driver_type to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS driver_type VARCHAR(50) DEFAULT 'internal';
-- Values: 'internal', 'external'

-- 2. Add driver_type to logistics_drivers (for easier querying)
ALTER TABLE public.logistics_drivers ADD COLUMN IF NOT EXISTS driver_type VARCHAR(50) DEFAULT 'internal';

-- 3. Enhance logistics_movements for trip tracking
ALTER TABLE public.logistics_movements 
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS start_image_url TEXT,
  ADD COLUMN IF NOT EXISTS end_image_url TEXT,
  ADD COLUMN IF NOT EXISTS start_location TEXT,
  ADD COLUMN IF NOT EXISTS end_location TEXT;

-- Update existing active trips to 'new' or 'in_progress'
UPDATE public.logistics_movements SET status = 'new' WHERE status = 'active';

-- Add check constraint for status
ALTER TABLE public.logistics_movements DROP CONSTRAINT IF EXISTS logistics_movements_status_check;
ALTER TABLE public.logistics_movements ADD CONSTRAINT logistics_movements_status_check CHECK (status IN ('new', 'in_progress', 'completed'));
