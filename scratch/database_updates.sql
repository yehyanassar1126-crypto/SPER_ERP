-- ==============================================
-- 4. UPDATE USERS ROLE CHECK CONSTRAINT
-- ==============================================

-- Drop the role constraint completely, since the system roles are dynamically
-- evolving (e.g. 'nursing management' was added) and the front-end dropdown 
-- already controls the allowed input strictly.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- (Optional) If you really want to keep the constraint, you must list all existing roles
-- including the new ones, like this:
-- ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (
--   role IN (
--     'owner', 'hr manager', 'hr', 'manager', 'hall manager', 'department head', 
--     'supervisor', 'procurement manager', 'procurement specialist', 'warehouse manager', 
--     'engineering manager', 'engineer', 'spare parts inspector', 'technical office', 
--     'it', 'employee', 'nursing management', 'finance manager', 'accountant',
--     'cfo', 'quality manager', 'qc inspector', 'sales manager', 'planning manager'
--   )
-- );
