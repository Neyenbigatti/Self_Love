import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';
import { generateToken } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/email/verification';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Only extract fields we accept — role, title, clinicName are intentionally ignored
    const { name, email, password, phone } = body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 },
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 });
    }

    // ── Duplicate check ─────────────────────────────────────────────────
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 },
      );
    }

    // ── Create user (role forced to patient) ─────────────────────────────
    const userId = randomUUID();
    const passwordHash = hashPassword(password);

    await db.insert(users).values({
      id: userId,
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim() || null,
      role: 'patient',
      // title and clinicName are NOT set — always null for patient registration
    });

    // ── Generate verification token ──────────────────────────────────────
    const { raw, hash } = generateToken();
    const expiresAt = new Date(
      Date.now() + env.VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString();

    await db.insert(verificationTokens).values({
      id: randomUUID(),
      userId,
      type: 'email_verification',
      token: hash,
      expiresAt,
    });

    // ── Send verification email ──────────────────────────────────────────
    const emailResult = await sendVerificationEmail(
      email.trim().toLowerCase(),
      name.trim(),
      raw,
    );

    if (!emailResult.success) {
      // ═══ DEBUG INSTRUMENTATION ═════════════════════════════════════════
      // Log the failure with enough context to diagnose Resend in production.
      console.error('[Register:DEBUG] sendVerificationEmail FAILED', {
        email: email.trim().toLowerCase(),
        userId,
        endpoint: 'POST /api/auth/register',
        errorMessage: emailResult.error,
      });
      // ═══════════════════════════════════════════════════════════════════
    }

    // ── Return 201 — NO JWT cookie set ──────────────────────────────────
    return NextResponse.json(
      { message: 'Revisá tu email — te enviamos un link de verificación' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
