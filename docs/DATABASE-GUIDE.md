# Stockio Database Guide

Complete reference for working with the Stockio normalized database schema.

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Master Data Tables](#master-data-tables)
4. [Attribute System](#attribute-system)
5. [Audit Trail](#audit-trail)
6. [Common Operations](#common-operations)
7. [Foreign Key Relationships](#foreign-key-relationships)
8. [Insertion Order Guide](#insertion-order-guide)

---

## Schema Overview

The database uses a **normalized structure** with:
- Master data tables for brands, providers, and warehouses
- Normalized attribute system replacing JSONB
- Foreign key constraints for data integrity
- Audit trail for tracking changes

### Key Design Principles

✅ **Items with variants** use parent-child structure via `item_variants`  
✅ **Attributes** are normalized (no JSONB for attribute data)  
✅ **Stock** references both individual items AND variants  
✅ **Foreign keys** prevent orphaned data  
✅ **Audit tables** track all changes for undo/redo functionality  

---

## Core Tables

### `items`

Stores both **individual items** AND **parent items** (containers for variants).

**Key Columns:**
- `sku` - Unique item identifier (character varying)
- `name` - Item name/title
- `descripcion` - Description
- `marca_id` - Foreign key → `marcas.id`
- `proveedor_id` - Foreign key → `proveedores.id`
- `has_variants` - Boolean: true if item has variants
- `is_agrupador` - Boolean: true if item is a parent/container
- `variant_count` - Number of child variants
- `formato_venta` - 'unidad' or 'pack'
- `volumen_active`, `volumen_cantidad`, `volumen_unidad` - Volume information

**Legacy Columns (Backup):**
- `marca` - Old string-based brand (kept for migration reference)
- `proveedor` - Old string-based provider
- `atributos_principales` - Old JSONB attributes (kept for backup)
- `container_atributos_principales` - Old JSONB container attributes

**Important:**
- Individual items: `has_variants = false`, `is_agrupador = false`
- Parent items: `has_variants = true`, `is_agrupador = true`

---

### `item_variants`

Stores **son items** (variants) that belong to parent items.

**Key Columns:**
- `sku` - Unique variant identifier
- `parent_sku` - Foreign key → `items.sku`
- `name` - Variant name
- `atributos_principales` - Legacy JSONB (kept for backup)

**Important:**
- Each variant must have a valid `parent_sku` that exists in `items`
- Variants inherit locked fields from parent (marca, proveedor, formato_venta, volume)
- Stock references variant SKUs, not parent SKUs

---

### `stock`

Tracks inventory across multiple warehouses.

**Key Columns:**
- `sku` - References either `items.sku` OR `item_variants.sku`
- `deposito` - Warehouse code (string) - LEGACY, still NOT NULL
- `deposito_id` - Foreign key → `depositos.id` (new normalized field)
- `total` - Total stock quantity
- `disponible` - Available stock (total - reservado)
- `reservado` - Reserved stock

**Constraints:**
- `sku` must exist in either `items` or `item_variants` (foreign key)
- `deposito` is NOT NULL (legacy requirement during transition)
- `disponible = total - reservado` (check constraint)
- Unique constraint: `(sku, deposito)`

**Important:**
- Currently requires BOTH `deposito` (string) AND `deposito_id` (integer)
- One stock row per SKU per warehouse
- For items with variants, stock goes on variant SKUs, NOT parent SKU

---

## Master Data Tables

### `marcas` (Brands)

**Columns:**
- `id` - Primary key
- `nombre` - Brand name (unique)
- `activo` - Active status
- `descripcion` - Description

**Usage:**
```sql
-- Insert new brand
INSERT INTO marcas (nombre, activo) VALUES ('Proemio', true);

-- Link to item
UPDATE items SET marca_id = (SELECT id FROM marcas WHERE nombre = 'Proemio');
```

---

### `proveedores` (Providers)

**Columns:**
- `id` - Primary key
- `nombre` - Provider name (unique)
- `contacto` - Contact information
- `activo` - Active status

---

### `depositos` (Warehouses)

**Columns:**
- `id` - Primary key
- `codigo` - Warehouse code (unique, e.g., 'CENTRAL')
- `nombre` - Warehouse name
- `direccion` - Address
- `activo` - Active status

**Usage:**
```sql
-- Insert warehouse
INSERT INTO depositos (codigo, nombre, activo) VALUES ('CENTRAL', 'Depósito Central', true);

-- Use in stock
INSERT INTO stock (sku, deposito, deposito_id, total, disponible, reservado)
VALUES (
  'ITEM-001',
  'CENTRAL',
  (SELECT id FROM depositos WHERE codigo = 'CENTRAL'),
  100, 100, 0
);
```

---

## Attribute System

### `atributo_tipos` (Attribute Types)

Defines attribute categories (varietal, añada, color, size, etc.).

**Columns:**
- `id` - Primary key
- `codigo` - Unique code (e.g., 'varietal', 'anada')
- `nombre` - Display name
- `tipo_dato` - Data type: 'texto', 'numero', 'fecha'
- `es_principal` - Boolean: true for main attributes, false for informational
- `orden` - Display order
- `activo` - Active status

---

### `atributo_valores` (Attribute Values)

All possible values for each attribute type.

**Columns:**
- `id` - Primary key
- `atributo_tipo_id` - Foreign key → `atributo_tipos.id`
- `valor` - The actual value (e.g., 'Malbec', '2019', 'Rojo')
- `activo` - Active status

**Example:**
```sql
-- Add a new varietal value
INSERT INTO atributo_valores (atributo_tipo_id, valor, activo)
SELECT id, 'Merlot', true FROM atributo_tipos WHERE codigo = 'varietal';
```

---

### `item_atributos` (Item ↔ Attribute Links)

Links **individual items** to their attributes.

**Columns:**
- `sku` - Foreign key → `items.sku`
- `atributo_valor_id` - Foreign key → `atributo_valores.id`

**Usage:**
```sql
-- Assign "Malbec" attribute to an item
INSERT INTO item_atributos (sku, atributo_valor_id)
SELECT 'ITEM-001', av.id
FROM atributo_valores av
JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE at.codigo = 'varietal' AND av.valor = 'Malbec';
```

---

### `variant_atributos` (Variant ↔ Attribute Links)

Links **variants** to their specific attribute values.

**Columns:**
- `variant_sku` - Foreign key → `item_variants.sku`
- `atributo_valor_id` - Foreign key → `atributo_valores.id`

**Example:**
```sql
-- Assign "Malbec 2019" to a variant
INSERT INTO variant_atributos (variant_sku, atributo_valor_id)
SELECT 'PROEMIO-MAL-2019', av.id
FROM atributo_valores av
JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE (at.codigo = 'varietal' AND av.valor = 'Malbec')
   OR (at.codigo = 'anada' AND av.valor = '2019');
```

---

### `container_atributos_posibles` (Parent ↔ Possible Variant Attributes)

Defines which attribute combinations variants CAN have.

**Columns:**
- `parent_sku` - Foreign key → `items.sku`
- `atributo_tipo_id` - Foreign key → `atributo_tipos.id`
- `atributo_valor_id` - Foreign key → `atributo_valores.id`

**Example:**
```sql
-- Define that "Vino Proemio" variants can have Malbec, CS, or CF
INSERT INTO container_atributos_posibles (parent_sku, atributo_tipo_id, atributo_valor_id)
SELECT 
  'PROEMIO-PARENT',
  at.id,
  av.id
FROM atributo_tipos at
JOIN atributo_valores av ON av.atributo_tipo_id = at.id
WHERE at.codigo = 'varietal' AND av.valor IN ('Malbec', 'Cabernet Sauvignon', 'Cabernet Franc');
```

---

## Audit Trail

### `item_cambios` (Item Changes)

Tracks all field changes to items.

**Columns:**
- `sku` - Item/variant SKU
- `campo_modificado` - Field name that changed
- `valor_anterior` - Previous value
- `valor_nuevo` - New value
- `usuario` - User who made the change
- `ip_address` - User's IP
- `created_at` - Timestamp

---

### `stock_movimientos` (Stock Movements)

Tracks all stock changes.

**Columns:**
- `sku` - Item/variant SKU
- `deposito_id` - Foreign key → `depositos.id`
- `tipo` - Movement type: 'entrada', 'salida', 'ajuste', 'reserva', 'liberacion'
- `cantidad` - Quantity changed
- `stock_anterior_total` - Total before
- `stock_nuevo_total` - Total after
- `stock_anterior_disponible` - Available before
- `stock_nuevo_disponible` - Available after
- `referencia` - Reference (order #, reason, etc.)
- `usuario` - User who made the change
- `notas` - Notes
- `created_at` - Timestamp

---

## Common Operations

### Creating an Individual Item

```sql
-- 1. Ensure marca and proveedor exist
INSERT INTO marcas (nombre, activo) VALUES ('MarcaX', true) ON CONFLICT DO NOTHING;
INSERT INTO proveedores (nombre, activo) VALUES ('ProveedorY', true) ON CONFLICT DO NOTHING;

-- 2. Insert item
INSERT INTO items (
  sku, name, marca_id, proveedor_id, has_variants, is_agrupador
)
VALUES (
  'ITEM-001',
  'Vino Simple',
  (SELECT id FROM marcas WHERE nombre = 'MarcaX'),
  (SELECT id FROM proveedores WHERE nombre = 'ProveedorY'),
  false,
  false
);

-- 3. Add attributes
INSERT INTO item_atributos (sku, atributo_valor_id)
SELECT 'ITEM-001', av.id
FROM atributo_valores av
JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE at.codigo = 'varietal' AND av.valor = 'Malbec';

-- 4. Add stock
INSERT INTO stock (sku, deposito, deposito_id, total, disponible, reservado)
VALUES (
  'ITEM-001',
  'CENTRAL',
  (SELECT id FROM depositos WHERE codigo = 'CENTRAL'),
  100, 100, 0
);
```

---

### Creating a Parent Item with Variants

```sql
-- 1. Insert parent item
INSERT INTO items (
  sku, name, marca_id, proveedor_id, has_variants, is_agrupador, variant_count
)
VALUES (
  'PARENT-001',
  'Vino con Variantes',
  (SELECT id FROM marcas WHERE nombre = 'MarcaX'),
  (SELECT id FROM proveedores WHERE nombre = 'ProveedorY'),
  true,
  true,
  2
);

-- 2. Define possible variant attributes
INSERT INTO container_atributos_posibles (parent_sku, atributo_tipo_id, atributo_valor_id)
SELECT 'PARENT-001', at.id, av.id
FROM atributo_tipos at
JOIN atributo_valores av ON av.atributo_tipo_id = at.id
WHERE at.codigo = 'varietal' AND av.valor IN ('Malbec', 'Cabernet Sauvignon');

-- 3. Insert variants
INSERT INTO item_variants (sku, parent_sku, name)
VALUES 
  ('VARIANT-001', 'PARENT-001', 'Vino Malbec'),
  ('VARIANT-002', 'PARENT-001', 'Vino Cabernet Sauvignon');

-- 4. Link variant attributes
INSERT INTO variant_atributos (variant_sku, atributo_valor_id)
SELECT 'VARIANT-001', av.id
FROM atributo_valores av
JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE at.codigo = 'varietal' AND av.valor = 'Malbec';

INSERT INTO variant_atributos (variant_sku, atributo_valor_id)
SELECT 'VARIANT-002', av.id
FROM atributo_valores av
JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE at.codigo = 'varietal' AND av.valor = 'Cabernet Sauvignon';

-- 5. Add stock for each variant
INSERT INTO stock (sku, deposito, deposito_id, total, disponible, reservado)
VALUES
  ('VARIANT-001', 'CENTRAL', (SELECT id FROM depositos WHERE codigo = 'CENTRAL'), 50, 50, 0),
  ('VARIANT-002', 'CENTRAL', (SELECT id FROM depositos WHERE codigo = 'CENTRAL'), 30, 30, 0);
```

---

### Querying Items with Attributes

```sql
-- Get individual item with all attributes
SELECT 
  i.sku,
  i.name,
  m.nombre as marca,
  p.nombre as proveedor,
  at.nombre as atributo_tipo,
  av.valor as atributo_valor
FROM items i
LEFT JOIN marcas m ON i.marca_id = m.id
LEFT JOIN proveedores p ON i.proveedor_id = p.id
LEFT JOIN item_atributos ia ON i.sku = ia.sku
LEFT JOIN atributo_valores av ON ia.atributo_valor_id = av.id
LEFT JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE i.sku = 'ITEM-001';

-- Get parent item with all variants and their attributes
SELECT 
  i.sku as parent_sku,
  i.name as parent_name,
  iv.sku as variant_sku,
  iv.name as variant_name,
  at.nombre as atributo_tipo,
  av.valor as atributo_valor
FROM items i
JOIN item_variants iv ON i.sku = iv.parent_sku
LEFT JOIN variant_atributos va ON iv.sku = va.variant_sku
LEFT JOIN atributo_valores av ON va.atributo_valor_id = av.id
LEFT JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE i.sku = 'PARENT-001';
```

---

## Foreign Key Relationships

### Key Constraints

**items table:**
- `marca_id` → `marcas.id`
- `proveedor_id` → `proveedores.id`

**item_variants table:**
- `parent_sku` → `items.sku` (CASCADE DELETE)

**stock table:**
- `sku` → `items.sku` OR `item_variants.sku` (CASCADE DELETE)
- `deposito_id` → `depositos.id`

**item_atributos table:**
- `sku` → `items.sku` (CASCADE DELETE)
- `atributo_valor_id` → `atributo_valores.id`

**variant_atributos table:**
- `variant_sku` → `item_variants.sku` (CASCADE DELETE)
- `atributo_valor_id` → `atributo_valores.id`

**container_atributos_posibles table:**
- `parent_sku` → `items.sku` (CASCADE DELETE)
- `atributo_tipo_id` → `atributo_tipos.id`
- `atributo_valor_id` → `atributo_valores.id`

---

## Insertion Order Guide

### For Individual Items:
1. `marcas` (if new)
2. `proveedores` (if new)
3. `depositos` (if new)
4. `atributo_tipos` (if new)
5. `atributo_valores` (if new)
6. `items`
7. `item_atributos`
8. `stock`

### For Items with Variants:
1. `marcas` (if new)
2. `proveedores` (if new)
3. `depositos` (if new)
4. `atributo_tipos` (if new)
5. `atributo_valores` (if new)
6. `items` (parent)
7. `container_atributos_posibles`
8. `item_variants` ← **MUST be before stock**
9. `variant_atributos`
10. `stock` (for each variant)

**Critical:** Always insert into `item_variants` BEFORE inserting stock for those variants, or the foreign key constraint will fail.

---

## Tips and Best Practices

1. **Always use transactions** for multi-step inserts
2. **Check for existing records** with `ON CONFLICT DO NOTHING` when appropriate
3. **Use subqueries** to get IDs: `(SELECT id FROM marcas WHERE nombre = 'X')`
4. **Stock must reference existing SKUs** - variants must exist in `item_variants` first
5. **Parent items don't have stock** - only their variants do
6. **Use audit tables** when building edit UI to track changes
7. **Query with JOINs** to get complete item information including attributes

---

**Last Updated:** After migration scripts 001-008 execution  
**Schema Version:** Normalized (Post-JSONB Migration)
