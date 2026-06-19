import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DB_URL ?? 'file:./data/selflove.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
