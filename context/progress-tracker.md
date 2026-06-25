# VivahStyle — Progress Tracker

## Current Status

**Current Phase:** Phase 1 COMPLETE → next is Phase 2 (Customer Flow)
**Last Completed:** Feature 07 — Financial Dashboard
**Next:** Feature 08 — Customer Onboarding Form (Phase 2)

## Progress

### Phase 1 — Foundation & Admin (7/7) ✅

- [x] 01 Project Scaffold + Design System
- [x] 02 Store Gate + Role Auth + Navigation
- [x] 03 Inventory Table UI + CRUD
- [x] 04 Groq Vision Auto-Fill
- [x] 05 Billing / Invoice
- [x] 06 Returns Form
- [x] 07 Financial Dashboard

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
- (Feature 03) **Server InsForge client now uses a privileged API key, not the anon key.** Storage uploads with the anon key fail with `permission denied for schema storage` (public bucket = public *read* only; writes need privilege). `lib/insforge/server.ts` now reads `INSFORGE_API_KEY` (new **server-only** env var = the project `ik_...` admin key) with the anon key as fallback. The browser client (`lib/insforge/client.ts`) keeps the anon key. This means architecture.md's `createServerClient()` (anon-key) snippet is superseded — server = privileged.
- (Feature 03) Created `inventory_items` table (unique `dress_id` index) + public `inventory-images` bucket. Remaining tables/buckets still created per-feature.
- (Feature 03) `dress_id` is auto-generated server-side at save time as `{CATEGORY_PREFIX}-{4-digit-seq}` (seq = max existing for that prefix + 1); the DB unique index is the real guard. The form field is editable — a typed value is validated for uniqueness instead.
- (Feature 03) Image upload is **server-side**: the client resizes (≤1024px, canvas) and the files travel through the `createItem`/`updateItem` server action to `uploadInventoryImage()` — honoring the rule that the browser client is read-only.
- (Feature 03) **Filter bar is a plain GET `<form>`** (no client JS); the server page reads searchParams. Text search (name OR dress_id) is done in memory since the SDK has no OR filter — fine for boutique-scale inventory.
- (Feature 03) No toast component exists — success uses a `?added=`/`?updated=` searchParam banner on `/inventory` instead.
- (Feature 03) Color **swatch dot deferred** — the table shows color names as text (avoids a 28-entry color→hex map). Add swatches in a later polish pass.
- (Feature 03) `inventory_items` RLS left disabled (server-side privileged access only), consistent with `staff`/`store_settings`.
- (Feature 03 follow-up) **Orphan-row bug fixed.** `createItem` inserts the row before uploading images; an upload failure left a saved item with `images: []` while the user saw an error. Now the row is deleted (rolled back) if `uploadAll` throws.
- (Feature 04) Groq model `meta-llama/llama-4-scout-17b-16e-instruct` confirmed live (matches spec). Verified end-to-end on a real saree photo: returned accurate title ("Elegant Gold Saree with Pink Embroidery"), gender→women, category saree, fabric silk, suggested price, colors, and tags.
- (Feature 04) `POST /api/inventory/autofill` (owner-only) takes `{ imageBase64 }`, calls Groq vision, and **sanitises** the result against `lib/constants.ts` (unknown enum values dropped, `suggestedPrice` only if > 0). One retry on failure; scope `[autofill]`.
- (Feature 04) `ItemForm` now controls `name`/`price`/`fabric` (were uncontrolled) so Auto-Fill can populate them. The button enables once ≥1 **new** image File exists; it base64-encodes `files[0]` (already ≤1024px from `ImageUploader`) and posts. Populated fields get a gold left-border ("AI suggested"), cleared on edit. `price` is only set if empty. Edit mode (existing images only) keeps the button disabled — auto-fill is a create-time aid.
- (Feature 04) Breakpoints verified at 1280 / 768 / 375 — form grids collapse to one column on mobile and the nav becomes a burger ≤768. Tested twice (kill + restart between passes); WEBP uploads work because `ImageUploader` re-encodes to JPEG via canvas.
- (Feature 05) Created `bills`, `bill_items`, `returns` tables **with foreign keys** (bill_items→bills/inventory_items, bills→staff, returns→inventory_items/staff) so the dashboard can use PostgREST embedding. `bill_number` is a `serial`.
- (Feature 05) **Dress_id lookup goes through a privileged server route** `GET /api/inventory/lookup?dressId=` (cashier/owner), not the browser anon client — same reasoning as the Feature 03 server-client decision. Billing and Returns both use it. This supersedes `code-standards.md`'s "browser client for dress_id search" note.
- (Feature 05) `createBill` **recomputes every line total + tax server-side** from re-fetched inventory prices (client math is never trusted). `bills.total_amount` is written in the INSERT (no later UPDATE), `bill_items.unit_price` is copied at sale time. Tax = round(subtotal × tax_percent/100) using `store_settings.tax_percent` (5%). Fires `bill_created`. Payment ref stored only for upi/card; customer_name only for cash.
- (Feature 05) Invoice is shown as a client-side panel after `createBill` returns (no separate invoice route); "New Bill" resets the cart. ₹ via `formatINR` (Indian grouping verified, e.g. ₹1,76,400). Breakpoints 1280/768/375 OK (cart+payment is a 2-col grid ≥1024, stacks below). Tested twice incl. not-found and empty-cart-disabled paths.
- (Feature 06) `recordReturn` (cashier/owner) re-looks up the item server-side by dress_id, INSERTs `returns` (item_id, staff_id, notes), fires `return_recorded`. V1 is record-only — no stock/availability change. Form uses the shared lookup route; success banner + "Record Another". Tested twice (incl. optional-notes path) + breakpoints.
- **Infra note:** InsForge requests intermittently time out (`InsForgeError: Request timed out after 30000ms`) — observed once on the returns lookup; the same query succeeded on immediate retry. It's transient backend slowness, not an app bug. The UI lets the user retry (Find/Add buttons). If it becomes frequent during demos, add a one-retry wrapper around `createServerClient` reads.
- (Feature 07) Dashboard aggregates server-side over `bills` (revenue Σ, count, AOV, by-payment-mode), `returns` (count), and `inventory_items` (stock-by-availability). Recent bills use **PostgREST embedding** `bills.select('..., staff(name), bill_items(inventory_items(dress_id)))'` for cashier name + dress IDs — verified working. Date ranges are rolling windows (today = since local midnight, week = 7d, month = 30d default, all = none); chips are plain links with `?range=`.
- (Feature 07) **Recharts + CSS tokens gotcha:** SVG `fill` attributes can't use `var(--color-chart-*)` — the bars rendered with correct geometry but were invisible. `BillsByModeChart` now resolves the chart tokens at runtime via `getComputedStyle(document.documentElement)` and passes real hex to `<Cell fill>`, with a hardcoded fallback array mirroring `globals.css` (the one place hex appears, by necessity). `isAnimationActive={false}` to avoid flicker.
- (Feature 07) PostgREST types to-one embeds (`staff`, `inventory_items`) as arrays but returns objects at runtime — `RecentBill` is typed as objects and the query result is cast `as unknown as RecentBill[]`.
- (Feature 07) Note: programmatic viewport resize (devtools `resize_page`) leaves the recharts `ResponsiveContainer` blank until reload — a test-harness artifact, not a real bug; a fresh load at any width renders the chart (confirmed 375 / 768 / 1280).
- **Phase 1 demo data currently in DB:** items SARE-0001 (active), LEHE-0001 (active); 2 bills (#1 UPI ₹1,76,400, #2 Cash ₹18,900); 2 returns. SHER-0001 was a deactivated test item.
- **Phase 1 full E2E pass (all 7 features in one integrated flow) — PASSED.** Owner stocked via Groq auto-fill (SARE-0002) + edit + availability toggle → cashier sold a 2-item CARD bill (#3, ₹1,20,750) → cashier recorded a return → owner dashboard reflected exact deltas: revenue ₹1,95,300→₹3,16,050 (+1,20,750), bills 2→3, returns 2→3, stock 2/0/0→1/1/1, Card bar appeared, new bill top of Recent Bills with cashier+dress IDs. Role-guard matrix all correct (stylist→/dashboard,/billing redirect to /onboarding; cashier→/inventory,/settings redirect to /billing; unauth→/dashboard→/; bad creds 401). No server/app errors in the run. After this E2E the DB has items SARE-0002 (low_stock) / SARE-0001 (out_of_stock) / LEHE-0001 (in_stock); 3 bills; 3 returns.
- **Responsive verified across all breakpoints** (375 / 768 / 1024 / 1280 / 1440): nav collapses to burger ≤768 with full menu; dashboard stat cards 1→2→4 col; recharts chart renders on fresh load at every width (note: programmatic `resize_page` needs a reload — harness artifact); inventory 10-col table scrolls horizontally on mobile; content caps at `max-w-[1200px]` centered on wide screens (verified main=1200 at 1283 viewport).

## Notes

_Workarounds, vendor quirks, and anything the next session needs to know._

- API4.AI demo endpoint (`demo.api4ai.cloud`) works without a key for development. Production endpoint + auth header type depends on the key source — verify at Feature 13 and update `library-docs.md`.
- Groq Vision response includes unknown enum values sometimes (e.g. color names not in `COLORS`); `sanitiseAutoFill()` in `library-docs.md` silently drops them rather than failing the whole auto-fill.
- `dress_id` is the primary human-readable lookup key for billing and returns — generated as `{CATEGORY_PREFIX}-{4-digit-seq}` (e.g. `SHER-0042`). Collision check on insert.
- `styling_sessions.customer_photo_url` column (text | null) should be added to the schema (noted in Feature 12 — verify architecture.md is updated when implementing Feature 12).
- **Before Feature 13:** spike API4.AI production auth — verify the correct auth header (RapidAPI vs direct endpoint) using the production key. Update `library-docs.md` with the confirmed `authHeaders()` pattern before committing to the Feature 13 build estimate.
- Kids sessions (Feature 10): scoring engine is skipped entirely; explore page shows all active items with a note: "Score-based matching is not available for kids — browsing all items." No gender or category hard-filter applies.
- DressCard links (Features 09 onward) must include `?session=${sessionId}` to propagate session context into dress detail pages, enabling match score display and the try-on flow.
