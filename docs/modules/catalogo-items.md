# Module: Catálogo · Items (Item Grid)

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/catalogo/items` list page. Where it disagrees with
> the code, the code wins — treat the doc as stale and fix it.

---

## 1. At a glance

The **Item Grid** is the main catalog listing screen. It renders every item for the active
account as a vertical list of rows, where **parent items (`agrupadores`) expand to reveal their
child variants**. From this screen the user can search, filter, sort, select (single/bulk),
inline-edit price and stock, pause/reactivate, delete (single/bulk), and navigate to item
detail or creation flows.

| Quick fact | Value |
| --- | --- |
| Route | `/catalogo/items` |
| Page component | `app/catalogo/items/page.tsx` (`CatalogoPage`) — `"use client"` |
| Grid renderer | `components/catalogo/catalogo-grid.tsx` (`CatalogoGrid`) |
| Row renderer | `components/items/item-card.tsx` (`ItemCard`) |
| Data hook | `hooks/use-items.ts` (`useItems`) |
| Selection hook | `hooks/use-item-selection.ts` (`useItemSelection`) |
| Modal/tab hook | `hooks/use-modals.ts` (`useModals`) |
| Sidebar/UI hook | `hooks/use-sidebar.ts` (`useSidebar`) |
| Search/filter/sort utils | `lib/utils/item-utils.ts` |
| Types | `lib/types.ts` (`Item`, `ItemVariant`, `FilterConfig`, `SortFactorConfig`) |
| Persistence | `localStorage["stockio-items-{account}"]` (mock mode) |
| State transport | URL query params (search/sort/filters) + React state (selection/UI) |

> **Note on a second grid component.** `components/items/items-grid.tsx` (`ItemsGrid`) is a
> similar but **distinct** grid used by other screens. `/catalogo/items` uses **`CatalogoGrid`**,
> not `ItemsGrid`. Do not edit `ItemsGrid` expecting to change this page.

---

## 2. File & component map

| File | Role in this module |
| --- | --- |
| `app/catalogo/items/page.tsx` | The page. Owns URL-param state, wires all hooks, renders the sticky header (breadcrumb, title, search, filter tags, sort, bulk-actions bar, tab header) and delegates row rendering to `CatalogoGrid`. Owns all delete/edit/toast handlers and confirmation modals. |
| `components/catalogo/catalogo-grid.tsx` | Receives the item array + committed `searchQuery`/`filterConfig`/`sortConfig`, applies `searchItems → filterItems → sortItems`, and maps each result to an `ItemCard`. Renders the "no results" empty state. Always sets `showPrecioColumn={true}`. |
| `components/items/item-card.tsx` | Renders one row. Three visual modes: **parent**, **standalone/child** with **Precio** column (this page), or with **Atributos** column (other pages). Handles expand/collapse, selection checkbox, copy-SKU, active/paused styling, and opens the inline **StockEditModal** / **PrecioEditModal**. |
| `hooks/use-items.ts` | Loads/persists items; exposes create/edit/delete/stock/price/pause operations and unsaved-change flags. |
| `hooks/use-item-selection.ts` | Tracks per-id selection; computes parent tri-state (checked/indeterminate) from children; exposes select-all. |
| `hooks/use-modals.ts` | Legacy modal + minimized-tab state (mostly unused by the current URL-driven page but still wired). |
| `hooks/use-sidebar.ts` | Sidebar dropdown + grid-size state. |
| `lib/utils/item-utils.ts` | Pure functions: `searchItems`, `filterItems`, `sortItems`, `getUniqueCategorias`, `getUniqueMarcas`, `getUniqueProveedores`, `generateId`, SKU helpers. |
| `components/modals/filtros-modal.tsx` | The filter modal (categorías, marcas, precio range, stock flags). |
| `components/modals/orden-modal.tsx` | Advanced multi-factor sort modal. |
| `components/modals/stock-edit-modal.tsx` / `precio-edit-modal.tsx` | Inline editors opened from a row's Stock / Precio cell. |
| `components/layout/sidebar.tsx`, `breadcrumb.tsx` | Chrome. |

---

## 3. Data model

The grid reads `Item[]` from `useItems`. Key shapes (full definitions in `lib/types.ts`):

```ts
interface Item {
  id?: string                 // "STA…" | "PAR…" | "VAR…" — preferred lookup key
  name: string                // titulo (display name)
  sku?: string                // standalone items only
  skuPrefix?: string          // parent items only ("SKU padre")
  hasVariants?: boolean       // true → parent with variants
  isAgrupador?: boolean       // true → container/parent
  variants?: ItemVariant[]    // children (variant model)
  items?: (Item | ItemWithVariants)[] // children (nested-item model, agrupador)
  variantCount?: number
  itemCount?: number | string
  stock?: { enStock: string; reservado: string; disponible: string } // STRINGS
  precio?: { costo: number; margen: number; iva: number; precioFinal: number } // NUMBERS
  categoria?: string
  marca?: string
  atributosPrincipales?: { key: string; value: string }[]
  atributosInformativos?: { key: string; value: string }[]
  containerAtributosPrincipales?: { key: string; variantes: string[] }[] // parents
  isActive?: boolean          // undefined/true = Activo, false = Pausado
  // …plus modelo, proveedor, codigoUniversal, codigoProveedor, volumen*, vencimiento*, media[]
}

interface ItemVariant {
  id?: string                 // "VAR…"
  name: string
  skuSuffix?: string          // full SKU = `${parent.skuPrefix}-${skuSuffix}`
  sku?: string                // @deprecated for children (back-compat only)
  stock: { enStock: string; reservado: string; disponible: string }
  precio?: { costo: number; margen: number; iva: number; precioFinal: number }
  atributosPrincipales?: { key: string; value: string }[]
  isActive?: boolean
  // …marca, modelo, formatoVenta, proveedor, codigoProveedor, media[]
}
```

### Critical invariants

- **Stock values are strings**, not numbers. Always `parseInt`/`Number.parseFloat` before math and
  `.toString()` when writing back.
- **`disponible = enStock − reservado`**, recomputed on every stock write (clamped `≥ 0` in most paths).
- **Legacy `stock.total`** may exist on old records; readers fall back
  `stock.enStock ?? stock.total`. `useItems.migrateStock` rewrites `total → enStock` on load.
- **Parents have no `sku`** — only `skuPrefix`. Deleting/looking up a parent MUST use `id`,
  never `sku`, or every item with `undefined` sku would match.
- **Two child models coexist:** `variants` (`ItemVariant`) and `items` (nested `Item`, used by
  `isAgrupador`). Code that walks children checks `item.variants || item.items`.

### `FilterConfig` / `SortFactorConfig`

```ts
interface FilterConfig {
  tipos: ("individual" | "variantes" | "agrupador")[]
  categorias: string[]
  marcas: string[]
  proveedores: string[]
  stock: ("sin-stock" | "disponible" | "reservado" | "sin-disponible")[]
  depositos: string[]
  precioDesde?: number | null
  precioHasta?: number | null
  stockFlags?: ("sin_stock_disponible" | "con_stock_reservado")[]
}

interface SortFactorConfig {
  factor: "titulo" | "nombre" | "categoria" | "marca" | "fecha" | "stock" | "costo" | "margen" | "precioFinal"
  direction: "asc" | "desc"
}
```

---

## 4. State & data flow

### 4.1 Source of truth split

| Concern | Lives in | Why |
| --- | --- | --- |
| Search query (`q`) | **URL param** | Shareable/back-button friendly; read via `useSearchParams`. |
| Sort field (`sort`) + direction (`dir`) | **URL param** | Same. |
| Committed filters (`categorias`, `marcas`, `precioDesde`, `precioHasta`, `stockFlags`) | **URL params** (CSV) | Same. |
| Draft filters (inside modal, not yet applied) | React `useState` (`draft*`) | Editable without touching the list until "Aplicar". |
| Item data | `useItems` → `localStorage` | Persisted, account-scoped. |
| Selection | `useItemSelection` (React state, keyed by `id`) | Ephemeral. |
| UI toggles (dropdowns, toasts, modals) | React `useState` in the page | Ephemeral. |

The page derives `filterConfig` and `sortConfig` (both `useMemo`) from the URL params and passes
them **down to `CatalogoGrid`**, which performs the actual `searchItems → filterItems → sortItems`
pipeline. The page independently computes `filteredCount` (for the "N items" badge) using the same
utils.

### 4.2 URL-param helpers

- `updateParam(key, value)` — sets or deletes a single param via `router.replace(..., { scroll: false })`.
- Filters are committed atomically in `applyFilters()` (writes all filter params at once) and
  cleared in `clearFilters()`.
- Individual active-filter "chips" in the header remove just their own param.

### 4.3 Persistence & cross-instance sync

1. `useItems` reads `localStorage["stockio-items-{account}"]` on mount (or seeds from
   `initial-items-{account}.ts` on first run), running `migrateItems` (stock + media backfill) and
   `isValidItem` filtering.
2. Any write (`saveItems`) persists JSON **and** dispatches `window` event
   `stockio:items-updated` with `{ key }`.
3. Every mounted `useItems` listens for that event and re-reads storage (ignoring events for other
   accounts), so the grid, modals, and detail pages stay consistent.
4. `itemsRef` mirrors `items` synchronously so `forceSaveItems()` never writes stale data when
   called immediately after an edit.

### 4.4 Inline edit → persist path

Price/stock edits from a row are **immediate** (no "unsaved" staging): the row opens a modal,
the page handler calls `editField`/`editVariantField` then `forceSaveItems()` and shows a toast.
Selection-bar pause/reactivate calls `updateItemsActiveStatus(...)` which also persists.

---

## 5. Component tree & layout

```
CatalogoPage (flex, h-screen, bg-panel-content)
├── Sidebar (sticky left, full height)                        [components/layout/sidebar.tsx]
└── Right column (flex-1, flex-col)
    └── main (overflow-hidden) → scroll container
        ├── Sticky top row (z-100004)
        │   ├── Breadcrumb pill  ("Catálogo / Items")
        │   └── Right cluster: save/status toasts · Bell · Profile pill+dropdown
        ├── Title row ("Items" + "Nuevo Item" split dropdown) — scrolls away
        ├── Sticky search+bulk block (top-[60px], z-20)
        │   ├── Row 1: Search input · active filter chips · Filtros btn · Sort (dir + select) · count
        │   └── Row 2: Bulk-actions bar (select-all tri-state, count, Pausar/Reactivar/Eliminar)
        │            + Tab header grid-cols-12: Item(5) · Precio Venta(3) · Stock(4)
        └── CatalogoGrid                                       [components/catalogo/catalogo-grid.tsx]
            └── for each result → ItemCard                     [components/items/item-card.tsx]
                ├── Parent row (Item col + empty span; click toggles expansion)
                │   └── (when expanded) child ItemCard rows (isChild)
                └── Standalone/child row: Item(5) · Precio(3, clickable) · Stock(4, clickable)
```

Layout notes:
- Content is centered with `max-w-6xl mx-auto`.
- Tab header column spans (`5 / 3 / 4`) must match `ItemCard`'s grid to stay aligned.
- Row height is driven by `gridSize` (`sm`/`md`/`lg`) from `useSidebar`; this page effectively uses the small row.

---

## 6. Behaviors (itemized)

### Search
- Free-text box bound to URL `q`. Matching is done by `searchItems` (see §7): splits the query into
  words, **every** word must appear across the item's combined searchable fields (name, all SKU
  forms, marca, categoría, modelo, proveedor, and every atributo key/value).
- For parents, search filters **down to matching children**: a parent is shown with only the
  variants/sub-items that match; non-matching children are hidden.
- Clearing search (X button) removes the `q` param.

### Filters
- Opened via the **Filtros** button → `filtros-modal`. Draft state is seeded from committed URL
  params on open. "Aplicar" commits all filters to the URL atomically; "Limpiar" clears them.
- Supported filters: `categorias`, `marcas`, `precioDesde/Hasta` range, and `stockFlags`
  (`sin_stock_disponible`, `con_stock_reservado`). (`tipos`, `proveedores`, `depositos`, `stock`
  exist in `FilterConfig` and `filterItems` but are not surfaced by this page's quick UI.)
- Active filters appear as removable **chips** in header Row 1; the Filtros button is highlighted
  when any filter is active.
- Price-range filter on a parent passes if **any** child's `precioFinal` is in range.

### Sort
- Quick sort: a direction toggle (`ArrowUpDown`, rotates 180° for desc) + a `<select>` of fields
  (`nombre`, `categoria`, `marca`, `precioVenta`, `stockDisponible`), bound to URL `sort`/`dir`.
- Default: `nombre` / `asc`.
- `orden-modal` provides advanced multi-factor priority sorting (applied in order until a
  non-zero comparison).

### Selection (single + bulk)
- Per-row checkbox toggles that item's `id` in `useItemSelection`.
- **Parent tri-state:** a parent's checkbox is `checked` when all children selected,
  `indeterminate` when some, empty when none. Toggling a parent selects/deselects **all its
  children** (indeterminate or checked → deselect all; empty → select all).
- **Select-all** header checkbox mirrors the same tri-state over all visible selectable ids
  (children of parents + standalone ids). The DOM `indeterminate` property is set imperatively via
  `allCheckboxRef` in an effect.
- Selection is keyed by `id` (falls back to `sku`). `getSelectedSkus()` returns the selected ids.

### Bulk actions (visible only when something is selected)
- **Pausar** → `updateItemsActiveStatus(ids, false)` then clears selection + status toast.
- **Reactivar** → `updateItemsActiveStatus(ids, true)` + toast.
- **Eliminar** → opens batch-delete confirmation modal → `handleConfirmBatchDelete`.

### Inline edit
- **Precio cell** (standalone/child rows only) click → `PrecioEditModal` → `handleUpdatePrecio` →
  `editField`/`editVariantField("precio", …)` → `forceSaveItems()` → "Precio actualizado" toast.
- **Stock cell** click → `StockEditModal` (edits `total` and `reservado` together) →
  `handleUpdateStockWithTracking` recomputes `disponible`, persists, toasts, and **auto-toggles
  active state**: an item that becomes `disponible > 0` while paused+empty is reactivated; an active
  item hitting `disponible ≤ 0` is paused.
- Stock display: `en stock`, optional `res.` (only when reservado > 0), and `disponibles`
  (emerald if > 0, red if < 0, muted if 0).

### Delete
- **Single:** `handleDeleteWithTracking` → confirmation → `deleteItem` (persists immediately,
  records original index for undo) → toast ("Item eliminado" / "Agrupador eliminado").
- **Batch:** deletes each selected item, waits ~800ms, rewrites storage with the remainder,
  `saveDeletedItems()`, clears selection, success toast.
- A redirect from a detail-page deletion carries `?deleted=…&tipo=…`; the page shows a toast and
  scrubs those params so the effect doesn't re-fire.

### Creation & navigation
- **"Nuevo Item"** split button → `Creación Individual` (`/catalogo/items/nuevo`) or
  `Creador Masivo` (`/catalogo/creador-masivo`).
- Clicking a row (name/thumbnail) navigates to `/catalogo/items/{item.id}`.
- Clicking a parent row toggles expansion (does not navigate); its name still navigates.

### Chrome
- Profile pill dropdown (Editar Perfil / Cerrar Sesión) closes on outside click.
- Toasts auto-dismiss after 3s.

---

## 7. Public API surfaces

### `useItems()` — selected exports used by this page
| Export | Signature / purpose |
| --- | --- |
| `items` | `Item[]` — current account's items. |
| `deleteItem(item)` | Removes an item (matches by `id`, else `sku`), records undo index, persists. |
| `undoDelete()` / `saveDelete()` | Restore last deleted / commit deletions. |
| `hasUnsavedDeletes` / `hasUnsavedEdits` | Dirty flags. |
| `editField(skuOrId, field, value)` | Edit a standalone item (auto-reroutes to variant edit if the id belongs to a child). |
| `editVariantField(parentSkuOrId, variantId, field, value)` | Edit one child. |
| `forceSaveItems(override?)` | Persist current `itemsRef` immediately (bypasses stale closures). |
| `updateItemsActiveStatus(ids, isActive)` | Pause/reactivate items by id. |
| `handleCreateNuevoItem` / `handleCreateNuevoItemConVariantes` | Create standalone / parent. |
| `updateStock` | Recompute + write a single stock field. |

> `useItems` also exposes many operations not used directly by this page (`bulkCreateItems`,
> `bulkCreateItemsConVariantes`, `bulkSaveStock`, `updatePricing`, `adjustStock`,
> `increaseStock`/`decreaseStock`, `reduceStock`, `reloadItems`, `undoEdit`/`redoEdit`,
> `cancelEdit`). Document these under the modules that consume them.

### `useItemSelection(items)`
Returns `selectAllActive`, `selectAllIndeterminate`, `hasSelectedItems`, `handleSelectAll`,
`handleItemSelection(item, isChild?)`, `getSelectionState(item, isChild?) → {checked, indeterminate}`,
`getSelectedSkus() → string[]`, `clearSelection()`. Selection is keyed by `id ?? sku`.

### `CatalogoGrid` props (page → grid)
`items`, `gridSize`, `expandedItems`, `handleItemClick`, `toggleVariantExpansion`,
`onDeleteItem`, selection props (`selectAllActive`, `selectAllIndeterminate`, `handleSelectAll`,
`handleItemSelection`, `getSelectionState`), `onUpdatePrecio`, `onUpdateStock`, `onPauseItems`,
`onReactivateItems`, `getSelectedSkus`, and the **committed** `searchQuery` / `filterConfig` /
`sortConfig`, plus optional `allCheckboxRef`.

### `item-utils.ts` pure functions
`searchItems(items, query)`, `filterItems(items, config)`, `sortItems(items, config)`,
`getUniqueCategorias(items)`, `getUniqueMarcas(items)`, `getUniqueProveedores(items)`,
`generateId(type)`, `getFullSku(item, parentPrefix?)`, `getSkuPrefix(item)`,
`getItemDisplayName(item)`. All are pure and safe to reuse.

---

## 8. Edge cases & gotchas

1. **Never look up or delete a parent by `sku`.** Parents have `skuPrefix`, not `sku`; filtering
   by `sku` would match every item with `undefined` sku. Use `id`.
2. **Two grids exist.** This page renders `CatalogoGrid`; `ItemsGrid` is a different component for
   other screens. Confirm which one before editing.
3. **Stock is stringly-typed.** Parse before math, stringify before storing; keep
   `disponible = enStock − reservado` consistent, and handle legacy `total`.
4. **Child identity is `skuSuffix`, full SKU is composed.** `ItemCard.displaySku` builds
   `{parent.skuPrefix}-{skuSuffix}`; child `sku` is deprecated.
5. **Two child collections.** Some items use `variants` (typed `ItemVariant`), agrupadores use
   `items` (nested `Item`). Selection, search, and counts all check both.
6. **URL is the state for search/filter/sort.** Don't add parallel React state for these — write to
   the URL via `updateParam`/`applyFilters` so chips, count, and grid stay in sync.
7. **Draft vs committed filters.** The modal edits `draft*`; nothing changes until `applyFilters`.
   Re-open must re-seed drafts from the URL (`openFilterModal` does this).
8. **Active-state auto-toggle on stock edits** is intentional business logic — preserve it when
   touching stock handlers.
9. **`forceSaveItems` reads `itemsRef`, not `items`.** This avoids stale-closure writes right after
   an edit; keep the ref in sync if you add new write paths.
10. **Persistence is account-scoped.** Always key storage by `stockio-items-{currentAccount}` and
    respect the `stockio:items-updated` sync event.
11. **Column spans must stay aligned.** Tab header uses `grid-cols-12` = 5/3/4; `ItemCard` must
    match or headers and cells drift.
12. **Mock mode.** `USE_MOCK_DATA = true` means API routes are dormant. Behavior changes if this is
    flipped; the seed/import path only runs when no storage key exists.

---

## 9. Change-safety checklist

Before editing this module:
- [ ] Confirm you're editing `CatalogoGrid` / `page.tsx`, not `ItemsGrid`.
- [ ] Trace whether the value you touch is a **URL param** or **React state**.
- [ ] Check both child models (`variants` and `items`) if you walk children.

After editing:
- [ ] Search, each filter type + chips, sort (both directions) still work and stay in sync with the count.
- [ ] Single + bulk selection tri-state (row, parent, select-all) behaves correctly.
- [ ] Inline price/stock edits persist, recompute `disponible`, toast, and auto-toggle active state.
- [ ] Single + batch delete persist and survive reload; undo restores position.
- [ ] Parent expand/collapse and row→detail navigation both work.
- [ ] Data survives a reload and syncs across a second `useItems` consumer (open detail in parallel).
- [ ] No stock value written as a number; `disponible` never drifts from `enStock − reservado`.
