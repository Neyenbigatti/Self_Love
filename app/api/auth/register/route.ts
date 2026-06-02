import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createToken, sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, role, title, clinicName } = body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }
    if (!['patient', 'professional'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be patient or professional' },
        { status: 400 },
      );
    }

    // ── Duplicate check ─────────────────────────────────────────────────
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    // ── Create user ─────────────────────────────────────────────────────
    const userId = randomUUID();
    const passwordHash = hashPassword(password);

    await db.insert(users).values({
      id: userId,
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim() || null,
      role,
      title: title?.trim() || null,
      clinicName: clinicName?.trim() || null,
    });

    // ── Create session ──────────────────────────────────────────────────
    const token = await createToken({ sub: userId, role });

    const response = NextResponse.json({
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        phone: phone?.trim() || null,
        title: title?.trim() || null,
        clinicName: clinicName?.trim() || null,
        avatar: null,
      },
    });

    response.cookies.set('session', token, sessionCookieOptions());

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
