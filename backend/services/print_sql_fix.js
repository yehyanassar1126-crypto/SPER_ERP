require('dotenv').config();
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// The actual SQL to run in Supabase Dashboard > SQL Editor:
const sqlFix = `
-- STEP 1: Drop old constraint
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;

-- STEP 2: Add new constraint with all needed categories  
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_category_check
  CHECK (category IN ('Supplies','Chemicals','Workshop','Maintenance','Raw Material','Finished Good','Spare Part','Packaging','Tools','Other'));

-- STEP 3: Add customer_decision columns to sales_workflow_orders
ALTER TABLE sales_workflow_orders
  ADD COLUMN IF NOT EXISTS customer_decision TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS partial_qty INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expected_full_delivery_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS planning_notes TEXT DEFAULT NULL;

-- STEP 4: Create raw_material_receipts table
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

-- STEP 5: Create production_orders table
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
`;

console.log('=== SQL to run in Supabase SQL Editor ===');
console.log(sqlFix);
console.log('==========================================');
console.log('Please copy the SQL above and run it in:');
console.log('Supabase Dashboard > SQL Editor > New Query');
