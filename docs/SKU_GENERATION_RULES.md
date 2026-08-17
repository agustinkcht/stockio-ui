# SKU Generation Rules — Stockio

This document defines how SKUs (Stock Keeping Units) are **modeled**, **generated**, and
**stored** for catalog items in Stockio.

It has two layers, and it is important not to confuse them:

1. **The storage model** (Section 1) — how SKUs are physically stored on items and
   variants, and how a variant's full SKU is *computed*. This is ground truth: it is what
   the type system and the creation flow actually do.
2. **The naming convention** (Sections 2–5) — the *aspirational* human-readable format
   (`<CATEGORY>-<TITLE>-<ATTR1>-<ATTR2>`). The auto-generator approximates this, but does
   not reproduce the hand-crafted examples exactly. Divergences are listed in Section 8.

> Source of truth in code: `lib/utils/sku-generator.ts` (generation) and the SKU fields on
> `Item` / `ItemVariant` in `lib/types.ts` (storage). The only screen that generates SKUs
> today is **Nuevo Item** (`app/catalogo/items/nuevo/page.tsx`).

---

## 1. SKU Storage Model (prefix / suffix) — the important part

Stockio has **three kinds of catalog entries**, and each stores its SKU differently.

| Entry kind | Field used | Stores | Full SKU |
|---|---|---|---|
| **Standalone item** | `Item.sku` | the complete SKU | `sku` as-is |
| **Parent / agrupador** (`hasVariants: true`) | `Item.skuPrefix` | only the **prefix** ("SKU padre") | the prefix is not a sellable SKU by itself |
| **Child / variant** (`ItemVariant`) | `ItemVariant.skuSuffix` | only the **suffix** | **computed** as `` `${parent.skuPrefix}-${child.skuSuffix}` `` |

### Key rules

- A **parent never has a `sku`** — it has a `skuPrefix`. Do not look up or display a parent
  by `sku`; use `skuPrefix` (and identify the record by `id`).
- A **child never stores its full SKU** — it stores only `skuSuffix`. The full, sellable
  SKU is always **derived at read time** by joining the parent prefix and the child suffix
  with a hyphen.
- `ItemVariant.sku` still exists but is **`@deprecated`** — it is kept only for backwards
  compatibility with older records. New code must read/write `skuSuffix`.

### Diagram

```text
Standalone item
  Item.sku = "VNO-PROEMIO"                → full SKU: VNO-PROEMIO

Parent (agrupador)
  Item.skuPrefix = "VNO-PROEMIO"          → prefix only, not sold directly
   ├── Variant A  skuSuffix = "malbec"    → full SKU: VNO-PROEMIO-malbec
   └── Variant B  skuSuffix = "cabernet"  → full SKU: VNO-PROEMIO-cabernet
```

> Note the case: the generator produces an **UPPERCASE prefix** but **lowercase,
> hyphenated suffixes** (see Section 5). So real computed variant SKUs are currently mixed
> case, e.g. `VNO-PROEMIO-malbec`. This diverges from the "all uppercase" convention — see
> Section 8.

### `id` is not `sku`

Every entry also has an internal `id` (minted by `generateId` with a type tag —
`STA` standalone, `PAR` parent, `VAR` variant, e.g. `STA-1712...`). The `id` is the stable
identity used for lookup, selection, and deletion. The `sku` / `skuPrefix` / `skuSuffix`
are the human-facing codes and can be edited by the user. Never treat `sku` as a primary
key.

---

## 2. Naming convention — target format

The generator aims for this shape:

```text
<CATEGORY>-<TITLE>-<ATTR1>-<ATTR2>
```

- Segments are separated by hyphens (`-`).
- `<CATEGORY>` and `<TITLE>` are always present; `<ATTR1>` / `<ATTR2>` are optional.
- The convention is that segments are uppercase and human-readable (see divergences in
  Section 8 for where the code differs today).

---

## 3. Category Codes (fixed)

`generateStandaloneSKU` / `generateParentSKU` map the item `categoria` to a fixed code via
the `CATEGORY_CODES` table:

| Category (`categoria`) | SKU Code |
|---|---|
| `vinos` | `VNO` |
| `vino-espumante` | `VNOE` |
| `champagne` | `CHMP` |
| `licores` | `LICR` |
| `whiskies` | `WHKY` |
| `cervezas` | `CVZA` |

Rules enforced by the code:

- The lookup is **case-insensitive** on the category key.
- If the category is missing or **not in the table, the category segment is simply
  omitted** — the SKU then starts with the title acronym. (Only these six categories are
  recognized today.)
- When present, the category code always comes first.

---

## 4. Title Acronym — actual algorithm

`generateTitleAcronym(title)` builds the `<TITLE>` segment. Actual behavior:

1. **Strip generic words** (case-insensitive): `vino`, `licor`, `whisky`, `cerveza`,
   `champagne`, `ml`, `litro`, `botella`.
2. **Normalize** — remove accents/diacritics and any non-alphanumeric characters.
3. **Compress:**
   - **Single word** → uppercased; if longer than 7 chars, truncated to the first 7.
   - **Multiple words** → for each word, take up to its first 3 characters, uppercase, and
     concatenate them all; then cap the result to 7 chars. Words of length ≤3 are kept
     whole.
4. **Length guard** — pad to a minimum of 3 chars with `X` if somehow shorter.

So the acronym is **algorithmic**, not curated. Examples of *actual output*:

| Title | Actual generated acronym |
|---|---|
| `Proemio Ícono` | `PROICO` (`PRO` + `ICO`) |
| `Trapiche Gran Medalla` | `TRAGRAM` (`TRA`+`GRA`+`MED` → capped to 7) |
| `Jägermeister` | `JAGERME` (single word, first 7) |

> These differ from the older hand-written examples (`PROICON`, `TRAPGM`, `JGRM700`). The
> code does not merge syllables intelligently or embed sizes — treat the curated examples
> in Section 7 as the *ideal*, not as generator output.

---

## 5. Attribute segments — two different code paths

There are **two** ways attribute codes get produced, and they behave differently.

### 5a. `generateAttributeCode` (max 4 chars) — convention helper

`generateStandaloneSKU` accepts optional `attr1` / `attr2`. Each is passed through
`generateAttributeCode`, which:

- normalizes (strips accents + non-alphanumerics), uppercases;
- if it is a 4-digit year → keeps it as-is (e.g. `2019`);
- if numeric → first 4 digits;
- otherwise → first 4 letters (e.g. `Cabernet Sauvignon` → `CABS`).

This produces the tidy `VNO-TITLE-CABS-2019` shape.

> **However:** the current Nuevo Item screen does **not** pass `attr1`/`attr2` when it
> generates SKUs. So `generateAttributeCode` is effectively **unused by the live creation
> flow** today — it only runs if a caller explicitly supplies attributes.

### 5b. Variant `skuSuffix` — what actually happens for variants

When variants are generated in Nuevo Item, the suffix is built directly from the raw
attribute **values**, not from `generateAttributeCode`:

```text
skuSuffix = value.toLowerCase().replace(/\s+/g, "-")
```

- **One attribute:** `skuSuffix = variant1` lowercased, spaces → hyphens.
  e.g. `Malbec` → `malbec`, `Cabernet Sauvignon` → `cabernet-sauvignon`.
- **Two attributes:** the two values joined the same way.
  e.g. `Malbec` + `2019` → `malbec-2019`.

So variant suffixes are **lowercase, full-word, and can contain multiple hyphens** — they
are not the 4-char uppercase codes described by the convention. The full computed SKU ends
up like `VNO-PROEMIO-cabernet-sauvignon`.

---

## 6. How the creation flow generates SKUs (Nuevo Item)

### Standalone item

1. As the user types the title/category, a **suggested SKU** is computed live:
   `generateStandaloneSKU({ category, title })` (no attributes passed).
2. The suggestion auto-fills the SKU input until the user edits it manually
   (`skuUserModified` then stops the auto-sync).
3. On create, the entered SKU is made unique via `generateUniqueSKU(sku, existingSkus)`
   and stored as `Item.sku`.

### Parent + variants (agrupador)

1. Selecting the "variantes" type seeds **`skuPadre`** with
   `generateStandaloneSKU({ category, title })`. The user can edit `skuPadre`.
2. Each generated variant gets a `skuSuffix` from its attribute value(s) (Section 5b).
3. On create:
   - the parent is stored with **`skuPrefix = skuPadre`** (falling back to a freshly
     generated prefix if empty);
   - each variant is stored with its **`skuSuffix`** (falling back to
     `variant1` lowercased if the suffix is empty).
4. The full variant SKU is **never stored** — it is computed as
   `` `${skuPrefix}-${skuSuffix}` `` wherever it needs to be displayed.

> The parent uses `generateStandaloneSKU` (there is also a `generateParentSKU` helper that
> does the same `CATEGORY-TITLE` job; the live flow currently calls the standalone one).

---

## 7. Uniqueness

- `isSkuUnique(sku, existing)` → membership check.
- `generateUniqueSKU(base, existing)` → if `base` collides, appends `-2`, then `-3`, … until
  free.
- **Only standalone `sku` is de-duplicated at creation.** Parent `skuPrefix` and variant
  `skuSuffix` are **not** run through the uniqueness check, so nothing structurally
  guarantees a globally unique *computed* variant SKU. Treat cross-module SKU uniqueness as
  a **known gap** (see the debt register in `DATA_FLOW_AND_RELATIONSHIPS.md`).

---

## 8. Divergences between the convention and the current code

These are the intentional-to-note gaps so future work (or an AI editing this) doesn't
"fix" the doc to describe behavior that isn't there:

1. **Case:** convention says all-uppercase; variant **suffixes are lowercase**, so computed
   variant SKUs are mixed case (`VNO-PROEMIO-malbec`).
2. **Attribute length:** convention caps attrs at 4 chars via `generateAttributeCode`; the
   live variant path uses **full lowercased words** instead and can include multiple
   hyphens.
3. **Curated acronyms:** examples like `PROICON` / `TRAPGM` / `JGRM700` are **not** what the
   algorithm outputs (see Section 4). No size/format embedding happens automatically.
4. **`generateAttributeCode` is dormant** in the UI — Nuevo Item never passes `attr1`/`attr2`.
5. **`validateSKU` would reject real variant SKUs** — it requires all-uppercase and attr
   segments ≤4 chars, which lowercased multi-word suffixes violate. It is a convention
   validator, not a validator of what the app currently generates.
6. **Uniqueness only covers standalone `sku`** (Section 7).

---

## 9. Examples

### Ideal convention (target, hand-written)

```text
VNO-PROICON-CABS-2019     Vino · Proemio Ícono · Cabernet Sauvignon · 2019
LICR-JGRM700-ORIG         Licor · Jägermeister 700 ml · Original
VNO-PROICON               (parent prefix for all Proemio Ícono variants)
```

### Actual output today (generator + variant suffixes)

```text
Standalone:  VNO-PROICO                       (category VNO + acronym of "Proemio Ícono")
Parent:      skuPrefix = "VNO-PROICO"
  Variant:   skuSuffix = "malbec"      → full: VNO-PROICO-malbec
  Variant:   skuSuffix = "malbec-2019" → full: VNO-PROICO-malbec-2019
```

---

## 10. Implementation reference

| Symbol | File | Role |
|---|---|---|
| `CATEGORY_CODES` | `lib/utils/sku-generator.ts` | category → code map (6 categories) |
| `generateTitleAcronym` | same | builds `<TITLE>` (internal) |
| `generateAttributeCode` | same | 4-char attr code (internal; dormant in UI) |
| `generateStandaloneSKU` | same | `CATEGORY-TITLE[-ATTR1[-ATTR2]]`; used for standalone SKU **and** parent prefix seed |
| `generateParentSKU` | same | `CATEGORY-TITLE` (equivalent parent helper) |
| `validateSKU` | same | convention validator (see Section 8.5) |
| `isSkuUnique` / `generateUniqueSKU` | same | uniqueness (standalone only) |
| `Item.sku` / `Item.skuPrefix` | `lib/types.ts` | standalone SKU / parent prefix |
| `ItemVariant.skuSuffix` (+ deprecated `sku`) | `lib/types.ts` | variant suffix |
| SKU generation UI | `app/catalogo/items/nuevo/page.tsx` | the only screen that mints SKUs |

---

## 11. Validation checklist (for authoring SKUs by the convention)

- [ ] Category code is from the approved 6-entry list (or intentionally omitted).
- [ ] Title acronym is 3–7 characters.
- [ ] Parent stores `skuPrefix`, not `sku`.
- [ ] Variants store `skuSuffix` only; full SKU is `prefix-suffix`.
- [ ] Standalone `sku` is unique after `generateUniqueSKU`.
- [ ] You did not rely on a variant's deprecated `sku` field.

---

**System:** Stockio Inventory Management (mock / localStorage mode)
