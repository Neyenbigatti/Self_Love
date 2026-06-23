# Tasks: PR #6 — Password Recovery

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Email Infrastructure

- [x] 1.1 Create `lib/email/templates/password-reset.ts` — inline HTML template with reset link, expiry notice, security notice, clinic branding
- [x] 1.2 Create `lib/email/password-reset.ts` — `sendPasswordResetEmail(email, token, name)` using `getResendClient()`, log error without crashing

## Phase 2: Forgot Password API

- [x] 2.1 Create `app/api/auth/forgot-password/route.ts` — find user by email (normalized), anti-enumeration (200 always for both existent and non-existent), invalidate all active `password_reset` tokens for found user, generate token + SHA-256 hash, insert into `verification_tokens` with type `password_reset` and 1h expiry, send email via Resend, return 200

## Phase 3: Reset Password API

- [x] 3.1 Create `app/api/auth/reset-password/route.ts` — validate password (min 6 chars, same rules as register), SHA-256 hash input token, find matching `password_reset` token via `verifyTokenInDb()`, check null→404, usedAt set→410, expired→410, mark token usedAt=now, hash new password with bcryptjs, update `users.passwordHash`, return 200

## Phase 4: UI Forms

- [x] 4.1 Create `components/auth/forgot-password-form.tsx` — email input only, submit calls `POST /api/auth/forgot-password`, success/info message, "Volver a Iniciar Sesión" link, generic error (no reveal email status)
- [x] 4.2 Create `components/auth/reset-password-form.tsx` — password + confirm inputs, read raw token from `useSearchParams()`, submit calls `POST /api/auth/reset-password` with `{token, password}`, handle 404/410/400 errors with contextual messages, success state with login link

## Phase 5: Auth Navigation

- [x] 5.1 Modify `components/auth/auth-card.tsx` — add `forgot` and `reset` modes, detect `?token=` from URL params to auto-set `reset` mode, render `ForgotPasswordForm` / `ResetPasswordForm` conditionally, pass `onSwitchToLogin` and `onSwitchToForgot` callbacks
- [x] 5.2 Modify `components/auth/login-form.tsx` — add `onSwitchToForgot` prop, wire the existing "¿Olvidaste tu contraseña?" button to call it

## Phase 6: QA / Smoke Tests

- [x] 6.1 `npx tsc --noEmit` — zero errors
- [x] 6.2 `npm run build` — zero errors
- [x] 6.3 Manual: forgot-password with existing email → 200
- [x] 6.4 Manual: forgot-password with non-existing email → 200 (same message, no email sent)
- [x] 6.5 Manual: reset with valid token → 200 + password changed + login works
- [x] 6.6 Manual: reset with invalid token → 404
- [x] 6.7 Manual: reset with expired token → 410
- [x] 6.8 Manual: reset with used token → 410
- [x] 6.9 Manual: reset with short password → 400
- [x] 6.10 Manual: login with new password → 200 + JWT
- [x] 6.11 Manual: login with old password → 401
