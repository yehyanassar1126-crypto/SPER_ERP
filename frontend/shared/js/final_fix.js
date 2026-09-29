const fs = require('fs');

const SUPABASE_URL = 'https://ygquwwjbdorofqdnwdrr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr';

async function fetchSupabase(table, method, body = null, query = '') {
  const options = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error (${method} ${table}): ${err}`);
  }
  if (method === 'GET') {
    return await res.json();
  }
  return true;
}

const SHIFTS = {
  day:     { start: '08:00', end: '20:00', hours: 12, system: '2-shift' },
  morning: { start: '08:00', end: '16:00', hours: 8,  system: '3-shift' },
  evening: { start: '16:00', end: '00:00', hours: 8,  system: '3-shift' },
  night:   { start: '00:00', end: '08:00', hours: 8,  system: '3-shift' }
};

function getShiftConfig(shiftKey, shiftSystem) {
  if (shiftKey === 'night' && shiftSystem === '2-shift') return { start: '20:00', end: '08:00', hours: 12, system: '2-shift' };
  if (shiftKey === 'day') return SHIFTS.day;
  return SHIFTS[shiftKey] || SHIFTS.morning;
}

function formatDelay(mins) {
  if (mins < 60) return mins + ' دقيقة';
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  if (m === 0) return h + ' ساعة';
  return h + ' ساعة و ' + m + ' دقيقة';
}

async function run() {
  console.log('Fetching all users...');
  const users = await fetchSupabase('users', 'GET', null, '?select=id,full_name,department,base_salary,shift,shift_system');
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  console.log('Fetching attendance since 2026-06-01...');
  const attendance = await fetchSupabase('attendance', 'GET', null, '?date=gte.2026-06-01');

  for (const record of attendance) {
    const user = userMap[record.employee_id];
    if (!user || !record.check_in) continue;

    const sys = user.shift_system || '3-shift';
    const shiftKey = user.shift || 'morning';
    const shiftConfig = getShiftConfig(shiftKey, sys);

    const checkInTime = new Date(record.check_in);
    const expectedDate = new Date(`${record.date}T${shiftConfig.start}:00+03:00`);
    let delay = Math.max(0, Math.floor((checkInTime - expectedDate) / 60000));

    if (delay !== record.delay_minutes) {
      await fetchSupabase('attendance', 'PATCH', { delay_minutes: delay }, `?id=eq.${record.id}`);
      console.log(`Updated record ${record.id} to delay_minutes=${delay}`);
    }
  }

  console.log('Deleting all automatic late penalties for June...');
  const adjs = await fetchSupabase('salary_adjustments', 'GET', null, "?reason=like.*خصم تأخير تلقائي*");
  for (const adj of adjs) {
    if (adj.month === '2026-06') {
      await fetchSupabase('salary_adjustments', 'DELETE', null, `?id=eq.${adj.id}`);
    }
  }

  console.log('Recreating necessary penalties...');
  const updatedAttendance = await fetchSupabase('attendance', 'GET', null, '?date=gte.2026-06-01');
  for (const att of updatedAttendance) {
    if (att.delay_minutes > 15) {
      const user = userMap[att.employee_id];
      if (!user) continue;

      const dailyRate = Math.round((user.base_salary || 0) / 26);
      let lateDed = 0;
      let label = '';
      if (att.delay_minutes > 360) {
        lateDed = dailyRate;
        label = 'يوم كامل';
      } else if (att.delay_minutes > 120) {
        lateDed = dailyRate * 0.5;
        label = 'نص يوم';
      } else if (att.delay_minutes > 15) {
        lateDed = dailyRate * 0.25;
        label = 'ربع يوم';
      }
      lateDed = Math.round(lateDed);

      if (lateDed > 0) {
        await fetchSupabase('salary_adjustments', 'POST', {
          employee_id: user.id,
          employee_name: user.full_name,
          department: user.department,
          type: 'penalty',
          amount: lateDed,
          reason: 'خصم تأخير تلقائي: ' + label + ' — تأخير ' + formatDelay(att.delay_minutes) + ' يوم ' + att.date,
          month: '2026-06',
          status: 'approved',
          requested_by: 'System Auto'
        });
        console.log(`Inserted penalty for ${user.full_name}: ${lateDed}`);
      }
    }
  }
  console.log('Finished fixing all data!');
}

run().catch(console.error);
