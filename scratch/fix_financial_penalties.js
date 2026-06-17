require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_ANON_KEY;
const sbClient = createClient(sbUrl, sbKey);

async function run() {
  // 1. Get all users to calculate their daily rates
  const { data: users, error: userErr } = await sbClient.from('users').select('id, base_salary, role');
  if (userErr) { console.error(userErr); return; }

  // 2. Get all attendance records that have delays
  const { data: attendance, error: attErr } = await sbClient.from('attendance').select('*').gt('delay_minutes', 0);
  if (attErr) { console.error(attErr); return; }

  // 3. Get all late penalties in salary_adjustments
  const { data: adjustments, error: adjErr } = await sbClient.from('salary_adjustments').select('*').eq('type', 'late_penalty');
  if (adjErr) { console.error(adjErr); return; }

  console.log(`Checking ${attendance.length} attendance records with delays...`);
  
  let updatedCount = 0;
  let deletedCount = 0;

  // First, we should find adjustments that shouldn't exist anymore (delay_minutes = 0 now)
  const { data: allAttendance } = await sbClient.from('attendance').select('id, delay_minutes, date, employee_id');
  const zeroDelayMap = new Map();
  allAttendance.filter(a => a.delay_minutes === 0).forEach(a => {
    zeroDelayMap.set(`${a.employee_id}_${a.date}`, true);
  });

  for (let adj of adjustments) {
    // If the adjustment corresponds to a date where delay is now 0, delete it.
    let dateStr = adj.date ? adj.date.split('T')[0] : '';
    if (dateStr && zeroDelayMap.has(`${adj.employee_id}_${dateStr}`)) {
      console.log(`Deleting invalid penalty for ${adj.employee_id} on ${dateStr}`);
      await sbClient.from('salary_adjustments').delete().eq('id', adj.id);
      deletedCount++;
    }
  }

  // Now, calculate the correct penalty for attendance records with delay > 0
  for (let att of attendance) {
    let u = users.find(x => x.id === att.employee_id);
    if (!u || u.role === 'owner') continue;
    
    // Per minute deduction
    let dailyRate = (u.base_salary || 0) / 30;
    let minuteRate = dailyRate / (8 * 60);
    let penaltyAmount = att.delay_minutes * minuteRate;
    
    let description = `خصم تأخير تلقائي: ${att.delay_minutes} دقيقة`;
    
    // Check if an adjustment already exists for this attendance record
    let existingAdj = adjustments.find(a => a.employee_id === att.employee_id && a.date && a.date.startsWith(att.date));
    
    if (existingAdj) {
      // Update existing if amount or description is different
      if (Math.abs(existingAdj.amount - penaltyAmount) > 0.01 || existingAdj.description !== description) {
        await sbClient.from('salary_adjustments').update({
          amount: penaltyAmount,
          description: description
        }).eq('id', existingAdj.id);
        updatedCount++;
      }
    } else {
      // Insert new if it doesn't exist
      await sbClient.from('salary_adjustments').insert({
        employee_id: att.employee_id,
        type: 'late_penalty',
        amount: penaltyAmount,
        date: att.date + 'T00:00:00Z',
        description: description,
        status: 'approved'
      });
      updatedCount++;
    }
  }

  console.log(`Recalculation complete. Updated/Inserted: ${updatedCount}, Deleted invalid: ${deletedCount}`);
}

run().catch(console.error);
