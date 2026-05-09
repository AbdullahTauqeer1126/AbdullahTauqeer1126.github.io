const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function approveTruck() {
  const { data, error } = await supabase
    .from('trucks')
    .update({ is_active: true, status: 'AVAILABLE' })
    .eq('registration', 'ace 6193')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Truck approved successfully!')
  }
}

approveTruck()
