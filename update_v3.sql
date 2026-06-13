-- Update users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS insurance_salary NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS employee_type VARCHAR(255) DEFAULT 'General',
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Update loans table for the new workflow
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS employee_receipt_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, rejected
ADD COLUMN IF NOT EXISTS hr_final_approval BOOLEAN DEFAULT false;

-- Add new departments to the allowed list (if it's an ENUM or just insert if it's a separate table, but we use VARCHAR check constraints often or just simple inserts)
-- If department is just a VARCHAR, no schema change needed, but we should insert them in the constants or if there's a departments table. (Our system uses constants.js and varchar).

-- Create Engineering Projects Table
CREATE TABLE IF NOT EXISTS public.engineering_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Maintenance Requests Table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_name VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    reported_by UUID REFERENCES public.users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, resolved
    priority VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Fleet Vehicles Table
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_name VARCHAR(255) NOT NULL,
    plate_number VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, out_of_service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Fleet Trips Table
CREATE TABLE IF NOT EXISTS public.fleet_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.fleet_vehicles(id),
    driver_id UUID REFERENCES public.users(id),
    destination VARCHAR(255) NOT NULL,
    trip_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Suppliers Portal Tables
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL, -- for portal login
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.supplier_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES public.suppliers(id),
    order_details TEXT NOT NULL,
    total_amount NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, delivered
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.supplier_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES public.suppliers(id),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- cash, bank_transfer, check
    check_status VARCHAR(50) DEFAULT 'N/A', -- N/A, not_checked, checked
    transaction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for new tables
ALTER TABLE public.engineering_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (admin access for now)
CREATE POLICY "Allow all for authenticated users" ON public.engineering_projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.maintenance_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.fleet_vehicles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.fleet_trips FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.supplier_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.supplier_transactions FOR ALL USING (auth.role() = 'authenticated');
