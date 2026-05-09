import 'dotenv/config'
import supabase from '../src/utils/supabase'

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'trucks' })
  if (error) {
    // If RPC doesn't exist, try raw query via postgrest if possible (unlikely)
    // Or just query a row and check keys
    console.error('RPC Error:', error)
    
    const { data: row, error: rowError } = await supabase.from('trucks').select('*').limit(1)
    if (rowError) {
      console.error('Row Error:', rowError)
    } else {
      console.log('Sample Row:', row[0])
    }
    return
  }
  console.log('Table Info:', data)
}

checkSchema()
