# UI Components Library

This document contains reusable UI component patterns that can be used across the application.

---

## Toolstripe (Vertical Toggle)

A minimal, high-tech vertical toggle component for switching between two sections/panels. Features a gradient line with indicator dots and a rotating chevron.

### Use Cases
- Switching between two expandable panels
- Vertical navigation between sections
- Toggle control for side-by-side content areas

### Implementation

```tsx
{/* Vertical Toggle - Section Switcher */}
<div className="flex flex-col items-center justify-start pt-6">
  <div className="sticky top-4 flex flex-col items-center">
    {/* Toggle Track */}
    <div className="relative flex flex-col items-center">
      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200" />
      
      {/* Toggle Button */}
      <button
        onClick={() => setExpandedSection(expandedSection === "info" ? "stock" : "info")}
        className="relative z-10 group flex flex-col items-center gap-2 py-3 px-1.5 cursor-pointer"
        title={expandedSection === "info" ? "Expandir Stock" : "Expandir Info"}
      >
        {/* Top indicator */}
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          expandedSection === "info" 
            ? "bg-slate-800 scale-110" 
            : "bg-slate-300 group-hover:bg-slate-400"
        }`} />
        
        {/* Center toggle pill */}
        <div className="relative bg-slate-100 border border-slate-200/80 rounded-full p-1 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:border-slate-300">
          <div className="flex flex-col items-center gap-0.5">
            <ChevronRight className={`w-3 h-3 text-slate-500 transition-all duration-300 ${
              expandedSection === "stock" ? "rotate-180" : ""
            } group-hover:text-slate-700`} />
          </div>
        </div>
        
        {/* Bottom indicator */}
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          expandedSection === "stock" 
            ? "bg-slate-800 scale-110" 
            : "bg-slate-300 group-hover:bg-slate-400"
        }`} />
      </button>
      
      {/* Labels */}
      <div className="mt-3 flex flex-col items-center gap-6">
        <span className={`text-[9px] font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
          expandedSection === "info" 
            ? "text-slate-700" 
            : "text-slate-400"
        }`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          Info
        </span>
        <span className={`text-[9px] font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
          expandedSection === "stock" 
            ? "text-slate-700" 
            : "text-slate-400"
        }`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          Stock
        </span>
      </div>
    </div>
  </div>
</div>
```

### Required State
```tsx
const [expandedSection, setExpandedSection] = useState<"info" | "stock">("stock")
```

### Design Characteristics
- **Vertical gradient line**: Creates visual connection between sections
- **Indicator dots**: Show active section with scale animation
- **Center pill**: Houses the chevron toggle button
- **Vertical labels**: Rotated text for section names
- **Hover states**: Subtle shadow and color transitions
- **Smooth animations**: 300ms duration for all transitions

### Styling Notes
- Uses slate color palette for neutral, sophisticated look
- Gradient line: `from-slate-200 via-slate-300 to-slate-200`
- Active indicator: `bg-slate-800 scale-110`
- Inactive indicator: `bg-slate-300` with hover state `bg-slate-400`
- Labels use `text-[9px]` with `tracking-[0.15em]` for refined typography
