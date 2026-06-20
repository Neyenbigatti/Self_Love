# Patient Auth Specification

## Purpose

Registro seguro de pacientes con verificación de email obligatoria y recuperación de contraseña. Define el comportamiento de autenticación para usuarios con rol `patient` en SelfLove.

---

## Requirements

### Requirement: Patient Registration

The registration endpoint MUST create users with `role = 'patient'` only. The server MUST ignore any `role`, `title`, or `clinicName` fields sent by the client. Professional accounts MAY only be created via seed scripts or future admin panel.

#### Scenario: Successful patient registration

- GIVEN a new user with valid name, email, and password
- WHEN they submit POST /api/auth/register
- THEN a user is created with `role = 'patient'`
- AND a verification token is generated and stored in `verification_tokens` with `type = 'email_verification'`
- AND a verification email is sent via Resend to the provided email
- AND the response returns 201 with `{ message: "Revisá tu email" }`
- AND NO JWT session cookie is set

#### Scenario: Registration with professional fields

- GIVEN a registration request with `role = 'professional'`, `title = 'Dra.'`, `clinicName = 'SelfLove'`
- WHEN they submit POST /api/auth/register
- THEN the server ignores those fields
- AND creates the user with `role = 'patient'`

#### Scenario: Duplicate email registration

- GIVEN an existing user with email `paciente@example.com`
- WHEN a new registration attempts with the same email
- THEN the server returns 409 Conflict with `{ error: "El email ya está registrado" }`
- AND NO user is created
- AND NO email is sent

#### Scenario: Invalid email format

- GIVEN a registration with email `not-an-email`
- WHEN they submit POST /api/auth/register
- THEN the server returns 400 with validation error

---

### Requirement: Email Verification Token Expiration

Verification tokens MUST expire after 24 hours. Expired tokens MUST NOT verify the user.

#### Scenario: Verify within expiry

- GIVEN a user with a valid verification token created less than 24 hours ago
- WHEN they submit POST /api/auth/verify-email with `{ token }`
- THEN the token is matched to the user
- AND the token's `usedAt` is set to the current timestamp
- AND the response returns 200 with `{ message: "Email verificado exitosamente" }`

#### Scenario: Verify with expired token

- GIVEN a user with a verification token created more than 24 hours ago
- WHEN they submit POST /api/auth/verify-email with `{ token }`
- THEN the server returns 410 Gone with `{ error: "Token expirado. Solicitá un nuevo enlace." }`
- AND the user's email remains unverified

#### Scenario: Verify with invalid token

- GIVEN a non-existent token
- WHEN they submit POST /api/auth/verify-email with `{ token: "fake-token" }`
- THEN the server returns 404 with `{ error: "Token inválido" }`

#### Scenario: Verify with already-used token

- GIVEN a token that was already used (`usedAt IS NOT NULL`)
- WHEN they submit POST /api/auth/verify-email with that token
- THEN the server returns 410 Gone with `{ error: "Token ya utilizado" }`

---

### Requirement: Resend Verification Email

Users MUST be able to request a new verification email if the previous one expired or was lost. Requesting a resend MUST invalidate the previous token and generate a new one.

#### Scenario: Resend verification email

- GIVEN an unverified user with an expired or lost verification token
- WHEN they submit POST /api/auth/resend-verification with `{ email }`
- THEN the previous verification token for this user is marked as used (if exists)
- AND a new verification token is generated with fresh 24-hour expiry
- AND a new verification email is sent
- AND the response returns 200 with `{ message: "Email reenviado" }`

#### Scenario: Resend for non-existent email

- GIVEN an email not registered in the system
- WHEN they submit POST /api/auth/resend-verification with that email
- THEN the server returns 200 with `{ message: "Email reenviado" }` (same message — prevent email enumeration)
- AND no email is actually sent

#### Scenario: Resend for already verified user

- GIVEN a user whose email is already verified
- WHEN they submit POST /api/auth/resend-verification with their email
- THEN the server returns 200 with `{ message: "Email reenviado" }` (no error — prevent email enumeration)
- AND no email is actually sent

#### Scenario: Resend rate limiting

- GIVEN a user who requested a resend less than 60 seconds ago
- WHEN they submit POST /api/auth/resend-verification again
- THEN the server returns 429 with `{ error: "Esperá 60 segundos antes de reenviar" }`

---

### Requirement: Login with Unverified Email

The login endpoint MUST reject authentication attempts from users whose email has not been verified. The error message MUST NOT reveal whether the email exists (prevent enumeration).

#### Scenario: Login with verified email

- GIVEN a user whose email is verified (`emailVerified = true`, or equivalently, has at least one `email_verification` token with `usedAt` set)
- WHEN they submit POST /api/auth/login with valid credentials
- THEN a JWT session cookie is set
- AND the response returns 200 with user data

#### Scenario: Login with unverified email

- GIVEN a user whose email is NOT verified
- WHEN they submit POST /api/auth/login with valid credentials
- THEN the server returns 403 with `{ error: "Verificá tu email antes de iniciar sesión" }`
- AND no JWT session cookie is set
- AND the response includes `{ email: "user@example.com" }` so the UI can offer a resend option

#### Scenario: Login with non-existent email

- GIVEN an email not registered in the system
- WHEN they submit POST /api/auth/login with any password
- THEN the server returns 401 with `{ error: "Credenciales inválidas" }`
- AND the response does NOT reveal whether the email exists

#### Scenario: Login with wrong password

- GIVEN a registered user with a verified email
- WHEN they submit POST /api/auth/login with the correct email but wrong password
- THEN the server returns 401 with `{ error: "Credenciales inválidas" }`

---

### Requirement: Password Reset Token Expiration

Password reset tokens MUST expire after 1 hour. Expired tokens MUST NOT allow password changes.

#### Scenario: Reset within expiry

- GIVEN a user with a valid password reset token created less than 1 hour ago
- WHEN they submit POST /api/auth/reset-password with `{ token, password: "newPass123" }`
- THEN the password hash is updated
- AND the token's `usedAt` is set
- AND the response returns 200 with `{ message: "Contraseña actualizada" }`

#### Scenario: Reset with expired token

- GIVEN a user with a password reset token created more than 1 hour ago
- WHEN they submit POST /api/auth/reset-password with `{ token, password: "newPass123" }`
- THEN the server returns 410 Gone with `{ error: "Token expirado. Solicitá un nuevo enlace." }`
- AND the password is NOT changed

---

### Requirement: Forgot Password Flow

Users MUST be able to request a password reset email. The response MUST be identical regardless of whether the email exists (prevent enumeration).

#### Scenario: Forgot password for existing email

- GIVEN a registered user with email `paciente@example.com`
- WHEN they submit POST /api/auth/forgot-password with `{ email: "paciente@example.com" }`
- THEN a password reset token is generated with 1-hour expiry
- AND a reset email is sent via Resend with a link containing the token
- AND the response returns 200 with `{ message: "Si el email está registrado, recibirás un enlace" }`

#### Scenario: Forgot password for non-existent email

- GIVEN an email not registered in the system
- WHEN they submit POST /api/auth/forgot-password with that email
- THEN the server returns `{ message: "Si el email está registrado, recibirás un enlace" }`
- AND no token is created
- AND no email is sent

---

### Requirement: Professional Seed Account

The seed professional account MUST bypass email verification. The professional's email is considered implicitly verified.

#### Scenario: Seed professional login

- GIVEN the seed professional user `dra.uncal@selflove.com` created by seed script
- WHEN they submit POST /api/auth/login with valid credentials
- THEN the login succeeds immediately
- AND no verification step is required
- AND a JWT session cookie is set

#### Scenario: Seed professional state

- GIVEN the seed script has run
- THEN the professional user `dra.uncal@selflove.com` exists with `role = 'professional'`
- AND the user has an entry in `verification_tokens` with `type = 'email_verification'` and `usedAt` set (pre-verified)
- AND no verification email is sent during seed

---

### Requirement: Token Cleanup

Expired tokens MUST be periodically cleaned from the `verification_tokens` table to prevent unbounded growth.

#### Scenario: Cleanup behavior

- GIVEN tokens with `expiresAt` older than 7 days (regardless of `usedAt` status)
- WHEN a cleanup operation runs
- THEN those tokens are deleted from the table
- AND active (unexpired) tokens are preserved
