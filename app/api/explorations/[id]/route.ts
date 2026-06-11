import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { explorations, explorationPhotos } from '@/lib/db/schema';
import { eq, and, sql, type SQL } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updateExplorationSchema } from '@/lib/api/validators/explorations';
import { parseJsonField } from '@/lib/api/helpers';
import { serverError, notFound } from '@/lib/api/errors';
import { randomUUID } from 'crypto';

// ─── GET /api/explorations/[id] ────────────────────────────────────────────────
// Professional only: return single exploration with its photos.
// Ownership check: exploration must belong to the authenticated professional.

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

    // ── Fetch exploration with ownership check ──────────────────────────────
    const [row] = await db
      .select()
      .from(explorations)
      .where(
        and(eq(explorations.id, id), eq(explorations.professionalId, user.id)),
      )
      .limit(1);

    if (!row) {
      return notFound('Exploration not found');
    }

    // ── Fetch photos ────────────────────────────────────────────────────────
    const photos = await db
      .select()
      .from(explorationPhotos)
      .where(eq(explorationPhotos.explorationId, id))
      .orderBy(explorationPhotos.createdAt);

    return NextResponse.json({
      exploration: {
        ...row,
        skinEvaluation: parseJsonField(row.skinEvaluation),
        facialAnalysis: parseJsonField(row.facialAnalysis),
        responses: parseJsonField(row.responses),
        photos,
      },
    });
  } catch (error) {
    console.error('[explorations] GET by id error:', error);
    return serverError(error);
  }
}

// ─── PATCH /api/explorations/[id] ──────────────────────────────────────────────
// Professional only: partially update exploration fields.
// - skinEvaluation and facialAnalysis are serialized to JSON strings.
// - If photos is provided, ALL existing photos are replaced (delete + insert).
// - updatedAt is set manually (SQLite has no ON UPDATE trigger).

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

    // ── Verify exploration exists and belongs to this professional ──────────
    const [existing] = await db
      .select({ id: explorations.id })
      .from(explorations)
      .where(
        and(eq(explorations.id, id), eq(explorations.professionalId, user.id)),
      )
      .limit(1);

    if (!existing) {
      return notFound('Exploration not found');
    }

    const body = await request.json();
    const parsed = validate(updateExplorationSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Build update object (only provided fields) ──────────────────────────
    const updateData: Record<string, string | null | SQL<unknown>> = {};

    // Always update updatedAt on any PATCH
    updateData.updatedAt = sql`(datetime('now'))`;

    if (data.date !== undefined) updateData.date = data.date;
    if (data.skinEvaluation !== undefined) {
      updateData.skinEvaluation = data.skinEvaluation
        ? JSON.stringify(data.skinEvaluation)
        : null;
    }
    if (data.facialAnalysis !== undefined) {
      updateData.facialAnalysis = data.facialAnalysis
        ? JSON.stringify(data.facialAnalysis)
        : null;
    }
    if (data.templateId !== undefined) {
      updateData.templateId = data.templateId;
    }
    if (data.responses !== undefined) {
      updateData.responses = data.responses
        ? JSON.stringify(data.responses)
        : null;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // ── Apply update ────────────────────────────────────────────────────────
    await db.update(explorations).set(updateData).where(eq(explorations.id, id));

    // ── Handle photos replacement ───────────────────────────────────────────
    if (data.photos !== undefined) {
      // Delete all existing photos for this exploration
      await db
        .delete(explorationPhotos)
        .where(eq(explorationPhotos.explorationId, id));

      // Insert new photos (if any)
      if (data.photos.length > 0) {
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
    }

    // ── Fetch and return updated exploration ────────────────────────────────
    const [updated] = await db
      .select()
      .from(explorations)
      .where(eq(explorations.id, id))
      .limit(1);

    const photos = await db
      .select()
      .from(explorationPhotos)
      .where(eq(explorationPhotos.explorationId, id))
      .orderBy(explorationPhotos.createdAt);

    return NextResponse.json({
      exploration: {
        ...updated,
        skinEvaluation: parseJsonField(updated.skinEvaluation),
        facialAnalysis: parseJsonField(updated.facialAnalysis),
        responses: parseJsonField(updated.responses),
        photos,
      },
    });
  } catch (error) {
    console.error('[explorations] PATCH error:', error);
    return serverError(error);
  }
}
