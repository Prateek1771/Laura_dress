# VivahStyle — Project Overview

## About the Project

VivahStyle is the operating system for local Indian wedding fashion boutiques. It combines AI-powered inventory management (Groq vision auto-fill), customer styling sessions, a virtual try-on feature, billing, and sales analytics into a single in-store platform used by staff on tablets and desktops.

It is **not an ecommerce platform**. Customers never use it directly online. Store staff drive every interaction inside the boutique.

## The Problem It Solves

Today, most wedding boutiques work like this:

```text
Customer enters store
↓
Employee asks a few questions
↓
Shows random dresses
↓
Customer gets overwhelmed
↓
May or may not buy
```

VivahStyle transforms this into:

```text
Customer enters store
↓
Guided Onboarding (2 minutes)
↓
Explore Page (full inventory, smart filter)
↓
"Shop Suggested" (AI-matched dresses for this customer)
↓
Dress Detail + Virtual Try-On
↓
Billing
↓
Analytics
```

The store gains structured customer data, faster consultations, higher conversion, and visibility into what actually sells.

## User Types

### 1. Stylist Interface

Used by: sales executives, store stylists.
Device: tablet (primary).
Purpose: guide customers through onboarding, browse the explore page, and run virtual try-ons.

### 2. Cashier Interface

Used by: cashier.
Device: tablet or desktop.
Purpose: create bills, record returns.

### 3. Owner / Admin Interface

Used by: owner, manager.
Device: desktop (primary).
Purpose: manage inventory, view financial dashboard, handle billing, manage staff, configure store settings.

## Pages

| Route | Page | Roles |
|---|---|---|
| `/` | Store gate — store code + password | Everyone (pre-auth) |
| `/onboarding` | Customer onboarding form | Stylist, Owner |
| `/explore` | Dress explore grid | Stylist, Owner |
| `/explore/[id]` | Dress detail + virtual try-on | Stylist, Owner |
| `/billing` | Billing / invoice | Cashier, Owner |
| `/returns` | Returns form | Cashier, Owner |
| `/dashboard` | Financial dashboard | Owner |
| `/inventory` | Inventory table | Owner |
| `/inventory/new` | Add inventory item (with Groq auto-fill) | Owner |
| `/inventory/[id]/edit` | Edit inventory item | Owner |
| `/settings` | Store config + staff management | Owner |

## Navigation

Navigation is role-based. Role comes from the password entered at the store gate.

- **Stylist:** Onboarding · Explore
- **Cashier:** Billing · Returns
- **Owner:** Dashboard · Inventory · Billing · Returns · Settings

Logout button always visible at top-right or inside a burger dropdown on tablet/small screens.

## Authentication Model

No public signups. Access:

1. App opens at the **store gate**: store code + password fields.
2. Store code must match `store_settings.store_code`.
3. Password is verified against the `staff` table using `bcrypt.compare()` — passwords are stored as hashes (`password_hash`), never plaintext. Each staff member has their own password and role (`owner` | `cashier` | `stylist`).
4. The matched role determines which pages the user sees. `middleware.ts` enforces this on every protected route.
5. Logout clears the session cookie and returns to the store gate.

## Core User Flow

### Store Gate

Staff enters store code + their personal password. On success they land on their role's home page: Stylist → `/onboarding`, Cashier → `/billing`, Owner → `/dashboard`.

### Customer Onboarding

Stylist fills the form with the customer:

- **Full Name**
- **Age** (optional)
- **Shopping For:** Male · Female · Couple · Kids
- **Occasions:** multi-select — Wedding, Reception, Engagement, Sangeet, Haldi, Mehendi, Cocktail, Festive, Pre-Wedding Shoot, Other
- **Category / Style Preference:** driven by Shopping For:
  - Male: Sherwani, Indo Western, Jodhpuri, Kurta Jacket Set, Kurta Set, Short Kurta, Kurta, Suit Accessories, Others
  - Female: Lehenga, Saree, Stitched Suit, Accessories
  - Couple: separate Male + Female preferences
  - Kids: no category (skip field)
- **Matching Dress Combo:** toggle (for couples — find bride + groom complementary outfits)
- **Price Range:** min ₹ + max ₹ inputs

Submitting the form creates a `styling_sessions` row and redirects to `/explore`.

### Explore Page

Full-screen ecommerce-style grid of all active inventory:

- **Sort:** Price Low→High, Price High→Low, Newest, A–Z
- **Filter panel:** gender, category, color, price range
- **"Shop Suggested" button:** calls the scoring engine with the current session's preferences → filters the grid to matched items, each showing a match score badge. Items are sorted by score descending.

Without an active session, "Shop Suggested" is disabled with a tooltip "Start an onboarding session first."

### Dress Detail + Try-On

Individual dress page:

- Swipeable image gallery (all dress photos)
- Full details: name, category, color, fabric, sizes, price, tags
- **"✨ Preview My Look"** button — the virtual try-on feature:
  1. Stylist takes or uploads a photo of the customer (consent prompt shown)
  2. API4.AI generates the customer wearing the dress
  3. Preview modal with options to try other dresses or save the preview
- Try-on history for the session accessible via a gallery icon in the page header
- "Add to Bill" button → navigates to `/billing` with this item pre-populated

### Billing

Cashier builds a bill:

1. Enter a `dress_id` → item details appear in the cart row
2. Set quantity per item
3. Add more items by repeating the dress_id search
4. Select **payment mode:** Cash · UPI · Card · Net_Banking
5. Additional field per mode:
   - **Cash:** customer name
   - **UPI:** last 4 digits of transaction ID
   - **Card:** last 4 digits of card number
   - **Net_Banking:** no additional field
6. "Finalise Bill" → creates `bills` + `bill_items` rows → shows invoice summary

No payment is processed through the app — this is record-keeping only.

### Returns

Simple form — no workflow, no policy checks:

1. Enter `dress_id`
2. Add optional notes
3. "Record Return" → creates a `returns` row

### Owner Dashboard

Financial overview: total revenue, orders, average order value, revenue by payment mode (bar chart), recent bills table, returns count, and inventory stock level summary (in stock / low / out).

## Data Architecture

All data lives in InsForge (Postgres + storage). Core tables:

- `store_settings` — single store row
- `staff` — role-bearing password accounts
- `inventory_items` — all dresses with `dress_id` lookup key
- `styling_sessions` — onboarding form data; anchors recommendations and try-ons
- `recommendations` — scored item list for a session (Shop Suggested)
- `tryons` — generated try-on previews
- `bills` + `bill_items` — billing records
- `returns` — simple return records

Full schema in `architecture.md`.

Images: three InsForge storage buckets — `inventory-images` (public), `customer-photos` (private), `tryon-previews` (private).

## Features In Scope (V1)

- Store gate auth with role-based access (owner / cashier / stylist)
- Inventory management: table UI, CRUD, Groq vision auto-fill on image upload
- Customer onboarding form (creates session)
- Explore page with sort, filter, and "Shop Suggested" AI filter
- Dress detail page with image gallery
- Virtual try-on via API4.AI ("✨ Preview My Look")
- Try-on gallery per session
- Couple combo matching (harmonious outfit suggestions)
- Billing / invoice (dress_id cart, payment modes, no payment processing)
- Returns form (dress_id + notes)
- Financial dashboard
- Staff management and store settings

## Features Out of Scope (V1)

- Online customer-facing storefront or ecommerce — platform is staff-driven only
- Rental management — cancelled
- Appointment scheduling
- Trial session tracking
- Payment gateway integration
- Customer self-service or mobile app
- Multi-store / multi-tenant SaaS
- Couple try-on composite image (bride + groom combined) — future
- SMS / WhatsApp notifications — future

## PostHog Events

Exactly these events — no variations:

```typescript
posthog.capture('staff_logged_in', { role: string })
posthog.capture('session_started', {
  sessionId: string,
  shoppingFor: string,
  occasions: string[],
})
posthog.capture('recommendations_generated', {
  sessionId: string,
  count: number,
  topScore: number,
})
posthog.capture('dress_viewed', {
  sessionId: string | null,
  itemId: string,
})
posthog.capture('tryon_generated', {
  sessionId: string,
  itemId: string,
  success: boolean,
})
posthog.capture('bill_created', {
  billId: string,
  paymentMode: string,
  total: number,
  itemCount: number,
})
posthog.capture('return_recorded', {
  itemId: string,
  staffId: string,
})
```

## Target User

Indian wedding fashion boutiques: single-location stores selling sherwanis, lehengas, sarees, and suits. Staff are non-technical; the stylist interface must work one-handed on a tablet while talking to a customer.

## Success Criteria

- A stylist can complete onboarding and reach "Shop Suggested" results in under 3 minutes on a tablet.
- Groq auto-fill correctly identifies category, gender, and color for at least 80% of dress photos without manual correction.
- The cashier can build and finalise a 3-item bill in under 2 minutes.
- The owner can answer "what sold, how it was paid, and what was returned" from the dashboard without exporting data.

## Product Positioning

```text
AI Inventory Assistant
+
Smart Styling Recommender
+
Virtual Trial Room
+
Billing & Returns System
+
Sales Analytics Dashboard
```

Specialized for Indian wedding fashion boutiques.
