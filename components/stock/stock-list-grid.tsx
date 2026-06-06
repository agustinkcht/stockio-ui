"use client"

import type { Item, ItemVariant, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ChevronDown, ChevronRight, Minus } from "lucide-react"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { useRef, useState, useEffect, useMemo } from "react"
import { usePriceSelection } from "@/hooks/use-price-selection"
import { searchItems, sortItems, filterItems } from "@/lib/utils/item-utils"

// grid-cols-12: 6 item | 2 total | 2 reservado | 2 disponible
const COLS = "grid-cols-[minmax(0,6fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)]"

interface StockListGridProps {
  items: Item[]
  gridSize: string
  expandedItems: Record<number, boolean>
  toggleVariantExpansion: (index: number) => void
  onStockFieldChange?: (itemSku: string, field: "total" | "reservado", value: number) => void
  searchTerm: string
  activeFilters: FilterConfig
  sortPriorities: SortFactorConfig[]
  onSelectionChange?: (count: number, has: boolean, selectAll: boolean, selectAllIndeterminate: boolean, handleSelectAll: () => void) => void
  isEditMode?: boolean
}

function getItemStock(item: Item | ItemVariant) {
  const stockField = (item as any).stock
  const stockObj = stockField && typeof stockField === "object" ? stockField : null
  const total = (item as any).stockTotal ?? stockObj?.total ?? (typeof stockField === "number" ? stockField : 0)
  const reservado = (item as any).stockReservado ?? stockObj?.reservado ?? (item as any).reservado ?? 0
  const disponible = Math.max(0, total - reservado)
  return { total, reservado, disponible }
}

export function StockListGrid({
  items,
  gridSize,
  expandedItems,
  toggleVariantExpansion,
  onStockFieldChange,
  searchTerm = "",
  activeFilters = { tipos: [], categorias: [], marcas: [], proveedores: [], stock: [], depositos: [] },
  sortPriorities = [{ factor: "nombre" as const, direction: "asc" as const }],
  onSelectionChange,
  isEditMode = false,
}: StockListGridProps) {
  const {
    selectAllActive,
    selectAllIndeterminate,
    handleItemSelection,
    handleSelectAll,
    getSelectionState,
    selectedCount,
    hasSelectedItems,
  } = usePriceSelection(items)

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Notify parent of selection state changes — same pattern as price-grid
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])
  useEffect(() => {
    onSelectionChangeRef.current?.(selectedCount, hasSelectedItems, selectAllActive, selectAllIndeterminate, handleSelectAll)
  }, [selectedCount, hasSelectedItems, selectAllActive, selectAllIndeterminate, handleSelectAll])

  const searchedItems = useMemo(() => searchItems(items, searchTerm), [items, searchTerm])
  const filteredItems = useMemo(() => filterItems(searchedItems, activeFilters), [searchedItems, activeFilters])
  const sortedAndFilteredItems = useMemo(() => sortItems(filteredItems, sortPriorities), [filteredItems, sortPriorities])

  function renderItemRow(item: Item, index: number, isChild = false) {
    const isParent = !isChild && ((item.variants && item.variants.length > 0) || (item.items && item.items.length > 0))
    const children = item.variants || item.items || []
    const isExpanded = expandedItems[index]
    const itemId = item.sku || (item as any).id || `item-${index}`
    const isHovered = hoveredId === itemId

    // Use the same getSelectionState signature as price-grid
    const selectionState = getSelectionState(item, isChild)
    const { total, reservado, disponible } = getItemStock(item)
    const imgSrc = getCategoryImage((item as any).categoria || "")

    return (
      <div key={itemId}>
        <div
          className={`grid ${COLS} h-[60px] items-center transition-colors ${
            isHovered ? "bg-blue-50/50" : isChild ? "bg-slate-50/40" : "bg-white"
          }`}
          onMouseEnter={() => setHoveredId(itemId)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Item col */}
          <div className="flex items-center gap-2.5 h-full px-4 border-r border-slate-100 overflow-hidden min-w-0">
            {/* Checkbox — same pattern as price-grid */}
            <div className={`transition-opacity shrink-0 ${isHovered || selectionState.checked ? "opacity-100" : "opacity-0"}`}>
              {selectionState.indeterminate ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleItemSelection(item, isChild) }}
                  className="flex items-center justify-center w-4 h-4 border border-primary bg-primary rounded-[4px] cursor-pointer"
                >
                  <Minus className="w-3 h-3 text-primary-foreground" />
                </button>
              ) : (
                <Checkbox
                  checked={selectionState.checked}
                  onCheckedChange={() => handleItemSelection(item, isChild)}
                  className="cursor-pointer"
                />
              )}
            </div>

            {/* Thumbnail / expand toggle */}
            {isParent ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleVariantExpansion(index) }}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
              >
                {isExpanded
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                {imgSrc
                  ? <Image src={imgSrc} alt={item.name || ""} width={36} height={36} className="object-cover w-full h-full" />
                  : <span className="text-[10px] text-slate-400 font-medium">{(item.name || "").slice(0, 2).toUpperCase()}</span>}
              </div>
            )}

            <div className="flex flex-col min-w-0 flex-1">
              <span className={`text-sm font-medium truncate ${isChild ? "text-slate-600" : "text-slate-800"}`}>
                {item.name || "—"}
              </span>
              {!isChild && (
                <span className="text-[11px] text-slate-400 truncate">
                  {[(item as any).marca, (item as any).categoria].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
          </div>

          {/* Parent rows: empty cells, no borders, no dashes */}
          {isParent ? (
            <>
              <div className="h-full" />
              <div className="h-full" />
              <div className="h-full" />
            </>
          ) : (
            <>
              {/* Stock Total */}
              <div className="flex items-center justify-center px-4 h-full border-r border-slate-100">
                {isEditMode ? (
                  <input
                    type="number"
                    value={total || ""}
                    onChange={(e) => onStockFieldChange?.(itemId, "total", Number.parseFloat(e.target.value) || 0)}
                    className="w-full text-sm text-slate-700 bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm text-slate-700 tabular-nums">{total ?? "—"}</span>
                )}
              </div>

              {/* Stock Reservado */}
              <div className="flex items-center justify-center px-4 h-full border-r border-slate-100">
                {isEditMode ? (
                  <input
                    type="number"
                    value={reservado || ""}
                    onChange={(e) => onStockFieldChange?.(itemId, "reservado", Number.parseFloat(e.target.value) || 0)}
                    className="w-full text-sm text-slate-500 bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm text-slate-500 tabular-nums">{reservado ?? "—"}</span>
                )}
              </div>

              {/* Stock Disponible (computed, read-only) */}
              <div className="flex items-center justify-center px-4 h-full bg-blue-50/20">
                <span className={`text-sm font-medium tabular-nums ${disponible < 0 ? "text-red-600" : disponible > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                  {disponible}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Row divider */}
        <div className="h-px bg-slate-100" />

        {/* Children */}
        {isParent && isExpanded && children.map((child, ci) =>
          renderItemRow(child as Item, index * 1000 + ci, true)
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Tab Header */}
      <div className={`grid ${COLS} h-9 bg-slate-900 rounded-md`}>
        <div className="flex items-center justify-center px-4 border-r border-slate-700/50">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Item</span>
        </div>
        <div className="flex items-center justify-center border-r border-slate-700/50">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
        </div>
        <div className="flex items-center justify-center border-r border-slate-700/50">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reservado</span>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Disponible</span>
        </div>
      </div>

      {/* Rows */}
      <div className="mt-2 border border-slate-200/80 rounded-md overflow-hidden bg-white">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-400">
            No se encontraron items
          </div>
        ) : (
          sortedAndFilteredItems.map((item, index) => renderItemRow(item, index, false))
        )}
      </div>
    </div>
  )
}
