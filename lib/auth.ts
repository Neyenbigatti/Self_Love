/**
 * Server-side authentication utilities.
 *
 * This is a DEPRECATED barrel — kept for backward compatibility.
 * New imports should prefer:
 *   - lib/auth/session.ts  → createToken, verifyToken, getSession, sessionCookieOptions
 *   - lib/auth/tokens.ts   → generateToken, hashToken, verifyTokenInDb, isEmailVerified
 */

import { hashSync, compareSync } from 'bcryptjs';

// ─── Password hashing (stays here — no reason to move) ────────────────────────

export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

// ─── Re-exports from split modules ────────────────────────────────────────────

export {
  createToken,
  verifyToken,
  getSession,
  sessionCookieOptions,
} from './auth/session';

export type { SessionUser } from './auth/session';

export {
  generateToken,
  hashToken,
  verifyTokenInDb,
  isEmailVerified,
} from './auth/tokens';
