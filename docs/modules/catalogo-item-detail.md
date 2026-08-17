# Module: Catálogo · Item Detail

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/catalogo/items/[id]` detail page. Where it disagrees
> with the code, the code wins — treat the doc as stale and fix it.
>
> **Rewritten to match the current implementation.** The page has **no tabs** and **no "Canales"
> view**. An earlier version of this doc described an obsolete four-tab model
> (Info / Stock / Precios / Canales) that no longer exists in the UI. If you find leftover
> references to those tabs, they are stale.

---

## 1. At a glance

The **Item Detail** page is the full-screen editor for a single catalog entry. The exact same
page and panel render **three distinct item types**, and the layout reshapes itself based on
which one is being viewed:

- **Standalone item** — a normal item with no variants.
- **Variante (child)** — one variant that belongs to an agrupador (parent).
- **Agrupador (parent/container)** — a grouping item that owns a matrix of variants.

The layout is a **two-region composition** (not tabs):

- **Standalone / Variante** → a **left black "flip card"** (image on the front, description + media
  on the back) that also surfaces **Precio Venta** and **Stock** as tappable metrics, plus a
  **right white card** with *Información General* and *Atributos Informativos*.
- **Agrupador** → **no image card**; instead a **variant matrix** (SKU / Código Universal / Precio /
  Stock per variant) alongside the agrupador's own info, with an in-card **Info ↔ Atributos**
  toggle and an expandable full-width matrix.

| Quick fact | Value |
| --- | --- |
| Route | `/catalogo/items/[id]` (dynamic segment `id`) |
| Page component | `app/catalogo/items/[id]/page.tsx` (`CatalogoItemDetailPage`) — `"use client"` |
| Body renderer | `components/items/catalogo-item-detail-panel.tsx` (`CatalogoItemDetailPanel`, ~4.3k lines) |
| Data hook | `hooks/use-items.ts` (`useItems`) |
| Settings hook | `lib/contexts/settings-context.tsx` (`useSettings`) — catálogo/stock/precios prefs |
| Proveedores hook | `hooks/use-proveedores.ts` (`useProveedores`) |
| Navigation hooks | `hooks/use-navigation.ts`, `hooks/use-navigation-guard.ts`, `hooks/use-sidebar.ts` |
| Edit modals | `stock-edit-modal`, `precio-edit-modal`, `nueva-variante-modal`, `nuevo-proveedor-modal`, `unsaved-changes-modal` |
| Types | `lib/types.ts` (`Item`, `ItemVariant`, `Atributo`) |
| Lookup key | URL `id` matched against `item.id` **then** any `variant.id` |
| Persistence | `localStorage["stockio-items-{account}"]` via `useItems`; panel persists **immediately** |

> **`[id]` accepts both parent and child ids.** The page resolves the segment against top-level
> `items` first, then flattens every `item.variants` and matches a child by `variant.id`. A child
> id therefore opens the same page focused on that variant.

---

## 2. The three item types (core mental model)

Everything on this page branches off two derived booleans computed at the top of the panel:

```ts
// A container = a parent/agrupador. Drives whether the image card shows or the matrix shows.
const isViewingContainer = selectedItem?.isAgrupador || selectedItem?.hasVariants || false

// Find the parent that owns this item as a variant (matched by unique id).
const fatherItem = !isViewingContainer
  ? allItems.find((it) => (it.hasVariants || it.isAgrupador)
      && it.variants?.some((v) => v.id === selectedItem.id))
  : null

const isChildItem = fatherItem !== null && fatherItem !== undefined
```

| Derived flag | Meaning | Header title |
| --- | --- | --- |
| `isViewingContainer === true` | **Agrupador** (parent) | "Detalle del Agrupador" |
| `isChildItem === true` | **Variante** (child of `fatherItem`) | "Detalle de la Variante" |
| both `false` | **Standalone** item | "Detalle del Item" |

`isViewingContainer` and `isChildItem` are **mutually exclusive** (a container is resolved before
the parent lookup runs, so a parent never also counts as a child).

### 2.1 Standalone item
- Left **flip card** + right **info/atributos card** (`grid-cols-10`, gaps `gap-16`).
- Left card shows image, editable **name**, **SKU** (`selectedItem.sku`), and the **Precio Venta**
  and **Stock disponible** metrics.
- Right card shows *Información General* (categoría, marca, modelo, formato de venta, unidades por
  pack, volumen, vencimiento, proveedor, código de proveedor) and *Atributos Informativos*.
- All fields are freely editable (nothing inherited).

### 2.2 Variante (child)
- Same two-card layout as standalone, but with **inheritance from `fatherItem`**.
- The left card SKU renders as a **composed** value: `"{fatherItem.skuPrefix|sku}-{selectedItem.skuSuffix|sku}"`.
  The prefix is shown muted; only the **suffix** is editable.
- The child's **principal atributos** (`atributosPrincipales`, e.g. Color=Negro) render as small
  blue tags under the title.
- A **"Ver Agrupador"** link in the header routes to `/catalogo/items/{fatherItem.id}`.
- **Inheritance rules** (see §6.4) lock several fields to the parent's values.

### 2.3 Agrupador (parent / container)
- **No image flip card.** Layout is `grid-cols-10` with `gap-6`.
- Renders the agrupador's own **Información General / Atributos** column plus a **Variantes card**
  containing the **variant matrix** (one row per variant with SKU, Código Universal, Precio venta,
  Stock columns).
- The Variantes card has an **in-card toggle** (`rightCardMode`) between **"info"** (the matrix)
  and **"atributos"** (the agrupador's *Atributos Informativos*). This 2-way toggle is **not** the
  old global tab bar — it lives inside the container card only.
- The matrix can **expand full width** (`isExpandedMatrixOpen`): the grid collapses to
  `grid-cols-1`, the side Variantes card hides, and the matrix takes over for dense editing.
- `containerAtributosPrincipales` defines the variant axes (e.g. Color, Talle) used to generate
  variants; editing them can add/remove variant rows.

---

## 3. File & component map

| File | Role in this module |
| --- | --- |
| `app/catalogo/items/[id]/page.tsx` | The page shell. Reads `params.id`, resolves `selectedItem`, wires `useItems` + navigation hooks, owns the dark header bar (breadcrumb, `UserPanel`, "Cambios Guardados" pill, floating toast), the delete→redirect handler, and the (largely dormant) unsaved-changes guard. Renders `CatalogoItemDetailPanel` in `<main>`. |
| `components/items/catalogo-item-detail-panel.tsx` | **The entire detail UI.** Owns the section header (title + Editar/Guardar/Cancelar + kebab delete), the item-type layout branching, all field editors, the flip card, the variant matrix, inheritance logic, and all inline modals. Persists via `onFieldChange` + `onSaveNow`. |
| `stock-edit-modal.tsx` / `precio-edit-modal.tsx` | Modal editors for stock and precio (used for the item itself and for matrix variant cells). Persist immediately and fire a toast. |
| `nueva-variante-modal.tsx` | Adds a new variant to an agrupador. |
| `nuevo-proveedor-modal.tsx` | Creates a proveedor inline from the proveedor dropdown. |
| `unsaved-changes-modal.tsx` | Guard modal (Guardar / Descartar / Cancelar) — see §6.6 for why it is mostly dormant now. |
| `hooks/use-items.ts` | Item data + all edit/delete/save operations. |
| `lib/contexts/settings-context.tsx` | `catalogo`, `stock`, `precios` preference flags read by the panel. |
| `hooks/use-proveedores.ts` | Proveedor list + `addProveedor`. |

---

## 4. Data model

The page reads the same `Item` / `ItemVariant` shapes as the grid (see the
[glossary](../APP_DOCUMENTATION.md#domain-glossary-shared-across-all-modules) and
[Item Grid §3](./catalogo-items.md#3-data-model)). Detail-specific notes:

```ts
const selectedItem =
  items.find((item) => item.id === itemParam) ||
  items.flatMap((item) => item.variants || []).find((variant) => variant.id === itemParam)
```

Fields surfaced/edited by the panel (grouped by where they render):

- **Left flip card (standalone/variante)** — `name`, `sku` / composed child SKU, `media[]`,
  `descripcion`, `precio.precioFinal`, `stock.disponible` (or `enStock − reservado`).
- **Right / info card** — `categoria`, `marca`, `modelo`, `formatoVenta`, `unidadesPorPack`
  (+`unidadesPorPackActive`), `volumenActive`/`volumenCantidad`/`volumenUnidad`,
  `vencimientoActive`/`fechaVencimiento`, `proveedor`, `codigoProveedor`,
  `atributosInformativos[]`.
- **Agrupador only** — `skuPrefix`, `containerAtributosPrincipales[]` (variant axes),
  `variants[]` (the matrix rows: each has `skuSuffix`, `codigoUniversal`, `descripcion`,
  `precio`, `stock`, `atributosPrincipales`).

**Invariants** (unchanged from the grid): stock is **stringly-typed**
(`stock.{enStock,reservado}` strings; `disponible = enStock − reservado`), **agrupadores have no
`sku` — only `skuPrefix`**, and children store `skuSuffix` with the full SKU composed at render
time.

---

## 5. Layout maps

### 5.1 Page shell (all types)

```
CatalogoItemDetailPage (min-h-screen)
└── flex row (h-screen), click closes sidebar dropdowns
    ├── Sidebar (sticky, full height)
    └── content card (bg-white rounded)
        ├── Header bar (h-44px, dark #1B1C20)
        │   ├── Breadcrumb ("Catálogo / Items / {name}") → guardedNavigate
        │   ├── UserPanel (center)
        │   └── "Cambios Guardados" pill (right, conditional)
        └── main (overflow-auto)
            └── CatalogoItemDetailPanel
    ├── Floating toast (top-center, 3s auto-dismiss, via onShowToast)
    └── UnsavedChangesModal (conditional)
```

### 5.2 Panel section header (rendered by the panel, not the page)

```
[ Detalle del Item / de la Variante / del Agrupador ]   ...   [ Editar ] [ ⋮ ]
   (child only: "Ver Agrupador" link)                         └ when editing: [ Cancelar ] [ Guardar ]
```
- **Editar** → `enterRightEditMode()` (snapshots current values, sets `isRightEditing = true`).
- **Cancelar** → `cancelRightEditMode()` (restores the snapshot).
- **Guardar** → `saveRightEditMode()` (diffs snapshot → `onFieldChange` per changed field → `onSaveNow()`).
- **⋮ kebab → Eliminar** → calls `onDelete(selectedItem)` **only when `!isChildItem`** (see §8.3).

### 5.3 Standalone / Variante body (`!isViewingContainer`)

```
grid-cols-10 gap-16
├── Left  (col-span-4, order-1): BLACK FLIP CARD  (sticky)
│   ├── FRONT: image · name(+child tags) · SKU · Precio Venta · Stock (divider lines)
│   └── BACK  (flip via top-right "Detalles"): media photos + Descripción
└── Right (col-span-6, order-2): WHITE CARD
    ├── Información General (categoría, marca, modelo, formato, unidades/pack, volumen,
    │                       vencimiento, proveedor, código proveedor)
    └── Atributos Informativos
```

### 5.4 Agrupador body (`isViewingContainer`)

```
grid-cols-10 gap-6   (grid-cols-1 when isExpandedMatrixOpen)
├── Info/Atributos column (col-span-5, order-1): agrupador general info + containerAtributosPrincipales
└── Variantes card (col-span-5, order-2, hidden when matrix expanded)
    ├── in-card toggle: [ Info ] [ Atributos ]   (rightCardMode)
    ├── info      → variant matrix (rows: SKU · Código Universal · Precio venta · Stock)
    └── atributos → agrupador Atributos Informativos
   (when isExpandedMatrixOpen: full-width matrix takes over, side card hidden)
```

---

## 6. State & data flow

### 6.1 Persistence: immediate, not staged

The current panel **persists on every save action**. Each editor commits with the pair:

```ts
onFieldChange(id, field, value)   // = editField(...)  (writes into the items model)
onSaveNow?.()                     // = forceSaveItems() (flushes to localStorage now)
```

Precio/Stock modals additionally call `onShowToast("Precio actualizado" | "Stock actualizado")`.
There is **no page-level "Guardar" button** in the current header — the panel's own
Editar → Guardar flow (and the modals) are the save surface.

### 6.2 View mode vs. edit mode (`isRightEditing`)

- **View mode (default):** clicking a metric/field **copies its value to the clipboard** (name,
  SKU, precio, stock, código proveedor each have their own "copied ✓" state).
- **Edit mode (`isRightEditing`, entered via "Editar"):** the same fields become **editable** or
  open a **modal** (name, SKU, código universal, código proveedor, descripción, precio, stock).
  `enterRightEditMode` snapshots values; `Cancelar` restores them; `Guardar` diffs & persists.

### 6.3 Precio & Stock editing

- Standalone/variante: the left card's **Precio Venta** / **Stock** metrics open
  `PrecioEditModal` / `StockEditModal` (in edit mode). Saving persists immediately + toasts.
- Agrupador: each matrix row's precio/stock cell opens the **matrix** variant modals
  (`isMatrixPrecioModalOpen` / `isMatrixStockModalOpen`, tracked by `matrixVariantItem`), writing
  back into the parent's `variants[]`.
- Stock math keeps `disponible = enStock − reservado` and preserves string typing.

### 6.4 Child inheritance rules (variante only)

When `isChildItem`, the panel seeds child fields from `fatherItem` using two predicates:

```ts
shouldStrictlyInherit(v) = isChildItem && fatherItem && v !== undefined && v !== null
shouldInheritField(v)    = isChildItem && fatherItem && v !== undefined && v !== null && v !== ""
```

| Field | Behavior for a child |
| --- | --- |
| `name` (título) | **Locked** to parent (`isTitleLocked`). |
| `unidadesPorPack` (+active) | **Locked** to parent (`isUnidadesPorPackLocked`). |
| `categoria`, `marca`, `formatoVenta`, `volumenActive/Cantidad/Unidad` | **Strictly inherited** — taken from parent when the parent value is defined (`shouldStrictlyInherit`). |
| `proveedor` | Inherited **only if the parent value is non-empty** (`shouldInheritField`). |
| `modelo`, `fechaVencimiento`/`vencimientoActive`, `codigoProveedor`, `descripcion` | **Own** — editable per child. |
| `skuSuffix` | Own; full SKU composed as `{parent prefix}-{suffix}`. |

**Atributos Informativos merge** (`getMergedAtributosInformativos`) combines parent + child:
1. **Case 1 (locked pair):** parent has key **and** value → inherited read-only.
2. **Case 2 (key-only / `inheritValue`):** parent supplies the key, the **child fills the value**.
3. **Case 3 (exclusive):** child-only attributes the parent doesn't have.

### 6.5 Delete → redirect

`handleDeleteWithTracking(item)` (page) → `deleteItem(item)` then redirects to the grid with
`?deleted={name}&tipo={item|agrupador}` (label is `agrupador` when `hasVariants || isAgrupador`).
The grid shows a toast and scrubs the params.

### 6.6 Navigation guard (present but mostly dormant)

The page still wires `useNavigationGuard({ hasUnsavedChanges, onSave, onDiscard })` and
`UnsavedChangesModal`, with breadcrumb/back/forward routed through `guardedNavigate`. Because the
panel now **persists immediately** (§6.1), `hasUnsavedEdits`/`hasUnsavedDeletes` are rarely true,
so the guard modal seldom appears in normal use. Treat the guard as legacy safety scaffolding —
keep it working, but do not assume there is a staged batch waiting to be saved.

### 6.7 Redirect-on-missing

An effect redirects to `/catalogo/items` if `selectedItem` cannot be resolved once `items` has
loaded (bad/stale id). While unresolved, the page renders a blank `bg-[rgb(243,242,238)]` screen.

---

## 7. Public API surfaces

### `useItems()` — exports used here
`items`, `updateStock`, `updateItem`, `deleteItem`, `undoDelete`, `saveDelete`, `hasUnsavedDeletes`,
`editField`, `undoEdit`, `redoEdit`, `saveEdit`, `cancelEdit`, `hasUnsavedEdits`, `canUndoEdit`,
`canRedoEdit`, `forceSaveItems`.

### `useSettings()`
`{ catalogo, stock, precios }` — preference groups the panel reads to toggle fields/behaviors
(e.g. price composition, stock display).

### `CatalogoItemDetailPanel` props (page → panel)
`selectedItem`, `selectedDetailTab` + `setSelectedDetailTab` *(legacy — see §8.1)*, `expandedItems`
+ `toggleVariantExpansion`, `updateStock`, `updateItem`, `allItems`, `item`, `onClose`,
`onFieldChange` (= stage/write), `isSaving`, `onDuplicate`, `onDelete`, `variantChangeHandlers`,
`isExpanded`, `onSaveNow` (= persist now), `onShowToast`.

> Prop types are loose in places (`item: any`, `variantChangeHandlers: any`, and the interface
> declares `expandedItems: Set<string>` while the page passes a `Record<number, boolean>`). Trust
> the runtime shapes documented here; tighten types carefully.

---

## 8. Edge cases & gotchas

1. **No tabs, no Canales.** The layout is driven by item type (`isViewingContainer` /
   `isChildItem`) and by `rightCardMode` (agrupador) / the flip card (standalone/child) — **not**
   by a global tab bar. Do not reintroduce Info/Stock/Precios/Canales tabs.
2. **`selectedDetailTab` is vestigial.** The page still holds
   `selectedDetailTab` state (typed `"info" | "stock" | "precios" | "canales"`) and passes it to
   the panel, but it no longer controls the layout. Leave it or remove it deliberately; don't
   build new behavior on it.
3. **Delete via kebab is a no-op for children.** The menu label reads "Eliminar variante" for a
   child, but the handler only fires `onDelete` when `!isChildItem`. Deleting a variant is done
   from the agrupador's matrix, not the child's own page. Keep this in mind before wiring child
   delete.
4. **`id` resolves against variants too.** Resolve top-level `items` first, then flatten
   `variants`. A child id opens the page focused on that variant with parent inheritance active.
5. **Persistence is immediate.** Editors call `onFieldChange` **and** `onSaveNow()`; there is no
   batch to Guardar at the page level. Don't assume a staged model.
6. **Agrupador SKU lives in `skuPrefix`.** Never read `sku` on a parent — the panel uses
   `skuPrefix` (falling back to `sku` only for legacy safety). Child full SKUs are composed from
   the parent prefix + child suffix.
7. **Inheritance predicates differ.** Strict inheritance keeps a value that is merely defined;
   `shouldInheritField` (proveedor) additionally requires a non-empty string. Match the right
   predicate when adding inherited fields.
8. **Missing/stale id redirects.** If the id doesn't resolve once `items` is loaded, the page
   redirects to the grid — never assume `selectedItem` is defined in new code paths.
9. **Delete payload contract.** The grid depends on `?deleted=&tipo=` to show its toast; keep the
   `agrupador` vs `item` label in sync with the grid reader.
10. **`onDuplicate` is a stub.** It currently only logs `"Duplicate"`.

---

## 9. Change-safety checklist

Before editing:
- [ ] Identify which of the **three item types** your change targets (standalone / variante /
      agrupador) — the layout and available fields differ per type.
- [ ] For child fields, confirm whether the field is **locked**, **strictly inherited**,
      **inherited-if-non-empty**, or **own** (§6.4).
- [ ] Decide the save path: view-mode click = copy; edit-mode = `onFieldChange` + `onSaveNow`.

After editing:
- [ ] Standalone shows the flip card + info card; variante shows inheritance + composed SKU +
      "Ver Agrupador"; agrupador shows the matrix + Info/Atributos toggle + expandable matrix.
- [ ] Precio/Stock edits persist immediately, fire the toast, and keep
      `disponible = enStock − reservado` with string typing.
- [ ] Edit mode: Editar → Guardar diffs & persists; Cancelar fully restores the snapshot.
- [ ] Delete redirects with the correct `?deleted=&tipo=` payload; remember child delete is a
      no-op from the kebab.
- [ ] No Info/Stock/Precios/Canales tab bar was reintroduced.
