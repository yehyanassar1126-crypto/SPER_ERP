require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  let { data: users } = await supabase.from('users').select('*').eq('username', '123456789');
  let { data: suppliers } = await supabase.from('suppliers').select('*').eq('email', '123456789');
  console.log("USERS:", users);
  console.log("SUPPLIERS:", suppliers);
}
run();
