/**
 * Tests for hasOverlap() / findOverlaps().
 * Run with: npx tsx lib/availability/overlap.test.ts
 */

import { hasOverlap, type OverlapCheckRule } from "./overlap";

// ─── Helpers ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

function desc(name: string, fn: () => void) {
  console.log(`\n# ${name}`);
  fn();
}

// ─── Fixtures ───────────────────────────────────────────────────────────────────

const monMorning: OverlapCheckRule = {
  id: "1",
  dayOfWeek: 1,
  specificDate: null,
  startTime: "09:00",
  endTime: "13:00",
  type: "regular",
};

const monAfternoon: OverlapCheckRule = {
  id: "2",
  dayOfWeek: 1,
  specificDate: null,
  startTime: "14:00",
  endTime: "18:00",
  type: "regular",
};

const monFullDay: OverlapCheckRule = {
  id: "3",
  dayOfWeek: 1,
  specificDate: null,
  startTime: "08:00",
  endTime: "17:00",
  type: "regular",
};

const tueMorning: OverlapCheckRule = {
  id: "4",
  dayOfWeek: 2,
  specificDate: null,
  startTime: "09:00",
  endTime: "13:00",
  type: "regular",
};

const monBreak: OverlapCheckRule = {
  id: "5",
  dayOfWeek: 1,
  specificDate: null,
  startTime: "12:00",
  endTime: "13:00",
  type: "break",
};

const monAdjacent: OverlapCheckRule = {
  id: "6",
  dayOfWeek: 1,
  specificDate: null,
  startTime: "13:00",
  endTime: "14:00",
  type: "regular",
};

// ─── Tests ──────────────────────────────────────────────────────────────────────

desc("Same day, exact overlap → true", () => {
  const newRule: OverlapCheckRule = {
    dayOfWeek: 1,
    specificDate: null,
    startTime: "09:00",
    endTime: "13:00",
    type: "regular",
  };
  assert(hasOverlap(newRule, [monMorning]), "exact same time → overlap");
  assert(
    hasOverlap(newRule, [monFullDay]),
    "contained within larger → overlap",
  );
});

desc("Same day, partial overlap → true", () => {
  assert(
    hasOverlap(
      { dayOfWeek: 1, specificDate: null, startTime: "10:00", endTime: "14:00", type: "regular" },
      [monMorning],
    ),
    "starts inside → overlap",
  );
  // New rule ends AFTER existing start: 08:00-10:00 overlaps 09:00-13:00
  assert(
    hasOverlap(
      { dayOfWeek: 1, specificDate: null, startTime: "08:00", endTime: "10:00", type: "regular" },
      [monMorning],
    ),
    "ends inside → overlap",
  );
  // New rule completely contains existing: 08:00-18:00 overlaps 09:00-13:00
  assert(
    hasOverlap(
      { dayOfWeek: 1, specificDate: null, startTime: "08:00", endTime: "18:00", type: "regular" },
      [monMorning],
    ),
    "contains existing → overlap",
  );
});

desc("Same day, no overlap (adjacent) → false", () => {
  const newRule: OverlapCheckRule = {
    dayOfWeek: 1,
    specificDate: null,
    startTime: "13:00",
    endTime: "14:00",
    type: "regular",
  };
  // Adjacent ranges [09:00, 13:00) and [13:00, 14:00) do NOT overlap
  assert(!hasOverlap(newRule, [monMorning]), "adjacent no overlap");

  // Also test the reverse
  const earlyRule: OverlapCheckRule = {
    dayOfWeek: 1,
    specificDate: null,
    startTime: "07:00",
    endTime: "09:00",
    type: "regular",
  };
  assert(!hasOverlap(earlyRule, [monMorning]), "ends exactly at start → no overlap");
});

desc("Different days → false", () => {
  const newRule: OverlapCheckRule = {
    dayOfWeek: 3,
    specificDate: null,
    startTime: "09:00",
    endTime: "17:00",
    type: "regular",
  };
  assert(
    !hasOverlap(newRule, [monMorning, tueMorning]),
    "different dayOfWeek → no overlap",
  );
});

desc("Break rule doesn't conflict with regular → false", () => {
  const newBreak: OverlapCheckRule = {
    dayOfWeek: 1,
    specificDate: null,
    startTime: "12:00",
    endTime: "13:00",
    type: "break",
  };
  assert(
    !hasOverlap(newBreak, [monMorning]),
    "break vs regular → no overlap",
  );
});

desc("Regular doesn't conflict with break → false", () => {
  const newRegular: OverlapCheckRule = {
    dayOfWeek: 1,
    specificDate: null,
    startTime: "12:30",
    endTime: "13:30",
    type: "regular",
  };
  assert(
    !hasOverlap(newRegular, [monBreak]),
    "regular vs break → no overlap",
  );
});

desc("Specific date rule not checked against weekly → false", () => {
  const specificRule: OverlapCheckRule = {
    dayOfWeek: null,
    specificDate: "2026-06-08",
    startTime: "09:00",
    endTime: "17:00",
    type: "regular",
  };
  assert(
    !hasOverlap(specificRule, [monMorning]),
    "specific date vs weekly → no overlap",
  );
});

desc("Edit mode: same rule excluded → false", () => {
  // Editing monMorning itself — should not flag as overlapping with itself
  const edited = { ...monMorning, startTime: "08:00", endTime: "12:00" };
  assert(
    !hasOverlap(edited, [monMorning, monAfternoon]),
    "editing rule excludes self → no overlap",
  );
});

desc("Multiple overlaps → returns true for first", () => {
  const newRule: OverlapCheckRule = {
    dayOfWeek: 1,
    specificDate: null,
    startTime: "08:00",
    endTime: "19:00",
    type: "regular",
  };
  assert(
    hasOverlap(newRule, [monMorning, monAfternoon, monAdjacent]),
    "overlaps multiple → true",
  );
});

// ─── Summary ────────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
