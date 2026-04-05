"use client"

import { useState, useMemo, Suspense, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Search,
  Package,
  Plus,
  ArrowUpDown,
  ListFilterIcon,
  X,
  CheckCircle2,
  FileText,
  FileDown,
  ShoppingCart,
  MoreVertical,
  ChevronDown,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"

import type { EstadoOrdenDeCompra } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { useOrdenesDeCompra } from "@/hooks/use-ordenes-de-compra"

const estadoLabels: Record<EstadoOrdenDeCompra, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
}

const estadoColors: Record<EstadoOrdenDeCompra, { bg: string; text: string; icon: string }> = {
  borrador: { bg: "bg-gray-100", text: "text-gray-600", icon: "text-gray-400" },
  enviada: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  aceptada: { bg: "bg-green-50", text: "text-green-600", icon: "text-green-500" },
  rechazada: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
  cancelada: { bg: "bg-gray-100", text: "text-gray-500", icon: "text-gray-400" },
}

type SortDirection = "asc" | "desc"
type SortFactor = "fecha" | "total" | "proveedor" | "numero" | "items"

interface SortConfig {
  factor: SortFactor
  direction: SortDirection
}

interface FilterConfig {
  estado: EstadoOrdenDeCompra[]
}

const FILTRO_OPTIONS = {
  estado: [
    { value: "borrador", label: "Borrador" },
    { value: "enviada", label: "Enviada" },
    { value: "aceptada", label: "Aceptada" },
    { value: "rechazada", label: "Rechazada" },
    { value: "cancelada", label: "Cancelada" },
  ],
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const month = months[date.getMonth()]
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

function OrdenesDeCompraContent() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrdenes, setSelectedOrdenes] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  
  // Use ordenes de compra hook for localStorage persistence
  const { ordenes, addOrden, updateEstado, getNextOrderNumber } = useOrdenesDeCompra()
  
  // Nueva Orden Modal state
  const [showNuevaOrdenModal, setShowNuevaOrdenModal] = useState(false)
  const [nuevaOrdenProveedor, setNuevaOrdenProveedor] = useState("")
  const [proveedorDropdownOpen, setProveedorDropdownOpen] = useState(false)
  const proveedorInputRef = useRef<HTMLDivElement>(null)
  
  // Get unique proveedores from items
  const uniqueProveedores = useMemo(() => {
    const proveedores = new Set<string>()
    INITIAL_ITEMS.forEach(item => {
      if (item.proveedor) proveedores.add(item.proveedor)
    })
    return Array.from(proveedores).sort()
  }, [])
  
  // Filter proveedores based on input
  const filteredProveedores = useMemo(() => {
    if (!nuevaOrdenProveedor) return uniqueProveedores
    return uniqueProveedores.filter(p => 
      p.toLowerCase().includes(nuevaOrdenProveedor.toLowerCase())
    )
  }, [nuevaOrdenProveedor, uniqueProveedores])
  
  // Generate next order ID
  const nextOrderNumber = getNextOrderNumber()
  const nextOrderId = `ODC-${nextOrderNumber}`
  
  // Handle creating new order
  const handleCreateOrden = () => {
    if (!nuevaOrdenProveedor.trim()) return
    
    // Create new order using the hook (persists to localStorage)
    const newOrden = addOrden({
      fechaCreacion: new Date().toISOString().split("T")[0],
      proveedorId: "",
      proveedorNombre: nuevaOrdenProveedor.trim(),
      estado: "borrador" as EstadoOrdenDeCompra,
      items: [],
      importeEstimado: 0,
    })
    
    // Navigate to the new order page
    router.push(`/compras/ordenes-de-compra/${newOrden.id}`)
    setShowNuevaOrdenModal(false)
    setNuevaOrdenProveedor("")
  }

  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    estado: [],
  })

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    factor: "numero",
    direction: "desc",
  })

  const breadcrumbs = [{ label: "Compras" }, { label: "Ordenes de Compra", href: "/compras/ordenes-de-compra" }]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderRef.current && !orderRef.current.contains(event.target as Node)) {
        setShowOrderModal(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterModal(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  
  // Close proveedor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (proveedorInputRef.current && !proveedorInputRef.current.contains(event.target as Node)) {
        setProveedorDropdownOpen(false)
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOrdenes = useMemo(() => {
    let result = ordenes.filter((orden) => {
      const matchesSearch =
        searchQuery === "" ||
        orden.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.proveedorNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })

    if (activeFilters.estado.length > 0) {
      result = result.filter((o) => activeFilters.estado.includes(o.estado))
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortConfig.factor) {
        case "fecha":
          comparison = a.fechaCreacion.localeCompare(b.fechaCreacion)
          break
        case "total":
          comparison = a.importeEstimado - b.importeEstimado
          break
        case "proveedor":
          comparison = a.proveedorNombre.localeCompare(b.proveedorNombre)
          break
        case "numero":
          comparison = a.numero - b.numero
          break
        case "items":
          comparison = a.items.length - b.items.length
          break
      }
      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return result
  }, [ordenes, searchQuery, activeFilters, sortConfig])

  const hasActiveFilters = activeFilters.estado.length > 0

  const toggleFilter = (category: keyof FilterConfig, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[category] as string[]
      const newValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [category]: newValues }
    })
  }

  const toggleSelectOrden = (id: string) => {
    setSelectedOrdenes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrdenes.size === filteredOrdenes.length) {
      setSelectedOrdenes(new Set())
    } else {
      setSelectedOrdenes(new Set(filteredOrdenes.map(o => o.id)))
    }
  }

  const hasSelection = selectedOrdenes.size > 0

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
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground hover:bg-muted text-sm font-medium"
                  title="Deshacer cambios"
                >
                  Deshacer
                </button>

                <button
                  disabled
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary hover:bg-muted text-sm font-medium"
                  title="Guardar cambios"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 pt-6 pb-4">
              <div className="bg-white border border-border/40 rounded-lg shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  {/* Left: Nueva Orden Button + Selection Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      onClick={() => setShowNuevaOrdenModal(true)}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      Nueva Orden
                    </Button>
                    
                    {/* Selection Actions */}
                    {hasSelection && (
                      <>
                        <div className="h-5 w-px bg-slate-200" />
                        <span className="text-xs text-slate-500">{selectedOrdenes.size} seleccionadas</span>
                        
                        {/* Exportar Dropdown */}
                        <div className="relative" ref={exportRef}>
                          <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            onClick={() => setShowExportDropdown(!showExportDropdown)}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Exportar
                            <ChevronDown className={`w-3 h-3 transition-transform ${showExportDropdown ? "rotate-180" : ""}`} />
                          </button>
                          {showExportDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                onClick={() => {
                                  // TODO: Export PDF
                                  setShowExportDropdown(false)
                                }}
                              >
                                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                                Exportar PDF
                              </button>
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                onClick={() => {
                                  // TODO: Export Text
                                  setShowExportDropdown(false)
                                }}
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                Exportar Texto
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                          onClick={() => {/* TODO: Convert to Compras */}}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Llevar a Compras
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right: Search Bar + Order and Filter Buttons */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Search Bar */}
                    <div className="relative w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black opacity-100 z-10" />
                      <input
                        type="text"
                        placeholder="Buscar ordenes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
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
                        onClick={() => setShowOrderModal(!showOrderModal)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm mr-[-4px]"
                        title="Ordenar"
                      >
                        <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                      </button>

                      {/* Order Modal */}
                      {showOrderModal && (
                        <div className="absolute right-0 top-10 bg-white border border-border/40 rounded-lg shadow-lg z-50 w-48 py-2">
                          <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Ordenar por</p>
                          {[
                            { value: "numero", label: "Numero" },
                            { value: "fecha", label: "Fecha" },
                            { value: "total", label: "Importe" },
                            { value: "proveedor", label: "Proveedor" },
                            { value: "items", label: "Cantidad Items" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  factor: option.value as SortFactor,
                                  direction:
                                    prev.factor === option.value ? (prev.direction === "asc" ? "desc" : "asc") : "desc",
                                }))
                              }}
                              className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted/50 flex items-center justify-between cursor-pointer ${
                                sortConfig.factor === option.value ? "text-amber-600 font-medium" : ""
                              }`}
                            >
                              {option.label}
                              {sortConfig.factor === option.value && (
                                <span className="text-xs">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative" ref={filterRef}>
                      <button
                        onClick={() => setShowFilterModal(!showFilterModal)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border shadow-sm mr-2 ${
                          hasActiveFilters ? "border-amber-500 bg-amber-50" : "border-gray-200/40"
                        }`}
                        title="Filtros"
                      >
                        <ListFilterIcon
                          className={`w-4 h-4 ${hasActiveFilters ? "text-amber-600" : "text-gray-600 group-hover:text-gray-900"}`}
                        />
                      </button>

                      {/* Filter Modal */}
                      {showFilterModal && (
                        <div className="absolute right-0 top-10 bg-white border border-border/40 rounded-lg shadow-lg z-50 w-56 py-2">
                          <div className="px-3 py-2">
                            <p className="text-xs font-medium text-muted-foreground">Estado</p>
                            <div className="mt-2 space-y-1">
                              {FILTRO_OPTIONS.estado.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={activeFilters.estado.includes(option.value as EstadoOrdenDeCompra)}
                                    onChange={() => toggleFilter("estado", option.value)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  {option.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          {hasActiveFilters && (
                            <div className="px-3 pt-2 border-t border-border/30">
                              <button
                                onClick={() => setActiveFilters({ estado: [] })}
                                className="text-xs text-amber-600 hover:underline cursor-pointer"
                              >
                                Limpiar filtros
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Header */}
            <div className="px-6">
              <div className="bg-slate-200 border border-[rgba(202,213,227,0.61)] rounded-t-sm">
                <div className="grid grid-cols-100 h-9">
                  {/* Checkbox */}
                  <div className="col-span-4 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <input
                      type="checkbox"
                      checked={selectedOrdenes.size === filteredOrdenes.length && filteredOrdenes.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                  {/* ID */}
                  <div className="col-span-10 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">ID</span>
                  </div>
                  {/* Estado Orden */}
                  <div className="col-span-13 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</span>
                  </div>
                  {/* Proveedor */}
                  <div className="col-span-30 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Proveedor</span>
                  </div>
                  {/* Cantidad Items */}
                  <div className="col-span-13 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Items</span>
                  </div>
                  {/* Importe Estimado */}
                  <div className="col-span-22 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Importe</span>
                  </div>
                  {/* More */}
                  <div className="col-span-8 flex items-center justify-center">
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredOrdenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="w-12 h-12 mb-3 opacity-30" />
                  <p>No se encontraron ordenes de compra</p>
                </div>
              ) : (
                <div className="space-y-[1px]">
                  {filteredOrdenes.map((orden) => {
                    const estadoStyle = estadoColors[orden.estado]
                    const totalItems = orden.items.reduce((sum, item) => sum + item.quantity, 0)
                    const isSelected = selectedOrdenes.has(orden.id)

                    return (
                      <div
                        key={orden.id}
                        className={`bg-white border-x border-b border-[rgba(202,213,227,0.61)] first:border-t-0 cursor-pointer transition-colors ${
                          isSelected ? "bg-amber-50/40" : "hover:bg-gray-50/50"
                        }`}
                        onClick={() => router.push(`/compras/ordenes-de-compra/${orden.id}`)}
                      >
                        {/* Main Row */}
                        <div className="grid grid-cols-100 min-h-[56px]">
                          {/* Checkbox */}
                          <div
                            className="col-span-4 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectOrden(orden.id)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </div>

                          {/* ID */}
                          <div className="col-span-10 flex flex-col items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className="text-sm font-medium text-gray-900">ODC-{orden.numero}</span>
                            <span className="text-xs text-muted-foreground">{formatDateShort(orden.fechaCreacion)}</span>
                          </div>

                          {/* Estado Orden */}
                          <div className="col-span-13 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoStyle.bg}`}>
                              <CheckCircle2 className={`w-3.5 h-3.5 ${estadoStyle.icon}`} />
                              <span className={`text-xs font-medium ${estadoStyle.text}`}>
                                {estadoLabels[orden.estado]}
                              </span>
                            </div>
                          </div>

                          {/* Proveedor */}
                          <div className="col-span-30 flex items-center px-4 py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className="text-sm font-semibold text-gray-800 truncate">{orden.proveedorNombre}</span>
                          </div>

                          {/* Cantidad Items */}
                          <div className="col-span-13 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {orden.items.length}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({totalItems} u.)
                            </span>
                          </div>

                          {/* Importe Estimado */}
                          <div className="col-span-22 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className="text-sm font-semibold text-gray-900">
                              ${orden.importeEstimado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                            </span>
                          </div>

                          {/* More Options */}
                          <div
                            className="col-span-8 flex items-center justify-center py-2 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                              onClick={() => setOpenMoreMenu(openMoreMenu === orden.id ? null : orden.id)}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openMoreMenu === orden.id && (
                              <div
                                className="absolute top-full right-2 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]"
                                onMouseLeave={() => setOpenMoreMenu(null)}
                              >
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                  onClick={() => {
                                    // TODO: Export PDF
                                    setOpenMoreMenu(null)
                                  }}
                                >
                                  <FileDown className="w-4 h-4 text-slate-400" />
                                  Exportar PDF
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                  onClick={() => {
                                    // TODO: Export Text
                                    setOpenMoreMenu(null)
                                  }}
                                >
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  Exportar Texto
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors text-left"
                                  onClick={() => {
                                    // TODO: Convert to Compra
                                    setOpenMoreMenu(null)
                                  }}
                                >
                                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                                  Llevar a Compras
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* Nueva Orden Modal */}
      {showNuevaOrdenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Nueva Orden de Compra</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Orden: <span className="font-medium text-amber-600">{nextOrderId}</span></p>
                </div>
                <button
                  onClick={() => {
                    setShowNuevaOrdenModal(false)
                    setNuevaOrdenProveedor("")
                    setProveedorDropdownOpen(false)
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-5 min-h-[280px]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Proveedor</label>
                  <div className="relative" ref={proveedorInputRef}>
                    <input
                      type="text"
                      value={nuevaOrdenProveedor}
                      onChange={(e) => {
                        setNuevaOrdenProveedor(e.target.value)
                        setProveedorDropdownOpen(true)
                      }}
                      onFocus={() => setProveedorDropdownOpen(true)}
                      placeholder="Buscar o escribir proveedor..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
                    />
                    <button
                      onClick={() => setProveedorDropdownOpen(!proveedorDropdownOpen)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                    >
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${proveedorDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {/* Dropdown */}
                    {proveedorDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredProveedores.length > 0 ? (
                          filteredProveedores.map((proveedor) => (
                            <button
                              key={proveedor}
                              onClick={() => {
                                setNuevaOrdenProveedor(proveedor)
                                setProveedorDropdownOpen(false)
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-amber-50 transition-colors ${
                                nuevaOrdenProveedor === proveedor ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-700"
                              }`}
                            >
                              {proveedor}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            {nuevaOrdenProveedor ? (
                              <span>Crear orden con: <span className="font-medium text-slate-700">&quot;{nuevaOrdenProveedor}&quot;</span></span>
                            ) : (
                              <span>No hay proveedores</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {nuevaOrdenProveedor && !uniqueProveedores.includes(nuevaOrdenProveedor) && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Se creará una orden con un nuevo proveedor
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowNuevaOrdenModal(false)
                  setNuevaOrdenProveedor("")
                  setProveedorDropdownOpen(false)
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrden}
                disabled={!nuevaOrdenProveedor.trim()}
                className="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdenesDeCompraPage() {
  return (
    <Suspense fallback={null}>
      <OrdenesDeCompraContent />
    </Suspense>
  )
}
