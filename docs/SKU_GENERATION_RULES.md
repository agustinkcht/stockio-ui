# 📦 SKU Generation Rules — Stockio

This document defines the **strict rules** for generating SKUs (Stock Keeping Units) for all items in the Stockio inventory management system.

---

## 1. General SKU Structure

All SKUs must follow this format:

\`\`\`
<CATEGORY>-<TITLE>-<ATTR1>-<ATTR2>
\`\`\`

**Rules:**
* All parts are **uppercase**
* Parts are separated by **hyphens (`-`)**
* Each segment has a **maximum length**
* Segments must be **human-readable and pronounceable**, not random hashes

---

## 2. Category Codes (Fixed)

Use **only** the following category prefixes:

| Category       | SKU Code |
|----------------|----------|
| Vinos          | `VNO`    |
| Vino Espumante | `VNOE`   |
| Champagne      | `CHMP`   |
| Licores        | `LICR`   |
| Whiskies       | `WHKY`   |
| Cervezas       | `CVZA`   |

> **The category code always comes first.**

---

## 3. Title Acronym (Product / Line Name)

This represents the **product name or line**, excluding generic words like *vino*, *licor*, *whisky*, etc. (The category already implies that.)

### Rules:
* **Length:** 3 to 7 characters max
* Must be **pronounceable or recognizable**
* Can merge syllables or key consonants
* Inspired by compact naming styles (e.g., Bloomberg terminals)

### Examples:

| Full Name             | Title Acronym |
|-----------------------|---------------|
| Proemio Ícono         | `PROICON`     |
| Proemio Grand Reserve | `PROGRES`     |
| Trapiche Gran Medalla | `TRAPGM`      |
| Jägermeister 700 ml   | `JGRM700`     |
| Sheridan's 700 ml     | `SHER700`     |

> **Do not** split into per-word acronyms.  
> Treat the full title as **one compressed unit**.

---

## 4. Variant Attributes (ATTR1, ATTR2)

These represent **variant-defining attributes** (e.g., varietal, flavor, year).

### ATTR1 (Primary Variant)

* Usually the **primary variant** characteristic
* **Max length:** 4 characters
* **Examples:**

| Attribute            | Code   |
|---------------------|--------|
| Cabernet Sauvignon  | `CABS` |
| Malbec              | `MALB` |
| Syrah               | `SYRA` |
| Original            | `ORIG` |
| Café & Crema        | `CACR` |

### ATTR2 (Secondary Variant)

* Usually **year, size, or secondary variant**
* **Max length:** 4 characters
* **Examples:**

| Attribute  | Code   |
|-----------|--------|
| 2019      | `2019` |
| 2014      | `2014` |
| 700 ml    | `700`  |
| Aged 12   | `12YR` |

---

## 5. Complete Examples

### Wine Variants

\`\`\`
VNO-PROICON-CABS-2019
\`\`\`
= Vino · Proemio Ícono · Cabernet Sauvignon · 2019

\`\`\`
VNO-PROICON-MALB-2019
\`\`\`
= Vino · Proemio Ícono · Malbec · 2019

\`\`\`
VNO-PROGRES-MALB-2019
\`\`\`
= Vino · Proemio Grand Reserve · Malbec · 2019

\`\`\`
VNO-TRAPGM-MALB-2014
\`\`\`
= Vino · Trapiche Gran Medalla · Malbec · 2014

### Liqueur Variants (Standalone)

\`\`\`
LICR-JGRM700-ORIG
\`\`\`
= Licor · Jägermeister 700 ml · Original

\`\`\`
LICR-SHER700-CACR
\`\`\`
= Licor · Sheridan's 700 ml · Café & Crema

### Agrupador (Parent Item)

Parent items (agrupadores) that contain variants use the same structure but without variant attributes:

\`\`\`
VNO-PROICON
\`\`\`
= Vino · Proemio Ícono (parent of all Proemio Ícono variants)

---

## 6. Design Principles (Non-Negotiable)

* ❌ **No random hashes** — SKUs must be deterministic and meaningful
* ❌ **No full words longer than needed** — Keep segments compressed
* ❌ **No repetition of category inside title** — Category is already in prefix
* ✅ **SKUs must be readable by humans** — Pronounceable and recognizable
* ✅ **SKUs must be spoken aloud without confusion** — Clear phonetics
* ✅ **Consistency over perfection** — Follow the pattern strictly

---

## 7. Mental Model

> **"Bloomberg terminal meets retail inventory."**  
> Short, dense, readable, elegant.

The goal is to create SKUs that are:
- **Compact** enough for quick data entry
- **Descriptive** enough to identify the product
- **Consistent** across the entire inventory
- **Professional** and maintainable at scale

---

## 8. Implementation Guidelines

### For New Items:

1. **Identify the category** → Select correct category code
2. **Extract product name** → Create title acronym (3-7 chars)
3. **Determine variant attributes** → Define ATTR1 and ATTR2 (if applicable)
4. **Assemble SKU** → Combine all parts with hyphens
5. **Validate** → Check against existing SKUs for conflicts

### For Variant Items:

- Variants of the same parent **must share** the category and title acronym
- Variants **differ only** in ATTR1 and/or ATTR2
- Each unique combination of attributes creates a distinct SKU

### SKU Uniqueness:

- Every SKU in the system must be **globally unique**
- No two items can share the same SKU
- Parent items and their children have different SKU structures

---

## 9. Edge Cases and Special Considerations

### Non-Vintage Items
If an item doesn't have a year, use a different secondary attribute or omit ATTR2:
\`\`\`
VNO-PROICON-MALB
\`\`\`

### Blends
For wine blends, use the dominant varietal or create a blend code:
\`\`\`
VNO-PROICON-BLND-2019
\`\`\`

### Pack Items
If selling in packs, include pack size in the title acronym:
\`\`\`
CVZA-STEL6PK-ORIG
\`\`\`
= Cerveza · Stella Artois 6-Pack · Original

### Multiple Formats
If the same product comes in different sizes, include size in title:
\`\`\`
LICR-JGRM700-ORIG  (700ml)
LICR-JGRM350-ORIG  (350ml)
\`\`\`

---

## 10. Validation Checklist

Before finalizing a SKU, verify:

- [ ] Category code is from approved list
- [ ] Title acronym is 3-7 characters
- [ ] All parts are uppercase
- [ ] Parts separated by hyphens only
- [ ] ATTR1 is 4 characters or less
- [ ] ATTR2 is 4 characters or less
- [ ] SKU is pronounceable and readable
- [ ] SKU is unique in the system
- [ ] No random characters or hashes

---

## 11. Future Extensions

Potential areas for expansion:

* **Automatic acronym generation rules** — Algorithmic title compression
* **SKU validator service** — Real-time validation in UI
* **SKU conflict detection** — Prevent duplicate SKUs
* **Category expansion** — Add new product categories with codes
* **Barcode integration** — Link SKUs to UPC/EAN codes

---

**Last Updated:** 2025  
**System:** Stockio Inventory Management
