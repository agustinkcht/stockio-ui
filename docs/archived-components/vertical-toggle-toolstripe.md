# Vertical Toggle Toolstripe (Archived)

This component was used in the item-detail-panel for standalone/children items to switch between Info and Stock expanded states.

## Original Location
`/components/items/item-detail-panel.tsx` - Between the Item Card and Info/Atributos columns

## Visual Description
A minimal vertical toggle with three dots representing:
- Top dot: Expand Info section
- Middle dot: Show both sections equally
- Bottom dot: Expand Stock section

With vertical "Info" and "Stock" labels below.

## Original Code

```tsx
{/* Vertical Toggle - Section Switcher (only for standalone/children items) - always left of info */}
{!isViewingContainer && (
<div className="order-3 col-span-1 flex flex-col justify-start mt-[44px] pt-6 items-start">
    <div className="sticky top-4 flex flex-col items-center">
      {/* Toggle Track */}
      <div className="relative flex flex-col items-center">
        {/* Vertical line */}
        <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200" />
        
        {/* Three-way Toggle */}
        <div className="relative z-10 flex flex-col items-center gap-1 py-2 px-1">
          {/* Info indicator */}
          <button
            onClick={() => setExpandedSection("info")}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              expandedSection === "info" 
                ? "bg-slate-800 scale-125" 
                : "bg-slate-300 hover:bg-slate-400"
            }`}
            title="Expandir Info"
          />
          
          {/* Both indicator */}
          <button
            onClick={() => setExpandedSection("both")}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer my-1 ${
              expandedSection === "both" 
                ? "bg-slate-800 scale-125" 
                : "bg-slate-300 hover:bg-slate-400"
            }`}
            title="Mostrar ambos"
          />
          
          {/* Stock indicator */}
          <button
            onClick={() => setExpandedSection("stock")}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              expandedSection === "stock" 
                ? "bg-slate-800 scale-125" 
                : "bg-slate-300 hover:bg-slate-400"
            }`}
            title="Expandir Stock"
          />
        </div>
        
        {/* Labels */}
        <div className="mt-4 flex flex-col items-center gap-6">
          <span className={`text-[8px] font-medium uppercase tracking-[0.12em] transition-all duration-300 ${
            expandedSection === "info" 
              ? "text-slate-700" 
              : "text-slate-400"
          }`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            Info
          </span>
          <span className={`text-[8px] font-medium uppercase tracking-[0.12em] transition-all duration-300 ${
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
)}
```

## Reason for Archival
Removed to simplify the UI and give more space to the Stock column. The section switching can still be done by clicking on the collapsed Info or Stock panels.

## Date Archived
January 2026
