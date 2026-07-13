-- ============================================================
-- ENTERPRISE MIGRATION 004: KPIs, Views, Functions
-- ============================================================

-- 1. KPI DEFINITIONS
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

-- 2. IMPORT/EXPORT LOGS
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

-- 3. BACKUP LOGS
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

-- SEED DEFAULT KPIs
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

-- ============================================================
-- 4. DATABASE VIEWS
-- ============================================================

-- Employee Summary View
CREATE OR REPLACE VIEW v_employee_summary AS
SELECT 
  u.id,
  u.employee_id,
  u.full_name,
  u.email,
  u.role,
  u.department,
  u.position,
  u.base_salary,
  u.shift,
  u.status,
  u.hire_date,
  u.annual_leave_balance,
  u.insurance_active,
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
  FROM attendance 
  WHERE date >= date_trunc('month', CURRENT_DATE)
  GROUP BY employee_id
) att ON att.employee_id = u.id
LEFT JOIN (
  SELECT employee_id, COUNT(*) as pending_leaves
  FROM leave_requests WHERE status = 'pending'
  GROUP BY employee_id
) lv ON lv.employee_id = u.id
LEFT JOIN (
  SELECT employee_id, 
    COUNT(*) as active_loans,
    SUM(remaining_amount) as total_remaining
  FROM loans WHERE status = 'active'
  GROUP BY employee_id
) ln ON ln.employee_id = u.id
WHERE u.status = 'active';

-- Monthly Attendance View
CREATE OR REPLACE VIEW v_attendance_monthly AS
SELECT 
  a.employee_id,
  a.employee_name,
  a.department,
  to_char(a.date, 'YYYY-MM') as month,
  COUNT(*) FILTER (WHERE a.status IN ('present','checked_in')) as present_days,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent_days,
  COUNT(*) FILTER (WHERE a.status = 'leave') as leave_days,
  SUM(a.working_hours) as total_hours,
  SUM(a.delay_minutes) as total_delay_minutes,
  ROUND(AVG(a.working_hours), 2) as avg_daily_hours
FROM attendance a
GROUP BY a.employee_id, a.employee_name, a.department, to_char(a.date, 'YYYY-MM');

-- Inventory Status View
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT 
  i.id,
  i.name,
  i.category,
  i.quantity,
  i.min_quantity,
  i.warehouse_type,
  i.life_time_percentage,
  CASE 
    WHEN i.quantity <= 0 THEN 'out_of_stock'
    WHEN i.quantity <= i.min_quantity THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  COALESCE(tx_in.total_in, 0) as total_received_this_month,
  COALESCE(tx_out.total_out, 0) as total_issued_this_month
FROM inventory_items i
LEFT JOIN (
  SELECT item_id, SUM(quantity) as total_in
  FROM inventory_transactions 
  WHERE transaction_type = 'in' AND date >= date_trunc('month', CURRENT_DATE)
  GROUP BY item_id
) tx_in ON tx_in.item_id = i.id
LEFT JOIN (
  SELECT item_id, SUM(quantity) as total_out
  FROM inventory_transactions 
  WHERE transaction_type = 'out' AND date >= date_trunc('month', CURRENT_DATE)
  GROUP BY item_id
) tx_out ON tx_out.item_id = i.id;

-- ============================================================
-- 5. DATABASE FUNCTIONS
-- ============================================================

-- Auto Document Number Generator
CREATE OR REPLACE FUNCTION fn_next_doc_number(p_doc_type TEXT)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_number INTEGER;
  v_result TEXT;
BEGIN
  UPDATE doc_sequences 
  SET last_number = last_number + 1 
  WHERE doc_type = p_doc_type
  RETURNING prefix, last_number INTO v_prefix, v_number;
  
  IF NOT FOUND THEN
    INSERT INTO doc_sequences (doc_type, prefix, last_number) 
    VALUES (p_doc_type, p_doc_type || '-', 1)
    RETURNING prefix, last_number INTO v_prefix, v_number;
  END IF;
  
  v_result := v_prefix || LPAD(v_number::TEXT, 6, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Log Activity Function
CREATE OR REPLACE FUNCTION fn_log_activity(
  p_user_id UUID, p_user_name TEXT, p_module TEXT, 
  p_action TEXT, p_entity_type TEXT DEFAULT NULL, 
  p_entity_id UUID DEFAULT NULL, p_old JSONB DEFAULT NULL, 
  p_new JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_log (user_id, user_name, module, action, entity_type, entity_id, old_values, new_values)
  VALUES (p_user_id, p_user_name, p_module, p_action, p_entity_type, p_entity_id, p_old, p_new);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_emp_month ON payroll(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_medical_status ON medical_requests(status);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_it_tickets_status ON it_tickets(status);
CREATE INDEX IF NOT EXISTS idx_purchase_req_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_qc_status ON qc_inspections(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_logs(date);
CREATE INDEX IF NOT EXISTS idx_gl_date ON general_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_gl_type ON general_ledger(account_type);

-- RLS for new tables
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_definitions_all" ON kpi_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "kpi_values_all" ON kpi_values FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "import_logs_all" ON import_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backup_logs_all" ON backup_logs FOR ALL USING (true) WITH CHECK (true);
