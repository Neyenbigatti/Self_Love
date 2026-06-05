# Tasks: Professional Availability Management (P1)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650-750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Core CRUD) → PR 3 (Special Features) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Sidebar nav + page scaffold + rule list | PR 1 | base = main. Fetch + display, loading/empty states |
| 2 | Create/edit/delete rules with form + card | PR 2 | base = main or feature branch. Depends on PR 1 |
| 3 | Quick-set, conflict dialog, overlap validation | PR 3 | base = main or previous PR. Depends on PR 2 |

## Phase 1: Foundation

- [x] 1.1 Add "Disponibilidad" nav item with Clock icon to `components/dashboard/sidebar.tsx`
- [x] 1.2 Create `app/dashboard/availability/page.tsx` — fetch rules, loading/error/empty states
- [x] 1.3 Create `components/availability/availability-list.tsx` — group rules by weekly vs exceptions

## Phase 2: Core CRUD

- [x] 2.1 Create `components/availability/availability-rule-card.tsx` — display day/date, time, type badge, edit/delete
- [x] 2.2 Create `components/availability/availability-form.tsx` — dialog with type/day/time/label fields, POST/PATCH submit
- [x] 2.3 Wire CRUD handlers in page.tsx — create, edit, delete calling API, re-fetch on success

## Phase 3: Special Features

- [x] 3.1 Create `components/availability/availability-configure-hours.tsx` — preset buttons, batch POST, skip-toast
- [x] 3.2 Create `components/availability/appointment-conflict-dialog.tsx` — AlertDialog with appointment count, non-blocking proceed
- [x] 3.3 Add overlap validation before submit (frontend block) + handle 409 from backend

## Phase 4: Testing & Verification

- [x] 4.1 Extract `hasOverlap()` pure function, write unit tests for day/time intersection
- [ ] 4.2 Manual: create weekly rule → patient sees slots → delete → slots gone
- [ ] 4.3 Manual: conflict dialog shows on delete with existing appointments, proceed does not modify appointments
