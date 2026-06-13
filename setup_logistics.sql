-- ============================================================
-- Logistics & Transportation (الحركة والنقل) Schema
-- Execute this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS logistics_drivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  car_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT,
  driver_id UUID REFERENCES logistics_drivers(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  car_number TEXT NOT NULL,
  destination TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE logistics_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_movements ENABLE ROW LEVEL SECURITY;

-- Allow selection and insertion
CREATE POLICY "logistics_drivers_view" ON logistics_drivers FOR SELECT USING (true);
CREATE POLICY "logistics_drivers_insert" ON logistics_drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "logistics_drivers_update" ON logistics_drivers FOR UPDATE USING (true);

CREATE POLICY "logistics_movements_view" ON logistics_movements FOR SELECT USING (true);
CREATE POLICY "logistics_movements_insert" ON logistics_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "logistics_movements_update" ON logistics_movements FOR UPDATE USING (true);
