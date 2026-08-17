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

## Domain glossary (shared across all modules)

| Term (code / UI) | Meaning |
| --- | --- |
| **Item** | A product record. Can be standalone, a parent (`agrupador`), or a child (`variant`). |
| **Standalone item** | A single product with no variants. `hasVariants=false`, `isAgrupador=false`. Identified by `sku`. |
| **Agrupador / Parent** | A container item that owns child variants. `hasVariants=true` and/or `isAgrupador=true`. Identified by `skuPrefix` (the "SKU padre"). Has no own `sku`. |
| **Variant / Child** | A concrete sellable unit under a parent. Typed as `ItemVariant`. Identified by `skuSuffix`; its full SKU is `{parent.skuPrefix}-{skuSuffix}`. |
| **SKU** | Stock Keeping Unit string. Standalone → `sku`; parent → `skuPrefix`; child → computed `{skuPrefix}-{skuSuffix}`. |
| **`id`** | Stable internal identifier, prefixed by type: `STA` (standalone), `PAR` (parent), `VAR` (variant). Preferred over `sku` for lookups. |
| **`stock`** | Object `{ enStock, reservado, disponible }` — all **strings**. `disponible = enStock - reservado`. Legacy shape used `total` instead of `enStock`. |
| **`precio`** | Object `{ costo, margen, iva, precioFinal }` — all **numbers**. |
| **`atributosPrincipales`** | Key/value attributes that define/identify an item or variant. |
| **`atributosInformativos`** | Key/value attributes that are informational only. |
| **`containerAtributosPrincipales`** | On a parent: the attribute dimensions (`{ key, variantes[] }`) whose Cartesian product generates children. |
| **Activo / Pausado** | `isActive` flag. `true` (or `undefined`) = active; `false` = paused (dimmed, excluded from sale surfaces). |
| **Cuenta (account)** | The active business/tenant (`invino`, `noire`, ...). Scopes all persisted data. |

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
| Ventas | `/ventas/*` | `app/ventas/*` | _pending_ | ⬜ Not documented |
| Compras | `/compras/*` | `app/compras/*` | _pending_ | ⬜ Not documented |
| Contactos | `/contactos/*` | `app/contactos/*` | _pending_ | ⬜ Not documented |
| PDV (Punto de venta) | `/pdv` | `app/pdv/page.tsx` | _pending_ | ⬜ Not documented |
| Dashboard | `/dashboard` | `app/dashboard/page.tsx` | _pending_ | ⬜ Not documented |

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
