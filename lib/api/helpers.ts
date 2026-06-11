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
