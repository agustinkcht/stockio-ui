# Stockio Dashboard - Comprehensive Refactoring Prompt

## 🎯 Objective

Refactor the Stockio Dashboard application from a monolithic 5000+ line `app/page.tsx` file into a well-architected, modular codebase optimized for efficient AI-assisted development and prompt engineering.

**CRITICAL REQUIREMENT**: Maintain 100% UI and functionality parity. Every visual element, interaction, animation, state behavior, and user flow must remain EXACTLY as it currently exists.

---

## 📋 Current State Analysis

### Current Structure
- **Main File**: `app/page.tsx` (~5000+ lines)
- **Architecture**: Monolithic client component with all logic, state, and UI in a single file
- **Components**: All UI elements defined inline within the main Dashboard component
- **State Management**: Multiple useState hooks managing complex interconnected state
- **Problem**: Difficult to navigate, slow to parse for AI agents, inefficient for targeted modifications

### Key Features to Preserve
1. **Navigation System**
   - Top navigation bar with logo and user menu
   - Sidebar navigation with collapsible sections
   - Active route highlighting
   - Mobile responsive navigation

2. **Items Grid/List View**
   - Grid layout of stock items with cards
   - Item thumbnails, names, quantities, prices
   - Filtering and search functionality
   - Sorting capabilities
   - Pagination or infinite scroll

3. **Item Details Panel**
   - Detailed view of selected items
   - Edit capabilities
   - Form validation
   - Save/cancel actions

4. **Modals and Dialogs**
   - Add new item modal
   - Edit item modal
   - Delete confirmation dialogs
   - Import/export dialogs
   - Any other modal interactions

5. **State Management**
   - Item selection state
   - Filter/search state
   - Modal open/close state
   - Form state
   - Loading states
   - Error states

6. **Data Operations**
   - CRUD operations for items
   - Bulk operations
   - Import/export functionality
   - Data persistence

---

## 🏗️ Proposed Architecture

### Directory Structure
```
app/
├── page.tsx                          # Orchestrator (100-200 lines max)
├── layout.tsx                        # Existing layout
├── globals.css                       # Existing styles
└── depositos/                        # Existing depositos route

components/
├── dashboard/                        # Dashboard-specific components
│   ├── dashboard-layout.tsx         # Main layout wrapper
│   ├── dashboard-header.tsx         # Top navigation/header
│   ├── dashboard-sidebar.tsx        # Sidebar navigation
│   ├── items-grid.tsx               # Items grid/list view
│   ├── item-card.tsx                # Individual item card
│   ├── item-details-panel.tsx       # Item details/edit panel
│   ├── filters-bar.tsx              # Filters and search bar
│   ├── modals/                      # Modal components
│   │   ├── add-item-modal.tsx
│   │   ├── edit-item-modal.tsx
│   │   ├── delete-confirmation-modal.tsx
│   │   └── import-export-modal.tsx
│   └── forms/                       # Form components
│       ├── item-form.tsx
│       └── item-form-fields.tsx
│
├── ui/                              # Existing shadcn components
├── sidebar-nav.tsx                  # Existing
├── top-nav.tsx                      # Existing
└── theme-provider.tsx               # Existing

hooks/
├── use-mobile.ts                    # Existing
├── use-toast.ts                     # Existing
├── use-items.ts                     # Items data management
├── use-item-filters.ts              # Filter/search logic
├── use-item-selection.ts            # Selection state
└── use-modals.ts                    # Modal state management

lib/
├── utils.ts                         # Existing utilities
├── types.ts                         # TypeScript types/interfaces
├── constants.ts                     # App constants
└── api/                             # API/data layer
    ├── items.ts                     # Items CRUD operations
    └── storage.ts                   # Data persistence logic
```

---

## 🔧 Refactoring Strategy

### Phase 1: Type Definitions & Constants
**Goal**: Extract all TypeScript interfaces, types, and constants

**Actions**:
1. Create `lib/types.ts` with all interfaces (Item, User, Filter, Modal states, etc.)
2. Create `lib/constants.ts` with all constant values (categories, statuses, default values, etc.)
3. Ensure all types are properly exported and documented

**Validation**: Types compile without errors, no functionality changes

---

### Phase 2: Custom Hooks Extraction
**Goal**: Extract state management logic into reusable hooks

**Actions**:
1. **`hooks/use-items.ts`**
   - Items array state
   - CRUD operations (add, update, delete)
   - Loading states
   - Error handling
   - Data persistence logic

2. **`hooks/use-item-filters.ts`**
   - Search query state
   - Filter criteria state
   - Sorting state
   - Filtered items computation
   - Filter reset functionality

3. **`hooks/use-item-selection.ts`**
   - Selected item(s) state
   - Selection handlers
   - Bulk selection logic

4. **`hooks/use-modals.ts`**
   - Modal open/close states for all modals
   - Modal data state (e.g., item being edited)
   - Open/close handlers

**Validation**: All state behavior remains identical, no UI changes

---

### Phase 3: UI Component Extraction
**Goal**: Break down monolithic JSX into focused, single-responsibility components

**Actions**:

1. **Layout Components**
   - `components/dashboard/dashboard-layout.tsx`: Main layout wrapper with sidebar and content area
   - `components/dashboard/dashboard-header.tsx`: Top navigation, logo, user menu
   - `components/dashboard/dashboard-sidebar.tsx`: Sidebar navigation with all menu items

2. **Items Display Components**
   - `components/dashboard/items-grid.tsx`: Grid container with all items
   - `components/dashboard/item-card.tsx`: Individual item card with thumbnail, name, price, actions
   - `components/dashboard/filters-bar.tsx`: Search input, filter dropdowns, sort controls

3. **Detail/Edit Components**
   - `components/dashboard/item-details-panel.tsx`: Right panel showing item details
   - `components/dashboard/forms/item-form.tsx`: Reusable form for add/edit
   - `components/dashboard/forms/item-form-fields.tsx`: Individual form fields

4. **Modal Components**
   - `components/dashboard/modals/add-item-modal.tsx`: Add new item modal
   - `components/dashboard/modals/edit-item-modal.tsx`: Edit existing item modal
   - `components/dashboard/modals/delete-confirmation-modal.tsx`: Delete confirmation
   - `components/dashboard/modals/import-export-modal.tsx`: Import/export functionality

**Component Design Principles**:
- Each component should be 50-200 lines maximum
- Props should be explicitly typed
- Components should be focused on a single responsibility
- Use composition over complexity
- Maintain exact same styling (className preservation)

**Validation**: Visual regression testing - UI must look and behave identically

---

### Phase 4: API/Data Layer Extraction
**Goal**: Separate data operations from UI logic

**Actions**:
1. **`lib/api/items.ts`**
   - `getItems()`: Fetch all items
   - `getItemById(id)`: Fetch single item
   - `createItem(data)`: Create new item
   - `updateItem(id, data)`: Update existing item
   - `deleteItem(id)`: Delete item
   - `bulkDelete(ids)`: Bulk delete operation
   - `importItems(data)`: Import functionality
   - `exportItems()`: Export functionality

2. **`lib/api/storage.ts`**
   - Local storage operations
   - Data persistence
   - Cache management

**Validation**: All data operations work identically

---

### Phase 5: Orchestrator Page
**Goal**: Create a clean, minimal `app/page.tsx` that composes all components

**Structure**:
```tsx
'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { ItemsGrid } from '@/components/dashboard/items-grid'
import { ItemDetailsPanel } from '@/components/dashboard/item-details-panel'
import { FiltersBar } from '@/components/dashboard/filters-bar'
import { AddItemModal } from '@/components/dashboard/modals/add-item-modal'
import { EditItemModal } from '@/components/dashboard/modals/edit-item-modal'
import { DeleteConfirmationModal } from '@/components/dashboard/modals/delete-confirmation-modal'

import { useItems } from '@/hooks/use-items'
import { useItemFilters } from '@/hooks/use-item-filters'
import { useItemSelection } from '@/hooks/use-item-selection'
import { useModals } from '@/hooks/use-modals'

export default function Dashboard() {
  // Hook calls
  const items = useItems()
  const filters = useItemFilters(items.data)
  const selection = useItemSelection()
  const modals = useModals()

  // Compose and render
  return (
    <DashboardLayout
      header={<DashboardHeader />}
      sidebar={<DashboardSidebar />}
    >
      <FiltersBar {...filters} />
      <ItemsGrid 
        items={filters.filteredItems}
        onItemClick={selection.selectItem}
      />
      {selection.selectedItem && (
        <ItemDetailsPanel 
          item={selection.selectedItem}
          onClose={selection.clearSelection}
        />
      )}
      
      {/* Modals */}
      <AddItemModal {...modals.addItem} />
      <EditItemModal {...modals.editItem} />
      <DeleteConfirmationModal {...modals.deleteConfirm} />
    </DashboardLayout>
  )
}
```

**Target**: 100-200 lines maximum, purely compositional

---

## ✅ Validation Checklist

After refactoring, verify the following:

### Visual Parity
- [ ] All colors, fonts, spacing match exactly
- [ ] All icons and images display correctly
- [ ] All animations and transitions work identically
- [ ] Responsive behavior matches on all screen sizes
- [ ] Dark mode (if applicable) works correctly

### Functional Parity
- [ ] All navigation works identically
- [ ] Item grid displays correctly with all data
- [ ] Search and filtering produce same results
- [ ] Sorting works identically
- [ ] Item selection behaves the same
- [ ] All modals open/close correctly
- [ ] All forms validate and submit identically
- [ ] CRUD operations work exactly as before
- [ ] Import/export functionality preserved
- [ ] All keyboard shortcuts work (if any)
- [ ] All error states display correctly
- [ ] All loading states display correctly

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] All components under 200 lines
- [ ] All hooks properly documented
- [ ] All types explicitly defined
- [ ] No duplicate code
- [ ] Consistent naming conventions

### AI Agent Efficiency
- [ ] Components are easily discoverable by name
- [ ] Each component has a single, clear responsibility
- [ ] Related code is co-located
- [ ] File names clearly indicate contents
- [ ] Maximum file size is ~200 lines for easy parsing

---

## 🚀 Execution Instructions

**For the AI Agent**:

1. **Read First**: Before making ANY changes, read the current `app/page.tsx` completely to understand all functionality
2. **Preserve Everything**: Take screenshots of the current UI to reference during refactoring
3. **Incremental Approach**: Refactor in phases, validating after each phase
4. **No Functional Changes**: This is purely a structural refactor - zero behavior changes
5. **Maintain Imports**: Ensure all existing imports are preserved in appropriate files
6. **Preserve Styling**: Copy className strings exactly - no style changes
7. **Test Continuously**: After each component extraction, verify the UI still works

**Phase Execution Order**:
1. Phase 1: Types & Constants (safest, no behavior changes)
2. Phase 2: Custom Hooks (test state management thoroughly)
3. Phase 3: UI Components (most complex, validate UI continuously)
4. Phase 4: API Layer (validate data operations)
5. Phase 5: Orchestrator (final composition)

---

## 📊 Success Metrics

**Before Refactoring**:
- Main file: ~5000 lines
- Components: 1 monolithic component
- AI token usage for reading: ~15,000+ tokens
- Time to locate specific code: High

**After Refactoring**:
- Main file: ~100-200 lines
- Components: 20-30 focused components
- AI token usage for reading: ~500-2000 tokens per component
- Time to locate specific code: Low (clear file names and structure)

**Efficiency Gain**: 
- 90%+ reduction in tokens needed to read relevant code
- 80%+ reduction in time to locate and modify specific features
- 100% preservation of UI and functionality

---

## 🎨 UI/Functionality Preservation Guarantee

**This refactoring MUST maintain**:
- ✅ Every pixel of the current UI
- ✅ Every interaction and animation
- ✅ Every state transition
- ✅ Every data operation
- ✅ Every error message
- ✅ Every loading state
- ✅ Every modal behavior
- ✅ Every form validation rule
- ✅ Every keyboard shortcut
- ✅ Every responsive breakpoint
- ✅ Every color and style
- ✅ Every icon and image

**Zero tolerance for**:
- ❌ Visual changes
- ❌ Behavior changes
- ❌ Performance degradation
- ❌ Missing features
- ❌ New bugs

---

## 📝 Notes for AI Agent

- **Read the entire current `app/page.tsx` before starting** - understand all features
- **Use my ability to quickly edit aggressively** - skip unchanged code when creating new files
- **Preserve all comments** from the original code
- **Maintain all existing dependencies** - don't add new packages unless absolutely necessary
- **Keep all existing UI components** from `components/ui/*` - don't modify shadcn components
- **Test after each phase** - don't proceed if something breaks
- **When in doubt, preserve the original** - this is a structural refactor, not a feature change

---

## 🔍 Quick Reference: What Goes Where

| Current Location | New Location | Purpose |
|-----------------|--------------|---------|
| `interface Item {}` | `lib/types.ts` | Type definitions |
| `const CATEGORIES = [...]` | `lib/constants.ts` | Constants |
| `const [items, setItems] = useState([])` | `hooks/use-items.ts` | Items state |
| `const [searchQuery, setSearchQuery] = useState('')` | `hooks/use-item-filters.ts` | Filter state |
| `const [isModalOpen, setIsModalOpen] = useState(false)` | `hooks/use-modals.ts` | Modal state |
| `<div className="grid">...</div>` (items grid) | `components/dashboard/items-grid.tsx` | Items display |
| `<Card>...</Card>` (item card) | `components/dashboard/item-card.tsx` | Item card |
| `<Dialog>...</Dialog>` (add item) | `components/dashboard/modals/add-item-modal.tsx` | Add modal |
| `function handleAddItem() {}` | `hooks/use-items.ts` or `lib/api/items.ts` | Business logic |

---

## ✨ Expected Outcome

A clean, modular, maintainable codebase where:
- The AI agent can quickly locate any feature by filename
- Changes to one feature don't require reading thousands of lines
- New features can be added without touching existing code
- The UI and functionality remain pixel-perfect identical to the original
- Development velocity increases significantly
- Token usage for AI operations decreases by 80-90%

**End Result**: A professional, production-ready architecture that looks and works exactly like the original, but is infinitely more maintainable and AI-agent-friendly.
