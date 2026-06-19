import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/** SQLite database URL — defaults to local file, configure TURSO_DB_URL for Turso */
const url = process.env.TURSO_DB_URL ?? 'file:./data/selflove.db';
console.log("APP DB URL:", url);
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
