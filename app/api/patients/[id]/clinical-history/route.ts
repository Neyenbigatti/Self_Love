import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  users,
  appointments,
  explorations,
  explorationPhotos,
  medicalHistories,
  explorationTemplates,
} from '@/lib/db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { parseJsonField, parseJsonArray } from '@/lib/api/helpers';
import { serverError, notFound } from '@/lib/api/errors';

// ─── GET /api/patients/[id]/clinical-history ───────────────────────────────────
// Professional only: aggregate patient clinical data from multiple sources.
// Returns patient info + medical history + completed appointments + explorations.

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

    // ── 1. Patient info ──────────────────────────────────────────────────────
    const [patient] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
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

    // ── 2. Medical history ───────────────────────────────────────────────────
    // Gracefully handle missing table (schema out of sync) — return null instead of crashing.
    let medicalHistory: {
      allergies: string[];
      medications: string[];
      conditions: string[];
      previousTreatments: string[];
    } | null = null;

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
      console.warn(
        '[clinical-history] medical_histories table not available — returning null',
      );
    }

    // ── 3. Completed appointments (as treatment records) ─────────────────────
    const completedAppointments = await db
      .select({
        id: appointments.id,
        treatmentType: appointments.treatmentType,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        notes: appointments.notes,
        professionalName: users.name,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.professionalId, users.id))
      .where(
        and(
          eq(appointments.patientId, id),
          eq(appointments.professionalId, user.id),
          eq(appointments.status, 'completed'),
        ),
      )
      .orderBy(desc(appointments.date));

    // ── 4. Explorations with photos ──────────────────────────────────────────
    const explorationRows = await db
      .select()
      .from(explorations)
      .where(
        and(
          eq(explorations.patientId, id),
          eq(explorations.professionalId, user.id),
        ),
      )
      .orderBy(desc(explorations.date))
      .limit(50);

    const explorationIds = explorationRows.map((r) => r.id);
    const allPhotos =
      explorationIds.length > 0
        ? await db
            .select()
            .from(explorationPhotos)
            .where(inArray(explorationPhotos.explorationId, explorationIds))
            .orderBy(explorationPhotos.createdAt)
        : [];

    const photosByExplorationId = new Map<string, typeof allPhotos>();
    for (const photo of allPhotos) {
      const list = photosByExplorationId.get(photo.explorationId) ?? [];
      list.push(photo);
      photosByExplorationId.set(photo.explorationId, list);
    }

    // ── Batch fetch template configs for v2 explorations ─────────────────
    const v2TemplateIds = [
      ...new Set(explorationRows.map((r) => r.templateId).filter(Boolean)),
    ] as string[];
    const templateConfigs =
      v2TemplateIds.length > 0
        ? await db
            .select()
            .from(explorationTemplates)
            .where(inArray(explorationTemplates.id, v2TemplateIds))
        : [];
    const templateConfigMap = new Map(
      templateConfigs.map((t) => [
        t.id,
        (parseJsonField(t.config) as Record<string, unknown>) ?? null,
      ]),
    );

    const explorationsWithPhotos = explorationRows.map((row) => ({
      id: row.id,
      date: row.date,
      skinEvaluation: parseJsonField(row.skinEvaluation),
      facialAnalysis: parseJsonField(row.facialAnalysis),
      responses: parseJsonField(row.responses),
      notes: row.notes,
      templateId: row.templateId,
      templateConfig: row.templateId
        ? templateConfigMap.get(row.templateId) ?? null
        : null,
      photos: photosByExplorationId.get(row.id) ?? [],
    }));

    // ── 5. Return aggregated response ───────────────────────────────────────
    return NextResponse.json({
      patient,
      medicalHistory,
      completedAppointments,
      explorations: explorationsWithPhotos,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[clinical-history] GET error:', message);
    return serverError(error);
  }
}
