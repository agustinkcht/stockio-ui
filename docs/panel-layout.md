# Panel Layout — Design Document

This document describes the standard layout format used in full-panel list views (e.g. Ventas, Compras, Presupuestos). Use it as the single source of truth when building a new module in this style.

---

## Shell Structure

The entire app sits inside a viewport-height container with a 6px background gap that creates the "floating panel" feel:

```
bg-[rgb(243,242,238)]                       ← page background (warm off-white)
  px-[6px] py-[6px] flex gap-[6px] h-screen
    ├── <Sidebar />                          ← sticky, h-[calc(100vh-12px)], top-[6px], z-[100003]
    └── <Panel />                            ← flex-1, bg-white, rounded-lg, shadow-sm
                                               h-[calc(100vh-12px)], overflow-hidden
```

The panel itself is a white rounded card that fills the remaining space. `overflow-hidden` clips all content; vertical scrolling is handled by an inner scrollable region (see below).

---

## Panel Anatomy

```
┌─────────────────────────────────────────────┐
│ Utility Bar (44px, border-b, sticky)        │  ← breadcrumb, user panel
├─────────────────────────────────────────────┤
│                                             │
│  ┌── Scrollable Region (flex-1, overflow-y-auto)  ──┐
│  │                                               │
│  │  Top Row       px-8, pt-12, pb-8             │  ← title + período + primary CTA
│  │  Widgets       px-8, pb-3                    │  ← optional, scrolls away
│  │                                               │
│  │  ┌── Sticky Bar (sticky top-0, z-20) ────────┤
│  │  │  Search Row    px-8, py-2, bg-slate-50/95  │  ← search + tags + filtrar/ordenar + count
│  │  │  Bulk Row      px-8                        │  ← select-all + bulk actions
│  │  └────────────────────────────────────────────┤
│  │                                               │
│  │  Item Grid     px-8, pt-2, pb-8              │  ← list of item cards
│  │                                               │
│  └───────────────────────────────────────────────┘
└─────────────────────────────────────────────┘
```

### Key layout rules
- **Max content width**: `max-w-6xl mx-auto` applied on every section's inner wrapper. Never apply it to the outer wrapper — horizontal padding (`px-8`) always belongs to the outer div.
- **Horizontal padding**: `px-8` on every section wrapper (outer div). This gives 32px on each side.
- **Utility bar**: `h-[44px]`, `px-4`, `border-b border-border`, always `bg-white`. Contains `<Breadcrumb />` on the left and `<UserPanel />` on the right.
- **Scrollable region**: `flex-1 overflow-y-auto` — everything below the utility bar scrolls vertically as one continuous region.
- **Sticky bar**: `sticky top-0 z-20`. Sticks to the top of the scrollable region (not the viewport). Contains the search row and the bulk actions row stacked vertically. Background: `bg-slate-50/95 backdrop-blur-sm`.

---

## Zone-by-Zone Reference

### 1. Top Row (Title + Período + CTA)

```
<div className="px-8 pt-12 pb-8">
  <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">

    {/* LEFT: title + optional período selector inline */}
    <div className="flex items-center gap-3">
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
        {ViewTitle}
      </h1>
      {hasPeriod && <PeriodSelector ... />}
    </div>

    {/* RIGHT: primary action button */}
    <button className="h-9 px-4 text-sm font-semibold border shadow-sm border-[rgba(228,230,235,0.8)]
                       rounded-lg flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-50 mt-1">
      <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
      {ActionLabel}
    </button>

  </div>
</div>
```

- `pt-12 pb-8`: generous vertical breathing room; the title feels "landed".
- The período selector sits **inline to the right of the h1**, vertically centered with `items-center gap-3`. The CTA is pushed to the far right with `justify-between`.
- `mt-1` on the button compensates for baseline differences between the h1 and the button height.

---

### 2. Widgets (optional, scrolls away)

```
<div className="px-8 pb-3">
  <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-3 gap-3 mb-5">
      <WidgetCard ... />
      <WidgetCard ... />
      <WidgetCard ... />
    </div>
  </div>
</div>
```

Widget card anatomy:
```
<button className="border rounded-xl px-6 py-5 shadow-sm text-left transition-all cursor-pointer w-full
                   bg-white border-slate-200/80 hover:border-{color}-200 hover:shadow-md">
  {/* Icon badge */}
  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
    <Icon className="w-5 h-5 text-{color}-500" />
  </div>
  {/* Count + label */}
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">{count}</span>
    <span className="text-base font-medium text-{color}-500">{label}</span>
  </div>
  {/* Optional subtitle */}
  {subtitle && <p className="mt-2 text-xs text-slate-400 leading-snug">{subtitle}</p>}
</button>
```

States:
- **Default** (none selected): `bg-white border-slate-200/80` — shows all items combined.
- **Active** (selected): `bg-{color}-50 border-{color}-200` — filters list to that status; clicking again deselects (toggle back to "todas").
- **Disabled** (count = 0): `border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed`.

Widget counts respond to the active **período** (date-filtered), but are independent of search/filtrar/ordenar.

---

### 3. Sticky Bar

The sticky bar is a single `sticky top-0 z-20` wrapper containing two rows that always move together:

#### Row 1 — Search + Tags + Filtrar/Ordenar + Count

```
<div className="relative z-10 bg-slate-50/95 backdrop-blur-sm px-8 py-2">
  <div className="max-w-6xl mx-auto">
    <div className="flex items-center gap-2">

      {/* Search input */}
      <div className="flex items-center h-9 border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md
                      min-w-0 overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-3 h-full w-64 bg-white">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input ... placeholder="Buscar" className="flex-1 bg-transparent text-xs text-slate-700 ..." />
          {searchQuery && <ClearButton />}
        </div>
      </div>

      {/* Active filter tags (conditional — only shown when any filter is active) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Tag anatomy — reused for all tag types */}
        <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium
                         rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
          {label}
          <button className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 cursor-pointer">
            <X className="w-2.5 h-2.5 text-slate-400" />
          </button>
        </span>
      </div>

      {/* Right side: Filtrar + Ordenar + count */}
      <div className="ml-auto flex items-center gap-2">
        <FilterButton />
        <SortButton />
        <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums pl-1">
          {count} {itemLabel}
        </span>
      </div>

    </div>
  </div>
</div>
```

**Tag ordering** (left to right): período → widget/status → client → pending-cobro → pending-entrega → sort.

#### Row 2 — Bulk Actions

```
<div className="px-8">
  <div className="max-w-6xl mx-auto bg-white border border-slate-200/80 rounded-b-md">
    <div className="flex items-center gap-2 h-9">

      {/* Select-all checkbox — width matches col-span-4 of item grid */}
      <div className="flex items-center justify-center w-[4%] min-w-[40px] shrink-0">
        <input ref={allCheckboxRef} type="checkbox" ... />
      </div>

      {/* Vertical divider */}
      <div className="w-px h-5 bg-slate-200 shrink-0" />

      {/* Idle state */}
      {noneSelected && <span className="text-xs text-slate-400">Seleccioná {items} para accionar masivamente</span>}

      {/* Active state */}
      {someSelected && (
        <>
          <span className="text-xs text-slate-600">{count} seleccionada{plural}</span>
          <div className="w-px h-5 bg-slate-200 shrink-0" />
          <BulkActionButton />
        </>
      )}

    </div>
  </div>
</div>
```

**Critical alignment note**: the select-all checkbox uses `w-[4%] min-w-[40px]` to match the `col-span-4` cell in `grid-cols-100` that item rows use for their per-row checkboxes. Do not add `px-4` to the bulk row container or the alignment breaks.

---

### 4. Item Grid

```
<div className="px-8 pt-2 pb-8">
  <div className="max-w-6xl mx-auto">
    <div className="flex flex-col gap-2">
      {items.map(item => <ItemCard key={item.id} ... />)}
    </div>
  </div>
</div>
```

Item cards use `bg-white border rounded-md shadow-sm` with `border-slate-200/60 hover:border-slate-300` in the default state and `border-blue-300 bg-blue-50/40` when selected.

The internal layout uses **`grid grid-cols-100`** (a 100-unit custom grid) for pixel-precise column proportions:
- `col-span-4` — checkbox (left edge, `border-r`)
- `col-span-10` — item ID
- `col-span-14` — date/time
- `col-span-42` — descriptor (origen, name, etc.)
- `col-span-12` — spacer / flexible content
- `col-span-14` — client/assignee pill (`border-r`)
- `col-span-4` — context menu (⋮)

---

## Reusable Abstract Components

### `<PeriodSelector />`

```
Props:
  open: boolean
  setOpen: (v: boolean) => void
  currentLabel: string
  currentKey: PeriodKey
  noPeriod: boolean
  isActivePeriod: boolean   ← shows blinking emerald dot when true
  onSelect: (k: PeriodKey) => void
  rangeLabel: string
  calendarOpen: boolean
  setCalendarOpen: (v: boolean) => void
  customRange: { start: Date; end: Date } | null
  setCustomRange: (r) => void
```

Dropdown groups:
1. **Ninguno** (resets filter)
2. **En curso** group: Día en Curso / Mes en Curso / Año en Curso — "live" periods; blinking dot on selected item
3. **Período fijo** group: Últimos 7 días / Últimos 30 días / Último año / Personalizado

Active period (hoy, mes_en_curso, ano_en_curso) = blinking `h-2 w-2` emerald dot on the selector button.

---

### `<FilterTag />`

```
<span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium
                 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
  {label}
  <button onClick={onRemove} className="flex items-center justify-center w-3.5 h-3.5 rounded-full
                                        hover:bg-slate-100 transition-colors cursor-pointer">
    <X className="w-2.5 h-2.5 text-slate-400" />
  </button>
</span>
```

---

### `<SearchInput />`

```
h-9, border border-[rgba(228,230,235,0.6)], shadow-sm, rounded-md, w-64
Inner: px-3, gap-2, Search icon (w-3.5 h-3.5 text-slate-400), text-xs input, clear X button
```

---

### `<FilterButton />` / `<SortButton />`

```
h-9 text-xs border shadow-sm px-3 rounded-md flex items-center gap-1.5 cursor-pointer

Default:  border-[rgba(228,230,235,0.6)] bg-white hover:bg-slate-50 text-slate-600
Active:   border-blue-400 text-blue-600 bg-blue-50
```

Dropdown: `absolute top-full right-0 mt-1 z-[100] bg-white border border-slate-200 rounded-lg shadow-lg w-60 p-3`

---

### `<Widget />`

See Zone 2 above. The three standard variants:
- **Finalizadas**: emerald (`text-emerald-500`, `bg-emerald-50`, `border-emerald-200`)
- **Abiertas** (en_curso): orange (`text-orange-500`, `bg-orange-50`, `border-orange-200`)
- **Canceladas**: red (`text-red-400`, `bg-red-50`, `border-red-200`)

---

### `<BulkActionsBar />`

See Zone 3 / Row 2 above. Key: checkbox wrapper must be `w-[4%] min-w-[40px]` to align with item row `col-span-4`. Action buttons use `text-xs text-slate-500 hover:text-slate-800` with a `w-px h-5 bg-slate-200` divider before them.

---

### `<PrimaryActionButton />`

```
h-9 px-4 text-sm font-semibold border shadow-sm border-[rgba(228,230,235,0.8)] rounded-lg
flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-50 cursor-pointer
Icon: w-4 h-4 text-slate-600, strokeWidth={2.25}
```

---

## Spacing Cheatsheet

| Zone              | Outer padding | Top padding | Bottom padding |
|-------------------|--------------|-------------|----------------|
| Utility bar       | `px-4`       | —           | —              |
| Top row           | `px-8`       | `pt-12`     | `pb-8`         |
| Widgets           | `px-8`       | —           | `pb-3`         |
| Search row        | `px-8`       | `py-2`      | `py-2`         |
| Bulk row          | `px-8`       | —           | —              |
| Item grid         | `px-8`       | `pt-2`      | `pb-8`         |

Inner wrapper: always `max-w-6xl mx-auto` (no exceptions).

---

## Sticky vs. Scrollable

| Zone          | Behavior            | Note                                                      |
|---------------|---------------------|-----------------------------------------------------------|
| Utility bar   | `sticky top-0`      | Sticks to the panel's top edge, above the scroll region   |
| Top row       | Scrolls freely      | Disappears when user scrolls down                         |
| Widgets       | Scrolls freely      | Disappears when user scrolls down                         |
| Sticky bar    | `sticky top-0 z-20` | Sticks inside the scrollable region; widgets scroll past  |
| Item grid     | Scrolls freely      | Main content area                                         |

The sticky bar background is `bg-slate-50/95 backdrop-blur-sm` so items are visible but blurred as they scroll behind it.

---

## Carousel Widget Pattern (saved for future use)

When a module has more widgets than can fit (e.g. 4+ widgets with only 3 visible at a time), use the chevron carousel:

```
const VISIBLE = 3
const maxOffset = allWidgets.length - VISIBLE
const [widgetOffset, setWidgetOffset] = useState(0)
const canLeft = widgetOffset > 0
const canRight = widgetOffset < maxOffset
const visible = allWidgets.slice(widgetOffset, widgetOffset + VISIBLE)

// Render:
<div className="flex items-stretch gap-2 mb-5">
  {canLeft && <ChevronButton direction="left" onClick={() => setWidgetOffset(o => Math.max(0, o - 1))} />}
  <div className="grid grid-cols-3 gap-3 flex-1">{visible}</div>
  {canRight && <ChevronButton direction="right" onClick={() => setWidgetOffset(o => Math.min(maxOffset, o + 1))} />}
</div>

// ChevronButton:
className="flex-shrink-0 w-8 flex items-center justify-center rounded-xl border border-slate-200
           bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-sm"
```

Chevrons only render when there is content in that direction (no empty ghost buttons).
