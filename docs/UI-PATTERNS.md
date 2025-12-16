# UI Patterns & Implementation Guide

> AI-optimized reference for reusable UI patterns, layout techniques, and implementation solutions in Stockio.

---

## Sticky Sections with Masking Layers

**Use Case:** Create sticky headers/sections that remain visible during scroll while hiding scrolling content behind them.

**Problem Solved:** Prevents scrolling content from being visible in gaps between fixed/sticky UI elements (navbar, toolbar, sticky sections).

### Implementation Pattern

#### 1. Sticky Section Setup

```tsx
{/* Sticky Section */}
<div
  className={`sticky bg-white border border-gray-200 rounded-lg shadow-sm z-10`}
  style={{
    top: `${POSITION}px`, // Calculate based on elements above
  }}
>
  {/* Section content */}
</div>

{/* Spacer to maintain layout when sticky activates */}
<div style={{ height: `${HEIGHT}px` }} />
```

#### 2. Masking Layer

```tsx
{/* Background masking layer */}
<div
  className={`fixed bg-[#f8f9fa] pointer-events-none z-20 transition-all duration-300 ease-in-out`}
  style={{
    left: isSidebarExpanded ? "240px" : "64px",
    right: 0,
    top: `${START_POSITION}px`,
    height: `${GAP_HEIGHT}px`,
  }}
/>
```

**Key Attributes:**
- `fixed` - Stays in place during scroll
- `z-20` - Higher than content, lower than protected element
- `pointer-events-none` - Doesn't block interactions
- Background color matches page background
- Dynamic positioning for responsive layouts

#### 3. Z-Index Hierarchy

```
Scrolling content:    z-0 (default)
Sticky sections:      z-10
Masking layers:       z-20
Sticky toolbar:       z-30 (above masks)
Fixed navbar:         z-40+ (topmost)
```

### Real Implementation Example (Items Grid)

**Layout Structure:**
```
TopNav:         48px height, fixed top-0
UtilityBar:     84px height, fixed top-[48px]
Toolbar:        24px height, sticky top-[84px], z-30
---GAP: 24px--- (masked)
Tab Section:    sticky top-[180px], z-10
---GAP: 2px---  (masked)
Items Grid:     scrollable content
```

**Masking Layer:**
```tsx
<div
  className="fixed bg-[#f8f9fa] pointer-events-none z-20 transition-all duration-300 ease-in-out"
  style={{
    left: isSidebarExpanded ? "240px" : "64px",
    right: 0,
    top: "84px",      // Start at toolbar
    height: "96px",   // Cover 24px gap + extend to tab section (180px - 84px)
  }}
/>
```

**Calculations:**
- Toolbar position: 84px (TopNav 48px + UtilityBar 36px visible + spacing)
- Tab section position: 180px (84px + 72px toolbar content + 24px gap)
- Masking height: 96px (covers gap and area behind toolbar/tab section)

### Content Alignment with Sticky Sections

**Problem:** Items need to align with sticky section content without visible card wrapper.

**Solution:** Match nested padding structure

```tsx
{/* Tab Section - nested padding */}
<div className="px-4">           {/* Outer: 16px */}
  <div className="px-4">         {/* Inner: 16px (total 32px) */}
    {/* Labels here */}
  </div>
</div>

{/* Items Grid - matching alignment */}
<div className="pl-[18px] pr-12">  {/* Left: 18px, Right: 48px */}
  {/* Items align with labels above */}
</div>
```

**Technique:** Use arbitrary values `pl-[18px]` for surgical precision when standard Tailwind classes don't align perfectly.

---

## Layout Overflow & Clipping

**Pattern:** Prevent content from escaping boundaries

```tsx
<div className="overflow-hidden">
  {/* Clipped content */}
</div>
```

**Use with:** Sticky sections to ensure scrolling content doesn't escape horizontally or appear in wrong areas.

---

## Responsive Sidebar Width Adjustments

**Pattern:** Dynamic positioning based on sidebar state

```tsx
style={{
  left: isSidebarExpanded ? "240px" : "64px",
  right: 0,
  width: isSidebarExpanded 
    ? "calc(100% - 240px)" 
    : "calc(100% - 64px)",
}}
```

**Applied to:**
- Masking layers
- Fixed positioning elements
- Full-width sections that need to account for sidebar

---

## Notes for Future Patterns

- Always use `transition-all duration-300 ease-in-out` for smooth responsive transitions
- Test z-index hierarchy with browser devtools to ensure proper stacking
- Document specific pixel values and calculations for maintainability
- Use arbitrary values `[18px]` when precision is needed beyond Tailwind's scale
