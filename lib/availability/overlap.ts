// ─── Types ──────────────────────────────────────────────────────────────────────

export interface OverlapCheckRule {
  id?: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  type: "regular" | "break" | "blocked";
}

// ─── findOverlaps ───────────────────────────────────────────────────────────────
// Find all existing rules that overlap with the given rule
// Only regular rules with same dayOfWeek are checked; specific dates and
// break/blocked rules don't count as overlaps.

export function findOverlaps(
  newRule: OverlapCheckRule,
  existingRules: OverlapCheckRule[],
): OverlapCheckRule[] {
  if (newRule.type !== "regular") return [];
  if (newRule.dayOfWeek === null) return [];

  return existingRules.filter((existing) => {
    // Only compare against regular rules on the same dayOfWeek
    if (existing.type !== "regular") return false;
    if (existing.dayOfWeek === null) return false;
    if (existing.dayOfWeek !== newRule.dayOfWeek) return false;

    // Skip the rule itself when editing
    if (
      existing.id !== undefined &&
      newRule.id !== undefined &&
      existing.id === newRule.id
    ) {
      return false;
    }

    // Time ranges intersect if new.start < existing.end AND new.end > existing.start
    return newRule.startTime < existing.endTime && newRule.endTime > existing.startTime;
  });
}

// ─── hasOverlap ─────────────────────────────────────────────────────────────────
// Simple boolean check — delegates to findOverlaps

export function hasOverlap(
  newRule: OverlapCheckRule,
  existingRules: OverlapCheckRule[],
): boolean {
  return findOverlaps(newRule, existingRules).length > 0;
}
