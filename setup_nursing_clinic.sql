-- ==============================================================================
-- 🏥 SMART FACTORY ERP: NURSING & FACTORY CLINIC MODULE SETUP
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor to enable full clinic persistence:
-- 1. Daily Clinic Visits & Triage (سجل الزيارات والفحوصات)
-- 2. Work Injuries & OSH Safety Incidents (إصابات العمل والسلامة المهنية)
-- 3. Medical Rest & Sick Leave Permits (تصاريح الراحة والإجازات المرضية)
-- 4. Clinic Pharmacy & First-Aid Inventory (صيدلية العيادة وإدارة الأدوية)
-- 5. Medication Dispense Logs (سجل صرف المستلزمات الطبية)
-- ==============================================================================

-- 1. DAILY CLINIC VISITS & TRIAGE TABLE
CREATE TABLE IF NOT EXISTS public.clinic_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  department text,
  visit_type text NOT NULL DEFAULT 'checkup', -- checkup, acute, work_injury, follow_up, first_aid
  blood_pressure text,                       -- e.g. 120/80
  temperature numeric,                       -- e.g. 37.2
  heart_rate numeric,                        -- e.g. 78 bpm
  blood_sugar numeric,                       -- e.g. 110 mg/dL
  complaint text,                            -- Chief complaint / symptoms
  diagnosis text,                            -- Medical assessment
  treatment text,                            -- Procedure / aid provided
  medicine_dispensed text,                   -- Medication given
  medicine_qty numeric DEFAULT 0,
  disposition text DEFAULT 'return_to_work', -- return_to_work, clinic_rest, rest_permit, hospital_transfer
  referral_details text,                     -- Hospital or external referral notes
  notes text,
  attended_by text                           -- Nurse / Doctor name
);

ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_visits" ON public.clinic_visits;
CREATE POLICY "Enable all for clinic_visits" ON public.clinic_visits FOR ALL USING (true) WITH CHECK (true);

-- 2. WORK INJURIES & SAFETY INCIDENTS TABLE (OSH COMPLIANT)
CREATE TABLE IF NOT EXISTS public.clinic_injuries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  incident_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  department text,
  location text,                             -- Factory Hall / Line / Machine ID
  severity text NOT NULL DEFAULT 'minor',    -- minor, moderate, severe, critical
  injury_type text NOT NULL,                 -- cut, burn, fracture, chemical, eye, shock, fall, other
  description text NOT NULL,                 -- Description of accident
  root_cause text,                           -- Safety root cause
  immediate_action text,                     -- First aid administered
  hospitalized boolean DEFAULT false,        -- Transferred to hospital?
  hospital_name text,
  lost_work_days numeric DEFAULT 0,          -- Estimated lost days
  supervisor_notified text,                  -- Hall Manager / OSH Officer
  status text DEFAULT 'under_treatment',     -- under_treatment, rest, hospitalized, recovered, osh_investigation
  investigation_notes text,
  logged_by text
);

ALTER TABLE public.clinic_injuries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_injuries" ON public.clinic_injuries;
CREATE POLICY "Enable all for clinic_injuries" ON public.clinic_injuries FOR ALL USING (true) WITH CHECK (true);

-- 3. MEDICAL REST & SICK LEAVE PERMITS TABLE
CREATE TABLE IF NOT EXISTS public.clinic_rest_permits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  department text,
  permit_type text DEFAULT 'clinic_rest',    -- clinic_rest (2h), rest_of_day, sick_leave_short, sick_leave_extended
  start_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_time timestamp with time zone,
  duration text,                             -- e.g. '2 hours', '1 day', '3 days'
  diagnosis text,
  gate_pass_authorized boolean DEFAULT false,-- Security gate clearance
  status text DEFAULT 'active',              -- active, returned_to_work, expired, cancelled
  returned_at timestamp with time zone,
  issued_by text,
  notes text
);

ALTER TABLE public.clinic_rest_permits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_rest_permits" ON public.clinic_rest_permits;
CREATE POLICY "Enable all for clinic_rest_permits" ON public.clinic_rest_permits FOR ALL USING (true) WITH CHECK (true);

-- 4. CLINIC PHARMACY & FIRST-AID MEDICATIONS INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.clinic_medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,                        -- e.g. Panadol Extra
  generic_name text,                         -- Paracetamol 500mg
  category text NOT NULL DEFAULT 'first_aid',-- analgesic, antiseptic, wound_care, gastrointestinal, respiratory, burn_care, emergency
  unit text NOT NULL DEFAULT 'Box',          -- Box, Strip, Bottle, Ampoule, Tube, Pack
  current_stock numeric NOT NULL DEFAULT 0,
  min_threshold numeric NOT NULL DEFAULT 5,  -- Low stock trigger
  expiry_date date,
  batch_no text,
  location text,                             -- Cabinet / Shelf
  notes text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clinic_medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_medications" ON public.clinic_medications;
CREATE POLICY "Enable all for clinic_medications" ON public.clinic_medications FOR ALL USING (true) WITH CHECK (true);

-- 5. MEDICATION DISPENSE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.clinic_dispense_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  medication_id uuid REFERENCES public.clinic_medications(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  employee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  reason text,
  visit_id uuid REFERENCES public.clinic_visits(id) ON DELETE SET NULL,
  dispensed_by text
);

ALTER TABLE public.clinic_dispense_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for clinic_dispense_logs" ON public.clinic_dispense_logs;
CREATE POLICY "Enable all for clinic_dispense_logs" ON public.clinic_dispense_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. ENSURE REJECTION_REASON COLUMN IN MEDICAL_REQUESTS
ALTER TABLE public.medical_requests ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 7. INITIAL SEED DATA FOR CLINIC PHARMACY (Standard Factory First-Aid Stock)
INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Panadol Extra', 'Paracetamol 500mg + Caffeine 65mg', 'analgesic', 'Box', 25, 5, CURRENT_DATE + INTERVAL '18 months', 'LOT-PA2401', 'Cabinet A1'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Panadol Extra');

INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Betadine Antiseptic 10%', 'Povidone-Iodine 10%', 'antiseptic', 'Bottle', 12, 3, CURRENT_DATE + INTERVAL '24 months', 'LOT-BT9921', 'Cabinet A2'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Betadine Antiseptic 10%');

INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Dermazin 1% Burn Cream', 'Silver Sulfadiazine', 'burn_care', 'Tube', 8, 3, CURRENT_DATE + INTERVAL '12 months', 'LOT-DM4401', 'First Aid Kit #1'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Dermazin 1% Burn Cream');

INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Sterile Gauze Pads 10x10', 'Cotton Gauze Dressing', 'wound_care', 'Pack', 50, 10, CURRENT_DATE + INTERVAL '36 months', 'LOT-GZ8810', 'Drawer B'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Sterile Gauze Pads 10x10');

INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Eye Wash Sterile Saline', 'Sodium Chloride 0.9%', 'emergency', 'Bottle', 4, 3, CURRENT_DATE + INTERVAL '14 months', 'LOT-EW1109', 'Emergency Station'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Eye Wash Sterile Saline');

INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Ventolin Inhaler 100mcg', 'Salbutamol', 'respiratory', 'Box', 3, 2, CURRENT_DATE + INTERVAL '16 months', 'LOT-VT5520', 'Emergency Cabinet'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Ventolin Inhaler 100mcg');

INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Visceralgine Forte', 'Tiemonium Methylsulfate', 'gastrointestinal', 'Box', 15, 4, CURRENT_DATE + INTERVAL '20 months', 'LOT-VC3032', 'Cabinet A1'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Visceralgine Forte');

INSERT INTO public.clinic_medications (name, generic_name, category, unit, current_stock, min_threshold, expiry_date, batch_no, location)
SELECT 'Waterproof Bandages (Assorted)', 'Elastic Adhesive Strips', 'wound_care', 'Box', 40, 10, CURRENT_DATE + INTERVAL '30 months', 'LOT-BD7712', 'First Aid Kit #2'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_medications WHERE name = 'Waterproof Bandages (Assorted)');

-- 8. SEED PERMISSION TEMPLATES FOR NURSING & MEDICAL ROLES
INSERT INTO public.permission_templates (role, screen_id, action, granted)
VALUES
  ('nursing management', 'nursing-page', 'view', true),
  ('nursing management', 'nursing-page', 'create', true),
  ('nursing management', 'nursing-page', 'edit', true),
  ('nursing management', 'nursing-page', 'delete', true),
  ('nursing management', 'nursing-page', 'approve', true),
  ('nursing management', 'nursing-page', 'print', true),
  ('nursing management', 'nursing-page', 'export', true),
  ('nursing management', 'nursing-medical-approvals', 'view', true),
  ('nursing management', 'nursing-medical-approvals', 'approve', true),
  ('nursing management', 'nursing-medical-approvals', 'reject', true),
  ('nursing management', 'medical-requests', 'view', true),
  ('nurse', 'nursing-page', 'view', true),
  ('nurse', 'nursing-page', 'create', true),
  ('nurse', 'nursing-page', 'edit', true),
  ('nurse', 'nursing-page', 'print', true),
  ('nurse', 'nursing-page', 'export', true),
  ('nurse', 'nursing-medical-approvals', 'view', true),
  ('nurse', 'nursing-medical-approvals', 'approve', true),
  ('nurse', 'medical-requests', 'view', true),
  ('hr manager', 'nursing-page', 'view', true),
  ('hr manager', 'nursing-page', 'export', true),
  ('hr manager', 'nursing-page', 'print', true),
  ('hr', 'nursing-page', 'view', true),
  ('hr', 'nursing-page', 'print', true)
ON CONFLICT DO NOTHING;

