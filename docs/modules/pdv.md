# Module: PDV · Punto de Venta

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/pdv` page (`app/pdv/page.tsx`). Where it disagrees
> with the code, the code wins — treat the doc as stale and fix it.
>
> **UI status:** ⚠ **incomplete surface** on the current design (`UI_LAYOUT_ACTUAL.md`) — not
> yet migrated to [`UI_DESIGN_SYSTEM_TARGET.md`](../UI_DESIGN_SYSTEM_TARGET.md) (only
> `catalogo/items` is).
> **Cross-module data flow:** see [`DATA_FLOW_AND_RELATIONSHIPS.md`](../DATA_FLOW_AND_RELATIONSHIPS.md) §3.3 (PDV uses the immediate `reduceStock` path, not the reservation model) & §7bis (Caja).
> **Terms:** see [`GLOSSARY.md`](../GLOSSARY.md).

---

## 1. At a glance

PDV is the in-store point-of-sale screen: a single, self-contained checkout surface where an operator searches the catalog, builds a cart, applies discounts, picks a client and a payment method, and closes a sale in one action. Unlike the Ventas wizard — which models partial cobros and entregas over time — PDV assumes **everything happens *en el acto***: the moment the operator hits checkout, the sale is fully paid and fully delivered, so the resulting `Venta` is born already `finalizada` and tagged `origen: "pdv"`. The screen is deliberately fast and keyboard-friendly (⌘/Ctrl-K focuses search, Escape backs out of a parent drill-down) and gives no post-sale editing: once a venta is created it lives in the Ventas module, and PDV simply clears the cart after a 4-second success overlay.

The page itself is mostly orchestration. All cart math lives in the `usePOS` hook (a purely in-memory, non-persisted cart), catalog browsing lives in `ProductSearch`, and the checkout summary lives in `CheckoutPanel`. At checkout the page fans out to four independent stores — it reduces stock via `useItems`, records the sale via `useVentas`, logs a cash movement via `useCaja` (only when a caja session is open and the method isn't cuenta corriente), and bumps the client's transaction counter via `useClientes`.

### Quick facts

| | |
|---|---|
| **Route** | `/pdv` (single page, no sub-routes) |
| **Primary file** | `app/pdv/page.tsx` |
| **Components** | `components/pos/product-search.tsx`, `components/pos/cart-panel.tsx`, `components/pos/checkout-panel.tsx` (note: `pos/`, not `pdv/`) |
| **Cart state hook** | `hooks/use-pos.ts` (in-memory only, **not persisted**) |
| **Writes to** | `useItems` (stock), `useVentas` (sale record), `useCaja` (cash movement), `useClientes` (transaction count) |
| **Output** | One `Venta` with `estado: "finalizada"`, `origen: "pdv"` |
| **Persistence** | The cart is ephemeral React state; only the created `Venta` / stock / caja / cliente writes persist (via their respective hooks' localStorage) |

## 2. File & component map

| File | Responsibility |
|---|---|
| `app/pdv/page.tsx` | Layout shell + the single `handleCheckout` orchestration. Holds the success-overlay state (`showCheckoutSuccess`, `currentVenta`). |
| `hooks/use-pos.ts` | The cart: line items, per-line price override + discount, global discount, client, payment method, and derived `subtotal`/`globalDiscountAmount`/`total`/`itemCount`. |
| `components/pos/product-search.tsx` | Left 6/10 pane. Search box + parent drill-down browser; calls `onAddToCart(item, variant?)`. |
| `components/pos/cart-panel.tsx` | Right-top pane. Renders cart lines with qty / price / discount / remove controls. |
| `components/pos/checkout-panel.tsx` | Right-bottom pane. Client picker, global discount, payment method, totals, and the checkout / clear buttons. |

## 3. Data model

### Cart (`usePOS`, in-memory)

```ts
interface CartItem {
  id: string            // variant ? `${item.sku}-${variant.sku}` : item.sku (fallback crypto.randomUUID())
  item: Item
  variant?: ItemVariant
  quantity: number
  unitPrice: number
  originalPrice: number
  priceOverride?: number     // set when the operator edits the line price
  discount: number
  discountType: "percentage" | "fixed"
  subtotal: number           // recomputed on every mutation
}
```

Line subtotal = `calculateSubtotal(priceOverride ?? originalPrice, quantity, discount, discountType)`:
- percentage → `lineTotal * (1 - discount/100)`
- fixed → `max(0, lineTotal - discount)`

Cart aggregates:
- `subtotal` = Σ line subtotals
- `globalDiscountAmount` = percentage → `subtotal * (globalDiscount/100)`, else the fixed amount
- `total` = `max(0, subtotal - globalDiscountAmount)`
- `itemCount` = Σ quantities

### Output `Venta` (built in `handleCheckout`)

The page maps the cart into a full `Venta` payload with the sale already closed:
- `items`: `VentaItem[]` (discountType mapped `percentage→"percent"`, `fixed→"fixed"`)
- `cliente`: `{ tipo: "cuenta", id, nombre }` when a client is selected, else `{ tipo: "consumidor_final" }`
- `cobros`: **one** entry for the full `total` (`PDV-COB-{timestamp}`)
- `entregaItems` + `entregaEntries`: all lines fully delivered now (`PDV-ENT-{timestamp}`)
- `estado: "finalizada"` (also derivable by `recomputeVenta` since paid + delivered = 100%)
- `origen: "pdv"`

**Invariant:** PDV never produces a partial sale. It always writes a single full cobro and a single full entrega, so the sale is complete on creation.

## 4. State & data flow — the checkout flow (`handleCheckout`)

Guard: no-op if `cart.length === 0`. Otherwise, in order:

1. **Reduce stock** — for each cart line resolve the SKU (`variant?.sku || item.sku`). For a variant, find the parent item (`items.find(i => i.variants?.some(v => v.sku === sku))`) and call `reduceStock(sku, quantity, parentSku)`; for a standalone, `reduceStock(sku, quantity)`.
2. **Build `VentaItem[]`** from the cart (name/qty/unitPrice/discount/total/categoria).
3. **Resolve the client** — `getClienteById(selectedClientId)`; compute display name (empresa → `razonSocial`, else `nombre apellido`, else `"Consumidor Final"`).
4. **Assemble the `Venta`** — map PDV payment method → `PaymentMethod` (`tarjeta→posnet`, unknown → `no_especificado`), build the single cobro + full entrega, and call `addVenta(...)`.
5. **Log caja movement** — only if `sesionActiva && venta && paymentMethod !== "cuenta_corriente"`. Maps method → `venta_efectivo` / `venta_posnet` / `venta_transferencia` and calls `agregarMovimiento({ tipo, monto: total, ventaId, medioPago })`.
6. **Increment client counter** — `incrementTransactionCount(selectedClientId)` when a client was selected.
7. **Success overlay** — set `currentVenta`, show the overlay, and after 4s hide it and `clearCart()`.

## 5. Component tree & layout

- Full-height flex shell: sticky `Sidebar` on the left; main card with a dark (`#1B1C20`) 44px navbar (breadcrumb + centered `UserPanel`).
- Main body is a `grid-cols-10`: **`ProductSearch` at `col-span-6`**, cart + checkout at `col-span-4`.
- `ProductSearch` supports a **parent drill-down**: root shows items; "entering" a parent (tracked by `activeParentSku`, keyed on `skuPrefix || sku`) shows its variants. ⌘/Ctrl-K focuses search; Escape exits a drill-down. Search matches item name/sku/skuPrefix/marca/categoria/descripcion, attribute tag values, and variant name/sku/tags. Stock badge: 0 → "Sin stock", ≤3 → "Últimas N disponibles".
- Success overlay: centered modal, "Venta Completada" + total, two ticket buttons, and a 4s reverse progress bar (`shrink-bar` keyframes) mirroring the auto-clear timeout.

## 6. Behaviors

- **Catalog search & drill-down** — search matches item name/sku/skuPrefix/marca/categoria/
  descripcion, attribute tag values, and variant name/sku/tags; "entering" a parent shows its
  variants (see §5).
- **Keyboard** — ⌘/Ctrl-K focuses search; Escape exits a parent drill-down.
- **Cart editing** — per-line quantity, price override, and discount (percentage/fixed); a
  global discount; live `subtotal`/`total`/`itemCount` (math in §3).
- **Checkout** — one action closes the sale (full cobro + full entrega, `estado: "finalizada"`);
  see the step sequence in §4.
- **Success overlay** — 4-second overlay with a reverse progress bar, then auto-`clearCart()`.

---

## 7. Public API surfaces

### `usePOS()` — the in-memory cart hook
Exposes the cart array plus mutators (`addToCart(item, variant?)`, quantity/price/discount
setters, `setGlobalDiscount`, `setClient`, `setPaymentMethod`, `clearCart`) and derived
read-only values (`subtotal`, `globalDiscountAmount`, `total`, `itemCount`). **Not persisted** —
pure React state.

### Component props (page → panes)
`ProductSearch` receives `onAddToCart(item, variant?)`; `CartPanel` receives the cart lines +
line mutators; `CheckoutPanel` receives client/discount/payment state + `onCheckout` / `onClear`.
The page owns `handleCheckout` and the success-overlay state (`showCheckoutSuccess`, `currentVenta`).

> This module is a **writer** into four shared stores (`useItems`, `useVentas`, `useCaja`,
> `useClientes`) but exposes no reusable API of its own beyond `usePOS`.

---

## 8. Edge cases & gotchas

1. **`updateVenta` is referenced but not in scope (latent bug).** The "Ticket Factura" button in the success overlay calls `updateVenta(currentVenta.id, { facturaEmitida: true })`, but the page only destructures `const { addVenta } = useVentas()` — `updateVenta` is never imported or destructured. Clicking that button throws a `ReferenceError`. If you touch this path, add `updateVenta` to the `useVentas()` destructure.
2. **The ticket buttons are stubs.** Both "Ticket Detalle" and "Ticket Factura" only `console.log("[v0] ...")` with `// TODO` comments — there is no real printing yet.
3. **The client picker uses static seed data, not the live hook.** `CheckoutPanel` imports `CLIENTES` from `lib/data/clientes` and searches that array, while `handleCheckout` resolves the client via `useClientes().getClienteById`. Clients created at runtime (not in the seed array) may not appear in the picker even though the checkout code would resolve them. Unify on `useClientes` if this matters.
4. **Payment-method types diverge across the boundary.** `usePOS` types the method as `"efectivo" | "tarjeta" | "transferencia" | "cuenta_corriente"`, but `CheckoutPanel`'s prop type is `"efectivo" | "posnet" | "transferencia"`. The page bridges them with `medioPagoMap`; keep both ends in sync when adding a method.
5. **The cart is not persisted.** `usePOS` is pure React state — a refresh loses the in-progress cart. Only the committed venta/stock/caja/cliente writes survive.
6. **Stock reduction is fire-and-forget.** `handleCheckout` calls `reduceStock` before `addVenta` without checking available stock; PDV does not block selling below zero (the search pane only *displays* a "Sin stock" badge).
7. **Caja is skipped for cuenta corriente.** A cuenta-corriente sale still creates the venta and its full cobro, but intentionally does **not** log a caja movement.
8. **`itemId` cart-key collisions.** Cart line identity is `sku`-based (`item.sku`, or `item.sku-variant.sku`); items lacking a SKU fall back to a random UUID per add, so two SKU-less products can't merge into one line.

## 9. Change-safety checklist

- [ ] If you add a payment method, update **both** the `usePOS` union and the `CheckoutPanel` prop union, plus `medioPagoMap` and the caja `tipo` mapping.
- [ ] Keep the "sale is always full" invariant in mind: if you allow partial PDV sales, `estado`/`cobros`/`entregas` assembly and the forced `"finalizada"` must change together.
- [ ] Any new stock-affecting change must pair the `reduceStock` call with the venta write, matching the parent-SKU resolution for variants.
- [ ] Fix the `updateVenta` scope bug before wiring real ticket printing.
- [ ] Decide whether the client picker should read live `useClientes` data before relying on runtime-created clients in PDV.
- [ ] Remember the cart is ephemeral — don't assume it survives navigation or refresh.
