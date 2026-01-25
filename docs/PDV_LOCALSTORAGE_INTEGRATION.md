# PDV (Punto de Venta) - LocalStorage Integration

## Overview

The PDV (Point of Sale) module implements a transactional system that persists sales data to localStorage without using the URDG (Undo/Redo/Discard/Guard) button system. When a sale is completed by pressing the "Cobrar" button, it immediately updates multiple data stores in localStorage.

## Architecture

### Data Flow on Sale Completion

\`\`\`
User Presses "Cobrar"
        ↓
  handleCheckout()
        ↓
    ┌───────────────────────────────────┐
    │  1. Reduce Stock (use-items.ts)   │
    │  2. Create Venta (use-ventas.ts)  │
    │  3. Update Client (use-clientes.ts)│
    └───────────────────────────────────┘
        ↓
  Clear Cart & Reset UI
\`\`\`

### Hooks Involved

1. **`useItems`** (`hooks/use-items.ts`)
   - Manages item inventory and stock levels
   - Provides `reduceStock()` function

2. **`useVentas`** (`hooks/use-ventas.ts`)
   - Manages sales records
   - Provides `createVenta()` function

3. **`useClientes`** (`hooks/use-clientes.ts`)
   - Manages client records
   - Provides `incrementClientTransaction()` function

---

## Stock Management System

### Stock Structure

Each item has a stock object with three properties:

\`\`\`typescript
stock: {
  total: string;       // Total physical units in inventory
  reservado: string;   // Units reserved (not available for sale)
  disponible: string;  // Available units = total - reservado
}
\`\`\`

### Stock Relationship

**Formula**: `disponible = total - reservado`

### Example Stock Flow

**Before Sale:**
- total: "10"
- reservado: "2"
- disponible: "8"

**After Selling 4 Units:**
- total: "6" ← Reduced by 4
- reservado: "2" ← Unchanged
- disponible: "4" ← Recalculated (6 - 2)

### The `reduceStock()` Function

Located in `hooks/use-items.ts`, this function handles stock reduction for both standalone items and variants.

\`\`\`typescript
const reduceStock = useCallback((itemId: string, quantity: number, variantId?: string) => {
  // 1. Read current items from localStorage
  const storedItems = localStorage.getItem(`items_${accountId}`)
  const currentItems = storedItems ? JSON.parse(storedItems) : items

  // 2. Find the item to update
  const itemIndex = currentItems.findIndex((item: Item) => item.id === itemId)
  
  if (variantId) {
    // Handle variant stock
    const currentTotal = parseInt(variant.stock?.total || "0", 10)
    const currentReservado = parseInt(variant.stock?.reservado || "0", 10)
    const newTotal = Math.max(0, currentTotal - quantity)
    const newDisponible = Math.max(0, newTotal - currentReservado)
    
    variant.stock = {
      ...variant.stock,
      total: newTotal.toString(),
      disponible: newDisponible.toString(),
    }
  } else {
    // Handle standalone item stock
    const currentTotal = parseInt(item.stock?.total || "0", 10)
    const currentReservado = parseInt(item.stock?.reservado || "0", 10)
    const newTotal = Math.max(0, currentTotal - quantity)
    const newDisponible = Math.max(0, newTotal - currentReservado)
    
    item.stock = {
      ...item.stock,
      total: newTotal.toString(),
      disponible: newDisponible.toString(),
    }
  }

  // 3. Save immediately to localStorage
  localStorage.setItem(`items_${accountId}`, JSON.stringify(updatedItems))
  
  // 4. Update React state
  setItems(updatedItems)
}, [accountId, items])
\`\`\`

**Key Points:**
- Reads directly from localStorage (not state) to avoid stale data
- Reduces `total` by the quantity sold
- Keeps `reservado` unchanged
- Recalculates `disponible` as `total - reservado`
- Saves to localStorage immediately (synchronous)
- Updates React state for UI refresh

---

## Venta Creation

### Venta Data Structure

\`\`\`typescript
interface Venta {
  id: string;                    // Unique ID
  fecha: string;                 // ISO date string
  cliente?: {
    id: string;
    nombre: string;
  };
  items: Array<{
    id: string;
    nombre: string;
    sku: string;
    quantity: number;
    price: number;
    subtotal: number;
    variantId?: string;
    variantName?: string;
  }>;
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: string;
  estado: "Completada" | "Pendiente" | "Cancelada";
}
\`\`\`

### The `createVenta()` Function

Located in `hooks/use-ventas.ts`:

\`\`\`typescript
const createVenta = useCallback((ventaData: Omit<Venta, "id">) => {
  const newVenta: Venta = {
    id: `VTA-${Date.now()}`,
    ...ventaData,
  }

  const updatedVentas = [newVenta, ...ventas]
  
  // Save to localStorage
  localStorage.setItem(`ventas_${accountId}`, JSON.stringify(updatedVentas))
  
  // Update state
  setVentas(updatedVentas)

  return newVenta
}, [ventas, accountId])
\`\`\`

---

## Client Transaction Update

### The `incrementClientTransaction()` Function

Located in `hooks/use-clientes.ts`:

\`\`\`typescript
const incrementClientTransaction = useCallback((clientId: string) => {
  const updatedClientes = clientes.map((cliente) => {
    if (cliente.id === clientId) {
      return {
        ...cliente,
        transactionCount: (cliente.transactionCount || 0) + 1,
      }
    }
    return cliente
  })

  // Save to localStorage
  localStorage.setItem(`clientes_${accountId}`, JSON.stringify(updatedClientes))
  
  // Update state
  setClientes(updatedClientes)
}, [clientes, accountId])
\`\`\`

---

## Complete Checkout Flow

### Implementation in `app/mi-negocio/pdv/page.tsx`

\`\`\`typescript
const handleCheckout = async () => {
  // 1. REDUCE STOCK FOR EACH ITEM
  for (const cartItem of cart) {
    reduceStock(
      cartItem.item.id,
      cartItem.quantity,
      cartItem.variantId
    )
  }

  // 2. CREATE VENTA RECORD
  const ventaData = {
    fecha: new Date().toISOString(),
    cliente: selectedClient ? {
      id: selectedClient.id,
      nombre: selectedClient.nombre,
    } : undefined,
    items: cart.map((cartItem) => ({
      id: cartItem.item.id,
      nombre: cartItem.item.nombre,
      sku: cartItem.item.sku,
      quantity: cartItem.quantity,
      price: cartItem.price,
      subtotal: cartItem.price * cartItem.quantity,
      variantId: cartItem.variantId,
      variantName: cartItem.variantName,
    })),
    subtotal: cartSubtotal,
    descuento: discount,
    total: cartTotal,
    metodoPago: paymentMethod,
    estado: "Completada" as const,
  }

  createVenta(ventaData)

  // 3. UPDATE CLIENT TRANSACTION COUNT
  if (selectedClient) {
    incrementClientTransaction(selectedClient.id)
  }

  // 4. RESET UI
  clearCart()
  setSelectedClient(null)
  setDiscount(0)
  setShowSuccess(true)
}
\`\`\`

### Step-by-Step Execution

1. **Stock Reduction Loop**
   - Iterates through each cart item
   - Calls `reduceStock()` for each item/variant
   - Each call immediately persists to localStorage

2. **Venta Creation**
   - Constructs venta object with all cart data
   - Calls `createVenta()` which saves to localStorage
   - New venta appears in Ventas module history

3. **Client Update** (if client selected)
   - Increments client's transaction count
   - Updates localStorage for clientes

4. **UI Reset**
   - Clears cart state
   - Resets client selection
   - Shows success message

---

## LocalStorage Keys

The PDV interacts with these localStorage keys:

| Key | Data Type | Purpose |
|-----|-----------|---------|
| `items_{accountId}` | `Item[]` | Inventory with stock levels |
| `ventas_{accountId}` | `Venta[]` | Sales history |
| `clientes_{accountId}` | `Cliente[]` | Client records with transaction counts |

---

## Key Differences from URDG System

### PDV (Transactional)
- ✅ Immediate persistence on "Cobrar"
- ✅ No undo/redo functionality
- ✅ Direct localStorage writes
- ✅ Multi-entity updates (items, ventas, clientes)
- ✅ Transactional: all changes committed together

### URDG System (Editable)
- ✅ Tracks change history
- ✅ Supports undo/redo
- ✅ Requires explicit "Save" action
- ✅ Can discard all changes
- ✅ Single entity editing (e.g., item details)

---

## Debugging Tips

### Stock Not Reducing
1. Check if `reduceStock()` is being called for each cart item
2. Verify `accountId` is correct
3. Confirm localStorage key matches: `items_{accountId}`
4. Check that quantity is a positive number

### Ventas Not Appearing
1. Verify `createVenta()` is called after stock reduction
2. Check ventas page is using `useVentas` hook
3. Confirm localStorage key: `ventas_{accountId}`

### Stock Calculation Issues
1. Ensure formula is correct: `disponible = total - reservado`
2. Check that only `total` is reduced, not `reservado`
3. Verify `parseInt()` with base 10 for number parsing

### Debug Logging Example

\`\`\`typescript
console.log("[v0] PDV - Starting checkout", { cartItems: cart.length })
console.log("[v0] PDV - Reducing stock for:", cartItem.item.sku, "Qty:", cartItem.quantity)
console.log("[v0] PDV - Stock before:", currentTotal, "Stock after:", newTotal)
console.log("[v0] PDV - Created venta:", newVenta.id)
console.log("[v0] PDV - Updated client transactions:", clientId)
\`\`\`

---

## Best Practices

1. **Always Reduce Stock First**: Ensures inventory is updated before recording the sale
2. **Use Synchronous localStorage Writes**: Prevents race conditions with async state updates
3. **Read from localStorage Directly**: In `reduceStock()`, read current data from localStorage to avoid stale state
4. **Validate Stock Availability**: Before checkout, ensure `disponible >= quantity` for all items
5. **Handle Variants Correctly**: Check if item has variants and reduce correct variant stock
6. **Atomic Transactions**: If any step fails, consider rolling back or showing error (future enhancement)

---

## Future Enhancements

- Transaction rollback on error
- Stock validation before checkout
- Support for partial payments
- Receipt generation
- Integration with real database (Neon)
