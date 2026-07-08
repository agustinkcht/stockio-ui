"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { CheckCircle2, Search, X, ListFilter, ArrowUpDown, Minus, PencilLine, MoreVertical } from "lucide-react"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import type { Item, FilterConfig, SortFactorConfig } from "@/lib/types"
import { Sidebar } from "@/components/layout/sidebar"
import { PriceGrid } from "@/components/prices/price-grid"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { UserPanel } from "@/components/layout/user-panel"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { useItems } from "@/hooks/use-items"
import { useModals } from "@/hooks/use-modals"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useSidebar } from "@/hooks/use-sidebar"
import { useSettings } from "@/lib/contexts/settings-context"
import { getUniqueCategorias, getUniqueMarcas, getUniqueProveedores, searchItems, filterItems } from "@/lib/utils/item-utils"
import { useMemo } from "react"

// ─── Sort concepts available in this view ────────────────────────────────────
type QuickSortField = "nombre" | "precioFinal" | "costo" | "margen"
const QUICK_SORT_LABELS: Record<QuickSortField, string> = {
  nombre: "Nombre",
  precioFinal: "Precio Final",
  costo: "Costo",
  margen: "Margen",
}

const DEFAULT_FILTERS: FilterConfig = {
  tipos: [],
  categorias: [],
  marcas: [],
  proveedores: [],
  stock: [],
  depositos: [],
}

export default function ListaDePreciosPage() {
  const { precios: preciosSettings } = useSettings()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [itemCreated, setItemCreated] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // ── Search / Filter / Sort ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortField, setSortField] = useState<QuickSortField>("nombre")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [activeFilters, setActiveFilters] = useState<FilterConfig>(DEFAULT_FILTERS)
  const [sortPriorities, setSortPriorities] = useState<SortFactorConfig[]>([{ factor: "nombre", direction: "asc" }])

  // ── Selection (lifted from grid) ────────────────────────────────────────────
  const [selCount, setSelCount] = useState(0)
  const [selHas, setSelHas] = useState(false)
  const [selAll, setSelAll] = useState(false)
  const [selIndeterminate, setSelIndeterminate] = useState(false)
  const gridHandleSelectAllRef = useRef<() => void>(() => {})
  const gridBulkModalOpenRef = useRef<(type: "costo" | "precioFinal" | "margen" | "iva" | null) => void>(() => {})
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
    depositStock,
    updateDepositStock,
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    updateItem,
    deleteItem,
    undoDelete,
    saveDelete: saveDeletedItemsHook,
    hasUnsavedDeletes,
    deletedItems,
    isCreatingItem,
    editField,
    editVariantField,
    undoEdit,
    redoEdit,
    saveEdit,
    cancelEdit,
    forceSaveItems,
    reloadItems,
    hasUnsavedEdits,
    canUndoEdit,
    canRedoEdit,
  } = useItems()

  const {
    showNuevoItemModal,
    isNuevoItemMinimized,
    showNuevoItemConVariantesModal,
    isNuevoItemConVariantesMinimized,
    showTemplateModal,
    activeNavTab,
    minimizedTabs,
    handleOpenNuevoItem,
    handleCloseNuevoItem,
    handleMinimizeNuevoItem,
    handleRestoreNuevoItem,
    handleOpenNuevoItemConVariantes,
    handleCloseNuevoItemConVariantes,
    handleMinimizeNuevoItemConVariantes,
    setShowTemplateModal,
    setIsNuevoItemConVariantesMinimized,
    setActiveNavTab,
    handleCloseTabFromNavbar,
    itemTitulo,
    setItemTitulo,
    itemTemplate,
    setItemTemplate,
    itemUbicacion,
    setItemUbicacion,
    handleRestoreNuevoItemConVariantes,
  } = useModals()

  const {
    hoveredDropdown,
    showNuevoDropdown,
    setShowNuevoDropdown,
    showAccionesDropdown,
    setShowAccionesDropdown,
    gridSize,
    gridSizeDropdownOpen,
    setGridSizeDropdownOpen,
    setGridSize,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
    handleCloseDropdowns,
  } = useSidebar()

  const breadcrumbs = [{ label: "Precios" }, { label: "Lista de Precios", href: "/precios/lista-de-precios" }]

  const canUndo = canUndoEdit || hasUnsavedDeletes
  const canRedo = canRedoEdit
  const hasChanges = hasUnsavedEdits || hasUnsavedDeletes

  const handleDeshacer = () => {
    reloadItems()
    if (hasUnsavedDeletes) undoDelete()
    setIsEditMode(false)
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    setShowSaveSuccess(false)
    try {
      if (hasUnsavedEdits) { await sleep(800); forceSaveItems() }
      if (hasUnsavedDeletes) { await sleep(800); await saveDeletedItemsHook() }
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    } catch (error) {
      console.error("[v0] Error saving changes:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePriceFieldChange = (itemSku: string, field: string, value: any) => {
    let isVariant = false
    let parentSku: string | undefined
    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === itemSku)
        if (variant) { isVariant = true; parentSku = item.sku; break }
      }
    }
    if (isVariant && parentSku) editVariantField(parentSku, itemSku, field, value)
    else editField(itemSku, field, value)
  }

  const findItemBySku = (skuOrId: string): { isVariant: boolean; parentSku?: string } => {
    for (const item of items) {
      if (item.sku === skuOrId || item.id === skuOrId) return { isVariant: false }
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === skuOrId || v.id === skuOrId)
        if (variant) return { isVariant: true, parentSku: item.sku || item.id }
      }
    }
    return { isVariant: false }
  }

  const calculatePrecioFinal = (costo: number, margen: number): number => Math.round(costo * (1 + margen / 100))
  const calculateMargen = (precioFinal: number, costo: number): number => {
    if (costo === 0) return 0
    return Math.round((precioFinal / costo - 1) * 1000) / 10
  }

  const getItemPricingBySku = (skuOrId: string) => {
    for (const item of items) {
      if (item.sku === skuOrId || item.id === skuOrId) {
        if (item.precio) return { costo: item.precio.costo || 0, margen: item.precio.margen || 0, iva: item.precio.iva || 21, precioFinal: item.precio.precioFinal || calculatePrecioFinal(item.precio.costo || 0, item.precio.margen || 0) }
        return { costo: item.costo || 0, margen: item.margen || 0, iva: item.iva || 21, precioFinal: item.precioVenta || 0 }
      }
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === skuOrId || v.id === skuOrId)
        if (variant) {
          if (variant.precio) return { costo: variant.precio.costo || 0, margen: variant.precio.margen || 0, iva: variant.precio.iva || 21, precioFinal: variant.precio.precioFinal || calculatePrecioFinal(variant.precio.costo || 0, variant.precio.margen || 0) }
          return { costo: variant.costo || 0, margen: variant.margen || 0, iva: variant.iva || 21, precioFinal: variant.precioVenta || 0 }
        }
      }
    }
    return null
  }

  const handleBulkEdit = (
    type: "costo" | "precioFinal" | "margen" | "iva" | null,
    operation: string,
    value: number,
    unit: string,
    targetSkus: string[],
  ) => {
    if (!type) return
    for (const sku of targetSkus) {
      const { isVariant, parentSku } = findItemBySku(sku)
      const pricing = getItemPricingBySku(sku)
      if (!pricing) continue
      const updated = { ...pricing }
      switch (type) {
        case "costo": {
          let newCosto = operation === "fijar_en" ? (unit === "%" ? pricing.costo * (value / 100) : value) : operation === "aumentar" ? (unit === "%" ? pricing.costo * (1 + value / 100) : pricing.costo + value) : (unit === "%" ? pricing.costo * (1 - value / 100) : pricing.costo - value)
          updated.costo = Math.max(0, Math.round(newCosto))
          if (preciosSettings.costoBehavior === "preservePrecioFinal") updated.margen = calculateMargen(updated.precioFinal, updated.costo)
          else updated.precioFinal = calculatePrecioFinal(updated.costo, updated.margen)
          break
        }
        case "precioFinal": {
          let newPF = operation === "fijar_en" ? (unit === "%" ? pricing.precioFinal * (value / 100) : value) : operation === "aumentar" ? (unit === "%" ? pricing.precioFinal * (1 + value / 100) : pricing.precioFinal + value) : (unit === "%" ? pricing.precioFinal * (1 - value / 100) : pricing.precioFinal - value)
          updated.precioFinal = Math.max(0, Math.round(newPF))
          updated.margen = calculateMargen(updated.precioFinal, updated.costo)
          break
        }
        case "margen": {
          if (pricing.costo === 0) break
          let newMargen = operation === "fijar_en" || operation === "reemplazar" ? value : operation === "aumentar" ? pricing.margen + value : pricing.margen - value
          updated.margen = Math.round(newMargen * 10) / 10
          updated.precioFinal = calculatePrecioFinal(updated.costo, updated.margen)
          break
        }
        case "iva": { updated.iva = value; break }
      }
      if (isVariant && parentSku) editVariantField(parentSku, sku, "precio", updated)
      else editField(sku, "precio", updated)
    }
  }

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleRestoreTab = (tabId: string) => {
    if (tabId === "nuevo-item") handleRestoreNuevoItem()
    else if (tabId === "nuevo-item-variantes") handleRestoreNuevoItemConVariantes()
  }

  const handleCreateItemWithSuccess = async (itemTitulo: string, itemTemplate: string, handleClose: () => void) => {
    await handleCreateNuevoItem(itemTitulo, itemTemplate, handleClose)
    setItemCreated(true)
    setTimeout(() => setItemCreated(false), 100)
  }

  const handleCreateItemConVariantesWithSuccess = async (itemTitulo: string, itemTemplate: string, handleClose: () => void) => {
    await handleCreateNuevoItemConVariantes(itemTitulo, itemTemplate, handleClose)
    setItemCreated(true)
    setTimeout(() => setItemCreated(false), 100)
  }

  const { showNavigationModal, handleSaveAndNavigate, handleDiscardAndNavigate, handleCancelNavigation } =
    useNavigationGuard({ hasUnsavedChanges: isEditMode && hasChanges, onSave: handleGuardar, onDiscard: handleDeshacer })

  // ── Derived: filtered count for the count badge ────────────────────────────
  const filteredCount = useMemo(() => {
    const searched = searchItems(items, searchQuery)
    return filterItems(searched, activeFilters).length
  }, [items, searchQuery, activeFilters])

  // ── Derived filter state ────────────────────────────────────────────────────
  const hasFilters =
    activeFilters.categorias.length > 0 ||
    activeFilters.marcas.length > 0 ||
    activeFilters.proveedores.length > 0 ||
    activeFilters.tipos.length > 0

  const availableCategorias = getUniqueCategorias(items)
  const availableMarcas = getUniqueMarcas(items)
  const availableProveedores = getUniqueProveedores(items)

  // Sync quick sort selector → sortPriorities
  const handleSortFieldChange = (field: QuickSortField) => {
    setSortField(field)
    setSortPriorities([{ factor: field, direction: sortDir }])
  }
  const handleSortDirToggle = () => {
    const next = sortDir === "asc" ? "desc" : "asc"
    setSortDir(next)
    setSortPriorities([{ factor: sortField, direction: next }])
  }

  // Remove a single filter tag
  const removeFilterTag = (type: "categoria" | "marca" | "proveedor" | "tipo", value: string) => {
    setActiveFilters((prev) => {
      if (type === "categoria") return { ...prev, categorias: prev.categorias.filter((c) => c !== value) }
      if (type === "marca") return { ...prev, marcas: prev.marcas.filter((m) => m !== value) }
      if (type === "proveedor") return { ...prev, proveedores: prev.proveedores.filter((p) => p !== value) }
      return { ...prev, tipos: prev.tipos.filter((t) => t !== value) }
    })
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
          {(showNuevoItemModal || showNuevoItemConVariantesModal) && (
            <div className="absolute top-0 left-0 h-full w-full bg-black/50 z-[60] pointer-events-none rounded-lg" />
          )}
        </div>

        {/* Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">

          {/* ── Utility bar ────────────────────────────────────────────────── */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004] shrink-0">
            <div className="px-4 flex items-center justify-between h-full">
              <Breadcrumb items={breadcrumbs} />
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div className="min-w-[200px]" />
            </div>
          </div>

          {/* ── Scrollable region ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto bg-panel-content">

            {/* Top row */}
            <div className="px-8 pt-12 pb-8">
              <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                  Lista de Precios
                </h1>
                <div className="flex items-center gap-2 mt-1 shrink-0">
                  {!isEditMode ? (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 rounded-lg flex items-center bg-white text-slate-900 hover:bg-panel-content cursor-pointer"
                    >
                      <PencilLine className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                      Editar Lista
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleDeshacer}
                        className="h-9 px-4 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-panel-content text-slate-700 transition-colors cursor-pointer"
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

            {/* ── Sticky bar ─────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-20">

              {/* Row 1 — Search + filter tags + Filtrar/Ordenar + count */}
              <div className="relative z-10 bg-panel-content/95 backdrop-blur-sm px-8 pt-2 pb-0">
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
                        {activeFilters.proveedores.map((prov) => (
                          <span key={prov} className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                            {prov}
                            <button type="button" onClick={() => removeFilterTag("proveedor", prov)} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
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
                              : "border-[rgba(228,230,235,0.6)] bg-white hover:bg-panel-content text-slate-600"
                          }`}
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          Filtrar
                        </button>
                        {filterOpen && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setFilterOpen(false)} />
                            <div className="absolute top-full right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-[100] p-3 space-y-3">

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

                              {/* Proveedor */}
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Proveedor</label>
                                <select
                                  value={activeFilters.proveedores[0] ?? ""}
                                  onChange={(e) => setActiveFilters((f) => ({ ...f, proveedores: e.target.value ? [e.target.value] : [] }))}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white cursor-pointer"
                                >
                                  <option value="">Todos</option>
                                  {availableProveedores.map((p) => <option key={p} value={p}>{p}</option>)}
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

                      {/* Ordenar — split control: direction toggle + field select */}
                      <div className="flex items-center border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md overflow-hidden bg-white h-9">
                        <button
                          type="button"
                          onClick={handleSortDirToggle}
                          title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                          className="px-2.5 h-full hover:bg-panel-content transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer flex items-center"
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

                      {/* Divider */}
                      <div className="w-px h-5 bg-slate-200 shrink-0" />

                      {/* Count */}
                      <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
                        {filteredCount} {filteredCount === 1 ? "item" : "items"}
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Row 2 — Bulk actions + Tab header together, same bg */}
              <div className="px-8 bg-panel-content/95 backdrop-blur-sm pb-2">
                <div className="max-w-6xl mx-auto">
                  {/* Bulk actions */}
                  <div className="bg-white border border-slate-200/80 rounded-lg">
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
                  <div className="grid grid-cols-12 h-9 border border-slate-200/80 mt-2 rounded-lg overflow-hidden bg-slate-50">
                    <div className="col-span-6 flex items-center justify-center px-4 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Item</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between pl-3 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Costo</span>
                      {isEditMode && (
                        <button onClick={() => gridBulkModalOpenRef.current("costo")} className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors cursor-pointer mr-1">
                          <MoreVertical className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                        </button>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center justify-between pl-3 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Margen</span>
                      {isEditMode && (
                        <button onClick={() => gridBulkModalOpenRef.current("margen")} className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors cursor-pointer mr-1">
                          <MoreVertical className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                        </button>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center justify-between pl-3 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">IVA</span>
                      {isEditMode && (
                        <button onClick={() => gridBulkModalOpenRef.current("iva")} className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors cursor-pointer mr-1">
                          <MoreVertical className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                        </button>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-between pl-3">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precio de Venta</span>
                      {isEditMode && (
                        <button onClick={() => gridBulkModalOpenRef.current("precioFinal")} className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors cursor-pointer mr-1">
                          <MoreVertical className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* /sticky bar */}

            {/* ── Price grid ─────────────────────────────────────────────────── */}
            <div className="px-8 pb-8">
              <div className="max-w-6xl mx-auto">
                <PriceGrid
                  items={items}
                  gridSize={gridSize}
                  expandedItems={expandedItems}
                  toggleVariantExpansion={toggleVariantExpansion}
                  gridSizeDropdownOpen={gridSizeDropdownOpen}
                  setGridSizeDropdownOpen={setGridSizeDropdownOpen}
                  setGridSize={setGridSize}
                  onPriceFieldChange={handlePriceFieldChange}
                  onBulkEdit={handleBulkEdit}
                  searchTerm={searchQuery}
                  activeFilters={activeFilters}
                  sortPriorities={sortPriorities}
                  onSelectionChange={handleSelectionChange}
                  isEditMode={isEditMode}
                  bulkModalOpenRef={gridBulkModalOpenRef}
                />
                </div>
            </div>

          </div>
          {/* /scrollable region */}

        </div>
        {/* /panel */}

      </div>

      {/* ── Modals ───────────────────────────��───────────────────────────────── */}
      <TemplateModal showTemplateModal={showTemplateModal} setShowTemplateModal={setShowTemplateModal} />

      <NuevoItemModal
        showNuevoItemModal={showNuevoItemModal}
        isNuevoItemMinimized={isNuevoItemMinimized}
        handleMinimizeNuevoItem={handleMinimizeNuevoItem}
        handleCloseNuevoItem={handleCloseNuevoItem}
        itemTitulo={itemTitulo}
        setItemTitulo={setItemTitulo}
        itemTemplate={itemTemplate}
        setItemTemplate={setItemTemplate}
        itemUbicacion={itemUbicacion}
        setItemUbicacion={setItemUbicacion}
        handleCreateNuevoItem={handleCreateItemWithSuccess}
        isCreatingItem={isCreatingItem}
      />

      <NuevoItemConVariantesModal
        showNuevoItemConVariantesModal={showNuevoItemConVariantesModal}
        isNuevoItemConVariantesMinimized={isNuevoItemConVariantesMinimized}
        handleMinimizeNuevoItemConVariantes={handleMinimizeNuevoItemConVariantes}
        handleCloseNuevoItemConVariantes={handleCloseNuevoItemConVariantes}
        setIsNuevoItemConVariantesMinimized={setIsNuevoItemConVariantesMinimized}
        setActiveNavTab={setActiveNavTab}
        activeNavTab={activeNavTab}
        itemTitulo={itemTitulo}
        setItemTitulo={setItemTitulo}
        itemTemplate={itemTemplate}
        setItemTemplate={setItemTemplate}
        itemUbicacion={itemUbicacion}
        setItemUbicacion={setItemUbicacion}
        handleCreateNuevoItemConVariantes={handleCreateItemConVariantesWithSuccess}
        isCreatingItem={isCreatingItem}
      />

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
            {/* Emerald left bar */}
            <div className="w-[3px] shrink-0" style={{ background: "linear-gradient(to bottom, #34d399, #059669)" }} />

            {/* Content */}
            <div className="flex items-center gap-3.5 px-5 py-4">
              {/* Icon container */}
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}
              >
                <CheckCircle2 className="w-4.5 h-4.5" style={{ color: "#34d399" }} strokeWidth={2.25} />
              </div>

              {/* Text */}
              <div>
                <p className="text-[13px] font-semibold leading-tight" style={{ color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                  Cambios guardados
                </p>
                <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(148,163,184,0.7)" }}>
                  Lista de precios actualizada
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
