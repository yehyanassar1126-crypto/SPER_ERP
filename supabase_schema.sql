-- ============================================================
-- Smart Factory HR & Workforce Management System
-- Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS / EMPLOYEES TABLE
-- ============================================================
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('hr', 'employee')),
  department TEXT NOT NULL CHECK (department IN ('Production', 'Warehouse', 'Administration', 'Packaging')),
  position TEXT,
  phone TEXT,
  hire_date DATE,
  base_salary NUMERIC(10, 2) DEFAULT 0,
  shift TEXT DEFAULT 'morning' CHECK (shift IN ('morning', 'evening', 'night')),
  insurance_start DATE,
  insurance_active BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  annual_leave_balance NUMERIC(4, 1) DEFAULT 24,
  avatar_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  department TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  shift TEXT,
  delay_minutes INTEGER DEFAULT 0,
  working_hours NUMERIC(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'absent' CHECK (status IN ('present', 'checked_in', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. LEAVE REQUESTS TABLE
-- ============================================================
CREATE TABLE leave_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  department TEXT,
  type TEXT NOT NULL CHECK (type IN ('Annual', 'Sick', 'Emergency', 'Unpaid', 'Maternity/Paternity')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(4, 1) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. OVERTIME TABLE
-- ============================================================
CREATE TABLE overtime (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  department TEXT,
  date DATE NOT NULL,
  hours NUMERIC(4, 2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rate NUMERIC(3, 1) DEFAULT 1.5,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. PAYROLL TABLE
-- ============================================================
CREATE TABLE payroll (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  department TEXT,
  month TEXT NOT NULL, -- Format: YYYY-MM
  base_salary NUMERIC(10, 2) DEFAULT 0,
  overtime_pay NUMERIC(10, 2) DEFAULT 0,
  bonuses NUMERIC(10, 2) DEFAULT 0,
  performance_bonus NUMERIC(10, 2) DEFAULT 0,
  penalties NUMERIC(10, 2) DEFAULT 0,
  late_deductions NUMERIC(10, 2) DEFAULT 0,
  absence_deductions NUMERIC(10, 2) DEFAULT 0,
  net_salary NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'funds_released', 'paid')),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_by TEXT,
  department TEXT DEFAULT 'All',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. AUDIT LOG TABLE
-- ============================================================
CREATE TABLE audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  user_name TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details TEXT,
  ip TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users: employees can only see their own data, HR can see all
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users insert policy" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update policy" ON users FOR UPDATE USING (true);
CREATE POLICY "Users delete policy" ON users FOR DELETE USING (true);

-- Attendance: employees see own, HR sees all
CREATE POLICY "Attendance view policy" ON attendance
  FOR SELECT USING (true);

CREATE POLICY "Attendance insert policy" ON attendance
  FOR INSERT WITH CHECK (true);

-- Leave requests: employees see own, HR sees all
CREATE POLICY "Leave requests view" ON leave_requests
  FOR SELECT USING (true);

CREATE POLICY "Leave requests insert" ON leave_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Leave requests update" ON leave_requests
  FOR UPDATE USING (true);

-- Overtime policies
CREATE POLICY "Overtime view" ON overtime FOR SELECT USING (true);
CREATE POLICY "Overtime insert" ON overtime FOR INSERT WITH CHECK (true);
CREATE POLICY "Overtime update" ON overtime FOR UPDATE USING (true);

-- Payroll: employees see own, HR sees all
CREATE POLICY "Payroll view" ON payroll FOR SELECT USING (true);
CREATE POLICY "Payroll insert" ON payroll FOR INSERT WITH CHECK (true);
CREATE POLICY "Payroll update" ON payroll FOR UPDATE USING (true);

-- Salary Adjustments
CREATE POLICY "Salary Adjustments view" ON salary_adjustments FOR SELECT USING (true);
CREATE POLICY "Salary Adjustments insert" ON salary_adjustments FOR INSERT WITH CHECK (true);
CREATE POLICY "Salary Adjustments update" ON salary_adjustments FOR UPDATE USING (true);

-- Notifications: users see only their own
CREATE POLICY "Notifications view own" ON notifications
  FOR SELECT USING (true);
CREATE POLICY "Notifications insert" ON notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Notifications update" ON notifications
  FOR UPDATE USING (true);

-- Announcements: everyone can read
CREATE POLICY "Announcements read" ON announcements FOR SELECT USING (true);
CREATE POLICY "Announcements insert" ON announcements FOR INSERT WITH CHECK (true);

-- Audit log: HR only
CREATE POLICY "Audit log read" ON audit_log FOR SELECT USING (true);
CREATE POLICY "Audit log insert" ON audit_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_overtime_employee ON overtime(employee_id);
CREATE INDEX idx_salary_adj_employee ON salary_adjustments(employee_id);
CREATE INDEX idx_salary_adj_month ON salary_adjustments(month);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_month ON payroll(month);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- ============================================================
-- 11. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;

-- Initial Admin Account
INSERT INTO users (employee_id, full_name, email, username, password_hash, role, department, position, base_salary, shift, insurance_active, status, avatar_color) VALUES ('HR-001', 'Admin HR', 'hr@factory.com', 'hr', 'hr123', 'hr', 'Administration', 'HR Manager', 15000, 'morning', true, 'active', '#6366f1') ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. LOANS & ADVANCES TABLE
-- ============================================================
CREATE TABLE loans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  installments INTEGER NOT NULL,
  monthly_deduction NUMERIC(10,2) NOT NULL,
  remaining_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
  reason TEXT,
  deferred_months TEXT[] DEFAULT '{}', -- Format: YYYY-MM to pause deduction
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Loans view policy" ON loans FOR SELECT USING (true);
CREATE POLICY "Loans insert policy" ON loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Loans update policy" ON loans FOR UPDATE USING (true);

-- ============================================================
-- 13. MEDICAL REQUESTS TABLE
-- ============================================================
CREATE TABLE medical_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  description TEXT NOT NULL,
  document_url TEXT,
  amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved_by_owner', 'rejected', 'disbursed')),
  owner_comments TEXT,
  hr_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Medical Requests
ALTER TABLE medical_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medical view policy" ON medical_requests FOR SELECT USING (true);
CREATE POLICY "Medical insert policy" ON medical_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Medical update policy" ON medical_requests FOR UPDATE USING (true);

-- ============================================================
-- 14. MISSIONS (ERRANDS) TABLE
-- ============================================================
CREATE TABLE missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  mission_date DATE NOT NULL,
  reason TEXT NOT NULL,
  time_out TIME,
  time_in TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Missions
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Missions view policy" ON missions FOR SELECT USING (true);
CREATE POLICY "Missions insert policy" ON missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Missions update policy" ON missions FOR UPDATE USING (true);

-- ============================================================
-- 15. COMPLAINTS & GRIEVANCES TABLE
-- ============================================================
CREATE TABLE complaints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Complaints view policy" ON complaints FOR SELECT USING (true);
CREATE POLICY "Complaints insert policy" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Complaints update policy" ON complaints FOR UPDATE USING (true);

-- ============================================================
-- 16. DISCIPLINARY ACTIONS TABLE
-- ============================================================
CREATE TABLE disciplinary_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  issued_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disciplinary view policy" ON disciplinary_actions FOR SELECT USING (true);
CREATE POLICY "Disciplinary insert policy" ON disciplinary_actions FOR INSERT WITH CHECK (true);

-- ============================================================
-- 17. OFFBOARDING TABLE
-- ============================================================
CREATE TABLE offboarding (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  employee_code TEXT,
  separation_date DATE NOT NULL,
  reason TEXT,
  it_cleared BOOLEAN DEFAULT false,
  hr_cleared BOOLEAN DEFAULT false,
  finance_cleared BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE offboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offboarding view policy" ON offboarding FOR SELECT USING (true);
CREATE POLICY "Offboarding insert policy" ON offboarding FOR INSERT WITH CHECK (true);
CREATE POLICY "Offboarding update policy" ON offboarding FOR UPDATE USING (true);

-- ============================================================
-- 18. EXPENSES TABLE
-- ============================================================
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expenses view policy" ON expenses FOR SELECT USING (true);
CREATE POLICY "Expenses insert policy" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Expenses update policy" ON expenses FOR UPDATE USING (true);

-- ============================================================
-- 19. INVENTORY ITEMS TABLE
-- ============================================================
CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Maintenance', 'Workshop', 'Supplies', 'Chemicals', 'Fixed Assets')),
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 2,
  last_purchase_price NUMERIC(10,2) DEFAULT 0,
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory items view policy" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Inventory items insert policy" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Inventory items update policy" ON inventory_items FOR UPDATE USING (true);

-- ============================================================
-- 20. INVENTORY TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE inventory_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  item_name TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('in', 'out')),
  quantity INTEGER NOT NULL,
  requested_by TEXT, -- Production Manager name
  processed_by TEXT, -- Warehouse clerk name
  date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory transactions view policy" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Inventory transactions insert policy" ON inventory_transactions FOR INSERT WITH CHECK (true);

-- ============================================================
-- 21. PURCHASE REQUESTS TABLE
-- ============================================================
CREATE TABLE purchase_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  item_name TEXT,
  requested_quantity INTEGER NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'Piece',
  delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_warehouse', 'dispensed', 'approved', 'rejected', 'quotation_requested', 'purchased', 'pending_finance')),
  requested_by TEXT,
  approved_by TEXT, -- Procurement manager
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Purchase requests view policy" ON purchase_requests FOR SELECT USING (true);
CREATE POLICY "Purchase requests insert policy" ON purchase_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Purchase requests update policy" ON purchase_requests FOR UPDATE USING (true);

-- ============================================================
-- 22. PURCHASE QUOTATIONS & ORDERS
-- ============================================================
CREATE TABLE purchase_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE,
  item_name TEXT,
  supplier_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  invoice_url TEXT,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'purchased', 'settled')),
  specialist_name TEXT, -- Procurement specialist
  manager_name TEXT,
  petty_cash_amount NUMERIC(10,2) DEFAULT 0,
  petty_cash_spent NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Purchase orders view policy" ON purchase_orders FOR SELECT USING (true);
CREATE POLICY "Purchase orders insert policy" ON purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Purchase orders update policy" ON purchase_orders FOR UPDATE USING (true);

-- ============================================================
-- 23. IT TICKETS TABLE
-- ============================================================
CREATE TABLE it_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  department TEXT,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  assigned_to TEXT, -- IT Employee Name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE it_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "IT tickets view policy" ON it_tickets FOR SELECT USING (true);
CREATE POLICY "IT tickets insert policy" ON it_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "IT tickets update policy" ON it_tickets FOR UPDATE USING (true);

-- ============================================================
-- ALTER USERS TABLE CONSTRAINTS
-- ============================================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- We allow any string for department and role now to support new departments and roles without breaking the DB.

-- ============================================================
-- 24. CRM & SALES TABLE
-- ============================================================
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_by TEXT, -- Sales Rep Name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 25. QUALITY CONTROL (QC) TABLE
-- ============================================================
CREATE TABLE qc_inspections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference_type TEXT CHECK (reference_type IN ('incoming_material', 'finished_product')),
  reference_id UUID, -- Can be purchase_order_id or production_batch_id
  item_name TEXT NOT NULL,
  inspector_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'conditional_approval')),
  notes TEXT,
  inspection_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 26. MAINTENANCE MANAGEMENT TABLE
-- ============================================================
CREATE TABLE machines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  location TEXT,
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'down', 'under_maintenance')),
  last_maintenance_date DATE,
  next_maintenance_date DATE
);

CREATE TABLE maintenance_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  technician_name TEXT,
  issue_description TEXT,
  action_taken TEXT,
  parts_used TEXT, -- Could be linked to inventory_transactions
  cost NUMERIC(10,2) DEFAULT 0,
  date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 27. FLEET & LOGISTICS TABLE
-- ============================================================
CREATE TABLE fleet_vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plate_number TEXT UNIQUE NOT NULL,
  model TEXT,
  type TEXT,
  driver_name TEXT,
  license_expiry DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_repair', 'out_of_service'))
);

-- ============================================================
-- 28. GENERAL LEDGER (FINANCE) TABLE
-- ============================================================
CREATE TABLE general_ledger (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  account_type TEXT CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_name TEXT NOT NULL,
  description TEXT,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  reference_type TEXT, -- e.g., 'payroll', 'purchase_order', 'sales_order'
  reference_id UUID,
  recorded_by TEXT
);


-- ============================================================
-- 18. LATE DEDUCTIONS (Attendance Sub-module)
-- ============================================================
CREATE TABLE IF NOT EXISTS late_deductions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  delay_minutes INTEGER NOT NULL,
  deduction_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE late_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Late deductions select" ON late_deductions FOR SELECT USING (true);
CREATE POLICY "Late deductions insert" ON late_deductions FOR INSERT WITH CHECK (true);
CREATE POLICY "Late deductions update" ON late_deductions FOR UPDATE USING (true);
CREATE POLICY "Late deductions delete" ON late_deductions FOR DELETE USING (true);

