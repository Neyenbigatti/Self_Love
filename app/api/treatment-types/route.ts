import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { treatmentTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { createTreatmentSchema } from '@/lib/api/validators/treatments';
import { badRequest, serverError } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── GET /api/treatment-types ─────────────────────────────────────────────────
// Both roles: list treatment types, optionally filtered by professional
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional', 'patient');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get('professionalId');

    // ── Resolve professional filter ──────────────────────────────────────────
    let targetProfessionalId: string;

    if (professionalId) {
      targetProfessionalId = professionalId;
    } else if (user.role === 'professional') {
      targetProfessionalId = user.id;
    } else {
      return badRequest('professionalId is required for patients');
    }

    const rows = await db
      .select()
      .from(treatmentTypes)
      .where(eq(treatmentTypes.professionalId, targetProfessionalId));

    return NextResponse.json({ treatmentTypes: rows });
  } catch (error) {
    console.error('[treatment-types] GET error:', error);
    return serverError(error);
  }
}

// ─── POST /api/treatment-types ────────────────────────────────────────────────
// Professional only: create a new treatment type
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const body = await request.json();
    const parsed = validate(createTreatmentSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    const id = randomUUID();
    const [treatmentType] = await db
      .insert(treatmentTypes)
      .values({
        id,
        professionalId: user.id,
        name: data.name,
        duration: data.duration,
        description: data.description ?? null,
        price: data.price ?? null,
      })
      .returning();

    return NextResponse.json({ treatmentType }, { status: 201 });
  } catch (error) {
    console.error('[treatment-types] POST error:', error);
    return serverError(error);
  }
}
