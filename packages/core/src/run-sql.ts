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
  const trimmed = query.trim();

  // Egyetlen opcionális záró pontosvesszőt megengedünk.
  const withoutTrailingSemicolon = trimmed.replace(/;\s*$/, '');

  // Ha a záró ; levágása után is marad pontosvessző, az több utasítás lenne
  // (pl. "SELECT 1; DROP TABLE ..."), ezért elutasítjuk. A read-only DB-role
  // a végső védelem; ez egy második, kód-szintű réteg.
  if (withoutTrailingSemicolon.includes(';')) {
    throw new Error('Csak egyetlen utasítás engedélyezett (több SQL utasítás tiltott).');
  }

  if (!/^\s*SELECT\b/i.test(withoutTrailingSemicolon)) {
    throw new Error('Csak SELECT lekérdezés engedélyezett.');
  }

  const result = await getPool().query(query);
  return result.rows;
}
