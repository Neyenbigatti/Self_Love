# Design: PR #6 — Password Recovery

## Technical Approach

Reutilizar toda la infraestructura de PR #5: `verification_tokens` con `type = 'password_reset'`, helpers de token, cliente Resend, y configuración. PR #6 agrega 2 endpoints, 2 forms, 1 template email, y conecta el botón "¿Olvidaste tu contraseña?" existente.

---

## Architecture Decisions — Reutilización

| Componente PR #5 | Reutilización en PR #6 |
|-----------------|----------------------|
| `verification_tokens` table | Misma tabla, `type = 'password_reset'` |
| `generateToken()` | `generateToken()` — idéntico |
| `hashToken()` | `hashToken()` — idéntico |
| `verifyTokenInDb(raw, type)` | Misma función, `type = 'password_reset'` |
| `getLatestToken(userId, type)` | Misma función, `type = 'password_reset'` |
| `lib/email/client.ts` | `getResendClient()` — sin cambios |
| `lib/env.ts` | `RESET_TOKEN_EXPIRY_HOURS` ya definido (1h) |
| `hashPassword()` | Misma función de bcryptjs |
| Registro de errores | Mismo patrón: log + no crash |

---

## Token Lifecycle

### Forgot Password

```
POST /api/auth/forgot-password { email }
    │
    ├─ find user by email (normalizado, lowercase)
    │    └─ no existe → return 200 (anti-enumeration — salir acá)
    │
    ├─ INVALIDATE all active password_reset tokens:
    │   UPDATE verification_tokens
    │   SET usedAt = datetime('now')
    │   WHERE userId = user.id
    │     AND type = 'password_reset'
    │     AND usedAt IS NULL
    │
    ├─ GENERATE token:
    │   rawToken = crypto.randomUUID()
    │   hash = createHash('sha256').update(rawToken).digest('hex')
    │
    ├─ INSERT verification_tokens:
    │   id: randomUUID()
    │   userId: user.id
    │   type: 'password_reset'
    │   token: hash
    │   expiresAt: now + RESET_TOKEN_EXPIRY_HOURS * 3600 * 1000
    │   usedAt: NULL
    │
    ├─ SEND email via Resend:
    │   sendPasswordResetEmail(user.email, rawToken, user.name)
    │   └─ on error → console.error + CONTINUE (no crash)
    │
    └─ return 200 { message: "Si el email está registrado, recibirás un enlace" }
```

### Reset Password

```
POST /api/auth/reset-password { token, password }
    │
    ├─ VALIDATE password (mismas reglas que register):
    │   if !password || password.length < 6 → 400 { error }
    │
    ├─ hashInput = createHash('sha256').update(token).digest('hex')
    │
    ├─ FIND token:
    │   SELECT * FROM verification_tokens
    │   WHERE token = hashInput AND type = 'password_reset'
    │   └─ null → 404 { error: "Token inválido" }
    │
    ├─ VALIDATE token:
    │   ├─ usedAt IS NOT NULL → 410 { error: "Token ya utilizado" }
    │   ├─ expiresAt < now → 410 { error: "Token expirado. Solicitá un nuevo enlace." }
    │
    ├─ CONSUME token:
    │   UPDATE verification_tokens SET usedAt = datetime('now') WHERE id = token.id
    │
    ├─ UPDATE password:
    │   newHash = hashPassword(password)
    │   UPDATE users SET passwordHash = newHash WHERE id = token.userId
    │
    └─ return 200 { message: "Contraseña actualizada exitosamente" }
```

---

## Email Architecture

### Template: `lib/email/templates/password-reset.ts`

```typescript
export function passwordResetTemplate(token: string, name: string): string {
  const url = `${env.APP_URL}/auth/reset-password?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Hola ${name},</h2>
      <p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${url}"
         style="display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white;
                text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Restablecer Contraseña
      </a>
      <p style="color: #666; font-size: 14px;">
        Este enlace expira en 1 hora.
        Si no solicitaste este cambio, ignorá este mensaje.
      </p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">SelfLove — Estética Médica Premium</p>
    </body>
    </html>
  `;
}
```

**Subject**: "Restablecé tu contraseña — SelfLove"

### Sender: `lib/email/password-reset.ts`

```typescript
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string,
): Promise<{ success: boolean }> {
  try {
    const client = getResendClient();
    await client.emails.send({
      from: env.RESEND_FROM,
      to: email,
      subject: 'Restablecé tu contraseña — SelfLove',
      html: passwordResetTemplate(token, name),
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false };
  }
}
```

---

## UI Flow

```
AuthCard (mode: 'login')
  │
  ├─ User clicks "¿Olvidaste tu contraseña?"
  │   └─ setMode('forgot')
  │
  ├─ ForgotPasswordForm
  │   ├─ Input: email
  │   ├─ Submit → POST /api/auth/forgot-password
  │   ├─ Success → show "Si el email está registrado, recibirás un enlace"
  │   └─ "Volver a Iniciar Sesión" → setMode('login')
  │
  └─ User opens email link → /auth/reset-password?token=xxx
      └─ setMode('reset')
          └─ ResetPasswordForm
              ├─ Inputs: password + confirm
              ├─ Token de URL → POST /api/auth/reset-password
              ├─ Success → "Contraseña actualizada" + "Ir a Iniciar Sesión"
              │            → setMode('login')
              └─ Error (token issues) → link to forgot-password
```

### AuthCard Modes

```
login ──→ register  (toggle)
login ──→ forgot    ("¿Olvidaste tu contraseña?")
forgot ──→ login    ("Volver a Iniciar Sesión")
reset ──→ login     (success + "Ir a Iniciar Sesión")
```

Reset mode se activa por URL param (no por navegación interna desde auth-card). Implementar con `useSearchParams()` en auth-card para detectar `?token=xxx`.

---

## API Contracts

### `POST /api/auth/forgot-password`

| Aspecto | Detalle |
|---------|---------|
| Request | `{ email: string }` |
| Success | `200 { message: "Si el email está registrado, recibirás un enlace" }` |
| Error | Siempre 200 (anti-enumeration). Si falta email → 400 |

### `POST /api/auth/reset-password`

| Condición | Status | Body |
|-----------|--------|------|
| Token válido + password OK | 200 | `{ message: "Contraseña actualizada exitosamente" }` |
| Token inválido (no existe) | 404 | `{ error: "Token inválido" }` |
| Token expirado | 410 | `{ error: "Token expirado. Solicitá un nuevo enlace." }` |
| Token ya usado | 410 | `{ error: "Token ya utilizado" }` |
| Password < 6 chars | 400 | `{ error: "La contraseña debe tener al menos 6 caracteres" }` |
| Password vacía | 400 | `{ error: "La contraseña es obligatoria" }` |
| Error interno | 500 | `{ error: "Error interno del servidor" }` |

---

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `lib/email/templates/password-reset.ts` | Crear | Template HTML inline |
| `lib/email/password-reset.ts` | Crear | `sendPasswordResetEmail()` |
| `app/api/auth/forgot-password/route.ts` | Crear | Solicitud + invalidación + email |
| `app/api/auth/reset-password/route.ts` | Crear | Validación + hash + update |
| `components/auth/forgot-password-form.tsx` | Crear | Formulario email, anti-enumeration UX |
| `components/auth/reset-password-form.tsx` | Crear | Nueva pass + confirm + token de URL |
| `components/auth/auth-card.tsx` | Modificar | Agregar modos `forgot` y `reset` |
| `components/auth/login-form.tsx` | Modificar | Wirear "¿Olvidaste tu contraseña?" a `onSwitchToForgot` callback |

---

## QA Mapping (Spec → Implementation)

| Spec Req | Implementación |
|----------|---------------|
| R1: Forgot Password | `forgot-password/route.ts` |
| R2: Token Validation | `reset-password/route.ts` + `verifyTokenInDb()` |
| R3: Reset Password | `reset-password/route.ts` + `hashPassword()` |
| R4: Token Invalidation | `forgot-password/route.ts` (UPDATE WHERE usedAt IS NULL) |
| R5: Email Delivery | `lib/email/password-reset.ts` + `lib/email/templates/password-reset.ts` |
| R6: Security | SHA-256 en `tokens.ts`, single-use + expiry en `reset-password/route.ts`, anti-enumeration en `forgot-password/route.ts` |
| R7: UX | `auth-card.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `login-form.tsx` |
| R8: QA | Smoke tests manuales post-apply |

---

## Complexity Estimation

| Component | Complexity | Reuses From PR #5 |
|-----------|-----------|-------------------|
| forgot-password route | Baja | helpers + email client + env |
| reset-password route | Baja | tokens.ts + hashPassword |
| Email template | Baja | Existing pattern |
| ForgotPasswordForm | Baja | Existing form patterns |
| ResetPasswordForm | Baja | Existing form patterns |
| AuthCard modes | Baja | Same component, new mode values |
| **Total** | **Baja** | ~200 líneas |

No open questions — todas las decisiones están cubiertas por PR #5 o por las specs de PR #6.
