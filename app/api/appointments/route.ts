import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, users } from '@/lib/db/schema';
import { eq, and, or, lte, gte, lt, gt, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import {
  createAppointmentSchema,
  queryAppointmentsSchema,
} from '@/lib/api/validators/appointments';
import { badRequest, serverError, conflict } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── GET /api/appointments ───────────────────────────────────────────────────
// Role-scoped list with optional filters: startDate, endDate, professionalId, status
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional', 'patient');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    // ── Parse query params ──────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const parsed = validate(queryAppointmentsSchema, rawQuery);
    if ('response' in parsed) return parsed.response;

    const { startDate, endDate, professionalId, status } = parsed.data;

    // ── Build filters ───────────────────────────────────────────────────────
    const filters: ReturnType<typeof and>[] = [];

    if (user.role === 'professional') {
      filters.push(eq(appointments.professionalId, user.id));
    } else {
      filters.push(eq(appointments.patientId, user.id));
    }

    if (startDate) {
      filters.push(gte(appointments.date, startDate));
    }
    if (endDate) {
      filters.push(lte(appointments.date, endDate));
    }
    // Ignore professionalId query param for professionals — scoped to session already
    if (status) {
      filters.push(eq(appointments.status, status as typeof appointments.status.enumValues[number]));
    }

    const professionalUser = alias(users, 'professional');

    // ── Query with patient + professional joins ─────────────────────────────
    const rows = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        professionalId: appointments.professionalId,
        treatmentType: appointments.treatmentType,
        treatmentTypeId: appointments.treatmentTypeId,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patientName: users.name,
        patientAvatar: users.avatar,
        professionalName: professionalUser.name,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.patientId, users.id))
      .leftJoin(professionalUser, eq(appointments.professionalId, professionalUser.id))
      .where(and(...filters))
      .orderBy(appointments.date, appointments.startTime);

    return NextResponse.json({ appointments: rows });
  } catch (error) {
    console.error('[appointments] GET error:', error);
    return serverError(error);
  }
}

// ─── POST /api/appointments ──────────────────────────────────────────────────
// Create appointment with overlap prevention; status depends on role
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional', 'patient');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const body = await request.json();
    const parsed = validate(createAppointmentSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Resolve professional/patient IDs and status ─────────────────────────
    let professionalId: string;
    let patientId: string;
    const status = user.role === 'professional' ? 'confirmed' : 'pending';

    if (user.role === 'professional') {
      professionalId = user.id;
      patientId = data.patientId;
    } else {
      // Patient creates appointment for themselves; must specify professionalId
      const rawBody = body as Record<string, unknown>;
      if (typeof rawBody.patientId !== 'string' || rawBody.patientId !== user.id) {
        return badRequest('patientId must match your session');
      }
      if (typeof rawBody.professionalId !== 'string' || !rawBody.professionalId.trim()) {
        return badRequest('professionalId is required for patients');
      }
      patientId = user.id;
      professionalId = rawBody.professionalId.trim();
    }

    // ── Overlap check ───────────────────────────────────────────────────────
    const [overlap] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.professionalId, professionalId),
          eq(appointments.date, data.date),
          ne(appointments.status, 'cancelled'),
          or(
            and(
              lte(appointments.startTime, data.startTime),
              gt(appointments.endTime, data.startTime),
            ),
            and(
              lt(appointments.startTime, data.endTime),
              gte(appointments.endTime, data.endTime),
            ),
            and(
              gte(appointments.startTime, data.startTime),
              lte(appointments.endTime, data.endTime),
            ),
          ),
        ),
      )
      .limit(1);

    if (overlap) {
      return conflict('El horario seleccionado coincide con una reserva existente.');
    }

    // ── Insert ──────────────────────────────────────────────────────────────
    const id = randomUUID();
    const [appointment] = await db
      .insert(appointments)
      .values({
        id,
        professionalId,
        patientId,
        treatmentType: data.treatmentType,
        treatmentTypeId: data.treatmentTypeId ?? null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        status,
        notes: data.notes ?? null,
      })
      .returning();

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('[appointments] POST error:', error);
    return serverError(error);
  }
}
