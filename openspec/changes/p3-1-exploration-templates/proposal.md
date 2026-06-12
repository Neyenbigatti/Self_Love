# P3.1 — PR #4: Patient Clinical Hub

## Change Intent

Consolidar toda la información clínica del paciente dentro del módulo Pacientes, eliminando la duplicación funcional con Historial Clínico. Agregar los tabs de Exploraciones Físicas y Notas Clínicas a PatientDetail para convertir Pacientes en el hub clínico único del sistema.

## Contexto Arquitectónico

Decisión ARCH-01 aprobada: **Opción A — Consolidar en Pacientes**.

Historial Clínico actualmente duplica información (misma API, mismos componentes) sin aportar una vista diferencial ni acciones de escritura. Pacientes ya es el centro operativo real de la cosmetóloga.

## Scope

### In Scope (PR #4)

1. **Tab "Exploraciones" en PatientDetail**
   - Lista cronológica de exploraciones físicas del paciente
   - Cada exploración expandible con detalle completo (campos v2 o legacy + fotos + notas)
   - Manejo dual: exploraciones v2 (template + responses) y legacy (skinEvaluation + facialAnalysis)
   - Botón "Nueva Exploración" dentro del tab (consistente con el que ya existe en el header)

2. **Tab "Notas Clínicas" en PatientDetail**
   - Lista cronológica de notas (fecha DESC)
   - Inline editor o modal para crear/editar notas
   - Consume API existente: `/api/patients/[id]/clinical-notes`

3. **Transición de Historial Clínico**
   - Banner informativo en `/dashboard/clinical-history`: "Los datos clínicos ahora están en Pacientes"
   - Sin cambios en sidebar aún
   - Sin eliminación de código

4. **Ajuste menor en sidebar**
   - "Historial Clínico" permanece visible pero apunta a Pacientes, O se elimina
   - Decisión durante diseño

### Out of Scope (NO en PR #4)

- ❌ Timeline cronológico unificado (futuro)
- ❌ Galería de fotos independiente
- ❌ Eliminación definitiva de código de Historial Clínico (fase post-PR #4)
- ❌ Refactor mayor de PatientDetail o del sistema de tabs
- ❌ Drag & drop en tabs
- ❌ Nueva API o schema changes
- ❌ Feature de "Evolución fotográfica" (before/after)

## New Capabilities

1. **Exploraciones en Pacientes** — la profesional puede ver el historial completo de exploraciones sin salir del detalle del paciente
2. **Notas Clínicas en Pacientes** — crear y consultar notas clínicas en el mismo lugar donde ya trabaja
3. **Hub clínico unificado** — toda la información del paciente en un solo módulo

## Modified Capabilities

1. **PatientDetail** — agrega 2 tabs nuevos (Exploraciones, Notas Clínicas), mantiene los 3 existentes (Resumen, Historial Médico, Tratamientos)
2. **Clinical History page** — banner de transición informativo
3. **Sidebar** — ajuste de navegación (detalle durante diseño)

## Affected Areas

| Área | Acción | Archivos estimados |
|------|--------|-------------------|
| `components/patients/patient-detail.tsx` | Modificar: agregar 2 tabs nuevos | 1 |
| `components/patients/explorations-tab.tsx` | **Crear**: lista de exploraciones + detalle expandible | 1 |
| `components/patients/clinical-notes-tab.tsx` | **Crear**: lista de notas + inline editor | 1 |
| `app/dashboard/clinical-history/page.tsx` | Modificar: agregar banner de transición | 1 |
| `components/dashboard/sidebar.tsx` | Modificar: ajustar nav items | 1 |

**Total estimado: ~5–7 archivos, ~400 líneas nuevas/modificadas**

## Dependencies

- PR #1 Foundation ✅ (exploration_templates, clinical_notes, explorations v2)
- PR #2 Dynamic Form ✅ (FieldRenderer, DynamicForm, v2/legacy detection)
- PR #3 Template Editor ✅ (settings page, template editing)
- ARCH-01 análisis ✅ (decisión de consolidación aprobada)

**APIs existentes que PR #4 consume (sin cambios)**:
- `GET /api/patients/[id]/clinical-history` — explorations + treatments + medicalHistory
- `GET/POST /api/patients/[id]/clinical-notes` — listar y crear notas
- `PATCH/DELETE /api/patients/[id]/clinical-notes/[noteId]` — editar/eliminar notas
- `GET /api/explorations/[id]` — detalle de exploración individual (si es necesario)

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| PatientDetail con 5 tabs puede senterse abrumador | Los tabs ya existen en el diseño actual. Scroll interno por tab. |
| Exploraciones legacy (sin template) no se visualizan bien | El componente debe manejar ambos formatos, igual que exploration page |
| Scope creep hacia timeline/galería | **Mantener scope estricto.** Timeline y galería son features separados, no parte de PR #4 |

## Rollback Plan

- **Cada componente**: `git checkout -- <file>` antes de commit
- **PR completo**: `git revert <merge-sha>` revierte toda la PR
- **Sin cambios de schema ni migraciones** → rollback no afecta datos
- **Banner en Clinical History**: se elimina con el revert sin impacto
