import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });
import { Pool } from 'pg';

if (!process.env.SUPABASE_DB_URL) {
  throw new Error('[middleware/lib/db.ts] SUPABASE_DB_URL environment variable is not set Please ensure your file is loaded and contains SUPABASE_DB_URL.');
}

// Now uses Postgres via Supabase (see SUPABASE_DB_URL env var)
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function queryOne(sql: string, params: any[] = []): Promise<any | null> {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getPublicKeyFromDB(crawlerId: string): Promise<string | null> {
  console.log('[DEBUG] Looking up bot_id (crawlerId):', JSON.stringify(crawlerId));
  const row = await queryOne('SELECT public_key FROM bots WHERE bot_id = $1', [crawlerId]);
  console.log('[DEBUG] DB QUERY RESULT for bot_id', JSON.stringify(crawlerId), ':', row);
  return row?.public_key || null;
}

export async function getPricingForPathFromDB(domain: string, path: string): Promise<{ price: number; blocked: boolean }> {
  const row = await queryOne('SELECT price_per_crawl FROM sites WHERE domain = $1', [domain]);
  if (!row) return { price: 0.01, blocked: false };
  return { price: Number(row.price_per_crawl), blocked: false };
} 