# Tasks: P3.1 Exploration Templates — Foundation (PR #1)

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (already split into 4 PRs) |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

> **Design note**: Spec says system templates read-only (403 on PUT). Design **overrides** this: system templates allow config edits but block slug changes and DELETE. Tasks follow the design.

## Phase 1: Schema

- [x] 1.1 Add `explorationTemplates` table to `lib/db/schema.ts`
- [x] 1.2 Add `clinicalNotes` table to `lib/db/schema.ts`
- [x] 1.3 Add `templateId` (FK nullable) and `responses` (JSON text) to `explorations`
- [x] 1.4 Export new types (`ExplorationTemplate`, `NewExplorationTemplate`, `ClinicalNote`, `NewClinicalNote`)
- [x] 1.5 Run `npm run db:push` to generate migration

## Phase 2: Validators

- [x] 2.1 Create `lib/api/validators/exploration-templates.ts` (config + create + update Zod schemas)
- [x] 2.2 Create `lib/api/validators/clinical-notes.ts` (create + update Zod schemas)
- [x] 2.3 Modify `lib/api/validators/explorations.ts` (add `templateId`, `responses` to schemas)

## Phase 3: Shared Helpers

- [x] 3.1 Create `lib/api/helpers.ts` — extract `parseJsonField()` for shared import across route files
- [x] 3.2 Add `ensureDefaultExplorationTemplate()` to `lib/db/seed.ts` (lazy auto-seed by slug check)

## Phase 4: API — Exploration Templates

- [x] 4.1 Create `app/api/exploration-templates/route.ts` (GET list + POST create; ensure default on GET)
- [x] 4.2 Create `app/api/exploration-templates/[slug]/route.ts` (GET by slug + PUT update; system: allow config edits, block slug changes)

## Phase 5: API — Clinical Notes

- [x] 5.1 Create `app/api/patients/[id]/clinical-notes/route.ts` (GET list + POST create; professional filter)
- [x] 5.2 Create `app/api/patients/[id]/clinical-notes/[noteId]/route.ts` (PATCH update + DELETE; ownership checks)

> **Note**: Routes use `[id]` instead of `[patientId]` to be consistent with existing `clinical-history` and `medical-history` route patterns.

## Phase 6: API — Explorations v2

- [x] 6.1 Modify `app/api/explorations/route.ts` (shared parseJsonField; v2 write: template_id → responses; v2 read: responses ?? legacy fallback)
- [x] 6.2 Modify `app/api/explorations/[id]/route.ts` (same v2 read/write fallback; PATCH supports templateId/responses)
- [x] 6.3 Modify `app/api/patients/[id]/clinical-history/route.ts` (include `responses` in exploration aggregation when non-null)

## Phase 7: Verify

- [x] 7.1 Run `npx tsc --noEmit` — zero errors
- [x] 7.2 Smoke test: GET `/api/exploration-templates` returns seeded "Exploración Física Facial" template

---

# PR #2 — Dynamic Form Renderer + Exploration UI

## Design Notes

- **Historical exploration behavior**: `responses` es snapshot por exploración. Cambios posteriores en la plantilla NO invalidan datos previos. En save, merge: `{ ...existing.responses, ...formValues }` preserva campos huérfanos.
- **Field types to support**: text, textarea, boolean, number, date, select, multiselect.
- **Widgets**: FacialDiagram toggle via `config.widgets.facialDiagram`, PhotoCapture via `config.widgets.photoCapture`.
- **Fallback legacy**: Si la exploration no tiene `templateId` o `responses` es null, renderizar los 3 tabs actuales.
- **Sin cambios de schema ni migraciones**: todo es frontend + consumo de API existente.

## Phase 8: Types

- [x] 8.1 Add `TemplateField`, `ExplorationSection`, `TemplateConfig`, `WidgetsConfig` types to `lib/types.ts` (mirando la config del seed y el design.md)
- [x] 8.2 Add `ExplorationResponseV2` type (`{ templateId, responses, facialAnalysis, photos, notes }`)

## Phase 9: FieldRenderer Component

- [x] 9.1 Create `components/exploration/field-renderer.tsx`:
  - `text` → `<Input>` with Label
  - `textarea` → `<Textarea>` with Label
  - `boolean` → RadioGroup (Sí / No)
  - `number` → `<Input type="number">` with Label
  - `date` → `<Input type="date">` with Label
  - `select` → `<Select>` (shadcn) with options from field.options
  - `multiselect` → Checkbox group with field.options
  - Required indicator (*) for fields with `required: true`
  - Props: `field: TemplateField`, `value: any`, `onChange: (value: any) => void`
  - Error state: `error?: string` prop for field-level validation

## Phase 10: DynamicForm Component

- [x] 10.1 Create `components/exploration/dynamic-form.tsx`:
  - Receives `config: TemplateConfig`, `responses: Record<string, any>`, `onResponsesChange`
  - Renders each section as a `<Card>` with `<CardTitle>` = section.title
  - Within each card, renders `FieldRenderer` for each field in order by `sortOrder`
  - After all sections, conditionally renders `FacialDiagram` + `ZoneDetailForm` if `config.widgets.facialDiagram`
  - After widgets, conditionally renders `PhotoCapture` if `config.widgets.photoCapture`
  - Manages local responses state, calls `onResponsesChange` on any field change

## Phase 11: Page Adaptation

- [x] 11.1 Modify `app/dashboard/exploration/page.tsx`:
  - On patient select, fetch template status alongside exploration data
  - Add v2 detection: `responses !== null && templateId !== null` → modo DynamicForm
  - Modo DynamicForm: renderizar `DynamicForm` + `FacialDiagram` (si widget) + `PhotoCapture` (si widget) como cards en scroll vertical (sin tabs)
  - Modo legacy (fallback): mantener los 3 tabs actuales exactamente como están
  - State: `responses: Record<string, any>` para v2; `skinEvaluation`/`facialAnalysis` legacy se mantienen
  - Save handler v2: enviar `{ templateId, responses (merged con existentes), facialAnalysis, photos, notes }`
  - Save handler legacy: igual que comportamiento actual
  - Notes field siempre visible (compartido entre v2 y legacy)

## Phase 12: Verify

- [x] 12.1 Run `npx tsc --noEmit` — zero errors
- [x] 12.2 Run `npm run build` — zero errors
- [x] 12.3 Manual smoke: create new exploration with template, verify dynamic form renders
- [x] 12.4 Manual smoke: open existing legacy exploration, verify tabs still work

---

# PR #3 — Admin UI: Template Field Editor (Configuración)

## Design Notes

- `isActive: boolean` en TemplateField → false = oculto en DynamicForm. Datos históricos preservados vía merge save.
- `system: boolean` en TemplateField → true = no se puede eliminar, key readonly. Solo campos del seed.
- DynamicForm filtra: `section.fields.filter(f => f.isActive !== false)`.
- Solo la plantilla "Exploración Física Facial" (slug: facial-exploration) se edita en esta PR.
- Sin cambios en APIs existentes. PUT /api/exploration-templates/{slug} ya funciona para system templates.
- Sin drag & drop, sin preview embebido, sin constructor genérico.

## Phase 13: Types + Seed

- [x] 13.1 Add `isActive?: boolean` y `system?: boolean` a `TemplateField` en `lib/types.ts`
- [x] 13.2 Add `isActive: true, system: true` a cada field del seed en `lib/db/seed.ts`
- [x] 13.3 Add `isActive !== false` filter en `components/exploration/dynamic-form.tsx`

## Phase 14: Template Editor Component

- [x] 14.1 Create `components/exploration/template-editor.tsx`:
  - Fetch template via `GET /api/exploration-templates/facial-exploration` on mount
  - Local state for sections, widgets
  - Save via `PUT /api/exploration-templates/facial-exploration`
  - Toast success/error feedback
  - Loading state while fetching, disabled save while saving

- [x] 14.2 Section management:
  - Sections displayed as expandable cards (accordion pattern)
  - **Add Section**: modal con título. `id` autogenerado (snake_case desde título). Botón en parte superior.
  - **Edit Section**: modal precargado con título actual.
  - **Delete Section**: confirm dialog. Elimina sección + todos sus fields. Solo disponible si section no tiene system fields (o advertencia).
  - **Reorder**: ChevronUp / ChevronDown buttons (mismo patrón que Treatments P2)

- [x] 14.3 Field management (dentro de cada sección):
  - Fields listados por `sortOrder`
  - Cada field muestra: label, type badge, [Sistema] badge si system, toggle isActive, Edit / Delete / ↑ / ↓
  - **Add Field**: `FieldFormDialog` modal:
    - label: `<Input>`
    - key: autogenerado desde label (camelCase), editable salvo si system=true
    - type: `<Select>` con 7 opciones (text, textarea, boolean, number, date, select, multiselect)
    - options: `<Textarea>` visible solo si type=select o multiselect (uno por línea, se parsea a array)
    - required: `<Switch>`
    - isActive: `<Switch>` default true
    - Si key ya existe en la sección, mostrar error inline
  - **Edit Field**: mismo modal precargado
  - **type change warning**: cuando type cambia (comparado con valor original), mostrar texto de advertencia: "Modificar el tipo de un campo puede afectar la visualización de respuestas históricas." No bloquear.
  - **Delete Field**: confirm dialog. Solo si `system !== true`. Si system=true, botón oculto.
  - **Reorder**: ChevronUp / ChevronDown
  - **key readonly**: si `system === true`, el input de key está deshabilitado con tooltip "Campo del sistema"
  - **isActive toggle**: switch en la fila del field. Inactivos se muestran con opacidad reducida.

- [x] 14.4 Widgets toggles:
  - Card separada "Widgets" debajo de las secciones
  - `<Switch>` para FacialDiagram
  - `<Switch>` para PhotoCapture

## Phase 15: Settings Page

- [x] 15.1 Create `app/dashboard/settings/page.tsx`:
  - Título "Configuración"
  - Descripción "Administrá las plantillas de exploración física"
  - Renderiza `<TemplateEditor />`
  - Layout consistente con el resto del dashboard

## Phase 16: Verify

- [x] 16.1 Run `npx tsc --noEmit` — zero errors
- [x] 16.2 Run `npm run build` — zero errors
- [ ] 16.3 Manual smoke: open /dashboard/settings, verify template editor loads
- [ ] 16.4 Manual smoke: edit field label, save, reload, verify persistence
- [ ] 16.5 Manual smoke: isActive toggle → field disappears from DynamicForm
- [ ] 16.6 Manual smoke: system field has no delete button, key readonly
- [ ] 16.7 Manual smoke: reorder fields, save, verify DynamicForm reflects new order
- [ ] 16.8 Manual smoke: widget toggle → widget appears/disappears from DynamicForm
- [ ] 16.9 Manual smoke: type change warning appears when switching type
