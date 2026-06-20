import { randomUUID, createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { verificationTokens } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { env } from '@/lib/env';

/**
 * Generate a raw verification token and its SHA-256 hash.
 * The raw token is sent via email; only the hash is stored in DB.
 */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomUUID();
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Hash a raw token for comparison with stored hash.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Verify a raw token against the stored hash.
 * Returns the token row if valid, or null if not found/invalid/used/expired.
 */
export async function verifyTokenInDb(
  raw: string,
  type: 'email_verification' | 'password_reset',
): Promise<{
  id: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
} | null> {
  const hashed = hashToken(raw);

  const [row] = await db
    .select({
      id: verificationTokens.id,
      userId: verificationTokens.userId,
      expiresAt: verificationTokens.expiresAt,
      usedAt: verificationTokens.usedAt,
    })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, hashed),
        eq(verificationTokens.type, type),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * Get the latest verification token for a user (to check cooldown or invalidate).
 */
export async function getLatestToken(
  userId: string,
  type: 'email_verification' | 'password_reset',
) {
  const rows = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.type, type),
      ),
    )
    .orderBy(verificationTokens.createdAt)
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Check if a user has a verified email by looking for a used email_verification token.
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: verificationTokens.id })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.type, 'email_verification'),
        sql`${verificationTokens.usedAt} IS NOT NULL`,
      ),
    )
    .limit(1);

  return !!row;
}
