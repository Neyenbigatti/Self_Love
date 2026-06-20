# Tasks: PR #5 — Auth Hardening + Email Infrastructure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250–300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Schema & Config

- [x] 1.1 Add `verificationTokens` table to `lib/db/schema.ts` (id, userId, type, token, expiresAt, usedAt, createdAt)
- [x] 1.2 Create `lib/env.ts` — Zod-validated env vars (DB, JWT, Resend, App, feature flags)
- [x] 1.3 Update `.env` and `.env.example` — add `RESEND_API_KEY`, `APP_URL`, `RESEND_FROM`, `VERIFICATION_TOKEN_EXPIRY_HOURS`, `RESEND_COOLDOWN_SECONDS`

## Phase 2: Auth Helpers

- [x] 2.1 Create `lib/auth/tokens.ts` — `generateToken()`, `hashToken()`, `verifyTokenInDb()`
- [x] 2.2 Create `lib/auth/session.ts` — extract `createToken()` (JWT), `verifyToken()`, `getSession()`, `cookieOptions` from `lib/auth.ts`
- [x] 2.3 Update `lib/auth.ts` — re-export from `./auth/session` and `./auth/tokens` for backward compat
- [x] 2.4 Update `middleware.ts` — import `JWT_SECRET` from `lib/env.ts` instead of `process.env`

## Phase 3: Email Infrastructure

- [x] 3.1 Add `resend` to `package.json` (`npm install resend`)
- [x] 3.2 Create `lib/email/client.ts` — Resend singleton with `getResendClient()`
- [x] 3.3 Create `lib/email/templates/verification.ts` — inline HTML template for verification email
- [x] 3.4 Create `lib/email/verification.ts` — `sendVerificationEmail(email, token)` with error logging (no crash)

## Phase 4: Registration Restriction

- [x] 4.1 Update `app/api/auth/register/route.ts` — strip `role`/`title`/`clinicName`, force `role='patient'`, generate token, send email, return `{ message }` without JWT
- [x] 4.2 Update `components/auth/register-form.tsx` — remove professional/patient toggle, remove `title`/`clinicName` fields

## Phase 5: Verification API

- [x] 5.1 Create `app/api/auth/verify-email/route.ts` — hash input token, query DB, handle invalid/expired/used (404/410), set `usedAt`, return 200
- [x] 5.2 Create `app/api/auth/resend-verification/route.ts` — anti-enumeration (200 always), 60s cooldown (429), invalidate old tokens, generate new, send email

## Phase 6: Login Enforcement

- [x] 6.1 Update `app/api/auth/login/route.ts` — check `verification_tokens` for used email token before JWT issue; return 403 `"Verificá tu email"` + email field
- [x] 6.2 Update `app/api/auth/me/route.ts` — add `emailVerified` boolean to response

## Phase 7: Seed & Migration

- [x] 7.1 Migration SQL generated at `lib/db/migrations/0001_add_verification_tokens.sql`. ⚠️ `drizzle-kit push` no disponible desde este entorno — ejecutar localmente. ⚠️ **BLOCKED: Turso unreachable from this environment. Migration SQL generated at `lib/db/migrations/0001_*.sql`. Run `npx drizzle-kit push` locally.**
- [x] 7.2 Update `lib/db/seed.ts` — add pre-verified `verification_tokens` entry for `dra.uncal@selflove.com` with `usedAt` set

## Phase 8: QA / Verification

- [x] 8.1 `npx tsc --noEmit` — zero type errors ✅
- [x] 8.2 `npm run build` — zero build errors ✅
- [ ] 8.3 Manual smoke: register patient → "Revisá tu email" (no JWT)
- [ ] 8.4 Manual smoke: login before verify → 403 + email field
- [ ] 8.5 Manual smoke: verify email link → 200
- [ ] 8.6 Manual smoke: login after verify → 200 + JWT
- [ ] 8.7 Manual smoke: resend verification → new token, old invalidated
- [ ] 8.8 Manual smoke: resend cooldown → 429
- [ ] 8.9 Manual smoke: register with professional fields → created as patient
- [ ] 8.10 Manual smoke: seed professional login → no verification required
