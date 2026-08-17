# Compras — Órdenes de Compra / Purchase Orders (`/compras/ordenes-de-compra`)

> Module doc. Part of [`APP_DOCUMENTATION.md`](../APP_DOCUMENTATION.md). Documents the **current**
> implementation only. Reflects the purchase-orders area reachable from the sidebar
> (`Compras › Órdenes de Compra`).
>
> **Sibling doc:** [`compras-compras.md`](./compras-compras.md). An orden is a **pre-purchase plan**
> that mirrors part of the `Compra` shape (minus recepciones/pagos) so a similar list/wizard/detail UI
> can be reused. Accepting an orden **creates a Compra** (which is what later receives stock).

---

## 1. At a glance

An **Orden de Compra** (purchase order) is a draft supplier order: proveedor + items + estimated
totals, with a minimal lifecycle of just `borrador → aceptada`. It intentionally carries **no stock,
recepción, or pago** — nothing physical happens until it is **aceptada**, at which point a `Compra` is
created (with `origen: "orden"`) and the two records are cross-linked (`orden.compraId` ↔
`compra.ordenId`). Stock only moves later, when that compra receives units.

Three routes: a **list** (search/filter/sort), a **3-step wizard** (`Proveedor → Productos →
Confirmación`, one step shorter than compras because there is no reception/payment), and a **detail**
page (edit items, accept, duplicate, delete). Unlike ventas/compras, órdenes have **no
`recompute`-style derivation hook** — the pages compute `subtotal`/`importeEstimado` themselves and
persist them via `updateOrden`.

| Fact | Value |
| --- | --- |
| Routes | `/compras/ordenes-de-compra` (list), `.../nueva` (wizard), `.../[id]` (detail) |
| Primary files | `app/compras/ordenes-de-compra/page.tsx`, `.../nueva/page.tsx`, `.../[id]/page.tsx` |
| Data hook | `hooks/use-ordenes-de-compra.ts` (`useOrdenesDeCompra`) |
| Stock sync | **None** — órdenes never touch catálogo stock |
| Persistence | `localStorage` key `stockio_ordenes_de_compra_{account}_{version}` (version **`v5`** baked into the key) |
| Seed data | `lib/data/initial-ordenes-de-compra.ts` (`ORDENES_DE_COMPRA`) |
| Core type | `OrdenDeCompra` (`lib/types.ts`) |
| Estados | `borrador` \| `aceptada` (only two) |
| Accept → Compra | `buildCompraFromOrden` (detail page) → `useCompras().addCompra` |
| ID format | `ODC-{numero}`; `numero` = `max existing + 1` |

---

## 2. File & component map

| File | Role |
| --- | --- |
| `app/compras/ordenes-de-compra/page.tsx` | List: search/filter/sort over `useOrdenesDeCompra().ordenes`; row → detail, "Nueva orden" → wizard. |
| `app/compras/ordenes-de-compra/nueva/page.tsx` | 3-step wizard (`Proveedor → Productos → Confirmación`) building an `OrdenDeCompra` via `addOrden`. Supports `?duplicar={id}`. |
| `app/compras/ordenes-de-compra/[id]/page.tsx` | Detail: edit items/adjustments, accept ("Aceptar y llevar a compras"), duplicate, delete. Hosts the orden → compra bridge. |
| `hooks/use-ordenes-de-compra.ts` | CRUD over `localStorage` + auto-numbering. **No derivation** — callers supply recomputed totals. |

---

## 3. Data model

### `OrdenDeCompra` (`lib/types.ts`)

```ts
interface OrdenDeCompra {
  id: string                 // "ODC-3"
  numero: number             // monotonic; drives id; getNextOrderNumber = max+1
  fechaCreacion: string
  fechaModificacion?: string
  proveedorId: string
  proveedorNombre: string
  estado: EstadoOrdenDeCompra // "borrador" | "aceptada"
  items: OrdenDeCompraItem[]
  subtotal?: number          // sum of line totals BEFORE global adjustments
  descuento?: number
  descuentoTipo?: "percent" | "fixed"
  envio?: number
  customCharges?: VentaCustomCharge[]
  importeEstimado: number    // authoritative grand total AFTER all adjustments
  compraId?: string          // set when aceptada → the Compra it produced
}
```

Line item:

```ts
interface OrdenDeCompraItem {
  sku: string; name: string
  quantity: number; unitPrice: number
  discount?: number; discountType?: "percent" | "fixed" | "unit"
  total: number
  categoria?: string; marca?: string; thumbnail?: string; tags?: string[]
  isDescripcionLibre?: boolean   // free-text line not tied to inventory
}
```

### Invariants

- **`id` derives from `numero`**: `ODC-{numero}`. `numero` is `max(existing)+1`.
- **No derivation hook.** Totals (`subtotal`, `importeEstimado`) are computed **in the pages** on edit
  and written via `updateOrden`. Keep both in sync when editing items — nothing recomputes them for you.
- **`importeEstimado` is the authoritative grand total**; `subtotal` is the pre-adjustment sum.
- **Órdenes are estimates** — `unitPrice` is sourced from catálogo `precio.costo` at add-time and is
  not kept live afterward.
- **No physical side effects** while an orden exists. Stock is only touched when acceptance creates a
  Compra and that compra later receives units.

---

## 4. State & data flow

### Persistence
- Seeds from `ORDENES_DE_COMPRA` on first load. **The version (`v5`) is baked into the storage key**
  (`stockio_ordenes_de_compra_{account}_v5`), not stored as a sibling `_version` entry like compras.
  Bumping `DATA_VERSION` switches to a fresh key → old data is orphaned, not migrated.
- Writes go through the hook's save helper to `localStorage` under the versioned key.

### Acceptance flow (creates a Compra) — the most important flow

On the detail page, **"Aceptar y llevar a compras"**:

```
computeCostoDiffs()                                  // compare orden unitPrice vs current catálogo costo
  → showAceptarModal
  → handleAceptarYLlevarACompras():
      addCompra(buildCompraFromOrden(orden, fecha, hora))   // Compra with origen:"orden", ordenId
      updateOrden(orden.id, { estado:"aceptada", compraId: newCompra.id })   // link both directions
      router.push('/compras/compras/{newCompra.id}')
```

After acceptance the detail page shows a link to the linked compra
(`estado === "aceptada" && orden.compraId`).

Acceptance is a **one-way, non-idempotent** action guarded only by the modal + edit-mode check
(`if (!isEditMode)`). There is no built-in guard against re-accepting if state is manipulated; rely on
the `estado`/`compraId` transition to gate the UI. Accepting does **not** move stock — that happens
later, when the compra receives units.

---

## 5. Component tree & layout

Shared app shell (identical to compras): `Sidebar` + dark utility bar + white rounded panel.

- **List:** title + "Nueva Orden" → search/filter/sort bar → table of órdenes → row click to detail.
- **Wizard:** left stepper (`Proveedor → Productos → Confirmación`) + right step content.
- **Detail:** header (id/estado/proveedor + actions) → editable item table + Resumen → the Aceptar CTA
  (hidden once accepted; replaced by a link to the linked compra).

---

## 6. Behaviors

### List
- Search / filter / sort over `useOrdenesDeCompra().ordenes`; row → detail, "Nueva orden" → wizard.

### Wizard (`nueva`)
- **Step 1 Proveedor** (required), **Step 2 Productos** (≥1 item; picker adds catálogo items/variants
  at `precio.costo`, and supports free-description lines via `isDescripcionLibre`), **Step 3
  Confirmación** → `addOrden` (auto id/numero, page-computed totals).
- **`?duplicar={id}`** prefills items from an existing orden but creates a fresh `borrador` — it never
  copies `estado`/`compraId`.

### Detail
- **Edit mode:** recomputes `subtotal`/`importeEstimado` in the page and persists via `updateOrden`.
- **Aceptar y llevar a compras:** the bridge in §4 (create compra + link + navigate).
- **Duplicar** → `nueva?duplicar={id}`. **Eliminar** → `deleteOrden` + back to list (with confirm).

---

## 7. Public API surfaces

`useOrdenesDeCompra()` returns `ordenes`, `isLoading`, and:

| Function | Effect |
| --- | --- |
| `addOrden(Omit<OrdenDeCompra,"id"\|"numero">)` | Assigns next `numero`/`ODC-` id, prepends, returns it. |
| `updateOrden(id, updates)` | Shallow merge — **no derivation**; caller supplies recomputed totals. |
| `updateEstado(id, estado)` | Thin wrapper over `updateOrden({ estado })`. |
| `deleteOrden(id)` | Removes the orden. |
| `getOrdenById(id)` | Lookup or `null`. |
| `getNextOrderNumber()` | `max(numero) + 1`. |

`buildCompraFromOrden(orden, fecha, hora)` (detail page) — maps an accepted orden to a `Compra`
payload (`origen: "orden"`, `ordenId`).

---

## 8. Edge cases & gotchas

1. **No derivation hook** — when you mutate `items`, recompute `subtotal` + `importeEstimado` in the
   page before `updateOrden`, or totals go stale.
2. **Version is in the storage KEY** (`…_v5`), not a sibling `_version` entry (unlike compras). Bumping
   `DATA_VERSION` switches to a fresh key → old data is orphaned, not migrated.
3. **Only two estados.** Don't introduce received/paid concepts here — those belong to the resulting
   `Compra`.
4. **Acceptance is one-way and non-idempotent** — gated only by the modal + `!isEditMode`. Use the
   `estado`/`compraId` transition to keep the UI from re-accepting.
5. **Acceptance links both records** (`orden.compraId` ↔ `compra.ordenId`, `compra.origen:"orden"`).
   Preserve both sides if you touch the bridge.
6. **Órdenes never move stock.** Keep it that way; stock is the compra's responsibility.
7. **`unitPrice` is a snapshot** of catálogo `costo` at add-time; `computeCostoDiffs` surfaces drift at
   acceptance but the orden itself is not kept live.

---

## 9. Change-safety checklist

- [ ] Item edits recompute `subtotal` + `importeEstimado` in the page before calling `updateOrden`.
- [ ] Only `borrador`/`aceptada` estados are used; no reception/payment concepts leaked in.
- [ ] Acceptance still creates a `Compra` with `origen:"orden"` + `ordenId`, and links back via `compraId`.
- [ ] Acceptance stays gated so an already-`aceptada` orden can't be re-accepted from the UI.
- [ ] Storage key version bumped only when intentionally orphaning stored órdenes.
- [ ] `?duplicar=` still clones items into a fresh `borrador` without copying `estado`/`compraId`.
- [ ] Verified in-browser: create orden → accept → lands on a new compra linked both ways; duplicate and delete work.
