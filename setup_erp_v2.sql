-- ERP V2: Chart of Accounts, ATS, Enhanced Inventory
-- Run in Supabase SQL Editor

-- 1. CHART OF ACCOUNTS
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  account_type TEXT CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  parent_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  balance NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coa_all" ON chart_of_accounts FOR ALL USING (true) WITH CHECK (true);

INSERT INTO chart_of_accounts (code, name_en, name_ar, account_type) VALUES
('1000','Cash & Bank','النقدية والبنوك','asset'),
('1001','Main Safe','الخزنة الرئيسية','asset'),
('1002','Bank Account','حساب البنك','asset'),
('1100','Accounts Receivable','العملاء (مدينون)','asset'),
('1200','Inventory - Raw Materials','مخزون خامات','asset'),
('1201','Inventory - Finished Goods','مخزون منتجات تامة','asset'),
('1300','Fixed Assets','الأصول الثابتة','asset'),
('2000','Accounts Payable','الموردون (دائنون)','liability'),
('2100','Taxes Payable','ضرائب مستحقة','liability'),
('2200','Salaries Payable','رواتب مستحقة','liability'),
('3000','Owner Equity','رأس المال','equity'),
('3100','Retained Earnings','أرباح محتجزة','equity'),
('4000','Sales Revenue','إيرادات المبيعات','revenue'),
('4100','Other Revenue','إيرادات أخرى','revenue'),
('5000','Cost of Goods Sold','تكلفة البضاعة المباعة','expense'),
('5100','Salaries Expense','مصروف الرواتب','expense'),
('5200','Rent Expense','مصروف الإيجار','expense'),
('5300','Utilities Expense','مصروف المرافق','expense'),
('5400','Maintenance Expense','مصروف الصيانة','expense'),
('5500','General & Admin','مصروفات عمومية وإدارية','expense')
ON CONFLICT (code) DO NOTHING;

-- 2. STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID,
  item_name TEXT,
  warehouse TEXT DEFAULT 'main',
  movement_type TEXT CHECK (movement_type IN ('in','out','transfer','adjustment','return')),
  source_module TEXT,
  source_id UUID,
  quantity NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(14,2) DEFAULT 0,
  total_cost NUMERIC(14,2) DEFAULT 0,
  batch_number TEXT,
  notes TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_all" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

-- 3. ATS - CV/Resume Tracking
CREATE TABLE IF NOT EXISTS ats_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title TEXT NOT NULL,
  department TEXT,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_phone TEXT,
  cv_text TEXT,
  ai_score NUMERIC(5,2),
  ai_verdict TEXT CHECK (ai_verdict IN ('accepted','rejected','review')),
  ai_analysis TEXT,
  skills_matched TEXT,
  skills_missing TEXT,
  experience_years NUMERIC(3,1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','screening','interview','offered','hired','rejected')),
  reviewed_by UUID,
  reviewed_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ats_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ats_all" ON ats_applications FOR ALL USING (true) WITH CHECK (true);

-- 4. PURCHASE ORDERS (enhanced)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(14,2) DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  discount NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','sent','received','cancelled')),
  quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending','approved','rejected')),
  notes TEXT,
  created_by UUID,
  created_by_name TEXT,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_all" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- 5. SALES ORDERS (enhanced)
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  so_number TEXT,
  client_id UUID,
  client_name TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(14,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  discount NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) DEFAULT 0,
  paid_amount NUMERIC(14,2) DEFAULT 0,
  remaining NUMERIC(14,2) DEFAULT 0,
  invoice_type TEXT DEFAULT 'cash' CHECK (invoice_type IN ('cash','credit','tax')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','confirmed','delivered','invoiced','paid','cancelled')),
  delivery_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "so_all" ON sales_orders FOR ALL USING (true) WITH CHECK (true);

-- 6. AUTO DOCUMENT NUMBERING
CREATE TABLE IF NOT EXISTS doc_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_type TEXT NOT NULL UNIQUE,
  prefix TEXT DEFAULT '',
  last_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE doc_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_seq_all" ON doc_sequences FOR ALL USING (true) WITH CHECK (true);

INSERT INTO doc_sequences (doc_type, prefix, last_number) VALUES
('PO','PO-',0),('SO','SO-',0),('INV','INV-',0),('JE','JE-',0),('RCV','RCV-',0),('PAY','PAY-',0)
ON CONFLICT (doc_type) DO NOTHING;
