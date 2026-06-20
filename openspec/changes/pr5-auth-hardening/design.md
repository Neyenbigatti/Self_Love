# Design: PR #5 — Authentication Hardening + Email Infrastructure

## Technical Approach

Migrar el registro público a un flujo bloqueante con verificación de email, tabla separada `verification_tokens`, infraestructura Resend reutilizable, y defensa en profundidad contra registro de profesionales. PR #5 entrega schema + registro + verificación; PR #6 agrega recovery.

---

## Architecture Decisions

### D1 — Carpeta lib/auth/ (extraer de lib/auth.ts)

```
lib/
├── auth/
│   ├── tokens.ts         ← crypto helpers (generateToken, hashToken, verifyToken)
│   ├── session.ts        ← createToken, verifyToken (JWT), getSession, cookieOptions
│   └── password-reset.ts ← (PR #6: generateResetToken, validateResetToken)
│
├── email/
│   ├── client.ts         ← Resend singleton
│   ├── verification.ts   ← sendVerificationEmail()
│   └── templates/
│       ├── verification.ts
│       └── password-reset.ts  ← (PR #6)
│
├── env.ts                ← Centralized typed config (NEW)
└── auth.ts               ← Deprecated — re-exports for backward compat
```

**Justificación**: `lib/auth.ts` actual mezcla JWT, session, y cookies. Extraer tokens a `tokens.ts` y JWT/session a `session.ts` separa responsabilidades sin romper imports existentes (el auth.ts legacy re-exporta). `lib/email/` queda autocontenido para PR #6 reutilice sendPasswordResetEmail().

### D2 — Token Storage: Hashed (SHA-256)

| Aspecto | Plano | Hasheado |
|---------|-------|----------|
| Seguridad DB leak | Token expuesto directamente | Solo hash, token irrecuperable |
| Complejidad | Guardar + comparar directo | SHA-256 + comparar hash(token) |
| Coste | Mínimo | Mínimo (crypto nativo, sin dep) |
| Beneficio SelfLove | — | Si hay leak de verification_tokens, atacante no puede verificar emails ni resetear passwords |

**Decisión: Hashear el token con SHA-256.** El overhead es ~3 líneas de código (crypto.createHash), y el beneficio de seguridad es real: un leak de `verification_tokens` no permite suplantar verificaciones ni reseteos. El token plano solo viaja en el email (URL), nunca persiste.

```
Almacenar:   verification_tokens.token = SHA256(rawToken)
Enviar:      email con link → /verify?token=rawToken
Verificar:   SELECT FROM verification_tokens WHERE token = SHA256(rawToken)
```

### D3 — Configuración Centralizada: lib/env.ts

**Decisión**: Crear `lib/env.ts` con `zod` para validar y tipar todas las env vars.

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // DB
  TURSO_DB_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().default(604800), // 7d en segundos

  // Resend
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().email().default('no-reply@selflove.com'),

  // App
  APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Features
  VERIFICATION_TOKEN_EXPIRY_HOURS: z.coerce.number().default(24),
  RESET_TOKEN_EXPIRY_HOURS: z.coerce.number().default(1),
  RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

**Ubicación**: `lib/env.ts` — se importa donde se necesite. Reemplaza `process.env.JWT_SECRET` inline en `lib/auth.ts` y `middleware.ts`.

**Por qué Zod**: Ya es dependencia del proyecto, validación en startup evita errores silenciosos, tipado automático, valores default.

### D4 — Schema: verification_tokens

```typescript
// lib/db/schema.ts — add
export const verificationTokens = sqliteTable('verification_tokens', {
  id: text('id').primaryKey(),                              // crypto.randomUUID()
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type', { enum: ['email_verification', 'password_reset'] }).notNull(),
  token: text('token').notNull().unique(),                  // SHA256(rawToken)
  expiresAt: text('expires_at').notNull(),                  // ISO 8601
  usedAt: text('used_at'),                                  // null → set on use
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
```

**Migración**: `drizzle-kit push` (el proyecto usa push, no generate).

---

## Data Flow

### Flujo A: Registro → Verificación → Login

```
POST /api/auth/register
  │
  ├─ validate body (name, email, password, phone)
  │    └─ STRIP: role, title, clinicName
  ├─ check duplicate email → 409 si existe
  ├─ hashPassword(password)
  ├─ INSERT users (role='patient')
  ├─ rawToken = crypto.randomUUID()
  ├─ hash = createHash('sha256').update(rawToken).digest('hex')
  ├─ INSERT verification_tokens (type='email_verification', token=hash, expiresAt=+24h)
  ├─ sendVerificationEmail(email, rawToken) via Resend
  │    └─ si falla → log error + continúa (no crashea)
  └─ return 201 { message: "Revisá tu email — te enviamos un link de verificación" }

       ╔══════════════════════════════════════╗
       ║  Usuario revisa su email             ║
       ║  → clic en link:                     ║
       ║    GET /verify?token=rawToken        ║
       ║    → POST /api/auth/verify-email     ║
       ╚══════════════════════════════════════╝

POST /api/auth/verify-email
  │
  ├─ hashInput = createHash('sha256').update(rawToken).digest('hex')
  ├─ SELECT FROM verification_tokens WHERE token=hashInput AND type='email_verification'
  │    └─ no encontrado → 404 "Token inválido"
  │    └─ found && usedAt !== null → 410 "Token ya utilizado"
  │    └─ found && expiresAt < now → 410 "Token expirado. Solicitá un nuevo enlace."
  ├─ UPDATE verification_tokens SET usedAt=now WHERE id=token.id
  └─ return 200 { message: "Email verificado exitosamente" }
  └─ redirect frontend → /auth/login?verified=true

POST /api/auth/login
  │
  ├─ find user by email
  ├─ if NOT EXISTS → 401 "Credenciales inválidas"
  ├─ if !verifyPassword(password, hash) → 401
  ├─ check email_verification token with usedAt set EXISTS
  │    └─ si NO → 403 "Verificá tu email antes de iniciar sesión"
  │                  + { email: user.email } (para que UI ofrezca reenviar)
  ├─ createToken({ sub: user.id, role: user.role })
  ├─ set JWT cookie
  └─ return 200 { user }
```

### Flujo B: Reenvío de Verificación

```
POST /api/auth/resend-verification
  │
  ├─ find user by email (no revelar si existe)
  │    └─ no existe → return 200 { message: "Email reenviado" } ← anti-enumeration
  ├─ if email ya verificado (token usado existe) → return 200 mismo msg
  ├─ CHECK cooldown: last verification token createdAt > (now - 60s) → 429
  ├─ UPDATE previos tokens no usados → SET usedAt=now (invalidar)
  ├─ generar nuevo rawToken + hash
  ├─ INSERT nuevo verification_tokens (type='email_verification', 24h)
  ├─ sendVerificationEmail(email, newRawToken)
  └─ return 200 { message: "Email reenviado" }
```

---

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `lib/db/schema.ts` | Modificar | Agregar `verificationTokens` table |
| `lib/env.ts` | **Crear** | Config centralizada con Zod |
| `lib/auth.ts` | Modificar | Delegar a lib/auth/session.ts + lib/auth/tokens.ts |
| `lib/auth/tokens.ts` | **Crear** | generateToken(), hashToken(), verifyTokenInDb() |
| `lib/auth/session.ts` | **Crear** | createToken, verifyToken (JWT), getSession, cookieOptions |
| `lib/email/client.ts` | **Crear** | Resend singleton |
| `lib/email/verification.ts` | **Crear** | sendVerificationEmail() |
| `lib/email/templates/verification.ts` | **Crear** | HTML template inline |
| `app/api/auth/register/route.ts` | Modificar | role='patient' forzado + blocking flow + email |
| `app/api/auth/login/route.ts` | Modificar | Check email verified → 403 si no |
| `app/api/auth/me/route.ts` | Modificar | Incluir emailVerified |
| `app/api/auth/verify-email/route.ts` | **Crear** | Validar token + marcar usado |
| `app/api/auth/resend-verification/route.ts` | **Crear** | Reenviar email con cooldown |
| `middleware.ts` | Modificar | Usar JWT_SECRET desde lib/env.ts |
| `components/auth/register-form.tsx` | Modificar | Sacar toggle profesional |
| `.env` | Modificar | Agregar RESEND_API_KEY, APP_URL |
| `.env.example` | Modificar | Idem |
| `package.json` | Modificar | Agregar `resend` |

---

## Interfaces / Contracts

```typescript
// lib/auth/tokens.ts
export function generateToken(): { raw: string; hash: string };
export function hashToken(raw: string): string;

// lib/email/client.ts
export function getResendClient(): Resend;

// lib/email/verification.ts
export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<{ success: boolean; error?: string }>;

// API Contracts (OpenAPI-style)

// POST /api/auth/register
// Request:  { name, email, password, phone? }
// Response: 201 { message }
// Note: role, title, clinicName are IGNORED

// POST /api/auth/verify-email
// Request:  { token }
// Response: 200 { message } | 404 | 410

// POST /api/auth/resend-verification
// Request:  { email }
// Response: 200 { message } | 429

// POST /api/auth/login  (modified)
// Response: 403 { error, email? } si email no verificado
```

---

## Testing Strategy

| Capa | Qué testear | Cómo |
|------|------------|------|
| Unit | hashToken(), generateToken() | Vitest, test vectors |
| Unit | sendVerificationEmail() mock | Mock Resend client |
| Integration | POST /api/auth/register | DB assertion: role='patient', token row creado |
| Integration | POST /api/auth/verify-email | Token válido, expirado, ya usado, inválido |
| Integration | POST /api/auth/login con no verificado | Assert 403 + email en body |
| Integration | POST /api/auth/resend-verification | Cooldown, anti-enumeration |

---

## Migration / Rollout

- **PR #5**: `drizzle-kit push` agrega `verification_tokens` table (no destructivo, tabla nueva)
- **Seed**: Agregar verification_tokens row con usedAt set para profesional seed
- **Rollback**: `DROP TABLE verification_tokens` + restaurar register/login routes
- **No feature flag needed** — la verificación es obligatoria desde el deploy

---

## Open Questions

- [ ] (Resolved) Verification blocking vs non-blocking → **Bloqueante** ✅
- [ ] (Resolved) Token plain vs hashed → **SHA-256** ✅

## Estimación de Complejidad

| Componente | Complejidad | Depende de |
|-----------|-------------|-----------|
| Schema + migration | Baja | Nada |
| lib/env.ts | Baja | Zod (ya instalado) |
| lib/auth/tokens.ts | Baja | crypto nativo |
| lib/email/* | Media | Resend API key |
| Register route + blocking | Media | lib/email/, lib/auth/tokens/ |
| Verify-email route | Media | lib/auth/tokens/ |
| Resend route | Media | Cooldown logic |
| Login check | Baja | Verification query |
| UI register form | Baja | Nada |
| PR #6 (recovery) | Media | lib/email/, lib/auth/tokens/ |

**Riesgo general**: Medio (dependencia de Resend como servicio externo).
