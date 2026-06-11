# Design: P3.1 Exploration Templates — Foundation

## Technical Approach

Add `exploration_templates` and `clinical_notes` tables + API routes using existing patterns (Drizzle schema, Zod validators, route handler auth guards). Extend `explorations` with `template_id` / `responses` columns and a read-fallback helper. Seed one system template. All three domains are independent — no cross-table coupling at this layer.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| System templates: read-only vs config-editable vs full-editable | Full-editable allows slug/name changes that break deep links; read-only blocks the core P3.1A goal. Config-editable with delete/slug protection balances both | **Config-editable, delete-protected** — `is_system` blocks DELETE and slug changes, but NOT config edits (fields, sections, widgets, labels). The spec's 403-on-PUT is overridden by this explicit design decision. |
| `exploration_templates.slug` as route param vs `id` | Slug is human-readable and stable for seeded templates; ID adds a lookup indirection | **Slug-based** for GET/PUT — matches UX mental model |
| `responses` stored as JSON vs normalized | SQLite JSON columns match existing `skin_evaluation` / `facial_analysis` pattern; no schema churn when template fields change | **JSON text column** — snapshot semantics (historical data preserved). Editing or removing a template field does NOT affect responses already stored in explorations. |
| Drizzle push vs generate migration | Project uses `drizzle-kit push` for dev; no migration generation script in package.json | **Schema-first + push** — add columns/tables to schema.ts, run `db:push` |
| Manual seed vs lazy auto-seed | Manual seed adds friction for new environments; coupling seed to `db:push` mixes infra with business data | **Lazy auto-seed on read** — `ensureDefaultExplorationTemplate()` checks if slug exists at the start of GET template endpoints; inserts if missing. No manual step, no coupling to migrations. |
| Clinical notes vs embedded in exploration | Notes are free-text, not template-driven; separate table avoids bloating explorations with unstructured data | **Separate table** — cleaner querying, professional-ownership filter, independent lifecycle |
| Patient-scoped routes (`/api/patients/[id]/clinical-notes`) vs flat | Clinical notes belong to a patient — nesting in patient routes makes ownership explicit and consistent with existing `clinical-history` | **Nested routes** — follows `patients/[id]/clinical-notes` pattern |
| Handling historical explorations when template changes | If DynamicForm only sends visible fields, orphaned response data is lost on re-save | **Snapshot merge on save** — merge new form values with existing responses: `{ ...existing.responses, ...formValues }`. Orphaned fields (present in responses but removed from template) persist in DB and are preserved across saves. |

### Historical Exploration Behavior (PR #2 — DynamicForm)

**Principio**: `responses` es un snapshot histórico por exploración. Cambios posteriores en la plantilla NO deben invalidar ni ocultar datos previamente guardados.

**Comportamiento al leer una exploración existente:**

| Escenario | Template actual | responses guardados | Comportamiento DynamicForm |
|---|---|---|---|
| Campo existe en ambos | ✅ Tiene field X | ✅ Tiene valor X | Renderiza field X, popula con valor guardado |
| Campo nuevo (no existía al guardar) | ✅ Tiene field Y | ❌ Sin valor Y | Renderiza field Y vacío (la profesional lo completa si quiere) |
| Campo eliminado de template | ❌ Sin field Z | ✅ Tiene valor Z | No renderiza field Z. Dato preservado en DB, no visible en form |
| Campo modificado (tipo cambió) | ✅ Tiene field X (type: select) | ✅ Valor de cuando era text | Renderiza field X con nuevo tipo. Valor legacy se muestra si el formato es compatible; si no, el campo se renderiza vacío |

**Comportamiento al guardar una exploración existente:**

```typescript
// Merge: preserva campos huérfanos, actualiza campos visibles
const mergedResponses = {
  ...existingExploration.responses,  // Datos históricos completos
  ...currentFormValues,              // Campos visibles en el formulario actual
};

await fetch(`/api/explorations/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    templateId: currentTemplateId,
    responses: mergedResponses, // Merge completo
    facialAnalysis,
    photos,
    notes,
  }),
});
```

Este merge garantiza que:
- Campos eliminados de la plantilla NO se pierden al re-guardar
- Campos nuevos de la plantilla aparecen vacíos (no afectan datos históricos)
- Campos existentes se actualizan normalmente
- La exploración siempre se puede visualizar sin errores aunque la plantilla haya cambiado

## Data Flow

```
  Template CRUD:
    UI → GET /api/exploration-templates → ensureDefaultTemplate() → db.explorationTemplates → response (config parsed)
    UI → GET /api/exploration-templates/{slug} → ensureDefaultTemplate() → db.explorationTemplates → response
    UI → PUT /api/exploration-templates/{slug} → validate config Zod → db update

 Clinical Notes:
   UI → GET/POST /api/patients/{pid}/clinical-notes → validate → db.clinicalNotes (professional filter)
   UI → PATCH/DELETE /api/patients/{pid}/clinical-notes/{nid} → ownership check → db mutate

 Exploration v2 Write:
   UI → POST /api/explorations → if template_id → store in responses, null out legacy → else → legacy path

 Exploration v2 Read:
   API → parseJsonField(row.responses) ?? { skinEval: parseJsonField(skinEval), facial: parseJsonField(facial) }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/db/schema.ts` | Modify | Add `explorationTemplates`, `clinicalNotes` tables; add `templateId`, `responses` to `explorations` |
| `lib/api/validators/exploration-templates.ts` | Create | Zod schemas for config JSON, create, update |
| `lib/api/validators/clinical-notes.ts` | Create | Zod schemas for create, update |
| `lib/api/validators/explorations.ts` | Modify | Add `templateId`, `responses` to create/update schemas |
| `app/api/exploration-templates/route.ts` | Create | GET list, POST create |
| `app/api/exploration-templates/[slug]/route.ts` | Create | GET by slug, PUT update |
| `app/api/patients/[patientId]/clinical-notes/route.ts` | Create | GET list, POST create |
| `app/api/patients/[patientId]/clinical-notes/[noteId]/route.ts` | Create | PATCH update, DELETE |
| `app/api/explorations/route.ts` | Modify | v2 write path (template_id → responses); v2 read fallback |
| `app/api/explorations/[id]/route.ts` | Modify | v2 read/write fallback; PATCH support for template fields |
| `app/api/patients/[id]/clinical-history/route.ts` | Modify | Return `responses` when non-null in exploration aggregation |
| `lib/db/seed.ts` | Modify | Seed "Exploración Física Facial" template with upsert |
| `lib/db/migrations/*.sql` | Create | Migration for new tables + columns (via `drizzle-kit push`) |
| `lib/api/helpers.ts` | Create | Shared `parseJsonField` extraction for v2 read fallback |

## Interfaces / Contracts

```typescript
// Config JSON shape (validated by Zod):
type TemplateConfig = {
  sections: Array<{
    id: string; title: string;
    fields: Array<{
      key: string; label: string;
      type: 'text'|'textarea'|'boolean'|'number'|'date'|'select'|'multiselect';
      options?: string[]; required?: boolean; sortOrder: number;
    }>;
  }>;
  widgets: { facialDiagram?: boolean; photoCapture?: boolean };
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Config Zod schema rejects invalid field types, missing required keys | Manual `z.safeParse` assertions (no framework) |
| Build | TypeScript compiles with no errors | `npx tsc --noEmit` |
| Manual | API endpoints return correct status codes for each scenario | Curl or browser dev |

## Migration / Rollout

No data migration required — new columns are nullable. Existing explorations retain legacy data. Run `npm run db:push` to apply schema changes. The facial template is auto-seeded on first read via `ensureDefaultExplorationTemplate()` — no manual seed step needed.

## Open Questions

None.
