-- Phase 2 Enterprise Features: Advanced Pricing, Credit Management, RMA, Print Templates, E-Invoice, Demand Forecasting, Contracts, Dashboards, Reports, Shop Floor

-- 1. ADVANCED PRICING SYSTEM
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  type TEXT DEFAULT 'sale' CHECK (type IN ('sale','purchase')),
  currency TEXT DEFAULT 'EGP',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_to DATE,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT,
  unit_price NUMERIC(15,4) NOT NULL,
  min_quantity NUMERIC(12,2) DEFAULT 1,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_special_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  product_id UUID,
  product_name TEXT,
  special_price NUMERIC(15,4),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  min_quantity NUMERIC(12,2) DEFAULT 1,
  valid_from DATE,
  valid_to DATE,
  approved_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quantity_breaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID,
  product_name TEXT,
  from_quantity NUMERIC(12,2) NOT NULL,
  to_quantity NUMERIC(12,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  unit_price NUMERIC(15,4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREDIT MANAGEMENT
CREATE TABLE IF NOT EXISTS customer_credit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) UNIQUE,
  client_name TEXT,
  credit_limit NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  available_credit NUMERIC(15,2) DEFAULT 0,
  risk_category TEXT DEFAULT 'B' CHECK (risk_category IN ('A','B','C','D','blocked')),
  payment_terms_days INTEGER DEFAULT 30,
  last_payment_date DATE,
  avg_payment_days NUMERIC(6,1) DEFAULT 0,
  total_overdue NUMERIC(15,2) DEFAULT 0,
  credit_hold BOOLEAN DEFAULT false,
  hold_reason TEXT,
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  invoice_number TEXT,
  amount_due NUMERIC(15,2) DEFAULT 0,
  days_overdue INTEGER DEFAULT 0,
  follow_up_date DATE DEFAULT CURRENT_DATE,
  follow_up_type TEXT CHECK (follow_up_type IN ('call','email','visit','letter','legal')),
  contact_person TEXT,
  response TEXT,
  next_action TEXT,
  next_action_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','contacted','promised','paid','escalated','legal')),
  assigned_to UUID REFERENCES users(id),
  assigned_to_name TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RETURNS / RMA
CREATE TABLE IF NOT EXISTS rma_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rma_number TEXT UNIQUE,
  type TEXT CHECK (type IN ('customer_return','supplier_return')),
  client_id UUID REFERENCES clients(id),
  supplier_id UUID,
  entity_name TEXT,
  sales_order_id UUID,
  purchase_order_id UUID,
  request_date DATE DEFAULT CURRENT_DATE,
  reason_category TEXT CHECK (reason_category IN ('defective','wrong_item','damaged','quality','overstock','other')),
  reason_detail TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested','approved','received','inspecting','resolved','rejected','closed')),
  resolution TEXT CHECK (resolution IN ('replace','repair','refund','credit_note','reject')),
  total_value NUMERIC(15,2) DEFAULT 0,
  credit_note_number TEXT,
  credit_note_amount NUMERIC(15,2) DEFAULT 0,
  inspection_notes TEXT,
  inspector_id UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rma_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rma_id UUID REFERENCES rma_requests(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(15,4) DEFAULT 0,
  total_price NUMERIC(15,2) DEFAULT 0,
  defect_type TEXT,
  condition TEXT CHECK (condition IN ('new','used','damaged','defective')),
  return_to_stock BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRINT TEMPLATES
CREATE TABLE IF NOT EXISTS print_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice','sales_order','purchase_order','delivery_note','production_order','payment_voucher','receipt_voucher','quotation','credit_note','statement','label','payslip','certificate')),
  template_html TEXT NOT NULL,
  template_css TEXT,
  header_html TEXT,
  footer_html TEXT,
  paper_size TEXT DEFAULT 'A4' CHECK (paper_size IN ('A4','A5','Letter','Label','Receipt')),
  orientation TEXT DEFAULT 'portrait' CHECK (orientation IN ('portrait','landscape')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  company_logo_url TEXT,
  company_name TEXT,
  company_name_ar TEXT,
  company_address TEXT,
  company_tax_id TEXT,
  company_phone TEXT,
  company_email TEXT,
  show_qr_code BOOLEAN DEFAULT true,
  show_barcode BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'ar' CHECK (language IN ('ar','en','both')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. E-INVOICE SUPPORT
CREATE TABLE IF NOT EXISTS einvoice_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT DEFAULT 'eta' CHECK (provider IN ('eta','zatca','custom')),
  client_id TEXT,
  client_secret TEXT,
  api_url TEXT,
  token_url TEXT,
  environment TEXT DEFAULT 'testing' CHECK (environment IN ('testing','production')),
  company_tax_id TEXT,
  company_tax_branch TEXT,
  activity_code TEXT,
  is_active BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS einvoice_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT CHECK (document_type IN ('invoice','credit_note','debit_note')),
  internal_id UUID,
  internal_number TEXT,
  eta_uuid TEXT UNIQUE,
  eta_submission_id TEXT,
  eta_status TEXT DEFAULT 'draft' CHECK (eta_status IN ('draft','submitted','valid','invalid','rejected','cancelled')),
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  client_tax_id TEXT,
  total_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  net_amount NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  issue_date DATE DEFAULT CURRENT_DATE,
  document_json JSONB,
  eta_response JSONB,
  error_message TEXT,
  signed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS einvoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  einvoice_id UUID REFERENCES einvoice_documents(id) ON DELETE CASCADE,
  item_code TEXT,
  item_name TEXT,
  item_name_ar TEXT,
  description TEXT,
  unit_type TEXT DEFAULT 'EA',
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(15,4) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 14,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) DEFAULT 0,
  gpc_code TEXT,
  egs_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEMAND FORECASTING
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID,
  product_name TEXT,
  forecast_period_start DATE NOT NULL,
  forecast_period_end DATE NOT NULL,
  forecast_method TEXT DEFAULT 'moving_average' CHECK (forecast_method IN ('moving_average','exponential_smoothing','linear_trend','seasonal','manual')),
  forecasted_quantity NUMERIC(12,2) DEFAULT 0,
  actual_quantity NUMERIC(12,2) DEFAULT 0,
  variance NUMERIC(12,2) DEFAULT 0,
  accuracy_percent NUMERIC(5,2) DEFAULT 0,
  confidence_level NUMERIC(5,2) DEFAULT 0,
  historical_data JSONB,
  parameters JSONB,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONTRACT MANAGEMENT
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT UNIQUE,
  type TEXT CHECK (type IN ('sales','purchase','service','rental','employment')),
  entity_type TEXT CHECK (entity_type IN ('client','supplier','employee')),
  entity_id UUID,
  entity_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  total_value NUMERIC(15,2) DEFAULT 0,
  delivered_value NUMERIC(15,2) DEFAULT 0,
  remaining_value NUMERIC(15,2) DEFAULT 0,
  completion_percent NUMERIC(5,2) DEFAULT 0,
  payment_terms TEXT,
  delivery_schedule JSONB,
  auto_renew BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','on_hold','completed','terminated','expired')),
  terms_conditions TEXT,
  attachments JSONB,
  signed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DASHBOARD BUILDER
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL DEFAULT '[]',
  shared_with TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('stat_card','bar_chart','line_chart','pie_chart','donut_chart','table','gauge','counter','timeline','list','kpi','map')),
  title TEXT NOT NULL,
  title_ar TEXT,
  data_source TEXT NOT NULL,
  query_config JSONB,
  chart_config JSONB,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 4,
  height INTEGER DEFAULT 3,
  refresh_interval_seconds INTEGER DEFAULT 300,
  color_scheme TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REPORT BUILDER
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  module TEXT,
  report_type TEXT DEFAULT 'table' CHECK (report_type IN ('table','chart','pivot','summary','detail')),
  data_source TEXT NOT NULL,
  columns JSONB NOT NULL,
  filters JSONB DEFAULT '[]',
  sort_by JSONB DEFAULT '[]',
  group_by TEXT[],
  aggregations JSONB DEFAULT '[]',
  chart_type TEXT,
  chart_config JSONB,
  schedule_cron TEXT,
  email_recipients TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SHOP FLOOR DISPLAY
CREATE TABLE IF NOT EXISTS shop_floor_displays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  production_line TEXT,
  machine_id UUID REFERENCES machines(id),
  current_order_id UUID REFERENCES production_orders(id),
  target_quantity NUMERIC(12,2) DEFAULT 0,
  produced_quantity NUMERIC(12,2) DEFAULT 0,
  defect_quantity NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'idle' CHECK (status IN ('running','idle','stopped','changeover','break')),
  current_oee NUMERIC(5,2) DEFAULT 0,
  shift_start TIMESTAMPTZ,
  andon_status TEXT DEFAULT 'green' CHECK (andon_status IN ('green','yellow','red')),
  andon_message TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS andon_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id UUID REFERENCES shop_floor_displays(id),
  production_line TEXT,
  machine_id UUID REFERENCES machines(id),
  event_type TEXT CHECK (event_type IN ('stop','quality_issue','material_shortage','maintenance_needed','safety','other')),
  severity TEXT DEFAULT 'yellow' CHECK (severity IN ('green','yellow','red')),
  message TEXT,
  reported_by UUID REFERENCES users(id),
  reported_by_name TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  duration_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_price_list_items_pl_id ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product ON price_list_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cust_special_prices_client ON customer_special_prices(client_id);
CREATE INDEX IF NOT EXISTS idx_quantity_breaks_product ON quantity_breaks(product_id);
CREATE INDEX IF NOT EXISTS idx_collection_followups_client ON collection_follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_rma_requests_client ON rma_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_rma_items_rma_id ON rma_items(rma_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_docs_client ON einvoice_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_items_einvoice_id ON einvoice_items(einvoice_id);
CREATE INDEX IF NOT EXISTS idx_contracts_entity_id ON contracts(entity_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_andon_events_display ON andon_events(display_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_special_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantity_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rma_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rma_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE einvoice_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE einvoice_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE einvoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_floor_displays ENABLE ROW LEVEL SECURITY;
ALTER TABLE andon_events ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES
DO $$ 
DECLARE
  t text;
  tables text[] := ARRAY[
    'price_lists', 'price_list_items', 'customer_special_prices', 'quantity_breaks',
    'customer_credit', 'collection_follow_ups', 'rma_requests', 'rma_items',
    'print_templates', 'einvoice_config', 'einvoice_documents', 'einvoice_items',
    'demand_forecasts', 'contracts', 'custom_dashboards', 'dashboard_widgets',
    'saved_reports', 'shop_floor_displays', 'andon_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Enable update for authenticated users" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Enable delete for authenticated users" ON %I', t);

    EXECUTE format('CREATE POLICY "Enable read access for all authenticated users" ON %I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "Enable insert for authenticated users" ON %I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Enable update for authenticated users" ON %I FOR UPDATE USING (true)', t);
    EXECUTE format('CREATE POLICY "Enable delete for authenticated users" ON %I FOR DELETE USING (true)', t);
  END LOOP;
END $$;
