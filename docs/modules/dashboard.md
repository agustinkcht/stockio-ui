# Dashboard

> Module: `/dashboard`
> File: `app/dashboard/page.tsx`
> Last verified against implementation: this revision

---

## At a glance

The Dashboard is the analytics home of the app: a single, read-only page that turns the raw ventas, caja, and items data into period-scoped business metrics. It never writes anything — it reads `useVentas`, `useCaja`, and `useItems`, filters them to a selected time window, and derives everything on the fly inside one big pure function (`computeMetrics`). The output is a set of KPI cards (Ingresos / Gastos / Ganancia), a configurable multi-factor line chart, a payment-method split, a paginated "top products" list, and a weekday×hour sales-concentration heatmap.

The defining idea is **period-driven derivation**. A shared `PeriodContext` holds the selected window (`hoy`, `mes en curso`, `año en curso`, últimos 7/30 días, último año, or a custom range); `usePeriodRange` resolves it to concrete start/end dates; and every widget is a `useMemo` over `(ventas, range, costoMap, itemMetaMap, cajaEgresos)`. Because nothing is persisted and everything is recomputed, correctness lives entirely in `computeMetrics` and the SKU-resolution helpers that join venta line items back to their item costs and metadata.

---

## Quick facts

| Fact | Value |
|------|-------|
| Route | `/dashboard` |
| Page file | `app/dashboard/page.tsx` (single file, ~1600 lines, all sub-components inline) |
| Reads | `useVentas` (sales), `useCaja` (cash egresos), `useItems` (costo + metadata) |
| Writes | **none** — fully read-only / derived |
| Period source | `PeriodContext` (`lib/contexts/period-context.tsx`) |
| Range resolution | `usePeriodRange(firstSaleDate)` → `PeriodRange { start, end, startStr, endStr }` |
| Core computation | `computeMetrics(ventas, range, costoMap, itemMetaMap, cajaEgresos)` |
| Currency format | `es-AR` ARS, no decimals (`formatARS`) |
| Default period | `dashboard.periodoDefault` from settings, else `mes_en_curso` |

---

## File & component map

Everything is inline in `app/dashboard/page.tsx`. Key units:

| Symbol | Role |
|--------|------|
| `DashboardPage` | Page shell + all `useMemo` wiring |
| `computeMetrics` | Pure reducer: ventas → `DashboardMetrics` |
| `buildCostoMap(items)` | `Map<sku, costo>` (expands variants via `skuPrefix`+`skuSuffix`) |
| `buildItemMetaMap(items)` | `Map<sku, {marca, categoria, thumbnail, tags}>` |
| `buildBuckets(range)` | Chart x-axis buckets; granularity auto-chosen |
| `chooseGranularity(range)` | `hour` (≤1.5d) / `day` (≤95d) / `month` (else) |
| `parseHour(hora)` | Locale-robust hour parser (handles `a. m.`/`p. m.`) |
| `WidgetCard` | KPI card (Ingresos) |
| `PaymentSplit` | efectivo / posnet / transferencia breakdown |
| `SingleFactorChart` | Line chart for the selected factor |
| `TopProductsList` | Paginated top-items-by-revenue table |
| `SalesHeatmap` | 7×24 weekday/hour concentration grid |
| `PeriodSelector` / `RangeCalendarDialog` | Period dropdown + custom-range calendar |

External deps: `PeriodContext`, `useSettings` (business name/photo + default period), `dashboard-period` utils.

---

## Data model (derived)

`computeMetrics` returns `DashboardMetrics`:

```ts
interface DashboardMetrics {
  ingresos: number            // gross: Σ unitPrice*quantity over non-cancelled ventas
  promociones: number         // max(0, ingresos − Σ venta.total)  (discount gap)
  mercaderia: number          // Σ costo(sku)*quantity  (COGS)
  gastos: number              // promociones + mercaderia + cajaEgresos
  ganancia: number            // ingresos − gastos
  margen: number              // ganancia / ingresos * 100
  ventasCount: number         // count of non-cancelled ventas in range
  unidadesVendidas: number
  unidadesDevueltas: number   // units on cancelled ventas
  valorDevoluciones: number   // Σ total of cancelled ventas
  ticketPromedio: number      // ingresos / ventasCount
  payments: { efectivo; posnet; transferencia }   // Σ cobros by medioPago
  topItems: TopItemRow[]      // aggregated per sku, sorted by revenue desc
  heatmap: number[][]         // [7][24] venta counts by weekday×hour
  chartLabels: string[]       // bucket labels aligned to factors
  factors: FactorBuckets      // 9 per-bucket series for the line chart
}
```

`FactorBuckets` holds 9 aligned arrays: `ventasBrutas`, `cantidadVentas`, `unidadesVendidas`, `unidadesDevueltas`, `valorDevoluciones`, `ticketPromedio`, `costoMercaderia`, `costoPromociones`, `egresosCaja`.

**Derivation invariants**
- **Cancelled ventas are excluded from revenue** and instead feed `unidadesDevueltas` / `valorDevoluciones`.
- **`promociones` is inferred, not stored** — it's the gap between gross (`Σ unitPrice*qty`) and the sum of `venta.total`, floored at 0.
- **COGS uses the current item costo**, joined by full SKU — historical cost at sale time is not tracked.
- **`egresosCaja` per bucket is smeared**, not time-located: total caja egresos in range ÷ number of active buckets (see gotchas).

---

## State & data flow

1. **Period** — `usePeriod()` gives `periodKey` + `customRange`; a first-mount effect applies `dashboard.periodoDefault` from settings. `usePeriodRange(firstSaleDate)` resolves the key to a concrete `PeriodRange`. `firstSaleDate` (earliest non-cancelled venta) backs the "histórico"-style ranges.
2. **Joins** — `costoMap` and `itemMetaMap` are `useMemo`'d from `items`; both expand variant SKUs (`skuPrefix`+`skuSuffix`, falling back to `v.sku`).
3. **Caja** — `cajaEgresos` sums `movimientos` of `tipo === "egreso"` whose date falls in range (absolute value).
4. **Metrics** — `computeMetrics(ventas, range, costoMap, itemMetaMap, cajaEgresos)`, memoized on all five inputs.
5. **Render** — widgets read slices of `metrics`; the line chart is driven by page-local factor-selection state.

---

## Layout & structure

App shell (Sidebar + top bar with Breadcrumb/UserPanel), then a scrollable content column:

1. **Sticky hero** — business photo + name (from settings) and the `PeriodSelector` + resolved range label.
2. **KPI row** — Ingresos (`WidgetCard`), Gastos (with % of ingresos), Ganancia/margen.
3. **Factor chart block** — up to 4 selectable factors (`DEFAULT_VISIBLE_FACTORS`), an inline config picker (max 4), and `SingleFactorChart` for the active one.
4. **Payment split** + **Top products** (paginated).
5. **Concentración de ventas** — `SalesHeatmap`, **gated**: shown only when the range spans ≥7 days, otherwise a placeholder message.

---

## Behaviors

- **Period selection** — dropdown of `PERIOD_OPTIONS`; choosing "Personalizado" opens `RangeCalendarDialog`; selection is stored in context (shared app-wide, not just this page).
- **Factor chart** — pick which ≤4 factors are visible, then select one to plot; totals shown per factor. Granularity (hour/day/month) auto-adapts to range width.
- **Top products** — aggregated by SKU (units, revenue, distinct venta count), sorted by revenue, paginated.
- **Heatmap** — 7×24 grid of venta counts by weekday and parsed hour; intensity scaled to the max cell; tooltip buckets low/medium/high.
- **Payments** — sums `venta.cobros` by `medioPago` across non-cancelled ventas.

---

## Gotchas & edge cases

1. **Read-only, fully derived.** No writes, no persistence. Every number is recomputed from ventas/caja/items each render — fixing a wrong metric means fixing `computeMetrics` (or the join maps), never a stored value.
2. **`egresosCaja` is smeared across buckets.** Per-bucket caja egreso = `cajaEgresos / activeBuckets`, i.e. it is **not** placed on the day it actually occurred. The period *total* for gastos is correct; the per-bucket line for that factor is an even distribution, not a time series. Don't read the caja line as "spend on that day".
3. **COGS is current cost, not historical.** `costoMap` reflects the item's cost *now*; a price change retroactively changes past `mercaderia`/`ganancia`. Intended for a localStorage app, but not audit-accurate.
4. **SKU join is the fragility point.** Metrics only attribute cost/metadata when a venta line's `sku` resolves in `costoMap`/`itemMetaMap`. Variant SKUs are reconstructed as `skuPrefix-skuSuffix`; if an item's `skuPrefix` or a variant's `skuSuffix` is missing/renamed, that line silently contributes 0 cost (inflating margin) and shows without marca/thumbnail.
5. **`parseHour` is locale-defensive.** It handles both 24-h and es-AR 12-h (`a. m.`/`p. m.`) strings and defaults to 12 on parse failure — so a malformed `hora` lands at noon in the heatmap rather than erroring.
6. **`promociones` can hide data issues.** Because it's `max(0, gross − Σtotal)`, any case where `venta.total` exceeds gross (e.g. a surcharge modeled into total) is clamped to 0 rather than shown as negative.
7. **Heatmap gated at ≥7 days.** Shorter ranges intentionally render a placeholder, not an empty grid.
8. **Period is app-wide.** `PeriodContext` is shared; changing the dashboard period affects any other consumer of the same context.

---

## Change-safety checklist

- [ ] Adding/altering a metric? Do it in `computeMetrics` and keep `factors` arrays length-aligned with `chartLabels`.
- [ ] Adding a factor to the chart? Extend `FactorBuckets`, `FactorKey`, `ALL_FACTOR_DEFS`, and the per-bucket fill loop — and respect the 4-factor visible cap.
- [ ] Touching SKU resolution? Verify both `buildCostoMap` and `buildItemMetaMap` (they use the same prefix/suffix logic) so cost and metadata stay in sync.
- [ ] Changing period keys? Update `PERIOD_OPTIONS`, `ACTIVE_PERIOD_KEYS`/`PERIODICAL_PERIOD_KEYS`, and `usePeriodRange`.
- [ ] Relying on per-bucket caja spend? Remember it's smeared — add real per-movement bucketing if you need a true time series.
- [ ] Depending on COGS accuracy? Note it uses current item cost; add historical cost capture at sale time if audit accuracy is required.
