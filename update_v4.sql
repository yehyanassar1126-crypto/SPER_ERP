-- 1. Create table for used QR codes to prevent reuse
CREATE TABLE IF NOT EXISTS used_qr_codes (
  qr_hash TEXT PRIMARY KEY,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT
);

-- 2. Update attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS check_in_location TEXT,
ADD COLUMN IF NOT EXISTS check_out_location TEXT,
ADD COLUMN IF NOT EXISTS qr_check_in TEXT,
ADD COLUMN IF NOT EXISTS qr_check_out TEXT;

-- 3. Update missions table
ALTER TABLE missions
ADD COLUMN IF NOT EXISTS actual_time_out TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_time_in TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qr_out TEXT,
ADD COLUMN IF NOT EXISTS qr_in TEXT,
ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(5,2) DEFAULT 0;

-- 4. Friday work requests
CREATE TABLE IF NOT EXISTS friday_work_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  department TEXT NOT NULL,
  requested_by UUID REFERENCES users(id),
  requested_by_name TEXT,
  employees UUID[] NOT NULL,
  request_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  hr_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE friday_work_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friday_work_select" ON friday_work_requests FOR SELECT USING (true);
CREATE POLICY "friday_work_insert" ON friday_work_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "friday_work_update" ON friday_work_requests FOR UPDATE USING (true);

-- 5. Enable RLS for used_qr_codes
ALTER TABLE used_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "used_qr_select" ON used_qr_codes FOR SELECT USING (true);
CREATE POLICY "used_qr_insert" ON used_qr_codes FOR INSERT WITH CHECK (true);
