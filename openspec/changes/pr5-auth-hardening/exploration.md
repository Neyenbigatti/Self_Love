## Exploration: PR#5 — Authentication Hardening + Email Infrastructure

### Current State

**Registration flow** (`POST /api/auth/register`):
- Accepts `{ name, email, password, phone, role, title, clinicName }` from request body
- Validates `role` against `['patient', 'professional']` — trusts the client completely
- Creates user with the provided role — NO server-side enforcement of public registration restrictions
- Creates JWT session immediately after registration (auto-login)
- No email verification step

**Login flow** (`POST /api/auth/login`):
- Accepts `{ email, password }`, verifies against bcryptjs hash
- Creates JWT (jose, HS256, 7-day expiry) stored in httpOnly cookie named `session`
- No check for email verification before allowing login
- No "remember me" extended expiry implementation (the UI checkbox exists but is unused on the backend)

**Session management**:
- `/api/auth/me` reads cookie, verifies JWT, queries full user from DB
- `/api/auth/logout` clears the session cookie
- `middleware.ts` protects `/dashboard` (professional-only) and `/patient` (patient-only), but allows ALL `/api/auth/*` routes through — including sensitive operations

**Schema** (`users` table):
- Columns: `id, email, passwordHash, name, phone, role, avatar, dateOfBirth, gender, address, notes, title, clinicName, createdAt`
- NO `emailVerified` column
- NO `verificationToken` column
- NO `resetToken` / `resetTokenExpires` columns

**Email infrastructure**:
- `resend` package is NOT installed
- No email-related env vars (no `RESEND_API_KEY`)
- No email sending utilities or templates

**UI registration** (`components/auth/register-form.tsx`):
- Has a "Me registro como" toggle between `patient` and `professional`
- Sends `role: userType` directly to the API
- On success, redirects to `/dashboard` or `/patient` based on role
- The "¿Olvidaste tu contraseña?" link in `login-form.tsx` exists but currently does nothing

---

### Affected Areas

- `lib/db/schema.ts` — add `emailVerified`, `verificationToken`, `resetToken`, `resetTokenExpires` columns to `users` table
- `app/api/auth/register/route.ts` — force `role='patient'` for public registration, optionally block unverified login
- `app/api/auth/login/route.ts` — optionally check `emailVerified` before login
- `app/api/auth/me/route.ts` — include `emailVerified` in response
- `app/api/auth/verify-email/route.ts` — NEW route for email verification
- `app/api/auth/forgot-password/route.ts` — NEW route for password recovery request
- `app/api/auth/reset-password/route.ts` — NEW route for password reset
- `middleware.ts` — consider whether `/api/auth/verify-email` needs to bypass auth
- `lib/auth.ts` — add token generation utilities for verification/reset tokens
- `lib/email.ts` — NEW: Resend client + email sending helpers
- `lib/email-templates/` — NEW: email templates (verification, password reset)
- `components/auth/register-form.tsx` — remove or disable professional registration, add email verification UI
- `components/auth/login-form.tsx` — wire up "forgot password" link
- `components/auth/forgot-password-form.tsx` — NEW
- `components/auth/reset-password-form.tsx` — NEW
- `.env` / `.env.example` — add `RESEND_API_KEY`
- `package.json` — add `resend` dependency
- `components/auth/auth-card.tsx` — add forgot-password/reset-password modes

---

### Schema Changes Needed

**`users` table — add columns:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `emailVerified` | `integer` (boolean) | no | `0` (false) | Whether user confirmed their email |
| `verificationToken` | `text` | yes | null | Token for email verification |
| `resetToken` | `text` | yes | null | Token for password reset |
| `resetTokenExpires` | `text` | yes | null | ISO 8601 expiration for reset token |

**New table `verification_tokens` (alternative approach):**

If we prefer a separate table (cleaner normalization, audit trail):

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | UUID |
| `userId` | `text` FK → users.id | Who owns this token |
| `type` | `text` | `'email_verification'` or `'password_reset'` |
| `token` | `text` | Hashed token (only store hash, not raw) |
| `expiresAt` | `text` | ISO 8601 |
| `usedAt` | `text` nullable | Set when consumed |
| `createdAt` | `text` | Default now |

**Recommendation**: Start with simple columns on `users` for now. A separate table adds unnecessary complexity at this stage. The `users` columns approach keeps it simple and we can extract to a tokens table later if needed.

**Migration strategy**: Since the project uses `drizzle-kit push` (not generate), we add columns to schema.ts and run `npm run db:push`. Production migration via Turso CLI.

---

### API Routes Needed

**Routes to MODIFY:**

| Route | Change |
|-------|--------|
| `POST /api/auth/register` | Force `role = 'patient'`, ignore client-provided role; generate and attach verification token; trigger verification email |
| `POST /api/auth/login` | Optionally reject if `emailVerified === false` (configurable via env flag) |
| `GET /api/auth/me` | Include `emailVerified` in response |

**Routes to CREATE:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/verify-email` | POST | Accept `{ token }`, verify, set `emailVerified = true`, clear `verificationToken` |
| `/api/auth/forgot-password` | POST | Accept `{ email }`, generate reset token, send email with reset link |
| `/api/auth/reset-password` | POST | Accept `{ token, password }`, validate token, update password, clear token |

---

### Approaches

#### Phase A — Patient Registration Restriction

1. **Approach A: Server-side role override (RECOMMENDED)**
   - In `register/route.ts`, replace `role` from body with hardcoded `'patient'`
   - Strip `role`, `title`, `clinicName` from the request processing
   - Only accept those fields from seed/admin scripts, never from public API
   - Pros: Simple, obvious, single point of enforcement, no UI changes needed (though UI professional option becomes misleading)
   - Cons: Professional registration toggle in UI becomes dead UX
   - Effort: **Low** (5-line change in route.ts)

2. **Approach B: Reject professional role at API level**
   - Add check: if `role === 'professional'`, return 403 with message
   - Pros: Clear error feedback, doesn't silently ignore role
   - Cons: Still sends professional fields over the wire, client can still try
   - Effort: **Low**

3. **Approach C: Remove professional UI toggle + server-side enforcement**
   - Remove the professional option from `register-form.tsx` (or hide it)
   - Also enforce server-side
   - Pros: Clean UX, no confusion for patients, defense in depth
   - Cons: More touch points
   - Effort: **Low-Medium**

**Recommendation**: **Approach C** — remove the UI toggle AND enforce server-side. The professional option is misleading for public registration since professionals should only be created via seed/admin. This also prepares for admin panel later.

#### Phase B — Email Verification

1. **Approach A: Auto-send verification on registration (RECOMMENDED)**
   - On register: generate random token (crypto.randomUUID), store in `verificationToken` column, send email via Resend
   - `POST /api/auth/verify-email`: match token, set `emailVerified = true`, clear token
   - JWT is still issued on registration (user is logged in but with `emailVerified: false`)
   - Allow login regardless of verification status initially (configurable later)
   - Pros: Low friction, user can use the app immediately, verification is non-blocking
   - Cons: Unverified users can access the platform
   - Effort: **Medium**

2. **Approach B: Block until verified**
   - On register: create user but DON'T issue JWT. Return success with message "Check your email"
   - On verify: issue JWT and redirect to app
   - Pros: More secure, forces verification before access
   - Cons: Bad UX — user must check email before first use, lost users
   - Effort: **Medium**

3. **Approach C: Hybrid — grace period**
   - Issue JWT but with limited permissions (read-only, no bookings)
   - After verification, full access granted
   - Pros: Best security/UX balance
   - Cons: Most complex, requires JWT claims changes and middleware logic
   - Effort: **High**

**Recommendation**: **Approach A** — it's pragmatic for a medical aesthetics clinic app. Professionals will manage verified users, and requiring verification before ANY use creates too much friction for a booking platform. Make verification non-blocking but visible in UI (show banner "Verify your email").

#### Phase C — Password Recovery

1. **Approach A: Token-based with expiry (RECOMMENDED)**
   - `POST /api/auth/forgot-password`: generate `crypto.randomUUID()`, store in `resetToken` + `resetTokenExpires` (1 hour), send email with link `https://app.selflove.com/auth/reset-password?token=xxx`
   - `POST /api/auth/reset-password`: validate token not expired, hash password, update user, clear tokens
   - Pros: Standard, secure, predictable
   - Cons: Requires email infrastructure (Phase B dependency)
   - Effort: **Medium**

2. **Approach B: Send temp password**
   - Generate temporary password, send it via email, force change on login
   - Pros: No "reset" flow needed
   - Cons: Passwords in email = security anti-pattern
   - Effort: Low (but anti-pattern)
   - **NOT RECOMMENDED**

**Recommendation**: **Approach A** — industry standard. Tokens expire in 1 hour. Store hashed tokens if using a separate table, or rely on `crypto.randomUUID` uniqueness + expiry for the simple approach.

---

### Resend Integration Strategy

**Package**: `npm install resend`

**Client setup** (`lib/email.ts`):

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'SelfLove <no-reply@selflove.com>'; // configure in Resend

export async function sendVerificationEmail(email: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verificá tu correo electrónico — SelfLove',
    html: verificationTemplate(token),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Restablecé tu contraseña — SelfLove',
    html: passwordResetTemplate(token),
  });
}
```

**Templates**: Start with inline HTML strings in `lib/email-templates.ts`. Keep it simple — readable HTML with the clinic's branding. Move to React Email or MJML if complexity grows.

**Environment**: Add `RESEND_API_KEY` to `.env` and `.env.example`.

**Domain**: Resend requires domain verification. Configure `selflove.com` (or the actual domain) in Resend dashboard and add DKIM/SPF records.

**Error handling**: Log email failures but don't crash the request. The registration succeeds even if email sending fails initially (with console error).

---

### Risks

1. **Resend delivery failures** — If Resend is down or misconfigured, users don't get verification/reset emails. Mitigation: graceful error handling, retry on the client side, allow "resend email" button.
2. **Token leakage** — If tokens appear in URL logs or are intercepted via HTTP, accounts can be hijacked. Mitigation: tokens are single-use, short-lived (1 hour for reset), emailed only to the registered address.
3. **Email verification as friction** — For a clinic app, patients may not verify immediately. A soft-verify approach (Approach A) is safer — let them use the app but show a banner.
4. **Professional registration lockout** — After removing professional self-registration, we need a way to create professional accounts. Seed script + future admin panel. Make sure the seed script still works for dev.
5. **Rate limiting** — No rate limiting on forgot-password could allow email bombing. Consider adding basic rate limiting (even if in-memory) or deferring to a future PR.

---

### Proposed PR Strategy

This work naturally splits into **three PRs** to keep changes reviewable:

#### PR #5 — Registration Restriction + Schema Changes
- Add `emailVerified`, `verificationToken`, `resetToken`, `resetTokenExpires` to schema
- Force `role='patient'` in register route
- Remove professional toggle from UI
- Migration: drizzle-kit push
- **Scope**: ~150 lines changed
- **Risk**: Low

#### PR #6 — Resend Integration + Email Verification
- Install `resend` package
- Create `lib/email.ts` with send helpers + templates
- Create `POST /api/auth/verify-email`
- Wire verification email into registration flow
- Add verification banner to UI (future state)
- **Scope**: ~200 lines changed
- **Risk**: Medium (depends on external service)

#### PR #7 — Password Recovery
- Create `POST /api/auth/forgot-password`
- Create `POST /api/auth/reset-password`
- Wire forgot password link in login form
- Create forgot-password UI pages
- **Scope**: ~200 lines changed
- **Risk**: Medium (token handling needs care)

**Total estimated scope**: ~550 lines across 3 PRs — well within the 400-line review budget per slice.

---

### Ready for Proposal
Yes — all code paths have been read and verified. Ready for proposal phase.

Key decisions to document in proposal:
1. Server-enforced role restriction (Approach C)
2. Non-blocking email verification (Approach A)
3. Token-based password recovery (Approach A)
4. Simple columns-on-users approach vs separate tokens table
5. 3-PR split strategy
