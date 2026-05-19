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
  ReceiptText,
  ChevronLeft,
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
  const [entregaMode, setEntregaMode] = useState(false)
  const [showClientePanel, setShowClientePanel] = useState(false)

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
  const estadoVenta = pagoPct === 100 && entregaPct === 100 ? "Completada" : "En Curso"
  const estadoVentaStyle = estadoVenta === "Completada"
    ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
    : { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }
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
            {/* Items Grid + Totals side by side */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
              <div className="grid grid-cols-3 gap-4 items-start">

              {/* Left col-span-2 */}
              <div className="col-span-2 flex flex-col gap-4">

                {/* ── Venta Info card ── */}
                {(() => {
                  const fechaObj = new Date(venta.fecha)
                  const mesCorto = fechaObj.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
                  const dia = fechaObj.toLocaleDateString("es-AR", { day: "2-digit" })
                  const inicial = venta.clienteNombre.charAt(0).toUpperCase()
                  return (
                    <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-3">
                      {/* Row 1: Venta ID + estado badge + date + origen + actions */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          {/* Venta ID + fecha/hora + origen all inline */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Venta</span>
                              <span className="text-lg font-bold text-slate-900 leading-tight">{venta.id}</span>
                            </div>
                            <div className="h-4 w-px bg-slate-200 shrink-0" />
                            <span className="text-xs text-slate-500 tabular-nums">
                              {dia} {mesCorto} {fechaObj.getFullYear()} · {venta.hora}
                            </span>
                            <div className="h-4 w-px bg-slate-200 shrink-0" />
                            <span className="text-xs text-slate-400">{getOrigen(venta.metodoPago)}</span>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 px-3 rounded-md flex items-center"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                            Ver ticket
                          </button>
                          <div className="relative" ref={moreMenuRef}>
                            <button
                              onClick={() => setShowMoreOptionsMenu(!showMoreOptionsMenu)}
                              className="h-8 w-8 flex items-center justify-center transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer rounded-md"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </button>
                            {showMoreOptionsMenu && (
                              <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                                  <FileDown className="w-4 h-4 text-slate-400" />
                                  Descargar PDF
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                                  <XCircle className="w-4 h-4 text-red-400" />
                                  Cancelar venta
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Cliente pill — clickable, opens slide-in panel */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowClientePanel(!showClientePanel)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-slate-200/60 shadow-sm bg-slate-50/60 hover:bg-slate-100/60 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-white">{inicial}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Cliente</span>
                            <span className="text-sm font-semibold text-slate-800 leading-tight">{venta.clienteNombre}</span>
                          </div>
                        </button>

                        {/* Slide-in client info panel */}
                        {showClientePanel && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                <span className="text-sm font-semibold text-white">{inicial}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 leading-tight">{venta.clienteNombre}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Cliente particular</p>
                                <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Método de pago</span>
                                    <span className="text-xs text-slate-700">{metodoPagoLabels[venta.metodoPago]}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Origen</span>
                                    <span className="text-xs text-slate-700">{getOrigen(venta.metodoPago)}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowClientePanel(false)}
                                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* ── Estado milestones card ── */}
                {(() => {
                  const steps = [
                    { label: "Borrador", key: "borrador" },
                    { label: "En Curso", key: "en_curso" },
                    { label: "Finalizada", key: "finalizada" },
                  ]
                  const activeIndex = (pagoPct === 100 && entregaPct === 100) ? 2
                    : (pagoPct > 0 || entregaPct > 0) ? 1 : 0

                  return (
                    <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm px-5 pt-3 pb-4">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-3">Estado de la Venta</span>
                      <div className="flex items-center">
                        {steps.map((s, i) => {
                          const isDone = i < activeIndex
                          const isActive = i === activeIndex
                          const isFuture = i > activeIndex
                          const isLast = i === steps.length - 1
                          return (
                            <div key={s.key} className="flex items-center flex-1 min-w-0">
                              <div className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-300 ${isFuture ? "opacity-30" : ""}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                  ${isDone
                                    ? "bg-slate-800 border-slate-800 shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
                                    : isActive
                                      ? "bg-white border-slate-800 shadow-[0_0_0_3px_rgba(15,23,42,0.1)]"
                                      : "bg-white border-slate-200"}`}
                                >
                                  {isDone && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                  {isActive && <div className="w-2 h-2 rounded-full bg-slate-800" />}
                                </div>
                                <span className={`text-[11px] whitespace-nowrap transition-all duration-300
                                  ${isDone ? "font-medium text-slate-400"
                                    : isActive ? "font-semibold text-slate-900"
                                    : "font-medium text-slate-400"}`}>
                                  {s.label}
                                </span>
                              </div>
                              {!isLast && (
                                <div className={`flex-1 h-px mx-3 mb-[18px] transition-all duration-500 ${isDone ? "bg-slate-800" : "bg-slate-200"}`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Entrega + Items card */}
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">

                {/* ── Title strip ── */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  {/* Left: products + units */}
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800">
                        {venta.items.length} {venta.items.length === 1 ? "producto" : "productos"}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-sm text-slate-500 tabular-nums">
                        {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
                      </span>
                    </div>
                  </div>
                  {/* Right: entrega info + toggle button */}
                  <div className="flex items-center gap-3">
                    <Truck className={`w-4 h-4 shrink-0 ${entregaPct === 100 ? "text-emerald-500" : entregaPct > 0 ? "text-amber-500" : "text-slate-400"}`} />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-slate-800">Entrega</span>
                      <span className={`text-xs font-semibold tabular-nums ${entregaPct === 100 ? "text-emerald-600" : entregaPct > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {entregaPct}%
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">{entregadasUnidades}/{totalUnidades}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200 shrink-0" />
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
                </div>

                {/* ── Grid (padded inside card) ── */}
                <div className="p-3">
                <div className="rounded-md border border-slate-200/80 overflow-hidden">



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
                          <div className="grid grid-cols-100 h-[56px]">
                            {/* Item Info */}
                            <div className="col-span-70 flex items-center gap-3 px-4">
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
                            {/* Cantidad col */}
                            <div className="col-span-15 flex items-center justify-center">
                              <span className="text-sm text-slate-700 tabular-nums">{item.quantity}</span>
                            </div>
                            {/* Entregado col */}
                            <div className="col-span-15 flex flex-col items-center justify-center pr-4 gap-1">
                              {itemPct === 100 ? (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-sm font-medium text-emerald-700 tabular-nums">{item.quantity}</span>
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
                          <div className="grid grid-cols-[40%_20%_20%_20%] min-h-[56px]">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 px-4 py-2 overflow-hidden">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image src={getCategoryImage(display.categoria || "") || "/placeholder.svg"} alt={item.name} width={32} height={32} className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="text-sm font-medium text-gray-900 break-words leading-tight">{display.name}</p>
                                  {display.tags.length > 0 && display.tags.map((tag, i) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
                                  ))}
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

                            {/* Precio Unit. col — with promo logic for % and $ */}
                            <div className="flex flex-col items-center justify-center gap-0.5 py-2">
                              {item.discount > 0 && (item.discountType === "percent" || item.discountType === "fixed") ? (
                                <>
                                  {/* Original price dashed + promo badge inline */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-400 line-through tabular-nums">
                                      ${item.unitPrice.toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-[10px] font-semibold text-red-500">
                                      {item.discountType === "percent"
                                        ? `-${item.discount}%`
                                        : `-$${item.discount.toLocaleString("es-AR")}`}
                                    </span>
                                  </div>
                                  {/* Final unit price */}
                                  <span className="text-sm font-medium text-slate-800 tabular-nums">
                                    ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                              )}
                            </div>

                            {/* Cantidad col */}
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="text-sm text-slate-700 tabular-nums">{item.quantity}</span>
                              <span className="text-[10px] text-slate-400 leading-tight">{item.quantity === 1 ? "unidad" : "unidades"}</span>
                            </div>

                            {/* Subtotal col */}
                            <div className="flex flex-col items-end justify-center pr-6 py-2 gap-0.5">
                              <span className="text-sm font-bold text-slate-900 tabular-nums">${item.total.toLocaleString("es-AR")}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>{/* end rounded inner grid */}
              </div>{/* end p-3 padding wrapper */}
              </div>{/* end entrega+items card */}
              </div>{/* end col-span-2 flex column */}

              {/* Right col-span-1: single white panel, content directly on background */}
              {venta.items.length > 0 && (
                <div className="col-span-1 bg-white rounded-lg shadow-sm overflow-hidden sticky top-0">
                  <div className="px-5 py-5 flex flex-col gap-0">

                    {/* ��─ Resumen section ── */}
                    <p className="text-sm font-semibold text-slate-800 mb-4">Resumen</p>

                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Subtotal</span>
                      <span className="text-sm text-slate-700 tabular-nums">${Math.round(venta.subtotal).toLocaleString("es-AR")}</span>
                    </div>

                    {itemDiscountAmount > 0 && (
                      <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                        <span className="text-sm text-red-500">Promociones</span>
                        <span className="text-sm text-red-500 tabular-nums">−${Math.round(itemDiscountAmount).toLocaleString("es-AR")}</span>
                      </div>
                    )}

                    {venta.descuento > 0 && (
                      <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                        <span className="text-sm text-slate-500">
                          Descuento{" "}
                          <span className="text-[10px] text-slate-400">
                            ({venta.descuentoTipo === "percent" ? `${venta.descuento}%` : `$${venta.descuento.toLocaleString("es-AR")}`})
                          </span>
                        </span>
                        <span className="text-sm text-red-500 tabular-nums">
                          −${Math.round(venta.descuentoTipo === "percent" ? venta.subtotal * (venta.descuento / 100) : venta.descuento).toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-3 mt-1">
                      <span className="text-base font-bold text-slate-900">Total</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">${Math.round(venta.total).toLocaleString("es-AR")}</span>
                    </div>

                    {venta.observaciones && (
                      <div className="flex justify-between text-[11px] gap-3 pt-2 border-t border-slate-100">
                        <span className="text-slate-400 shrink-0">Observaciones</span>
                        <span className="text-slate-600 text-right">{venta.observaciones}</span>
                      </div>
                    )}

                    {/* ── Divider between sections ── */}
                    <div className="border-t border-slate-200 my-4" />

                    {/* ── Detalle del Cobro section ── */}
                    <p className="text-sm font-semibold text-slate-800 mb-3">Detalle del Cobro</p>

                    <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 overflow-hidden">
                      {/* Cobro status row */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Wallet className={`w-4 h-4 ${pagoPct === 100 ? "text-emerald-500" : pagoPct > 0 ? "text-amber-500" : "text-slate-400"}`} />
                          <span className="text-sm text-slate-700">Cobro</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-sm font-semibold tabular-nums ${pagoPct === 100 ? "text-emerald-600" : pagoPct > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {pagoPct}%
                          </span>
                          <span className="text-xs text-slate-400 tabular-nums">
                            ${montoCobrado.toLocaleString("es-AR")}/${Math.round(venta.total).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                      {/* Transactions */}
                      {montoCobrado > 0 ? (
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 tabular-nums">
                              {new Date(venta.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                            </span>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs text-slate-500">{metodoPagoLabels[venta.metodoPago]}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">
                            ${montoCobrado.toLocaleString("es-AR")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-5">
                          <span className="text-xs text-slate-400">Sin cobros registrados</span>
                        </div>
                      )}
                    </div>

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
