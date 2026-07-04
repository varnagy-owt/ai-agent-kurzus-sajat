import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL_READONLY;
    if (!connectionString) throw new Error('DATABASE_URL_READONLY nincs beállítva');
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function listCategories(): Promise<string[]> {
  const result = await getPool().query(
    'SELECT DISTINCT category FROM products ORDER BY category',
  );
  return result.rows.map((r) => r.category as string);
}
