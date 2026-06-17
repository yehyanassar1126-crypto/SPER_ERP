require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_ANON_KEY;
const sbClient = createClient(sbUrl, sbKey);

async function run() {
  const adminDepts = ['HR', 'Finance', 'Sales', 'Procurement'];
  const adminRoles = ['owner', 'hr manager', 'hr', 'procurement manager'];
  
  const { data: users, error: userErr } = await sbClient.from('users').select('*');
  if (userErr) { console.error(userErr); return; }
  
  console.log(`Checking ${users.length} users for shift correction...`);
  
  for (let u of users) {
    let isAdminShift = adminDepts.includes(u.department) || adminRoles.includes(u.role);
    let newShift = isAdminShift ? 'admin' : 'morning'; // Default others to morning (08:00)
    
    // Only update if it's currently wrong, or if they are 3-shift system and need to be forced to correct default.
    // If someone is on 'afternoon' or 'night', we might not want to touch them unless they are admin.
    // But to be safe, if they are isAdminShift, force 'admin'.
    // If not isAdminShift and they currently have 'admin', force 'morning'.
    if (isAdminShift && u.shift !== 'admin') {
      console.log(`Setting ${u.full_name} (${u.department}) to admin shift (09:00)`);
      await sbClient.from('users').update({ shift: 'admin', shift_system: '3-shift' }).eq('id', u.id);
    } else if (!isAdminShift && u.shift === 'admin') {
      console.log(`Reverting ${u.full_name} (${u.department}) to morning shift (08:00)`);
      await sbClient.from('users').update({ shift: 'morning' }).eq('id', u.id);
    }
  }

  // Now fix attendance records
  const { data: attendance, error: attErr } = await sbClient.from('attendance').select('*');
  if (attErr) { console.error(attErr); return; }

  console.log(`Recalculating attendance for ${attendance.length} records...`);

  for (let att of attendance) {
    let u = users.find(x => x.id === att.employee_id);
    if (!u) continue;
    
    let isAdminShift = adminDepts.includes(u.department) || adminRoles.includes(u.role);
    let correctShift = isAdminShift ? 'admin' : (att.shift === 'admin' ? 'morning' : att.shift);
    
    if (u.role === 'owner') {
      await sbClient.from('attendance').update({ delay_minutes: 0, shift: correctShift }).eq('id', att.id);
      continue;
    }

    if (!att.check_in) continue;
    
    let checkInTime = new Date(att.check_in);
    let [yyyy, mm, dd] = att.date.split('-');
    
    // Expected start hour based on correct shift
    let expectedHour = 8; // Default morning
    if (correctShift === 'admin') expectedHour = 9;
    else if (correctShift === 'afternoon') expectedHour = 16;
    else if (correctShift === 'night') expectedHour = 0; // Midnight

    let expectedStart = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), expectedHour, 0, 0, 0);
    
    // If night shift, the expected start is midnight of that day (or the day after depending on logic, but we'll stick to simple)
    
    let diffMs = checkInTime.getTime() - expectedStart.getTime();
    let delayMin = 0;
    if (diffMs > 0 && diffMs < 12 * 60 * 60 * 1000) { // Limit delay to avoid crazy numbers if they checked in very late
      delayMin = Math.floor(diffMs / 60000);
    }
    
    // Update if there's a discrepancy
    if (att.shift !== correctShift || att.delay_minutes !== delayMin) {
      await sbClient.from('attendance').update({ shift: correctShift, delay_minutes: delayMin }).eq('id', att.id);
    }
  }

  console.log('Migration complete.');
}

run().catch(console.error);
