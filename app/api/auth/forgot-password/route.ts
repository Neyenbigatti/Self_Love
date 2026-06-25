import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateToken } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/email/password-reset';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Find user (anti-enumeration: return 200 regardless) ──────────────
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // If user does not exist → return 200 (identical message, no email sent)
    if (!user) {
      return NextResponse.json({
        message: 'Si el email está registrado, recibirás un enlace',
      });
    }

    // ── Invalidate ALL active password_reset tokens for this user ────────
    await db
      .update(verificationTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(
        and(
          eq(verificationTokens.userId, user.id),
          eq(verificationTokens.type, 'password_reset'),
          sql`${verificationTokens.usedAt} IS NULL`,
        ),
      );

    // ── Generate new token ───────────────────────────────────────────────
    const { raw, hash } = generateToken();
    const expiresAt = new Date(
      Date.now() + env.RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString();

    await db.insert(verificationTokens).values({
      id: randomUUID(),
      userId: user.id,
      type: 'password_reset',
      token: hash,
      expiresAt,
    });

    // ── Send email ───────────────────────────────────────────────────────
    const emailResult = await sendPasswordResetEmail(user.email, raw, user.name);

    if (!emailResult.success) {
      // ═══ DEBUG INSTRUMENTATION ═════════════════════════════════════════
      console.error('[ForgotPassword:DEBUG] sendPasswordResetEmail FAILED', {
        email: user.email,
        userId: user.id,
        endpoint: 'POST /api/auth/forgot-password',
        errorMessage: emailResult.error,
      });
      // ═══════════════════════════════════════════════════════════════════
    }

    return NextResponse.json({
      message: 'Si el email está registrado, recibirás un enlace',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
