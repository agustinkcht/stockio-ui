# Glossary — Stockio

> Part of [Stockio Application Documentation](./APP_DOCUMENTATION.md).
> The **single canonical dictionary** of domain terms, entity shapes, id/SKU conventions,
> `estado` values, storage keys, and same-concept-different-name mappings. When a module doc
> uses a term, this file defines it. Where this file disagrees with the code, the code wins —
> treat the entry as stale and fix it.

---

## 1. Core entities

| Term | Type / source | Meaning |
| --- | --- | --- |
| **Item** | `Item` (`lib/types.ts`) | A product record. Three shapes: **standalone**, **agrupador/parent**, **variant/child**. The central hub entity — see [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) §1. |
| **Standalone item** | `Item`, `hasVariants=false` | A single product with no children. Identified by its own `sku`. |
| **Agrupador / Parent** | `Item`, `hasVariants=true` | A container that owns child variants. Identified by **`skuPrefix`** ("SKU padre"); has **no** own `sku`. Look it up by `id`, never `sku`. |
| **Variant / Child** | `ItemVariant` (in `parent.variants[]`) | A concrete sellable unit under a parent. Identified by **`skuSuffix`**; full SKU is computed `{parent.skuPrefix}-{skuSuffix}`. |
| **Venta** | `Venta` | A customer sale document. |
| **Presupuesto** | `Presupuesto` | A customer quote; mirrors `Venta` (minus cobros/entregas). Accepting one **creates a Venta**. |
| **Compra** | `Compra` | A purchase/received-goods document; the inflow counterpart of a Venta. |
| **Orden de Compra** | `OrdenDeCompra` | A pre-purchase plan; accepting one **creates a Compra**. |
| **Cliente** | `Cliente` | A customer contact. |
| **Proveedor** | `Proveedor` | A supplier contact. |
| **CajaSesion / CajaMovimiento** | `use-caja.ts` | Cash-register session + movements. ⚠ Built but **inactive** — see [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) §7bis. |

---

## 2. `stock` — `{ enStock, reservado, disponible }`

All three fields are **strings**. Full lifecycle in [`DATA_FLOW_AND_RELATIONSHIPS.md`](./DATA_FLOW_AND_RELATIONSHIPS.md) §3.

| Field | Meaning | Editable? |
| --- | --- | --- |
| **`enStock`** | Physical units held. | ✅ The editable base (Stock grid, item detail, compra reception, PDV). |
| **`reservado`** | Units committed to open (non-delivered) sales. | Indirectly — driven by ventas reservation/delivery/cancellation. |
| **`disponible`** | Sellable units. **Always derived**: `max(0, enStock − reservado)`, clamped ≥ 0 on every write. | ❌ Never stored independently. |
| **`total`** | ⚠ **Legacy** field, older records used it instead of `enStock`. Migrated on load. | — |

---

## 3. `precio` — `{ costo, margen, iva, precioFinal }`

All four fields are **numbers**.

| Field | Meaning |
| --- | --- |
| **`costo`** | Acquisition cost. May be written back by a Compra reception (see `costoBehavior`). |
| **`margen`** | Intended markup %. |
| **`iva`** | Tax %. |
| **`precioFinal`** | Current catalog selling price. Snapshotted into `VentaItem.unitPrice` at sale time. |

> ⚠ **`precioFinal` formula diverges between creators.** Standalone/Nuevo-Item keep IVA
> separate (`round(costo × (1 + margen/100))`); Creador-Masivo con-variantes folds IVA into
> the stored final price. See [`catalogo-creador-masivo.md`](./modules/catalogo-creador-masivo.md).

---

## 4. Attributes

| Term | Meaning |
| --- | --- |
| **`atributosPrincipales`** | Key/value attributes that define/identify an item or variant. |
| **`atributosInformativos`** | Key/value attributes that are informational only. |
| **`containerAtributosPrincipales`** | On a parent: the variant-axis definition whose values generate children. **Naming variant:** the model + Nuevo Item use `{ key, variantes[] }`; the Creador Masivo `ParentRow` uses `{ key, tags[] }` for the same concept. |

---

## 5. Identity — `id` vs `sku`

**Rule:** prefer **`id`** for lookups and deletion; `sku` is user-editable and not guaranteed unique.

| Entity | id convention (as generated in code) |
| --- | --- |
| Variant | `generateId("VAR")` → `VAR-…` |
| Item (nuevo) | `item-{timestamp}-{random}` |
| Cliente | `CLI-{seq}` (`CLI-001`, …) |
| Proveedor | `PROV-{seq}` |
| Venta / Compra / Orden / Presupuesto | timestamp/random-based ids on create |

> ⚠ Conventions are **inconsistent** across flows (typed prefix vs. `item-timestamp`). Do not
> assume a uniform id scheme.

**SKU** — Stock Keeping Unit string. Standalone → `sku`; parent → `skuPrefix`; child →
computed `{skuPrefix}-{skuSuffix}`. `ItemVariant.sku` is **`@deprecated`** (use `skuSuffix` +
composed SKU), though the Stock and Lista-de-Precios grids still scan `v.sku`. Full rules:
[`SKU_GENERATION_RULES.md`](./SKU_GENERATION_RULES.md).

---

## 6. `estado` values (verified against `lib/types.ts`)

> ⚠ These are the **actual** unions. Earlier drafts mentioned `pendiente`/`parcial`; those do
> not exist — do not reintroduce them.

| Type | Values | Notes |
| --- | --- | --- |
| **`VentaEstado`** | `"en_curso"` \| `"finalizada"` \| `"cancelada"` | **Derived** each write (`finalizada` when cobros = total AND fully delivered; only `cancelada` sticks). |
| **`CompraEstado`** | `"en_curso"` \| `"finalizada"` \| `"cancelada"` | Same derivation shape as ventas. |
| **`EstadoPresupuesto`** | `"borrador"` \| `"aceptado"` \| `"rechazado"` | Accept value is **`aceptado`** (masculine). |
| **`EstadoOrdenDeCompra`** | `"borrador"` \| `"aceptada"` | Accept value is **`aceptada`** (feminine). No derivation hook. |

> **Naming note:** type names use two opposite orders — `VentaEstado`/`CompraEstado` vs.
> `EstadoPresupuesto`/`EstadoOrdenDeCompra`. Both are correct in code; don't "fix" one.

---

## 7. Image / photo fields (same concept, many names)

There is no single image field. Depending on the entity:

| Field | Where | Holds |
| --- | --- | --- |
| **`media: ItemMedia[]`** (`{ photo, descripcion }`) | `Item`, `ItemVariant` | The canonical gallery; `getItemPhoto()` reads `media[0].photo`. |
| **`imagenUrl`** | `Item` (parent/standalone) | Single image URL written by creation flows. |
| **`foto`** | `ItemVariant` | Per-variant image URL. |
| **`fotoUrl`** | Bulk-creator rows, business profile (`miNegocio`), PDF generators | Row/logo image URL. |
| **`thumbnail`** | Order/OC line items, dashboard top-items | Small preview URL. |

> When migrating imagery, treat `media[]` as the target and the others as inputs/legacy.

---

## 8. Persistence & scope

| Term | Meaning |
| --- | --- |
| **Cuenta (account)** | The active business/tenant (`invino`, `noire`, …) from `AccountProvider`. **Scopes every persisted key.** |
| **Storage-key families** | Catalog/contacts use hyphen `stockio-…`; transactional docs use underscore `stockio_…`; órdenes bake a version into the key (e.g. `…_v5`). This split is intentional. |
| **`stockio:items-updated`** | Browser event dispatched after an items write so other `useItems` instances reload (in-tab sync only; no cross-tab sync). |

---

## 9. Activo / Pausado

`isActive` flag. `true` (or `undefined`) = active; `false` = paused (dimmed, excluded from
sale surfaces). The **Item Grid** auto-toggles it when `disponible` crosses 0; the dedicated
**Stock** screen does not (see [`catalogo-stock.md`](./modules/catalogo-stock.md) §6–§7).

---

## 10. Cross-document link fields

| Link | Fields |
| --- | --- |
| Presupuesto → Venta | `presupuesto.ventaId` ↔ `venta.presupuestoId` |
| Orden de Compra → Compra | `orden.compraId` ↔ `compra.ordenId` |
| Caja movement → Venta | `movimiento.ventaId` |
| Document → Contact | `venta.clienteId`, `compra.proveedorId`, `orden.proveedorId` |
