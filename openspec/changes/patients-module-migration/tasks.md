# Tasks: Patients Module — MVP Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~330 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend) → PR 2 (frontend) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + validators + all 4 API endpoints | PR 1 | Base: main. Backend only, no UI changes |
| 2 | Page + dialog real fetch + spec update | PR 2 | Base: main after PR 1. Depends on PR 1 |

## Phase 1: Schema & Validators

- [ ] **1.1** Add `dateOfBirth`, `gender`, `address`, `notes` cols to `users` table in `lib/db/schema.ts` — nullable, text. Run `drizzle-kit generate` + `drizzle-kit migrate`
- [ ] **1.2** Replace `searchPatientsSchema` in `lib/api/validators/patients.ts`: `search` → `z.string().optional().default('')`. Add `createPatientSchema` (name/email/phone required, rest optional, gender enum). Add `updatePatientSchema` (all optional)

## Phase 2: API Endpoints

- [ ] **2.1** Rewrite `GET /api/patients` in `app/api/patients/route.ts`: LEFT JOIN appointments, compute `totalVisits` (COUNT) + `lastVisit` (MAX date), conditional WHERE LIKE only when `search` non-empty
- [ ] **2.2** Add `POST /api/patients` to same file: professional only, `randomUUID` + role=patient, no `passwordHash`, 201 `{patient}`
- [ ] **2.3** Create `app/api/patients/[id]/route.ts` with `GET`: LEFT JOIN same as 2.1, WHERE id=param, 404 if not patient
- [ ] **2.4** Add `PATCH /api/patients/[id]` to same file: professional only, update any subset, 200 `{patient}`

## Phase 3: Frontend Wiring

- [ ] **3.1** Refactor `app/dashboard/patients/page.tsx`: remove mock import + mock state, add `useEffect` fetch `/api/patients`, loading skeleton (matching Card layout), error state with retry, convert ISO strings to Date
- [ ] **3.2** Refactor `handleSavePatient` in page.tsx: PATCH if editing, POST if new, re-fetch list after save
- [ ] **3.3** Rewrite `handleSubmit` in `components/patients/patient-dialog.tsx`: replace `setTimeout(500)` with real fetch (POST or PATCH), handle loading/error states, remove `setTimeout` import

## Phase 4: Spec

- [ ] **4.1** Update `openspec/specs/patients-api/spec.md`: add scenarios for empty search (returns all), create patient, get by id, update patient. Remove "missing search → 400" scenario

## Legend per Task

| # | T | Files | Deps | Risk | ~∆ | Verify |
|---|----|-------|------|------|----|--------|
| 1.1 | Add 4 schema cols | `lib/db/schema.ts` | — | Low | 10 | `npx tsc --noEmit`, check DB has cols |
| 1.2 | Rewrite validators | `lib/api/validators/patients.ts` | — | Low | 25 | `npx tsc --noEmit`, check import in route |
| 2.1 | Rewrite GET list | `app/api/patients/route.ts` | 1.1, 1.2 | Medium | 55 | GET with + without search → verify `totalVisits`/`lastVisit` |
| 2.2 | Add POST | `app/api/patients/route.ts` | 1.1, 1.2 | Low | 35 | POST with curl → 201 + patient in DB |
| 2.3 | Create GET [id] | `app/api/patients/[id]/route.ts` | 1.1, 1.2 | Low | 40 | GET /patients/:id → patient with stats |
| 2.4 | Add PATCH [id] | `app/api/patients/[id]/route.ts` | 1.1, 1.2 | Low | 30 | PATCH subset → 200 + updated fields |
| 3.1 | Page real fetch | `app/dashboard/patients/page.tsx` | 2.1 | Medium | 70 | Page loads patients from API |
| 3.2 | Page save wiring | `app/dashboard/patients/page.tsx` | 2.2, 2.4, 3.1 | Medium | 10 | Save opens/edits patient → list refreshes |
| 3.3 | Dialog real API | `components/patients/patient-dialog.tsx` | 2.2, 2.4 | Medium | 35 | Dialog POST/PATCH without mock delay |
| 4.1 | Update spec | `openspec/specs/patients-api/spec.md` | all | Low | 30 | Spec covers all new endpoints |

## Rollback

- **Each task**: `git checkout -- <files>` before commit, `git revert <sha>` after
- **Schema (1.1)**: `drizzle-kit drop` or manual `ALTER TABLE users DROP COLUMN` per col
- **PR 1 rollback**: revert all commits; frontend still uses mocks, no breakage
- **PR 2 rollback**: revert commits; page falls back to mock-data import
