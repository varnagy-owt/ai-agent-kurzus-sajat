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

export async function runSql(query: string): Promise<unknown[]> {
  if (!/^\s*SELECT\b/i.test(query.trim())) {
    throw new Error('Csak SELECT lekérdezés engedélyezett.');
  }
  const result = await getPool().query(query);
  return result.rows;
}
