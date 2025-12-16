# Database Schema Issues and Limitations

## Critical Issue: Stock Cannot Track Variants

### **The Problem**

The current database schema has a structural issue that prevents tracking stock for individual variants:

```sql
-- Current constraint on stock table:
ALTER TABLE stock ADD CONSTRAINT stock_sku_fkey 
  FOREIGN KEY (sku) REFERENCES items(sku);
```

**This means:**
- Stock can ONLY be added for SKUs that exist in the `items` table
- Variants are stored in the separate `item_variants` table
- Therefore, **variants cannot have stock entries**

### **Why This Is a Problem**

For items with variants (like Vino Proemio):
- Parent item: `VINO-PROEMIO` (in `items` table) ✅ Can have stock
- Variant 1: `VINO-PROEMIO-MALBEC-2019` (in `item_variants` table) ❌ Cannot have stock
- Variant 2: `VINO-PROEMIO-CS-2014` (in `item_variants` table) ❌ Cannot have stock

This makes it impossible to track inventory for individual variants.

### **Solutions**

#### **Option 1: Remove the Foreign Key Constraint (Quick Fix)**

```sql
-- Remove the constraint
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_sku_fkey;

-- Now stock can reference any SKU (items or variants)
-- But loses referential integrity protection
```

**Pros:** Quick, allows variant stock immediately  
**Cons:** No database-level protection against invalid SKUs

#### **Option 2: Unified Items Table (Recommended)**

Merge `item_variants` into `items` table:

```sql
-- Migrate variants into items table
INSERT INTO items (sku, name, parent_sku, /* other fields */)
SELECT sku, name, parent_sku, /* other fields */
FROM item_variants;

-- Drop item_variants table
DROP TABLE item_variants CASCADE;

-- Now all SKUs are in items table
-- Stock foreign key works for both parents and variants
```

**Pros:** Clean schema, proper referential integrity  
**Cons:** Requires data migration

#### **Option 3: Composite Foreign Key with CHECK Constraint**

```sql
-- Remove old constraint
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_sku_fkey;

-- Add CHECK constraint to ensure SKU exists in either table
ALTER TABLE stock ADD CONSTRAINT stock_sku_exists_check
CHECK (
  EXISTS (SELECT 1 FROM items WHERE sku = stock.sku)
  OR
  EXISTS (SELECT 1 FROM item_variants WHERE sku = stock.sku)
);
```

**Pros:** Maintains separation, allows variant stock  
**Cons:** CHECK with subqueries can be slow

### **Current Workaround**

Until this is fixed, the system tracks stock at the **parent level only**:
- `VINO-PROEMIO` has total stock across all variants
- Individual variant stock must be tracked in application logic, not database

### **Recommendation**

Implement **Option 2** (Unified Items Table) because:
1. Simplifies the entire data model
2. Proper referential integrity
3. Aligns with how items are conceptually used
4. Easier queries and relationships
5. No performance impact from CHECK constraints

The `parent_sku` column in `items` distinguishes variants from standalone items.
