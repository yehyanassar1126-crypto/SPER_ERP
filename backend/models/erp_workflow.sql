-- ============================================================
-- ERP WORKFLOW TABLES - Sales, Planning, Production, Quality
-- ============================================================

-- 1. Add warehouse_type to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS warehouse_type TEXT DEFAULT 'raw';

-- 2. PRODUCTION ORDERS TABLE
CREATE TABLE IF NOT EXISTS production_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sales_order_id UUID,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  planned_by TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending_planning',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_sel" ON production_orders FOR SELECT USING (true);
CREATE POLICY "po_ins" ON production_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "po_upd" ON production_orders FOR UPDATE USING (true);
CREATE POLICY "po_del" ON production_orders FOR DELETE USING (true);

-- 3. MATERIAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS material_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_order_id UUID,
  item_id UUID,
  item_name TEXT NOT NULL,
  quantity_needed INTEGER NOT NULL,
  quantity_issued INTEGER DEFAULT 0,
  requested_by TEXT,
  approved_by TEXT,
  status TEXT DEFAULT 'pending',
  warehouse_type TEXT DEFAULT 'raw',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr_sel" ON material_requests FOR SELECT USING (true);
CREATE POLICY "mr_ins" ON material_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "mr_upd" ON material_requests FOR UPDATE USING (true);

-- 4. Modify sales_orders
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- 5. RLS for existing tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cl_sel" ON clients FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cl_ins" ON clients FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cl_upd" ON clients FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "so_sel" ON sales_orders FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "so_ins" ON sales_orders FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "so_upd" ON sales_orders FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "qc_sel" ON qc_inspections FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "qc_ins" ON qc_inspections FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "qc_upd" ON qc_inspections FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
