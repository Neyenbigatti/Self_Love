# Design: Fase 2 — API de Turnos

## Technical Approach

Add `lib/api/` infrastructure layer (error helpers, auth guard, Zod validators) and 11 route files under `app/api/` implementing REST CRUD for appointments, availability, slots, treatment-types, and patients. CalendarPage swaps `mockAppointments` for `fetch()`. No schema changes — all tables exist.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Auth per-route vs middleware | Middleware can't read body; per-route has full control | `requireRole()` in each handler via `getSession()` |
| Zod in shared vs inline | Shared reduces boilerplate, enforces consistent errors | `validate()` wrapper in `lib/api/validators/common.ts` |
| Overlap check in SQL vs memory | SQL atomic handles concurrency; memory needs locks | SQL overlap check in INSERT/UPDATE query |
| UUID gen server vs client | Server controls format; clients send no ID | `randomUUID()` server-side in POST handlers |

## Data Flow — Appointment Creation

```
AppointmentDialog      CalendarPage           POST /api/appointments        Drizzle DB
    │                      │                        │                          │
    │  { date: Date,       │                        │                          │
    │    startTime,end }   │                        │                          │
    │ ──────►              │ format(date,'yyyy-MM-dd')                        │
    │                      │ ── fetch() ────────►    │                        │
    │                      │                        │ validate(body)          │
    │                      │                        │ requireRole(session)     │
    │                      │                        │ check overlap SQL        │
    │                      │                        │ INSERT appointment       │
    │                      │                        │ ──────────────────►      │
    │                      │                        │ ◄──── row ──────────     │
    │                      │ ◄── 201 { appointment }                         │
    │                      │ parseISO(date)          │                        │
    │ ◄─ setAppointments ──│                        │                        │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/api/errors.ts` | Create | `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`, `serverError()` → `NextResponse` |
| `lib/api/auth-guard.ts` | Create | `requireRole(session, ...roles)` returns `SessionUser` or 401/403 |
| `lib/api/validators/common.ts` | Create | `dateString`, `timeString`, `uuidSchema`, `validate(schema, data)` wrapper |
| `lib/api/validators/appointments.ts` | Create | Create/update/query Zod schemas |
| `lib/api/validators/availability.ts` | Create | Create/update Zod schemas |
| `lib/api/validators/treatments.ts` | Create | Create/update Zod schemas |
| `lib/api/validators/patients.ts` | Create | Search query Zod schema |
| `app/api/appointments/route.ts` | Create | `GET` list, `POST` create |
| `app/api/appointments/[id]/route.ts` | Create | `GET` by id, `PATCH`, `DELETE` |
| `app/api/availability/route.ts` | Create | `GET` list, `POST` create |
| `app/api/availability/[id]/route.ts` | Create | `PATCH`, `DELETE` |
| `app/api/availability/slots/route.ts` | Create | `GET` available slots |
| `app/api/treatment-types/route.ts` | Create | `GET` list, `POST` create |
| `app/api/treatment-types/[id]/route.ts` | Create | `PATCH`, `DELETE` |
| `app/api/patients/route.ts` | Create | `GET` search |
| `app/dashboard/calendar/page.tsx` | Modify | Replace `mockAppointments` with `fetch()` + transform layer |
| `lib/db/index.ts` | Modify | Add `treatmentTypes` to re-exports |

## Auth Flow

```
Request → middleware.ts (JWT verify, guards page routes only)
        → API handler
          → getSession() from cookie
          → requireRole(session, 'professional')
          → validate(body, schema)
          → DB op + response
```

`requireRole` reuses the existing `getSession()` from `lib/auth.ts`. Each handler calls it before processing. Middleware does NOT protect API endpoints — handlers self-authorize. This matches the existing pattern where `/api/auth/*` routes are excluded from middleware.

## Time Overlap Prevention

Detect intersecting ranges for same professional + date, excluding `cancelled` status:

```ts
where: and(
  eq(apt.professionalId, professionalId),
  eq(apt.date, date),
  ne(apt.status, 'cancelled'),
  or(
    // new start inside existing
    and(lte(apt.startTime, startTime), gt(apt.endTime, startTime)),
    // new end inside existing
    and(lt(apt.startTime, endTime), gte(apt.endTime, endTime)),
    // new fully contains existing
    and(gte(apt.startTime, startTime), lte(apt.endTime, endTime)),
  ),
  ...(excludeId ? [ne(apt.id, excludeId)] : []),
)
```

Edge: `endTime === other.startTime` does NOT overlap (adjacent 30-min slots valid).

## Date ↔ ISO String Strategy

| Layer | Format | Transform |
|-------|--------|-----------|
| API response | `date: "2026-06-02"` (ISO string) | — |
| CalendarPage fetch | `parseISO(apt.date)` → `Date` object | Sets `apt.date = parseISO(apt.date)` in `map()` |
| AppointmentDialog save | `format(date, 'yyyy-MM-dd')` → string in fetch body | Added in `handleSaveAppointment` before fetch |

`lib/types.ts` `Appointment.date` stays `Date` for frontend. A `ApiAppointment` type in the fetch layer handles the wire format. `startTime` and `endTime` are always `HH:mm` strings at every layer.

## Availability Engine & Slot Generation

```
GET /api/availability/slots?date=2026-06-01&professionalId=prof-1

Algorithm (in-memory):
1. Resolve dayOfWeek from date → query availability: dayOfWeek matches OR specificDate matches
2. Separate entries: regular (slot source), break (subtract), blocked (full-subtract)
3. Generate 30-min slots from each regular [start, end)
4. Subtract break ranges: remove or flag slots inside them
5. Subtract blocked date ranges: remove all slots inside
6. Subtract existing appointments (status IN pending, confirmed): same date+professional
7. Return [{ time: "09:00", available: true }, ...]
```

Chosen over SQL-only because SQLite lacks time-range intersection functions, and the in-memory approach is cleaner for this data volume (single day, max ~48 slots).

## Technical Risks

| Risk | Mitigation |
|------|------------|
| AppointmentDialog uses mock patients/treatments directly | Add `useEffect` fetch calls to populate selects from API before CalendarPage migration |
| Date transform breaks if fetch fails | try/catch in CalendarPage, fallback to `[]`, show toast on error |
| Overlap check misses concurrency edge | SQL check runs inside single query — no race window between read and insert |

## Impact on Existing Components

**CalendarPage**: Change `useState<Appointment[]>(mockAppointments)` to `useState<Appointment[]>([])` + `useEffect` fetch. Add `parseISO` map in fetch, `format` in save. Import `date-fns` (already present).

**AppointmentDialog**: Patient select and treatment type select currently use `mockPatients` / `treatmentTypes` arrays. These become fetch-based from `/api/patients?search=` and `/api/treatment-types?professionalId=`. The `professionalId: '1'` hardcode becomes the session user's ID.

**`lib/types.ts`**: No change needed. `Appointment.date` remains `Date` for frontend.

**`lib/db/index.ts`**: Add `treatmentTypes` to re-exports (already listed in proposal).

## Open Questions

- [ ] `treatmentType` in schema is `text` — is it the treatment name string or a FK to `treatment_types.id`? Current seed uses name strings. Keep as name string for now.
- [ ] Patient search `LIKE '%term%'` on three columns may be slow at scale — add SQLite FTS5 if needed. Start simple.
