/**
 * Shared API helpers.
 *
 * Extracted from duplicated inline helpers across route files.
 */

// ─── JSON parsing ──────────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string column from SQLite.
 * Returns `undefined` for null / invalid / empty values.
 */
export function parseJsonField(value: string | null): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Safely parse a JSON string array column from SQLite.
 * Returns an empty array for null / invalid values.
 */
export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Template config lookup ─────────────────────────────────────────────────────

/**
 * Lookup an exploration template by ID and return its parsed config.
 * Returns `null` if not found or config fails to parse.
 */
export async function getTemplateConfigById(
  templateId: string,
): Promise<Record<string, unknown> | null> {
  const { db } = await import('@/lib/db');
  const { explorationTemplates } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');

  const [template] = await db
    .select()
    .from(explorationTemplates)
    .where(eq(explorationTemplates.id, templateId))
    .limit(1);

  if (!template) return null;
  const config = parseJsonField(template.config);
  return (config as Record<string, unknown>) ?? null;
}

// ─── Batch template config map ──────────────────────────────────────────────────

/**
 * Given an array of template IDs, return a Map of id → parsed config.
 * Used by clinical-history route to avoid N+1 lookups.
 */
export async function getTemplateConfigMap(
  templateIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  if (templateIds.length === 0) return new Map();

  const { db } = await import('@/lib/db');
  const { explorationTemplates } = await import('@/lib/db/schema');
  const { inArray } = await import('drizzle-orm');

  const templates = await db
    .select()
    .from(explorationTemplates)
    .where(inArray(explorationTemplates.id, templateIds));

  return new Map(
    templates.map((t) => [t.id, (parseJsonField(t.config) as Record<string, unknown>) ?? {}]),
  );
}
