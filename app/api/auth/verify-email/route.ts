import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashToken, verifyTokenInDb } from '@/lib/auth/tokens';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get('token');

    if (!rawToken) {
      return NextResponse.json({ error: 'Token es requerido' }, { status: 400 });
    }

    // ── Look up token ────────────────────────────────────────────────────
    const found = await verifyTokenInDb(rawToken, 'email_verification');

    if (!found) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    if (found.usedAt !== null) {
      return NextResponse.json({ error: 'Token ya utilizado' }, { status: 410 });
    }

    if (new Date(found.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Token expirado. Solicitá un nuevo enlace.' },
        { status: 410 },
      );
    }

    // ── Mark as used ─────────────────────────────────────────────────────
    await db
      .update(verificationTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(verificationTokens.id, found.id));

    // Redirect to login page with success flag
    return NextResponse.json({ message: 'Email verificado exitosamente' });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
