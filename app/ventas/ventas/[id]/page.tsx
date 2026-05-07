"use client"

import { useState, useMemo, use, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import {
  FileDown,
  FileText,
  Receipt,
  ReceiptText,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Wallet,
  ScanLine,
} from "lucide-react"
import Image from "next/image"
import { VENTAS } from "@/lib/data/ventas"
import type { Venta, VentaItem, PaymentMethod } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"

const estadoLabels: Record<Venta["estado"], string> = {
  completada: "Completada",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
}

const estadoColors: Record<Venta["estado"], { bg: string; text: string; icon: typeof Clock }> = {
  completada: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
  pendiente: { bg: "bg-slate-100", text: "text-slate-600", icon: Clock },
  cancelada: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
}

const metodoPagoLabels: Record<Venta["metodoPago"], string> = {
  efectivo: "Efectivo",
  posnet: "Posnet",
  transferencia: "Transferencia",
}

function getOrigen(metodoPago: PaymentMethod): string {
  return metodoPago === "posnet" ? "Punto de Venta" : "Manual"
}

export default function VentaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const venta = useMemo(() => VENTAS.find((v) => v.id === id) || null, [id])

  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [subtotalExpanded, setSubtotalExpanded] = useState(false)
  const [entregaMode, setEntregaMode] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreOptionsMenu(false)
      }
    }
    if (showExportDropdown || showMoreOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showExportDropdown, showMoreOptionsMenu])

  if (!venta) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)]">
        <div className="px-[6px] py-[6px] flex gap-[6px] h-screen">
          <div className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
            <Sidebar
              sidebarItems={SIDEBAR_ITEMS}
              bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
              hoveredDropdown={hoveredDropdown}
              onDropdownOpen={handleDropdownMouseEnter}
              onDropdownClose={handleDropdownMouseLeave}
            />
          </div>
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden items-center justify-center">
            <Package className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-500 mb-1">Venta no encontrada</p>
            <p className="text-xs text-slate-400 mb-4">La venta {id} no existe</p>
            <button
              onClick={() => router.push("/ventas/ventas")}
              className="text-sm text-blue-600 hover:underline"
            >
              Volver a ventas
            </button>
          </div>
        </div>
      </div>
    )
  }

  const estadoStyle = estadoColors[venta.estado]
  const EstadoIcon = estadoStyle.icon
  const isFacturada = !!venta.facturaEmitida
  const fechaCreacion = new Date(venta.fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const itemDiscountAmount = venta.items.reduce((sum, it) => {
    const baseGross = it.unitPrice * it.quantity
    const discount =
      it.discountType === "percent" ? baseGross * (it.discount / 100) : it.discount * it.quantity
    return sum + discount
  }, 0)

  // Derived cobro & entrega percentages (deterministic from estado)
  const pagoPct = venta.estado === "completada" ? 100 : venta.estado === "pendiente" ? 50 : 0
  const entregaPct = venta.estado === "completada" ? 100 : 0
  const montoCobrado = Math.round(venta.total * pagoPct / 100)
  const montoRestante = Math.round(venta.total - montoCobrado)
  // Per-item delivered quantity (deterministic: completada = all, pendiente = half, cancelada = 0)
  const itemEntregaMap = new Map(
    venta.items.map((item, idx) => [
      idx,
      venta.estado === "completada"
        ? item.quantity
        : venta.estado === "pendiente"
          ? Math.floor(item.quantity / 2)
          : 0,
    ])
  )
  const totalUnidades = venta.items.reduce((s, it) => s + it.quantity, 0)
  const entregadasUnidades = venta.items.reduce((s, it, idx) => s + (itemEntregaMap.get(idx) ?? 0), 0)

  const breadcrumbs = [
    { label: "Ventas" },
    { label: "Ventas", href: "/ventas/ventas" },
    { label: venta.id },
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/ventas/ventas")}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                  aria-label="Volver a ventas"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div />
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Order Header - styled like presupuesto detail */}
            <div className="px-6 py-4 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title and info */}
                <div className="flex items-center gap-6">
                  {/* Venta ID */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Venta</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{venta.id}</h1>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Origen */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Origen</span>
                    <span className="text-sm font-medium text-gray-700">
                      {getOrigen(venta.metodoPago)}
                    </span>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Fecha */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha</span>
                    <span className="text-sm font-medium text-gray-700">
                      {fechaCreacion}
                      <span className="text-slate-400"> · {venta.hora}</span>
                    </span>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Estado */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Estado</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${estadoStyle.bg} ${estadoStyle.text}`}
                      >
                        <EstadoIcon className="w-3 h-3" />
                        {estadoLabels[venta.estado]}
                      </span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Cliente */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cliente</span>
                    <span className="text-sm font-semibold text-gray-800">{venta.clienteNombre}</span>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  {/* Facturación pill */}
                  {isFacturada ? (
                    <div className="h-8 flex items-center gap-1.5 px-3 rounded-md bg-blue-50 border border-blue-100">
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Facturada</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center"
                    >
                      <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                      Ver ticket detalle
                    </button>
                  )}

                  {/* Export dropdown */}
                  <div className="relative" ref={exportDropdownRef}>
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center"
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-500" />
                      Exportar
                    </button>
                    {showExportDropdown && (
                      <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                          <FileDown className="w-4 h-4 text-slate-400" />
                          Exportar PDF
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                          <FileText className="w-4 h-4 text-slate-400" />
                          Exportar Texto
                        </button>
                      </div>
                    )}
                  </div>

                  {/* More Options Menu */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreOptionsMenu(!showMoreOptionsMenu)}
                      className="h-8 w-8 flex items-center justify-center text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer rounded-md"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Grid + Totals side by side */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
              <div className="grid grid-cols-3 gap-4 items-start">

              {/* Left: Items card (col-span-2) */}
              <div className="col-span-2">
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">

                {/* ── Entrega header ── */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className={`w-4 h-4 ${entregaPct === 100 ? "text-emerald-500" : entregaPct > 0 ? "text-amber-500" : "text-slate-400"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {entregaPct === 100 ? "Entregado" : entregaPct > 0 ? "Entrega parcial" : "Pendiente de entrega"}
                        </span>
                        <span className={`text-xs font-semibold tabular-nums ${entregaPct === 100 ? "text-emerald-600" : entregaPct > 0 ? "text-amber-600" : "text-slate-400"}`}>
                          {entregaPct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${entregaPct === 100 ? "bg-emerald-500" : entregaPct > 0 ? "bg-amber-400" : "bg-slate-300"}`}
                            style={{ width: `${entregaPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums">{entregadasUnidades} / {totalUnidades} uds</span>
                      </div>
                    </div>
                  </div>
                  {/* Toggle entrega mode */}
                  <button
                    type="button"
                    onClick={() => setEntregaMode(!entregaMode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      entregaMode
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    {entregaMode ? "Ver detalle" : "Ver entrega"}
                  </button>
                </div>

                {/* ── Grid Header ── */}
                <div className="bg-slate-100 border-b border-slate-200/80">
                  {entregaMode ? (
                    <div className="grid grid-cols-[2.5fr_1fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center px-4">Item</div>
                      <div className="flex items-center justify-center pr-4">Entrega</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[2.5fr_0.8fr_1fr_1.2fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center px-4">Item</div>
                      <div className="flex items-center justify-center">Cantidad</div>
                      <div className="flex items-center justify-center">Precio Unit.</div>
                      <div className="flex items-center justify-center pr-4">Promoción</div>
                    </div>
                  )}
                </div>

                {/* ── Items ── */}
                {venta.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Package className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-slate-500 mb-1">Sin items</p>
                    <p className="text-xs text-slate-400">Esta venta no tiene items asociados</p>
                  </div>
                ) : (
                  venta.items.map((item, idx) => {
                    const display = getVentaItemDisplay(item)
                    const baseGross = item.unitPrice * item.quantity
                    const discountAmount =
                      item.discountType === "percent"
                        ? baseGross * (item.discount / 100)
                        : item.discount * item.quantity
                    const adjustedUnitPrice = Math.max(0, item.unitPrice - (discountAmount / Math.max(item.quantity, 1)))
                    const delivered = itemEntregaMap.get(idx) ?? 0
                    const itemPct = item.quantity === 0 ? 0 : Math.round((delivered / item.quantity) * 100)

                    return (
                      <div
                        key={`${venta.id}-item-${idx}`}
                        onClick={() => setViewingItem(item)}
                        className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/50 cursor-pointer"
                      >
                        {entregaMode ? (
                          <div className="grid grid-cols-[2.5fr_1fr] h-[56px]">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 px-4">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image src={getCategoryImage(display.categoria || "") || "/placeholder.svg"} alt={item.name} width={32} height={32} className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate leading-tight">{display.name}</p>
                                {(display.marca || display.categoria) && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {display.marca && <span className="text-xs text-slate-400 leading-tight">{display.marca}</span>}
                                    {display.marca && display.categoria && <span className="text-xs text-slate-300">·</span>}
                                    {display.categoria && <span className="text-xs text-slate-400 leading-tight">{display.categoria}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Entrega col */}
                            <div className="flex flex-col items-center justify-center pr-4 gap-1">
                              {itemPct === 100 ? (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-sm font-medium text-emerald-700 tabular-nums">{item.quantity} uds</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-baseline gap-1 tabular-nums">
                                    <span className={`text-sm font-semibold ${delivered > 0 ? "text-amber-600" : "text-slate-400"}`}>{delivered}</span>
                                    <span className="text-xs text-slate-400">/ {item.quantity}</span>
                                  </div>
                                  <div className="w-14 h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${delivered > 0 ? "bg-amber-400" : "bg-slate-300"}`} style={{ width: `${itemPct}%` }} />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-[2.5fr_0.8fr_1fr_1.2fr] h-[56px]">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 px-4">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image src={getCategoryImage(display.categoria || "") || "/placeholder.svg"} alt={item.name} width={32} height={32} className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate leading-tight">{display.name}</p>
                                  {display.tags.length > 0 && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {display.tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {(display.marca || display.categoria) && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {display.marca && <span className="text-xs text-slate-400 leading-tight">{display.marca}</span>}
                                    {display.marca && display.categoria && <span className="text-xs text-slate-300">·</span>}
                                    {display.categoria && <span className="text-xs text-slate-400 leading-tight">{display.categoria}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Cantidad */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-700">{item.quantity}</span>
                            </div>
                            {/* Precio Unit */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-700">${item.unitPrice.toLocaleString("es-AR")}</span>
                            </div>
                            {/* Promoción */}
                            <div className="flex flex-col items-center justify-center pr-4">
                              {item.discount > 0 ? (
                                <>
                                  <span className="text-sm text-red-500">
                                    {item.discountType === "percent" ? `-${item.discount}%` : `-$${item.discount.toLocaleString("es-AR")}`}
                                  </span>
                                  <span className="text-[10px] text-slate-400 leading-tight">${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}</span>
                                </>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              </div>{/* end col-span-2 */}

              {/* Right: Cobro + Totals card (col-span-1) */}
              {venta.items.length > 0 && (
                <div className="col-span-1">
                  <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">

                    {/* ── Cobro header ── */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Wallet className={`w-4 h-4 ${pagoPct === 100 ? "text-emerald-500" : pagoPct > 0 ? "text-amber-500" : "text-slate-400"}`} />
                          <span className="text-sm font-semibold text-slate-800">
                            {pagoPct === 100 ? "Cobro completo" : pagoPct > 0 ? "Cobro parcial" : "Sin cobro"}
                          </span>
                          <span className={`text-xs font-semibold tabular-nums ${pagoPct === 100 ? "text-emerald-600" : pagoPct > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {pagoPct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full transition-all ${pagoPct === 100 ? "bg-emerald-500" : pagoPct > 0 ? "bg-amber-400" : "bg-slate-300"}`}
                          style={{ width: `${pagoPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-400">Cobrado</span>
                          <span className="font-semibold text-slate-800 tabular-nums">${montoCobrado.toLocaleString("es-AR")}</span>
                        </div>
                        {montoRestante > 0 && (
                          <div className="flex flex-col gap-0.5 items-end">
                            <span className="text-slate-400">Restante</span>
                            <span className="font-semibold text-amber-600 tabular-nums">${montoRestante.toLocaleString("es-AR")}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Medio</span>
                        <span className="text-slate-700 font-medium">{metodoPagoLabels[venta.metodoPago]}</span>
                      </div>
                    </div>

                    {/* ── Subtotal section (collapsible) ── */}
                    {/* Header row — same h-9 as grid header */}
                    <button
                      type="button"
                      onClick={() => setSubtotalExpanded(!subtotalExpanded)}
                      className="w-full h-9 bg-slate-100 border-b border-slate-200/80 flex items-center justify-between px-4 hover:bg-slate-200/40 transition-colors cursor-pointer rounded-t-lg"
                    >
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Subtotal</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 tabular-nums">
                          ${Math.round(venta.subtotal).toLocaleString("es-AR")}
                        </span>
                        {subtotalExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        }
                      </div>
                    </button>

                    {/* Per-item subtotal rows — h-[56px] matches grid rows exactly */}
                    {subtotalExpanded && venta.items.map((item, idx) => {
                      const baseGross = item.unitPrice * item.quantity
                      const discountAmount =
                        item.discountType === "percent"
                          ? baseGross * (item.discount / 100)
                          : item.discount * item.quantity
                      const adjustedUnitPrice = Math.max(
                        0,
                        item.unitPrice - discountAmount / Math.max(item.quantity, 1),
                      )
                      return (
                        <div
                          key={`subtotal-row-${idx}`}
                          className="border-b border-slate-100 last:border-b-0 h-[56px] flex flex-col items-end justify-center px-4 gap-0.5"
                        >
                          <span className="text-[11px] text-slate-400 tabular-nums leading-tight">
                            {item.quantity} × ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 tabular-nums leading-tight">
                            ${item.total.toLocaleString("es-AR")}
                          </span>
                        </div>
                      )
                    })}

                    {/* ── Financial breakdown ── */}
                    <div className="px-4 py-3 space-y-1.5 border-t border-slate-100">
                      {/* Promociones */}
                      {itemDiscountAmount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-red-500">Promociones</span>
                          <span className="text-red-500 tabular-nums">
                            −${Math.round(itemDiscountAmount).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}

                      {/* Descuento global */}
                      {venta.descuento > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">
                            Descuento
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({venta.descuentoTipo === "percent"
                                ? `${venta.descuento}%`
                                : `$${venta.descuento.toLocaleString("es-AR")}`})
                            </span>
                          </span>
                          <span className="text-red-500 tabular-nums">
                            −${Math.round(
                              venta.descuentoTipo === "percent"
                                ? venta.subtotal * (venta.descuento / 100)
                                : venta.descuento,
                            ).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-slate-200">
                        <span className="text-slate-700">Total</span>
                        <span className="text-slate-900 tabular-nums">
                          ${Math.round(venta.total).toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>

                    {/* ── Observaciones footer (only if present) ── */}
                    {venta.observaciones && (
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
                        <div className="flex justify-between text-[11px] gap-3">
                          <span className="text-slate-400 shrink-0">Observaciones</span>
                          <span className="text-slate-600 text-right">{venta.observaciones}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              </div>{/* end grid grid-cols-3 */}
            </div>
          </main>
        </div>
      </div>

      {viewingItem && (
        <VentaItemDetailModal ventaItem={viewingItem} onClose={() => setViewingItem(null)} />
      )}
    </div>
  )
}
