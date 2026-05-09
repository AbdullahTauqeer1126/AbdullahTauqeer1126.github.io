const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.from('trucks').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
  
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  }
}

test();
