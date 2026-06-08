# P2 — Treatment Management: QA Final Report

## Summary

| QA | Escenario | Estado | Hallazgos |
|----|-----------|--------|-----------|
| #1 | Crear tratamiento | ✅ PASS | UX-01: nombre tratamiento ausente en cards de Inicio |
| #2 | Editar tratamiento | ✅ PASS | — |
| #3 | Activar/desactivar | ✅ PASS | Fix: visibilitychange + focus listeners en booking page |
| #4 | Categorías | ✅ PASS | — |
| #5a | Borrar sin turnos | ✅ PASS | — |
| #5b | Borrar con turnos activos | ✅ PASS | UX-04, UX-05: delete dialog feedback |
| #6 | Reordenar (ChevronUp/Down) | ✅ PASS | **Bug corregido**: sortOrder null + isFirst/isLast per-group |
| #7 | Post-fix validation | ✅ PASS | — |
| #8 | Nombre duplicado (409) | ✅ PASS | UX-03: case-sensitive name uniqueness |
| #9 | Booking 30 min | ✅ PASS | **Bug corregido**: Step 3 vacío por fetchTreatments reset |
| #10 | Booking 60 min | ✅ PASS | UX-07: error message técnico en auth |
| #11 | Booking 90 min | ✅ PASS | — |
| #12 | Tratamientos inactivos ocultos | ✅ PASS | — |
| #13 | Backward compat (treatmentType string) | ✅ PASS | — |

**Overall: 13/13 PASS**

---

## Bugs Encontrados Durante QA

| ID | QA | Bug | Severidad | Estado |
|----|----|-----|-----------|--------|
| BUG-01 | #3 | Switch activar/desactivar no refesheaba Portal Paciente automáticamente | Media | **Corregido** — visibilitychange + focus listeners |
| BUG-02 | #6 | Reordenamiento no funcionaba (sortOrder null + swap no-op) | Alta | **Corregido** — POST auto-asigna sortOrder + renumber guard |
| BUG-03 | #6 | isFirst/isLast por grupo bloqueaba movimientos entre categorías | Alta | **Corregido** — global sort boundaries |
| BUG-04 | #9 | Step 3 confirmación vacío por fetchTreatments reseteando selectedTreatment | Alta | **Corregido** — removido setSelectedTreatment(null) + guard en botón |
| BUG-PORTAL-01 | #1/#9 | Turnos creados no se reflejan en Inicio del Portal Paciente | Media | **Pendiente** — backlog |

---

## Bugs Corregidos Durante QA

| ID | Fix | Archivo |
|----|-----|---------|
| BUG-01 | Agregados `visibilitychange` + `focus` listeners en booking page para refetch automático | `app/patient/book/page.tsx` |
| BUG-02 | POST /api/treatment-types asigna `sortOrder = maxExisting + 1` automáticamente; `renumberSortOrders()` helper para duplicados | `app/api/treatment-types/route.ts`, `app/dashboard/treatments/page.tsx` |
| BUG-03 | `isFirst`/`isLast` computados globalmente, no por categoría; `useMemo` movido antes de early returns (Rules of Hooks) | `app/dashboard/treatments/page.tsx`, `app/dashboard/treatments/components/treatment-group.tsx` |
| BUG-04 | Eliminado `setSelectedTreatment(null)` de `fetchTreatments()`; agregado `!selectedTreatment` al `disabled` del botón Continuar | `app/patient/book/page.tsx` |

---

## UX Observations (Backlog)

| ID | QA | Hallazgo | Prioridad |
|----|----|----------|-----------|
| UX-01 | #1 | Nombre del tratamiento no aparece en cards de Inicio del Portal Paciente (sí en Historial) | Baja |
| UX-02 | #1 | Precio del tratamiento no visible durante booking (falta en card de selección de tratamiento) | Baja |
| UX-03 | #8 | Unicidad de nombre es case-sensitive (Botox ≠ botox) — definir regla de negocio pre-producción | Media |
| UX-04 | #5b | Botón de confirmación en delete dialog usa estilo incorrecto tras error 409 | Baja |
| UX-05 | #5b | Error 409 cierra el diálogo de borrado antes de mostrar el mensaje de error | Baja |
| UX-06 | #6 | Drag & Drop Treatment Ordering como mejora futura | Baja |
| UX-07 | #10 | Mensaje de error técnico "patientId must match your session" poco amigable para usuario final | Media |

---

## Spec Compliance

| Spec | Estado | Notas |
|------|--------|-------|
| Treatment Types API | ✅ Completo | CRUD completo, unique name per professional, rename guard, delete guard |
| Slots API | ✅ Completo | Duration-aware slot filtering, break/block overlap, appointment overlap |
| Appointments API | ✅ Completo | treatmentTypeId integrado, backward compat con treatmentType string |
| UI — Dashboard | ✅ Completo | Sidebar, cards, grupos, form, delete dialog, reorder, toggle active |
| UI — Portal Paciente | ✅ Completo | Booking flow 3 pasos (treatment → datetime → confirm), filtro por activos |
| Data Hardening | ✅ Completo | P2A migration (treatmentTypeId), 22/22 appointments migradas, 0 nulls, 0 huérfanos |

**33/33 escenarios de spec implementados, 19/19 tareas completadas.**

---

## Assets

- **Specs**: `openspec/changes/p2-treatment-management/specs/`
- **Design**: `openspec/changes/p2-treatment-management/design.md`
- **Tasks**: `openspec/changes/p2-treatment-management/tasks.md`
- **Proposal**: `openspec/changes/p2-treatment-management/proposal.md`

---

## Conclusión

P2 — Treatment Management cumple con todos los criterios de aceptación:

- ✅ 13/13 QA manual PASS
- ✅ 4 bugs corregidos durante QA
- ✅ 33/33 escenarios de spec implementados
- ✅ 19/19 tareas completadas
- ✅ tsc OK, build OK
- ✅ Sin blockers pendientes para archivado
- ⏳ UX observations registradas en backlog (no bloquean)
- ⏳ BUG-PORTAL-01 pendiente (no bloquea — observable desde QA #1, no interfiere con funcionalidad core)
