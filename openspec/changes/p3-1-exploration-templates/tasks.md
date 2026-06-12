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

---

# PR #4 — Patient Clinical Hub

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~410 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | N/A |

> **Budget note**: ~410 líneas estimadas. ~10 sobre el presupuesto de 400. Si es necesario ajustar, se puede simplificar el detail de exploraciones v2 (omitir templateConfig, mostrar solo key-value básico), reduciendo ~30 líneas del API + componente.

> **READ-ONLY POLICY**: El tab Exploraciones es exclusivamente de consulta. NO permite editar, crear, ni reabrir exploraciones. Toda edición/creación vive en `/dashboard/exploration`.

## Work Units

| Unit | Goal | Files | ~∆ | Risk |
|------|------|-------|-----|------|
| 1 | Helpers: `getTemplateConfigById` lookup | `lib/api/helpers.ts` | +10 | Muy bajo |
| 2 | API: include `templateConfig` in clinical-history response | `app/api/patients/[id]/clinical-history/route.ts` | +15 | Bajo |
| 3 | Component: ExplorationsTab (read-only, accordion, dual format, photos) | `components/patients/explorations-tab.tsx` | ~180 | Medio |
| 4 | Component: ClinicalNotesTab (list, create, edit, delete) | `components/patients/clinical-notes-tab.tsx` | ~160 | Bajo |
| 5 | PatientDetail: add Exploraciones + Notas Clínicas tabs | `components/patients/patient-detail.tsx` | +25 | Muy bajo |
| 6 | Transition banner on Clinical History page | `app/dashboard/clinical-history/page.tsx` | +20 | Muy bajo |
| | **Total** | **6 archivos** | **~410** | **Bajo-Medio** |

## Dependencies

- PR #1 ✅ — exploration_templates, clinical_notes schemas + APIs
- PR #2 ✅ — DynamicForm, FieldRenderer (no se reusan en PR #4, pero validan que el modelo de datos funciona)
- PR #3 ✅ — Template Editor (valida que templates existen y tienen config)
- ARCH-01 ✅ — Decisión de consolidación aprobada

## Phase 17: Helpers

- [x] **17.1** Add `getTemplateConfigById(templateId: string): TemplateConfig | null` to `lib/api/helpers.ts`
  - Lookup: `db.select().from(explorationTemplates).where(eq(explorationTemplates.id, templateId)).limit(1)`
  - Return `parseJsonField(template.config)` if found, `null` otherwise
  - Files: `lib/api/helpers.ts`
  - Risk: Very low
  - ~∆: 10 lines

## Phase 18: API — Clinical History Enhancement

- [x] **18.1** Modify `app/api/patients/[id]/clinical-history/route.ts` to include `templateConfig` for v2 explorations
  - In the exploration mapping block (section 4), after photos mapping:
    - `templateConfig: row.templateId ? getTemplateConfigById(row.templateId) : null`
  - Import `getTemplateConfigById` from `lib/api/helpers`
  - Files: `app/api/patients/[id]/clinical-history/route.ts`
  - Risk: Low
  - ~∆: 15 lines
  - Verify: `npx tsc --noEmit`, GET clinical-history for a patient with v2 exploration → response includes `templateConfig`

## Phase 19: Component — ExplorationsTab (READ-ONLY)

- [x] **19.1** Create `components/patients/explorations-tab.tsx`
  - **Props**: `patientId: string`
  - **State**: `explorations: ExplorationItem[]`, `loading: boolean`, `error: string | null`
  - **Fetch**: `GET /api/patients/[id]/clinical-history` → extract `explorations` from response
  - **Lifecycle**: `useEffect` on mount, `useCallback` for refetch with `useReducer` or `useState`
  - **Loading state**: Skeleton cards (3 placeholder items with pulse animation)
  - **Empty state**: Icon + "Sin exploraciones registradas" + botón "Nueva Exploración" → `/dashboard/exploration`
  - **Error state**: Alert icon + error message + "Reintentar" button

- [x] **19.2** Exploration accordion list
  - Use shadcn `<Accordion type="single" collapsible>` (mismo patrón que TreatmentHistoryTab)
  - Each trigger: date (formatted) + template indicator (v2 badge or "Legacy" badge) + photo count + notes preview snippet
  - Order: date DESC (most recent first)

- [x] **19.3** Exploration detail on expand — v2 format
  - When exploration has `templateId`, `responses`, and `templateConfig`:
  - Render sections from `templateConfig.sections` as Cards
  - Each section: map fields, show `field.label` + formatted value from `responses[field.key]`
  - Skip fields not present in responses
  - Show `facialAnalysis` in a summary card if present
  - Show photos grid (see 19.5)

- [x] **19.4** Exploration detail on expand — legacy format
  - When exploration has no templateId:
  - Render SkinEvaluation data as cards (skinType, skinCondition, concerns, elasticity, hydration, oilLevel, sensitivity)
  - Render FacialAnalysis data as area cards (forehead, cheeks, etc.)
  - Show photos grid (see 19.5)

- [x] **19.5** Photos grid (shared between v2 and legacy)
  - Show only if `photos.length > 0`
  - Grid: `grid-cols-3 md:grid-cols-5 gap-2`
  - Each photo: aspect-square, object-cover thumbnail
  - Alt text: `"Foto {photo.angle}"`
  - **No lightbox** en PR #4 (simple grid)

- [x] **19.6** Navigation button
  - Botón "Nueva Exploración Física" al final del tab
  - `onClick → router.push(\`/dashboard/exploration?patientId=${patientId}\`)`
  - Mismo handler que el botón existente en PatientDetail header (reutilizar prop `onNewExploration`)

  - Files: `components/patients/explorations-tab.tsx`
  - Risk: Medium (dual format display + templateConfig integration)
  - ~∆: 180 lines (entire component)

## Phase 20: Component — ClinicalNotesTab

- [x] **20.1** Create `components/patients/clinical-notes-tab.tsx`
  - **Props**: `patientId: string`
  - **State**: `notes: ClinicalNote[]`, `loading`, `error`, `creating` (inline form visible), `editingNoteId`, `editContent`

- [x] **20.2** Fetch and display notes list
  - `useEffect` → `GET /api/patients/[id]/clinical-notes` → `notes[]`
  - Rendered as list: each note = date header + content (whitespace-pre-wrap) + edit/delete buttons
  - Order: date DESC
  - Loading: skeleton cards
  - Empty: "Sin notas clínicas registradas" + icon
  - Error: toast + inline retry

- [x] **20.3** Create note — inline editor
  - "+ Nueva Nota" button → shows inline form below the header
  - Form: date input (default today, ISO format YYYY-MM-DD) + Textarea (4 rows, placeholder "Escribí la nota clínica...")
  - "Guardar" button → `POST /api/patients/[id]/clinical-notes` → refetch list → collapse form
  - "Cancelar" button → collapse form without saving
  - Loading state on save: button disabled with spinner

- [x] **20.4** Edit note — dialog
  - Click "Editar" → opens shadcn `<Dialog>` with Textarea precargado
  - "Guardar" → `PATCH /api/patients/[id]/clinical-notes/${noteId}` → refetch → close
  - "Cancelar" → close without changes

- [x] **20.5** Delete note — confirmation
  - Click "Eliminar" → `<AlertDialog>` with "¿Eliminar nota? Esta acción no se puede deshacer."
  - "Confirmar" → `DELETE /api/patients/[id]/clinical-notes/${noteId}` → refetch
  - "Cancelar" → close dialog

  - Files: `components/patients/clinical-notes-tab.tsx`
  - Risk: Low
  - ~∆: 160 lines (entire component)

## Phase 21: PatientDetail — Add Tabs

- [x] **21.1** Import new components in `components/patients/patient-detail.tsx`
  ```typescript
  import { ExplorationsTab } from "./explorations-tab";
  import { ClinicalNotesTab } from "./clinical-notes-tab";
  ```

- [x] **21.2** Add TabsTrigger entries in the TabsList (after Tratamientos)
  ```tsx
  <TabsTrigger value="explorations">
    <Stethoscope className="size-4 mr-2" />
    Exploraciones
  </TabsTrigger>
  <TabsTrigger value="notes">
    <FileText className="size-4 mr-2" />
    Notas Clínicas
  </TabsTrigger>
  ```

- [x] **21.3** Add TabsContent entries
  ```tsx
  <TabsContent value="explorations" className="mt-4">
    <ExplorationsTab
      patientId={patient.id}
      onNewExploration={onNewExploration}
    />
  </TabsContent>
  <TabsContent value="notes" className="mt-4">
    <ClinicalNotesTab patientId={patient.id} />
  </TabsContent>
  ```

  - Files: `components/patients/patient-detail.tsx`
  - Risk: Very low
  - ~∆: +25 lines (imports + 2 triggers + 2 content)
  - Verify: PatientDetail renders 5 tabs, navigation works, tabs show correct content

## Phase 22: Transition Banner — Clinical History

- [x] **22.1** Add transition banner to `app/dashboard/clinical-history/page.tsx`
  - Import: `Link` from `next/link`, `Button` from `@/components/ui/button`, `Info` from `lucide-react`
  - Position: after the loading/error checks, immediately before the main return
  - Content:
    ```tsx
    <div className="mb-6">
      <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <Info className="size-5 text-accent shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Historial Clínico se está migrando a Pacientes
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Toda la información clínica ahora está centralizada en{" "}
            <Link href="/dashboard/patients" className="font-medium text-accent hover:underline">
              Pacientes
            </Link>
            . Seleccioná un paciente para ver su historial completo en un solo lugar.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/dashboard/patients">Ir a Pacientes</Link>
        </Button>
      </div>
    </div>
    ```
  - Files: `app/dashboard/clinical-history/page.tsx`
  - Risk: Very low
  - ~∆: +20 lines

## Phase 23: Verify

- [x] **23.1** Run `npx tsc --noEmit` — zero errors
- [x] **23.2** Run `npm run build` — zero errors
- [ ] **23.3** Manual smoke: navigate to patient with v2 explorations → tab loads, accordion expandible con labels correctos
- [ ] **23.4** Manual smoke: navigate to patient with legacy explorations → tab loads, accordion expandible con skin/facial cards
- [ ] **23.5** Manual smoke: photos visible dentro de exploración expandida
- [ ] **23.6** Manual smoke: ClinicalNotesTab — empty state, create note, note appears in list
- [ ] **23.7** Manual smoke: ClinicalNotesTab — edit note, content updates
- [ ] **23.8** Manual smoke: ClinicalNotesTab — delete note, confirm, note disappears
- [ ] **23.9** Manual smoke: banner visible en `/dashboard/clinical-history` con link a Pacientes
- [ ] **23.10** Manual smoke: PatientDetail tiene 5 tabs navegables

## Rollback Plan

- **Each task**: `git checkout -- <files>` before commit, `git revert <sha>` after
- **PR #4 rollback**: revert all commits. PatientDetail vuelve a 3 tabs, archivos nuevos quedan huérfanos (sin impacto).
- **Zero data impact**: no schema changes, no migrations, no data transformations.
- **Clinical History page**: revert banner → vuelve a estado anterior sin cambios.
