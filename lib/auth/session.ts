/**
 * JWT session utilities.
 *
 * - createToken / verifyToken: jose (Edge + Node.js)
 * - getSession: reads cookie + queries DB
 *
 * jose is Edge-compatible; bcryptjs and drizzle-orm are not.
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env';

// ─── Config ───────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

const COOKIE_NAME = 'session';
export const COOKIE_MAX_AGE = env.JWT_EXPIRES_IN; // 7 days

// ─── JWT ──────────────────────────────────────────────────────────────────────

export async function createToken(payload: { sub: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string,
): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'professional';
  phone: string | null;
  avatar: string | null;
  title: string | null;
  clinicName: string | null;
}

/** Read the session cookie and return the full user from DB, or null. */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      avatar: users.avatar,
      title: users.title,
      clinicName: users.clinicName,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser['role'],
    phone: user.phone,
    avatar: user.avatar,
    title: user.title,
    clinicName: user.clinicName,
  };
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function sessionCookieOptions(): {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}
