-- First, update any old statuses that might violate the new constraint
UPDATE raw_material_receipts SET status = 'pending_warehouse' WHERE status NOT IN ('pending_qc', 'passed', 'failed', 'conditional', 'pending_warehouse', 'warehouse_received');
UPDATE production_orders SET status = 'completed' WHERE status NOT IN ('in_production', 'pending_qc', 'qc_passed', 'qc_rejected_rework', 'qc_rejected_scrap', 'completed', 'pending_warehouse', 'warehouse_received');

-- Now drop the old constraints
ALTER TABLE raw_material_receipts DROP CONSTRAINT IF EXISTS raw_material_receipts_status_check;
ALTER TABLE production_orders DROP CONSTRAINT IF EXISTS production_orders_status_check;

-- Finally add the new constraints
ALTER TABLE raw_material_receipts ADD CONSTRAINT raw_material_receipts_status_check
  CHECK (status IN ('pending_qc', 'passed', 'failed', 'conditional', 'pending_warehouse', 'warehouse_received'));

ALTER TABLE production_orders ADD CONSTRAINT production_orders_status_check
  CHECK (status IN ('in_production', 'pending_qc', 'qc_passed', 'qc_rejected_rework', 'qc_rejected_scrap', 'completed', 'pending_warehouse', 'warehouse_received'));
