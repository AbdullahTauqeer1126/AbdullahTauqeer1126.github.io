const axios = require('axios');

async function test() {
  try {
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'fleet_owner@test.com',
      password: 'password123'
    });
    const token = login.data.data.tokens.access_token;
    
    const res = await axios.post('http://localhost:3001/api/trucks', {
      plate_number: "ABC-1234",
      make: "Hino",
      model: "Hino 500",
      capacity: 10,
      truck_type: "flatbed",
      year: 2020,
      condition: "good",
      insurance_expiry: new Date().toISOString(),
      inspection_expiry: new Date().toISOString()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Create Truck Success:', res.data);
    
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
