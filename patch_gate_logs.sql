-- ==============================================================
-- RUN THIS TO ALLOW DRIVERS FROM logistics_drivers TO SCAN QR
-- ==============================================================

-- Drop the old constraint that forces the driver to be a logged-in user
ALTER TABLE public.logistics_gate_logs DROP CONSTRAINT IF EXISTS logistics_gate_logs_driver_id_fkey;

-- Add the new constraint that links the log to the logistics_drivers table
ALTER TABLE public.logistics_gate_logs ADD CONSTRAINT logistics_gate_logs_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.logistics_drivers(id) ON DELETE CASCADE;
