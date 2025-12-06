# Database Refactor Guide

## Problem Statement

The original schema had a critical flaw:
- **Items** were in the `items` table
- **Variants** were in a separate `item_variants` table
- **Stock** had a foreign key ONLY to `items.sku`
- **Result**: Variants couldn't have their own stock entries ❌

## Solution: Unified Items Table

Merge everything into a single `items` table where:
- Individual items have `parent_sku = NULL`
- Parent items have `parent_sku = NULL` and `has_variants = true`
- Variant/son items have `parent_sku = '[PARENT_SKU]'`

### Benefits

1. ✅ **Stock works for variants** - Single FK to items.sku covers everything
2. ✅ **Simpler queries** - No need to UNION between tables
3. ✅ **Cleaner relationships** - Everything is just an "item"
4. ✅ **Easier maintenance** - One table to manage

### Migration Steps

Run scripts in order:

1. **refactor-001** - Backup all current data
2. **refactor-002** - Migrate variants into items table
3. **refactor-003** - Migrate variant attributes
4. **refactor-004** - Fix stock foreign key constraint
5. **refactor-005** - (Optional) Drop old variant tables
6. **refactor-006** - Insert Vino Proemio with all variants + stock

### Database Structure After Refactor

\`\`\`
items
├── Individual items (parent_sku = NULL, has_variants = false)
├── Parent items (parent_sku = NULL, has_variants = true)
└── Variant items (parent_sku = 'XXX', has_variants = false)

stock
└── Can reference ANY item.sku (individual, parent, or variant)

item_atributos
└── Links ALL items (individual or variant) to their attributes
\`\`\`

### Example Data Structure

\`\`\`sql
-- Individual item
sku: 'CHAMP-001'
parent_sku: NULL
has_variants: false
→ Stock: 'CHAMP-001' ✅

-- Parent item
sku: 'PROEMIO'
parent_sku: NULL
has_variants: true
→ Stock: Not typically tracked (variants have stock)

-- Variant items
sku: 'PROEMIO-MAL-2019'
parent_sku: 'PROEMIO'
has_variants: false
→ Stock: 'PROEMIO-MAL-2019' ✅

sku: 'PROEMIO-CS-2019'
parent_sku: 'PROEMIO'
has_variants: false
→ Stock: 'PROEMIO-CS-2019' ✅
\`\`\`

### Key Queries

\`\`\`sql
-- Get all individual items (no parent, no variants)
SELECT * FROM items 
WHERE parent_sku IS NULL 
AND has_variants = false;

-- Get all parent items (containers)
SELECT * FROM items 
WHERE parent_sku IS NULL 
AND has_variants = true;

-- Get all variants of a parent
SELECT * FROM items 
WHERE parent_sku = 'PROEMIO';

-- Get item with all its attributes
SELECT i.sku, i.name, 
       STRING_AGG(at.nombre || ': ' || av.valor, ', ') as attributes
FROM items i
LEFT JOIN item_atributos ia ON i.sku = ia.sku
LEFT JOIN atributo_valores av ON ia.atributo_valor_id = av.id
LEFT JOIN atributo_tipos at ON av.atributo_tipo_id = at.id
WHERE i.sku = 'PROEMIO-MAL-2019'
GROUP BY i.sku, i.name;

-- Get stock for a variant
SELECT s.*, i.name
FROM stock s
JOIN items i ON s.sku = i.sku
WHERE i.parent_sku = 'PROEMIO';
\`\`\`

### Safety Notes

- Backup tables are created and preserved (_backup_items, _backup_item_variants, _backup_stock)
- All scripts use ON CONFLICT clauses to be safely re-runnable
- Script 005 (dropping old tables) is commented out - only run after verification
- Foreign key constraints ensure data integrity

### Rollback Plan

If needed, restore from backup tables:

\`\`\`sql
-- Restore items
TRUNCATE items CASCADE;
INSERT INTO items SELECT * FROM _backup_items;

-- Restore variants
TRUNCATE item_variants CASCADE;
INSERT INTO item_variants SELECT * FROM _backup_item_variants;

-- Restore stock
TRUNCATE stock CASCADE;
INSERT INTO stock SELECT * FROM _backup_stock;
\`\`\`

## Post-Refactor Application Updates

After running the refactor, update your application code:

1. **Remove references to `item_variants` table** - Everything is in `items` now
2. **Update queries** - Filter by `parent_sku IS NULL` or `IS NOT NULL`
3. **Update forms** - Stock can now be added for variants
4. **Update display logic** - No need to compose titles from variant attributes

This refactor creates a solid foundation for your item editing UI with proper stock tracking for all item types.
