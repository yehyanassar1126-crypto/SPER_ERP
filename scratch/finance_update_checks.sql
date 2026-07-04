-- Update finance tables for Petty Cash, Checks, and Lists
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'cleared';
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS cleared_account TEXT;
ALTER TABLE finance_treasury_tx ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- Make sure RLS is allowing access
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'finance_safes','finance_bank_accounts','finance_clients',
    'finance_suppliers','finance_invoices','finance_journal_entries',
    'finance_journal_lines','finance_cost_centers','finance_fixed_assets',
    'finance_taxes','finance_treasury_tx'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
