# Artículos View Component Positioning & Measurements

## Overview
This document details the vertical positioning and spacing of all components in the Artículos view, from top to bottom. The layout uses fixed positioning for the navbar, toolbar, tab buttons, and tab header, with a scrollable item grid below.

---

## Component Structure (Top to Bottom)

### 1. **Navbar (TopNav)**
- **Height**: 48px
- **Position**: top: 0px
- **Z-index**: 30
- **Background**: bg-slate-100
- **Content**: Navigation items, bookmarks, breadcrumbs, URDG buttons
- **Width**: Full width (100%)

---

### 2. **Utility Bar**
- **Height**: 36px
- **Position**: top: 48px (directly below navbar)
- **Z-index**: 40
- **Background**: bg-white with border
- **Content**: Breadcrumbs, Undo/Redo buttons, Guardar/Deshacer actions
- **Width**: Full width (100%)
- **Spacing from Navbar**: 0px (directly adjacent)

---

### 3. **Toolbar**
- **Height**: 56px (h-12 button = 32px + padding)
- **Position**: top: 84px
- **Z-index**: 30
- **Background**: bg-transparent (over bg-slate-50)
- **Content**: Search bar, "Nuevo" button, "Más opciones" dropdown
- **Width**: Responsive (accounts for sidebar expansion)
- **Spacing from Utility Bar**: 0px (top: 48px + 36px height = 84px)

---

### 4. **Tab Buttons / Massive Actions Bar**
- **Height**: 206px (includes padding and buttons)
- **Position**: top: 180px
- **Z-index**: 15
- **Background**: bg-white with border and shadow
- **Content**: Editor Masivo, Auditoría de Stock, Agregar a colección (conditional), Eliminar (conditional), Ordenar, Filtros
- **Width**: Responsive (accounts for sidebar expansion)
- **Spacing from Toolbar**: 96px (top: 180px - top: 84px = 96px)

---

### 5. **Tab Header**
- **Height**: 58px (includes all selector + column labels)
- **Position**: top: 236px
- **Z-index**: 15
- **Background**: bg-slate-50
- **Content**: All items selector checkbox, column headers (Título, Marca, Categoría, Atributos, Stock), Grid size selector
- **Width**: Responsive (accounts for sidebar expansion)
- **Spacing from Tab Buttons**: 30px (top: 236px - (top: 180px + 206px height) = 30px)

---

### 6. **Item Grid (Scrollable)**
- **Start Position**: top: 294px (below tab header)
- **Height**: Scrollable (dynamic based on content)
- **Z-index**: auto (scrolls under fixed components)
- **Background**: bg-[rgba(250,251,253,1)]
- **Content**: Item cards in grid layout
- **Spacing from Tab Header**: 58px (tab header height) + 0px (no additional gap)

---

## Spacing Summary Table

| Gap | From | To | Distance (px) |
|-----|------|-----|---|
| Navbar → Utility Bar | 0 | 48 | **0px** (adjacent) |
| Utility Bar → Toolbar | 48 | 84 | **0px** (adjacent) |
| Toolbar → Tab Buttons | 84 | 180 | **96px** |
| Tab Buttons → Tab Header | 180 | 236 | **30px** |
| Tab Header → Item Grid | 236 | 294 | **58px** (covered by overlay) |

---

## Fixed Overlay / Spacer Div

A fixed overlay div covers the area from the top to the tab header to provide visual separation:
- **Height**: 294px (covers navbar + utility bar + toolbar + tab buttons gap + tab header)
- **Position**: top: 0px
- **Z-index**: 5 (below all interactive components)
- **Background**: bg-slate-50
- **Purpose**: Visual background for fixed header area, covers scrolling content behind

---

## Notes

- **Sidebar Responsive**: All horizontal measurements account for sidebar expansion/collapse
  - Expanded: left offset = 288px, width adjustment = calc(100% - 324px)
  - Collapsed: left offset = 96px, width adjustment = calc(100% - 132px)

- **Grid Size Options**: LG, MD, SM affect vertical spacing between items only

- **All components use relative left positioning** to account for dynamic sidebar width

---

## Measurement Breakdown

**Total fixed height from top to scrollable content**: 294px
- Navbar: 48px
- Utility Bar: 36px
- Toolbar: 56px
- Tab Buttons Bar: 206px (includes 96px gap)
- Tab Header: 58px (covered by overlay for visual continuity)

---

Last Updated: 2025-12-15
