# Tasks: Treatment Management (P2)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~480–550 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (P2A): Schema, API, migration ~180 lines | PR 2 (P2B): UI, sidebar, booking ~330 lines |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | P2A — Schema migration, API hardening, data backfill | PR 1 | ✅ Complete |
| 2 | P2B — Treatment management UI + duration-aware booking | PR 2 | Base: main. Includes patient portal integration. ~330 lines |

## Phase 1: Schema & Validators (P2A)

- [x] 1.1 Add `isActive` (int, default 1), `category` (text), `sortOrder` (int) columns + unique `(professionalId, name)` constraint to treatmentTypes in `lib/db/schema.ts`
- [x] 1.2 Add `treatmentTypeId` (text, nullable FK) to appointments table in `lib/db/schema.ts`
- [x] 1.3 Update `lib/api/validators/treatments.ts`: add `isActive`, `category`, `sortOrder` to create/update Zod schemas
- [x] 1.4 Update `lib/api/validators/appointments.ts`: add optional `treatmentTypeId` to create/update schemas

## Phase 2: API Hardening (P2A)

- [x] 2.1 Fix DELETE guard in `app/api/treatment-types/[id]/route.ts`: compare `eq(appointments.treatmentTypeId, id)` not `eq(appointments.treatmentType, existing.name)`
- [x] 2.2 Add rename guard to PATCH `app/api/treatment-types/[id]/route.ts`: return 409 if name changes and active appointments reference the type
- [x] 2.3 Update POST `app/api/treatment-types/route.ts`: store `isActive`, `category`, `sortOrder`; enforce unique `(professionalId, name)`
- [x] 2.4 Update GET `app/api/treatment-types/route.ts`: append `and(eq(isActive, true))` when `user.role === 'patient'`
- [x] 2.5 Update POST `app/api/appointments/route.ts`: accept optional `treatmentTypeId` alongside existing `treatmentType`
- [x] 2.6 Update `app/api/availability/slots/route.ts`: add optional `duration` param — validate (positive, multiple of 5), filter slots to `[start, start+duration]` overlap check

## Phase 3: Data Migration (P2A)

- [x] 3.1 Create `scripts/backfill-treatment-type-id.ts`: JOIN `appointments.treatmentType` → `treatmentTypes.name` WHERE same `professionalId`, SET `treatmentTypeId`
- [x] 3.2 Run migration, verify no null `treatmentTypeId` remains for existing named treatments

## Phase 4: Treatment Management UI + Duration-Aware Booking (P2B)

- [x] 4.1 Add `{ label: 'Tratamientos', href: '/dashboard/treatments', icon: Syringe }` to `primaryNav` in `components/dashboard/sidebar.tsx`
- [x] 4.2 Create `app/dashboard/treatments/components/treatment-card.tsx`: card with name, duration, price, active badge, Switch toggle, edit/delete buttons, ChevronUp/ChevronDown arrows
- [x] 4.3 Create `app/dashboard/treatments/components/treatment-group.tsx`: category section header with sorted card children
- [x] 4.4 Create `app/dashboard/treatments/components/treatment-form.tsx`: dialog for create/edit with fields (name, duration, description, price, category)
- [x] 4.5 Create `app/dashboard/treatments/components/treatment-delete-dialog.tsx`: confirm dialog with "N appointments reference this" warning
- [x] 4.6 Create `app/dashboard/treatments/page.tsx`: fetch treatments grouped by category, render groups + create button
- [x] 4.7 Update BookingCalendar to accept `duration` prop; pass `selectedTreatment.duration` from booking page; call `/api/availability/slots?duration=X`; verify slots match real treatment duration

### Duration-Aware Booking Flow (validar durante PR2)

```
Paciente → selecciona tratamiento (con duración)
         → BookingCalendar recibe `duration` como prop
         → fetch a `/api/availability/slots?duration=X`
         → slots filtrados por rango [start, start+duration]
         → paciente solo ve horarios donde entra el tratamiento completo
```
