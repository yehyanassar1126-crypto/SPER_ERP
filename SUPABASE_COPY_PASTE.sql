-- ============================================================
-- شغل الكود ده كله مره واحده على Supabase SQL Editor
-- ENTERPRISE ERP DATABASE UPGRADE - ALL IN ONE
-- ============================================================


-- ======================== PART 1: SECURITY ========================

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


-- ======================== PART 2: MULTI-COMPANY ========================

CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  tax_id TEXT,
  commercial_register TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO companies (name, name_ar) VALUES ('Main Company','الشركة الرئيسية') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  symbol TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);
INSERT INTO currencies (code, name_en, name_ar, symbol, is_default) VALUES
('EGP','Egyptian Pound','جنيه مصري','ج.م',true),
('USD','US Dollar','دولار أمريكي','$',false),
('EUR','Euro','يورو','€',false),
('SAR','Saudi Riyal','ريال سعودي','ر.س',false)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(14,6) NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exchange_date ON exchange_rates(effective_date);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  module TEXT DEFAULT 'general',
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO system_settings (setting_key, setting_value, module, description) VALUES
('company_name','Ninja Factory','general','اسم الشركة'),
('default_currency','EGP','finance','العملة الافتراضية'),
('fiscal_year_start','01-01','finance','بداية السنة المالية'),
('overtime_rate','1.5','hr','معدل الأوفرتايم'),
('friday_rate','2.0','hr','معدل عمل الجمعة'),
('late_deduction_per_minute','0','hr','خصم التأخير بالدقيقة'),
('max_login_attempts','5','security','محاولات تسجيل دخول'),
('session_timeout_hours','24','security','مهلة الجلسة'),
('enable_2fa','false','security','تفعيل المصادقة الثنائية'),
('backup_frequency','daily','system','تكرار النسخ الاحتياطي')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_all" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "branches_all" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "currencies_all" ON currencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "exchange_rates_all" ON exchange_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "system_settings_all" ON system_settings FOR ALL USING (true) WITH CHECK (true);


-- ======================== PART 3: FEATURES ========================

CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_role TEXT,
  approver_id UUID REFERENCES users(id),
  approval_type TEXT DEFAULT 'any' CHECK (approval_type IN ('any','all','specific')),
  auto_approve_after_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES approval_workflows(id),
  current_step INTEGER DEFAULT 1,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  requested_by UUID REFERENCES users(id),
  requested_by_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS approval_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order INTEGER,
  action TEXT CHECK (action IN ('approve','reject','return')),
  acted_by UUID REFERENCES users(id),
  acted_by_name TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  parent_id UUID REFERENCES document_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category_id UUID REFERENCES document_categories(id),
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  module TEXT,
  entity_type TEXT,
  entity_id UUID,
  tags TEXT[],
  uploaded_by UUID REFERENCES users(id),
  uploaded_by_name TEXT,
  version INTEGER DEFAULT 1,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_module ON documents(module);
CREATE INDEX IF NOT EXISTS idx_docs_entity ON documents(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  module TEXT,
  entity_type TEXT,
  entity_id UUID,
  assigned_to UUID REFERENCES users(id),
  assigned_to_name TEXT,
  assigned_by UUID REFERENCES users(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting','deadline','holiday','reminder','other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  organizer_id UUID REFERENCES users(id),
  attendees UUID[],
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_org ON calendar_events(organizer_id);

CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  channel_type TEXT DEFAULT 'direct' CHECK (channel_type IN ('direct','group','department')),
  members UUID[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_name TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','file','image','system')),
  file_url TEXT,
  is_read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_date ON chat_messages(created_at);

CREATE TABLE IF NOT EXISTS digital_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  signature_data TEXT,
  ip_address TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret_key TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables TEXT[],
  module TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_workflows_all" ON approval_workflows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "approval_steps_all" ON approval_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "approval_requests_all" ON approval_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "approval_actions_all" ON approval_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "document_categories_all" ON document_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "documents_all" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "calendar_events_all" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "chat_channels_all" ON chat_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "chat_messages_all" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "digital_signatures_all" ON digital_signatures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "webhooks_all" ON webhooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "email_templates_all" ON email_templates FOR ALL USING (true) WITH CHECK (true);


-- ======================== PART 4: KPIs & VIEWS ========================

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  module TEXT NOT NULL,
  formula TEXT,
  unit TEXT DEFAULT 'number',
  target_value NUMERIC(14,2),
  warning_threshold NUMERIC(14,2),
  danger_threshold NUMERIC(14,2),
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('daily','weekly','monthly','quarterly','yearly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  actual_value NUMERIC(14,2),
  department TEXT,
  branch_id UUID,
  recorded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kpi_values_period ON kpi_values(period);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi ON kpi_values(kpi_id);

CREATE TABLE IF NOT EXISTS import_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT,
  module TEXT NOT NULL,
  total_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  errors JSONB,
  imported_by UUID REFERENCES users(id),
  imported_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT CHECK (backup_type IN ('full','incremental','manual')),
  file_path TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success','failed','in_progress')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO kpi_definitions (name, name_ar, module, unit, target_value) VALUES
('Employee Attendance Rate','معدل حضور الموظفين','hr','percentage',95),
('Average Late Minutes','متوسط دقائق التأخير','hr','minutes',10),
('Leave Utilization','استخدام الإجازات','hr','percentage',80),
('Revenue per Employee','الإيراد لكل موظف','finance','currency',50000),
('Inventory Turnover','دوران المخزون','inventory','number',12),
('Order Fulfillment Rate','معدل تلبية الطلبات','sales','percentage',95),
('Production Efficiency','كفاءة الإنتاج','production','percentage',85),
('Quality Pass Rate','معدل نجاح الجودة','quality','percentage',98),
('Maintenance Response Time','وقت استجابة الصيانة','maintenance','hours',4),
('Customer Satisfaction','رضا العملاء','sales','percentage',90)
ON CONFLICT DO NOTHING;

-- Views
CREATE OR REPLACE VIEW v_employee_summary AS
SELECT 
  u.id, u.employee_id, u.full_name, u.email, u.role, u.department,
  u.position, u.base_salary, u.shift, u.status, u.hire_date,
  u.annual_leave_balance, u.insurance_active,
  COALESCE(att.present_days, 0) as present_this_month,
  COALESCE(att.total_delay, 0) as total_delay_this_month,
  COALESCE(lv.pending_leaves, 0) as pending_leaves,
  COALESCE(ln.active_loans, 0) as active_loans,
  COALESCE(ln.total_remaining, 0) as total_loan_remaining
FROM users u
LEFT JOIN (
  SELECT employee_id, 
    COUNT(*) FILTER (WHERE status IN ('present','checked_in')) as present_days,
    SUM(delay_minutes) as total_delay
  FROM attendance WHERE date >= date_trunc('month', CURRENT_DATE)
  GROUP BY employee_id
) att ON att.employee_id = u.id
LEFT JOIN (
  SELECT employee_id, COUNT(*) as pending_leaves
  FROM leave_requests WHERE status = 'pending'
  GROUP BY employee_id
) lv ON lv.employee_id = u.id
LEFT JOIN (
  SELECT employee_id, COUNT(*) as active_loans, SUM(remaining_amount) as total_remaining
  FROM loans WHERE status = 'active'
  GROUP BY employee_id
) ln ON ln.employee_id = u.id
WHERE u.status = 'active';

CREATE OR REPLACE VIEW v_attendance_monthly AS
SELECT 
  a.employee_id, a.employee_name, a.department,
  to_char(a.date, 'YYYY-MM') as month,
  COUNT(*) FILTER (WHERE a.status IN ('present','checked_in')) as present_days,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent_days,
  COUNT(*) FILTER (WHERE a.status = 'leave') as leave_days,
  SUM(a.working_hours) as total_hours,
  SUM(a.delay_minutes) as total_delay_minutes,
  ROUND(AVG(a.working_hours), 2) as avg_daily_hours
FROM attendance a
GROUP BY a.employee_id, a.employee_name, a.department, to_char(a.date, 'YYYY-MM');

CREATE OR REPLACE VIEW v_inventory_status AS
SELECT 
  i.id, i.name, i.category, i.quantity, i.min_quantity,
  CASE 
    WHEN i.quantity <= 0 THEN 'out_of_stock'
    WHEN i.quantity <= i.min_quantity THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM inventory_items i;

-- Functions
CREATE OR REPLACE FUNCTION fn_log_activity(
  p_user_id UUID, p_user_name TEXT, p_module TEXT, 
  p_action TEXT, p_entity_type TEXT DEFAULT NULL, 
  p_entity_id UUID DEFAULT NULL, p_old JSONB DEFAULT NULL, 
  p_new JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO activity_log (user_id, user_name, module, action, entity_type, entity_id, old_values, new_values)
  VALUES (p_user_id, p_user_name, p_module, p_action, p_entity_type, p_entity_id, p_old, p_new);
END;
$$ LANGUAGE plpgsql;

-- Performance Indexes (safe - only on confirmed tables)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
  CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_payroll_emp_month ON payroll(employee_id, month);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_it_tickets_status ON it_tickets(status);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_purchase_req_status ON purchase_requests(status);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_definitions_all" ON kpi_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "kpi_values_all" ON kpi_values FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "import_logs_all" ON import_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backup_logs_all" ON backup_logs FOR ALL USING (true) WITH CHECK (true);

-- ======================== PART 5: HR+ EXTRAS ========================

CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES users(id),
  employee_name TEXT,
  reviewer_id UUID REFERENCES users(id),
  reviewer_name TEXT,
  review_period TEXT NOT NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  attendance_score INTEGER CHECK (attendance_score BETWEEN 1 AND 5),
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  teamwork_score INTEGER CHECK (teamwork_score BETWEEN 1 AND 5),
  initiative_score INTEGER CHECK (initiative_score BETWEEN 1 AND 5),
  communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
  strengths TEXT,
  improvements TEXT,
  goals TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','reviewed','acknowledged')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perf_employee ON performance_reviews(employee_id);

CREATE TABLE IF NOT EXISTS training_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  trainer TEXT,
  course_type TEXT DEFAULT 'internal' CHECK (course_type IN ('internal','external','online')),
  department TEXT,
  start_date DATE,
  end_date DATE,
  max_participants INTEGER DEFAULT 20,
  location TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','ongoing','completed','cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id),
  employee_name TEXT,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled','attended','completed','absent','cancelled')),
  score NUMERIC(5,2),
  certificate_url TEXT,
  feedback TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('laptop','phone','tablet','vehicle','key','uniform','tool','other')),
  serial_number TEXT,
  assigned_to UUID REFERENCES users(id),
  assigned_to_name TEXT,
  assigned_by UUID REFERENCES users(id),
  assigned_date DATE DEFAULT CURRENT_DATE,
  return_date DATE,
  condition_on_assign TEXT DEFAULT 'new',
  condition_on_return TEXT,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','returned','damaged','lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_asset_employee ON asset_assignments(assigned_to);

CREATE TABLE IF NOT EXISTS employee_warnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES users(id),
  employee_name TEXT,
  warning_type TEXT CHECK (warning_type IN ('verbal','written','final','suspension','termination')),
  reason TEXT NOT NULL,
  incident_date DATE,
  issued_by UUID REFERENCES users(id),
  issued_by_name TEXT,
  deduction_amount NUMERIC(10,2) DEFAULT 0,
  deduction_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','appealed','revoked','expired')),
  employee_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  budget_type TEXT DEFAULT 'operational' CHECK (budget_type IN ('operational','capital','training','maintenance')),
  allocated_amount NUMERIC(14,2) DEFAULT 0,
  spent_amount NUMERIC(14,2) DEFAULT 0,
  remaining_amount NUMERIC(14,2) DEFAULT 0,
  approved_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','active','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department, fiscal_year, budget_type)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  leave_notifications BOOLEAN DEFAULT true,
  attendance_notifications BOOLEAN DEFAULT true,
  payroll_notifications BOOLEAN DEFAULT true,
  task_notifications BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  approval_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  report_type TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  columns JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  order_id UUID,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT DEFAULT 'general' CHECK (feedback_type IN ('general','complaint','suggestion','praise')),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved','closed')),
  assigned_to UUID REFERENCES users(id),
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "performance_reviews_all" ON performance_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_courses_all" ON training_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_enrollments_all" ON training_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "asset_assignments_all" ON asset_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "employee_warnings_all" ON employee_warnings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "department_budgets_all" ON department_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notification_preferences_all" ON notification_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "saved_reports_all" ON saved_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "customer_feedback_all" ON customer_feedback FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! All enterprise tables created (34+ tables total)
-- ============================================================

-- ============================================================
-- 🏥 PART 6: NURSING & FACTORY CLINIC MANAGEMENT HUB
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinic_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  department text,
  visit_type text NOT NULL DEFAULT 'checkup',
  blood_pressure text,
  temperature numeric,
  heart_rate numeric,
  blood_sugar numeric,
  complaint text,
  diagnosis text,
  treatment text,
  medicine_dispensed text,
  medicine_qty numeric DEFAULT 0,
  disposition text DEFAULT 'return_to_work',
  referral_details text,
  notes text,
  attended_by text
);

ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_visits" ON public.clinic_visits;
CREATE POLICY "Enable all for clinic_visits" ON public.clinic_visits FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.clinic_injuries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  incident_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  department text,
  location text,
  severity text NOT NULL DEFAULT 'minor',
  injury_type text NOT NULL,
  description text NOT NULL,
  root_cause text,
  immediate_action text,
  hospitalized boolean DEFAULT false,
  hospital_name text,
  lost_work_days numeric DEFAULT 0,
  supervisor_notified text,
  status text DEFAULT 'under_treatment',
  investigation_notes text,
  logged_by text
);

ALTER TABLE public.clinic_injuries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_injuries" ON public.clinic_injuries;
CREATE POLICY "Enable all for clinic_injuries" ON public.clinic_injuries FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.clinic_rest_permits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  department text,
  permit_type text DEFAULT 'clinic_rest',
  start_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_time timestamp with time zone,
  duration text,
  diagnosis text,
  gate_pass_authorized boolean DEFAULT false,
  status text DEFAULT 'active',
  returned_at timestamp with time zone,
  issued_by text,
  notes text
);

ALTER TABLE public.clinic_rest_permits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_rest_permits" ON public.clinic_rest_permits;
CREATE POLICY "Enable all for clinic_rest_permits" ON public.clinic_rest_permits FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.clinic_medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  generic_name text,
  category text NOT NULL DEFAULT 'first_aid',
  unit text NOT NULL DEFAULT 'Box',
  current_stock numeric NOT NULL DEFAULT 0,
  min_threshold numeric NOT NULL DEFAULT 5,
  expiry_date date,
  batch_no text,
  location text,
  notes text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clinic_medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_medications" ON public.clinic_medications;
CREATE POLICY "Enable all for clinic_medications" ON public.clinic_medications FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.clinic_dispense_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  medication_id uuid REFERENCES public.clinic_medications(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  reason text,
  visit_id uuid REFERENCES public.clinic_visits(id) ON DELETE SET NULL,
  dispensed_by text
);

ALTER TABLE public.clinic_dispense_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_dispense_logs" ON public.clinic_dispense_logs;
CREATE POLICY "Enable all for clinic_dispense_logs" ON public.clinic_dispense_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.medical_requests ADD COLUMN IF NOT EXISTS rejection_reason text;

