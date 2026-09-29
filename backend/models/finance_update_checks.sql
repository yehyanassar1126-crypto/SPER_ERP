-- =====================================================
-- FINANCE MODULE - COMPLETE DATABASE UPDATES
-- Run this in Supabase SQL Editor
-- Date: 2026-07-04
-- =====================================================

-- 1. Treasury Transactions - Settlement columns (تسوية العهد)
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'open';
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS amount_spent NUMERIC(14,2) DEFAULT 0;
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS amount_returned NUMERIC(14,2) DEFAULT 0;
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS settlement_notes TEXT;
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS settlement_date TIMESTAMPTZ;
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS settled_by TEXT;

-- 2. Treasury Transactions - Check columns (شيكات)
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS check_number TEXT;
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS check_due_date DATE;

-- 3. Purchase Orders - Payment status (حالة الدفع للمشتريات)
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- 4. Sales Orders - Payment status (حالة الدفع للمبيعات)
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14,2) DEFAULT 0;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(14,2) DEFAULT 0;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS due_date DATE;

-- 5. RLS Policies (if not already set)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'finance_treasury_tx' AND policyname = 'allow_all') THEN
    ALTER TABLE finance_treasury_tx ENABLE ROW LEVEL SECURITY;
    CREATE POLICY allow_all ON finance_treasury_tx FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
