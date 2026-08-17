# Catálogo · Lista de Precios

> Route: `/catalogo/lista-de-precios` · Primary source: `app/catalogo/lista-de-precios/page.tsx`
> Status: ✅ Documented. Reflects the **current** implementation only.

## 1. At a glance

A read-first, edit-on-demand **pricing table** for the whole catalog. It lists every item (parents
expand to show their variants) across four commercial columns — **Costo, Margen, IVA, Precio de
Venta** — and lets the user edit them inline, or bulk-edit a column across selected/visible rows.
The page is view-only until the user presses **Editar Lista**; editing is staged in `useItems`'
edit buffer and only written to `localStorage` on **Guardar Cambios**.

| Quick fact | Value |
| --- | --- |
| Route | `/catalogo/lista-de-precios` |
| Page component | `ListaDePreciosPage` (default export) |
| Grid component | `PriceGrid` (`components/prices/price-grid.tsx`) |
| Bulk modal | `BulkPriceModal` (`components/modals/bulk-price-modals.tsx`) |
| Selection hook | `usePriceSelection` (shared with Stock) |
| Data hook | `useItems` |
| Editable columns | `costo`, `margen`, `iva`, `precioFinal` (shown as "Precio de Venta") |
| Persists to | `localStorage` via `useItems.forceSaveItems()` |

## 2. File & component map

| File | Role |
| --- | --- |
| `app/catalogo/lista-de-precios/page.tsx` | Page shell: layout, edit/save lifecycle, search/filter/sort state, selection lift, bulk-edit math, modal wiring. |
| `components/prices/price-grid.tsx` | Renders the rows, inline editors, per-column bulk trigger, and computes visible/selected SKUs. |
| `components/modals/bulk-price-modals.tsx` | `BulkPriceModal` — the operation/value/unit form used by column bulk-edit. |
| `hooks/use-price-selection.ts` | Selection state (`usePriceSelection`), shared with Stock grid. |
| `hooks/use-items.ts` | Item source + staged edit buffer (`editField`, `editVariantField`, `forceSaveItems`, undo/redo). |
| `lib/utils/item-utils.ts` | `searchItems`, `filterItems`, `sortItems`, `getUnique*`. |
| `lib/contexts/settings-context.tsx` | `precios.costoBehavior` setting that governs cost-edit recalculation. |

## 3. Data model

Edits target the item's / variant's **`precio`** object:

```ts
precio: { costo: number; margen: number; iva: number; precioFinal: number }
```

- The page reads pricing via `getItemPricingBySku(skuOrId)`, which **falls back** to flat fields
  (`item.costo`, `item.margen`, `item.iva`, `item.precioVenta`) when there is no `precio` object.
- Bulk edits always write a **whole `precio` object** back through `editField` / `editVariantField`
  (field name `"precio"`). Inline edits write a single field via `handlePriceFieldChange`.

## 4. State & data flow

- **`isEditMode`** (local) toggles the whole page between view and edit. Inline editors and the
  per-column bulk `⋮` triggers only render when `true`.
- **`items`** comes from `useItems`. Edits go into the hook's **staged edit buffer** (not storage).
- **Save:** `handleGuardar` → if `hasUnsavedEdits` waits 800 ms then `forceSaveItems()`; if
  `hasUnsavedDeletes` waits 800 ms then `saveDelete()`. Shows the "Cambios guardados" toast for 3 s.
- **Cancel/Deshacer:** `reloadItems()` (re-reads storage, dropping staged edits) + `undoDelete()`.
- **Navigation guard:** `useNavigationGuard({ hasUnsavedChanges: isEditMode && hasChanges })` opens
  `UnsavedChangesModal` on route changes with pending edits.
- **Selection is lifted:** `PriceGrid` owns selection (`usePriceSelection`) and pushes state up via
  `onSelectionChange(count, has, all, indeterminate, doSelectAll)`. The page mirrors it into
  `selCount/selHas/selAll/selIndeterminate` to render the header "select-all" checkbox + count.
- **Bulk trigger is inverted through a ref:** the page's column headers call
  `gridBulkModalOpenRef.current(type)`; the grid assigns that ref to its own `handleBulkModalOpen`,
  so the header `⋮` buttons open the grid-owned `BulkPriceModal`.

## 5. Component tree & layout

```
ListaDePreciosPage
└─ Sidebar (+ dimming overlay when a Nuevo-item modal is open)
└─ Panel (white, rounded)
   ├─ Utility bar (dark #1B1C20): Breadcrumb · UserPanel
   └─ Scrollable region
      ├─ Title "Lista de Precios" + [Editar Lista] / [Cancelar][Guardar Cambios]
      ├─ Sticky bar
      │  ├─ Row 1: Search · active filter tags · Filtrar · Ordenar (dir+field) · count
      │  └─ Row 2: select-all + "N seleccionados" · column header (Item | Costo | Margen | IVA | Precio de Venta)
      │           (each editable column shows a ⋮ bulk trigger only in edit mode)
      └─ PriceGrid (rows; parents expand to variants)
   Modals: TemplateModal · NuevoItemModal · NuevoItemConVariantesModal · UnsavedChangesModal
   Toast: "Cambios guardados / Lista de precios actualizada"
```

Column header uses a 12-col grid: **Item 6 · Costo 2 · Margen 1 · IVA 1 · Precio de Venta 2**.

## 6. Behaviors

1. **Search** — `searchQuery` → `searchItems`. **Filter** — Categoría / Proveedor / Marca (single-
   select dropdowns) + filter tags with individual remove + "Limpiar filtros". **Sort** — quick
   split control: direction toggle + field select (`nombre`, `precioFinal`, `costo`, `margen`),
   synced into `sortPriorities`.
2. **Count badge** — `filteredCount` = `filterItems(searchItems(items))`.length.
3. **Inline edit** (edit mode) — editing a cell calls `handlePriceFieldChange(sku, field, value)`,
   which detects whether the sku is a variant (searches every parent's `variants`) and routes to
   `editVariantField(parentSku, sku, …)` or `editField(sku, …)`.
4. **Bulk edit a column** — the `⋮` on Costo/Margen/IVA/Precio de Venta opens `BulkPriceModal`;
   applying calls `handleBulkEdit(type, operation, value, unit, targetSkus)`. Targets are the
   selected SKUs, or all visible SKUs when nothing is selected (grid resolves this).
5. **Bulk math** (`handleBulkEdit`) — operations `fijar_en` / `aumentar` / `reducir`, unit `%` or
   absolute:
   - **costo:** recompute cost, then branch on `preciosSettings.costoBehavior`:
     `preservePrecioFinal` → recompute **margen** from the fixed precioFinal; otherwise recompute
     **precioFinal** from margen.
   - **precioFinal:** recompute precioFinal, then **margen** from it.
   - **margen:** skipped when `costo === 0`; else set margen and recompute precioFinal.
   - **iva:** set directly (value only).
6. **Formulas:** `precioFinal = round(costo * (1 + margen/100))`;
   `margen = round((precioFinal/costo - 1) * 1000) / 10` (one decimal); `0` when `costo === 0`.
7. **Parent/variant rows** — parents expand via `toggleVariantExpansion(index)` (`expandedItems`).
8. **Nuevo item** — the two creation modals (`NuevoItemModal`, `NuevoItemConVariantesModal`) are
   wired here via `useModals`; on success `setItemCreated(true)` briefly (grid refresh signal).

## 7. Public API surfaces

`PriceGrid` props (page → grid):

```ts
items, gridSize, expandedItems, toggleVariantExpansion,
gridSizeDropdownOpen, setGridSizeDropdownOpen, setGridSize,
onPriceFieldChange(itemSku, field, value),
onBulkEdit(type, operation, value, unit, targetSkus),
searchTerm, activeFilters, sortPriorities,
onSelectionChange(count, has, selectAll, indeterminate, handleSelectAll),
isEditMode,
bulkModalOpenRef: MutableRefObject<(type) => void>   // grid writes its opener here
```

`useItems` members used: `items, updateItem, deleteItem, undoDelete, saveDelete, hasUnsavedDeletes,
editField, editVariantField, forceSaveItems, reloadItems, hasUnsavedEdits, canUndoEdit, canRedoEdit,
handleCreateNuevoItem, handleCreateNuevoItemConVariantes, isCreatingItem`.

## 8. Edge cases & gotchas

1. **`precio` object vs. flat fields.** `getItemPricingBySku` reads `item.precio` if present,
   otherwise flat `costo/margen/iva/precioVenta`. When bulk-editing it always **writes back a full
   `precio` object** — so a flat-field item gets normalized into a `precio` object on first edit.
2. **IVA default is `21`** everywhere pricing is read with a fallback (`iva || 21`).
3. **Variant detection is by SKU scan**, not a flag: `handlePriceFieldChange` / `findItemBySku`
   loop over every parent's `variants` and match `v.sku === itemSku`. Keep variant `sku` unique.
4. **`findItemBySku` returns `parentSku = item.sku || item.id`** — parents may be keyed by `id`.
5. **Margen bulk edit is a no-op when `costo === 0`** (can't derive a percentage of zero).
6. **Saving is delegated to `useItems`.** Do not write `localStorage` here — use `forceSaveItems`.
7. **`filterOpen`/`sortField` are page-local**; the grid re-runs `searchItems→filterItems→sortItems`
   itself from the props, so filtering logic lives in **both** places (page for the count, grid for
   rows). Keep them consistent if you change filter semantics.
8. **`precioFinalMode` (`con_iva`/`sin_iva`) exists in `PriceGrid`** but the page does **not** pass
   it, so the grid uses its internal default `con_iva`. Don't assume the page controls it.

## 9. Change-safety checklist

- [ ] Editing pricing math? Update **both** the page (`handleBulkEdit`, formulas) and confirm the
      grid's inline editors write the same fields.
- [ ] Adding a column? Update the 12-col header grid, the `⋮` trigger wiring, and `PriceGrid`.
- [ ] Touching save/cancel? Preserve the `forceSaveItems` + `saveDelete` + `reloadItems` contract
      and the navigation guard.
- [ ] Changing selection? It is owned by the grid and lifted via `onSelectionChange` — update both.
- [ ] Respect `preciosSettings.costoBehavior` when changing cost-edit behavior.
