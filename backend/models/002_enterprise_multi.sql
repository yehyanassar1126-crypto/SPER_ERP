-- ============================================================
-- ENTERPRISE MIGRATION 002: Multi-Company, Branch, Currency
-- ============================================================

-- 1. COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  tax_id TEXT,
  commercial_register TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO companies (name, name_ar) VALUES ('Main Company','الشركة الرئيسية') ON CONFLICT DO NOTHING;

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CURRENCIES
CREATE TABLE IF NOT EXISTS currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  symbol TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);
INSERT INTO currencies (code, name_en, name_ar, symbol, is_default) VALUES
('EGP','Egyptian Pound','جنيه مصري','ج.م',true),
('USD','US Dollar','دولار أمريكي','$',false),
('EUR','Euro','يورو','€',false),
('SAR','Saudi Riyal','ريال سعودي','ر.س',false)
ON CONFLICT (code) DO NOTHING;

-- 4. EXCHANGE RATES
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(14,6) NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exchange_date ON exchange_rates(effective_date);

-- 5. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  module TEXT DEFAULT 'general',
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO system_settings (setting_key, setting_value, module, description) VALUES
('company_name','Ninja Factory','general','اسم الشركة'),
('default_currency','EGP','finance','العملة الافتراضية'),
('fiscal_year_start','01-01','finance','بداية السنة المالية'),
('overtime_rate','1.5','hr','معدل الأوفرتايم'),
('friday_rate','2.0','hr','معدل عمل الجمعة'),
('late_deduction_per_minute','0','hr','خصم التأخير بالدقيقة'),
('max_login_attempts','5','security','محاولات تسجيل دخول'),
('session_timeout_hours','24','security','مهلة الجلسة'),
('enable_2fa','false','security','تفعيل المصادقة الثنائية'),
('backup_frequency','daily','system','تكرار النسخ الاحتياطي')
ON CONFLICT (setting_key) DO NOTHING;

-- Add company_id and branch_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_all" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "branches_all" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "currencies_all" ON currencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "exchange_rates_all" ON exchange_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "system_settings_all" ON system_settings FOR ALL USING (true) WITH CHECK (true);
