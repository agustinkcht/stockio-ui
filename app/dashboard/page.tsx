"use client"

import { useState, useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react"
import Image from "next/image"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useSettings } from "@/lib/contexts/settings-context"
import { useVentas } from "@/hooks/use-ventas"
import { useCaja } from "@/hooks/use-caja"
import { useItems } from "@/hooks/use-items"
import {
  PERIOD_OPTIONS,
  usePeriod,
  usePeriodRange,
  type PeriodKey,
} from "@/lib/contexts/period-context"
import type { PeriodRange } from "@/lib/utils/dashboard-period"
import type { Item, ItemVariant, Venta } from "@/lib/types"

const formatARS = (n: number): string =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

const formatNumber = (n: number): string =>
  new Intl.NumberFormat("es-AR").format(n)

// Build a flat map of sku → costo from items (handles variants)
function buildCostoMap(items: Item[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of items) {
    if (item.variants && item.variants.length > 0 && item.skuPrefix) {
      for (const v of item.variants as ItemVariant[]) {
        const sku = v.skuSuffix ? `${item.skuPrefix}-${v.skuSuffix}` : v.sku
        if (sku && v.precio?.costo != null) {
          map.set(sku, v.precio.costo)
        }
      }
    } else if (item.sku && item.precio?.costo != null) {
      map.set(item.sku, item.precio.costo)
    }
  }
  return map
}

interface ItemMeta {
  marca?: string
  categoria?: string
  thumbnail?: string
  tags?: string[]
}
function buildItemMetaMap(items: Item[]): Map<string, ItemMeta> {
  const map = new Map<string, ItemMeta>()
  for (const item of items) {
    if (item.variants && item.variants.length > 0 && item.skuPrefix) {
      for (const v of item.variants as ItemVariant[]) {
        const sku = v.skuSuffix ? `${item.skuPrefix}-${v.skuSuffix}` : v.sku
        if (!sku) continue
        map.set(sku, {
          marca: v.marca ?? item.marca,
          categoria: item.categoria,
          thumbnail: item.imagenUrl,
          tags: v.atributosPrincipales?.map((a) => String(a.valor)).filter(Boolean),
        })
      }
    } else if (item.sku) {
      map.set(item.sku, {
        marca: item.marca,
        categoria: item.categoria,
        thumbnail: item.imagenUrl,
        tags: item.atributosPrincipales?.map((a) => String(a.valor)).filter(Boolean),
      })
    }
  }
  return map
}

const inRange = (dateStr: string, range: { startStr: string; endStr: string }): boolean =>
  dateStr >= range.startStr && dateStr <= range.endStr

interface TopItemRow {
  sku: string
  name: string
  marca?: string
  categoria?: string
  thumbnail?: string
  tags?: string[]
  units: number
  revenue: number
  ventasCount: number
}

// Per-bucket factor values for the line chart
interface FactorBuckets {
  ventasBrutas: number[]
  cantidadVentas: number[]
  unidadesVendidas: number[]
  unidadesDevueltas: number[]
  valorDevoluciones: number[]
}

interface DashboardMetrics {
  ingresos: number
  promociones: number
  mercaderia: number
  gastos: number
  ganancia: number
  margen: number
  ventasCount: number
  unidadesVendidas: number
  unidadesDevueltas: number
  valorDevoluciones: number
  payments: { efectivo: number; posnet: number; transferencia: number }
  topItems: TopItemRow[]
  heatmap: number[][]
  // Bucketed series, aligned with chartLabels
  chartLabels: string[]
  factors: FactorBuckets
}

type Granularity = "hour" | "day" | "month"

function chooseGranularity(range: PeriodRange): Granularity {
  const ms = range.end.getTime() - range.start.getTime()
  const days = ms / (1000 * 60 * 60 * 24)
  if (days <= 1.5) return "hour"
  if (days <= 95) return "day"
  return "month"
}

// Build the bucket keys + labels for the chart axis
function buildBuckets(range: PeriodRange): { keys: string[]; labels: string[]; granularity: Granularity } {
  const granularity = chooseGranularity(range)
  if (granularity === "hour") {
    const keys: string[] = []
    const labels: string[] = []
    for (let h = 0; h < 24; h++) {
      keys.push(`H${h}`)
      labels.push(`${String(h).padStart(2, "0")}:00`)
    }
    return { keys, labels, granularity }
  }
  if (granularity === "day") {
    const keys: string[] = []
    const labels: string[] = []
    const cursor = new Date(range.start)
    cursor.setHours(0, 0, 0, 0)
    const stop = new Date(range.end)
    stop.setHours(0, 0, 0, 0)
    while (cursor <= stop) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, "0")
      const d = String(cursor.getDate()).padStart(2, "0")
      keys.push(`${y}-${m}-${d}`)
      labels.push(`${cursor.getDate()}/${cursor.getMonth() + 1}`)
      cursor.setDate(cursor.getDate() + 1)
    }
    return { keys, labels, granularity }
  }
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const keys: string[] = []
  const labels: string[] = []
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
  const stop = new Date(range.end.getFullYear(), range.end.getMonth(), 1)
  while (cursor <= stop) {
    keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)
    labels.push(monthNames[cursor.getMonth()])
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return { keys, labels, granularity }
}

function bucketKeyForVenta(v: Venta, granularity: Granularity): string {
  if (granularity === "hour") {
    const hour = parseInt((v.hora || "12:00").split(":")[0], 10)
    return `H${isNaN(hour) ? 12 : hour}`
  }
  if (granularity === "day") return v.fecha
  // month
  const [y, m] = v.fecha.split("-")
  return `${y}-${m}`
}

function computeMetrics(
  ventas: Venta[],
  range: PeriodRange,
  costoMap: Map<string, number>,
  itemMetaMap: Map<string, ItemMeta>,
  cajaEgresos: number,
): DashboardMetrics {
  const { keys, labels, granularity } = buildBuckets(range)
  const idxByKey = new Map<string, number>()
  keys.forEach((k, i) => idxByKey.set(k, i))

  const factors: FactorBuckets = {
    ventasBrutas: Array(keys.length).fill(0),
    cantidadVentas: Array(keys.length).fill(0),
    unidadesVendidas: Array(keys.length).fill(0),
    unidadesDevueltas: Array(keys.length).fill(0),
    valorDevoluciones: Array(keys.length).fill(0),
  }

  const ventasInRange = ventas.filter((v) => inRange(v.fecha, range))
  const valid = ventasInRange.filter((v) => v.estado !== "cancelada")
  const cancelled = ventasInRange.filter((v) => v.estado === "cancelada")

  let ingresos = 0
  let netoVenta = 0
  let mercaderia = 0
  let unidadesVendidas = 0
  const itemAgg = new Map<string, TopItemRow & { ventasIds: Set<string> }>()

  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))

  for (const v of valid) {
    netoVenta += v.total
    const bk = bucketKeyForVenta(v, granularity)
    const i = idxByKey.get(bk)

    const ventaDate = new Date(`${v.fecha}T${v.hora || "12:00"}:00`)
    const wd = ventaDate.getDay()
    const hr = ventaDate.getHours()
    if (!isNaN(wd) && !isNaN(hr)) heatmap[wd][hr] += 1

    let ventaGross = 0
    let ventaUnits = 0
    for (const it of v.items) {
      const gross = it.unitPrice * it.quantity
      ingresos += gross
      ventaGross += gross
      unidadesVendidas += it.quantity
      ventaUnits += it.quantity
      const costo = costoMap.get(it.sku) ?? 0
      mercaderia += costo * it.quantity
      const meta = itemMetaMap.get(it.sku)
      const agg = itemAgg.get(it.sku) ?? {
        sku: it.sku,
        name: it.name,
        marca: meta?.marca,
        categoria: meta?.categoria ?? it.categoria,
        thumbnail: meta?.thumbnail,
        tags: meta?.tags,
        units: 0,
        revenue: 0,
        ventasCount: 0,
        ventasIds: new Set<string>(),
      }
      agg.units += it.quantity
      agg.revenue += it.total
      agg.ventasIds.add(v.id)
      itemAgg.set(it.sku, agg)
    }

    if (i !== undefined) {
      factors.ventasBrutas[i] += ventaGross
      factors.cantidadVentas[i] += 1
      factors.unidadesVendidas[i] += ventaUnits
    }
  }

  const promociones = Math.max(0, ingresos - netoVenta)

  let valorDevoluciones = 0
  let unidadesDevueltas = 0
  for (const v of cancelled) {
    valorDevoluciones += v.total
    let cUnits = 0
    for (const it of v.items) cUnits += it.quantity
    unidadesDevueltas += cUnits
    const bk = bucketKeyForVenta(v, granularity)
    const i = idxByKey.get(bk)
    if (i !== undefined) {
      factors.unidadesDevueltas[i] += cUnits
      factors.valorDevoluciones[i] += v.total
    }
  }

  const gastos = promociones + mercaderia + cajaEgresos
  const ganancia = ingresos - gastos
  const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0

  const payments = { efectivo: 0, posnet: 0, transferencia: 0 }
  for (const v of valid) {
    for (const c of v.cobros) {
      if (c.medioPago === "efectivo") payments.efectivo += c.monto
      else if (c.medioPago === "posnet") payments.posnet += c.monto
      else if (c.medioPago === "transferencia") payments.transferencia += c.monto
    }
  }

  const topItems: TopItemRow[] = Array.from(itemAgg.values())
    .map((a) => ({
      sku: a.sku,
      name: a.name,
      marca: a.marca,
      categoria: a.categoria,
      thumbnail: a.thumbnail,
      tags: a.tags,
      units: a.units,
      revenue: a.revenue,
      ventasCount: a.ventasIds.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    ingresos,
    promociones,
    mercaderia,
    gastos,
    ganancia,
    margen,
    ventasCount: valid.length,
    unidadesVendidas,
    unidadesDevueltas,
    valorDevoluciones,
    payments,
    topItems,
    heatmap,
    chartLabels: labels,
    factors,
  }
}

export default function DashboardPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { miNegocio } = useSettings()
  const { ventas } = useVentas()
  const { sesiones } = useCaja()
  const { items } = useItems()

  const { periodKey, customRange, setPeriodKey, setCustomRange } = usePeriod()
  const [periodOpen, setPeriodOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // First sale date (YYYY-MM-DD) for "histórico"
  const firstSaleDate = useMemo(() => {
    let min: string | null = null
    for (const v of ventas) {
      if (v.estado === "cancelada") continue
      if (!min || v.fecha < min) min = v.fecha
    }
    return min
  }, [ventas])

  const range = usePeriodRange(firstSaleDate)

  const periodLabel = useMemo(() => {
    const opt = PERIOD_OPTIONS.find((o) => o.key === periodKey)
    return opt?.label ?? "Período"
  }, [periodKey])

  const rangeLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    if (periodKey === "hoy") return fmt(range.start)
    return `${fmt(range.start)} — ${fmt(range.end)}`
  }, [range, periodKey])

  const costoMap = useMemo(() => buildCostoMap(items), [items])
  const itemMetaMap = useMemo(() => buildItemMetaMap(items), [items])

  const cajaEgresos = useMemo(() => {
    let filtered = 0
    for (const s of sesiones) {
      for (const m of s.movimientos) {
        if (m.tipo !== "egreso") continue
        const date = m.timestamp.split("T")[0]
        if (inRange(date, range)) filtered += Math.abs(m.monto)
      }
    }
    return filtered
  }, [sesiones, range])

  const metrics = useMemo(
    () => computeMetrics(ventas, range, costoMap, itemMetaMap, cajaEgresos),
    [ventas, range, costoMap, itemMetaMap, cajaEgresos],
  )

  const businessName = miNegocio.nombreApp || miNegocio.razonSocial || "Mi Negocio"

  // Range duration in days (for concentración blur gating)
  const rangeDays = useMemo(() => {
    const ms = range.end.getTime() - range.start.getTime()
    return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
  }, [range])

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

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white rounded-lg shadow-sm h-[calc(100vh-12px)]">
          {/* Top bar */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }]} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2 min-w-[200px] justify-end" />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            {/* Sticky hero */}
            <div className="sticky top-0 z-30 bg-slate-50/75 backdrop-blur-md border-b border-slate-200/60">
              <div className="max-w-6xl mx-auto px-8 py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-center gap-5 min-w-0">
                    {miNegocio.fotoUrl && (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 flex-shrink-0">
                        <Image
                          src={miNegocio.fotoUrl}
                          alt={businessName}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight text-balance">
                        {businessName}
                      </h1>
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
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
                        <span className="text-sm text-slate-500 font-mono">{rangeLabel}</span>
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-8">
              {/* Top KPI row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <WidgetCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Ingresos"
                  hint="Ventas brutas, sin descuentos"
                  value={formatARS(metrics.ingresos)}
                  accent="emerald"
                />

                {/* Gastos */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-slate-700" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos</span>
                    </div>
                    {metrics.ingresos > 0 && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 bg-rose-50 text-rose-700">
                        <ArrowDownRight className="w-3 h-3" />
                        {((metrics.gastos / metrics.ingresos) * 100).toFixed(1)}% de los ingresos
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">
                    {formatARS(metrics.gastos)}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <GastoSubItem label="Mercadería" value={metrics.mercaderia} dot="bg-amber-400" />
                    <GastoSubItem label="Promociones" value={metrics.promociones} dot="bg-rose-400" />
                  </div>
                </div>

                {/* Ganancia */}
                <div className={`rounded-2xl border p-5 flex flex-col ${
                  metrics.ganancia >= 0
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        metrics.ganancia >= 0 ? "bg-white/10" : "bg-rose-200/60"
                      }`}>
                        <Wallet className={`w-4 h-4 ${metrics.ganancia >= 0 ? "text-white" : "text-rose-700"}`} />
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        metrics.ganancia >= 0 ? "text-white/60" : "text-rose-700/80"
                      }`}>Ganancia</span>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      metrics.ganancia >= 0 ? "bg-emerald-400/20 text-emerald-300" : "bg-rose-200/60 text-rose-800"
                    }`}>
                      {metrics.ganancia >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {metrics.margen.toFixed(1)}% de los ingresos
                    </span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {formatARS(metrics.ganancia)}
                  </p>
                  <p className={`mt-3 text-xs ${metrics.ganancia >= 0 ? "text-white/50" : "text-rose-700/70"}`}>
                    Ingresos menos gastos del período
                  </p>
                </div>
              </div>

              {/* Estadísticas del Período */}
              <EstadisticasDelPeriodo metrics={metrics} rangeLabel={rangeLabel} />

              {/* Productos más vendidos */}
              <div className="mt-6 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Productos más vendidos
                  </h2>
                  <p className="text-xs text-slate-500">Ranking del período por ingresos</p>
                </div>
                <TopProductsList items={metrics.topItems} totalIngresos={metrics.ingresos} />
              </div>

              {/* Cobros por medio de pago */}
              <div className="mt-6 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Cobros por medio de pago
                  </h2>
                  <p className="text-xs text-slate-500">Distribución de cobros del período</p>
                </div>
                <div className="px-6 py-5">
                  <PaymentSplit payments={metrics.payments} />
                </div>
              </div>

              {/* Concentración de ventas */}
              <div className="mt-6 bg-white rounded-2xl border border-slate-200/60 overflow-hidden relative">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Concentración de ventas
                  </h2>
                  <p className="text-xs text-slate-500">Por día de la semana y franja horaria</p>
                </div>
                <div className={rangeDays < 7 ? "blur-sm pointer-events-none select-none" : ""}>
                  <SalesHeatmap heatmap={metrics.heatmap} range={range} totalVentas={metrics.ventasCount} />
                </div>
                {rangeDays < 7 && (
                  <div className="absolute inset-0 top-[68px] flex items-center justify-center">
                    <div className="px-5 py-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                      <p className="text-sm text-slate-700 text-center">
                        Seleccioná un período de al menos 7 días para ver la concentración de ventas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ---------------- Estadísticas del Período ---------------- */

type FactorKey = "ventasBrutas" | "cantidadVentas" | "unidadesVendidas" | "unidadesDevueltas" | "valorDevoluciones"

interface FactorDef {
  key: FactorKey
  label: string
  format: (n: number) => string
  // Color + line style cycle through 3 each so 5 factors are visually distinct
  color: string
  dash: string // SVG strokeDasharray
}

// 3 colors × 3 line styles, mapped to 5 factors
const FACTOR_DEFS: FactorDef[] = [
  { key: "ventasBrutas",      label: "Ventas brutas",            format: formatARS,    color: "rgb(15 23 42)",   dash: "0" },        // slate-900 solid
  { key: "cantidadVentas",    label: "Cantidad de ventas",       format: formatNumber, color: "rgb(16 185 129)", dash: "6 4" },      // emerald dashed
  { key: "unidadesVendidas",  label: "Unidades vendidas",        format: formatNumber, color: "rgb(245 158 11)", dash: "2 4" },      // amber dotted
  { key: "unidadesDevueltas", label: "Unidades devueltas",       format: formatNumber, color: "rgb(15 23 42)",   dash: "6 4" },      // slate-900 dashed
  { key: "valorDevoluciones", label: "Valor de unidades devueltas", format: formatARS, color: "rgb(16 185 129)", dash: "2 4" },      // emerald dotted
]

function EstadisticasDelPeriodo({ metrics, rangeLabel }: { metrics: DashboardMetrics; rangeLabel: string }) {
  const [active, setActive] = useState<Set<FactorKey>>(new Set(["ventasBrutas"]))

  const totals: Record<FactorKey, number> = {
    ventasBrutas: metrics.ingresos,
    cantidadVentas: metrics.ventasCount,
    unidadesVendidas: metrics.unidadesVendidas,
    unidadesDevueltas: metrics.unidadesDevueltas,
    valorDevoluciones: metrics.valorDevoluciones,
  }

  const toggle = (k: FactorKey) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Estadísticas del Período
          </h2>
          <p className="text-xs text-slate-500">Indicadores del período</p>
        </div>
        <p className="text-[11px] text-slate-400 font-mono">{rangeLabel}</p>
      </div>

      {/* Factor toggles */}
      <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {FACTOR_DEFS.map((f) => {
          const isActive = active.has(f.key)
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggle(f.key)}
              className={`group flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer text-left ${
                isActive
                  ? "border-slate-300 bg-slate-50"
                  : "border-slate-200/60 bg-white hover:border-slate-200 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <FactorMark color={f.color} dash={f.dash} active={isActive} />
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold truncate ${
                    isActive ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {f.label}
                </span>
              </div>
              <span className={`text-base font-semibold tabular-nums ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                {f.format(totals[f.key])}
              </span>
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="border-t border-slate-100 px-6 py-5">
        <MultiFactorChart labels={metrics.chartLabels} series={metrics.factors} active={active} />
      </div>
    </div>
  )
}

function FactorMark({ color, dash, active }: { color: string; dash: string; active: boolean }) {
  return (
    <svg width="20" height="8" viewBox="0 0 20 8" className="flex-shrink-0">
      <line
        x1="0"
        y1="4"
        x2="20"
        y2="4"
        stroke={active ? color : "rgb(203 213 225)"}
        strokeWidth="2"
        strokeDasharray={dash}
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ---------------- Multi-factor Line Chart ---------------- */

function MultiFactorChart({
  labels,
  series,
  active,
}: {
  labels: string[]
  series: FactorBuckets
  active: Set<FactorKey>
}) {
  const W = 800
  const H = 220
  const PAD_L = 28
  const PAD_R = 12
  const PAD_T = 16
  const PAD_B = 28
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const n = labels.length
  const stepX = n > 1 ? innerW / (n - 1) : 0

  // Active factors in declaration order
  const activeFactors = FACTOR_DEFS.filter((f) => active.has(f.key))

  if (activeFactors.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-400">
        Seleccioná al menos un factor
      </div>
    )
  }

  if (n === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-400">
        Sin datos en el período
      </div>
    )
  }

  // Slight pixel offsets so identical lines don't fully overlap
  const offsetFor = (i: number, total: number): number => {
    if (total <= 1) return 0
    const spacing = 2.5 // px between stacked lines
    const start = -((total - 1) / 2) * spacing
    return start + i * spacing
  }

  // Build path for each factor (each normalized to its own max so different magnitudes coexist)
  const lines = activeFactors.map((f, fIdx) => {
    const values = series[f.key]
    const max = Math.max(1, ...values)
    const dy = offsetFor(fIdx, activeFactors.length)
    const points = values.map((val, i) => {
      const x = PAD_L + i * stepX
      const y = PAD_T + innerH - (val / max) * innerH + dy
      return { x, y }
    })
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    return { factor: f, d, points, max }
  })

  // X-axis label trimming
  const labelStep = Math.max(1, Math.ceil(n / 12))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="none">
      {/* Subtle baseline */}
      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={PAD_T + innerH}
        y2={PAD_T + innerH}
        stroke="rgb(226 232 240)"
        strokeWidth="1"
      />
      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={PAD_T + innerH / 2}
        y2={PAD_T + innerH / 2}
        stroke="rgb(241 245 249)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Lines */}
      {lines.map(({ factor, d }) => (
        <path
          key={factor.key}
          d={d}
          fill="none"
          stroke={factor.color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={factor.dash}
        />
      ))}

      {/* X labels */}
      {labels.map((label, i) =>
        i % labelStep === 0 || i === n - 1 ? (
          <text
            key={i}
            x={PAD_L + i * stepX}
            y={H - 8}
            fontSize="9"
            fill="rgb(148 163 184)"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  )
}

/* ---------------- Components ---------------- */

interface WidgetCardProps {
  icon: React.ReactNode
  label: string
  hint?: string
  value: string
  accent: "emerald" | "slate"
}

function WidgetCard({ icon, label, hint, value, accent }: WidgetCardProps) {
  const accentBg = accent === "emerald" ? "bg-emerald-50" : "bg-slate-100"
  const accentFg = accent === "emerald" ? "text-emerald-700" : "text-slate-700"
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg ${accentBg} flex items-center justify-center ${accentFg}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-3 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function GastoSubItem({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-800 tabular-nums truncate">{formatARS(value)}</span>
    </div>
  )
}

function PaymentSplit({ payments }: { payments: { efectivo: number; posnet: number; transferencia: number } }) {
  const total = payments.efectivo + payments.posnet + payments.transferencia
  const segments = [
    { label: "Efectivo", value: payments.efectivo, color: "bg-emerald-500", textColor: "text-emerald-700" },
    { label: "Posnet", value: payments.posnet, color: "bg-slate-700", textColor: "text-slate-700" },
    { label: "Transferencia", value: payments.transferencia, color: "bg-amber-500", textColor: "text-amber-700" },
  ]

  if (total <= 0) {
    return <p className="text-sm text-slate-400">Sin cobros en el período</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={s.color}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${formatARS(s.value)}`}
            />
          ) : null,
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {segments.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0
          return (
            <div key={s.label} className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.color} flex-shrink-0`} />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 truncate">
                  {s.label}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-800 tabular-nums">{formatARS(s.value)}</span>
              <span className={`text-[11px] font-mono ${s.textColor}`}>{pct.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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

/* ---------------- Sales heatmap ---------------- */

const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const DAY_NAMES_ORDER = [1, 2, 3, 4, 5, 6, 0]

function SalesHeatmap({
  heatmap,
  range,
  totalVentas,
}: {
  heatmap: number[][]
  range: PeriodRange
  totalVentas: number
}) {
  const { dayTotals, hourTotals, max, weeksInRange } = useMemo(() => {
    const dayTotals = Array(7).fill(0)
    const hourTotals = Array(24).fill(0)
    let max = 0
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const v = heatmap[d][h]
        dayTotals[d] += v
        hourTotals[h] += v
        if (v > max) max = v
      }
    }
    const ms = range.end.getTime() - range.start.getTime()
    const days = ms / (1000 * 60 * 60 * 24)
    const weeksInRange = days > 7 ? days / 7 : 1
    return { dayTotals, hourTotals, max, weeksInRange }
  }, [heatmap, range])

  const topDayIdx = dayTotals.reduce((best, v, i) => (v > dayTotals[best] ? i : best), 0)
  const topDayName = DAY_NAMES_FULL[topDayIdx]
  let bestStart = 0
  let bestSum = -1
  for (let s = 0; s < 24; s++) {
    let sum = 0
    for (let k = 0; k < 6; k++) sum += hourTotals[(s + k) % 24]
    if (sum > bestSum) {
      bestSum = sum
      bestStart = s
    }
  }
  const bandStart = String(bestStart).padStart(2, "0")
  const bandEnd = String((bestStart + 6) % 24).padStart(2, "0")

  const ventasPromedioDia = totalVentas > 0 ? totalVentas / 7 : 0

  const colorFor = (v: number) => {
    if (max === 0 || v === 0) return { fill: "rgb(226 232 240)", size: 4 }
    const ratio = v / max
    if (ratio < 0.34) return { fill: "rgb(216 180 254)", size: 7 }
    if (ratio < 0.67) return { fill: "rgb(168 85 247)", size: 10 }
    return { fill: "rgb(107 33 168)", size: 13 }
  }

  const showAvgInfo = weeksInRange > 1

  return (
    <div className="px-6 py-5">
      {showAvgInfo && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-slate-50 border border-slate-100 mb-5">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            El período abarca más de una semana, por lo que cada celda representa un promedio acumulado de ventas en esa franja.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-5 border-b border-slate-100">
        <HmStat label="Cantidad de ventas" value={formatNumber(totalVentas)} />
        <HmStat label="Promedio ventas / día" value={ventasPromedioDia.toFixed(1)} />
        <HmStat label="Día con más ventas" value={topDayName} />
        <HmStat label="Franja horaria con más ventas" value={`${bandStart}:00 a ${bandEnd}:00`} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="flex flex-col gap-2">
            {DAY_NAMES_ORDER.map((dIdx) => (
              <div key={dIdx} className="flex items-center gap-2">
                <div className="w-20 text-xs text-slate-500 flex-shrink-0">{DAY_NAMES_FULL[dIdx]}</div>
                <div className="flex-1 grid grid-cols-24 items-center" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
                  {Array.from({ length: 24 }, (_, h) => {
                    const v = heatmap[dIdx][h]
                    const c = colorFor(v)
                    return (
                      <div key={h} className="flex items-center justify-center h-7">
                        <div
                          className="rounded-full transition-transform hover:scale-110"
                          style={{ width: c.size, height: c.size, backgroundColor: c.fill }}
                          title={`${DAY_NAMES_FULL[dIdx]}, ${String(h).padStart(2, "0")}:00 — ${v} venta${v === 1 ? "" : "s"}`}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="w-10 text-right text-xs font-mono text-slate-600 flex-shrink-0 tabular-nums">
                  {dayTotals[dIdx]}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="w-20 flex-shrink-0" />
            <div className="flex-1 grid" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[10px] text-slate-400 text-center font-mono">
                  {String(h).padStart(2, "0")}
                </div>
              ))}
            </div>
            <div className="w-10 flex-shrink-0" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-slate-500">
        {[
          { l: "Sin ventas", c: "rgb(226 232 240)", s: 4 },
          { l: "Baja", c: "rgb(216 180 254)", s: 7 },
          { l: "Media", c: "rgb(168 85 247)", s: 9 },
          { l: "Alta", c: "rgb(107 33 168)", s: 11 },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-1.5">
            <span className="rounded-full" style={{ width: s.s, height: s.s, backgroundColor: s.c }} />
            <span>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HmStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  )
}

/* ---------------- Top products list (paginated) ---------------- */

const PRODUCTS_PER_PAGE = 5

function TopProductsList({ items, totalIngresos }: { items: TopItemRow[]; totalIngresos: number }) {
  const [page, setPage] = useState(0)

  if (items.length === 0) {
    return <div className="px-6 py-8 text-center text-sm text-slate-400">Sin ventas en el período</div>
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PRODUCTS_PER_PAGE))
  const safePage = Math.min(page, totalPages - 1)
  const startIdx = safePage * PRODUCTS_PER_PAGE
  const visible = items.slice(startIdx, startIdx + PRODUCTS_PER_PAGE)

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60">
          <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            <th className="text-left px-6 py-3 w-14">#</th>
            <th className="text-left px-3 py-3">Item</th>
            <th className="text-right px-3 py-3 w-20">Ventas</th>
            <th className="text-right px-3 py-3 w-28">Unidades</th>
            <th className="text-right px-3 py-3 w-32">Ingresos</th>
            <th className="text-right px-6 py-3 w-24">% Período</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((it, idx) => {
            const pct = totalIngresos > 0 ? (it.revenue / totalIngresos) * 100 : 0
            return (
              <tr key={it.sku} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3 text-slate-400 font-mono tabular-nums">{startIdx + idx + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {it.thumbnail ? (
                        <Image
                          src={it.thumbnail}
                          alt={it.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900 truncate" title={it.name}>
                          {it.name}
                        </p>
                        {it.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {[it.marca, it.categoria].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatNumber(it.ventasCount)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatNumber(it.units)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">{formatARS(it.revenue)}</td>
                <td className="px-6 py-3 text-right tabular-nums text-slate-600 font-mono">{pct.toFixed(1)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
        <p className="text-xs text-slate-500 font-mono">
          Página {safePage + 1} de {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Range calendar dialog ---------------- */

const ES_MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const ES_WEEKDAYS_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

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
      setStart(d)
      setEnd(null)
    } else if (start && !end) {
      if (d < start) {
        setStart(d)
        setEnd(start)
      } else {
        setEnd(d)
      }
    }
  }

  const goPrev = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  const goNext = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    if (next.getFullYear() > today.getFullYear() || (next.getFullYear() === today.getFullYear() && next.getMonth() > today.getMonth())) {
      return
    }
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
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-base font-medium text-slate-900">
            {ES_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={
              viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth()
            }
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 grid grid-cols-7 gap-y-2">
          {ES_WEEKDAYS_SHORT.map((w) => (
            <div key={w} className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold text-center py-2">
              {w}
            </div>
          ))}
        </div>

        <div className="px-3 pb-4">
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />
              const isFuture = d > today
              const isStart = start && isSameDay(d, start)
              const isEnd = end && isSameDay(d, end)
              const inRangeSel = inSelectionRange(d) && !isStart && !isEnd
              const isEdge = isStart || isEnd

              return (
                <div key={i} className="aspect-square flex items-center justify-center relative">
                  {(inRangeSel || (isEdge && start && end && !isSameDay(start, end))) && (
                    <div
                      className={`absolute inset-y-1 bg-blue-50 ${
                        isStart && end && !isSameDay(start, end!)
                          ? "left-1/2 right-0"
                          : isEnd && start && !isSameDay(start!, end)
                          ? "left-0 right-1/2"
                          : "left-0 right-0"
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleDayClick(d)}
                    disabled={isFuture}
                    className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer ${
                      isEdge
                        ? "bg-blue-500 text-white font-semibold"
                        : isFuture
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canApply}
            onClick={() => start && end && onApply(start, end)}
            className="flex-1 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
