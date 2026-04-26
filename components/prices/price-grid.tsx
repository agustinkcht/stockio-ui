"use client"

import type { Item, ItemVariant, SortFactorConfig, FilterConfig } from "@/lib/types"
import { Plus, ArrowUpDown, ListFilterIcon, Search, X, ChevronDown, ChevronRight, Copy, Grid3x3, Minus, MoreVertical } from "lucide-react"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { usePriceSelection } from "@/hooks/use-price-selection"
import { searchItems, sortItems, filterItems, getUniqueCategorias, getUniqueMarcas, getUniqueProveedores } from "@/lib/utils/item-utils"
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
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [bulkModalType, setBulkModalType] = useState<BulkModalType>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [precioFinalMode, setPrecioFinalMode] = useState<"con_iva" | "sin_iva">("con_iva")
  const [showPrecioModeDropdown, setShowPrecioModeDropdown] = useState(false)

  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    tipos: [],
    categorias: [],
    marcas: [],
    proveedores: [],
    stock: [],
    depositos: [],
  })

  const [sortPriorities, setSortPriorities] = useState<SortFactorConfig[]>([{ factor: "categoria", direction: "asc" }])

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
    const ids: string[] = []
    for (const item of itemList) {
      const isParent = (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0)
      if (isParent) {
        const children = item.variants || item.items || []
        for (const child of children) {
          const id = (child as any).id || (child as any).sku
          if (id) ids.push(id)
        }
      } else {
        const id = (item as any).id || item.sku
        if (id) ids.push(id)
      }
    }
    return ids
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
      if (orderRef.current && !orderRef.current.contains(event.target as Node)) {
        setShowOrderModal(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterModal(false)
      }
      // Close precio mode dropdown if clicking outside
      const target = event.target as HTMLElement
      if (!target.closest("[data-precio-dropdown]")) {
        setShowPrecioModeDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
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
          {/* Checkbox column */}
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

          {/* Item column */}
          <div className="col-span-12 flex items-center gap-2 px-4 min-w-0 h-full border-r border-[rgba(202,213,227,0.3)]">
            {isParent ? (
              <button
                onClick={() => toggleVariantExpansion(index)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer shrink-0 w-4"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-4 shrink-0" /> /* Spacer to align with parent chevron */
            )}
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
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                      src={getCategoryImage(item.categoria || "")}
                      alt={item.name}
                      width={28}
                      height={28}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                    {item.atributosPrincipales && item.atributosPrincipales.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.atributosPrincipales.map((attr, idx) => (
                          attr.value && (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded"
                            >
                              {attr.value}
                            </span>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                      src={getCategoryImage(item.categoria || "")}
                      alt={item.name}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{getFullTitle(item)}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.marca && <span className="text-[11px] text-slate-400">{item.marca}</span>}
                      {item.marca && item.categoria && <span className="text-[11px] text-slate-300">·</span>}
                      {item.categoria && <span className="text-[11px] text-slate-400">{item.categoria}</span>}
                    </div>
                  </div>
                </div>
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
                    onChange={(e) =>
                      updatePricingField(itemKey, "costo", Number.parseFloat(e.target.value) || 0, itemPricing)
                    }
                    className="w-full text-sm text-slate-700 bg-transparent border-0 focus:outline-none focus:bg-slate-50 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    step="1"
                  />
                </div>
              </div>

              {/* Margen - disabled if no costo */}
              <div
                className={`col-span-3 flex items-center justify-center px-2 h-full border-r border-[rgba(202,213,227,0.3)] ${itemPricing.margen < 0 ? "bg-red-50/50" : ""} ${!hasCosto ? "opacity-40" : ""}`}
              >
                <div className="flex items-center gap-0.5 w-full">
                  <input
                    type="number"
                    value={itemPricing.margen || ""}
                    onChange={(e) =>
                      updatePricingField(itemKey, "margen", Number.parseFloat(e.target.value) || 0, itemPricing)
                    }
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
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
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
                      onChange={(e) =>
                        updatePricingField(itemKey, "precioFinal", Number.parseFloat(e.target.value) || 0, itemPricing)
                      }
                      className="w-full text-sm font-medium text-blue-700 bg-transparent border-0 focus:outline-none focus:bg-blue-50 rounded px-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      step="1"
                      min="0"
                    />
                  ) : (
                    <span className="text-sm font-medium text-blue-700 tabular-nums">
                      {itemPricing.precioFinal ? Math.round(itemPricing.precioFinal / 1.21).toLocaleString("es-AR") : "0"}
                    </span>
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
    activeFilters.tipos.length > 0 || activeFilters.categorias.length > 0 || activeFilters.marcas.length > 0 || activeFilters.proveedores.length > 0

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Superior Card - Empty placeholder like ODC detail */}
      <div className="px-6 pt-6 pb-4">
        <div className="bg-white border border-[rgba(202,213,227,0.61)] rounded-lg shadow-sm">
          <div className="px-6 py-5 flex items-center gap-4">
            {/* Empty placeholder - can add content here later */}
          </div>
        </div>
      </div>

      {/* Scrollable container with sticky header */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="border border-[rgba(202,213,227,0.61)] rounded-lg overflow-hidden">
          {/* Toolbar - integrated with grid */}
          <div className="bg-white border-b border-[rgba(202,213,227,0.61)]">
            <div className="px-4 py-3 flex items-center justify-center gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black opacity-100 z-10" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative" ref={orderRef}>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm"
                    title="Ordenar"
                  >
                    <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                  </button>
                </div>

                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border shadow-sm ${
                      hasActiveFilters ? "border-blue-500 bg-blue-50" : "border-gray-200/40"
                    }`}
                    title="Filtros"
                  >
                    <ListFilterIcon
                      className={`w-4 h-4 ${hasActiveFilters ? "text-blue-600" : "text-gray-600 group-hover:text-gray-900"}`}
                    />
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm"
                    title="Tamaño de grilla"
                  >
                    <Grid3x3 className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                  </button>
                  {gridSizeDropdownOpen && (
                    <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[100px]">
                      <button
                        onClick={() => {
                          setGridSize("sm")
                          setGridSizeDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${gridSize === "sm" ? "font-medium text-blue-600" : "text-slate-700"}`}
                      >
                        Pequeño
                      </button>
                      <button
                        onClick={() => {
                          setGridSize("md")
                          setGridSizeDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${gridSize === "md" ? "font-medium text-blue-600" : "text-slate-700"}`}
                      >
                        Mediano
                      </button>
                      <button
                        onClick={() => {
                          setGridSize("lg")
                          setGridSizeDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${gridSize === "lg" ? "font-medium text-blue-600" : "text-slate-700"}`}
                      >
                        Grande
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Tab Header - sticky */}
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
                  <Checkbox
                    checked={selectAllActive}
                    onCheckedChange={handleSelectAll}
                    className="cursor-pointer"
                  />
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
                      onClick={() => {
                        setPrecioFinalMode("con_iva")
                        setShowPrecioModeDropdown(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${precioFinalMode === "con_iva" ? "font-medium text-blue-600" : "text-slate-700"}`}
                    >
                      Con IVA
                    </button>
                    <button
                      onClick={() => {
                        setPrecioFinalMode("sin_iva")
                        setShowPrecioModeDropdown(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${precioFinalMode === "sin_iva" ? "font-medium text-blue-600" : "text-slate-700"}`}
                    >
                      Sin IVA
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setBulkModalType("precioFinal")
                        setShowPrecioModeDropdown(false)
                      }}
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
              <Search className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No se encontraron artículos</p>
              <p className="text-sm mt-1">Intenta ajustar tu búsqueda o filtros</p>
            </div>
          ) : (
            <div>{sortedAndFilteredItems.map((item, index) => renderItemRow(item, index))}</div>
          )}
        </div>
        </div>
      </div>

      {showOrderModal && (
        <OrdenModalPrecios
          onClose={() => setShowOrderModal(false)}
          ref={orderRef}
          sortPriorities={sortPriorities}
          setSortPriorities={setSortPriorities}
        />
      )}

      {showFilterModal && (
        <FiltrosModalPrecios
          onClose={() => setShowFilterModal(false)}
          ref={filterRef}
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
