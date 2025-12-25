# STOCKIO - Internal Development Documentation
*Last Updated: Current Session*
*Version: v49+*

---

## 🎯 PROJECT OVERVIEW

**Stockio** is an inventory management system (ERP/Sistema de gestión de inventario) for businesses. Primary user: **NOIRE** (Admin mode).

### Core Functionality
- Inventory management with variants and container items
- Multi-deposit stock tracking (Ibiza, Trujui, Ciudadela)
- Change tracking with undo/redo functionality
- Item creation with templates
- Rich attribute system for products

---

## 📁 PROJECT STRUCTURE

```
/app
  page.tsx              # Main application shell (redirects to /inventario/articulos)
  layout.tsx            # Root layout with fonts
  globals.css           # Tailwind v4 + theme tokens
  /inventario
    /articulos
      page.tsx          # Items grid view
      /[item]
        page.tsx        # Dynamic item detail route
  /precios
    /lista-de-precios
      page.tsx          # Price lists view
  /mi-negocio
    /pdv
      page.tsx          # Punto de venta (POS)
  
/components
  /items
    items-grid.tsx      # Main grid view of items
    item-card.tsx       # Individual item cards
    item-detail-panel.tsx  # Full item detail view
  /layout
    sidebar.tsx         # Collapsible sidebar with modules
    top-nav.tsx         # Top navbar (NAVBAR)
    utility-bar.tsx     # Secondary bar below navbar (URDG buttons)
    toolbar.tsx         # Action toolbar for grid view
  /modals
    nuevo-item-modal.tsx              # Create single item
    nuevo-item-con-variantes-modal.tsx  # Create item with variants
    template-modal.tsx                # Template selection
  /ui
    [shadcn components]  # Standard UI components

/hooks
  use-items.ts          # Item CRUD + deletion tracking
  use-change-tracker.ts # Undo/redo change management
  use-item-selection.ts # Grid selection logic
  use-navigation.ts     # View navigation history (deprecated - now using Next.js router)
  use-modals.ts         # Modal state management
  use-sidebar.ts        # Sidebar state + dropdowns
  use-item-detail.ts    # Detail panel state

/lib
  types.ts              # TypeScript interfaces
  constants.ts          # Sidebar items, templates, deposits
  utils.ts              # Utility functions (cn, etc)
  /data
    initial-items.ts    # Mock data for development
```

---

## 🏗️ APPLICATION ARCHITECTURE

### **Three-Part Layout System**

Stockio uses a **consistent three-part layout** that is shared across ALL pages and views:

#### 1. **Navbar** (Top Navigation)
- **Component**: `components/layout/top-nav.tsx`
- **Position**: Fixed at top of viewport
- **Height**: `64px` (h-16)
- **Content**: 
  - Left: Business info (NOIRE | Admin)
  - Center: Bookmarks
  - Right: Message icon, Bell icon, User icon
- **Shared**: Present on every single page/view

#### 2. **Sidebar** (Left Navigation)
- **Component**: `components/layout/sidebar.tsx`
- **Position**: Fixed at left edge, full height
- **Width**: `64px` collapsed / `264px` expanded
- **Content**:
  - Module navigation (Mi Negocio, Inventario, Ventas, etc.)
  - Dropdown menus with sub-modules
  - Search functionality (when expanded)
  - Toggle button
- **Shared**: Present on every single page/view
- **Navigation**: Uses Next.js router with href prop for module/sub-module navigation

#### 3. **Panel** (Main Content Container)
- **Structure**: Two-part container
  - **Utility Bar** (`components/layout/utility-bar.tsx`): Top section with view name + URDG buttons
  - **Content Area**: Dynamic content that changes per page/route
- **Position**: Below navbar, to the right of sidebar
- **Margins**: Adjusts based on sidebar state (expanded/collapsed)
- **Content Changes**: The Panel structure stays the same, but what's **inside** changes per route

### **Dynamic Routing Pattern**

Stockio uses Next.js **dynamic routes** with the `module/sub-module` pattern:

**Examples:**
- `/inventario/articulos` → Items grid view
- `/inventario/articulos/[item]` → Individual item detail (dynamic SKU parameter)
- `/precios/lista-de-precios` → Price lists view
- `/mi-negocio/pdv` → Punto de venta (POS) view

**Key Principle**: To add new views, create folders following `module/sub-module` pattern. The layout (Navbar + Sidebar + Panel) automatically wraps the content.

### **Content Inside the Panel - Route Examples**

What changes between routes is the **content inside the Panel**:

| Route | Panel Content |
|-------|---------------|
| `/inventario/articulos` | Toolbar + ItemsGrid component |
| `/inventario/articulos/abc123` | ItemDetailPanel for item "abc123" |
| `/precios/lista-de-precios` | Price list UI components |
| `/mi-negocio/pdv` | Point of sale interface |

The **Panel wrapper** (Utility Bar + content area) is consistent. Only the inner content changes.

---

## 🔤 ACRONYMS & QUICK REFERENCE

### Key Terms
- **URDG** = Undo, Redo, Deshacer, Guardar (action buttons)
- **IDP** = ItemDetailPanel
- **IGR** = ItemsGrid
- **SKU** = Stock Keeping Unit (unique item identifier)
- **Agrupador** = Container item (has multiple items inside)
- **Variante** = Item variant (e.g., different colors/sizes)

### File Shortcuts
- **Main Routes**: `app/inventario/articulos/page.tsx`, `app/inventario/articulos/[item]/page.tsx`
- **Item CRUD**: `hooks/use-items.ts`
- **Change Tracking**: `hooks/use-change-tracker.ts`
- **Sidebar Logic**: `hooks/use-sidebar.ts` + `components/layout/sidebar.tsx`
- **Types**: `lib/types.ts`
- **Constants**: `lib/constants.ts`

---

## 🎨 UI COMPONENT HIERARCHY

### Layout Components

**Navbar (TopNav)**
- Location: Top fixed bar
- Contains: 
  - Left: Business info (NOIRE | Admin)
  - Center: Bookmarks (mock: Champagne Domiciano, Precios 2025, Colección Navidad)
  - Right: Message icon, Bell icon, vertical divider, User icon
- Responsive: Adjusts left margin based on sidebar state

**Utility Bar**
- Location: Below navbar
- Contains:
  - Left: View name display (e.g., "Artículos")
  - Right: URDG buttons (X icon, Check icon, Undo, Redo)
- Purpose: Quick actions + context display
- State: Shows "Guardado correctamente" success message

**Sidebar**
- Location: Left edge, full height
- States: Expanded (264px) or Collapsed (64px)
- Contains:
  - Top: Logo, search bar (when expanded), toggle button
  - Middle: Module icons with dropdowns (Mi Negocio, Ventas, Postventa, etc.)
  - Bottom: Soporte, Ajustes
- Features:
  - Hover dropdowns in collapsed mode
  - Inline dropdowns in expanded mode
  - Click-outside closes dropdowns
  - Navigation via Next.js router (href prop)

**Toolbar**
- Location: Below utility bar (only visible in items grid view)
- Contains:
  - Left: Nuevo dropdown, Acciones dropdown
  - Center: Select All checkbox
  - Right: Grid size selector (sm/md/lg)
- Conditional: Only shown on `/inventario/articulos` route

---

## 📊 DATA MODELS

### Core Types

**Item** (base)
```typescript
{
  name: string
  sku?: string
  codigoUniversal?: string
  stock?: { total, reservado, disponible }
  marca?: string
  modelo?: string
  formatoVenta?: "unidad" | "pack"
  proveedor?: string
  codigoProveedor?: string
  atributosPrincipales?: Atributo[]
  atributosInformativos?: Atributo[]
  hasVariants?: boolean
  isAgrupador?: boolean
}
```

**ItemVariant**
```typescript
{
  name: string
  sku: string
  codigoUniversal: string
  stock: { total, reservado, disponible }
  atributosPrincipales?: Atributo[]
}
```

**Item Types**:
1. **Simple Item**: No variants, direct stock
2. **Item with Variants**: hasVariants=true, contains variants[]
3. **Agrupador (Container)**: isAgrupador=true, contains items[]

### Deposit Stock
```typescript
DepositStockMap = {
  [itemSku]: {
    Ibiza: { total, reservado }
    Trujui: { total, reservado }
    Ciudadela: { total, reservado }
  }
}
```

---

## 🔄 USER FLOWS & INTERACTIONS

### Flow 1: Item Grid → Item Detail
1. User views ItemsGrid
2. Clicks on item card
3. `handleItemClickWithNavigation()` called
4. `setSelectedItem()` updates state
5. `navigateToItem()` adds to history
6. Main content switches to ItemDetailPanel
7. Toolbar hidden, detail panel shown

### Flow 2: Create New Item
1. User clicks "Nuevo" in toolbar
2. Dropdown shows: "Sin Variantes" | "Con Variantes"
3. User selects option
4. Modal opens (minimizable to navbar)
5. User fills: título, selects template, ubicación
6. Click "Crear item"
7. `handleCreateNuevoItem()` or `handleCreateNuevoItemConVariantes()`
8. New item added to top of grid
9. Modal closes, brief success animation

### Flow 3: Change Tracking & URDG
1. User makes changes (edit field, delete item)
2. Changes tracked in `useChangeTracker()`
3. URDG buttons update state:
   - Undo: revert last change
   - Redo: reapply last undone change
   - Deshacer (X): revert ALL unsaved changes
   - Guardar (Check): save all changes
4. Success message shows in utility bar
5. Change stack cleared

### Flow 4: Sidebar Interaction (Collapsed)
1. User hovers over module icon
2. `handleDropdownMouseEnter()` triggered
3. Dropdown appears after 300ms delay
4. User clicks item in dropdown → navigates
5. OR user clicks different module icon → current closes, no new opens
6. OR user clicks outside → all dropdowns close

### Flow 5: Sidebar Interaction (Expanded)
1. User sees module labels + search bar
2. User clicks module → inline dropdown expands
3. Search filters dropdown items in real-time
4. User selects filtered item → navigates

---

## 🎭 VIEW STATES

### Main Views
1. **Item Grid View** (`selectedItem === null`)
   - Shows: Navbar + UtilityBar + Toolbar + ItemsGrid
   - Margin: `mt-[11rem]` (accounts for 3 bars)

2. **Item Detail View** (`selectedItem !== null`)
   - Shows: Navbar + UtilityBar + ItemDetailPanel
   - Margin: `mt-12` (only 2 bars)
   - Toolbar hidden

### Modal States
- **Open & Visible**: Modal shown, background blurred
- **Minimized to Navbar**: Tab shown in navbar, can restore
- **Closed**: Modal destroyed

---

## 🧪 DEBUGGING & TESTING

### Console Logs Pattern
```typescript
console.log("[v0] ComponentName - action description:", data)
```

Examples:
- `console.log("[v0] useItems - hasUnsavedDeletes changed to:", value)`
- `console.log("[v0] useChangeTracker - changes count:", count)`

### Debug Log Location
- File: `user_read_only_context/text_attachments/v0_debug_logs-*.txt`
- Check before making changes: `ReadFile` the latest debug log

### Current Debug Status (Last Check)
```
[v0] useItems - hasUnsavedDeletes: false
[v0] useItems - deletedItems count: 0
[v0] useChangeTracker - changes count: 0
[v0] useChangeTracker - hasUnsavedChanges: false
```
✅ No errors, clean state

---

## 🎨 DESIGN SYSTEM

### Color Tokens
**Light Mode** (default):
- Background: `oklch(0.96 0.002 85)` - Warm off-white
- Card: `oklch(0.99 0.001 85)` - Very light warm white
- Sidebar: `oklch(0.88 0.003 240)` - Light cool gray
- Navbar: `oklch(0.86 0.003 240)` - Slightly darker cool gray

**Dark Mode**:
- Background: `oklch(0.145 0 0)` - Very dark gray
- Card: `oklch(0.145 0 0)` - Very dark gray
- Sidebar: `oklch(0.205 0 0)` - Slightly lighter gray

### Typography
- Sans: Geist Sans
- Mono: Geist Mono
- Serif: Source Serif 4

### Spacing Scale
- Navbar height: `64px` (h-16)
- Utility bar height: `48px` (h-12)
- Toolbar height: `56px` (h-14)
- Sidebar collapsed: `64px` (w-16)
- Sidebar expanded: `264px` (w-66)

---

## 🔧 COMMON TASKS

### Add New Sidebar Module
1. Add to `SIDEBAR_ITEMS` in `lib/constants.ts`
2. Define dropdown items if needed
3. No component changes needed (data-driven)

### Add New Item Template
1. Add to `TEMPLATES` array in `lib/constants.ts`
2. Define `atributosPrincipales` and `atributosInformativos`
3. Template auto-appears in modal dropdown

### Add New Detail Tab
1. Update `DetailTab` type in `lib/types.ts`
2. Add tab button in `ItemDetailPanel` tabs section
3. Add content section with conditional rendering
4. Update `selectedDetailTab` state handling

### Make Component Sidebar-Responsive
1. Add `isExpanded: boolean` prop to component
2. Add dynamic classes: `` `${isExpanded ? 'left-64' : 'left-16'}` ``
3. Add transition: `transition-all duration-300`
4. Pass prop from `page.tsx` orchestrator

---

## 📝 NAMING CONVENTIONS

### Components
- PascalCase: `ItemDetailPanel`, `TopNav`
- Suffixes: `*Panel`, `*Modal`, `*Grid`, `*Card`

### Hooks
- kebab-case files: `use-items.ts`, `use-change-tracker.ts`
- camelCase functions: `useItems()`, `useChangeTracker()`

### Types
- PascalCase: `Item`, `ItemVariant`, `DepositStockMap`
- Interfaces over types: `interface Item { ... }`

### Props
- Handlers: `on*` prefix → `onNavigateBack`, `onSave`
- Booleans: `is*`, `has*`, `show*` → `isExpanded`, `hasUnsavedChanges`
- State setters: `set*` → `setSelectedItem`, `setIsExpanded`

---

## 🚨 COMMON PITFALLS & SOLUTIONS

### Problem: Layout breaks when editing
**Cause**: Editing without reading files first
**Solution**: ALWAYS `ReadFile` before `CodeProject`

### Problem: Sidebar state not propagating
**Cause**: State managed in sidebar component, not lifted up
**Solution**: Lift `isExpanded` state to `page.tsx`, pass as prop

### Problem: Dropdowns not closing on click outside
**Cause**: Missing click-outside handler
**Solution**: Add `onClick={handleCloseDropdowns}` to main div, `stopPropagation` on sidebar

### Problem: Change tracking not working
**Cause**: Not calling `changeTracker.trackChange()` on modifications
**Solution**: Wrap mutations with change tracking calls

### Problem: Responsive layout has gaps
**Cause**: Margin calculations don't account for all bars
**Solution**: 
- Grid view: `mt-[11rem]` (navbar + utility + toolbar)
- Detail view: `mt-12` (navbar + utility only)

---

## 🔄 WORKFLOW BEST PRACTICES

### Before Making Changes
1. ✅ Read debug logs (check for errors)
2. ✅ Use `SearchRepo` or `ReadFile` to understand current state
3. ✅ Check types in `lib/types.ts` for data structure
4. ✅ Identify all files that need updates (layout components, hooks, etc.)

### During Development
1. ✅ Use parallel tool calls when reading multiple independent files
3. ✅ Add Change Comments (`// description`)
4. ✅ Add `console.log("[v0] ...")` for debugging complex logic

### After Changes
1. ✅ Write 2-4 sentence summary of changes
2. ✅ Test by checking preview
3. ✅ Update this documentation if architecture changes
4. ✅ Check debug logs for new errors

---

## 📚 INTEGRATION NOTES

### Current Integrations
- **Neon Database**: Connected (environment variables available)
- **Mock Data**: Currently using `INITIAL_ITEMS` from `lib/data/initial-items.ts`
- **API Routes**: Defined but using mock mode (`USE_MOCK_DATA = true`)

### Feature Flags
```typescript
// In hooks/use-items.ts
const USE_MOCK_DATA = true  // Toggle for real API vs mock
```

---

## 🎯 CURRENT VERSION STATUS (v49+)

### Recent Changes
- ✅ Removed tab navigation from navbar
- ✅ Added bookmarks functionality (mock data)
- ✅ Implemented sidebar expand/collapse
- ✅ Made all layouts responsive to sidebar state
- ✅ Fixed dropdown click-outside behavior
- ✅ Moved URDG buttons to utility bar
- ✅ Replaced Deshacer/Guardar text with X/Check icons
- ✅ Added vertical dividers for visual hierarchy

### Layout Configuration
```
Navbar: Chevrons | Bookmarks | Message Bell User
         (left)      (center)       (right)

Utility Bar: View Name | X Check Undo Redo
              (left)         (right)

Sidebar: Collapsed (64px) or Expanded (264px)
         Toggle button at bottom
```

---

## 🔮 FUTURE ENHANCEMENTS

### Planned Features
- Real database integration (Neon)
- User authentication
- Multi-tenant support
- Batch operations
- Export/import functionality
- Advanced search and filtering
- Reports and analytics

### Technical Debt
- Migrate from mock data to real API
- Add proper error boundaries
- Implement loading states
- Add unit tests for hooks
- Optimize re-renders with memo/callback

---

## 🆘 QUICK TROUBLESHOOTING

| Issue | Check | Solution |
|-------|-------|----------|
| App won't load | Debug logs | Look for errors in console |
| Sidebar not responding | `isExpanded` prop | Ensure passed to all layouts |
| Changes not saving | `useChangeTracker` | Verify `trackChange()` calls |
| Dropdowns stuck open | Click handlers | Check event propagation |
| Layout misaligned | Margin classes | Verify `mt-*` calculations |
| Types error | `lib/types.ts` | Check interface definitions |

---

## 📞 REFERENCE CONTACTS

**Business Owner**: NOIRE (Admin)
**Development Environment**: v0.app
**Database**: Neon PostgreSQL
**Framework**: Next.js 15 (App Router)
**Styling**: Tailwind CSS v4
**UI Components**: shadcn/ui

---

*This documentation should be updated with each significant architectural change or new feature addition. Keep it as the single source of truth for understanding Stockio's codebase.*
