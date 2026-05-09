const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function getConstraint() {
  const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'trucks' })
  if (error) {
    console.log('RPC failed, trying raw query if possible (likely not)')
    // Since we can't run raw SQL, let's try to find it in the schema files
  } else {
    console.log('Constraints:', data)
  }
}

async function checkStatusColumn() {
  // Let's try to insert a row with a status we think might work
  const testStatus = 'APPROVED'
  const { error } = await supabase.from('trucks').insert([{
    owner_id: '97aa8433-0387-4ad7-8277-5e091c8367e2',
    registration: 'TEST-' + Date.now(),
    make: 'Test',
    model: 'Test',
    capacity: 10,
    type: 'flatbed',
    status: testStatus,
    is_active: false
  }])
  
  if (error) {
    console.log(`❌ Status '${testStatus}' failed: ${error.message}`)
  } else {
    console.log(`✅ Status '${testStatus}' is ALLOWED!`)
  }
}

checkStatusColumn()
