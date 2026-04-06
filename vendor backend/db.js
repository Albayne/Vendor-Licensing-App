require('dotenv').config();
const { Pool } = require('pg');

// Use SSL only when explicitly enabled (e.g., production managed DBs)
const sslEnabled = process.env.DB_SSL === 'true';
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ DB error:', err);
  else console.log('✅ DB connected:', res.rows[0]);
  pool.end();
});