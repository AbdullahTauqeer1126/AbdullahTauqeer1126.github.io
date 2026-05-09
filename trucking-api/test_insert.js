const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  const payload = {
    owner_id: "test-owner",
    plate_number: "ABC-123",
    make: "Test",
    model: "Test",
    capacity: 10,
    truck_type: "flatbed",
    year: 2020,
    condition: "good",
    is_active: false,
    status: "PENDING",
    insurance_expiry: new Date().toISOString(),
    inspection_expiry: new Date().toISOString(),
    image_urls: [],
    documents: []
  };

  const { data, error } = await supabase.from('trucks').insert([payload]).select();
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
