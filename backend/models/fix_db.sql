ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS loan_deduction NUMERIC(10,2) DEFAULT 0;
