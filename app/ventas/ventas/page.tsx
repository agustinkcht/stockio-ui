"use client"

import { useState, useEffect, useRef, useMemo, Fragment } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
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
  Filter,
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
const ES_MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

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

// ── Period selector (same as dashboard) ──────────────────────────
function PeriodSelector({
  open,
  setOpen,
  currentLabel,
  currentKey,
  onSelect,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  currentLabel: string
  currentKey: PeriodKey
  onSelect: (key: PeriodKey) => void
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

// ── Range calendar dialog (same as dashboard) ─────────────────────
function RangeCalendarDialog({
  initialRange,
  onApply,
  onCancel,
}: {
  initialRange: { start: Date; end: Date } | null
  onApply: (start: Date, end: Date) => void
  onCancel: () => void
}) {
  const today = startOfDay(new Date())
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
    if (next.getFullYear() > today.getFullYear() || (next.getFullYear() === today.getFullYear() && next.getMonth() > today.getMonth())) return
    setViewMonth(next)
  }

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const lastOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7
  const totalCells = Math.ceil((startWeekday + lastOfMonth.getDate()) / 7) * 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1
    if (dayNum < 1 || dayNum > lastOfMonth.getDate()) cells.push(null)
    else cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNum))
  }

  const inSelectionRange = (d: Date) => {
    if (!start || !end) return false
    return d >= start && d <= end
  }

  const canApply = !!start && !!end

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
          <button type="button" onClick={goPrev} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-base font-medium text-slate-900">
            {ES_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </div>
          <button type="button" onClick={goNext} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-3 grid grid-cols-7 text-center">
          {["L","M","X","J","V","S","D"].map(d => (
            <div key={d} className="text-[11px] font-medium text-slate-400 py-1">{d}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />
            const isStart = start && d.getTime() === start.getTime()
            const isEnd = end && d.getTime() === end.getTime()
            const inRange = inSelectionRange(d)
            const isFuture = d > today
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={isFuture}
                onClick={() => handleDayClick(d)}
                className={`h-9 w-full text-sm rounded-lg transition-colors cursor-pointer ${
                  isStart || isEnd ? "bg-slate-900 text-white font-semibold" :
                  inRange ? "bg-slate-100 text-slate-900" :
                  isFuture ? "text-slate-300 cursor-not-allowed" :
                  "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onCancel} className="flex-1 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
          <button
            type="button"
            disabled={!canApply}
            onClick={() => canApply && onApply(start!, end!)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${canApply ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VentasPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const router = useRouter()
  const allCheckboxRef = useRef<HTMLInputElement>(null)
  const { ventas } = useVentas()

  const [selectedVentas, setSelectedVentas] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedVentas, setExpandedVentas] = useState<Set<string>>(new Set())
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [viewingClienteId, setViewingClienteId] = useState<string | null>(null)
  const [viewingTicketVenta, setViewingTicketVenta] = useState<Venta | null>(null)
  const [activeTab, setActiveTab] = useState<StatusTab>("todas")

  // Period
  const { periodKey, customRange, setPeriodKey, setCustomRange } = usePeriod()
  const [periodOpen, setPeriodOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const periodLabel = useMemo(() => {
    const opt = PERIOD_OPTIONS.find((o) => o.key === periodKey)
    return opt?.label ?? "Período"
  }, [periodKey])

  // Filter & sort state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ estado: "", cliente: "" })
  const [showSort, setShowSort] = useState(false)
  const [sortField, setSortField] = useState<"fecha" | "total" | "cliente">("fecha")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Widget counts
  const enCurso = ventas.filter(v => v.estado === "en_curso")
  const finalizadas = ventas.filter(v => v.estado === "finalizada")
  const canceladas = ventas.filter(v => v.estado === "cancelada")
  const pendientesCobro = ventas.filter(isPendienteCobro)
  const pendientesEntrega = ventas.filter(isPendienteEntrega)
  const pendientesAmbos = ventas.filter(v => isPendienteCobro(v) && isPendienteEntrega(v))

  // Filtered + sorted list
  const filteredVentas = useMemo(() => {
    let list = ventas.filter(v => {
      const matchesTab =
        activeTab === "todas" ? true :
        activeTab === "en_curso" ? v.estado === "en_curso" :
        activeTab === "finalizada" ? v.estado === "finalizada" :
        v.estado === "cancelada"
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || v.id.toLowerCase().includes(q) || getClienteNombre(v).toLowerCase().includes(q)
      const matchesEstado = !filters.estado || v.estado === filters.estado
      const matchesCliente = !filters.cliente || getClienteNombre(v).toLowerCase().includes(filters.cliente.toLowerCase())
      return matchesTab && matchesSearch && matchesEstado && matchesCliente
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === "fecha") cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      else if (sortField === "total") cmp = a.total - b.total
      else if (sortField === "cliente") cmp = getClienteNombre(a).localeCompare(getClienteNombre(b))
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [ventas, activeTab, searchQuery, filters, sortField, sortDir])

  const allSelected = selectedVentas.size === filteredVentas.length && filteredVentas.length > 0
  const someSelected = selectedVentas.size > 0 && selectedVentas.size < filteredVentas.length

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const toggleSelectAll = () => {
    if (allSelected) setSelectedVentas(new Set())
    else setSelectedVentas(new Set(filteredVentas.map((v) => v.id)))
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
  const hasActiveFilters = Object.values(filters).some(v => v)

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

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 overflow-y-auto">

              {/* Sticky top bar — like dashboard */}
              <div className="sticky top-0 z-30">
                <div className="bg-[rgba(250,251,253,0.85)] backdrop-blur-md border-b border-slate-100">
                  <div className="px-8 py-6 flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Ventas</h1>
                      <div className="mt-2 flex items-center gap-3">
                        <PeriodSelector
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
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/ventas/ventas/nueva")}
                      className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 shrink-0 rounded-md flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-slate-700" strokeWidth={2.25} />
                      Nueva Venta
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 mt-6">

                {/* 4 Widgets */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {/* Widget 1 — Todas */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("todas")}
                    className={`bg-white border rounded-xl p-4 shadow-sm text-left transition-colors cursor-pointer ${activeTab === "todas" ? "border-slate-900 ring-1 ring-slate-900/10" : "border-slate-200/80 hover:border-slate-300"}`}
                  >
                    <p className="text-lg font-bold text-slate-800 leading-tight">{ventas.length} Ventas</p>
                    <p className="text-xs text-slate-400 mt-1">totales en el período</p>
                  </button>

                  {/* Widget 2 — En Curso */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("en_curso")}
                    className={`bg-white border rounded-xl p-4 shadow-sm text-left transition-colors cursor-pointer ${activeTab === "en_curso" ? "border-slate-900 ring-1 ring-slate-900/10" : "border-slate-200/80 hover:border-slate-300"}`}
                  >
                    <p className="text-lg font-bold text-slate-800 leading-tight">{enCurso.length} Ventas En Curso</p>
                    <div className="mt-2 flex flex-col gap-1">
                      <button type="button" onClick={(e) => { e.stopPropagation() }} className="text-xs text-slate-500 hover:text-slate-800 transition-colors text-left">
                        {pendientesEntrega.length} pendientes de entrega
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation() }} className="text-xs text-slate-500 hover:text-slate-800 transition-colors text-left">
                        {pendientesCobro.length} pendientes de cobro
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation() }} className="text-xs text-slate-500 hover:text-slate-800 transition-colors text-left">
                        {pendientesAmbos.length} pendientes de entrega y cobro
                      </button>
                    </div>
                  </button>

                  {/* Widget 3 — Finalizadas */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("finalizada")}
                    className={`bg-white border rounded-xl p-4 shadow-sm text-left transition-colors cursor-pointer ${activeTab === "finalizada" ? "border-slate-900 ring-1 ring-slate-900/10" : "border-slate-200/80 hover:border-slate-300"}`}
                  >
                    <p className="text-lg font-bold text-slate-800 leading-tight">{finalizadas.length} Ventas Finalizadas</p>
                    <div className="mt-2">
                      <button type="button" onClick={(e) => { e.stopPropagation() }} className="text-xs text-slate-500 hover:text-slate-800 transition-colors text-left">
                        0 con cambios/devoluciones
                      </button>
                    </div>
                  </button>

                  {/* Widget 4 — Canceladas */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("cancelada")}
                    className={`bg-white border rounded-xl p-4 shadow-sm text-left transition-colors cursor-pointer ${activeTab === "cancelada" ? "border-slate-900 ring-1 ring-slate-900/10" : "border-slate-200/80 hover:border-slate-300"}`}
                  >
                    <p className="text-lg font-bold text-slate-800 leading-tight">{canceladas.length} Ventas Canceladas</p>
                  </button>
                </div>

                {/* Search + tab selector + filter/sort */}
                <div className="flex items-center mb-3 gap-2">
                  {/* Tab selector pill */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5 shrink-0">
                    {(["todas", "en_curso", "finalizada", "cancelada"] as StatusTab[]).map(tab => {
                      const labels: Record<StatusTab, string> = { todas: "Todas", en_curso: "En Curso", finalizada: "Finalizadas", cancelada: "Canceladas" }
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          className={`h-7 px-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      )
                    })}
                  </div>

                  {/* Search */}
                  <div className="flex-1 h-8 flex items-center gap-2 px-3 rounded-md border shadow-sm border-[rgba(228,230,235,0.6)] bg-white">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar"
                      className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                    />
                  </div>

                  {/* Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowFilters(!showFilters); setShowSort(false) }}
                      className={`h-8 text-xs transition-colors border shadow-sm gap-1.5 shrink-0 px-3 rounded-md flex items-center cursor-pointer ${
                        hasActiveFilters ? "border-blue-400 text-blue-600 bg-blue-50" : "border-[rgba(228,230,235,0.6)] hover:bg-gray-100"
                      }`}
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>Filtrar</span>
                    </button>
                    {showFilters && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                        <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-56 p-3 space-y-3">
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Estado</label>
                            <select
                              value={filters.estado}
                              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                              className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                            >
                              <option value="">Todos</option>
                              <option value="en_curso">En Curso</option>
                              <option value="finalizada">Finalizada</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Cliente</label>
                            <input
                              type="text"
                              value={filters.cliente}
                              onChange={(e) => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
                              placeholder="Nombre del cliente"
                              className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                            />
                          </div>
                          {hasActiveFilters && (
                            <button onClick={() => setFilters({ estado: "", cliente: "" })} className="w-full text-xs text-slate-500 hover:text-slate-700 py-1">
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="flex items-center border border-[rgba(228,230,235,0.6)] rounded-md overflow-hidden bg-white shadow-sm h-8">
                    <button
                      type="button"
                      onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                      className="px-2.5 h-full hover:bg-slate-50 transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer"
                      title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                    >
                      <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
                    </button>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as typeof sortField)}
                      className="appearance-none pl-2.5 pr-6 h-full text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700"
                    >
                      <option value="fecha">Fecha</option>
                      <option value="total">Total</option>
                      <option value="cliente">Cliente</option>
                    </select>
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
                        {/* TOP ROW: checkbox | id | fecha | estado | (spacer) | ver ticket | ⋮ */}
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
                            <span className="text-sm font-semibold text-slate-900 truncate">{venta.id}</span>
                          </div>
                          {/* Fecha */}
                          <div className="col-span-10 flex items-center justify-start px-3 border-r border-slate-200/70">
                            <span className="text-sm text-slate-600 truncate">
                              {formatVentaDateTime(venta.fecha, venta.hora)}
                            </span>
                          </div>
                          {/* Estado (was origen) */}
                          <div className="col-span-10 flex items-center justify-start px-3">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${estadoStyle.bg}`}>
                              <EstadoIcon className={`w-3 h-3 ${estadoStyle.text} shrink-0`} />
                              <span className={`text-xs font-medium ${estadoStyle.text}`}>{estadoStyle.label}</span>
                            </div>
                          </div>
                          <div className="col-span-38" />
                          {/* Ver ticket (was cliente) */}
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
                                <span className="text-xs font-medium text-slate-600">Ver ticket</span>
                              </button>
                            )}
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

                        {/* MIDDLE ROW: (spacer) | cliente pill (was estado) | cobro% | entrega% | (spacer) */}
                        <div className="grid grid-cols-100 min-h-[40px]">
                          <div className="col-span-4" />
                          {/* Cliente pill (was estado) */}
                          <div className="col-span-24 flex items-center justify-start px-3">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); if (venta.cliente.tipo === "cuenta") setViewingClienteId(venta.cliente.id) }}
                              className="text-sm font-semibold text-slate-700 truncate hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                            >
                              {getClienteNombre(venta)}
                            </button>
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
                          <div className="col-span-48" />
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

      {calendarOpen && (
        <RangeCalendarDialog
          initialRange={customRange}
          onCancel={() => setCalendarOpen(false)}
          onApply={(start, end) => {
            setCustomRange({ start, end })
            setPeriodKey("personalizado")
            setCalendarOpen(false)
          }}
        />
      )}
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
