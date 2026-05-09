const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function run() {
  const { data, error } = await supabase.from('trucks').select('status')
  if (error) {
    console.error('Error:', error)
  } else {
    const statuses = [...new Set(data.map(r => r.status))]
    console.log('Unique Statuses in DB:', statuses)
  }
}

run()
