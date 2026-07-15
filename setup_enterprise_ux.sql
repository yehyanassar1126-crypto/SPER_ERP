-- ==========================================
-- Enterprise UX Database Updates
-- ==========================================

-- 1. Create Audit Log Table for the "Activity Timeline" Feature
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Realtime on audit_log so the timeline can update automatically
alter publication supabase_realtime add table audit_log;
