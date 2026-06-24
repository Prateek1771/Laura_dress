# VivahStyle — UI Rules

Design language: premium Indian wedding boutique. Warm ivory surfaces, deep maroon, restrained gold. Calm, spacious, image-forward. The stylist shows the explore page directly to the customer on a tablet — every screen must look elegant enough for that.

## Fonts

```typescript
// app/layout.tsx
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
```

Playfair Display: page headings (h1/h2), dress names on the detail page, card titles. Inter: everything else.

## Layout

- Page background `ivory`, content max-width 1200px centered, horizontal padding 24px (tablet) / 32px (desktop).
- Navbar 64px tall, `surface` bg, 1px bottom `border`.
- Section gap 32px; card grid gap 16px.
- **Tablet-first for stylist pages** (`/onboarding`, `/explore`, `/explore/[id]`): design at 1024×768 landscape first; usable at 768px portrait.
- **Desktop-first for admin pages** (`/dashboard`, `/inventory*`, `/billing`, `/returns`, `/settings`).
- All tap targets on stylist pages: minimum 44px.

## Navbar

- Left: store name — Playfair 20px/700 `primary`.
- Center: role-based links — Inter 14px. Active: `primary` text + 2px `gold` underline. Inactive: `ink-secondary`, hover `ink`.
- **Right: staff first name (`ink-muted` 13px) + Logout button** — always visible. On tablet/small screens collapse into a burger icon that expands a dropdown showing nav links + Logout at the bottom.
- Logout triggers `POST /api/auth/logout` → cookie cleared → redirect `/`.

## Cards

`surface` bg · 1px `border` · 12px radius · 20px padding · shadow `0 1px 3px rgb(43 33 24 / 0.06)`. No heavier shadows, no glassmorphism, no gradients.

## Typography Hierarchy

Three levels per screen:

1. Page/section headings — Playfair, `ink`
2. Body and values — Inter 14px; values/prices 600 `ink`, supporting text 400 `ink-secondary`
3. Labels and meta — Inter 11px uppercase `ink-muted` (form labels), 12px `ink-muted` (meta/timestamps)

## Badges

Pill (999px) · 4px×10px · Inter 11px/600 uppercase · tinted background + token text. Color mapping in `ui-tokens.md` — never pick badge colors ad hoc.

## Buttons

- One primary button per view — the main action.
- All others: secondary.
- Destructive confirm dialogs use `status-danger` text.
- Icons inside buttons at 16px, left of label.

## Form Inputs

Labels always above inputs (uppercase 11px `ink-muted`). Errors: `status-danger` 12px under field + `status-danger` border. Currency inputs show fixed `₹` prefix. Selects and multi-select chips reuse input borders/radius.

**AI-suggested fields** (inventory auto-fill): 2px `gold` left border + `gold-soft` bg tint. Remove both on user edit.

## Inventory Table

- Full-width table; header row `surface-soft`; column headers in 11px uppercase `ink-muted` label style.
- Rows: 12px vertical padding, `border-b` divider, hover `ivory` bg.
- Thumbnail column: 40×40 `object-cover`, 6px radius.
- Stock dot: 8px circle — green/amber/red per availability.
- Dress_id column: monospace pill badge in `surface-soft`.
- Numeric columns (price, quantity) right-aligned, Inter 600.
- Actions column: compact icon buttons (Edit = pencil, Deactivate = toggle).

## Explore Page Grid

- 4 cols desktop / 3 cols tablet landscape / 2 cols portrait.
- Dress card: 3:4 portrait image area, `object-cover`, name (Playfair 14px), category badge, price (Inter 600), stock dot. Match score badge in top-right corner of image (only when Shop Suggested active).
- Card tap → `/explore/[id]`.
- "Shop Suggested" active state: matching cards full opacity, non-matching cards at 50% opacity with grey-tinted filter, sorting shifts to score-descending.
- Sticky top bar: does not scroll away. Filter side panel slides in from right.

## Dress Detail Page

- Image gallery: swipeable (touch-friendly), full-width 3:4 portrait images — NEVER square-cropped. Thumbnail strip below. Image count badge.
- Details panel below (or right-side on desktop): all dress info in consistent label+value pairs.
- Match score section: ScoreBar + reason chips, visually separated from price by a divider.
- "✨ Preview My Look" — always this exact copy. Primary button. One try-on at a time.
- Try-on loading: shimmer 3:4 placeholder + rotating copy ("Draping the outfit…", "Adjusting the fit…").
- Try-on preview: fills modal 3:4 portrait. Never cropped.
- "Add to Bill" — secondary button, below the primary.

## Billing Page

- Two columns on desktop (Cart left / Payment right). Stacked on tablet.
- Cart: dress_id search input + "Add" button — minimum 44px tap target; each row shows thumbnail (40px), name, price, quantity stepper (+/−), remove icon.
- Payment mode: segmented control — Cash · UPI · Card · Net Banking. Selected segment: `primary` bg white text. Unselected: `surface` bg.
- Conditional payment ref field appears with a smooth height animation (no layout jump).
- Invoice summary after finalise: styled as a printable receipt card.

## Onboarding Form

- Single scrollable page, not a wizard.
- "Shopping For" — four large tap cards (min 80px tall, 2 cols) with label + icon. Selected: `primary-soft` bg + 2px `primary` border.
- Occasions — multi-select chips; selected: `primary` bg white text; unselected: `surface` + 1px `border`.
- Category/Style Preference — 2-col chip grid.
- Price Range — two `₹` prefixed inputs side by side.
- "Start Exploring" button full-width at bottom of form.

## Try-On Button Copy

The button is **always "✨ Preview My Look"** — never "Generate", "AI Try-On", "Virtual Try-On", or "Generate Image".

## Empty States

One icon (24px `ink-muted`) + one line `ink-secondary` text + optional primary action button. No illustrations.

## Loading States

- Explore grid: skeleton dress cards (`surface-soft` blocks) — never spinners.
- Try-on generation: shimmer 3:4 placeholder with rotating copy.
- Buttons: disabled + 16px inline spinner while submitting.
- Auto-fill: "Analysing…" text inside the button + spinner.

## Tailwind v4 Note

Tokens defined with `@theme` in `globals.css` (see `ui-tokens.md`). No `tailwind.config.js` for colors — utilities like `bg-primary`, `text-ink-muted`, `border-border` come from theme variables directly.

## Do Nots

1. No hex values in components — tokens only.
2. No gradients, glassmorphism, or heavy box shadows.
3. No Playfair in body text, buttons, badges, tables, or form inputs.
4. No more than one primary button per view.
5. No square-cropped dress or try-on images.
6. No "Generate Image" or "AI Try-On" copy anywhere customer-visible — always "✨ Preview My Look".
7. No rental or appointment UI of any kind.
8. No tap targets below 44px on stylist pages.
9. No new badge colors outside `ui-tokens.md` — use the defined status and payment tokens.
10. No dark mode in V1.
