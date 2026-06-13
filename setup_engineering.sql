-- ============================================================
-- Engineering Department Schema (الإدارة الهندسية)
-- ============================================================

CREATE TABLE IF NOT EXISTS engineering_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  engineer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  project_type TEXT CHECK (project_type IN ('civil', 'electrical', 'mechanical', 'production_line', 'other')),
  description TEXT,
  technical_specs TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'designing', 'in_progress', 'supervision', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engineering_drawings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES engineering_projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
  uploader_name TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE engineering_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_drawings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-run)
DROP POLICY IF EXISTS "eng_projects_view" ON engineering_projects;
DROP POLICY IF EXISTS "eng_projects_insert" ON engineering_projects;
DROP POLICY IF EXISTS "eng_projects_update" ON engineering_projects;

DROP POLICY IF EXISTS "eng_drawings_view" ON engineering_drawings;
DROP POLICY IF EXISTS "eng_drawings_insert" ON engineering_drawings;
DROP POLICY IF EXISTS "eng_drawings_update" ON engineering_drawings;

-- Create Policies
CREATE POLICY "eng_projects_view" ON engineering_projects FOR SELECT USING (true);
CREATE POLICY "eng_projects_insert" ON engineering_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "eng_projects_update" ON engineering_projects FOR UPDATE USING (true);

CREATE POLICY "eng_drawings_view" ON engineering_drawings FOR SELECT USING (true);
CREATE POLICY "eng_drawings_insert" ON engineering_drawings FOR INSERT WITH CHECK (true);
CREATE POLICY "eng_drawings_update" ON engineering_drawings FOR UPDATE USING (true);
