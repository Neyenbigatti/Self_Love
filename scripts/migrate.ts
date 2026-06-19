/**
 * Migration runner — applies Drizzle migrations to Turso.
 * Use this when drizzle-kit migrate hangs (known issue on Windows + Turso).
 *
 * Usage: npx tsx scripts/migrate.ts
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const url = process.env.TURSO_DB_URL ?? 'file:./data/selflove.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log(`Applying migrations to: ${url}`);

async function run() {
  const client = createClient({ url, authToken });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: './lib/db/migrations' });

  console.log('✅ Migrations applied successfully');
  client.close();
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
