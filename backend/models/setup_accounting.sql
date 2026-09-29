-- ============================================================
-- COMPREHENSIVE ACCOUNTING MODULE - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. TREASURY (الخزائن المتعددة)
CREATE TABLE IF NOT EXISTS finance_safes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO finance_safes (name, balance) VALUES ('الخزنة الرئيسية', 0) ON CONFLICT DO NOTHING;

-- 2. BANK ACCOUNTS (حسابات بنكية)
CREATE TABLE IF NOT EXISTS finance_bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  branch TEXT,
  balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLIENTS (العملاء)
CREATE TABLE IF NOT EXISTS finance_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  credit_limit NUMERIC(14,2) DEFAULT 0,
  balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPPLIERS (الموردون)
CREATE TABLE IF NOT EXISTS finance_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVOICES (الفواتير)
CREATE TABLE IF NOT EXISTS finance_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('sales','purchase','return_sales','return_purchase')),
  client_id UUID REFERENCES finance_clients(id),
  supplier_id UUID REFERENCES finance_suppliers(id),
  subtotal NUMERIC(14,2) DEFAULT 0,
  discount NUMERIC(14,2) DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  additions NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) DEFAULT 0,
  paid_amount NUMERIC(14,2) DEFAULT 0,
  remaining NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid','cancelled')),
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYMENTS & COLLECTIONS (المدفوعات والتحصيلات)
CREATE TABLE IF NOT EXISTS finance_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES finance_invoices(id),
  collection_type TEXT NOT NULL CHECK (collection_type IN ('cash','check','bank_transfer')),
  amount NUMERIC(14,2) NOT NULL,
  payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full','partial')),
  safe_id UUID REFERENCES finance_safes(id),
  bank_id UUID REFERENCES finance_bank_accounts(id),
  reference_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHECKS (الشيكات)
CREATE TABLE IF NOT EXISTS finance_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_number TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('incoming','outgoing')),
  amount NUMERIC(14,2) NOT NULL,
  bank_name TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','under_collection','collected','bounced','cancelled')),
  client_id UUID REFERENCES finance_clients(id),
  supplier_id UUID REFERENCES finance_suppliers(id),
  invoice_id UUID REFERENCES finance_invoices(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CUSTODIES / ADVANCES (العهد)
CREATE TABLE IF NOT EXISTS finance_custodies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID,
  employee_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  settled_amount NUMERIC(14,2) DEFAULT 0,
  remaining NUMERIC(14,2) DEFAULT 0,
  purpose TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','settled','partial')),
  created_by UUID,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. JOURNAL ENTRIES (القيود اليومية)
CREATE TABLE IF NOT EXISTS finance_journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number TEXT,
  entry_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  total_debit NUMERIC(14,2) DEFAULT 0,
  total_credit NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','posted','cancelled')),
  created_by UUID,
  approved_by UUID,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_journal_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES finance_journal_entries(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  description TEXT,
  debit NUMERIC(14,2) DEFAULT 0,
  credit NUMERIC(14,2) DEFAULT 0,
  cost_center TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COST CENTERS (مراكز التكلفة)
CREATE TABLE IF NOT EXISTS finance_cost_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  parent_id UUID REFERENCES finance_cost_centers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FIXED ASSETS (الأصول الثابتة)
CREATE TABLE IF NOT EXISTS finance_fixed_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  asset_code TEXT,
  category TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC(14,2) DEFAULT 0,
  depreciation_rate NUMERIC(5,2) DEFAULT 0,
  accumulated_depreciation NUMERIC(14,2) DEFAULT 0,
  current_value NUMERIC(14,2) DEFAULT 0,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','disposed','transferred')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. EXPENSE CATEGORIES (تصنيفات المصروفات)
CREATE TABLE IF NOT EXISTS finance_expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  expense_type TEXT CHECK (expense_type IN ('operational','administrative','maintenance','production')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO finance_expense_categories (name, expense_type) VALUES 
  ('مصروفات تشغيلية', 'operational'),
  ('مصروفات إدارية', 'administrative'),
  ('مصروفات صيانة', 'maintenance'),
  ('مصروفات إنتاج', 'production')
ON CONFLICT DO NOTHING;

-- 13. TAXES (الضرائب)
CREATE TABLE IF NOT EXISTS finance_taxes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('vat','withholding')),
  period TEXT,
  taxable_amount NUMERIC(14,2) DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','filed','paid')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. FINANCIAL CLOSING (الإقفال المالي)
CREATE TABLE IF NOT EXISTS finance_closings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  closing_type TEXT NOT NULL CHECK (closing_type IN ('daily','monthly','yearly')),
  period TEXT NOT NULL,
  closed_by UUID,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  is_locked BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================================
ALTER TABLE finance_safes ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_closings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (Allow all for now, restrict in app logic)
-- ============================================================
CREATE POLICY "finance_safes_all" ON finance_safes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_bank_accounts_all" ON finance_bank_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_clients_all" ON finance_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_suppliers_all" ON finance_suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_invoices_all" ON finance_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_collections_all" ON finance_collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_checks_all" ON finance_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_custodies_all" ON finance_custodies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_journal_entries_all" ON finance_journal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_journal_lines_all" ON finance_journal_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_cost_centers_all" ON finance_cost_centers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_fixed_assets_all" ON finance_fixed_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_expense_categories_all" ON finance_expense_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_taxes_all" ON finance_taxes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "finance_closings_all" ON finance_closings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- FINANCE PAYMENTS TABLE (if not already created)
-- ============================================================
CREATE TABLE IF NOT EXISTS finance_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_type TEXT,
  invoice_id UUID,
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_payments_all" ON finance_payments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Purchase orders delete policy" ON purchase_orders FOR DELETE USING (true);
