"use client"

import type { Item, DepositStock, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ItemCard } from "./item-card"
import { Plus, ArrowUpDown, ListFilterIcon, Search, X, Grid, Minus, Check, MoreVertical, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { searchItems, sortItems, filterItems, getUniqueCategorias, getUniqueMarcas } from "@/lib/utils/item-utils"
import { OrdenModal } from "@/components/modals/orden-modal"
import { FiltrosModal } from "@/components/modals/filtros-modal"
import { BulkStockModal } from "@/components/modals/bulk-stock-modal"

function StockColumnTooltip() {
  return (
    <div className="group relative flex-shrink-0">
      <div className="w-3.5 h-3.5 rounded-full border border-gray-400 flex items-center justify-center cursor-default text-gray-400 hover:text-gray-600 hover:border-gray-600 transition-colors">
        <span className="text-[9px] font-bold leading-none">i</span>
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-800 text-white text-[11px] rounded-md px-2.5 py-2 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
        <p className="font-semibold">En Stock</p>
        <p className="text-slate-300 mb-1.5">Unidades físicas presentes en depósito.</p>
        <p className="font-semibold">Reservado</p>
        <p className="text-slate-300 mb-1.5">Unidades comprometidas a ventas en curso que aún no fueron entregadas.</p>
        <p className="font-semibold">Disponible</p>
        <p className="text-slate-300">Unidades listas para la venta.</p>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
      </div>
    </div>
  )
}

interface ItemsGridProps {
  items: Item[]
  gridSize: string
  expandedItems: Record<number, boolean>
  handleItemClick: (item: Item) => void
  toggleVariantExpansion: (index: number) => void
  updateDepositStock?: (itemSku: string, depositId: string, quantity: number) => void
  depositStock?: DepositStock[]
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
  onUpdateStock?: (itemSku: string, field: "total" | "reservado", value: number) => void
  onUpdatePrecio?: (itemId: string, precio: { costo: number; margen: number; iva: number; precioFinal: number }) => void
  // For bulk stock edit
  getSelectedSkus?: () => string[]
  // Hide buttons
  hideNuevoButton?: boolean
  hideCreadorMasivoButton?: boolean
  // Show precio column instead of atributos
  showPrecioColumn?: boolean
  // Pause/Reactivate items
  onPauseItems?: (itemIds: string[]) => void
  onReactivateItems?: (itemIds: string[]) => void
}

export function ItemsGrid({
  items,
  gridSize,
  expandedItems,
  handleItemClick,
  toggleVariantExpansion,
  updateDepositStock,
  depositStock,
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
  onUpdateStock,
  onUpdatePrecio,
  getSelectedSkus,
  hideNuevoButton = false,
  hideCreadorMasivoButton = false,
  showPrecioColumn = false,
  onPauseItems,
  onReactivateItems,
}: ItemsGridProps) {
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
  const [bulkStockModalType, setBulkStockModalType] = useState<"total" | "reservado" | null>(null)

  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])
  const availableDepositos = useMemo(() => ["Torcuato", "Trujui"], [])

  const searchedItems = searchItems(items, searchQuery)
  const filteredItems = filterItems(searchedItems, filterConfig)
  
  const sortedAndFilteredItems = sortItems(filteredItems, sortConfig)

  // Get all visible SKUs (standalone items and children of parents)
  const getVisibleSkus = useCallback((): string[] => {
    const skus: string[] = []
    for (const item of sortedAndFilteredItems) {
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
  }, [sortedAndFilteredItems])

  // Get target SKUs for bulk edit (selected items take priority over visible items)
  const getTargetSkusForBulkEdit = useCallback((): string[] => {
    if (hasSelectedItems && getSelectedSkus) {
      return getSelectedSkus()
    }
    return getVisibleSkus()
  }, [hasSelectedItems, getSelectedSkus, getVisibleSkus])

  // Get count of items that will be affected by bulk edit
  const bulkEditTargetCount = useMemo(() => {
    return getTargetSkusForBulkEdit().length
  }, [getTargetSkusForBulkEdit])

  // Handle bulk stock edit apply
  const handleBulkStockApply = (operation: string, value: number) => {
    const targetSkus = getTargetSkusForBulkEdit()
    const field = bulkStockModalType
    if (!field) return

    for (const sku of targetSkus) {
      let item = items.find(i => i.sku === sku)
      if (!item) {
        for (const parent of items) {
          if (parent.variants) {
            const variant = parent.variants.find((v: any) => v.sku === sku)
            if (variant) {
              item = variant as any
              break
            }
          }
        }
      }
      if (!item) continue

      const currentTotal = parseInt((item.stock as any)?.enStock || item.stock?.total || "0")
      const currentReservado = parseInt(item.stock?.reservado || "0")
      const currentValue = field === "total" ? currentTotal : currentReservado

      let newValue = currentValue
      if (operation === "aumentar") {
        newValue = currentValue + value
      } else if (operation === "disminuir") {
        newValue = Math.max(0, currentValue - value)
      } else if (operation === "sobreescribir") {
        newValue = value
      }

      onUpdateStock?.(sku, field, newValue)
    }

    setBulkStockModalType(null)
  }
  
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
                {!hideNuevoButton && (
                  <>
                    <Button
                      onClick={() => router.push("/catalogo/items/nuevo")}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Crear Nuevo
                    </Button>
                  </>
                )}

                {!hideCreadorMasivoButton && (
                  <Button
                    onClick={() => router.push("/catalogo/creador-masivo")}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                    Creador Masivo
                  </Button>
                )}

                {!hideCreadorMasivoButton && (
                  <Button
                    onClick={() => router.push("/stock/articulos/editor-masivo")}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    Editor Masivo
                  </Button>
                )}

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
                    placeholder="Buscar artículos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
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

        {/* Bulk actions + Tab Header */}
        <div className="px-4 pb-2 pt-2">
          {/* Bulk actions bar */}
          <div className="bg-white border border-slate-200/80">
            <div className="flex items-center gap-2 h-9 px-3">
              {/* Select all checkbox */}
              <div className="flex items-center justify-center shrink-0">
                {selectAllIndeterminate ? (
                  <button
                    onClick={handleSelectAll}
                    className="w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-primary border border-primary cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5 text-primary-foreground" />
                  </button>
                ) : selectAllActive ? (
                  <button
                    onClick={handleSelectAll}
                    className="w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-primary border border-primary cursor-pointer hover:bg-primary/90"
                  >
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </button>
                ) : (
                  <button
                    onClick={handleSelectAll}
                    className="w-3.5 h-3.5 transition-colors cursor-pointer flex items-center justify-center rounded-sm bg-white border border-slate-300 hover:border-muted-foreground"
                  />
                )}
              </div>
              <div className="w-px h-5 bg-slate-200 shrink-0" />
              {hasSelectedItems ? (
                <span className="text-xs text-slate-600">
                  {getSelectedSkus?.().length ?? 0} seleccionado{(getSelectedSkus?.().length ?? 0) !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Seleccioná items para accionar masivamente</span>
              )}
            </div>
          </div>

          {/* Tab header — flat, no rounding, grid-cols-12: item(5) precio(4) stock(3) */}
          <div className="grid grid-cols-12 h-9 border border-slate-200/80 border-t-0 mt-2">
            <div className="col-span-5 flex items-center justify-center px-4 border-r border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Item</span>
            </div>
            {showPrecioColumn ? (
              <>
                <div className="col-span-4 flex items-center justify-center px-4 border-r border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precio Venta</span>
                </div>
                <div className="col-span-3 flex items-center justify-center gap-1.5 px-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock</span>
                  <StockColumnTooltip />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-4 flex items-center justify-center px-4 border-r border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Atributos</span>
                </div>
                <div className="col-span-3 flex items-center justify-center gap-1.5 px-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock</span>
                  <StockColumnTooltip />
                </div>
              </>
            )}
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
                  showPrecioColumn={showPrecioColumn}
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

      {/* Bulk Stock Modal */}
      <BulkStockModal
        isOpen={bulkStockModalType !== null}
        onClose={() => setBulkStockModalType(null)}
        onApply={handleBulkStockApply}
        itemCount={bulkEditTargetCount}
        type={bulkStockModalType || "total"}
      />
    </>
  )
}
