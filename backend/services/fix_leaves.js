require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching approved leaves from 2026-06-01...");
  const { data: leaves, error: leavesErr } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'approved')
    .gte('start_date', '2026-06-01');

  if (leavesErr) {
    console.error("Error fetching leaves:", leavesErr);
    return;
  }
  
  console.log(`Found ${leaves.length} approved leaves.`);

  let totalInserted = 0;
  for (const l of leaves) {
    const sDate = new Date(l.start_date);
    const eDate = new Date(l.end_date);
    const duration = Math.ceil((eDate - sDate) / 86400000) + 1;
    
    const dates = [];
    const attRecords = [];

    for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
      if (l.days !== 0.5 && duration < 7 && d.getDay() === 5) continue; // Skip Friday
      const dateStr = d.toISOString().substring(0, 10);
      dates.push(dateStr);
      attRecords.push({
        employee_id: l.employee_id,
        employee_name: l.employee_name,
        department: l.department,
        date: dateStr,
        check_in: null,
        check_out: null,
        shift: 'morning',
        working_hours: 0,
        delay_minutes: 0,
        status: 'leave'
      });
    }

    if (dates.length > 0) {
      // First delete any existing attendance for this employee on these dates
      const { error: delErr } = await supabase
        .from('attendance')
        .delete()
        .eq('employee_id', l.employee_id)
        .in('date', dates);
      
      if (delErr) {
        console.error(`Error deleting existing attendance for ${l.employee_name}:`, delErr);
      } else {
        console.log(`Deleted existing attendance for ${l.employee_name} on dates: ${dates.join(', ')}`);
      }

      // Then insert the 'leave' records
      const { error: insErr } = await supabase
        .from('attendance')
        .insert(attRecords);

      if (insErr) {
        console.error(`Error inserting leave attendance for ${l.employee_name}:`, insErr);
      } else {
        totalInserted += attRecords.length;
        console.log(`Inserted ${attRecords.length} leave records for ${l.employee_name}`);
      }
    }
  }

  console.log(`Done! Total leave days inserted/updated: ${totalInserted}`);
}

run();
