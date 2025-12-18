"use client"

import type { Item, DepositStock } from "@/lib/types"
import { ItemCard } from "./item-card"
import { Pencil, Trash2, ArrowUpDown, Filter, Layers, ClipboardCheckIcon, Search, MoreVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect } from "react"
import { searchItems } from "@/lib/utils/item-utils"

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

  const hasSelectedItems = itemSelected.some((selected) => selected)

  const filteredItems = searchItems(items, searchQuery)

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

  return (
    <>
      <div className="sticky top-[-2px] z-20 backdrop-blur-[2px] bg-slate-50">
        <div className="w-full h-2 bg-transparent" />

        {/* Tab Buttons */}
        <div className="mt-24 px-4 bg-white border rounded-lg pb-0 shadow-sm border-[rgba(228,230,235,0.5)]">
          <div className="px-4 pt-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 pr-5 pl-2 border-none">
              {/* Left: Buttons section */}
              <div className="flex items-center gap-2 border-0 border-none ml-1.5 mr-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Editor Masivo
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                >
                  <ClipboardCheckIcon className="w-4 h-4 mr-1.5" />
                  Auditoría de Stock
                </Button>

                {hasSelectedItems && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer text-slate-200 bg-sky-950"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1.5" />
                      Agregar a colección
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer bg-[rgba(194,-16,-16,0.7)] text-slate-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-0" />
                    </Button>
                  </>
                )}
              </div>

              {/* Right: View Controls - Always active */}
              <div className="flex items-center gap-0 flex-1">
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
                    onClick={() => setShowOrderDropdown(!showOrderDropdown)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm rounded-full mr-[-4px]"
                    title="Ordenar"
                  >
                    <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                  </button>
                  {showOrderDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <div className="py-1">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          A-Z (Alfabético)
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          Z-A (Alfabético inverso)
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          Mayor cantidad de stock
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          Menor cantidad de stock
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          Recientes primero
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          Antiguos primero
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filtros */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm rounded-full mr-2"
                    title="Filtros"
                  >
                    <Filter className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                  </button>
                  {showFilterDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Tipo</label>
                          <select className="w-full bg-gray-50 border border-gray-200 rounded text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                            <option value="">Todos</option>
                            <option value="individual">Items Individuales</option>
                            <option value="variantes">Items con Variantes</option>
                            <option value="grupos">Grupos</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Stock</label>
                          <select className="w-full bg-gray-50 border border-gray-200 rounded text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                            <option value="">Todos</option>
                            <option value="disponible">Con Stock Disponible</option>
                            <option value="sin-stock">Sin Stock</option>
                            <option value="bajo">Stock Bajo</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Depósito</label>
                          <select className="w-full bg-gray-50 border border-gray-200 rounded text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                            <option value="">Todos</option>
                            <option value="principal">Principal</option>
                            <option value="secundario">Secundario</option>
                          </select>
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button className="flex-1 px-3 py-1.5 text-xs bg-gray-900 hover:bg-gray-800 text-white rounded transition-colors cursor-pointer">
                            Aplicar
                          </button>
                          <button className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                            Limpiar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* More Options */}
                <div className="relative" ref={moreOptionsRef}>
                  <button
                    onClick={() => setShowMoreOptionsDropdown(!showMoreOptionsDropdown)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm rounded-full mr-0"
                    title="Más opciones"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                  </button>
                  {showMoreOptionsDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <div className="py-1">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          Exportar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="px-4 bg-[#f8f9fa] border-gray-200 border-l-0 border-r-0 pb-2 pt-2 mt-px bg-transparent">
          {/* Tab Header Labels */}
          <div className="pl-0 pr-0 w-full">
            <div className="flex items-center ml-0 w-full">
              {/* All selector with same left offset as item checkboxes */}
              <div className="flex items-center justify-center h-9 bg-slate-200 border border-slate-300 border-b-0 border-t-0 rounded-xs shadow-none w-auto border-l-0 border-r px-[13px] rounded-l-sm mr-0 ml-[-17px]">
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
                <div className="col-span-4 flex items-center px-4 py-2 justify-center border-solid border-r border-slate-300 pl-4 pr-4 mr-0">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Título</span>
                </div>
                <div className="col-span-2 flex items-center justify-center px-4 py-2 border-solid border-r border-slate-300 ml-0 mr-0">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Marca</span>
                </div>
                <div className="col-span-2 flex items-center justify-center px-4 py-2 border-solid border border-b-0 border-t-0 border-l-0 border-slate-300 mr-0">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</span>
                </div>
                <div className="col-span-3 flex items-center justify-center py-2 border-solid border-r border-slate-300 px-4 mx-1.5 ml-0 mr-px">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Atributos</span>
                </div>
                <div className="col-span-3 flex items-center justify-center py-2 mx-0 ml-0 px-0 mr-0">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Stock</span>
                </div>
              </div>

              <div className="relative">
                <div className="relative mx-0 mr-[-14px]">
                  <button
                    onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
                    className="flex flex-col items-center justify-center rounded hover:bg-gray-100 transition-colors min-w-[48px] cursor-pointer border rounded-xs h-9 shadow-none bg-slate-200 border-solid border-slate-300 border-r-0 border-b-0 border-t-0 rounded-r-sm px-2.5 ml-0"
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
      <div className="pb-4 pl-[18px] pr-2">
        {filteredItems.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Search className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No se encontraron resultados</p>
            <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <div className={gridSize === "lg" ? "space-y-2" : "space-y-0"}>
            {filteredItems.map((item, index) => (
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
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
