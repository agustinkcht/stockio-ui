"use client"

import type { Item, ItemVariant, SortFactorConfig, FilterConfig } from "@/lib/types"
import { Plus, ChevronDown, ChevronRight, Copy, Minus, MoreVertical } from "lucide-react"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { usePriceSelection } from "@/hooks/use-price-selection"
import { searchItems, sortItems, filterItems, getUniqueCategorias, getUniqueMarcas, getUniqueProveedores } from "@/lib/utils/item-utils"
import { BulkPriceModal } from "@/components/modals/bulk-price-modals"
import { useSettings } from "@/lib/contexts/settings-context"

interface PricingData {
  costo: number
  margen: number
  iva: number
  precioFinal: number
}

type BulkModalType = "costo" | "precioFinal" | "margen" | "iva" | null

interface PriceGridProps {
  items: Item[]
  gridSize: string
  expandedItems: Record<number, boolean>
  toggleVariantExpansion: (index: number) => void
  gridSizeDropdownOpen: boolean
  setGridSizeDropdownOpen: (value: boolean) => void
  setGridSize: (size: string) => void
  onPriceFieldChange?: (itemSku: string, field: string, value: any) => void
  onBulkEdit?: (type: BulkModalType, operation: string, value: number, unit: string, targetSkus: string[]) => void
  // Lifted state from page
  searchTerm: string
  activeFilters: FilterConfig
  sortPriorities: SortFactorConfig[]
  // Selection callbacks to page
  onSelectionChange?: (count: number, has: boolean, selectAll: boolean, selectAllIndeterminate: boolean, handleSelectAll: () => void) => void
  isEditMode?: boolean
  precioFinalMode?: "con_iva" | "sin_iva"
  onPrecioFinalModeChange?: (mode: "con_iva" | "sin_iva") => void
  onBulkModalOpen?: (type: BulkModalType) => void
  bulkModalOpenRef?: React.MutableRefObject<(type: BulkModalType) => void>
}

const IVA_OPTIONS = [
  { value: 0, label: "0%" },
  { value: 10.5, label: "10.5%" },
  { value: 21, label: "21%" },
]

export function PriceGrid({
  items,
  gridSize,
  expandedItems,
  toggleVariantExpansion,
  gridSizeDropdownOpen,
  setGridSizeDropdownOpen,
  setGridSize,
  onPriceFieldChange,
  onBulkEdit,
  searchTerm = "",
  activeFilters = { tipos: [], categorias: [], marcas: [], proveedores: [], stock: [], depositos: [] },
  sortPriorities = [{ factor: "nombre" as const, direction: "asc" as const }],
  onSelectionChange,
  isEditMode = false,
  precioFinalMode: precioFinalModeProp,
  onPrecioFinalModeChange,
  onBulkModalOpen,
  bulkModalOpenRef,
}: PriceGridProps) {
  const {
    selectAllActive,
    selectAllIndeterminate,
    handleItemSelection,
    handleSelectAll,
    getSelectionState,
    isParentItem: checkIsParent,
    selectedCount,
    hasSelectedItems,
    getSelectedSkus,
  } = usePriceSelection(items)
  const { precios: preciosSettings } = useSettings()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [bulkModalType, setBulkModalType] = useState<BulkModalType>(null)

  // Notify parent of selection state changes
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])
  useEffect(() => {
    onSelectionChangeRef.current?.(selectedCount, hasSelectedItems, selectAllActive, selectAllIndeterminate, handleSelectAll)
  }, [selectedCount, hasSelectedItems, selectAllActive, selectAllIndeterminate, handleSelectAll])
  const [precioFinalModeInternal, setPrecioFinalModeInternal] = useState<"con_iva" | "sin_iva">("con_iva")
  const precioFinalMode = precioFinalModeProp ?? precioFinalModeInternal
  const setPrecioFinalMode = (mode: "con_iva" | "sin_iva") => {
    setPrecioFinalModeInternal(mode)
    onPrecioFinalModeChange?.(mode)
  }
  const handleBulkModalOpen = (type: BulkModalType) => {
    setBulkModalType(type)
    onBulkModalOpen?.(type)
  }
  // Expose trigger to parent via ref (same pattern as gridHandleSelectAllRef)
  useEffect(() => {
    if (bulkModalOpenRef) bulkModalOpenRef.current = handleBulkModalOpen
  })
  const [showPrecioModeDropdown, setShowPrecioModeDropdown] = useState(false)

  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])
  const availableProveedores = useMemo(() => getUniqueProveedores(items), [items])
  const availableDepositos = useMemo(() => ["Torcuato", "Trujui"], [])

  const searchedItems = useMemo(() => searchItems(items, searchTerm), [items, searchTerm])
  const filteredItems = useMemo(() => filterItems(searchedItems, activeFilters), [searchedItems, activeFilters])
  const sortedAndFilteredItems = useMemo(
    () => sortItems(filteredItems, sortPriorities),
    [filteredItems, sortPriorities],
  )

  // Get all visible SKUs (from sorted and filtered items)
  const getVisibleSkus = useCallback((itemList: Item[]): string[] => {
    const skus: string[] = []
    for (const item of itemList) {
      const isParent = (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0)
      if (isParent) {
        const children = item.variants || item.items || []
        for (const child of children) {
          // Prefer sku over id for consistency with lookup functions
          const sku = (child as any).sku || (child as any).id
          if (sku) skus.push(sku)
        }
      } else {
        // Prefer sku over id for consistency with lookup functions
        const sku = item.sku || (item as any).id
        if (sku) skus.push(sku)
      }
    }
    return skus
  }, [])

  // Get target SKUs for bulk edit (selected items take priority over visible items)
  const getTargetSkusForBulkEdit = useCallback((): string[] => {
    if (hasSelectedItems) {
      return getSelectedSkus()
    }
    return getVisibleSkus(sortedAndFilteredItems)
  }, [hasSelectedItems, getSelectedSkus, getVisibleSkus, sortedAndFilteredItems])

  // Get count of items that will be affected by bulk edit
  const bulkEditTargetCount = useMemo(() => {
    return getTargetSkusForBulkEdit().length
  }, [getTargetSkusForBulkEdit])

  // Get modal title based on type
  const getBulkModalTitle = (type: BulkModalType): string => {
    switch (type) {
      case "costo":
        return "Modificar Costo de x items"
      case "precioFinal":
        return "Modificar Precio Final de x items"
      case "margen":
        return "Modificar Margen de x items"
      case "iva":
        return "Modificar IVA de x items"
      default:
        return ""
    }
  }

  // Handle bulk edit apply
  const handleBulkEditApply = (operation: string, value: number, unit: string) => {
    const targetSkus = getTargetSkusForBulkEdit()
    if (onBulkEdit && bulkModalType) {
      onBulkEdit(bulkModalType, operation, value, unit, targetSkus)
    }
    setBulkModalType(null)
  }

  const calculatePrecioFinal = (costo: number, margen: number): number => {
    return Math.round(costo * (1 + margen / 100))
  }

  const calculateMargen = (precioFinal: number, costo: number): number => {
    if (costo === 0) return 0
    return Math.round((precioFinal / costo - 1) * 1000) / 10
  }

  const updatePricingField = (
    itemSku: string,
    field: keyof PricingData,
    value: number,
    currentPricing: PricingData,
  ) => {
    let formattedValue = value
    if (field === "costo" || field === "precioFinal") {
      formattedValue = Math.round(value)
    } else if (field === "margen") {
      formattedValue = Math.round(value * 10) / 10
    }

    const updated = { ...currentPricing, [field]: formattedValue }

    if (field === "precioFinal") {
      // When editing precio final, always recalculate margen
      updated.margen = calculateMargen(formattedValue, updated.costo)
    } else if (field === "costo") {
      // When editing costo, behavior depends on settings
      if (preciosSettings.costoBehavior === "preservePrecioFinal") {
        // Preserve precio final, recalculate margen
        updated.margen = calculateMargen(updated.precioFinal, formattedValue)
      } else {
        // Preserve margen, recalculate precio final
        updated.precioFinal = calculatePrecioFinal(formattedValue, updated.margen)
      }
    } else if (field === "margen") {
      // When editing margen, always recalculate precio final
      updated.precioFinal = calculatePrecioFinal(updated.costo, formattedValue)
    }
    // IVA changes don't affect other fields

    if (onPriceFieldChange) {
      onPriceFieldChange(itemSku, "precio", updated)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-precio-dropdown]")) {
        setShowPrecioModeDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getFullTitle = (item: Item | ItemVariant, isChild = false): string => {
    let fullTitle = item.name

    if (item.atributosPrincipales && Array.isArray(item.atributosPrincipales)) {
      const attributeValues = item.atributosPrincipales
        .map((attr) => attr.value)
        .filter((value) => value && value.trim() !== "")
        .join(" ")

      if (attributeValues) {
        fullTitle = `${fullTitle} ${attributeValues}`
      }
    }

    return fullTitle
  }

  const getItemPricing = (item: Item | ItemVariant): PricingData => {
    if (item.precio) {
      return {
        costo: item.precio.costo || 0,
        margen: item.precio.margen || 0,
        iva: item.precio.iva || 21,
        precioFinal: item.precio.precioFinal || 0,
      }
    }
    return { costo: 0, margen: 0, iva: 21, precioFinal: 0 }
  }

  // cols: grid-cols-12 — 6 item | 2 costo | 1 margen | 1 iva | 2 precio venta
  const COLS = "grid-cols-12"

  const renderItemRow = (item: Item, index: number, isChild = false, isLastChild = false, parentProveedor?: string) => {
    const isParent = !isChild && ((item.variants && item.variants.length > 0) || (item.items && item.items.length > 0))
    const children = item.variants || item.items || []
    const isExpanded = expandedItems[index]
    const itemId = item.sku || (item as any).id || `item-${index}`
    const isHovered = hoveredId === itemId
    const itemKey = itemId
    const itemPricing = getItemPricing(item)
    const selectionState = getSelectionState(item, isChild)
    const hasCosto = itemPricing.costo > 0

    return (
      <div key={item.sku || index}>
        <div
          className={`grid ${COLS} h-[60px] items-center transition-colors ${
            isHovered ? "bg-blue-50/50" : isChild ? "bg-slate-50/40" : "bg-white"
          }`}
          onMouseEnter={() => setHoveredId(itemId)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Item info — col-span-6 */}
          <div className="col-span-6 flex items-center gap-2.5 min-w-0 px-4 h-full border-r border-slate-100">
            {/* Checkbox — inline, same as stock grid */}
            <div className={`transition-opacity shrink-0 ${isHovered || selectionState.checked ? "opacity-100" : "opacity-0"}`}>
              {selectionState.indeterminate ? (
                <button
                  onClick={() => handleItemSelection(item, isChild)}
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

            {/* Thumbnail-style expand toggle (parent) or image tile (child/standalone) */}
            {isParent ? (
              <button
                onClick={() => toggleVariantExpansion(index)}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                <Image
                  src={getCategoryImage(item.categoria || "")}
                  alt={item.name}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isChild ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                  {item.atributosPrincipales?.map((attr, idx) =>
                    attr.value ? (
                      <span key={idx} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded shrink-0">
                        {attr.value}
                      </span>
                    ) : null
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-800 truncate">{getFullTitle(item)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.marca && <span className="text-xs text-slate-400">{item.marca}</span>}
                    {item.marca && item.categoria && <span className="text-xs text-slate-300">·</span>}
                    {item.categoria && <span className="text-xs text-slate-400">{item.categoria}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {isParent ? (
            <>
              <div className="col-span-2 h-full" />
              <div className="col-span-1 h-full" />
              <div className="col-span-1 h-full" />
              <div className="col-span-2 h-full" />
            </>
          ) : (
            <>
              {/* Costo — col-span-2 */}
              <div className="col-span-2 flex items-center px-3 h-full border-l border-slate-100">
                <span className="text-xs text-slate-400 mr-1">$</span>
                {isEditMode ? (
                  <input
                    type="number"
                    value={itemPricing.costo || ""}
                    onChange={(e) => updatePricingField(itemKey, "costo", Number.parseFloat(e.target.value) || 0, itemPricing)}
                    className="w-full text-sm text-slate-700 bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    step="1"
                  />
                ) : (
                  <span className="text-sm text-slate-700 tabular-nums px-1">{itemPricing.costo ? itemPricing.costo.toLocaleString("es-AR") : "—"}</span>
                )}
              </div>

              {/* Margen — col-span-1 */}
              <div className={`col-span-1 flex items-center px-3 h-full border-l border-slate-100 ${itemPricing.margen < 0 ? "bg-red-50/40" : ""} ${!hasCosto ? "opacity-40" : ""}`}>
                {isEditMode ? (
                  <input
                    type="number"
                    value={itemPricing.margen || ""}
                    onChange={(e) => updatePricingField(itemKey, "margen", Number.parseFloat(e.target.value) || 0, itemPricing)}
                    disabled={!hasCosto}
                    className={`w-full text-sm bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums ${itemPricing.margen < 0 ? "text-red-600" : "text-slate-700"} ${!hasCosto ? "cursor-not-allowed" : ""} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="0"
                    step="0.1"
                  />
                ) : (
                  <span className={`text-sm tabular-nums px-1 ${itemPricing.margen < 0 ? "text-red-600" : "text-slate-700"}`}>{itemPricing.margen != null ? itemPricing.margen : "—"}</span>
                )}
                <span className={`text-xs shrink-0 ${itemPricing.margen < 0 ? "text-red-400" : "text-slate-400"}`}>%</span>
              </div>

              {/* IVA — col-span-1 */}
              <div className="col-span-1 flex items-center px-3 h-full border-l border-slate-100">
                {isEditMode ? (
                  <select
                    value={itemPricing.iva}
                    onChange={(e) => updatePricingField(itemKey, "iva", Number.parseFloat(e.target.value), itemPricing)}
                    className="w-full text-sm text-slate-600 bg-transparent border-0 focus:outline-none cursor-pointer"
                  >
                    {IVA_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-slate-600 tabular-nums px-1">{itemPricing.iva != null ? `${itemPricing.iva}%` : "—"}</span>
                )}
              </div>

              {/* Precio de Venta — col-span-2 */}
              <div className="col-span-2 flex items-center px-3 h-full border-l border-slate-100 bg-blue-50/20">
                <span className="text-xs text-blue-400 mr-1">$</span>
                {isEditMode ? (
                  precioFinalMode === "con_iva" ? (
                    <input
                      type="number"
                      value={itemPricing.precioFinal || ""}
                      onChange={(e) => updatePricingField(itemKey, "precioFinal", Number.parseFloat(e.target.value) || 0, itemPricing)}
                      className="w-full text-sm font-medium text-blue-700 bg-transparent border-0 focus:outline-none focus:bg-blue-50/60 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      step="1"
                      min="0"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-blue-700 tabular-nums">
                        {itemPricing.precioFinal ? Math.round(itemPricing.precioFinal / 1.21).toLocaleString("es-AR") : "0"}
                      </span>
                      <span className="text-[10px] text-slate-400">+ iva</span>
                    </div>
                  )
                ) : (
                  <span className="text-sm font-medium text-blue-700 tabular-nums px-1">
                    {itemPricing.precioFinal ? itemPricing.precioFinal.toLocaleString("es-AR") : "—"}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {isExpanded && children.length > 0 && (
          <div>
            {children.map((child, childIdx) => {
              const childIndex = index + childIdx + 1
              const isLast = childIdx === children.length - 1
              return renderItemRow(child as Item, childIndex, true, isLast, (item as any).proveedor)
            })}
          </div>
        )}
      </div>
    )
  }

  const hasActiveFilters =
    activeFilters.tipos.length > 0 || activeFilters.categorias.length > 0 || activeFilters.marcas.length > 0 || activeFilters.proveedores.length > 0

  return (
    <>
      {/* Rows */}
      <div className="border border-slate-200/80 rounded-md overflow-hidden bg-white divide-y divide-slate-100">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {searchTerm || hasActiveFilters ? "No se encontraron artículos." : "Sin artículos para mostrar."}
          </div>
        ) : (
          sortedAndFilteredItems.map((item, index) => renderItemRow(item, index))
        )}
      </div>

      {bulkModalType && (
        <BulkPriceModal
          isOpen={true}
          onClose={() => setBulkModalType(null)}
          onApply={handleBulkEditApply}
          itemCount={bulkEditTargetCount}
          title={getBulkModalTitle(bulkModalType)}
          type={bulkModalType}
        />
      )}
    </>
  )
}
