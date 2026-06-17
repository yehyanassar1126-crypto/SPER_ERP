CREATE TABLE IF NOT EXISTS spare_parts_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  requested_by uuid REFERENCES auth.users(id),
  requested_by_name text,
  department text,
  machine_or_vehicle text,
  item_name text NOT NULL,
  requested_quantity numeric DEFAULT 1,
  
  -- Workflow status
  -- 'pending_approval' -> 'approved' -> 'issued' -> 'damaged_returned' -> 'quality_checked'
  status text DEFAULT 'pending_approval',
  
  -- Warehouse Issue
  issued_at timestamp with time zone,
  new_part_number text,
  issued_by uuid REFERENCES auth.users(id),
  
  -- Warehouse Return (Damaged)
  returned_at timestamp with time zone,
  old_part_number text,
  received_by uuid REFERENCES auth.users(id),
  
  -- Quality Check
  quality_checked_at timestamp with time zone,
  quality_checked_by_name text,
  life_time_percentage numeric,
  damage_category text,
  damage_reason text,
  damage_type text,
  is_natural_wear boolean,
  is_repairable boolean,
  repair_cost_estimate numeric,
  recommendation text,
  quality_notes text
);

ALTER TABLE spare_parts_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for spare parts" ON spare_parts_requests FOR ALL USING (true) WITH CHECK (true);
