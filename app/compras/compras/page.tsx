"use client"

import { useState, useEffect, useRef, useMemo, Fragment, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import {
  ChevronLeft,
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
  Package,
  Copy,
} from "lucide-react"
import type { Compra, CompraItem, VentaItem } from "@/lib/types"
import { getItemPhoto } from "@/lib/utils/category-images"
import { useCompras } from "@/hooks/use-compras"
import { ProveedorModal } from "@/components/compras/proveedor-modal"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { PROVEEDORES } from "@/lib/data/proveedores"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadComprasPDF } from "@/lib/utils/generate-compra-pdf"
import {
  PERIOD_OPTIONS,
  ACTIVE_PERIOD_KEYS,
  usePeriod,
  usePeriodRange,
  type PeriodKey,
} from "@/lib/contexts/period-context"

type StatusTab = "todas" | "finalizada" | "en_curso" | "cancelada"

const estadoConfig: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  finalizada: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2, label: "Finalizada" },
  en_curso:   { bg: "bg-amber-50",   text: "text-amber-600",   icon: Clock,        label: "En Curso"   },
  cancelada:  { bg: "bg-red-50",     text: "text-red-500",     icon: XCircle,      label: "Cancelada"  },
}

const tabs = [
  { id: "finalizada" as StatusTab, label: "Finalizadas" },
  { id: "en_curso"   as StatusTab, label: "En Curso"    },
  { id: "cancelada"  as StatusTab, label: "Canceladas"  },
]

const monthsAbbr = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const CURRENT_YEAR = new Date().getFullYear()

function formatCompraDateTime(dateStr: string, hora: string): string {
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

export default function ComprasPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const allCheckboxRef = useRef<HTMLInputElement>(null)
  const { compras } = useCompras()
  const { miNegocio, dashboard } = useSettings()

  const handleBulkDownloadPDF = () => {
    const selected = compras.filter(c => selectedCompras.has(c.id))
    if (selected.length > 0) downloadComprasPDF(selected, miNegocio)
  }
  const handleRowDownloadPDF = (compra: Compra) => downloadComprasPDF([compra], miNegocio)

  const { periodKey, customRange, setPeriodKey, setCustomRange } = usePeriod()
  const [periodOpen, setPeriodOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const range = usePeriodRange()

  const [selectedCompras, setSelectedCompras] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)
  const [expandedCompras, setExpandedCompras] = useState<Set<string>>(new Set())
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [viewingProveedorId, setViewingProveedorId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

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

  // Period
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

  // Search
  const searchQuery = searchParams.get("q") ?? ""
  const setSearchQuery = useCallback((val: string) => updateParam("q", val || null), [updateParam])

  // Tab
  const activeTab = (searchParams.get("tab") ?? "todas") as StatusTab
  const setActiveTab = useCallback((val: StatusTab) => updateParam("tab", val === "todas" ? null : val), [updateParam])

  // Filters
  const filterProveedor = searchParams.get("proveedor") ?? ""
  const setFilterProveedor = useCallback((val: string) => updateParam("proveedor", val || null), [updateParam])
  const filterPendientePago = searchParams.get("pago") === "1"
  const setFilterPendientePago = useCallback((val: boolean) => updateParam("pago", val ? "1" : null), [updateParam])
  const filterPendienteRecepcion = searchParams.get("recepcion") === "1"
  const setFilterPendienteRecepcion = useCallback((val: boolean) => updateParam("recepcion", val ? "1" : null), [updateParam])
  const hasActiveFilters = !!filterProveedor || filterPendientePago || filterPendienteRecepcion

  // Sort
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

  // Sync ?periodo= into shared period context
  useEffect(() => {
    if (!noPeriod && periodParam && periodParam !== "personalizado" && periodParam !== periodKey) {
      setPeriodKey(periodParam as PeriodKey)
    }
  }, [periodParam, noPeriod])

  const isActivePeriod = !noPeriod && periodParam !== null && ACTIVE_PERIOD_KEYS.includes(periodKey)

  // Period-scoped compras by creation date
  const periodComprasByDate = useMemo(() => {
    if (noPeriod) return compras
    const rangeStart = range.start.getTime()
    const rangeEnd   = range.end.getTime()
    return compras.filter(c => {
      const t = new Date(c.fecha + "T12:00:00").getTime()
      return t >= rangeStart && t <= rangeEnd
    })
  }, [compras, noPeriod, range])

  // For en_curso widget: active period = all en_curso; fixed = date-filtered
  const periodComprasEnCurso = useMemo(() => {
    if (noPeriod) return compras
    if (isActivePeriod) return compras
    return periodComprasByDate
  }, [compras, noPeriod, isActivePeriod, periodComprasByDate])

  const periodCompras = periodComprasByDate

  // Unique proveedores for filter dropdown
  const uniqueProveedores = useMemo(() => {
    const names = compras.map(c => c.proveedorNombre)
    return Array.from(new Set(names)).sort()
  }, [compras])

  // Filtered + sorted list (period applied here)
  const filteredCompras = useMemo(() => {
    const rangeStart = range.start.getTime()
    const rangeEnd   = range.end.getTime()
    const filtered = compras.filter(c => {
      const compraTime = new Date(c.fecha + "T12:00:00").getTime()
      // en_curso items are always shown when on an active period ("sin importar su fecha de creación")
      const isEnCurso = c.estado === "en_curso"
      const matchesPeriod = noPeriod || (isActivePeriod && isEnCurso) || (compraTime >= rangeStart && compraTime <= rangeEnd)
      const matchesTab =
        activeTab === "todas"     ? true :
        activeTab === "finalizada" ? c.estado === "finalizada" :
        activeTab === "en_curso"   ? c.estado === "en_curso"   :
        c.estado === "cancelada"
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || c.id.toLowerCase().includes(q) || c.proveedorNombre.toLowerCase().includes(q)
      const matchesProveedor = !filterProveedor || c.proveedorNombre === filterProveedor
      const matchesPendientePago = !filterPendientePago || c.estado === "en_curso"
      const matchesPendienteRecepcion = !filterPendienteRecepcion || (c.pendienteEntrega === true)
      return matchesPeriod && matchesTab && matchesSearch && matchesProveedor && matchesPendientePago && matchesPendienteRecepcion
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
  }, [compras, activeTab, searchQuery, filterProveedor, filterPendientePago, filterPendienteRecepcion, sortField, sortDir, noPeriod, isActivePeriod, range])

  const allSelected = selectedCompras.size === filteredCompras.length && filteredCompras.length > 0
  const someSelected = selectedCompras.size > 0 && selectedCompras.size < filteredCompras.length

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const toggleSelectAll = () => {
    if (allSelected) setSelectedCompras(new Set())
    else setSelectedCompras(new Set(filteredCompras.map((c) => c.id)))
  }

  const toggleSelectCompra = (id: string) => {
    const next = new Set(selectedCompras)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedCompras(next)
  }

  const toggleExpandCompra = (id: string) => {
    const next = new Set(expandedCompras)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedCompras(next)
  }

  const breadcrumbs = [{ label: "Compras" }, { label: "Compras", href: "/compras/compras" }]

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
          <div className="relative h-[44px] bg-transparent">
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
            <div className="flex-1 overflow-y-auto bg-panel-content">

              {/* Title row — scrolls away */}
              <div className="px-8 pt-12 pb-8">
                <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                      Compras
                    </h1>
                    <ComprasPeriodSelector
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
                    onClick={() => router.push("/compras/compras/nueva")}
                    className="h-9 px-4 text-sm font-semibold transition-colors gap-2 shrink-0 rounded-lg flex items-center bg-[#151721] text-white hover:bg-[#2A2C38] cursor-pointer mt-1"
                  >
                    <Plus className="w-4 h-4 text-white" strokeWidth={2.25} />
                    Nueva Compra
                  </button>
                </div>
              </div>

              {/* Widgets — scrolls freely */}
              <div className="px-8 pb-3">
                <div className="max-w-6xl mx-auto">
                  {(() => {
                    const countFinalizadas = periodCompras.filter(c => c.estado === "finalizada").length
                    const countEnCurso     = periodComprasEnCurso.filter(c => c.estado === "en_curso").length
                    const countCanceladas  = periodCompras.filter(c => c.estado === "cancelada").length

                    const widgetCls = (active: boolean, disabled: boolean, activeColor: string, hoverColor: string) => {
                      if (disabled) return "border rounded-xl px-6 py-5 shadow-sm text-left border-slate-100 bg-panel-content opacity-40 cursor-not-allowed w-full"
                      if (active)   return `border rounded-xl px-6 py-5 shadow-sm text-left transition-all cursor-pointer w-full ${activeColor}`
                      return `border rounded-xl px-6 py-5 shadow-sm text-left transition-all cursor-pointer w-full bg-white border-slate-200/80 ${hoverColor}`
                    }

                    const toggle = (tab: StatusTab, count: number) => {
                      if (count === 0) return
                      setActiveTab(activeTab === tab ? "todas" : tab)
                    }

                    const fmtDay = (d: Date) => {
                      const day = d.getDate()
                      const month = d.toLocaleDateString("es-AR", { month: "long" })
                      return `${day} de ${month}`
                    }
                    const subtitleFinCan = !noPeriod && periodParam
                      ? isActivePeriod
                        ? `Creadas desde el ${fmtDay(range.start)} hasta hoy`
                        : "Creadas en el período seleccionado"
                      : null

                    const subtitleEnCurso = !noPeriod && periodParam
                      ? isActivePeriod
                        ? "Pendientes al día de hoy, sin importar su fecha de creación"
                        : "Pendientes al día de hoy, creadas en el período seleccionado"
                      : null

                    return (
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {/* Finalizadas */}
                        <button
                          key="finalizadas"
                          type="button"
                          onClick={() => toggle("finalizada", countFinalizadas)}
                          className={widgetCls(activeTab === "finalizada", countFinalizadas === 0, "bg-emerald-50 border-emerald-200", "hover:border-emerald-200 hover:shadow-md")}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">{countFinalizadas}</span>
                            <span className="text-base font-medium text-emerald-500">Finalizadas</span>
                          </div>
                          {subtitleFinCan && (
                            <p className="mt-2 text-xs text-slate-400 leading-snug">{subtitleFinCan}</p>
                          )}
                        </button>

                        {/* En Curso */}
                        <button
                          key="en_curso"
                          type="button"
                          onClick={() => toggle("en_curso", countEnCurso)}
                          className={widgetCls(activeTab === "en_curso", countEnCurso === 0, "bg-orange-50 border-orange-200", "hover:border-orange-200 hover:shadow-md")}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Clock className="w-5 h-5 text-orange-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">{countEnCurso}</span>
                            <span className="text-base font-medium text-orange-500">En Curso</span>
                          </div>
                          {subtitleEnCurso && (
                            <p className="mt-2 text-xs text-slate-400 leading-snug">{subtitleEnCurso}</p>
                          )}
                        </button>

                        {/* Canceladas */}
                        <button
                          key="canceladas"
                          type="button"
                          onClick={() => toggle("cancelada", countCanceladas)}
                          className={widgetCls(activeTab === "cancelada", countCanceladas === 0, "bg-red-50 border-red-200", "hover:border-red-200 hover:shadow-md")}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <XCircle className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">{countCanceladas}</span>
                            <span className="text-base font-medium text-red-400">Canceladas</span>
                          </div>
                          {subtitleFinCan && (
                            <p className="mt-2 text-xs text-slate-400 leading-snug">{subtitleFinCan}</p>
                          )}
                        </button>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Search/filter bar + bulk actions — sticky */}
              <div className="sticky top-0 z-20">

                {/* Row 1: Search + tags + Filtrar/Ordenar + count */}
                <div className="relative z-10 bg-panel-content/95 backdrop-blur-sm px-8 pt-2 pb-0">
                  <div className="max-w-6xl mx-auto pb-2">
                    <div className="flex items-center gap-2">
                      {/* Search */}
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
                        <ComprasRangeCalendarDialog
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
                      {(periodTagLabel || activeTab !== "todas" || filterProveedor || filterPendientePago || filterPendienteRecepcion) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                          {filterProveedor && (
                            <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                              {filterProveedor}
                              <button
                                type="button"
                                onClick={() => setFilterProveedor("")}
                                aria-label="Quitar filtro de proveedor"
                                className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5 text-slate-400" />
                              </button>
                            </span>
                          )}
                        {filterPendientePago && (
                          <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                            Pago pendiente
                            <button type="button" onClick={() => setFilterPendientePago(false)} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                              <X className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          </span>
                        )}
                        {filterPendienteRecepcion && (
                          <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                            Recepción pendiente
                            <button type="button" onClick={() => setFilterPendienteRecepcion(false)} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                              <X className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          </span>
                        )}
                        </div>
                      )}

                      {/* Filtrar / Ordenar + count — pushed right */}
                      <div className="ml-auto flex items-center gap-2">
                        {/* Filtrar */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
                            className={`h-9 text-xs transition-colors border shadow-sm gap-1.5 shrink-0 px-3 rounded-md flex items-center cursor-pointer ${
                              hasActiveFilters
                                ? "border-blue-400 text-blue-600 bg-blue-50"
                                : "border-[rgba(228,230,235,0.6)] bg-white hover:bg-panel-content"
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
                                {(activeTab === "todas" || activeTab === "en_curso") && (
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Estado</label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={filterPendientePago}
                                        onChange={(e) => setFilterPendientePago(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-xs text-slate-700">Pendiente de pago</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={filterPendienteRecepcion}
                                        onChange={(e) => setFilterPendienteRecepcion(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-xs text-slate-700">Pendiente de recepción</span>
                                    </label>
                                  </div>
                                )}
                                {hasActiveFilters && (
                                  <button
                                    type="button"
                                    onClick={() => { setFilterProveedor(""); setFilterPendientePago(false); setFilterPendienteRecepcion(false) }}
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
                            className="px-2.5 h-full hover:bg-panel-content transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer flex items-center"
                          >
                            <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
                          </button>
                          <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as "fecha" | "total")}
                            className="appearance-none pl-2.5 pr-6 text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700 h-full"
                          >
                            <option value="fecha">Fecha</option>
                            <option value="total">Total</option>
                          </select>
                        </div>

                        {/* Divider + count */}
                        <div className="w-px h-5 bg-slate-200 shrink-0" />
                        <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {filteredCompras.length} {filteredCompras.length === 1 ? "compra" : "compras"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Bulk actions */}
                <div className="px-8 bg-panel-content/95 backdrop-blur-sm pb-2">
                  <div className="max-w-6xl mx-auto bg-white border border-slate-200/80 rounded-lg">
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
                      {selectedCompras.size === 0 ? (
                        <span className="text-xs text-slate-400 select-none">
                          Seleccioná compras para accionar masivamente
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-slate-600 whitespace-nowrap tabular-nums">
                            {selectedCompras.size} seleccionada{selectedCompras.size !== 1 ? "s" : ""}
                          </span>
                          <div className="w-px h-5 bg-slate-200 shrink-0" />
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            onClick={handleBulkDownloadPDF}
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
                    {filteredCompras.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-24 gap-2">
                        <p className="text-xl font-medium text-slate-500">No hay compras para mostrar</p>
                        <p className="text-sm text-slate-400">Probá ajustando los filtros o el período seleccionado</p>
                      </div>
                    )}
                    {filteredCompras.map((compra) => {
                      const estadoStyle = estadoConfig[compra.estado] ?? estadoConfig["en_curso"]
                      const EstadoIcon = estadoStyle.icon
                      const isSelected = selectedCompras.has(compra.id)
                      const isMulti = compra.items.length > 1
                      const firstItem: CompraItem | undefined = compra.items[0]
                      const lastItemIdx = compra.items.length - 1
                      const totalUnits = compra.items.reduce((sum, it) => sum + it.quantity, 0)

                      const PrecioCell = ({ item, className = "" }: { item: CompraItem; className?: string }) => {
                        const hasDiscount = item.discount > 0
                        const adjustedUnit = hasDiscount && item.discountType === "percent"
                          ? item.unitPrice * (1 - item.discount / 100)
                          : hasDiscount && item.discountType === "fixed"
                          ? Math.max(0, item.unitPrice - item.discount)
                          : item.unitPrice
                        return (
                          <div className={`flex flex-col justify-center gap-0 ${className}`}>
                            {hasDiscount ? (
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

                      const QtyCell = ({ item, className = "" }: { item: CompraItem; className?: string }) => (
                        <div className={`flex flex-col justify-center gap-0 ${className}`}>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-slate-700 tabular-nums">{item.quantity}</span>
                            <span className="text-[10px] text-slate-400">{item.quantity === 1 ? "unidad" : "unidades"}</span>
                          </div>
                        </div>
                      )

                      return (
                        <div
                          key={compra.id}
                          onClick={() => router.push(`/compras/compras/${compra.id}`)}
                          className={`bg-white border rounded-md shadow-sm transition-colors cursor-pointer ${
                            isSelected
                              ? "border-blue-300 bg-blue-50/40"
                              : "border-slate-200/60 hover:border-slate-300"
                          }`}
                        >
                          {/* TOP ROW */}
                          <div className="grid grid-cols-100 min-h-[44px] py-2 border-b border-slate-200/70">
                            {/* Checkbox */}
                            <div
                              className="col-span-4 flex items-center justify-center border-r border-slate-200/70 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); toggleSelectCompra(compra.id) }}
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
                              <span className="text-sm font-semibold text-slate-900 shrink-0">{compra.id}</span>
                            </div>
                            {/* Fecha */}
                            <div className="col-span-14 flex items-center justify-start px-3 border-r border-slate-200/70">
                              <span className="text-sm text-slate-600 truncate">
                                {formatCompraDateTime(compra.fecha, compra.hora)}
                              </span>
                            </div>
                            {/* Origen */}
                            <div className="col-span-42 flex items-center justify-start px-3 gap-2">
                              <span className="text-sm text-slate-600 shrink-0">
                                {compra.origen === "orden" ? "Creada desde orden" : "Creada manualmente"}
                              </span>
                              {compra.origen === "orden" && compra.ordenId && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/compras/ordenes-de-compra/${compra.ordenId}`) }}
                                  className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700 transition-colors shrink-0"
                                >
                                  Ver orden
                                </button>
                              )}
                            </div>
                            {/* Spacer */}
                            <div className="col-span-12" />
                            {/* Proveedor pill */}
                            <div className="col-span-14 flex items-center justify-end pr-3 border-r border-slate-200/70" onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const prov = PROVEEDORES.find(p => {
                                  const name = p.tipo === "empresa" ? p.razonSocial ?? "" : `${p.nombre} ${p.apellido}`.trim()
                                  return name === compra.proveedorNombre
                                })
                                return (
                                  <button
                                    type="button"
                                    onClick={() => prov && setViewingProveedorId(prov.id)}
                                    className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border border-slate-200 bg-panel-content shadow-sm shrink-0 hover:border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                      <span className="text-[9px] font-bold text-white uppercase">{compra.proveedorNombre.charAt(0)}</span>
                                    </div>
                                    <span className="text-xs text-slate-700 whitespace-nowrap">{compra.proveedorNombre}</span>
                                  </button>
                                )
                              })()}
                            </div>
                            {/* More menu */}
                            <div
                              className="col-span-4 flex items-center justify-center border-l border-slate-200/70 relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => setOpenMoreMenu(openMoreMenu === compra.id ? null : compra.id)}
                                aria-label="Más opciones"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMoreMenu === compra.id && (
                                <div
                                  className="absolute top-full right-2 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]"
                                  onMouseLeave={() => setOpenMoreMenu(null)}
                                >
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-panel-content transition-colors text-left"
                                    onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); handleRowDownloadPDF(compra) }}
                                  >
                                    <FileDown className="w-4 h-4 text-slate-400" />
                                    Descargar PDF
                                  </button>
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-panel-content transition-colors text-left"
                                    onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null); router.push(`/compras/compras/nueva?duplicar=${compra.id}`) }}
                                  >
                                    <Copy className="w-4 h-4 text-slate-400" />
                                    Duplicar compra
                                  </button>
                                  {(compra.estado === "finalizada" || compra.estado === "en_curso") && (
                                    <button
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                      onClick={(e) => { e.stopPropagation(); setOpenMoreMenu(null) }}
                                    >
                                      <XCircle className="w-4 h-4 text-red-400" />
                                      Cancelar compra
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
                              {compra.estado === "en_curso" && (() => {
                                const totalQty    = compra.items.reduce((s, it) => s + it.quantity, 0)
                                const receivedQty = (compra.recepcionItems ?? []).reduce((s, ri) => s + ri.quantityRecepcionada, 0)
                                const totalPagado = (compra.pagos ?? []).reduce((s, p) => s + p.monto, 0)
                                const recepcionPendiente = receivedQty < totalQty
                                const pagoPendiente      = totalPagado < compra.total
                                if (!recepcionPendiente && !pagoPendiente) return null
                                return (
                                  <div className="flex items-center gap-2 text-[11px] font-light text-slate-400">
                                    {recepcionPendiente && (
                                      <span className="flex items-center gap-1"><span>•</span>Recepción pendiente</span>
                                    )}
                                    {pagoPendiente && (
                                      <span className="flex items-center gap-1"><span>•</span>Pago pendiente</span>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>

                          {/* BOTTOM ROW */}
                          {(() => {
                            const isExpanded = expandedCompras.has(compra.id) && isMulti
                            return (
                              <div className="grid grid-cols-100 pt-1 pb-2" onClick={(e) => e.stopPropagation()}>
                                <div className="col-span-4" />
                                {/* Item cell */}
                                <div className={`col-span-32 bg-panel-content ${isExpanded ? "rounded-tl-md" : "rounded-l-md"} py-2.5 pl-3 pr-2 flex items-center gap-2`}>
                                  {isMulti && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleExpandCompra(compra.id) }}
                                      className="p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-colors shrink-0"
                                      aria-label={isExpanded ? "Colapsar productos" : "Expandir productos"}
                                    >
                                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                  )}
                                  {isMulti ? (
                                    <>
                                      <div className="flex items-center -space-x-2 shrink-0">
                                        {compra.items.slice(0, 3).map((it, idx) => (
                                          <div
                                            key={`${compra.id}-thumb-${idx}`}
                                            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                                            style={{ zIndex: 10 - idx }}
                                          >
                                            <img src={getItemPhoto(it as any)} alt={it.name || "Producto"} className="w-full h-full object-cover" />
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-sm font-semibold text-slate-800 truncate">{compra.items.length} productos</span>
                                    </>
                                  ) : firstItem ? (
                                    <div
                                      className="flex items-center gap-3 min-w-0 text-left rounded hover:bg-slate-100/70 transition-colors -m-0.5 p-0.5 cursor-pointer"
                                      onClick={(e) => { e.stopPropagation(); setViewingItem(firstItem as unknown as VentaItem) }}
                                    >
                                      <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        <img src={getItemPhoto(firstItem as any)} alt={firstItem.name || "Producto"} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="min-w-0 flex flex-col">
                                        <span className="text-sm font-medium text-slate-800 truncate">{firstItem.name}</span>
                                        {firstItem.categoria && (
                                          <span className="text-xs text-slate-500 truncate">{firstItem.categoria}</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                                {/* Unidades */}
                                <div className="col-span-20 bg-panel-content flex items-center px-3">
                                  {!isMulti && firstItem ? (
                                    <QtyCell item={firstItem} />
                                  ) : (
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-sm text-slate-700 tabular-nums">{totalUnits}</span>
                                      <span className="text-xs text-slate-400">{totalUnits === 1 ? "unidad" : "unidades"}</span>
                                    </div>
                                  )}
                                </div>
                                {/* Precio unitario */}
                                <div className="col-span-16 bg-panel-content flex items-center px-3">
                                  {!isMulti && firstItem && <PrecioCell item={firstItem} />}
                                </div>
                                {/* Total */}
                                <div className={`col-span-24 bg-panel-content ${isExpanded ? "rounded-tr-md" : "rounded-r-md"} flex items-center px-3`}>
                                  <span className="text-sm font-semibold text-slate-800">Total: ${compra.total.toLocaleString("es-AR")}</span>
                                </div>
                                <div className="col-span-4" />

                                {/* Expanded item rows */}
                                {isExpanded && compra.items.map((item, idx) => {
                                  const isLast = idx === lastItemIdx
                                  return (
                                    <Fragment key={`${compra.id}-exp-${idx}`}>
                                      <div className="col-span-4" />
                                      <div className={`col-span-32 bg-panel-content border-t border-slate-200/60`}>
                                        <div
                                          className="w-full px-3 py-2 flex items-start gap-3 text-left rounded hover:bg-slate-100/70 transition-colors cursor-pointer"
                                          onClick={(e) => { e.stopPropagation(); setViewingItem(item as unknown as VentaItem) }}
                                        >
                                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                            <img src={getItemPhoto(item as any)} alt={item.name || "Producto"} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="min-w-0 flex flex-col">
                                            <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                                            {item.categoria && (
                                              <span className="text-xs text-slate-500 truncate">{item.categoria}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-span-20 bg-panel-content px-3 py-2 border-t border-slate-200/60 flex items-center">
                                        <QtyCell item={item} />
                                      </div>
                                      <div className="col-span-16 bg-panel-content px-3 py-2 border-t border-slate-200/60 flex items-center">
                                        <PrecioCell item={item} />
                                      </div>
                                      <div className={`col-span-24 bg-panel-content border-t border-slate-200/60`} />
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

      {viewingItem && (
        <VentaItemDetailModal ventaItem={viewingItem} onClose={() => setViewingItem(null)} />
      )}
      {viewingProveedorId && (
        <ProveedorModal proveedorId={viewingProveedorId} onClose={() => setViewingProveedorId(null)} />
      )}
    </div>
  )
}

/* ─── Period Selector ─────────────────────────────────────────────────────── */

function ComprasPeriodSelector({
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
                noPeriod ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-panel-content"
              }`}
            >
              Ninguno
            </button>
            {/* En curso group */}
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
                    : "text-slate-700 hover:bg-panel-content"
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
            {/* Período fijo group */}
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
                    : "text-slate-700 hover:bg-panel-content"
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

function startOfDayC(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function ComprasRangeCalendarDialog({
  initialRange,
  onApply,
  onCancel,
}: {
  initialRange: { start: Date; end: Date } | null
  onApply: (start: Date, end: Date) => void
  onCancel: () => void
}) {
  const today = startOfDayC(new Date())
  const [viewMonth, setViewMonth] = useState(() => {
    const base = initialRange?.end ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [start, setStart] = useState<Date | null>(initialRange?.start ?? null)
  const [end, setEnd]     = useState<Date | null>(initialRange?.end ?? null)

  const handleDayClick = (d: Date) => {
    if (d > today) return
    if (!start || (start && end)) { setStart(d); setEnd(null) }
    else if (start && !end) {
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

  const firstOfMonth  = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const lastOfMonth   = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
  const startWeekday  = (firstOfMonth.getDay() + 6) % 7
  const totalCells    = Math.ceil((startWeekday + lastOfMonth.getDate()) / 7) * 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1
    cells.push(dayNum < 1 || dayNum > lastOfMonth.getDate() ? null : new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNum))
  }

  const inRange  = (d: Date) => !!(start && end && d >= start && d <= end)
  const canApply = !!start && !!end
  const MONTHS   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={goPrev} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-semibold text-slate-800">{MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
          <button type="button" onClick={goNext} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <ChevronRight className="w-4 h-4 text-slate-500" />
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
            const isStart   = start && d.getTime() === start.getTime()
            const isEnd     = end   && d.getTime() === end.getTime()
            const isInRange = inRange(d)
            const isFuture  = d > today
            return (
              <button
                key={i}
                type="button"
                disabled={isFuture}
                onClick={() => handleDayClick(d)}
                className={`text-xs h-8 rounded-lg transition-colors cursor-pointer ${
                  isStart || isEnd ? "bg-slate-900 text-white"
                  : isInRange      ? "bg-slate-100 text-slate-700"
                  : isFuture       ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 hover:bg-panel-content"
                }`}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-panel-content cursor-pointer transition-colors">
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
