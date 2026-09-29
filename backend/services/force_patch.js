const fs = require('fs');

const SUPABASE_URL = 'https://ygquwwjbdorofqdnwdrr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bH1jFjG9uoy2i0i5c2jMbw_cFasQnyr';

async function run() {
  const options = {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ delay_minutes: 0 })
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?date=eq.2026-06-09`, options);
  if (!res.ok) {
    console.error("ERROR:", await res.text());
  } else {
    console.log("SUCCESS:", await res.json());
  }
}

run().catch(console.error);
