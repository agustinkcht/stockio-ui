"use client"

import type { Item, ItemVariant, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ChevronDown, ChevronRight, Minus, MoreVertical } from "lucide-react"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, useMemo, useCallback, useRef, type Dispatch, type SetStateAction } from "react"
import { usePriceSelection } from "@/hooks/use-price-selection"
import { searchItems, sortItems, filterItems } from "@/lib/utils/item-utils"
import { OrdenModalPrecios } from "@/components/modals/orden-modal-precios"
import { FiltrosModalPrecios } from "@/components/modals/filtros-modal-precios"
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
  // Lifted state
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  activeFilters: FilterConfig
  setActiveFilters: Dispatch<SetStateAction<FilterConfig>>
  sortPriorities: SortFactorConfig[]
  setSortPriorities: Dispatch<SetStateAction<SortFactorConfig[]>>
  showFilterModal: boolean
  setShowFilterModal: Dispatch<SetStateAction<boolean>>
  showOrderModal: boolean
  setShowOrderModal: Dispatch<SetStateAction<boolean>>
  // Derived data for the page toolbar
  availableCategorias: string[]
  availableMarcas: string[]
  availableProveedores: string[]
  // Bulk action callbacks
  onSelectionChange?: (selectedCount: number, hasSelectedItems: boolean, selectedSkus: string[]) => void
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
  searchTerm,
  setSearchTerm,
  activeFilters,
  setActiveFilters,
  sortPriorities,
  setSortPriorities,
  showFilterModal,
  setShowFilterModal,
  showOrderModal,
  setShowOrderModal,
  availableCategorias,
  availableMarcas,
  availableProveedores,
  onSelectionChange,
}: PriceGridProps) {
  const {
    selectAllActive,
    selectAllIndeterminate,
    handleItemSelection,
    handleSelectAll,
    getSelectionState,
    selectedCount,
    hasSelectedItems,
    getSelectedSkus,
  } = usePriceSelection(items)
  const { precios: preciosSettings } = useSettings()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [bulkModalType, setBulkModalType] = useState<BulkModalType>(null)
  const [precioFinalMode, setPrecioFinalMode] = useState<"con_iva" | "sin_iva">("con_iva")
  const [showPrecioModeDropdown, setShowPrecioModeDropdown] = useState(false)

  const availableDepositos = useMemo(() => ["Torcuato", "Trujui"], [])

  const searchedItems = useMemo(() => searchItems(items, searchTerm), [items, searchTerm])
  const filteredItems = useMemo(() => filterItems(searchedItems, activeFilters), [searchedItems, activeFilters])
  const sortedAndFilteredItems = useMemo(
    () => sortItems(filteredItems, sortPriorities),
    [filteredItems, sortPriorities],
  )

  // Get all visible SKUs
  const getVisibleSkus = useCallback((itemList: Item[]): string[] => {
    const skus: string[] = []
    for (const item of itemList) {
      const isParent = (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0)
      if (isParent) {
        const children = item.variants || item.items || []
        for (const child of children) {
          const sku = (child as any).sku || (child as any).id
          if (sku) skus.push(sku)
        }
      } else {
        const sku = item.sku || (item as any).id
        if (sku) skus.push(sku)
      }
    }
    return skus
  }, [])

  const getTargetSkusForBulkEdit = useCallback((): string[] => {
    if (hasSelectedItems) return getSelectedSkus()
    return getVisibleSkus(sortedAndFilteredItems)
  }, [hasSelectedItems, getSelectedSkus, getVisibleSkus, sortedAndFilteredItems])

  const bulkEditTargetCount = useMemo(() => getTargetSkusForBulkEdit().length, [getTargetSkusForBulkEdit])

  // Stable ref for the callback to avoid re-triggering the effect when parent re-renders
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])

  // Notify parent of selection changes (only when selectedCount/hasSelectedItems actually change)
  useEffect(() => {
    if (onSelectionChangeRef.current) {
      onSelectionChangeRef.current(selectedCount, hasSelectedItems, getSelectedSkus())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCount, hasSelectedItems])

  const getBulkModalTitle = (type: BulkModalType): string => {
    switch (type) {
      case "costo":      return "Modificar Costo en lote"
      case "precioFinal": return "Modificar Precio Final en lote"
      case "margen":     return "Modificar Margen en lote"
      case "iva":        return "Modificar IVA en lote"
      default:           return ""
    }
  }

  const handleBulkEditApply = (operation: string, value: number, unit: string) => {
    const targetSkus = getTargetSkusForBulkEdit()
    if (onBulkEdit && bulkModalType) {
      onBulkEdit(bulkModalType, operation, value, unit, targetSkus)
    }
    setBulkModalType(null)
  }

  const calculatePrecioFinal = (costo: number, margen: number): number =>
    Math.round(costo * (1 + margen / 100))

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
      updated.margen = calculateMargen(formattedValue, updated.costo)
    } else if (field === "costo") {
      if (preciosSettings.costoBehavior === "preservePrecioFinal") {
        updated.margen = calculateMargen(updated.precioFinal, formattedValue)
      } else {
        updated.precioFinal = calculatePrecioFinal(formattedValue, updated.margen)
      }
    } else if (field === "margen") {
      updated.precioFinal = calculatePrecioFinal(updated.costo, formattedValue)
    }

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

  const getFullTitle = (item: Item | ItemVariant): string => {
    let fullTitle = item.name
    if (item.atributosPrincipales && Array.isArray(item.atributosPrincipales)) {
      const attributeValues = item.atributosPrincipales
        .map((attr) => attr.value)
        .filter((value) => value && value.trim() !== "")
        .join(" ")
      if (attributeValues) fullTitle = `${fullTitle} ${attributeValues}`
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

  const renderItemRow = (item: Item, index: number, isChild = false, isLastChild = false, parentProveedor?: string) => {
    const isParent = !isChild && ((item.variants && item.variants.length > 0) || (item.items && item.items.length > 0))
    const children = item.variants || item.items || []
    const isExpanded = expandedItems[index]
    const itemId = (item as any).id || item.sku || `item-${index}`
    const isHovered = hoveredId === itemId
    const itemKey = itemId
    const itemPricing = getItemPricing(item)
    const heightClass = gridSize === "sm" ? "h-[44px]" : gridSize === "md" ? "h-[60px]" : "h-[76px]"
    const selectionState = getSelectionState(item, isChild)
    const hasCosto = itemPricing.costo > 0

    return (
      <div key={item.sku || index}>
        <div
          className={`grid grid-cols-32 gap-0 ${heightClass} items-center transition-colors border-b border-[rgba(202,213,227,0.61)] ${
            isHovered ? "bg-gray-50/50" : ""
          } ${isChild ? "bg-slate-50/30" : ""}`}
          onMouseEnter={() => setHoveredId(itemId)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Checkbox */}
          <div className={`col-span-2 flex items-center justify-center h-full border-r border-[rgba(202,213,227,0.3)] ${isChild ? "pl-4" : ""}`}>
            <div className="relative flex items-center justify-center">
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
          </div>

          {/* Item */}
          <div className="col-span-12 flex items-center gap-2 px-4 min-w-0 h-full border-r border-[rgba(202,213,227,0.3)]">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {isParent ? (
                <button
                  onClick={() => toggleVariantExpansion(index)}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                  <Image
                    src={getCategoryImage(item.categoria || "")}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isParent ? (
                <>
                  <div className="text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.marca && <span className="text-[11px] text-slate-400">{item.marca}</span>}
                    {item.marca && item.categoria && <span className="text-[11px] text-slate-300">·</span>}
                    {item.categoria && <span className="text-[11px] text-slate-400">{item.categoria}</span>}
                  </div>
                </>
              ) : isChild ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                  {item.atributosPrincipales && item.atributosPrincipales.length > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.atributosPrincipales.map((attr, idx) => (
                        attr.value && (
                          <span key={idx} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                            {attr.value}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-sm font-semibold text-slate-900 truncate">{getFullTitle(item)}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.marca && <span className="text-[11px] text-slate-400">{item.marca}</span>}
                    {item.marca && item.categoria && <span className="text-[11px] text-slate-300">·</span>}
                    {item.categoria && <span className="text-[11px] text-slate-400">{item.categoria}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {isParent ? (
            <>
              <div className="col-span-6 h-full border-r border-[rgba(202,213,227,0.3)]" />
              <div className="col-span-3 h-full border-r border-[rgba(202,213,227,0.3)]" />
              <div className="col-span-3 h-full border-r border-[rgba(202,213,227,0.3)]" />
              <div className="col-span-6 h-full" />
            </>
          ) : (
            <>
              {/* Costo */}
              <div className="col-span-6 flex items-center justify-center px-3 h-full border-r border-[rgba(202,213,227,0.3)]">
                <div className="flex items-center gap-1 w-full">
                  <span className="text-[11px] text-slate-400">$</span>
                  <input
                    type="number"
                    value={itemPricing.costo || ""}
                    onChange={(e) => updatePricingField(itemKey, "costo", Number.parseFloat(e.target.value) || 0, itemPricing)}
                    className="w-full text-sm text-slate-700 bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    step="1"
                  />
                </div>
              </div>

              {/* Margen */}
              <div className={`col-span-3 flex items-center justify-center px-2 h-full border-r border-[rgba(202,213,227,0.3)] ${itemPricing.margen < 0 ? "bg-red-50/50" : ""} ${!hasCosto ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-0.5 w-full">
                  <input
                    type="number"
                    value={itemPricing.margen || ""}
                    onChange={(e) => updatePricingField(itemKey, "margen", Number.parseFloat(e.target.value) || 0, itemPricing)}
                    disabled={!hasCosto}
                    className={`w-full text-sm bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 text-center tabular-nums ${itemPricing.margen < 0 ? "text-red-600" : "text-slate-700"} ${!hasCosto ? "cursor-not-allowed" : ""}`}
                    placeholder="0"
                    step="0.1"
                  />
                  <span className={`text-[11px] ${itemPricing.margen < 0 ? "text-red-400" : "text-slate-400"}`}>%</span>
                </div>
              </div>

              {/* IVA */}
              <div className="col-span-3 flex items-center justify-center px-2 h-full border-r border-[rgba(202,213,227,0.3)]">
                <select
                  value={itemPricing.iva}
                  onChange={(e) => updatePricingField(itemKey, "iva", Number.parseFloat(e.target.value), itemPricing)}
                  className="w-full text-sm text-slate-600 bg-transparent border-0 focus:outline-none rounded px-0 text-center cursor-pointer"
                >
                  {IVA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Precio Final */}
              <div className="col-span-6 flex items-center justify-center px-3 h-full bg-blue-50/30">
                <div className="flex items-center gap-1 w-full">
                  <span className="text-[11px] text-blue-500">$</span>
                  {precioFinalMode === "con_iva" ? (
                    <input
                      type="number"
                      value={itemPricing.precioFinal || ""}
                      onChange={(e) => updatePricingField(itemKey, "precioFinal", Number.parseFloat(e.target.value) || 0, itemPricing)}
                      className="w-full text-sm font-medium text-blue-700 bg-transparent border-0 focus:outline-none focus:bg-blue-50 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  )}
                </div>
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
    activeFilters.tipos.length > 0 ||
    activeFilters.categorias.length > 0 ||
    activeFilters.marcas.length > 0 ||
    activeFilters.proveedores.length > 0

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Scrollable container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="border border-[rgba(202,213,227,0.61)] rounded-lg overflow-hidden">
          {/* Column header — sticky */}
          <div className="bg-slate-100 sticky top-0 z-10">
            <div className="grid grid-cols-32 h-9">
              <div className="col-span-2 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                <div className="relative flex items-center justify-center">
                  {selectAllIndeterminate ? (
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-4 h-4 border border-primary bg-primary rounded-[4px] cursor-pointer"
                    >
                      <Minus className="w-3 h-3 text-primary-foreground" />
                    </button>
                  ) : (
                    <Checkbox checked={selectAllActive} onCheckedChange={handleSelectAll} className="cursor-pointer" />
                  )}
                </div>
              </div>
              <div className="col-span-12 flex items-center px-4 border-r border-[rgba(202,213,227,0.61)]">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Item</span>
              </div>
              <div className="col-span-6 flex items-center justify-between px-3 border-r border-[rgba(202,213,227,0.61)]">
                <span className="flex-1 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Costo</span>
                <button
                  onClick={() => setBulkModalType("costo")}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors group cursor-pointer"
                  title="Modificar costo en lote"
                >
                  <MoreVertical className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                </button>
              </div>
              <div className="col-span-3 flex items-center justify-between px-3 border-r border-[rgba(202,213,227,0.61)]">
                <span className="flex-1 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Margen</span>
                <button
                  onClick={() => setBulkModalType("margen")}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors group cursor-pointer"
                  title="Modificar margen en lote"
                >
                  <MoreVertical className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                </button>
              </div>
              <div className="col-span-3 flex items-center justify-between px-3 border-r border-[rgba(202,213,227,0.61)]">
                <span className="flex-1 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">IVA</span>
                <button
                  onClick={() => setBulkModalType("iva")}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors group cursor-pointer"
                  title="Modificar IVA en lote"
                >
                  <MoreVertical className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                </button>
              </div>
              <div className="col-span-6 flex items-center justify-center px-3 gap-2 relative" data-precio-dropdown>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Precio Final {precioFinalMode === "sin_iva" && "(sin IVA)"}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowPrecioModeDropdown(!showPrecioModeDropdown)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors group cursor-pointer"
                    title="Opciones de precio final"
                  >
                    <MoreVertical className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                  </button>
                  {showPrecioModeDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                      <button
                        onClick={() => { setPrecioFinalMode("con_iva"); setShowPrecioModeDropdown(false) }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${precioFinalMode === "con_iva" ? "font-medium text-blue-600" : "text-slate-700"}`}
                      >
                        Con IVA
                      </button>
                      <button
                        onClick={() => { setPrecioFinalMode("sin_iva"); setShowPrecioModeDropdown(false) }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${precioFinalMode === "sin_iva" ? "font-medium text-blue-600" : "text-slate-700"}`}
                      >
                        Sin IVA
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => { setBulkModalType("precioFinal"); setShowPrecioModeDropdown(false) }}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                      >
                        Editar en lote
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Content */}
          <div className="bg-white">
            {sortedAndFilteredItems.length === 0 && (searchTerm || hasActiveFilters) ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <p className="text-lg font-medium">No se encontraron artículos</p>
                <p className="text-sm mt-1">Intenta ajustar tu búsqueda o filtros</p>
              </div>
            ) : (
              <div>{sortedAndFilteredItems.map((item, index) => renderItemRow(item, index))}</div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showOrderModal && (
        <OrdenModalPrecios
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          onApply={(priorities) => { setSortPriorities(priorities) }}
          initialPriorities={sortPriorities}
        />
      )}

      {showFilterModal && (
        <FiltrosModalPrecios
          onClose={() => setShowFilterModal(false)}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          availableCategorias={availableCategorias}
          availableMarcas={availableMarcas}
          availableProveedores={availableProveedores}
          availableDepositos={availableDepositos}
        />
      )}

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
    </div>
  )
}
