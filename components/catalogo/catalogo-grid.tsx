"use client"

import type { Item, SortFactorConfig, FilterConfig } from "@/lib/types"
import { ItemCard } from "../items/item-card"
import { Search, Minus, Check, Pause, Play } from "lucide-react"
import { useRef } from "react"
import { searchItems, sortItems, filterItems } from "@/lib/utils/item-utils"

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
  onUpdateItem?: (item: Item) => void
  onPauseItems?: (itemIds: string[]) => void
  onReactivateItems?: (itemIds: string[]) => void
  getSelectedSkus?: () => string[]
  // Lifted search/filter/sort from page
  searchQuery: string
  filterConfig: FilterConfig
  sortConfig: SortFactorConfig[]
  // All-selector ref (shared with bulk actions bar in page)
  allCheckboxRef?: React.RefObject<HTMLInputElement>
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
  onUpdateItem,
  onPauseItems,
  onReactivateItems,
  getSelectedSkus,
  searchQuery,
  filterConfig,
  sortConfig,
  allCheckboxRef,
}: CatalogoGridProps) {
  const internalCheckboxRef = useRef<HTMLInputElement>(null)
  const checkboxRef = allCheckboxRef || internalCheckboxRef

  const searchedItems = searchItems(items, searchQuery)
  const filteredItems = filterItems(searchedItems, filterConfig)
  const sortedAndFilteredItems = sortItems(filteredItems, sortConfig)

  return (
    <>
      {/* Bulk actions + Tab Header */}
      <div className="mt-3 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Bulk actions bar */}
          <div className="bg-white border border-slate-200/80">
            <div className="flex items-center gap-2 h-9 px-3">
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

          {/* Tab header — flat, no rounding, grid-cols-12: item(5) estado(1) precio(3) stock(3) */}
          <div className="grid grid-cols-12 h-9 border border-slate-200/80 border-t-0 mt-2">
            <div className="col-span-5 flex items-center justify-center px-4 border-r border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Item</span>
            </div>
            <div className="col-span-1 flex items-center justify-center px-1 border-r border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado</span>
            </div>
            <div className="col-span-3 flex items-center justify-center px-4 border-r border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precio Venta</span>
            </div>
            <div className="col-span-3 flex items-center justify-center px-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-8 pb-8 mt-2">
        <div className="max-w-6xl mx-auto">
          {sortedAndFilteredItems.length === 0 && (searchQuery || filterConfig.categorias.length > 0 || filterConfig.marcas.length > 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Search className="w-10 h-10 mb-4 text-slate-300" />
              <p className="text-base font-medium text-slate-500">No se encontraron resultados</p>
              <p className="text-sm mt-1">Intenta con otros términos o ajusta los filtros</p>
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
                    showPrecioColumn={true}
                    onUpdatePrecio={onUpdatePrecio}
                    onUpdateStock={onUpdateStock}
                    onUpdateItem={onUpdateItem}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
