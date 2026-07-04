-- Read-only user létrehozása a Postgres init fázisában.
-- A SELECT grant-et a seed után kell futtatni (pnpm nx run db:grant-readonly),
-- mert a táblák még nem léteznek ebben a fázisban.
CREATE USER plantbase_ro WITH PASSWORD 'plantbase_ro_pass';
GRANT CONNECT ON DATABASE plantbase TO plantbase_ro;
