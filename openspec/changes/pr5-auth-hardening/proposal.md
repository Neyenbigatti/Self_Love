# Proposal: PR #5 — Authentication Hardening + Email Infrastructure

## Intent

Preparar SelfLove para usuarios reales: registro seguro de pacientes, verificación de email obligatoria, recuperación de contraseña, e infraestructura de email reutilizable con Resend.

## Decisiones Arquitectónicas

### D1 — Verificación de Email: Bloqueante
Registro → crea usuario + token → NO emite JWT → pantalla "Revisá tu email" → login solo después de verificar.
**Por qué**: SelfLove es una clínica real con costo de no-show por email inválido. La fricción es marginal (emails llegan en segundos) y se mitiga con botón de reenvío.

### D2 — Tokens: Tabla Separada (verification_tokens)
| Columna | Tipo | Notas |
|---------|------|-------|
| id | text PK | UUID |
| userId | text FK→users | Dueño del token |
| type | text | `email_verification` \| `password_reset` |
| token | text UNIQUE | crypto.randomUUID() |
| expiresAt | text | ISO 8601 |
| usedAt | text nullable | Se setea al consumir |
| createdAt | text | Default now |

**Por qué**: Schema más limpio, auditoría, cleanup simple (DELETE), múltiples tokens simultáneos, separación de concerns.

### D3 — Restricción de Registro (Defensa en Profundidad)
1. Sacar toggle Profesional/Paciente de UI (`register-form.tsx`)
2. Ignorar `role` del body en register route
3. Forzar `role = 'patient'` server-side
4. No aceptar `title`, `clinicName` del cliente
5. Seed/admin scripts = única vía para crear profesionales

### D4 — Infraestructura Email (Resend)
- `lib/email.ts`: cliente singleton, `sendVerificationEmail()`, `sendPasswordResetEmail()`, loguear errores sin crashear
- `lib/email-templates.ts`: templates HTML inline (sin React Email/MJML por ahora)
- `.env` + `.env.example`: `RESEND_API_KEY`
- From: `SelfLove <no-reply@selflove.com>`

## Scope

### In Scope
- Schema: `verification_tokens` table (Drizzle schema + migration)
- Registro: role='patient' forzado, sin JWT, redirect a "Revisá tu email"
- Resend: instalación, helpers, templates
- `POST /api/auth/verify-email`: validar token + emailVerified implícito
- `POST /api/auth/forgot-password`: generar token + email
- `POST /api/auth/reset-password`: validar token + hashear nueva password
- UI: register sin toggle, login con link a forgot, forgot/reset forms
- `GET /api/auth/me`: agregar `emailVerified` al response

### Out of Scope
- Panel admin para crear profesionales (futuro)
- Rate limiting (flag para futuro)
- 2FA / MFA
- OAuth / login social
- React Email / MJML
- Notificaciones de turnos (PR #7 futuro)

## Capabilities

### New
- `patient-auth`: Registro de pacientes con verificación de email obligatoria y recuperación de contraseña vía Resend

### Modified
- None (no existing auth spec)

## Estrategia de PRs

| PR | Scope | Est. líneas | Riesgo |
|----|-------|-------------|--------|
| **#5** | Schema + Registration Restriction + Blocking Verification + Resend | ~200 | Medio |
| **#6** | Password Recovery (forgot + reset routes + UI) | ~200 | Medio |
| **#7** | Future: notificaciones de turnos, recordatorios | — | — |

## Affected Areas

| Área | Tipo | Archivos |
|------|------|----------|
| Schema | Modified | `lib/db/schema.ts` |
| Auth API | Modified | `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/me/route.ts` |
| Auth API | New | `app/api/auth/verify-email/route.ts`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts` |
| Email | New | `lib/email.ts`, `lib/email-templates.ts` |
| UI | Modified | `components/auth/register-form.tsx`, `components/auth/login-form.tsx`, `components/auth/auth-card.tsx` |
| UI | New | `components/auth/forgot-password-form.tsx`, `components/auth/reset-password-form.tsx` |
| Config | Modified | `.env`, `.env.example`, `package.json` |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Resend caído / misconfig | Baja | Error logueado, no crashea request; botón reenviar |
| Token leak en logs/URL | Baja | Single-use, 1h expiry, HTTPS en prod |
| Fricción verificación | Media | Botón reenviar; profesional asiste en clínica |
| Lockout profesionales | Baja | Seed + admin scripts siguen funcionando |

## Rollback Plan

- **PR #5**: dropear `verification_tokens`, restaurar register route + UI toggle desde git
- **PR #6**: revertir rutas forgot/reset, restaurar login-form desde git

## Dependencias

- Resend API Key ✅ (ya creada y activa)
- Config DNS del dominio (DKIM/SPF en dashboard de Resend)

## Success Criteria

- [ ] Registro público crea solo `role='patient'` — forzado server-side
- [ ] Email sin verificar → login bloqueado con mensaje claro
- [ ] Link de verificación → token válido → login permitido
- [ ] Forgot password → email con reset link
- [ ] Reset password → nueva hash funcional, token invalidado
- [ ] `GET /api/auth/me` incluye `emailVerified`
- [ ] `npx tsc --noEmit` = 0 errores
- [ ] `npm run build` = 0 errores
