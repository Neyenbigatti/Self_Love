# Password Recovery Specification

## Purpose

Recuperación de contraseña para pacientes (y futuros profesionales) mediante email con token seguro, expiración de 1 hora y reutilización de `verification_tokens` existente.

---

## Requirements

### R1: Forgot Password — Solicitud de Recuperación

The system MUST allow any user to request a password reset by submitting their email. The response MUST be identical regardless of whether the email exists in the system.

#### Scenario: Email exists — successful request

- GIVEN a registered user with email `paciente@example.com`
- WHEN they submit POST /api/auth/forgot-password with `{ email: "paciente@example.com" }`
- THEN ALL existing `password_reset` tokens for this user with `usedAt IS NULL` are marked as used (usedAt = now)
- AND a new password reset token is generated with 1-hour expiry
- AND the token (SHA-256 hashed) is stored in `verification_tokens` with `type = 'password_reset'`
- AND a reset email is sent via Resend with a link containing the raw token
- AND the response returns 200 with `{ message: "Si el email está registrado, recibirás un enlace" }`

#### Scenario: Email does not exist — anti-enumeration

- GIVEN an email `no-existe@example.com` not registered in the system
- WHEN they submit POST /api/auth/forgot-password with that email
- THEN the server returns 200 with `{ message: "Si el email está registrado, recibirás un enlace" }`
- AND no token is created
- AND no email is sent
- AND the response is IDENTICAL to the success case (same status, same body)

#### Scenario: Multiple requests — only last token valid

- GIVEN a user who requested 3 password resets without using any
- WHEN they submit POST /api/auth/forgot-password a third time
- THEN all 3 previous tokens are invalidated (usedAt = now)
- AND only the 4th (new) token is active
- AND only the last email contains a valid link

#### Scenario: Request for already verified user

- GIVEN a user whose email is verified
- WHEN they submit POST /api/auth/forgot-password
- THEN the flow proceeds normally (same as R1 success)
- AND a reset token is generated and emailed

---

### R2: Password Reset Token — Validación

The system MUST validate password reset tokens with strict checks: existence, expiration, single-use, and type scoping.

#### Scenario: Valid token within expiry

- GIVEN a `password_reset` token created less than 1 hour ago with `usedAt IS NULL`
- WHEN the user submits POST /api/auth/reset-password with the raw token and a valid password
- THEN the token is found, validated, and consumed
- AND the password is updated
- AND the response returns 200

#### Scenario: Invalid token (does not exist)

- GIVEN a raw token that does not match any `verification_tokens` row
- WHEN the user submits POST /api/auth/reset-password with this token
- THEN the server returns 404 with `{ error: "Token inválido" }`
- AND no password is changed

#### Scenario: Expired token

- GIVEN a `password_reset` token created more than 1 hour ago with `usedAt IS NULL`
- WHEN the user submits POST /api/auth/reset-password with this token
- THEN the server returns 410 with `{ error: "Token expirado. Solicitá un nuevo enlace." }`
- AND no password is changed

#### Scenario: Already used token

- GIVEN a `password_reset` token with `usedAt` already set
- WHEN the user submits POST /api/auth/reset-password with this token
- THEN the server returns 410 with `{ error: "Token ya utilizado" }`
- AND no password is changed

#### Scenario: Token of wrong type (email_verification)

- GIVEN a valid `email_verification` token that exists in the database
- WHEN the user submits POST /api/auth/reset-password with this token
- THEN the server returns 404 with `{ error: "Token inválido" }`
- AND no password is changed
- AND the email_verification token is NOT consumed

---

### R3: Reset Password — Cambio de Contraseña

The system MUST update the password hash only after successful token validation. The new password MUST follow the same validation rules as registration.

#### Scenario: Valid password with valid token

- GIVEN a valid, unexpired, unused `password_reset` token
- WHEN the user submits POST /api/auth/reset-password with `{ token, password: "nuevaPass123" }`
- THEN the token is validated and consumed (usedAt = now)
- AND the new password is hashed with bcryptjs (same as register)
- AND the user's `passwordHash` is updated in the database
- AND the response returns 200 with `{ message: "Contraseña actualizada exitosamente" }`

#### Scenario: Password too short

- GIVEN any token (valid or not)
- WHEN the user submits a password shorter than 6 characters
- THEN the server returns 400 with `{ error: "La contraseña debe tener al menos 6 caracteres" }`
- AND the token is NOT consumed
- AND the password is NOT changed

#### Scenario: Empty password

- GIVEN any token
- WHEN the user submits an empty password
- THEN the server returns 400 with validation error
- AND the token is NOT consumed

---

### R4: Token Invalidation — Un Token Activo por Usuario

The system MUST ensure at most one active `password_reset` token per user at any time.

#### Scenario: New request invalidates all previous

- GIVEN a user with 2 active `password_reset` tokens (usedAt IS NULL)
- WHEN they submit a new forgot-password request
- THEN both previous tokens have `usedAt` set to now
- AND exactly one new token is created with `usedAt IS NULL`
- AND a query for active password_reset tokens for this user returns exactly 1 row

#### Scenario: Token used — no active tokens remain

- GIVEN a user who used their password_reset token successfully
- WHEN they query active tokens
- THEN there are zero `password_reset` tokens with `usedAt IS NULL` for this user
- AND a new forgot-password request creates a fresh token normally

---

### R5: Email Delivery

The system MUST send password reset emails via Resend and handle delivery failures gracefully without crashing the request.

#### Scenario: Email sent successfully

- GIVEN a forgot-password request for an existing user
- WHEN the token is generated and stored
- THEN `sendPasswordResetEmail(email, rawToken, userName)` is called
- AND the email contains:
  - A greeting with the user's name
  - A link: `{APP_URL}/auth/reset-password?token={rawToken}`
  - Expiry notice: "Este enlace expira en 1 hora"
  - Clinic branding (SelfLove)
- AND the response returns 200

#### Scenario: Email delivery failure

- GIVEN Resend is unavailable or returns an error
- WHEN the email sending fails
- THEN the error is logged with `console.error`
- AND the request STILL returns 200 (the token was created, user can retry)
- AND the flow is NOT blocked by email failure

#### Scenario: Email template structure

- GIVEN a password reset email
- THEN the HTML MUST include:
  - Subject: "Restablecé tu contraseña — SelfLove"
  - User's first name
  - Reset link with raw token as query parameter
  - Expiry notice (1 hour)
  - "Si no solicitaste este cambio, ignorá este mensaje" security notice
  - Clinic name and branding

---

### R6: Security

| Requirement | Specification |
|------------|---------------|
| Token hashing | SHA-256 of raw token stored in DB; raw token ONLY in email URL |
| Single-use | `usedAt` set on successful reset; subsequent attempts return 410 |
| Expiry | 1 hour hard limit; expired tokens return 410 |
| Anti-enumeration | Forgot-password returns 200 for both existing and non-existing emails |
| User existence | Never reveal whether an email is registered (forgot-password, same message) |
| Token type scoping | Verify `type = 'password_reset'` before processing; email_verification tokens are rejected |

---

### R7: UX

#### Forgot Password Form

- Input: email field only
- Submit: "Enviar enlace de recuperación"
- Success: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña"
- Back link: "Volver a Iniciar Sesión"
- Error: generic error message (no reveal email status)
- Must be accessible from login form via "¿Olvidaste tu contraseña?" link

#### Reset Password Form

- Accessed via: `/auth/reset-password?token={rawToken}`
- Inputs: Nueva contraseña + Confirmar contraseña
- Validation: matching confirmation, minimum length (same as register)
- Submit: "Restablecer contraseña"
- Success: "Contraseña actualizada exitosamente" + link to login
- Error (token issues): "Token inválido / expirado / ya utilizado" + link to forgot-password
- Error (validation): inline field errors (same style as register)

#### Flow from Login

- Login form has existing "¿Olvidaste tu contraseña?" link → opens forgot-password form
- Forgot-password form has "Volver a Iniciar Sesión" link
- Reset-password success has "Ir a Iniciar Sesión" link
- AuthCard gets modes: `login`, `register`, `forgot`, `reset`

---

### R8: QA Scenarios

| # | Test | Given | When | Then |
|---|------|-------|------|------|
| 8.1 | Full success | Registered user | Forgot → email → reset with valid token | 200 + login works with new password |
| 8.2 | Invalid token | — | POST /reset-password with fake token | 404 "Token inválido" |
| 8.3 | Expired token | Token older than 1h | POST /reset-password with it | 410 "Token expirado" |
| 8.4 | Used token | Token already consumed | POST /reset-password with it | 410 "Token ya utilizado" |
| 8.5 | Short password | Valid token | Reset with password < 6 chars | 400 validation |
| 8.6 | Multiple requests | User requests 3 resets | Use the last link | First 2 tokens invalidated, only 3rd works |
| 8.7 | Anti-enumeration | Non-existent email | POST /forgot-password | 200 same message, no email sent |
| 8.8 | token type mismatch | email_verification token | POST /reset-password with it | 404 "Token inválido", token NOT consumed |
| 8.9 | Build | — | `npx tsc --noEmit` | 0 errors |
| 8.10 | Build | — | `npm run build` | 0 errors |
