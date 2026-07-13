-- ==============================================================
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX THE LOGISTICS UI
-- ==============================================================

-- 1. Add Odometer and Distance columns to the existing logistics_movements table
ALTER TABLE public.logistics_movements 
ADD COLUMN IF NOT EXISTS odometer_start DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS odometer_end DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS distance_covered DECIMAL(10,2);
