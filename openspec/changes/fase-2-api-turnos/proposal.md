# Proposal: Fase 2 — API de Turnos

## Intent

Reemplazar el mock data del calendario dashboard con una API REST real que gestione turnos (appointments), disponibilidad profesional, tipos de tratamiento y búsqueda de pacientes. La UI actual funciona — esta fase conecta el frontend con la base de datos real sin romper la experiencia existente.

## Scope

### In Scope
- API CRUD completa de appointments (GET list, GET by id, POST, PATCH, DELETE)
- API CRUD completa de availability (GET list, POST, PATCH, DELETE)
- API de slots disponibles (GET /availability/slots) que calcula ventanas libres
- API CRUD de treatment-types (GET list, POST, PATCH, DELETE)
- API de patients (GET list con búsqueda) para el dialog de turnos
- Capa de validación Zod para todos los endpoints
- Guards de autorización por rol (professional / patient)
- Helpers de respuesta HTTP (errores estandarizados)
- Actualización del CalendarPage para consumir la API real
- Compatibilidad Date/string: API devuelve strings, frontend parsea con date-fns

### Out of Scope
- Instalación de test runner y tests automatizados (se recomienda pero no se implementa)
- Portal de paciente (Fase 4)
- Notificaciones o recordatorios
- WebSockets / tiempo real
- Integración con calendarios externos (Google Calendar, etc.)
- Pipeline CI/CD

## Capabilities

### New Capabilities
- `appointments-api`: CRUD completo de turnos con filtros por fecha, profesional, estado y validación de superposición horaria
- `availability-api`: Gestión de disponibilidad semanal (reglas por día) y excepciones (bloqueos, feriados)
- `slots-api`: Cálculo de ventanas horarias disponibles para un día específico
- `treatment-types-api`: CRUD de tipos de tratamiento por profesional
- `patients-api`: Búsqueda de pacientes por nombre/email/teléfono

### Modified Capabilities
- Ninguna — es la primera API que no sea de auth

## Approach

### 1. Capa de infraestructura API (`lib/api/`)

**`lib/api/errors.ts`** — helpers de respuesta:
```ts
export function badRequest(message: string) → NextResponse (400)
export function unauthorized(message?: string) → NextResponse (401)
export function forbidden(message?: string) → NextResponse (403)
export function notFound(message?: string) → NextResponse (404)
export function conflict(message: string) → NextResponse (409)
export function serverError(error: unknown) → NextResponse (500)
```

**`lib/api/auth-guard.ts`** — protector de rutas:
```ts
export async function requireRole(session, ...roles: string[])
  → { user: SessionUser } | NextResponse (401/403)
```

### 2. Capa de validación Zod (`lib/api/validators/`)

- **`common.ts`**: `dateStringSchema` (YYYY-MM-DD regex), `timeStringSchema` (HH:mm regex), `uuidSchema`
- **`appointments.ts`**: `createAppointmentSchema`, `updateAppointmentSchema`, `queryAppointmentsSchema`
- **`availability.ts`**: `createAvailabilitySchema`, `updateAvailabilitySchema`
- **`treatments.ts`**: `createTreatmentSchema`, `updateTreatmentSchema`
- **`patients.ts`**: `searchPatientsSchema`

Todos usan `safeParse` y devuelven errores formateados vía `badRequest()`.

### 3. Archivos nuevos y modificados

```
NUEVOS:
  app/api/appointments/route.ts           ← GET list, POST create
  app/api/appointments/[id]/route.ts      ← GET by id, PATCH, DELETE
  app/api/availability/route.ts           ← GET list, POST create
  app/api/availability/slots/route.ts     ← GET slots disponibles
  app/api/availability/[id]/route.ts      ← PATCH, DELETE
  app/api/treatment-types/route.ts        ← GET list, POST create
  app/api/treatment-types/[id]/route.ts   ← PATCH, DELETE
  app/api/patients/route.ts               ← GET search

  lib/api/errors.ts                       ← Helpers HTTP
  lib/api/auth-guard.ts                   ← Guard por roles
  lib/api/validators/common.ts            ← Schemas compartidos
  lib/api/validators/appointments.ts      ← Validación turnos
  lib/api/validators/availability.ts      ← Validación disponibilidad
  lib/api/validators/treatments.ts        ← Validación tratamientos
  lib/api/validators/patients.ts          ← Validación búsqueda pacientes

MODIFICADOS:
  app/dashboard/calendar/page.tsx         ← fetch de API en vez de mock
  lib/db/index.ts                         ← exportar treatmentTypes del schema
```

### 4. Contratos de cada endpoint

#### `GET /api/appointments`

```
Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&professionalId=&status=
Auth:  Professional → filtra por su professionalId
       Patient      → filtra por su patientId
Response 200:
{
  appointments: [{
    id, patientId, patientName (joined), patientAvatar (joined),
    treatmentType, date, startTime, endTime, status, notes, professionalId, createdAt
  }]
}
```

#### `GET /api/appointments/[id]`

```
Auth: Professional → cualquier suyo; Patient → solo propio
Response 200: { appointment: { ... } }
Response 404: { error: "Appointment not found" }
Response 403: si no es dueño del turno
```

#### `POST /api/appointments`

```
Auth: Ambos
Body: {
  patientId: string (required),
  treatmentType: string (required),
  date: string YYYY-MM-DD (required),
  startTime: string HH:mm (required),
  endTime: string HH:mm (required, > startTime),
  notes: string (optional)
}
Validation: time overlap check (mismo professional, misma fecha, rangos que se cruzan)
Behavior: Professional → status='confirmed'
          Patient      → status='pending', professionalId del session
Response 201: { appointment: { ... } }
Response 409: si hay superposición horaria
```

#### `PATCH /api/appointments/[id]`

```
Auth: Ambos con permisos diferenciados
Body (professional): { status?, treatmentType?, date?, startTime?, endTime?, notes? }
Body (patient):      { status: 'cancelled' } — solo puede cancelar sus propios pending/confirmed
Status transitions:
  pending    → confirmed, cancelled, completed
  confirmed  → cancelled, completed
  completed  → ✦ (ninguna transición permitida)
  cancelled  → ✦ (ninguna transición permitida)
Response 200: { appointment: { ... } }
Response 409: transición inválida
```

#### `DELETE /api/appointments/[id]`

```
Auth: Professional only
Response 200: { success: true }
Response 404: no existe
```

#### `GET /api/availability`

```
Query: ?professionalId= (default: session user, si es professional)
Auth:  Professional only
Response 200: { availability: [{ id, professionalId, dayOfWeek, specificDate, startTime, endTime, isAvailable, type, label }] }
```

#### `POST /api/availability`

```
Auth: Professional only
Body: {
  dayOfWeek?: integer 0-6,
  specificDate?: string YYYY-MM-DD,
  startTime: string HH:mm,
  endTime: string HH:mm,
  type: 'regular' | 'break' | 'blocked',
  label?: string,
  isAvailable?: boolean (default: type==='regular')
}
Validation: Al menos uno de dayOfWeek o specificDate
Response 201: { availability: { ... } }
```

#### `GET /api/availability/slots`

```
Query: ?date=YYYY-MM-DD&professionalId=
Auth:  Ambos
Logic:
  1. Buscar reglas de availability para ese día de semana + excepciones para la fecha
  2. Generar slots de 30 min en los rangos regular
  3. Restar breaks y blocked
  4. Restar appointments existentes (confirmed/pending)
  5. Marcar cada slot como available=true/false
Response 200: { slots: [{ time: "09:00", available: true }, ...] }
```

#### `GET /api/treatment-types`

```
Query: ?professionalId=
Auth:  Ambos
Response 200: { treatmentTypes: [{ id, professionalId, name, duration, description, price }] }
```

#### `POST /api/treatment-types`

```
Auth: Professional only
Body: { name: string, duration: integer minutes, description?: string, price?: integer cents }
Response 201: { treatmentType: { ... } }
```

#### `PATCH /api/treatment-types/[id]`

```
Auth: Professional only
Response 200: { treatmentType: { ... } }
```

#### `DELETE /api/treatment-types/[id]`

```
Auth: Professional only
Validation: Rechazar si hay appointments que referencien este treatmentType
Response 200: { success: true }
Response 409: si hay turnos usando este tratamiento
```

#### `GET /api/patients`

```
Query: ?search= (busca en name, email, phone, LIKE %search%)
Auth:  Professional only
Response 200: { patients: [{ id, name, email, phone, avatar }] }
           (sin passwordHash, sin medical history)
```

### 5. Estrategia de validación con Zod

Tres funciones core:

```ts
// lib/api/validators/common.ts
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');
export const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm');
export const uuidString = z.string().min(1, 'Requerido');

// Uso en cada handler
function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { response: badRequest(result.error.issues.map(i => i.message).join(', ')) };
  }
  return { data: result.data };
}
```

Status transitions con mapa explícito:

```ts
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['cancelled', 'completed'],
  completed:  [],
  cancelled:  [],
};
```

### 6. Reglas de permisos por rol

| Endpoint | Professional | Patient |
|----------|-------------|---------|
| `GET /api/appointments` | Sus propios turnos (professionalId=session) | Sus propios turnos (patientId=session) |
| `GET /api/appointments/[id]` | Cualquiera suyo | Solo propio |
| `POST /api/appointments` | Crea con status=confirmed | Crea con status=pending |
| `PATCH /api/appointments/[id]` | Full update | Solo cancelar propio |
| `DELETE /api/appointments/[id]` | ✅ | ❌ |
| `GET /api/availability` | ✅ (default: propio) | ❌ |
| `POST /api/availability` | ✅ | ❌ |
| `PATCH /api/availability/[id]` | ✅ | ❌ |
| `DELETE /api/availability/[id]` | ✅ | ❌ |
| `GET /api/availability/slots` | ✅ | ✅ |
| `GET /api/treatment-types` | ✅ | ✅ |
| `POST /api/treatment-types` | ✅ | ❌ |
| `PATCH /api/treatment-types/[id]` | ✅ | ❌ |
| `DELETE /api/treatment-types/[id]` | ✅ | ❌ |
| `GET /api/patients` | ✅ | ❌ |

### 7. Estrategia Date vs string (sin romper UI)

```
API (response)       →  date: "2026-06-02"  (string ISO)
Frontend Calendar    →  fetch("/api/appointments")
                      →  data.appointments.map(apt => ({
                           ...apt,
                           date: parseISO(apt.date)  // date-fns
                         }))
                      →  setAppointments(transformed)
```

- `parseISO` de date-fns convierte "2026-06-02" a Date object
- `isSameDay(apt.date, selectedDate)` de date-fns funciona con Date objects
- El AppointmentDialog recibe `Partial<Appointment>` — la fecha ya es Date
- En el POST, el dialog envía `date: format(date, 'yyyy-MM-dd')` antes del fetch
- **Cambio mínimo en CalendarPage**: agregar transform en el fetch + wrapper en el save

### 8. Plan de pruebas

Dado que no hay test runner instalado:

**Corto plazo (Fase 2):**
- Verificación manual con `npm run dev`:
  1. Probar GET appointments con seed data
  2. Probar POST creación de turno
  3. Probar PATCH cambio de estado
  4. Probar GET availability/slots con fecha existente
  5. Probar GET patients search
- Build: `npm run build` sin errores
- Type check: `npx tsc --noEmit`

**Recomendado post-Fase 2:**
- Instalar `vitest` + `@testing-library/react`
- Tests unitarios para validators Zod
- Tests de integración para cada endpoint con `fetch` real a `route.ts`
- Agregar script `"test": "vitest"` al package.json

### 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Superposición horaria no detectada | Media | Validación en POST/PATCH: query appointments existentes en misma fecha+profesional que intersecten rangos |
| Status transitions inválidas (ej: completed→cancelled) | Media | Mapa explícito VALID_TRANSITIONS con validación en PATCH |
| Patient accede a turnos de otro patient | Alta | GET filtra por session, GET by id verifica ownership |
| Tratamiento eliminado con turnos activos | Baja | DELETE verifica existencia de appointments referenciando el treatment_type |
| Rotura de UI por cambio de Date→string | Media | Transform layer en el fetch del CalendarPage; test visual manual |
| Performance con muchos turnos | Baja | SQLite local, pocos datos; si escala, agregar paginación después |
| JWT_SECRET en .env.example para producción | Alta | Ya documentado en init; no tocar ahora |

## Rollback Plan

1. Revertir `app/dashboard/calendar/page.tsx` a su estado actual (usa mock data)
2. Eliminar los nuevos archivos en `app/api/appointments/`, `app/api/availability/`, `app/api/treatment-types/`, `app/api/patients/`
3. Eliminar `lib/api/` completo
4. La app vuelve a funcionar con mock data sin migraciones de DB

## Dependencies

- Ninguna externa; Zod ya está en package.json

## Success Criteria

- [ ] `GET /api/appointments` devuelve turnos del seed con patientName y patientAvatar poblados
- [ ] `POST /api/appointments` crea un turno y rechaza superposición horaria
- [ ] `PATCH /api/appointments/[id]` cambia estados respetando transiciones válidas
- [ ] `DELETE /api/appointments/[id]` (professional) elimina el turno
- [ ] `GET /api/availability/slots?date=...` devuelve slots de 30min
- [ ] `GET /api/patients?search=maría` devuelve pacientes filtrados
- [ ] CalendarPage carga turnos desde la API (no mock data)
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run build` exitoso
