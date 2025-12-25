"use client"

import type { Item, ItemVariant } from "@/lib/types" // Updated import to include ItemVariant
import {
  Plus,
  ArrowUpDown,
  ListFilterIcon,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect, useMemo } from "react"
import { searchItems, sortItems, filterItems, getUniqueCategorias, getUniqueMarcas } from "@/lib/utils/item-utils"
import { OrdenModal } from "@/components/modals/orden-modal"
import { FiltrosModal } from "@/components/modals/filtros-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PricingData {
  costo: number
  margen: number
  iva: number
  precioFinal: number
}

interface PriceGridProps {
  items: Item[]
  gridSize: string
  itemSelected: boolean[]
  expandedItems: Record<number, boolean>
  handleItemButtonClick: (index: number) => void
  toggleVariantExpansion: (index: number) => void
  selectAllActive: boolean
  handleSelectAllClick: () => void
  gridSizeDropdownOpen: boolean
  setGridSizeDropdownOpen: (value: boolean) => void
  setGridSize: (size: string) => void
}

const IVA_OPTIONS = [
  { value: 0, label: "0%" },
  { value: 10.5, label: "10.5%" },
  { value: 21, label: "21%" },
]

export function PriceGrid({
  items,
  gridSize,
  itemSelected,
  expandedItems,
  handleItemButtonClick,
  toggleVariantExpansion,
  selectAllActive,
  handleSelectAllClick,
  gridSizeDropdownOpen,
  setGridSizeDropdownOpen,
  setGridSize,
}: PriceGridProps) {
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const accionRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState<number | null>(null) // Declared isHovered state

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showAccionDropdown, setShowAccionDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [pricingData, setPricingData] = useState<Record<string, PricingData>>({})

  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])
  const availableDepositos = useMemo(() => ["Torcuato", "Trujui"], [])

  const searchedItems = searchItems(items, searchTerm)
  const filteredItems = filterItems(searchedItems, { tipos: [], categorias: [], marcas: [], stock: [], depositos: [] })
  const sortedAndFilteredItems = sortItems(filteredItems, [{ factor: "categoria", direction: "asc" }])

  const calculatePrecioFinal = (costo: number, margen: number, iva: number): number => {
    return costo * (1 + margen / 100) * (1 + iva / 100)
  }

  const calculateMargen = (precioFinal: number, costo: number, iva: number): number => {
    if (costo === 0) return 0
    return (precioFinal / (costo * (1 + iva / 100)) - 1) * 100
  }

  const updatePricingField = (sku: string, field: keyof PricingData, value: number) => {
    setPricingData((prev) => {
      const current = prev[sku] || { costo: 0, margen: 0, iva: 0, precioFinal: 0 }
      const updated = { ...current, [field]: value }

      if (field === "precioFinal") {
        updated.margen = calculateMargen(value, updated.costo, updated.iva)
      } else {
        updated.precioFinal = calculatePrecioFinal(updated.costo, updated.margen, updated.iva)
      }

      return { ...prev, [sku]: updated }
    })
  }

  useEffect(() => {
    if (items.length === 0) return

    const initialPricing: Record<string, PricingData> = {}

    items.forEach((item) => {
      // Add pricing for standalone items with precio
      if (item.precio) {
        const key = item.sku || `item-${item.id}`
        initialPricing[key] = { ...item.precio }
      }

      // Add pricing for child variants with precio
      const children = item.variants || item.items || []
      children.forEach((child) => {
        if (child.precio) {
          const childKey = child.sku || `variant-${child.id}`
          initialPricing[childKey] = { ...child.precio }
        }
      })
    })

    setPricingData(initialPricing)
  }, [items])

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

  const renderItemRow = (item: Item, index: number, isChild = false, isLastChild = false) => {
    const isParent = !isChild && ((item.variants && item.variants.length > 0) || (item.items && item.items.length > 0))
    const children = item.variants || item.items || []
    const isExpanded = expandedItems[index]

    const itemKey = item.sku || `item-${index}`
    const itemPricing = pricingData[itemKey] || { costo: 0, margen: 0, iva: 21, precioFinal: 0 }

    const getFullTitle = () => {
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

    const getRoundedClass = () => {
      if (isChild) {
        if (isLastChild) return "rounded-bl-sm rounded-br-sm"
        return ""
      }
      if (isParent && isExpanded) return "rounded-tl-sm rounded-tr-sm"
      return "rounded-sm"
    }

    return (
      <div key={item.sku || index} className={isChild ? "mb-0" : "mb-[2px]"}>
        <div
          className="flex items-center gap-2 bg-transparent"
          onMouseEnter={() => setIsHovered(index)}
          onMouseLeave={() => setIsHovered(null)}
        >
          {/* Left selector */}
          <div
            className="p-2 -m-2 cursor-pointer py-4 pl-2"
            onClick={(e) => {
              e.stopPropagation()
              handleItemButtonClick(index)
            }}
          >
            <button
              className={`relative left-[-7px] h-4.5 w-4.5 transition-colors cursor-pointer flex items-center justify-center rounded-full border shadow-xs border-slate-300 ${
                itemSelected[index] ? "bg-sky-950" : "bg-transparent"
              } ${!isHovered && !itemSelected[index] ? "opacity-0" : "opacity-100"}`}
            />
          </div>

          {/* Main item row */}
          <div
            className={`flex-1 border border-slate-200/65 shadow-md rounded-xs ${getRoundedClass()} ${gridSize === "lg" ? "h-22" : gridSize === "md" ? "h-16" : "h-10"} bg-white transition-colors grid grid-cols-26 overflow-hidden`}
          >
            {/* Título column */}
            <div className="col-span-7 flex flex-col justify-center px-4 border-r border-slate-100">
              {isParent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVariantExpansion(index)}
                    className="text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
              )}
              {!isParent && (
                <div className="flex flex-col items-start px-2 border-slate-100 border-r-0">
                  <span className="text-sm text-gray-900">{getFullTitle(item)}</span>
                  {gridSize !== "sm" && item.sku && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(item.sku)
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors group w-fit"
                    >
                      <span>SKU: {item.sku}</span>
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Marca column */}
            <div className="col-span-3 flex items-center justify-center px-4 border-r border-slate-100">
              <span className="text-sm text-gray-600">{item.marca || "-"}</span>
            </div>

            {/* Categoría column */}
            <div className="col-span-3 flex items-center justify-center px-4 border-r border-slate-100">
              <span className="text-sm text-gray-600">{item.categoria || "-"}</span>
            </div>

            {/* Pricing columns - empty for parent items */}
            {isParent ? (
              <>
                {/* Costo field */}
                <div className="col-span-4 flex items-center justify-center border-r border-slate-100"></div>
                {/* Margen field */}
                <div className="col-span-3 flex items-center justify-center border-r border-slate-100"></div>
                {/* IVA dropdown */}
                <div className="col-span-2 flex items-center justify-center border-r border-slate-100"></div>
                {/* Precio Final */}
                <div className="col-span-4 flex items-center justify-center"></div>
              </>
            ) : (
              <>
                {/* Costo field */}
                <div className="col-span-4 flex items-center justify-center px-2 border-r border-slate-100">
                  <div className="flex items-center gap-1 w-full">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      value={itemPricing.costo || ""}
                      onChange={(e) => updatePricingField(itemKey, "costo", Number.parseFloat(e.target.value) || 0)}
                      onFocus={() => setIsHovered(index)}
                      onBlur={() => setIsHovered(null)}
                      className="w-full text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Margen field */}
                <div
                  className={`col-span-3 flex items-center justify-center px-2 border-r border-slate-100 ${itemPricing.margen < 0 ? "bg-red-50" : ""}`}
                >
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="number"
                      value={itemPricing.margen || ""}
                      onChange={(e) => updatePricingField(itemKey, "margen", Number.parseFloat(e.target.value) || 0)}
                      className={`w-full text-sm bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 ${itemPricing.margen < 0 ? "text-red-700" : "text-gray-900"}`}
                      placeholder="0"
                      step="1"
                    />
                    <span className={`text-sm ${itemPricing.margen < 0 ? "text-red-500" : "text-gray-500"}`}>%</span>
                  </div>
                </div>

                {/* IVA dropdown */}
                <div className="col-span-2 flex items-center justify-center px-2 border-r border-slate-100">
                  <select
                    value={itemPricing.iva}
                    onChange={(e) => updatePricingField(itemKey, "iva", Number.parseFloat(e.target.value))}
                    className="w-full text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                  >
                    {IVA_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Precio Final - calculated, read-only */}
                <div className="col-span-4 flex items-center justify-center px-2 bg-blue-50/50">
                  <div className="flex items-center gap-1 w-full">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      value={itemPricing.precioFinal || ""}
                      onChange={(e) =>
                        updatePricingField(itemKey, "precioFinal", Number.parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-sm font-medium text-blue-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* More options button */}
          <div
            className={`flex items-center gap-2 px-3 ${isHovered !== index ? "opacity-0" : "opacity-100"} transition-opacity`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 -m-2 text-gray-600 hover:text-gray-900">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Duplicar precios</DropdownMenuItem>
                <DropdownMenuItem>Resetear</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Render children if expanded */}
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

  return (
    <>
      {/* Sticky toolbar */}
      <div className="sticky top-[0px] z-20 backdrop-blur-[2px] bg-slate-50 mt-0">
        <div className="w-full h-2 bg-transparent" />

        {/* Toolbar */}
        <div className="px-4 bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] mt-2 pt-1 pb-1">
          <div className="px-4 pt-3 pb-3 pl-0 pr-0">
            <div className="flex items-center justify-between border-b border-gray-200 border-none pl-0 pr-0 pb-0">
              {/* Left: Acción 1 button */}
              <div className="flex items-center gap-2 ml-1.5 flex-shrink-0">
                <div className="relative" ref={accionRef}>
                  <Button
                    onClick={() => setShowAccionDropdown(!showAccionDropdown)}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    Acción 1
                  </Button>
                </div>
              </div>

              {/* Center: Search */}
              <div className="flex items-center justify-center flex-1">
                <div className="relative mx-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar artículos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-96 h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 bg-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Ordenar and Filtro */}
              <div className="flex items-center gap-0 flex-shrink-0">
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 border border-gray-200/40 shadow-sm mr-[-4px]"
                  title="Ordenar"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => setShowFilterModal(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 border shadow-sm mr-2 border-gray-200/40"
                  title="Filtros"
                >
                  <ListFilterIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="px-4 bg-transparent mt-1 pt-2 mb-0 pb-0">
          <div className="pl-0 pr-0 w-full">
            <div className="flex items-center ml-0 w-full">
              {/* All selector */}
              <div className="flex items-center justify-center h-9 bg-slate-200 border rounded-l-sm w-auto px-[13px] mr-0 ml-[-17px] border-[rgba(202,213,227,0.61)]">
                <button
                  onClick={handleSelectAllClick}
                  className={`h-4.5 w-4.5 transition-colors cursor-pointer flex items-center justify-center rounded-sm bg-white border border-slate-300 ${
                    selectAllActive
                      ? "bg-primary border-primary hover:bg-primary/90 hover:border-primary/90"
                      : "bg-transparent border-border hover:border-muted-foreground"
                  }`}
                ></button>
              </div>

              {/* Column headers */}
              <div className="flex-1 grid grid-cols-26 h-9 bg-slate-200 border-none">
                {/* Título */}
                <div className="col-span-7 flex items-center justify-center px-4 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Título</span>
                </div>
                {/* Marca */}
                <div className="col-span-3 flex items-center justify-center px-4 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Marca</span>
                </div>
                {/* Categoría */}
                <div className="col-span-3 flex items-center justify-center px-4 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</span>
                </div>
                {/* Costo ($ */}
                <div className="col-span-4 flex items-center justify-center px-4 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Costo ($)</span>
                </div>
                {/* Margen (%) */}
                <div className="col-span-3 flex items-center justify-center px-4 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Margen (%)</span>
                </div>
                {/* IVA */}
                <div className="col-span-2 flex items-center justify-center px-4 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">IVA</span>
                </div>
                {/* Precio Final */}
                <div className="col-span-4 flex items-center justify-center px-4 border border-l-0 border-r-0 border-[rgba(202,213,227,0.61)] bg-blue-50/30">
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">Precio Final</span>
                </div>
              </div>

              {/* Grilla selector */}
              <div className="relative mr-[-14px]">
                <button
                  onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
                  className="flex flex-col items-center justify-center rounded-r-sm hover:bg-gray-100 min-w-[48px] h-9 bg-slate-200 border border-l-0 border-[rgba(202,213,227,0.61)] px-2.5"
                >
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Grilla</span>
                  <span className="text-xs text-gray-900 font-medium uppercase">{gridSize}</span>
                </button>
                {gridSizeDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-16 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setGridSize("sm")
                        setGridSizeDropdownOpen(false)
                      }}
                      className="w-full px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      SM
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="pb-4 pl-[18px] pr-2 pt-3">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Search className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No se encontraron resultados</p>
          </div>
        ) : (
          <div>{sortedAndFilteredItems.map((item, index) => renderItemRow(item, index))}</div>
        )}
      </div>

      <OrdenModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onApply={() => {}}
        initialPriorities={[{ factor: "categoria", direction: "asc" }]}
      />

      <FiltrosModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={() => {}}
        initialFilters={{ tipos: [], categorias: [], marcas: [], stock: [], depositos: [] }}
        availableCategorias={availableCategorias}
        availableMarcas={availableMarcas}
        availableDepositos={availableDepositos}
      />
    </>
  )
}
