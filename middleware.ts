import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_ENV);

async function verifyToken(
  token: string,
): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const payload = token ? await verifyToken(token) : null;
  const { pathname } = request.nextUrl;

  // Allow auth API routes (login, register, logout, me)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Dashboard → professional only
  if (pathname.startsWith('/dashboard')) {
    if (!payload || payload.role !== 'professional') {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Patient portal → patient only (prepared for Phase 4)
  if (pathname.startsWith('/patient')) {
    if (!payload || payload.role !== 'patient') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Static files and Next.js internals are excluded from middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder-).*)',
  ],
};
