-- ==========================================
-- نظام إدارة الغياب والإجازات (Absence & Leave Workflow)
-- ==========================================

-- 1. جدول طلبات الإجازة والغياب
CREATE TABLE IF NOT EXISTS hr_absence_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL, -- references users(id)
    employee_name VARCHAR(255),
    department VARCHAR(100),
    manager_name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL, -- sick, casual, annual, emergency, unpaid
    reason TEXT,
    emergency_flag BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending_manager', -- pending_manager, rejected_manager, pending_hr, approved, rejected_hr
    manager_notes TEXT,
    hr_notes TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. جدول سجلات الغياب والخصومات
CREATE TABLE IF NOT EXISTS hr_absence_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255),
    date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'unauthorized', -- unauthorized, authorized_paid, authorized_unpaid
    penalty_days DECIMAL(10,2) DEFAULT 2.0,
    hr_decision VARCHAR(50) DEFAULT 'deduct_2', -- deduct_2, deduct_1, casual_leave, unpaid_leave, cancelled
    status VARCHAR(50) DEFAULT 'applied', -- applied, overridden
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. جدول الإنذارات والمخالفات
CREATE TABLE IF NOT EXISTS hr_violations_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255),
    department VARCHAR(100),
    warning_level VARCHAR(50), -- first_warning, final_warning, termination
    reason TEXT,
    consecutive_days INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'new', -- new, reviewed, action_taken
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. سجل المراجعة (Audit Log) الخاص بالغياب
CREATE TABLE IF NOT EXISTS hr_absence_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID,
    table_name VARCHAR(50),
    action VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. إعدادات النظام
CREATE TABLE IF NOT EXISTS hr_absence_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL
);

INSERT INTO hr_absence_settings (setting_key, setting_value) VALUES
('advance_notice_days', '1'),
('default_penalty_days', '2'),
('consecutive_days_for_warning', '3')
ON CONFLICT (setting_key) DO NOTHING;

-- RLS Policies
ALTER TABLE hr_absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_absence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_violations_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_absence_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_absence_settings ENABLE ROW LEVEL SECURITY;

-- السماح للكل بالقراءة والكتابة (بما أن التحكم يتم عبر الـ Frontend حسب دور المستخدم)
CREATE POLICY "hr_absence_requests_all" ON hr_absence_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hr_absence_records_all" ON hr_absence_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hr_violations_warnings_all" ON hr_violations_warnings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hr_absence_audit_all" ON hr_absence_audit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hr_absence_settings_all" ON hr_absence_settings FOR ALL USING (true) WITH CHECK (true);
