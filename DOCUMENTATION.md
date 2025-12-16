# Stockio - Project Documentation

## Overview
Stockio is a stock management application built with Next.js 16, featuring item management with support for variants, change tracking, and real-time updates.

## Core Concepts

### Items Structure

Items in Stockio can be either:
- **Simple Items**: Single products without variants
- **Items with Variants (Agrupadores)**: Parent items that generate multiple child variants

### Variants System (Father-Son Relationship)

#### Parent Items (Agrupadores)
Parent items serve as templates that automatically generate child variants based on attribute combinations.

**Properties:**
- `hasVariants: true` - Indicates this item has variants
- `isAgrupador: true` - Marks this as a parent/container item
- `containerAtributosPrincipales` - Array of attributes that define variant dimensions (maximum 2)
  - Structure: `{ key: string, variantes: string[] }`
  - Example: `{ key: "Talle", variantes: ["S", "M", "L"] }`
- `variants` - Array containing all generated child items

**Example:**
```typescript
{
  name: "Camiseta Deportiva",
  containerAtributosPrincipales: [
    { key: "Color", variantes: ["Rojo", "Azul", "Verde"] },
    { key: "Talle", variantes: ["S", "M", "L", "XL"] }
  ],
  // This generates 3 × 4 = 12 child variants automatically
}
```

#### Atributos Configuration UI

Both parent items (containers) and individual items have an atributos segment with smart empty state handling:

**Empty State (No Atributos Configured):**
- Displays "No hay atributos configurados" message
- Shows two action buttons:
  - **"Agregar atributos"** - Configure atributos from scratch
  - **"Usar Template"** - Load a pre-saved atributos structure

**Adding Atributos from Scratch:**
When "Agregar atributos" is clicked, the view expands to show:
- **Atributos Principales** section with "agregar atributo" button
- **Atributos Secundarios (Informativos)** section with "agregar atributo" button

**Template Loading:**
- "Usar Template" button opens modal to select pre-saved atributos structures
- Only visible in empty state (when no atributos are configured)
- Applies saved structure to both principales and informativos

**Smart Reset:**
- When all atributos are deleted (both principales and informativos empty)
- Automatically returns to empty state with "Agregar atributos" and "Usar Template" buttons
- Prevents orphaned UI states

**Atributo Management:**
- Delete icon: X icon
- Each atributo can be removed individually
- Deletion triggers immediate check for empty state

#### Child Items (Variants)
Child items are automatically generated from the Cartesian product of parent attributes.

**Properties:**
- `isVariant: true` - Marks this as a child variant
- `parentId` - Reference to the parent item's ID
- `atributosPrincipales` - Specific attribute values for this variant
  - Structure: `{ key: string, value: string }[]`
  - Example: `[{ key: "Color", value: "Rojo" }, { key: "Talle", value: "M" }]`
- `sku` - Auto-generated: `PARENT-SKU-variant1-variant2`

**Inheritance Rules:**
1. **Inherited & Locked Fields** (cannot be edited in children):
   - `name` (titulo) - Base name from parent
   - `marca` - Brand
   - `formatoVenta` - Sales format
   - `unidadesPorPack` - Units per pack
   - `volumen` - Volume
   - `proveedor` - Supplier
   - `atributosPrincipales` - Attribute keys and values that define this variant (locked, defined by parent)
   - `atributosInformativos` - All informative attributes from parent

2. **Independent Fields** (can be edited per variant):
   - `stock` - Each variant tracks its own stock
   - `precio` - Can have different pricing per variant
   - `codigoProveedor` - Supplier code can vary per variant
   - `codigoUniversal` - Universal code can be unique per variant
   - `foto` - Each variant can have its own image
   - `descripcion` - Description can be customized per variant

**UI Constraints for Child Items:**
- Atributos Principales fields are disabled and cannot be modified (keys and values are inherited from parent)
- Cannot add or remove Atributos Principales from child items
- Delete button for Atributos Principales is hidden for child items
- Atributos Informativos inherited from parent with values are locked (key and value)
- Atributos Informativos without parent values can be edited freely

**Example Generation:**
- Attributes: Color [Rojo, Azul] + Talle [S, M, L]
- Result: 6 variants created
  - Camiseta Deportiva - Rojo - S
  - Camiseta Deportiva - Rojo - M
  - Camiseta Deportiva - Rojo - L
  - Camiseta Deportiva - Azul - S
  - Camiseta Deportiva - Azul - M
  - Camiseta Deportiva - Azul - L

### Change Tracking System

The application implements a comprehensive undo/redo system:

- **Tracked Changes:**
  - Item creation
  - Item updates (field changes)
  - Item deletion
  - Bulk operations

- **Features:**
  - Undo/Redo functionality with history stack
  - "Deshacer" button to revert all unsaved changes
  - "Guardar" button to persist changes
  - Visual indicators for unsaved changes

### Dynamic Bar (URDG Section)

The dynamic bar appears when there are unsaved changes and provides:
- **U**ndo button - Revert last change
- **R**edo button - Reapply reverted change
- **D**eshacer button - Discard all unsaved changes
- **G**uardar button - Save all changes

**Loading States:**
- Loading bar animation during save operation
- Success messages after operations complete:
  - "Cambios guardados" - After saving changes
  - "Item creado" - After creating new item

### User Interface Features

#### Toolbar
- **Nuevo Button**: Dropdown with two options
  - "Nuevo Item" - Create simple item
  - "Nuevo Item con Variantes" - Create parent item with variants
- **Acciones Masivas Button**: Bulk operations dropdown
- **Dropdown Delay**: 150ms delay on collapse to prevent accidental closures

#### Item Creation
- Auto-focus on "titulo" field when modal opens
- "Crear" button disabled until titulo is provided
- Loading animation during creation process
- New items appear at top of grid

#### Item Deletion
- Items track their original grid position
- Undo operation restores items to original positions
- Maintains grid order consistency

## Data Models

### Item Interface
```typescript
interface Item {
  id: string
  name: string
  sku: string
  stock: number
  precio: number
  marca: string
  formatoVenta: string
  unidadesPorPack: number
  volumen: string
  proveedor: string
  hasVariants: boolean
  isAgrupador: boolean
  isVariant: boolean
  parentId?: string
  atributosPrincipales: Array<{ key: string; value: string }>
  atributosInformativos: Array<{ key: string; value: string }>
  containerAtributosPrincipales?: Array<{ key: string; variantes: string[] }>
  variants?: Item[]
  depositos: DepositoStock[]
  codigoProveedor?: string
  codigoUniversal?: string
  foto?: string
  descripcion?: string
}
```

### DepositoStock Interface
```typescript
interface DepositoStock {
  id: string
  name: string
  stock: number
}
```

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **Database**: Neon (PostgreSQL)
- **State Management**: React hooks with custom change tracking
- **Styling**: Tailwind CSS with custom design tokens

## Design System

### Colors
The application uses a limited color palette defined via CSS design tokens:
- Primary brand colors
- Neutral grays for backgrounds and borders
- Success green for confirmations
- Semantic colors for different states

### Typography
- Maximum 2 font families
- Heading font and body text font
- Consistent sizing scale using Tailwind classes

### Layout
- Mobile-first responsive design
- Flexbox-first approach for layouts
- Grid used only for complex 2D layouts (items grid)

## Best Practices

1. **Always read files before editing** - Use SearchRepo to understand context
2. **Minimize code changes** - Only write what needs to change
3. **Use design tokens** - Never hardcode colors like `bg-white` or `text-black`
4. **Maintain variant relationships** - Never break parent-child item links
5. **Track all changes** - Ensure change tracking system captures all modifications
6. **Test undo/redo** - Verify change history works correctly after modifications

## Future Considerations

- Variant limit expansion (currently max 2 attribute dimensions)
- Bulk variant editing capabilities
- Variant analytics and reporting
- Export/import functionality for items with variants
