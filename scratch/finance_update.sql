-- 1. Update sales_workflow_orders (Sales Invoices)
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS remaining_amount numeric DEFAULT 0;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid'));
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE sales_workflow_orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank', 'credit'));

-- 2. Update purchase_orders (Purchase Invoices)
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS remaining_amount numeric DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid'));
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank', 'credit'));

-- 3. Create finance_payments table (Tracks all partial/full payments)
CREATE TABLE IF NOT EXISTS finance_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_type text NOT NULL CHECK (invoice_type IN ('sales', 'purchase')),
  invoice_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'check', 'bank', 'credit')),
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  reference_number text, -- For checks and bank transfers
  notes text,
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE finance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all on finance_payments" ON finance_payments FOR ALL USING (true) WITH CHECK (true);

-- 4. Create View for Customer Balances (Automatically calculated to avoid errors)
CREATE OR REPLACE VIEW customer_balances_view AS
SELECT 
  customer_name,
  COUNT(id) as total_invoices,
  SUM(total_amount) as total_sales,
  SUM(paid_amount) as total_paid,
  SUM(remaining_amount) as total_remaining,
  COUNT(id) FILTER (WHERE payment_status != 'paid') as unpaid_invoices_count
FROM sales_workflow_orders
GROUP BY customer_name;

-- 5. Create View for Supplier Balances
CREATE OR REPLACE VIEW supplier_balances_view AS
SELECT 
  supplier_name,
  COUNT(id) as total_invoices,
  SUM(total_amount) as total_purchases,
  SUM(paid_amount) as total_paid,
  SUM(remaining_amount) as total_remaining,
  COUNT(id) FILTER (WHERE payment_status != 'paid') as unpaid_invoices_count
FROM purchase_orders
GROUP BY supplier_name;
