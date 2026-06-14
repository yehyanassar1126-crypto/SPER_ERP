require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_ANON_KEY;
const sbClient = createClient(sbUrl, sbKey);

async function run() {
  const adminDepts = ['Administration', 'HR', 'Finance', 'Secretariat', 'Sales'];
  const adminRoles = ['hr manager', 'manager', 'department head', 'procurement manager', 'engineering manager', 'hr'];
  
  const { data: users, error: userErr } = await sbClient.from('users').select('*');
  if (userErr) { console.error(userErr); return; }
  
  let adminUsers = users.filter(u => adminDepts.includes(u.department) || adminRoles.includes(u.role) || u.role === 'owner');
  let adminUserIds = adminUsers.map(u => u.id);

  console.log(`Updating ${adminUserIds.length} users to admin shift...`);
  
  for (let u of adminUsers) {
    await sbClient.from('users').update({ shift: 'admin', shift_system: '3-shift' }).eq('id', u.id);
  }

  const { data: attendance, error: attErr } = await sbClient.from('attendance')
    .select('*')
    .in('employee_id', adminUserIds)
    .gte('date', '2026-06-01');

  if (attErr) { console.error(attErr); return; }

  console.log(`Recalculating attendance for ${attendance.length} records...`);

  for (let att of attendance) {
    let u = adminUsers.find(x => x.id === att.employee_id);
    if (!u) continue;
    
    if (u.role === 'owner') {
      await sbClient.from('attendance').update({ delay_minutes: 0, shift: 'admin' }).eq('id', att.id);
      continue;
    }

    if (!att.check_in) continue;
    let checkInTime = new Date(att.check_in);
    let [yyyy, mm, dd] = att.date.split('-');
    let expectedStart = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), 9, 0, 0, 0);
    
    let diffMs = checkInTime.getTime() - expectedStart.getTime();
    let delayMin = 0;
    if (diffMs > 0) {
      delayMin = Math.floor(diffMs / 60000);
    }
    
    await sbClient.from('attendance').update({ shift: 'admin', delay_minutes: delayMin }).eq('id', att.id);
  }

  console.log('Migration complete.');
}

run().catch(console.error);
