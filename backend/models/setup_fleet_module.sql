-- ==========================================
-- Fleet & Drivers Management System (إدارة الأسطول والسائقين)
-- ==========================================

-- 1. Internal Drivers (السائقين الداخليين)
CREATE TABLE IF NOT EXISTS fleet_internal_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Linked to HR User
    driver_code VARCHAR(50) UNIQUE NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    national_id VARCHAR(50),
    photo_url TEXT,
    license_number VARCHAR(100),
    license_type VARCHAR(50),
    license_expiry DATE,
    department VARCHAR(100),
    manager_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'متاح' CHECK (status IN ('متاح', 'في رحلة', 'إجازة', 'موقوف')),
    trips_count INTEGER DEFAULT 0,
    total_km DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    allowances DECIMAL(10,2) DEFAULT 0,
    working_hours DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. External Drivers & Transport Companies (السائقين وشركات النقل الخارجية)
CREATE TABLE IF NOT EXISTS fleet_external_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_info TEXT,
    car_number VARCHAR(50) NOT NULL,
    car_type VARCHAR(100),
    capacity DECIMAL(10,2), -- الحمولة
    transport_rate DECIMAL(10,2), -- سعر النقل
    operating_areas TEXT,
    supplier_rating DECIMAL(3,2) DEFAULT 0,
    previous_trips INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'متاح' CHECK (status IN ('متاح', 'في رحلة', 'موقوف')),
    document_urls TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Fleet Vehicles (سيارات الشركة)
CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_number VARCHAR(50) UNIQUE NOT NULL,
    plate_number VARCHAR(50) NOT NULL,
    car_type VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    department VARCHAR(100),
    current_driver_id UUID REFERENCES fleet_internal_drivers(id),
    status VARCHAR(50) DEFAULT 'متاحة' CHECK (status IN ('متاحة', 'في رحلة', 'في الصيانة', 'خارج الخدمة')),
    odometer DECIMAL(10,2) DEFAULT 0,
    fuel_consumption DECIMAL(10,2) DEFAULT 0,
    oil_change_due DECIMAL(10,2),
    maintenance_due DECIMAL(10,2),
    insurance_number VARCHAR(100),
    insurance_expiry DATE,
    license_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Trips (سجل الرحلات)
CREATE TABLE IF NOT EXISTS fleet_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255),
    sales_order_id UUID, -- Link to sales_orders if exists
    purchase_order_id UUID,
    driver_type VARCHAR(50) CHECK (driver_type IN ('internal', 'external')),
    internal_driver_id UUID REFERENCES fleet_internal_drivers(id),
    external_driver_id UUID REFERENCES fleet_external_drivers(id),
    vehicle_id UUID REFERENCES fleet_vehicles(id),
    loading_date TIMESTAMP WITH TIME ZONE,
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'مجدولة' CHECK (status IN ('مجدولة', 'جاري التحميل', 'في الطريق', 'تم التوصيل', 'ملغاة')),
    distance DECIMAL(10,2) DEFAULT 0,
    transport_cost DECIMAL(15,2) DEFAULT 0,
    fuel_qty DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Incidents & Violations (المخالفات والحوادث)
CREATE TABLE IF NOT EXISTS fleet_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES fleet_trips(id),
    internal_driver_id UUID REFERENCES fleet_internal_drivers(id),
    external_driver_id UUID REFERENCES fleet_external_drivers(id),
    vehicle_id UUID REFERENCES fleet_vehicles(id),
    incident_type VARCHAR(50) CHECK (incident_type IN ('مخالفة', 'حادث')),
    incident_date TIMESTAMP WITH TIME ZONE,
    details TEXT,
    cost DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Maintenance & Fuel Logs (الصيانة والوقود)
CREATE TABLE IF NOT EXISTS fleet_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES fleet_vehicles(id),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    maintenance_type VARCHAR(100),
    details TEXT,
    cost DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'مفتوح' CHECK (status IN ('مفتوح', 'جاري العمل', 'مغلق')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- Views for Dashboards & Alerts
-- ==========================================
CREATE OR REPLACE VIEW fleet_alerts AS
SELECT 'License Expiry' AS alert_type, driver_name AS entity, license_expiry AS due_date FROM fleet_internal_drivers WHERE license_expiry < CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 'Vehicle License Expiry', car_number, license_expiry FROM fleet_vehicles WHERE license_expiry < CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 'Vehicle Insurance Expiry', car_number, insurance_expiry FROM fleet_vehicles WHERE insurance_expiry < CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 'Maintenance Due', car_number, CURRENT_DATE FROM fleet_vehicles WHERE odometer >= maintenance_due - 500;
