import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { treatmentTypes, appointments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updateTreatmentSchema } from '@/lib/api/validators/treatments';
import { serverError, notFound, forbidden, conflict } from '@/lib/api/errors';

// ─── PATCH /api/treatment-types/[id] ──────────────────────────────────────────
// Professional only: update own treatment type
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const [existing] = await db
      .select()
      .from(treatmentTypes)
      .where(eq(treatmentTypes.id, id))
      .limit(1);

    if (!existing) {
      return notFound('Treatment type not found');
    }

    if (existing.professionalId !== user.id) {
      return forbidden();
    }

    const body = await request.json();
    const parsed = validate(updateTreatmentSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    const [result] = await db
      .update(treatmentTypes)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
      })
      .where(eq(treatmentTypes.id, id))
      .returning();

    return NextResponse.json({ treatmentType: result });
  } catch (error) {
    console.error('[treatment-types] PATCH error:', error);
    return serverError(error);
  }
}

// ─── DELETE /api/treatment-types/[id] ─────────────────────────────────────────
// Professional only: delete only if no active appointments reference this type
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const [existing] = await db
      .select()
      .from(treatmentTypes)
      .where(eq(treatmentTypes.id, id))
      .limit(1);

    if (!existing) {
      return notFound('Treatment type not found');
    }

    if (existing.professionalId !== user.id) {
      return forbidden();
    }

    // ── Check for active appointments referencing this treatment type ────────
    const [activeAppointment] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        eq(appointments.treatmentType, existing.name),
      )
      .limit(1);

    if (activeAppointment) {
      return conflict(
        'Cannot delete treatment type: there are active appointments referencing it',
      );
    }

    await db.delete(treatmentTypes).where(eq(treatmentTypes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[treatment-types] DELETE error:', error);
    return serverError(error);
  }
}
