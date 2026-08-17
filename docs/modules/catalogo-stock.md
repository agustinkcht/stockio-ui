# Module: Catálogo · Stock

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/catalogo/stock` page (`app/catalogo/stock/page.tsx`).
> Where it disagrees with the code, the code wins — treat the doc as stale and fix it.
>
> **UI status:** ⬜ **on the current design (`UI_LAYOUT_ACTUAL.md`)** — not yet migrated to
> [`UI_DESIGN_SYSTEM_TARGET.md`](../UI_DESIGN_SYSTEM_TARGET.md) (only `catalogo/items` is).
> **Cross-module data flow:** see [`DATA_FLOW_AND_RELATIONSHIPS.md`](../DATA_FLOW_AND_RELATIONSHIPS.md) §3.
> **Terms:** see [`GLOSSARY.md`](../GLOSSARY.md).

## 1. At a glance

A read-first, edit-on-demand **stock table** for the whole catalog. It lists every item (parents
expand to variants) across three columns — **En Stock, Reservado, Disponible** — where only
**En Stock** is directly editable; **Disponible** is always derived (`enStock − reservado`, floored
at 0). It shares the exact layout skeleton and edit/save lifecycle of Lista de Precios, but with a
stock-specific grid and a single bulk-edit action (on the En Stock column).

| Quick fact | Value |
| --- | --- |
| Route | `/catalogo/stock` |
| Page component | `StockPage` (default export) |
| Grid component | `StockListGrid` (`components/stock/stock-list-grid.tsx`) |
| Bulk modal | `BulkStockModal` (`components/modals/bulk-stock-modal.tsx`) |
| Selection hook | `usePriceSelection` (shared with Lista de Precios) |
| Data hook | `useItems` |
| Editable field | `stock.enStock` (via `handleStockFieldChange`) |
| Derived field | `stock.disponible = max(0, enStock − reservado)` |
| Persists to | `localStorage` via `useItems.forceSaveItems()` |

## 2. File & component map

| File | Role |
| --- | --- |
| `app/catalogo/stock/page.tsx` | Page shell: layout, edit/save lifecycle, search/filter/sort, selection lift, stock-edit math, bulk wiring. |
| `components/stock/stock-list-grid.tsx` | Renders rows, inline En Stock editor, resolves visible/selected SKUs, exposes bulk trigger. |
| `components/modals/bulk-stock-modal.tsx` | `BulkStockModal` — operation/value form for the En Stock bulk edit. |
| `hooks/use-price-selection.ts` | Selection state, shared with the price grid. |
| `hooks/use-items.ts` | Item source + staged edit buffer (`editField`, `editVariantField`, `forceSaveItems`). |
| `lib/utils/item-utils.ts` | `searchItems`, `filterItems`, `sortItems`, `getUniqueCategorias/Marcas`. |

## 3. Data model

Edits target the item's / variant's **`stock`** object (all values stored as **strings**):

```ts
stock: { enStock: string; reservado: string; disponible: string }
```

Reads are defensive because legacy/mixed shapes exist. `getItemStock` (grid) and
`getItemCurrentTotal` (page) resolve the total in this precedence:

```
item.enStock  ??  stock.enStock  ??  stock.total (legacy)  ??  (numeric stock)  ??  0
```

`reservado` similarly falls back across `item.stockReservado`, `stock.reservado`, `item.reservado`.

## 4. State & data flow

- **`isEditMode`** toggles view/edit; the inline En Stock editor and the En-Stock `⋮` bulk trigger
  render only when `true`.
- **`items`** from `useItems`; edits go to the **staged edit buffer**.
- **Save:** `handleGuardar` waits 800 ms then `forceSaveItems()`, shows the toast for 3 s. (Stock
  has **no delete flow**, so unlike Lista de Precios it does not call `saveDelete`.)
- **Cancel/Deshacer:** `reloadItems()` drops staged edits.
- **Navigation guard:** identical `useNavigationGuard` pattern → `UnsavedChangesModal`.
- **Selection lifted** from `StockListGrid` via `onSelectionChange`, mirrored into
  `selCount/selHas/selAll/selIndeterminate`.
- **Bulk trigger via ref:** header calls `gridBulkStockModalOpenRef.current()`; the grid assigns it
  to `() => setBulkModalOpen(true)`. (Note: **no argument** — Stock has only one bulk target.)

## 5. Component tree & layout

```
StockPage
└─ Sidebar
└─ Panel (white, rounded)
   ├─ Utility bar (dark): Breadcrumb · UserPanel
   └─ Scrollable region
      ├─ Title "Stock" + [Editar Stock] / [Cancelar][Guardar Cambios]
      ├─ Sticky bar
      │  ├─ Row 1: Search · filter tags · Filtrar (Categoría/Marca/Stock) · Ordenar · count
      │  └─ Row 2: select-all + count · header (Item | En Stock ⋮ | Reservado | Disponible)
      │           each stock column has an "i" tooltip; only En Stock has the ⋮ bulk trigger
      └─ StockListGrid (rows; parents expand to variants)
   Modal: UnsavedChangesModal
   Toast: "Cambios guardados / Stock actualizado"
```

Grid columns use `grid-cols-[minmax(0,6fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)]`
(**Item 6 · En Stock 2 · Reservado 2 · Disponible 2**), defined once as `COLS` in the grid.

## 6. Behaviors

1. **Search / Filter / Sort** — same controls as Lista de Precios, but: filter is **Categoría /
   Marca / Stock**, where **Stock** is a multi-check with `reservado` ("Con stock reservado") and
   `sin-disponible` ("Sin stock disponible"); sort fields are `nombre`, `enStock`,
   `stockReservado`, `stockDisponible`.
2. **Count badge** — `filteredCount` via `filterItems(searchItems(items))`.
3. **Inline edit (En Stock only)** — `handleStockFieldChange(sku, "total"|"reservado", value)`
   reads current stock, computes `disponible = max(0, enStock − reservado)`, rebuilds the string
   `stock` object, and routes to `editVariantField`/`editField`. (`field: "reservado"` is supported
   by the handler even though the UI edits En Stock.)
4. **Bulk edit (En Stock)** — `⋮` opens `BulkStockModal`; apply calls
   `handleBulkStockEdit(operation, value, targetSkus)` with operations `aumentar` / `reducir`
   (floored at 0) / `fijar_en`. It preserves each row's existing `reservado` and recomputes
   `disponible`. Targets = selected SKUs, else all visible SKUs (grid's `getTargetSkus`).
5. **Derived Disponible** — never edited directly; always `max(0, enStock − reservado)`.
6. **Parent/variant rows** — parents expand via `toggleVariantExpansion`. A parent's own stock is
   read the same way; variants are matched by `sku`/`id` scan across `item.variants`.

> **⚠ STALE PATH — variant matching still keys off the deprecated `ItemVariant.sku`.** The
> rest of the docs treat `ItemVariant.sku` as `@deprecated` and use `skuSuffix` + the
> composed full SKU (`` `${parent.skuPrefix}-${skuSuffix}` ``) as variant identity (see
> [`catalogo-items.md`](./catalogo-items.md) §3 and [`GLOSSARY.md`](../GLOSSARY.md)). This
> grid (and Lista de Precios) still scans `v.sku`. It should eventually migrate to
> `skuSuffix` + composed SKU like the reference module.

7. **Active-state auto-toggle is NOT implemented here.** The Item Grid auto-pauses an item
   when `disponible` hits 0 and reactivates it when stock returns (see
   [`catalogo-items.md`](./catalogo-items.md) §6 → Inline edit). The dedicated Stock screen
   does **not** do this — `handleStockFieldChange` / `handleBulkStockEdit` only rewrite the
   `stock` object. ⚠ Inconsistency to reconcile when this module is migrated.

## 7. Public API surfaces

`StockListGrid` props (page → grid):

```ts
items, gridSize, expandedItems, toggleVariantExpansion,
onStockFieldChange(itemSku, field: "total" | "reservado", value: number),
onBulkStockEdit(operation, value, targetSkus),
searchTerm, activeFilters, sortPriorities,
onSelectionChange(count, has, selectAll, indeterminate, handleSelectAll),
isEditMode,
bulkModalOpenRef: MutableRefObject<() => void>   // no-arg opener
```

`useItems` members used: `items, editField, editVariantField, undoEdit, forceSaveItems, cancelEdit,
reloadItems, hasUnsavedEdits`.

## 8. Edge cases & gotchas

1. **Stock values are strings.** All three fields are stored as strings and parsed with `parseInt`
   on read. Always `.toString()` when writing.
2. **`Disponible` is derived, not stored authoritatively.** Never let the UI edit it; recompute it
   whenever `enStock` or `reservado` changes.
3. **Legacy `total` key.** Reads must tolerate `stock.total` (old) as well as `stock.enStock`
   (current); the resolver precedence in §3 must be preserved.
4. **Bulk edit preserves `reservado`.** `handleBulkStockEdit` only changes `enStock` and recomputes
   `disponible`; it must re-read and keep the existing `reservado`.
5. **`onStockFieldChange` field is `"total"`, not `"enStock"`.** The handler maps the `"total"`
   field name to the `enStock` value — don't rename without updating both sides.
6. **No delete / no Nuevo-item modals here.** Unlike Lista de Precios, Stock does not wire item
   creation or deletion; `handleGuardar` only calls `forceSaveItems`.
7. **Variant detection is by SKU/id scan** across `item.variants`, same caveat as the price grid.
8. **Filtering duplicated** in page (count) and grid (rows) — keep semantics aligned.

> **⚠ STALE ROUTES — the `app/stock/*` tree is dead code.** Separate from this canonical
> `/catalogo/stock` page, an older parallel implementation still exists under
> **`app/stock/`**: `app/stock/stock2`, `app/stock/articulos/editor-masivo`, and
> `app/stock/stock/[item]`. They render the legacy `ItemsGrid` + `UserPanel`, are **not**
> linked from the sidebar, and are superseded by `/catalogo/stock` (this page) and
> `/catalogo/creador-masivo`. Do not build on them; they are candidates for deletion.

## 9. Change-safety checklist

- [ ] Keep `disponible` derived (`max(0, enStock − reservado)`) everywhere it is written.
- [ ] Preserve string typing and the legacy-`total` read precedence.
- [ ] Bulk edits must retain existing `reservado`.
- [ ] Touching save/cancel? Preserve `forceSaveItems` + `reloadItems` + navigation guard (no
      delete flow).
- [ ] Selection is grid-owned and lifted via `onSelectionChange` — update both sides together.
