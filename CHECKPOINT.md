# SelfLove — Checkpoint Final

**Fecha**: 2026-06-20
**Último commit**: `8aa905c` — Users - Password Recovery implement
**Working tree**: ✅ CON CAMBIOS (archive-report, verify-report, tasks marcados)
**tsc**: OK ✅
**Build**: OK ✅
**Migrations**: 2 (0000 + 0001_add_verification_tokens) ✅
**P3.1A — Patient Clinical Hub**: ✅ COMPLETO — mergeado a main
**PR #5 — Auth Hardening**: ✅ COMPLETO — mergeado a main
**PR #6 — Password Recovery**: ✅ COMPLETO — mergeado a main

---

## 1. Capacidades Completadas

| Capacidad | Módulo | SDD Change | Estado |
|-----------|--------|-----------|--------|
| Autenticación JWT (professional + patient) | Core | — | ✅ |
| Patient Portal (Inicio, Historial, Booking) | Portal Paciente | — | ✅ |
| Dashboard Profesional | Dashboard | — | ✅ |
| CRUD Availability (regular, break, blocked) | P1 — Availability | `p1-availability-management` | ✅ ARCHIVED |
| Availability API + slot generation | P1 — Availability | `p1-availability-management` | ✅ ARCHIVED |
| Appointment conflict detection | P1 — Availability | `p1-availability-management` | ✅ ARCHIVED |
| CRUD Treatment Types (create, edit, delete, toggle) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Treatment categories + grouping | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Treatment reordering (ChevronUp/Down) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Treatment activation/deactivation | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Duration-aware booking (30/60/90 min) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Rename guard (block rename with active appointments) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Delete guard (block delete with existing appointments) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Unique name per professional | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Patient filter server-side (patients see only active) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| treatmentTypeId migration (P2A) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Backward compatibility (treatmentType string) | P2 — Treatments | `p2-treatment-management` | ✅ ARCHIVED |
| Auto-refetch on focus/visibility (QA #3 fix) | Portal Paciente | `p2-treatment-management` | ✅ ARCHIVED |
| Z-index layers (backdrop 45, fab 46, sidebar 50, dialog 60) | Portal Paciente | `m-01a-mobile-foundation` | ✅ READY FOR ARCHIVE |
| FAB positioning (bottom-6 right-6, sin inline styles) | Portal Paciente | `m-01a-mobile-foundation` | ✅ READY FOR ARCHIVE |
| Bottom padding pb-20 para clearance del FAB | Portal Paciente | `m-01a-mobile-foundation` | ✅ READY FOR ARCHIVE |
| Fechas responsive en appointment cards | Portal Paciente | `m-01a-mobile-foundation` | ✅ READY FOR ARCHIVE |
| CTAs full-width en mobile (Step 2 + Step 3 booking) | Portal Paciente | `m-01a-mobile-foundation` | ✅ READY FOR ARCHIVE |
| Exploration Templates system (table + config JSON) | P3.1A — Templates | `p3-1-exploration-templates` | ✅ COMPLETE |
| Clinical Notes (schema + CRUD API) | P3.1A — Templates | `p3-1-exploration-templates` | ✅ COMPLETE |
| Explorations schema v2 + DynamicForm + FieldRenderer | P3.1A — Templates | `p3-1-exploration-templates` | ✅ COMPLETE |
| Template Field Editor (Configuración) | P3.1A — Templates | `p3-1-exploration-templates` | ✅ COMPLETE |
| **Patient Clinical Hub** — consolidación en Pacientes | P3.1A — Hub | `p3-1-exploration-templates` | ✅ COMPLETE |
| ExplorationsTab (read-only, dual format v2/legacy, fotos) | P3.1A — Hub | `p3-1-exploration-templates` | ✅ COMPLETE |
| ClinicalNotesTab (CRUD: crear, editar, eliminar) | P3.1A — Hub | `p3-1-exploration-templates` | ✅ COMPLETE |
| Transición de Historial Clínico (banner informativo) | P3.1A — Hub | `p3-1-exploration-templates` | ✅ COMPLETE |
| templateConfig en clinical-history API (batch lookup) | P3.1A — Hub | `p3-1-exploration-templates` | ✅ COMPLETE |
| Auth Hardening (email verification bloqueante, verification_tokens) | Core | `pr5-auth-hardening` | ✅ ARCHIVED |
| Password Recovery (forgot + reset, email, UI) | Core | `pr6-password-recovery` | ✅ ARCHIVED |

---

## 2. Bugs Conocidos (No Bloquean Producción)

| ID | Descripción | Severidad | Origen |
|----|------------|-----------|--------|
| ~~BUG-PORTAL-01~~ | ~~Turnos creados no reflejados en Inicio del Portal Paciente~~ | ~~Media~~ | ~~QA #1~~ |
| ~~BUG-P3-01~~ | ~~ZoneDetailForm no renderiza al seleccionar zona facial~~ | ~~Media~~ | ~~QA #16~~ |
| ~~BUG-P3-02~~ | ~~Response shape mismatch SLUG vs LIST route~~ | ~~Media~~ | ~~QA #16~~ |
| ~~BUG-P3-03~~ | ~~Double-stringify de config → Zod 400~~ | ~~Media~~ | ~~QA #16~~ |
| ~~BUG-P3-04~~ | ~~isActive y system se pierden al guardar (Zod strip)~~ | ~~Media~~ | ~~QA #16~~ |

   **→ FIXED ✅ — VERIFIED ✅**

---

## 3. Mejoras UX Pendientes (Backlog)

| ID | QA | Hallazgo | Prioridad |
|----|----|----------|-----------|
| UX-01 | #1 | Nombre del tratamiento no aparece en cards de Inicio del Portal Paciente | Baja |
| UX-02 | #1 | Precio del tratamiento no visible durante booking (card de selección) | Baja |
| UX-03 | #8 | Unicidad de nombre case-sensitive (Botox ≠ botox) — definir regla pre-producción | Media |
| ~~UX-04~~ | ~~#5b~~ | ~~Botón de confirmación delete dialog usa estilo incorrecto~~ | ~~Baja~~ |
| UX-05 | #5b | Error 409 cierra el diálogo de borrado antes de mostrar mensaje | Baja |
| UX-06 | #6 | Drag & Drop como mejora futura sobre ChevronUp/Down | Baja |
| UX-07 | #10 | Mensaje de error técnico "patientId must match your session" poco amigable | Media |
| UX-08 | — | Dashboard Profesional Modular — altura fija por widget, scroll interno, ocultar/reordenar módulos | Media-Alta |

---

## 4. Backlog Vigente

| ID | Descripción | Tipo | Estado |
|----|------------|------|--------|
| P3.1A | **Exploration Templates & Patient Clinical Hub** — sistema de plantillas, DynamicForm, Template Editor, y consolidación de datos clínicos en Pacientes | Feature | ✅ **COMPLETO** |
| M-01A | **Mobile Compatibility Foundation (Lite)** — z-index layers, responsive dates, CTAs full-width, FAB clearance | Mejora | ✅ **COMPLETO** |
| UX-01..08 | Mejoras UX (detalle en sección 3) | UX | Backlog |
| FUT-01 | **Multi-selección de tratamientos por paciente** — elegir 2-3 tratamientos consecutivos en un mismo turno | Feature | Idea |
| FUT-02 | **Dashboard modular** — paneles movibles/ocultables a gusto del profesional | UX | Idea |
| FUT-03 | **Dark Mode** — tema oscuro completo | UX | Idea |
| FUT-04 | **Notificaciones** — sistema de notificaciones para profesionales y pacientes | Feature | Idea |
| FUT-05 | **Restricción de registro** — solo pacientes pueden registrarse (única cosmetóloga) | Seguridad | Idea |

---

## 5. Decisión Arquitectónica — ARCH-01

**Resolución**: Opción A aprobada — Consolidar en Pacientes.

```
Paciente (Hub Clínico principal)
├── Resumen
├── Historial Médico
├── Tratamientos
├── Exploraciones (read-only)
└── Notas Clínicas (CRUD)
```

**Reglas firmes**:
- Fotografías pertenecen a exploraciones — NO existe tab independiente
- ExploracionesTab es SOLO CONSULTA — edición/creación en `/dashboard/exploration`
- Historial Clínico en transición: Fase 1 (banner) ✅ → Fase 2 (redirect) → Fase 3 (cleanup)

---

## 6. P3.1A — División en PRs

| PR | Nombre | Estado |
|----|--------|--------|
| **PR #1** | Foundation: schema + seed + APIs (exploration_templates, clinical_notes, explorations v2) | ✅ **COMPLETE** — mergeado a main |
| **PR #2** | Dynamic Form Renderer + Exploration API v2 | ✅ **COMPLETE** — mergeado a main |
| **PR #3** | Admin UI: Template Field Editor (Configuración) | ✅ **COMPLETE** — mergeado a main |
| **PR #4** | Patient Clinical Hub — consolidación en Pacientes | ✅ **COMPLETE** — mergeado a main |
| **PR #5** | Auth Hardening — email verification bloqueante, verification_tokens, resend | ✅ **COMPLETE** — mergeado a main |
| **PR #6** | Password Recovery — forgot/reset endpoints, email, UI, auth-card modos | ✅ **COMPLETE** — mergeado a main |

   **→ UX-04 FIXED ✅** — `--destructive-foreground` corregido (era idéntico a `--destructive`)

---

### PR #4 — Patient Clinical Hub (NUEVO)

**Scope**:
- `ExplorationsTab`: lista accordion read-only con dual format (v2 con templateConfig, legacy con skin/facial)
- `ClinicalNotesTab`: CRUD completo (inline create, dialog edit, alert delete)
- `PatientDetail`: 5 tabs (Resumen, Historial Médico, Tratamientos, Exploraciones, Notas Clínicas)
- Banner de transición en `/dashboard/clinical-history`
- `templateConfig` en clinical-history API con batch lookup

**Archivos**:
| Archivo | Acción |
|---------|--------|
| `components/patients/explorations-tab.tsx` | Creado |
| `components/patients/clinical-notes-tab.tsx` | Creado |
| `components/patients/patient-detail.tsx` | Modificado (+2 tabs) |
| `app/dashboard/clinical-history/page.tsx` | Modificado (+banner) |
| `app/api/patients/[id]/clinical-history/route.ts` | Modificado (+templateConfig) |
| `lib/api/helpers.ts` | Modificado (+getTemplateConfigById, getTemplateConfigMap) |
| `lib/types.ts` | Modificado (+TemplateConfig types exportados) |

**Verificación**: `npx tsc --noEmit` ✅ | `npm run build` ✅

---

## 7. Arquitectura Actual

```
selflove/
├── app/
│   ├── api/
│   │   ├── auth/ -> login, logout, register, me, verify-email, resend-verification, forgot-password, reset-password
│   │   ├── appointments/ -> CRUD appointments
│   │   ├── availability/ -> CRUD availability + slots generation
│   │   ├── exploration-templates/ -> GET list, GET by slug, PUT update
│   │   ├── explorations/ -> CRUD explorations (v2: template_id + responses)
│   │   ├── patients/ -> Patient CRUD + clinical-history + medical-history + clinical-notes
│   │   └── treatment-types/ -> CRUD treatment types (P2)
│   ├── dashboard/        -> Professional dashboard
│   │   ├── availability/ -> Availability management (P1)
│   │   ├── calendar/     -> Appointment calendar
│   │   ├── clinical-history/ -> Historial Clínico (Fase 1: banner)
│   │   ├── exploration/  -> Exploración Física
│   │   ├── patients/     -> HUB CLÍNICO PRINCIPAL ⭐
│   │   ├── settings/     -> Template Editor (P3)
│   │   └── treatments/   -> Treatment management (P2)
│   └── patient/          -> Patient portal
│       ├── book/         -> Booking flow (3-step)
│       └── history/      -> Appointment history
│
├── components/
│   ├── exploration/     -> DynamicForm, FieldRenderer, FacialDiagram, PhotoCapture, etc.
│   ├── dashboard/       -> Sidebar, Header, widgets
│   ├── patient-portal/  -> PatientSidebar, BookingCalendar, etc.
│   ├── patients/        -> Patient list, detail, explorations-tab, clinical-notes-tab
│   └── ui/              -> shadcn/ui primitives
│
├── lib/
│   ├── db/              -> Drizzle schema + migrations (2)
│   ├── auth/            -> JWT auth
│   ├── api/             -> Validators, errors, auth-guard, helpers (incl. template lookup)
│   └── availability/    -> Overlap detection logic
│
└── openspec/
    ├── config.yaml       -> SDD project config
    ├── specs/            -> Source of truth (6 main specs)
    └── changes/
        ├── p3-1-exploration-templates/ -> COMPLETO (proposal, discovery, design, tasks)
        └── archive/      -> P1, P2 archived
```

---

## 8. Estado del Repositorio

| Indicador | Valor |
|-----------|-------|
| Último commit | `8aa905c` — Users - Password Recovery implement |
| Working tree | ✅ CON CAMBIOS (archive-report, verify-report, tasks finalizados) |
| Ahead of origin | `origin/main` en sincronía |
| tsc | ✅ Sin errores |
| Build | ✅ Pass (Next.js 16.2.6, Turbopack) |
| Migraciones | 2 aplicadas (0000 + 0001_add_verification_tokens) |
| Openspec | config.yaml + spec + changes: `pr5-auth-hardening` ✅ ARCHIVED, `pr6-password-recovery` ✅ ARCHIVED |

---

## 9. Próxima Recomendación

P3.1A — **COMPLETO** ✅
PR #5 — Auth Hardening **COMPLETO** ✅
PR #6 — Password Recovery **COMPLETO** ✅

Próximos pasos sugeridos:
1. UX-07: Mensaje de error "patientId must match your session" poco amigable
2. UX-08: Dashboard Profesional Modular (altura fija, scroll interno, ocultar módulos)
3. UX-05: Error 409 cierra diálogo de borrado antes de mostrar mensaje
4. UX-01/02: Nombre/precio del tratamiento en booking
5. FUT-01: Multi-selección de tratamientos por paciente
6. FUT-02: Dashboard profesional modular
7. FUT-03: Dark Mode

---

## CHECKPOINT SAVED ✅

**P3.1A Resumen de sesión**:
- PR #1 Foundation: ✅ COMPLETE (mergeado)
- PR #2 Dynamic Form: ✅ COMPLETE
- PR #3 Template Editor: ✅ COMPLETE — todos los smokes PASS
- **PR #4 Patient Clinical Hub: ✅ COMPLETE** — ARCH-01 aprobado, consolidación en Pacientes

**PR #5 — Auth Hardening**:
- Email verification bloqueante (register sin JWT, login bloqueado hasta verificar)
- verification_tokens table (SHA-256 hashed, email_verification + password_reset types)
- Resend verification (60s cooldown, invalidación de tokens previos, anti-enumeration)
- UI: verificación requerida en register + login 403
- Seed idempotente (professional pre-verificado)

**PR #6 — Password Recovery**:
- Forgot-password + reset-password endpoints con anti-enumeration
- Reutilización de verification_tokens (type=password_reset, 1h expiry)
- Email template + sender via Resend
- UI: forgot/reset forms + auth-card modos + login-form wiring
- UX polish: success screen con email, spam hint, "Enviar otro enlace"

**Guardado en engram**: ARCH-01 discovery, PR #4/5/6 design+tasks, implementación completa.
