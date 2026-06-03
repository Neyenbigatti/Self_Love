import { NextResponse } from 'next/server';
import type { SessionUser } from '@/lib/auth';
import { unauthorized, forbidden } from './errors';

type AuthSuccess = { user: SessionUser };
type AuthResult = AuthSuccess | NextResponse;

/**
 * Validates that the session user exists and has one of the allowed roles.
 *
 * Usage in route handlers:
 *   const session = await getSession();
 *   const auth = requireRole(session, 'professional');
 *   if (!('user' in auth)) return auth; // 401 / 403
 *   const { user } = auth;
 */
export function requireRole(
  session: SessionUser | null,
  ...roles: string[]
): AuthResult {
  if (!session) {
    return unauthorized();
  }

  if (roles.length > 0 && !roles.includes(session.role)) {
    return forbidden();
  }

  return { user: session };
}
