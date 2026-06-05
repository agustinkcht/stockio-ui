"use client"

import { useState, useEffect, useRef, useMemo, Fragment, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
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
  X,
  Copy,
  Receipt,
  Trash2,
  ExternalLink,
} from "lucide-react"
import type { Presupuesto, VentaItem, EstadoPresupuesto } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { ClienteModal } from "@/components/ventas/cliente-modal"
import { usePresupuestos } from "@/hooks/use-presupuestos"
import { useVentaStockSync } from "@/hooks/use-venta-stock-sync"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadPresupuestosPDF } from "@/lib/utils/generate-presupuesto-pdf"
import { buildVentaFromPresupuesto } from "@/lib/utils/presupuesto-to-venta"
import {
  PERIOD_OPTIONS,
  ACTIVE_PERIOD_KEYS,
  usePeriod,
  usePeriodRange,
  type PeriodKey,
} from "@/lib/contexts/period-context"

type StatusTab = "todas" | "borrador" | "aceptado" | "rechazado"

const estadoConfig: Record<EstadoPresupuesto, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  borrador:  { bg: "bg-slate-100",   text: "text-slate-600",   icon: Clock,        label: "Borrador"  },
  aceptado:  { bg: "bg-emerald-50",  text: "text-emerald-600", icon: CheckCircle2, label: "Aceptado"  },
  rechazado: { bg: "bg-red-50",      text: "text-red-500",     icon: XCircle,      label: "Rechazado" },
}

const monthsAbbr = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

const CURRENT_YEAR = new Date().getFullYear()

function formatPresupuestoDateTime(dateStr: string, hora: string): string {
  const date = new Date(dateStr + "T12:00:00")
  if (isNaN(date.getTime())) return dateStr
  const day = date.getDate()
  const month = monthsAbbr[date.getMonth()]
  const year = date.getFullYear()
  const horaStr = `${hora}\u00A0hs`
  return year < CURRENT_YEAR
    ? `${day}\u00A0${month}\u00A0${year}\u00A0\u00A0${horaStr}`
    : `${day}\u00A0${month}\u00A0\u00A0${horaStr}`
}

function getClienteNombre(p: Presupuesto): string {
  return p.cliente.tipo === "cuenta" ? p.cliente.nombre : "Consumidor Final"
}

export default function PresupuestosPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const allCheckboxRef = useRef<HTMLInputElement>(null)
  const { presupuestos, deletePresupuesto, updatePresupuesto, updateEstado } = usePresupuestos()
  const { addVenta } = useVentaStockSync()
  const { miNegocio, dashboard } = useSettings()

  const { periodKey, customRange, setPeriodKey, setCustomRange } = usePeriod()
  const [periodOpen, setPeriodOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const range = usePeriodRange()

  // Central URL param updater
  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  // Period — ?periodo=
  const periodParam = searchParams.get("periodo")
  const noPeriod = periodParam === "ninguno" || periodParam === null

  const defaultApplied = useRef(false)
  useEffect(() => {
    if (!defaultApplied.current && periodParam === null) {
      defaultApplied.current = true
      updateParam("periodo", dashboard.periodoDefault ?? "mes_en_curso")
    } else if (periodParam !== null) {
      defaultApplied.current = true
    }
  }, [periodParam, dashboard.periodoDefault, updateParam])

  const periodLabel = useMemo(() => {
    if (noPeriod || !periodParam) return "Período"
    return PERIOD_OPTIONS.find((o) => o.key === periodKey)?.label ?? "Período"
  }, [periodKey, noPeriod, periodParam])

  const rangeLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    if (periodKey === "hoy") return fmt(range.start)
    return `${fmt(range.start)} — ${fmt(range.end)}`
  }, [range, periodKey])

  const periodTagLabel = useMemo(() => {
    if (noPeriod || !periodParam) return null
    const cy = new Date().getFullYear()
    const fmt = (d: Date, withYear: boolean) => {
      const day = d.getDate()
      const month = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "").toLowerCase()
      return withYear ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`
    }
    const bothCurrentYear = range.start.getFullYear() === cy && range.end.getFullYear() === cy
    const withYear = !bothCurrentYear
    if (periodKey === "hoy") return fmt(range.start, withYear)
    return `${fmt(range.start, withYear)} - ${fmt(range.end, withYear)}`
  }, [noPeriod, periodParam, periodKey, range])

  // Sync ?periodo= param into shared period context
  useEffect(() => {
    if (!noPeriod && periodParam && periodParam !== "personalizado" && periodParam !== periodKey) {
      setPeriodKey(periodParam as PeriodKey)
    }
  }, [periodParam, noPeriod])

  const isActivePeriod = !noPeriod && periodParam !== null && ACTIVE_PERIOD_KEYS.includes(periodKey)

  // Search — ?q=
  const searchQuery = searchParams.get("q") ?? ""
  const setSearchQuery = useCallback((val: string) => updateParam("q", val || null), [updateParam])

  // Tab (widget filter) — ?tab=
  const activeTab = (searchParams.get("tab") ?? "todas") as StatusTab
  const setActiveTab = useCallback((val: StatusTab) => updateParam("tab", val === "todas" ? null : val), [updateParam])

  // Filters — ?cliente=
  const filterCliente = searchParams.get("cliente") ?? ""
  const setFilterCliente = useCallback((val: string) => updateParam("cliente", val || null), [updateParam])
  const hasActiveFilters = !!filterCliente

  // Sort — ?sort=field_dir
  const sortParam = searchParams.get("sort") ?? "fecha_desc"
  const [sortField, sortDir] = sortParam.split("_") as ["fecha" | "total", "asc" | "desc"]
  const setSortField = useCallback((val: "fecha" | "total") => {
    const newParam = `${val}_${sortDir}`
    updateParam("sort", newParam === "fecha_desc" ? null : newParam)
  }, [updateParam, sortDir])
  const setSortDir = useCallback((updater: ((prev: "asc" | "desc") => "asc" | "desc") | "asc" | "desc") => {
    const newDir = typeof updater === "function" ? updater(sortDir) : updater
    const newParam = `${sortField}_${newDir}`
    updateParam("sort", newParam === "fecha_desc" ? null : newParam)
  }, [updateParam, sortField, sortDir])

  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const [selectedPresupuestos, setSelectedPresupuestos] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)

  const [expandedPresupuestos, setExpandedPresupuestos] = useState<Set<string>>(new Set())
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [viewingClienteId, setViewingClienteId] = useState<string | null>(null)

  // Unique clientes for filter dropdown
  const uniqueClientes = useMemo(() => {
    const names = presupuestos
      .map(p => getClienteNombre(p))
      .filter(n => n !== "Consumidor Final")
    return Array.from(new Set(names)).sort()
  }, [presupuestos])

  // Helper: "1 de junio"
  const fmtDay = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "long" })

  // Widget subtitles
  const subtitleCreadas = !noPeriod && periodParam
    ? isActivePeriod
      ? `Creadas desde el ${fmtDay(range.start)} hasta hoy`
      : "Creadas en el período seleccionado"
    : null
  const subtitleBorrador = !noPeriod && periodParam
    ? isActivePeriod
      ? "Pendientes al día de hoy, sin importar su fecha de creación"
      : "Pendientes al día de hoy, creadas en el período seleccionado"
    : null

  // Period-scoped presupuestos filtered by creation date
  const periodPresupuestosByDate = useMemo(() => {
    if (noPeriod) return presupuestos
    const rangeStart = range.start.getTime()
    const rangeEnd = range.end.getTime()
    return presupuestos.filter(p => {
      const t = new Date(p.fecha + "T12:00:00").getTime()
      return t >= rangeStart && t <= rangeEnd
    })
  }, [presupuestos, noPeriod, range])

  // Filtered + sorted list
  const filteredPresupuestos = useMemo(() => {
    const rangeStart = range.start.getTime()
    const rangeEnd = range.end.getTime()
    const filtered = presupuestos.filter(p => {
      const pTime = new Date(p.fecha + "T12:00:00").getTime()
      const matchesPeriod = noPeriod || (pTime >= rangeStart && pTime <= rangeEnd)
      const matchesTab =
        activeTab === "todas" ? true :
        activeTab === "borrador" ? p.estado === "borrador" :
        activeTab === "aceptado" ? p.estado === "aceptado" :
        p.estado === "rechazado"
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || p.id.toLowerCase().includes(q) || getClienteNombre(p).toLowerCase().includes(q)
      const matchesCliente = !filterCliente || getClienteNombre(p) === filterCliente
      return matchesPeriod && matchesTab && matchesSearch && matchesCliente
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
  }, [presupuestos, range, noPeriod, activeTab, searchQuery, filterCliente, sortField, sortDir, searchParams])

  const allSelected = selectedPresupuestos.size === filteredPresupuestos.length && filteredPresupuestos.length > 0
  const someSelected = selectedPresupuestos.size > 0 && selectedPresupuestos.size < filteredPresupuestos.length

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedPresupuestos(new Set())
    } else {
      setSelectedPresupuestos(new Set(filteredPresupuestos.map((p) => p.id)))
    }
  }

  const toggleSelectPresupuesto = (id: string) => {
    const next = new Set(selectedPresupuestos)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPresupuestos(next)
  }

  const toggleExpandPresupuesto = (id: string) => {
    const next = new Set(expandedPresupuestos)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedPresupuestos(next)
  }

  // Modals
  const [aceptarTarget, setAceptarTarget] = useState<Presupuesto | null>(null)
  const [eliminarTarget, setEliminarTarget] = useState<Presupuesto | null>(null)
  const [rechazarTarget, setRechazarTarget] = useState<Presupuesto | null>(null)

  const handleAceptar = (p: Presupuesto) => {
    setAceptarTarget(p)
  }

  const handleConfirmAceptar = () => {
    if (!aceptarTarget) return
    const now = new Date()
    const fecha = now.toISOString().slice(0, 10)
    const hora = now.toTimeString().slice(0, 5)
    const venta = addVenta(buildVentaFromPresupuesto(aceptarTarget, fecha, hora))
    updatePresupuesto(aceptarTarget.id, { estado: "aceptado", ventaId: venta.id })
    setAceptarTarget(null)
    router.push(`/ventas/ventas/${venta.id}`)
  }

  const breadcrumbs = [{ label: "Ventas" }, { label: "Presupuestos", href: "/ventas/presupuestos" }]

  const tabs: { id: StatusTab; label: string }[] = [
    { id: "todas",     label: "Todas"       },
    { id: "aceptado",  label: "Aceptados"   },
    { id: "borrador",  label: "En Borrador" },
    { id: "rechazado", label: "Rechazados"  },
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
            {/* Scroll container */}
            <div className="flex-1 overflow-y-auto bg-slate-50">

              {/* Title row — scrolls away */}
              <div className="px-8 pt-12 pb-8">
                <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                      Presupuestos
                    </h1>
                    <PresupuestosPeriodSelector
                      open={periodOpen}
                      setOpen={setPeriodOpen}
                      currentLabel={periodLabel}
                      currentKey={periodKey}
                      noPeriod={noPeriod}
                      isActivePeriod={isActivePeriod}
                      onSelect={(k) => {
                        if (k === ("ninguno" as PeriodKey)) {
                          updateParam("periodo", "ninguno")
                          setPeriodOpen(false)
                          return
                        }
                        if (k === "personalizado") {
                          updateParam("periodo", "personalizado")
                          setPeriodOpen(false)
                          setCalendarOpen(true)
                          return
                        }
                        updateParam("periodo", k)
                        setPeriodKey(k)
                        setCustomRange(null)
                        setPeriodOpen(false)
                      }}
                      rangeLabel={rangeLabel}
                      calendarOpen={calendarOpen}
                      setCalendarOpen={setCalendarOpen}
                      customRange={customRange}
                      setCustomRange={setCustomRange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/ventas/presupuestos/nuevo")}
                    className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 shrink-0 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer mt-1"
                  >
                    <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                    Nuevo Presupuesto
                  </button>
                </div>
              </div>

              {/* Widgets */}
              <div className="px-8 pb-3">
                <div className="max-w-6xl mx-auto">
                  {(() => {
                    const countAceptados   = periodPresupuestosByDate.filter(p => p.estado === "aceptado").length
                    const countBorrador    = periodPresupuestosByDate.filter(p => p.estado === "borrador").length
                    const countRechazados  = periodPresupuestosByDate.filter(p => p.estado === "rechazado").length

                    const widgetCls = (active: boolean, disabled: boolean, activeColor: string, hoverColor: string) => {
                      if (disabled) return "border rounded-xl px-6 py-5 shadow-sm text-left border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed w-full"
                      if (active) return `border rounded-xl px-6 py-5 shadow-sm text-left transition-all cursor-pointer w-full ${activeColor}`
                      return `border rounded-xl px-6 py-5 shadow-sm text-left transition-all cursor-pointer w-full bg-white border-slate-200/80 ${hoverColor}`
                    }

                    const toggle = (tab: StatusTab, count: number) => {
                      if (count === 0) return
                      setActiveTab(activeTab === tab ? "todas" : tab)
                    }

                    return (
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {/* Aceptados */}
                        <button
                          key="aceptados"
                          type="button"
                          onClick={() => toggle("aceptado", countAceptados)}
                          className={widgetCls(activeTab === "aceptado", countAceptados === 0, "bg-emerald-50 border-emerald-200", "hover:border-emerald-200 hover:shadow-md")}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">{countAceptados}</span>
                            <span className="text-base font-medium text-emerald-500">Aceptados</span>
                          </div>
                          {subtitleCreadas && (
                            <p className="mt-2 text-xs text-slate-400 leading-snug">{subtitleCreadas}</p>
                          )}
                        </button>

                        {/* En Borrador */}
                        <button
                          key="borrador"
                          type="button"
                          onClick={() => toggle("borrador", countBorrador)}
                          className={widgetCls(activeTab === "borrador", countBorrador === 0, "bg-slate-100 border-slate-300", "hover:border-slate-300 hover:shadow-md")}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Clock className="w-5 h-5 text-slate-500" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">{countBorrador}</span>
                            <span className="text-base font-medium text-slate-500">En Borrador</span>
                          </div>
                          {subtitleBorrador && (
                            <p className="mt-2 text-xs text-slate-400 leading-snug">{subtitleBorrador}</p>
                          )}
                        </button>

                        {/* Rechazados */}
                        <button
                          key="rechazados"
                          type="button"
                          onClick={() => toggle("rechazado", countRechazados)}
                          className={widgetCls(activeTab === "rechazado", countRechazados === 0, "bg-red-50 border-red-200", "hover:border-red-200 hover:shadow-md")}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <XCircle className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">{countRechazados}</span>
                            <span className="text-base font-medium text-red-400">Rechazados</span>
                          </div>
                          {subtitleCreadas && (
                            <p className="mt-2 text-xs text-slate-400 leading-snug">{subtitleCreadas}</p>
                          )}
                        </button>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Search/filter bar + bulk actions — sticky */}
              <div className="sticky top-0 z-20">

                {/* Row 1: Search + tags + Filtrar/Ordenar */}
                <div className="relative z-10 bg-slate-50/95 backdrop-blur-sm px-8 py-2">
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2">
                      {/* Search input */}
                      <div className="flex items-center h-9 border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md min-w-0 overflow-hidden bg-white">
                        <div className="flex items-center gap-2 px-3 h-full w-64 bg-white">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar"
                            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              aria-label="Borrar búsqueda"
                              className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                            >
                              <X className="w-3 h-3 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {calendarOpen && (
                        <PresupuestosRangeCalendarDialog
                          initialRange={customRange}
                          onCancel={() => setCalendarOpen(false)}
                          onApply={(start, end) => {
                            setCustomRange({ start, end })
                            setPeriodKey("personalizado")
                            setCalendarOpen(false)
                          }}
                        />
                      )}

                      {/* Active filter tags */}
                      {(periodTagLabel || activeTab !== "todas" || filterCliente) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Período tag */}
                          {periodTagLabel && (
                            <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                              {periodTagLabel}
                              <button
                                type="button"
                                onClick={() => updateParam("periodo", "ninguno")}
                                aria-label="Quitar filtro de período"
                                className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5 text-slate-400" />
                              </button>
                            </span>
                          )}
                          {/* Widget tag */}
                          {activeTab !== "todas" && (
                            <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                              {tabs.find(t => t.id === activeTab)?.label}
                              <button
                                type="button"
                                onClick={() => setActiveTab("todas")}
                                aria-label="Quitar filtro de estado"
                                className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5 text-slate-400" />
                              </button>
                            </span>
                          )}
                          {/* Cliente tag */}
                          {filterCliente && (
                            <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                              {filterCliente}
                              <button
                                type="button"
                                onClick={() => setFilterCliente("")}
                                aria-label="Quitar filtro de cliente"
                                className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5 text-slate-400" />
                              </button>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Filtrar / Ordenar + results count — pushed right */}
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
                              <div className="fixed inset-0 z-[90]" onClick={() => setFilterOpen(false)} />
                              <div className="absolute top-full right-0 mt-1 z-[100] bg-white border border-slate-200 rounded-lg shadow-lg w-60 p-3 space-y-3">
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
                                {hasActiveFilters && (
                                  <button
                                    type="button"
                                    onClick={() => { setFilterCliente("") }}
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
                            onChange={(e) => setSortField(e.target.value as "fecha" | "total")}
                            className="appearance-none pl-2.5 pr-2.5 text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700 h-full w-auto"
                          >
                            <option value="fecha">Fecha</option>
                            <option value="total">Total</option>
                          </select>
                        </div>

                        {/* Divider + results count */}
                        <div className="w-px h-5 bg-slate-200 shrink-0" />
                        <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {filteredPresupuestos.length} {filteredPresupuestos.length === 1 ? "presupuesto" : "presupuestos"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Bulk actions */}
                <div className="px-8">
                  <div className="max-w-6xl mx-auto bg-white border border-slate-200/80 rounded-b-md">
                    <div className="flex items-center gap-2 h-9">
                      <div className="flex items-center justify-center w-[4%] min-w-[40px] shrink-0">
                        <input
                          ref={allCheckboxRef}
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          aria-label={allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                          className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="w-px h-5 bg-slate-200 shrink-0" />
                      {selectedPresupuestos.size === 0 ? (
                        <span className="text-xs text-slate-400 select-none">
                          Seleccioná presupuestos para accionar masivamente
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-slate-600 whitespace-nowrap tabular-nums">
                            {selectedPresupuestos.size} seleccionado{selectedPresupuestos.size !== 1 ? "s" : ""}
                          </span>
                          <div className="w-px h-5 bg-slate-200 shrink-0" />
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            onClick={() => {
                              const selected = presupuestos.filter(p => selectedPresupuestos.has(p.id))
                              downloadPresupuestosPDF(selected, miNegocio)
                            }}
                          >
                            <FileDown className="w-3.5 h-3.5 text-slate-400" />
                            Descargar PDF
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>{/* /sticky */}

              {/* Rows */}
              <div className="px-8 pt-2 pb-8">
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-col gap-2">
                    {filteredPresupuestos.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <p className="text-sm">No hay presupuestos para mostrar</p>
                      </div>
                    )}
                    {filteredPresupuestos.map((presupuesto) => {
                      const estadoStyle = estadoConfig[presupuesto.estado] ?? estadoConfig["borrador"]
                      const EstadoIcon = estadoStyle.icon
                      const isSelected = selectedPresupuestos.has(presupuesto.id)
                      const isMulti = presupuesto.items.length > 1
                      const firstItem: VentaItem | undefined = presupuesto.items[0]

                      return (
                        <div
                          key={presupuesto.id}
                          onClick={() => router.push(`/ventas/presupuestos/${presupuesto.id}`)}
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
                              onClick={(e) => { e.stopPropagation(); toggleSelectPresupuesto(presupuesto.id) }}
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
                              <span className="text-sm font-semibold text-slate-900 shrink-0">{presupuesto.id}</span>
                            </div>
                            {/* Fecha */}
                            <div className="col-span-14 flex items-center justify-start px-3 border-r border-slate-200/70">
                              <span className="text-sm text-slate-600 truncate">
                                {formatPresupuestoDateTime(presupuesto.fecha, presupuesto.hora)}
                              </span>
                            </div>
                            {/* Ver venta relacionada */}
                            <div className="col-span-54 flex items-center px-3">
                              {presupuesto.estado === "aceptado" && presupuesto.ventaId && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/ventas/ventas/${presupuesto.ventaId}`) }}
                                  className="flex items-center gap-1.5 text-sm text-slate-500 underline underline-offset-2 hover:text-slate-700 transition-colors cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  Ver venta relacionada
                                </button>
                              )}
                            </div>
                            {/* Cliente pill */}
                            <div className="col-span-14 flex items-center justify-end pr-3 border-r border-slate-200/70">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); if (presupuesto.cliente.tipo === "cuenta") setViewingClienteId(presupuesto.cliente.id) }}
                                className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 shadow-sm"
                              >
                                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-white uppercase">{getClienteNombre(presupuesto).charAt(0)}</span>
                                </div>
                                <span className="text-xs text-slate-700 whitespace-nowrap">{getClienteNombre(presupuesto)}</span>
                              </button>
                            </div>
                            <div
                              className="col-span-4 flex items-center justify-center border-l border-slate-200/70 relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => setOpenMoreMenu(openMoreMenu === presupuesto.id ? null : presupuesto.id)}
                                aria-label="Más opciones"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMoreMenu === presupuesto.id && (
                                <div
                                  className="absolute top-full right-2 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[210px]"
                                  onMouseLeave={() => setOpenMoreMenu(null)}
                                >
                                  {presupuesto.estado === "borrador" && (
                                    <button
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                                      onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); handleAceptar(presupuesto) }}
                                    >
                                      <Receipt className="w-4 h-4 text-emerald-500" />
                                      Aceptar y llevar a ventas
                                    </button>
                                  )}
                                  {presupuesto.estado === "borrador" && (
                                    <button
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                      onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); setRechazarTarget(presupuesto) }}
                                    >
                                      <XCircle className="w-4 h-4 text-slate-400" />
                                      Marcar como rechazado
                                    </button>
                                  )}
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                    onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); downloadPresupuestosPDF([presupuesto], miNegocio) }}
                                  >
                                    <FileDown className="w-4 h-4 text-slate-400" />
                                    Descargar PDF
                                  </button>
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                    onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); router.push(`/ventas/presupuestos/nuevo?duplicar=${presupuesto.id}`) }}
                                  >
                                    <Copy className="w-4 h-4 text-slate-400" />
                                    Duplicar presupuesto
                                  </button>
                                  {presupuesto.estado === "borrador" && (
                                    <button
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                      onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); setEliminarTarget(presupuesto) }}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                      Eliminar presupuesto
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* MIDDLE ROW */}
                          <div className="flex items-center gap-3 py-1.5" style={{ paddingLeft: "calc(4% + 12px)", paddingRight: "calc(4% + 12px)" }}>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full shrink-0 ${estadoStyle.bg}`}>
                              <EstadoIcon className={`w-3.5 h-3.5 ${estadoStyle.text}`} />
                              <span className={`text-sm font-medium ${estadoStyle.text}`}>{estadoStyle.label}</span>
                            </div>
                          </div>

                          {/* BOTTOM ROW */}
                          {(() => {
                            const isExpanded = expandedPresupuestos.has(presupuesto.id) && isMulti
                            const totalUnits = presupuesto.items.reduce((sum, it) => sum + it.quantity, 0)
                            const lastItemIdx = presupuesto.items.length - 1
                            const firstItemDisplay = firstItem ? getVentaItemDisplay(firstItem) : null

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

                            return (
                              <div className="grid grid-cols-100 pt-1 pb-2" onClick={(e) => e.stopPropagation()}>
                                <div className="col-span-4" />

                                {/* ITEM cell */}
                                <div className={`col-span-32 bg-slate-50 ${isExpanded ? "rounded-tl-md" : "rounded-l-md"} py-2.5 pl-3 pr-2 flex items-center gap-2`}>
                                  {isMulti && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleExpandPresupuesto(presupuesto.id) }}
                                      className="p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-colors shrink-0"
                                      aria-label={isExpanded ? "Colapsar productos" : "Expandir productos"}
                                    >
                                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                  )}

                                  {isMulti ? (
                                    <>
                                      <div className="flex items-center -space-x-2 shrink-0">
                                        {presupuesto.items.slice(0, 3).map((it, idx) => (
                                          <div
                                            key={`${presupuesto.id}-thumb-${idx}`}
                                            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                                            style={{ zIndex: 10 - idx }}
                                          >
                                            <img src={getCategoryImage(it.categoria) || "/placeholder.svg"} alt={it.categoria || "Producto"} className="w-5 h-5 object-contain opacity-70" />
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-sm font-semibold text-slate-800 truncate">{presupuesto.items.length} productos</span>
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
                                  <span className="text-sm font-semibold text-slate-800">Total: ${presupuesto.total.toLocaleString("es-AR")}</span>
                                </div>
                                <div className="col-span-4" />

                                {/* Expanded item rows */}
                                {isExpanded && presupuesto.items.map((item, idx) => {
                                  const isLast = idx === lastItemIdx
                                  const itemDisplay = getVentaItemDisplay(item)
                                  return (
                                    <Fragment key={`${presupuesto.id}-exp-${idx}`}>
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

      {/* Aceptar y llevar a ventas Modal */}
      {aceptarTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAceptarTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Aceptar y llevar a ventas</h3>
              </div>
              <p className="text-sm text-slate-500 mt-2 ml-12">
                El presupuesto <span className="font-semibold text-slate-800">{aceptarTarget.id}</span> se marcará como <span className="font-semibold text-emerald-700">aceptado</span> y se creará una nueva venta asociada al mismo.
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setAceptarTarget(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAceptar}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Aceptar y crear venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marcar como rechazado Modal */}
      {rechazarTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRechazarTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Marcar como rechazado</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"El presupuesto "}
                <span className="font-semibold text-slate-900">{rechazarTarget.id}</span>
                {" se marcará como rechazado."}
              </p>
            </div>
            <div className="px-5 py-4 flex gap-2 justify-end">
              <button onClick={() => setRechazarTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { updateEstado(rechazarTarget.id, "rechazado"); setRechazarTarget(null) }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Marcar como rechazado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eliminar Presupuesto Modal */}
      {eliminarTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEliminarTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Eliminar presupuesto</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"¿Seguro que querés eliminar el presupuesto "}
                <span className="font-semibold text-slate-900">{eliminarTarget.id}</span>
                {"? Esta acción es irreversible."}
              </p>
            </div>
            <div className="px-5 py-4 flex gap-2 justify-end">
              <button onClick={() => setEliminarTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  deletePresupuesto(eliminarTarget.id)
                  setSelectedPresupuestos(prev => { const next = new Set(prev); next.delete(eliminarTarget.id); return next })
                  setEliminarTarget(null)
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Eliminar presupuesto
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingItem && (
        <VentaItemDetailModal ventaItem={viewingItem} onClose={() => setViewingItem(null)} />
      )}
      {viewingClienteId && (
        <ClienteModal clienteId={viewingClienteId} onClose={() => setViewingClienteId(null)} />
      )}
    </div>
  )
}

/* ─── Period Selector ───────────────────────────────────────────────────────── */

function PresupuestosPeriodSelector({
  open,
  setOpen,
  currentLabel,
  currentKey,
  noPeriod,
  isActivePeriod,
  onSelect,
  rangeLabel,
  calendarOpen,
  setCalendarOpen,
  customRange,
  setCustomRange,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  currentLabel: string
  currentKey: PeriodKey
  noPeriod: boolean
  isActivePeriod: boolean
  onSelect: (k: PeriodKey) => void
  rangeLabel: string
  calendarOpen: boolean
  setCalendarOpen: (v: boolean) => void
  customRange: { start: Date; end: Date } | null
  setCustomRange: (r: { start: Date; end: Date } | null) => void
}) {
  const activePeriodKeys: PeriodKey[] = ["hoy", "mes_en_curso", "ano_en_curso"]
  const periodicalKeys: PeriodKey[] = ["7d", "30d", "ultimo_ano", "personalizado"]
  const activeOptions = PERIOD_OPTIONS.filter(o => activePeriodKeys.includes(o.key))
  const periodicalOptions = PERIOD_OPTIONS.filter(o => periodicalKeys.includes(o.key))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 rounded-full border bg-white hover:border-slate-300 transition-colors cursor-pointer ${
          noPeriod ? "border-slate-200 text-slate-400 py-1.5" : "border-slate-300 text-slate-700 py-1"
        }`}
      >
        <div className="flex flex-col items-start">
          {!noPeriod && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Período</span>
          )}
          <div className="flex items-center gap-1.5">
            {isActivePeriod && (
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            <span className={noPeriod ? "text-sm font-medium" : "text-sm font-semibold text-slate-800"}>{currentLabel}</span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[100] animate-in fade-in-0 slide-in-from-top-1 duration-150">
            {/* Ninguno */}
            <button
              type="button"
              onClick={() => onSelect("ninguno" as PeriodKey)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                noPeriod ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Ninguno
            </button>
            {/* Active group */}
            <div className="px-4 pt-2 pb-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">En curso</span>
            </div>
            {activeOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelect(opt.key)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer flex items-center justify-between ${
                  !noPeriod && currentKey === opt.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{opt.label}</span>
                {!noPeriod && currentKey === opt.key && (
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                )}
              </button>
            ))}
            {/* Periodical group */}
            <div className="mx-4 my-1 h-px bg-slate-100" />
            <div className="px-4 pt-1 pb-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Período fijo</span>
            </div>
            {periodicalOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelect(opt.key)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                  !noPeriod && currentKey === opt.key
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

function PresupuestosRangeCalendarDialog({
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
