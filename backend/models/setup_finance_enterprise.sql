-- ===== ENTERPRISE FINANCE & ACCOUNTING MIGRATION =====

-- 1. Multi-Currency
CREATE TABLE IF NOT EXISTS erp_currencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT,
    exchange_rate DECIMAL(15,6) DEFAULT 1.0,
    is_base BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bank Management
CREATE TABLE IF NOT EXISTS erp_banks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_name TEXT NOT NULL,
    branch TEXT,
    swift_code TEXT,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_id UUID REFERENCES erp_banks(id),
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL UNIQUE,
    currency_id UUID REFERENCES erp_currencies(id),
    gl_account_id UUID, -- Link to Chart of Accounts
    current_balance DECIMAL(15,2) DEFAULT 0.0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_bank_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES erp_bank_accounts(id),
    type TEXT NOT NULL, -- deposit, withdrawal, transfer, fee, interest
    amount DECIMAL(15,2) NOT NULL,
    reference TEXT,
    description TEXT,
    transaction_date DATE NOT NULL,
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Check Lifecycle
CREATE TABLE IF NOT EXISTS erp_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_number TEXT NOT NULL,
    bank_id UUID REFERENCES erp_banks(id),
    type TEXT NOT NULL, -- payable, receivable
    amount DECIMAL(15,2) NOT NULL,
    currency_id UUID REFERENCES erp_currencies(id),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    beneficiary TEXT,
    status TEXT DEFAULT 'received', -- received, under_collection, deposited, collected, returned, cancelled, postponed
    related_invoice_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Loans Management
CREATE TABLE IF NOT EXISTS erp_loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_name TEXT NOT NULL,
    bank_id UUID REFERENCES erp_banks(id),
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_months INT NOT NULL,
    start_date DATE NOT NULL,
    monthly_payment DECIMAL(15,2),
    remaining_balance DECIMAL(15,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_loan_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID REFERENCES erp_loans(id),
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    principal_part DECIMAL(15,2),
    interest_part DECIMAL(15,2),
    status TEXT DEFAULT 'pending', -- pending, paid, late
    paid_date DATE,
    penalty DECIMAL(15,2) DEFAULT 0.0
);

-- 5. Taxes Management
CREATE TABLE IF NOT EXISTS erp_tax_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- vat, withholding, income, payroll
    rate DECIMAL(5,2) NOT NULL,
    gl_account_id UUID,
    status TEXT DEFAULT 'active'
);

-- 6. Chart of Accounts & Auto Journal Engine
-- (Assuming chart of accounts exists, but expanding it)
CREATE TABLE IF NOT EXISTS erp_gl_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- asset, liability, equity, revenue, expense
    parent_id UUID REFERENCES erp_gl_accounts(id),
    is_group BOOLEAN DEFAULT FALSE,
    balance DECIMAL(15,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_number TEXT NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    reference TEXT,
    description TEXT,
    source_module TEXT, -- sales, purchase, payroll, manual
    source_id UUID,
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'posted',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_journal_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id UUID REFERENCES erp_journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES erp_gl_accounts(id),
    cost_center_id UUID,
    debit DECIMAL(15,2) DEFAULT 0.0,
    credit DECIMAL(15,2) DEFAULT 0.0,
    description TEXT
);

-- 7. Budgets
CREATE TABLE IF NOT EXISTS erp_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department TEXT NOT NULL,
    year INT NOT NULL,
    month INT, -- NULL means yearly budget
    amount DECIMAL(15,2) NOT NULL,
    consumed DECIMAL(15,2) DEFAULT 0.0,
    alert_threshold INT DEFAULT 80, -- percentage
    status TEXT DEFAULT 'active'
);

-- 8. Fixed Assets
CREATE TABLE IF NOT EXISTS erp_fixed_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(15,2),
    salvage_value DECIMAL(15,2),
    useful_life_years INT,
    depreciation_method TEXT DEFAULT 'straight_line',
    current_value DECIMAL(15,2),
    status TEXT DEFAULT 'active', -- active, maintenance, sold, scrapped
    gl_asset_account UUID,
    gl_depreciation_account UUID,
    gl_accumulated_account UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_asset_depreciation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES erp_fixed_assets(id),
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    journal_entry_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Dynamic Approval Matrix
CREATE TABLE IF NOT EXISTS erp_approval_matrix (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module TEXT NOT NULL, -- e.g. purchase, expense, payment
    min_amount DECIMAL(15,2) DEFAULT 0.0,
    max_amount DECIMAL(15,2), -- NULL means infinite
    role_required TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Financial Audit Trail
CREATE TABLE IF NOT EXISTS erp_financial_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Financial Periods (Closing Wizard)
CREATE TABLE IF NOT EXISTS erp_financial_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_name TEXT NOT NULL, -- e.g. "January 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_by UUID,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Currency if not exists
INSERT INTO erp_currencies (code, name, symbol, is_base) 
VALUES ('EGP', 'Egyptian Pound', 'EGP', TRUE) 
ON CONFLICT (code) DO NOTHING;

-- Seed Default Tax Codes
INSERT INTO erp_tax_codes (name, type, rate) VALUES 
('VAT 14%', 'vat', 14.00),
('Withholding 1%', 'withholding', 1.00);

-- Enable RLS (Allow all for authenticated users in this ERP context)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'erp_%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON %I;', tbl);
        EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL USING (true);', tbl);
    END LOOP;
END
$$;
