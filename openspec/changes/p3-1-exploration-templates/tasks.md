# Tasks: P3.1 Exploration Templates — Foundation (PR #1)

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (already split into 4 PRs) |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

> **Design note**: Spec says system templates read-only (403 on PUT). Design **overrides** this: system templates allow config edits but block slug changes and DELETE. Tasks follow the design.

## Phase 1: Schema

- [x] 1.1 Add `explorationTemplates` table to `lib/db/schema.ts`
- [x] 1.2 Add `clinicalNotes` table to `lib/db/schema.ts`
- [x] 1.3 Add `templateId` (FK nullable) and `responses` (JSON text) to `explorations`
- [x] 1.4 Export new types (`ExplorationTemplate`, `NewExplorationTemplate`, `ClinicalNote`, `NewClinicalNote`)
- [x] 1.5 Run `npm run db:push` to generate migration

## Phase 2: Validators

- [x] 2.1 Create `lib/api/validators/exploration-templates.ts` (config + create + update Zod schemas)
- [x] 2.2 Create `lib/api/validators/clinical-notes.ts` (create + update Zod schemas)
- [x] 2.3 Modify `lib/api/validators/explorations.ts` (add `templateId`, `responses` to schemas)

## Phase 3: Shared Helpers

- [x] 3.1 Create `lib/api/helpers.ts` — extract `parseJsonField()` for shared import across route files
- [x] 3.2 Add `ensureDefaultExplorationTemplate()` to `lib/db/seed.ts` (lazy auto-seed by slug check)

## Phase 4: API — Exploration Templates

- [x] 4.1 Create `app/api/exploration-templates/route.ts` (GET list + POST create; ensure default on GET)
- [x] 4.2 Create `app/api/exploration-templates/[slug]/route.ts` (GET by slug + PUT update; system: allow config edits, block slug changes)

## Phase 5: API — Clinical Notes

- [x] 5.1 Create `app/api/patients/[id]/clinical-notes/route.ts` (GET list + POST create; professional filter)
- [x] 5.2 Create `app/api/patients/[id]/clinical-notes/[noteId]/route.ts` (PATCH update + DELETE; ownership checks)

> **Note**: Routes use `[id]` instead of `[patientId]` to be consistent with existing `clinical-history` and `medical-history` route patterns.

## Phase 6: API — Explorations v2

- [x] 6.1 Modify `app/api/explorations/route.ts` (shared parseJsonField; v2 write: template_id → responses; v2 read: responses ?? legacy fallback)
- [x] 6.2 Modify `app/api/explorations/[id]/route.ts` (same v2 read/write fallback; PATCH supports templateId/responses)
- [x] 6.3 Modify `app/api/patients/[id]/clinical-history/route.ts` (include `responses` in exploration aggregation when non-null)

## Phase 7: Verify

- [x] 7.1 Run `npx tsc --noEmit` — zero errors
- [x] 7.2 Smoke test: GET `/api/exploration-templates` returns seeded "Exploración Física Facial" template
