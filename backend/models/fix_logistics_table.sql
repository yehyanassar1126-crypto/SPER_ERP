-- ==============================================================
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX THE LOGISTICS UI
-- ==============================================================

-- 1. Add Odometer and Distance columns to the existing logistics_movements table
ALTER TABLE public.logistics_movements 
ADD COLUMN IF NOT EXISTS odometer_start DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS odometer_end DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS distance_covered DECIMAL(10,2);

-- 2. Add Gate Logs table for Drivers QR Scanning
CREATE TABLE IF NOT EXISTS public.logistics_gate_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES auth.users(id),
    driver_name VARCHAR(255),
    scan_type VARCHAR(50) CHECK (scan_type IN ('Gate Out', 'Gate In')),
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.logistics_gate_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.logistics_gate_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for all" ON public.logistics_gate_logs FOR INSERT TO authenticated WITH CHECK (true);
