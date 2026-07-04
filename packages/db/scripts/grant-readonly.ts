import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    'GRANT SELECT ON ALL TABLES IN SCHEMA public TO plantbase_ro',
  );
  await client.query(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO plantbase_ro',
  );
  console.log('Read-only jogok beállítva: plantbase_ro');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
