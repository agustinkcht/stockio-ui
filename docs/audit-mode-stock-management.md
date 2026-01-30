# Audit Mode Stock Management - Technical Documentation

This document explains how the stock audit mode works in the inventory system, including individual and bulk changes, pending change tracking, and persistence to localStorage.

---

## Overview

The audit mode allows users to modify stock values (total and reservado) for multiple items before committing all changes at once. This is similar to how the price grid handles bulk price edits.

**Key Files:**
- `/components/items/items-grid.tsx` - Main grid component with audit mode logic
- `/components/items/item-card.tsx` - Individual item card with stock modification controls
- `/components/modals/bulk-stock-modal.tsx` - Modal for bulk stock operations
- `/hooks/use-items.ts` - Contains `bulkSaveStock` function for persistence
- `/app/inventario/articulos/page.tsx` - Page component that orchestrates save/discard

---

## 1. Pending Changes State Management

### State Structure

In `items-grid.tsx`, pending changes are tracked using a local state:

\`\`\`typescript
interface AuditStockChange {
  total: number
  reservado: number
}

const [auditStockChanges, setAuditStockChanges] = useState<Record<string, AuditStockChange>>({})
\`\`\`

- **Key**: Item SKU (string)
- **Value**: Object with `total` and `reservado` values (numbers)

Example state:
\`\`\`javascript
{
  "SKU-001": { total: 25, reservado: 5 },
  "SKU-002": { total: 100, reservado: 10 },
  "VARIANT-SKU-003": { total: 50, reservado: 0 }
}
\`\`\`

### Tracking Changes

The `handleAuditStockChange` function updates the pending changes:

\`\`\`typescript
const handleAuditStockChange = (itemSku: string, field: "total" | "reservado", value: number) => {
  setAuditStockChanges(prev => {
    // Find current values (from pending changes or original item)
    const item = findItemBySku(itemSku)
    const currentTotal = prev[itemSku]?.total ?? parseInt(item?.stock?.total || "0")
    const currentReservado = prev[itemSku]?.reservado ?? parseInt(item?.stock?.reservado || "0")
    
    return {
      ...prev,
      [itemSku]: {
        total: field === "total" ? value : currentTotal,
        reservado: field === "reservado" ? value : currentReservado,
      }
    }
  })
}
\`\`\`

**Important**: When a change is made, BOTH `total` and `reservado` are stored together. This ensures we always have the complete stock state for each modified item.

---

## 2. Individual Item Changes

### In Item Card (`item-card.tsx`)

Each item card in audit mode has controls for modifying stock:

1. **Operation Selector**: Dropdown with options:
   - `Aumentar` (add to current value)
   - `Disminuir` (subtract from current value)
   - `Sobreescribir` (replace current value)

2. **Input Field**: Number input for the operation value

3. **Check Button**: Applies the operation

4. **+/- Buttons**: Quick increment/decrement by 1

### How Individual Changes Work

\`\`\`typescript
// Handle operation-based modification (check button)
const handleStockModify = (type: "total" | "reservado") => {
  const operation = type === "total" ? stockTotalOperation : stockReservadoOperation
  const inputValue = parseInt(type === "total" ? stockTotalInput : stockReservadoInput)
  const currentValue = type === "total" ? currentStockTotal : currentStockReservado
  
  let newValue = currentValue
  if (operation === "agregar") {
    newValue = currentValue + inputValue
  } else if (operation === "disminuir") {
    newValue = Math.max(0, currentValue - inputValue)
  } else if (operation === "sobreescribir") {
    newValue = inputValue
  }
  
  onStockChange?.(item.sku, type, newValue)
}

// Handle quick increment/decrement (+/- buttons)
const handleStockIncrement = (type: "total" | "reservado", delta: number) => {
  const currentValue = type === "total" ? currentStockTotal : currentStockReservado
  const newValue = Math.max(0, currentValue + delta)
  onStockChange?.(item.sku, type, newValue)
}
\`\`\`

### Getting Current Values

The item card gets its current display values from either pending changes or the original item:

\`\`\`typescript
const currentStockTotal = auditStockValues?.[item.sku]?.total ?? parseInt(item.stock?.total || "0")
const currentStockReservado = auditStockValues?.[item.sku]?.reservado ?? parseInt(item.stock?.reservado || "0")
\`\`\`

This ensures:
- If there's a pending change for this SKU, use the pending value
- Otherwise, use the original item's stock value

---

## 3. Bulk Changes

### Bulk Stock Modal (`bulk-stock-modal.tsx`)

The modal allows applying the same operation to multiple items at once.

**Props:**
\`\`\`typescript
interface BulkStockModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (operation: string, value: number) => void
  itemCount: number
  type: "total" | "reservado"
}
\`\`\`

### Target Selection Logic

Items affected by bulk edit are determined by:

\`\`\`typescript
const getTargetSkusForBulkEdit = useCallback((): string[] => {
  // Priority 1: If items are selected via checkboxes, use those
  if (hasSelectedItems && getSelectedSkus) {
    return getSelectedSkus()
  }
  // Priority 2: Otherwise, use all visible items on screen
  return getVisibleSkus()
}, [hasSelectedItems, getSelectedSkus, getVisibleSkus])
\`\`\`

**`getVisibleSkus`** returns all SKUs of:
- Standalone items
- Children of parent items (variants)
- Does NOT include parent SKUs (only their children have stock)

### Applying Bulk Changes

\`\`\`typescript
const handleBulkStockApply = (operation: string, value: number) => {
  const targetSkus = getTargetSkusForBulkEdit()
  const field = bulkStockModalType // "total" or "reservado"
  
  for (const sku of targetSkus) {
    // Find item and get current value
    const item = findItemBySku(sku)
    const currentValue = field === "total" 
      ? (auditStockChanges[sku]?.total ?? parseInt(item.stock?.total || "0"))
      : (auditStockChanges[sku]?.reservado ?? parseInt(item.stock?.reservado || "0"))
    
    // Calculate new value based on operation
    let newValue = currentValue
    if (operation === "aumentar") {
      newValue = currentValue + value
    } else if (operation === "disminuir") {
      newValue = Math.max(0, currentValue - value)
    } else if (operation === "sobreescribir") {
      newValue = value
    }
    
    // Apply to pending changes
    handleAuditStockChange(sku, field, newValue)
  }
}
\`\`\`

---

## 4. Saving Changes to localStorage

### The Save Flow

1. **User clicks "Guardar"** in utility bar
2. **Page calls `handleAuditSave`** with all pending changes
3. **`bulkSaveStock` is called** (from `useItems` hook)
4. **Changes are applied atomically** and persisted

### `handleAuditSave` in `articulos/page.tsx`

\`\`\`typescript
const handleAuditSave = async (changes: Record<string, { total: number; reservado: number }>) => {
  setIsSaving(true)
  try {
    await sleep(600) // Visual feedback delay
    
    // Use bulkSaveStock - handles both standalone and variant items
    // and persists directly to localStorage
    bulkSaveStock(changes)
    
    // Clear audit changes in the grid
    ;(window as any).__auditClearHandler?.()
    
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  } catch (error) {
    console.error("Error saving audit changes:", error)
  } finally {
    setIsSaving(false)
    setHasAuditChanges(false)
    setAuditPendingCount(0)
  }
}
\`\`\`

### `bulkSaveStock` in `use-items.ts`

This is the critical function that handles persistence:

\`\`\`typescript
const bulkSaveStock = (changes: Record<string, { total: number; reservado: number }>) => {
  setItems(prevItems => {
    const updatedItems = prevItems.map(item => {
      // Check if this standalone item has changes
      if (changes[item.sku]) {
        const change = changes[item.sku]
        return {
          ...item,
          stock: {
            total: change.total.toString(),
            reservado: change.reservado.toString(),
            disponible: (change.total - change.reservado).toString(),
          }
        }
      }
      
      // Check if any variants have changes
      if (item.variants) {
        const updatedVariants = item.variants.map((variant: any) => {
          if (changes[variant.sku]) {
            const change = changes[variant.sku]
            return {
              ...variant,
              stock: {
                total: change.total.toString(),
                reservado: change.reservado.toString(),
                disponible: (change.total - change.reservado).toString(),
              }
            }
          }
          return variant
        })
        return { ...item, variants: updatedVariants }
      }
      
      return item
    })
    
    // Persist to localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(updatedItems))
    }
    
    return updatedItems
  })
}
\`\`\`

**Key Points:**
- Updates both standalone items and variant items
- Calculates `disponible` automatically (`total - reservado`)
- Stores values as strings (matching the stock object format)
- Persists to localStorage immediately after updating state

---

## 5. Discarding Changes

When user clicks "Deshacer":

\`\`\`typescript
const handleDiscardAuditChanges = () => {
  setAuditStockChanges({})           // Clear all pending changes
  setShowOnlyPendingChanges(false)   // Clear the filter
  onAuditDiscard?.()                 // Notify parent
}
\`\`\`

The UI automatically reverts because:
- `auditStockChanges` is now empty
- Item cards fall back to original `item.stock` values

---

## 6. Visual Feedback

### Pending Changes Indicator

Items with pending changes get visual highlighting:

\`\`\`typescript
// In item-card.tsx
const hasPendingChanges = auditStockValues && auditStockValues[item.sku] !== undefined

// Applied as ring/border styling
className={`... ${hasPendingChanges ? "ring-2 ring-amber-400 bg-amber-50/30" : ""}`}
\`\`\`

### Pending Changes Counter (Clickable Filter)

\`\`\`typescript
{hasAuditChanges && (
  <button
    onClick={() => setShowOnlyPendingChanges(!showOnlyPendingChanges)}
    className={`... ${showOnlyPendingChanges ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-600"}`}
  >
    {pendingChangesCount} cambios pendientes
  </button>
)}
\`\`\`

### Filtering by Pending Changes

When clicked, the grid shows only items with pending changes:

\`\`\`typescript
const filterByPendingChanges = useMemo(() => {
  if (!showOnlyPendingChanges) return filteredItems
  
  const pendingSkus = new Set(Object.keys(auditStockChanges))
  
  return filteredItems.filter(item => {
    // For parents: filter to only show children with pending changes
    if (item.variants) {
      const matchingVariants = item.variants.filter(v => pendingSkus.has(v.sku))
      if (matchingVariants.length > 0) {
        return { ...item, variants: matchingVariants }
      }
    }
    // For standalone: check if SKU has pending changes
    return pendingSkus.has(item.sku)
  })
}, [filteredItems, showOnlyPendingChanges, auditStockChanges])
\`\`\`

---

## 7. Communication Between Components

### Window Handlers Pattern

The grid exposes handlers via `window` for the parent page to call:

\`\`\`typescript
// In items-grid.tsx
useEffect(() => {
  ;(window as any).__auditDiscardHandler = handleDiscardAuditChanges
  ;(window as any).__auditSaveHandler = handleSaveAuditChanges
  ;(window as any).__auditClearHandler = clearAuditChanges
  return () => {
    delete (window as any).__auditDiscardHandler
    delete (window as any).__auditSaveHandler
    delete (window as any).__auditClearHandler
  }
}, [auditStockChanges])

// In page.tsx - called when save completes
;(window as any).__auditClearHandler?.()
\`\`\`

### Callback Props Pattern

The grid notifies the parent of state changes:

\`\`\`typescript
// In items-grid.tsx
onAuditChangesUpdate?.(hasAuditChanges, pendingChangesCount)

// In page.tsx
const handleAuditChangesUpdate = (hasChanges: boolean, pendingCount: number) => {
  setHasAuditChanges(hasChanges)
  setAuditPendingCount(pendingCount)
}
\`\`\`

---

## Summary

| Component | Responsibility |
|-----------|---------------|
| `items-grid.tsx` | Tracks pending changes in `auditStockChanges` state, handles bulk operations, filters by pending |
| `item-card.tsx` | Displays current values (pending or original), handles individual modifications |
| `bulk-stock-modal.tsx` | UI for bulk operations |
| `use-items.ts` | `bulkSaveStock` function for atomic persistence |
| `page.tsx` | Orchestrates save/discard, shows D-G buttons in utility bar |

**Data Flow:**
1. User modifies stock (individual or bulk)
2. `handleAuditStockChange` updates `auditStockChanges` state
3. Item cards read from `auditStockChanges` for display
4. On "Guardar", `bulkSaveStock` applies all changes and persists to localStorage
5. On "Deshacer", `auditStockChanges` is cleared, UI reverts to original values
