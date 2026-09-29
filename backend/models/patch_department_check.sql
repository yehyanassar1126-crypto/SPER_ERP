-- Drop the department check constraint from the users table so we can add new departments like Driver
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_department_check;
