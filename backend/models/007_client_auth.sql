-- ============================================================
-- Client Authentication (Login/Register for Public Catalog)
-- Adds username & password to clients table
-- ============================================================

-- Add auth columns to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- RLS Policies for clients (ensure public can register & login)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow public read for login check
CREATE POLICY "clients_select_public" ON clients FOR SELECT USING (true);
-- Allow public insert for registration
CREATE POLICY "clients_insert_public" ON clients FOR INSERT WITH CHECK (true);
-- Allow update for authenticated
CREATE POLICY "clients_update_public" ON clients FOR UPDATE USING (true);
