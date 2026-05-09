const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function testStatus() {
  const statuses = ['PENDING', 'pending', 'UNDER_REVIEW', 'under_review', 'UNAVAILABLE', 'unavailable']
  
  for (const s of statuses) {
    console.log(`Testing status: ${s}...`)
    const { error } = await supabase.from('trucks').insert([{
      owner_id: '97aa8433-0387-4ad7-8277-5e091c8367e2',
      registration: 'TEST-' + Math.floor(Math.random() * 1000),
      make: 'Test',
      model: 'Test',
      capacity: 10,
      type: 'flatbed',
      status: s,
      is_active: false
    }])
    
    if (error) {
      console.log(`❌ Failed: ${error.message}`)
    } else {
      console.log(`✅ Success!`)
      // Clean up
      await supabase.from('trucks').delete().eq('status', s).eq('make', 'Test')
    }
  }
}

testStatus()
