import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { explorationTemplates } from '@/lib/db/schema';
import { eq, and, sql, type SQL } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { updateExplorationTemplateSchema } from '@/lib/api/validators/exploration-templates';
import { parseJsonField } from '@/lib/api/helpers';
import { serverError, notFound, forbidden } from '@/lib/api/errors';
import { ensureDefaultExplorationTemplate } from '@/lib/db/seed';

// ─── GET /api/exploration-templates/[slug] ─────────────────────────────────────
// Professional only: return a single active template by slug.
// Lazily seeds the default template before lookup.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    // ── Lazy seed: ensure default system template exists ────────────────────
    await ensureDefaultExplorationTemplate();

    // ── Fetch template by slug ──────────────────────────────────────────────
    const [row] = await db
      .select()
      .from(explorationTemplates)
      .where(
        and(
          eq(explorationTemplates.slug, slug),
          eq(explorationTemplates.isActive, true),
        ),
      )
      .limit(1);

    if (!row) {
      return notFound('Template not found');
    }

    // Ownership check: system templates are visible to all; others must belong
    if (!row.isSystem && row.professionalId !== user.id) {
      return notFound('Template not found');
    }

    return NextResponse.json({
      template: {
        ...row,
        config: parseJsonField(row.config),
      },
    });
  } catch (error) {
    console.error('[exploration-templates] GET by slug error:', error);
    return serverError(error);
  }
}

// ─── PUT /api/exploration-templates/[slug] ─────────────────────────────────────
// Professional only: update template config, name, description, or is_active.
// System templates (is_system=true) allow config edits but block slug changes.
// The design DECIDES config-editable, delete-protected — overriding the spec's 403-on-PUT.

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    // ── Fetch existing template ─────────────────────────────────────────────
    const [existing] = await db
      .select()
      .from(explorationTemplates)
      .where(eq(explorationTemplates.slug, slug))
      .limit(1);

    if (!existing) {
      return notFound('Template not found');
    }

    // ── Ownership check ────────────────────────────────────────────────────
    if (!existing.isSystem && existing.professionalId !== user.id) {
      return notFound('Template not found');
    }

    const body = await request.json();
    const parsed = validate(updateExplorationTemplateSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;

    // ── Build update object ─────────────────────────────────────────────────
    const updateData: Record<string, string | boolean | null | SQL<unknown>> = {};

    // Always update updatedAt
    updateData.updatedAt = sql`(datetime('now'))`;

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.config !== undefined) {
      updateData.config = JSON.stringify(data.config);
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // ── Apply update ────────────────────────────────────────────────────────
    await db
      .update(explorationTemplates)
      .set(updateData)
      .where(eq(explorationTemplates.id, existing.id));

    // ── Fetch and return updated template ───────────────────────────────────
    const [updated] = await db
      .select()
      .from(explorationTemplates)
      .where(eq(explorationTemplates.id, existing.id))
      .limit(1);

    return NextResponse.json({
      template: {
        ...updated,
        config: parseJsonField(updated.config),
      },
    });
  } catch (error) {
    console.error('[exploration-templates] PUT error:', error);
    return serverError(error);
  }
}
