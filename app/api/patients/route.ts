import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, appointments } from '@/lib/db/schema';
import { and, eq, like, or, desc, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import {
  searchPatientsSchema,
  createPatientSchema,
} from '@/lib/api/validators/patients';
import { serverError, conflict } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── GET /api/patients?search=term ────────────────────────────────────────────
// Professional only: list patients with computed totalVisits and lastVisit.
// Optional search filter by name, email, or phone (LIKE %term%).
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const parsed = validate(searchPatientsSchema, rawQuery);
    if ('response' in parsed) return parsed.response;

    const { search } = parsed.data;

    // ── Build filters ───────────────────────────────────────────────────────
    const filters: ReturnType<typeof and>[] = [eq(users.role, 'patient')];

    if (search) {
      const term = `%${search}%`;
      filters.push(
        or(
          like(users.name, term),
          like(users.email, term),
          like(users.phone, term),
        ),
      );
    }

    // ── Query with computed fields from appointments ────────────────────────
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        address: users.address,
        notes: users.notes,
        createdAt: users.createdAt,
        totalVisits: sql<number>`COUNT(DISTINCT ${appointments.id})`,
        lastVisit: sql<string | null>`MAX(${appointments.date})`,
      })
      .from(users)
      .leftJoin(
        appointments,
        and(
          eq(appointments.patientId, users.id),
          eq(appointments.professionalId, user.id),
        ),
      )
      .where(and(...filters))
      .groupBy(users.id)
      .orderBy(users.name)
      .limit(50);

    return NextResponse.json({ patients: rows });
  } catch (error) {
    console.error('[patients] GET error:', error);
    return serverError(error);
  }
}

// ─── POST /api/patients ──────────────────────────────────────────────────────
// Professional only: create a new patient record (no login account, no password).
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;

    const body = await request.json();
    const parsed = validate(createPatientSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Duplicate email check ───────────────────────────────────────────────
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      return conflict('A patient with this email already exists');
    }

    // ── Create patient (no password_hash — record-only, no login) ───────────
    const id = randomUUID();

    await db.insert(users).values({
      id,
      email: data.email.toLowerCase().trim(),
      passwordHash: '', // blank — patient cannot log in
      name: data.name.trim(),
      phone: data.phone.trim(),
      role: 'patient',
      dateOfBirth: data.dateOfBirth ?? null,
      gender: data.gender ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
    });

    const [patient] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        address: users.address,
        notes: users.notes,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error('[patients] POST error:', error);
    return serverError(error);
  }
}
