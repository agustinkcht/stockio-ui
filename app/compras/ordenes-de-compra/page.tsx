"use client"

import { useState, useEffect, useRef, useMemo, Fragment } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import {
  ChevronRight,
  ChevronDown,
  FileDown,
  MoreVertical,
  ListFilter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  XCircle,
  BarChart3,
  X,
  Copy,
  Trash2,
  Send,
} from "lucide-react"
import type { OrdenDeCompra, EstadoOrdenDeCompra } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { useOrdenesDeCompra } from "@/hooks/use-ordenes-de-compra"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadOrdenCompraPDF } from "@/lib/utils/generate-orden-compra-pdf"
import {
  PERIOD_OPTIONS,
  usePeriod,
  usePeriodRange,
  type PeriodKey,
} from "@/lib/contexts/period-context"

type StatusTab = "todas" | "borrador" | "enviada" | "aceptada" | "rechazada"

const estadoConfig: Record<EstadoOrdenDeCompra, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  borrador:  { bg: "bg-slate-100",   text: "text-slate-600",   icon: Clock,        label: "Borrador"  },
  enviada:   { bg: "bg-blue-50",     text: "text-blue-600",    icon: Send,         label: "Enviada"   },
  aceptada:  { bg: "bg-emerald-50",  text: "text-emerald-600", icon: CheckCircle2, label: "Aceptada"  },
  rechazada: { bg: "bg-red-50",      text: "text-red-500",     icon: XCircle,      label: "Rechazada" },
  cancelada: { bg: "bg-slate-100",   text: "text-slate-500",   icon: XCircle,      label: "Cancelada" },
}

const monthsAbbr = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatOrdenDateTime(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  const day = date.getDate()
  const month = monthsAbbr[date.getMonth()]
  return `${day}\u00A0\u00A0${month}`
}

export default function OrdenesDeCompraPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const router = useRouter()
  const allCheckboxRef = useRef<HTMLInputElement>(null)
  const { ordenes, deleteOrden, addOrden, getNextOrderNumber } = useOrdenesDeCompra()
  const { miNegocio } = useSettings()

  const { periodKey, customRange, setPeriodKey, setCustomRange } = usePeriod()
  const [periodOpen, setPeriodOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const range = usePeriodRange()

  const periodLabel = useMemo(() => {
    return PERIOD_OPTIONS.find((o) => o.key === periodKey)?.label ?? "Período"
  }, [periodKey])

  const rangeLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    if (periodKey === "hoy") return fmt(range.start)
    return `${fmt(range.start)} — ${fmt(range.end)}`
  }, [range, periodKey])

  const [selectedOrdenes, setSelectedOrdenes] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Sort
  const [sortField, setSortField] = useState<"fecha" | "precio">("fecha")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Filters
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterProveedor, setFilterProveedor] = useState("")
  const [filterEstados, setFilterEstados] = useState<EstadoOrdenDeCompra[]>([])
  const hasActiveFilters = !!filterProveedor || filterEstados.length > 0

  const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set())

  // Nueva orden modal
  const [showNuevaOrdenModal, setShowNuevaOrdenModal] = useState(false)
  const [nuevaOrdenProveedor, setNuevaOrdenProveedor] = useState("")
  const proveedorInputRef = useRef<HTMLDivElement>(null)
  const [proveedorDropdownOpen, setProveedorDropdownOpen] = useState(false)

  // Tabs: default to "todas"
  const [activeTab, setActiveTab] = useState<StatusTab>("todas")

  // Unique proveedores for filter dropdown
  const uniqueProveedores = useMemo(() => {
    const names = ordenes.map(o => o.proveedorNombre).filter(Boolean)
    return Array.from(new Set(names)).sort()
  }, [ordenes])

  // Filtered proveedores for nueva orden dropdown
  const filteredProveedoresInput = useMemo(() => {
    if (!nuevaOrdenProveedor) return uniqueProveedores
    return uniqueProveedores.filter(p => p.toLowerCase().includes(nuevaOrdenProveedor.toLowerCase()))
  }, [nuevaOrdenProveedor, uniqueProveedores])

  // Filtered + sorted list
  const filteredOrdenes = useMemo(() => {
    const filtered = ordenes.filter(o => {
      const matchesTab =
        activeTab === "todas" ? true :
        activeTab === "borrador" ? o.estado === "borrador" :
        activeTab === "enviada" ? o.estado === "enviada" :
        activeTab === "aceptada" ? o.estado === "aceptada" :
        o.estado === "rechazada"
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || o.id.toLowerCase().includes(q) || o.proveedorNombre.toLowerCase().includes(q)
      const matchesProveedor = !filterProveedor || o.proveedorNombre === filterProveedor
      const matchesEstado = filterEstados.length === 0 || filterEstados.includes(o.estado)
      return matchesTab && matchesSearch && matchesProveedor && matchesEstado
    })
    filtered.sort((a, b) => {
      let diff = 0
      if (sortField === "fecha") {
        diff = new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
      } else {
        diff = a.importeEstimado - b.importeEstimado
      }
      return sortDir === "asc" ? diff : -diff
    })
    return filtered
  }, [ordenes, activeTab, searchQuery, filterProveedor, filterEstados, sortField, sortDir])

  const allSelected = selectedOrdenes.size === filteredOrdenes.length && filteredOrdenes.length > 0
  const someSelected = selectedOrdenes.size > 0 && selectedOrdenes.size < filteredOrdenes.length

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  // Close proveedor dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (proveedorInputRef.current && !proveedorInputRef.current.contains(e.target as Node)) {
        setProveedorDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrdenes(new Set())
    } else {
      setSelectedOrdenes(new Set(filteredOrdenes.map((o) => o.id)))
    }
  }

  const toggleSelectOrden = (id: string) => {
    const next = new Set(selectedOrdenes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedOrdenes(next)
  }

  const toggleExpandOrden = (id: string) => {
    const next = new Set(expandedOrdenes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedOrdenes(next)
  }

  const toggleFilterEstado = (estado: EstadoOrdenDeCompra) => {
    setFilterEstados(prev => prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado])
  }

  const handleCreateOrden = () => {
    if (!nuevaOrdenProveedor.trim()) return
    const newOrden = addOrden({
      fechaCreacion: new Date().toISOString().slice(0, 10),
      proveedorId: "",
      proveedorNombre: nuevaOrdenProveedor.trim(),
      estado: "borrador" as EstadoOrdenDeCompra,
      items: [],
      importeEstimado: 0,
    })
    router.push(`/compras/ordenes-de-compra/${newOrden.id}`)
    setShowNuevaOrdenModal(false)
    setNuevaOrdenProveedor("")
  }

  const breadcrumbs = [{ label: "Compras" }, { label: "Órdenes de Compra", href: "/compras/ordenes-de-compra" }]

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
          {/* Utility Bar */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div />
            </div>
          </div>

          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {/* Sticky hero */}
              <div className="sticky top-0 z-30">
                <div className="bg-slate-50/80 backdrop-blur-md">
                  <div className="px-8 py-8">
                    <div className="max-w-6xl mx-auto">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                            Órdenes de Compra
                          </h1>
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <OrdenesComprasPeriodSelector
                              open={periodOpen}
                              setOpen={setPeriodOpen}
                              currentLabel={periodLabel}
                              currentKey={periodKey}
                              onSelect={(k) => {
                                if (k === "personalizado") {
                                  setPeriodOpen(false)
                                  setCalendarOpen(true)
                                  return
                                }
                                setPeriodKey(k)
                                setCustomRange(null)
                                setPeriodOpen(false)
                              }}
                            />
                            <span className="text-sm text-slate-500 font-mono">{rangeLabel}</span>
                            {calendarOpen && (
                              <OrdenesComprasRangeCalendarDialog
                                initialRange={customRange}
                                onCancel={() => setCalendarOpen(false)}
                                onApply={(start, end) => {
                                  setCustomRange({ start, end })
                                  setPeriodKey("personalizado")
                                  setCalendarOpen(false)
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/compras/ordenes-de-compra/nueva")}
                          className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 shrink-0 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer mt-1"
                        >
                          <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                          Nueva Orden
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 mt-2">
                <div className="max-w-6xl mx-auto">

                  {/* Widgets */}
                  {(() => {
                    const countAceptadas = ordenes.filter(o => o.estado === "aceptada").length
                    const countBorrador = ordenes.filter(o => o.estado === "borrador").length
                    const countRechazadas = ordenes.filter(o => o.estado === "rechazada").length

                    const widgetCls = (active: boolean, disabled: boolean, activeColor: string, hoverColor: string) => {
                      if (disabled) return "border rounded-xl px-5 py-4 shadow-sm text-left border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed"
                      if (active) return `border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer ${activeColor}`
                      return `border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer bg-white border-slate-200/80 ${hoverColor}`
                    }

                    return (
                      <div className="grid grid-cols-4 gap-3 mb-5">
                        {/* Totales */}
                        <button
                          type="button"
                          onClick={() => setActiveTab("todas")}
                          className={widgetCls(activeTab === "todas", false, "bg-blue-50 border-blue-200", "hover:border-blue-200 hover:shadow-md")}
                        >
                          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{ordenes.length}</p>
                            <p className="text-sm font-medium text-blue-500 truncate">órdenes totales</p>
                          </div>
                        </button>

                        {/* Aceptadas */}
                        <button
                          type="button"
                          onClick={() => countAceptadas > 0 && setActiveTab("aceptada")}
                          className={widgetCls(activeTab === "aceptada", countAceptadas === 0, "bg-emerald-50 border-emerald-200", "hover:border-emerald-200 hover:shadow-md")}
                        >
                          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{countAceptadas}</p>
                            <p className="text-sm font-medium text-emerald-500 truncate">órdenes aceptadas</p>
                          </div>
                        </button>

                        {/* En borrador */}
                        <button
                          type="button"
                          onClick={() => countBorrador > 0 && setActiveTab("borrador")}
                          className={widgetCls(activeTab === "borrador", countBorrador === 0, "bg-slate-100 border-slate-300", "hover:border-slate-300 hover:shadow-md")}
                        >
                          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                            <Clock className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{countBorrador}</p>
                            <p className="text-sm font-medium text-slate-500 truncate">órdenes en borrador</p>
                          </div>
                        </button>

                        {/* Rechazadas */}
                        <button
                          type="button"
                          onClick={() => countRechazadas > 0 && setActiveTab("rechazada")}
                          className={widgetCls(activeTab === "rechazada", countRechazadas === 0, "bg-red-50 border-red-200", "hover:border-red-200 hover:shadow-md")}
                        >
                          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                            <XCircle className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                            <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{countRechazadas}</p>
                            <p className="text-sm font-medium text-red-400 truncate">órdenes rechazadas</p>
                          </div>
                        </button>
                      </div>
                    )
                  })()}

                  {/* Combined header bar */}
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex items-center h-9 border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md min-w-0 overflow-hidden bg-white">
                      <div className="flex items-center justify-center w-[52px] shrink-0 h-full bg-white">
                        <input
                          ref={allCheckboxRef}
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          aria-label={allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                          className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="w-px h-full bg-slate-200/80 shrink-0" />
                      <div className="flex items-center gap-2 px-3 h-full w-64 bg-white">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar"
                          className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    {/* Selection count + bulk actions */}
                    {selectedOrdenes.size > 0 && (
                      <div className="flex items-center gap-2.5 h-9">
                        <div className="w-px h-5 bg-slate-300" />
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {selectedOrdenes.size} seleccionada{selectedOrdenes.size !== 1 ? "s" : ""}
                        </span>
                        <div className="w-px h-5 bg-slate-200" />
                        <button
                          type="button"
                          className="h-8 flex items-center gap-1.5 px-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-colors"
                          onClick={() => {
                            const selected = ordenes.filter(o => selectedOrdenes.has(o.id))
                            downloadOrdenCompraPDF(selected, miNegocio)
                          }}
                        >
                          <FileDown className="w-3.5 h-3.5 text-slate-400" />
                          Descargar PDF
                        </button>
                      </div>
                    )}

                    {/* Filtrar / Ordenar */}
                    <div className="ml-auto flex items-center gap-2">
                      {/* Filtrar */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setFilterOpen(!filterOpen)}
                          className={`h-9 text-xs transition-colors border shadow-sm gap-1.5 shrink-0 px-3 rounded-md flex items-center cursor-pointer ${
                            hasActiveFilters
                              ? "border-blue-400 text-blue-600 bg-blue-50"
                              : "border-[rgba(228,230,235,0.6)] bg-white hover:bg-slate-50"
                          }`}
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          <span>Filtrar</span>
                        </button>
                        {filterOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                            <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg w-60 p-3 space-y-3">
                              {/* Proveedor */}
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Proveedor</label>
                                <select
                                  value={filterProveedor}
                                  onChange={(e) => setFilterProveedor(e.target.value)}
                                  className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                                >
                                  <option value="">Todos</option>
                                  {uniqueProveedores.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                              {/* Estado */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Estado</label>
                                {(["borrador", "enviada", "aceptada", "rechazada"] as EstadoOrdenDeCompra[]).map(estado => (
                                  <label key={estado} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={filterEstados.includes(estado)}
                                      onChange={() => toggleFilterEstado(estado)}
                                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-700">{estadoConfig[estado].label}</span>
                                  </label>
                                ))}
                              </div>
                              {hasActiveFilters && (
                                <button
                                  type="button"
                                  onClick={() => { setFilterProveedor(""); setFilterEstados([]) }}
                                  className="w-full text-xs text-slate-500 hover:text-slate-700 py-1 text-center cursor-pointer"
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
                          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                          title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                          className="px-2.5 h-full hover:bg-slate-50 transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer flex items-center"
                        >
                          <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
                        </button>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value as "fecha" | "precio")}
                          className="appearance-none pl-2.5 pr-6 text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700 h-full"
                        >
                          <option value="fecha">Fecha</option>
                          <option value="precio">Importe</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="flex flex-col gap-2">
                    {filteredOrdenes.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <p className="text-sm">No hay órdenes de compra para mostrar</p>
                      </div>
                    )}
                    {filteredOrdenes.map((orden) => {
                      const estadoStyle = estadoConfig[orden.estado] ?? estadoConfig["borrador"]
                      const EstadoIcon = estadoStyle.icon
                      const isSelected = selectedOrdenes.has(orden.id)
                      const isMulti = orden.items.length > 1
                      const firstItem = orden.items[0]

                      return (
                        <div
                          key={orden.id}
                          onClick={() => router.push(`/compras/ordenes-de-compra/${orden.id}`)}
                          className={`bg-white border rounded-md shadow-sm transition-colors cursor-pointer ${
                            isSelected
                              ? "border-blue-300 bg-blue-50/40"
                              : "border-slate-200/60 hover:border-slate-300"
                          }`}
                        >
                          {/* TOP ROW */}
                          <div className="grid grid-cols-100 min-h-[44px] py-2 border-b border-slate-200/70">
                            <div
                              className="col-span-4 flex items-center justify-center border-r border-slate-200/70"
                              onClick={(e) => { e.stopPropagation(); toggleSelectOrden(orden.id) }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>
                            {/* ID */}
                            <div className="col-span-10 flex items-center justify-start px-3 border-r border-slate-200/70">
                              <span className="text-sm font-semibold text-slate-900 shrink-0">{orden.id}</span>
                            </div>
                            {/* Fecha */}
                            <div className="col-span-14 flex items-center justify-start px-3 border-r border-slate-200/70">
                              <span className="text-sm text-slate-600 truncate">
                                {formatOrdenDateTime(orden.fechaCreacion)}
                              </span>
                            </div>
                            {/* Spacer */}
                            <div className="col-span-54" />
                            {/* Proveedor pill */}
                            <div className="col-span-14 flex items-center justify-end pr-3 border-r border-slate-200/70">
                              <div className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border border-slate-200 bg-slate-50 shadow-sm shrink-0">
                                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-white uppercase">{orden.proveedorNombre.charAt(0)}</span>
                                </div>
                                <span className="text-xs text-slate-700 whitespace-nowrap">{orden.proveedorNombre}</span>
                              </div>
                            </div>
                            <div
                              className="col-span-4 flex items-center justify-center border-l border-slate-200/70 relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => setOpenMoreMenu(openMoreMenu === orden.id ? null : orden.id)}
                                aria-label="Más opciones"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMoreMenu === orden.id && (
                                <div
                                  className="absolute top-full right-2 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[210px]"
                                  onMouseLeave={() => setOpenMoreMenu(null)}
                                >
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                    onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); router.push(`/compras/ordenes-de-compra/${orden.id}`) }}
                                  >
                                    <Copy className="w-4 h-4 text-slate-400" />
                                    Duplicar orden
                                  </button>
                                  {orden.estado === "borrador" && (
                                    <button
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenMoreMenu(null)
                                        deleteOrden(orden.id)
                                        setSelectedOrdenes(prev => {
                                          const next = new Set(prev); next.delete(orden.id); return next
                                        })
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                      Eliminar orden
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* MIDDLE ROW */}
                          <div className="flex items-center justify-between gap-3 py-1.5" style={{ paddingLeft: "calc(4% + 12px)", paddingRight: "calc(4% + 12px)" }}>
                            <div className="flex items-center gap-3">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full shrink-0 ${estadoStyle.bg}`}>
                                <EstadoIcon className={`w-3.5 h-3.5 ${estadoStyle.text}`} />
                                <span className={`text-sm font-medium ${estadoStyle.text}`}>{estadoStyle.label}</span>
                              </div>
                            </div>
                            {/* Descargar PDF — middle row, matching estado badge height */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); downloadOrdenCompraPDF([orden], miNegocio) }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                            >
                              <FileDown className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-sm font-medium text-slate-600">Descargar PDF</span>
                            </button>
                          </div>

                          {/* BOTTOM ROW */}
                          {(() => {
                            const isExpanded = expandedOrdenes.has(orden.id) && isMulti
                            const totalUnits = orden.items.reduce((sum, it) => sum + it.quantity, 0)
                            const lastItemIdx = orden.items.length - 1

                            const PrecioCell = ({ item, className = "" }: { item: typeof firstItem; className?: string }) => {
                              if (!item) return null
                              return (
                                <div className={`flex flex-col justify-center gap-0 ${className}`}>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                    <span className="text-[10px] text-slate-400">c/u</span>
                                  </div>
                                </div>
                              )
                            }

                            const QtyCell = ({ item, className = "" }: { item: typeof firstItem; className?: string }) => {
                              if (!item) return null
                              return (
                                <div className={`flex flex-col justify-center gap-0 ${className}`}>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-slate-700 tabular-nums">{item.quantity}</span>
                                    <span className="text-[10px] text-slate-400">{item.quantity === 1 ? "unidad" : "unidades"}</span>
                                  </div>
                                </div>
                              )
                            }

                            return (
                              <div className="grid grid-cols-100 pt-1 pb-2" onClick={(e) => e.stopPropagation()}>
                                <div className="col-span-4" />

                                {/* ITEM cell */}
                                <div className={`col-span-32 bg-slate-50 ${isExpanded ? "rounded-tl-md" : "rounded-l-md"} py-2.5 pl-3 pr-2 flex items-center gap-2`}>
                                  {isMulti && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleExpandOrden(orden.id) }}
                                      className="p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-colors shrink-0"
                                      aria-label={isExpanded ? "Colapsar productos" : "Expandir productos"}
                                    >
                                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                  )}

                                  {isMulti ? (
                                    <>
                                      <div className="flex items-center -space-x-2 shrink-0">
                                        {orden.items.slice(0, 3).map((it, idx) => (
                                          <div
                                            key={`${orden.id}-thumb-${idx}`}
                                            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                                            style={{ zIndex: 10 - idx }}
                                          >
                                            <img src={getCategoryImage(it.categoria) || "/placeholder.svg"} alt={it.categoria || "Producto"} className="w-5 h-5 object-contain opacity-70" />
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-sm font-semibold text-slate-800 truncate">{orden.items.length} productos</span>
                                    </>
                                  ) : firstItem ? (
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        <img src={getCategoryImage(firstItem.categoria) || "/placeholder.svg"} alt={firstItem.categoria || "Producto"} className="w-5 h-5 object-contain opacity-70" />
                                      </div>
                                      <div className="min-w-0 flex flex-col">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="text-sm font-medium text-slate-800 truncate">{firstItem.name}</span>
                                          {(firstItem.tags ?? []).length > 0 && (
                                            <div className="flex items-center gap-1 shrink-0">
                                              {(firstItem.tags ?? []).map((tag, i) => (
                                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {(firstItem.marca || firstItem.categoria) && (
                                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 truncate">
                                            {firstItem.marca && <span>{firstItem.marca}</span>}
                                            {firstItem.marca && firstItem.categoria && <span>·</span>}
                                            {firstItem.categoria && <span>{firstItem.categoria}</span>}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                {/* UNIDADES */}
                                <div className="col-span-20 bg-slate-50 flex items-center px-3">
                                  {!isMulti && firstItem ? (
                                    <QtyCell item={firstItem} />
                                  ) : (
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-sm text-slate-700 tabular-nums">{totalUnits}</span>
                                      <span className="text-xs text-slate-400">{totalUnits === 1 ? "unidad" : "unidades"}</span>
                                    </div>
                                  )}
                                </div>

                                {/* PRECIO UNITARIO */}
                                <div className="col-span-16 bg-slate-50 flex items-center px-3">
                                  {!isMulti && firstItem && <PrecioCell item={firstItem} />}
                                </div>

                                {/* TOTAL */}
                                <div className={`col-span-24 bg-slate-50 ${isExpanded ? "rounded-tr-md" : "rounded-r-md"} flex items-center px-3`}>
                                  <span className="text-sm font-semibold text-slate-800">Total: ${orden.importeEstimado.toLocaleString("es-AR")}</span>
                                </div>
                                <div className="col-span-4" />

                                {/* Expanded item rows */}
                                {isExpanded && orden.items.map((item, idx) => {
                                  const isLast = idx === lastItemIdx
                                  return (
                                    <Fragment key={`${orden.id}-exp-${idx}`}>
                                      <div className="col-span-4" />
                                      <div className={`col-span-32 bg-slate-50 border-t border-slate-200/60 ${isLast ? "rounded-bl-md" : ""}`}>
                                        <div className="w-full px-3 py-2 flex items-start gap-3">
                                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                            <img src={getCategoryImage(item.categoria) || "/placeholder.svg"} alt={item.categoria || "Producto"} className="w-4 h-4 object-contain opacity-70" />
                                          </div>
                                          <div className="min-w-0 flex flex-col">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                                              {(item.tags ?? []).length > 0 && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                  {(item.tags ?? []).map((tag, i) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            {(item.marca || item.categoria) && (
                                              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 truncate">
                                                {item.marca && <span>{item.marca}</span>}
                                                {item.marca && item.categoria && <span>·</span>}
                                                {item.categoria && <span>{item.categoria}</span>}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-span-20 bg-slate-50 px-3 py-2 border-t border-slate-200/60 flex items-center">
                                        <QtyCell item={item} />
                                      </div>
                                      <div className="col-span-16 bg-slate-50 px-3 py-2 border-t border-slate-200/60 flex items-center">
                                        <PrecioCell item={item} />
                                      </div>
                                      <div className={`col-span-24 bg-slate-50 border-t border-slate-200/60 ${isLast ? "rounded-br-md" : ""}`} />
                                      <div className="col-span-4" />
                                    </Fragment>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Nueva Orden Modal */}
      {showNuevaOrdenModal && (
        <div className="fixed inset-0 z-[100010] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Nueva Orden de Compra</h2>
                  <p className="text-sm text-slate-500 mt-0.5">ID: <span className="font-medium text-slate-700">ODC-{getNextOrderNumber()}</span></p>
                </div>
                <button
                  onClick={() => { setShowNuevaOrdenModal(false); setNuevaOrdenProveedor(""); setProveedorDropdownOpen(false) }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 min-h-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Proveedor</label>
              <div className="relative" ref={proveedorInputRef}>
                <input
                  type="text"
                  value={nuevaOrdenProveedor}
                  onChange={(e) => { setNuevaOrdenProveedor(e.target.value); setProveedorDropdownOpen(true) }}
                  onFocus={() => setProveedorDropdownOpen(true)}
                  placeholder="Buscar o escribir proveedor..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 text-sm"
                />
                <button
                  onClick={() => setProveedorDropdownOpen(!proveedorDropdownOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                >
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${proveedorDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {proveedorDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredProveedoresInput.length > 0 ? (
                      filteredProveedoresInput.map((p) => (
                        <button
                          key={p}
                          onClick={() => { setNuevaOrdenProveedor(p); setProveedorDropdownOpen(false) }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${nuevaOrdenProveedor === p ? "bg-slate-50 text-slate-900 font-medium" : "text-slate-700"}`}
                        >
                          {p}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        {nuevaOrdenProveedor
                          ? <span>Crear orden con: <span className="font-medium text-slate-700">&quot;{nuevaOrdenProveedor}&quot;</span></span>
                          : <span>No hay proveedores</span>
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => { setShowNuevaOrdenModal(false); setNuevaOrdenProveedor(""); setProveedorDropdownOpen(false) }}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrden}
                disabled={!nuevaOrdenProveedor.trim()}
                className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

/* ─── Period Selector ─────────────────────────────────────────────────────── */

function OrdenesComprasPeriodSelector({
  open,
  setOpen,
  currentLabel,
  currentKey,
  onSelect,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  currentLabel: string
  currentKey: PeriodKey
  onSelect: (k: PeriodKey) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 transition-colors text-sm font-medium text-slate-700 cursor-pointer"
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20 animate-in fade-in-0 slide-in-from-top-1 duration-150">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelect(opt.key)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                  currentKey === opt.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Range Calendar Dialog ───────────────────────────────────────────────── */

function startOfDayV(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function OrdenesComprasRangeCalendarDialog({
  initialRange,
  onApply,
  onCancel,
}: {
  initialRange: { start: Date; end: Date } | null
  onApply: (start: Date, end: Date) => void
  onCancel: () => void
}) {
  const today = startOfDayV(new Date())
  const [viewMonth, setViewMonth] = useState(() => {
    const base = initialRange?.end ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [start, setStart] = useState<Date | null>(initialRange?.start ?? null)
  const [end, setEnd] = useState<Date | null>(initialRange?.end ?? null)

  const handleDayClick = (d: Date) => {
    if (d > today) return
    if (!start || (start && end)) {
      setStart(d); setEnd(null)
    } else if (start && !end) {
      if (d < start) { setStart(d); setEnd(start) }
      else setEnd(d)
    }
  }

  const goPrev = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  const goNext = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    if (next > today) return
    setViewMonth(next)
  }

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const lastOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7
  const totalCells = Math.ceil((startWeekday + lastOfMonth.getDate()) / 7) * 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1
    cells.push(dayNum < 1 || dayNum > lastOfMonth.getDate() ? null : new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNum))
  }

  const inRange = (d: Date) => !!(start && end && d >= start && d <= end)
  const canApply = !!start && !!end

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={goPrev} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <ChevronDown className="w-4 h-4 text-slate-500 rotate-90" />
          </button>
          <span className="text-sm font-semibold text-slate-800">{MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
          <button type="button" onClick={goNext} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <ChevronDown className="w-4 h-4 text-slate-500 -rotate-90" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["Lu","Ma","Mi","Ju","Vi","Sa","Do"].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const isStart = start && d.getTime() === start.getTime()
            const isEnd = end && d.getTime() === end.getTime()
            const isInRange = inRange(d)
            const isFuture = d > today
            return (
              <button
                key={i}
                type="button"
                disabled={isFuture}
                onClick={() => handleDayClick(d)}
                className={`text-xs h-8 rounded-lg transition-colors cursor-pointer ${
                  isStart || isEnd
                    ? "bg-slate-900 text-white"
                    : isInRange
                    ? "bg-slate-100 text-slate-700"
                    : isFuture
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canApply}
            onClick={() => canApply && onApply(start!, end!)}
            className="flex-1 h-9 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
