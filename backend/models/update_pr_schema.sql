ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_status_check;
ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_status_check 
  CHECK (status IN ('pending', 'pending_warehouse', 'dispensed', 'pending_manager', 'approved', 'rejected', 'quotation_requested', 'purchased', 'pending_finance', 'received'));
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS department TEXT;