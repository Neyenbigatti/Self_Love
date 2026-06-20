import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyPassword, createToken, sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!email?.trim()) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json(
        { error: 'La contraseña es obligatoria' },
        { status: 400 },
      );
    }

    // ── Find user ───────────────────────────────────────────────────────
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    // Same message for non-existent user or wrong password (anti-enumeration)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 },
      );
    }

    // ── Check email verified ────────────────────────────────────────────
    const [verified] = await db
      .select({ id: verificationTokens.id })
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, user.id),
          eq(verificationTokens.type, 'email_verification'),
          sql`${verificationTokens.usedAt} IS NOT NULL`,
        ),
      )
      .limit(1);

    if (!verified) {
      return NextResponse.json(
        {
          error: 'Verificá tu email antes de iniciar sesión',
          email: user.email,
        },
        { status: 403 },
      );
    }

    // ── Create session ──────────────────────────────────────────────────
    const token = await createToken({ sub: user.id, role: user.role });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        title: user.title,
        clinicName: user.clinicName,
      },
    });

    response.cookies.set('session', token, sessionCookieOptions());

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
