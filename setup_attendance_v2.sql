-- ============================================================
-- ATTENDANCE SYSTEM OVERHAUL - DATABASE UPDATES
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. QR TOKENS (لمنع إعادة استخدام QR Code)
CREATE TABLE IF NOT EXISTS qr_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL,
  hr_id UUID,
  employee_id UUID,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT CHECK (action_type IN ('checkin','checkout','mission_out','mission_in')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qr_tokens_all" ON qr_tokens FOR ALL USING (true) WITH CHECK (true);

-- 2. ATTENDANCE MODIFICATIONS (سجل تعديلات الحضور والانصراف)
CREATE TABLE IF NOT EXISTS attendance_modifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id UUID,
  employee_id UUID,
  employee_name TEXT,
  modified_by UUID,
  modified_by_name TEXT,
  modification_type TEXT CHECK (modification_type IN ('edit_checkout','delete_checkout','reopen_day','edit_checkin')),
  old_value TEXT,
  new_value TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance_modifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_modifications_all" ON attendance_modifications FOR ALL USING (true) WITH CHECK (true);

-- 3. OVERTIME REQUESTS (طلبات العمل الإضافي من مديري الأقسام)
CREATE TABLE IF NOT EXISTS overtime_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID,
  requested_by_name TEXT,
  department TEXT NOT NULL,
  work_date DATE NOT NULL,
  expected_hours NUMERIC(4,1),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "overtime_requests_all" ON overtime_requests FOR ALL USING (true) WITH CHECK (true);

-- 4. OVERTIME REQUEST EMPLOYEES (الموظفين المطلوبين للعمل الإضافي)
CREATE TABLE IF NOT EXISTS overtime_request_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES overtime_requests(id) ON DELETE CASCADE,
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE overtime_request_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "overtime_request_employees_all" ON overtime_request_employees FOR ALL USING (true) WITH CHECK (true);

-- 5. ADD COLUMNS TO attendance TABLE IF MISSING
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_location TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_location TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS qr_token_checkin TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS qr_token_checkout TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modified_by TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modification_reason TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_friday_work BOOLEAN DEFAULT false;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS friday_bonus NUMERIC(10,2) DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(4,2) DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS overtime_amount NUMERIC(10,2) DEFAULT 0;
