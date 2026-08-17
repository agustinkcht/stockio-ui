# Compras · Órdenes de Compra

> Module: **Compras — Órdenes de Compra** (purchase orders, pre-purchase)
> Routes: `/compras/ordenes-de-compra` (list), `.../nueva` (wizard), `.../[id]` (detail)
> Last verified against source: see git blame of the files listed below.

---

## 1. Quick facts (at a glance)

| Aspect | Value |
| --- | --- |
| Primary purpose | Draft/plan supplier orders **before** they become received purchases; convert an accepted orden into a `Compra`. |
| Route files | `app/compras/ordenes-de-compra/page.tsx`, `.../nueva/page.tsx`, `.../[id]/page.tsx` |
| Data hook | `hooks/use-ordenes-de-compra.ts` → `useOrdenesDeCompra()` |
| Stock sync | **None.** Órdenes never touch catalog stock — stock only moves when the resulting `Compra` receives units. |
| Persistence | `localStorage`, key `stockio_ordenes_de_compra_<account>_<version>` (version **`v5`** baked into the key → bumping reseeds) |
| Seed data | `lib/data/initial-ordenes-de-compra.ts` (`ORDENES_DE_COMPRA`) |
| Types | `OrdenDeCompra`, `OrdenDeCompraItem`, `EstadoOrdenDeCompra` in `lib/types.ts` |
| Estados | `borrador` \| `aceptada` (only two) |
| ID format | `ODC-<numero>`; `numero` = max existing + 1 |

---

## 2. Data model

### `OrdenDeCompra` (see `lib/types.ts`)

```
id             "ODC-3"
numero         3                       // monotonic, drives id
fechaCreacion, fechaModificacion?
proveedorId, proveedorNombre
estado         "borrador" | "aceptada"
items          OrdenDeCompraItem[]
subtotal?      sum of line totals before global adjustments
descuento?, descuentoTipo? ("percent" | "fixed")
envio?         shipping
customCharges? VentaCustomCharge[]
importeEstimado  grand total after all adjustments
compraId?      set when accepted → the Compra it produced
```

### `OrdenDeCompraItem`

```
sku, name, quantity, unitPrice
discount?, discountType? ("percent" | "fixed" | "unit")
total
categoria?, marca?, thumbnail?, tags?
isDescripcionLibre?   // free-text line not tied to inventory
```

### Invariants / notes

- **No `recompute`-style derivation hook** here (unlike compras/ventas). Totals (`subtotal`, `importeEstimado`) are computed **in the pages** on edit and written via `updateOrden`. Keep both in sync when editing items.
- `importeEstimado` is the authoritative grand total; `subtotal` is pre-adjustment.
- Órdenes are **estimates** — `unitPrice` is sourced from catalog `precio.costo` at add-time and is not kept live.

---

## 3. `useOrdenesDeCompra()` API surface

| Function | Effect |
| --- | --- |
| `addOrden(Omit<OrdenDeCompra,"id"\|"numero">)` | Assigns next `numero`/`ODC-` id, prepends, returns it. |
| `updateOrden(id, updates)` | Shallow merge — **no derivation**, caller supplies recomputed totals. |
| `updateEstado(id, estado)` | Thin wrapper over `updateOrden({estado})`. |
| `deleteOrden(id)` | Removes the orden. |
| `getOrdenById(id)` | Lookup or `null`. |
| `getNextOrderNumber()` | `max(numero) + 1`. |

---

## 4. The Orden → Compra bridge (most important flow)

On the detail page (`[id]/page.tsx`), **"Aceptar y llevar a compras"**:

1. `computeCostoDiffs()` runs first (compares orden `unitPrice` vs current catalog costo) and opens `showAceptarModal`.
2. `handleAceptarYLlevarACompras()`:
   - `addCompra(buildCompraFromOrden(orden, fecha, hora))` → creates a `Compra` (with `origen: "orden"`, `ordenId`).
   - `updateOrden(orden.id, { estado: "aceptada", compraId: newCompra.id })` → links both directions.
   - `router.push('/compras/compras/<newCompra.id>')`.
3. After acceptance the detail page shows a link to the linked compra (`estado === "aceptada" && orden.compraId`).

> **Gotcha:** acceptance is a **one-way, non-idempotent** action guarded only by the modal + edit-mode check (`if (!isEditMode)`). There is no built-in guard against re-accepting if state is manipulated; rely on the `estado`/`compraId` transition to gate the UI. Accepting does **not** move stock — that happens later when the compra receives units.

---

## 5. Route flows

### List — `/compras/ordenes-de-compra/page.tsx`
- Table over `useOrdenesDeCompra().ordenes` with search / filter / sort.
- Row click → detail; "Nueva orden" → `/compras/ordenes-de-compra/nueva`.

### Wizard — `/compras/ordenes-de-compra/nueva/page.tsx`
3 steps: **Proveedor → Productos → Confirmación** (one fewer than compras — no reception/payment; órdenes are pre-purchase).
- Item picker adds lines from catalog items/variants at `precio.costo`; supports free-description lines (`isDescripcionLibre`).
- Supports `?duplicar=<ordenId>` to pre-fill from an existing orden.

### Detail — `/compras/ordenes-de-compra/[id]/page.tsx`
- Edit mode recomputes `subtotal`/`importeEstimado` and persists via `updateOrden`.
- Kebab menu: duplicate (`?duplicar=`), delete (with confirm → back to list).
- Primary CTA is the Aceptar bridge (§4); hidden once accepted.

---

## 6. Edge cases & change-safety checklist

1. **No derivation hook** — when you mutate `items`, recompute `subtotal` + `importeEstimado` in the page before `updateOrden`, or totals go stale.
2. **Version is in the storage KEY** (`…_v5`), not a sibling `_version` entry (unlike compras). Bumping `DATA_VERSION` switches to a fresh key → old data is orphaned, not migrated.
3. **Only two estados.** Don't introduce received/paid concepts here — those belong to the resulting `Compra`.
4. **Acceptance links both records** (`orden.compraId` ↔ `compra.ordenId`, `compra.origen:"orden"`). Preserve both sides if you touch the bridge.
5. **Órdenes never move stock.** Keep it that way; stock is the compra's responsibility.
6. **`?duplicar=` reuse** on the wizard clones items but creates a new `borrador` — never copies `estado`/`compraId`.
