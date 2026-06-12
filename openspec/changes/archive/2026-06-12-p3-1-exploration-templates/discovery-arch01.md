# ARCH-01 — Discovery: Consolidación Pacientes e Historial Clínico

**Fecha**: 2026-06-12
**Contexto**: Decisión arquitectónica aprobada — Opción A (Consolidar en Pacientes)

---

## 1. Estado Actual por Módulo

Se realizó lectura completa del código: schemas, APIs, componentes, páginas, y tipos compartidos.

### 1.1 Pacientes (`/dashboard/patients`)

**Componentes**:
- `app/dashboard/patients/page.tsx` — Página principal con lista + detalle
- `components/patients/patient-list.tsx` — Lista lateral con búsqueda
- `components/patients/patient-detail.tsx` — Vista de detalle con tabs
- `components/patients/patient-dialog.tsx` — Modal create/edit
- `components/patients/medical-history-tab.tsx` — Historial médico
- `components/patients/treatment-history-tab.tsx` — Historial de tratamientos

**Datos que muestra actualmente**:
| Sección | Fuente de datos | Status |
|---------|----------------|--------|
| Info del paciente (nombre, email, teléfono, edad, género, dirección) | `GET /api/patients/[id]` | ✅ |
| Stats (visitas totales, tratamientos, última visita) | `GET /api/patients/[id]` + `clinical-history` | ✅ |
| Notas del paciente | `GET /api/patients/[id]` | ✅ |
| Historial Médico (alergias, medicación, condiciones, tratamientos previos) | `GET /api/patients/[id]/clinical-history` + `medical-history` | ✅ Tab |
| Tratamientos (completed appointments) | `GET /api/patients/[id]/clinical-history` | ✅ Tab |
| Acción: Nueva Exploración Física | Navega a `/dashboard/exploration?patientId=...` | ✅ Botón |
| Acción: Agregar Fotos | Navega a `/dashboard/exploration?patientId=...` | ✅ Botón |
| Acción: Editar paciente | Diálogo modal | ✅ Botón |

### 1.2 Historial Clínico (`/dashboard/clinical-history`)

**Componentes**:
- `app/dashboard/clinical-history/page.tsx` — Página standalone

**Datos que muestra actualmente**:
| Sección | Fuente de datos | Status |
|---------|----------------|--------|
| Lista de pacientes | `GET /api/patients` (mismo componente) | ✅ |
| Nombre del paciente | Desde selección | ✅ |
| Historial Médico | `GET /api/patients/[id]/clinical-history` (mismo componente) | ✅ Tab |
| Tratamientos | `GET /api/patients/[id]/clinical-history` (mismo componente) | ✅ Tab |
| Exploraciones Físicas (solo resumen read-only) | `GET /api/patients/[id]/clinical-history` | ✅ Card informativa |

**Lo que NO tiene Historial Clínico**:
- ❌ Botón "Nueva Exploración"
- ❌ Botón "Agregar Fotos"
- ❌ Botón "Editar Paciente"
- ❌ Notas del paciente
- ❌ Stats/Resumen
- ❌ Cualquier acción de escritura

### 1.3 API `GET /api/patients/[id]/clinical-history`

Endpoint compartido que alimenta AMBOS módulos. Retorna:

```typescript
{
  patient: { id, name, email, phone, avatar, dateOfBirth, gender, totalVisits, lastVisit },
  medicalHistory: { allergies, medications, conditions, previousTreatments } | null,
  completedAppointments: Array<{ id, treatmentType, date, startTime, endTime, notes, professionalName }>,
  explorations: Array<{ id, date, skinEvaluation, facialAnalysis, responses, notes, photos }>
}
```

**No hay lógica diferente por módulo** — ambos consumen el mismo response.

### 1.4 Exploración Física (`/dashboard/exploration`)

Módulo independiente con:
- Selector de paciente (dropdown, no integrado con PatientDetail)
- Modo legacy: SkinEvaluation + FacialAnalysis + PhotoCapture en tabs
- Modo v2: DynamicForm desde template config + widgets condicionales
- Notes field siempre visible
- Save con merge de responses

### 1.5 Notas Clínicas

Ya existe:
- Tabla `clinical_notes` en DB ✅
- API CRUD en `/api/patients/[id]/clinical-notes` ✅
- Validators Zod ✅
- **UI: NO existe** — no hay forma de crear/ver notas desde el frontend

### 1.6 Fotografías

Solo existen como parte de `explorations` (tabla `exploration_photos`).
No hay galería independiente por paciente.

---

## 2. Análisis de Migración

### 2.1 Qué información YA existe en Pacientes (no requiere cambios)

| Dato | Dónde está | Acción |
|------|-----------|--------|
| Info del paciente | `PatientDetail` header | ✅ Ya existe |
| Stats (visitas, tratamientos, última visita) | Overview tab | ✅ Ya existe |
| Notas del paciente | Overview tab | ✅ Ya existe |
| Historial Médico | `MedicalHistoryTab` | ✅ Ya existe como tab |
| Tratamientos (completed) | `TreatmentHistoryTab` | ✅ Ya existe como tab |

### 2.2 Qué debe migrarse desde Historial Clínico

| Dato | Dónde está | Dónde debe ir | Acción |
|------|-----------|---------------|--------|
| Lista de Exploraciones (resumen) | Clinical History card | Pacientes → nuevo tab "Exploraciones" | **Migrar** |

El único dato que Historial Clínico muestra y Pacientes NO es la lista de exploraciones realizadas (fecha, tipo, fotos). Eso debe agregarse como un tab nuevo o como contenido dentro del tab existente.

### 2.3 Cómo incorporar Exploraciones en Pacientes

**Opción recomendada**: Nuevo tab "Exploraciones" en `PatientDetail`.

```
PatientDetail Tabs actuales:
  Resumen | Historial Médico | Tratamientos

PatientDetail Tabs propuestos:
  Resumen | Historial Médico | Tratamientos | Exploraciones | Notas Clínicas
```

**Contenido del tab "Exploraciones"**:
- Lista de exploraciones ordenadas por fecha DESC
- Cada exploración expandible (accordion) mostrando:
  - Fecha
  - Template utilizado (si v2)
  - Campos del DynamicForm (v2) / SkinEvaluation + FacialAnalysis (legacy)
  - Fotografías asociadas
  - Notas de la exploración
- Botón "Nueva Exploración" (ya existe en el header de PatientDetail, también dentro del tab)

**Reutilización**: El componente `TreatmentHistoryTab` usa Accordion — mismo patrón.
**API**: `GET /api/patients/[id]/clinical-history` ya devuelve explorations con todo el detalle.

### 2.4 Cómo incorporar Fotografías en Pacientes

**Opción recomendada**: Las fotografías viven dentro de cada exploración. No se necesita un tab separado de "Fotografías" porque:

1. Las fotos ya están asociadas a exploraciones via FK `exploration_photos.exploration_id`
2. Una galería plana sin contexto pierde valor clínico
3. Mostrar fotos dentro de cada exploración en el tab "Exploraciones" da contexto (antes/después, ángulo, fecha)

**Excepción futura**: Si se necesita una vista "Evolución fotográfica" (before/after timeline), se puede construir como un widget dentro del tab Exploraciones o como vista adicional. No blocker para PR #4.

**Acción inmediata**: Asegurar que el tab Exploraciones muestre las fotos correctamente (ya están en el response de clinical-history).

### 2.5 Cómo incorporar Notas Clínicas en Pacientes

**Opción recomendada**: Nuevo tab "Notas Clínicas" en `PatientDetail`.

**Contenido**:
- Lista de notas cronológicas (fecha DESC)
- Cada nota: fecha + contenido (markdown o texto plano)
- Botón "+ Nueva Nota" → inline editor o modal
- API existente: `GET/POST /api/patients/[id]/clinical-notes`
- Update/delete: `PATCH/DELETE /api/patients/[id]/clinical-notes/[noteId]`

**Consideraciones**:
- Las notas son independientes de las exploraciones
- Una nota puede referenciar una exploración (opcional, no blocker)
- El componente es simple: lista + formulario inline

### 2.6 Estrategia de Transición para Historial Clínico

**Fase 1 — PR #4 (esta fase)**:
- Agregar tabs "Exploraciones" y "Notas Clínicas" a `PatientDetail`
- La página `/dashboard/clinical-history` se mantiene pero se le agrega un banner: "Los datos clínicos ahora están en Pacientes"
- No eliminar código aún

**Fase 2 — Post-PR #4**:
- `/dashboard/clinical-history` redirige a `/dashboard/patients`
- Eliminar `app/dashboard/clinical-history/page.tsx`
- Eliminar entrada del sidebar
- Opcional: mantener redirect por 404 si alguien tenía el link guardado

**Fase 3 — Futuro**:
- Si se necesita vista cronológica, construir como tab "Línea de Tiempo" dentro de Pacientes

### 2.7 Impacto en Navegación

**Sidebar actual** (6 items principales):
```
Calendario | Disponibilidad | Pacientes | Tratamientos | Historial Clínico | Exploración Física
```

**Sidebar propuesto** (5 items principales):
```
Calendario | Disponibilidad | Pacientes | Tratamientos | Exploración Física
```

**Cambios**:
- "Historial Clínico" se elimina del sidebar
- "Exploración Física" se mantiene como acceso rápido para crear nuevas exploraciones
- "Pacientes" se vuelve el hub clínico único

**Nota**: La ruta `/dashboard/exploration` sigue siendo útil como acceso directo para crear exploraciones sin navegar a Pacientes primero. No eliminarla.

### 2.8 Impacto en APIs

**APIs que NO cambian** (siguen funcionando igual):
| API | Uso |
|----|-----|
| `GET /api/patients` | Lista pacientes |
| `GET /api/patients/[id]` | Detalle paciente |
| `PATCH /api/patients/[id]` | Update paciente |
| `GET /api/patients/[id]/clinical-history` | Datos clínicos agregados |
| `GET/POST /api/patients/[id]/medical-history` | Historial médico |
| `GET/POST/PATCH/DELETE /api/patients/[id]/clinical-notes` | Notas clínicas |
| `GET/POST/PATCH/DELETE /api/explorations` | Exploraciones |
| `GET/PUT /api/exploration-templates` | Templates |

**APIs que podrían beneficiarse de evolución futura**:
| API | Mejora potencial | Prioridad |
|----|-----------------|-----------|
| `GET /api/patients/[id]` | Incluir `explorations` count en el response | Baja (PR #4 poster) |
| `GET /api/patients/[id]/clinical-history` | Ya incluye todo — sin cambios | — |

**Conclusión**: Las APIs existentes ya soportan la consolidación. No se requieren cambios en APIs para PR #4.

---

## 3. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| PatientDetail crece demasiado (5 tabs) | Alta | Medio | Usar scroll interno por tab. El diseño actual ya lo soporta (`overflow-auto` en CardContent) |
| Profesionales acostumbrados a Historial Clínico se desorientan | Media | Bajo | Banner de transición + redirect. La información sigue estando, solo cambió de ruta |
| PR #4 se vuelve demasiado grande (scope creep) | Alta | Alto | **Mantener foco en tabs + transición. No hacer timeline ni galería ahora.** |
| Exploraciones y Notas compiten por espacio en el mismo tab | Baja | Medio | Son tabs separados — no compiten |
| Datos históricos de exploraciones legacy (sin template) no se visualizan bien | Baja | Medio | El componente de Exploraciones debe manejar ambos formatos (v2 y legacy) igual que la exploration page actual |

---

## 4. Estimación Preliminar

| Componente | Archivos a tocar | Cambio estimado | Riesgo |
|-----------|-----------------|----------------|--------|
| Tab "Exploraciones" en PatientDetail | 2 nuevos + 1 modificación | ~200 líneas | Bajo |
| Tab "Notas Clínicas" en PatientDetail | 2 nuevos + 1 modificación | ~180 líneas | Bajo |
| Banner de transición en Clinical History | 1 modificación | ~20 líneas | Muy bajo |
| Ajustes de navegación (sidebar) | 1 modificación | ~5 líneas | Muy bajo |
| **Total estimado** | **~7 archivos** | **~400 líneas** | **Bajo-Medio** |

**Nota**: Más del 60% del código es UI nueva (componentes de lista/formulario). Las APIs ya existen y están probadas.

---

## 5. Conclusión del Discovery

La consolidación es **viable con bajo riesgo** porque:

1. **Las APIs ya existen** y ya están siendo consumidas por ambos módulos
2. **Los componentes base ya existen** (MedicalHistoryTab, TreatmentHistoryTab) y se reutilizan
3. El único delta real es agregar 2 tabs nuevos (Exploraciones, Notas Clínicas) a `PatientDetail`
4. La transición de Historial Clínico es incremental (banner → redirect → cleanup)
5. No se requieren cambios de schema, migraciones, ni nuevas APIs

**Lo que NO debe hacerse en PR #4** (scope guard):
- ❌ Timeline cronológico unificado
- ❌ Galería de fotos independiente
- ❌ Eliminar código legacy de Historial Clínico (solo banner + redirect)
- ❌ Drag & drop en tabs
- ❌ Refactor mayor de PatientDetail
