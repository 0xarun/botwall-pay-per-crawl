// test-connection.js
import dotenv from 'dotenv';
import path from 'path';
import pkg from 'pg';

// Explicitly load backend/.env
dotenv.config({ path: path.resolve('../packages/backend/.env') });

const { Pool } = pkg;

console.log('Testing Supabase connection...');
console.log('SUPABASE_DB_URL exists:', !!process.env.SUPABASE_DB_URL);
console.log('Connection string (masked):', process.env.SUPABASE_DB_URL?.replace(/:[^@]+@/, ':***@'));

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  // Add timeout settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function testConnection() {
  let client;
  try {
    console.log('Attempting to connect...');
    client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].db_version);
    
    // Test if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available tables:', tables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection();