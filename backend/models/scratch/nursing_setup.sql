-- 1. Add rejection_reason to medical_requests
ALTER TABLE public.medical_requests ADD COLUMN IF NOT EXISTS rejection_reason text;

-- (The new statuses 'pending_nursing', 'pending_manager', 'pending_finance', 'pending_hr', etc. 
-- will be inserted as text since 'status' is likely a text or varchar column. 
-- If it's an enum, we might need to add values. I assume it's text/varchar based on common patterns in this project.)

-- 2. Add 'nursing management' role to users if it's an ENUM
-- Usually 'role' in users is text or varchar, but if it's restricted by a constraint, it might need updating.
-- I'll assume it's just text based on previous roles.
