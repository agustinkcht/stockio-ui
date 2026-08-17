# Compras · Compras

> Module: **Compras — Compras** (received-goods / supplier purchases)
> Routes: `/compras/compras` (list), `/compras/compras/nueva` (wizard), `/compras/compras/[id]` (detail)
> Last verified against source: see git blame of the files listed below.

---

## 1. Quick facts (at a glance)

| Aspect | Value |
| --- | --- |
| Primary purpose | Record purchases from suppliers, receive units into stock, register payments, returns, and cancellations |
| Route files | `app/compras/compras/page.tsx`, `.../nueva/page.tsx`, `.../[id]/page.tsx` |
| Data hook | `hooks/use-compras.ts` → `useCompras()` |
| Stock sync | **Direct via `useItems()`** — `increaseStock` / `decreaseStock` / `updatePricing`. **NOT** `useVentaStockSync` (that is the ventas pattern). |
| Persistence | `localStorage`, key `stockio_compras_<account>` + `_version` (seed version **`v8`**) |
| Seed data | `lib/data/compras.ts` (`COMPRAS`) |
| Types | `Compra`, `CompraItem`, `CompraPago`, `CompraRecepcionItem`, `CompraRecepcionEntry`, `CompraDevolucionItem`, `CompraDevolucionEntry`, `CompraEstado` in `lib/types.ts` |
| Estados | `en_curso` \| `finalizada` \| `cancelada` (derived, see §4) |
| ID format | `COMP-NNN` (zero-padded, max-existing + 1) |

---

## 2. Data model

### `Compra` (see `lib/types.ts`)

```
id            "COMP-001"
fecha, hora   creation timestamp strings
proveedorId, proveedorNombre
items         CompraItem[]            // ordered lines
subtotal      derived (recomputeCompra)
descuento, descuentoTipo ("percent" | "fixed")
envio?        shipping cost
customCharges? VentaCustomCharge[]    // reuses ventas type
total         derived — original order total, NEVER reduced by returns/cancel
recepcionItems    CompraRecepcionItem[]   // running received qty per SKU
recepcionEntries  CompraRecepcionEntry[]  // append-only reception log
pagos             CompraPago[]            // append-only, +/- entries
devolucionItems   CompraDevolucionItem[]  // running returned qty per SKU
devolucionEntries CompraDevolucionEntry[] // append-only return log
estado        derived (see §4)
comprador     free text
observaciones?
origen?       "manual" | "orden"     // provenance
ordenId?      link back to the OrdenDeCompra that generated it
```

### Invariants

- **`subtotal`, `total`, and `estado` are always derived** by `recomputeCompra` on every write — never set them by hand.
- **`total` = original order total.** Returns and cancellations do **not** reduce it; refunds are represented as **negative `pagos`** entries instead.
- **Logs are append-only.** Reception undo, payment undo, returns, and cancellations all append new (often negative) entries rather than mutating/removing existing ones.
- **Running totals** (`recepcionItems`, `devolucionItems`) are clamped: received can never exceed ordered (`Math.min(item.quantity, …)`), returned/undone never goes below 0 (`Math.max(0, …)`).

---

## 3. `useCompras()` API surface

| Function | Effect |
| --- | --- |
| `addCompra(Omit<Compra,"id">)` | Assigns next `COMP-NNN`, prepends, returns the new `Compra`. |
| `updateCompra(id, updates)` | Low-level merge + `recomputeCompra`. |
| `addItemsToCompra(id, items)` | Adds lines; **existing SKU → quantity is incremented** (not duplicated). |
| `addPago(id, pago)` | Appends a positive payment. |
| `undoPago(id, pagoId)` | Appends a negative `"anulacion"` payment equal to `-abs(original)`. |
| `updatePagoMedioPago(id, pagoId, medio)` | Edits an existing payment's method only. |
| `addRecepcion(id, recepciones, fecha?, hora?)` | Adds received units (clamped to ordered), appends a reception log entry with the *actual* delta received. |
| `undoRecepcionEntry(id, entryId)` | Subtracts that entry's units, appends a negative `anulacion` reception entry. |
| `finalizarCompra(id, medio, fecha, hora)` | **Atomic**: receives all pending units + registers one payment for the remaining balance + forces `estado: "finalizada"` in a single save. |
| `addDevolucion(id, devoluciones, montoDevuelto)` | Adds returned units, appends a return entry + a **negative `"devolucion"` payment** for the refund. |
| `cancelarCompra(id, {devolverUnidades, devolverPagos})` | Sets `estado:"cancelada"`; optionally reverses received units (as devolucion) and/or refunds payments (negative entries). |

---

## 4. Estado derivation (`recomputeCompra`)

```
cancelada  → always preserved once set (sticky)
finalizada → fullyPaid && fullyReceived
en_curso   → otherwise
```

- `fullyPaid` = sum of **positive** `pagos` ≥ `total` (− 0.001 epsilon). Negative refund/anulacion entries are excluded from this check.
- `fullyReceived` = every item's `recepcionItems.quantityRecepcionada` ≥ its ordered `quantity` (and `items.length > 0`).
- `finalizarCompra` additionally **force-sets** `finalizada` after its atomic receive + pay.

---

## 5. Stock synchronization (critical — differs from Ventas)

Compras does **not** use `useVentaStockSync`. The **detail page** (`[id]/page.tsx`) calls `useItems()` directly and mirrors each stock-affecting action manually:

| Detail-page action | Hook call | Catalog stock effect |
| --- | --- | --- |
| Confirm recepción | `addRecepcion` + `increaseStock(sku, qty)` per received line | **+** received units |
| Undo recepción entry | `undoRecepcionEntry` + `decreaseStock(sku, qty)` per undone line | **−** undone units |
| Finalizar compra | `finalizarCompra` + `increaseStock(sku, remaining)` for all not-yet-received | **+** remaining units |
| Confirm devolución | `addDevolucion` + `decreaseStock(sku, qty)` per returned line | **−** returned units |
| (Reception can also) | `updatePricing` | updates catalog `costo` from purchase price |

> **Gotcha:** because the hook mutation and the stock mutation are two separate calls in the page (not one atomic op like ventas' sync layer), any new stock-affecting action MUST add the matching `increaseStock`/`decreaseStock` call in the page, or catalog stock will silently drift from the compra's received totals.

---

## 6. Route flows

### List — `/compras/compras/page.tsx`
- Renders the compras table with search / filter / sort over `useCompras().compras`.
- Row click → `/compras/compras/[id]`. "Nueva compra" → `/compras/compras/nueva`.

### Wizard — `/compras/compras/nueva/page.tsx`
4 steps: **Proveedor → Productos → Recepción y Pago → Confirmación**.
- Recepción and Pago each have `en_el_acto` vs `diferida` modes.
- Confirm calls `addCompra({ …, origen: "manual" })`, then offers navigation to the created compra (`createdCompraId`) or back to the list.

### Detail — `/compras/compras/[id]/page.tsx`
- Looks up the compra by `id` from `useCompras().compras`.
- Hosts the reception, payment, devolución, and cancelación modals; each wires a `useCompras` mutation together with the matching `useItems` stock call (§5).
- Item-picker modal supports search / filter / sort (`name` | `precio` | `stock`) over catalog items and variants.

---

## 7. Edge cases & change-safety checklist

1. **Never set `subtotal`/`total`/`estado` directly** — go through `updateCompra`/the specialized mutations so `recomputeCompra` runs.
2. **Refunds are negative payments**, not deletions — keep this convention or `fullyPaid` math breaks.
3. **Adding a stock-affecting action?** Add both the `useCompras` mutation AND the `useItems` stock call in the page (§5).
4. **Received qty is clamped to ordered** — `addRecepcion` returns the actual delta; don't assume the requested qty was applied.
5. **Seed version `v8`** — bumping `COMPRAS_SEED_VERSION` re-seeds from `lib/data/compras.ts` and discards stored data for the account.
6. **`origen`/`ordenId`** trace whether a compra came from the wizard (`"manual"`) or an accepted orden (`"orden"`); see the Ordenes de Compra doc for the bridge.
