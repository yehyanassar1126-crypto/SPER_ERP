-- Add payment tracking to supplier_orders just in case
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS remaining_amount numeric DEFAULT 0;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid'));
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank', 'credit'));
