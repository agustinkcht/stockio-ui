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
  FileText,
  FileDown,
  MoreVertical,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"

import type { EstadoPresupuesto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { usePresupuestos } from "@/hooks/use-presupuestos"
import { useClientes } from "@/hooks/use-clientes"

const estadoLabels: Record<EstadoPresupuesto, string> = {
  borrador: "Borrador",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
}

const estadoColors: Record<EstadoPresupuesto, { bg: string; text: string; icon: typeof Clock }> = {
  borrador: { bg: "bg-slate-100", text: "text-slate-600", icon: Clock },
  aceptado: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
  rechazado: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
}

type SortDirection = "asc" | "desc"
type SortFactor = "fecha" | "total" | "cliente" | "numero" | "items"

interface SortConfig {
  factor: SortFactor
  direction: SortDirection
}

interface FilterConfig {
  estado: EstadoPresupuesto[]
}

const FILTRO_OPTIONS = {
  estado: [
    { value: "borrador", label: "Borrador" },
    { value: "aceptado", label: "Aceptado" },
    { value: "rechazado", label: "Rechazado" },
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

function PresupuestosContent() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPresupuestos, setSelectedPresupuestos] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  
  const { presupuestos, addPresupuesto, getNextPresupuestoNumber } = usePresupuestos()
  const { clientes } = useClientes()
  
  // Nueva Presupuesto Modal state
  const [showNuevoPresupuestoModal, setShowNuevoPresupuestoModal] = useState(false)
  const [nuevoPresupuestoCliente, setNuevoPresupuestoCliente] = useState("")
  const [clienteDropdownOpen, setClienteDropdownOpen] = useState(false)
  const clienteInputRef = useRef<HTMLDivElement>(null)
  
  // Get unique clientes
  const uniqueClientes = useMemo(() => {
    return clientes.map(c => c.nombre).sort()
  }, [clientes])
  
  // Filter clientes based on input
  const filteredClientes = useMemo(() => {
    if (!nuevoPresupuestoCliente) return uniqueClientes
    return uniqueClientes.filter(c => 
      c.toLowerCase().includes(nuevoPresupuestoCliente.toLowerCase())
    )
  }, [nuevoPresupuestoCliente, uniqueClientes])
  
  // Generate next presupuesto ID
  const nextPresupuestoNumber = getNextPresupuestoNumber()
  const nextPresupuestoId = `PRE-${nextPresupuestoNumber}`
  
  // Handle creating new presupuesto
  const handleCreatePresupuesto = () => {
    if (!nuevoPresupuestoCliente.trim()) return
    
    const newPresupuesto = addPresupuesto({
      fechaCreacion: new Date().toISOString().split("T")[0],
      clienteId: "",
      clienteNombre: nuevoPresupuestoCliente.trim(),
      estado: "borrador" as EstadoPresupuesto,
      items: [],
      importeTotal: 0,
    })
    
    router.push(`/ventas/presupuestos/${newPresupuesto.id}`)
    setShowNuevoPresupuestoModal(false)
    setNuevoPresupuestoCliente("")
  }

  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    estado: [],
  })

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    factor: "numero",
    direction: "desc",
  })

  const breadcrumbs = [{ label: "Ventas" }, { label: "Presupuestos", href: "/ventas/presupuestos" }]

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
  
  // Close cliente dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteInputRef.current && !clienteInputRef.current.contains(event.target as Node)) {
        setClienteDropdownOpen(false)
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredPresupuestos = useMemo(() => {
    let result = presupuestos.filter((presupuesto) => {
      const matchesSearch =
        searchQuery === "" ||
        presupuesto.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        presupuesto.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        presupuesto.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })

    if (activeFilters.estado.length > 0) {
      result = result.filter((p) => activeFilters.estado.includes(p.estado))
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortConfig.factor) {
        case "fecha":
          comparison = a.fechaCreacion.localeCompare(b.fechaCreacion)
          break
        case "total":
          comparison = a.importeTotal - b.importeTotal
          break
        case "cliente":
          comparison = a.clienteNombre.localeCompare(b.clienteNombre)
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
  }, [presupuestos, searchQuery, activeFilters, sortConfig])

  const hasActiveFilters = activeFilters.estado.length > 0

  const toggleFilter = (category: keyof FilterConfig, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[category] as string[]
      const newValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [category]: newValues }
    })
  }

  const toggleSelectPresupuesto = (id: string) => {
    setSelectedPresupuestos(prev => {
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
    if (selectedPresupuestos.size === filteredPresupuestos.length) {
      setSelectedPresupuestos(new Set())
    } else {
      setSelectedPresupuestos(new Set(filteredPresupuestos.map(p => p.id)))
    }
  }

  const hasSelection = selectedPresupuestos.size > 0

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
                >
                  Deshacer
                </button>

                <button
                  disabled
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary hover:bg-muted text-sm font-medium"
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
                  {/* Left: Nuevo Presupuesto Button + Selection Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      onClick={() => setShowNuevoPresupuestoModal(true)}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      Nuevo Presupuesto
                    </Button>
                    
                    {/* Selection Actions */}
                    {hasSelection && (
                      <>
                        <div className="h-5 w-px bg-slate-200" />
                        <span className="text-xs text-slate-500">{selectedPresupuestos.size} seleccionados</span>
                        
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
                                onClick={() => setShowExportDropdown(false)}
                              >
                                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                                Exportar PDF
                              </button>
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                onClick={() => setShowExportDropdown(false)}
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                Exportar Texto
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          onClick={() => {/* TODO: Convert to Venta */}}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Convertir a Venta
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
                        placeholder="Buscar presupuestos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="relative mr-3" ref={orderRef}>
                      <button
                        onClick={() => setShowOrderModal(!showOrderModal)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm mr-[-4px]"
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
                            { value: "cliente", label: "Cliente" },
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
                                sortConfig.factor === option.value ? "text-blue-600 font-medium" : ""
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
                          hasActiveFilters ? "border-blue-500 bg-blue-50" : "border-gray-200/40"
                        }`}
                      >
                        <ListFilterIcon
                          className={`w-4 h-4 ${hasActiveFilters ? "text-blue-600" : "text-gray-600 group-hover:text-gray-900"}`}
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
                                    checked={activeFilters.estado.includes(option.value as EstadoPresupuesto)}
                                    onChange={() => toggleFilter("estado", option.value)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                                className="text-xs text-blue-600 hover:underline cursor-pointer"
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
              <div className="bg-slate-100 border border-slate-200/80 rounded-t-sm">
                <div className="grid grid-cols-100 h-9">
                  {/* Checkbox */}
                  <div className="col-span-4 flex items-center justify-center border-r border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={selectedPresupuestos.size === filteredPresupuestos.length && filteredPresupuestos.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  {/* ID */}
                  <div className="col-span-10 flex items-center justify-center border-r border-slate-200/60">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">ID</span>
                  </div>
                  {/* Estado */}
                  <div className="col-span-13 flex items-center justify-center border-r border-slate-200/60">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</span>
                  </div>
                  {/* Cliente */}
                  <div className="col-span-30 flex items-center justify-center border-r border-slate-200/60">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</span>
                  </div>
                  {/* Items */}
                  <div className="col-span-13 flex items-center justify-center border-r border-slate-200/60">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Items</span>
                  </div>
                  {/* Importe */}
                  <div className="col-span-22 flex items-center justify-center border-r border-slate-200/60">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Importe</span>
                  </div>
                  {/* More */}
                  <div className="col-span-8 flex items-center justify-center">
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredPresupuestos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No hay presupuestos</p>
                  <p className="text-xs text-slate-400 mt-1">Crea tu primer presupuesto para comenzar</p>
                </div>
              ) : (
                <div className="space-y-[1px]">
                  {filteredPresupuestos.map((presupuesto) => {
                    const estadoStyle = estadoColors[presupuesto.estado]
                    const EstadoIcon = estadoStyle.icon
                    const totalItems = presupuesto.items.reduce((sum, item) => sum + item.quantity, 0)
                    const isSelected = selectedPresupuestos.has(presupuesto.id)

                    return (
                      <div
                        key={presupuesto.id}
                        className={`bg-white border-x border-b border-slate-200/60 first:border-t-0 cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/50"
                        }`}
                        onClick={() => router.push(`/ventas/presupuestos/${presupuesto.id}`)}
                      >
                        {/* Main Row */}
                        <div className="grid grid-cols-100 min-h-[56px]">
                          {/* Checkbox */}
                          <div
                            className="col-span-4 flex items-center justify-center py-2 border-r border-slate-200/30"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectPresupuesto(presupuesto.id)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {/* ID */}
                          <div className="col-span-10 flex flex-col items-center justify-center py-2 border-r border-slate-200/30">
                            <span className="text-sm font-medium text-slate-900">PRE-{presupuesto.numero}</span>
                            <span className="text-xs text-slate-400">{formatDateShort(presupuesto.fechaCreacion)}</span>
                          </div>

                          {/* Estado */}
                          <div className="col-span-13 flex items-center justify-center py-2 border-r border-slate-200/30">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoStyle.bg}`}>
                              <EstadoIcon className={`w-3.5 h-3.5 ${estadoStyle.text}`} />
                              <span className={`text-xs font-medium ${estadoStyle.text}`}>
                                {estadoLabels[presupuesto.estado]}
                              </span>
                            </div>
                          </div>

                          {/* Cliente */}
                          <div className="col-span-30 flex items-center px-4 py-2 border-r border-slate-200/30">
                            <span className="text-sm font-semibold text-slate-800 truncate">{presupuesto.clienteNombre}</span>
                          </div>

                          {/* Items */}
                          <div className="col-span-13 flex items-center justify-center py-2 border-r border-slate-200/30">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-700">
                                {presupuesto.items.length}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 ml-1">
                              ({totalItems} u.)
                            </span>
                          </div>

                          {/* Importe */}
                          <div className="col-span-22 flex items-center justify-center py-2 border-r border-slate-200/30">
                            <span className="text-sm font-semibold text-slate-900">
                              ${presupuesto.importeTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                            </span>
                          </div>

                          {/* More Options */}
                          <div
                            className="col-span-8 flex items-center justify-center py-2 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                              onClick={() => setOpenMoreMenu(openMoreMenu === presupuesto.id ? null : presupuesto.id)}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openMoreMenu === presupuesto.id && (
                              <div
                                className="absolute top-full right-2 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]"
                                onMouseLeave={() => setOpenMoreMenu(null)}
                              >
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                  onClick={() => setOpenMoreMenu(null)}
                                >
                                  <FileDown className="w-4 h-4 text-slate-400" />
                                  Exportar PDF
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                  onClick={() => setOpenMoreMenu(null)}
                                >
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  Exportar Texto
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors text-left"
                                  onClick={() => setOpenMoreMenu(null)}
                                >
                                  <Receipt className="w-4 h-4 text-blue-600" />
                                  Convertir a Venta
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
      
      {/* Nuevo Presupuesto Modal */}
      {showNuevoPresupuestoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Nuevo Presupuesto</h2>
                  <p className="text-sm text-slate-500 mt-0.5">ID: <span className="font-medium text-blue-600">{nextPresupuestoId}</span></p>
                </div>
                <button
                  onClick={() => {
                    setShowNuevoPresupuestoModal(false)
                    setNuevoPresupuestoCliente("")
                    setClienteDropdownOpen(false)
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
                  <div className="relative" ref={clienteInputRef}>
                    <input
                      type="text"
                      value={nuevoPresupuestoCliente}
                      onChange={(e) => {
                        setNuevoPresupuestoCliente(e.target.value)
                        setClienteDropdownOpen(true)
                      }}
                      onFocus={() => setClienteDropdownOpen(true)}
                      placeholder="Buscar o escribir cliente..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={() => setClienteDropdownOpen(!clienteDropdownOpen)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                    >
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${clienteDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {/* Dropdown */}
                    {clienteDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredClientes.length > 0 ? (
                          filteredClientes.map((cliente) => (
                            <button
                              key={cliente}
                              onClick={() => {
                                setNuevoPresupuestoCliente(cliente)
                                setClienteDropdownOpen(false)
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                nuevoPresupuestoCliente === cliente ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                              }`}
                            >
                              {cliente}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            {nuevoPresupuestoCliente ? (
                              <span>Crear presupuesto para: <span className="font-medium text-slate-700">&quot;{nuevoPresupuestoCliente}&quot;</span></span>
                            ) : (
                              <span>No hay clientes</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {nuevoPresupuestoCliente && !uniqueClientes.includes(nuevoPresupuestoCliente) && (
                    <p className="text-xs text-blue-600 mt-1.5">
                      Se creará un presupuesto con un nuevo cliente
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowNuevoPresupuestoModal(false)
                  setNuevoPresupuestoCliente("")
                  setClienteDropdownOpen(false)
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePresupuesto}
                disabled={!nuevoPresupuestoCliente.trim()}
                className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Presupuesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PresupuestosPage() {
  return (
    <Suspense fallback={null}>
      <PresupuestosContent />
    </Suspense>
  )
}
