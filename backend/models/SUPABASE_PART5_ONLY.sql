-- ============================================================
-- SAFE VERSION - بدون Foreign Keys - مضمون يشتغل
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID,
  employee_name TEXT,
  reviewer_id UUID,
  reviewer_name TEXT,
  review_period TEXT NOT NULL,
  overall_rating INTEGER,
  attendance_score INTEGER,
  quality_score INTEGER,
  teamwork_score INTEGER,
  initiative_score INTEGER,
  communication_score INTEGER,
  strengths TEXT,
  improvements TEXT,
  goals TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  trainer TEXT,
  course_type TEXT DEFAULT 'internal',
  department TEXT,
  start_date DATE,
  end_date DATE,
  max_participants INTEGER DEFAULT 20,
  location TEXT,
  status TEXT DEFAULT 'planned',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID,
  employee_id UUID,
  employee_name TEXT,
  status TEXT DEFAULT 'enrolled',
  score NUMERIC(5,2),
  certificate_url TEXT,
  feedback TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name TEXT NOT NULL,
  asset_type TEXT,
  serial_number TEXT,
  assigned_to UUID,
  assigned_to_name TEXT,
  assigned_by UUID,
  assigned_date DATE DEFAULT CURRENT_DATE,
  return_date DATE,
  condition_on_assign TEXT DEFAULT 'new',
  condition_on_return TEXT,
  status TEXT DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_warnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID,
  employee_name TEXT,
  warning_type TEXT,
  reason TEXT NOT NULL,
  incident_date DATE,
  issued_by UUID,
  issued_by_name TEXT,
  deduction_amount NUMERIC(10,2) DEFAULT 0,
  deduction_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  employee_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  budget_type TEXT DEFAULT 'operational',
  allocated_amount NUMERIC(14,2) DEFAULT 0,
  spent_amount NUMERIC(14,2) DEFAULT 0,
  remaining_amount NUMERIC(14,2) DEFAULT 0,
  approved_by UUID,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
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
  created_by UUID,
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
  rating INTEGER,
  feedback_type TEXT DEFAULT 'general',
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  assigned_to UUID,
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "performance_reviews_all" ON performance_reviews;
CREATE POLICY "performance_reviews_all" ON performance_reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "training_courses_all" ON training_courses;
CREATE POLICY "training_courses_all" ON training_courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "training_enrollments_all" ON training_enrollments;
CREATE POLICY "training_enrollments_all" ON training_enrollments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "asset_assignments_all" ON asset_assignments;
CREATE POLICY "asset_assignments_all" ON asset_assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "employee_warnings_all" ON employee_warnings;
CREATE POLICY "employee_warnings_all" ON employee_warnings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "department_budgets_all" ON department_budgets;
CREATE POLICY "department_budgets_all" ON department_budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notification_preferences_all" ON notification_preferences;
CREATE POLICY "notification_preferences_all" ON notification_preferences FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "saved_reports_all" ON saved_reports;
CREATE POLICY "saved_reports_all" ON saved_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "customer_feedback_all" ON customer_feedback;
CREATE POLICY "customer_feedback_all" ON customer_feedback FOR ALL USING (true) WITH CHECK (true);
