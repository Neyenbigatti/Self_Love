# Proposal: Professional Availability Management (P1)

## Intent

SelfLove has no UI for the professional to manage availability. Backend APIs exist (CRUD + slot computation) but availability is only set via seed script. The professional needs to configure working hours, breaks, exceptions, and blocks — otherwise the patient booking calendar is useless.

## Scope

### In Scope
- Dedicated `/dashboard/availability` page with full CRUD for availability rules
- Sidebar nav item ("Disponibilidad") with `Clock` icon in primary nav
- Weekly recurring rules (Mon–Fri 09:00–18:00, etc.) with time pickers
- Date-specific exceptions (vacations, holiday blocks, Saturday work)
- Break management (e.g., 12:00–13:00 lunch) per day/date
- Warning dialog when modifying/deleting rules affecting dates with existing appointments
- Validation: end after start, no overlaps between regular rules on same day

### Out of Scope
- Multi-professional support (not needed — solo practice)
- Drag-and-drop calendar grid (future enhancement)
- Copy-week or bulk-apply pattern (future)
- Slot duration configuration (hardcoded 30-min from backend)
- Treatment-type availability mapping (not in schema)
- Email/notification to patients on availability changes
- Integration with external calendar (Google, iCal)

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities
- `availability-management`: UI for professionals to create, read, update, delete availability rules (weekly recurring + date-specific). Includes validation, conflict detection, and appointment-aware warnings.

### Modified Capabilities
- None — backend APIs (`availability-api`, `slots-api`) are complete and unchanged.

## Approach

**Dedicated page** at `/dashboard/availability` following existing patterns (patients, exploration).

```
app/dashboard/availability/page.tsx          ← Client page
components/availability/
  availability-form.tsx                       ← Create/edit rule dialog/form
  availability-list.tsx                       ← Table/list of existing rules
  availability-rule-card.tsx                  ← Single rule display card
  availability-configure-hours.tsx            ← Quick "working hours" setup
  appointment-conflict-dialog.tsx             ← Warning for affected appointments
```

### Key design decisions:
1. **Weekly vs Exceptions**: Two visually separate sections — "Horario Semanal" (recurring rules by dayOfWeek) and "Excepciones" (specificDate entries). Different card styles/colors.
2. **Single professional**: No professional selector, no `professionalId` in URL params. `GET /api/availability` (no filter) returns current user's rules.
3. **Base hours quick-set**: Preset buttons (e.g., "Lun–Vie 09:00–18:00") that batch-create multiple weekly rules. Saves tapping 5 individual day forms.
4. **Appointment conflict**: On rule modification/deletion, call `GET /api/appointments?availabilityRuleId=X` to check. Show warning with appointment count. Allow proceed but never auto-cancel.
5. **Schema reuse**: P1 uses existing columns (`dayOfWeek`, `specificDate`, `startTime`, `endTime`, `type`, `isAvailable`) exactly as-is. No new columns, no new endpoints.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/dashboard/sidebar.tsx` | Modified | Add "Disponibilidad" nav item to `primaryNav` |
| `app/dashboard/availability/page.tsx` | New | Main availability management page |
| `components/availability/` | New | 5-component directory for availability UI |
| `app/dashboard/calendar/page.tsx` | Modified (optional) | Show availability overlay on week view |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Professional deletes a day rule with future appointments | Medium | Warning dialog lists affected dates; appointments are preserved but no new slots generated |
| Overlapping regular rules on same day | Low | Frontend validation: detect overlaps on save, warn user |
| Timezone confusion (HH:mm stored as-is) | Low | All times stored in professional's local time; no conversion needed (solo practice, single TZ) |

## Rollback Plan

1. Remove `app/dashboard/availability/` page and `components/availability/` directory
2. Revert `components/dashboard/sidebar.tsx` to remove nav item
3. Revert `app/dashboard/calendar/page.tsx` if modified
4. Data stays in DB — no schema migration to revert

## Dependencies

- Existing `GET /api/appointments` endpoint (to check conflicts). Verify it supports date-range filtering.

## Success Criteria

- [ ] Professional can create weekly recurring availability rules via UI
- [ ] Professional can add date-specific exceptions (vacation blocks, Saturday work)
- [ ] Modifying/deleting rules with existing appointments shows warning dialog
- [ ] Created availability rules reflect in patient booking calendar within 1 minute
- [ ] Overlapping regular rules are detected and warned on save
- [ ] End-to-end: create weekly rule → confirm slots appear for patient → delete rule → confirm slots disappear
