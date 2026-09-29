-- Update status check constraint if it exists to allow 'Closed Automatically'
DO $$ 
BEGIN
  -- We use DO block to prevent errors if constraint doesn't exist
  BEGIN
    ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
  EXCEPTION WHEN undefined_object THEN 
    -- Ignore if doesn't exist
  END;
END $$;

-- Optional: Add the constraint back with the new status
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'absent', 'checked_in', 'leave', 'Closed Automatically'));

-- Ensure modification_reason column exists (in case it wasn't there)
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS modification_reason text;
