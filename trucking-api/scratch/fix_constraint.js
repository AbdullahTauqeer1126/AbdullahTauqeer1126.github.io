const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function fixConstraint() {
  const { data, error } = await supabase.rpc('execute_sql', { 
    sql: `
      ALTER TABLE trucks DROP CONSTRAINT IF EXISTS trucks_status_check;
      ALTER TABLE trucks ALTER COLUMN status SET DEFAULT 'PENDING';
    `
  })
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Constraint dropped successfully!')
  }
}

fixConstraint()
