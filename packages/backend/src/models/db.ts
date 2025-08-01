import { Pool } from 'pg';

// Database configuration with environment-aware settings
const getDatabaseConfig = () => {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  }

  const config: any = {
    connectionString,
  };

  // SSL configuration - required for production databases
  if (process.env.NODE_ENV === 'production' || connectionString.includes('supabase')) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
};

const pool = new Pool(getDatabaseConfig());

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