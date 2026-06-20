import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateToken, isEmailVerified } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/email/verification';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Find user (always return 200 — anti-enumeration) ─────────────────
    const [user] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // If user doesn't exist → return 200 (same message) — no email sent
    if (!user) {
      return NextResponse.json({ message: 'Email reenviado' });
    }

    // If already verified → return 200 (same message) — no email sent
    const verified = await isEmailVerified(user.id);
    if (verified) {
      return NextResponse.json({ message: 'Email reenviado' });
    }

    // ── Cooldown check: last token must be older than 60s ────────────────
    const [lastToken] = await db
      .select({ createdAt: verificationTokens.createdAt })
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, user.id),
          eq(verificationTokens.type, 'email_verification'),
        ),
      )
      .orderBy(sql`${verificationTokens.createdAt} DESC`)
      .limit(1);

    if (lastToken) {
      const lastTime = new Date(lastToken.createdAt).getTime();
      const now = Date.now();
      if (now - lastTime < env.RESEND_COOLDOWN_SECONDS * 1000) {
        const remaining = Math.ceil(
          (env.RESEND_COOLDOWN_SECONDS * 1000 - (now - lastTime)) / 1000,
        );
        return NextResponse.json(
          { error: `Esperá ${remaining} segundos antes de reenviar` },
          { status: 429 },
        );
      }
    }

    // ── Invalidate previous unused tokens ────────────────────────────────
    await db
      .update(verificationTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(
        and(
          eq(verificationTokens.userId, user.id),
          eq(verificationTokens.type, 'email_verification'),
          sql`${verificationTokens.usedAt} IS NULL`,
        ),
      );

    // ── Generate new token ───────────────────────────────────────────────
    const { raw, hash } = generateToken();
    const expiresAt = new Date(
      Date.now() + env.VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString();

    await db.insert(verificationTokens).values({
      id: randomUUID(),
      userId: user.id,
      type: 'email_verification',
      token: hash,
      expiresAt,
    });

    // ── Send email (non-blocking) ────────────────────────────────────────
    sendVerificationEmail(normalizedEmail, user.name, raw);

    return NextResponse.json({ message: 'Email reenviado' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
