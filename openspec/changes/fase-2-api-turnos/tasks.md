# Tasks: Fase 2 — API de Turnos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550–650 |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 (infra) → PR 2 (appointments+availability) → PR 3 (treatments+patients+calendar) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Infra layer: errors, auth-guard, validators, db export | PR 1 | Base for all routes; standalone |
| 2 | Appointments + Availability + Slots API | PR 2 | Core business logic; depends on PR 1 |
| 3 | Treatment Types + Patients API + CalendarPage swap | PR 3 | Depends on PR 1; lighter scope |

## Phase 1: Infrastructure (PR 1)

| # | Objetivo | Archivos | Dep | Riesgo | Criterio | Estado |
|---|----------|----------|-----|--------|----------|--------|
| 1.1 | Crear helpers HTTP (badRequest, unauthorized, forbidden, notFound, conflict, serverError) | `lib/api/errors.ts` | — | Bajo | `npx tsc --noEmit` pasa | ✅ |
| 1.2 | Crear guard requireRole(session, ...roles) | `lib/api/auth-guard.ts` | — | Bajo | 401/403 según rol | ✅ |
| 1.3 | Crear schemas compartidos (dateString, timeString, uuidSchema) + validate() wrapper | `lib/api/validators/common.ts` | — | Bajo | `npx tsc --noEmit` pasa | ✅ |
| 1.4 | Crear schemas de validación de appointments | `lib/api/validators/appointments.ts` | 1.3 | Bajo | acepta/rechaza bodies válidos | ✅ |
| 1.5 | Crear schemas de validación de availability | `lib/api/validators/availability.ts` | 1.3 | Bajo | acepta/rechaza bodies válidos | ✅ |
| 1.6 | Crear schemas de validación de treatments | `lib/api/validators/treatments.ts` | 1.3 | Bajo | acepta/rechaza bodies válidos | ✅ |
| 1.7 | Crear schemas de validación de patients search | `lib/api/validators/patients.ts` | 1.3 | Bajo | acepta/rechaza querys | ✅ |
| 1.8 | Exportar `treatmentTypes` desde db/index.ts | `lib/db/index.ts` | — | Bajo | import funciona en routes | ✅ (ya exportado via `export * from './schema'`) |

## Phase 2: Appointments API (PR 2)

| # | Objetivo | Archivos | Dep | Riesgo | Criterio |
|---|----------|----------|-----|--------|----------|
| 2.1 | GET list (role-scoped, date filter, joins) + POST create (overlap check, status por rol) | `app/api/appointments/route.ts` | 1.1–1.4, 1.8 | Alto | GET filtra por sesión; POST rechaza overlap 409 | ✅ |
| 2.2 | GET by id (ownership) + PATCH (status transitions, re-check overlap) + DELETE (professional only) | `app/api/appointments/[id]/route.ts` | 1.1–1.4, 2.1 | Alto | PATCH respeta transiciones; 403 si no dueño | ✅ |

## Phase 3: Availability & Slots (PR 2)

| # | Objetivo | Archivos | Dep | Riesgo | Criterio |
|---|----------|----------|-----|--------|----------|
| 3.1 | GET list (scoped a professional) + POST create (dayOfWeek XOR specificDate) | `app/api/availability/route.ts` | 1.1–1.3, 1.5 | Medio | POST 400 si faltan dayOfWeek y specificDate | ✅ |
| 3.2 | PATCH + DELETE con ownership check | `app/api/availability/[id]/route.ts` | 3.1 | Medio | DELETE 404 si no existe | ✅ |
| 3.3 | GET slots: generar slots 30min, restar breaks, blocks, appointments existentes | `app/api/availability/slots/route.ts` | 1.1–1.3, 3.1 | Alto | Slots coinciden con spec: fecha sin reglas → [] | ✅ |

## Phase 4: Treatments & Patients (PR 3)

| # | Objetivo | Archivos | Dep | Riesgo | Criterio |
|---|----------|----------|-----|--------|----------|
| 4.1 | GET list (ambos roles) + POST create (professional only) | `app/api/treatment-types/route.ts` | 1.1–1.3, 1.6, 1.8 | Medio | Patient POST → 403 | ✅ |
| 4.2 | PATCH + DELETE con check de appointments activos (409 si en uso) | `app/api/treatment-types/[id]/route.ts` | 4.1 | Medio | DELETE con turnos activos → 409 | ✅ |
| 4.3 | GET search (LIKE %term% en name, email, phone, professional only) | `app/api/patients/route.ts` | 1.1–1.3, 1.7 | Medio | Search sin query → 400; sin passwordHash | ✅ |

## Phase 5: Frontend Integration (PR 3)

| # | Objetivo | Archivos | Dep | Riesgo | Criterio |
|---|----------|----------|-----|--------|----------|
| 5.1 | Reemplazar mockAppointments con fetch + parseISO/format transform + try/catch con fallback | `app/dashboard/calendar/page.tsx` | 2.1 | Alto | Calendar carga turnos reales; fallback a [] si error | ✅ |
| 5.2 | Reemplazar mockPatients/treatmentTypes en AppointmentDialog con fetch API | `components/calendar/appointment-dialog.tsx` | 4.1, 4.3 | Medio | Dialog obtiene datos reales; sin hardcode professionalId | ✅ |
