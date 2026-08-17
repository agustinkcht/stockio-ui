# Compras — Purchases (`/compras/compras`)

> Module doc. Part of [`APP_DOCUMENTATION.md`](../APP_DOCUMENTATION.md). Documents the **current**
> implementation only. Reflects the purchases area reachable from the sidebar (`Compras › Compras`).
>
> **Sibling doc:** [`compras-ordenes-de-compra.md`](./compras-ordenes-de-compra.md) (purchase orders
> that convert into compras). A **Compra** is the received-goods counterpart of a `Venta`: same
> list/wizard/detail shape, but it *adds* stock instead of removing it.

---

## 1. At a glance

A **Compra** (purchase) is the record of buying goods from a supplier. The module is three routes: a
**list** (search/filter/sort), a **4-step creation wizard**, and a **detail** page that manages the
full post-purchase lifecycle (pagos/payments, recepciones/receptions, devoluciones/returns, cancel,
finalize). A compra's `estado` is **derived**, not set manually: it becomes `finalizada` only when it
is both fully paid and fully received.

The defining architectural fact — and the key difference from ventas — is how stock is kept in sync.
Ventas routes everything through a dedicated `useVentaStockSync` wrapper; **compras has no such
wrapper**. Instead the **detail page calls `useItems()` directly** and pairs each stock-affecting
mutation with the matching `increaseStock` / `decreaseStock` (and `updatePricing` for cost) call by
hand. Receiving units adds them to catálogo stock; returning or undoing removes them.

| Fact | Value |
| --- | --- |
| Routes | `/compras/compras` (list), `/compras/compras/nueva` (wizard), `/compras/compras/[id]` (detail) |
| Primary files | `app/compras/compras/page.tsx`, `.../nueva/page.tsx`, `.../[id]/page.tsx` |
| Data hook | `hooks/use-compras.ts` (`useCompras`) — **stock-agnostic**, pages add stock calls |
| Stock sync | **Direct `useItems()`** (`increaseStock`/`decreaseStock`/`updatePricing`) in the detail page |
| Persistence | `localStorage` key `stockio_compras_{account}` + `..._version` (seed `v8`) |
| Seed data | `lib/data/compras.ts` (`COMPRAS`) |
| Core type | `Compra` (`lib/types.ts`) |
| Estados | `en_curso` \| `finalizada` \| `cancelada` (derived) |
| ID format | `COMP-NNN` (zero-padded, `max existing + 1`) |

---

## 2. File & component map

| File | Role |
| --- | --- |
| `app/compras/compras/page.tsx` | List page: search/filter/sort over `useCompras().compras`, row → detail, "Nueva compra" → wizard. |
| `app/compras/compras/nueva/page.tsx` | 4-step wizard (`Proveedor → Productos → Recepción y Pago → Confirmación`). Builds a `Compra` and calls `addCompra({ …, origen: "manual" })`. |
| `app/compras/compras/[id]/page.tsx` | Detail page: item table, pagos, recepciones, devoluciones, cancel/finalize. **Owns all stock side effects** by calling `useItems()` alongside each `useCompras` mutation. |
| `hooks/use-compras.ts` | Low-level CRUD + domain mutations over `localStorage`. Owns `recomputeCompra` (totals + derived estado). **Never affects stock.** |
| `lib/data/compras.ts` | `COMPRAS` seed + `COMPRAS_SEED_VERSION` (`"v8"`). |

---

## 3. Data model

### `Compra` (`lib/types.ts`)

```ts
interface Compra {
  id: string                 // "COMP-001" (auto, zero-padded)
  fecha: string              // "YYYY-MM-DD"
  hora: string               // "HH:mm"
  proveedorId: string
  proveedorNombre: string
  items: CompraItem[]
  subtotal: number           // derived (recomputeCompra)
  descuento: number
  descuentoTipo: "percent" | "fixed"
  envio?: number
  customCharges?: VentaCustomCharge[]     // reuses the ventas type
  total: number              // derived; devoluciones/cancel do NOT reduce it
  recepcionItems: CompraRecepcionItem[]       // running received qty per sku
  recepcionEntries: CompraRecepcionEntry[]    // ordered reception log (append-only)
  pagos: CompraPago[]                          // payment log; can include negative entries
  devolucionItems?: CompraDevolucionItem[]     // running returned qty per sku
  devolucionEntries?: CompraDevolucionEntry[]  // ordered return log
  estado: CompraEstado       // "en_curso" | "finalizada" | "cancelada" — DERIVED
  comprador: string          // free text
  observaciones?: string
  origen?: "manual" | "orden"    // provenance
  ordenId?: string               // set when origen === "orden" → links back to the OrdenDeCompra
}
```

Line item mirrors `VentaItem`:

```ts
interface CompraItem {
  sku: string; name: string
  quantity: number; unitPrice: number
  discount: number; discountType: "percent" | "fixed" | "unit"
  total: number; categoria?: string
}
```

Sub-records: `CompraPago {id,fecha,hora,medioPago,monto}`,
`CompraRecepcionItem {sku,quantityRecepcionada}`,
`CompraRecepcionEntry {id,fecha,hora,items[],anulacion?,...}`,
`CompraDevolucionItem {sku,quantityDevuelta}`,
`CompraDevolucionEntry {id,fecha,hora,items[],montoDevuelto,medioPago}`.

### Invariants

- **`subtotal`, `total`, and `estado` are always derived** by `recomputeCompra` on every write — never
  set them by hand.
- **`total` is the original order total.** Returns and cancellations never lower it; refunds are
  represented as **negative `pagos`** entries instead.
- **Logs are append-only.** Reception undo, payment undo, returns, and cancellations all append new
  (often negative) entries rather than mutating or removing existing ones.
- **Running totals are clamped**: received can never exceed ordered (`Math.min(item.quantity, …)`);
  returned/undone never goes below 0 (`Math.max(0, …)`).

---

## 4. State & data flow

### Persistence
- `useCompras` seeds from `lib/data/compras.ts` when the stored `..._version` ≠ `COMPRAS_SEED_VERSION`
  (`"v8"`). Bumping the seed version force-resets all accounts on next load.
- All writes go through `saveCompras` → `localStorage` under `stockio_compras_{currentAccount}`.

### Estado derivation (`recomputeCompra`)

```
cancelada  → always preserved once set (sticky)
finalizada → fullyPaid && fullyReceived
en_curso   → otherwise
```

- `fullyPaid` = sum of **positive** `pagos` ≥ `total` (− 0.001 epsilon). Negative refund/anulación
  entries are excluded from this check.
- `fullyReceived` = every item's `recepcionItems.quantityRecepcionada` ≥ its ordered `quantity`
  (and `items.length > 0`).
- `finalizarCompra` additionally **force-sets** `finalizada` after its atomic receive + pay.

### The stock-sync layer (critical — differs from ventas)

Compras deliberately does **not** wrap mutations. The **detail page** calls `useItems()` directly and
mirrors each stock-affecting action manually:

| Detail-page action | Hook call | Catálogo stock effect |
| --- | --- | --- |
| Confirm recepción | `addRecepcion` + `increaseStock(sku, qty)` per received line | **+** received units |
| Undo recepción entry | `undoRecepcionEntry` + `decreaseStock(sku, qty)` per undone line | **−** undone units |
| Finalizar compra | `finalizarCompra` + `increaseStock(sku, remaining)` for all not-yet-received | **+** remaining units |
| Confirm devolución | `addDevolucion` + `decreaseStock(sku, qty)` per returned line | **−** returned units |
| Reception (cost) | `updatePricing` | updates catálogo `costo` from the purchase price |

Because the hook mutation and the stock mutation are **two separate calls in the page** (not one
atomic op like ventas' sync layer), any new stock-affecting action MUST add the matching
`increaseStock`/`decreaseStock` call in the page, or catálogo stock silently drifts from the compra's
received totals.

---

## 5. Component tree & layout

Shared app shell (identical to catálogo/ventas): `Sidebar` + dark utility bar (`Breadcrumb` left,
`UserPanel` centered) + white rounded panel.

- **List:** title + "Nueva Compra" → search/filter/sort bar → table of compras → row click to detail.
- **Wizard:** left vertical stepper (`Proveedor → Productos → Recepción y Pago → Confirmación`, steps
  lock behind progress) + right step content.
- **Detail:** header (id/estado/proveedor + actions menu) → item table → pagos / recepciones /
  devoluciones logs → reception, payment, devolución, and cancelación modals.

---

## 6. Behaviors

### List
- Search / filter / sort over `useCompras().compras`; row click → `/compras/compras/[id]`,
  "Nueva compra" → the wizard.

### Wizard (`nueva`)
- **Step 1 Proveedor** (required to proceed).
- **Step 2 Productos** (≥1 item): add lines from the catálogo picker (search/filter/sort over items
  and variants); existing SKU increments quantity rather than duplicating.
- **Step 3 Recepción y Pago:** each of `recepcion`/`pago` is `en_el_acto | diferida`; partial initial
  receptions and payments can be registered.
- **Step 4 Confirmación:** `addCompra({ …, origen: "manual" })`, then offers navigation to the created
  compra (`createdCompraId`) or back to the list.

### Detail
- **Recepción:** register received units (clamped to ordered) → `addRecepcion` + `increaseStock`;
  undo a reception entry → `undoRecepcionEntry` + `decreaseStock`.
- **Pagos:** add payment (`addPago`), undo (`undoPago` appends a negative `"anulacion"` entry), edit
  medio de pago (`updatePagoMedioPago`).
- **Devoluciones:** select items → quantities → `addDevolucion` (negative `"devolucion"` pago +
  `decreaseStock`).
- **Finalizar:** `finalizarCompra` (atomic receive-all + pay balance + force `finalizada`) with the
  matching `increaseStock` for remaining units.
- **Cancelar:** `cancelarCompra({devolverUnidades, devolverPagos})` — optionally reverses received
  units and/or refunds payments as negative entries.
- **Item picker modal** supports search/filter/sort (`name | precio | stock`) over catálogo items and
  variants.

---

## 7. Public API surfaces

`useCompras()` returns `compras`, `isLoading`, and:

| Function | Effect |
| --- | --- |
| `addCompra(Omit<Compra,"id">)` | Assigns next `COMP-NNN`, prepends, returns the new `Compra`. |
| `updateCompra(id, updates)` | Low-level merge + `recomputeCompra`. |
| `addItemsToCompra(id, items)` | Adds lines; **existing SKU → quantity incremented** (not duplicated). |
| `addPago(id, pago)` | Appends a positive payment. |
| `undoPago(id, pagoId)` | Appends a negative `"anulacion"` payment equal to `-abs(original)`. |
| `updatePagoMedioPago(id, pagoId, medio)` | Edits an existing payment's method only. |
| `addRecepcion(id, recepciones, fecha?, hora?)` | Adds received units (clamped), appends a reception log entry with the *actual* delta received. |
| `undoRecepcionEntry(id, entryId)` | Subtracts that entry's units, appends a negative `anulacion` reception entry. |
| `finalizarCompra(id, medio, fecha, hora)` | **Atomic**: receive all pending + register one payment for the balance + force `estado: "finalizada"`. |
| `addDevolucion(id, devoluciones, montoDevuelto)` | Adds returned units, appends a return entry + a **negative `"devolucion"` payment**. |
| `cancelarCompra(id, {devolverUnidades, devolverPagos})` | Sets `cancelada`; optionally reverses received units and/or refunds payments. |

> None of these touch stock — the page must pair them with `useItems` calls (§4).

---

## 8. Edge cases & gotchas

1. **No stock wrapper — pair every mutation with a `useItems` call.** Unlike ventas, adding a
   stock-affecting action means adding both the `useCompras` mutation AND the `increaseStock`/
   `decreaseStock` call in the page, or catálogo stock drifts.
2. **`estado` cannot be freely set.** `recomputeCompra` recomputes it on every write; only `cancelada`
   is sticky. Use `finalizarCompra` rather than forcing estado.
3. **`total` never decreases** on returns/cancel. Refunds are negative `pagos`; don't "fix" the total.
4. **Refund/anulación bookkeeping** uses reserved `medioPago` values and negative `monto`; `fullyPaid`
   sums positive entries only. Preserve this or the paid-check breaks.
5. **Received qty is clamped to ordered** — `addRecepcion` returns the *actual* delta; don't assume the
   requested qty was applied.
6. **Seed version reset:** bumping `COMPRAS_SEED_VERSION` (`v8`) wipes stored compras for every account.
7. **`origen`/`ordenId`** trace provenance — `"manual"` (wizard) vs `"orden"` (accepted purchase
   order). See the órdenes doc for the bridge.

---

## 9. Change-safety checklist

- [ ] Any new stock-affecting action pairs its `useCompras` mutation with the matching `useItems` stock call.
- [ ] Totals still flow through `recomputeCompra`; you did not hand-set `subtotal`/`total`/`estado`.
- [ ] Refunds/anulaciones remain negative `pagos` entries (not deletions), so `fullyPaid` stays correct.
- [ ] Reception logic still clamps to ordered quantity and logs the actual delta.
- [ ] Seed version bumped only when intentionally resetting stored compras.
- [ ] `origen`/`ordenId` links preserved when touching the orden → compra bridge.
- [ ] Verified in-browser: create → receive → pay → finalize, and cancel-with-returns, both move catálogo stock correctly.
