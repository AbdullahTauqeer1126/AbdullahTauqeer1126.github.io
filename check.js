const axios = require('axios');

async function test() {
  try {
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    const token = login.data.data.tokens.access_token;
    console.log('Login success. Token:', token.substring(0, 20) + '...');
    
    const trucks = await axios.get('http://localhost:3001/api/admin/trucks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Admin Trucks:', JSON.stringify(trucks.data).substring(0, 500));
    
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
