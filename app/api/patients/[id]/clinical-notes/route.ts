import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clinicalNotes, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { createClinicalNoteSchema } from '@/lib/api/validators/clinical-notes';
import { serverError, notFound } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── GET /api/patients/[id]/clinical-notes ─────────────────────────────────────
// Professional only: list clinical notes for a patient, ordered by date DESC.
// Only returns notes created by the authenticated professional.

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

    // ── Verify patient exists ──────────────────────────────────────────────
    const [patient] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'patient')))
      .limit(1);

    if (!patient) {
      return notFound('Patient not found');
    }

    // ── Fetch notes (professional-filtered) ────────────────────────────────
    const rows = await db
      .select()
      .from(clinicalNotes)
      .where(
        and(
          eq(clinicalNotes.patientId, id),
          eq(clinicalNotes.professionalId, user.id),
        ),
      )
      .orderBy(desc(clinicalNotes.date))
      .limit(50);

    return NextResponse.json({ notes: rows });
  } catch (error) {
    console.error('[clinical-notes] GET error:', error);
    return serverError(error);
  }
}

// ─── POST /api/patients/[id]/clinical-notes ────────────────────────────────────
// Professional only: create a new clinical note for the patient.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    // ── Verify patient exists ──────────────────────────────────────────────
    const [patient] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'patient')))
      .limit(1);

    if (!patient) {
      return notFound('Patient not found');
    }

    const body = await request.json();
    const parsed = validate(createClinicalNoteSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;
    const noteId = randomUUID();

    await db.insert(clinicalNotes).values({
      id: noteId,
      patientId: id,
      professionalId: user.id,
      date: data.date,
      content: data.content,
    });

    // ── Fetch and return created note ───────────────────────────────────────
    const [created] = await db
      .select()
      .from(clinicalNotes)
      .where(eq(clinicalNotes.id, noteId))
      .limit(1);

    return NextResponse.json({ note: created }, { status: 201 });
  } catch (error) {
    console.error('[clinical-notes] POST error:', error);
    return serverError(error);
  }
}
