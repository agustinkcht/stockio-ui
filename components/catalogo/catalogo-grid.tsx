"use client"

import type { Item, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ItemCard } from "../items/item-card"
import { Plus, ArrowUpDown, ListFilterIcon, Search, X, Grid, Minus, Check, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { searchItems, sortItems, filterItems, getUniqueCategorias, getUniqueMarcas } from "@/lib/utils/item-utils"
import { OrdenModal } from "@/components/modals/orden-modal"
import { FiltrosModal } from "@/components/modals/filtros-modal"

interface CatalogoGridProps {
  items: Item[]
  gridSize: string
  expandedItems: Record<number, boolean>
  handleItemClick: (item: Item) => void
  toggleVariantExpansion: (index: number) => void
  onDeleteItem?: (item: Item) => void
  selectAllActive: boolean
  selectAllIndeterminate: boolean
  handleSelectAll: () => void
  handleItemSelection: (item: Item, isChild?: boolean) => void
  getSelectionState: (item: Item, isChild?: boolean) => { checked: boolean; indeterminate: boolean }
  gridSizeDropdownOpen: boolean
  setGridSizeDropdownOpen: (value: boolean) => void
  setGridSize: (size: string) => void
  isExpanded?: boolean
  handleOpenNuevoItem?: () => void
  handleOpenNuevoItemConVariantes?: () => void
  hasSelectedItems?: boolean
  onBatchDelete?: () => void
  onUpdatePrecio?: (itemId: string, precio: { costo: number; margen: number; iva: number; precioFinal: number }) => void
  onUpdateStock?: (itemSku: string, field: "total" | "reservado", value: number) => void
  // Pause/Reactivate items
  onPauseItems?: (itemIds: string[]) => void
  onReactivateItems?: (itemIds: string[]) => void
  // For bulk actions
  getSelectedSkus?: () => string[]
}

export function CatalogoGrid({
  items,
  gridSize,
  expandedItems,
  handleItemClick,
  toggleVariantExpansion,
  onDeleteItem,
  selectAllActive,
  selectAllIndeterminate,
  handleSelectAll,
  handleItemSelection,
  getSelectionState,
  gridSizeDropdownOpen,
  setGridSizeDropdownOpen,
  setGridSize,
  isExpanded = true,
  handleOpenNuevoItem,
  handleOpenNuevoItemConVariantes,
  hasSelectedItems,
  onBatchDelete,
  onUpdatePrecio,
  onUpdateStock,
  onPauseItems,
  onReactivateItems,
  getSelectedSkus,
}: CatalogoGridProps) {
  const router = useRouter()
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showOrderDropdown, setShowOrderDropdown] = useState(false)
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    tipos: [],
    categorias: [],
    marcas: [],
    proveedores: [],
    stock: [],
    depositos: [],
  })
  const [sortConfig, setSortConfig] = useState<SortFactorConfig[]>([{ factor: "categoria", direction: "asc" }])

  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])
  const availableDepositos = useMemo(() => ["Torcuato", "Trujui"], [])

  const searchedItems = searchItems(items, searchQuery)
  const filteredItems = filterItems(searchedItems, filterConfig)
  const sortedAndFilteredItems = sortItems(filteredItems, sortConfig)
  
  const handleApplySortConfig = (newConfig: SortFactorConfig[]) => {
    setSortConfig(newConfig)
  }

  const handleApplyFilters = (newFilters: FilterConfig) => {
    setFilterConfig(newFilters)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderRef.current && !orderRef.current.contains(event.target as Node)) {
        setShowOrderDropdown(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }

    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const hasActiveFilters =
    filterConfig.tipos.length > 0 ||
    filterConfig.categorias.length > 0 ||
    filterConfig.marcas.length > 0 ||
    filterConfig.stock.length > 0 ||
    filterConfig.depositos.length > 0

  return (
    <>
      <div className="sticky top-[0px] z-10 backdrop-blur-[2px] bg-slate-50 mt-0">
        <div className="w-full h-2 bg-transparent" />

        {/* Tab Buttons */}
        <div className="px-4 bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] mt-2 pt-1 pb-1">
          <div className="px-4 pt-3 pb-3 pl-0 pr-0">
            <div className="flex items-center justify-between border-b border-gray-200 border-none pl-0 pr-0 pb-0">
              <div className="flex items-center gap-2 border-0 border-none ml-1.5 mr-0 flex-shrink-0">
                <Button
                  onClick={() => router.push("/catalogo/items/nuevo")}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Crear Nuevo
                </Button>

                <Button
                  onClick={() => router.push("/catalogo/creador-masivo")}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                  Creador Masivo
                </Button>

                <Button
                  onClick={() => router.push("/inventario/articulos/editor-masivo")}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Editor Masivo
                </Button>

                {hasSelectedItems && (
                  <>
                    <Button
                      onClick={() => {
                        if (onPauseItems && getSelectedSkus) {
                          onPauseItems(getSelectedSkus())
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 cursor-pointer ml-2"
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Pausar
                    </Button>
                    <Button
                      onClick={() => {
                        if (onReactivateItems && getSelectedSkus) {
                          onReactivateItems(getSelectedSkus())
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 cursor-pointer ml-2"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Reactivar
                    </Button>
                    <Button
                      onClick={onBatchDelete}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm bg-red-50 hover:bg-red-100 border-red-200 text-red-700 cursor-pointer ml-2"
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </div>

              {/* Right: Search Bar + Ordenar and Filtro Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Search Bar */}
                <div className="relative transition-all duration-300">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black opacity-100 w-3.5 h-3.5 z-10" />
                  <input
                    type="text"
                    placeholder="Buscar articulos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      title="Limpiar busqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="relative mr-3" ref={orderRef}>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm rounded-full mr-[-4px]"
                    title="Ordenar"
                  >
                    <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                  </button>
                </div>

                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border shadow-sm rounded-full mr-2 ${
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

        {/* Tab Header */}
        <div className="px-4 bg-[#f8f9fa] border-gray-200 border-l-0 border-r-0 bg-transparent mt-1 pt-2 mb-0 pb-0 shadow-xl">
          <div className="pl-0 pr-0 w-full">
            <div className="flex items-center ml-0 w-full">
              {/* All selector with same left offset as item checkboxes */}
              <div className="flex items-center justify-center h-9 bg-slate-200 border rounded-xs shadow-none w-auto border-r px-[13px] rounded-l-sm mr-0 ml-[-17px] border-b border-l border-t border-[rgba(202,213,227,0.61)]">
                {selectAllIndeterminate ? (
                  <button
                    onClick={handleSelectAll}
                    className="h-4.5 w-4.5 flex items-center justify-center rounded-sm bg-primary border border-primary cursor-pointer"
                  >
                    <Minus className="w-3 h-3 text-primary-foreground" />
                  </button>
                ) : selectAllActive ? (
                  <button
                    onClick={handleSelectAll}
                    className="h-4.5 w-4.5 flex items-center justify-center rounded-sm bg-primary border border-primary cursor-pointer hover:bg-primary/90"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </button>
                ) : (
                  <button
                    onClick={handleSelectAll}
                    className="h-4.5 w-4.5 transition-colors cursor-pointer flex items-center justify-center rounded-sm bg-white border border-slate-300 hover:border-muted-foreground"
                  ></button>
                )}
              </div>

              {/* Tab header - Catalogo mode with Precio */}
              <div className="flex-1 grid grid-cols-44 h-9 bg-slate-200 border border-gray-300 rounded-xs border-none">
                <div className="col-span-16 flex items-center px-4 py-2 justify-center border-solid pl-4 pr-4 mr-0 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Item</span>
                </div>
                <div className="col-span-8 flex items-center justify-center py-2 border-solid border-r px-4 mx-0 border-t border-b border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">SKU</span>
                </div>
                <div className="col-span-10 flex items-center justify-center py-2 border-solid border-r px-4 mx-0 border-t border-b border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Precio Final</span>
                </div>
                <div className="col-span-10 flex items-center justify-center py-2 mx-0 px-0 border-b border-t border-l-0 border-r-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Stock</span>
                </div>
              </div>

              <div className="relative">
                <div className="relative mx-0 mr-[-14px]">
                  <button
                    onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
                    className="flex flex-col items-center justify-center rounded hover:bg-gray-100 transition-colors min-w-[48px] cursor-pointer border rounded-xs h-9 shadow-none border-solid rounded-r-sm px-2.5 ml-0 border-b border-t border-r bg-slate-200 border-[rgba(202,213,227,0.61)]"
                    title="Tamano de grilla"
                  >
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider leading-none">Grilla</span>
                    <span className="text-xs text-gray-900 font-medium uppercase leading-none mt-0.5">{gridSize}</span>
                  </button>
                  {gridSizeDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-16 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          setGridSize("md")
                          setGridSizeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        MD
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End sticky container */}

      {/* Items Grid - scrollable area */}
      <div className="pb-4 pl-[18px] pr-2 pt-3">
        {sortedAndFilteredItems.length === 0 && (searchQuery || hasActiveFilters) ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Search className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No se encontraron resultados</p>
            <p className="text-sm mt-1">
              {searchQuery && hasActiveFilters
                ? "Intenta con otros terminos de busqueda o ajusta los filtros"
                : searchQuery
                  ? "Intenta con otros terminos de busqueda"
                  : "Intenta ajustando los filtros"}
            </p>
          </div>
        ) : (
          <div>
            {sortedAndFilteredItems.map((item, index) => {
              const nextItem = sortedAndFilteredItems[index + 1]
              const selectionState = getSelectionState(item, false)
              return (
                <ItemCard
                  key={item.sku || index}
                  item={item}
                  index={index}
                  gridSize={gridSize}
                  isSelected={selectionState.checked}
                  isIndeterminate={selectionState.indeterminate}
                  isExpanded={expandedItems[index]}
                  onSelectClick={() => handleItemSelection(item, false)}
                  onItemClick={handleItemClick}
                  onToggleExpansion={toggleVariantExpansion}
                  onDelete={onDeleteItem}
                  nextItem={nextItem}
                  handleItemSelection={handleItemSelection}
                  getSelectionState={getSelectionState}
                  isAuditMode={false}
                  showPrecioColumn={true}
                  onUpdatePrecio={onUpdatePrecio}
                  onUpdateStock={onUpdateStock}
                />
              )
            })}
          </div>
        )}
      </div>

      <OrdenModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onApply={handleApplySortConfig}
        initialPriorities={sortConfig}
      />

      <FiltrosModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={filterConfig}
        availableCategorias={availableCategorias}
        availableMarcas={availableMarcas}
        availableDepositos={availableDepositos}
      />
    </>
  )
}
