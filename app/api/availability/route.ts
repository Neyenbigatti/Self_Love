import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { availability } from '@/lib/db/schema';
import { eq, and, or, lt, gt } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { createAvailabilitySchema } from '@/lib/api/validators/availability';
import { badRequest, conflict, serverError } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── GET /api/availability ───────────────────────────────────────────────────
// Professional-only: list own availability entries
export async function GET(_request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const rows = await db
      .select()
      .from(availability)
      .where(eq(availability.professionalId, user.id))
      .orderBy(availability.specificDate, availability.dayOfWeek, availability.startTime);

    return NextResponse.json({ availability: rows });
  } catch (error) {
    console.error('[availability] GET error:', error);
    return serverError(error);
  }
}

// ─── POST /api/availability ──────────────────────────────────────────────────
// Create availability rule (dayOfWeek XOR specificDate)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const body = await request.json();
    const parsed = validate(createAvailabilitySchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Enforce dayOfWeek XOR specificDate (extra safety beyond Zod refine) ─
    if (
      (data.dayOfWeek !== undefined && data.specificDate !== undefined) ||
      (data.dayOfWeek === undefined && data.specificDate === undefined)
    ) {
      return badRequest('Exactly one of dayOfWeek or specificDate is required');
    }

    // ── Infer isAvailable from type if not provided ─────────────────────────
    const isAvailable =
      data.isAvailable ?? (data.type === 'blocked' ? false : true);

    // ── Overlap check (regular weekly rules only) ───────────────────────────
    if (data.type === 'regular' && data.dayOfWeek !== undefined) {
      const [overlap] = await db
        .select({ id: availability.id, dayOfWeek: availability.dayOfWeek, startTime: availability.startTime, endTime: availability.endTime })
        .from(availability)
        .where(
          and(
            eq(availability.professionalId, user.id),
            eq(availability.dayOfWeek, data.dayOfWeek),
            eq(availability.type, 'regular'),
            or(
              and(
                lt(availability.startTime, data.endTime),
                gt(availability.endTime, data.startTime),
              ),
            ),
          ),
        )
        .limit(1);

      if (overlap) {
        return conflict('Se superpone con un horario existente');
      }
    }

    // ── Insert ──────────────────────────────────────────────────────────────
    const id = randomUUID();
    const [entry] = await db
      .insert(availability)
      .values({
        id,
        professionalId: user.id,
        dayOfWeek: data.dayOfWeek ?? null,
        specificDate: data.specificDate ?? null,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        isAvailable,
        label: data.label ?? null,
      })
      .returning();

    return NextResponse.json({ availability: entry }, { status: 201 });
  } catch (error) {
    console.error('[availability] POST error:', error);
    return serverError(error);
  }
}
