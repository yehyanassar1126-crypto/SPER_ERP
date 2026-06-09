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
  if (body) {
    options.body = JSON.stringify(body);
    // Prefer MUST be return=representation for Supabase POST/PATCH to return data, 
    // BUT we found it might be causing issues? Actually let's just not use Prefer for PATCH and check GET.
  }

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

async function run() {
  console.log('Fetching attendance for June 9...');
  const data = await fetchSupabase('attendance', 'GET', null, '?date=eq.2026-06-09');
  console.log('June 9 records:', data);
}

run().catch(console.error);
