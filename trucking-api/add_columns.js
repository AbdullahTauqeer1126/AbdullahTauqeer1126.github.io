const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addColumns() {
  try {
    await client.connect();
    const res = await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT, ADD COLUMN IF NOT EXISTS file_type TEXT;');
    console.log('Columns added successfully', res);
  } catch (err) {
    console.error('Error adding columns', err);
  } finally {
    await client.end();
  }
}

addColumns();
