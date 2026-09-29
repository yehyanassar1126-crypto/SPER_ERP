-- Add workflow_approvals column to track department approvals
ALTER TABLE engineering_projects ADD COLUMN IF NOT EXISTS workflow_approvals JSONB DEFAULT '{}'::jsonb;
