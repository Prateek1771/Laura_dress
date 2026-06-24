# VivahStyle — Architecture

## Stack

| Layer | Tool | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Pages, API routes, server actions |
| UI | React 19 + Tailwind CSS v4 | Components and styling |
| Database / Auth / Storage | InsForge | Postgres tables, file buckets |
| Virtual Try-On | API4.AI Virtual Try-On | Person photo + garment image → preview |
| Inventory Auto-Fill | Groq Vision (meta-llama/llama-4-scout-17b-16e-instruct) | Dress photo → auto-populate inventory fields |
| Recommendation Engine | Internal (`lib/scoring`) | Deterministic weighted matching, no LLM |
| Analytics | PostHog | Product events + owner dashboard |
| Fonts | Playfair Display + Inter | Headings + body |

## Folder Structure

```text
app/
  page.tsx                          → Store gate (store code + password)
  (admin)/
    layout.tsx                      → Admin shell + nav (Dashboard · Inventory · Billing · Returns · Settings)
    dashboard/page.tsx              → Financial dashboard
    inventory/page.tsx              → Inventory table
    inventory/new/page.tsx          → Add item (with Groq auto-fill)
    inventory/[id]/edit/page.tsx    → Edit item
    billing/page.tsx                → Billing / invoice
    returns/page.tsx                → Returns form
    settings/page.tsx               → Store config + staff management
  (cashier)/
    layout.tsx                      → Cashier shell + nav (Billing · Returns)
    billing/page.tsx                → Billing / invoice
    returns/page.tsx                → Returns form
  (stylist)/
    layout.tsx                      → Stylist shell + nav (Onboarding · Explore)
    onboarding/page.tsx             → Customer onboarding form
    explore/page.tsx                → Dress explore grid
    explore/[id]/page.tsx           → Dress detail + try-on
  api/
    auth/login/route.ts             → Store gate verification, sets role cookie
    auth/logout/route.ts            → Clears session cookie
    inventory/autofill/route.ts     → Groq vision → structured JSON
    recommendations/route.ts        → Scoring engine for Shop Suggested
    tryon/route.ts                  → API4.AI call + preview storage
components/
  ui/                               → Button, Card, Badge, Input, Select, ScoreBar, Table, ImageGallery
  layout/                           → Navbar, RoleNav, LogoutButton
  inventory/                        → InventoryTable, ItemForm, GroqAutoFill, ImageUploader
  billing/                          → BillingCart, DressIdSearch, PaymentModeForm
  explore/                          → DressGrid, DressCard, FilterPanel, SortSelect
  dress/                            → DressGallery, TryOnButton, TryOnModal, TryOnGallery
  onboarding/                       → OnboardingForm, OccasionPicker, CategoryPicker
  dashboard/                        → StatCard, RecentBillsTable, BillsByModeChart
lib/
  insforge/
    client.ts                       → Browser InsForge client
    server.ts                       → Server InsForge client
    storage.ts                      → Upload helpers (enforce bucket path conventions)
  scoring/
    engine.ts                       → scoreItem(), recommend() — pure functions
    couple.ts                       → coupleCompatibility(), suggestPartnerOutfits()
    matrices.ts                     → Skin-tone × color and color-harmony lookup tables
  auth.ts                           → Cookie signing/verification, requireRole()
  constants.ts                      → All enum arrays and threshold constants
  format.ts                         → formatINR()
  posthog.ts                        → Client + server PostHog setup
middleware.ts                       → Route protection per role
```

## System Boundaries

| Area | Owns | Must not |
|---|---|---|
| `app/(admin|cashier|stylist)/` | Pages, layouts, data fetching | Contain scoring logic, Groq calls, or API4.AI calls |
| `app/api/` | Auth, auto-fill, recommendations, try-on | Render UI |
| `lib/scoring/` | All match logic, pure functions | Touch DB, call fetch, import React |
| `lib/insforge/` | DB and storage access | Contain business rules |
| `components/` | Presentation + local state | Call InsForge directly |

## Data Flow

### Inventory Auto-Fill (Groq Vision)

```text
Owner selects dress image (ImageUploader)
↓
POST /api/inventory/autofill { imageBase64 }
↓
Groq Vision API — meta-llama/llama-4-scout-17b-16e-instruct
  prompt: "Extract dress details: name, category, gender, colors, occasion tags, fabric, price if visible"
↓
Return { name, category, gender, colors, occasionTags, fabric, suggestedPrice }
↓
Auto-fill ItemForm fields (all editable by owner)
↓
Owner reviews, corrects, then Save → INSERT inventory_items
```

### Billing Flow

```text
Cashier enters Dress_id in search input → item appears in cart
↓
Repeat for multiple items; set quantity per row
↓
Select payment mode: Cash | UPI | Card | Net_Banking
↓
Payment ref field: Cash → customer name; UPI/Card → last 4 digits (nullable)
↓
"Finalise Bill" → Server Action: createBill()
↓
INSERT bills + bill_items rows
↓
Invoice summary rendered (printable)
```

### Shop Suggested (Recommendations)

```text
Stylist taps "Shop Suggested" on /explore
↓
POST /api/recommendations { sessionId }
↓
Fetch session (onboarding preferences) + active inventory_items
↓
lib/scoring/engine.recommend(session, items)
↓
Return top N scored items (no hard cap — show all with score ≥ 60)
↓
Explore grid filters to scored items, match score badge on each card
```

### Virtual Try-On

```text
Dress detail page → customer photo (PhotoCapture or upload)
↓
"✨ Preview My Look" button
↓
POST /api/tryon { sessionId, itemId }
↓
INSERT tryons (status: 'generating')
↓
API4.AI multipart POST { person photo URL, garment image URL }
↓
Decode base64 → upload to tryon-previews bucket
↓
UPDATE tryons (status: 'ready', result_image_url)
↓
Preview modal with actions
```

### Returns Flow

```text
Cashier opens /returns
↓
Enter Dress_id → item details shown
↓
Optional notes
↓
"Record Return" → INSERT returns
```

## InsForge Database Schema

All tables: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`.

### `store_settings` (single row)

| Column | Type | Notes |
|---|---|---|
| store_code | text | Gate credential, e.g. `VIVAH01` |
| store_name | text | |
| currency | text | `INR` |
| tax_percent | numeric | GST, e.g. 5.0 |
| updated_at | timestamptz | |

### `staff`

| Column | Type | Notes |
|---|---|---|
| name | text | |
| password_hash | text | bcrypt hash of the staff password — never stored plaintext; each staff member must have a unique password, enforced at creation time |
| role | text | `owner` \| `cashier` \| `stylist` |
| active | boolean | default true |

### `inventory_items`

| Column | Type | Notes |
|---|---|---|
| dress_id | text unique | Short human-readable ID, e.g. `SHER-001` |
| name | text | Dress title |
| images | jsonb | Array of storage URLs; first is primary |
| quantity | int | default 1 |
| category | text | Men: `sherwani` `indo_western` `jodhpuri` `kurta_jacket_set` `kurta_set` `short_kurta` `kurta` `suit_accessories` `others` · Women: `lehenga` `saree` `stitched_suit` `accessories` |
| gender | text | `men` \| `women` |
| occasions | jsonb | Array from occasion enum |
| colors | jsonb | Array of canonical color names |
| tags | jsonb | Freeform tags (auto-filled by Groq or added by owner) |
| fabric | text | e.g. `silk` `velvet` `brocade` `georgette` `chiffon` |
| sizes | jsonb | e.g. `["S","M","L","XL","38","40"]` |
| price | numeric | Sale price ₹ |
| availability | text | `in_stock` \| `low_stock` \| `out_of_stock` |
| active | boolean | default true |

### `styling_sessions`

Created by the customer onboarding form. Everything in the customer flow (recommendations, try-ons) references this row.

| Column | Type | Notes |
|---|---|---|
| staff_id | uuid → staff | Stylist who ran the session |
| customer_name | text | |
| customer_age | int \| null | |
| shopping_for | text | `male` \| `female` \| `couple` \| `kids` |
| occasions | jsonb | Array, multiselect — `wedding` `reception` `engagement` `sangeet` `haldi` `mehendi` `cocktail` `festive` `pre_wedding_shoot` `other` |
| category | text \| null | Style preference from inventory categories; null for `kids` |
| wants_couple_combo | boolean | default false |
| price_range_min | numeric \| null | ₹ |
| price_range_max | numeric \| null | ₹ |
| customer_photo_url | text \| null | Storage URL in `customer-photos` (set during Feature 12) |
| status | text | `active` \| `completed` |

### `recommendations`

| Column | Type | Notes |
|---|---|---|
| session_id | uuid → styling_sessions | |
| item_id | uuid → inventory_items | |
| match_score | int | 0–100 |
| match_reasons | jsonb | Array of explanation strings |
| rank | int | 1-based |

### `tryons`

| Column | Type | Notes |
|---|---|---|
| session_id | uuid → styling_sessions | |
| item_id | uuid → inventory_items | |
| person_image_url | text | From `customer-photos` |
| result_image_url | text \| null | In `tryon-previews` when ready |
| status | text | `generating` \| `ready` \| `failed` |

### `bills`

| Column | Type | Notes |
|---|---|---|
| staff_id | uuid → staff | Cashier who created the bill |
| session_id | uuid \| null → styling_sessions | Optional — link bill to a customer session |
| customer_name | text \| null | For cash payments |
| payment_mode | text | `cash` \| `upi` \| `card` \| `net_banking` |
| payment_ref | text \| null | UPI/card: last 4 digits of transaction/card |
| bill_number | serial | Auto-incrementing human-readable invoice number |
| total_amount | numeric | Sum of bill_items totals — computed before INSERT |

### `bill_items`

| Column | Type | Notes |
|---|---|---|
| bill_id | uuid → bills | |
| item_id | uuid → inventory_items | |
| quantity | int | |
| unit_price | numeric | ₹ (copied from inventory at time of sale) |
| total_amount | numeric | quantity × unit_price |

### `returns`

| Column | Type | Notes |
|---|---|---|
| item_id | uuid → inventory_items | |
| staff_id | uuid → staff | |
| notes | text \| null | |

## InsForge Storage Buckets

| Bucket | Visibility | Contents | Path convention |
|---|---|---|---|
| `inventory-images` | public | Dress photos uploaded by owner | `{itemId}/{n}.jpg` |
| `customer-photos` | private | One photo per session, taken with consent | `{sessionId}.jpg` |
| `tryon-previews` | private | Generated try-on images | `{tryonId}.jpg` |

## Authentication

- **Login:** `POST /api/auth/login` with `{ storeCode, password }`. Verifies `store_settings.store_code`, finds the active `staff` row, verifies the submitted password with `bcrypt.compare(password, staff.password_hash)`, sets signed httpOnly cookie `vivah_session` = `{ staffId, name, role }` (HMAC with `SESSION_SECRET`, `maxAge: 28800` — expires after 8 hours).
- **Role → route group mapping:**
  - `stylist` → `(stylist)` routes: `/onboarding`, `/explore`, `/explore/[id]`
  - `cashier` → `(cashier)` routes: `/billing`, `/returns`
  - `owner` → `(admin)` routes: all above + `/dashboard`, `/inventory*`, `/settings`
- `middleware.ts` redirects wrong-role or unauthenticated requests to `/`.
- Logout: `POST /api/auth/logout` → clear cookie → redirect `/`.
- **Logout button** visible at top-right on all authenticated pages (or inside a burger menu on small screens).

## InsForge Client Pattern

```typescript
// lib/insforge/client.ts — browser only (live search)
import { createClient } from '@insforge/sdk';
export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

// lib/insforge/server.ts — server components, route handlers, actions
export function createServerClient() {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });
}
```

## Groq Vision Pattern

```typescript
// app/api/inventory/autofill/route.ts — server only
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const completion = await groq.chat.completions.create({
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'You are a fashion inventory assistant. Look at this dress image and extract structured details. Return JSON only.',
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
        },
      ],
    },
  ],
  response_format: { type: 'json_object' },
  max_tokens: 512,
});

const data = JSON.parse(completion.choices[0].message.content!);
// data shape: { name, category, gender, colors[], occasionTags[], fabric, suggestedPrice }
```

Full contract in `library-docs.md`.

## API4.AI Try-On Pattern

```typescript
const form = new FormData();
form.append('url', personImageUrl);
form.append('url-apparel', garmentPublicUrl);

const res = await fetch(process.env.API4AI_ENDPOINT!, {
  method: 'POST',
  headers: authHeaders(),       // see library-docs.md
  body: form,
  signal: AbortSignal.timeout(60_000),
});
const data = await res.json();
const base64 = data.results[0].entities[0].image; // base64 JPEG
```

## Invariants

1. Every recommendation and try-on row references a `styling_sessions` row.
2. Every `bill_items` row references a `bills` row; `bills.total_amount` equals the sum of its items.
3. `lib/scoring/` is pure — same inputs, same outputs, always. No DB, no fetch, no randomness.
4. The API4.AI key and Groq API key exist **server-side only**. The client never calls either directly.
5. All enum strings (categories, occasions, payment modes, statuses) come from `lib/constants.ts` — one source of truth.
6. Role checks happen in `middleware.ts` AND in every server action/route handler.
7. Prices are stored in ₹ as numerics; rendered with `formatINR()` from `lib/format.ts`.
8. `dress_id` values are unique and never reused; used as the primary lookup key for billing and returns.
9. Customer photos and try-on previews live in private buckets; inventory images are public.
10. Staff passwords are stored as bcrypt hashes (`password_hash`); plaintext passwords are never written to the database.
