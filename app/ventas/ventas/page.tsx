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
  CheckCheck,
  X,
  Package,
  Wallet,
} from "lucide-react"
import type { Venta, VentaItem, PaymentMethod } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { ClienteModal } from "@/components/ventas/cliente-modal"
import { TicketModal } from "@/components/ventas/ticket-modal"
import { useVentas } from "@/hooks/use-ventas"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadVentasPDF } from "@/lib/utils/generate-venta-pdf"
import {
  PERIOD_OPTIONS,
  usePeriod,
  usePeriodRange,
  type PeriodKey,
} from "@/lib/contexts/period-context"

type StatusTab = "todas" | "en_curso" | "finalizada" | "cancelada"

const estadoConfig: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  en_curso:   { bg: "bg-amber-50",   text: "text-amber-600",   icon: Clock,         label: "En Curso"   },
  finalizada: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2,  label: "Finalizada" },
  cancelada:  { bg: "bg-red-50",     text: "text-red-500",     icon: XCircle,       label: "Cancelada"  },
}

const monthsAbbr = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatVentaDateTime(dateStr: string, hora: string): string {
  const date = new Date(dateStr + "T12:00:00")
  const day = date.getDate()
  const month = monthsAbbr[date.getMonth()]
  return `${day}\u00A0\u00A0${month}\u00A0\u00A0${hora}`
}

function getClienteNombre(venta: Venta): string {
  return venta.cliente.tipo === "cuenta" ? venta.cliente.nombre : "Consumidor Final"
}

function getPagoPct(venta: Venta): number {
  if (!venta.cobros.length) return 0
  const cobrado = venta.cobros.reduce((sum, c) => sum + c.monto, 0)
  return Math.round((cobrado / venta.total) * 100)
}

function getEntregaPct(venta: Venta): number {
  const totalUnidades = venta.items.reduce((sum, i) => sum + i.quantity, 0)
  if (!totalUnidades) return 0
  const entregadas = venta.items.reduce((sum, item) => {
    const e = venta.entregaItems.find(ei => ei.sku === item.sku)
    return sum + (e?.quantityEntregada ?? 0)
  }, 0)
  return Math.round((entregadas / totalUnidades) * 100)
}

function isPendienteCobro(v: Venta): boolean {
  if (v.estado === "cancelada" || v.estado === "finalizada") return false
  const cobrado = v.cobros.reduce((s, c) => s + c.monto, 0)
  return cobrado < v.total
}

function isPendienteEntrega(v: Venta): boolean {
  if (v.estado === "cancelada" || v.estado === "finalizada") return false
  return v.items.some(it => {
    const e = v.entregaItems.find(ei => ei.sku === it.sku)
    return (e?.quantityEntregada ?? 0) < it.quantity
  })
}

export default function VentasPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const router = useRouter()
  const allCheckboxRef = useRef<HTMLInputElement>(null)
  const { ventas, cancelarVenta, finalizarVenta } = useVentas()
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

  const [selectedVentas, setSelectedVentas] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Sort
  const [sortField, setSortField] = useState<"fecha" | "precio">("fecha")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [sortOpen, setSortOpen] = useState(false)

  // Filters
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCliente, setFilterCliente] = useState("")
  const [filterPendienteCobro, setFilterPendienteCobro] = useState(false)
  const [filterPendienteEntrega, setFilterPendienteEntrega] = useState(false)
  const hasActiveFilters = !!filterCliente || filterPendienteCobro || filterPendienteEntrega
  const [expandedVentas, setExpandedVentas] = useState<Set<string>>(new Set())
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [viewingClienteId, setViewingClienteId] = useState<string | null>(null)
  const [viewingTicketVenta, setViewingTicketVenta] = useState<Venta | null>(null)

  // Tabs: default to "todas"
  const [activeTab, setActiveTab] = useState<StatusTab>("todas")

  // Cancelar modal
  const [cancelarModalVenta, setCancelarModalVenta] = useState<Venta | null>(null)
  const [cancelarDevolverUnidades, setCancelarDevolverUnidades] = useState(true)
  const [cancelarDevolverCobros, setCancelarDevolverCobros] = useState(true)

  // Finalizar modal
  const [finalizarModalVenta, setFinalizarModalVenta] = useState<Venta | null>(null)
  const [finalizarMedioPago, setFinalizarMedioPago] = useState<PaymentMethod | "no_especificado">("no_especificado")

  // Widget counts
  const pendientesCobro = ventas.filter(isPendienteCobro)
  const pendientesEntrega = ventas.filter(isPendienteEntrega)
  const canceladas = ventas.filter(v => v.estado === "cancelada")

  // Unique clientes for filter dropdown
  const uniqueClientes = useMemo(() => {
    const names = ventas
      .map(v => getClienteNombre(v))
      .filter(n => n !== "Consumidor Final")
    return Array.from(new Set(names)).sort()
  }, [ventas])

  // Filtered + sorted list
  const filteredVentas = useMemo(() => {
    const filtered = ventas.filter(v => {
      const matchesTab =
        activeTab === "todas" ? true :
        activeTab === "en_curso" ? v.estado === "en_curso" :
        activeTab === "finalizada" ? v.estado === "finalizada" :
        v.estado === "cancelada"
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || v.id.toLowerCase().includes(q) || getClienteNombre(v).toLowerCase().includes(q)
      const matchesCliente = !filterCliente || getClienteNombre(v) === filterCliente
      const matchesPendienteCobro = !filterPendienteCobro || isPendienteCobro(v)
      const matchesPendienteEntrega = !filterPendienteEntrega || isPendienteEntrega(v)
      return matchesTab && matchesSearch && matchesCliente && matchesPendienteCobro && matchesPendienteEntrega
    })
    filtered.sort((a, b) => {
      let diff = 0
      if (sortField === "fecha") {
        diff = new Date(`${a.fecha}T${a.hora}`).getTime() - new Date(`${b.fecha}T${b.hora}`).getTime()
      } else {
        diff = a.total - b.total
      }
      return sortDir === "asc" ? diff : -diff
    })
    return filtered
  }, [ventas, activeTab, searchQuery, filterCliente, filterPendienteCobro, filterPendienteEntrega, sortField, sortDir])

  const allSelected = selectedVentas.size === filteredVentas.length && filteredVentas.length > 0
  const someSelected = selectedVentas.size > 0 && selectedVentas.size < filteredVentas.length

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedVentas(new Set())
    } else {
      setSelectedVentas(new Set(filteredVentas.map((v) => v.id)))
    }
  }

  const toggleSelectVenta = (id: string) => {
    const next = new Set(selectedVentas)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedVentas(next)
  }

  const toggleExpandVenta = (id: string) => {
    const next = new Set(expandedVentas)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedVentas(next)
  }

  const breadcrumbs = [{ label: "Ventas" }, { label: "Ventas", href: "/ventas/ventas" }]

  const tabs: { id: StatusTab; label: string; count?: number }[] = [
    { id: "todas",     label: "Todas",        count: ventas.length },
    { id: "en_curso",  label: "En Curso",     count: ventas.filter(v => v.estado === "en_curso").length },
    { id: "finalizada",label: "Finalizadas",  count: ventas.filter(v => v.estado === "finalizada").length },
    { id: "cancelada", label: "Canceladas",   count: ventas.filter(v => v.estado === "cancelada").length },
  ]

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
            {/* Single scroll container — sticky hero lives inside it so backdrop-blur works */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {/* Sticky hero */}
              <div className="sticky top-0 z-30">
                <div className="bg-slate-50/80 backdrop-blur-md">
                  <div className="px-8 py-8">
                    <div className="max-w-6xl mx-auto">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                          Ventas
                        </h1>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <VentasPeriodSelector
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
                            <VentasRangeCalendarDialog
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
                        onClick={() => router.push("/ventas/ventas/nueva")}
                        className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 shrink-0 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer mt-1"
                      >
                        <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                        Nueva Venta
                      </button>
                    </div>
                    </div>{/* /max-w-6xl hero */}
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 mt-2">
                <div className="max-w-6xl mx-auto">

              {/* 4 Widgets — clickable to filter; inactive (non-clickable, greyed) when count = 0 */}
              {(() => {
                const countFinalizadas = ventas.filter(v => v.estado === "finalizada").length
                const countEnCurso = ventas.filter(v => v.estado === "en_curso").length
                const countCanceladas = canceladas.length

                const widgetCls = (active: boolean, disabled: boolean, activeColor: string, hoverColor: string) => {
                  if (disabled) return "border rounded-xl px-5 py-4 shadow-sm text-left border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed"
                  if (active) return `border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer ${activeColor}`
                  return `border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer bg-white border-slate-200/80 ${hoverColor}`
                }

                return (
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {/* Widget 1 — Totales (never disabled) */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("todas")}
                      className={widgetCls(activeTab === "todas", false, "bg-blue-50 border-blue-200", "hover:border-blue-200 hover:shadow-md")}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex items-baseline gap-2.5 min-w-0">
                        <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{ventas.length}</p>
                        <p className="text-sm font-medium text-blue-500 truncate">Totales</p>
                      </div>
                    </button>

                    {/* Widget 2 — Finalizadas */}
                    <button
                      type="button"
                      onClick={() => countFinalizadas > 0 && setActiveTab("finalizada")}
                      className={widgetCls(activeTab === "finalizada", countFinalizadas === 0, "bg-emerald-50 border-emerald-200", "hover:border-emerald-200 hover:shadow-md")}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex items-baseline gap-2.5 min-w-0">
                        <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{countFinalizadas}</p>
                        <p className="text-sm font-medium text-emerald-500 truncate">Finalizadas</p>
                      </div>
                    </button>

                    {/* Widget 3 — En Curso */}
                    <button
                      type="button"
                      onClick={() => countEnCurso > 0 && setActiveTab("en_curso")}
                      className={widgetCls(activeTab === "en_curso", countEnCurso === 0, "bg-orange-50 border-orange-200", "hover:border-orange-200 hover:shadow-md")}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                        <Clock className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex items-baseline gap-2.5 min-w-0">
                        <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{countEnCurso}</p>
                        <p className="text-sm font-medium text-orange-500 truncate">En Curso</p>
                      </div>
                    </button>

                    {/* Widget 4 — Canceladas */}
                    <button
                      type="button"
                      onClick={() => countCanceladas > 0 && setActiveTab("cancelada")}
                      className={widgetCls(activeTab === "cancelada", countCanceladas === 0, "bg-red-50 border-red-200", "hover:border-red-200 hover:shadow-md")}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                        <XCircle className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex items-baseline gap-2.5 min-w-0">
                        <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{countCanceladas}</p>
                        <p className="text-sm font-medium text-red-400 truncate">Canceladas</p>
                      </div>
                    </button>
                  </div>
                )
              })()}

              {/* Combined header bar: checkbox | divider | search — then Filtrar/Ordenar on the right */}
              <div className="mb-2 flex items-center gap-2">
                {/* Header block — shrinks to fit checkbox + search, not full width */}
                <div className="flex items-center h-9 border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md min-w-0 overflow-hidden bg-white">
                  {/* Checkbox cell — same bg as Filtrar/Ordenar buttons */}
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
                  {/* Divider */}
                  <div className="w-px h-full bg-slate-200/80 shrink-0" />
                  {/* Search input — white bg */}
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

                {/* Selection count + bulk actions — visible only when items are selected */}
                {selectedVentas.size > 0 && (
                  <div className="flex items-center gap-2.5 h-9">
                    <div className="w-px h-5 bg-slate-300" />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {selectedVentas.size} seleccionada{selectedVentas.size !== 1 ? "s" : ""}
                    </span>
                    <div className="w-px h-5 bg-slate-200" />
                    <button
                      type="button"
                      className="h-8 flex items-center gap-1.5 px-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-colors"
                      onClick={() => {
                        const selected = ventas.filter(v => selectedVentas.has(v.id))
                        downloadVentasPDF(selected, miNegocio)
                      }}
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-400" />
                      Descargar PDF
                    </button>
                  </div>
                )}

                {/* Filtrar / Ordenar — pushed to the far right */}
                <div className="ml-auto flex items-center gap-2">

                  {/* Filtrar */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
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
                          {/* Cliente */}
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Cliente</label>
                            <select
                              value={filterCliente}
                              onChange={(e) => setFilterCliente(e.target.value)}
                              className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                            >
                              <option value="">Todos</option>
                              {uniqueClientes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          {/* Pendiente de cobro / entrega — only for todas / en_curso */}
                          {(activeTab === "todas" || activeTab === "en_curso") && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Estado</label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={filterPendienteCobro}
                                  onChange={(e) => setFilterPendienteCobro(e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs text-slate-700">Pendiente de cobro</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={filterPendienteEntrega}
                                  onChange={(e) => setFilterPendienteEntrega(e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs text-slate-700">Pendiente de entrega</span>
                              </label>
                            </div>
                          )}
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={() => { setFilterCliente(""); setFilterPendienteCobro(false); setFilterPendienteEntrega(false) }}
                              className="w-full text-xs text-slate-500 hover:text-slate-700 py-1 text-center cursor-pointer"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Ordenar — unified arrow toggle + field select */}
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
                      <option value="precio">Precio</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-2">
                {filteredVentas.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <p className="text-sm">No hay ventas para mostrar</p>
                  </div>
                )}
                {filteredVentas.map((venta) => {
                  const estadoStyle = estadoConfig[venta.estado] ?? estadoConfig["en_curso"]
                  const EstadoIcon = estadoStyle.icon
                  const isSelected = selectedVentas.has(venta.id)
                  const isFacturada = !!venta.facturaEmitida
                  const isMulti = venta.items.length > 1
                  const firstItem: VentaItem | undefined = venta.items[0]
                  const pagoPct = getPagoPct(venta)
                  const entregaPct = getEntregaPct(venta)

                  return (
                    <div
                      key={venta.id}
                      onClick={() => router.push(`/ventas/ventas/${venta.id}`)}
                      className={`bg-white border rounded-md shadow-sm transition-colors cursor-pointer ${
                        isSelected
                          ? "border-blue-300 bg-blue-50/40"
                          : "border-slate-200/60 hover:border-slate-300"
                      }`}
                    >
                      {/* TOP ROW */}
                      <div className="grid grid-cols-100 min-h-[44px] pt-2 border-b border-slate-200/70">
                        <div
                          className="col-span-4 flex items-center justify-center border-r border-slate-200/70"
                          onClick={(e) => { e.stopPropagation(); toggleSelectVenta(venta.id) }}
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
                          <span className="text-sm font-semibold text-slate-900 shrink-0">{venta.id}</span>
                        </div>
                        {/* Fecha */}
                        <div className="col-span-14 flex items-center justify-start px-3 border-r border-slate-200/70">
                          <span className="text-sm text-slate-600 truncate">
                            {formatVentaDateTime(venta.fecha, venta.hora)}
                          </span>
                        </div>
                        {/* Estado */}
                        <div className="col-span-14 flex items-center justify-start px-3 border-r border-slate-200/70">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0 ${estadoStyle.bg}`}>
                            <EstadoIcon className={`w-3 h-3 ${estadoStyle.text}`} />
                            <span className={`text-xs font-medium ${estadoStyle.text}`}>{estadoStyle.label}</span>
                          </div>
                        </div>
                        {/* Spacer */}
                        <div className="col-span-40" />
                        {/* Descargar PDF */}
                        <div className="col-span-14 flex items-center justify-end pr-3 border-r border-slate-200/70">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); downloadVentasPDF([venta], miNegocio) }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium text-slate-600">Descargar PDF</span>
                          </button>
                        </div>
                        <div
                          className="col-span-4 flex items-center justify-center border-l border-slate-200/70 relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={() => setOpenMoreMenu(openMoreMenu === venta.id ? null : venta.id)}
                            aria-label="Más opciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMoreMenu === venta.id && (
                            <div
                              className="absolute top-full right-2 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]"
                              onMouseLeave={() => setOpenMoreMenu(null)}
                            >
                              {venta.estado === "en_curso" && (
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                  onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); setFinalizarModalVenta(venta); setFinalizarMedioPago("no_especificado") }}
                                >
                                  <CheckCheck className="w-4 h-4 text-slate-400" />
                                  Marcar como finalizada
                                </button>
                              )}
                              {(venta.estado === "en_curso" || venta.estado === "finalizada") && (
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                  onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); setCancelarModalVenta(venta); setCancelarDevolverUnidades(true); setCancelarDevolverCobros(true) }}
                                >
                                  <XCircle className="w-4 h-4 text-red-400" />
                                  Cancelar venta
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* MIDDLE ROW */}
                      <div className="flex items-center gap-3 py-1.5" style={{ paddingLeft: "calc(4% + 12px)" }}>
                        {/* Mini cliente widget — no label, smaller avatar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (venta.cliente.tipo === "cuenta") setViewingClienteId(venta.cliente.id)
                          }}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        >
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-white uppercase">{getClienteNombre(venta).charAt(0)}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">{getClienteNombre(venta)}</span>
                        </button>

                        {/* Pendientes — inline after cliente pill */}
                        {venta.estado === "en_curso" && (isPendienteCobro(venta) || isPendienteEntrega(venta)) && (
                          <div className="flex items-center gap-2 text-[11px] font-light text-slate-400">
                            {isPendienteCobro(venta) && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                Cobro pendiente
                              </span>
                            )}
                            {isPendienteEntrega(venta) && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                Entrega pendiente
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BOTTOM ROW */}
                      {(() => {
                        const isExpanded = expandedVentas.has(venta.id) && isMulti
                        const totalUnits = venta.items.reduce((sum, it) => sum + it.quantity, 0)
                        const lastItemIdx = venta.items.length - 1
                        const firstItemDisplay = firstItem ? getVentaItemDisplay(firstItem) : null

                        // Shared discount calc helper
                        const calcItemPrices = (item: VentaItem) => {
                          const baseGross = item.unitPrice * item.quantity
                          const discountAmount =
                            item.discountType === "percent"
                              ? baseGross * (item.discount / 100)
                              : item.discountType === "unit"
                              ? Math.min(item.discount, item.quantity) * item.unitPrice
                              : item.discount * item.quantity
                          const adjustedUnit = Math.max(0, item.unitPrice - (discountAmount / Math.max(item.quantity, 1)))
                          const paidQty = item.discountType === "unit"
                            ? Math.max(0, item.quantity - Math.min(item.discount, item.quantity))
                            : item.quantity
                          return { adjustedUnit, paidQty }
                        }

                        // Precio unitario cell — mirrors venta detail's price column
                        const PrecioCell = ({ item, className = "" }: { item: VentaItem; className?: string }) => {
                          const { adjustedUnit } = calcItemPrices(item)
                          const hasDiscount = item.discount > 0
                          return (
                            <div className={`flex flex-col justify-center gap-0 ${className}`}>
                              {hasDiscount && item.discountType === "unit" ? (
                                <>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                    <span className="text-[10px] text-slate-400">c/u</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-600 font-medium leading-tight">
                                    {Math.min(item.discount, item.quantity)} bonif.
                                  </span>
                                </>
                              ) : hasDiscount && (item.discountType === "percent" || item.discountType === "fixed") ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400 line-through tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                    <span className="text-[10px] font-semibold text-red-500">
                                      {item.discountType === "percent" ? `-${item.discount}%` : `-$${item.discount.toLocaleString("es-AR")}`}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-medium text-slate-800 tabular-nums">${Math.round(adjustedUnit).toLocaleString("es-AR")}</span>
                                    <span className="text-[10px] text-slate-400">c/u</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xs text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                  <span className="text-[10px] text-slate-400">c/u</span>
                                </div>
                              )}
                            </div>
                          )
                        }

                        // Quantity cell — shows qty, with "paga X" hint for unit discount
                        const QtyCell = ({ item, className = "" }: { item: VentaItem; className?: string }) => {
                          const { paidQty } = calcItemPrices(item)
                          const hasUnitDiscount = item.discount > 0 && item.discountType === "unit"
                          return (
                              <div className={`flex flex-col justify-center gap-0 ${className}`}>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xs text-slate-700 tabular-nums">{item.quantity}</span>
                                <span className="text-[10px] text-slate-400">{item.quantity === 1 ? "unidad" : "unidades"}</span>
                              </div>
                              {hasUnitDiscount && (
                                <span className="text-[10px] text-emerald-600 font-medium leading-tight">
                                  paga {paidQty}
                                </span>
                              )}
                            </div>
                          )
                        }

                        // All rows share the same 4 column widths: 32 (item) + 16 (precio) + 20 (qty) + 24 (total/subtotal)
                        return (
                          <div className="grid grid-cols-100 pt-1 pb-2" onClick={(e) => e.stopPropagation()}>
                            <div className="col-span-4" />

                            {/* ITEM cell — col-span-32 for all row types */}
                            <div className={`col-span-32 bg-slate-50 ${isExpanded ? "rounded-tl-md" : "rounded-l-md"} py-2.5 pl-3 pr-2 flex items-center gap-2`}>
                              {isMulti && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleExpandVenta(venta.id) }}
                                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-colors shrink-0"
                                  aria-label={isExpanded ? "Colapsar productos" : "Expandir productos"}
                                >
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              )}

                              {isMulti ? (
                                <>
                                  <div className="flex items-center -space-x-2 shrink-0">
                                    {venta.items.slice(0, 3).map((it, idx) => (
                                      <div
                                        key={`${venta.id}-thumb-${idx}`}
                                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                                        style={{ zIndex: 10 - idx }}
                                      >
                                        <img src={getCategoryImage(it.categoria) || "/placeholder.svg"} alt={it.categoria || "Producto"} className="w-5 h-5 object-contain opacity-70" />
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-800 truncate">{venta.items.length} productos</span>
                                </>
                              ) : firstItem && firstItemDisplay ? (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setViewingItem(firstItem) }}
                                  className="flex items-center gap-3 min-w-0 text-left rounded hover:bg-slate-100/70 transition-colors -m-0.5 p-0.5 cursor-pointer"
                                >
                                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                    <img src={getCategoryImage(firstItemDisplay.categoria) || "/placeholder.svg"} alt={firstItemDisplay.categoria || "Producto"} className="w-5 h-5 object-contain opacity-70" />
                                  </div>
                                  <div className="min-w-0 flex flex-col">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-sm font-medium text-slate-800 truncate">{firstItemDisplay.name}</span>
                                      {firstItemDisplay.tags.length > 0 && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          {firstItemDisplay.tags.map((tag, i) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {(firstItemDisplay.marca || firstItemDisplay.categoria) && (
                                      <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 truncate">
                                        {firstItemDisplay.marca && <span>{firstItemDisplay.marca}</span>}
                                        {firstItemDisplay.marca && firstItemDisplay.categoria && <span>·</span>}
                                        {firstItemDisplay.categoria && <span>{firstItemDisplay.categoria}</span>}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ) : null}
                            </div>

                            {/* UNIDADES — col-span-20: qty for single, summary for multi */}
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

                            {/* PRECIO UNITARIO — col-span-16 */}
                            <div className="col-span-16 bg-slate-50 flex items-center px-3">
                              {!isMulti && firstItem && <PrecioCell item={firstItem} />}
                            </div>

                            {/* TOTAL — col-span-24, left-aligned to match subtotal column */}
                            <div className={`col-span-24 bg-slate-50 ${isExpanded ? "rounded-tr-md" : "rounded-r-md"} flex items-center px-3`}>
                              <span className="text-sm font-semibold text-slate-800">Total: ${venta.total.toLocaleString("es-AR")}</span>
                            </div>
                            <div className="col-span-4" />

                            {/* Expanded item rows */}
                            {isExpanded && venta.items.map((item, idx) => {
                              const isLast = idx === lastItemIdx
                              const itemDisplay = getVentaItemDisplay(item)
                              return (
                                <Fragment key={`${venta.id}-exp-${idx}`}>
                                  <div className="col-span-4" />
                                  {/* Item name */}
                                  <div className={`col-span-32 bg-slate-50 border-t border-slate-200/60 ${isLast ? "rounded-bl-md" : ""}`}>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setViewingItem(item) }}
                                      className="w-full px-3 py-2 flex items-start gap-3 text-left rounded hover:bg-slate-100/70 transition-colors cursor-pointer"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        <img src={getCategoryImage(itemDisplay.categoria) || "/placeholder.svg"} alt={itemDisplay.categoria || "Producto"} className="w-4 h-4 object-contain opacity-70" />
                                      </div>
                                      <div className="min-w-0 flex flex-col">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="text-sm font-medium text-slate-800 truncate">{itemDisplay.name}</span>
                                          {itemDisplay.tags.length > 0 && (
                                            <div className="flex items-center gap-1 shrink-0">
                                              {itemDisplay.tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {(itemDisplay.marca || itemDisplay.categoria) && (
                                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 truncate">
                                            {itemDisplay.marca && <span>{itemDisplay.marca}</span>}
                                            {itemDisplay.marca && itemDisplay.categoria && <span>·</span>}
                                            {itemDisplay.categoria && <span>{itemDisplay.categoria}</span>}
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  </div>
                                  {/* Unidades */}
                                  <div className="col-span-20 bg-slate-50 px-3 py-2 border-t border-slate-200/60 flex items-center">
                                    <QtyCell item={item} />
                                  </div>
                                  {/* Precio unitario */}
                                  <div className="col-span-16 bg-slate-50 px-3 py-2 border-t border-slate-200/60 flex items-center">
                                    <PrecioCell item={item} />
                                  </div>
                                  {/* Subtotal — empty cell to preserve grid structure */}
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
                </div>{/* /max-w-6xl content */}
              </div>
            </div>
          </main>
        </div>
      </div>

      {viewingItem && (
        <VentaItemDetailModal ventaItem={viewingItem} onClose={() => setViewingItem(null)} />
      )}
      {viewingClienteId && (
        <ClienteModal clienteId={viewingClienteId} onClose={() => setViewingClienteId(null)} />
      )}
      {viewingTicketVenta && (
        <TicketModal venta={viewingTicketVenta} onClose={() => setViewingTicketVenta(null)} />
      )}

      {/* Finalizar venta modal */}
      {finalizarModalVenta && (() => {
        const v = finalizarModalVenta
        const totalUnidades = v.items.reduce((s, i) => s + i.quantity, 0)
        const entregadas = v.items.reduce((s, it) => {
          const e = v.entregaItems.find(ei => ei.sku === it.sku)
          return s + (e?.quantityEntregada ?? 0)
        }, 0)
        const totalCobrado = v.cobros.reduce((s, c) => s + c.monto, 0)
        const montoRestante = Math.max(0, v.total - totalCobrado)
        const hasPendingEntrega = entregadas < totalUnidades
        const hasPendingCobro = montoRestante > 0
        const pendingProductsCount = v.items.filter(it => {
          const e = v.entregaItems.find(ei => ei.sku === it.sku)
          return (e?.quantityEntregada ?? 0) < it.quantity
        }).length

        const metodoOptions: { value: PaymentMethod | "no_especificado"; label: string }[] = [
          { value: "no_especificado", label: "No especificado" },
          { value: "efectivo", label: "Efectivo" },
          { value: "posnet", label: "Posnet" },
          { value: "transferencia", label: "Transferencia" },
        ]

        const closeModal = () => {
          setFinalizarModalVenta(null)
          setFinalizarMedioPago("no_especificado")
        }

        const handleConfirm = () => {
          const now = new Date()
          finalizarVenta(
            v.id,
            finalizarMedioPago as PaymentMethod,
            now.toISOString().slice(0, 10),
            now.toTimeString().slice(0, 5),
          )
          closeModal()
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Marcar como Finalizada</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Revisá los cambios que se aplicarán al confirmar</p>
                </div>
                <button onClick={closeModal} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {/* Entrega */}
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasPendingEntrega ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${hasPendingEntrega ? "bg-amber-100" : "bg-emerald-100"}`}>
                      {hasPendingEntrega
                        ? <Package className="w-3.5 h-3.5 text-amber-600" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${hasPendingEntrega ? "text-amber-800" : "text-emerald-800"}`}>
                        {hasPendingEntrega ? "Entrega pendiente" : "Entrega completa"}
                      </p>
                      <p className={`text-xs mt-0.5 ${hasPendingEntrega ? "text-amber-700" : "text-emerald-700"}`}>
                        {hasPendingEntrega
                          ? `${pendingProductsCount} producto${pendingProductsCount !== 1 ? "s" : ""} sin entregar serán marcados como entregados`
                          : "Todos los productos ya fueron entregados"}
                      </p>
                    </div>
                  </div>

                  {/* Cobro */}
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasPendingCobro ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${hasPendingCobro ? "bg-amber-100" : "bg-emerald-100"}`}>
                      {hasPendingCobro
                        ? <Wallet className="w-3.5 h-3.5 text-amber-600" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${hasPendingCobro ? "text-amber-800" : "text-emerald-800"}`}>
                        {hasPendingCobro ? "Cobro pendiente" : "Cobro completo"}
                      </p>
                      <p className={`text-xs mt-0.5 ${hasPendingCobro ? "text-amber-700" : "text-emerald-700"}`}>
                        {hasPendingCobro
                          ? `Se registrará un cobro de $${Math.round(montoRestante).toLocaleString("es-AR")} para cubrir el saldo restante`
                          : "El total de la venta ya fue cobrado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medio de pago — only if pending cobro */}
                {hasPendingCobro && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      Medio de pago del cobro
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {metodoOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFinalizarMedioPago(opt.value)}
                          className={`px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors ${
                            finalizarMedioPago === opt.value
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar y Finalizar
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* Cancelar venta modal */}
      {cancelarModalVenta && (() => {
        const v = cancelarModalVenta
        const totalEntregadas = v.entregaItems.reduce((s, ei) => s + ei.quantityEntregada, 0)
        const totalCobrado = v.cobros.filter(c => c.monto > 0).reduce((s, c) => s + c.monto, 0)
        const hasEntregas = totalEntregadas > 0
        const hasCobros = totalCobrado > 0
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelarModalVenta(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Cancelar venta</h3>
                </div>
                <p className="text-sm text-slate-500 mt-2 ml-12">
                  Vas a cancelar la venta <span className="font-semibold text-slate-800">{v.id}</span>. Esta acción es irreversible.
                </p>
              </div>
              {(hasEntregas || hasCobros) && (
                <div className="px-5 py-4 flex flex-col gap-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">¿Qué hacer con los registros existentes?</p>
                  {hasEntregas && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{totalEntregadas} {totalEntregadas === 1 ? "unidad entregada" : "unidades entregadas"}</p>
                        <p className="text-xs text-slate-400">Unidades ya despachadas</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setCancelarDevolverUnidades(true)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cancelarDevolverUnidades ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Devolver</button>
                        <button onClick={() => setCancelarDevolverUnidades(false)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!cancelarDevolverUnidades ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>No hacer nada</button>
                      </div>
                    </div>
                  )}
                  {hasCobros && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">${totalCobrado.toLocaleString("es-AR")} cobrados</p>
                        <p className="text-xs text-slate-400">Pagos ya registrados</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setCancelarDevolverCobros(true)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cancelarDevolverCobros ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Devolver</button>
                        <button onClick={() => setCancelarDevolverCobros(false)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!cancelarDevolverCobros ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>No hacer nada</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="px-5 py-4 flex items-center justify-end gap-2">
                <button onClick={() => setCancelarModalVenta(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  Salir
                </button>
                <button
                  onClick={() => {
                    cancelarVenta(v.id, {
                      devolverUnidades: hasEntregas ? cancelarDevolverUnidades : false,
                      devolverCobros: hasCobros ? cancelarDevolverCobros : false,
                    })
                    setCancelarModalVenta(null)
                    setCancelarDevolverUnidades(true)
                    setCancelarDevolverCobros(true)
                  }}
                  className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancelar venta
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ─── Period Selector ───────────────────────────────────────────────────────── */

function VentasPeriodSelector({
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

/* ─── Range Calendar Dialog ─────────────���───────────────────────────────────── */

function startOfDayV(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function VentasRangeCalendarDialog({
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
