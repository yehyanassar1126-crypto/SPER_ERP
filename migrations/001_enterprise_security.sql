-- ============================================================
-- ENTERPRISE MIGRATION 001: Security & Auth Tables
-- ============================================================

-- 1. LOGIN HISTORY
CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  login_status TEXT CHECK (login_status IN ('success','failed','locked')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_date ON login_history(created_at);

-- 2. ACTIVITY LOG (detailed audit)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_module ON activity_log(module);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);

-- 3. PERMISSIONS SYSTEM
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  UNIQUE(role, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_perm_role ON role_permissions(role);

-- 4. SESSION MANAGEMENT
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  refresh_token_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);

-- 5. SEED DEFAULT PERMISSIONS
INSERT INTO permissions (module, action, description_en, description_ar) VALUES
('employees','view','View Employees','عرض الموظفين'),
('employees','create','Create Employee','إضافة موظف'),
('employees','edit','Edit Employee','تعديل موظف'),
('employees','delete','Delete Employee','حذف موظف'),
('attendance','view','View Attendance','عرض الحضور'),
('attendance','manage','Manage Attendance','إدارة الحضور'),
('leaves','view','View Leaves','عرض الإجازات'),
('leaves','approve','Approve Leaves','اعتماد الإجازات'),
('payroll','view','View Payroll','عرض الرواتب'),
('payroll','process','Process Payroll','تجهيز الرواتب'),
('payroll','approve','Approve Payroll','اعتماد الرواتب'),
('finance','view','View Finance','عرض المالية'),
('finance','transactions','Create Transactions','إنشاء معاملات'),
('finance','approve','Approve Finance','اعتماد مالي'),
('inventory','view','View Inventory','عرض المخازن'),
('inventory','manage','Manage Inventory','إدارة المخازن'),
('sales','view','View Sales','عرض المبيعات'),
('sales','create','Create Sales Order','إنشاء أمر بيع'),
('procurement','view','View Procurement','عرض المشتريات'),
('procurement','create','Create PO','إنشاء أمر شراء'),
('procurement','approve','Approve PO','اعتماد أمر شراء'),
('production','view','View Production','عرض الإنتاج'),
('production','manage','Manage Production','إدارة الإنتاج'),
('quality','view','View Quality','عرض الجودة'),
('quality','inspect','QC Inspect','فحص الجودة'),
('maintenance','view','View Maintenance','عرض الصيانة'),
('maintenance','manage','Manage Maintenance','إدارة الصيانة'),
('reports','view','View Reports','عرض التقارير'),
('reports','export','Export Reports','تصدير التقارير'),
('settings','view','View Settings','عرض الإعدادات'),
('settings','manage','Manage Settings','إدارة الإعدادات'),
('audit','view','View Audit Log','عرض سجل المراجعة')
ON CONFLICT (module, action) DO NOTHING;

-- RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_history_all" ON login_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "activity_log_all" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "permissions_all" ON permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "role_permissions_all" ON role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_sessions_all" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
