# Items Format Guide - Enriched Edition

**Complete Reference for Creating Item Datasets in Stockio**

This comprehensive guide provides detailed information about item types, field structures, inheritance rules, and complete examples for creating datasets in the Stockio inventory management system.

---

## Table of Contents

1. [Overview](#overview)
2. [Item Types](#item-types)
3. [Complete Field Reference](#complete-field-reference)
4. [Inheritance System](#inheritance-system)
5. [Complete Examples](#complete-examples)
6. [Best Practices](#best-practices)

---

## Overview

Stockio supports two fundamental item structures:

1. **Standalone Items** - Single products without variations
2. **Container Items (Agrupadores)** - Parent items with multiple variants

The system uses a sophisticated inheritance model where parent items define shared characteristics and variants inherit or override specific attributes based on well-defined rules.

---

## Item Types

### 1. Standalone Items

**Definition:** Independent products that do not have variants.

**Key Characteristics:**
- Complete product definition in a single object
- Can have both `atributosPrincipales` and `atributosInformativos`
- All fields are directly editable
- No inheritance concerns

**When to Use:**
- Unique products with no variations
- Products that don't need to be grouped with similar items
- Simple inventory items

**Identification in Data:**
```typescript
{
  hasVariants: false,
  isAgrupador: false,
  // No variants array
  // No containerAtributosPrincipales
}
```

---

### 2. Container Items (Agrupadores/Parents)

**Definition:** Parent items that group multiple related variants together.

**Key Characteristics:**
- Defines shared information inherited by all variants
- Uses `containerAtributosPrincipales` to define the variant matrix
- Cannot have direct stock (stock lives in variants)
- Defines attributes that variants must follow

**When to Use:**
- Products with multiple variations (size, color, year, etc.)
- Product lines with shared characteristics
- Items that need centralized management of shared attributes

**Identification in Data:**
```typescript
{
  hasVariants: true,
  isAgrupador: true,
  variants: [...],  // Array of variant items
  containerAtributosPrincipales: [...],  // Defines variant matrix
  // Has most info fields but NO codigoProveedor
}
```

---

### 3. Variant Items (Children/Sons)

**Definition:** Individual products that belong to a container/parent item.

**Key Characteristics:**
- Inherit most information from parent
- Select specific values from parent's `containerAtributosPrincipales`
- Can have unique `codigoProveedor` and stock
- Can override or extend `atributosInformativos` from parent

**When to Use:**
- Always created as children of container items
- Represent specific combinations of parent's attributes
- Individual SKUs within a product line

**Identification in Data:**
```typescript
// Exists inside parent's variants array
variants: [
  {
    name: "...",  // Usually same as parent
    sku: "...",   // Unique identifier
    atributosPrincipales: [...],  // Specific values from parent's matrix
    // Inherits locked fields from parent
  }
]
```

---

## Complete Field Reference

### Core Identification Fields

| Field | Type | Required | Description | Present In |
|-------|------|----------|-------------|-----------|
| `name` | string | Yes | Product name | All items |
| `sku` | string | Yes | Stock Keeping Unit - unique identifier | Standalone, Variants (Optional in Parent) |
| `codigoUniversal` | string | No | Universal barcode (UPC/EAN) | Standalone, Variants |
| `categoria` | string | Yes | Product category | All items |
| `marca` | string | Yes | Brand name | All items |

---

### Stock Fields

| Field | Type | Required | Description | Present In |
|-------|------|----------|-------------|-----------|
| `stock.total` | string | Yes | Total stock quantity | Standalone, Variants |
| `stock.reservado` | string | Yes | Reserved stock quantity | Standalone, Variants |
| `stock.disponible` | string | Yes | Available stock quantity | Standalone, Variants |

**Note:** Container/parent items do NOT have stock. Stock is managed at the variant level.

---

### Presentation Fields (Volumen)

| Field | Type | Required | Description | Present In |
|-------|------|----------|-------------|-----------|
| `formatoVenta` | "unidad" \| "pack" | Yes | Sales format | All items |
| `volumenActive` | boolean | No | Whether volume is relevant | All items |
| `volumenCantidad` | number | No | Volume quantity (e.g., 750) | All items |
| `volumenUnidad` | string | No | Volume unit (e.g., "ml", "L", "kg") | All items |

**Special Behavior:**
- When `formatoVenta` is "unidad": `unidadesPorPack` is locked to "1"
- When `formatoVenta` is "pack": `unidadesPorPack` can be edited (defaults to "1")

---

### Supplier Information Fields

| Field | Type | Required | Description | Present In |
|-------|------|----------|-------------|-----------|
| `proveedor` | string | No | Supplier name | All items |
| `codigoProveedor` | string | No | Supplier's internal code | Standalone, Variants ONLY |

**Important:** `codigoProveedor` is NEVER present in parent/container items. It's unique per variant or standalone item.

---

### Structure Control Fields

| Field | Type | Required | Description | Present In |
|-------|------|----------|-------------|-----------|
| `hasVariants` | boolean | Yes | Whether item has variants | All items |
| `isAgrupador` | boolean | Yes | Whether item is a container/parent | All items |
| `variantCount` | number | No | Number of variants (can be logical max) | Parents only |
| `variants` | ItemVariant[] | Conditional | Array of variant items | Parents only |

---

### Attributes Fields

#### For Standalone and Variant Items:

| Field | Type | Description |
|-------|------|-------------|
| `atributosPrincipales` | Atributo[] | Principal/differentiating attributes (key-value pairs) |
| `atributosInformativos` | Atributo[] | Informational attributes (key-value pairs) |

#### For Container/Parent Items:

| Field | Type | Description |
|-------|------|-------------|
| `containerAtributosPrincipales` | ContainerAtributo[] | Defines variant matrix (key with multiple variantes) |
| `atributosInformativos` | Atributo[] | Informational attributes inherited by variants |

**Type Definitions:**
```typescript
interface Atributo {
  key: string    // Attribute name
  value: string  // Attribute value
}

interface ContainerAtributo {
  key: string        // Attribute name
  variantes: string[]  // Array of all possible values
}
```

---

## Inheritance System

The inheritance system defines how information flows from parent items to their variants. Different field groups follow different inheritance rules.

---

### 1. Info Segment Inheritance

The info segment consists of three subsections with distinct inheritance behaviors:

#### 1.1 Información del Producto (Strict - Always Locked)

**Fields:** `name`, `categoria`, `marca`

**Inheritance Rule:** **Strict inheritance - Always locked in children**

**Behavior:**
- Parent defines these values (can be empty string)
- Children automatically inherit exact values
- Children CANNOT edit these fields (shown as disabled in UI)
- Applies regardless of whether parent value is filled or empty

**Example:**
```typescript
// Parent (Agrupador)
{
  name: "Vino Proemio",
  categoria: "Vinos",
  marca: "Norton"
}

// Variant 1 - Inherits locked
{
  name: "Vino Proemio",      // Locked, cannot edit
  categoria: "Vinos",        // Locked, cannot edit
  marca: "Norton"            // Locked, cannot edit
  // These fields shown as disabled in UI
}

// Variant 2 - Same inheritance
{
  name: "Vino Proemio",      // Locked, cannot edit
  categoria: "Vinos",        // Locked, cannot edit
  marca: "Norton"            // Locked, cannot edit
}
```

---

#### 1.2 Presentación (Strict - Always Locked)

**Fields:** `formatoVenta`, `volumenActive`, `volumenCantidad`, `volumenUnidad`

**Inheritance Rule:** **Strict inheritance - Always locked in children**

**Behavior:**
- Parent defines presentation format
- Children automatically inherit exact values
- Children CANNOT edit these fields (shown as disabled in UI)
- All variants must have same presentation format

**Example:**
```typescript
// Parent (Agrupador)
{
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml"
}

// All Variants - Inherit locked
{
  formatoVenta: "unidad",      // Locked
  volumenActive: true,         // Locked
  volumenCantidad: 750,        // Locked
  volumenUnidad: "ml"          // Locked
  // These fields shown as disabled in UI
}
```

---

#### 1.3 Información del Proveedor (Flexible)

**Fields:** `proveedor` (in parent and children), `codigoProveedor` (children only)

**Inheritance Rule:** **Flexible - Depends on parent value**

##### Case A: Proveedor Filled in Parent (Locked)

```typescript
// Parent (Agrupador)
{
  proveedor: "Bodega Norton"
  // NO codigoProveedor field in parent
}

// Variant 1
{
  proveedor: "Bodega Norton",    // Locked (inherited from parent)
  codigoProveedor: "NORTON-001"  // Editable (unique per variant)
}

// Variant 2
{
  proveedor: "Bodega Norton",    // Locked (same as parent)
  codigoProveedor: "NORTON-002"  // Editable (different from variant 1)
}
```

**Behavior:** When parent has `proveedor` value, children inherit it as locked field.

---

##### Case B: Proveedor Empty in Parent (Editable)

```typescript
// Parent (Agrupador)
{
  proveedor: ""  // Empty string
  // NO codigoProveedor field in parent
}

// Variant 1
{
  proveedor: "Distribuidor A",   // Editable (can set individually)
  codigoProveedor: "DIST-A-001"  // Editable (unique per variant)
}

// Variant 2
{
  proveedor: "Distribuidor B",   // Editable (can be different)
  codigoProveedor: "DIST-B-001"  // Editable (unique per variant)
}
```

**Behavior:** When parent has empty `proveedor`, children can set their own values.

---

##### Important: codigoProveedor Field

**Key Rules:**
- `codigoProveedor` is NEVER defined in parent/agrupador items
- It only exists in standalone items and variant items
- Each child can have its own unique supplier code
- Always editable in children (never inherited or locked)

---

#### Info Segment Summary Table

| Field Group | Parent Defines | Inheritance Type | Children Can Edit? | Locked When? |
|-------------|---------------|------------------|-------------------|--------------|
| **Información del Producto** | name, categoria, marca | Strict | ❌ Never | ✅ Always locked |
| **Presentación** | formatoVenta, volumen* | Strict | ❌ Never | ✅ Always locked |
| **Proveedor** (filled) | proveedor = "value" | Strict | ❌ No | ✅ When parent has value |
| **Proveedor** (empty) | proveedor = "" | Flexible | ✅ Yes | ❌ When parent is empty |
| **Código Proveedor** | N/A (not in parent) | N/A | ✅ Yes | ❌ Never locked |

---

### 2. Atributos Informativos Inheritance (Three Cases)

Atributos informativos provide additional product information and follow a flexible three-case inheritance model.

---

#### Case 1: Locked Key-Value Inheritance

**Definition:** Parent defines both key AND value - children inherit complete pair (locked).

**Parent Structure:**
```typescript
atributosInformativos: [
  { key: "Bodega", value: "Trapiche" },
  { key: "Origen", value: "Mendoza" }
]
```

**Child Structure:**
```typescript
// Children do NOT redefine these attributes
// They automatically inherit and display them as locked
```

**UI Behavior:**
- Attributes appear in child's detail view
- Fields are disabled/read-only
- Values cannot be modified

**Example - Complete Flow:**
```typescript
// Parent: Vino Trapiche Gran Medalla
{
  name: "Vino Trapiche Gran Medalla",
  atributosInformativos: [
    { key: "Bodega", value: "Trapiche" },
    { key: "Origen", value: "Valle de Uco, Mendoza" },
    { key: "Graduación Alcohólica", value: "14,5%" },
    { key: "Enólogo", value: "Daniel Pi" }
  ]
}

// Variant: Malbec 2014
{
  sku: "VINO-TRAP-GRAN-MEDA-MALB-2014",
  // Does NOT include atributosInformativos for locked attributes
  // UI automatically shows inherited attributes as read-only:
  // - Bodega: Trapiche (locked)
  // - Origen: Valle de Uco, Mendoza (locked)
  // - Graduación Alcohólica: 14,5% (locked)
  // - Enólogo: Daniel Pi (locked)
}
```

---

#### Case 2: Key-Only Inheritance (Empty Values)

**Definition:** Parent defines key with empty value - children can fill in their own values.

**Parent Structure:**
```typescript
atributosInformativos: [
  { key: "Bodega", value: "Trapiche" },           // Case 1: Locked
  { key: "Tiempo en Barrica", value: "" }         // Case 2: Empty (children define)
]
```

**Child Structure:**
```typescript
atributosInformativos: [
  { key: "Tiempo en Barrica", value: "18 meses" }  // Fills parent's empty value
]
```

**UI Behavior:**
- Parent-defined locked attributes appear as read-only
- Empty-value attributes from parent appear as editable fields
- Each child can have different values for the empty-value keys

**Example - Complete Flow:**
```typescript
// Parent: Vino Trapiche Gran Medalla
{
  name: "Vino Trapiche Gran Medalla",
  atributosInformativos: [
    { key: "Bodega", value: "Trapiche" },           // Locked for all
    { key: "Origen", value: "Valle de Uco" },       // Locked for all
    { key: "Tiempo en Barrica", value: "" },        // Empty - children define
    { key: "Potencial de Guarda", value: "" }       // Empty - children define
  ]
}

// Variant 1: Malbec 2014
{
  sku: "VINO-TRAP-GRAN-MEDA-MALB-2014",
  atributosInformativos: [
    { key: "Tiempo en Barrica", value: "18 meses" },
    { key: "Potencial de Guarda", value: "12 años" }
  ]
  // UI shows:
  // - Bodega: Trapiche (locked, from parent)
  // - Origen: Valle de Uco (locked, from parent)
  // - Tiempo en Barrica: 18 meses (editable, defined by variant)
  // - Potencial de Guarda: 12 años (editable, defined by variant)
}

// Variant 2: Cabernet Sauvignon 2020
{
  sku: "VINO-TRAP-GRAN-MEDA-CABE-SAUV-2020",
  atributosInformativos: [
    { key: "Tiempo en Barrica", value: "12 meses" },   // Different value
    { key: "Potencial de Guarda", value: "10 años" }   // Different value
  ]
  // UI shows:
  // - Bodega: Trapiche (locked, from parent)
  // - Origen: Valle de Uco (locked, from parent)
  // - Tiempo en Barrica: 12 meses (editable, different from variant 1)
  // - Potencial de Guarda: 10 años (editable, different from variant 1)
}
```

---

#### Case 3: Variant-Exclusive Attributes

**Definition:** Attributes NOT defined in parent - specific children can add unique attributes.

**Parent Structure:**
```typescript
atributosInformativos: [
  { key: "Bodega", value: "Trapiche" },
  { key: "Origen", value: "Valle de Uco" }
  // NO "Etiqueta" attribute defined
]
```

**Child Structure:**
```typescript
// Most children don't include "Etiqueta"

// But one specific child adds it:
atributosInformativos: [
  { key: "Tiempo en Barrica", value: "12 meses" },
  { key: "Etiqueta", value: "Roja" }  // Exclusive to this variant only
]
```

**UI Behavior:**
- Exclusive attributes only appear for the specific variant that defines them
- Do not appear in parent or sibling variants
- Fully editable (not locked)

**Example - Complete Flow:**
```typescript
// Parent: Vino Trapiche Gran Medalla
{
  name: "Vino Trapiche Gran Medalla",
  atributosInformativos: [
    { key: "Bodega", value: "Trapiche" },
    { key: "Origen", value: "Valle de Uco" },
    { key: "Tiempo en Barrica", value: "" }
    // NO "Etiqueta" attribute
  ]
}

// Variant 1: Malbec 2014
{
  sku: "VINO-TRAP-GRAN-MEDA-MALB-2014",
  atributosInformativos: [
    { key: "Tiempo en Barrica", value: "18 meses" }
    // NO "Etiqueta" - not relevant for this variant
  ]
  // UI shows:
  // - Bodega: Trapiche (locked)
  // - Origen: Valle de Uco (locked)
  // - Tiempo en Barrica: 18 meses (editable)
  // - No "Etiqueta" field
}

// Variant 2: Cabernet Sauvignon 2020
{
  sku: "VINO-TRAP-GRAN-MEDA-CABE-SAUV-2020",
  atributosInformativos: [
    { key: "Tiempo en Barrica", value: "12 meses" },
    { key: "Etiqueta", value: "Roja" }  // EXCLUSIVE to this variant
  ]
  // UI shows:
  // - Bodega: Trapiche (locked)
  // - Origen: Valle de Uco (locked)
  // - Tiempo en Barrica: 12 meses (editable)
  // - Etiqueta: Roja (editable, unique to this variant)
}
```

**Use Case:** Special editions, limited runs, or variants with unique characteristics not shared with siblings.

---

#### Atributos Informativos Merge Logic

When displaying/editing a variant, the system merges parent and variant attributes:

**Merge Algorithm:**
1. Start with parent's `atributosInformativos` array
2. Add variant's `atributosInformativos` array
3. If same key exists in both:
   - If parent value is NOT empty → parent value wins (locked in UI)
   - If parent value IS empty → variant value wins (editable in UI)
4. New keys from variant → added as variant-exclusive (editable in UI)

**Final Display:**
- Parent locked attributes (Case 1) → shown as read-only
- Parent empty keys filled by variant (Case 2) → shown as editable
- Variant-exclusive attributes (Case 3) → shown as editable

---

### 3. Atributos Principales Inheritance (Strict System)

Atributos principales define what makes each variant unique. They follow a strict, parent-defined system.

**Key Principle:** The parent creates a fixed matrix of possible variants. Children can ONLY select from this matrix.

---

#### Parent Structure: containerAtributosPrincipales

**Format:**
```typescript
containerAtributosPrincipales: [
  { 
    key: "AttributeName",
    variantes: ["Value1", "Value2", "Value3"]  // Array of ALL possible values
  }
]
```

**Purpose:**
- Defines which attributes differentiate variants
- Lists ALL possible values for each attribute
- Creates a matrix of possible variant combinations

---

#### Child Structure: atributosPrincipales

**Format:**
```typescript
atributosPrincipales: [
  { 
    key: "AttributeName",  // Must match parent key
    value: "Value1"        // Single value from parent's variantes array
  }
]
```

**Purpose:**
- Selects ONE specific value from each parent attribute
- Creates unique combination that identifies this variant
- Cannot add attributes not defined by parent

---

#### Case 1: Two Atributos Principales (Standard Matrix)

**Definition:** Parent defines TWO attributes - creates 2D matrix of variants.

**Example:**
```typescript
// Parent: Vino Proemio
{
  name: "Vino Proemio",
  containerAtributosPrincipales: [
    { 
      key: "Varietal", 
      variantes: ["Malbec", "Cabernet Sauvignon", "Cabernet Franc", "Syrah"] 
    },
    { 
      key: "Año", 
      variantes: ["2019", "2014"] 
    }
  ]
}

// Logical matrix: 4 varietals × 2 years = 8 possible variants

// Variant 1: Malbec 2019
{
  sku: "VINO-PROE-MALB-2019",
  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" },      // Picks from parent's variantes
    { key: "Año", value: "2019" }              // Picks from parent's variantes
  ]
}

// Variant 2: Malbec 2014
{
  sku: "VINO-PROE-MALB-2014",
  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" },      // Same varietal
    { key: "Año", value: "2014" }              // Different year
  ]
}

// Variant 3: Cabernet Sauvignon 2019
{
  sku: "VINO-PROE-CABE-SAUV-2019",
  atributosPrincipales: [
    { key: "Varietal", value: "Cabernet Sauvignon" },  // Different varietal
    { key: "Año", value: "2019" }                       // Same year
  ]
}

// ... and so on for all 8 combinations
```

**Rules:**
- Each variant MUST have exactly 2 atributos principales
- Each must select one value from parent's variantes
- Together they create a unique combination

---

#### Case 2: One Atributo Principal (Single Differentiator)

**Definition:** Parent defines ONLY ONE attribute - variants differ by single characteristic.

**Example:**
```typescript
// Parent: Champagne Collection
{
  name: "Champagne Collection",
  containerAtributosPrincipales: [
    { 
      key: "Varietal", 
      variantes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"] 
    }
    // ONLY ONE attribute defined
  ]
}

// Logical matrix: 3 varietals × 1 attribute = 3 possible variants

// Variant 1: Chardonnay
{
  sku: "CHAMP-COLL-CHAR",
  atributosPrincipales: [
    { key: "Varietal", value: "Chardonnay" }
    // ONLY ONE atributo principal
    // CANNOT add "Año" or any other attribute
  ]
}

// Variant 2: Pinot Noir
{
  sku: "CHAMP-COLL-PINO-NOIR",
  atributosPrincipales: [
    { key: "Varietal", value: "Pinot Noir" }
    // ONLY ONE atributo principal
  ]
}
```

**Rules:**
- Variants can ONLY have 1 atributo principal (matching parent)
- Variants CANNOT add additional attributes
- Only the parent can define which attributes exist

---

#### Case 3: Invalid/Empty Attributes (Ignored)

**Definition:** If parent has attribute with empty `variantes` array, it's invalid and ignored.

**Example:**
```typescript
// Parent: Bad Configuration
{
  name: "Product with Issues",
  containerAtributosPrincipales: [
    { 
      key: "Varietal", 
      variantes: ["Malbec", "Cabernet"] 
    },
    { 
      key: "Región", 
      variantes: []  // EMPTY - INVALID
    }
  ]
}

// System should filter out "Región" attribute

// Variant: Valid Configuration
{
  sku: "PROD-MALB",
  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" }
    // "Región" NOT included because parent had empty variantes
  ]
}
```

**Rules:**
- Attributes with `variantes: []` are considered invalid
- System should filter them out when processing
- Variants should NOT include these attributes

---

#### Atributos Principales Rules Summary

| Rule | Description | Can Do? |
|------|-------------|---------|
| **Parent Defines All** | Only parent can define which attributes exist | ✅ Always |
| **Children Select Only** | Children can only pick from parent's variantes | ✅ Always |
| **No Child Additions** | Children cannot add new attributes | ❌ Never |
| **No Empty Variantes** | Attributes with empty variantes are invalid | ❌ Invalid |
| **Fixed Matrix** | Parent creates complete matrix of possibilities | ✅ Always |
| **Format Difference** | Parent uses variantes:[], children use value:"" | ✅ Required |

---

#### Comparison: Principales vs Informativos

| Aspect | Atributos Principales | Atributos Informativos |
|--------|----------------------|------------------------|
| **Purpose** | Differentiate variants | Provide shared/additional info |
| **Parent Format** | `variantes: []` (array) | `value: ""` (single or empty) |
| **Child Format** | `value: ""` (single selection) | `value: ""` (can override/add) |
| **Inheritance** | Strict - keys only, select values | Flexible - 3 cases (locked/fill/add) |
| **Child Additions** | ❌ Cannot add new attributes | ✅ Can add exclusive attributes |
| **Matrix Creation** | ✅ Yes - defines variant combinations | ❌ No - descriptive only |

---

## Complete Examples

This section provides complete, real-world examples of each item type with all fields and inheritance rules demonstrated.

---

### Example 1: Standalone Item (No Variants)

**Use Case:** A unique champagne product without variations.

```typescript
{
  // Core identification
  name: "Champagne Domiciano",
  sku: "CHAM-DOMI-CHAR-2019",
  codigoUniversal: "7501234567890",
  categoria: "Champagne",
  marca: "Domiciano",

  // Structure control
  hasVariants: false,
  isAgrupador: false,

  // Stock management
  stock: {
    total: "45",
    reservado: "8",
    disponible: "37"
  },

  // Supplier information
  proveedor: "Distribuidora Premium",
  codigoProveedor: "DP-CHAM-001",

  // Presentation
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  // Principal attributes (differentiating characteristics)
  atributosPrincipales: [
    { key: "Varietal", value: "Chardonnay" },
    { key: "Año", value: "2019" }
  ],

  // Informational attributes (additional product info)
  atributosInformativos: [
    { key: "Dosaje", value: "Brut" },
    { key: "Bodega", value: "Domiciano" },
    { key: "Origen", value: "Mendoza, Argentina" },
    { key: "Método de Elaboración", value: "Charmat" },
    { key: "Graduación Alcohólica", value: "12%" },
    { key: "Perfil Sensorial", value: "Fresco y Frutado" },
    { key: "Potencial de Guarda", value: "3 años" },
    { key: "Temperatura de Servicio", value: "6–8°C" }
  ]
}
```

**Key Points:**
- All fields are directly editable
- Has both atributosPrincipales and atributosInformativos
- Includes codigoProveedor (only in standalone/variants)
- Has stock at this level (no variants)
- Complete standalone product definition

---

### Example 2: Container Item with Variants (Complete System)

**Use Case:** A wine product line with multiple varietals and years.

#### Parent Item (Agrupador):

```typescript
{
  // Core identification
  name: "Vino Proemio",
  sku: "VINO-PROE",  // Optional in parent
  categoria: "Vinos",
  marca: "Norton",

  // Structure control
  hasVariants: true,
  isAgrupador: true,
  variantCount: 8,  // 4 varietals × 2 years

  // Supplier information (inherited by all variants)
  proveedor: "Bodega Norton",
  // NO codigoProveedor field in parent

  // Presentation (inherited by all variants)
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  // Container attributes - Defines variant matrix
  containerAtributosPrincipales: [
    { 
      key: "Varietal", 
      variantes: ["Malbec", "Cabernet Sauvignon", "Cabernet Franc", "Syrah"] 
    },
    { 
      key: "Año", 
      variantes: ["2019", "2014"] 
    }
  ],
  
  // Informational attributes - Mixed inheritance
  atributosInformativos: [
    // Case 1: Locked inheritance (all variants get these locked)
    { key: "Tipo", value: "Tinto" },
    { key: "Línea", value: "Proemio" },
    { key: "Bodega", value: "Norton" },
    { key: "Origen", value: "Luján de Cuyo, Mendoza" },
    { key: "Graduación Alcohólica", value: "14%" },
    { key: "Temperatura de Servicio", value: "16-18°C" },
    { 
      key: "Perfil Sensorial", 
      value: "Tinto de cuerpo medio a intenso, con notas a fruta roja madura, especias y sutiles toques de roble."
    },
    { key: "Enólogo", value: "David Bonomi" },
    
    // Case 2: Empty values (variants can fill these)
    { key: "Crianza", value: "" },
    { key: "Potencial de Guarda", value: "" }
  ],

  // Variants array
  variants: [
    // See individual variants below
  ]
}
```

**Parent Key Points:**
- NO stock field (stock lives in variants)
- NO codigoProveedor field
- Uses containerAtributosPrincipales (not atributosPrincipales)
- Defines shared info that variants inherit
- Creates 4 × 2 = 8 possible variant combinations

---

#### Variant 1: Malbec 2019

```typescript
{
  // Core identification - Inherited from parent
  name: "Vino Proemio",           // LOCKED (from parent)
  categoria: "Vinos",             // LOCKED (from parent)
  marca: "Norton",                // LOCKED (from parent)
  
  // Unique identifier
  sku: "VINO-PROE-MALB-2019",
  codigoUniversal: "",
  
  // Stock - Unique to this variant
  stock: {
    total: "60",
    reservado: "15",
    disponible: "45"
  },

  // Supplier - Mixed inheritance
  proveedor: "Bodega Norton",      // LOCKED (inherited from parent)
  codigoProveedor: "NORTON-M19",   // EDITABLE (unique to variant)

  // Presentation - Inherited from parent (all locked)
  formatoVenta: "unidad",          // LOCKED (from parent)
  volumenActive: true,             // LOCKED (from parent)
  volumenCantidad: 750,            // LOCKED (from parent)
  volumenUnidad: "ml",             // LOCKED (from parent)

  // Principal attributes - Selects from parent's matrix
  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" },     // From parent's variantes
    { key: "Año", value: "2019" }             // From parent's variantes
  ],

  // Informational attributes - Fills parent's empty values
  atributosInformativos: [
    // Case 2: Fills parent's empty values
    { key: "Crianza", value: "12 meses" },
    { key: "Potencial de Guarda", value: "8 años" }
    
    // Case 1: Does NOT redefine locked parent attributes
    // These are automatically inherited and shown as read-only:
    // - Tipo: Tinto (locked)
    // - Línea: Proemio (locked)
    // - Bodega: Norton (locked)
    // - Origen: Luján de Cuyo, Mendoza (locked)
    // - Graduación Alcohólica: 14% (locked)
    // - Temperatura de Servicio: 16-18°C (locked)
    // - Perfil Sensorial: ... (locked)
    // - Enólogo: David Bonomi (locked)
  ]
}
```

**Variant 1 Key Points:**
- Inherits name, categoria, marca (locked)
- Inherits presentation fields (locked)
- Inherits proveedor (locked), but has own codigoProveedor
- Selects specific values from parent's atributos principales matrix
- Fills in parent's empty atributos informativos values
- Automatically displays parent's locked atributos informativos

---

#### Variant 2: Malbec 2014

```typescript
{
  name: "Vino Proemio",
  categoria: "Vinos",
  marca: "Norton",
  sku: "VINO-PROE-MALB-2014",
  codigoUniversal: "",
  
  stock: {
    total: "28",
    reservado: "5",
    disponible: "23"
  },

  proveedor: "Bodega Norton",      // LOCKED (from parent)
  codigoProveedor: "NORTON-M14",   // Different from variant 1

  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" },     // Same varietal
    { key: "Año", value: "2014" }             // Different year
  ],

  atributosInformativos: [
    { key: "Crianza", value: "18 meses" },           // Different value
    { key: "Potencial de Guarda", value: "10 años" } // Different value
  ]
}
```

**Variant 2 Key Points:**
- Same varietal, different year (different combination from matrix)
- Different stock levels from variant 1
- Different codigoProveedor from variant 1
- Different atributos informativos values (18 meses vs 12 meses)
- Still inherits all locked parent attributes

---

#### Variant 3: Cabernet Sauvignon 2019

```typescript
{
  name: "Vino Proemio",
  categoria: "Vinos",
  marca: "Norton",
  sku: "VINO-PROE-CABE-SAUV-2019",
  codigoUniversal: "",
  
  stock: {
    total: "42",
    reservado: "10",
    disponible: "32"
  },

  proveedor: "Bodega Norton",
  codigoProveedor: "NORTON-CS19",

  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  atributosPrincipales: [
    { key: "Varietal", value: "Cabernet Sauvignon" },  // Different varietal
    { key: "Año", value: "2019" }                       // Same year as variant 1
  ],

  atributosInformativos: [
    { key: "Crianza", value: "12 meses" },
    { key: "Potencial de Guarda", value: "8 años" }
  ]
}
```

**Variant 3 Key Points:**
- Different varietal, same year (another valid combination from matrix)
- All the same inheritance rules apply
- Each variant is a unique product with its own SKU and stock

---

### Example 3: Container with Variant-Exclusive Attributes

**Use Case:** Wine line where one variant has special characteristics.

#### Parent:

```typescript
{
  name: "Vino Trapiche Gran Medalla",
  categoria: "Vinos",
  hasVariants: true,
  isAgrupador: true,
  sku: "VINO-TRAP-GRAN-MEDA",
  marca: "Trapiche",
  proveedor: "Grupo Peñaflor",
  
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  containerAtributosPrincipales: [
    { 
      key: "Varietal", 
      variantes: ["Malbec", "Cabernet Sauvignon", "Pinot Noir"] 
    },
    { 
      key: "Año", 
      variantes: ["2014", "2020"] 
    }
  ],

  atributosInformativos: [
    // Locked for all
    { key: "Línea", value: "Gran Medalla" },
    { key: "Bodega", value: "Trapiche" },
    { key: "Origen", value: "Valle de Uco, Mendoza" },
    { key: "Enólogo", value: "Daniel Pi" },
    
    // Empty - variants can fill
    { key: "Tiempo en Barrica", value: "" },
    { key: "Potencial de Guarda", value: "" }
    
    // NO "Etiqueta" attribute defined at parent level
  ],

  variants: [...]
}
```

---

#### Regular Variant: Malbec 2014

```typescript
{
  name: "Vino Trapiche Gran Medalla",
  sku: "VINO-TRAP-GRAN-MEDA-MALB-2014",
  categoria: "Vinos",
  marca: "Trapiche",
  
  stock: {
    total: "45",
    reservado: "12",
    disponible: "33"
  },

  proveedor: "Grupo Peñaflor",      // Locked from parent
  codigoProveedor: "GP-TGM-M14",    // Unique

  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" },
    { key: "Año", value: "2014" }
  ],

  atributosInformativos: [
    { key: "Tiempo en Barrica", value: "18 meses" },
    { key: "Potencial de Guarda", value: "12 años" }
    // NO "Etiqueta" - regular variant
  ]
}
```

---

#### Special Variant: Cabernet Sauvignon 2020 (with Exclusive Attribute)

```typescript
{
  name: "Vino Trapiche Gran Medalla",
  sku: "VINO-TRAP-GRAN-MEDA-CABE-SAUV-2020",
  categoria: "Vinos",
  marca: "Trapiche",
  
  stock: {
    total: "29",
    reservado: "6",
    disponible: "23"
  },

  proveedor: "Grupo Peñaflor",
  codigoProveedor: "GP-TGM-CS20",

  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  atributosPrincipales: [
    { key: "Varietal", value: "Cabernet Sauvignon" },
    { key: "Año", value: "2020" }
  ],

  atributosInformativos: [
    // Case 2: Fills parent's empty values
    { key: "Tiempo en Barrica", value: "12 meses" },
    { key: "Potencial de Guarda", value: "10 años" },
    
    // Case 3: Variant-exclusive attribute (not in parent or siblings)
    { key: "Etiqueta", value: "Roja" }
  ]
}
```

**Special Variant Key Points:**
- Has all standard inheritance (locked parent fields)
- Fills parent's empty atributos informativos
- Adds exclusive "Etiqueta" attribute not present in parent
- This attribute won't appear in Malbec 2014 or other variants
- Only this specific variant has the "Etiqueta" information

---

## Best Practices

### 1. SKU Naming Conventions

**Recommended Format:** `CATEGORY-BRAND-VARIANT1-VARIANT2`

**Examples:**
- `VINO-PROE-MALB-2019` - Wine, Proemio, Malbec, 2019
- `CHAM-DOMI-CHAR-2019` - Champagne, Domiciano, Chardonnay, 2019
- `CLOTH-NOIRE-SHIRT-M-RED` - Clothing, NOIRE, Shirt, Medium, Red

**Benefits:**
- Easy to read and understand
- Sortable and filterable
- Communicates product at a glance

---

### 2. Attribute Key Naming

**Use descriptive, consistent keys:**
- ✅ "Tiempo en Barrica" (clear, specific)
- ✅ "Graduación Alcohólica" (unambiguous)
- ❌ "Tiempo" (too vague)
- ❌ "Alcohol" (incomplete)

**Maintain consistency across products:**
- Always use "Varietal" (not sometimes "Variedad" or "Tipo de Uva")
- Always use "Año" (not sometimes "Vintage" or "Cosecha")

---

### 3. When to Use Variants vs Standalone

**Use Container with Variants when:**
- Products share most characteristics (name, brand, presentation)
- Different combinations of 1-2 key attributes create variants
- Centralized management of shared info is beneficial
- Example: Same wine in different years/varietals

**Use Standalone when:**
- Product is truly unique
- Characteristics don't match any existing product line
- No logical grouping with other products
- Example: Specialty champagne with unique properties

---

### 4. Atributos Principales vs Informativos

**Use Atributos Principales for:**
- Characteristics that DIFFERENTIATE variants
- Attributes that create the variant matrix
- Fields used for filtering/navigation
- Maximum 2 attributes for clarity
- Examples: Varietal, Año, Size, Color

**Use Atributos Informativos for:**
- DESCRIPTIVE information
- Shared characteristics across variants
- Technical specifications
- Marketing/sensory descriptions
- Examples: Bodega, Origen, Perfil Sensorial, Temperatura de Servicio

---

### 5. Empty Values Strategy

**For Atributos Informativos:**
- Use empty value (`value: ""`) when variants should define their own values
- Use filled value when all variants share same information
- Example: "Tiempo en Barrica" varies → empty in parent
- Example: "Bodega" is same for all → filled in parent

**For Atributos Principales:**
- NEVER use empty `variantes` arrays
- Always provide complete list of possible values
- Invalid empty arrays will be filtered out

---

### 6. Stock Management

**Remember:**
- Standalone items: Stock at item level
- Container items: NO stock at parent level
- Variant items: Stock at variant level
- Each variant has independent stock tracking

---

### 7. Supplier Information

**Parent Level:**
- Include `proveedor` if all variants have same supplier
- Leave empty if variants have different suppliers
- NEVER include `codigoProveedor` in parent

**Variant/Standalone Level:**
- Always include `codigoProveedor` (can be empty)
- Each variant can have unique supplier code
- If parent has `proveedor` value, it will be inherited and locked

---

### 8. Data Validation Checklist

Before creating a dataset, verify:

**For All Items:**
- [ ] `name` is present and descriptive
- [ ] `categoria` is defined
- [ ] `marca` is defined
- [ ] `hasVariants` and `isAgrupador` are set correctly
- [ ] `formatoVenta` is "unidad" or "pack"

**For Standalone Items:**
- [ ] `sku` is unique and follows naming convention
- [ ] `stock` object has all three fields (total, reservado, disponible)
- [ ] If attributes exist, they're in correct format

**For Container Items:**
- [ ] `containerAtributosPrincipales` has 1-2 attributes
- [ ] Each attribute has non-empty `variantes` array
- [ ] `atributosInformativos` distinguishes locked vs empty values
- [ ] NO `codigoProveedor` field
- [ ] NO `stock` field
- [ ] `variants` array exists and has items

**For Variant Items:**
- [ ] `sku` is unique
- [ ] `atributosPrincipales` matches parent's containerAtributosPrincipales keys
- [ ] Each atributo principal value exists in parent's variantes
- [ ] `stock` object is present
- [ ] `codigoProveedor` is present (can be empty)

---

## Summary

This enriched guide provides complete documentation for creating item datasets in Stockio:

**Item Types:**
1. Standalone items - Complete independent products
2. Container items - Parents that group variants
3. Variant items - Children with inherited characteristics

**Inheritance Rules:**
1. **Info Segment** - Mostly strict (locked), proveedor is flexible
2. **Atributos Informativos** - Three cases (locked/fill/add)
3. **Atributos Principales** - Strict parent-defined matrix

**Key Principles:**
- Parents define shared characteristics and variant matrices
- Children inherit locked info and select from matrices
- Different attribute types follow different inheritance rules
- System ensures data consistency through strict rules

For detailed reference on specific inheritance cases, see the individual sections above.

---

**Document Version:** 1.0  
**Last Updated:** Current Session  
**Related Documents:** INITIAL_ITEMS_FORMAT_GUIDE.md
