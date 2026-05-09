
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRoles() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, role');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- USER ROLES IN DB ---');
  const roles = [...new Set(users.map(u => u.role))];
  console.log('Roles found:', roles);
  console.log('Total users:', users.length);
  console.log('Sample users:', users.slice(0, 10));
}

checkRoles();
