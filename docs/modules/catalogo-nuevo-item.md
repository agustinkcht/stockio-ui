# Module: Catálogo · Nuevo Item (Single-Item Creator)

> Part of [Stockio Application Documentation](../APP_DOCUMENTATION.md).
> This document is authoritative for the `/catalogo/items/nuevo` creation flow. Where it disagrees
> with the code, the code wins — treat the doc as stale and fix it.
>
> **UI status:** ⬜ **on the current design (`UI_LAYOUT_ACTUAL.md`)** — not yet migrated to
> [`UI_DESIGN_SYSTEM_TARGET.md`](../UI_DESIGN_SYSTEM_TARGET.md) (only `catalogo/items` is).
> **SKU generation:** see [`SKU_GENERATION_RULES.md`](../SKU_GENERATION_RULES.md).
> **Terms:** see [`GLOSSARY.md`](../GLOSSARY.md).

---

## 1. At a glance

The **Nuevo Item** page is a guided, step-by-step wizard for creating **one** item at a time. The
user types a title, picks a creation type — **Individual** (standalone) or **Con Variantes**
(parent + generated variants) — then walks a 4-step stepper to fill info, stock, and price. On
submit it builds a fully-formed `Item`, persists it, and shows a success screen with links to view
the item or create another. For creating many items at once, use the
[Creador Masivo](./catalogo-creador-masivo.md) instead.

| Quick fact | Value |
| --- | --- |
| Route | `/catalogo/items/nuevo` |
| Page component | `app/catalogo/items/nuevo/page.tsx` (`NuevoItemPage`) — `"use client"` |
| Data hook | `hooks/use-items.ts` (`useItems` → `items`, `setItems`) |
| Account context | `lib/contexts/account-context.tsx` (`useAccount`) |
| Settings context | `lib/contexts/settings-context.tsx` (`useSettings` → `catalogo`, `precios`) |
| SKU helpers | `lib/utils/sku-generator.ts` (`generateStandaloneSKU`, `generateUniqueSKU`) |
| Id helper | `lib/utils/item-utils.ts` (`generateId`) |
| Variant modal | `components/modals/nueva-variante-modal.tsx` (`NuevaVarianteModal`) |
| Types | `lib/types.ts` (`Item`, `ItemVariant`, `Atributo`) |
| Persistence | Writes **directly** to `localStorage["stockio-items-{account}"]` + `setItems` |
| Title cap | `MAX_TITLE_LENGTH = 60` |

> **This page persists directly, not through a `useItems` create helper.** Both submit paths build
> the item object inline, filter existing items for validity, `localStorage.setItem(...)`, then
> `setItems(...)`. It does **not** call `handleCreateNuevoItem` / `bulkCreateItems`. Keep this in
> mind — validation and side-effects that live in those helpers do **not** run here.

---

## 2. File & component map

| File | Role in this module |
| --- | --- |
| `app/catalogo/items/nuevo/page.tsx` | The entire wizard: title entry, type selection, the 4-step stepper for both modes, all form state, price/stock math, SKU suggestion, variant generation, submit + persistence, and the success screens. Large single-file component (~2950 lines). |
| `components/modals/nueva-variante-modal.tsx` | Modal to add a single manual variant combination (`handleNuevaVariante`). |
| `lib/utils/sku-generator.ts` | `generateStandaloneSKU({category,title})` for suggestions; `generateUniqueSKU(base, existing)` to de-dupe on submit. |
| `lib/utils/item-utils.ts` | `generateId("STA"|"PAR"|"VAR")` for stable ids. |
| `lib/contexts/settings-context.tsx` | `precios.costoBehavior` drives cost/margin/price recalculation; `catalogo` settings. |
| `components/layout/sidebar.tsx`, `breadcrumb.tsx`, `user-panel.tsx` | Chrome. |

---

## 3. Data model

### Two step sequences

```ts
const STEPS_INDIVIDUAL = [
  { id: 1, label: "Información del Item" },
  { id: 2, label: "Stock" },
  { id: 3, label: "Precio" },
  { id: 4, label: "Detalles Finales" },
]
const STEPS_VARIANTES = [
  { id: 1, label: "Información Compartida" },
  { id: 2, label: "Variantes" },
  { id: 3, label: "Stock" },
  { id: 4, label: "Precio" },
]
```

### Output objects (what gets persisted)

**Individual → standalone `Item`:**
```ts
{
  id: generateId("STA"), name, sku: generateUniqueSKU(sku, existingSkus),
  codigoUniversal, marca, modelo:"", categoria, formatoVenta, proveedor, codigoProveedor,
  descripcion, foto: mediaPhotos[0] || "",
  hasVariants: false, isAgrupador: false, variantCount: 0, itemCount: 0,
  stock: { enStock, reservado, disponible },              // strings; disponible = max(0, en - res)
  atributosPrincipales: [], atributosInformativos,
  precio: { costo, margen, iva, precioFinal },            // numbers
}
```

**Con Variantes → parent `Item` with `variants: ItemVariant[]`:**
```ts
{
  id: generateId("PAR"), name, skuPrefix: finalSkuPrefix, codigoUniversal, marca, modelo:"",
  categoria, formatoVenta, proveedor, codigoProveedor, descripcion,
  hasVariants: true, isAgrupador: false, variantCount: variants.length, itemCount: 0,
  containerAtributosPrincipales: containerAttrs,          // { key, variantes[] }[]
  variants: [ { id, name, skuSuffix, codigoUniversal, stock{...}, precio{...},
               atributosPrincipales:[{key,value}], isActive:true } ],
  atributosInformativos, isActive: true,
}
```

- **Parents carry `skuPrefix`, never `sku`.** Each variant carries `skuSuffix`; the full SKU is
  composed as `{skuPrefix}-{skuSuffix}` by readers.
- Variant `name` is the **parent title**; the attribute value is carried in
  `atributosPrincipales` (rendered as a tag badge elsewhere).
- Stock strings, precio numbers — same invariants as everywhere in the catalog.

### Key form-state groups (see file for the full list)

`titulo` / `tituloFinal` (+ `*UserModified` flags), `selectedType`, `currentStep`,
`selectedDetailTab` (`info` | `atributos`), info fields (`categoria`, `marca`, `formatoVenta`,
`unidadesPorPack`, `volumen*`, `vencimiento*`), codes (`sku` + `skuUserModified`,
`codigoUniversal`), media (`mediaPhotos`, `draggedPhotoIndex`), `descripcion`, commercial
(`costo`, `margen`, `iva`, `precioVenta`, `stockInicial`, `stockReservado`, `proveedor`,
`codigoProveedor`), and the variantes-only cluster (`containerAtributosPrincipales`,
`variantItems`, `skuPadre`, `varianteInput`, modals).

---

## 4. State & data flow

### 4.1 Flow

1. **Title gate.** `isTituloValid = titulo.trim().length > 0` (capped at 60). Type buttons are
   disabled until valid.
2. **Type selection.** `handleTypeSelect("individual" | "variantes")` sets `selectedType`, seeds
   `skuPadre` for variantes, and smooth-scrolls to the stepper.
3. **Stepper.** `currentStep` (1–4) walks the mode-specific steps; forms write local state.
4. **Submit.** Builds the object (see §3), de-dupes SKU via `generateUniqueSKU`, filters existing
   items for validity, writes `localStorage`, calls `setItems`, then sets `createdItemId` +
   `createdItemSkuDisplay` to trigger the success screen.
5. **Success.** Full-screen (no stepper): "Ver Item" → `/catalogo/items/{createdItemId}`;
   "Crear Otro Item" → resets **all** state back to step 0.

### 4.2 SKU suggestion (auto until user overrides)

- `suggestedSku = generateStandaloneSKU({ category: categoria, title: tituloFinal || titulo })`.
- An effect syncs `sku ← suggestedSku` **only while `!skuUserModified`**; once the user edits the
  SKU field, auto-suggestion stops.
- `tituloFinal` mirrors `titulo` until the user edits it (`tituloFinalUserModified`), because the
  final title feeds the SKU.
- On submit, `generateUniqueSKU(sku, existingSkus)` guarantees uniqueness against current items.

### 4.3 Price math (settings-aware)

```ts
calculatePrecioFinal(costo, margen) = round(costo * (1 + margen/100))
calculateMargen(precioFinal, costo) = costo === 0 ? 0 : round((precioFinal/costo - 1) * 1000)/10
```
- `precioFinal` = manual `precioVenta` if set, else computed from `costo`+`margen`.
- `handleCostoChange` branches on `precios.costoBehavior`:
  - `"preservePrecioFinal"` → recompute **margen** from the current final price.
  - otherwise → preserve margen, clear manual price (`precioVenta = ""`) so final recomputes.
- `handleMargenChange` clears manual price (recompute final); `handlePrecioFinalChange` recomputes
  margen. Zero cost / zero price collapse margen to `0`.
- `stockDisponible = max(0, stockInicial − stockReservado)`.

### 4.4 Variant generation (Con Variantes mode)

- `containerAtributosPrincipales: { key, variantes[] }[]` defines up to **2** attribute
  dimensions. `generateNewVariantCombinations()` produces the Cartesian product (1 or 2 dims),
  skipping combinations that already exist (`variantExists`).
- `handleGenerarVariantes()` keeps existing variants whose attribute-count matches the current
  dimension count, then appends the new combinations. `canGenerateVariants` gates the button.
- Each generated variant gets `skuSuffix` = attribute value(s) lowercased with spaces → `-`.
- `handleNuevaVariante(attributeValues)` adds one manual combination via the modal (dedup-checked).

### 4.5 Persistence

Direct write (both modes): filter `items` to valid records → `[newItem, ...valid]` →
`localStorage.setItem("stockio-items-{currentAccount}", JSON.stringify(...))` → `setItems(...)`.
Because `useItems` listens for `stockio:items-updated`, other mounted instances stay in sync via
that hook's own save path — but note this page writes storage **directly**, so it relies on
`setItems` for its own state update.

---

## 5. Component tree & layout

```
NuevoItemPage (min-h-screen, bg panel)
├── (success branch) full-screen success card — when createdItemId is set
│   ├── individual success (title + SKU + "Ver Item" / "Crear Otro Item")
│   └── variantes success (same pattern)
└── (wizard branch)
    └── flex row: Sidebar + white content card
        ├── Header (dark bar): Breadcrumb ("Catálogo / Items / Nuevo Item") · UserPanel
        └── main (scroll)
            ├── Title input (maxLength 60) + live char count
            ├── Type selector: "Individual" | "Con Variantes" (disabled until title valid)
            └── Stepper (ref: stepsContainerRef)
                ├── STEPS_INDIVIDUAL or STEPS_VARIANTES tab strip
                └── Step body:
                    Step1 Info (tabs: info | atributos) · media · descripción
                    Step2 Stock (individual) / Variantes (con variantes)
                    Step3 Precio (costo/margen/iva/precioVenta)
                    Step4 Detalles Finales (título final → SKU) + "Crear Item"
```

---

## 6. Behaviors (itemized)

### Title & type
- Title required, ≤ 60 chars, live counter. Type buttons disabled until valid.
- Selecting a type reveals and scrolls to the stepper; variantes seeds a suggested `skuPadre`.

### Info step
- Two sub-tabs: **info** (categoría, marca, formato de venta, unidades por pack, volumen,
  vencimiento) and **atributos** (`atributosInformativos` key/value list).
- Media: `mediaPhotos[]` with drag-to-reorder (`draggedPhotoIndex`); first photo becomes `foto`.
- SKU field auto-fills from the suggestion until manually edited.

### Stock step
- `stockInicial` / `stockReservado` → `stockDisponible = max(0, inicial − reservado)`.

### Precio step
- Cost/margin/price triangle with settings-aware recalculation (§4.3); IVA defaults to `21`.

### Variantes step (con variantes only)
- Define 1–2 attribute dimensions with tag values; **Generar Variantes** builds the combinations;
  **Nueva Variante** modal adds a manual one. Per-variant stock/price/SKU-suffix editable.
- Editable `skuPadre` (regenerates from title/category if blank on submit).

### Submit
- Individual: build standalone `Item`, unique SKU, persist, success screen.
- Variantes: build parent `Item` + `variants[]`, persist, success screen.
- Errors are caught, logged, and surfaced via `alert(...)`; `isCreating` gates the button
  ("Creando..." / disabled).

### Success screen
- Shows title + final SKU; "Ver Item" navigates to detail; "Crear Otro Item" fully resets state.

---

## 7. Public API surfaces

### `useItems()`
- `items` — used to compute existing SKUs and as the base array for persistence.
- `setItems(items)` — updates hook state after the direct localStorage write.

> This page does **not** use `handleCreateNuevoItem` / `handleCreateNuevoItemConVariantes` /
> `bulkCreateItems`. If you refactor toward those helpers, re-verify SKU de-dup, id prefixes, and
> the `stockio:items-updated` sync path.

### `useAccount()` → `currentAccount`
Scopes the storage key `stockio-items-{currentAccount}`.

### `useSettings()` → `{ catalogo, precios }`
`precios.costoBehavior` (`"preservePrecioFinal"` | other) drives cost/margin/price recalculation.

### SKU / id helpers
`generateStandaloneSKU({category,title})`, `generateUniqueSKU(base, existingSkus)`,
`generateId("STA"|"PAR"|"VAR")`.

### `NuevaVarianteModal`
`isOpen`, `onClose`, and an `onCreate`-style callback wired to `handleNuevaVariante`.

---

## 8. Edge cases & gotchas

1. **Direct persistence.** This page bypasses `useItems` create helpers and writes localStorage
   itself. Any validation/side-effects in those helpers won't run — replicate them if you add
   fields.
2. **SKU auto vs. manual.** `sku` follows the suggestion only until `skuUserModified` flips true;
   `tituloFinal` follows `titulo` until `tituloFinalUserModified` flips. Don't reset these flags
   accidentally.
3. **Unique SKU only at submit.** The visible SKU is a suggestion; uniqueness is enforced by
   `generateUniqueSKU` at submit time — the field may show a value that gets de-duped.
4. **Parents get `skuPrefix`, not `sku`.** Variant full SKUs are composed `{skuPrefix}-{skuSuffix}`.
5. **Max 2 attribute dimensions** for variant generation; combinations are the Cartesian product,
   existing combos are skipped.
6. **Variant name = parent title.** The differentiating value lives in `atributosPrincipales`.
7. **Success reset is exhaustive.** "Crear Otro Item" resets ~30 pieces of state; if you add a
   field, add it to the reset or it will leak into the next creation.
8. **Stock strings / precio numbers** — respect the typing when building objects.
9. **`alert()` on error.** Failure UX is a native alert; consider aligning with the app's toast
   system if you touch this path.
10. **Variant commercial fields are untyped (`(v as any)`).** The `variantItems` state type only
    declares `id, skuSuffix, codigoUniversal, descripcion, foto, variant1, variant2`. The submit
    handler reads `costo / margen / iva / precioFinal / stockInicial / stockReservado` off each row
    via `(v as any)` — they are written dynamically and are **not** in the declared type. If you
    formalize the type, keep these fields or per-variant price/stock will silently become 0.
11. **Individual IVA build fallback is `0`, not `21`.** `iva` state defaults to `"21"`, but the
    standalone submit uses `parseFloat(iva) || 0` — clearing the field persists IVA `0`. (The
    con-variantes path defaults a blank variant IVA to `21`.)

---

## 9. Change-safety checklist

Before editing:
- [ ] Decide whether new fields belong on the standalone object, the parent, and/or each variant.
- [ ] Check the SKU/title auto-sync flags before changing their effects.

After editing:
- [ ] Title gate + type selection still enable/disable correctly.
- [ ] Both flows (Individual, Con Variantes) build valid objects with correct ids/prefixes.
- [ ] Price math matches `precios.costoBehavior` in all three edit directions.
- [ ] Variant generation dedups and respects the 2-dimension cap.
- [ ] Submit persists to `stockio-items-{account}`, `setItems` runs, success screen shows.
- [ ] "Crear Otro Item" fully resets any new state you added.
