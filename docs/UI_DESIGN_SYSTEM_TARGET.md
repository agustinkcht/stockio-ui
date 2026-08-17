# UI Design System — Target (Direction to Move Toward)

> **Purpose.** This document defines the **target** design system — the intended shell and
> visual language we are migrating the app toward. It is aspirational: it describes how the
> UI *should* look and be structured, not how it is today. For the current as-built state,
> see [`UI_LAYOUT_ACTUAL.md`](./UI_LAYOUT_ACTUAL.md).
>
> **Reference implementation.** `catalogo/items` (`app/catalogo/items/page.tsx`) is the
> **only module already built on the new design system**. Treat its visual language as the
> canonical reference and generalize it to every other module.
>
> **Scope.** Two parts: (A) the **new app shell**, and (B) the **broader visual style /
> design language** to standardize across modules.
>
> **This is documentation only** — it prescribes direction; it does not change code.

---

## 1. Migration status — where each module stands

Exactly **one** module is on the new design system today. Everything else still reflects
the current state described in `UI_LAYOUT_ACTUAL.md` and must be brought in line.

| Module / route | On new design system? | Action needed |
| --- | --- | --- |
| `catalogo/items` | ✅ Yes — **reference** | None; this is the source of truth. |
| `catalogo/items/[id]` | ❌ No | Migrate to target shell + visual language. |
| `catalogo/items/nuevo` | ❌ No | Migrate wizard to shared shell + tokens. |
| `catalogo/creador-masivo` | ❌ No (incomplete) | Finish + migrate. |
| `catalogo/lista-de-precios` | ❌ No | Migrate. |
| `catalogo/stock` | ❌ No | Migrate. |
| `ventas/ventas` (+ `nueva`, `[id]`) | ❌ No | Migrate. |
| `ventas/presupuestos` (+ `nuevo`, `[id]`) | ❌ No | Migrate. |
| `compras/compras` (+ `nueva`, `[id]`) | ❌ No | Migrate. |
| `compras/ordenes-de-compra` (+ `nueva`, `[id]`) | ❌ No | Migrate. |
| `contactos/clientes` | ❌ No | Migrate. |
| `contactos/proveedores` | ❌ No | Migrate. |
| `pdv` | ❌ No (incomplete) | Finish + migrate. |
| `dashboard` | ❌ No | Migrate. |

> **Rule of thumb:** if you are working in any module other than `catalogo/items` and the
> task touches layout or styling, you are bringing that module *onto* this target — not
> matching whatever skin it currently has.

---

## 2. Part A — The new app shell

The target shell has two defining changes versus today's implementation.

### 2.1 Edge-to-edge sidebar + main panel (no floating over a background)

- The **Sidebar** and the **Main panel** must fill the **entire screen, top to bottom and
  edge to edge**. Together they occupy 100% of the viewport with **no surrounding
  background, gaps, margins, insets, or rounded "floating card" treatment**.
- Today the shell reads as panels *floating over* a background color. **Target:** remove
  that effect. The two columns butt directly against the viewport edges and against each
  other — a solid, continuous surface.
- Sidebar stays fixed-width and full-height on the far left; the main panel takes the rest
  and is the only scrolling region.

### 2.2 Navbar becomes floating pills (not a solid bar)

- Today the top of the main panel is a **solid strip** (e.g. `bg-slate-300`) carrying the
  pills. **Target:** eliminate the solid bar. The navbar content becomes **floating
  pills** that rest directly over the panel content with **no visible bar background**
  behind them.
- Layout of the pill row is unchanged conceptually: **breadcrumb pill** on the left; **bell
  + profile pills** on the right; transient save/status toasts adjacent to them. The
  difference is purely that the bar surface disappears and the pills appear to float on the
  content beneath (which scrolls under them).
- Pills should read as elevated capsules (rounded-full, subtle elevation), driven by
  **tokens** — not literal hex values.

### 2.3 Target shell composition (shared, not inlined)

The shell must be **extracted into shared components** so a change applies everywhere:

```
<AppShell>                      // full-screen scaffold: edge-to-edge Sidebar + Main panel + providers
  <NavbarPills breadcrumbs=… /> // floating pills over content (breadcrumb + bell + profile); no bar bg
  <ViewHeader title=… actions=… />
  <ViewBody>                    // one of the archetypes below
    <GridView …/> | <DetailView …/> | <WizardView …/> | <SpecialView …/>
  </ViewBody>
</AppShell>
```

Migrating a module means replacing its inlined bar/title/utility markup with these shared
pieces — not restyling the inlined copy in place.

---

## 3. Part B — The visual design language (generalize `catalogo/items`)

`catalogo/items` is the reference. Generalize the following aspects of its look-and-feel to
every module — not just the shell, but the overall feel.

### 3.1 Surfaces & color

- **Panel background:** the shared `--panel-content` surface behind all list/content areas.
- **Cards / rows:** clean white (`--card`) surfaces with hairline borders and soft
  elevation resting on `--panel-content`.
- **Dark accents:** breadcrumb/bell/profile pills and primary buttons use the dark
  capsule/button treatment — but expressed through **tokens** (e.g. `--navbar`,
  `--primary`), replacing today's literal `bg-[#151721]` / `bg-slate-300`.
- **Everything through tokens:** no hard-coded colors in migrated modules. If a value is
  missing, add a token rather than a literal.

### 3.2 Grid & content patterns

- **Floating card grid** for scannable record lists (the `catalogo/items` grid), with
  consistent gaps and card treatment. Uniform/tabular grids remain valid where density
  matters, but should adopt the same surface, border, radius, and spacing language.
- **Sticky utility bar** with: free-text search, **Filtrar** opening a **modal**, active
  filters as **removable tag chips**, **Ordenar** control, result count, optional
  bulk-actions region, optional tab header. This is the canonical utility-bar contract for
  all grid views.
- **Content width:** center on `max-w-6xl mx-auto`; keep title row and utility bar on the
  same max width so columns align.

### 3.3 Typography & spacing

- Titles: `h1 text-3xl md:text-4xl font-semibold tracking-tight`.
- Fonts: Geist (`font-sans`) for UI, Source Serif 4 (`font-serif`) where used.
- Consistent spacing scale, radius (`--radius`), and shadow tokens from `globals.css`.

### 3.4 Controls & primitives

- Prefer shadcn/ui primitives in `components/ui/` (button, dialog, popover, dropdown-menu,
  command, input, checkbox, tooltip, loading-bar).
- Icons: `lucide-react`, standard sizes `w-4 h-4` / `w-5 h-5`.
- Buttons: dark primary capsule/button skin via tokens; consistent hover/active states.

### 3.5 Archetype styling targets

- **Detail views:** keep per-module internal structure, but wrap in the target shell and
  adopt the token-driven surface/typography language.
- **Wizard views:** keep the two-column stepper model; extract a shared `Wizard`/`Stepper`;
  drive states (completed/active/pending) through tokens.
- **Special views (`creador-masivo`, `pdv`):** finish them onto the same shell + tokens.
  Keep their interaction model (documented in `modules/catalogo-creador-masivo.md` and
  `modules/pdv.md`); bring only the look-and-feel in line.

---

## 4. Token & theming direction

- **Single-knob re-skin:** migrating literals onto tokens must make `--panel-content` (and
  the other layout tokens) the real re-skin levers, so changing a token restyles every
  module at once.
- **Add tokens, not literals:** the target introduces/normalizes tokens for the pill and
  primary-button surfaces (e.g. `--navbar`, `--primary`) so the floating-pill shell is
  fully tokenized.
- **Dark mode:** `.dark` tokens already exist; the target should wire a global toggle on
  `<html>` so the whole app (built on tokens) switches cleanly.

---

## 5. Migration checklist (per module)

For any module other than `catalogo/items`:

- [ ] Replace inlined bar/title/utility markup with shared `AppShell` / `NavbarPills` /
      `ViewHeader` / `UtilityBar` (extract these from `catalogo/items` first).
- [ ] Make the sidebar + main panel **edge-to-edge, full-screen**; remove any floating /
      background / inset / rounded-card shell treatment.
- [ ] Replace the solid top bar with **floating pills** over the content (no bar bg).
- [ ] Swap all literal colors (`bg-slate-300`, `bg-[#151721]`, `text-slate-900`, …) for
      **tokens**; add tokens where missing.
- [ ] Adopt the `catalogo/items` grid/utility-bar/card/typography language.
- [ ] Do **not** wire in legacy components (`header.tsx`, `top-nav.tsx`, `toolbar.tsx`,
      `utility-bar*.tsx`, `user-panel.tsx`) — build shared components fresh from the
      reference route.
- [ ] Preserve behavior and the z-index ladder; verify the result against `catalogo/items`.
