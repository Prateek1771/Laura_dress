# VivahStyle — UI Registry

## How to Use

This is a living catalog of every UI component that has been built, with its file path and the exact Tailwind classes it uses. Before building anything new:

1. Check this registry for an existing component that does the job — reuse it.
2. If a new component resembles an existing one, copy its class patterns exactly so the app stays visually consistent.
3. After building or changing a component, update its entry here in the same commit.

Format per entry: component name (H3), file path, then the key class strings with a one-line description of each part.

## Components

### Button
`components/ui/Button.tsx`
- Base: `inline-flex items-center justify-center font-sans text-sm font-semibold rounded-[--radius-button] transition-colors disabled:opacity-40`
- Primary: `bg-primary text-white hover:bg-primary-hover min-h-[44px] px-5 py-3`
- Secondary: `bg-surface text-primary border border-border hover:bg-surface-soft min-h-[44px] px-5 py-3`
- Ghost: `text-ink-secondary hover:bg-surface-soft px-3 py-2`
- Props: `variant` (primary | secondary | ghost), `size` (sm | md | lg)

### Card
`components/ui/Card.tsx`
- `bg-surface border border-border rounded-[--radius-card] shadow-[0_1px_3px_rgb(43_33_24/0.06)] p-5`
- Props: `padding` (boolean, default true)

### Badge
`components/ui/Badge.tsx`
- Base: `inline-flex items-center rounded-[--radius-badge] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide`
- Variants: default (maroon tint), success, warning, danger, info, neutral, pay-cash, pay-upi, pay-card, pay-netbanking, dress-id
- Props: `variant`

### Input
`components/ui/Input.tsx`
- Field: `bg-surface border border-border rounded-[--radius-input] px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted`
- Focus: `focus:border-primary focus:ring-2 focus:ring-primary-soft`
- Error: `border-status-danger`
- Label: `text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted`
- Props: `label`, `error`, `hint`

### Select
`components/ui/Select.tsx`
- Same token classes as Input, with `appearance-none cursor-pointer`
- Props: `label`, `error`, `placeholder`, `options: { value, label }[]`

### ScoreBar
`components/ui/ScoreBar.tsx`
- Track: `h-1.5 w-full rounded-full bg-score-track`
- Fill: `h-full rounded-full` + tier color (bg-score-excellent / bg-score-strong / bg-score-good)
- Label: `text-sm font-bold` in tier text color
- Tier word: `text-[11px] text-ink-muted`
- Props: `score` (0–100), `showLabel`, `showTier`

### ImageGallery
`components/ui/ImageGallery.tsx`
- Main: `relative aspect-[3/4] w-full overflow-hidden rounded-[--radius-card] bg-surface-soft`
- Thumbnail: `relative flex-none w-16 aspect-[3/4] rounded-lg overflow-hidden border-2`
- Active thumbnail border: `border-primary`; inactive: `border-transparent`
- Count badge: `bg-ink/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full`
- Props: `images: string[]`, `alt: string`

## Feature Components (built Phase 1, Features 03–07)

Reuse these before building anything similar. Most live outside `components/ui/` because they are feature-specific, but several are general enough to lift.

### Inventory — `components/inventory/`
- `ItemForm.tsx` (client) — full create/edit form; gender→category switching, chip multi-selects, tag input, `ImageUploader`, and the Groq Auto-Fill button (gold left-border `border-l-4 border-l-gold` marks AI-filled fields). Takes `action` (server action) + optional `item`.
- `ImageUploader.tsx` (client) — drag-drop + canvas resize to ≤1024px JPEG; lifts `files: File[]` and `existing: string[]` to the parent. Reuse for any image upload (e.g. Feature 12 customer photo).
- `InventoryTable.tsx` (server) — table with `<form action={serverAction}>` row buttons; the availability `<select>` needs `key={item.availability}` to resync after a toggle.
- `FilterBar.tsx` (server) — plain GET `<form>`, zero client JS.

### Billing / Returns — `components/billing/`, `components/returns/`
- `BillingClient.tsx` (client) — cart + payment segmented control + invoice panel. Calls `GET /api/inventory/lookup?dressId=` for dress lookup.
- `ReturnsForm.tsx` (client) — dress lookup + notes + success banner.

### Onboarding / Explore / Dress — `components/onboarding/`, `components/explore/`, `components/dress/` (Phase 2)
- `OnboardingForm.tsx` (client) — Shopping-For tap cards, occasion chips, Shopping-For-driven category (two selects for Couple), price range → `createSession`.
- `ExploreClient.tsx` (client) — responsive grid (2/3/4 cols), sort, inline filter panel, "Shop Suggested" (calls `/api/recommendations`, sorts by score, dims non-matches, kids note, no-session banner). Also hosts the couple **Find Match** flow (`wantsCombo` → `CoupleMatchPanel`, anchor-keyed cache) and the **📷 Gallery** top-bar button + `openGallery` prop (`?gallery=1`) → `TryOnGalleryModal`.
- `DressCard.tsx` (server) — 3:4 image card, category badge, stock dot, optional `{score}% Match` badge; links with `?session=`. Optional `onFindMatch?(item)` prop renders a corner **"✨ Find Match"** button (Feature 14, couple mode) that `preventDefault`/`stopPropagation`s so it doesn't trigger the card link.
- `CoupleMatchPanel.tsx` (client, Feature 14) — right slide-over (full-width on mobile) listing top-5 partner outfits from `POST /api/couple`. **Compatibility ring** = pure CSS `conic-gradient(var(--color-primary) {v*3.6}deg, var(--color-score-track) 0)` with a centered surface disc (no chart lib — reuse this for any ring gauge). Three mini-bars reuse `ScoreBar` (`showLabel/showTier={false}`). Caches results in a `Map` keyed by anchor id (passed in by parent) — re-open doesn't refetch.
- `DressActions.tsx` (client) — role buttons (Copy Dress ID / Add to Bill) **plus** the try-on flow: `PhotoModal` (take/upload + consent + canvas resize) and the try-on `TryonModal` (calls `/api/tryon`, shows base64 preview). The gallery button now opens the shared `TryOnGalleryModal` (no longer inline). Reuse the modal `Overlay` pattern here for any future modal.
- `TryOnGalleryModal.tsx` (client, Feature 15) — shared full-screen try-on gallery overlay used by both `DressActions` and `ExploreClient`. Self-fetches `GET /api/tryon?sessionId=`. Side-by-side card per try-on: product primary image (left) + generated preview via `/api/tryon/{id}/image` streaming route (right), name, date, "Try Another Dress →" link. Empty state copy built in. Reuse for any session-scoped media grid.

### Settings — `components/settings/` (Phase 3, Feature 16)
- `SettingsClient.tsx` (client) — owner-only two-section settings: **Store** (read-only name, store code + Copy + Regenerate behind `confirm()`, currency ₹INR, tax-percent input + Save) and **Staff** (list with role `Badge` + Inactive badge, inline Add Staff form with server-side duplicate-password error, Deactivate/Activate toggle). Calls server actions in `app/(app)/settings/actions.ts`. Local `Field` helper for label+value rows.

### Dashboard — `components/dashboard/`
- `StatCard.tsx` (server) — `{ label, value, hint? }` metric card. Reusable anywhere.
- `RecentBillsTable.tsx` (server) — consumes PostgREST-embedded bills (`staff(name)`, `bill_items(inventory_items(dress_id))`).
- `BillsByModeChart.tsx` (client, recharts v3) — **token pattern:** SVG `fill` can't use CSS vars, so resolve `--color-chart-1..4` via `getComputedStyle(document.documentElement)` at runtime and pass hex to `<Cell fill>`. Copy this pattern for any future chart; never put `var(--…)` directly in a recharts `fill`.
