# Proposal: Treatment Management (P2)

## Intent

Professionals currently need a developer to add/edit treatment types. P2 gives them full CRUD UI so they manage treatments independently. Also hardens the data model from free-text names to stable ID references.

## Scope

### P2A — Data Model Hardening
- Add `treatmentTypeId` column to `appointments`, migrate existing data to link by ID
- Add uniqueness constraint `(professionalId, name)` on `treatment_types`
- Add `isActive`, `category`, `sortOrder` columns to `treatment_types`
- Fix DELETE guard in `app/api/treatment-types/[id]/route.ts` to check by ID not name
- Update POST/PATCH appointments to accept & store `treatmentTypeId`
- Add rename guard on PATCH treatment when active appointments reference the type

### P2B — Treatment Management UI
- Full CRUD UI for treatment types (list, create, edit, delete)
- Activate/deactivate toggle, category selector, sort order drag
- Sidebar nav item "Tratamientos" + dedicated page `/dashboard/treatments`

### Deactivated Treatments — Rules
- Existing appointments referencing a deactivated treatment RETAIN all data (name, duration, price as stored at booking time)
- Patient booking flow MUST filter out `isActive=false` treatments from the selection grid
- Professional management UI SHOWS inactive treatments (greyed, with "Activar" option)
- Deactivate does NOT delete historical data — appointments keep their `treatmentTypeId` reference
- DELETE remains available only when zero appointments reference the treatment (existing constraint)

### Categories — Design
- Simple `category` text/varchar column on `treatment_types` (nullable, no enum)
- Professional types categories as free text (e.g. "Inyectables", "Corporal", "Facial")
- UI: filter pills / group headers in the management list
- No rigid list, no admin-controlled taxonomy — extensible by default

### Out of Scope
- Color-coding treatments on calendar
- Patient-facing treatment browsing improvements
- Bulk import/export

## Capabilities

### New Capabilities
- `treatment-management`: Professional UI for managing treatment types — list, create, edit, delete, activate/deactivate, categories, ordering

### Modified Capabilities
- `treatment-types-api`: Add `isActive`, `category`, `sortOrder`, `slotDuration` fields; add `(professionalId, name)` unique constraint; PATCH warns/block rename when active appointments reference the type
- `appointments-api`: Accept `treatmentTypeId` (ID reference) in addition to `treatmentType` string; response includes both during migration
- `slots-api`: Accept optional `duration` param for duration-aware slot generation

## Approach

### P2A
1. Schema migration: add columns, unique constraint, `treatmentTypeId` on appointments
2. Backfill: set `treatmentTypeId = treatmentTypes.id WHERE name = appointments.treatmentType` for same professional
3. Fix DELETE: change `eq(appointments.treatmentType, existing.name)` → `.where(eq(appointments.treatmentTypeId, id))`
4. Update validators: accept `treatmentTypeId` in create/update appointment schemas
5. Add rename guard: on PATCH treatment, if name changes, check active appointments and return 409

### P2B
1. Create `app/dashboard/treatments/page.tsx` with client component
2. Server action or direct fetch for CRUD operations
3. Dialog for create/edit, switch for active/inactive, text input for category
4. Add to sidebar nav

## Slot Duration Analysis

| Option | Complexity | UX | Schema Change |
|--------|-----------|-----|--------------|
| **A** — Fixed 30-min | None | Bad: slots lie — 10:30 shows free but 60-min block from 10:00 covers it | No |
| **B** — Duration-aware param | Low | Good: slots filter by `[start, start+duration]` range | No |
| **C** — Treatment slotDuration | Medium | Best: each treatment defines its slot size | Yes: `slotDuration` on treatment_types |

**Recommendation: Option B**. No schema change, one optional query param. Slots API checks `[start, start+duration]` against existing appointments. Booking flow passes `duration` from selected treatment. Option C is future work if same treatment needs different slot sizes per professional.

**Impact on Patient Portal & Booking Flow:**
- `app/patient/book/page.tsx`: After treatment selection, pass `selectedTreatment.duration` to `<BookingCalendar>`
- `components/patient-portal/booking-calendar.tsx`: Forward duration to `GET /api/availability/slots?duration=X`
- `GET /api/availability/slots`: When `duration` param present, filter slots to only those where `[start, start+duration]` has zero overlap with existing appointments (breaks, blocks, other appointments)
- `POST /api/appointments`: Optionally validate that `endTime - startTime` matches the referenced treatment's `duration` (gentle enforcement, not hard block — allows manual override)
- Fallback: when `duration` param absent, current 30-min slot behavior preserved (backward compatible)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/db/schema.ts` | Modified | Add `treatmentTypeId`, `isActive`, `category`, `sortOrder`, unique constraint |
| `app/api/treatment-types/[id]/route.ts` | Fixed | DELETE guard: compare by ID not name (line 94) |
| `app/api/treatment-types/route.ts` | Modified | POST stores new fields |
| `app/api/appointments/route.ts` | Modified | POST stores `treatmentTypeId` |
| `app/api/appointments/[id]/route.ts` | Modified | PATCH accepts `treatmentTypeId` |
| `app/api/availability/slots/route.ts` | Modified | Accept `duration` param |
| `lib/api/validators/treatments.ts` | Modified | Add new fields to schemas |
| `lib/api/validators/appointments.ts` | Modified | Add `treatmentTypeId` to schema |
| `components/dashboard/sidebar.tsx` | Modified | Add "Tratamientos" nav item |
| `app/dashboard/treatments/page.tsx` | New | Treatment management UI |
| `app/dashboard/treatments/` | New | CRUD sub-routes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Name-based DELETE check (line 94) blocks wrong type | High | Fix to compare by ID — highest priority in P2A |
| Data migration fails on existing appointments | Med | Test backfill SQL on copy of DB first |
| Rename treatment breaks active appointments | Med | PATCH renames blocked when active appointments reference it |

## Rollback Plan

**P2A revert**: Roll back schema migration (remove `treatmentTypeId`, restore old columns). Revert DELETE fix. Appointments API falls back to `treatmentType` string. Apps using ID references break — coordinate deploy.
**P2B revert**: Remove treatment management page and sidebar nav item. Data stays in DB (no destructive revert needed).

## Dependencies

- P2A MUST precede P2B (UI depends on ID-based model)
- Drizzle migration tooling must support adding columns + unique constraints to SQLite

## Success Criteria

- [ ] DELETE treatment type checks by ID, not name
- [ ] PATCH treatment with active appointments returns 409 on rename
- [ ] POST/PATCH appointments accept `treatmentTypeId` and store it
- [ ] Treatment management page allows create, edit, toggle active, reorder
- [ ] `npx tsc --noEmit` passes with zero errors
