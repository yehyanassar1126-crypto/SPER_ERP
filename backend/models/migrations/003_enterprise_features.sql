-- ============================================================
-- ENTERPRISE MIGRATION 003: Workflow, Documents, Tasks, Chat
-- ============================================================

-- 1. DYNAMIC APPROVAL WORKFLOWS
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

-- 2. DOCUMENT MANAGEMENT
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

-- 3. TASK MANAGEMENT
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

-- 4. CALENDAR
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

-- 5. INTERNAL CHAT
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

-- 6. DIGITAL SIGNATURES
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

-- 7. WEBHOOKS
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

-- 8. EMAIL TEMPLATES
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

-- RLS for all new tables
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
