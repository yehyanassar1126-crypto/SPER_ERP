-- Fix RLS for logistics_gate_logs to allow anon key inserts (since frontend uses anon key)

ALTER TABLE public.logistics_gate_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.logistics_gate_logs;
DROP POLICY IF EXISTS "Allow insert for all" ON public.logistics_gate_logs;

-- Recreate policies for ALL users (so anon key works)
CREATE POLICY "logistics_gate_logs_select" ON public.logistics_gate_logs FOR SELECT USING (true);
CREATE POLICY "logistics_gate_logs_insert" ON public.logistics_gate_logs FOR INSERT WITH CHECK (true);
