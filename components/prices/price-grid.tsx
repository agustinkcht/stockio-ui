"use client"

import type { Item, ItemVariant, SortFactorConfig, FilterConfig } from "@/lib/types"
import { Plus, ArrowUpDown, ListFilterIcon, Search, X, ChevronDown, ChevronRight, Copy, Grid3x3, Minus, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { usePriceSelection } from "@/hooks/use-price-selection"
import { searchItems, sortItems, filterItems, getUniqueCategorias, getUniqueMarcas } from "@/lib/utils/item-utils"
import { OrdenModalPrecios } from "@/components/modals/orden-modal-precios"
import { FiltrosModalPrecios } from "@/components/modals/filtros-modal-precios"
import { BulkPriceModal } from "@/components/modals/bulk-price-modals"

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
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const accionRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [bulkModalType, setBulkModalType] = useState<BulkModalType>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showAccionDropdown, setShowAccionDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    tipos: [],
    categorias: [],
    marcas: [],
    stock: [],
    depositos: [],
  })

  const [sortPriorities, setSortPriorities] = useState<SortFactorConfig[]>([{ factor: "categoria", direction: "asc" }])

  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])
  const availableDepositos = useMemo(() => ["Torcuato", "Trujui"], [])

  // Get all visible SKUs (from sorted and filtered items)
  const getVisibleSkus = useCallback((itemList: Item[]): string[] => {
    const skus: string[] = []
    for (const item of itemList) {
      const isParent = (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0)
      if (isParent) {
        const children = item.variants || item.items || []
        for (const child of children) {
          if (child.sku) skus.push(child.sku)
        }
      } else if (item.sku) {
        skus.push(item.sku)
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

  const searchedItems = useMemo(() => searchItems(items, searchTerm), [items, searchTerm])
  const filteredItems = useMemo(() => filterItems(searchedItems, activeFilters), [searchedItems, activeFilters])
  const sortedAndFilteredItems = useMemo(
    () => sortItems(filteredItems, sortPriorities),
    [filteredItems, sortPriorities],
  )

  const calculatePrecioFinal = (costo: number, margen: number, iva: number): number => {
    return Math.round(costo * (1 + margen / 100) * (1 + iva / 100))
  }

  const calculateMargen = (precioFinal: number, costo: number, iva: number): number => {
    if (costo === 0) return 0
    return Math.round((precioFinal / (costo * (1 + iva / 100)) - 1) * 1000) / 10
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
      updated.margen = calculateMargen(formattedValue, updated.costo, updated.iva)
    } else {
      updated.precioFinal = calculatePrecioFinal(updated.costo, updated.margen, updated.iva)
    }

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
      if (accionRef.current && !accionRef.current.contains(event.target as Node)) {
        setShowAccionDropdown(false)
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

  const renderItemRow = (item: Item, index: number, isChild = false, isLastChild = false) => {
    const isParent = !isChild && ((item.variants && item.variants.length > 0) || (item.items && item.items.length > 0))
    const children = item.variants || item.items || []
    const isExpanded = expandedItems[index]
    const isHovered = hoveredIndex === index

    const itemKey = item.sku || `item-${index}`
    const itemPricing = getItemPricing(item)

    const heightClass = gridSize === "sm" ? "h-[44px]" : gridSize === "md" ? "h-[60px]" : "h-[76px]"

    const selectionState = getSelectionState(item, isChild)

    return (
      <div key={item.sku || index}>
        <div
          className={`grid grid-cols-[40px_4fr_2fr_1fr_1fr_2fr] gap-0 ${heightClass} items-center transition-colors border-b border-border/30 ${
            isHovered ? "bg-accent/50" : ""
          } ${isChild ? "bg-slate-50/50" : ""}`}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Checkbox column */}
          <div className={`flex items-center justify-center h-full border-r border-border/30 ${isChild ? "pl-4" : ""}`}>
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

          <div className="flex items-center gap-2 px-4 min-w-0 border-r border-border/30 h-full">
            {isParent && (
              <>
                <button
                  onClick={() => toggleVariantExpansion(index)}
                  className="text-gray-600 hover:text-gray-900 cursor-pointer shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                    {item.marca && item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                    {item.categoria && <span className="text-xs text-muted-foreground">{item.categoria}</span>}
                  </div>
                </div>
              </>
            )}
            {!isParent && (
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate">{getFullTitle(item)}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {!isChild && item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                  {!isChild && item.marca && item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                  {!isChild && item.categoria && (
                    <span className="text-xs text-muted-foreground">{item.categoria}</span>
                  )}
                  {!isChild && (item.marca || item.categoria) && (
                    <span className="text-xs text-muted-foreground">·</span>
                  )}
                  <span className="text-xs text-muted-foreground">{item.sku}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(item.sku)
                    }}
                    className="inline-flex items-center p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar SKU"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {isParent ? (
            <>
              <div className="border-r border-border/30 h-full" />
              <div className="border-r border-border/30 h-full" />
              <div className="border-r border-border/30 h-full" />
              <div className="h-full" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-center px-2 border-r border-border/30 h-full">
                <div className="flex items-center gap-1 w-full">
                  <span className="text-xs text-gray-500">$</span>
                  <input
                    type="number"
                    value={itemPricing.costo || ""}
                    onChange={(e) =>
                      updatePricingField(itemKey, "costo", Number.parseFloat(e.target.value) || 0, itemPricing)
                    }
                    className="w-full text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                    placeholder="0"
                    step="1"
                  />
                </div>
              </div>

              <div
                className={`flex items-center justify-center px-2 border-r border-border/30 h-full ${itemPricing.margen < 0 ? "bg-red-50" : ""}`}
              >
                <div className="flex items-center gap-0.5 w-full">
                  <input
                    type="number"
                    value={itemPricing.margen || ""}
                    onChange={(e) =>
                      updatePricingField(itemKey, "margen", Number.parseFloat(e.target.value) || 0, itemPricing)
                    }
                    className={`w-full text-sm bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-center ${itemPricing.margen < 0 ? "text-red-700" : "text-gray-900"}`}
                    placeholder="0.0"
                    step="0.1"
                  />
                  <span className={`text-xs ${itemPricing.margen < 0 ? "text-red-500" : "text-gray-500"}`}>%</span>
                </div>
              </div>

              <div className="flex items-center justify-center px-2 border-r border-border/30 h-full">
                <select
                  value={itemPricing.iva}
                  onChange={(e) => updatePricingField(itemKey, "iva", Number.parseFloat(e.target.value), itemPricing)}
                  className="w-full text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0 text-center"
                >
                  {IVA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center px-2 h-full bg-blue-50/50">
                <div className="flex items-center gap-1 w-full">
                  <span className="text-xs text-blue-600">$</span>
                  <input
                    type="number"
                    value={itemPricing.precioFinal || ""}
                    onChange={(e) =>
                      updatePricingField(itemKey, "precioFinal", Number.parseFloat(e.target.value) || 0, itemPricing)
                    }
                    className="w-full text-sm font-medium text-blue-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                    placeholder="0"
                    step="1"
                    min="0"
                  />
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
              return renderItemRow(child as Item, childIndex, true, isLast)
            })}
          </div>
        )}
      </div>
    )
  }

  const hasActiveFilters =
    activeFilters.tipos.length > 0 || activeFilters.categorias.length > 0 || activeFilters.marcas.length > 0

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <div className="bg-white border border-border/40 rounded-lg shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="relative" ref={accionRef}>
              <Button
                onClick={() => setShowAccionDropdown(!showAccionDropdown)}
                variant="ghost"
                size="sm"
                className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Acción 1
              </Button>
            </div>

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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-0 flex-shrink-0">
              <div className="relative mr-3" ref={orderRef}>
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm mr-[-4px]"
                  title="Ordenar"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                </button>
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border shadow-sm mr-2 ${
                    hasActiveFilters ? "border-blue-500 bg-blue-50" : "border-gray-200/40"
                  }`}
                  title="Filtros"
                >
                  <ListFilterIcon
                    className={`w-4 h-4 ${hasActiveFilters ? "text-blue-600" : "text-gray-600 group-hover:text-gray-900"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-3">
        <div className="bg-white border border-border/40 rounded-t-lg">
          <div className="grid grid-cols-[40px_4fr_2fr_1fr_1fr_2fr] gap-0 px-0 py-3 text-xs font-medium text-muted-foreground border-b border-border/30">
            <div className="flex items-center justify-center border-r border-border/30">
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
            <div className="flex items-center px-4 border-r border-border/30">Item</div>
            <div className="flex items-center justify-between px-3 border-r border-border/30">
              <span className="flex-1 text-center">Costo</span>
              <button
                onClick={() => setBulkModalType("costo")}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer"
                title="Modificar costo en lote"
              >
                <MoreVertical className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700" />
              </button>
            </div>
            <div className="flex items-center justify-between px-3 border-r border-border/30">
              <span className="flex-1 text-center">Margen</span>
              <button
                onClick={() => setBulkModalType("margen")}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer"
                title="Modificar margen en lote"
              >
                <MoreVertical className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700" />
              </button>
            </div>
            <div className="flex items-center justify-between px-3 border-r border-border/30">
              <span className="flex-1 text-center">IVA</span>
              <button
                onClick={() => setBulkModalType("iva")}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer"
                title="Modificar IVA en lote"
              >
                <MoreVertical className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700" />
              </button>
            </div>
            <div className="flex items-center justify-between px-3">
              <button
                onClick={() => setBulkModalType("precioFinal")}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer"
                title="Modificar precio final en lote"
              >
                <MoreVertical className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700" />
              </button>
              <span className="flex-1 text-center">Precio Final</span>
              <div className="relative">
                <button
                  onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer"
                  title="Tamaño de grilla"
                >
                  <Grid3x3 className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-900" />
                </button>
                {gridSizeDropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white border border-border/40 rounded-lg shadow-lg py-1 z-10 min-w-[80px]">
                    <button
                      onClick={() => {
                        setGridSize("sm")
                        setGridSizeDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 transition-colors ${gridSize === "sm" ? "font-medium text-blue-600" : "text-gray-700"}`}
                    >
                      Pequeño
                    </button>
                    <button
                      onClick={() => {
                        setGridSize("md")
                        setGridSizeDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 transition-colors ${gridSize === "md" ? "font-medium text-blue-600" : "text-gray-700"}`}
                    >
                      Mediano
                    </button>
                    <button
                      onClick={() => {
                        setGridSize("lg")
                        setGridSizeDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 transition-colors ${gridSize === "lg" ? "font-medium text-blue-600" : "text-gray-700"}`}
                    >
                      Grande
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white border border-border/40 border-t-0 rounded-b-lg">
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
