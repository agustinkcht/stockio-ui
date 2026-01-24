## Field Descriptions


### Optional Fields

- **codigoUniversal** (string): Universal barcode/UPC code
- **proveedor** (string): Supplier name
// Clarified that codigoProveedor is only for standalone items and variants, not inherited from agrupadores
- **codigoProveedor** (string): Supplier's internal code (only for standalone items and variants, NOT inherited from agrupadores)
- **formatoVenta** (string): "unidad" or "pack"


## Tips for Creating Your Dataset

1. **Choose appropriate categories** for your industry
2. **Define consistent SKU patterns** for easy identification
3. **Use meaningful attribute keys** that match your domain
4. **Create variant combinations** that make sense for your products
5. **Include realistic stock numbers** for testing
6. **Add informational attributes** to provide context
7. **Maintain consistency** in naming conventions across all items

## Inheritance Rules Between Agrupadores and Variants

### Info Segment Inheritance

The info segment consists of three subsections with different inheritance behaviors:

#### 1. Información del Producto (Strict Inheritance - Always Locked)

**Fields:** `name`, `categoria`, `marca`

**Rule:** These fields are **always strictly inherited and locked** in children, regardless of whether they have values or not.

- Parent defines these values (can be empty)
- Children inherit them as **locked, non-editable fields**
- Children cannot override or customize these values under any circumstance

**Example:**
\`\`\`typescript
// Parent (Agrupador)
name: "Vino Proemio",
categoria: "Vinos",
marca: "Norton"

// All children inherit these exact values, locked
// UI shows these fields as disabled/read-only in child items
\`\`\`

---

#### 2. Presentación (Strict Inheritance - Always Locked)

**Fields:** `formatoVenta`, `volumenActive`, `volumenCantidad`, `volumenUnidad`

**Rule:** These fields are **always strictly inherited and locked** in children, regardless of whether they have values or not.

- Parent defines the presentation format
- Children inherit them as **locked, non-editable fields**
- Children cannot change the presentation format

**Example:**
\`\`\`typescript
// Parent (Agrupador)
formatoVenta: "unidad",
volumenActive: true,
volumenCantidad: 750,
volumenUnidad: "ml"

// All children inherit these exact values, locked
// UI shows these fields as disabled/read-only in child items
\`\`\`

---

#### 3. Información del Proveedor (Flexible Field)

**Parent has:** Only `proveedor` field  
**Children have:** Both `proveedor` AND `codigoProveedor` fields

##### Proveedor Field - Two Cases:

**Case A: Proveedor Defined in Parent (Locked Inheritance)**
\`\`\`typescript
// Parent (Agrupador)
proveedor: "Bodega Norton"

// Children
proveedor: "Bodega Norton"     // Locked, inherited from parent (disabled in UI)
codigoProveedor: "NORTON-001"  // Can be set individually per child (editable in UI)
\`\`\`
**Rule:** If proveedor has a value in parent, children inherit it as a **locked field**, just like product information and presentation fields.

---

**Case B: Proveedor Empty in Parent (Flexible)**
\`\`\`typescript
// Parent (Agrupador)
proveedor: ""  // Empty string

// Children
proveedor: "Distribuidor A"    // Can be set individually per child (editable in UI)
codigoProveedor: "DIST-A-001"  // Can be set individually per child (editable in UI)
\`\`\`
**Rule:** If proveedor is left empty in parent, it **can be set individually in each child** (editable in UI).

---

**Código del Proveedor Field:**
- `codigoProveedor` is **NEVER defined in parent/agrupador items**
- It only exists in **standalone items and variant/child items**
- Each child can have its own unique supplier code
- Always editable in children (never locked)

---

#### Summary Table: Info Segment Inheritance

| Field Group | Parent Defines | Inheritance Type | Children Can Edit? | Locked When? |
|-------------|---------------|------------------|-------------------|--------------|
| **Información del Producto** | name, categoria, marca | Strict | ❌ Never | ✅ Always locked |
| **Presentación** | formatoVenta, volumen* | Strict | ❌ Never | ✅ Always locked |
| **Proveedor** (filled) | proveedor = "value" | Strict | ❌ No | ✅ When parent has value |
| **Proveedor** (empty) | proveedor = "" | Flexible | ✅ Yes | ❌ When parent is empty |
| **Código Proveedor** | N/A (not in parent) | N/A | ✅ Yes | ❌ Never locked |

**Key Principle:** The info segment is mostly strict inheritance (always locked in children), with the single exception of `proveedor` which becomes flexible **only when the parent leaves it empty**.

---

### Atributos Informativos: Three Inheritance Cases

- **Fully Inherited Fields (same for all variants)**
  - `name` - Product name
  - `categoria` - Category
  - `marca` - Brand
  - `proveedor` - Supplier name
  - `formatoVenta`, `volumenActive`, `volumenCantidad`, `volumenUnidad` - Sales format and volume info
  - `atributosInformativos` - Informational attributes (defined only at agrupador level, inherited by all variants)

- **Atributos Informativos: Three Inheritance Cases**

  **Case 1: Locked Key-Value Inheritance**
  - Parent defines both key AND value
  - All variants inherit the complete key-value pair (locked, cannot be modified)
  - Example: `{ key: "Bodega", value: "Trapiche" }` in parent → all variants inherit "Bodega: Trapiche"

  **Case 2: Key-Only Inheritance (Empty Values)**
  - Parent defines key but leaves value empty (`value: ""`)
  - Each variant can define its own value for that key
  - Example: `{ key: "Tiempo en Barrica", value: "" }` in parent → Malbec 2014 can have "18 meses", Cabernet can have "12 meses"

  **Case 3: Variant-Exclusive Attributes**
  - Parent does NOT define the attribute at all
  - Specific variants can add their own unique attributes
  - Example: "Etiqueta: Roja" only exists in one variant, not shared with siblings or parent

  **Implementation Pattern:**

  \`\`\`typescript
  // Parent (Agrupador)
  atributosInformativos: [
    // Case 1: Locked inheritance
    { key: "Bodega", value: "Trapiche" },
    { key: "Origen", value: "Mendoza" },
    
    // Case 2: Empty value - children can define
    { key: "Tiempo en Barrica", value: "" },
  ]

  // Variant 1: Overrides empty parent value
  variants: [
    {
      sku: "...",
      atributosInformativos: [
        { key: "Tiempo en Barrica", value: "18 meses" } // Fills parent's empty value
      ]
    }
  ]

  // Variant 2: Adds exclusive attribute
  variants: [
    {
      sku: "...",
      atributosInformativos: [
        { key: "Tiempo en Barrica", value: "12 meses" },  // Fills parent's empty value
        { key: "Etiqueta", value: "Roja" }                // Exclusive to this variant
      ]
    }
  ]
  \`\`\`

  **Merging Behavior:**
  - Variant's `atributosInformativos` merge with parent's attributes
  - Parent attributes with values (Case 1) are inherited and locked
  - Parent attributes with empty values (Case 2) can be filled by variants
  - New variant attributes (Case 3) are added without affecting parent or siblings
  - Final result: parent locked attributes + parent empty keys filled by variant + variant-exclusive attributes

### Atributos Principales: Strict Parent-Defined System

Unlike atributos informativos, **atributos principales are strictly defined by the parent** and create a fixed matrix of possible variants. Children can ONLY select from the parent's predefined options.

**Three Cases of Atributos Principales:**

**Case 1: Two Atributos Principales (Standard Matrix)**
- Parent defines TWO attributes, each with multiple values
- Creates a matrix of variant combinations
- Example: Vino Proemio, Vino Trapiche Gran Medalla

\`\`\`typescript
// Parent (Agrupador)
containerAtributosPrincipales: [
  { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon", "Syrah"] },
  { key: "Año", variantes: ["2019", "2014"] }
]
// Creates 3 × 2 = 6 possible variant combinations

// Child (Variant) - Selects ONE value from EACH attribute
variants: [{
  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" },  // Picks ONE from variantes
    { key: "Año", value: "2019" }           // Picks ONE from variantes
  ]
}]
\`\`\`

**Case 2: One Atributo Principal (Single Differentiator)**
- Parent defines ONLY ONE attribute with values
- Variants differ by only one characteristic
- **Children CANNOT add additional atributos principales**

\`\`\`typescript
// Parent (Agrupador)
containerAtributosPrincipales: [
  { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon"] }
  // Only ONE atributo principal defined
]

// Child (Variant) - Can ONLY have the one attribute defined by parent
variants: [{
  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" }
    // CANNOT add a second attribute like "Año"
  ]
}]
\`\`\`

**Case 3: Invalid/Empty Attributes (Ignored)**
- If a `containerAtributosPrincipales` entry has an empty `variantes` array, it is **NOT VALID**
- Children should NOT include this attribute at all
- System should filter out attributes with empty variantes

\`\`\`typescript
// Parent (Agrupador)
containerAtributosPrincipales: [
  { key: "Varietal", variantes: ["Malbec", "Cabernet"] },
  { key: "Región", variantes: [] }  // Empty variantes = INVALID
]

// Child (Variant) - Only includes valid attributes
variants: [{
  atributosPrincipales: [
    { key: "Varietal", value: "Malbec" }
    // "Región" is NOT included because it had empty variantes
  ]
}]
\`\`\`

**Core Rules:**
- ❌ Children CANNOT add new atributos principales beyond what parent defines
- ❌ Children CANNOT customize or override attribute keys
- ❌ Attributes with empty `variantes` arrays are invalid and ignored
- ✅ Parent's `containerAtributosPrincipales` is the complete, authoritative definition
- ✅ Children can ONLY select specific values from parent's `variantes` arrays
- ✅ Format: Parent uses `variantes: []` (array), children use `value: ""` (single string)

**Key Difference from Atributos Informativos:**
- **Atributos Principales**: Fixed matrix, strict inheritance, no child additions
- **Atributos Informativos**: Flexible inheritance with three cases (locked, empty for children to fill, variant-exclusive additions allowed)

### Attribute Key Inherited, Value Specific (differentiates variants)
- `atributosPrincipales` - Variants inherit the attribute keys from `containerAtributosPrincipales` but have specific values

### NOT Inherited (unique per variant)
- `sku` - Each variant has a unique SKU
- `codigoUniversal` - Can be unique per variant
- `codigoProveedor` - Each variant can have its own supplier code (NOT defined in agrupador)
- `stock` - Each variant has its own stock levels
