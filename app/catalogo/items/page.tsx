"use client"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Plus, Search, X, ListFilter, ArrowUpDown, CheckCircle2, Pause, Play, ChevronDown } from "lucide-react"
import { useAccount } from "@/lib/contexts/account-context"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CatalogoGrid } from "@/components/catalogo/catalogo-grid"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { UserPanel } from "@/components/layout/user-panel"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useModals } from "@/hooks/use-modals"
import { useSidebar } from "@/hooks/use-sidebar"

import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item, FilterConfig, SortFactorConfig } from "@/lib/types"
import { getItemPhoto } from "@/lib/utils/category-images"
import { searchItems, filterItems, getUniqueCategorias, getUniqueMarcas } from "@/lib/utils/item-utils"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const breadcrumbs = [
  { label: "Catálogo", href: "/catalogo" },
  { label: "Items", href: "/catalogo/items" },
]

type QuickSortField = "nombre" | "categoria" | "marca" | "precioVenta" | "stock"

export default function CatalogoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currentAccount } = useAccount()

  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [toastLabel, setToastLabel] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "info" } | null>(null)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)

  // ── URL-param driven search / filter / sort ────────────────────────────────
  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const searchQuery = searchParams.get("q") ?? ""
  const sortField = (searchParams.get("sort") ?? "nombre") as QuickSortField
  const sortDir = (searchParams.get("dir") ?? "asc") as "asc" | "desc"
  const filterCategorias = searchParams.get("categorias")?.split(",").filter(Boolean) ?? []
  const filterMarcas = searchParams.get("marcas")?.split(",").filter(Boolean) ?? []
  const filterEstados = searchParams.get("estados")?.split(",").filter(Boolean) ?? []

  const setSearchQuery = (v: string) => updateParam("q", v)
  const setSortField = (v: QuickSortField) => updateParam("sort", v)
  const setSortDir = (v: "asc" | "desc") => updateParam("dir", v)
  const setFilterCategorias = (v: string[]) => updateParam("categorias", v.join(","))
  const setFilterMarcas = (v: string[]) => updateParam("marcas", v.join(","))
  const setFilterEstados = (v: string[]) => updateParam("estados", v.join(","))

  // ── Dropdown visibility ────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false)
  const [categoriasExpanded, setCategoriasExpanded] = useState(false)
  const [marcasExpanded, setMarcasExpanded] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [nuevoItemDropdownOpen, setNuevoItemDropdownOpen] = useState(false)

  // ── Items / hooks ──────────────────────────────────────────────────────────
  const {
    items,
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    deleteItem,
    undoDelete,
    saveDelete: saveDeletedItems,
    hasUnsavedDeletes,
    isCreatingItem,
    updateStock,
    editField,
    editVariantField,
    saveEdit,
    forceSaveItems,
    hasUnsavedEdits,
    updateItemsActiveStatus,
  } = useItems()

  const {
    selectAllActive,
    selectAllIndeterminate,
    hasSelectedItems,
    handleSelectAll,
    handleItemSelection,
    getSelectionState,
    getSelectedSkus,
    clearSelection,
  } = useItemSelection(items)

  const allCheckboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = selectAllIndeterminate
    }
  }, [selectAllIndeterminate])

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

  // ── Derived filter/sort config for grid ───────────────────────────────────
  const filterConfig: FilterConfig = useMemo(() => ({
    tipos: [],
    categorias: filterCategorias,
    marcas: filterMarcas,
    proveedores: [],
    stock: filterEstados.includes("sin_stock") ? ["sin_stock"] : [],
    depositos: [],
  }), [filterCategorias, filterMarcas, filterEstados])

  const sortConfig: SortFactorConfig[] = useMemo(() => ([
    { factor: sortField as any, direction: sortDir },
  ]), [sortField, sortDir])

  // ── Available options for filter dropdown ─────────────────────────────────
  const availableCategorias = useMemo(() => getUniqueCategorias(items), [items])
  const availableMarcas = useMemo(() => getUniqueMarcas(items), [items])

  const hasActiveFilters = filterCategorias.length > 0 || filterMarcas.length > 0 || filterEstados.length > 0

  // ── Filtered count for badge ───────────────────────────────────────────────
  const filteredCount = useMemo(() => {
    const searched = searchItems(items, searchQuery)
    return filterItems(searched, filterConfig).length
  }, [items, searchQuery, filterConfig])

  // ── Status helpers ────────────────────────────────────────────────────�����────
  const showStatusMessage = (text: string, type: "success" | "info" = "success") => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  // ── Precio / Stock handlers ────────────────────────────────────────────────
  const showToast = useCallback((label: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastLabel(label)
    toastTimerRef.current = setTimeout(() => setToastLabel(null), 3000)
  }, [])

  const handleUpdatePrecio = useCallback((itemId: string, precio: { costo: number; margen: number; iva: number; precioFinal: number }) => {
    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.id === itemId || v.sku === itemId)
        if (variant) {
          editVariantField(item.sku, variant.sku, "precio", precio)
          forceSaveItems()
          showToast("Precio actualizado")
          return
        }
      }
    }
    editField(itemId, "precio", precio)
    forceSaveItems()
    showToast("Precio actualizado")
  }, [items, editField, editVariantField, forceSaveItems, showToast])

  const handleUpdateStockWithTracking = useCallback((itemId: string, field: "total" | "reservado", value: number) => {
    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.id === itemId || v.sku === itemId)
        if (variant) {
          const parentIdentifier = item.id || item.sku
          const currentStock = variant.stock || { enStock: "0", reservado: "0", disponible: "0" }
          const currentTotal = parseInt(currentStock.enStock) || 0
          const currentReservado = parseInt(currentStock.reservado) || 0
          const newDisponible = field === "total" ? value - currentReservado : currentTotal - value
          const newStock = {
            enStock: field === "total" ? value.toString() : currentStock.enStock,
            reservado: field === "reservado" ? value.toString() : currentStock.reservado,
            disponible: newDisponible.toString(),
          }
          editVariantField(parentIdentifier!, itemId, "stock", newStock)
          forceSaveItems()
          showToast("Stock actualizado")
          const wasInactive = (variant as any).isActive === false
          const hadNoStock = (parseInt(currentStock.disponible) || 0) <= 0
          if (wasInactive && hadNoStock && newDisponible > 0 && variant.id) updateItemsActiveStatus([variant.id], true)
          const isActive = (variant as any).isActive !== false
          if (isActive && newDisponible <= 0 && variant.id) updateItemsActiveStatus([variant.id], false)
          return
        }
      }
    }
    const item = items.find(i => i.id === itemId || i.sku === itemId)
    if (item) {
      const currentStock = item.stock || { enStock: "0", reservado: "0", disponible: "0" }
      const currentTotal = parseInt(currentStock.enStock) || 0
      const currentReservado = parseInt(currentStock.reservado) || 0
      const newDisponible = field === "total" ? value - currentReservado : currentTotal - value
      const newStock = {
        enStock: field === "total" ? value.toString() : currentStock.enStock,
        reservado: field === "reservado" ? value.toString() : currentStock.reservado,
        disponible: newDisponible.toString(),
      }
      editField(itemId, "stock", newStock)
      forceSaveItems()
      showToast("Stock actualizado")
      const wasInactive = item.isActive === false
      const hadNoStock = (parseInt(currentStock.disponible) || 0) <= 0
      if (wasInactive && hadNoStock && newDisponible > 0 && item.id) updateItemsActiveStatus([item.id], true)
      const isActive = item.isActive !== false
      if (isActive && newDisponible <= 0 && item.id) updateItemsActiveStatus([item.id], false)
    }
  }, [items, editField, editVariantField, forceSaveItems, updateItemsActiveStatus, showToast])

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDeleteWithTracking = (item: Item) => setItemToDelete(item)

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    deleteItem(itemToDelete)
    await sleep(300)
    await saveDeletedItems()
    setItemToDelete(null)
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handleCancelDelete = () => setItemToDelete(null)

  const handleBatchDeleteClick = () => setShowBatchDeleteModal(true)

  const handleConfirmBatchDelete = async () => {
    const skusToDelete = getSelectedSkus()
    const itemsToDelete: Item[] = []
    for (const sku of skusToDelete) {
      const standaloneItem = items.find(i => i.sku === sku)
      if (standaloneItem) { itemsToDelete.push(standaloneItem); continue }
      for (const item of items) {
        if (item.variants) {
          const variant = item.variants.find((v: any) => v.sku === sku)
          if (variant) itemsToDelete.push(variant)
        }
        if (item.items) {
          const groupItem = item.items.find((i: any) => i.sku === sku)
          if (groupItem) itemsToDelete.push(groupItem)
        }
      }
    }
    for (const item of itemsToDelete) deleteItem(item)
    await sleep(800)
    const remainingItems = items.filter(item => !skusToDelete.includes(item.sku))
    if (typeof window !== "undefined") {
      const storageKey = `stockio-items-${currentAccount}`
      localStorage.setItem(storageKey, JSON.stringify(remainingItems))
    }
    await saveDeletedItems()
    clearSelection()
    setShowBatchDeleteModal(false)
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handleCancelBatchDelete = () => setShowBatchDeleteModal(false)

  const handleItemClick = (item: Item) => router.push(`/catalogo/items/${item.id}`)

  const toggleVariantExpansion = (index: number) =>
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }))

  const handleCreateItemWithSuccess = async (itemTitulo: string, itemTemplate: string, handleClose: () => void) => {
    const newItem = await handleCreateNuevoItem(itemTitulo, itemTemplate, handleClose)
    if (newItem) router.push(`/catalogo/items/${newItem.id}`)
  }

  const handleCreateItemConVariantesWithSuccess = async (itemTitulo: string, itemTemplate: string, handleClose: () => void) => {
    const newItem = await handleCreateNuevoItemConVariantes(itemTitulo, itemTemplate, handleClose)
    if (newItem) router.push(`/catalogo/items/${newItem.id}`)
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
          {(showNuevoItemModal || showNuevoItemConVariantesModal) && (
            <div className="absolute top-0 left-0 h-full w-full bg-black/50 z-[60] pointer-events-none rounded-lg" />
          )}
        </div>

        {/* Main panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">

          {/* Top utility bar */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2 min-w-[200px] justify-end">
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Guardado</span>
                  </div>
                )}
                {statusMessage && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{statusMessage.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 flex flex-col overflow-auto">

              {/* Title row — scrolls away */}
              <div className="px-8 pt-12 pb-8">
                <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
                  <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                    Catálogo
                  </h1>
                  <div className="flex items-center gap-2 mt-1 shrink-0 relative">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setNuevoItemDropdownOpen(v => !v)}
                        className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                        Nuevo Item
                      </button>
                      {nuevoItemDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setNuevoItemDropdownOpen(false)} />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => { setNuevoItemDropdownOpen(false); router.push("/catalogo/items/nuevo") }}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Creación Individual
                            </button>
                            <button
                              type="button"
                              onClick={() => { setNuevoItemDropdownOpen(false); router.push("/catalogo/creador-masivo") }}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Creador Masivo
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky search + bulk bar */}
              <div className="sticky top-0 z-20">

                {/* Row 1: Search + Filtrar/Ordenar + count */}
                <div className="relative z-10 bg-slate-50/95 backdrop-blur-sm px-8 py-2">
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2">

                      {/* Search */}
                      <div className="flex items-center h-9 border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md overflow-hidden bg-white">
                        <div className="flex items-center gap-2 px-3 h-full w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar items"
                            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                          />
                          {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0">
                              <X className="w-3 h-3 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Active filter tags */}
                      {hasActiveFilters && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {filterCategorias.map(c => (
                            <span key={c} className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                              {c}
                              <button type="button" onClick={() => setFilterCategorias(filterCategorias.filter(x => x !== c))} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                                <X className="w-2.5 h-2.5 text-slate-400" />
                              </button>
                            </span>
                          ))}
                          {filterMarcas.map(m => (
                            <span key={m} className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                              {m}
                              <button type="button" onClick={() => setFilterMarcas(filterMarcas.filter(x => x !== m))} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                                <X className="w-2.5 h-2.5 text-slate-400" />
                              </button>
                            </span>
                          ))}
                          {filterEstados.map(e => (
                            <span key={e} className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                              {e === "sin_stock" ? "Sin stock" : e === "pausado" ? "Pausado" : e}
                              <button type="button" onClick={() => setFilterEstados(filterEstados.filter(x => x !== e))} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                                <X className="w-2.5 h-2.5 text-slate-400" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Filtrar / Ordenar + results count — pushed right */}
                      <div className="ml-auto flex items-center gap-2">

                        {/* Filtrar */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
                            className={`h-9 text-xs transition-colors border shadow-sm gap-1.5 shrink-0 px-3 rounded-md flex items-center cursor-pointer ${hasActiveFilters ? "border-blue-400 text-blue-600 bg-blue-50" : "border-[rgba(228,230,235,0.6)] bg-white hover:bg-slate-50"}`}
                          >
                            <ListFilter className="w-3.5 h-3.5" />
                            <span>Filtrar</span>
                          </button>
                          {filterOpen && (
                            <>
                              <div className="fixed inset-0 z-[90]" onClick={() => setFilterOpen(false)} />
                              <div className="absolute top-full right-0 mt-1 z-[100] bg-white border border-slate-200 rounded-lg shadow-lg w-60 p-3 space-y-3">
                                {/* Categoría */}
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setCategoriasExpanded(v => !v)}
                                    className="flex items-center justify-between w-full cursor-pointer group"
                                  >
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                      Categoría
                                      {filterCategorias.length > 0 && (
                                        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-semibold">{filterCategorias.length}</span>
                                      )}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${categoriasExpanded ? "rotate-180" : ""}`} />
                                  </button>
                                  {categoriasExpanded && (
                                    <div className="mt-2 space-y-2">
                                      {availableCategorias.map(c => (
                                        <label key={c} className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={filterCategorias.includes(c)}
                                            onChange={(ev) => setFilterCategorias(ev.target.checked ? [...filterCategorias, c] : filterCategorias.filter(x => x !== c))}
                                            className="w-3.5 h-3.5 rounded accent-slate-800"
                                          />
                                          <span className="text-xs text-slate-700">{c}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Marca */}
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setMarcasExpanded(v => !v)}
                                    className="flex items-center justify-between w-full cursor-pointer group"
                                  >
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                      Marca
                                      {filterMarcas.length > 0 && (
                                        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-semibold">{filterMarcas.length}</span>
                                      )}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${marcasExpanded ? "rotate-180" : ""}`} />
                                  </button>
                                  {marcasExpanded && (
                                    <div className="mt-2 space-y-2">
                                      {availableMarcas.map(m => (
                                        <label key={m} className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={filterMarcas.includes(m)}
                                            onChange={(ev) => setFilterMarcas(ev.target.checked ? [...filterMarcas, m] : filterMarcas.filter(x => x !== m))}
                                            className="w-3.5 h-3.5 rounded accent-slate-800"
                                          />
                                          <span className="text-xs text-slate-700">{m}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Estado */}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Estado</label>
                                  {(["sin_stock", "pausado"] as const).map(e => (
                                    <label key={e} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={filterEstados.includes(e)}
                                        onChange={(ev) => setFilterEstados(ev.target.checked ? [...filterEstados, e] : filterEstados.filter(x => x !== e))}
                                        className="w-3.5 h-3.5 rounded accent-slate-800"
                                      />
                                      <span className="text-xs text-slate-700">{e === "sin_stock" ? "Sin stock" : "Pausado"}</span>
                                    </label>
                                  ))}
                                </div>
                                {hasActiveFilters && (
                                  <button type="button" onClick={() => { setFilterCategorias([]); setFilterMarcas([]); setFilterEstados([]) }} className="w-full text-xs text-slate-500 hover:text-slate-700 py-1 text-center cursor-pointer">
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
                            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                            title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                            className="px-2.5 h-full hover:bg-slate-50 transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer flex items-center"
                          >
                            <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
                          </button>
                          <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as QuickSortField)}
                            className="appearance-none pl-2.5 pr-2.5 text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700 h-full w-auto"
                          >
                            <option value="nombre">Nombre</option>
                            <option value="categoria">Categoría</option>
                            <option value="marca">Marca</option>
                            <option value="precioVenta">Precio Venta</option>
                            <option value="stock">Stock</option>
                          </select>
                        </div>

                        <div className="w-px h-5 bg-slate-200 shrink-0" />
                        <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {filteredCount} {filteredCount === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Bulk actions + tab header */}
                <div className="px-8 bg-slate-50/95 backdrop-blur-sm pb-2">
                  <div className="max-w-6xl mx-auto">
                  <div className="bg-white border border-slate-200/80 rounded-lg">
                    <div className="flex items-center gap-2 h-9">
                      {/* All-selector */}
                      <div className="flex items-center justify-center w-[4%] min-w-[40px] shrink-0">
                        <input
                          ref={allCheckboxRef}
                          type="checkbox"
                          checked={selectAllActive}
                          onChange={handleSelectAll}
                          aria-label={selectAllActive ? "Deseleccionar todo" : "Seleccionar todo"}
                          className="w-3.5 h-3.5 rounded accent-slate-800 cursor-pointer"
                        />
                      </div>

                      <div className="w-px h-5 bg-slate-200 shrink-0" />

                      {!hasSelectedItems ? (
                        <span className="text-xs text-slate-400 select-none">
                          Seleccioná items para accionar masivamente
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-slate-600 whitespace-nowrap tabular-nums">
                            {getSelectedSkus().length} seleccionado{getSelectedSkus().length !== 1 ? "s" : ""}
                          </span>
                          <div className="w-px h-5 bg-slate-200 shrink-0" />
                          <button
                            type="button"
                            onClick={() => { updateItemsActiveStatus(getSelectedSkus(), false); clearSelection(); showStatusMessage(`${getSelectedSkus().length} item${getSelectedSkus().length !== 1 ? "s" : ""} pausado${getSelectedSkus().length !== 1 ? "s" : ""}`) }}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5 text-slate-400" />
                            Pausar
                          </button>
                          <div className="w-px h-5 bg-slate-200 shrink-0" />
                          <button
                            type="button"
                            onClick={() => { updateItemsActiveStatus(getSelectedSkus(), true); clearSelection(); showStatusMessage(`${getSelectedSkus().length} item${getSelectedSkus().length !== 1 ? "s" : ""} reactivado${getSelectedSkus().length !== 1 ? "s" : ""}`) }}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-slate-400" />
                            Reactivar
                          </button>
                          <div className="w-px h-5 bg-slate-200 shrink-0" />
                          <button
                            type="button"
                            onClick={handleBatchDeleteClick}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tab header — grid-cols-12: item(5) estado(1) precio(2) stock(4) */}
                  <div className="grid grid-cols-12 h-9 border border-slate-200/80 mt-2 rounded-lg overflow-hidden">
                    <div className="col-span-5 flex items-center justify-center px-4 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Item</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-center px-1 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center px-4 border-r border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precio Venta</span>
                    </div>
                    <div className="col-span-4 flex items-center justify-center gap-1.5 px-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock</span>
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
                    </div>
                  </div>
                  </div>
                </div>

              </div>{/* /sticky */}

              {/* Grid */}
              <CatalogoGrid
                items={items}
                gridSize={gridSize}
                expandedItems={expandedItems}
                onDeleteItem={handleDeleteWithTracking}
                handleItemClick={handleItemClick}
                toggleVariantExpansion={toggleVariantExpansion}
                selectAllActive={selectAllActive}
                selectAllIndeterminate={selectAllIndeterminate}
                handleSelectAll={handleSelectAll}
                handleItemSelection={handleItemSelection}
                getSelectionState={getSelectionState}
                gridSizeDropdownOpen={gridSizeDropdownOpen}
                setGridSizeDropdownOpen={setGridSizeDropdownOpen}
                setGridSize={setGridSize}
                isExpanded={false}
                handleOpenNuevoItem={handleOpenNuevoItem}
                handleOpenNuevoItemConVariantes={handleOpenNuevoItemConVariantes}
                hasSelectedItems={hasSelectedItems}
                onBatchDelete={handleBatchDeleteClick}
                onUpdateStock={handleUpdateStockWithTracking}
                onUpdatePrecio={handleUpdatePrecio}
                onUpdateItem={(updatedItem) => {
                  const itemId = updatedItem.id || updatedItem.sku
                  if (itemId) updateItemsActiveStatus([itemId], updatedItem.isActive !== false)
                }}
                getSelectedSkus={getSelectedSkus}
                onPauseItems={(ids) => { updateItemsActiveStatus(ids, false); clearSelection(); showStatusMessage(`${ids.length} ${ids.length === 1 ? "item pausado" : "items pausados"}`) }}
                onReactivateItems={(ids) => { updateItemsActiveStatus(ids, true); clearSelection(); showStatusMessage(`${ids.length} ${ids.length === 1 ? "item reactivado" : "items reactivados"}`) }}
                searchQuery={searchQuery}
                filterConfig={filterConfig}
                sortConfig={sortConfig}
                allCheckboxRef={allCheckboxRef}
              />

            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
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

      {/* Delete modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={handleCancelDelete}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={getItemPhoto(itemToDelete as any)} alt={itemToDelete?.nombre || ""} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{itemToDelete?.nombre}</p>
                {(itemToDelete?.marca || itemToDelete?.categoria) && (
                  <p className="text-xs text-slate-400 truncate">{[itemToDelete?.marca, itemToDelete?.categoria].filter(Boolean).join(" · ")}</p>
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">¿Seguro deseas eliminar este item?</h3>
            <p className="text-sm text-muted-foreground">Dejará de existir en la grilla, pero seguirá formando parte del histórico de ventas y actividad.</p>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button onClick={handleCancelDelete} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">Cancelar</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer">Eliminar item</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch delete modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={handleCancelBatchDelete}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">¿Seguro deseas eliminar los items seleccionados?</h3>
            <p className="text-sm text-muted-foreground">Dejarán de existir en la grilla, pero seguirán formando parte del histórico de ventas y actividad.</p>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button onClick={handleCancelBatchDelete} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">Cancelar</button>
              <button onClick={handleConfirmBatchDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer">Eliminar items</button>
            </div>
          </div>
        </div>
      )}

      {/* Cambios guardados floating toast */}
      {toastLabel && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className="relative flex items-stretch rounded-2xl overflow-hidden"
            style={{ background: "#0d0f12", boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)", minWidth: "280px" }}
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
                <p className="text-[13px] font-semibold leading-tight" style={{ color: "#f1f5f9", letterSpacing: "-0.01em" }}>Cambios guardados</p>
                <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(148,163,184,0.7)" }}>{toastLabel}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
