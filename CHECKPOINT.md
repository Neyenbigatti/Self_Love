# SelfLove — Checkpoint Final

**Fecha**: 2026-06-11
**Último commit**: `bbb0f58` — P3.1 PR #1 Foundation: exploration_templates, clinical_notes, explorations v2
**Working tree**: CLEAN ✅ (cambios implementados, no mergeados)
**tsc**: OK ✅
**Build**: OK ✅
**Migrations**: 2 (0000 + 0001_exploration_templates) ✅

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
| Exploration Templates system (table + config JSON) | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #1 COMPLETE |
| Clinical Notes (schema + CRUD API) | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #1 COMPLETE |
| Explorations schema v2 (template_id + responses + legacy compat) | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #1 COMPLETE |
| Lazy auto-seed: plantilla "Exploración Física Facial" | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #1 COMPLETE |
| DynamicForm + FieldRenderer (7 field types: text, textarea, boolean, number, date, select, multiselect) | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #2 COMPLETE |
| DynamicForm desde template.config con secciones como Cards + sortOrder | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #2 COMPLETE |
| Widgets condicionales: FacialDiagram + PhotoCapture toggle por config | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #2 COMPLETE |
| Fallback legacy: exploraciones sin templateId usan tabs originales | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #2 COMPLETE |
| Merge save: responses mergeados con datos existentes preservan campos huérfanos | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #2 COMPLETE |
| Template por defecto para exploraciones nuevas (slug "facial-exploration") | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #2 COMPLETE |
| Settings route /dashboard/settings con editor visual de plantilla | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| TemplateEditor: edición visual de config JSON (secciones + campos + widgets) | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| FieldFormDialog: modal add/edit campo con auto key gen, type warning, system protections | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| CRUD de secciones (add, edit, delete, reorder con ChevronUp/Down) | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| CRUD de campos (add, edit, delete, reorder dentro de sección) | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| Widgets toggle (facialDiagram, photoCapture) desde editor | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| isActive field property: oculta campos en DynamicForm sin perder datos históricos | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| system field property: badge "Sistema" metadata-only, no bloquea edición/delete | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| isActive !== false filter en DynamicForm + seed con isActive:true, system:true | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 COMPLETE |
| Bug fixes: response shape, double-stringify, Zod schema, ZoneDetailForm fallback | P3.1 — Templates | `p3-1-exploration-templates` | ✅ PR #3 RESUELTOS |

---

## 2. Bugs Conocidos (No Bloquean Producción)

| ID | Descripción | Severidad | Origen |
|----|------------|-----------|--------|
| ~~BUG-PORTAL-01~~ | ~~Turnos creados no reflejados en Inicio del Portal Paciente~~ | ~~Media~~ | ~~QA #1~~ |
| ~~BUG-P3-01~~ | ~~ZoneDetailForm no renderiza al seleccionar zona facial~~ | ~~Media~~ | ~~QA #16~~ |
| ~~BUG-P3-02~~ | ~~Response shape mismatch SLUG vs LIST route~~ | ~~Media~~ | ~~QA #16~~ |
| ~~BUG-P3-03~~ | ~~Double-stringify de config → Zod 400~~ | ~~Media~~ | ~~QA #16~~ |
| ~~BUG-P3-04~~ | ~~isActive y system se pierden al guardar (Zod strip)~~ | ~~Media~~ | ~~QA #16~~ |

   **→ FIXED ✅ — VERIFIED ✅** Causa raíz: comparación `apt.date >= now` vs `apt.date >= today(00:00)`. Fix en `app/patient/page.tsx` y `app/patient/history/page.tsx`.

   **→ BUG-P3-01 FIXED ✅** Causa raíz: `facialAnalysis[selectedZone] ?? null` sin fallback `defaultAreaAnalysis`. Fix en `dynamic-form.tsx`.

   **→ BUG-P3-02 FIXED ✅** Causa raíz: SLUG route devuelve `{ template }`, LIST route devuelve `{ templates }` flat. Fix: `data.template ?? data`.

   **→ BUG-P3-03 FIXED ✅** Causa raíz: frontend hace `JSON.stringify(config)` + backend serializa internamente → doble stringify. Fix: enviar `config` como objeto.

   **→ BUG-P3-04 FIXED ✅** Causa raíz: `templateConfigFieldSchema` sin `isActive`/`system` → `safeParse` los strippeaba. Fix: agregar ambos como `z.boolean().optional()`.

---

## 3. Mejoras UX Pendientes (Backlog)

| ID | QA | Hallazgo | Prioridad |
|----|----|----------|-----------|
| UX-01 | #1 | Nombre del tratamiento no aparece en cards de Inicio del Portal Paciente | Baja |
| UX-02 | #1 | Precio del tratamiento no visible durante booking (card de selección) | Baja |
| UX-03 | #8 | Unicidad de nombre case-sensitive (Botox ≠ botox) — definir regla pre-producción | Media |
| UX-04 | #5b | Botón de confirmación delete dialog usa estilo incorrecto tras error 409 | Baja |
| UX-05 | #5b | Error 409 cierra el diálogo de borrado antes de mostrar mensaje | Baja |
| UX-06 | #6 | Drag & Drop como mejora futura sobre ChevronUp/Down | Baja |
| UX-07 | #10 | Mensaje de error técnico "patientId must match your session" poco amigable | Media |
| UX-08 | — | Dashboard Profesional Modular — altura fija por widget, scroll interno, ocultar/reordenar módulos | Media-Alta |

   **UX-08 — Detalle:** Problemas: Pendientes de confirmación y agenda semanal crecen sin límite → el dashboard aumenta el scroll vertical de toda la página. No existe personalización ni el diseño escala con más pacientes/turnos.  
   **Objetivos:** Altura máxima con scroll interno por widget, reducir scroll global, permitir ocultar/mostrar y reordenar módulos.  
   **Estructura propuesta:** Resumen · Próximos Turnos · Pendientes (scroll) · Agenda Semanal (scroll) · Estadísticas · Widgets configurables.  
   **No implementar ahora — registrar solo como backlog UX.**

---

## 4. Backlog Vigente

| ID | Descripción | Tipo | Estado |
|----|------------|------|--------|
| P3.1 | **Exploration Templates & Clinical History Integration** — sistema de plantillas configurables para exploración física, Dynamic Form Renderer, admin de campos desde Configuración, Clinical Notes, Historial Clínico como hub | Feature | En Progreso — PR #1 ✅ / PR #2 ✅ / PR #3 ✅ / PR #4 ⏳ |
| M-01A | **Mobile Compatibility Foundation (Lite)** — z-index layers, responsive dates, CTAs full-width, FAB clearance | Mejora | ✅ Ready for Archive |
| UX-01..08 | Mejoras UX (detalle en sección 3) | UX | Backlog |
| ~~BUG-PORTAL-01~~ | ~~Inicio del paciente no refleja turnos correctamente~~ | ~~Bug~~ | ~~FIXED ✅~~ |

---

### P3.1 — Estado Actual (Actualizado 2026-06-11)

**Dirección arquitectónica**: Historial Clínico como hub central. Exploración Física como tipo de registro clínico. Sistema de plantillas configurables editables por la profesional.

**Visión objetivo**:
```
Paciente
└── Historial Clínico
    ├── Exploraciones (template-driven)
    ├── Fotografías
    ├── Análisis Facial
    ├── Tratamientos realizados
    ├── Notas Clínicas
    └── Evolución clínica
```

**División en PRs**:

| PR | Nombre | Estado |
|----|--------|--------|
| **PR #1** | Foundation: schema + seed + APIs (exploration_templates, clinical_notes, explorations v2) | ✅ **COMPLETE** — mergeado a main |
| **PR #2** | Dynamic Form Renderer + Exploration API v2 | ✅ **COMPLETE** — sin mergear |
| **PR #3** | Admin UI: Template Field Editor (Configuración) | ✅ **COMPLETE** — sin mergear |
| **PR #4** | Clinical Notes UI + API Evolution | ⏳ **PENDIENTE** — esperar instrucciones |

**PR #1 — Foundation** (7 commits, 15 archivos):
- `exploration_templates` table con config JSON (sections + fields + widgets)
- `clinical_notes` table (id, patientId, professionalId, date, content)
- Explorations v2: columnas `template_id` (FK) + `responses` (JSON)
- Compatibilidad legacy: `skin_evaluation`/`facial_analysis` se mantienen
- Lazy auto-seed: `ensureDefaultExplorationTemplate()` inserta plantilla facial al primer GET
- APIs: templates CRUD, clinical notes CRUD, explorations v2
- Seed: plantilla "Exploración Física Facial" con 9 secciones y 28+ campos
- `is_system=true`: protege contra DELETE y cambios de slug, NO bloquea edición de config

**Principios de diseño**:
- `responses` son snapshot por exploración — modificar template no afecta datos históricos
- System templates: config-editables, delete-protected
- Seed lazy en GET, no en migración ni paso manual
- Tipos de campo: text, textarea, boolean, number, date, select, multiselect

**PR #2 — Dynamic Form Renderer** (implementado, sin mergear):
- `FieldRenderer` — 7 tipos de campo (text, textarea, boolean, number, date, select, multiselect)
- `DynamicForm` — renderiza secciones como Cards con sortOrder, widgets condicionales (FacialDiagram, PhotoCapture)
- Exploration page detecta v2 vs legacy: DynamicForm para exploraciones nuevas/con template, tabs legacy para históricas
- Merge save: `{ ...existingResponses, ...currentResponses }` preserva campos huérfanos
- Template por defecto desde slug "facial-exploration" con fallback a `templates[0]`
- Legacy compatible: datos seed históricos siguen funcionando sin cambios

**PR #3 — Template Editor** (implementado, sin mergear):
- Settings route en `/dashboard/settings`
- `TemplateEditor`: editor visual completo de config JSON con secciones, campos, widgets
- `FieldFormDialog`: modal para add/edit campo con auto-generación de key, type warning, metadata system
- CRUD de secciones (add, edit, delete, reorder con ChevronUp/Down)
- CRUD de campos dentro de cada sección (add, edit, delete, reorder)
- Widgets toggle: facialDiagram, photoCapture desde el editor
- `isActive` field property: oculta campos en DynamicForm sin perder datos históricos
- `system` field property: badge "Sistema" metadata-only, no bloquea edición/delete
- PUT handler acepta config completo como objeto (no string)
- Persistencia validada: seed con isActive:true, system:true en 28+ campos

**Bugs encontrados y resueltos durante PR #3:**

| Bug | Síntoma | Causa Raíz | Fix |
|-----|---------|-----------|-----|
| **BUG-P3-01** | ZoneDetailForm no renderiza al seleccionar zona | `facialAnalysis[selectedZone] ?? null` sin fallback `defaultAreaAnalysis` | Restaurado `?? defaultAreaAnalysis` |
| **BUG-P3-02** | Response shape mismatch | SLUG route devuelve `{ template }`, LIST route devuelve `{ templates }` flat | `data.template ?? data` |
| **BUG-P3-03** | Zod 400 al guardar config | Frontend hace `JSON.stringify(config)` + backend serializa → double stringify | Enviar config como objeto |
| **BUG-P3-04** | isActive/system se pierden al guardar | Zod schema sin `isActive`/`system` → safeParse los strippeaba | Agregar `z.boolean().optional()` en schema |

Todos los smokes PASS (16.3–16.9). Todos los bugs resueltos y verificados.

---

## 5. Arquitectura Actual

```
selflove/
├── app/
│   ├── api/
│   │   ├── auth/ -> login, logout, register, me
│   │   ├── appointments/ -> CRUD appointments
│   │   ├── availability/ -> CRUD availability + slots generation
│   │   ├── exploration-templates/ -> (NUEVO) GET list, GET by slug, PUT update
│   │   ├── explorations/ -> CRUD explorations (v2: template_id + responses)
│   │   ├── patients/ -> Patient CRUD + clinical-history + medical-history + clinical-notes (NUEVO)
│   │   └── treatment-types/ -> CRUD treatment types (P2)
│   ├── dashboard/        -> Professional dashboard
│   │   ├── availability/ -> Availability management (P1)
│   │   ├── calendar/     -> Appointment calendar
│   │   ├── clinical-history/ -> Historial Clínico
│   │   ├── exploration/  -> Exploración Física
│   │   ├── patients/     -> Patient management
│   │   ├── settings/     -> Template Editor (P3) ⭐
│   │   └── treatments/   -> Treatment management (P2)
│   └── patient/          -> Patient portal
│       ├── book/         -> Booking flow (3-step)
│       └── history/      -> Appointment history
│
├── components/
│   ├── exploration/     -> DynamicForm, FieldRenderer, FacialDiagram, PhotoCapture, SkinEvaluation (legacy), TemplateEditor, FieldFormDialog
│   ├── dashboard/       -> Sidebar, Header, widgets
│   ├── patient-portal/  -> PatientSidebar, BookingCalendar, etc.
│   ├── patients/        -> Patient list, detail, medical/treatment tabs
│   └── ui/              -> shadcn/ui primitives
│
├── lib/
│   ├── db/              -> Drizzle schema (explorations v2 + 2 new tables) + migrations (2)
│   ├── auth/            -> JWT auth
│   ├── api/             -> Validators (incl. nuevos), errors, auth-guard, helpers
│   └── availability/    -> Overlap detection logic
│
└── openspec/
    ├── config.yaml       -> SDD project config
    ├── specs/            -> Source of truth (6 main specs)
    ├── changes/
    │   ├── p3-1-exploration-templates/ -> Active change (proposal, 3 specs, design, tasks)
    │   └── archive/      -> P1, P2 archived
```

**Nuevas tablas**:
- `exploration_templates` — id, professionalId, name, slug, description, config (JSON), isActive, isSystem, createdAt, updatedAt
- `clinical_notes` — id, patientId, professionalId, date, content, createdAt, updatedAt

**Tablas modificadas**:
- `explorations` — +template_id (FK), +responses (JSON). skin_evaluation/facial_analysis legacy se mantienen.

---

## 6. Estado del Repositorio

| Indicador | Valor |
|-----------|-------|
| Último commit | `bbb0f58` — P3.1 PR #1 Foundation |
| Working tree | ✅ CLEAN (PR #2 + PR #3 implementados, cambios sin commitear) |
| Ahead of origin | `origin/main` en sincronía |
| tsc | ✅ Sin errores |
| Build | ✅ Pass (Next.js 16.2.6, Turbopack) |
| Migraciones | 2 aplicadas (0000 + 0001_exploration_templates) |
| Openspec | config.yaml + 6 specs + active change `p3-1-exploration-templates` + 2 archived |

**Consistente para continuar PR #4.** ✅

---

## 7. Próxima Recomendación

**P3.1 — PR #4: Clinical Notes UI + API Evolution** ⏳ PENDIENTE

No iniciar automáticamente. Esperar instrucciones explícitas antes de comenzar Discovery de Clinical Notes.

*Prerrequisitos*: PR #1 ✅, PR #2 ✅, PR #3 ✅

---

## CHECKPOINT SAVED ✅

**P3.1 Resumen de sesión**:
- PR #1 Foundation: ✅ COMPLETE (mergeado)
- PR #2 Dynamic Form: ✅ COMPLETE
- PR #3 Template Editor: ✅ COMPLETE — todos los smokes PASS
- PR #4 Clinical Notes: ⏳ PENDIENTE — esperar instrucciones

**4 bugs resueltos durante PR #3**: response shape, double-stringify, Zod schema, ZoneDetailForm fallback.

**Guardado en engram**: BUG-P3-01 (ZoneDetailForm fallback) y PR #3 completo.

## SESSION CLOSED ✅
