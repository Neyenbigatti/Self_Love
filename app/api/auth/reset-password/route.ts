import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken, verifyTokenInDb } from '@/lib/auth/tokens';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // ── Validate password (same rules as register) ───────────────────────
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 },
      );
    }

    if (!token) {
      return NextResponse.json({ error: 'Token es requerido' }, { status: 400 });
    }

    // ── Hash input token for DB lookup ───────────────────────────────────
    const hashedToken = hashToken(token);

    // ── Find token ──────────────────────────────────────────────────────
    const found = await verifyTokenInDb(token, 'password_reset');

    if (!found) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    // ── Validate token state ────────────────────────────────────────────
    if (found.usedAt !== null) {
      return NextResponse.json({ error: 'Token ya utilizado' }, { status: 410 });
    }

    if (new Date(found.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Token expirado. Solicitá un nuevo enlace.' },
        { status: 410 },
      );
    }

    // ── Consume token (single-use) ─────────────────────────────────────
    await db
      .update(verificationTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(verificationTokens.id, found.id));

    // ── Update password ─────────────────────────────────────────────────
    const passwordHash = hashPassword(password);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, found.userId));

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
