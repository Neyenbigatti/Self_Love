# Proposal: PR #6 — Password Recovery

## Intent

Permitir que pacientes (y futuro profesionales) recuperen su contraseña de forma segura mediante email, reutilizando la infraestructura de Resend y `verification_tokens` existente de PR #5.

## Decisiones Arquitectónicas (Aprobadas en Discovery)

### D1 — Token Storage
Reutilizar `verification_tokens` con `type = 'password_reset'`. Sin nuevas tablas, sin cambios de schema.

### D2 — Expiración
1 hora (`RESET_TOKEN_EXPIRY_HOURS = 1` en `lib/env.ts`).

### D3 — Anti-enumeration
Forgot Password responde **exactamente igual** para email existente e inexistente: `200 { message: "Si el email está registrado, recibirás un enlace" }`.

### D4 — Invalidación de tokens anteriores
Al solicitar un nuevo reset, **invalidar TODOS** los `password_reset` activos del usuario:
```sql
UPDATE verification_tokens SET usedAt = now()
WHERE userId = ? AND type = 'password_reset' AND usedAt IS NULL
```
Luego insertar el nuevo. Objetivo: 1 usuario → 1 reset token activo máximo.

### D5 — Validación de contraseña
Reutilizar EXACTAMENTE las mismas reglas que Register (mínimo 6/8 caracteres, misma validación). No crear reglas distintas.

### D6 — Single-use token
Una vez usado (password actualizada), el token se marca como `usedAt` y no puede reutilizarse.

## Scope

### In Scope
- `lib/email/templates/password-reset.ts` — template HTML
- `lib/email/password-reset.ts` — `sendPasswordResetEmail()` helper
- `POST /api/auth/forgot-password` — solicitud de recuperación
- `POST /api/auth/reset-password` — cambio de contraseña
- `components/auth/forgot-password-form.tsx` — formulario email
- `components/auth/reset-password-form.tsx` — formulario nueva pass
- `components/auth/auth-card.tsx` — agregar modos `forgot` y `reset`
- `components/auth/login-form.tsx` — wirear botón existente "¿Olvidaste tu contraseña?"

### Out of Scope
- Rate limiting en forgot-password (flag futuro)
- Email de confirmación post-reset (opcional, diferible)
- 2FA / MFA
- Notificaciones de turnos (PR #7)
- Modificaciones a schema, config, helpers de auth, login, register, verify-email, resend-verification

## Capabilities

### New
- `password-recovery`: Solicitud de recuperación de contraseña vía email con token seguro + cambio de contraseña con validación de token

### Modified
- none

## Approach

Reutilizar `verification_tokens` con `type = 'password_reset'`. El flujo es idéntico a verify-email pero con expiración de 1h. Los helpers `generateToken()`, `hashToken()`, `verifyTokenInDb()` ya soportan el type param — solo se pasan como argumento.

### Flujo Forgot Password
```
POST /api/auth/forgot-password { email }
  → buscar user (no revelar existencia)
  → si existe:
      → invalidar TODOS los tokens password_reset activos (usedAt = now)
      → generar rawToken + SHA-256
      → INSERT verification_tokens (type='password_reset', 1h)
      → sendPasswordResetEmail(email, rawToken, userName)
  → return 200 { message: "Si el email está registrado, recibirás un enlace" }
```

### Flujo Reset Password
```
POST /api/auth/reset-password { token, password }
  → validar password (mismas reglas que register)
  → hashInput = SHA-256(token)
  → verifyTokenInDb(hashInput, 'password_reset')
      → null → 404 "Token inválido"
      → usedAt set → 410 "Token ya utilizado"
      → expired → 410 "Token expirado"
  → UPDATE verification_tokens SET usedAt = now
  → hashPassword(password)
  → UPDATE users SET passwordHash = hash WHERE id = token.userId
  → return 200 { message: "Contraseña actualizada exitosamente" }
```

## Affected Areas

| Área | Tipo | Archivos |
|------|------|----------|
| Email | Crear | `lib/email/templates/password-reset.ts` |
| Email | Crear | `lib/email/password-reset.ts` |
| API | Crear | `app/api/auth/forgot-password/route.ts` |
| API | Crear | `app/api/auth/reset-password/route.ts` |
| UI | Crear | `components/auth/forgot-password-form.tsx` |
| UI | Crear | `components/auth/reset-password-form.tsx` |
| UI | Modificar | `components/auth/auth-card.tsx` |
| UI | Modificar | `components/auth/login-form.tsx` |

## Casos de Uso

### CU-01: Solicitud de recuperación exitosa
Email existe → token generado → email enviado → 200

### CU-02: Solicitud de recuperación — email inexistente
Mismo 200, mismo mensaje. No se genera token, no se envía email.

### CU-03: Solicitud múltiple (2 veces antes de usar)
Segunda solicitud invalida el primer token. Solo el último link funciona.

### CU-04: Reset exitoso
Token válido → password actualizada → token invalidado → 200

### CU-05: Reset con token inválido
Token que no existe en DB → 404 "Token inválido"

### CU-06: Reset con token expirado
Token con expiresAt < now → 410 "Token expirado"

### CU-07: Reset con token ya usado
Token con usedAt set → 410 "Token ya utilizado"

### CU-08: Reset con contraseña inválida
Password < 6 caracteres → 400 con validación (misma que register)

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Abuso forgot-password (email bombing) | Media | Sin rate limit — flag futuro |
| Token leak | Baja | SHA-256, 1h expiry, single-use |
| Resend downtime | Baja | Error logueado sin crash |

## Rollback Plan
Revertir commits de PR #6: 2 rutas nuevas + 1 template + 2 forms + 2 modificaciones UI.

## Dependencias
- Resend API Key ✅ (operativa desde PR #5)
- `lib/email/client.ts` ✅ (singleton listo)
- `lib/env.ts` ✅ (RESET_TOKEN_EXPIRY_HOURS ya definido)
- `lib/auth/tokens.ts` ✅ (helpers reutilizables)

## Success Criteria
- [ ] Forgot password con email existente → 200 + email enviado
- [ ] Forgot password con email inexistente → 200 mismo mensaje
- [ ] Solicitud múltiple → solo último token válido
- [ ] Reset password con token válido → password actualizada + 200
- [ ] Reset con token inválido → 404
- [ ] Reset con token expirado → 410
- [ ] Reset con token usado → 410
- [ ] Reset con password corta → 400 (misma regla que register)
- [ ] `npx tsc --noEmit` = 0 errores
- [ ] `npm run build` = 0 errores
