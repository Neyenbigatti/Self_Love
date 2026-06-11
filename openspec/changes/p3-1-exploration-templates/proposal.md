# P3.1 — Exploration Templates & Clinical History Integration

## Change Intent

Evolucionar la Exploración Física de módulo independiente con campos fijos a sistema de plantillas editables por la profesional, integrado como registro clínico dentro del Historial Clínico. Agregar Notas Clínicas como entidad independiente.

## Scope

### PR #1 — Foundation: DB + Templates + Seed (ESTE PR)
- `exploration_templates` table (config JSON)
- `clinical_notes` table
- Columnas `template_id` + `responses` en `explorations`
- Seed: plantilla "Exploración Física Facial"
- GET/PUT template API

### PR #2 — Dynamic Form + Exploration API v2
- DynamicForm + FieldRenderer (7 field types)
- Exploration API actualizada (templateId + responses)
- Legacy compatibility layer
- Exploration page adaptada

### PR #3 — Admin UI: Template Field Editor
- Settings route con editor de plantilla
- Modal add/edit/delete/reorder fields
- Guardar cambios en config JSON

### PR #4 — Clinical Notes + API Evolution
- Schema + API CRUD clinical notes
- ClinicalNotesCard en Historial Clínico
- Clinical-history API v2

## New Capabilities (PR #1)

1. **Exploration Template Management** — system-managed template with config JSON defining sections and fields
2. **Exploration Data Model v2** — store responses as structured JSON keyed by field key
3. **Clinical Notes** — free-text clinical observations linked to patient

## Modified Capabilities (PR #1)

1. **Explorations Schema** — add template_id FK + responses JSON column, maintain legacy skinEvaluation/facialAnalysis

## Affected Areas (PR #1)

- `lib/db/schema.ts` — new tables + columns
- `lib/db/migrations/` — new migration
- `lib/api/validators/` — exploration-templates, clinical-notes validators
- `app/api/exploration-templates/` — new routes
- `lib/types.ts` — new types
