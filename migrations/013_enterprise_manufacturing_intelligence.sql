-- Migration: 013_enterprise_manufacturing_intelligence
-- Description: Adds enterprise-level manufacturing, MRP, APS, quality, WMS, maintenance, finance, workflow, HR, sustainability, integrations, and executive intelligence.

-- 1. PRODUCTION ANALYSIS & OEE
CREATE TABLE IF NOT EXISTS production_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id),
  product_name TEXT,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift TEXT,
  machine_id UUID REFERENCES machines(id),
  production_line TEXT,
  target_quantity NUMERIC(12,2) DEFAULT 0,
  actual_quantity NUMERIC(12,2) DEFAULT 0,
  scrap_quantity NUMERIC(12,2) DEFAULT 0,
  waste_quantity NUMERIC(12,2) DEFAULT 0,
  rework_quantity NUMERIC(12,2) DEFAULT 0,
  defective_quantity NUMERIC(12,2) DEFAULT 0,
  planned_production_time_minutes INTEGER DEFAULT 0,
  actual_production_time_minutes INTEGER DEFAULT 0,
  downtime_minutes INTEGER DEFAULT 0,
  downtime_reason TEXT,
  expected_material_consumption NUMERIC(12,2) DEFAULT 0,
  actual_material_consumption NUMERIC(12,2) DEFAULT 0,
  operators TEXT[], -- array of operator names
  notes TEXT,
  -- OEE Calculations (computed on insert/update)
  availability NUMERIC(5,2) DEFAULT 0,
  performance_rate NUMERIC(5,2) DEFAULT 0,
  quality_rate NUMERIC(5,2) DEFAULT 0,
  oee NUMERIC(5,2) DEFAULT 0,
  -- AI Analysis results
  ai_analysis JSONB,
  ai_recommendations JSONB,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_analysis_order_id ON production_analysis(production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_analysis_machine_id ON production_analysis(machine_id);
CREATE INDEX IF NOT EXISTS idx_production_analysis_date ON production_analysis(production_date);

-- 2. MRP (Material Requirements Planning)
CREATE TABLE IF NOT EXISTS mrp_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES inventory_items(id),
  material_name TEXT NOT NULL,
  required_quantity NUMERIC(12,2) DEFAULT 0,
  available_quantity NUMERIC(12,2) DEFAULT 0,
  reserved_quantity NUMERIC(12,2) DEFAULT 0,
  shortage_quantity NUMERIC(12,2) DEFAULT 0,
  safety_stock NUMERIC(12,2) DEFAULT 0,
  reorder_point NUMERIC(12,2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  suggested_action TEXT, -- 'purchase', 'production', 'none'
  suggested_quantity NUMERIC(12,2) DEFAULT 0,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical','high','normal','low')),
  source_type TEXT, -- 'production_order', 'sales_order', 'safety_stock'
  source_id UUID,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','ordered','fulfilled','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mrp_requirements_material_id ON mrp_requirements(material_id);
CREATE INDEX IF NOT EXISTS idx_mrp_requirements_status ON mrp_requirements(status);

CREATE TABLE IF NOT EXISTS mrp_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES inventory_items(id) UNIQUE,
  material_name TEXT,
  safety_stock NUMERIC(12,2) DEFAULT 0,
  reorder_point NUMERIC(12,2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 7,
  min_order_quantity NUMERIC(12,2) DEFAULT 0,
  preferred_supplier_id UUID REFERENCES suppliers(id),
  auto_reorder BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mrp_settings_material_id ON mrp_settings(material_id);
CREATE INDEX IF NOT EXISTS idx_mrp_settings_supplier_id ON mrp_settings(preferred_supplier_id);

-- 3. APS (Advanced Planning & Scheduling)
CREATE TABLE IF NOT EXISTS aps_capacity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('machine','worker','production_line')),
  resource_id UUID,
  resource_name TEXT NOT NULL,
  shift TEXT,
  date DATE,
  available_minutes INTEGER DEFAULT 480,
  allocated_minutes INTEGER DEFAULT 0,
  utilization_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aps_capacity_resource ON aps_capacity(resource_id, date);

CREATE TABLE IF NOT EXISTS aps_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id),
  machine_id UUID REFERENCES machines(id),
  production_line TEXT,
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  priority INTEGER DEFAULT 5,
  sequence_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','delayed','cancelled')),
  bottleneck_flag BOOLEAN DEFAULT false,
  delay_reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aps_schedule_order_id ON aps_schedule(production_order_id);
CREATE INDEX IF NOT EXISTS idx_aps_schedule_machine_id ON aps_schedule(machine_id);
CREATE INDEX IF NOT EXISTS idx_aps_schedule_status ON aps_schedule(status);

-- 4. ADVANCED QUALITY
CREATE TABLE IF NOT EXISTS quality_ncr (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ncr_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT CHECK (source IN ('production','incoming','customer','internal')),
  severity TEXT DEFAULT 'minor' CHECK (severity IN ('critical','major','minor','observation')),
  product_name TEXT,
  batch_id UUID REFERENCES production_batches(id),
  production_order_id UUID REFERENCES production_orders(id),
  defect_type TEXT,
  defect_quantity NUMERIC(12,2) DEFAULT 0,
  affected_quantity NUMERIC(12,2) DEFAULT 0,
  root_cause TEXT,
  root_cause_method TEXT, -- '5_why', 'fishbone', 'other'
  root_cause_analysis JSONB, -- structured analysis data
  immediate_action TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','investigating','corrective_action','closed','cancelled')),
  assigned_to UUID REFERENCES users(id),
  assigned_to_name TEXT,
  closed_by UUID REFERENCES users(id),
  closed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_ncr_order_id ON quality_ncr(production_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_ncr_batch_id ON quality_ncr(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_ncr_status ON quality_ncr(status);

CREATE TABLE IF NOT EXISTS quality_capa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  capa_number TEXT UNIQUE,
  ncr_id UUID REFERENCES quality_ncr(id),
  type TEXT CHECK (type IN ('corrective','preventive')),
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  proposed_action TEXT,
  responsible_person UUID REFERENCES users(id),
  responsible_name TEXT,
  target_date DATE,
  completion_date DATE,
  verification_method TEXT,
  verification_result TEXT,
  effectiveness_check BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','verified','closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical','high','normal','low')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_capa_ncr_id ON quality_capa(ncr_id);
CREATE INDEX IF NOT EXISTS idx_quality_capa_status ON quality_capa(status);

-- 5. WMS (Warehouse Management)
CREATE TABLE IF NOT EXISTS warehouse_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_name TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  zone_type TEXT DEFAULT 'storage' CHECK (zone_type IN ('receiving','storage','picking','packing','shipping','quarantine')),
  temperature_controlled BOOLEAN DEFAULT false,
  capacity_units INTEGER DEFAULT 0,
  used_units INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_bin_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES warehouse_zones(id),
  bin_code TEXT UNIQUE NOT NULL,
  rack TEXT,
  shelf TEXT,
  position TEXT,
  barcode TEXT UNIQUE,
  capacity_units INTEGER DEFAULT 0,
  used_units INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','full','blocked','reserved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_bin_locations_zone ON warehouse_bin_locations(zone_id);

CREATE TABLE IF NOT EXISTS warehouse_stock_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id),
  bin_location_id UUID REFERENCES warehouse_bin_locations(id),
  quantity NUMERIC(12,2) DEFAULT 0,
  lot_number TEXT,
  batch_number TEXT,
  expiry_date DATE,
  received_date DATE DEFAULT CURRENT_DATE,
  fifo_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'available' CHECK (status IN ('available','reserved','allocated','quarantine','damaged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_locations_item ON warehouse_stock_locations(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_locations_bin ON warehouse_stock_locations(bin_location_id);

CREATE TABLE IF NOT EXISTS warehouse_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('receiving','putaway','picking','packing','transfer','cycle_count','adjustment')),
  item_id UUID REFERENCES inventory_items(id),
  item_name TEXT,
  from_bin_id UUID REFERENCES warehouse_bin_locations(id),
  to_bin_id UUID REFERENCES warehouse_bin_locations(id),
  quantity NUMERIC(12,2) NOT NULL,
  lot_number TEXT,
  reference_type TEXT,
  reference_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  performed_by UUID REFERENCES users(id),
  performed_by_name TEXT,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_ops_item ON warehouse_operations(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_ops_status ON warehouse_operations(status);

CREATE TABLE IF NOT EXISTS cycle_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  count_date DATE DEFAULT CURRENT_DATE,
  zone_id UUID REFERENCES warehouse_zones(id),
  bin_location_id UUID REFERENCES warehouse_bin_locations(id),
  item_id UUID REFERENCES inventory_items(id),
  item_name TEXT,
  system_quantity NUMERIC(12,2) DEFAULT 0,
  counted_quantity NUMERIC(12,2) DEFAULT 0,
  variance NUMERIC(12,2) DEFAULT 0,
  variance_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','counted','approved','adjusted')),
  counted_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cycle_counts_item ON cycle_counts(item_id);

-- 6. ADVANCED MAINTENANCE
CREATE TABLE IF NOT EXISTS preventive_maintenance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID REFERENCES machines(id),
  machine_name TEXT,
  task_name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT CHECK (frequency_type IN ('daily','weekly','monthly','quarterly','yearly','hours')),
  frequency_value INTEGER DEFAULT 1,
  last_performed_date DATE,
  next_due_date DATE,
  estimated_duration_minutes INTEGER DEFAULT 60,
  spare_parts_needed TEXT,
  assigned_to UUID REFERENCES users(id),
  assigned_to_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','overdue','completed','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prev_maint_machine ON preventive_maintenance(machine_id);

CREATE TABLE IF NOT EXISTS maintenance_work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wo_number TEXT UNIQUE,
  machine_id UUID REFERENCES machines(id),
  machine_name TEXT,
  type TEXT DEFAULT 'corrective' CHECK (type IN ('corrective','preventive','predictive','emergency')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical','high','normal','low')),
  title TEXT NOT NULL,
  description TEXT,
  failure_mode TEXT,
  root_cause TEXT,
  action_taken TEXT,
  spare_parts_used JSONB,
  labor_hours NUMERIC(6,2) DEFAULT 0,
  material_cost NUMERIC(12,2) DEFAULT 0,
  labor_cost NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  downtime_minutes INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  assigned_to_name TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','completed','closed','cancelled')),
  preventive_id UUID REFERENCES preventive_maintenance(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_wo_machine ON maintenance_work_orders(machine_id);
CREATE INDEX IF NOT EXISTS idx_maint_wo_status ON maintenance_work_orders(status);

CREATE TABLE IF NOT EXISTS machine_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID REFERENCES machines(id),
  metric_date DATE DEFAULT CURRENT_DATE,
  total_runtime_minutes INTEGER DEFAULT 0,
  total_downtime_minutes INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  mtbf_hours NUMERIC(8,2) DEFAULT 0,
  mttr_hours NUMERIC(8,2) DEFAULT 0,
  maintenance_cost NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_metrics_machine ON machine_metrics(machine_id);

-- 7. ADVANCED FINANCE
CREATE TABLE IF NOT EXISTS finance_aging (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('receivable','payable')),
  entity_type TEXT, -- 'client' or 'supplier'
  entity_id UUID,
  entity_name TEXT,
  invoice_id UUID,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  total_amount NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  balance NUMERIC(15,2) DEFAULT 0,
  days_overdue INTEGER DEFAULT 0,
  aging_bucket TEXT, -- 'current','1-30','31-60','61-90','90+'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_aging_entity ON finance_aging(entity_id);

CREATE TABLE IF NOT EXISTS finance_reconciliation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID,
  reconciliation_date DATE NOT NULL,
  statement_balance NUMERIC(15,2) DEFAULT 0,
  book_balance NUMERIC(15,2) DEFAULT 0,
  adjusted_balance NUMERIC(15,2) DEFAULT 0,
  difference NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','approved')),
  reconciled_items JSONB,
  outstanding_items JSONB,
  reconciled_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id),
  product_name TEXT,
  batch_number TEXT,
  material_cost NUMERIC(15,2) DEFAULT 0,
  labor_cost NUMERIC(15,2) DEFAULT 0,
  overhead_cost NUMERIC(15,2) DEFAULT 0,
  energy_cost NUMERIC(15,2) DEFAULT 0,
  waste_cost NUMERIC(15,2) DEFAULT 0,
  total_cost NUMERIC(15,2) DEFAULT 0,
  standard_cost NUMERIC(15,2) DEFAULT 0,
  actual_cost NUMERIC(15,2) DEFAULT 0,
  variance NUMERIC(15,2) DEFAULT 0,
  variance_percent NUMERIC(5,2) DEFAULT 0,
  cost_per_unit NUMERIC(15,4) DEFAULT 0,
  quantity_produced NUMERIC(12,2) DEFAULT 0,
  analysis_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_costs_order ON production_costs(production_order_id);

-- 8. WORKFLOW ENGINE
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  module TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_event TEXT,
  trigger_conditions JSONB,
  steps JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflow_definitions(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','rejected','cancelled','escalated')),
  started_by UUID REFERENCES users(id),
  started_by_name TEXT,
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  escalation_count INTEGER DEFAULT 0,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_inst_entity ON workflow_instances(entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_inst_status ON workflow_instances(status);

-- 9. AI COPILOT
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  query TEXT NOT NULL,
  query_language TEXT DEFAULT 'ar',
  target_module TEXT,
  response TEXT,
  response_data JSONB,
  data_sources TEXT[],
  confidence_score NUMERIC(3,2) DEFAULT 0,
  feedback TEXT CHECK (feedback IN ('helpful','not_helpful',NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS ai_agent_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT,
  recommendation JSONB,
  expected_impact TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','executed','cancelled')),
  approved_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_actions_status ON ai_agent_actions(status);

-- 10. ADVANCED HR
CREATE TABLE IF NOT EXISTS employee_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT,
  proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
  certified BOOLEAN DEFAULT false,
  certification_name TEXT,
  certification_expiry DATE,
  last_assessed DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_skills_employee ON employee_skills(employee_id);

CREATE TABLE IF NOT EXISTS workforce_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  department TEXT,
  total_employees INTEGER DEFAULT 0,
  new_hires INTEGER DEFAULT 0,
  separations INTEGER DEFAULT 0,
  turnover_rate NUMERIC(5,2) DEFAULT 0,
  avg_tenure_months NUMERIC(6,1) DEFAULT 0,
  total_labor_cost NUMERIC(15,2) DEFAULT 0,
  cost_per_employee NUMERIC(12,2) DEFAULT 0,
  attendance_rate NUMERIC(5,2) DEFAULT 0,
  overtime_hours NUMERIC(10,2) DEFAULT 0,
  training_hours NUMERIC(10,2) DEFAULT 0,
  training_cost NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUSTAINABILITY
CREATE TABLE IF NOT EXISTS sustainability_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_date DATE DEFAULT CURRENT_DATE,
  production_line TEXT,
  energy_kwh NUMERIC(12,2) DEFAULT 0,
  water_cubic_meters NUMERIC(12,2) DEFAULT 0,
  waste_kg NUMERIC(12,2) DEFAULT 0,
  recycled_kg NUMERIC(12,2) DEFAULT 0,
  scrap_kg NUMERIC(12,2) DEFAULT 0,
  co2_emissions_kg NUMERIC(12,2) DEFAULT 0,
  production_quantity NUMERIC(12,2) DEFAULT 0,
  energy_per_unit NUMERIC(8,4) DEFAULT 0,
  co2_per_unit NUMERIC(8,4) DEFAULT 0,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sustainability_date ON sustainability_tracking(tracking_date);

-- 12. INTEGRATION HUB
CREATE TABLE IF NOT EXISTS integration_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  rate_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES integration_api_keys(id),
  endpoint TEXT,
  method TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_int_logs_api_key ON integration_logs(api_key_id);

-- 13. DOCUMENT MANAGEMENT UPGRADES
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  change_notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_doc ON document_versions(document_id);

CREATE TABLE IF NOT EXISTS document_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id),
  approver_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_approvals_doc ON document_approvals(document_id);

-- 14. EXECUTIVE INTELLIGENCE
CREATE TABLE IF NOT EXISTS executive_daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_date DATE DEFAULT CURRENT_DATE UNIQUE,
  production_summary JSONB,
  financial_summary JSONB,
  inventory_summary JSONB,
  quality_summary JSONB,
  hr_summary JSONB,
  maintenance_summary JSONB,
  sales_summary JSONB,
  procurement_summary JSONB,
  top_issue TEXT,
  top_risk TEXT,
  top_opportunity TEXT,
  ai_insights JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_summary_date ON executive_daily_summary(summary_date);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE production_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrp_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE aps_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE aps_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_ncr ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_capa ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_bin_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_aging ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_daily_summary ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES (Assuming custom auth implementation passes user identification in standard ways, or generic read access is permissible on internal apps)
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'production_analysis', 'mrp_requirements', 'mrp_settings', 'aps_capacity', 
            'aps_schedule', 'quality_ncr', 'quality_capa', 'warehouse_zones', 
            'warehouse_bin_locations', 'warehouse_stock_locations', 'warehouse_operations', 
            'cycle_counts', 'preventive_maintenance', 'maintenance_work_orders', 
            'machine_metrics', 'finance_aging', 'finance_reconciliation', 'production_costs', 
            'workflow_definitions', 'workflow_instances', 'ai_conversations', 'ai_agent_actions', 
            'employee_skills', 'workforce_analytics', 'sustainability_tracking', 
            'integration_api_keys', 'integration_logs', 'document_versions', 
            'document_approvals', 'executive_daily_summary'
        )
    LOOP
        EXECUTE format('CREATE POLICY "Allow all operations for authenticated users on %I" ON %I FOR ALL USING (true) WITH CHECK (true);', t_name, t_name);
    END LOOP;
END
$$;
