# User Flows — Stockio

> Part of [Stockio Application Documentation](./APP_DOCUMENTATION.md).
> End-to-end user journeys across modules, and how each step moves **stock**, **price**, and
> **documents**. Read this to understand *why* the modules connect the way they do; for the
> mechanical data rules see [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md),
> and for terms see [`GLOSSARY.md`](./GLOSSARY.md).

---

## 0. Orientation

Stockio is a single-tenant-at-a-time inventory + sales app. Everything the user does is
scoped to the active **cuenta** and persisted to account-scoped localStorage (the app is
currently in mock/localStorage mode — no server). The **Item** is the hub: cataloging creates
it, selling/purchasing/POS move its stock, and the dashboard reports on it.

```text
Catálogo ──creates──► Item ◄──reads price/stock── Ventas · PDV · Compras
                        │
                        └──reported by──► Dashboard
```

---

## 1. Onboarding / setup

1. User lands in the app under a cuenta (e.g. `invino`).
2. **`/perfil`** — edits business identity (`miNegocio`: name, logo `fotoUrl`, fiscal data).
3. **`/ajustes`** — sets behavior defaults via `SettingsProvider`: **`costoBehavior`** (how a
   Compra cost write affects `precioFinal`), the default dashboard period, and IVA condition.

> These choices change *later* flows: `costoBehavior` governs step 4.3, and the default period
> governs what the dashboard shows on open.

---

## 2. Cataloging — creating items

Three entry points, all producing the same `Item` model (`hasVariants` + `variants[]`):

| Flow | Route | Use |
| --- | --- | --- |
| **Nuevo Item** | `/catalogo/items/nuevo` | One item, standalone or with a variant matrix. |
| **Creador Masivo** | `/catalogo/creador-masivo` | Spreadsheet-style bulk creation. |
| **(seed)** | — | Demo data only; the legacy `isAgrupador` + nested `items[]` model appears here, **not** from the creators. |

**Stock/price effect:** creation sets the initial `stock` (`enStock`, `reservado` usually `"0"`,
`disponible` derived) and `precio`. SKUs are assigned per
[`SKU_GENERATION_RULES.md`](./SKU_GENERATION_RULES.md): standalone `sku`, parent `skuPrefix`,
variant `skuSuffix`.

Once created, items are browsed/edited in **`/catalogo/items`** (the reference UI), with inline
price/stock edits, and inspected in **item detail**, **Stock**, and **Lista de Precios**.

---

## 3. Selling — the Ventas journey

```text
(optional) Presupuesto ──aceptar──► Venta ──deliver + cobrar──► finalizada
                                      │
                                      ├─ create/confirm ► reservado ↑ , disponible ↓
                                      ├─ deliver         ► enStock ↓ , reservado ↓
                                      └─ cancel          ► reservado ↓ (enStock unchanged)
```

1. **(Optional) Presupuesto** — a quote. Holds `unitPrice` snapshots but **owns no stock**.
   Accepting it creates a `Venta` and links `presupuesto.ventaId` ↔ `venta.presupuestoId`.
2. **Venta lines read price** — each line snapshots the item's current `precioFinal` into
   `VentaItem.unitPrice`. Later catalog price changes do **not** rewrite historical lines.
3. **Reservation** — an open venta increases `reservado` (⇒ `disponible` drops); physical
   `enStock` is untouched.
4. **Delivery (entrega)** — moves units out: `enStock` ↓ and `reservado` ↓.
5. **Cobro + full delivery** ⇒ `estado` derives to **`finalizada`**. Cancelling releases the
   reservation.

> ⚠ Consistency debt: the presupuesto **list** accepts via the stock-sync path while the
> presupuesto **detail** page uses a raw Ventas mutation — reservation behavior can differ.

---

## 4. Purchasing — the Compras journey

```text
(optional) Orden de Compra ──aceptar──► Compra ──receive──► enStock ↑ (+ maybe cost write-back)
```

1. **(Optional) Orden de Compra** — a plan for incoming goods. Does **not** change stock.
   Accepting it creates a `Compra` and links `orden.compraId` ↔ `compra.ordenId`.
2. **Receiving the Compra** — increases `enStock` (⇒ `disponible` rises).
3. **Cost write-back** — the purchase cost may update `item.costo`, and depending on
   **`costoBehavior`** (set in `/ajustes`) may recalculate `precioFinal`. Stock and price
   writes happen on separate paths — a cross-module area to treat carefully.

---

## 5. Point of sale — PDV

**`/pdv`** is the immediate-sale flow.

1. Search/drill the catalog, build an in-memory cart (`usePOS`) with per-line quantity, price
   override, and discounts.
2. **Checkout** closes the sale in one action: full cobro + full entrega, `estado: "finalizada"`,
   `origen: "pdv"`. Stock is reduced **immediately** (no reservation phase).

> ⚠ PDV uses a separate `reduceStock` path rather than the `useVentaStockSync` path used by
> regular Ventas, and it does **not** currently append a Caja movement. See
> [`pdv.md`](./modules/pdv.md) §8 and [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) §3.3.

---

## 6. Reporting — Dashboard

**`/dashboard`** is read-only. For the selected period it reads **Ventas + Caja + items**
(not Compras) and derives revenue, gastos (promociones + COGS + caja egresos), gross profit,
sales count, top items, and payment-method breakdowns.

- Cancelled ventas are excluded from revenue.
- COGS uses the item's **current** `costo` (no cost snapshot on lines), so historical margin
  shifts if catalog cost changes.
- The venta↔item join is by **SKU**, so renamed/removed items drop out of the join.

See [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) §7 / §7bis.

---

## 7. Contacts, cross-cutting

- **Clientes** and **Proveedores** are reference entities; documents store `clienteId` /
  `proveedorId` rather than embedding a copy. `transactionCount` is denormalized on the contact
  and can drift.
- Every flow above writes to account-scoped localStorage; there are no transactions and no
  cross-tab sync, so a document write can succeed while its stock side-effect fails.

---

## 8. UI note

Only **`/catalogo/items`** is built on the target design system
([`UI_DESIGN_SYSTEM_TARGET.md`](./UI_DESIGN_SYSTEM_TARGET.md)). Every other step above still
renders the current shell ([`UI_LAYOUT_ACTUAL.md`](./UI_LAYOUT_ACTUAL.md)) — the flows are
correct, but the look-and-feel is mid-migration.
