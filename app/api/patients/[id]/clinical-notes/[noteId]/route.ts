import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clinicalNotes } from '@/lib/db/schema';
import { eq, and, sql, type SQL } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updateClinicalNoteSchema } from '@/lib/api/validators/clinical-notes';
import { serverError, notFound } from '@/lib/api/errors';

// ─── PATCH /api/patients/[id]/clinical-notes/[noteId] ─────────────────────────
// Professional only: update note content and/or date. Ownership check enforced.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const { id, noteId } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    // ── Fetch existing note with ownership check ────────────────────────────
    const [existing] = await db
      .select()
      .from(clinicalNotes)
      .where(
        and(
          eq(clinicalNotes.id, noteId),
          eq(clinicalNotes.patientId, id),
          eq(clinicalNotes.professionalId, user.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return notFound('Clinical note not found');
    }

    const body = await request.json();
    const parsed = validate(updateClinicalNoteSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Build update object ─────────────────────────────────────────────────
    const updateData: Record<string, string | null | SQL<unknown>> = {};

    // Always update updatedAt
    updateData.updatedAt = sql`(datetime('now'))`;

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.date !== undefined) {
      updateData.date = data.date;
    }

    // ── Apply update ────────────────────────────────────────────────────────
    await db
      .update(clinicalNotes)
      .set(updateData)
      .where(eq(clinicalNotes.id, noteId));

    // ── Fetch and return updated note ───────────────────────────────────────
    const [updated] = await db
      .select()
      .from(clinicalNotes)
      .where(eq(clinicalNotes.id, noteId))
      .limit(1);

    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error('[clinical-notes] PATCH error:', error);
    return serverError(error);
  }
}

// ─── DELETE /api/patients/[id]/clinical-notes/[noteId] ────────────────────────
// Professional only: delete a clinical note. Ownership check enforced.

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const { id, noteId } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    // ── Fetch existing note with ownership check ────────────────────────────
    const [existing] = await db
      .select({ id: clinicalNotes.id })
      .from(clinicalNotes)
      .where(
        and(
          eq(clinicalNotes.id, noteId),
          eq(clinicalNotes.patientId, id),
          eq(clinicalNotes.professionalId, user.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return notFound('Clinical note not found');
    }

    // ── Delete note ─────────────────────────────────────────────────────────
    await db.delete(clinicalNotes).where(eq(clinicalNotes.id, noteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[clinical-notes] DELETE error:', error);
    return serverError(error);
  }
}
