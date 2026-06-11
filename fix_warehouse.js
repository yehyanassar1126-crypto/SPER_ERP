const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env file manually
const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function fix() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category, warehouse_type');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log('Total items:', data.length);
  
  let updatedCount = 0;
  for (const item of data) {
    if (['Maintenance', 'Workshop', 'Supplies', 'Chemicals'].includes(item.category)) {
      if (item.warehouse_type !== 'general') {
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ warehouse_type: 'general' })
          .eq('id', item.id);
          
        if (updateError) {
          console.error(`Failed to update ${item.name}:`, updateError);
        } else {
          console.log(`Moved ${item.name} (${item.category}) to General Warehouse`);
          updatedCount++;
        }
      }
    }
  }
  
  console.log(`Successfully moved ${updatedCount} items to General Warehouse.`);
}

fix();
