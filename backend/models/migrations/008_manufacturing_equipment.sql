-- =============================================
-- NINJA FACTORY ERP — PHASE 1: MANUFACTURING
-- BOM + Stages + Traceability + Batches
-- =============================================

-- Bill of Materials (مكونات المنتج)
CREATE TABLE IF NOT EXISTS bom (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bom_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bom_id UUID REFERENCES bom(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  material_name_ar TEXT,
  material_id UUID REFERENCES inventory_items(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'KG',
  waste_percent NUMERIC DEFAULT 0,
  cost_per_unit NUMERIC DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Stages (مراحل التصنيع)
CREATE TABLE IF NOT EXISTS production_stage_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  department TEXT,
  estimated_minutes INTEGER DEFAULT 0,
  is_qc_required BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_stage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id),
  stage_template_id UUID REFERENCES production_stage_templates(id),
  stage_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed','skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  employee_id UUID REFERENCES users(id),
  supervisor_id UUID REFERENCES users(id),
  quantity_in NUMERIC DEFAULT 0,
  quantity_out NUMERIC DEFAULT 0,
  waste_quantity NUMERIC DEFAULT 0,
  qc_result TEXT CHECK (qc_result IN ('pass','fail','pending',NULL)),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Consumption (استهلاك الخامات)
CREATE TABLE IF NOT EXISTS production_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id),
  material_id UUID REFERENCES inventory_items(id),
  bom_item_id UUID REFERENCES bom_items(id),
  planned_qty NUMERIC DEFAULT 0,
  actual_qty NUMERIC DEFAULT 0,
  waste_qty NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'KG',
  consumed_by UUID REFERENCES users(id),
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  batch_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches (الدُفعات)
CREATE TABLE IF NOT EXISTS production_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number TEXT UNIQUE NOT NULL,
  production_order_id UUID REFERENCES production_orders(id),
  product_id UUID REFERENCES products(id),
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'KG',
  status TEXT DEFAULT 'in_production' CHECK (status IN ('in_production','qc_pending','qc_passed','qc_failed','finished','shipped')),
  qc_inspection_id UUID REFERENCES qc_inspections(id),
  manufactured_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  warehouse_location TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 2: EQUIPMENT & MAINTENANCE COMPANIES
-- =============================================

CREATE TABLE IF NOT EXISTS equipment_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  code TEXT UNIQUE,
  category_id UUID REFERENCES equipment_categories(id),
  serial_number TEXT,
  location TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','rented','maintenance','retired')),
  owner_supplier_id UUID REFERENCES suppliers(id),
  daily_rate NUMERIC DEFAULT 0,
  weekly_rate NUMERIC DEFAULT 0,
  monthly_rate NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  purchase_date DATE,
  purchase_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id),
  rental_number TEXT UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  contract_file TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rate_type TEXT DEFAULT 'monthly' CHECK (rate_type IN ('daily','weekly','monthly')),
  rate_amount NUMERIC DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','expiring','expired','returned','cancelled')),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  contract_start DATE,
  contract_end DATE,
  services TEXT,
  payment_terms TEXT,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','blacklisted')),
  total_visits INTEGER DEFAULT 0,
  total_spending NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_number TEXT UNIQUE,
  company_id UUID REFERENCES maintenance_companies(id),
  visit_date DATE DEFAULT CURRENT_DATE,
  department TEXT,
  location TEXT,
  problem_description TEXT,
  technician_name TEXT,
  work_description TEXT,
  parts_used TEXT,
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','invoiced','paid')),
  before_photos TEXT[],
  after_photos TEXT[],
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES maintenance_visits(id),
  company_id UUID REFERENCES maintenance_companies(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('treasury','bank')),
  treasury_id UUID,
  bank_account_id UUID,
  payment_date DATE DEFAULT CURRENT_DATE,
  reference_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  approved_by UUID REFERENCES users(id),
  paid_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 3: SUPPLIER PERFORMANCE
-- =============================================

CREATE TABLE IF NOT EXISTS supplier_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  period_start DATE,
  period_end DATE,
  total_orders INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  late_deliveries INTEGER DEFAULT 0,
  quality_score NUMERIC DEFAULT 0,
  price_competitiveness NUMERIC DEFAULT 0,
  return_rate NUMERIC DEFAULT 0,
  overall_score NUMERIC DEFAULT 0,
  ai_recommendation TEXT,
  notes TEXT,
  evaluated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 4: GLOBAL SEARCH INDEX
-- =============================================

CREATE TABLE IF NOT EXISTS search_index (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  record_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  subtitle TEXT,
  search_text TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_text ON search_index USING gin(to_tsvector('simple', search_text));

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_bom_product ON bom(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_prod_stage_logs_order ON production_stage_logs(production_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_consumption_order ON production_consumption(production_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_batches_order ON production_batches(production_order_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON equipment_rentals(status);
CREATE INDEX IF NOT EXISTS idx_maint_visits_company ON maintenance_visits(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_perf ON supplier_performance(supplier_id);

-- Enable RLS
ALTER TABLE bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated via anon key)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'bom','bom_items','production_stage_templates','production_stage_logs',
    'production_consumption','production_batches','equipment_categories',
    'equipment','equipment_rentals','maintenance_companies','maintenance_visits',
    'maintenance_payments','supplier_performance','search_index'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', tbl, tbl);
      EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping policy for %: %', tbl, SQLERRM;
    END;
  END LOOP;
END $$;
