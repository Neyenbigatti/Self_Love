import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { explorations, explorationPhotos } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { createExplorationSchema } from '@/lib/api/validators/explorations';
import { serverError, badRequest } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string column from SQLite.
 * Returns `undefined` for null / invalid / empty values.
 */
function parseJsonField(value: string | null): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// ─── GET /api/explorations?patientId=X ────────────────────────────────────────
// Professional only: list explorations for a patient, ordered by date DESC.
// Photos are fetched in a second query and attached to each exploration.

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return badRequest('patientId query parameter is required');
    }

    // ── Fetch explorations ──────────────────────────────────────────────────
    const rows = await db
      .select()
      .from(explorations)
      .where(
        and(
          eq(explorations.patientId, patientId),
          eq(explorations.professionalId, user.id),
        ),
      )
      .orderBy(desc(explorations.date))
      .limit(50);

    // ── Batch-fetch photos ──────────────────────────────────────────────────
    const explorationIds = rows.map((r) => r.id);
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

    // ── Build response (parse JSON columns, attach photos) ──────────────────
    const result = rows.map((row) => ({
      ...row,
      skinEvaluation: parseJsonField(row.skinEvaluation),
      facialAnalysis: parseJsonField(row.facialAnalysis),
      photos: photosByExplorationId.get(row.id) ?? [],
    }));

    return NextResponse.json({ explorations: result });
  } catch (error) {
    console.error('[explorations] GET error:', error);
    return serverError(error);
  }
}

// ─── POST /api/explorations ────────────────────────────────────────────────────
// Professional only: create a new exploration record.
// Supports lazy-create — only patientId + date are required.
// skinEvaluation and facialAnalysis are serialized to JSON strings.
// Photos are inserted in a batch if provided.

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const body = await request.json();
    const parsed = validate(createExplorationSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;
    const id = randomUUID();

    // ── Insert exploration ──────────────────────────────────────────────────
    await db.insert(explorations).values({
      id,
      patientId: data.patientId,
      professionalId: user.id,
      skinEvaluation: data.skinEvaluation
        ? JSON.stringify(data.skinEvaluation)
        : null,
      facialAnalysis: data.facialAnalysis
        ? JSON.stringify(data.facialAnalysis)
        : null,
      notes: data.notes ?? null,
      date: data.date,
    });

    // ── Insert photos (if provided) ─────────────────────────────────────────
    if (data.photos && data.photos.length > 0) {
      await db.insert(explorationPhotos).values(
        data.photos.map((photo) => ({
          id: randomUUID(),
          explorationId: id,
          url: photo.url,
          angle: photo.angle,
          originalName: photo.originalName ?? null,
          mimeType: photo.mimeType ?? null,
          fileSize: photo.fileSize ?? null,
        })),
      );
    }

    // ── Fetch created exploration ───────────────────────────────────────────
    const [created] = await db
      .select()
      .from(explorations)
      .where(eq(explorations.id, id))
      .limit(1);

    const photos =
      data.photos && data.photos.length > 0
        ? await db
            .select()
            .from(explorationPhotos)
            .where(eq(explorationPhotos.explorationId, id))
            .orderBy(explorationPhotos.createdAt)
        : [];

    return NextResponse.json(
      {
        exploration: {
          ...created,
          skinEvaluation: parseJsonField(created.skinEvaluation),
          facialAnalysis: parseJsonField(created.facialAnalysis),
          photos,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[explorations] POST error:', error);
    return serverError(error);
  }
}
