-- ==============================================
-- 1. NURSING MANAGEMENT MODULE
-- ==============================================

-- Add rejection_reason column to medical_requests table
ALTER TABLE public.medical_requests ADD COLUMN IF NOT EXISTS rejection_reason text;

-- (The new statuses 'pending_nursing', 'pending_manager', 'pending_finance', 'pending_hr', 'disbursed', 'rejected' 
-- are plain text so no ENUM changes are needed if the column is text. If it is an ENUM, you must add these values.)

-- ==============================================
-- 2. INVENTORY INTEGRITY & CONCURRENCY
-- ==============================================

-- Add a CHECK constraint to prevent any inventory item from having a negative quantity.
-- This guarantees at the database level that stock cannot go below zero due to concurrency issues.
ALTER TABLE public.inventory_items 
ADD CONSTRAINT check_positive_quantity CHECK (quantity >= 0);

-- Note: If you already have some items with negative quantities, the above command will fail.
-- You must fix the negative quantities first before running the constraint:
-- UPDATE public.inventory_items SET quantity = 0 WHERE quantity < 0;
-- Then run the ALTER TABLE command again.
