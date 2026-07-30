-- ===== AI ERP Database Migration =====
-- Run this in Supabase SQL Editor

-- AI Analysis Cache
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL,
  department TEXT,
  data JSONB,
  insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- AI Predictions Log
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_type TEXT NOT NULL,
  department TEXT,
  title TEXT NOT NULL,
  description TEXT,
  confidence DECIMAL(5,2),
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Fraud Alerts
CREATE TABLE IF NOT EXISTS ai_fraud_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'high',
  description TEXT NOT NULL,
  related_table TEXT,
  related_id UUID,
  details JSONB,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Reports (Auto-generated)
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB,
  period TEXT,
  department TEXT,
  generated_for UUID REFERENCES users(id),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat History
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  response TEXT,
  query_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Notifications (enhanced)
CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT,
  cause TEXT,
  impact TEXT,
  solution TEXT,
  priority TEXT DEFAULT 'medium',
  department TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Language Preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ar';

-- RLS Policies
ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON ai_analysis_cache FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ai_predictions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ai_fraud_alerts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ai_reports FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ai_chat_history FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON smart_notifications FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_fraud_status ON ai_fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user ON ai_reports(generated_for);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notif_user ON smart_notifications(user_id);
