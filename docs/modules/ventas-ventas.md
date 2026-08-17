# Ventas — Sales (`/ventas/ventas`)

> Module doc. Part of [`APP_DOCUMENTATION.md`](../APP_DOCUMENTATION.md). Documents the **current**
> implementation only. Reflects the sales area reachable from the sidebar (`Ventas › Ventas`).
>
> **Sibling doc:** [`ventas-presupuestos.md`](./ventas-presupuestos.md) (quotes that convert into ventas).
> **Legacy / not documented:** `app/ventas/ventasb/page.tsx` is an orphaned alternate list (uses raw
> `useVentas`, not linked from the sidebar). It is **not** part of the live app — ignore it.

---

## 1. At a glance

A **Venta** (sale) is the central transactional record. The module is three routes: a **list**
(filter/sort/period/widgets), a **4-step creation wizard**, and a **detail** page that manages the
full post-sale lifecycle (cobros/payments, entregas/deliveries, devoluciones/returns, cancel,
finalize). A sale's `estado` is **derived**, not set manually: it becomes `finalizada` only when it
is both fully paid and fully delivered.

The defining architectural fact: **every stock-affecting mutation goes through `useVentaStockSync`**,
a wrapper that calls the underlying `useVentas` mutation and then applies the matching stock delta to
`useItems` via `bulkSaveStock`. Sales reserve, deliver, and return physical stock as a side effect.

| Fact | Value |
| --- | --- |
| Routes | `/ventas/ventas` (list), `/ventas/ventas/nueva` (wizard), `/ventas/ventas/[id]` (detail) |
| Primary files | `app/ventas/ventas/page.tsx`, `.../nueva/page.tsx`, `.../[id]/page.tsx` |
| Data hook | `hooks/use-venta-stock-sync.ts` (wraps `hooks/use-ventas.ts`) |
| Persistence | `localStorage` key `stockio_ventas_{account}` + `..._version` (seed `v11`) |
| Seed data | `lib/data/ventas.ts` (`VENTAS`) |
| Core type | `Venta` (`lib/types.ts`) |
| Shared modals | `VentaItemDetailModal`, `ClienteModal`, `TicketModal` (`components/ventas/`) |
| Period filter | `lib/contexts/period-context.tsx` (`usePeriod`, `usePeriodRange`) |
| PDF export | `lib/utils/generate-venta-pdf.ts` |

---

## 2. File & component map

| File | Role |
| --- | --- |
| `app/ventas/ventas/page.tsx` | List page: period selector, 3 widgets, tabs, search/filter/sort, expandable rows, bulk select, cancel/finalizar modals. All list state lives in the **URL** (`?q`, `?tab`, `?cliente`, `?cobro`, `?entrega`, `?sort`, `?periodo`). |
| `app/ventas/ventas/nueva/page.tsx` | 4-step wizard (`Cliente → Productos → Entrega y Cobro → Confirmación`). Builds a `Venta` object and calls `addVenta`. Supports `?duplicar={id}` to prefill and jump to step 4. |
| `app/ventas/ventas/[id]/page.tsx` | Detail page: item table (edit mode), Resumen (discount/envío/custom charges), cobros, entregas, devoluciones, cancel/finalize, ticket. |
| `hooks/use-ventas.ts` | Low-level CRUD + domain mutations over `localStorage`. Owns `recomputeVenta` (totals + derived estado) and `migrateVenta` (back-fills missing fields). **Never affects stock.** |
| `hooks/use-venta-stock-sync.ts` | The hook pages should use. Wraps every stock-affecting mutation and fires `useItems.bulkSaveStock` deltas. Passes through non-stock mutations unchanged. |
| `components/ventas/venta-item-detail-modal.tsx` | Read-only per-line item detail popup. |
| `components/ventas/cliente-modal.tsx` | Create/edit a cliente inline. |
| `components/ventas/ticket-modal.tsx` | Printable ticket/receipt view. |
| `lib/utils/venta-item-lookup.ts` | `getVentaItemDisplay` — resolves a line item's display data against the live catálogo. |
| `lib/utils/stock-mutations.ts` | `computeStockChanges(items, deltas)` — turns `{sku, deltaTotal, deltaReservado}[]` into per-item stock writes. |

---

## 3. Data model

### `Venta` (`lib/types.ts`)

```ts
interface Venta {
  id: string                 // "VTA-001" (auto, zero-padded)
  fecha: string              // "YYYY-MM-DD"
  hora: string               // "HH:mm"
  cliente: VentaCliente      // { tipo: "consumidor_final" } | { tipo: "cuenta"; id; nombre }
  items: VentaItem[]
  subtotal: number           // derived (recomputeVenta)
  descuento: number
  descuentoTipo: "percent" | "fixed"
  envio?: number
  customCharges?: VentaCustomCharge[]   // { id, label, value }
  total: number              // derived; devoluciones/cancel do NOT reduce it
  entregaItems: VentaEntregaItem[]      // running delivered qty per sku
  entregaEntries: VentaEntregaEntry[]   // ordered delivery log (supports anulación entries)
  cobros: VentaCobro[]                  // payment log; can include negative (refund/anulación) entries
  estado: VentaEstado        // "en_curso" | "finalizada" | "cancelada" — DERIVED
  observaciones?: string
  facturaEmitida?: boolean
  origen?: "manual" | "pdv" | "presupuesto"
  presupuestoId?: string     // set when origen === "presupuesto"
  devolucionItems?: VentaDevolucionItem[]     // running returned qty per sku
  devolucionEntries?: VentaDevolucionEntry[]  // ordered return log
}
```

Line item (shared with Presupuesto and PDV):

```ts
interface VentaItem {
  sku: string; name: string
  quantity: number; unitPrice: number
  discount: number; discountType: "percent" | "fixed" | "unit"
  total: number; categoria?: string
}
```

Sub-records: `VentaCobro {id,fecha,hora,medioPago,monto}`,
`VentaEntregaItem {sku,quantityEntregada}`,
`VentaEntregaEntry {id,fecha,hora,items[],anulacion?,anulacionTotal?,originalEntregaId?}`,
`VentaDevolucionItem {sku,quantityDevuelta}`,
`VentaDevolucionEntry {id,fecha,hora,items[],montoDevuelto,medioPago}`.
`PaymentMethod = "efectivo" | "posnet" | "transferencia" | "no_especificado" | "anulacion"`
(the string `"devolucion"` is also written to `medioPago` for refund cobros).

### Invariants

- **`estado` is derived** by `recomputeVenta`: `cancelada` is sticky; otherwise `finalizada` iff
  `total > 0 && cobrado >= total` (positive cobros only) **and** every item fully delivered; else `en_curso`.
- **`total` is the original order total.** Devoluciones and cancellations never lower it; refunds are
  represented as **negative `cobros`** entries instead.
- **Two subtotal math paths**: `discountType === "unit"` treats `discount` as free units
  (`paidQty = quantity − min(discount, quantity)`); `percent`/`fixed` reduce the gross.
- **Undo is append-only**: `undoCobro`/`undoEntregaEntry` never delete; they append negative
  "anulación" entries so history is preserved.

---

## 4. State & data flow

### Persistence + sync

- `useVentas` seeds from `lib/data/ventas.ts` when the stored `..._version` ≠ `VENTAS_SEED_VERSION`
  (`"v11"`). Bumping the seed version force-resets all accounts on next load.
- Every read is run through `migrateVenta` to back-fill arrays/fields added after a record was saved.
- All writes go through `saveVentas` → `localStorage` under `stockio_ventas_{currentAccount}`.

### The stock-sync layer (critical)

`useVentaStockSync` is the **only correct entry point** for pages. It maps each mutation to a stock
delta (`{sku, deltaTotal, deltaReservado}`) and applies it after the venta write:

| Mutation | Stock effect |
| --- | --- |
| `addVenta` | `+reservado` per unit (stock is held for the sale) |
| `addEntregas` | `−reservado` and `−total` per actually-delivered unit |
| `undoEntregaEntry` | `+reservado` and `+total` per un-done unit |
| `addDevolucion` | `+total` per returned unit (already delivered → back to available) |
| `cancelarVenta` | `−reservado` for undelivered units; if `devolverUnidades`, `+total` for delivered units |
| `finalizarVenta` | `−reservado` and `−total` for all still-pending units |

Pass-through (no stock effect): `addItemsToVenta`, `addCobro`, `undoCobro`,
`updateCobroMedioPago`, `setEstado`, `updateVenta`.

### List page state = URL

The list keeps **all** filter/sort/period/tab state in `searchParams` via a single `updateParam`
helper (defaults omitted from the URL: `tab=todas`, `sort=fecha_desc`). Period defaults to the
settings value (`dashboard.periodoDefault`, fallback `mes_en_curso`) applied once on mount;
`?periodo=ninguno` means "no period filter". Only ephemeral UI (dropdown open, selection set,
expanded rows, modals) is React state.

---

## 5. Component tree & layout

Shared app shell (identical to catálogo): `Sidebar` + dark utility bar (`Breadcrumb` left,
`UserPanel` centered) + white rounded panel.

- **List:** title + `VentasPeriodSelector` + "Nueva Venta" → scrollable body → 3 widgets
  (Finalizadas / En Curso / Canceladas — clicking one toggles the matching `tab`) → sticky
  search/filter/sort/bulk bar → table of ventas with expandable per-row item breakdown → cancel &
  finalizar modals.
- **Wizard:** left vertical stepper (steps lock behind `maxUnlockedStep`) + right step content.
- **Detail:** header (id/estado/cliente + actions menu) → item table with `viewMode`
  (`productos | entrega | devolucion`) → Resumen → cobros/entregas/devoluciones logs → modals.

---

## 6. Behaviors

### List
- **Period filtering:** finalizadas/canceladas filter by creation date within the range; for an
  "active" period (`ACTIVE_PERIOD_KEYS`) all `en_curso` sales show regardless of date.
- **Widgets** are period-scoped counters and act as tab toggles (click again → back to `todas`).
- **Search** matches id, cliente, fecha/hora, origen label, estado label, total, unit count, and
  product names/skus.
- **Filters:** cliente dropdown, `pendiente cobro`, `pendiente entrega`. **Sort:** fecha or total, asc/desc.
- **Bulk select** with indeterminate "select all"; **PDF export** via `downloadVentasPDF`.
- Row actions: cancel (with "devolver unidades" / "devolver cobros" toggles) and finalizar (pick medio de pago).

### Wizard (`nueva`)
- **Step 1 Cliente** (required to proceed): pick existing or create via `ClienteModal`; consumidor final allowed.
- **Step 2 Productos** (≥1 item required): add products via modal (search/filter/sort), edit unit
  price inline, per-line discount/ajuste modal (`percent | cash | unit`).
- **Step 3 Entrega y Cobro:** `entregaMode`/`cobroMode` each `en_el_acto | diferida`; partial initial
  deliveries and payments can be registered.
- **Step 4 Confirmación:** `handleCreate` assembles the `Venta` and calls `addVenta` (which reserves
  stock). Success screen links to the new detail page.
- **`?duplicar={id}`** prefills from an existing venta and jumps to step 4.

### Detail
- **Edit items** (edit mode with staged `editItems`/`editAjustes`); adding/removing items after
  deliveries triggers entrega-conflict resolution (`reingresar` vs `no_hacer_nada`).
- **Cobros:** add payment, undo (appends negative anulación), edit medio de pago.
- **Entregas:** register deliveries (capped at ordered qty), undo a delivery entry.
- **Devoluciones:** 2-step return flow (select items → quantities) → `addDevolucion` (negative cobro + stock back).
- **Cancelar / Finalizar:** as per the stock table in §4. **Ticket** via `TicketModal`.

---

## 7. Public API surfaces

`useVentaStockSync()` returns: `ventas`, `isLoading`, and stock-synced `addVenta`, `addEntregas`,
`undoEntregaEntry`, `addDevolucion`, `cancelarVenta`, `finalizarVenta`, plus pass-throughs
`addItemsToVenta`, `addCobro`, `undoCobro`, `updateCobroMedioPago`, `setEstado`, `updateVenta`.

`useVentas()` (low-level, **do not call directly from pages that change stock**) additionally exposes
the raw versions of the above without stock side effects.

---

## 8. Edge cases & gotchas

1. **Always use `useVentaStockSync`, never `useVentas` directly**, in any page that creates,
   delivers, returns, cancels, or finalizes — otherwise catálogo stock silently desyncs.
2. **`estado` cannot be freely set.** `recomputeVenta` recomputes it on every write; only
   `cancelada` is sticky. Use `finalizarVenta` (atomic deliver + collect) rather than forcing estado.
3. **`total` never decreases** on returns/cancel. Refunds are negative `cobros`; don't "fix" the total.
4. **Refund/anulación bookkeeping** uses reserved `medioPago` values (`"anulacion"`, `"devolucion"`)
   and negative `monto`. Filters that sum "cobrado" must exclude non-positive entries (as the code does).
5. **Delivery caps:** `addEntregas` clamps to `item.quantity`; over-delivery is silently ignored.
6. **Seed version reset:** bumping `VENTAS_SEED_VERSION` wipes stored ventas for every account.
7. **`ventasb` is dead code** — do not document or extend it; the live list is `ventas/page.tsx`.
8. **Consumidor final vs cuenta:** `getClienteNombre` returns "Consumidor Final" for non-account
   clientes; the cliente filter dropdown excludes it.

---

## 9. Change-safety checklist

- [ ] Any new stock-affecting action added to `useVentas` also has a wrapper in `useVentaStockSync`.
- [ ] Totals still flow through `recomputeVenta`; you did not hand-set `subtotal`/`total`/`estado`.
- [ ] New persisted fields are back-filled in `migrateVenta` (and seed version bumped if the shape changed).
- [ ] List filter/sort/period changes stay in the URL via `updateParam` (defaults omitted).
- [ ] New line-item math respects all three `discountType` branches (`percent`/`fixed`/`unit`).
- [ ] Wizard step gating (`maxUnlockedStep`) and required-field checks still hold.
- [ ] Verified in-browser: create → deliver → collect → finalize, and cancel-with-returns, both move stock correctly.
