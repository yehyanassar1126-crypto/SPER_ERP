-- ==========================================
-- Fleet & Logistics Management Tables
-- ==========================================

-- 1. Cars Table (السيارات)
CREATE TABLE IF NOT EXISTS public.cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(50) NOT NULL UNIQUE,
    car_model VARCHAR(100) NOT NULL,
    driver_id UUID REFERENCES auth.users(id),
    current_odometer DECIMAL(10,2) DEFAULT 0, -- قراءة العداد الحالية
    license_expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'In Maintenance', 'Out of Service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Car Trips (المأموريات وعداد السيارة)
CREATE TABLE IF NOT EXISTS public.car_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES public.cars(id) NOT NULL,
    driver_id UUID REFERENCES auth.users(id) NOT NULL,
    trip_date DATE DEFAULT CURRENT_DATE,
    destination TEXT NOT NULL,
    
    -- Odometer Readings (قراءات العداد قبل وبعد المشوار)
    odometer_start DECIMAL(10,2) NOT NULL,
    odometer_end DECIMAL(10,2),
    
    -- Calculated Distance (المسافة المقطوعة آلياً)
    distance_covered DECIMAL(10,2) GENERATED ALWAYS AS (odometer_end - odometer_start) STORED,
    
    -- Fuel tracking
    fuel_consumed_liters DECIMAL(10,2),
    
    status VARCHAR(50) DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Maintenance & Fuel Logs (الصيانة والوقود)
CREATE TABLE IF NOT EXISTS public.car_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES public.cars(id) NOT NULL,
    log_type VARCHAR(50) CHECK (log_type IN ('Fuel', 'Maintenance', 'Tires', 'Oil Change')),
    cost DECIMAL(15,2) NOT NULL,
    odometer_at_log DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Setup RLS (Row Level Security)
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.cars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON public.car_trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON public.car_maintenance_logs FOR SELECT TO authenticated USING (true);

-- Allow admins/fleet managers to insert/update
CREATE POLICY "Allow all for admins" ON public.cars FOR ALL TO authenticated USING ( (auth.jwt() ->> 'role') = 'admin' );
CREATE POLICY "Allow all for admins" ON public.car_trips FOR ALL TO authenticated USING ( (auth.jwt() ->> 'role') = 'admin' );
CREATE POLICY "Allow all for admins" ON public.car_maintenance_logs FOR ALL TO authenticated USING ( (auth.jwt() ->> 'role') = 'admin' );
