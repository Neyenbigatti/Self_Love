# Design: Professional Availability Management (P1)

## Technical Approach

Dedicated client page at `/dashboard/availability` following existing patterns (patients, exploration): plain `fetch` + `useState` + `useEffect`. Five components under `components/availability/`. Sidebar nav addition. **No new API routes** — reuses existing `GET/POST/PATCH/DELETE /api/availability` and `GET /api/availability/slots`.

---

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| State management | `useState` + plain `fetch` | React Query, SWR | Existing codebase pattern (dashboard, patients, exploration) — consistency over new deps |
| Form handling | `useState`-controlled inputs | React Hook Form | Same pattern as `patient-dialog.tsx`. One-off form, not worth RHF setup for a single page |
| Rule grouping | Two visual sections in same page | Tabs, separate pages | Proposal spec: "Horario Semanal" + "Excepciones" side-by-side. Lower cognitive load than tabs |
| Conflict dialog | `AlertDialog` from shadcn | Custom modal, Toast | `AlertDialog` already exists (`components/ui/alert-dialog.tsx`) — matches Radix pattern |
| Overlap validation | Client-side before submit + backend 409 | Client-only | Both layers: client catches before round-trip, backend catches race conditions |
| Quick-set preset | Batch POST calls + summary toast | Single API endpoint | Reuses existing POST. No new endpoint needed. Simpler, follows existing patterns |

---

## Data Flow

```
AvailabilityPage ──useEffect──→ GET /api/availability ──→ DB
       │                              │
       ├── availability-form.tsx ──→ POST /api/availability ──→ DB
       │     (or PATCH /api/availability/[id])
       │
       ├── availability-list.tsx
       │     ├── availability-rule-card.tsx  ──→ DELETE /api/availability/[id]
       │     └── appointment-conflict-dialog.tsx ──→ GET /api/appointments?date=...
       │
       └── availability-configure-hours.tsx ──→ POST /api/availability (×N)
```

- Page fetches rules on mount. After every CUD action, re-fetches the full list (no optimistic updates — matches patients page pattern).
- `configure-hours` sends parallel POST calls, collects results, shows toast summary.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/dashboard/sidebar.tsx` | Modify | Add `{ label: 'Disponibilidad', href: '/dashboard/availability', icon: Clock }` to `primaryNav`; import `Clock` from `lucide-react` |
| `app/dashboard/availability/page.tsx` | Create | Client page: fetch rules, CRUD orchestration, loading/error/empty states |
| `components/availability/availability-form.tsx` | Create | Dialog form for create/edit. Fields: type (select), dayOfWeek or specificDate, start/end time (input type="time"), label. Overlap check before submit |
| `components/availability/availability-list.tsx` | Create | Two sections: "Horario Semanal" + "Excepciones". Maps rules to `AvailabilityRuleCard` |
| `components/availability/availability-rule-card.tsx` | Create | Card: day/date, time range, label, type badge. Edit/delete action buttons |
| `components/availability/availability-configure-hours.tsx` | Create | Preset buttons: "Lun–Vie 09:00–18:00", "Lun–Sab 09:00–13:00", etc. Batch-creates weekly rules |
| `components/availability/appointment-conflict-dialog.tsx` | Create | `AlertDialog` showing affected appointment count on delete. Proceed does NOT modify appointments |

---

## Interfaces / Contracts

```typescript
// Component props
interface AvailabilityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: Availability           // undefined = create, defined = edit
  existingRules: Availability[] // for overlap detection
  onSaved: () => void           // triggers re-fetch
}

interface AvailabilityListProps {
  rules: Availability[]
  onEdit: (rule: Availability) => void
  onDelete: (rule: Availability) => void
}

interface AvailabilityRuleCardProps {
  rule: Availability
  onEdit: () => void
  onDelete: () => void
}

interface ConfigureHoursProps {
  onConfigured: () => void  // re-fetch after batch create
}

interface AppointmentConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentCount: number
  onConfirm: () => void
}

// API shapes (existing — no changes)
// POST /api/availability  body: { dayOfWeek?: number, specificDate?: string, startTime: string, endTime: string, type: 'regular'|'break'|'blocked', label?: string }
// PATCH /api/availability/[id] body: { startTime?: string, endTime?: string, ... }
// DELETE /api/availability/[id] → { success: true }
// GET /api/availability → { availability: Availability[] }
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Overlap detection logic | Extract to pure fn `hasOverlap(newRule, existingRules): boolean` — test dayOfWeek and time range intersection |
| Integration | Page flow (fetch → list → create → edit → delete) | Manual in dev (no test infra). Verify against real API responses |
| Visual | Loading/empty/error states | Manual. No visual regression tooling detected in project |

---

## Migration / Rollout

No migration required. Page is additive — existing sidebar unchanged until nav item addition. Remove nav item + page files for rollback.

---

## Open Questions

None.
