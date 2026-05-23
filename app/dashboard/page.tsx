"use client"

import { useState, useMemo } from "react"
import { LayoutDashboard, TrendingUp, TrendingDown, Wallet, ShoppingBag, Package, Tag, Users, ChevronDown, Receipt, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Calendar, Info } from "lucide-react"
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
import { getMesEnCursoPeriod, type PeriodRange } from "@/lib/utils/dashboard-period"
import type { Item, ItemVariant, Venta } from "@/lib/types"

type PeriodKey = "mes_en_curso" | "mes_anterior" | "7d" | "30d" | "ano_en_curso" | "personalizado"

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "mes_en_curso", label: "Mes en Curso" },
  { key: "mes_anterior", label: "Mes Anterior" },
  { key: "7d", label: "Últimos 7 días" },
  { key: "30d", label: "Últimos 30 días" },
  { key: "ano_en_curso", label: "Año en Curso" },
  { key: "personalizado", label: "Personalizado" },
]

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

// Build sku → meta (marca, categoria, thumbnail, tags) map from items
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

// YYYY-MM-DD inclusive comparison
const inRange = (dateStr: string, range: { startStr: string; endStr: string }): boolean =>
  dateStr >= range.startStr && dateStr <= range.endStr

const ymd = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getPeriodRange(
  key: PeriodKey,
  mesEnCursoStartDay: number,
  customRange?: { start: Date; end: Date } | null,
): PeriodRange {
  const today = new Date()
  if (key === "personalizado" && customRange) {
    const start = new Date(customRange.start)
    start.setHours(0, 0, 0, 0)
    const end = new Date(customRange.end)
    end.setHours(23, 59, 59, 999)
    return {
      start,
      end,
      startStr: ymd(start),
      endStr: ymd(end),
      label: "Personalizado",
    }
  }
  if (key === "mes_en_curso") {
    return getMesEnCursoPeriod(mesEnCursoStartDay)
  }
  if (key === "mes_anterior") {
    const current = getMesEnCursoPeriod(mesEnCursoStartDay)
    // Reference one day before current period start to compute previous period
    const ref = new Date(current.start)
    ref.setDate(ref.getDate() - 1)
    return getMesEnCursoPeriod(mesEnCursoStartDay, ref)
  }
  if (key === "7d" || key === "30d") {
    const days = key === "7d" ? 7 : 30
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)
    const start = new Date(today)
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)
    return {
      start,
      end,
      startStr: ymd(start),
      endStr: ymd(end),
      label: `Últimos ${days} días`,
    }
  }
  // ano_en_curso
  const start = new Date(today.getFullYear(), 0, 1)
  const end = new Date(today)
  end.setHours(23, 59, 59, 999)
  return {
    start,
    end,
    startStr: ymd(start),
    endStr: ymd(end),
    label: `Año ${today.getFullYear()}`,
  }
}

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

interface DashboardMetrics {
  ingresos: number
  promociones: number
  mercaderia: number
  otros: number
  gastos: number
  ganancia: number
  margen: number
  ventasCount: number
  unidadesVendidas: number
  unidadesCanceladas: number
  clientesUnicos: number
  ticketPromedio: number
  payments: { efectivo: number; posnet: number; transferencia: number }
  topItems: TopItemRow[]
  // Concentración: weekday (0=Sun..6=Sat) × hour (0..23) → ventas count
  heatmap: number[][]
  // Per-day venta count keyed by YYYY-MM-DD
  ventasByDay: Map<string, number>
  // Per-hour venta count (0..23)
  ventasByHour: number[]
}

function computeMetrics(
  ventas: Venta[],
  range: PeriodRange,
  costoMap: Map<string, number>,
  itemMetaMap: Map<string, { marca?: string; categoria?: string; thumbnail?: string; tags?: string[] }>,
  cajaEgresos: number,
): DashboardMetrics {
  const ventasInRange = ventas.filter((v) => inRange(v.fecha, range))
  const valid = ventasInRange.filter((v) => v.estado !== "cancelada")
  const cancelled = ventasInRange.filter((v) => v.estado === "cancelada")

  let ingresos = 0
  let netoVenta = 0
  let mercaderia = 0
  let unidadesVendidas = 0
  const itemAgg = new Map<string, TopItemRow & { ventasIds: Set<string> }>()
  const clientes = new Set<string>()

  // Heatmap[weekday][hour]
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  const ventasByDay = new Map<string, number>()
  const ventasByHour = Array(24).fill(0)

  for (const v of valid) {
    netoVenta += v.total
    if (v.cliente && v.cliente.tipo === "cuenta") clientes.add(v.cliente.id)
    else clientes.add("__cf__")

    // Time buckets
    const ventaDate = new Date(`${v.fecha}T${v.hora || "12:00"}:00`)
    const wd = ventaDate.getDay() // 0..6 (Sun..Sat)
    const hr = ventaDate.getHours()
    if (!isNaN(wd) && !isNaN(hr)) {
      heatmap[wd][hr] += 1
      ventasByHour[hr] += 1
    }
    ventasByDay.set(v.fecha, (ventasByDay.get(v.fecha) ?? 0) + 1)

    for (const it of v.items) {
      const gross = it.unitPrice * it.quantity
      ingresos += gross
      unidadesVendidas += it.quantity
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
  }

  const promociones = Math.max(0, ingresos - netoVenta)

  // Cancelled value lost (lost potential gross)
  let cancelledLoss = 0
  let unidadesCanceladas = 0
  for (const v of cancelled) {
    cancelledLoss += v.total
    for (const it of v.items) unidadesCanceladas += it.quantity
  }
  const otros = cajaEgresos + cancelledLoss

  const gastos = promociones + mercaderia + otros
  const ganancia = ingresos - gastos
  const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0

  // Payment breakdown (efectivo, posnet, transferencia)
  const payments = { efectivo: 0, posnet: 0, transferencia: 0 }
  for (const v of valid) {
    for (const c of v.cobros) {
      if (c.medioPago === "efectivo") payments.efectivo += c.monto
      else if (c.medioPago === "posnet") payments.posnet += c.monto
      else if (c.medioPago === "transferencia") payments.transferencia += c.monto
    }
  }

  // Build sorted top items list (by revenue desc)
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
    otros,
    gastos,
    ganancia,
    margen,
    ventasCount: valid.length,
    unidadesVendidas,
    unidadesCanceladas,
    clientesUnicos: clientes.size,
    ticketPromedio: valid.length > 0 ? netoVenta / valid.length : 0,
    payments,
    topItems,
    heatmap,
    ventasByDay,
    ventasByHour,
  }
}

export default function DashboardPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { miNegocio, dashboard } = useSettings()
  const { ventas } = useVentas()
  const { sesiones } = useCaja()
  const { items } = useItems()

  const [periodKey, setPeriodKey] = useState<PeriodKey>("mes_en_curso")
  const [periodOpen, setPeriodOpen] = useState(false)
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const range = useMemo(
    () => getPeriodRange(periodKey, dashboard.mesEnCursoStartDay, customRange),
    [periodKey, dashboard.mesEnCursoStartDay, customRange],
  )

  const periodLabel = useMemo(() => {
    if (periodKey === "personalizado") return "Personalizado"
    const opt = PERIOD_OPTIONS.find((o) => o.key === periodKey)
    return opt?.label ?? "Período"
  }, [periodKey])

  const rangeLabel = useMemo(() => {
    const fmt = (d: Date) =>
      d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    return `${fmt(range.start)} — ${fmt(range.end)}`
  }, [range])

  const costoMap = useMemo(() => buildCostoMap(items), [items])
  const itemMetaMap = useMemo(() => buildItemMetaMap(items), [items])

  const cajaEgresos = useMemo(() => {
    let total = 0
    for (const s of sesiones) {
      for (const m of s.movimientos) {
        if (m.tipo === "egreso" || m.tipo === "retiro") {
          // egreso/retiro reduce cash; treat as gasto only when egreso (retiros are bank transfers, not real expense)
          if (m.tipo === "egreso") total += Math.abs(m.monto)
        }
      }
    }
    // Filter by date
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
          {/* Header */}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <div className="max-w-6xl mx-auto px-8 py-10">
              {/* Hero */}
              <div className="flex items-start justify-between gap-6 mb-10">
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

              {/* Widgets row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Ingresos */}
                <WidgetCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Ingresos"
                  hint="Ventas brutas, sin descuentos"
                  value={formatARS(metrics.ingresos)}
                  accent="emerald"
                />

                {/* Gastos (3-part) */}
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
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                    <GastoSubItem label="Mercadería" value={metrics.mercaderia} dot="bg-amber-400" />
                    <GastoSubItem label="Promociones" value={metrics.promociones} dot="bg-rose-400" />
                    <GastoSubItem label="Otros" value={metrics.otros} dot="bg-slate-400" />
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

              {/* Operación: stats + payments + line chart */}
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Operación</h2>
                    <p className="text-xs text-slate-500">Indicadores del período</p>
                  </div>
                </div>

                {/* Top row: 3 stats left + payments right */}
                <div className="grid grid-cols-1 lg:grid-cols-5 border-t border-slate-100 divide-x divide-slate-100">
                  <div className="lg:col-span-2 grid grid-cols-3 divide-x divide-slate-100">
                    <StatCell icon={<Receipt className="w-3.5 h-3.5" />} label="Ventas" value={formatNumber(metrics.ventasCount)} />
                    <StatCell icon={<ShoppingBag className="w-3.5 h-3.5" />} label="Unidades" value={formatNumber(metrics.unidadesVendidas)} />
                    <StatCell icon={<Tag className="w-3.5 h-3.5" />} label="Ticket prom." value={formatARS(metrics.ticketPromedio)} />
                  </div>
                  <div className="lg:col-span-3 px-6 py-5">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Cobros por medio</p>
                    <PaymentSplit payments={metrics.payments} />
                  </div>
                </div>

                {/* Bottom: line chart inside same card */}
                <div className="border-t border-slate-100 px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Evolución de ventas</p>
                    <p className="text-[11px] text-slate-400 font-mono">{rangeLabel}</p>
                  </div>
                  <SalesLineChart range={range} ventasByDay={metrics.ventasByDay} ventasByHour={metrics.ventasByHour} />
                </div>
              </div>

              {/* Concentración heatmap */}
              <div className="mt-6 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Concentración de ventas
                  </h2>
                  <p className="text-xs text-slate-500">Por día de la semana y franja horaria</p>
                </div>
                <SalesHeatmap heatmap={metrics.heatmap} range={range} totalVentas={metrics.ventasCount} />
              </div>

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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
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

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-5 py-4 first:border-l-0">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-lg font-semibold text-slate-900 tabular-nums">{value}</p>
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
      {/* Bar */}
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
      {/* Legend */}
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

/* ---------------- Sales line chart ---------------- */

type Granularity = "hour" | "day" | "month"

function chooseGranularity(range: PeriodRange): Granularity {
  const ms = range.end.getTime() - range.start.getTime()
  const days = ms / (1000 * 60 * 60 * 24)
  if (days <= 1.5) return "hour"
  if (days <= 95) return "day"
  return "month"
}

function SalesLineChart({
  range,
  ventasByDay,
  ventasByHour,
}: {
  range: PeriodRange
  ventasByDay: Map<string, number>
  ventasByHour: number[]
}) {
  const granularity = chooseGranularity(range)

  // Build buckets
  const buckets: { label: string; value: number }[] = useMemo(() => {
    if (granularity === "hour") {
      return Array.from({ length: 24 }, (_, h) => ({
        label: String(h).padStart(2, "0"),
        value: ventasByHour[h] ?? 0,
      }))
    }
    if (granularity === "day") {
      const out: { label: string; value: number }[] = []
      const cursor = new Date(range.start)
      cursor.setHours(0, 0, 0, 0)
      const stop = new Date(range.end)
      stop.setHours(0, 0, 0, 0)
      while (cursor <= stop) {
        const y = cursor.getFullYear()
        const m = String(cursor.getMonth() + 1).padStart(2, "0")
        const d = String(cursor.getDate()).padStart(2, "0")
        const key = `${y}-${m}-${d}`
        out.push({ label: String(cursor.getDate()), value: ventasByDay.get(key) ?? 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      return out
    }
    // month
    const out: { label: string; value: number }[] = []
    const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
    const stop = new Date(range.end.getFullYear(), range.end.getMonth(), 1)
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    while (cursor <= stop) {
      let monthTotal = 0
      const y = cursor.getFullYear()
      const m = cursor.getMonth()
      for (const [key, val] of ventasByDay) {
        const [yy, mm] = key.split("-").map((s) => parseInt(s, 10))
        if (yy === y && mm - 1 === m) monthTotal += val
      }
      out.push({ label: monthNames[m], value: monthTotal })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return out
  }, [granularity, range, ventasByDay, ventasByHour])

  const max = Math.max(1, ...buckets.map((b) => b.value))
  const W = 800
  const H = 160
  const PAD_L = 28
  const PAD_R = 8
  const PAD_T = 12
  const PAD_B = 24
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const stepX = buckets.length > 1 ? innerW / (buckets.length - 1) : 0

  const points = buckets.map((b, i) => {
    const x = PAD_L + i * stepX
    const y = PAD_T + innerH - (b.value / max) * innerH
    return { x, y, ...b }
  })

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${PAD_T + innerH} L ${points[0].x} ${PAD_T + innerH} Z`
    : ""

  // Y ticks: 0, mid, max
  const yTicks = [0, max / 2, max]

  // Trim labels for readability
  const labelStep = Math.max(1, Math.ceil(buckets.length / 12))

  if (buckets.length === 0 || max === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-slate-400">
        Sin ventas en el período
      </div>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(15 23 42)" stopOpacity="0.10" />
          <stop offset="100%" stopColor="rgb(15 23 42)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {yTicks.map((t, i) => {
        const y = PAD_T + innerH - (t / max) * innerH
        return (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="rgb(241 245 249)" strokeWidth="1" />
            <text x={PAD_L - 6} y={y + 3} fontSize="9" fill="rgb(148 163 184)" textAnchor="end" fontFamily="monospace">
              {Math.round(t)}
            </text>
          </g>
        )
      })}
      {/* Area + line */}
      <path d={areaD} fill="url(#lineFill)" />
      <path d={pathD} fill="none" stroke="rgb(15 23 42)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="rgb(15 23 42)">
          <title>{`${p.label}: ${p.value} venta${p.value === 1 ? "" : "s"}`}</title>
        </circle>
      ))}
      {/* X labels */}
      {points.map((p, i) =>
        i % labelStep === 0 || i === points.length - 1 ? (
          <text
            key={i}
            x={p.x}
            y={H - 6}
            fontSize="9"
            fill="rgb(148 163 184)"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  )
}

/* ---------------- Sales heatmap ---------------- */

const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const DAY_NAMES_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun rows

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

  // Top day & hour band
  const topDayIdx = dayTotals.reduce((best, v, i) => (v > dayTotals[best] ? i : best), 0)
  const topDayName = DAY_NAMES_FULL[topDayIdx]
  // Top hour band: find best contiguous 6h window
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

  // Bucket: 0 (none), low, mid, high
  const colorFor = (v: number) => {
    if (max === 0 || v === 0) return { fill: "rgb(226 232 240)", size: 4 }
    const ratio = v / max
    if (ratio < 0.34) return { fill: "rgb(216 180 254)", size: 7 } // light purple
    if (ratio < 0.67) return { fill: "rgb(168 85 247)", size: 10 } // medium
    return { fill: "rgb(107 33 168)", size: 13 } // alta
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
          {/* Rows */}
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

          {/* Hour labels */}
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

      {/* Legend */}
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

/* ---------------- Top products list ---------------- */

function TopProductsList({ items, totalIngresos }: { items: TopItemRow[]; totalIngresos: number }) {
  if (items.length === 0) {
    return <div className="px-6 py-8 text-center text-sm text-slate-400">Sin ventas en el período</div>
  }

  return (
    <div className="max-h-[420px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 sticky top-0 z-10">
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
          {items.map((it, idx) => {
            const pct = totalIngresos > 0 ? (it.revenue / totalIngresos) * 100 : 0
            return (
              <tr key={it.sku} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3 text-slate-400 font-mono tabular-nums">{idx + 1}</td>
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
    // Don't navigate beyond current month
    if (next.getFullYear() > today.getFullYear() || (next.getFullYear() === today.getFullYear() && next.getMonth() > today.getMonth())) {
      return
    }
    setViewMonth(next)
  }

  // Build calendar grid (Mon-first)
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const lastOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7 // Mon=0..Sun=6
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
        {/* Month nav */}
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

        {/* Weekday header */}
        <div className="px-6 grid grid-cols-7 gap-y-2">
          {ES_WEEKDAYS_SHORT.map((w) => (
            <div key={w} className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold text-center py-2">
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
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
                  {/* Range strip background */}
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

        {/* Apply */}
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
