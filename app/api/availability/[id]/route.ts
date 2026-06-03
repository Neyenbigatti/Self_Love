import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { availability } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updateAvailabilitySchema } from '@/lib/api/validators/availability';
import { badRequest, serverError, notFound, forbidden } from '@/lib/api/errors';

// ─── PATCH /api/availability/[id] ────────────────────────────────────────────
// Professional-only: update own availability entry
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

    const body = await request.json();
    const parsed = validate(updateAvailabilitySchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Fetch existing ──────────────────────────────────────────────────────
    const [existing] = await db
      .select()
      .from(availability)
      .where(and(eq(availability.id, id), eq(availability.professionalId, user.id)))
      .limit(1);

    if (!existing) {
      return notFound('Availability entry not found');
    }

    // ── Build update ────────────────────────────────────────────────────────
    const updateValues: Record<string, unknown> = {};

    if (data.dayOfWeek !== undefined) updateValues.dayOfWeek = data.dayOfWeek;
    if (data.specificDate !== undefined) updateValues.specificDate = data.specificDate;
    if (data.startTime !== undefined) updateValues.startTime = data.startTime;
    if (data.endTime !== undefined) updateValues.endTime = data.endTime;
    if (data.type !== undefined) updateValues.type = data.type;
    if (data.label !== undefined) updateValues.label = data.label;
    if (data.isAvailable !== undefined) updateValues.isAvailable = data.isAvailable;

    if (Object.keys(updateValues).length === 0) {
      return badRequest('No fields to update');
    }

    // ── Update ──────────────────────────────────────────────────────────────
    const [updated] = await db
      .update(availability)
      .set(updateValues)
      .where(eq(availability.id, id))
      .returning();

    return NextResponse.json({ availability: updated });
  } catch (error) {
    console.error('[availability] PATCH error:', error);
    return serverError(error);
  }
}

// ─── DELETE /api/availability/[id] ───────────────────────────────────────────
// Professional-only: delete own availability entry
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
      .select({ id: availability.id })
      .from(availability)
      .where(and(eq(availability.id, id), eq(availability.professionalId, user.id)))
      .limit(1);

    if (!existing) {
      return notFound('Availability entry not found');
    }

    await db.delete(availability).where(eq(availability.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[availability] DELETE error:', error);
    return serverError(error);
  }
}
