import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { explorationTemplates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { validate } from '@/lib/api/validators/common';
import { createExplorationTemplateSchema } from '@/lib/api/validators/exploration-templates';
import { parseJsonField } from '@/lib/api/helpers';
import { serverError, badRequest } from '@/lib/api/errors';
import { randomUUID } from 'crypto';
import { ensureDefaultExplorationTemplate } from '@/lib/db/seed';

// ─── GET /api/exploration-templates ────────────────────────────────────────────
// Returns all active system templates plus the requesting professional's templates.
// Lazily seeds the default facial exploration template on first read.

export async function GET(_request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    // ── Lazy seed: ensure default system template exists ────────────────────
    await ensureDefaultExplorationTemplate();

    // ── Fetch active templates (system + professional's own) ────────────────
    const rows = await db
      .select()
      .from(explorationTemplates)
      .where(
        eq(explorationTemplates.isActive, true),
      )
      .orderBy(desc(explorationTemplates.isSystem), desc(explorationTemplates.createdAt))
      .limit(50);

    // ── Filter: system templates OR owned by this professional ──────────────
    const filtered = rows.filter(
      (row) => row.isSystem || row.professionalId === user.id,
    );

    // ── Parse config JSON in response ───────────────────────────────────────
    const result = filtered.map((row) => ({
      ...row,
      config: parseJsonField(row.config),
    }));

    return NextResponse.json({ templates: result });
  } catch (error) {
    console.error('[exploration-templates] GET error:', error);
    return serverError(error);
  }
}

// ─── POST /api/exploration-templates ───────────────────────────────────────────
// Professional only: create a new custom template.

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const body = await request.json();
    const parsed = validate(createExplorationTemplateSchema, body);
    if ('response' in parsed) return parsed.response;

    const data = parsed.data;
    const id = randomUUID();

    // ── Check slug uniqueness ──────────────────────────────────────────────
    const [existing] = await db
      .select({ id: explorationTemplates.id })
      .from(explorationTemplates)
      .where(eq(explorationTemplates.slug, data.slug))
      .limit(1);

    if (existing) {
      return badRequest('A template with this slug already exists');
    }

    await db.insert(explorationTemplates).values({
      id,
      professionalId: user.id,
      slug: data.slug,
      name: data.name,
      description: data.description ?? null,
      config: JSON.stringify(data.config),
      isSystem: false,
      isActive: data.isActive ?? true,
    });

    // ── Fetch and return created template ──────────────────────────────────
    const [created] = await db
      .select()
      .from(explorationTemplates)
      .where(eq(explorationTemplates.id, id))
      .limit(1);

    return NextResponse.json(
      {
        template: {
          ...created,
          config: parseJsonField(created.config),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[exploration-templates] POST error:', error);
    return serverError(error);
  }
}
