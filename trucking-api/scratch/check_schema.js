const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function run() {
  const { data, error } = await supabase.from('trucks').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Sample Row:', data[0])
  }
}

run()
