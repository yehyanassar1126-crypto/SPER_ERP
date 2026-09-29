-- Add trip cost workflow columns to logistics_movements
ALTER TABLE public.logistics_movements 
ADD COLUMN IF NOT EXISTS trip_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost_status VARCHAR(50) DEFAULT 'pending' CHECK (cost_status IN ('pending', 'pending_approval', 'pending_payment', 'paid'));
