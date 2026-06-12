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

---

# PR #4 — Patient Clinical Hub

## Technical Approach

Consolidar la información clínica actualmente duplicada en Historial Clínico dentro del módulo Pacientes, agregando 2 tabs nuevos a `PatientDetail`: **Exploraciones** y **Notas Clínicas**. Sin cambios de schema, sin migraciones, sin APIs nuevas. La transición de Historial Clínico es incremental (banner → redirect → cleanup futuro).

## Architecture Decisions

### READ-ONLY POLICY — ExplorationsTab (REGLA FIRME)

El tab Exploraciones en PatientDetail es **exclusivamente de consulta**. No permite editar, crear, ni reabrir exploraciones. La edición y creación viven únicamente en `/dashboard/exploration`.

| Operación | Permitida en ExplorationsTab | Dónde se hace |
|-----------|------------------------------|---------------|
| Ver lista de exploraciones | ✅ Sí | En el tab |
| Expandir y ver detalle completo | ✅ Sí | En el tab |
| Ver fotografías asociadas | ✅ Sí | En el tab |
| Navegar a crear nueva exploración | ✅ Sí (botón → `/dashboard/exploration`) | Redirección |
| Editar exploración existente | ❌ No | `/dashboard/exploration` |
| Crear exploración inline | ❌ No | `/dashboard/exploration` |
| Reabrir DynamicForm | ❌ No | `/dashboard/exploration` |

Esta regla es innegociable. El tab no duplica funcionalidades del módulo de Exploración Física.

### PatientDetail Tab Expansion

| Opción | Tradeoffs | Decisión |
|--------|-----------|----------|
| 5 tabs en PatientDetail vs sub-navegación | 5 tabs es más ancho pero mantiene el patrón existente. Sub-navegación agrega complejidad innecesaria. | **5 tabs directos** — Resumen, Historial Médico, Tratamientos, Exploraciones, Notas Clínicas. El `TabsList` hace scroll horizontal automático en pantallas angostas. |
| Exploraciones: componente separado vs inline en PatientDetail | Separado permite carga lazy y testeo independiente. Inline hace el archivo patient-detail.tsx demasiado grande. | **Componentes separados** — `explorations-tab.tsx` y `clinical-notes-tab.tsx`, importados en patient-detail. |
| Exploraciones v2: display con label vs key técnico | Labels requieren el template config (fetch adicional). Keys son técnicos (camelCase) pero no necesitan fetch. | **Fetch condicional del template al expandir** — cuando el usuario expande una exploración v2, se fetchea el template por slug para obtener labels y estructura de secciones. Cachear en memoria para el resto de la sesión. |
| Exploraciones: accordion vs cards separadas | Accordion mantiene la lista compacta y permite expandir una por vez (mismo patrón que TreatmentHistoryTab). | **Accordion** — consistente con el patrón existente de TreatmentHistoryTab. |
| Clinical Notes: inline editor vs modal dialog | Inline es más rápido de implementar y evita context switches. Modal es más limpio para contenido largo. | **Inline editor** — un textarea que se expande al hacer clic en "+ Nueva Nota". Para editar notas existentes, modal simple. |
| Borde: fecha de nota vs fecha de sistema | La profesional puede querer registrar una nota con fecha retroactiva. | **Input de fecha editable** — default today, pero la profesional puede cambiarlo. |

### Clinical-History API Enhancement

| Opción | Tradeoffs | Decisión |
|--------|-----------|----------|
| Incluir template config en response de clinical-history vs fetch individual | Incluir en response evita N+1 fetches pero agrega datos que pueden no usarse. Fetch individual es lazy. | **Incluir `templateConfig` en cada exploración v2** — el clinical-history API ya itera exploraciones; incluir el config parseado es un lookup barato que evita N+1 en el frontend. |
| Fetch template por ID vs slug | Las exploraciones v2 tienen `templateId`. Para obtener el config necesitamos el template. | **Lookup por ID** — el clinical-history API hace un JOIN o query separada para obtener el config de cada templateId distinto en el batch de exploraciones. |

## PatientDetail — Estructura Final

```
PatientDetail (Card)
├── Header: avatar, nombre, edad, género, email, teléfono, dirección
├── Actions: [Nueva Exploración] [Agregar Fotos] [Editar]
├── Separator
└── TabsList (5 items):
    ├── Resumen (existing)
    │   ├── Stats cards (visitas, tratamientos, última visita)
    │   ├── Notas del paciente
    │   └── Tratamientos recientes (top 3)
    ├── Historial Médico (existing — MedicalHistoryTab)
    │   ├── Alergias
    │   ├── Medicación actual
    │   ├── Condiciones médicas
    │   └── Tratamientos previos externos
    ├── Tratamientos (existing — TreatmentHistoryTab)
    │   └── Accordion de completed appointments
    ├── Exploraciones (NEW)
    │   ├── Lista accordion de exploraciones (fecha DESC)
    │   ├── Cada exploración expandible:
    │   │   ├── v2: secciones + campos con labels desde template config
    │   │   ├── legacy: SkinEvaluation + FacialAnalysis cards
    │   │   ├── Fotografías (grid dentro del contexto de la exploración)
    │   │   └── Notas de la exploración
    │               └── Botón "Nueva Exploración" → navega a `/dashboard/exploration?patientId=...` (no crea inline)
    └── Notas Clínicas (NEW)
        ├── Lista cronológica (fecha DESC)
        ├── Cada nota: fecha + contenido + edit/delete
        └── "+ Nueva Nota" → inline editor con textarea + fecha
```

## Estrategia de Exploraciones

### Data Flow

```
PatientDetail
  └── ExplorationsTab (props: patientId)
       │
       ├── [on mount] fetch GET /api/patients/[id]/clinical-history
       │   └── Response incluye explorations[] con templateConfig si v2
       │
       ├── Render accordion list
       │   └── Cada item: date + photo count + notes preview
       │
       └── [on expand] 
           ├── v2: render sections from templateConfig, map responses
           │   └── Template config ya incluido en response (evita N+1)
           └── legacy: render SkinEvaluation + FacialAnalysis cards
                └── Datos ya incluidos en la exploration
```

### Dual Format Handling

```typescript
interface ExplorationDisplay {
  id: string;
  date: string;
  notes: string | null;
  photos: ExplorationPhoto[];

  // v2 mode
  templateId: string | null;
  responses: Record<string, any> | null;
  templateConfig: TemplateConfig | null;  // Included in API response

  // legacy mode
  skinEvaluation: SkinEvaluationData | null;
  facialAnalysis: Partial<FacialAnalysis> | null;
}

// Display logic in ExplorationCard:
function ExplorationCard({ exploration }: { exploration: ExplorationDisplay }) {
  if (exploration.templateId && exploration.responses && exploration.templateConfig) {
    return <V2ExplorationDetail config={exploration.templateConfig} responses={exploration.responses} />;
  }
  return <LegacyExplorationDetail skinEval={exploration.skinEvaluation} facial={exploration.facialAnalysis} />;
}
```

### V2 Detail Rendering

```typescript
function V2ExplorationDetail({ config, responses }: { config: TemplateConfig; responses: Record<string, any> }) {
  return (
    <div className="space-y-4">
      {config.sections
        .filter(s => s.fields.some(f => responses[f.key] !== undefined))
        .map(section => (
          <Card key={section.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{section.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {section.fields
                  .filter(f => responses[f.key] !== undefined)
                  .map(field => (
                    <div key={field.key} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                      <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
                      <span className="text-sm">{formatFieldValue(field, responses[field.key])}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      {/* Photos grid */}
      <PhotosGrid photos={exploration.photos} />
    </div>
  );
}
```

El template config ya viene incluido en la respuesta del clinical-history API, evitando N+1 fetches.

### Photos Handling

Las fotografías se renderizan como grid dentro de cada exploración expandida, no como elemento independiente. Esto mantiene el contexto clínico correcto.

```typescript
function PhotosGrid({ photos }: { photos: ExplorationPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Fotografías ({photos.length})</h4>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {photos.map(photo => (
          <div key={photo.id} className="aspect-square rounded-lg bg-muted overflow-hidden">
            <img src={photo.url} alt={`Foto ${photo.angle}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Estrategia de Notas Clínicas

### Data Flow

```
PatientDetail
  └── ClinicalNotesTab (props: patientId)
       │
       ├── [on mount] fetch GET /api/patients/[id]/clinical-notes
       │   └── notes[] from response
       │
       ├── Header: "Notas Clínicas" + botón "+ Nueva Nota"
       │
       ├── [state: creating] → inline editor
       │   ├── Date input (default today)
       │   ├── Textarea for content
       │   └── [Guardar] → POST /api/patients/[id]/clinical-notes → refetch
       │
       ├── Lista de notas (fecha DESC)
       │   └── Cada nota:
       │       ├── Fecha (formateada)
       │       ├── Contenido (whitespace-pre-wrap)
       │       ├── [Editar] → modal con textarea precargado
       │       │   └── PATCH /api/patients/[id]/clinical-notes/[noteId] → refetch
       │       └── [Eliminar] → confirm dialog → DELETE → refetch
       │
       └── Empty state: "Sin notas clínicas registradas"
```

### Component States

| State | Handling |
|-------|----------|
| Loading | Skeleton cards (mismo patrón que PatientDetail) |
| Empty | Mensaje "Sin notas clínicas registradas" con icono |
| Error | Toast + mensaje inline con reintento |
| Creating | Inline editor visible, botón "Guardando..." disabled |
| Editing | Modal abierto con textarea precargado |
| Deleting | Confirm dialog con "¿Eliminar nota?" |

## Estrategia de Transición de Historial Clínico

### Fase 1 — PR #4 (esta fase)

Añadir banner informativo en `app/dashboard/clinical-history/page.tsx`:

```tsx
// After the loading/error checks, before the main render:
{/* ── Transition banner ───────────────────────────────────── */}
<div className="mb-6">
  <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
    <Info className="size-5 text-accent shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground">
        Historial Clínico se está migrando a Pacientes
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Toda la información clínica ahora está centralizada en el módulo{" "}
        <Link href="/dashboard/patients" className="font-medium text-accent hover:underline">
          Pacientes
        </Link>
        . Seleccioná un paciente para ver su historial médico, tratamientos,
        exploraciones y notas clínicas en un solo lugar.
      </p>
    </div>
    <Button variant="outline" size="sm" asChild>
      <Link href="/dashboard/patients">Ir a Pacientes</Link>
    </Button>
  </div>
</div>
```

La página existente sigue funcionando completamente — es solo un banner informativo.

### Fase 2 — Post-PR #4

Convertir la página en redirect:

```typescript
// app/dashboard/clinical-history/page.tsx
export default function ClinicalHistoryPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/patients'); }, [router]);
  return null; // or loading spinner
}
```

### Fase 3 — Cleanup (futuro)

- Eliminar `app/dashboard/clinical-history/page.tsx`
- Eliminar entrada de `primaryNav` en `components/dashboard/sidebar.tsx`
- Opcional: agregar redirect en `next.config.mjs` o middleware

## Arquitectura de Componentes

### Component Tree

```
components/patients/
├── patient-detail.tsx        MODIFIED — +2 tabs
├── patient-list.tsx          unchanged
├── patient-dialog.tsx        unchanged
├── medical-history-tab.tsx   unchanged
├── treatment-history-tab.tsx unchanged
├── explorations-tab.tsx      NEW
│   └── exploration-card.tsx  NEW (sub-component, inline o separado)
└── clinical-notes-tab.tsx    NEW
```

### Component Interfaces

```typescript
// ─── ExplorationsTab ────────────────────────────────────────
interface ExplorationsTabProps {
  patientId: string;
  onNewExploration: () => void;  // Reuses existing handler from PatientDetail
}

// ─── ExplorationCard ────────────────────────────────────────
interface ExplorationCardProps {
  exploration: ExplorationItem;
}

interface ExplorationItem {
  id: string;
  date: string;
  templateId: string | null;
  responses: Record<string, any> | null;
  templateConfig: TemplateConfig | null;  // included in API response for v2
  skinEvaluation: SkinEvaluationData | null;
  facialAnalysis: Partial<FacialAnalysis> | null;
  notes: string | null;
  photos: ExplorationPhoto[];
}

// ─── ClinicalNotesTab ───────────────────────────────────────
interface ClinicalNotesTabProps {
  patientId: string;
}

// ─── ClinicalNoteItem ───────────────────────────────────────
interface ClinicalNote {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### State Management

Cada tab maneja su propio estado internamente:

- **ExplorationsTab**: estado local con `useState` + `useEffect` para fetch inicial. No necesita estado global.
- **ClinicalNotesTab**: estado local con `useState` + `useEffect` para fetch inicial. CRUD via llamadas API directas.

No se requiere estado global ni context para esta PR.

## Modified Capabilities — Detail

### Clinical-History API (`app/api/patients/[id]/clinical-history/route.ts`)

**Cambio menor**: Incluir `templateConfig` parseado para exploraciones v2.

```typescript
// En el bloque de explorations (sección 4 del GET handler):
const explorationsWithPhotos = explorationRows.map((row) => ({
  id: row.id,
  date: row.date,
  skinEvaluation: parseJsonField(row.skinEvaluation),
  facialAnalysis: parseJsonField(row.facialAnalysis),
  responses: parseJsonField(row.responses),
  notes: row.notes,
  photos: photosByExplorationId.get(row.id) ?? [],
  // NEW: include template config for v2 explorations
  templateConfig: row.templateId
    ? getTemplateConfigById(row.templateId) // lookup function
    : null,
}));
```

Esto evita que el frontend tenga que hacer N requests individuales para obtener los labels de cada exploración v2.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/patients/patient-detail.tsx` | Modify | Agregar TabsTrigger "Exploraciones" y "Notas Clínicas" + TabsContent que renderiza los nuevos componentes |
| `components/patients/explorations-tab.tsx` | **Create** | Tab de exploraciones: fetch data, accordion list, dual format display (v2/legacy), photos grid |
| `components/patients/clinical-notes-tab.tsx` | **Create** | Tab de notas clínicas: fetch notes, list, inline creator, edit modal, delete confirm |
| `app/dashboard/clinical-history/page.tsx` | Modify | Agregar banner de transición informativo con link a Pacientes |
| `app/api/patients/[id]/clinical-history/route.ts` | Modify | Incluir `templateConfig` en response para exploraciones v2 |
| `lib/api/helpers.ts` | Modify (minor) | Agregar helper `getTemplateConfigById()` o similar para lookup |

### Archivos NO modificados

- `components/dashboard/sidebar.tsx` — Fase 1 no toca sidebar
- `app/dashboard/exploration/page.tsx` — Sin cambios
- Cualquier API de templates, notes, treatments — Sin cambios
- Schema, migraciones — Sin cambios

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Build | TypeScript compila sin errores | `npx tsc --noEmit` |
| Build | Build de producción sin errores | `npm run build` |
| Manual | Tab Exploraciones carga y muestra exploraciones existentes | Navegar a paciente con exploraciones, verificar listado |
| Manual | Tab Exploraciones: exploración v2 expandible con campos con label | Expandir exploración con template, verificar secciones + labels |
| Manual | Tab Exploraciones: exploración legacy expandible | Expandir exploración sin template, verificar skin/facial cards |
| Manual | Tab Exploraciones: fotos visibles dentro de exploración | Verificar grid de fotos al expandir |
| Manual | Tab Notas Clínicas: lista vacía muestra empty state | Paciente sin notas → empty state |
| Manual | Tab Notas Clínicas: crear nota | "+ Nueva Nota" → escribir → guardar → aparece en lista |
| Manual | Tab Notas Clínicas: editar nota | Editar → modal → cambiar texto → guardar → lista actualizada |
| Manual | Tab Notas Clínicas: eliminar nota | Eliminar → confirm → desaparece de lista |
| Manual | Banner de transición visible en Clinical History | Navegar a /dashboard/clinical-history, banner visible con link a Pacientes |
| Manual | PatientDetail con 5 tabs | Verificar que tabs existen y son navegables, scroll horizontal si es necesario |

## Migration / Rollout

**Sin migraciones de datos.** Sin cambios de schema. Sin nuevas dependencias.

Rollback plan:
1. Revertir cambios en `patient-detail.tsx` → vuelve a 3 tabs
2. Eliminar archivos nuevos (`explorations-tab.tsx`, `clinical-notes-tab.tsx`)
3. Revertir banner en clinical-history
4. Revertir cambio en clinical-history API (templateConfig)
5. **Cero impacto en datos** — no hay cambios persistentes

## Risks

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| PatientDetail con 5 tabs se ve apretado en pantallas chicas | Alta | Bajo | `TabsList` con `w-full justify-start overflow-auto`. El layout actual ya maneja scroll. |
| Exploraciones con muchas fotos al expandir | Media | Bajo | Grid responsivo con `grid-cols-3 md:grid-cols-5`. Fotos lazy load con `loading="lazy"`. |
| Template config lookup en API agrega latencia | Baja | Bajo | Solo se hace lookup por exploration v2. Cacheable en backend (las templates rara vez cambian). |
| Nota clínica larga en inline editor | Baja | Medio | Textarea con `rows={4}` expandible. Si >500 chars, considerar modal. |
| Usuario acostumbrado a Historial Clínico se siente perdido | Media | Bajo | Banner claro con link directo. La información sigue estando, solo cambió de ruta. |

## Open Questions

1. **Anchor scroll en PatientDetail**: al cambiar de tab, ¿mantener scroll position o resetear a top?
   - _Propuesta_: Respetar comportamiento actual de Tabs (no customizar).
2. **Exploraciones: ¿paginación?**: Un paciente con muchas exploraciones (>20) podría beneficiarse.
   - _Propuesta_: No para PR #4. El clinical-history API ya limita a 50 explorations. Agregar paginación si es necesario después.
3. **Notas Clínicas: ¿orden ascendente o descendente?**:
   - _Propuesta_: DESC (más reciente primero), consistente con el resto del sistema.
4. **Foto click → lightbox?**: ¿abrir foto en modal al hacer clic?
   - _Propuesta_: No para PR #4. Simple grid clickeable si hay tiempo, sino solo thumbnail.

## Estimación Actualizada

| Componente | Archivos | ~Líneas | Riesgo |
|-----------|---------|---------|--------|
| PatientDetail — +2 tabs | 1 mod | +25 | Muy bajo |
| ExplorationsTab (list + card + dual format + photos) | 1 new | ~200 | Medio |
| ClinicalNotesTab (list + create + edit + delete) | 1 new | ~170 | Bajo |
| Clinical History — banner | 1 mod | +20 | Muy bajo |
| Clinical-history API — templateConfig | 1 mod | +15 | Bajo |
| Helpers — getTemplateConfigById | 1 mod | +10 | Muy bajo |
| **Total** | **~6 archivos** | **~440** | **Bajo-Medio** |

**Nota**: La estimación supera ligeramente las 400 líneas (~440). Esto se debe principalmente al componente ExplorationsTab que debe manejar dos formatos de datos (v2 y legacy). Si es necesario ajustar al presupuesto de 400 líneas, se puede simplificar el display de exploraciones v2 omitiendo el lookup de template config y mostrando solo los datos crudos, reduciendo ~50 líneas.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~440 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (single PR, scope claro) |
| Delivery strategy | ask-on-risk |
| Chain strategy | N/A |
