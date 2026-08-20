-- =============================================
-- Migration 010: Bilingual Labels + Chat Attachments
-- =============================================

-- Add bilingual labels to key tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position_ar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_ar TEXT;

-- Products bilingual
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Inventory bilingual
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category_ar TEXT;

-- Suppliers bilingual
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_name_ar TEXT;

-- Equipment bilingual
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS location_ar TEXT;

-- BOM bilingual
ALTER TABLE bom ADD COLUMN IF NOT EXISTS name_ar TEXT;

-- Maintenance companies bilingual
ALTER TABLE maintenance_companies ADD COLUMN IF NOT EXISTS name_ar TEXT;

-- Chat attachments table
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID,
  conversation_id UUID,
  sender_id UUID REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications enhancement for push
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'system';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- Enable RLS
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "allow_all_chat_attachments" ON chat_attachments;
    CREATE POLICY "allow_all_chat_attachments" ON chat_attachments FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping chat_attachments policy: %', SQLERRM;
  END;
END $$;
