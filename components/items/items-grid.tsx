"use client"

import type { Item, DepositStock, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ItemCard } from "./item-card"
import { Plus, ArrowUpDown, SlidersHorizontal, Search, X, Grid3X3, Layers } from "lucide-react"
import { useRef, useState, useEffect, useMemo } from "react"
import { searchItems, sortItems, filterItems, getUniqueCategorias, getUniqueMarcas } from "@/lib/utils/item-utils"
import { OrdenModal } from "@/components/modals/orden-modal"
import { FiltrosModal } from "@/components/modals/filtros-modal"

interface ItemsGridProps {
  items: Item[]
  gridSize: string
  itemSelected: boolean[]
  expandedItems: Record<number, boolean>
  handleItemButtonClick: (index: number) => void
  handleItemClick: (item: Item) => void
  toggleVariantExpansion: (index: number) => void
  updateDepositStock?: (itemSku: string, depositId: string, quantity: number) => void
  depositStock?: DepositStock[]
  onDeleteItem?: (item: Item) => void
  selectAllActive: boolean
  handleSelectAllClick: () => void
  gridSizeDropdownOpen: boolean
  setGridSizeDropdownOpen: (value: boolean) => void
  setGridSize: (size: string) => void
  isExpanded?: boolean
  handleOpenNuevoItem?: () => void
  handleOpenNuevoItemConVariantes?: () => void
  hasSelectedItems?: boolean
  onBatchDelete?: () => void
}

export function ItemsGrid({
  items,
  gridSize,
  itemSelected,
  expandedItems,
  handleItemButtonClick,
  handleItemClick,
  toggleVariantExpansion,
  updateDepositStock,
  depositStock,
  onDeleteItem,
  selectAllActive,
  handleSelectAllClick,
  gridSizeDropdownOpen,
  setGridSizeDropdownOpen,
  setGridSize,
  isExpanded = true,
  handleOpenNuevoItem,
  handleOpenNuevoItemConVariantes,
  hasSelectedItems,
  onBatchDelete,
}: ItemsGridProps) {
  const crearNuevoRef = useRef<HTMLDivElement>(null)

  const [showCrearNuevoDropdown, setShowCrearNuevoDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    tipos: [],
    categorias: [],
    marcas: [],
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
      if (crearNuevoRef.current && !crearNuevoRef.current.contains(event.target as Node)) {
        setShowCrearNuevoDropdown(false)
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
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
        {/* Toolbar */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Actions */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={crearNuevoRef}>
                <button
                  onClick={() => setShowCrearNuevoDropdown(!showCrearNuevoDropdown)}
                  className="h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  Nuevo
                </button>

                {showCrearNuevoDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    <button
                      onClick={() => {
                        handleOpenNuevoItem?.()
                        setShowCrearNuevoDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      Item Individual
                    </button>
                    <button
                      onClick={() => {
                        handleOpenNuevoItemConVariantes?.()
                        setShowCrearNuevoDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5"
                    >
                      <Layers className="w-4 h-4 text-slate-400" />
                      Item con Variantes
                    </button>
                  </div>
                )}
              </div>

              {hasSelectedItems && (
                <button
                  onClick={onBatchDelete}
                  className="h-8 px-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-all"
                >
                  Eliminar
                </button>
              )}
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-9 pr-8 text-sm bg-white border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Sort & Filter */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowOrderModal(true)}
                className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all"
                title="Ordenar"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFilterModal(true)}
                className={`h-8 w-8 flex items-center justify-center rounded-md transition-all ${
                  hasActiveFilters
                    ? "text-slate-900 bg-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
                title="Filtros"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-0">
            {/* Checkbox column */}
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <button
                onClick={handleSelectAllClick}
                className={`w-3.5 h-3.5 rounded-sm border transition-all ${
                  selectAllActive
                    ? "bg-slate-800 border-slate-800"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              />
            </div>

            {/* Headers */}
            <div className="flex-1 grid grid-cols-12 h-8 items-center text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              <div className="col-span-5 px-4">Item</div>
              <div className="col-span-4 px-4 text-center">Atributos</div>
              <div className="col-span-3 px-4 text-center">Stock</div>
            </div>

            {/* Actions column spacer */}
            <div className="w-10 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="px-4 pb-4">
        {sortedAndFilteredItems.length === 0 && (searchQuery || hasActiveFilters) ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Search className="w-10 h-10 mb-4 text-slate-300" />
            <p className="text-sm font-medium">No se encontraron resultados</p>
            <p className="text-xs mt-1">
              {searchQuery && hasActiveFilters
                ? "Intenta con otros términos o ajusta los filtros"
                : searchQuery
                  ? "Intenta con otros términos de búsqueda"
                  : "Intenta ajustando los filtros"}
            </p>
          </div>
        ) : (
          <div className="space-y-px">
            {sortedAndFilteredItems.map((item, index) => {
              const nextItem = sortedAndFilteredItems[index + 1]
              return (
                <ItemCard
                  key={index}
                  item={item}
                  index={index}
                  gridSize={gridSize}
                  isSelected={itemSelected[index]}
                  isExpanded={expandedItems[index]}
                  onSelectClick={handleItemButtonClick}
                  onItemClick={handleItemClick}
                  onToggleExpansion={toggleVariantExpansion}
                  onDelete={onDeleteItem}
                  nextItem={nextItem}
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
