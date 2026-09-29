-- =============================================
-- Migration 011: Screen Permissions (Routing ACL)
-- =============================================

CREATE TABLE IF NOT EXISTS screen_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,
  screen_id TEXT NOT NULL,
  action TEXT NOT NULL,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, screen_id, action),
  UNIQUE(role, screen_id, action)
);

CREATE INDEX IF NOT EXISTS idx_screen_perm_user ON screen_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_screen_perm_role ON screen_permissions(role);

ALTER TABLE screen_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screen_permissions_all" ON screen_permissions FOR ALL USING (true) WITH CHECK (true);
