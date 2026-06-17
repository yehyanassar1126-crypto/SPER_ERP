ALTER TABLE spare_parts_requests 
ADD COLUMN IF NOT EXISTS damage_category text,
ADD COLUMN IF NOT EXISTS repair_cost_estimate numeric,
ADD COLUMN IF NOT EXISTS recommendation text,
ADD COLUMN IF NOT EXISTS quality_checked_by_name text;
