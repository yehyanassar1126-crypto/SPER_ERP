-- ============================================================
-- UPDATE V4 - All Database Migrations
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- SECTION 1: Fix Users Table Constraints
-- ============================================================

-- 1a. Drop old shift constraint and add new one with 'day' and 'admin' shifts
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_shift_check;
ALTER TABLE users ADD CONSTRAINT users_shift_check CHECK (shift IN ('morning', 'evening', 'night', 'day', 'admin'));

-- 1b. Drop old role constraint and add new one with all roles used in the system
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
  'hr', 'employee', 'owner', 'hr manager', 'manager',
  'hall manager', 'qc inspector', 'quality manager',
  'warehouse manager', 'maintenance manager', 'technician',
  'procurement manager', 'procurement specialist', 'purchasing manager',
  'engineering manager', 'engineer', 'technical office',
  'sales manager', 'planning manager',
  'accountant', 'chief accountant', 'cfo',
  'it support', 'it manager',
  'spare parts inspector',
  'supplier_external'
));

-- 1c. Drop old department constraint and add new one with all departments
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_check;
ALTER TABLE users ADD CONSTRAINT users_department_check CHECK (department IN (
  'Production', 'Warehouse', 'Administration', 'Packaging',
  'Maintenance', 'Procurement', 'Finance', 'IT',
  'Quality', 'Engineering', 'Planning',
  'Health & Safety', 'Secretariat', 'Sales', 'Logistics', 'HR'
));

-- ============================================================
-- SECTION 2: QR Codes & Attendance Updates
-- ============================================================

-- 2a. Create table for used QR codes to prevent reuse
CREATE TABLE IF NOT EXISTS used_qr_codes (
  qr_hash TEXT PRIMARY KEY,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT
);

-- 2b. Update attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS check_in_location TEXT,
ADD COLUMN IF NOT EXISTS check_out_location TEXT,
ADD COLUMN IF NOT EXISTS qr_check_in TEXT,
ADD COLUMN IF NOT EXISTS qr_check_out TEXT;

-- 2c. Update missions table
ALTER TABLE missions
ADD COLUMN IF NOT EXISTS actual_time_out TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_time_in TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qr_out TEXT,
ADD COLUMN IF NOT EXISTS qr_in TEXT,
ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(5,2) DEFAULT 0;

-- 2d. Friday work requests
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

-- 2e. Enable RLS
ALTER TABLE used_qr_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "used_qr_select" ON used_qr_codes;
DROP POLICY IF EXISTS "used_qr_insert" ON used_qr_codes;
CREATE POLICY "used_qr_select" ON used_qr_codes FOR SELECT USING (true);
CREATE POLICY "used_qr_insert" ON used_qr_codes FOR INSERT WITH CHECK (true);

ALTER TABLE friday_work_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "friday_work_select" ON friday_work_requests;
DROP POLICY IF EXISTS "friday_work_insert" ON friday_work_requests;
DROP POLICY IF EXISTS "friday_work_update" ON friday_work_requests;
CREATE POLICY "friday_work_select" ON friday_work_requests FOR SELECT USING (true);
CREATE POLICY "friday_work_insert" ON friday_work_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "friday_work_update" ON friday_work_requests FOR UPDATE USING (true);

-- ============================================================
-- SECTION 3: Engineering Workflow Approvals
-- ============================================================

-- Add workflow_approvals JSONB column to track department approvals per phase
ALTER TABLE engineering_projects ADD COLUMN IF NOT EXISTS workflow_approvals JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- SECTION 4: Users Table - Add Missing Columns
-- ============================================================

-- Add shift_system column for 2-shift vs 3-shift tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_system TEXT DEFAULT '3-shift';

-- ============================================================
-- SECTION 5: Inventory Transactions
-- ============================================================

ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- Done! All constraints and tables are now up to date.
-- ============================================================
