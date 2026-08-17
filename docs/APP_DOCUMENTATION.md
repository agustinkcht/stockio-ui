# Stockio — Application Documentation

> **Purpose of this document.** This is the canonical, module-by-module reference for the
> Stockio application. It is written to be **read and reasoned about by AI models** as well
> as human developers. Each module is documented in its own file under `docs/modules/` and
> follows the same fixed section structure so that an agent can locate any fact deterministically.
>
> **Status:** In progress. Modules are documented one at a time to guarantee accuracy.
> Do not assume a module is documented until it appears in the index below with status `Documented`.

---

## How to read this documentation (for AI agents)

1. **Start here.** This index maps every app module to its source files and its detail doc.
2. **Per-module docs are authoritative** over this index for behavior details.
3. **Source of truth precedence:** actual code in the repo > module doc > this index >
   `DOCUMENTATION.md` (the older, partial doc). If a discrepancy is found, trust the code and
   flag the doc as stale.
4. **Every module doc uses the same sections** (see "Module doc template" below), so you can
   jump directly to, e.g., "Data model" or "Edge cases & gotchas" without re-reading the whole file.
5. **Terminology is Spanish-first** because the UI, data, and domain language are Spanish
   (e.g. `precio`, `stock`, `agrupador`). Field names in code are the ground truth; this doc
   provides English glosses.

---

## Cross-cutting guides (not module-specific)

| Guide | Scope |
| --- | --- |
| [`UI_LAYOUT_ACTUAL.md`](./UI_LAYOUT_ACTUAL.md) | The UI **as-built today**, module by module: the inlined shell, the sidebar, the current solid-bar-with-pills top row, content archetypes, theming tokens, and known debt. Note: only `catalogo/items` is on the new design system. Read this to understand the current state. |
| [`UI_DESIGN_SYSTEM_TARGET.md`](./UI_DESIGN_SYSTEM_TARGET.md) | The **target** design system to migrate toward: the new edge-to-edge full-screen shell with floating-pill navbar, and the `catalogo/items` visual language generalized across all modules. Includes a per-module migration status table. Read this before any UI re-skin or rewrite. |
| [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) | How modules share and mutate the same data: the Item hub, the stock model (`enStock`/`reservado`/`disponible`) and its three mutation paths, price snapshotting, contact references, document bridges, **Caja (§7bis, built but inactive)**, and the cross-module debt register. Read this before changing any logic that spans more than one module. |
| [`GLOSSARY.md`](./GLOSSARY.md) | The single canonical dictionary of domain terms, entity shapes, id/SKU conventions, `estado` values, storage keys, and same-concept-different-name mappings (e.g. `variantes` vs `tags`, the image-field family). Start here when a term is unfamiliar. |
| [`USER_FLOW.md`](./USER_FLOW.md) | End-to-end user journeys across modules (onboarding, cataloging, selling, purchasing, POS, reporting) and how each step moves stock, price, and documents. Read this to understand *why* the modules connect the way they do. |
| [`SKU_GENERATION_RULES.md`](./SKU_GENERATION_RULES.md) | How SKUs (standalone `sku`, parent `skuPrefix`, variant `skuSuffix`, composed full SKU) are generated and where convention diverges from code. |

---

## Domain glossary (shared across all modules)

> **Moved.** The full, canonical glossary now lives in **[`GLOSSARY.md`](./GLOSSARY.md)** so
> every module doc links to one source of truth. The essentials are repeated here for quick
> orientation; **`GLOSSARY.md` wins** on any discrepancy.

| Term (code / UI) | Meaning |
| --- | --- |
| **Item** | A product record. Can be standalone, a parent (`agrupador`), or a child (`variant`). |
| **Agrupador / Parent** | A container item that owns child variants. Identified by `skuPrefix` ("SKU padre"); has no own `sku`. |
| **Variant / Child** | A sellable unit under a parent (`ItemVariant`). Identified by `skuSuffix`; full SKU is `{parent.skuPrefix}-{skuSuffix}`. |
| **`stock`** | `{ enStock, reservado, disponible }` — all **strings**. `disponible = max(0, enStock − reservado)` is **always derived**. See [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) §3. |
| **`precio`** | `{ costo, margen, iva, precioFinal }` — all **numbers**. |
| **Cuenta (account)** | The active business/tenant (`invino`, `noire`, …). Scopes all persisted data. |

*Full term list, entity shapes, `estado` values, storage-key conventions, and naming-variant
maps: see [`GLOSSARY.md`](./GLOSSARY.md).*

---

## Persistence model (shared)

- The app currently runs in **mock-data mode** (`USE_MOCK_DATA = true` in `hooks/use-items.ts`).
- Items are persisted in **`localStorage`** under the key **`stockio-items-{currentAccount}`**.
- Cross-component sync uses a custom DOM event **`stockio:items-updated`**; every `useItems`
  instance on the page listens and re-reads storage when it fires.
- API routes exist (`app/api/items/*`, backed by Neon) but are **bypassed while `USE_MOCK_DATA` is true**.
- On first load per account, seed data is imported from `lib/data/initial-items-{account}.ts`.

---

## Module index

| Module | Route(s) | Primary source | Detail doc | Status |
| --- | --- | --- | --- | --- |
| **Catálogo · Items (item grid)** | `/catalogo/items` | `app/catalogo/items/page.tsx` | [`modules/catalogo-items.md`](./modules/catalogo-items.md) | ✅ Documented |
| Catálogo · Item detail | `/catalogo/items/[id]` | `app/catalogo/items/[id]/page.tsx` | [`modules/catalogo-item-detail.md`](./modules/catalogo-item-detail.md) | ✅ Documented |
| Catálogo · Nuevo item | `/catalogo/items/nuevo` | `app/catalogo/items/nuevo/page.tsx` | [`modules/catalogo-nuevo-item.md`](./modules/catalogo-nuevo-item.md) | ✅ Documented |
| Catálogo · Creador masivo | `/catalogo/creador-masivo` | `app/catalogo/creador-masivo/page.tsx` | [`modules/catalogo-creador-masivo.md`](./modules/catalogo-creador-masivo.md) | ✅ Documented |
| Catálogo · Lista de precios | `/catalogo/lista-de-precios` | `app/catalogo/lista-de-precios/page.tsx` | [`modules/catalogo-lista-de-precios.md`](./modules/catalogo-lista-de-precios.md) | ✅ Documented |
| Catálogo · Stock | `/catalogo/stock` | `app/catalogo/stock/page.tsx` | [`modules/catalogo-stock.md`](./modules/catalogo-stock.md) | ✅ Documented |
| Ventas · Ventas | `/ventas/ventas`, `.../nueva`, `.../[id]` | `app/ventas/ventas/*` | [`modules/ventas-ventas.md`](./modules/ventas-ventas.md) | ✅ Documented |
| Ventas · Presupuestos | `/ventas/presupuestos`, `.../nuevo`, `.../[id]` | `app/ventas/presupuestos/*` | [`modules/ventas-presupuestos.md`](./modules/ventas-presupuestos.md) | ✅ Documented |
| Compras · Compras | `/compras/compras`, `.../nueva`, `.../[id]` | `app/compras/compras/*` | [`modules/compras-compras.md`](./modules/compras-compras.md) | ✅ Documented |
| Compras · Órdenes de compra | `/compras/ordenes-de-compra`, `.../nueva`, `.../[id]` | `app/compras/ordenes-de-compra/*` | [`modules/compras-ordenes-de-compra.md`](./modules/compras-ordenes-de-compra.md) | ✅ Documented |
| Contactos · Clientes & Proveedores | `/contactos/clientes`, `/contactos/proveedores` | `app/contactos/*` | [`modules/contactos.md`](./modules/contactos.md) | ✅ Documented |
| PDV (Punto de venta) | `/pdv` | `app/pdv/page.tsx` | [`modules/pdv.md`](./modules/pdv.md) | ✅ Documented |
| Dashboard | `/dashboard` | `app/dashboard/page.tsx` | [`modules/dashboard.md`](./modules/dashboard.md) | ✅ Documented |
| Perfil (settings) | `/perfil` | `app/perfil/page.tsx` | — (see [`UI_LAYOUT_ACTUAL.md`](./UI_LAYOUT_ACTUAL.md) §5) | ✅ Noted |
| Ajustes (settings) | `/ajustes` | `app/ajustes/page.tsx` | — (see [`UI_LAYOUT_ACTUAL.md`](./UI_LAYOUT_ACTUAL.md) §5) | ✅ Noted |
| **Caja (cash register)** | — (no active view) | `hooks/use-caja.ts` | [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) §7bis | ⚠ Built but **inactive** — pending re-implementation |

> **⚠ Stale routes — not part of the live app.** An older parallel stock/bulk implementation
> still exists under **`app/stock/*`** (`app/stock/stock2`, `app/stock/articulos/editor-masivo`,
> `app/stock/stock/[item]`), rendering the legacy `ItemsGrid` + `UserPanel`. It is **not** linked
> from the sidebar and is superseded by `/catalogo/stock` and `/catalogo/creador-masivo`. Do not
> build on it; it is a deletion candidate. Also stale: `app/ventas/ventasb`. See
> [`modules/catalogo-stock.md`](./modules/catalogo-stock.md) §8.

---

## Module doc template

Every file under `docs/modules/` MUST contain these sections, in this order:

1. **At a glance** — one-paragraph summary + quick-facts table (route, files, deps).
2. **File & component map** — every file involved and its role.
3. **Data model** — the exact shapes this module reads/writes.
4. **State & data flow** — where state lives, how it moves, persistence.
5. **Component tree & layout** — rendered structure.
6. **Behaviors** — every user-facing behavior, itemized.
7. **Public API surfaces** — hook signatures / props this module relies on.
8. **Edge cases & gotchas** — non-obvious rules an agent must respect.
9. **Change-safety checklist** — what to verify before/after editing.

---

## Tech stack (shared)

- **Framework:** Next.js 16 (App Router), React 19.
- **Styling:** Tailwind CSS v4 + shadcn/ui, design tokens in `app/globals.css`.
- **State:** React hooks + custom hooks (`hooks/use-*`), no global store.
- **Persistence:** `localStorage` (mock mode) with Neon/PostgreSQL API routes available.
- **Icons:** `lucide-react`.
