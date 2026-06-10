-- 1. Allow 'leave' in attendance status
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check CHECK (status IN ('present', 'checked_in', 'absent', 'leave'));

-- 2. Clear old attendance records for those approved leave dates (to prevent duplicates like Nasser's check_in)
DELETE FROM attendance 
WHERE (employee_id, date) IN (
    SELECT l.employee_id, generate_series(l.start_date::date, l.end_date::date, '1 day'::interval)::date
    FROM leave_requests l
    WHERE l.status = 'approved' AND l.start_date >= '2026-06-01'
);

-- 3. Insert 'leave' records for all approved leaves since 2026-06-01
INSERT INTO attendance (employee_id, employee_name, department, date, check_in, check_out, shift, working_hours, delay_minutes, status)
SELECT 
    l.employee_id, 
    l.employee_name, 
    l.department, 
    d.date, 
    NULL, -- check_in
    NULL, -- check_out
    'morning', 
    0, 
    0, 
    'leave'
FROM leave_requests l
CROSS JOIN LATERAL (
    SELECT generate_series(l.start_date::date, l.end_date::date, '1 day'::interval)::date AS date
) d
WHERE l.status = 'approved' 
  AND l.start_date >= '2026-06-01'
  AND (l.days = 0.5 OR EXTRACT(ISODOW FROM d.date) != 5); -- Skip Fridays unless half day
