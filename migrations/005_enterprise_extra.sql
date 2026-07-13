-- ============================================================
-- ENTERPRISE MIGRATION 005: Additional Enterprise Tables
-- ضيف الكود ده على Supabase بعد الكود الأول
-- ============================================================

-- 1. PERFORMANCE REVIEWS (تقييم الأداء)
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
CREATE INDEX IF NOT EXISTS idx_perf_period ON performance_reviews(review_period);

-- 2. TRAINING & DEVELOPMENT (التدريب والتطوير)
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

-- 3. ASSET ASSIGNMENT (تسليم العهد والأجهزة)
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

-- 4. EMPLOYEE WARNINGS (الإنذارات والجزاءات)
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
CREATE INDEX IF NOT EXISTS idx_warning_employee ON employee_warnings(employee_id);

-- 5. DEPARTMENT BUDGETS (ميزانيات الأقسام)
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

-- 6. NOTIFICATION PREFERENCES (تفضيلات الإشعارات)
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
  announcement_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SAVED REPORTS (تقارير محفوظة)
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

-- 8. CUSTOMER FEEDBACK (ملاحظات العملاء)
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
-- DONE! Additional enterprise tables created
-- ============================================================
