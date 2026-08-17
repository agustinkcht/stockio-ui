# Layout & UI Guide

> **Purpose.** This document describes how the app's views are structured — which
> regions belong to the global app shell, which are shared view-level patterns, and
> which are route-specific — so the UI can be re-skinned or rewritten in a new style
> without losing the structural contract. It complements the per-module docs in
> [`modules/`](./modules); those describe *behavior*, this describes *layout & styling*.
>
> **Reference route.** `catalogo/items` (`app/catalogo/items/page.tsx`) is the canonical
> example of the full shell. When in doubt, read that page.
>
> **Status of the codebase.** The layout is mid-transformation. The shell is currently
> **inlined per page**, not composed from shared layout components. See
> [§7 Current state & known debt](#7-current-state--known-debt) before refactoring —
> several files in `components/layout/` are **legacy and unused**.

---

## 1. At a glance

Every screen is built from two top-to-bottom columns: a **fixed icon Sidebar** on the
far left (identical on every route) and a flexible **Main panel** filling the rest. The
main panel stacks, from top to bottom: a **navbar** (not a solid bar — a set of
"floating pills" resting over the content: a breadcrumb pill on the left, and bell +
profile pills on the right), a **top section** (view title on the left, primary
action button(s) on the right, occasionally an extra control like a period selector),
and then **view-specific content**.

View-specific content comes in two archetypes. A **Grid view** (the default landing
view of a module — items, stock, precios, clientes, compras, etc.) pairs a
search / filter / sort / bulk-actions bar with a grid of records for scanning and
bulk operations. A **Detail view** (`.../[id]`, `.../nuevo`) is the drill-in editor for
a single record and is shaped per module — the item detail looks nothing like the
compra detail. The shell (sidebar + navbar pills + title row) stays constant across
both; only the region below the title row changes.

The whole surface is themed through CSS custom properties in `app/globals.css`. The
shared scrollable background of every grid view is a single token, `--panel-content`,
which exists specifically so all list views can be re-skinned by changing one value.

---

## 2. Quick facts

| Aspect | Value |
| --- | --- |
| Reference route | `app/catalogo/items/page.tsx` |
| Global shell components | `Sidebar` (only truly shared one) |
| Theme source | `app/globals.css` (`:root`, `.dark`, `@theme inline`) |
| Fonts | `Geist` (sans/mono), `Source Serif 4` (serif) — set in `app/layout.tsx` |
| Default color scheme | Light; `.dark` overrides defined but no global toggle wired |
| Sidebar width | `w-20` (fixed, 5rem) |
| Corner radius base | `--radius: 1.125rem` |
| Shared list background token | `--panel-content` (`#F1F5F9`) |
| Layout technique | Flexbox (`flex h-screen`), sticky headers, per-page JSX |
| Content max width | `max-w-6xl mx-auto` inside grid views |

---

## 3. The global app shell

### 3.1 Sidebar — the only genuinely shared region

- **File:** `components/layout/sidebar.tsx`. **Data:** `SIDEBAR_ITEMS` and
  `BOTTOM_SIDEBAR_ITEMS` from `lib/constants.ts`.
- Fixed `w-20`, full viewport height (`h-screen`, `sticky top-0`), `bg-sidebar`.
  Runs edge-to-edge top-to-bottom on the far left — the same component and the same
  data on **every** route.
- Each entry is a vertical icon + `text-[10px]` label. A module with children renders a
  **flyout dropdown panel** (`absolute left-full`) on click, not a solid submenu.
- **Active state** is derived from `usePathname()`: a module is active when the path
  matches its `href` (or `href + "/"`), or when any of its dropdown children's
  `/segment/segment` prefix matches. Active/open items use `bg-sidebar-accent` +
  `text-sidebar-foreground`; idle items use `text-sidebar-muted`.
- **Bottom nav** (`BOTTOM_SIDEBAR_ITEMS`) is pinned with `mt-auto`; "Ajustes" routes to
  `/ajustes`.
- Imported by **all** app pages. When re-styling, this is the one component to change
  once and have it apply everywhere.

### 3.2 Navbar — floating pills, not a bar

There is **no solid-background navbar**. Instead, capsule "pills" sit directly over the
top of the panel content and appear to float on it. In the reference route this row is:

- A sticky container (`sticky top-0`, `bg-slate-300` in the current skin) spanning the
  panel width, `flex items-center justify-between`.
- **Left:** a **breadcrumb pill** — `Breadcrumb` (`components/layout/breadcrumb.tsx`,
  `variant="dark"`) inside a dark rounded-full capsule (`bg-[#151721] rounded-full`).
  Breadcrumb items are passed explicitly per page (e.g. `["Catálogo", "Items"]`); the
  component can also auto-generate from the pathname as a fallback.
- **Right:** transient save/status toasts, then a circular **bell pill**, then a
  **profile pill** (business name + avatar) that opens a dropdown (Editar Perfil →
  `/perfil`, Cerrar Sesión → `logout` from `AccountProvider`).

> This region is currently **written inline in each page**, not a shared component.
> See §7.

### 3.3 Top section — title + primary actions

Directly below the pill row, scrolls away with the content (not sticky):

- **Left:** the view **title** — `h1`, `text-3xl md:text-4xl font-semibold tracking-tight`.
- **Right:** the view's **primary action(s)** — e.g. the "Nuevo Item" split button in
  `catalogo/items` (dropdown → Creación Individual / Creador Masivo). Dark button skin
  `bg-[#151721] text-white`.
- **Optional extras:** some views place an extra control here, e.g. the **period
  selector** on `compras/compras` and `dashboard`.
- Constrained to `max-w-6xl mx-auto` to align with the grid below.

---

## 4. View-specific content

Below the pill row and title row, each route renders its own content. Two archetypes
cover most of the app.

### 4.1 Grid view (module landing)

The default view of a module: a grid of records for scanning + bulk operations. It is
composed, top to bottom, of a **sticky utility bar** and then the **grid**.

**Sticky utility bar** (`sticky`, sits under the pill row): a combined structure of
some or all of —

- **Search bar** — free-text filter (e.g. "Buscar items").
- **Filter / Order buttons** — the **Filtrar** button opens a **modal** to set or wipe
  filters; active filters render as **removable tag chips** next to the search bar (the
  `catalogo/items` filter modal is the canonical pattern all views should follow).
  **Ordenar** sets the sort field/direction.
- **Result count** — "N items".
- **Bulk actions region** — a select-all control plus a slot where contextual bulk
  action buttons appear once rows are selected. **Not present in every view.**
- **Tab header** — an optional row of tabs for views that segment their grid.
  **Not present in every view.**

**Filtering widgets** — present in views like `compras`, `ventas`, `presupuestos`:
clickable summary cards that surface important aggregate info and apply as a filter when
clicked. These sit above/within the utility area depending on the view.

**Grid structures** come in two flavors:

- **Floating grid** — cards that "float" with gaps, used by the `catalogo/items` grid.
- **Uniform grid** — dense, tabular, aligned rows, used by `stock`, `lista-de-precios`,
  `clientes`, `proveedores`, etc.

### 4.2 Detail view (drill-in editor)

Reached at `.../[id]` (existing record) or `.../nuevo` | `.../nueva` (creation wizard).
Shows and edits one record. **Detail views are intentionally module-specific** — the
`catalogo/items` item detail (flip card + info/atributos card, or variant matrix for
agrupadores) is structurally unrelated to the `compras`/`ventas` document detail
(header + line items + payment/delivery/returns sections). What they share is only the
outer shell (sidebar + pill row + title row); everything below is per module. See the
relevant `modules/*.md` for each detail view's internal structure.

---

## 5. Theming & styling system

All styling flows through CSS custom properties in `app/globals.css`. **Do not
hard-code colors** when re-skinning — change the tokens.

### 5.1 Token groups (`:root`)

- **Base** — `--background`, `--foreground`, `--card`, `--popover`.
- **Semantic** — `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`,
  `--success` (+ their `-foreground` pairs).
- **Layout components** — `--sidebar-*` (sidebar surfaces, `--sidebar-muted` for idle
  icons), `--navbar-*`, `--toolbar-header-*`, `--container-item-*` (agrupador rows).
- **`--panel-content`** — the shared scrollable background for **every** main list view
  (Catálogo, Lista de Precios, Stock, Clientes, Proveedores, Compras, Ventas,
  Presupuestos, Órdenes de Compra). **Change this one value to re-skin all of them at
  once.** (Note: the reference page currently also uses literal `bg-slate-300` in the
  pill/title rows — see §7 debt.)
- **Surface / text hierarchy** — `--surface-elevated`, `--surface-hover`,
  `--text-primary/secondary/subtle/disabled`.
- **Charts** — `--chart-1..5`. **Radius** — `--radius` (+ computed `-sm/md/lg/xl`).
  **Shadows** — computed `--shadow-*` scale.

### 5.2 Dark mode

`.dark` redefines the full palette (monochrome). The tokens exist and are complete, but
there is **no global light/dark toggle wired** in the shell today — light is the
effective default. A re-skin can lean on this by toggling the `.dark` class on `<html>`.

### 5.3 Tailwind mapping (`@theme inline`)

Tokens are exposed to Tailwind as utilities (`--color-*`), so `bg-panel-content`,
`text-sidebar-muted`, `bg-navbar`, `border-toolbar-border`, etc. are available directly.
Custom grid templates `grid-cols-20` / `grid-cols-32` and the three font families
(`font-sans`, `font-mono`, `font-serif`) are also declared here.

### 5.4 Fonts

Set in `app/layout.tsx`: **Geist** (`font-sans` / `font-mono`) and **Source Serif 4**
(`font-serif`, weights 200–900). `<html>` and `<body>` carry `bg-panel-content` and
`font-sans antialiased`.

### 5.5 Custom utilities & animations

Defined at the bottom of `globals.css`: `.blur-glass` (backdrop blur for floating
overlays), `.animate-loading-bar`, `.animate-fade-out` (3s success toast fade),
`.animate-live-pulse`.

### 5.6 Global providers

`app/layout.tsx` wraps everything in `SettingsProvider` → `PeriodProvider` →
`AccountProvider`. `SettingsProvider` (price/IVA behavior) and `PeriodProvider`
(dashboard/compras period) influence view content; `AccountProvider` supplies the
profile pill and logout.

---

## 6. Layout conventions & primitives

- **Outer scaffold:** `<div className="flex h-screen overflow-hidden">` → Sidebar (fixed)
  + right column (`flex-1 flex flex-col h-screen overflow-hidden`) whose `<main>` scrolls.
- **Layout method:** Flexbox first; `sticky` for the pill row and utility bar; CSS grid
  only for the record grids themselves. Avoid absolute positioning except for
  dropdowns / flyouts / overlays.
- **Content width:** grid views center on `max-w-6xl mx-auto`; keep the title row and
  utility bar on the same max width so columns align.
- **Z-index ladder (high):** sidebar & its flyout use the `z-[100000]+` band; the sticky
  pill row `z-[100004]`; dropdowns above their trigger. Preserve relative ordering when
  refactoring or flyouts will hide behind content.
- **Primitives:** shadcn/ui in `components/ui/` (`button`, `dialog`, `popover`,
  `dropdown-menu`, `command`, `input`, `checkbox`, `tooltip`, `loading-bar`). Prefer
  these over bespoke elements when rebuilding.
- **Icons:** `lucide-react` throughout; standard sizes `w-4 h-4` / `w-5 h-5`.

---

## 7. Current state & known debt

This is the "stopped before a layout transformation" state — read this before any
re-skin so you don't build on the wrong foundation.

1. **The shell is inlined per page, not shared.** The pill navbar, title row, and
   search/bulk bar are hand-written in each `page.tsx` (see `catalogo/items` lines
   ~439–571). Only the **Sidebar** and **Breadcrumb** are shared components. A re-skin
   that edits one page will **not** propagate — the intended refactor is to extract the
   pill row + title row + utility bar into shared components (an "AppShell"/"GridView"
   wrapper) and have every route consume them.
2. **Legacy, unused layout components exist.** `components/layout/header.tsx` (a solid
   dark `bg-gray-950` bar), `top-nav.tsx` (a different floating-pill attempt with mock
   bookmarks), `toolbar.tsx`, `utility-bar.tsx`, `utility-bar-shared.tsx` (a
   `bg-[#1B1C20]` bar with Deshacer/Guardar), and `user-panel.tsx` are **not used by the
   current app routes** (no `app/**/page.tsx` imports them). They represent an **older
   layout model** — do **not** treat them as the source of truth, and prefer deleting or
   fully rewriting them during the transformation rather than wiring them back in.
3. **Hard-coded colors alongside tokens.** The reference page mixes literal values
   (`bg-slate-300`, `bg-[#151721]`, `text-slate-900`) with tokens. The transformation
   should migrate these literals onto tokens (`--panel-content`, `--navbar`, etc.) so the
   single-value re-skin promised by `--panel-content` actually holds everywhere.
4. **Mock/placeholder data in shell UI.** `top-nav.tsx` bookmarks and the hard-coded
   `"In Vino Veritás - Admin"` label are placeholders; the live profile comes from
   `AccountProvider`. Ignore the mock sources when rebuilding.
5. **No global dark-mode toggle.** `.dark` tokens are ready but unwired.

### Recommended target structure (for the rewrite)

```
<AppShell>                         // fixed Sidebar + right column scaffold + providers
  <NavbarPills                     // shared: breadcrumb pill + bell + profile pill
    breadcrumbs=... />
  <ViewHeader                      // shared: title + primary actions + optional extras
    title=... actions=... />
  <GridView | DetailView>          // per-route content
    <UtilityBar                    // shared: search + filter/order + count + bulk + tabs
      .../>
    <RecordGrid variant="floating|uniform" .../>
  </...>
</AppShell>
```

Extracting these four shared pieces (`AppShell`, `NavbarPills`, `ViewHeader`,
`UtilityBar`) from the inlined `catalogo/items` markup — and driving all color through
the existing tokens — is the concrete goal of the paused transformation.

---

## 8. Change-safety checklist

- [ ] Re-skinning colors? Edit **tokens in `globals.css`**, not per-page literals — and
      migrate any literal (`bg-slate-300`, `bg-[#151721]`) you touch onto a token.
- [ ] Changing the shared list background? Change **`--panel-content`** once.
- [ ] Touching the shell (navbar pills / title / utility bar)? Remember it is **inlined
      per page** today — replicate to every route, or (preferred) extract to a shared
      component first.
- [ ] Do **not** import from `header.tsx` / `top-nav.tsx` / `toolbar.tsx` /
      `utility-bar*.tsx` / `user-panel.tsx` — they are legacy/unused. Verify with a
      usage search before relying on any layout component.
- [ ] Editing the Sidebar? It is global — confirm active-state logic against
      `usePathname()` for every module and its dropdown children.
- [ ] Adding a grid view? Follow the `catalogo/items` pattern: `max-w-6xl` container,
      sticky utility bar, filter-modal + tag-chips, floating vs. uniform grid choice.
- [ ] Preserve the **z-index ladder** so sidebar flyouts and dropdowns stay on top.
- [ ] Keep breadcrumbs explicit per page; the auto-generator is only a fallback.
