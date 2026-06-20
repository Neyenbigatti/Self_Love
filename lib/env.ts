import { z } from 'zod';

const envSchema = z.object({
  // Database (Turso / SQLite)
  TURSO_DB_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().default(604800), // 7 days in seconds

  // Resend (email)
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().email().default('no-reply@selflove.com'),

  // App
  APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Feature flags
  VERIFICATION_TOKEN_EXPIRY_HOURS: z.coerce.number().default(24),
  RESET_TOKEN_EXPIRY_HOURS: z.coerce.number().default(1),
  RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
