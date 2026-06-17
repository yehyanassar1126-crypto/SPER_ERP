-- 1. Update raw_material_receipts status constraint
ALTER TABLE raw_material_receipts DROP CONSTRAINT IF EXISTS raw_material_receipts_status_check;
ALTER TABLE raw_material_receipts ADD CONSTRAINT raw_material_receipts_status_check
  CHECK (status IN ('pending_qc', 'passed', 'failed', 'conditional', 'pending_warehouse', 'warehouse_received'));

-- 2. Update production_orders status constraint
ALTER TABLE production_orders DROP CONSTRAINT IF EXISTS production_orders_status_check;
ALTER TABLE production_orders ADD CONSTRAINT production_orders_status_check
  CHECK (status IN ('in_production', 'pending_qc', 'qc_passed', 'qc_rejected_rework', 'qc_rejected_scrap', 'completed', 'pending_warehouse', 'warehouse_received'));
