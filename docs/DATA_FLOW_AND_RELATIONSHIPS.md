# Data Flow & Cross-Module Relationships

> **Purpose.** The `modules/*.md` docs describe each view in isolation. This document
> describes how those modules **share and mutate the same underlying data** — how stock,
> pricing, contacts, and documents move between Catálogo, Ventas, Compras, PDV and the
> Dashboard. Read this to understand *intended app-wide behavior* before changing any
> logic that touches more than one module.
>
> Everything here reflects the **current implementation** (localStorage + React hooks).
> Where the code diverges from the obviously-intended behavior, it is flagged as
> **⚠ DEBT**.

---

## 1. At a glance

The app has one **hub entity** — the catalog **Item** (`lib/types.ts`) — and every other
module orbits it. Items own the *source-of-truth* numbers for **stock** and **price**.
Ventas, Compras and PDV never store their own copy of stock; instead they **mutate the
item's stock** through the `useItems` hook as a side-effect of their own document
lifecycle, and they **read** the item's price to seed their line items. Contacts
(clientes/proveedores) are lightweight reference entities that documents point at by id
and annotate with a denormalized transaction counter.

The mental model is a **star**: `Item` at the center holds `stock` and `precio`; Ventas,
Compras, PDV are *writers* that push stock deltas inward and *readers* that pull price
outward; the Dashboard is a pure *reader* that joins everything back together for
reporting. All state lives in `localStorage` and is coordinated in-memory by hooks — there
is no server, no transactions, and no cross-tab syncing.

```
                    ┌─────────────────────────────┐
   price (read) ◄───┤          ITEM (hub)         ├───► stock (read: disponible)
                    │  stock{enStock,reservado,   │
                    │        disponible}          │
                    │  precio{costo,margen,iva,   │
                    │         precioFinal}        │
                    └──────▲───────▲───────▲──────┘
             stock deltas  │       │       │  stock deltas
        ┌──────────────────┘       │       └──────────────────┐
   ┌────┴─────┐              ┌──────┴──────┐             ┌─────┴────┐
   │  COMPRAS │              │   VENTAS    │             │   PDV    │
   │ +enStock │              │ ±reservado  │             │ −enStock │
   │ (recepc.)│              │ ±enStock    │             │(immediate)│
   │ +costo → │              │ (delivery)  │             │          │
   │ precio   │              └──────┬──────┘             └──────────┘
   └──────────┘                     │ reads precioFinal → snapshots unitPrice
        ▲                           │
        │ acepta                    │ convierte
   ┌────┴─────────┐          ┌──────┴────────┐         ┌──────────────────────┐
   │ ÓRDENES DE   │          │ PRESUPUESTOS  │         │  DASHBOARD (read)    │
   │ COMPRA       │          │               │         │  reads VENTAS + CAJA │
   └──────────────┘          └───────────────┘         │  + items (NOT compras)│
                                                        └──────────────────────┘

        CAJA (built but inactive) ── egreso movements ──► read by Dashboard
```

---

## 2. The join keys (how records find each other)

| Key | Used by | Notes / ⚠ DEBT |
| --- | --- | --- |
| **`sku`** | Stock & price sync across Ventas, Compras, PDV, Dashboard | The universal cross-module key. Every stock mutation and every dashboard join resolves items **by `sku`**. |
| **`id`** | Item detail routing (`/catalogo/items/[id]`), parent lookup | Parents/agrupadores are resolved by **`id`**, never by `sku` (they only have a `skuPrefix`). |
| **`parentSku`** | Variant stock/price mutations | Variant writes pass the parent `sku` so the hook can descend into `item.variants[]`. Variant compound SKU is `` `${skuPrefix}-${skuSuffix}` ``. |
| **`clienteId` / `proveedorId`** | Ventas → cliente, Compras → proveedor | Documents reference contacts by id; contact records are **not** embedded. |

> **⚠ DEBT — SKU is the load-bearing key but is user-editable and not guaranteed unique.**
> Stock/price sync and all dashboard joins silently no-op or mis-join if a SKU is blank,
> duplicated, or edited after documents already reference it. There is no referential
> integrity. Treat SKU as immutable once an item has transacted.

---

## 3. Stock — the three fields and who moves them

### 3.1 The shape (source of truth: `Item.stock`)

```ts
stock: { enStock: string; reservado: string; disponible: string }   // all strings
```

| Field | Meaning | Editable? |
| --- | --- | --- |
| **`enStock`** (aka `total`) | Physical units on hand in the warehouse | **Yes** — the editable base quantity |
| **`reservado`** | Units committed to open sales pending delivery | Semi — set by Ventas sync; also hand-editable in the item-detail stock modal |
| **`disponible`** | Sellable units = `enStock − reservado` | **No** — always derived |

> **THE core invariant:** `disponible = max(0, enStock − reservado)` is **recomputed on
> every single stock write** (`updateStock`, `bulkSaveStock`, `increaseStock`,
> `decreaseStock`, `reduceStock`, and the detail modal). `disponible` is never stored
> independently — it is a projection.

> **⚠ DEBT — mental-model mismatch.** It's tempting to think "`disponible` is the number
> you edit." In the code it is the opposite: **`enStock` is the editable base** and
> `disponible` is derived. Any UI copy or future refactor should treat `enStock` (physical)
> + `reservado` (committed) as the two inputs and `disponible` as read-only output.

> **⚠ DEBT — legacy shape.** Older records used `{ total, reservado, disponible }`.
> `migrateStock` upgrades `total → enStock` on read, and several call sites still fall back
> to `stock.total`. Values are **strings** and parsed with `parseInt` everywhere.

### 3.2 Who mutates stock (the entry points)

There are **three programmatic entry points** plus manual editing, all funneling into the
same invariant:

| Entry point (`useItems`) | Used by | Effect |
| --- | --- | --- |
| **`bulkSaveStock(changes)`** | Ventas, via `useVentaStockSync` | Applies `{total, reservado}` deltas atomically to many SKUs |
| **`increaseStock` / `decreaseStock`** | Compras (reception / devolución / cancel) | `±enStock` only; `reservado` untouched |
| **`reduceStock`** | PDV | `−enStock` immediately; `reservado` untouched |
| **`updateStock` + detail stock modal** | Catálogo (Stock grid, item detail, variant matrix) | Manual edit of `enStock` and/or `reservado` |

### 3.3 The Ventas stock lifecycle (`useVentaStockSync`)

This is the most nuanced flow. A regular sale **never touches `enStock` until units
physically leave**; it moves `reservado` first. Every `useVentas` mutation that affects
stock is wrapped so it fires the matching `bulkSaveStock` delta automatically:

| Venta action | `enStock` (total) | `reservado` | Net effect on `disponible` |
| --- | --- | --- | --- |
| **`addVenta`** (new sale) | 0 | **+qty** | −qty (units held) |
| **`addEntregas`** (deliver units) | −delivered | −delivered | 0 (already dropped at sale) |
| **`undoEntregaEntry`** | +qty | +qty | 0 |
| **`addDevolucion`** (return delivered units) | +returned | 0 | +returned |
| **`cancelarVenta`** | +delivered *(if `devolverUnidades`)* | −pending | releases held + optionally restores delivered |
| **`finalizarVenta`** (deliver all remaining) | −pending | −pending | 0 |

Read this as: **a sale reserves, a delivery converts reservation into an actual stock
decrement.** So over a full sale+delivery of `q` units: `enStock −q`, `reservado` net `0`,
`disponible −q`.

> **⚠ DEBT — PDV bypasses the reservation model.** PDV sales are immediate (fully
> paid + delivered) and call **`reduceStock` (−enStock directly)**, *not* the
> `useVentaStockSync` path. This is internally consistent (no reservation needed for an
> instant sale) but means PDV and regular Ventas take **two different stock code paths**
> that must be kept in agreement. `reduceStock` is also **fire-and-forget**: it does not
> check availability, so PDV can drive stock negative.

### 3.4 The Compras stock lifecycle

Compras is the **only inflow** of physical stock. Unlike Ventas, its detail page calls
`useItems` directly (no sync wrapper), so each stock-affecting action must **manually
pair** its document mutation with the matching stock call:

| Compra action | Stock call | Effect |
| --- | --- | --- |
| **Confirm reception** (`addRecepcion`) | `increaseStock(sku, qty)` | +enStock for received units |
| **Undo reception / cancel** | `decreaseStock(sku, qty)` | −enStock |
| **Devolución a proveedor** | `decreaseStock(sku, qty)` | −enStock (units sent back) |

> **⚠ DEBT — manual pairing.** Because there is no `useCompraStockSync` equivalent, a new
> compra action that forgets to call `increase/decreaseStock` will silently desync
> document state from stock. Consider mirroring the Ventas sync-wrapper pattern.

---

## 4. Pricing — one source, snapshot on sale

### 4.1 The shape (source of truth: `Item.precio`)

```ts
precio: { costo: number; margen: number; iva: number; precioFinal: number }
```

- **`precioFinal`** is the catalog sell price. Standalone formula:
  `precioFinal = round(costo × (1 + margen/100))` — **IVA is stored separately**, not
  folded into `precioFinal`.
- Managed in **Lista de precios** and the item detail. The `costoBehavior` setting decides,
  when only `costo` changes, whether to **keep `margen`** (recompute `precioFinal`) or
  **keep `precioFinal`** (recompute `margen`).

### 4.2 Price is read outward, then snapshotted

Ventas / PDV **read** `item.precio.precioFinal` when a line is added and copy it into the
document's own `unitPrice` field:

```
item.precio.precioFinal  ──(add line)──►  ventaItem.unitPrice   // frozen snapshot
```

> **Key behavior:** once a line is on a venta/presupuesto, its `unitPrice` is a **frozen
> snapshot**. Later catalog price changes do **not** retro-affect existing documents. Line
> discounts (`percent` / `cash`) adjust the line total but leave the stored `unitPrice`
> intact. This is intended — historical documents must not mutate.

### 4.3 Compras can push cost back into the catalog

When a compra is received (or an orden is accepted), it calls
`updatePricing(sku, { costo: newCosto }, parentSku, costoBehavior)`:

- **`preserveMargen`** (default) → new `costo` **raises `precioFinal`** (keeps the % margin).
- **`preservePrecioFinal`** → new `costo` **shrinks `margen`** (keeps the shelf price).

So a supplier cost change during purchasing can automatically re-price the catalog — the
one place where a **Compra writes back into Item pricing**, gated by the global
`costoBehavior` setting.

> **⚠ DEBT — IVA handling diverges.** The standalone/`updatePricing` path keeps IVA
> *separate* from `precioFinal`, but the **Creador Masivo con-variantes** path folds IVA
> *into* `precioFinal` (`costo × (1+margen) × (1+iva)`). Two creators therefore produce
> different `precioFinal` semantics for the same inputs. Pick one convention.

---

## 5. Contacts — referenced by id, counted denormally

- **Ventas → Cliente**, **Compras → Proveedor**: documents store the contact id and read
  the contact for display.
- Each contact carries a **`transactionCount`** that is a **stored, denormalized counter**,
  *not* a live count of related documents.

> **⚠ DEBT — counter can drift.** `transactionCount` is incremented ad hoc and never
> reconciled against actual ventas/compras. Cancelling or deleting a document does not
> decrement it. Treat it as a soft display hint, not a fact. The trustworthy count is
> "documents whose `clienteId`/`proveedorId` matches," computed on demand.

---

## 6. Document-to-document bridges

### 6.1 Orden de Compra → Compra (one-way)

"Aceptar y llevar a compras" spawns a new `Compra` with `origen: "orden"` and cross-links
via `orden.compraId` ↔ `compra.ordenId`. The orden becomes `aceptada`.
Line items and estimated amounts are copied forward; the compra then runs its own
reception/payment lifecycle independently. **No stock moves at acceptance** — stock only
moves when the resulting compra is *received*.

### 6.2 Presupuesto → Venta (one-way)

Accepting a presupuesto builds a `Venta` from its lines and cross-links via
`presupuesto.ventaId` ↔ `venta.presupuestoId`. The presupuesto is a **quote**: it holds
`unitPrice` snapshots but **owns no stock** while open.

> **⚠ DEBT — inconsistent stock reservation on accept.** Accepting a presupuesto from the
> **list** view runs through `useVentaStockSync` (so the new venta **reserves stock**), but
> accepting from the **detail** view uses raw `useVentas` (**no reservation**). Same
> logical action, two code paths, divergent stock outcome. Route both through the sync
> wrapper.

---

## 7. The Dashboard — pure read-only consumer

The Dashboard never writes. Its inputs are **`useVentas` + `useCaja` + items** (it does
**not** read `useCompras`). `computeMetrics` joins ventas against items **by `sku`** over a
selected period and derives KPIs. Relevant cross-module truths:

- **Cancelled ventas are excluded** from revenue.
- **Gastos (expenses) = promociones (inferred discounts) + COGS + caja egresos** — the
  purchasing side (Compras) is *not* a dashboard input; the cash-out figure comes from
  **Caja `egreso` movements** (see §7bis), smeared across period buckets rather than
  located at their real timestamps. ⚠ DEBT.
- **COGS uses the item's *current* `costo`**, not the cost at sale time (there is no cost
  snapshot on venta lines) — so historical margin shifts if catalog cost changes. ⚠ DEBT.
- The SKU join is the main fragility point: items missing/renamed after a sale drop out of
  the join.

---

## 7bis. Caja (cash register) — built but currently inactive

> **Status: BUILT BUT INACTIVE — pending re-implementation.** The `useCaja` hook and its
> `CajaSesion` / `CajaMovimiento` model exist and are seeded with demo data, and the
> Dashboard reads caja `egreso` movements for its expense figure. However, Caja is **not
> wired as an active production module**: there is no documented Caja view in the module
> set, PDV sales do **not** currently create caja movements at checkout, and the team plans
> to re-architect it. Treat this section as describing latent scaffolding, not live behavior.

- **Hook:** `useCaja` — storage key `stockio_caja_{account}` (underscore-prefixed family,
  like the transactional docs). Seeds one closed demo session on first load.
- **Model:** a `CajaSesion` has `apertura` / `cierre` snapshots and a `movimientos[]` list.
  Each `CajaMovimiento` has a `tipo`: `venta_efectivo` | `venta_posnet` |
  `venta_transferencia` | `ingreso` | `egreso` | `retiro` | `correctivo`, an amount, and an
  optional `ventaId` back-reference.
- **Derivation:** `calcularSaldoEsperado` folds movements into expected
  `efectivo`/`posnet`/`transferencia` balances; ventas add, `egreso`/`retiro` subtract.
- **Cross-module link:** caja movements reference sales via `ventaId`, and the Dashboard is
  the only current *reader* of caja data. When Caja is re-implemented, PDV/Ventas are the
  intended *writers* (a sale should append the matching `venta_*` movement to the active
  session).

---

## 8. Persistence substrate (shared by everything)

- All entities live in **`localStorage`** under per-domain keys, loaded/saved by their
  hooks (`useItems`, `useVentas`, `useCompras`, `useOrdenesDeCompra`, `useClientes`,
  `useProveedores`).
- **No server, no transactions.** A cross-module action that writes two stores (e.g. a
  venta write + a stock write) is **not atomic** — a mid-sequence failure can desync them.
- **No cross-tab sync.** Two open tabs will clobber each other's writes; hooks read
  localStorage at mutation time to reduce (not eliminate) staleness.
- Some hooks **bake a version into the storage key** (e.g. órdenes `v5`), so bumping the
  shape silently starts from an empty dataset.

---

## 9. Consolidated debt register

| # | Debt | Where | Impact |
| --- | --- | --- | --- |
| 1 | SKU is load-bearing but editable/non-unique | all sync + dashboard | silent mis-join / no-op |
| 2 | `disponible` derived, but mental model treats it as editable | stock UI | confusing copy / refactor risk |
| 3 | PDV uses `reduceStock` (own path), not `useVentaStockSync` | PDV vs Ventas | two stock paths to keep aligned; can go negative |
| 4 | Compras stock pairing is manual (no sync wrapper) | compras detail | easy to desync on new actions |
| 5 | IVA folded into `precioFinal` only in creador-masivo con-variantes | pricing | inconsistent price semantics |
| 6 | `transactionCount` denormalized, never reconciled | contactos | drifts from reality |
| 7 | Presupuesto accept reserves stock from list but not detail | presupuestos | divergent stock outcome |
| 8 | Dashboard COGS uses current cost, no sale-time snapshot | dashboard | historical margin drifts |
| 9 | Multi-store writes non-atomic; no cross-tab sync | localStorage substrate | partial-write desync |
| 10 | Caja built but inactive; PDV/Ventas don't write movements, yet Dashboard reads caja egresos | caja / dashboard / pdv | expense figure relies on seed data, not live sales |

---

## 10. Change-safety checklist (cross-module)

- [ ] Touching stock? Remember **`disponible` is derived** — write `enStock`/`reservado`,
      never `disponible`. Confirm the invariant still holds after your write.
- [ ] Adding a new sale-like flow? Decide explicitly: **reservation model** (Ventas,
      `useVentaStockSync`) or **immediate model** (PDV, `reduceStock`). Don't invent a third.
- [ ] Adding a compra action that changes physical stock? Pair it with
      `increaseStock`/`decreaseStock` — nothing does it for you.
- [ ] Changing pricing math? Keep the **IVA-separate** convention and respect
      `costoBehavior`; don't silently fold IVA into `precioFinal`.
- [ ] Reading a price for reporting/history? Use the document's **snapshot `unitPrice`**,
      not the live catalog price (except where current-cost behavior is intended, e.g. it is
      currently — debatably — used for dashboard COGS).
- [ ] Relating documents to contacts? Count by `clienteId`/`proveedorId` on demand; don't
      trust `transactionCount`.
- [ ] Joining across modules? Join by **`sku`** (items/variants) and remember parents are
      keyed by **`id`**.
