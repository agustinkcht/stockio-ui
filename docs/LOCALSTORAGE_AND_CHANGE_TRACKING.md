# LocalStorage Database & Change Tracking System
*Stockio Internal Development Documentation*

---

## 📋 Overview

Stockio uses **localStorage as a development database** to persist data across sessions, combined with a **Change Tracking System** that enables undo/redo functionality through URDG buttons (Undo, Redo, Deshacer, Guardar).

This document explains how to implement this pattern for any module in the application.

---

## 🏗️ Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Page Component (e.g., /inventario/articulos/[item])    │   │
│  │  - Renders URDG buttons in header                        │   │
│  │  - Connects to hooks for state management                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Component (e.g., ItemDetailPanel)                       │   │
│  │  - Input fields call onFieldChange()                     │   │
│  │  - Receives current values from hook state               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        HOOK LAYER                               │
│  ┌────────────────────┐    ┌─────────────────────────────┐     │
│  │  useChangeTracker  │    │  useItems (Domain Hook)     │     │
│  │  - Generic change  │◄───│  - editField()              │     │
│  │    history stack   │    │  - undoEdit() / redoEdit()  │     │
│  │  - undo/redo logic │    │  - saveEdit() / cancelEdit()│     │
│  └────────────────────┘    │  - hasUnsavedEdits state    │     │
│                            └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  localStorage                                            │   │
│  │  Key: "stockio-items-{accountId}"                        │   │
│  │  Value: JSON.stringify(items[])                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Core Components

### 1. useChangeTracker Hook (`hooks/use-change-tracker.ts`)

A **generic, reusable hook** for tracking any type of change with undo/redo capability.

```typescript
// Type definitions
export type ChangeType = "delete" | "edit" | "add"

export interface Change {
  id: string           // Unique identifier for the change
  type: ChangeType     // Type of change
  timestamp: number    // When the change occurred
  data: any           // The new/changed data
  previousData?: any  // The original data (for undo)
}

// Hook return values
{
  changes: Change[]           // List of unsaved changes
  hasUnsavedChanges: boolean  // Quick check if there are pending changes
  trackChange: (type, data, previousData?) => void  // Record a new change
  undo: () => Change | null   // Undo last change, returns the undone change
  redo: () => Change | null   // Redo last undone change
  undoAll: () => void         // Discard all changes
  saveAll: () => Change[]     // Clear change stack, returns saved changes
  canUndo: boolean            // Whether undo is available
  canRedo: boolean            // Whether redo is available
}
```

**Key Implementation Details:**

```typescript
export function useChangeTracker() {
  const [changes, setChanges] = useState<Change[]>([])
  const [history, setHistory] = useState<Change[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const trackChange = useCallback((type, data, previousData?) => {
    const change: Change = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      timestamp: Date.now(),
      data,
      previousData,
    }

    setChanges((prev) => [...prev, change])

    // Add to history for undo/redo - truncate any "future" history
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      return [...newHistory, change]
    })
    setHistoryIndex((prev) => prev + 1)
  }, [historyIndex])

  const undo = useCallback(() => {
    if (historyIndex < 0) return null
    const changeToUndo = history[historyIndex]
    setHistoryIndex((prev) => prev - 1)
    setChanges((prev) => prev.filter((c) => c.id !== changeToUndo.id))
    return changeToUndo
  }, [history, historyIndex])

  // ... redo, undoAll, saveAll implementations
}
```

---

### 2. Domain Hook Pattern (`hooks/use-items.ts`)

The domain hook manages the actual data and uses the change tracker for history.

**Key State Variables:**

```typescript
// Edited item tracking
const [editedItem, setEditedItem] = useState<EditedItemState | null>(null)
const [lastUndoneEdit, setLastUndoneEdit] = useState<EditedItemState | null>(null)
const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false)

// EditedItemState structure
interface EditedItemState {
  itemSku: string                    // SKU of the item being edited
  parentSku?: string                 // If editing a variant, the parent SKU
  originalValues: Partial<Item>      // Original values before any edits
  currentValues: Partial<Item>       // Current values with all edits applied
}
```

**Key Functions:**

#### `editField(itemSku, field, newValue)`
Called when a user modifies any input field.

```typescript
const editField = (itemSku: string, field: string, newValue: any) => {
  // Step 1: Capture original state on FIRST edit
  if (!editedItem || editedItem.itemSku !== itemSku) {
    const originalItem = items.find((item) => item.sku === itemSku)
    if (!originalItem) return

    setEditedItem({
      itemSku,
      originalValues: { ...originalItem },           // Snapshot of original
      currentValues: { ...originalItem, [field]: newValue },  // With new value
    })
  } else {
    // Step 2: Accumulate subsequent edits
    setEditedItem({
      ...editedItem,
      currentValues: { ...editedItem.currentValues, [field]: newValue },
    })
  }

  // Step 3: Mark as having unsaved changes
  setHasUnsavedEdits(true)
  setLastUndoneEdit(null)  // Clear redo stack on new edit

  // Step 4: Update UI state immediately (optimistic update)
  setItems((prevItems) =>
    prevItems.map((item) =>
      item.sku === itemSku ? { ...item, [field]: newValue } : item
    )
  )
}
```

#### `undoEdit()`
Reverts all changes to the current item back to original values.

```typescript
const undoEdit = () => {
  if (!editedItem) return

  // Save current state for potential redo
  setLastUndoneEdit(editedItem)

  // Restore original values in UI
  setItems((prevItems) =>
    prevItems.map((item) =>
      item.sku === editedItem.itemSku
        ? { ...item, ...editedItem.originalValues }
        : item
    )
  )

  // Clear edit tracking
  setEditedItem(null)
  setHasUnsavedEdits(false)
}
```

#### `redoEdit()`
Re-applies the last undone edit.

```typescript
const redoEdit = () => {
  if (!lastUndoneEdit) return

  // Restore the undone changes
  setItems((prevItems) =>
    prevItems.map((item) =>
      item.sku === lastUndoneEdit.itemSku
        ? { ...item, ...lastUndoneEdit.currentValues }
        : item
    )
  )

  setEditedItem(lastUndoneEdit)
  setLastUndoneEdit(null)
  setHasUnsavedEdits(true)
}
```

#### `saveEdit()`
Persists changes to localStorage.

```typescript
const saveEdit = () => {
  if (!editedItem) return

  // Save entire items array to localStorage
  localStorage.setItem(getStorageKey(), JSON.stringify(items))

  // Clear edit tracking - changes are now "saved"
  setEditedItem(null)
  setLastUndoneEdit(null)
  setHasUnsavedEdits(false)
}
```

#### `cancelEdit()`
Discards all changes without saving.

```typescript
const cancelEdit = () => {
  if (!editedItem) return

  // Restore original values
  setItems((prevItems) =>
    prevItems.map((item) =>
      item.sku === editedItem.itemSku
        ? { ...item, ...editedItem.originalValues }
        : item
    )
  )

  // Clear all edit state
  setEditedItem(null)
  setLastUndoneEdit(null)
  setHasUnsavedEdits(false)
}
```

---

### 3. LocalStorage Pattern

#### Storage Key Convention
```typescript
const getStorageKey = () => {
  return `stockio-items-${currentAccount}`  // e.g., "stockio-items-noire"
}
```

#### Initial Load Pattern
```typescript
useEffect(() => {
  const fetchItems = async () => {
    const storageKey = getStorageKey()
    const storedItems = localStorage.getItem(storageKey)

    if (storedItems) {
      // Load from localStorage
      const parsedItems = JSON.parse(storedItems)
      setItems(parsedItems)
    } else {
      // First time: load from initial data file
      const INITIAL_ITEMS = await import("@/lib/data/initial-items")
      localStorage.setItem(storageKey, JSON.stringify(INITIAL_ITEMS.INITIAL_ITEMS))
      setItems(INITIAL_ITEMS.INITIAL_ITEMS)
    }
  }

  fetchItems()
}, [currentAccount])
```

---

## 🎛️ URDG Buttons Implementation

### Button Layout in Page Header

```tsx
<div className="flex items-center gap-1.5">
  {/* Undo/Redo Group */}
  <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-muted/50 mr-1.5">
    <button
      onClick={handleUndo}
      disabled={!canUndo}
      className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed"
      title="Deshacer último cambio"
    >
      <Undo2 className="w-3.5 h-3.5" />
    </button>
    <button
      onClick={handleRedo}
      disabled={!canRedo}
      className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed"
      title="Rehacer último cambio"
    >
      <Redo2 className="w-3.5 h-3.5" />
    </button>
  </div>

  <div className="h-5 w-px bg-border/60" />

  {/* Cancel (X) Button */}
  <button
    onClick={handleDeshacer}
    disabled={!hasChanges}
    className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
    title="Deshacer cambios"
  >
    <X className="w-4 h-4" />
  </button>

  {/* Save (Check) Button */}
  <button
    onClick={handleGuardar}
    disabled={!hasChanges}
    className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed text-primary"
    title="Guardar cambios"
  >
    <Check className="w-4 h-4" />
  </button>
</div>
```

### Handler Functions in Page Component

```tsx
// Get state from hook
const {
  editField,
  undoEdit,
  redoEdit,
  saveEdit,
  cancelEdit,
  hasUnsavedEdits,
  canUndoEdit,
  canRedoEdit,
} = useItems()

// Computed states for button enabling
const canUndo = canUndoEdit || hasUnsavedDeletes
const canRedo = canRedoEdit
const hasChanges = hasUnsavedEdits || hasUnsavedDeletes

// Handlers
const handleUndo = () => {
  if (canUndoEdit) {
    undoEdit()
  } else if (hasUnsavedDeletes) {
    undoDelete()
  }
}

const handleRedo = () => {
  if (canRedoEdit) {
    redoEdit()
  }
}

const handleDeshacer = () => {
  if (hasUnsavedEdits) {
    cancelEdit()
  }
  if (hasUnsavedDeletes) {
    undoDelete()
  }
}

const handleGuardar = async () => {
  setIsSaving(true)
  try {
    if (hasUnsavedEdits) {
      saveEdit()
    }
    if (hasUnsavedDeletes) {
      await saveDelete()
    }
  } finally {
    setIsSaving(false)
  }
}
```

---

## 🔗 Connecting Input Fields

### Pattern for Input Components

```tsx
// In the component that renders the input
interface Props {
  item: Item
  onFieldChange: (itemSku: string, field: string, value: any) => void
}

function ItemInfoSection({ item, onFieldChange }: Props) {
  return (
    <Input
      value={item.marca || ""}
      onChange={(e) => onFieldChange(item.sku!, "marca", e.target.value)}
      placeholder="Marca"
    />
  )
}
```

### Passing Down from Page

```tsx
// In page component
const handleFieldChange = (itemSku: string, field: string, value: any) => {
  editField(itemSku, field, value)
}

// Pass to detail panel
<ItemDetailPanel
  selectedItem={selectedItem}
  onFieldChange={handleFieldChange}
  // ... other props
/>
```

### Nested Field Updates (Stock Example)

```typescript
const updateStock = (itemSku: string, field: "total" | "reservado", value: number) => {
  const item = items.find((i) => i.sku === itemSku)
  if (!item) return

  const currentStock = item.stock || { total: "0", reservado: "0", disponible: "0" }
  const currentTotal = Number.parseInt(currentStock.total || "0")
  const currentReservado = Number.parseInt(currentStock.reservado || "0")

  const newTotal = field === "total" ? value : currentTotal
  const newReservado = field === "reservado" ? value : currentReservado
  const newDisponible = newTotal - newReservado

  const newStock = {
    total: newTotal.toString(),
    reservado: newReservado.toString(),
    disponible: newDisponible.toString(),
  }

  // Use editField for the entire stock object
  editField(itemSku, "stock", newStock)
}
```

---

## 📝 Step-by-Step: Adding Change Tracking to a New Module

### Step 1: Create or Extend Domain Hook

```typescript
// hooks/use-precios.ts (example for prices module)

export function usePrecios() {
  const { currentAccount } = useAccount()
  const [precios, setPrecios] = useState<Precio[]>([])
  
  // Edit tracking state
  const [editedPrecio, setEditedPrecio] = useState<EditedPrecioState | null>(null)
  const [lastUndoneEdit, setLastUndoneEdit] = useState<EditedPrecioState | null>(null)
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false)

  const getStorageKey = () => `stockio-precios-${currentAccount}`

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey())
    if (stored) {
      setPrecios(JSON.parse(stored))
    } else {
      // Load initial data
    }
  }, [currentAccount])

  // Implement editField, undoEdit, redoEdit, saveEdit, cancelEdit
  // following the same pattern as useItems

  return {
    precios,
    editField,
    undoEdit,
    redoEdit,
    saveEdit,
    cancelEdit,
    hasUnsavedEdits,
    canUndoEdit: editedPrecio !== null,
    canRedoEdit: lastUndoneEdit !== null,
  }
}
```

### Step 2: Add URDG Buttons to Page

```tsx
// app/precios/lista-de-precios/page.tsx

export default function PreciosPage() {
  const {
    precios,
    editField,
    undoEdit,
    redoEdit,
    saveEdit,
    cancelEdit,
    hasUnsavedEdits,
    canUndoEdit,
    canRedoEdit,
  } = usePrecios()

  // Add URDG buttons in header (copy pattern from articulos)
  // ...
}
```

### Step 3: Connect Input Fields

```tsx
// In your price grid or detail component
<Input
  value={precio.costo}
  onChange={(e) => onFieldChange(precio.sku, "costo", e.target.value)}
/>
```

---

## 🔍 Debugging Tips

### Console Logs Pattern

```typescript
console.log("[v0] useItems - editField called:", { itemSku, field, newValue })
console.log("[v0] useItems - hasUnsavedEdits changed to:", hasUnsavedEdits)
console.log("[v0] useItems - saved edits to localStorage")
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Changes not persisting | `saveEdit()` not called | Ensure Save button calls `saveEdit()` |
| Undo not working | Original values not captured | Check `editedItem.originalValues` is set on first edit |
| Multiple items edited | State not scoped per item | Ensure `editedItem.itemSku` matches current item |
| localStorage empty | Wrong storage key | Verify `getStorageKey()` returns correct value |

---

## 📊 State Flow Diagram

```
User types in input
        │
        ▼
onChange calls editField(sku, field, value)
        │
        ▼
Is this the first edit for this item?
        │
   ┌────┴────┐
   │ YES     │ NO
   ▼         ▼
Capture     Update only
original    currentValues
state       │
   │        │
   └────┬───┘
        ▼
Set hasUnsavedEdits = true
        │
        ▼
Update items[] array (optimistic UI)
        │
        ▼
URDG buttons become enabled
        │
   ┌────┴────────────┬─────────────┐
   │                 │             │
   ▼                 ▼             ▼
User clicks     User clicks   User clicks
  Undo           Cancel         Save
   │               │              │
   ▼               ▼              ▼
undoEdit()     cancelEdit()   saveEdit()
   │               │              │
   ▼               ▼              ▼
Restore        Restore        Write to
original +     original       localStorage
save to        values         │
lastUndone     │              ▼
   │           │           Clear all
   │           │           edit state
   ▼           ▼              │
Clear edit   Clear edit      ▼
state        state         Done!
```

---

## ✅ Checklist for New Module Implementation

- [ ] Create domain hook with localStorage pattern
- [ ] Implement `getStorageKey()` function
- [ ] Add `useEffect` for initial data load
- [ ] Add `editedItem` state tracking
- [ ] Implement `editField()` function
- [ ] Implement `undoEdit()` function
- [ ] Implement `redoEdit()` function
- [ ] Implement `saveEdit()` function
- [ ] Implement `cancelEdit()` function
- [ ] Export all necessary state and functions
- [ ] Add URDG buttons to page header
- [ ] Connect input `onChange` handlers to `editField`
- [ ] Test: Edit → Undo → Redo → Save flow
- [ ] Test: Edit → Cancel flow
- [ ] Test: Page reload persists data

---

*This documentation serves as the canonical reference for implementing localStorage persistence and change tracking across all Stockio modules.*
