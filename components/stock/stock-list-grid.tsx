"use client"

import type { Item, ItemVariant, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ChevronDown, ChevronRight, Minus, Check } from "lucide-react"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import { useRef, useState, useEffect, useMemo } from "react"
import { usePriceSelection } from "@/hooks/use-price-selection"
import { searchItems, sortItems, filterItems } from "@/lib/utils/item-utils"

// grid-cols-12: 6 item | 2 stock total | 2 stock reservado | 2 stock disponible
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
    isParentItem: checkIsParent,
    selectedCount,
    hasSelectedItems,
  } = usePriceSelection(items)

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Notify parent of selection state changes
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])
  useEffect(() => {
    onSelectionChangeRef.current?.(selectedCount, hasSelectedItems, selectAllActive, selectAllIndeterminate, handleSelectAll)
  }, [selectedCount, hasSelectedItems, selectAllActive, selectAllIndeterminate, handleSelectAll])

  const searchedItems = useMemo(() => searchItems(items, searchTerm), [items, searchTerm])
  const filteredItems = useMemo(() => filterItems(searchedItems, activeFilters), [searchedItems, activeFilters])
  const sortedAndFilteredItems = useMemo(() => sortItems(filteredItems, sortPriorities), [filteredItems, sortPriorities])

  function renderRow(item: Item | ItemVariant, index: number, isChild = false) {
    const itemKey = (item as any).sku || (item as any).id || `item-${index}`
    const isHovered = hoveredId === itemKey
    const { isSelected } = getSelectionState(itemKey)
    const hasVariants = !!(item as Item).variants?.length
    const isExpanded = expandedItems[index]
    const { total, reservado, disponible } = getItemStock(item)

    const imgSrc = getCategoryImage((item as any).categoria || "")

    return (
      <div key={itemKey}>
        <div
          className={`grid ${COLS} h-[60px] items-center transition-colors cursor-pointer ${
            isHovered ? "bg-blue-50/50" : isChild ? "bg-slate-50/40" : ""
          }`}
          onMouseEnter={() => setHoveredId(itemKey)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Item col */}
          <div className="flex items-center gap-3 h-full px-4 border-r border-slate-100 overflow-hidden">
            {/* Checkbox */}
            <button
              onClick={(e) => { e.stopPropagation(); handleItemSelection(itemKey) }}
              className={`shrink-0 h-3.5 w-3.5 flex items-center justify-center rounded-[3px] border border-slate-300 bg-white transition-opacity ${
                isSelected ? "bg-slate-800 border-slate-800" : isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </button>

            {/* Expand toggle for parents */}
            {hasVariants ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleVariantExpansion(index) }}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
              >
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                {imgSrc
                  ? <Image src={imgSrc} alt={(item as any).nombre || ""} width={36} height={36} className="object-cover w-full h-full" />
                  : <span className="text-[10px] text-slate-400">—</span>}
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-medium text-slate-800 truncate ${isChild ? "text-slate-600" : ""}`}>
                {(item as any).nombre || (item as any).titulo || "—"}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {[(item as any).marca, (item as any).categoria].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>

          {/* Stock Total */}
          <div className="flex items-center px-4 h-full border-r border-slate-100">
            {isEditMode && !hasVariants ? (
              <input
                type="number"
                value={total || ""}
                onChange={(e) => onStockFieldChange?.(itemKey, "total", Number.parseFloat(e.target.value) || 0)}
                className="w-full text-sm text-slate-700 bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm text-slate-700 tabular-nums px-1">{hasVariants ? "—" : (total ?? "—")}</span>
            )}
          </div>

          {/* Stock Reservado */}
          <div className="flex items-center px-4 h-full border-r border-slate-100">
            {isEditMode && !hasVariants ? (
              <input
                type="number"
                value={reservado || ""}
                onChange={(e) => onStockFieldChange?.(itemKey, "reservado", Number.parseFloat(e.target.value) || 0)}
                className="w-full text-sm text-slate-700 bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm text-slate-500 tabular-nums px-1">{hasVariants ? "—" : (reservado ?? "—")}</span>
            )}
          </div>

          {/* Stock Disponible (computed) */}
          <div className="flex items-center px-4 h-full bg-blue-50/20">
            <span className={`text-sm font-medium tabular-nums px-1 ${disponible < 0 ? "text-red-600" : "text-blue-700"}`}>
              {hasVariants ? "—" : disponible}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-0" />

        {/* Children */}
        {hasVariants && isExpanded && (item as Item).variants!.map((variant, vi) =>
          renderRow(variant as any, index * 1000 + vi, true)
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Tab Header */}
      <div className={`grid ${COLS} h-9 bg-slate-50 border border-slate-200/80 rounded-md`}>
        <div className="flex items-center px-4 border-r border-slate-200/60">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Item</span>
        </div>
        <div className="flex items-center justify-center border-r border-slate-200/60">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total</span>
        </div>
        <div className="flex items-center justify-center border-r border-slate-200/60">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reservado</span>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Disponible</span>
        </div>
      </div>

      {/* Rows */}
      <div className="mt-2 border border-slate-200/80 rounded-md overflow-hidden">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-400">
            No se encontraron items
          </div>
        ) : (
          sortedAndFilteredItems.map((item, index) => renderRow(item, index, false))
        )}
      </div>
    </div>
  )
}
