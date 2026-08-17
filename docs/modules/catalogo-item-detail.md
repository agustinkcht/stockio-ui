# Module: Catálogo · Item Detail

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/catalogo/items/[id]` detail page. Where it disagrees
> with the code, the code wins — treat the doc as stale and fix it.

---

## 1. At a glance

The **Item Detail** page is the full-screen editor for a single item (standalone, parent, or
child variant). It is reached by clicking a row in the [Item Grid](./catalogo-items.md) or the
"Ver Item" button after creation. It shows the item across four tabs — **Info, Stock, Precios,
Canales** — lets the user edit fields inline, duplicate or delete the item, and guards navigation
when there are unsaved changes.

| Quick fact | Value |
| --- | --- |
| Route | `/catalogo/items/[id]` (dynamic segment `id`) |
| Page component | `app/catalogo/items/[id]/page.tsx` (`CatalogoItemDetailPage`) — `"use client"` |
| Body renderer | `components/items/catalogo-item-detail-panel.tsx` (`CatalogoItemDetailPanel`) |
| Data hook | `hooks/use-items.ts` (`useItems`) |
| Navigation hook | `hooks/use-navigation.ts` (`useNavigation`) |
| Navigation guard | `hooks/use-navigation-guard.ts` (`useNavigationGuard`) |
| Sidebar/UI hook | `hooks/use-sidebar.ts` (`useSidebar`) |
| Unsaved-changes modal | `components/modals/unsaved-changes-modal.tsx` |
| Types | `lib/types.ts` (`Item`, `ItemVariant`, `Atributo`) |
| Lookup key | URL `id` matched against `item.id` **then** any `variant.id` |
| Persistence | `localStorage["stockio-items-{account}"]` (mock mode), via `useItems` |

> **`[id]` accepts both parent and child ids.** The page resolves the segment against top-level
> `items` first, then flattens every `item.variants` and matches a child by `variant.id`. A child
> id therefore opens the same page focused on that variant.

---

## 2. File & component map

| File | Role in this module |
| --- | --- |
| `app/catalogo/items/[id]/page.tsx` | The page. Reads `params.id`, resolves `selectedItem`, wires `useItems` + navigation hooks, owns the header (breadcrumb, save-status, floating toast), save/undo/redo/delete handlers, the unsaved-changes guard, and renders `CatalogoItemDetailPanel` inside `<main>`. |
| `components/items/catalogo-item-detail-panel.tsx` | The tabbed body. Renders **Info / Stock / Precios / Canales** tabs, per-field inline editors, variant expansion rows, the duplicate/delete menu, and inline `StockEditModal` / `PrecioEditModal`. Receives every handler as a prop. |
| `components/modals/unsaved-changes-modal.tsx` | Blocking modal shown by the navigation guard: Guardar / Descartar / Cancelar. |
| `hooks/use-items.ts` | Source of item data + all edit/delete/save operations and dirty flags. |
| `hooks/use-navigation.ts` | Back/forward history of visited items (`navigationHistory`, `historyIndex`). |
| `hooks/use-navigation-guard.ts` | Intercepts navigation while `hasUnsavedChanges` is true and surfaces the modal. |
| `components/layout/sidebar.tsx`, `breadcrumb.tsx`, `user-panel.tsx` | Chrome. |

---

## 3. Data model

The page reads the same `Item` / `ItemVariant` shapes as the grid (see the
[glossary](../APP_DOCUMENTATION.md#domain-glossary-shared-across-all-modules) and
[Item Grid §3](./catalogo-items.md#3-data-model) for the full definitions). Detail-specific notes:

```ts
// Resolution of the URL segment:
const selectedItem =
  items.find((item) => item.id === itemParam) ||
  items.flatMap((item) => item.variants || []).find((variant) => variant.id === itemParam)
```

- `selectedItem` may be either an `Item` (standalone/parent) **or** an `ItemVariant` (child).
  The panel branches its layout on `hasVariants` / `isAgrupador` / presence of `variants`.
- The four detail tabs map to these field groups:
  - **Info** — `name`, `sku`/`skuPrefix`, `codigoUniversal`, `categoria`, `marca`, `modelo`,
    `formatoVenta`, `proveedor`, `codigoProveedor`, `descripcion`, `atributosPrincipales`,
    `atributosInformativos`, media.
  - **Stock** — `stock.{enStock, reservado, disponible}` (strings) per item/variant.
  - **Precios** — `precio.{costo, margen, iva, precioFinal}` (numbers).
  - **Canales** — sales-channel toggles/metadata.
- All invariants from the grid doc apply verbatim: **stock is stringly-typed**,
  `disponible = enStock − reservado`, **parents have no `sku` (only `skuPrefix`)**, and children
  are identified by `skuSuffix` with a composed full SKU.

---

## 4. State & data flow

### 4.1 Local page state

| State | Purpose |
| --- | --- |
| `selectedDetailTab` | Active tab: `"info" \| "stock" \| "precios" \| "canales"`. |
| `expandedItems` (`Record<number,boolean>`) | Which variant rows are expanded in the panel. |
| `isSaving` | Drives the "Creando/Guardando" spinner + disabled state during save. |
| `showSaveSuccess` | Shows the inline "Cambios Guardados" pill in the header. |
| `toastLabel` + `toastTimerRef` | Floating top-center toast, auto-dismissed after 3s. |

### 4.2 Edit / save model (staged, unlike the grid)

Unlike the Item Grid (immediate writes), the detail page uses `useItems`' **staged edit** model:

1. Field edits call `onFieldChange → editField(itemSku, field, value)` (which auto-reroutes to
   variant editing when the id belongs to a child). Edits accumulate as **unsaved edits**.
2. Dirty flags: `hasUnsavedEdits`, `hasUnsavedDeletes`, plus undo/redo availability
   (`canUndoEdit`, `canRedoEdit`).
3. **Guardar** (`handleGuardar`) commits: `saveEdit()` for edits and `saveDeletedItems()` for
   deletes, with small artificial delays for UX, then flashes `showSaveSuccess`.
4. **Undo/redo** map to `undoEdit`/`redoEdit`; `handleDeshacer` discards via `cancelEdit()` +
   `undoDelete()`. `handleUndo` prefers edit-undo, falling back to delete-undo.
5. `onSaveNow → forceSaveItems()` persists immediately (used by the panel for edits that should
   not stage, e.g. inline stock/precio modals).

### 4.3 Navigation guard

`useNavigationGuard({ hasUnsavedChanges, onSave, onDiscard })` intercepts navigation while dirty
and opens `UnsavedChangesModal`. Its `handleSaveAndNavigate` / `handleDiscardAndNavigate` /
`handleCancelNavigation` resolve the pending route. Breadcrumb and back/forward all route through
`guardedNavigate` so no exit bypasses the guard.

### 4.4 Back / forward history

`useNavigation` keeps `navigationHistory[]` + `historyIndex`. When **not** dirty, `navigateBack`/
`navigateForward` move through history directly. When dirty, the handlers instead `router.push`
the neighbor item's route (`/catalogo/items/{id}`) so the guard can intercept.

### 4.5 Delete → redirect

`handleDeleteWithTracking(item)` calls `deleteItem(item)` then redirects to the grid with
`?deleted={name}&tipo={item|agrupador}`; the grid shows a toast and scrubs the params.

### 4.6 Redirect-on-missing

An effect redirects to `/catalogo/items` if `selectedItem` is not found once `items` has loaded
(bad/stale id). While unresolved it renders a blank `bg-[rgb(243,242,238)]` screen.

---

## 5. Component tree & layout

```
CatalogoItemDetailPage (min-h-screen, bg panel)
└── flex row (sidebar + content), h-screen, onClick closes sidebar dropdowns
    ├── Sidebar (sticky, full height)                     [layout/sidebar.tsx]
    └── Right column (bg-white rounded card)
        ├── Header bar (h-44px, dark #1B1C20)
        │   ├── Breadcrumb ("Catálogo / Items / {name}") → guardedNavigate
        │   ├── UserPanel (center)
        │   └── "Cambios Guardados" success pill (right, conditional)
        └── main (overflow-auto)
            └── CatalogoItemDetailPanel                    [items/catalogo-item-detail-panel.tsx]
                ├── Tab strip: Info · Stock · Precios · Canales
                ├── Tab body (per-tab field editors)
                ├── Variant rows (expand/collapse) — parents/variantes only
                └── inline StockEditModal / PrecioEditModal
    ├── Floating toast (top-center, conditional)
    └── UnsavedChangesModal (conditional)
```

Breadcrumbs: `[{Catálogo}, {Items → /catalogo/items}, {selectedItem.name}]`, collapsing to two
entries while the item is unresolved.

---

## 6. Behaviors (itemized)

### Tabs
- Four tabs (`info`, `stock`, `precios`, `canales`) switch the panel body via `selectedDetailTab`.
- Parent/variantes items additionally render expandable variant rows in relevant tabs.

### Inline field editing
- Editing any field calls `onFieldChange(itemSku, field, value) → editField`. Child fields are
  handled transparently (the id resolves to a variant and reroutes to variant editing).
- Edits are **staged** (dirty), not persisted until Guardar — except inline stock/precio modals
  which use `onSaveNow → forceSaveItems()`.

### Stock & precio inline modals
- The panel opens `StockEditModal` / `PrecioEditModal` from the Stock / Precios tabs.
- Stock edits recompute `disponible = enStock − reservado`; keep the string typing.

### Save / status
- **Guardar** commits staged edits + deletes with UX delays and shows the "Cambios Guardados"
  header pill (and a floating toast via `onShowToast`).
- Errors are caught and logged (`[v0] Error saving changes`), leaving `isSaving` reset.

### Undo / redo / discard
- Undo prefers edit-undo, then delete-undo; redo maps to `redoEdit`; discard (`handleDeshacer`)
  cancels staged edits and restores deletes.

### Duplicate / delete
- **Duplicate** — currently a stub (`onDuplicate` logs `Duplicate`).
- **Delete** — `handleDeleteWithTracking` deletes and redirects to the grid with a toast payload;
  label is `agrupador` when `hasVariants || isAgrupador`, else `item`.

### Navigation
- Breadcrumb, back, and forward all route through the guard. Dirty state forces the modal
  (Guardar / Descartar / Cancelar) before leaving.
- **Close** (`handleClose`) returns to `/catalogo/items`.

### Chrome
- Header success pill animates in; floating toast auto-dismisses after 3s; sidebar dropdowns
  close on outside click.

---

## 7. Public API surfaces

### `useItems()` — exports used here
| Export | Purpose |
| --- | --- |
| `items` | Item array; source for resolving `selectedItem`. |
| `editField(skuOrId, field, value)` | Stage a field edit (auto-reroutes to variant). |
| `updateStock` / `updateItem` | Passed to the panel for stock and whole-item updates. |
| `deleteItem(item)` / `undoDelete()` / `saveDelete()` | Delete lifecycle. |
| `saveEdit()` / `cancelEdit()` / `undoEdit()` / `redoEdit()` | Staged-edit lifecycle. |
| `forceSaveItems()` | Immediate persist (used by `onSaveNow`). |
| `hasUnsavedEdits` / `hasUnsavedDeletes` / `canUndoEdit` / `canRedoEdit` | Dirty & history flags. |

### `useNavigation()`
`currentView`, `historyIndex`, `navigationHistory`, `navigateBack()`, `navigateForward()`.

### `useNavigationGuard({ hasUnsavedChanges, onSave, onDiscard })`
Returns `showNavigationModal`, `handleSaveAndNavigate`, `handleDiscardAndNavigate`,
`handleCancelNavigation`.

### `CatalogoItemDetailPanel` props (page → panel)
`selectedItem`, `selectedDetailTab` + `setSelectedDetailTab`, `expandedItems` +
`toggleVariantExpansion`, `updateStock`, `updateItem`, `allItems`, `item`, `onClose`,
`onFieldChange`, `isSaving`, `onDuplicate`, `onDelete`, `variantChangeHandlers`, `isExpanded`,
`onSaveNow`, `onShowToast`.

> Note: the panel's prop types are loosely typed in places (`item: any`, `variantChangeHandlers:
> any`, `expandedItems: Set<string>` in the interface vs. a `Record<number,boolean>` passed by the
> page). Treat the runtime shapes documented here as ground truth and tighten types with care.

---

## 8. Edge cases & gotchas

1. **`id` resolves against variants too.** Always resolve top-level `items` first, then flatten
   `variants`. A child id is valid and opens the page focused on that variant.
2. **Staged vs. immediate.** Field edits are staged (need Guardar); inline stock/precio modals
   persist immediately via `forceSaveItems`. Don't mix the two paths for the same field.
3. **Every exit must pass the guard.** Use `guardedNavigate` / the dirty-aware back/forward
   handlers; never add a raw `router.push` exit that bypasses `useNavigationGuard`.
4. **Missing/stale id redirects.** If the id doesn't resolve once `items` is loaded, the page
   redirects to the grid — do not assume `selectedItem` is always defined in new code paths.
5. **Delete payload contract.** The grid depends on `?deleted=&tipo=` query params to show its
   toast; keep the label logic (`agrupador` vs `item`) in sync with the grid reader.
6. **Duplicate is a stub.** `onDuplicate` currently only logs — implement before exposing it.
7. **Persistence is shared.** Writes go through `useItems` to `stockio-items-{account}` and emit
   `stockio:items-updated`; the grid re-reads automatically.

---

## 9. Change-safety checklist

Before editing:
- [ ] Confirm whether the field you touch should **stage** (`editField`) or **persist now**
      (`forceSaveItems`).
- [ ] Check whether `selectedItem` can be a child variant in the path you're editing.

After editing:
- [ ] All four tabs render for standalone, parent, and child items.
- [ ] Save / undo / redo / discard update dirty flags correctly.
- [ ] Every navigation exit (breadcrumb, back, forward, close, delete) still triggers the guard
      when dirty.
- [ ] Delete redirects with the correct `?deleted=&tipo=` payload and the grid toast fires.
- [ ] Stock/precio inline edits keep `disponible = enStock − reservado` and string typing.
