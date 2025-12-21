"use client"

import type { Item, DepositStock, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ItemCard } from "./item-card"
import {
  Pencil,
  BlocksIcon,
  ArrowUpDown,
  ListFilterIcon,
  ClipboardCheckIcon,
  Search,
  MoreVertical,
  X,
  Layers,
  DollarSign,
  ExternalLink,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  handleItemClick: (item: Item, tab: string, isContainer?: boolean) => void
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
}: ItemsGridProps) {
  const massiveActionsRef = useRef<HTMLDivElement>(null)
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const moreOptionsRef = useRef<HTMLDivElement>(null)

  const [showMassiveActionsDropdown, setShowMassiveActionsDropdown] = useState(false)
  const [showOrderDropdown, setShowOrderDropdown] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showMoreOptionsDropdown, setShowMoreOptionsDropdown] = useState(false)
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

  const hasSelectedItems = itemSelected.some((selected) => selected)

  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])
  const availableDepositos = useMemo(() => ["Torcuato", "Trujui"], []) // Hardcoded for now

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
      if (massiveActionsRef.current && !massiveActionsRef.current.contains(event.target as Node)) {
        setShowMassiveActionsDropdown(false)
      }
      if (orderRef.current && !orderRef.current.contains(event.target as Node)) {
        setShowOrderDropdown(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptionsDropdown(false)
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
      <div className="sticky top-[-2px] z-20 backdrop-blur-[2px] bg-slate-50">
        <div className="w-full h-2 bg-transparent" />

        {/* Tab Buttons */}
        <div className="mt-24 px-4 bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] pt-2.5 pb-2.5">
          <div className="px-4 pt-3 pb-3 pl-0 pr-0">
            <div className="flex items-center justify-between border-b border-gray-200 border-none pl-0 pr-0 pb-0">
              {/* Left: Buttons section */}
              <div className="flex items-center gap-2 border-0 border-none ml-1.5 mr-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer ${
                    hasSelectedItems ? "bg-blue-50 text-blue-900" : ""
                  }`}
                >
                  <Pencil
                    className={`w-3.5 h-3.5 mr-1.5 transition-colors ${hasSelectedItems ? "text-blue-900" : "text-gray-600 group-hover:text-gray-900"}`}
                  />
                  Editor Masivo
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer whitespace-nowrap ${
                    hasSelectedItems ? "bg-blue-50 text-blue-900" : ""
                  }`}
                >
                  <ClipboardCheckIcon
                    className={`w-4 h-4 mr-1.5 ${hasSelectedItems ? "text-blue-900" : "text-gray-600 group-hover:text-gray-900"}`}
                  />
                  Auditoría de Stock
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer whitespace-nowrap ${
                    hasSelectedItems ? "bg-blue-50 text-blue-900" : ""
                  }`}
                >
                  <BlocksIcon
                    className={`w-3.5 h-3.5 mr-1.5 ${hasSelectedItems ? "text-blue-900" : "text-gray-600 group-hover:text-gray-900"}`}
                  />
                  Movimiento de Stock
                </Button>

                <div className="relative" ref={moreOptionsRef}>
                  <button
                    onClick={() => setShowMoreOptionsDropdown(!showMoreOptionsDropdown)}
                    className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border shadow-sm rounded-full ${
                      hasSelectedItems ? "border-[rgba(228,230,235,0.6)] bg-blue-50" : "border-[rgba(228,230,235,0.6)]"
                    }`}
                    title="Más opciones"
                  >
                    <MoreVertical
                      className={`w-4 h-4 ${hasSelectedItems ? "text-blue-900" : "text-gray-600 group-hover:text-gray-900"}`}
                    />
                  </button>
                  {showMoreOptionsDropdown && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <div className="p-1">
                        {hasSelectedItems && (
                          <>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 rounded-lg">
                              <Layers className="w-4 h-4" />
                              Agregar a colección
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 rounded-lg">
                              <DollarSign className="w-4 h-4" />
                              Ver en listas de precio
                            </button>
                          </>
                        )}
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 rounded-lg">
                          <ExternalLink className="w-4 h-4" />
                          Exportar
                        </button>
                        {hasSelectedItems && (
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: View Controls - Always active */}
              <div className="flex items-center gap-0 ml-4 flex-1">
                <div className="relative flex-1 mx-2 transition-all duration-300">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black opacity-100 w-3.5 h-3.5 z-10" />
                  <input
                    type="text"
                    placeholder="Buscar artículos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Ordenar */}
                <div className="relative mr-3" ref={orderRef}>
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm rounded-full mr-[-4px]"
                    title="Ordenar"
                  >
                    <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                  </button>
                </div>

                {/* Filtros */}
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
          {/* Tab Header Labels */}
          <div className="pl-0 pr-0 w-full">
            <div className="flex items-center ml-0 w-full">
              {/* All selector with same left offset as item checkboxes */}
              <div className="flex items-center justify-center h-9 bg-slate-200 border rounded-xs shadow-none w-auto border-r px-[13px] rounded-l-sm mr-0 ml-[-17px] border-b border-l border-t border-[rgba(202,213,227,0.61)]">
                <button
                  onClick={handleSelectAllClick}
                  className={`h-4.5 w-4.5 transition-colors cursor-pointer flex items-center justify-center rounded-sm bg-white border border-slate-300 ${
                    selectAllActive
                      ? "bg-primary border-primary hover:bg-primary/90 hover:border-primary/90"
                      : "bg-transparent border-border hover:border-muted-foreground"
                  }`}
                ></button>
              </div>

              {/* Tab header matching exact item card structure */}
              <div className="flex-1 grid grid-cols-14 h-9 bg-slate-200 border border-gray-300 rounded-xs border-none">
                <div className="col-span-4 flex items-center px-4 py-2 justify-center border-solid pl-4 pr-4 mr-0 border border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Título</span>
                </div>
                <div className="col-span-2 flex items-center justify-center px-4 py-2 border-solid border-r ml-0 mr-0 border-b border-t border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Marca</span>
                </div>
                <div className="col-span-2 flex items-center justify-center px-4 py-2 border-solid border mr-0 border-b border-t border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</span>
                </div>
                <div className="col-span-3 flex items-center justify-center py-2 border-solid border-r px-4 mx-1.5 ml-0 mr-px border-t border-b border-l-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Atributos</span>
                </div>
                <div className="col-span-3 flex items-center justify-center py-2 mx-0 ml-0 px-0 mr-0 border-b border-t border-l-0 border-r-0 border-[rgba(202,213,227,0.61)]">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Stock</span>
                </div>
              </div>

              <div className="relative">
                <div className="relative mx-0 mr-[-14px]">
                  <button
                    onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
                    className="flex flex-col items-center justify-center rounded hover:bg-gray-100 transition-colors min-w-[48px] cursor-pointer border rounded-xs h-9 shadow-none border-solid rounded-r-sm px-2.5 ml-0 border-b border-t border-r bg-slate-200 border-[rgba(202,213,227,0.61)]"
                    title="Tamaño de grilla"
                  >
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider leading-none">Grilla</span>
                    <span className="text-xs text-gray-900 font-medium uppercase leading-none mt-0.5">{gridSize}</span>
                  </button>
                  {gridSizeDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-16 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          setGridSize("lg")
                          setGridSizeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        LG
                      </button>
                      <button
                        onClick={() => {
                          setGridSize("md")
                          setGridSizeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        MD
                      </button>
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
                ? "Intenta con otros términos de búsqueda o ajusta los filtros"
                : searchQuery
                  ? "Intenta con otros términos de búsqueda"
                  : "Intenta ajustando los filtros"}
            </p>
          </div>
        ) : (
          <div>
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
