-- ==========================================
-- Patch to Fix Fleet Vehicles Table & View
-- ==========================================

-- 1. Ensure all columns exist in fleet_vehicles (In case the table existed previously with a different schema)
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS car_number VARCHAR(50);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS car_type VARCHAR(100);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS current_driver_id UUID REFERENCES fleet_internal_drivers(id);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'متاحة';
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS odometer DECIMAL(10,2) DEFAULT 0;
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS fuel_consumption DECIMAL(10,2) DEFAULT 0;
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS oil_change_due DECIMAL(10,2);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS maintenance_due DECIMAL(10,2);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(100);
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE IF EXISTS fleet_vehicles ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Drop the old view if it somehow was created with wrong columns
DROP VIEW IF EXISTS fleet_alerts;

-- 3. Recreate the View
CREATE OR REPLACE VIEW fleet_alerts AS
SELECT 'License Expiry' AS alert_type, driver_name AS entity, license_expiry AS due_date FROM fleet_internal_drivers WHERE license_expiry < CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 'Vehicle License Expiry', car_number, license_expiry FROM fleet_vehicles WHERE license_expiry < CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 'Vehicle Insurance Expiry', car_number, insurance_expiry FROM fleet_vehicles WHERE insurance_expiry < CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 'Maintenance Due', car_number, CURRENT_DATE FROM fleet_vehicles WHERE odometer >= maintenance_due - 500;
