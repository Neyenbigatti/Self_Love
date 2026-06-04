import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { medicalHistories } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updateMedicalHistorySchema } from '@/lib/api/validators/medical-history';
import { serverError, notFound } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseJsonArray(value: string | null): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function parseMedicalHistory(row: typeof medicalHistories.$inferSelect | undefined) {
  if (!row) return null;
  return {
    allergies: parseJsonArray(row.allergies) ?? [],
    medications: parseJsonArray(row.medications) ?? [],
    conditions: parseJsonArray(row.conditions) ?? [],
    previousTreatments: parseJsonArray(row.previousTreatments) ?? [],
  };
}

// ─── GET /api/patients/[id]/medical-history ────────────────────────────────────
// Professional only: return medical history for a patient (null if none).

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;

    // Gracefully handle missing table (schema out of sync) — return null instead of crashing.
    let row: typeof medicalHistories.$inferSelect | undefined;

    try {
      const [result] = await db
        .select()
        .from(medicalHistories)
        .where(eq(medicalHistories.patientId, id))
        .limit(1);
      row = result;
    } catch (_e) {
      console.warn(
        '[medical-history] medical_histories table not available — returning null',
      );
    }

    return NextResponse.json({ medicalHistory: parseMedicalHistory(row) });
  } catch (error) {
    console.error('[medical-history] GET error:', error);
    return serverError(error);
  }
}

// ─── PATCH /api/patients/[id]/medical-history ──────────────────────────────────
// Professional only: upsert medical history fields.
// Uses the same JSON serialization pattern as explorations.

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
    const parsed = validate(updateMedicalHistorySchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Check if a medical history record already exists ────────────────────
    const [existing] = await db
      .select({ id: medicalHistories.id })
      .from(medicalHistories)
      .where(eq(medicalHistories.patientId, id))
      .limit(1);

    if (existing) {
      // ── Update existing ──────────────────────────────────────────────────
      const updateData: Record<string, string | null | ReturnType<typeof sql>> = {};
      updateData.updatedAt = sql`(datetime('now'))`;

      if (data.allergies !== undefined) {
        updateData.allergies = JSON.stringify(data.allergies);
      }
      if (data.medications !== undefined) {
        updateData.medications = JSON.stringify(data.medications);
      }
      if (data.conditions !== undefined) {
        updateData.conditions = JSON.stringify(data.conditions);
      }
      if (data.previousTreatments !== undefined) {
        updateData.previousTreatments = JSON.stringify(data.previousTreatments);
      }

      await db
        .update(medicalHistories)
        .set(updateData)
        .where(eq(medicalHistories.id, existing.id));
    } else {
      // ── Create new ───────────────────────────────────────────────────────
      await db.insert(medicalHistories).values({
        id: randomUUID(),
        patientId: id,
        allergies: data.allergies ? JSON.stringify(data.allergies) : null,
        medications: data.medications ? JSON.stringify(data.medications) : null,
        conditions: data.conditions ? JSON.stringify(data.conditions) : null,
        previousTreatments: data.previousTreatments
          ? JSON.stringify(data.previousTreatments)
          : null,
      });
    }

    // ── Fetch and return updated record ────────────────────────────────────
    const [updated] = await db
      .select()
      .from(medicalHistories)
      .where(eq(medicalHistories.patientId, id))
      .limit(1);

    return NextResponse.json({
      medicalHistory: parseMedicalHistory(updated),
    });
  } catch (error) {
    console.error('[medical-history] PATCH error:', error);
    return serverError(error);
  }
}
