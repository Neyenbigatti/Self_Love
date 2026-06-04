import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, appointments, medicalHistories } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updatePatientSchema } from '@/lib/api/validators/patients';
import { serverError, notFound, forbidden } from '@/lib/api/errors';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── GET /api/patients/[id] ──────────────────────────────────────────────────
// Professional only: return single patient with computed totalVisits and lastVisit.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

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
      .where(and(eq(users.id, id), eq(users.role, 'patient')))
      .groupBy(users.id)
      .limit(1);

    if (!patient) {
      return notFound('Patient not found');
    }

    // ── Fetch medical history (separate query, 1:1 or null) ─────────────────
    // Gracefully handle missing table — return undefined instead of crashing.
    let medicalHistory: {
      allergies: string[];
      medications: string[];
      conditions: string[];
      previousTreatments: string[];
    } | undefined;

    try {
      const [medHistory] = await db
        .select()
        .from(medicalHistories)
        .where(eq(medicalHistories.patientId, id))
        .limit(1);

      if (medHistory) {
        medicalHistory = {
          allergies: parseJsonArray(medHistory.allergies),
          medications: parseJsonArray(medHistory.medications),
          conditions: parseJsonArray(medHistory.conditions),
          previousTreatments: parseJsonArray(medHistory.previousTreatments),
        };
      }
    } catch (_e) {
      console.warn('[patients] medical_histories table not available — returning undefined');
    }

    return NextResponse.json({ patient, medicalHistory });
  } catch (error) {
    console.error('[patients] GET by id error:', error);
    return serverError(error);
  }
}

// ─── PATCH /api/patients/[id] ────────────────────────────────────────────────
// Professional only: update patient fields.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;

    // ── Verify patient exists ────────────────────────────────────────────────
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'patient')))
      .limit(1);

    if (!existing) {
      return notFound('Patient not found');
    }

    const body = await request.json();
    const parsed = validate(updatePatientSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Build update object (only provided fields) ──────────────────────────
    const updateData: Record<string, string | null> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ patient: existing });
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    // ── Return updated patient ──────────────────────────────────────────────
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

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('[patients] PATCH error:', error);
    return serverError(error);
  }
}
