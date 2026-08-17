# UI Layout — Actual (Current State)

> **Purpose.** This document describes how the app's UI is **actually implemented today**,
> module by module. It is a snapshot of the *current* design as it exists right now — **not**
> how it should be. For the direction we are moving toward, see
> [`UI_DESIGN_SYSTEM_TARGET.md`](./UI_DESIGN_SYSTEM_TARGET.md).
>
> **One-line summary of today's reality:** `catalogo/items` is the **only** module built on
> the new design language. Every other module is still on the older look-and-feel and the
> shell is **inlined per page** rather than shared.
>
> **Companion docs.** Per-module *behavior* lives in [`modules/`](./modules); cross-module
> *data flow* in [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md). This
> doc is *layout & styling, as-built*.

---

## 1. At a glance

Every screen is two top-to-bottom columns: a fixed **icon Sidebar** on the far left
(identical on every route) and a flexible **Main panel** filling the rest. The outer
scaffold is `flex h-screen overflow-hidden bg-panel-content`; the sidebar is flush-left and
full height; the main panel scrolls.

Inside the main panel, each page hand-writes (top to bottom):

1. A **sticky top bar** — today a solid strip (`bg-slate-300` in the reference route) that
   carries a dark **breadcrumb pill** on the left and **bell + profile pills** on the right.
   It is *not* a transparent floating-pill row yet; the pills sit on a visible colored bar.
2. A **title row** — the view `h1` on the left, primary action button(s) on the right.
3. **View-specific content** — a grid, a detail editor, a creation wizard, or a bespoke
   working surface.

**None of this shell is shared.** The bar, title row, and utility bar are re-written in
every `page.tsx`. Only `Sidebar` and `Breadcrumb` are real shared components.

---

## 2. Quick facts (as-built)

| Aspect | Current value |
| --- | --- |
| Outer scaffold | `<div className="flex h-screen overflow-hidden bg-panel-content">` |
| Shared components | `Sidebar`, `Breadcrumb` (everything else is inlined) |
| Sidebar width | `w-20` (5rem), `h-screen sticky top-0` |
| Top bar (reference route) | `sticky top-0 bg-slate-300` strip with dark pills |
| Pills skin | `bg-[#151721] rounded-full` (hard-coded, not tokenized) |
| Title skin | `h1 text-3xl md:text-4xl font-semibold tracking-tight` |
| Primary button skin | `bg-[#151721] text-white` (hard-coded) |
| Content width | `max-w-6xl mx-auto` in grid views |
| Theme source | `app/globals.css` (`:root`, `.dark`, `@theme inline`) |
| Fonts | Geist (sans/mono) + Source Serif 4 (serif), set in `app/layout.tsx` |
| Dark mode | `.dark` tokens defined but **no toggle wired**; light is effective |
| Design-system coverage | **`catalogo/items` only**; all other modules on the old style |

---

## 3. The global app shell (as-built)

### 3.1 Sidebar — the only genuinely shared region

- **File:** `components/layout/sidebar.tsx`. **Data:** `SIDEBAR_ITEMS` /
  `BOTTOM_SIDEBAR_ITEMS` from `lib/constants.ts`.
- Fixed `w-20`, full viewport height, `bg-sidebar` (currently white, `--sidebar: #FFFFFF`).
  Same component + data on **every** route.
- Each entry is a vertical icon + `text-[10px]` label; modules with children open a
  **flyout dropdown panel** (`absolute left-full`) on hover/click.
- **Active state** derives from `usePathname()` (matches `href`, `href + "/"`, or a
  dropdown child's `/segment/segment` prefix). Active uses `bg-sidebar-accent`; idle uses
  `text-sidebar-muted`.
- **Bottom nav** pinned with `mt-auto`; "Ajustes" → `/ajustes`.

### 3.2 Top bar — a solid strip with pills (NOT floating pills yet)

In the reference route (`app/catalogo/items/page.tsx`, ~lines 439–489):

- Container: `sticky top-0 z-[100004] flex items-center justify-between px-8 py-3
  bg-slate-300`. This is a **visible solid bar**, not a transparent floating row.
- **Left:** breadcrumb pill — `Breadcrumb variant="dark"` inside `bg-[#151721]
  rounded-full px-4 py-2`.
- **Right:** transient save/status toasts, a circular **bell** (`w-10 h-10 rounded-full
  bg-[#151721]`), and a **profile pill** (`bg-[#151721] rounded-full`, business name +
  avatar) opening a dropdown (Editar Perfil → `/perfil`, Cerrar Sesión → `logout`).
- Colors are **hard-coded literals** (`bg-slate-300`, `bg-[#151721]`), not tokens.

Other modules replicate a similar bar with their own inlined markup and their own literal
colors — there is drift between them.

### 3.3 Title row — title + primary actions

Directly below the bar, scrolls with content (not sticky):

- **Left:** `h1 text-3xl md:text-4xl font-semibold tracking-tight`.
- **Right:** primary action(s) — e.g. the "Nuevo Item" split button (dropdown → Creación
  Individual / Creador Masivo), skinned `bg-[#151721] text-white`.
- **Optional extras:** a period selector on `compras/compras` and `dashboard`.
- Constrained to `max-w-6xl mx-auto` in grid views.

---

## 4. Content archetypes (as-built)

- **Grid view** — module landing: a **sticky utility bar** (search, Filtrar modal +
  removable tag chips, Ordenar, result count, optional bulk-actions region, optional tab
  header) above a record grid. Grids come in two flavors: **floating** (gapped cards, used
  by `catalogo/items`) and **uniform** (dense tabular rows, used by stock / precios /
  clientes / proveedores).
- **Detail view** (`.../[id]`) — per-module drill-in editor; structurally unique per module.
- **Creation / wizard view** (`.../nuevo`, `.../nueva`) — full-height two-column stepped
  wizard (left vertical stepper with completed/active/pending states + gating; right active
  step body). Inlined per page; hard-coded colors; Nuevo Item uses two step sets
  (`STEPS_INDIVIDUAL` / `STEPS_VARIANTES`) with a purple accent for variants.
- **Special views** (`creador-masivo`, `pdv`) — bespoke full-width working surfaces,
  currently **visually incomplete**.

---

## 5. Per-module current state

Legend: **New DS** = built on the new design language; **Old** = pre-transformation look;
**Incomplete** = unfinished styling that needs dedicated work.

| Module / route | Archetype | Current style state | Notes |
| --- | --- | --- | --- |
| `catalogo/items` | Grid (floating) | **New DS** ✅ | The reference implementation. Floating card grid, white cards on `--panel-content`, filter modal + tag chips, sticky utility bar, dark pills/buttons. |
| `catalogo/items/[id]` | Detail | Old | Item detail (flip card + info/atributos, or variant matrix). Functional; not yet aligned to the new DS shell/skin. |
| `catalogo/items/nuevo` | Wizard | Old | Stepped wizard, hard-coded colors, purple variant accent. |
| `catalogo/creador-masivo` | Special | **Incomplete** | Spreadsheet-style bulk grid; visually rough, not consistent with the app. |
| `catalogo/lista-de-precios` | Grid (uniform) | Old | Dense editable table; Editar→Guardar. Old skin. |
| `catalogo/stock` | Grid (uniform) | Old | Dense editable table; derived `disponible`. Old skin. |
| `ventas/ventas` (+ `nueva`, `[id]`) | Grid + Wizard + Detail | Old | Filtering summary cards; document detail with cobros/entregas/devoluciones sections. |
| `ventas/presupuestos` (+ `nuevo`, `[id]`) | Grid + Wizard + Detail | Old | Same family as ventas. |
| `compras/compras` (+ `nueva`, `[id]`) | Grid + Wizard + Detail | Old | Period selector in title row; document detail with pagos/recepciones/devoluciones. |
| `compras/ordenes-de-compra` (+ `nueva`, `[id]`) | Grid + Wizard + Detail | Old | Orden→compra bridge. Old skin. |
| `contactos/clientes` | Grid (uniform) | Old | CRUD grid + modals. Old skin. |
| `contactos/proveedores` | Grid (uniform) | Old | Twin of clientes. Old skin. |
| `pdv` | Special | **Incomplete** | Two-pane POS (search + cart/checkout); least aligned to the shared shell. |
| `dashboard` | Read-only analytics | Old | KPI cards, charts, top items, heatmap, payments; period-driven. |

**Bottom line:** exactly one module (`catalogo/items`) is on the new design language.
Everything else is either the older skin or an incomplete surface.

---

## 6. Theming & styling system (as it exists)

All styling flows through CSS custom properties in `app/globals.css`.

- **Token groups (`:root`):** base (`--background`, `--foreground`, `--card`, `--popover`),
  semantic (`--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`,
  `--success`), layout (`--sidebar-*`, `--navbar-*`, `--toolbar-header-*`,
  `--container-item-*`), surfaces/text (`--surface-*`, `--text-*`), charts
  (`--chart-1..5`), `--radius` (base `1.125rem`), computed shadows.
- **`--panel-content` (`#F1F5F9`):** the shared scrollable background for all main list
  views. Intended as the single re-skin knob — but pages **also use literal colors**
  (`bg-slate-300`, `bg-[#151721]`) in the bar/title rows, so the single-knob promise does
  not fully hold today.
- **Dark mode:** `.dark` redefines the full (monochrome) palette; **no global toggle** is
  wired, so light is the effective default.
- **Tailwind mapping (`@theme inline`):** tokens exposed as utilities (`bg-panel-content`,
  `text-sidebar-muted`, `bg-navbar`, …), plus custom grids `grid-cols-20` / `grid-cols-32`
  and the three font families.
- **Fonts:** Geist (`font-sans`/`font-mono`) + Source Serif 4 (`font-serif`), set in
  `app/layout.tsx`.
- **Custom utilities:** `.blur-glass`, `.animate-loading-bar`, `.animate-fade-out` (3s
  success toast), `.animate-live-pulse`.
- **Providers:** `SettingsProvider` → `PeriodProvider` → `AccountProvider` wrap the app.

---

## 7. Known debt in the current implementation

Read this before any re-skin so you build on the right foundation.

1. **Shell is inlined per page.** The top bar, title row, and utility bar are hand-written
   in each `page.tsx` (see `catalogo/items` ~439–571). Editing one page does **not**
   propagate. Only `Sidebar` and `Breadcrumb` are shared.
2. **Legacy, unused layout components.** `components/layout/header.tsx` (solid dark
   `bg-gray-950` bar), `top-nav.tsx` (a different pill attempt with mock bookmarks),
   `toolbar.tsx`, `utility-bar.tsx`, `utility-bar-shared.tsx`, and `user-panel.tsx` are
   **not imported by any `app/**/page.tsx`**. They are an older model — do not treat them
   as source of truth.
3. **Hard-coded colors alongside tokens.** Literals (`bg-slate-300`, `bg-[#151721]`,
   `text-slate-900`) are mixed with tokens across pages, causing drift.
4. **Mock/placeholder data in shell UI.** `top-nav.tsx` bookmarks and a hard-coded
   `"In Vino Veritás - Admin"` label are placeholders; the live profile comes from
   `AccountProvider`.
5. **No global dark-mode toggle** despite complete `.dark` tokens.
6. **Design-system coverage is 1 module.** Only `catalogo/items` uses the new language;
   the rest await migration (tracked in `UI_DESIGN_SYSTEM_TARGET.md`).
