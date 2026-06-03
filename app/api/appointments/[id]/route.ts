import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, users } from '@/lib/db/schema';
import { eq, and, or, lte, gte, lt, gt, ne } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updateAppointmentSchema } from '@/lib/api/validators/appointments';
import { badRequest, serverError, conflict, notFound, forbidden } from '@/lib/api/errors';

// ─── Valid status transitions ────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled', 'completed'],
  confirmed: ['cancelled', 'completed'],
  completed: [],
  cancelled: [],
};

// ─── GET /api/appointments/[id] ──────────────────────────────────────────────
// Ownership-enforced single appointment retrieval
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional', 'patient');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const [appointment] = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        professionalId: appointments.professionalId,
        treatmentType: appointments.treatmentType,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patientName: users.name,
        patientAvatar: users.avatar,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.patientId, users.id))
      .where(eq(appointments.id, id))
      .limit(1);

    if (!appointment) {
      return notFound('Appointment not found');
    }

    // Ownership check
    if (
      (user.role === 'professional' &&
        appointment.professionalId !== user.id) ||
      (user.role === 'patient' && appointment.patientId !== user.id)
    ) {
      return forbidden();
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('[appointments] GET by id error:', error);
    return serverError(error);
  }
}

// ─── PATCH /api/appointments/[id] ────────────────────────────────────────────
// Status transitions with overlap re-check on reschedule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional', 'patient');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const body = await request.json();
    const parsed = validate(updateAppointmentSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Fetch existing appointment ──────────────────────────────────────────
    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!existing) {
      return notFound('Appointment not found');
    }

    // Ownership check
    if (
      (user.role === 'professional' &&
        existing.professionalId !== user.id) ||
      (user.role === 'patient' && existing.patientId !== user.id)
    ) {
      return forbidden();
    }

    // ── Status transition validation ───────────────────────────────────────
    if (data.status) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(data.status)) {
        return conflict(
          `Cannot transition from '${existing.status}' to '${data.status}'`,
        );
      }
      // Only professionals can mark as completed
      if (data.status === 'completed' && user.role !== 'professional') {
        return forbidden('Only professionals can mark appointments as completed');
      }
    }

    // ── Re-check overlap if rescheduling ────────────────────────────────────
    const newDate = data.date ?? existing.date;
    const newStartTime = data.startTime ?? existing.startTime;
    const newEndTime = data.endTime ?? existing.endTime;

    if (data.date || data.startTime || data.endTime) {
      const [overlap] = await db
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.professionalId, existing.professionalId),
            eq(appointments.date, newDate),
            ne(appointments.id, id),
            ne(appointments.status, 'cancelled'),
            or(
              and(
                lte(appointments.startTime, newStartTime),
                gt(appointments.endTime, newStartTime),
              ),
              and(
                lt(appointments.startTime, newEndTime),
                gte(appointments.endTime, newEndTime),
              ),
              and(
                gte(appointments.startTime, newStartTime),
                lte(appointments.endTime, newEndTime),
              ),
            ),
          ),
        )
        .limit(1);

      if (overlap) {
        return conflict('Updated time slot overlaps with an existing appointment');
      }
    }

    // ── Update ──────────────────────────────────────────────────────────────
    const [result] = await db
      .update(appointments)
      .set({
        ...(data.status !== undefined && { status: data.status as typeof appointments.status.enumValues[number] }),
        ...(data.treatmentType !== undefined && {
          treatmentType: data.treatmentType,
        }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.notes !== undefined && { notes: data.notes }),
      })
      .where(eq(appointments.id, id))
      .returning();

    return NextResponse.json({ appointment: result });
  } catch (error) {
    console.error('[appointments] PATCH error:', error);
    return serverError(error);
  }
}

// ─── DELETE /api/appointments/[id] ───────────────────────────────────────────
// Professional only — hard delete
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
      .select({ id: appointments.id, professionalId: appointments.professionalId })
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!existing) {
      return notFound('Appointment not found');
    }

    if (existing.professionalId !== user.id) {
      return forbidden();
    }

    await db.delete(appointments).where(eq(appointments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[appointments] DELETE error:', error);
    return serverError(error);
  }
}
