## Exploration: Professional Availability Management (P1)

### Current State

The system already has a **fully functional backend** for availability management and slot generation, but **zero UI** for professionals to manage their availability. Currently:

1. Availability data is created only through the **seed script** (`lib/db/seed.ts`) — direct DB inserts
2. The **dashboard home** (`app/dashboard/page.tsx`) reads availability to render a **read-only weekly schedule** widget
3. The **patient booking calendar** (`components/patient-portal/booking-calendar.tsx`) reads computed slots via `GET /api/availability/slots` to show patients what's available
4. The **calendar view** (`app/dashboard/calendar/page.tsx`) shows appointments but does NOT show availability overlays or allow availability management

The APIs exist (CRUD for availability + slot computation) and are well-tested by the specs, but there is no entry point in the professional dashboard to create, edit, delete, or visualize availability rules.

### Schema Analysis

**`availability` table** (`lib/db/schema.ts`):

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `text` | PK | UUID |
| `professionalId` | `text` | FK → users.id, NOT NULL | |
| `dayOfWeek` | `integer` | nullable | 0-6, null for specific-date exceptions |
| `specificDate` | `text` (YYYY-MM-DD) | nullable | null for recurring rules |
| `startTime` | `text` (HH:mm) | NOT NULL | |
| `endTime` | `text` (HH:mm) | NOT NULL | |
| `isAvailable` | `integer` (boolean) | NOT NULL | Derives from type (blocked → false) |
| `type` | `text` | enum: `regular`, `break`, `blocked`, default `regular` | |
| `label` | `text` | nullable | e.g. "Lunch", "Team Meeting" |

**Key findings**:
- `specificDate` is handled as a **column**, not a `type` enum value. A specific-date entry uses `specificDate` column and can be any type (`regular`, `break`, `blocked`).
- The `type` enum is: `regular`, `break`, `blocked` — there is NO `specificDate` type value.
- The **seed data** (Mon–Fri 08:00–19:00, break 12:00–13:00, Saturday 09:00–14:00) is inserted directly into the DB.

**Existing Zod validators** (`lib/api/validators/availability.ts`):
- `createAvailabilitySchema`: dayOfWeek (0-6, optional), specificDate (YYYY-MM-DD, optional), startTime, endTime, type (regular|break|blocked), label (optional), isAvailable (optional)
- `updateAvailabilitySchema`: same fields, all optional
- Refine rule: exactly one of dayOfWeek XOR specificDate required

### Affected Areas

- `components/dashboard/sidebar.tsx` — Add "Disponibilidad" nav item
- `app/dashboard/availability/page.tsx` — NEW page: availability management UI
- `components/availability/` — NEW directory for availability UI components (rule-list, rule-form, calendar-grid, etc.)
- `app/dashboard/calendar/page.tsx` — Optionally overlay availability on the week view
- `app/api/availability/slots/route.ts` — May need updates if different slot durations/treatment-specific availability is needed
- `app/dashboard/page.tsx` — Weekly schedule already reads availability; no change needed
- `lib/constants.ts` — BOOKING_WINDOW_DAYS = 60 (already defined, used by patient booking calendar)
- `openspec/specs/availability-api/spec.md` — Already spec'd the APIs; may need delta for UI behavior

### Approaches

1. **Separate Availability Page** (recommended)
   - Create `app/dashboard/availability/page.tsx` + `components/availability/`
   - Pattern: like patients or exploration pages — dedicated page with full CRUD
   - **Pros**: Complete UX, follows existing patterns, clean separation, supports all operations
   - **Cons**: More initial work, new navigation item
   - **Effort**: Medium

2. **Availability Panel Inside Calendar View**
   - Add an "Availability" tab or panel within the existing calendar page
   - **Pros**: Contextual (see availability + appointments together), fewer new files
   - **Cons**: Complicates the calendar page, harder to implement well, less discoverable
   - **Effort**: Medium

3. **Settings-Based Availability**
   - Add availability management under `/dashboard/settings`
   - **Pros**: Logical grouping with other config
   - **Cons**: Settings page doesn't exist yet (no `app/dashboard/settings/`), availability is operational not config
   - **Effort**: Low-Medium

### Recommendation

**Approach 1**: Dedicated availability page at `/dashboard/availability`. Rationale:
- Follows existing patterns (patients, exploration, clinical-history are all separate pages)
- Most discoverable for the professional (dedicated sidebar nav item)
- Clean separation of concerns
- Can later enhance with weekly visual grid, copy-week, bulk operations
- The weekly schedule already shown on the dashboard home provides a read-only preview; the dedicated page is for management

### Functional Gap Analysis

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| List availability rules | ✅ `GET /api/availability` | ❌ No UI | Needs frontend |
| Create rule | ✅ `POST /api/availability` | ❌ No UI | Needs frontend |
| Update rule | ✅ `PATCH /api/availability/[id]` | ❌ No UI | Needs frontend |
| Delete rule | ✅ `DELETE /api/availability/[id]` | ❌ No UI | Needs frontend |
| Slot computation | ✅ `GET /api/availability/slots` | ✅ Patient booking calendar | Complete |
| Visual calendar grid | ❌ Not in API | ❌ Not in UI | Needs design |
| Conflict detection when changing availability | ❌ Not in API | ❌ Not in UI | Needs design |
| Recurring rule management (weekly) | ✅ Schema supports it | ❌ No UI | Needs frontend |
| Date-specific exceptions | ✅ Schema supports it | ❌ No UI | Needs frontend |
| Break management | ✅ Schema + slot logic | ❌ No UI | Needs frontend |
| Block/full-day off | ✅ Schema + slot logic | ❌ No UI | Needs frontend |

### Risks

1. **Existing appointments become orphaned**: If a professional removes a recurring availability rule for a day that has future appointments, those appointments will still exist. The slot generator excludes them, but they remain in the DB with `confirmed` status. The professional could still see and interact with them in the calendar. **Mitigation**: Show a warning when deleting/editing availability that affects dates with existing appointments. Consider whether to notify or auto-cancel.

2. **Overlap between availability rules**: The schema allows two regular rules that overlap (e.g., Mon 09:00–13:00 and Mon 10:00–12:00). The slot generator processes all regular rules and deduplication by time is not explicit. **Mitigation**: Detect and warn about overlapping rules on save, or simply let the generator handle it (current behavior produces duplicate slots at same time, which may confuse the patient UI).

3. **Saturday schedule edge case**: Seed data has Saturday 09:00–14:00 with NO break entry. The weekday schedule has a 12:00–13:00 break. If the professional manages availability via UI, they need clear affordance for adding/removing breaks per day.

4. **Future dates beyond BOOKING_WINDOW_DAYS (60)**: Changing availability beyond the booking window won't affect any existing appointments, but professionals may want to set availability far in advance. The schema supports any date via `specificDate`. **No risk** — just needs clear UX.

5. **Performance**: No concern — availability entries are per-professional, typically < 50 rows. Slot computation is O(n) on availability + appointments for a single date.

### Ready for Proposal

Yes. The backend is complete and well-spec'd. The gap is entirely frontend: the professional needs a UI to manage availability rules (create recurring weekly rules, manage breaks, add date-specific exceptions/blocks). The proposal should focus on the UI architecture, component tree, and navigation addition.
