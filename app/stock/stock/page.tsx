"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { CheckCircle2, Search, X, ListFilter, ArrowUpDown, PencilLine, MoreVertical } from "lucide-react"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import type { FilterConfig, SortFactorConfig } from "@/lib/types"
import { Sidebar } from "@/components/layout/sidebar"
import { StockListGrid } from "@/components/stock/stock-list-grid"
import { UserPanel } from "@/components/layout/user-panel"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { useItems } from "@/hooks/use-items"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useSidebar } from "@/hooks/use-sidebar"
import { getUniqueCategorias, getUniqueMarcas, searchItems, filterItems } from "@/lib/utils/item-utils"

// ─── Sort options ─────────────────────────────────────────────────────────────
type QuickSortField = "nombre" | "enStock" | "stockDisponible"
const QUICK_SORT_LABELS: Record<QuickSortField, string> = {
  nombre: "Nombre",
  enStock: "En Stock",
  stockDisponible: "Disponible",
}

const DEFAULT_FILTERS: FilterConfig = {
  tipos: [],
  categorias: [],
  marcas: [],
  proveedores: [],
  stock: [],
  depositos: [],
}

export default function StockPage() {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  // ── Search / Filter / Sort ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortField, setSortField] = useState<QuickSortField>("nombre")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [activeFilters, setActiveFilters] = useState<FilterConfig>(DEFAULT_FILTERS)
  const [sortPriorities, setSortPriorities] = useState<SortFactorConfig[]>([{ factor: "nombre", direction: "asc" }])

  // ── Selection (lifted from grid) ───────────────────────────────────────────
  const [selCount, setSelCount] = useState(0)
  const [selHas, setSelHas] = useState(false)
  const [selAll, setSelAll] = useState(false)
  const [selIndeterminate, setSelIndeterminate] = useState(false)
  const gridHandleSelectAllRef = useRef<() => void>(() => {})
  const gridBulkStockModalOpenRef = useRef<() => void>(() => {})
  const allCheckboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = selIndeterminate
    }
  }, [selIndeterminate])

  const handleSelectionChange = useCallback(
    (count: number, has: boolean, all: boolean, indeterminate: boolean, doSelectAll: () => void) => {
      setSelCount(count)
      setSelHas(has)
      setSelAll(all)
      setSelIndeterminate(indeterminate)
      gridHandleSelectAllRef.current = doSelectAll
    },
    [],
  )

  const {
    items,
    editField,
    editVariantField,
    undoEdit,
    saveEdit,
    cancelEdit,
    hasUnsavedEdits,
  } = useItems()

  const {
    hoveredDropdown,
    gridSize,
    gridSizeDropdownOpen,
    setGridSizeDropdownOpen,
    setGridSize,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
    handleCloseDropdowns,
  } = useSidebar()

  const breadcrumbs = [{ label: "Stock" }, { label: "Stock", href: "/stock/stock" }]

  const hasChanges = hasUnsavedEdits

  const handleDeshacer = () => {
    cancelEdit()
    setIsEditMode(false)
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    setShowSaveSuccess(false)
    try {
      await sleep(800)
      saveEdit()
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    } catch (error) {
      console.error("[v0] Error saving stock changes:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStockFieldChange = (itemSku: string, field: "total" | "reservado", value: number) => {
    let isVariant = false
    let parentSku: string | undefined
    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === itemSku)
        if (variant) { isVariant = true; parentSku = item.sku; break }
      }
    }
    const stockField = field === "total" ? "enStock" : "stockReservado"
    if (isVariant && parentSku) editVariantField(parentSku, itemSku, stockField, value)
    else editField(itemSku, stockField, value)
  }

  const getItemCurrentTotal = (it: any): number => {
    const stockField = it.stock
    const stockObj = stockField && typeof stockField === "object" ? stockField : null
    return it.enStock ?? stockObj?.enStock ?? (typeof stockField === "number" ? stockField : 0)
  }

  const handleBulkStockEdit = (operation: string, value: number, targetSkus: string[]) => {
    for (const sku of targetSkus) {
      let currentTotal = 0
      let isVariant = false
      let parentSku: string | undefined
      for (const item of items) {
        if (item.sku === sku || (item as any).id === sku) {
          currentTotal = getItemCurrentTotal(item)
          break
        }
        if (item.variants) {
          const variant = item.variants.find((v: any) => v.sku === sku || (v as any).id === sku)
          if (variant) {
            currentTotal = getItemCurrentTotal(variant)
            isVariant = true
            parentSku = item.sku
            break
          }
        }
      }
      let newTotal: number
      if (operation === "aumentar") newTotal = currentTotal + value
      else if (operation === "reducir") newTotal = Math.max(0, currentTotal - value)
      else newTotal = value // fijar_en
      if (isVariant && parentSku) editVariantField(parentSku, sku, "enStock", newTotal)
      else editField(sku, "enStock", newTotal)
    }
  }

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const { showNavigationModal, handleSaveAndNavigate, handleDiscardAndNavigate, handleCancelNavigation } =
    useNavigationGuard({ hasUnsavedChanges: isEditMode && hasChanges, onSave: handleGuardar, onDiscard: handleDeshacer })

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredCount = useMemo(() => {
    const searched = searchItems(items, searchQuery)
    return filterItems(searched, activeFilters).length
  }, [items, searchQuery, activeFilters])

  const hasFilters =
    activeFilters.categorias.length > 0 ||
    activeFilters.marcas.length > 0 ||
    activeFilters.proveedores.length > 0

  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])

  const handleSortFieldChange = (field: QuickSortField) => {
    setSortField(field)
    setSortPriorities([{ factor: field as any, direction: sortDir }])
  }
  const handleSortDirToggle = () => {
    const next = sortDir === "asc" ? "desc" : "asc"
    setSortDir(next)
    setSortPriorities([{ factor: sortField as any, direction: next }])
  }

  const removeFilterTag = (type: "categoria" | "marca", value: string) => {
    setActiveFilters((prev) => {
      if (type === "categoria") return { ...prev, categorias: prev.categorias.filter((c) => c !== value) }
      return { ...prev, marcas: prev.marcas.filter((m) => m !== value) }
    })
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>

        {/* Sidebar */}
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        {/* Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">

          {/* Utility bar */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004] shrink-0">
            <div className="px-4 flex items-center justify-between h-full">
              <Breadcrumb items={breadcrumbs} />
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div className="min-w-[200px]" />
            </div>
          </div>

          {/* Scrollable region */}
          <div className="flex-1 overflow-y-auto bg-slate-50">

            {/* Top row — title + Editar Stock / Deshacer + Guardar */}
            <div className="px-8 pt-12 pb-8">
              <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                  Stock
                </h1>
                <div className="flex items-center gap-2 mt-1 shrink-0">
                  {!isEditMode ? (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer"
                    >
                      <PencilLine className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                      Editar Stock
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleDeshacer}
                        className="h-9 px-4 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => { await handleGuardar(); setIsEditMode(false) }}
                        disabled={isSaving}
                        className="h-9 px-4 text-sm font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky bar */}
            <div className="sticky top-0 z-20">

              {/* Row 1 — Search + filter tags + Filtrar/Ordenar + count */}
              <div className="relative z-10 bg-slate-50/95 backdrop-blur-sm px-8 pt-2 pb-0">
                <div className="max-w-6xl mx-auto border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">

                    {/* Search */}
                    <div className="flex items-center h-9 border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md min-w-0 overflow-hidden bg-white">
                      <div className="flex items-center gap-2 px-3 h-full w-64 bg-white">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar items"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 cursor-pointer text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active filter tags */}
                    {hasFilters && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeFilters.categorias.map((cat) => (
                          <span key={cat} className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                            {cat}
                            <button type="button" onClick={() => removeFilterTag("categoria", cat)} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                              <X className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          </span>
                        ))}
                        {activeFilters.marcas.map((marca) => (
                          <span key={marca} className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                            {marca}
                            <button type="button" onClick={() => removeFilterTag("marca", marca)} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                              <X className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Right: Filtrar + Ordenar + count */}
                    <div className="ml-auto flex items-center gap-2">

                      {/* Filtrar */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setFilterOpen((v) => !v)}
                          className={`h-9 text-xs border shadow-sm px-3 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors ${
                            hasFilters
                              ? "border-blue-400 text-blue-600 bg-blue-50"
                              : "border-[rgba(228,230,235,0.6)] bg-white hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          Filtrar
                        </button>
                        {filterOpen && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setFilterOpen(false)} />
                            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-[100] p-3 space-y-3">
                              {/* Categoría */}
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
                                <select
                                  value={activeFilters.categorias[0] ?? ""}
                                  onChange={(e) => setActiveFilters((f) => ({ ...f, categorias: e.target.value ? [e.target.value] : [] }))}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white cursor-pointer"
                                >
                                  <option value="">Todas</option>
                                  {availableCategorias.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              {/* Marca */}
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Marca</label>
                                <select
                                  value={activeFilters.marcas[0] ?? ""}
                                  onChange={(e) => setActiveFilters((f) => ({ ...f, marcas: e.target.value ? [e.target.value] : [] }))}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white cursor-pointer"
                                >
                                  <option value="">Todas</option>
                                  {availableMarcas.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </div>
                              {hasFilters && (
                                <button
                                  type="button"
                                  onClick={() => setActiveFilters(DEFAULT_FILTERS)}
                                  className="w-full text-xs text-slate-500 hover:text-slate-700 py-1 text-center cursor-pointer border-t border-slate-100 pt-2"
                                >
                                  Limpiar filtros
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Ordenar */}
                      <div className="flex items-center border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md overflow-hidden bg-white h-9">
                        <button
                          type="button"
                          onClick={handleSortDirToggle}
                          title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                          className="px-2.5 h-full hover:bg-slate-50 transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer flex items-center"
                        >
                          <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${sortDir === "desc" ? "scale-y-[-1]" : ""}`} />
                        </button>
                        <select
                          value={sortField}
                          onChange={(e) => handleSortFieldChange(e.target.value as QuickSortField)}
                          className="appearance-none pl-2.5 pr-2.5 text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700 h-full w-auto"
                        >
                          {(Object.entries(QUICK_SORT_LABELS) as [QuickSortField, string][]).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Divider + count */}
                      <div className="w-px h-5 bg-slate-200 shrink-0" />
                      <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
                        {filteredCount} {filteredCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 — Bulk actions + Tab header together, same bg */}
              <div className="px-8 bg-slate-50/95 backdrop-blur-sm pb-2">
                <div className="max-w-6xl mx-auto">
                  {/* Bulk actions */}
                  <div className="bg-white border border-slate-200/80 border-t-0">
                    <div className="flex items-center gap-2 h-9">
                      <div className="flex items-center justify-center w-[4%] min-w-[40px] shrink-0">
                        <input
                          ref={allCheckboxRef}
                          type="checkbox"
                          checked={selAll}
                          onChange={() => gridHandleSelectAllRef.current()}
                          className="w-3.5 h-3.5 rounded accent-slate-800 cursor-pointer"
                        />
                      </div>
                      <div className="w-px h-5 bg-slate-200 shrink-0" />
                      {selCount === 0 ? (
                        <span className="text-xs text-slate-400">Seleccioná items para accionar masivamente</span>
                      ) : (
                        <span className="text-xs text-slate-600">
                          {selCount} seleccionado{selCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Tab header */}
                  <div className="grid grid-cols-[minmax(0,6fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)] h-9 border border-slate-200/80 mt-2 bg-slate-50">
                    <div className="flex items-center justify-center px-4 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Item</span>
                    </div>
                    <div className="flex items-center justify-between pl-3 pr-1 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">En Stock</span>
                      {isEditMode && (
                        <button
                          onClick={() => gridBulkStockModalOpenRef.current()}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-center border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reservado</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Disponible</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* /sticky bar */}

            {/* Stock grid */}
            <div className="px-8 pb-8">
              <div className="max-w-6xl mx-auto">
                <StockListGrid
                  items={items}
                  gridSize={gridSize}
                  expandedItems={expandedItems}
                  toggleVariantExpansion={toggleVariantExpansion}
                  onStockFieldChange={handleStockFieldChange}
                  onBulkStockEdit={handleBulkStockEdit}
                  searchTerm={searchQuery}
                  activeFilters={activeFilters}
                  sortPriorities={sortPriorities}
                  onSelectionChange={handleSelectionChange}
                  isEditMode={isEditMode}
                  bulkModalOpenRef={gridBulkStockModalOpenRef}
                />
              </div>
            </div>

          </div>
          {/* /scrollable region */}

        </div>
        {/* /panel */}
      </div>

      <UnsavedChangesModal
        isOpen={showNavigationModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
      />

      {/* Save success toast */}
      {showSaveSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className="relative flex items-stretch gap-0 rounded-2xl overflow-hidden"
            style={{
              background: "#0d0f12",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)",
              minWidth: "280px",
            }}
          >
            <div className="w-[3px] shrink-0" style={{ background: "linear-gradient(to bottom, #34d399, #059669)" }} />
            <div className="flex items-center gap-3.5 px-5 py-4">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: "#34d399" }} strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-tight" style={{ color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                  Cambios guardados
                </p>
                <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(148,163,184,0.7)" }}>
                  Stock actualizado
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
