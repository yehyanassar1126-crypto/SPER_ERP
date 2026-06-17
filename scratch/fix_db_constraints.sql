-- =============================================
-- Fix: inventory_items_category_check constraint
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Drop old constraint
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;

-- 2. Recreate with all needed categories
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_category_check
  CHECK (category IN (
    'Supplies',
    'Chemicals',
    'Workshop',
    'Maintenance',
    'Raw Material',
    'Finished Good',
    'Spare Part',
    'Packaging',
    'Tools',
    'Other'
  ));

-- =============================================
-- Add new columns to sales_workflow_orders
-- (customer delivery preference tracking)
-- =============================================
ALTER TABLE sales_workflow_orders
  ADD COLUMN IF NOT EXISTS customer_decision TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS partial_qty INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expected_full_delivery_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS planning_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purchase_request_id UUID DEFAULT NULL;

-- =============================================
-- Add raw_material_receipts table
-- (track incoming materials from suppliers before QC)
-- =============================================
CREATE TABLE IF NOT EXISTS raw_material_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  supplier_name TEXT,
  quantity_received NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'Piece',
  received_by TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending_qc' CHECK (status IN ('pending_qc', 'passed', 'failed', 'conditional')),
  qc_result TEXT DEFAULT NULL,
  qc_notes TEXT DEFAULT NULL,
  qc_inspector TEXT DEFAULT NULL,
  qc_date TIMESTAMPTZ DEFAULT NULL,
  quantity_accepted NUMERIC DEFAULT 0,
  rejection_reason TEXT DEFAULT NULL,
  linked_purchase_request_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE raw_material_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON raw_material_receipts FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- Add production_orders table
-- (track production state with QC gate)
-- =============================================
CREATE TABLE IF NOT EXISTS production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID REFERENCES sales_workflow_orders(id),
  product_name TEXT NOT NULL,
  quantity_ordered NUMERIC NOT NULL DEFAULT 0,
  quantity_produced NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'in_production' CHECK (status IN (
    'in_production', 'pending_qc', 'qc_passed', 'qc_rejected_rework', 'qc_rejected_scrap', 'completed'
  )),
  issued_by TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  qc_result TEXT DEFAULT NULL,
  qc_notes TEXT DEFAULT NULL,
  qc_inspector TEXT DEFAULT NULL,
  qc_date TIMESTAMPTZ DEFAULT NULL,
  rejection_action TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON production_orders FOR ALL USING (auth.role() = 'authenticated');
