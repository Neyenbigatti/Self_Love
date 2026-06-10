# Tasks: M-01A — Mobile Compatibility Foundation (Lite)

## Delivery Strategy

| Field | Value |
|-------|-------|
| Estimated changed lines | ~40 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

## Phase 1: CSS Foundation

- [x] **1.1** Add z-index CSS vars to `:root` in `app/globals.css`: `--z-fab: 40`, `--z-sidebar: 50`, `--z-backdrop: 55`, `--z-dialog: 60`

## Phase 2: Component Changes

- [x] **2.1** `whatsapp-fab.tsx` — replace `z-50` with `z-[var(--z-fab)]`, replace `bottom-6` with inline `style={{bottom:"calc(env(safe-area-inset-bottom,0px)+1.5rem)"}}`
- [x] **2.2** `patient-sidebar.tsx` — backdrop `z-40` → `z-[var(--z-backdrop)]`, panel `z-50` → `z-[var(--z-sidebar)]`
- [x] **2.3** `app/patient/layout.tsx` — add `pb-20 sm:pb-6` to `<main>` className
- [x] **2.4** `appointment-card.tsx` — split date into `sm:hidden` short span (`EEE d MMM`) + `hidden sm:inline` full span (`EEEE, MMMM d, yyyy`)
- [x] **2.5** `appointment-history-card.tsx` — same date split with `es` locale: `EEE d MMM` / `EEEE, d MMMM yyyy`
- [x] **2.6** `app/patient/book/page.tsx` — step 2 CTA container to `flex-col sm:flex-row`, button `w-full sm:w-auto`; step 3 container to `flex-col sm:flex-row-reverse`, both buttons `w-full sm:w-auto`

## Phase 3: Verification (manual)

- [ ] **3.1** Open DevTools device mode (<640px) — verify FAB has safe-area bottom spacing
- [ ] **3.2** Toggle sidebar — verify backdrop covers panel with correct z-ordering
- [ ] **3.3** Open dialog (e.g., cancel appointment) — verify dialog renders above sidebar/backdrop
- [ ] **3.4** Verify CTA buttons in booking flow are full-width on mobile, auto-width on desktop
- [ ] **3.5** Verify date format is short (`EEE d MMM`) on mobile, full on desktop
- [ ] **3.6** Verify FAB does not overlap scrollable content at bottom of page
