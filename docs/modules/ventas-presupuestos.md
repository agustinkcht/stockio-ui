# Module: Ventas · Presupuestos (Quotes)

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/ventas/presupuestos` area. Where it disagrees with
> the code, the code wins — treat the doc as stale and fix it.
>
> **UI status:** ⬜ **on the current design (`UI_LAYOUT_ACTUAL.md`)** — not yet migrated to
> [`UI_DESIGN_SYSTEM_TARGET.md`](../UI_DESIGN_SYSTEM_TARGET.md) (only `catalogo/items` is).
> **Cross-module data flow:** see [`DATA_FLOW_AND_RELATIONSHIPS.md`](../DATA_FLOW_AND_RELATIONSHIPS.md) §6.2 (accept → Venta, `presupuesto.ventaId` ↔ `venta.presupuestoId`).
> **Sibling doc:** [`ventas-ventas.md`](./ventas-ventas.md). A presupuesto is a **pre-sale quote**
> that mirrors the `Venta` shape (minus cobros/entregas) so the same list/wizard/detail UI can be
> reused. Accepting a presupuesto **creates a Venta**.
> **Terms:** see [`GLOSSARY.md`](../GLOSSARY.md).

---

## 1. At a glance

A **Presupuesto** (quote) is a draft order: cliente + items + totals, with a lifecycle of
`borrador → aceptado | rechazado`. It intentionally reuses `VentaItem` and the same subtotal/discount
math as ventas, but has **no stock, cobro, or entrega** — nothing physical happens until it is
**aceptado**, at which point a `Venta` is created (which then reserves stock) and the presupuesto is
linked to it via `ventaId`.

Three routes: **list** (period/widgets/tabs/search), a **3-step wizard**
(`Cliente → Productos → Confirmación`), and a **detail** page (edit items/adjustments, accept, reject,
delete, duplicate, export PDF).

| Fact | Value |
| --- | --- |
| Routes | `/ventas/presupuestos` (list), `.../nuevo` (wizard), `.../[id]` (detail) |
| Primary files | `app/ventas/presupuestos/page.tsx`, `.../nuevo/page.tsx`, `.../[id]/page.tsx` |
| Data hook | `hooks/use-presupuestos.ts` |
| Persistence | `localStorage` key `stockio_presupuestos_{account}` + `..._version` (seed `v6`) |
| Seed data | `lib/data/initial-presupuestos.ts` (`INITIAL_PRESUPUESTOS`) |
| Core type | `Presupuesto` (`lib/types.ts`) |
| Accept → Venta | `lib/utils/presupuesto-to-venta.ts` (`buildVentaFromPresupuesto`) |
| PDF export | `lib/utils/generate-presupuesto-pdf.ts` |
| Shared modals | `VentaItemDetailModal`, `ClienteModal` |

---

## 2. File & component map

| File | Role |
| --- | --- |
| `app/ventas/presupuestos/page.tsx` | List: period selector, 3 widgets (Aceptados / En Borrador / Rechazados), tabs, search/filter/sort, expandable rows, bulk select, accept/reject/delete modals. State lives in the **URL**. |
| `app/ventas/presupuestos/nuevo/page.tsx` | 3-step wizard building a `Presupuesto` via `addPresupuesto`. Supports `?duplicar={id}`. |
| `app/ventas/presupuestos/[id]/page.tsx` | Detail: edit items/adjustments, accept ("Aceptar y llevar a Ventas"), reject, delete, duplicate, PDF, observaciones. |
| `hooks/use-presupuestos.ts` | CRUD over `localStorage`. Owns `recomputePresupuesto` (subtotal/total) and auto-numbering. |
| `lib/utils/presupuesto-to-venta.ts` | `buildVentaFromPresupuesto(p, fecha, hora)` — maps an accepted quote to a `Venta` payload (`origen: "presupuesto"`, `presupuestoId`). |

---

## 3. Data model

### `Presupuesto` (`lib/types.ts`)

```ts
interface Presupuesto {
  id: string                 // "PRE-001" (auto, zero-padded from numero)
  numero: number             // sequential; getNextPresupuestoNumber = max+1
  fecha: string              // "YYYY-MM-DD" creation date
  hora: string               // "HH:mm"
  fechaModificacion?: string // set on every updatePresupuesto
  fechaValidez?: string
  cliente: VentaCliente
  items: VentaItem[]         // SAME line-item type as ventas
  subtotal: number           // derived (recomputePresupuesto)
  descuento: number
  descuentoTipo: "percent" | "fixed"
  envio?: number
  customCharges?: VentaCustomCharge[]
  total: number              // derived
  estado: EstadoPresupuesto  // "borrador" | "aceptado" | "rechazado"
  observaciones?: string
  ventaId?: string           // set when aceptado → links to the created Venta
  // Persisted detail-page editor state:
  itemAjustes?: Record<number, { value: number; type: "percent" | "cash" | "unit" }>
  itemIvas?: Record<number, number>
  globalDiscount?: { value: number; type: "cash" | "percent" }
}
```

`PresupuestoItem` is `@deprecated` and aliases `VentaItem` — always use `VentaItem`.

### Invariants

- **`id` derives from `numero`**: `PRE-{numero padded to 3}`. `numero` is `max(existing)+1`.
- **Totals are derived** by `recomputePresupuesto` on add/update — identical subtotal/discount math to
  `recomputeVenta` (including the `discountType === "unit"` free-units branch), but with **no** cobro
  or entrega terms.
- **No physical side effects** while a presupuesto exists. Stock is only touched when acceptance
  creates a Venta.

---

## 4. State & data flow

### Persistence
- Seeds from `INITIAL_PRESUPUESTOS` when stored `..._version` ≠ `PRESUPUESTOS_SEED_VERSION` (`"v6"`);
  the current seed is **empty**, so a version mismatch resets to no quotes. Writes go to
  `stockio_presupuestos_{currentAccount}` via `savePresupuestos`.
- `updatePresupuesto` always stamps `fechaModificacion` and re-runs `recomputePresupuesto`.

### Acceptance flow (creates a Venta)
```
buildVentaFromPresupuesto(p, fecha, hora)  →  addVenta(...)  →  updatePresupuesto(id, {estado:"aceptado", ventaId})  →  route to /ventas/ventas/{ventaId}
```

**⚠ Stock-sync inconsistency (current behavior, documented as-is):**
- **List page** accepts via `useVentaStockSync().addVenta` → the created venta **reserves stock** correctly.
- **Detail page** (`handleAceptarYLlevarAVentas`) accepts via raw `useVentas().addVenta` → the venta is
  created **without** the stock-reservation side effect.

This means acceptance reserves stock only when done from the list. Treat this as a known bug when
touching either path; align both on `useVentaStockSync` if fixing.

### List page state = URL
Same pattern as ventas: `updateParam` drives `?q`, `?tab`, `?cliente`, `?sort`, `?periodo` (defaults
`tab=todas`, `sort=fecha_desc` omitted). Period default comes from settings, applied once on mount.

---

## 5. Component tree & layout

Identical shell to ventas (Sidebar + dark utility bar + white panel).

- **List:** title + `PresupuestosPeriodSelector` + "Nuevo Presupuesto" → 3 widgets
  (Aceptados / En Borrador / Rechazados, each toggles its tab) → sticky search/filter/sort bar →
  expandable rows → accept/reject/delete modals.
- **Wizard:** left stepper (`Cliente → Productos → Confirmación`) + right step content; steps gated by
  `maxUnlockedStep`.
- **Detail:** header (id/estado/cliente + actions) → editable item table + Resumen → observaciones →
  accept/reject/delete/duplicate actions; if already `aceptado`, links to the associated venta.

---

## 6. Behaviors

### List
- **Period** filters by creation date within range (plain `T12:00:00` timestamp comparison).
- **Widgets** are period-scoped counts that toggle the matching tab (`aceptado`/`borrador`/`rechazado`).
- **Search** matches id and cliente name. **Filter** by cliente. **Sort** by fecha or total, asc/desc.
- **Bulk select** with indeterminate "select all". **PDF** via `downloadPresupuestosPDF`.
- **Accept** (`handleConfirmAceptar`): builds + adds a venta, marks quote `aceptado`, routes to the venta.
- **Delete** via `deletePresupuesto`.

### Wizard (`nuevo`)
- **Step 1 Cliente** (required), **Step 2 Productos** (≥1 required, inline price + per-line ajuste),
  **Step 3 Confirmación** → `handleCreate` calls `addPresupuesto` (auto id/numero, recomputed totals).
- **`?duplicar={id}`** prefills from an existing quote.

### Detail
- **Edit mode**: staged `editItems`/`editAjustes`/`globalDiscount`/`customCharges`/`envío`; Guardar
  persists via `updatePresupuesto`; a nav guard warns on unsaved changes (`pendingNavHref`).
- **Aceptar y llevar a Ventas** (`handleAceptarYLlevarAVentas`): create venta + link + navigate.
- **Rechazar** → `updateEstado("rechazado")`. **Eliminar** → delete + back to list.
- **Duplicar** → `nuevo?duplicar={id}`. **Observaciones** saved inline. Item detail via `VentaItemDetailModal`.

---

## 7. Public API surfaces

`usePresupuestos()` → `presupuestos`, `isLoading`, `addPresupuesto(omit id+numero)`,
`updatePresupuesto(id, partial)` (recomputes + stamps `fechaModificacion`),
`updateEstado(id, estado)`, `deletePresupuesto(id)`, `getPresupuestoById(id)`,
`getNextPresupuestoNumber()`.

`buildVentaFromPresupuesto(presupuesto, fecha, hora): Omit<Venta,"id">` — the accept mapper.

---

## 8. Edge cases & gotchas

1. **Accept-from-detail does not reserve stock** (uses raw `useVentas`); accept-from-list does
   (uses `useVentaStockSync`). See §4 — known inconsistency.
2. **Empty seed + version bump = data reset.** Bumping `PRESUPUESTOS_SEED_VERSION` clears stored quotes.
3. **`numero` gaps:** deleting a quote does not renumber; `getNextPresupuestoNumber` is `max+1`, so ids are monotonic but can skip.
4. **Reuses `VentaItem`** — do not invent a separate presupuesto line type (`PresupuestoItem` is deprecated).
5. **Totals are derived** — never hand-set `subtotal`/`total`; go through `updatePresupuesto`/`addPresupuesto`.
6. **`ventaId` is the only link** back to the created sale; a rejected/redrafted quote keeps it if it was ever accepted.
7. **`fechaModificacion` is stamped on every update**, even non-content ones (e.g. estado change).

---

## 9. Change-safety checklist

- [ ] Both accept paths (list + detail) reserve stock consistently, or the divergence is intentional and noted.
- [ ] New fields flow through `recomputePresupuesto` where they affect totals.
- [ ] Seed version bumped only when intentionally resetting stored quotes.
- [ ] List filter/sort/period state stays in the URL via `updateParam`.
- [ ] Line-item math matches ventas (all three `discountType` branches).
- [ ] `buildVentaFromPresupuesto` still sets `origen:"presupuesto"` + `presupuestoId` on the created venta.
- [ ] Verified in-browser: create quote → accept → lands on a venta that reserved stock; reject and delete work.
