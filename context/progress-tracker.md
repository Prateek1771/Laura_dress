# VivahStyle — Progress Tracker

## Current Status

**Current Phase:** Phase 1 — Foundation & Admin
**Last Completed:** Feature 02 — Store Gate + Role Auth + Navigation
**Next:** Feature 03 — Inventory Table UI + CRUD

## Progress

### Phase 1 — Foundation & Admin (2/7)

- [x] 01 Project Scaffold + Design System
- [x] 02 Store Gate + Role Auth + Navigation
- [ ] 03 Inventory Table UI + CRUD
- [ ] 04 Groq Vision Auto-Fill
- [ ] 05 Billing / Invoice
- [ ] 06 Returns Form
- [ ] 07 Financial Dashboard

### Phase 2 — Customer Flow (0/6)

- [ ] 08 Customer Onboarding Form
- [ ] 09 Explore Page (Ecommerce Grid)
- [ ] 10 Shop Suggested (Scoring Engine Integration)
- [ ] 11 Dress Detail Page
- [ ] 12 Customer Photo Capture
- [ ] 13 Virtual Try-On + Gallery

### Phase 3 — Couple + Settings (0/3)

- [ ] 14 Couple Combo Matching
- [ ] 15 Try-On Gallery Polish
- [ ] 16 Store Settings

## Decisions Made During Build

_Record every deviation from the context docs here: what changed, why, and which doc was updated._

- (docs v2) Rental management cancelled by user — fully removed from all docs.
- (docs v2) Appointment scheduling removed — not in revised spec.
- (docs v2) Trial tracking statuses removed — not in revised spec.
- (docs v2) Complex returns & exchanges (policy types, approval workflow, return reasons) replaced by a simple dress_id + notes form.
- (docs v2) Session wizard replaced by a single-page onboarding form; no session codes; session UUID travels in URL query params.
- (docs v2) Checkout replaced by Billing: cashier enters dress_id to build cart; payment mode determines additional field (customer name for cash; last 4 digits for UPI/card).
- (docs v2) Occasions are now multiselect; Kids added to Shopping For; Pre-Wedding Shoot added to occasions.
- (docs v2) Inventory UI is a table (not upload-card form); auto-fill via Groq Vision (meta-llama/llama-4-scout-17b-16e-instruct).
- (docs v2) Groq Vision API added to stack + library-docs; GROQ_API_KEY added to env vars.
- (docs v2) Feature count revised from 22 → 16.
- (docs v2) Shop Suggested scoring: no hard cap of 12 — all items scoring ≥ 60 are returned and shown on the explore page.
- (docs v2) Skin tone not collected in onboarding V1 — color score component defaults to flat 15 for all items passing hard filters. Add skin tone to onboarding in a later iteration.
- (docs v1) Recommendations table carries shortlist state via its status column — no separate shortlists table (this is still true but moot since shortlisting is not a V1 concept in the new flow).
- (docs v1) API4.AI demo endpoint response shape verified live on 2026-06-11: `results[0].entities[0].image` = base64 JPEG. Auth header for production key (RapidAPI vs direct) to be verified at Feature 13.
- (docs v3) Staff passwords stored as bcrypt hashes in `staff.password_hash` — never plaintext. `bcrypt.compare()` used at login. Password uniqueness checked at creation by comparing the candidate against all existing hashes.
- (docs v3) `bill_number` serial column added to `bills` table for human-readable invoice references.
- (docs v3) Session cookie `maxAge` set to 28800 seconds (8 hours) — sessions expire after a business day.
- (docs v3) Returns (V1) are record-only — they do not update `inventory_items.quantity` or `availability`. Owner must manually reconcile stock via the inventory edit page after processing returns.
- (Feature 01) InsForge SDK has no `createSignedUrl` method. For the try-on flow (Feature 13), customer photos are downloaded server-side as Blob via `storage.download()` and passed directly to API4.AI as multipart data instead of a signed URL. Updated `lib/insforge/storage.ts` accordingly.
- (Feature 01) `recharts` upgraded to v3 (was v2, which is deprecated). API changes in v3 noted for Feature 07 (Dashboard).
- (Feature 01) Next.js 16.2.9 used (matches spec). `bcryptjs` added as a dependency (pure JS, works in edge runtime).
- (Feature 02) **Single `(app)` route group instead of three (`(admin)`/`(cashier)`/`(stylist)`).** architecture.md placed `/billing` and `/returns` in two groups each, but Next.js forbids two route groups resolving to the same URL path (parallel-page error). All authenticated pages now live under one `app/(app)/` group with one layout; the Navbar adapts its links by role, and `middleware.ts` enforces per-path role access. architecture.md folder tree is now aspirational on this point.
- (Feature 02) **`lib/auth.ts` HMAC moved from `node:crypto` (`createHmac`) to Web Crypto (`crypto.subtle`).** The original sync `createHmac` cannot run in `middleware.ts` (Edge runtime has no `node:crypto`), which would have broken every guarded route once a cookie existed. `encodeSession`/`decodeSession` are now async; signature compared in constant time. `Buffer` is kept for base64/hex (available in Next 16 edge runtime).
- (Feature 02) Created only `store_settings` + `staff` tables (the two this feature touches); remaining tables created per-feature. RLS left disabled — all DB access is server-side via the anon key in V1.
- (Feature 02) `.env.local` was blank; filled `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`, and a generated `SESSION_SECRET`. Backend: InsForge `68bdfaz8.ap-southeast`.
- (Feature 02) `scripts/seed.mjs` seeds 1 store (`VIVAH01`) + 3 staff. **Demo passwords:** owner `owner123`, cashier `cashier123`, stylist `stylist123` — change before any real deployment. Run: `node --env-file=.env.local scripts/seed.mjs` (idempotent).
- (Feature 02) `/explore` access corrected to stylist+owner (middleware previously also allowed cashier), matching project-overview.md.
- (Feature 02) Next 16 warns that the `middleware` file convention is deprecated in favour of `proxy`. Left as `middleware.ts` for now (CLAUDE.md/architecture reference it by name); harmless warning, rename later if desired.

## Notes

_Workarounds, vendor quirks, and anything the next session needs to know._

- API4.AI demo endpoint (`demo.api4ai.cloud`) works without a key for development. Production endpoint + auth header type depends on the key source — verify at Feature 13 and update `library-docs.md`.
- Groq Vision response includes unknown enum values sometimes (e.g. color names not in `COLORS`); `sanitiseAutoFill()` in `library-docs.md` silently drops them rather than failing the whole auto-fill.
- `dress_id` is the primary human-readable lookup key for billing and returns — generated as `{CATEGORY_PREFIX}-{4-digit-seq}` (e.g. `SHER-0042`). Collision check on insert.
- `styling_sessions.customer_photo_url` column (text | null) should be added to the schema (noted in Feature 12 — verify architecture.md is updated when implementing Feature 12).
- **Before Feature 13:** spike API4.AI production auth — verify the correct auth header (RapidAPI vs direct endpoint) using the production key. Update `library-docs.md` with the confirmed `authHeaders()` pattern before committing to the Feature 13 build estimate.
- Kids sessions (Feature 10): scoring engine is skipped entirely; explore page shows all active items with a note: "Score-based matching is not available for kids — browsing all items." No gender or category hard-filter applies.
- DressCard links (Features 09 onward) must include `?session=${sessionId}` to propagate session context into dress detail pages, enabling match score display and the try-on flow.
