import { Pool } from 'pg';

// Use environment variable for connection string
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});


// Query helper for multiple rows
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}

// Query helper for a single row
export async function queryOne(sql: string, params: any[] = []): Promise<any | null> {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// TypeScript: If you get a module error for 'pg', run:
// npm i --save-dev @types/pg
// Or add this to a .d.ts file:
// declare module 'pg'; 