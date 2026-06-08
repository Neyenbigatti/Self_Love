# Design: Treatment Management (P2)

## Technical Approach

Two-phase: **P2A** hardens the data model (schema migration, API guards, DELETE fix), then **P2B** delivers the management UI. P2B depends on P2A's new fields (`isActive`, `category`, `sortOrder`, `treatmentTypeId`). Zero test infrastructure exists — verification is manual + `npx tsc --noEmit`.

## Architecture Decisions

### Sidebar Placement

| Option | Tradeoff |
|--------|----------|
| **Primary nav** (between Pacientes & Historial Clínico) | Frequent operational use, matching availability/patients rhythm |
| Secondary nav (Settings) | Wrong — treatments change daily, not once |

**Decision**: Primary nav. Add `{ label: 'Tratamientos', href: '/dashboard/treatments', icon: Syringe }` to `primaryNav` — same tier as Calendario, Pacientes, etc.

### Page Layout

| Option | Tradeoff |
|--------|----------|
| **Cards grouped by category** | Follows existing `availability-list.tsx` pattern; each treatment has rich state (toggle, badge, price) |
| Table | Dense but awkward for inline toggle + varied content per row |

**Decision**: Cards. Same pattern as `availability-rule-card.tsx` — icon + info + action buttons + toggle switch. Categories render as `<section>` group headers with cards nested inside.

### Quick Toggle (Activate/Deactivate)

| Option | Tradeoff |
|--------|----------|
| **Toggle immediately, no confirm** | Fast, reversible. Accidental deactivate is one re-click to fix |
| Confirm dialog | Friction for a reversible action |

**Decision**: Inline Switch component in each card. Optimistic UI — toggle immediately, revert on API error with toast. Inactive cards get `opacity-50` + `"Inactivo"` badge. They stay in their category group but greyed.

### Category + Sort Order

| Option | Tradeoff |
|--------|----------|
| **Arrow buttons (up/down) — MVP** | No extra deps, lucide-react ya disponible, trivial de implementar |
| Drag-and-drop via @dnd-kit | Mejor UX pero +30KB gzipped, providers, contexto. Post-MVP si hay demanda |

**Decision**: Arrow buttons (MVP). `ChevronUp` / `ChevronDown` icons de lucide-react en cada card. On click → PATCH sortOrder intercambiando con el tratamiento adyacente. Cero dependencias nuevas. Post-MVP se puede migrar a DnD sin cambiar schema. Categories as free-text `<Input>` in the form. Uncategorized (`category IS NULL`) render under `"Sin categoría"` section at the end.

### Patient Portal Filtering

| Option | Tradeoff |
|--------|----------|
| **Server-side: API checks session role** | Automatic — patients only see `isActive=true`, professionals see all |
| Client-side filter | Patients could briefly see inactive treatments via devtools |

**Decision**: `GET /api/treatment-types` already knows the caller's role. When `user.role === 'patient'`, append `and(eq(treatmentTypes.isActive, true))` to the query. No separate endpoint needed.

### Duration-Aware Slots (Option B)

| Option | Tradeoff |
|--------|----------|
| **Optional `duration` param** | Backward compatible, zero schema change, low complexity |
| Fixed 30-min | Bad UX — a 60-min treatment shows 10:00 as available when only 10:30 is free |

**Decision**: Add `duration` query param to `GET /api/availability/slots`. When present, slot generation checks `[start, start+duration]` against appointments/breaks/blocks instead of the fixed 30-min window. `booking-calendar.tsx` passes `selectedTreatment.duration` as the param.

## Data Flow

```
P2A Migration:
  appointments.treatmentType (string)
    → JOIN treatmentTypes WHERE name = value AND professionalId = same
    → SET treatmentTypeId = matched ID

P2B Booking Flow:
  patient selects treatment (name, duration, price)
    → BookingCalendar receives duration prop
    → GET /api/availability/slots?date=X&professionalId=Y&duration=Z
    → slots filtered to [start, start+duration] window
    → POST /api/appointments { ..., treatmentTypeId }
```

## Component Tree

```
app/dashboard/treatments/
├── page.tsx                  ← fetch treatments, render grouped list + create button
└── components/
    ├── treatment-group.tsx   ← category section header + sortable card list
    ├── treatment-card.tsx    ← card: name, duration, price, badge, Switch toggle, edit/delete
    ├── treatment-form.tsx    ← Dialog: name, duration, description, price, category, sortOrder
    └── treatment-delete-dialog.tsx ← confirm + "N appointments reference this" warning
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/db/schema.ts` | Modify | Add `treatmentTypeId` (FK), `isActive` (int, default 1), `category` (text), `sortOrder` (int), unique constraint `(professionalId, name)` |
| `lib/api/validators/treatments.ts` | Modify | Add `isActive`, `category`, `sortOrder` to create/update Zod schemas |
| `lib/api/validators/appointments.ts` | Modify | Add optional `treatmentTypeId` |
| `app/api/treatment-types/route.ts` | Modify | POST stores new fields; GET filters `isActive=true` for patients |
| `app/api/treatment-types/[id]/route.ts` | Modify | PATCH accepts new fields + rename guard (409 if active appointments); DELETE check by ID not name |
| `app/api/appointments/route.ts` | Modify | POST accepts `treatmentTypeId` |
| `app/api/availability/slots/route.ts` | Modify | Accept optional `duration` param, filter to `[start, start+duration]` |
| `components/dashboard/sidebar.tsx` | Modify | Add `Tratamientos` to `primaryNav` with `Syringe` icon |
| `app/dashboard/treatments/page.tsx` | Create | Treatment management page |
| `app/dashboard/treatments/components/treatment-card.tsx` | Create | Card component |
| `app/dashboard/treatments/components/treatment-group.tsx` | Create | Category group section |
| `app/dashboard/treatments/components/treatment-form.tsx` | Create | Create/edit dialog |
| `app/dashboard/treatments/components/treatment-delete-dialog.tsx` | Create | Delete confirm dialog |
| `app/patient/book/page.tsx` | Modify | Pass `duration` + `treatmentTypeId` to booking flow |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | P2A data migration | Run backfill SQL on test DB, verify `treatmentTypeId` populated |
| Manual | P2B CRUD | Create/edit/delete treatment via UI, verify API 200/409 |
| Manual | Toggle active | Deactivate, verify patient portal hides it; re-activate, verify it returns |
| Manual | Slots with duration | Book 60-min treatment, verify only non-overlapping 60-min slots shown |
| TypeScript | All paths | `npx tsc --noEmit` — must pass with zero errors |

## Migration / Rollout

**P2A** has a one-time data migration: backfill `treatmentTypeId` from matching `treatmentType` strings. Run via a script or manual SQL. Rollback: revert schema migration, appointments API falls back to string-based `treatmentType`. **P2B** is data-safe — removing the UI leaves treatment data intact.

## Open Questions

- None blocking. All decisions documented.
