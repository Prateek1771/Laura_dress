# VivahStyle — Build Plan

## Core Principle

Build vertically, one feature at a time. UI first with mock data, then wire logic. Every feature leaves the app in a demoable state. Update `progress-tracker.md` after each feature.

---

## Phase 1 — Foundation & Admin (01–07)

### 01 Project Scaffold + Design System

**UI:**

- Next.js 16 + Tailwind v4 project with `globals.css` containing the full token set from `ui-tokens.md`
- Playfair Display (headings) + Inter (body) via `next/font/google`
- Base primitives in `components/ui/`: Button (primary/secondary), Card, Badge, Input, Select, Table, ScoreBar, ImageGallery skeleton
- Root layout with ivory background, max-width 1200px

**Logic:**

- `lib/constants.ts` with all enums:
  - `SHOPPING_FOR`: `male` `female` `couple` `kids`
  - `OCCASIONS`: `wedding` `reception` `engagement` `sangeet` `haldi` `mehendi` `cocktail` `festive` `pre_wedding_shoot` `other`
  - `MEN_CATEGORIES`: `sherwani` `indo_western` `jodhpuri` `kurta_jacket_set` `kurta_set` `short_kurta` `kurta` `suit_accessories` `others`
  - `WOMEN_CATEGORIES`: `lehenga` `saree` `stitched_suit` `accessories`
  - `COLORS`: canonical color list (maroon, ivory, gold, royal blue, emerald, coral, peach, navy, lavender, blush, mustard, rust, teal, fuchsia, crimson, champagne, olive, magenta, cobalt, copper, burgundy, white, black, grey, pink, orange, yellow, green)
  - `PAYMENT_MODES`: `cash` `upi` `card` `net_banking`
  - `AVAILABILITY`: `in_stock` `low_stock` `out_of_stock`
  - `MATCH_THRESHOLD_GOOD = 60`; `MATCH_THRESHOLD_STRONG = 75`; `MATCH_THRESHOLD_EXCELLENT = 90`
  - `MAX_RECOMMENDATIONS = 50` (no hard cap for Shop Suggested — return all ≥ 60)
- `lib/insforge/client.ts`, `lib/insforge/server.ts`, `lib/format.ts` (formatINR), `lib/posthog.ts`
- `lib/scoring/scoring.test.ts`: unit tests covering — exact occasion match (35 pts), adjacent occasion (18 pts), over-budget item (0 pts), no price range set (flat 25), kids session (engine skipped / all items returned), couple session hard-filter (partner gender only)

---

### 02 Store Gate + Role Auth + Navigation

**UI:**

- `/` centered card on ivory: STORE CODE input · PASSWORD input · "Enter Store" primary button · error text for invalid credentials
- After login: role-specific nav bar; **Logout button at top-right** on all authenticated pages; on tablet screens the nav collapses into a burger menu that still exposes logout prominently
- Stylist nav: Onboarding · Explore
- Cashier nav: Billing · Returns
- Owner nav: Dashboard · Inventory · Billing · Returns · Settings

**Logic:**

- `POST /api/auth/login { storeCode, password }`: verify store code from `store_settings`, find active `staff` row, verify with `bcrypt.compare(password, staff.password_hash)` — never a plain-text comparison; set signed httpOnly cookie `vivah_session = { staffId, name, role }` (HMAC with `SESSION_SECRET`, `maxAge: 28800`)
- Role redirects: stylist → `/onboarding`, cashier → `/billing`, owner → `/dashboard`
- `middleware.ts`: route group guards per role; unauthenticated → `/`
- `POST /api/auth/logout`: clear cookie → redirect `/`
- Seed script: one `store_settings` row + three staff accounts (owner, cashier, stylist)

**PostHog events:** `staff_logged_in`

---

### 03 Inventory Table UI + CRUD

**UI:**

- `/inventory`: full-width table with columns: **Dress ID** (monospace badge) · **Image** (40×40 thumbnail) · **Title** · **Qty** · **Type** (category badge) · **Tags** (truncated chip list) · **Color** (swatch dot + name) · **Price** (₹) · **Stock** (dot indicator) · **Actions** (Edit · Deactivate)
- Filter row above table: search by name or dress_id · gender toggle (All/Men/Women) · category select · availability select
- "Add Item" primary button top-right → `/inventory/new`
- `/inventory/new` form: DRESS ID (auto-generated, editable) · TITLE · IMAGES multi-uploader (drag-drop, first marked PRIMARY) · QUANTITY · GENDER toggle · CATEGORY select (filtered by gender) · OCCASIONS multi-select chips · COLORS multi-select chips · TAGS input (comma-separated or chip-add) · FABRIC select · SIZES chip-select · PRICE (₹) · AVAILABILITY select
- Below the image uploader: **"✨ Auto Fill"** primary button (Phase 1 Feature 04)
- `/inventory/[id]/edit`: same form prefilled

**Logic:**

- Server component fetches `inventory_items` ordered by `created_at desc`; filter params as searchParams
- "Add Item" → INSERT `inventory_items`; auto-generate `dress_id` as `{CATEGORY_PREFIX}-{4-digit-seq}` e.g. `SHER-0042`, unique check on insert
- Edit → UPDATE; Deactivate → `active = false` (soft delete; never hard-delete items referenced by bills/tryons)
- Availability quick-toggle from the table row
- Successful INSERT → redirect to `/inventory` with success toast: "Item {dress_id} added."
- Successful UPDATE → redirect to `/inventory` with success toast: "Item updated."

---

### 04 Groq Vision Auto-Fill

Upload a dress image → Groq vision model reads the image → auto-populates the inventory form. Owner reviews and corrects before saving.

**UI:**

- On `/inventory/new`, after selecting at least one image: **"✨ Auto Fill"** button activates
- Tap → button shows spinner "Analysing…"; fields fade-in with populated values one by one (300ms stagger)
- Each auto-filled field gets a subtle gold left-border indicator "AI suggested"; border disappears on user edit
- If a field is empty after auto-fill, it stays blank with placeholder — user must fill manually
- Error state: "Couldn't read this image. Fill in manually." — form remains fully editable

**Logic:**

- `POST /api/inventory/autofill { imageBase64 }` (server route, key never reaches client):

```typescript
const completion = await groq.chat.completions.create({
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  messages: [{
    role: 'user',
    content: [
      {
        type: 'text',
        text: `You are a fashion inventory assistant for an Indian wedding boutique.
Look at this dress image and extract structured details.
Return JSON only with this exact structure:
{
  "name": "descriptive dress title",
  "gender": "men" | "women",
  "category": one of the exact values from the men or women category list,
  "colors": ["color1", "color2"] using these exact color names: ${COLORS.join(', ')},
  "occasions": ["occasion1"] using: wedding, reception, engagement, sangeet, haldi, mehendi, cocktail, festive, pre_wedding_shoot, other,
  "fabric": "silk" | "velvet" | "brocade" | "georgette" | "chiffon" | "cotton_silk" | "net" | "other",
  "tags": ["tag1", "tag2"] descriptive keywords,
  "suggestedPrice": number or null
}`,
      },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
    ],
  }],
  response_format: { type: 'json_object' },
  max_tokens: 512,
});
const data = JSON.parse(completion.choices[0].message.content!);
```

- Validate response: unknown enum values are dropped (not rejected); `suggestedPrice` only applied if > 0
- Downscale image client-side to max 1024px / 4MB before sending (canvas resize)
- One retry on network/5xx failure; after that surface the error state

---

### 05 Billing / Invoice

**UI:**

- `/billing`: two-column layout (desktop) or stacked (tablet):
  - Left — Cart: DRESS ID search input + "Add" button → item row appears (thumbnail, name, price, quantity stepper, remove icon); multiple rows; subtotal at bottom
  - Right — Payment: PAYMENT MODE segmented control (Cash · UPI · Card · Net_Banking); conditional field: Cash → CUSTOMER NAME input; UPI → TRANSACTION LAST 4 DIGITS input; Card → CARD LAST 4 DIGITS input; Net_Banking → no extra field; TAX line (from `store_settings.tax_percent`, read-only); TOTAL (bold, large); "Finalise Bill" primary button
- Success state: full invoice card — bill number, items list, payment mode, total, date — with a "New Bill" button
- If accessed from `/explore/[id]` with `?item=SHER-042`: the item pre-populates the cart automatically

**Logic:**

- Dress_id lookup: `ilike` on `inventory_items.dress_id`, `active = true`; if `availability = 'out_of_stock'` show warning but don't block
- Server action `createBill()`:
  1. Compute `total_amount` = sum of (quantity × unit_price) across all cart rows + tax — computed before any INSERT
  2. INSERT `bills` (staff_id from cookie, payment_mode, payment_ref, customer_name, session_id if any, **total_amount included in this INSERT** — no subsequent UPDATE)
  3. INSERT `bill_items` per cart row (unit_price copied from inventory at time of sale, NOT referenced live)
  4. `revalidatePath('/billing')`, `revalidatePath('/dashboard')`
- Tax = total × `store_settings.tax_percent / 100`; computed server-side
- "Finalise Bill" button is disabled (greyed) when the cart contains zero items

**PostHog events:** `bill_created`

---

### 06 Returns Form

**UI:**

- `/returns`: centered card, max-width 480px:
  - DRESS ID input (search → show item thumbnail + name + price below)
  - NOTES textarea (optional)
  - "Record Return" primary button
- Success: green banner "Return recorded for {item name}." with a "Record Another" link
- Unknown dress_id: "No dress found with that ID."

**Logic:**

- Server action `recordReturn()`: INSERT `returns` (item_id, staff_id from cookie, notes)
- No policy check, no approval step — just a record

**PostHog events:** `return_recorded`

---

### 07 Financial Dashboard

**UI:**

- `/dashboard` with date-range picker chips: Today · This Week · This Month · All Time
- **Row 1 — Stat cards:** TOTAL REVENUE (₹) · TOTAL BILLS · AVG ORDER VALUE · RETURNS COUNT
- **Row 2 — Revenue by Payment Mode:** horizontal bar chart (Cash / UPI / Card / Net_Banking) using `chart-1` through `chart-4` tokens
- **Row 3 — Recent Bills:** table — Date · Dress IDs (truncated) · Payment Mode badge · Amount · Cashier name
- **Row 4 — Stock Summary:** three stat mini-cards: In Stock / Low Stock / Out of Stock item counts

**Logic:**

- All aggregations server-side; scoped by date range on `bills.created_at`
- Revenue from `bills.total_amount`; refund subtract from `returns` is not in V1 (returns don't store refund amounts — they are operational records only)
- Empty ranges: zero-state stat cards, empty table with friendly copy — never errors

---

## Phase 2 — Customer Flow (08–13)

### 08 Customer Onboarding Form

**UI:**

- `/onboarding`: single-page form on a card (not a wizard), scroll-friendly, tablet-optimized:
  - FULL NAME input (required)
  - AGE input (optional)
  - SHOPPING FOR — four large tap cards: **Men** · **Women** · **Couple** · **Kids**; selection controls which categories appear below
  - OCCASIONS — multi-select chips (all 10 options); multiple can be selected simultaneously; at least one required
  - CATEGORY / STYLE PREFERENCE — shown for Male/Female selections; for Couple, two separate category selects (Groom's Style + Bride's Style); hidden for Kids
  - MATCHING DRESS COMBO — toggle (visible only when Shopping For = Couple); label: "Find matching outfits for the couple"
  - PRICE RANGE — two ₹ inputs: Min and Max (both optional); helper text: "Leave blank to show all price points"
  - "Start Exploring" large primary button

**Logic:**

- Server action `createSession()`: INSERT `styling_sessions` (`staff_id` from cookie, all form fields; `occasions` as jsonb array; `wants_couple_combo` boolean; `category` for Male/Female, `null` for Kids)
- Redirect to `/explore?session={sessionId}` after INSERT
- `sessionId` is a UUID; it travels in the URL query param so the stylist can open multiple sessions on different tabs if needed

**PostHog events:** `session_started`

---

### 09 Explore Page (Ecommerce Grid)

**UI:**

- `/explore`: full-screen grid, 4 cols desktop / 3 cols tablet / 2 cols portrait
- Dress card: 3:4 portrait image, name (Playfair 14px), category badge, price (₹, Inter 600), stock dot, match score badge (only when Shop Suggested active)
- Sticky top bar: **"Shop Suggested"** primary button (left) · Sort select · Filter button (opens side panel); on portrait viewports (≤768px) collapse Sort and Filter into a single "Sort & Filter" button to avoid tap-target crowding
- Sort options: Price ↑, Price ↓, Newest, A–Z, Match Score (only available when Shop Suggested active)
- Filter side panel: Gender radio · Category multi-select · Color multi-select swatches · Price Range inputs · Clear All link
- "Shop Suggested" active state: button becomes gold-outlined, grid re-renders with scored items sorted by score, non-matching items show with 50% opacity at the bottom
- When no active session: inline banner above the grid — "No active session — [Start Onboarding →]" (links to `/onboarding`); do not use a tooltip on the disabled button alone
- Empty state (filters): "No dresses match your filters. Try clearing some filters."
- Empty state (Shop Suggested returns 0 scored items): "No dresses match this customer's preferences — try clearing the price range or broadening the occasion selection."

**Logic:**

- Server component: fetch `inventory_items` where `active = true`, ordered by request params
- DressCard tap URL: `/explore/${itemId}?session=${sessionId}` when an active session is present; `/explore/${itemId}` otherwise — sessionId must propagate so the detail page can load the match score
- "Shop Suggested" → client-side triggers `POST /api/recommendations { sessionId }` → updates local state with scored item IDs and scores; no page reload
- **Feature 09+10 note:** Feature 09 ships the "Shop Suggested" button UI; the button shows a "Coming soon" state until Feature 10 wires the scoring API. Build both features in the same session to keep the app demoable after each feature.

---

### 10 Shop Suggested (Scoring Engine Integration)

**Logic (no new UI — this wires the Explore page's "Shop Suggested" into `lib/scoring`):**

- `POST /api/recommendations { sessionId }`:
  1. Fetch `styling_sessions` row
  2. Fetch all active `inventory_items`
  3. Run `recommend(session, items)` from `lib/scoring/engine.ts`
  4. INSERT new scored rows first, then DELETE prior rows for this session — soft-replace order prevents a data-loss window if the INSERT fails (never delete before replacement data is committed)
  5. Return `{ scored: [{ itemId, matchScore, matchReasons }] }`

**Scoring algorithm** (`lib/scoring/engine.ts`):

**Hard filters (item excluded if any fail):**

1. `gender` must match `session.shopping_for` (male/female); Kids sessions: skip the scoring engine entirely — return all active items unscored; show a note on the explore page: "Score-based matching is not available for kids — browsing all items"
2. If `session.category` is set: item's `category` must match
3. `availability !== 'out_of_stock'` and `active = true`

**Score (total 100):**

| Component | Max | Rule |
|---|---|---|
| Occasion | 35 | At least one session occasion in `item.occasions` → 35; adjacent occasion → 18; else 0 |
| Budget | 30 | `item.price` within `[price_range_min, price_range_max]` → 30; within 20% outside → 15; else 0. If no range set → flat 25 |
| Color | 20 | Item has a color rated `recommended` for the session skin tone (if captured from a prior session / not in onboarding V1 → skip, flat 15); else 0 |
| Availability | 15 | `in_stock` → 15; `low_stock` → 8 |

*Note: skin tone not collected in V1 onboarding form; color score defaults to flat 15 for all items passing hard filters. Add skin tone to onboarding in a later iteration.*

**Adjacent occasion map:** wedding↔reception, engagement↔reception, sangeet↔cocktail, haldi↔mehendi, festive↔cocktail, pre_wedding_shoot↔engagement.

- Threshold: items with score < 60 dropped; all passing items returned (not capped at 12 — let the user scroll)
- `match_reasons`: template strings per scoring component that exceeded half its max value — "Matches {occasion} occasion", "Within your ₹{min}–₹{max} budget", "Available in store"

---

### 11 Dress Detail Page

**UI:**

- `/explore/[id]`:
  - **Image gallery:** swipeable full-width images (3:4 portrait), thumbnail strip below, image count badge, pinch-zoom on tablet
  - **Details panel:** title (Playfair h1), category + gender badges, price (₹, large), fabric, colors (swatch dots + labels), sizes (chip list), tags (small chip list)
  - **Match score section** (if item was recommended in session): ScoreBar with tier label + reason chips
  - **"✨ Preview My Look"** primary button — virtual try-on (Feature 13)
  - **"Add to Bill"** secondary button → `/billing?item={dress_id}` — visible only when logged-in role is `cashier` or `owner`
  - **"Copy Dress ID"** secondary button — visible for `stylist` role only; copies `{dress_id}` to clipboard with a brief "Copied!" confirmation so the stylist can pass the ID to the cashier verbally
  - **Back arrow** → `/explore` preserving filters and scroll position

**Logic:**

- Server component: fetch `inventory_items` by UUID (from URL param); load `recommendations` row for current session if `?session=` present in URL to show match score — sessionId arrives via the DressCard link from Feature 09 (`/explore/${id}?session=${sessionId}`)

**PostHog events:** `dress_viewed`

---

### 12 Customer Photo Capture

**UI:**

- On the dress detail page, when "✨ Preview My Look" is tapped and no customer photo exists for the session:
  - Modal: "Add a photo to preview the outfit"
  - Two options: **Take Photo** (uses `<input type="file" capture="user">` for tablet camera) · **Upload Photo**
  - Consent line: "This photo is only used for outfit previews during this store visit."
  - Preview + Retake / Use Photo buttons
  - After "Use Photo": photo thumbnail appears in page header area next to session info

**Logic:**

- Client-side resize to max 1024px long edge (canvas) before upload
- Upload to `customer-photos/{sessionId}.jpg` (private bucket) via InsForge storage
- UPDATE `styling_sessions.customer_photo_url` (add column) — wait, this column should be in architecture. Adding it: `styling_sessions.customer_photo_url text|null`
- Replacing photo overwrites same path

---

### 13 Virtual Try-On + Gallery

**UI:**

- "✨ Preview My Look" (enabled once session has a customer photo; tooltip "Add a customer photo first" otherwise):
  - Tapping generates the try-on; shows: loading modal with shimmer 3:4 placeholder + rotating copy ("Draping the outfit…", "Adjusting the fit…")
  - Ready: preview image fills the modal (3:4 portrait, never cropped); below: "Try Another" (opens a strip of similar items) · "Close"
  - Failure: "Couldn't create this preview. Try again." with Retry
- **Try-On Gallery** — small camera icon in the explore page top bar or dress detail header (visible when session has ≥1 try-on); tapping opens a grid of all try-on previews (item name, date, tap to enlarge)

**Logic:**

- `POST /api/tryon { sessionId, itemId }`:
  1. INSERT `tryons` (status: `generating`)
  2. Create signed URL for `customer-photos/{sessionId}.jpg` (10 min expiry)
  3. Call API4.AI multipart — `url` = person signed URL, `url-apparel` = inventory image public URL
  4. On success: decode `results[0].entities[0].image` (base64 JPEG) → upload to `tryon-previews/{tryonId}.jpg`
  5. UPDATE `tryons` (status: `ready`, result_image_url)
- 60s timeout; one automatic retry on network/5xx; then `status: 'failed'`
- API4.AI key server-only

**PostHog events:** `tryon_generated`

---

## Phase 3 — Couple Matching + Settings (14–16)

### 14 Couple Combo Matching

For sessions with `wants_couple_combo = true`. Suggest harmonious partner outfits.

**UI:**

- On the explore page, when session has `wants_couple_combo = true`: a "Find Match" icon appears on **all** dress cards (no prior detail-page visit required — visible from first render so the feature is discoverable)
- Tapping "Find Match" opens a side panel: "Matching Outfits for This Look" — top 5 combo cards, each showing: partner dress image, name, price, **Overall Compatibility** ring, three mini-bars (Color · Theme · Fabric)
- Example: "Maroon Lehenga → Ivory Sherwani · 92% match"

**Logic:**

- `lib/scoring/couple.ts`:

```typescript
coupleCompatibility(a: InventoryItem, b: InventoryItem): {
  colorHarmony: number;
  themeHarmony: number;
  fabricHarmony: number;
  overall: number;
}
// overall = 0.5 × colorHarmony + 0.3 × themeHarmony + 0.2 × fabricHarmony
```

**Color Harmony matrix** (`lib/scoring/matrices.ts`):

| Pairing | Score |
|---|---|
| maroon ↔ ivory, maroon ↔ gold, red ↔ cream | 95 |
| royal blue ↔ gold, royal blue ↔ ivory | 90 |
| emerald ↔ champagne, emerald ↔ gold | 88 |
| lavender ↔ grey, blush ↔ champagne | 82 |
| same color exact match | 75 |
| any unlisted pairing | 50 |
| known clash (orange↔magenta, lime↔red) | 25 |

**Theme Harmony:** full occasion overlap → 100; partial → 70; none → 40.

**Fabric Harmony:** silk↔silk/brocade → 95; velvet↔silk → 88; georgette↔chiffon → 85; formal+casual mix → 45.

- `suggestPartnerOutfits(anchor, session, items)`: hard-filter to partner gender; score = 0.6 × couple compatibility + 0.4 × individual session match; return top 5
- Triggered client-side; results cached per item for the session duration (no re-request on re-open)

---

### 15 Try-On Gallery

Already partially built in Feature 13 (gallery icon + grid). This feature polishes and makes it standalone-accessible.

**UI:**

- Gallery accessible from: explore page top bar icon + dress detail page header icon
- `/explore?session=X&gallery=1` → gallery opens as a full-screen overlay (no new route)
- Grid of try-on previews: item primary image thumbnail (small, left), generated preview (large, right) in a side-by-side card; item name; date; "Try Another Dress" link → opens dress detail
- Empty state: "No try-ons yet. Tap ✨ Preview My Look on any dress."

**Logic:**

- Fetch `tryons` where `session_id = sessionId` and `status = 'ready'` ordered by `created_at desc`
- Signed URLs for each `tryon-previews/{tryonId}.jpg` (10 min expiry) fetched server-side on gallery open

---

### 16 Store Settings

**UI:**

- `/settings` with two sections:
  - **Store** — read-only store name; STORE CODE display (owner can copy; "Regenerate Code" button with confirmation dialog: "This will log out all staff. Confirm?"); CURRENCY (read-only: ₹ INR); TAX PERCENT input (GST)
  - **Staff** — table: name, role badge, active toggle; "Add Staff" button → inline form: NAME input · ROLE select (Stylist / Cashier / Owner) · PASSWORD input (must be unique across all staff); password error if duplicate detected server-side; Deactivate toggle on existing rows

**Logic:**

- UPDATE `store_settings` (single row); staff CRUD on `staff` table
- Password hashing: hash the submitted password with `bcrypt` before INSERT or UPDATE — store `password_hash`, never the plaintext value
- Password uniqueness: since bcrypt hashes are non-comparable directly, check by running `bcrypt.compare(newPassword, existing.password_hash)` against each existing staff row (boutique staff count is small; O(n) is acceptable); return "Password already in use by another staff member" if any match is found
- Store code regeneration: UPDATE `store_settings.store_code`; this doesn't invalidate existing sessions — staff must log out and re-enter; add a note in the UI
- Owner-only route; server actions re-verify `requireRole(['owner'])`

---

## Feature Count

| Phase | Features | Scope |
|---|---|---|
| Phase 1 — Foundation & Admin | 01–07 (7) | Scaffold, auth, inventory + auto-fill, billing, returns, dashboard |
| Phase 2 — Customer Flow | 08–13 (6) | Onboarding, explore, scoring, dress detail, photo, try-on |
| Phase 3 — Couple + Settings | 14–16 (3) | Couple matching, try-on gallery polish, store settings |
| **Total** | **16** | |
