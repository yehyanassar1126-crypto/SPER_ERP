-- =============================================
-- Migration 012: Centralized Permissions + User Language + AI Reports
-- SAFE TO RUN MULTIPLE TIMES (idempotent)
-- =============================================

-- 1. Add preferred_language column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ar';

-- 2. Add module column to screen_permissions for grouping
ALTER TABLE screen_permissions ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE screen_permissions ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Permission Templates (role-based defaults for quick assignment)
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  action TEXT NOT NULL,
  granted BOOLEAN DEFAULT true,
  module TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, screen_id, action)
);

CREATE INDEX IF NOT EXISTS idx_perm_template_role ON permission_templates(role);

ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permission_templates_all" ON permission_templates;
CREATE POLICY "permission_templates_all" ON permission_templates FOR ALL USING (true) WITH CHECK (true);

-- 4. AI Reports table
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_by_name TEXT,
  report_year INTEGER,
  report_month INTEGER,
  report_half INTEGER,
  from_date DATE,
  to_date DATE,
  status TEXT DEFAULT 'generated',
  language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_reports_unique 
  ON ai_reports(report_type, period, report_year) 
  WHERE report_type != 'custom';

CREATE INDEX IF NOT EXISTS idx_ai_reports_type ON ai_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_ai_reports_year ON ai_reports(report_year);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created ON ai_reports(created_at DESC);

ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_reports_all" ON ai_reports;
CREATE POLICY "ai_reports_all" ON ai_reports FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed default permission templates for common roles

-- Employee basic screens
INSERT INTO permission_templates (role, screen_id, action, module, granted) VALUES
  ('employee', 'dashboard', 'view', 'overview', true),
  ('employee', 'hr-personal', 'view', 'my-info', true),
  ('employee', 'my-attendance', 'view', 'my-info', true),
  ('employee', 'scan-checkin', 'view', 'my-info', true),
  ('employee', 'scan-checkout', 'view', 'my-info', true),
  ('employee', 'my-leaves', 'view', 'my-info', true),
  ('employee', 'my-leaves', 'create', 'my-info', true),
  ('employee', 'my-salary', 'view', 'my-info', true),
  ('employee', 'my-overtime', 'view', 'my-info', true),
  ('employee', 'my-loans', 'view', 'my-info', true),
  ('employee', 'my-medical', 'view', 'my-info', true),
  ('employee', 'my-medical', 'create', 'my-info', true),
  ('employee', 'my-delays', 'view', 'my-info', true),
  ('employee', 'my-missions', 'view', 'my-info', true),
  ('employee', 'my-missions', 'create', 'my-info', true),
  ('employee', 'my-expenses', 'view', 'my-info', true),
  ('employee', 'my-expenses', 'create', 'my-info', true),
  ('employee', 'complaints', 'view', 'my-info', true),
  ('employee', 'complaints', 'create', 'my-info', true),
  ('employee', 'announcements', 'view', 'communication', true),
  ('employee', 'internal-chat', 'view', 'communication', true),
  ('employee', 'internal-chat', 'create', 'communication', true),
  ('employee', 'shift-swap', 'view', 'workplace', true),
  ('employee', 'calendar', 'view', 'workplace', true),
  ('employee', 'task-management', 'view', 'workplace', true)
ON CONFLICT (role, screen_id, action) DO NOTHING;

-- HR Manager gets everything
INSERT INTO permission_templates (role, screen_id, action, module, granted)
SELECT 'hr manager', s.screen_id, a.action, 'all', true
FROM (VALUES 
  ('dashboard'),('hr-personal'),('my-attendance'),('scan-checkin'),('scan-checkout'),
  ('my-leaves'),('my-salary'),('my-overtime'),('my-loans'),('my-medical'),('my-delays'),
  ('my-missions'),('my-expenses'),('employees'),('attendance'),('leaves'),('absence-leave'),
  ('shifts'),('overtime'),('all-delays'),('all-missions'),('employee-warnings'),('asset-assignment'),
  ('payroll'),('payroll-funding'),('hr-adjustments'),('recruitment'),('hr-ats'),('documents'),
  ('performance'),('uniforms'),('loans'),('expenses'),('complaints'),('medical-requests'),
  ('nursing-medical-approvals'),('offboarding'),('training'),('performance-reviews'),
  ('hr-qr-generator'),('announcements'),('internal-chat'),('org-directory'),('shift-swap'),
  ('calendar'),('task-management'),('ai-mind'),('reports'),('kpi-dashboard'),('audit-log'),
  ('login-history'),('activity-log-page'),('document-management'),('approval-workflows'),
  ('global-search'),('supplier-performance'),('screen-permissions'),('notification-settings'),
  ('system-settings'),('inventory'),('purchase-requests'),('petty-cash'),('financial-reports'),
  ('chart-of-accounts'),('erp-suppliers'),('supplier-portal'),('erp-sales'),('erp-products'),
  ('customer-requests'),('driver-payments'),('friday-work'),('team-adjustments')
) AS s(screen_id)
CROSS JOIN (VALUES ('view'),('create'),('edit'),('delete'),('approve'),('reject'),('export'),('print')) AS a(action)
ON CONFLICT (role, screen_id, action) DO NOTHING;

-- 6. Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_reports_updated_at ON ai_reports;
CREATE TRIGGER update_ai_reports_updated_at
  BEFORE UPDATE ON ai_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Realtime on screen_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'screen_permissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE screen_permissions;
  END IF;
END $$;
