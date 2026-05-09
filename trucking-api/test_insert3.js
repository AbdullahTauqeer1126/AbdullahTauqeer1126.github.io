const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  let payload = {
    owner_id: "test-owner",
    plate_number: "ABC-1234",
    make: "Test",
    model: "Test",
    capacity: 10,
    truck_type: "flatbed",
    year: 2020,
    is_active: false,
    status: "PENDING",
    insurance_expiry: new Date().toISOString(),
    inspection_expiry: new Date().toISOString(),
    image_urls: []
  };

  while (true) {
    const { data, error } = await supabase.from('trucks').insert([payload]).select();
    if (error) {
      console.log('Error:', error.message);
      const match = error.message.match(/Could not find the '(.+)' column/);
      if (match && match[1]) {
        console.log(`Removing column: ${match[1]}`);
        delete payload[match[1]];
      } else {
        console.log('Unknown error, stopping.', error);
        break;
      }
    } else {
      console.log('Success! Final columns:', Object.keys(payload));
      break;
    }
  }
}

test();
