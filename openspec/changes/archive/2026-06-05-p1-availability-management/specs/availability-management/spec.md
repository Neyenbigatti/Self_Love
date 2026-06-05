# Availability Management Specification

## Purpose

UI for professionals to manage availability — weekly recurring rules, date-specific exceptions, and breaks. Includes batch quick-set, overlap validation (frontend + backend), and appointment-aware warnings. Existing appointments are NEVER auto-modified by availability changes.

## Requirements

### Requirement: Page & Navigation

The system MUST expose `/dashboard/availability` with a nav item "Disponibilidad" (Clock icon) in sidebar primary navigation.

- **Navigate**: GIVEN authenticated professional, WHEN clicking "Disponibilidad", THEN route resolves to `/dashboard/availability`.
- **Unauthenticated**: GIVEN unauthenticated user, WHEN navigating to route, THEN system redirects to login.

### Requirement: List Rules

The system MUST display rules grouped as "Horario Semanal" (dayOfWeek-based) and "Excepciones" (date-specific). Each card SHOWS day/date, time range, label, type, and edit/delete actions.

- **Grouped**: GIVEN 3 weekly + 1 date rule, WHEN page loads, THEN weekly under "Horario Semanal", date rules under "Excepciones".
- **Empty**: GIVEN no rules, THEN system shows "Sin horarios configurados" with a create CTA.

### Requirement: Create Rule

A form MUST accept type, dayOfWeek or specificDate, startTime, endTime, optional label. Submits via POST /api/availability.

- **Happy path**: GIVEN form open, WHEN professional sets Lunes 09:00-17:00 and submits, THEN POST succeeds, rule appears in list.
- **End before start**: GIVEN startTime 14:00 and endTime 13:00, WHEN submitting, THEN form rejects with "La hora de fin debe ser posterior a la hora de inicio".

### Requirement: Quick-set Working Hours

The system MUST provide preset buttons (e.g., "Lun–Vie 09:00–18:00") that batch-create one `weekly_recurring` rule per selected day. MUST skip days that already have a rule without error.

- **Full week**: GIVEN no existing rules, WHEN professional clicks "Lun–Vie 09:00–18:00", THEN 5 rules created (Lun through Vie 09:00-18:00).
- **Partial overlap**: GIVEN Lun rule exists, WHEN applying same preset, THEN system creates Mar–Vie and shows summary "Lun ya tiene horario configurado".

### Requirement: Edit Rule

A pre-filled form MUST allow modifying rule fields. Save calls PATCH /api/availability/[id].

- **Edit time range**: GIVEN rule 09:00-17:00, WHEN changing endTime to 18:00 and saving, THEN PATCH succeeds, list updates.

### Requirement: Delete Rule

The system MUST confirm before deletion. If the rule affects dates with existing appointments, the system MUST show an informational dialog listing affected dates and appointment count. The system MUST NOT auto-cancel, modify, or affect existing appointments in any way — the dialog is purely informational and MUST NOT block the operation.

- **No appointments**: GIVEN rule with no associated appointments, WHEN confirming delete, THEN DELETE /api/availability/[id] succeeds.
- **With appointments**: GIVEN weekly rule affecting 3 future appointments, WHEN deleting, THEN dialog shows "Esta regla afecta a 3 turnos. Los turnos existentes no se modificarán, pero no se generarán nuevos turnos en estas fechas." AND "Eliminar de todas formas" proceeds WITHOUT modifying appointments.

### Requirement: Break Management

The system MUST support creating, editing, deleting break rules (type: `break`) using the same form and validation. Breaks MUST be visually distinct in the rule list.

- **Create break**: GIVEN creation form, WHEN selecting type "break", Lunes 12:00-13:00, THEN break rule created with distinct visual style.

### Requirement: Overlap — Frontend

The system MUST detect overlapping weekly rules on the same dayOfWeek BEFORE submitting. MUST show inline warning and block submission.

- **Overlap detected**: GIVEN Lunes 09:00-13:00 exists, WHEN creating Lunes 10:00-14:00, THEN warning "Se superpone con Lunes 09:00-13:00" and submission blocked.

### Requirement: Overlap — Backend

POST /api/availability and PATCH /api/availability/[id] MUST reject overlapping weekly rules with HTTP 409 Conflict. No new endpoints are introduced.

- **409 on create**: GIVEN Lunes 08:00-12:00 exists, WHEN POST creates Lunes 09:00-13:00, THEN server returns 409 "Se superpone con un horario existente".
- **409 on update**: GIVEN editing a rule to overlap another Lunes rule, WHEN PATCH submitted, THEN server returns 409.

### Requirement: Slot Generation Impact

Availability changes MUST reflect immediately in GET /api/availability/slots without cache invalidation or manual refresh.

- **New slots appear**: GIVEN new Lunes 09:00-18:00 rule, WHEN patient queries next Monday slots, THEN slots 09:00-18:00 returned.
- **Slots removed**: GIVEN rule deleted, WHEN patient queries affected date, THEN no slots for that day.
