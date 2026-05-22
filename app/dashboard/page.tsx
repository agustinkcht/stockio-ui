"use client"

import { useState, useMemo } from "react"
import { LayoutDashboard, TrendingUp, TrendingDown, Wallet, ShoppingBag, Package, Tag, Users, ChevronDown, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react"
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

type PeriodKey = "mes_en_curso" | "mes_anterior" | "7d" | "30d" | "ano_en_curso"

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "mes_en_curso", label: "Mes en Curso" },
  { key: "mes_anterior", label: "Mes Anterior" },
  { key: "7d", label: "Últimos 7 días" },
  { key: "30d", label: "Últimos 30 días" },
  { key: "ano_en_curso", label: "Año en Curso" },
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

// YYYY-MM-DD inclusive comparison
const inRange = (dateStr: string, range: { startStr: string; endStr: string }): boolean =>
  dateStr >= range.startStr && dateStr <= range.endStr

const ymd = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getPeriodRange(key: PeriodKey, mesEnCursoStartDay: number): PeriodRange {
  const today = new Date()
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
  topItem: { name: string; units: number; revenue: number } | null
  payments: { efectivo: number; posnet: number; transferencia: number }
}

function computeMetrics(
  ventas: Venta[],
  range: PeriodRange,
  costoMap: Map<string, number>,
  cajaEgresos: number,
): DashboardMetrics {
  const ventasInRange = ventas.filter((v) => inRange(v.fecha, range))
  const valid = ventasInRange.filter((v) => v.estado !== "cancelada")
  const cancelled = ventasInRange.filter((v) => v.estado === "cancelada")

  let ingresos = 0
  let netoVenta = 0
  let mercaderia = 0
  let unidadesVendidas = 0
  const itemAgg = new Map<string, { name: string; units: number; revenue: number }>()
  const clientes = new Set<string>()

  for (const v of valid) {
    netoVenta += v.total
      if (v.cliente && v.cliente.tipo === "cuenta") clientes.add(v.cliente.id)
    else clientes.add("__cf__")
    for (const it of v.items) {
      const gross = it.unitPrice * it.quantity
      ingresos += gross
      unidadesVendidas += it.quantity
      const costo = costoMap.get(it.sku) ?? 0
      mercaderia += costo * it.quantity
      const agg = itemAgg.get(it.sku) ?? { name: it.name, units: 0, revenue: 0 }
      agg.units += it.quantity
      agg.revenue += it.total
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

  let topItem: DashboardMetrics["topItem"] = null
  for (const [, agg] of itemAgg) {
    if (!topItem || agg.revenue > topItem.revenue) topItem = agg
  }

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
    topItem,
    payments,
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

  const range = useMemo(
    () => getPeriodRange(periodKey, dashboard.mesEnCursoStartDay),
    [periodKey, dashboard.mesEnCursoStartDay],
  )

  const periodLabel = useMemo(() => {
    const opt = PERIOD_OPTIONS.find((o) => o.key === periodKey)
    return opt?.label ?? "Período"
  }, [periodKey])

  const rangeLabel = useMemo(() => {
    const fmt = (d: Date) =>
      d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    return `${fmt(range.start)} — ${fmt(range.end)}`
  }, [range])

  const costoMap = useMemo(() => buildCostoMap(items), [items])

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
    () => computeMetrics(ventas, range, costoMap, cajaEgresos),
    [ventas, range, costoMap, cajaEgresos],
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
                          setPeriodKey(k)
                          setPeriodOpen(false)
                        }}
                      />
                      <span className="text-sm text-slate-500 font-mono">{rangeLabel}</span>
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
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos</span>
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">
                    {formatARS(metrics.gastos)}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                    <GastoSubItem label="Promociones" value={metrics.promociones} dot="bg-rose-400" />
                    <GastoSubItem label="Mercadería" value={metrics.mercaderia} dot="bg-amber-400" />
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
                      {metrics.margen.toFixed(1)}% margen
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

              {/* Stats grid */}
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Operación</h2>
                    <p className="text-xs text-slate-500">Indicadores del período</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-slate-100 border-t border-slate-100">
                  <StatCell icon={<Receipt className="w-3.5 h-3.5" />} label="Ventas" value={formatNumber(metrics.ventasCount)} />
                  <StatCell icon={<ShoppingBag className="w-3.5 h-3.5" />} label="Unidades vendidas" value={formatNumber(metrics.unidadesVendidas)} />
                  <StatCell icon={<Package className="w-3.5 h-3.5" />} label="Unidades canceladas" value={formatNumber(metrics.unidadesCanceladas)} />
                  <StatCell icon={<Users className="w-3.5 h-3.5" />} label="Clientes" value={formatNumber(metrics.clientesUnicos)} />
                  <StatCell icon={<Tag className="w-3.5 h-3.5" />} label="Ticket promedio" value={formatARS(metrics.ticketPromedio)} />
                  <StatCell icon={<TrendingUp className="w-3.5 h-3.5" />} label="Margen" value={`${metrics.margen.toFixed(1)}%`} />
                </div>

                {/* Bottom row: top item + payments split */}
                <div className="grid grid-cols-1 lg:grid-cols-5 border-t border-slate-100">
                  {/* Top item */}
                  <div className="lg:col-span-2 px-6 py-5 border-b lg:border-b-0 lg:border-r border-slate-100">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Producto destacado</p>
                    {metrics.topItem ? (
                      <>
                        <p className="text-sm font-medium text-slate-900 truncate" title={metrics.topItem.name}>
                          {metrics.topItem.name}
                        </p>
                        <div className="mt-2 flex items-baseline gap-3">
                          <span className="text-lg font-semibold text-slate-900 tabular-nums">
                            {formatNumber(metrics.topItem.units)}
                          </span>
                          <span className="text-xs text-slate-500">unidades</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-sm text-slate-700 tabular-nums">
                            {formatARS(metrics.topItem.revenue)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">Sin datos en el período</p>
                    )}
                  </div>

                  {/* Payments breakdown */}
                  <div className="lg:col-span-3 px-6 py-5">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Cobros por medio</p>
                    <PaymentSplit payments={metrics.payments} />
                  </div>
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
