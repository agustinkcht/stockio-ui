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
  Receipt,
  ReceiptText,
  Search,
  Plus,
  XCircle,
  BarChart3,
} from "lucide-react"
import type { Venta, VentaItem } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { ClienteModal } from "@/components/ventas/cliente-modal"
import { TicketModal } from "@/components/ventas/ticket-modal"
import { useVentas } from "@/hooks/use-ventas"
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
  const { ventas } = useVentas()

  const { periodKey, customRange, setPeriodKey, setCustomRange } = usePeriod()
  const [periodOpen, setPeriodOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
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
  const [expandedVentas, setExpandedVentas] = useState<Set<string>>(new Set())
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [viewingClienteId, setViewingClienteId] = useState<string | null>(null)
  const [viewingTicketVenta, setViewingTicketVenta] = useState<Venta | null>(null)

  // Tabs: default to "en_curso" if there are any, else "finalizada"
  const hasEnCurso = ventas.some(v => v.estado === "en_curso")
  const [activeTab, setActiveTab] = useState<StatusTab>("todas")
  useEffect(() => {
    // Only auto-select on first mount when user hasn't picked a tab
    setActiveTab(hasEnCurso ? "en_curso" : "finalizada")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  // Widget counts
  const pendientesCobro = ventas.filter(isPendienteCobro)
  const pendientesEntrega = ventas.filter(isPendienteEntrega)
  const canceladas = ventas.filter(v => v.estado === "cancelada")

  // Filtered list
  const filteredVentas = ventas.filter(v => {
    const matchesTab =
      activeTab === "todas" ? true :
      activeTab === "en_curso" ? v.estado === "en_curso" :
      activeTab === "finalizada" ? v.estado === "finalizada" :
      v.estado === "cancelada"
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || v.id.toLowerCase().includes(q) || getClienteNombre(v).toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  const allSelected = selectedVentas.size === filteredVentas.length && filteredVentas.length > 0
  const someSelected = selectedVentas.size > 0 && selectedVentas.size < filteredVentas.length

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const handleScroll = () => setScrolled(el.scrollTop > 40)
    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [])

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
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-slate-50">
              {/* Sticky hero — collapses on scroll */}
              <div className="sticky top-0 z-30">
                <div className="bg-slate-50/80 backdrop-blur-md">
                  <div
                    className="px-8 transition-[padding] duration-300 ease-in-out"
                    style={{ paddingTop: scrolled ? "10px" : "32px", paddingBottom: scrolled ? "10px" : "32px" }}
                  >
                    <div className="flex items-center justify-between gap-6">
                      {/* Left block — stacks title above period when expanded, inline when collapsed */}
                      <div className="flex min-w-0" style={{ flexDirection: scrolled ? "row" : "column", alignItems: scrolled ? "center" : "flex-start", gap: scrolled ? "12px" : "6px", transition: "gap 0.3s ease, flex-direction 0.3s ease" }}>
                        <h1
                          className="font-semibold text-slate-900 tracking-tight shrink-0"
                          style={{
                            fontSize: scrolled ? "1.125rem" : "2.25rem",
                            lineHeight: scrolled ? "1.5rem" : "2.5rem",
                            transition: "font-size 0.3s ease, line-height 0.3s ease",
                          }}
                        >
                          Ventas
                        </h1>
                        <div className="flex items-center gap-3 flex-wrap">
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
                        className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 shrink-0 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                        Nueva Venta
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 mt-2">

              {/* 4 Widgets — clickable to filter: Totales / Finalizadas / En Curso / Canceladas */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {/* Widget 1 — Totales */}
                <button
                  type="button"
                  onClick={() => setActiveTab("todas")}
                  className={`border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer ${activeTab === "todas" ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-md"}`}
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
                  onClick={() => setActiveTab("finalizada")}
                  className={`border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer ${activeTab === "finalizada" ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-md"}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{ventas.filter(v => v.estado === "finalizada").length}</p>
                    <p className="text-sm font-medium text-emerald-500 truncate">Finalizadas</p>
                  </div>
                </button>

                {/* Widget 3 — En Curso */}
                <button
                  type="button"
                  onClick={() => setActiveTab("en_curso")}
                  className={`border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer ${activeTab === "en_curso" ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200/80 hover:border-orange-200 hover:shadow-md"}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <Clock className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{ventas.filter(v => v.estado === "en_curso").length}</p>
                    <p className="text-sm font-medium text-orange-500 truncate">En Curso</p>
                  </div>
                </button>

                {/* Widget 4 — Canceladas */}
                <button
                  type="button"
                  onClick={() => setActiveTab("cancelada")}
                  className={`border rounded-xl px-5 py-4 shadow-sm text-left transition-all cursor-pointer ${activeTab === "cancelada" ? "bg-red-50 border-red-200" : "bg-white border-slate-200/80 hover:border-red-200 hover:shadow-md"}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{canceladas.length}</p>
                    <p className="text-sm font-medium text-red-400 truncate">Canceladas</p>
                  </div>
                </button>
              </div>

              {/* Search + right-side actions */}
              <div className="flex items-center mb-3 gap-2">
                <div className="w-[28%] h-8 flex items-center gap-2 px-3 rounded-md border shadow-sm border-[rgba(228,230,235,0.6)] bg-white">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar"
                    className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-gray-100 cursor-pointer"
                  >
                    <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                    <span>Filtrar</span>
                  </button>
                  <button
                    type="button"
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-gray-100 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ordenar</span>
                  </button>
                </div>
              </div>

              {/* Column header */}
              <div className="mb-2">
                <div className="grid grid-cols-100 h-9 bg-slate-100 border border-slate-200/80 rounded-md shadow-sm">
                  <div className="col-span-4 flex items-center justify-center">
                    <input
                      ref={allCheckboxRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label={allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                      className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-96 flex items-center border-l border-slate-200/80" />
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
                        <div className="col-span-10 flex items-center justify-start px-3 border-r border-slate-200/70">
                          <span className="text-sm font-semibold text-slate-900 truncate">{venta.id}</span>
                        </div>
                        <div className="col-span-10 flex items-center justify-start px-3 border-r border-slate-200/70">
                          <span className="text-sm text-slate-600 truncate">
                            {formatVentaDateTime(venta.fecha, venta.hora)}
                          </span>
                        </div>
                        <div className="col-span-10 flex items-center justify-start px-3">
                          <span className="text-sm font-medium text-slate-700 truncate">Manual</span>
                        </div>
                        <div className="col-span-38" />
                        <div className="col-span-24 flex items-center px-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (venta.cliente.tipo === "cuenta") setViewingClienteId(venta.cliente.id)
                            }}
                            className="text-sm font-semibold text-slate-800 truncate hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                          >
                            {getClienteNombre(venta)}
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
                            </div>
                          )}
                        </div>
                      </div>

                      {/* MIDDLE ROW */}
                      <div className="grid grid-cols-100 min-h-[40px]">
                        <div className="col-span-4" />
                        <div className="col-span-10 flex items-center justify-start pl-0">
                          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-md ${estadoStyle.bg} w-full`}>
                            <EstadoIcon className={`w-3.5 h-3.5 ${estadoStyle.text} shrink-0`} />
                            <span className={`text-xs font-medium ${estadoStyle.text}`}>{estadoStyle.label}</span>
                          </div>
                        </div>
                        <div className="col-span-10 flex items-center justify-start px-3">
                          {venta.estado === "en_curso" && (
                            <span className="text-xs font-semibold text-slate-700">Cobro {pagoPct}%</span>
                          )}
                        </div>
                        <div className="col-span-10 flex items-center justify-start px-3">
                          {venta.estado === "en_curso" && (
                            <span className="text-xs font-semibold text-slate-700">Entrega {entregaPct}%</span>
                          )}
                        </div>
                        <div className="col-span-38" />
                        <div className="col-span-24 flex items-center px-3">
                          {isFacturada ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50">
                              <Receipt className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600">Facturada</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setViewingTicketVenta(venta) }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs font-medium text-slate-600">Ver ticket detalle</span>
                            </button>
                          )}
                        </div>
                        <div className="col-span-4" />
                      </div>

                      {/* BOTTOM ROW */}
                      {(() => {
                        const isExpanded = expandedVentas.has(venta.id) && isMulti
                        const totalUnits = venta.items.reduce((sum, it) => sum + it.quantity, 0)
                        const lastItemIdx = venta.items.length - 1
                        const firstItemDisplay = firstItem ? getVentaItemDisplay(firstItem) : null

                        return (
                          <div className="grid grid-cols-100 pt-2 pb-2" onClick={(e) => e.stopPropagation()}>
                            <div className="col-span-4" />
                            <div className={`col-span-48 bg-slate-50 ${isExpanded ? "rounded-tl-md" : "rounded-l-md"} py-2.5 pl-3 pr-2 flex items-center gap-2`}>
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
                                  <span className="text-sm text-slate-700 truncate">{venta.items.length} productos</span>
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

                            <div className="col-span-20 bg-slate-50 flex items-center px-3">
                              <span className="text-xs text-slate-600">{totalUnits} unidades</span>
                            </div>
                            <div className={`col-span-24 bg-slate-50 ${isExpanded ? "rounded-tr-md" : "rounded-r-md"} flex items-center px-3`}>
                              <span className="text-sm font-semibold text-slate-800">${venta.total.toLocaleString("es-AR")}</span>
                            </div>
                            <div className="col-span-4" />

                            {/* Expanded item rows */}
                            {isExpanded && venta.items.map((item, idx) => {
                              const isLast = idx === lastItemIdx
                              const itemDisplay = getVentaItemDisplay(item)
                              return (
                                <Fragment key={`${venta.id}-exp-${idx}`}>
                                  <div className="col-span-4" />
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
                                  <div className="col-span-16 bg-slate-50 px-3 py-2 border-t border-slate-200/60 flex items-center">
                                    <span className="text-xs text-slate-600">${item.unitPrice.toLocaleString("es-AR")}</span>
                                  </div>
                                  <div className="col-span-20 bg-slate-50 px-3 py-2 border-t border-slate-200/60 flex items-center">
                                    <span className="text-xs text-slate-600">{item.quantity} unidades</span>
                                  </div>
                                  <div className={`col-span-24 bg-slate-50 px-3 py-2 border-t border-slate-200/60 flex flex-col justify-center ${isLast ? "rounded-br-md" : ""}`}>
                                    <span className="text-[11px] text-slate-400 leading-tight">{item.quantity} x ${item.unitPrice.toLocaleString("es-AR")}</span>
                                    <span className="text-sm font-semibold text-slate-800 leading-tight">${item.total.toLocaleString("es-AR")}</span>
                                  </div>
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

/* ─── Range Calendar Dialog ─────────────────────────────────────────────────── */

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
