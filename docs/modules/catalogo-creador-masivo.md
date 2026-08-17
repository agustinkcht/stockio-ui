# Module: Catálogo · Creador Masivo (Bulk Creator)

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/catalogo/creador-masivo` bulk-creation flow. Where it
> disagrees with the code, the code wins — treat the doc as stale and fix it.
>
> **UI status:** ⚠ **incomplete surface** on the current design (`UI_LAYOUT_ACTUAL.md`) — not
> yet migrated to [`UI_DESIGN_SYSTEM_TARGET.md`](../UI_DESIGN_SYSTEM_TARGET.md) (only
> `catalogo/items` is).
> **SKU generation:** see [`SKU_GENERATION_RULES.md`](../SKU_GENERATION_RULES.md).
> **Terms:** see [`GLOSSARY.md`](../GLOSSARY.md).

---

## 1. At a glance

The **Creador Masivo** is a spreadsheet-style bulk item creator. It has two modes —
**Standalone** (a flat grid of independent items) and **Con Variantes** (parent rows that each own
generated variant rows) — organized into collapsible/hideable column **sections**. On confirm it
maps every non-empty row to the shape expected by `useItems` and calls `bulkCreateItems` and/or
`bulkCreateItemsConVariantes`. For creating a single item with a guided wizard, use
[Nuevo Item](./catalogo-nuevo-item.md) instead.

| Quick fact | Value |
| --- | --- |
| Route | `/catalogo/creador-masivo` |
| Page component | `app/catalogo/creador-masivo/page.tsx` (`CreadorMasivoPage`) — `"use client"` |
| Con-variantes grid | `components/creador-masivo/creador-masivo-con-variantes.tsx` (`CreadorMasivoConVariantes`) |
| Data hook | `hooks/use-items.ts` (`bulkCreateItems`, `bulkCreateItemsConVariantes`) |
| Proveedores hook | `hooks/use-proveedores.ts` (`useProveedores`) |
| Proveedor modal | `components/modals/nuevo-proveedor-modal.tsx` |
| Row types | `WorkableRow` (standalone, in page) · `ParentRow`/`VariantRow` (con variantes, in component) |
| Persistence | Via `useItems` bulk helpers → `localStorage["stockio-items-{account}"]` |
| Section defs | `SECTIONS` (standalone, in page) · `SECTIONS_CON_VARIANTES` (in component) |

> **Two modes, one confirm.** `handleConfirmCreate` builds **both** standalone and con-variantes
> payloads and can create both in one action — it calls `bulkCreateItems(...)` and
> `bulkCreateItemsConVariantes(...)` independently when each has rows. The visible `creatorMode`
> only toggles which grid is on screen; it does not restrict what gets created.

---

## 2. File & component map

| File | Role in this module |
| --- | --- |
| `app/catalogo/creador-masivo/page.tsx` | The page. Owns standalone `rows` (`WorkableRow[]`) and lifted con-variantes `parentRows` (`ParentRow[]`), section expand/visibility state, column-width map, validation, the confirm/error/success modals, proveedor-modal wiring, and the submit→map→persist logic for both modes. |
| `components/creador-masivo/creador-masivo-con-variantes.tsx` | The Con Variantes grid: renders parent rows with nested variant rows, defines `SECTIONS_CON_VARIANTES`, `ParentRow`/`VariantRow` types, `createEmptyParentRow`, and manages variant generation within a parent. State (`parentRows`) is **lifted** to the page for persistence across mode switches. |
| `hooks/use-proveedores.ts` | Supplies `proveedores` + `addProveedor` for the proveedor cells/modal. |
| `components/modals/nuevo-proveedor-modal.tsx` | Create a proveedor inline; on save it's added and assigned back to the pending row. |
| `hooks/use-items.ts` | `bulkCreateItems` / `bulkCreateItemsConVariantes` do the actual creation + persistence. |
| `components/layout/sidebar.tsx`, `breadcrumb.tsx`, `user-panel.tsx` | Chrome. |

---

## 3. Data model

### Standalone row (`WorkableRow`, defined in the page)

```ts
interface WorkableRow {
  id: string                 // crypto.randomUUID()
  titulo: string             // REQUIRED for the row to be created
  sku: string; codigoUniversal: string
  categoria: string; marca: string
  formatoVenta: string       // default "unidad"
  unidadesPorPack: string    // default "1" (used only when formatoVenta === "pack")
  volumenCantidad: string; volumenUnidad: string
  proveedor: string; codigoProveedor: string
  costo: string; margen: string; iva: string  // default iva "21"
  precioVenta: string
  enStock: string            // default "0"
  descripcion: string; fotoUrl: string
  atributosInformativos: Array<{ key: string; value: string }>
}
```

### Con-variantes rows (`ParentRow` / `VariantRow`, defined in the component)

```ts
interface VariantRow {
  id: string; parentId: string
  atributosPrincipales: Array<{ key: string; value: string }>  // filled from parent dims
  skuSufijo: string; codigoUniversal: string; codigoProveedor: string
  costo: string; margen: string; iva: string; precioVenta: string
  enStock: string; descripcion: string; fotoUrl: string
  atributosInformativos: Array<{ key: string; value: string }>
}
interface ParentRow {
  id: string; titulo: string; skuPadre: string; codigoUniversal: string
  atributosPrincipales: Array<{ key: string; tags: string[] }>  // dimensions → variant values
  categoria: string; marca: string; formatoVenta: string; unidadesPorPack: string
  volumenCantidad: string; volumenUnidad: string; vencimiento: string
  proveedor: string; descripcion: string; fotoUrl: string   // NOTE: no codigoProveedor on parent
  atributosInformativos: AtributoInformativo[]              // supports `inherit` flag
  variants: VariantRow[]
}
```

### Column sections

```ts
// Standalone (page): SECTIONS
obligatorio (título, caracteres) — cannot be hidden
datos-principales (sku, codigoUniversal)
info-comercial (categoria, marca, formatoVenta, unidadesPorPack, volumen*, proveedor, codigoProveedor)
precio (costo, margen, iva, precioVenta)
stock (enStock)
media (descripcion, fotoUrl)
atributos-informativos (dynamic)
```

`COL_WIDTHS` maps each column id → pixel width; `getColWidth` adds widths for dynamic
`atributoInfo*` columns. Con-variantes has its own `SECTIONS_CON_VARIANTES`.

### Output → `useItems` bulk-create input

Standalone rows map to `bulkCreateItems` input objects: `{ name, sku?, codigoUniversal?,
categoria?, marca?, formatoVenta, unidadesPorPack, volumenActive, volumen*, proveedor?,
codigoProveedor?, atributosInformativos?, descripcion?, enStock:number, costo?, margen?, iva?,
precioVenta?, imagenUrl? }` (empty strings → `undefined`, numbers parsed).

Con-variantes parent rows map to `bulkCreateItemsConVariantes` input: `{ name, sku: skuPadre,
codigoUniversal?, categoria?, marca?, formatoVenta, unidadesPorPack, volumen*, vencimiento*,
proveedor?, descripcion?, imagenUrl?, containerAtributosPrincipales?, atributosInformativos?,
variants: [...] }` where each variant is `{ sku: "{skuPadre}-{skuSuffix}", codigoUniversal,
descripcion, foto, atributosPrincipales, stock{enStock,reservado:"0",disponible},
precio?, codigoProveedor?, atributosInformativos }`.

- Standard invariants apply: **stock strings, precio numbers, parents use `skuPadre`/`skuPrefix`,
  variants compose `{skuPadre}-{skuSuffix}`**.

---

## 4. State & data flow

### 4.1 Page state
- `creatorMode: "standalone" | "conVariantes"` — which grid is visible.
- `rows: WorkableRow[]` (standalone) and `parentRows: ParentRow[]` (lifted from the con-variantes
  component) — both seeded with one empty row and **persisted across mode switches**.
- `expandedSections` / `visibleSections` / `visibleSectionsConVariantes` — per-section UI toggles;
  the `obligatorio` section can never be hidden.
- Modal flags: `showErrorModal`, `showConfirmModal`, `showSuccessMessage`, `isCreating`.
- Proveedor wiring: `showNuevoProveedorModal`, `pendingProveedorRowIndex`.

### 4.2 Empty-row filtering & validation
- `isStandaloneRowEmpty` / `isConVariantesRowEmpty` decide whether a row has any meaningful data
  (defaults like `formatoVenta:"unidad"`, `unidadesPorPack:"1"`, `enStock:"0"/""` count as empty).
- `nonEmpty*Rows` drop fully-empty rows so trailing scratch rows don't get created.
- **Validation rule:** every *non-empty* row MUST have a `titulo`. `allRowsValid =
  allStandaloneRowsValid && allConVariantesRowsValid`.
- `hasValidRows` = at least one non-empty row with a title (across either mode).

### 4.3 Submit flow
1. **Crear** (`handleCrearClick`) → if `!allRowsValid`, open `showErrorModal`; else open
   `showConfirmModal`.
2. **Confirm** (`handleConfirmCreate`):
   - Map non-empty standalone rows → `standaloneItemsToCreate`.
   - Map non-empty con-variantes rows → `conVariantesItemsToCreate` (generate `skuPadre` from the
     title if blank; build `variants[]` with composed SKUs and stock/precio).
   - `await` a ~300ms UX delay.
   - Call `bulkCreateItems(...)` and/or `bulkCreateItemsConVariantes(...)` when each list is non-empty.
   - Reset both grids to a single empty row, flash `showSuccessMessage` for 3s.

### 4.4 Row operations (standalone)
`addRow(afterIndex)`, `removeRow(index)` (min 1 row), `updateRow(rowIndex, field, value)`, and
atributos-informativos helpers (`add/remove/updateAtributoInformativo`). Dynamic columns expand to
the max attribute count across rows (`getMaxAtributos`, `getDynamicColumns`).

### 4.5 Proveedor inline-create
A proveedor cell can open `NuevoProveedorModal`; on save `addProveedor` persists it and it's
assigned back to the row tracked by `pendingProveedorRowIndex`.

### 4.6 Persistence
Unlike [Nuevo Item](./catalogo-nuevo-item.md), this page persists **through** `useItems` bulk
helpers, which handle id assignment, storage write to `stockio-items-{account}`, and the
`stockio:items-updated` sync event.

---

## 5. Component tree & layout

```
CreadorMasivoPage (min-h-screen, bg panel)
└── flex row: Sidebar + white content card
    ├── Header (dark bar): Breadcrumb ("Catálogo / Creador Masivo") · UserPanel
    └── main
        ├── Mode toggle: Standalone | Con Variantes
        ├── Section controls (expand/collapse + show/hide columns; "obligatorio" locked)
        ├── Grid (horizontal scroll, fixed column widths from COL_WIDTHS/getColWidth)
        │   ├── (standalone) 3-row header: section → subHeader → column label,
        │   │                 then WorkableRow inputs; per-row add/remove controls
        │   └── (con variantes) CreadorMasivoConVariantes: ParentRow + nested VariantRow grid
        ��── Footer/action: "Crear" (count badge) → confirm modal
    ├── Error modal (rows missing título)
    ├── Confirm modal (N items to create)
    ├── Success message (auto-hide 3s)
    └── NuevoProveedorModal (conditional)
```

Column alignment is driven by the shared `COL_WIDTHS` map + `getColWidth`; header rows and body
cells must use the same widths to stay aligned.

---

## 6. Behaviors (itemized)

### Modes
- Toggle between **Standalone** and **Con Variantes**; both grids' rows persist while switching
  (state is lifted to the page).

### Sections / columns
- Each section can be expanded/collapsed and shown/hidden, except **obligatorio** (always visible).
- `atributos-informativos` (and con-variantes attribute columns) are **dynamic** — column count
  grows to the max attributes present across rows.

### Rows
- Add a row after any index, remove a row (minimum one remains), edit any cell.
- Add/remove/update informational attributes per row.

### Validation & confirm
- Fully-empty rows are ignored. Any non-empty row **must** have a título or **Crear** opens the
  error modal. Otherwise a confirm modal shows the count to be created.

### Creation
- On confirm, both payloads are built and created via the respective bulk helpers, with a short
  UX delay; grids reset and a success message flashes.

### Proveedor
- New proveedores can be created inline and assigned back to the originating row.

---

## 7. Public API surfaces

### `useItems()`
| Export | Purpose |
| --- | --- |
| `bulkCreateItems(rows[])` | Create many standalone items (see §3 for input shape). |
| `bulkCreateItemsConVariantes(rows[])` | Create many parents with `variants[]`. |

### `useProveedores()`
`proveedores` (list) and `addProveedor(...)` (create + persist).

### Exports from `creador-masivo-con-variantes.tsx`
`CreadorMasivoConVariantes` (component), `SECTIONS_CON_VARIANTES`, `createEmptyParentRow`, and the
`ParentRow` type. `CreadorMasivoConVariantesProps`: `{ gridSize, setGridSize, parentRows,
setParentRows, visibleSections }`.

### Page-local exports/helpers (not exported, documented for agents)
`WorkableRow`, `SECTIONS`, `COL_WIDTHS`, `getColWidth`, `createEmptyRow`,
`isStandaloneRowEmpty`, `isConVariantesRowEmpty`, `handleConfirmCreate`.

---

## 8. Edge cases & gotchas

1. **Confirm creates both modes.** `handleConfirmCreate` builds and creates standalone **and**
   con-variantes rows regardless of the visible `creatorMode`. Don't assume only the on-screen
   grid is submitted.
2. **Empty-row heuristics include defaults.** `formatoVenta:"unidad"`, `unidadesPorPack:"1"`,
   `enStock:"0"/""`, `iva:"21"` are treated as "empty". If you add a field with a non-empty
   default, update `isStandaloneRowEmpty`/`isConVariantesRowEmpty` or empty rows will be created.
3. **Título is the only hard requirement.** Everything else is optional; missing título on a
   non-empty row blocks the whole submit (error modal).
3. **Parent `skuPadre` auto-generated when blank** (uppercased title fragments, capped at 15
   chars); variant SKUs compose `{skuPadre}-{skuSuffix}`.
4. **`codigoProveedor` lives on variants, not the parent** in con-variantes mode.
5. **`ParentRow` state is lifted** to the page so it survives mode switches — keep it lifted; the
   component expects `parentRows`/`setParentRows` as props.
6. **Column widths are shared.** Header and body both read `COL_WIDTHS`/`getColWidth`; changing a
   width in one place only will misalign the grid.
7. **`atributosInformativos.inherit`** (con variantes) means "inherit parent value" — mapped to an
   empty value + `inherit:true`; preserve this when transforming rows.
8. **Persists via `useItems`.** Unlike Nuevo Item, id assignment and storage are delegated to the
   bulk helpers — don't write localStorage directly here.
9. **Con-variantes variant price compounds IVA.** When a variant has no manual `precioVenta`, its
   `precioFinal` fallback is `costo * (1 + margen/100) * (1 + iva/100)` — i.e. **IVA is folded into
   the stored final price**. This differs from the standalone/Nuevo-Item formula
   (`round(costo * (1 + margen/100))`, IVA kept separate). Don't assume the two creators compute
   `precioFinal` the same way.
10. **Variant SKU is always composed, even when blank.** `sku` is `` `${skuPadre}-${skuSuffix}` ``;
    if `skuSufijo` is empty it falls back to the attribute values joined by `-`. An attribute-less
    variant can therefore produce a trailing-dash SKU (`SKUPADRE-`).

---

## 9. Change-safety checklist

Before editing:
- [ ] Decide whether a new column belongs to standalone `WorkableRow`, `ParentRow`, `VariantRow`,
      or all — and add it to the matching section + `COL_WIDTHS`.
- [ ] Update the empty-row detector if your field has a non-empty default.

After editing:
- [ ] Standalone and con-variantes grids both render, scroll, and stay column-aligned.
- [ ] Add/remove row, dynamic attribute columns, and section show/hide still work.
- [ ] Validation blocks título-less non-empty rows; confirm modal count is correct.
- [ ] Confirm creates via `bulkCreateItems` / `bulkCreateItemsConVariantes` with correct SKUs,
      stock strings, and precio numbers.
- [ ] Grids reset to one empty row and the success message shows after creation.
