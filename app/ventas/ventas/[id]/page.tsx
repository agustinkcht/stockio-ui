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
  MoreVertical,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Wallet,
  Plus,
  Check,
} from "lucide-react"
import Image from "next/image"
import { VENTAS } from "@/lib/data/ventas"
import type { Venta, VentaItem } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import {
  getVentaCobros,
  getVentaItemEntregas,
  getEntregaTotals,
  getCobroTotals,
} from "@/lib/utils/venta-derived-state"

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

export default function VentaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const venta = useMemo(() => VENTAS.find((v) => v.id === id) || null, [id])

  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
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

  // Derived cobro & entrega state (mocked deterministically; would come from backend)
  const cobros = getVentaCobros(venta)
  const cobroTotals = getCobroTotals(venta, cobros)
  const entregaMap = getVentaItemEntregas(venta)
  const entregaTotals = getEntregaTotals(venta, entregaMap)

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

                  {/* Cliente */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cliente</span>
                    <span className="text-sm font-semibold text-gray-800">{venta.clienteNombre}</span>
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

                  {/* Fecha */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha</span>
                    <span className="text-sm font-medium text-gray-700">
                      {fechaCreacion}
                      <span className="text-slate-400"> · {venta.hora}</span>
                    </span>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Método de pago */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Método</span>
                    <span className="text-sm font-medium text-gray-700">
                      {metodoPagoLabels[venta.metodoPago]}
                    </span>
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

              {/* Left: Items grid (col-span-2) */}
              <div className="col-span-2">
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
                {/* Entrega progress strip */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-800">Entrega</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            entregaTotals.percent === 100
                              ? "bg-emerald-500"
                              : entregaTotals.percent > 0
                                ? "bg-amber-500"
                                : "bg-slate-300"
                          }`}
                          style={{ width: `${entregaTotals.percent}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          entregaTotals.percent === 100
                            ? "text-emerald-600"
                            : entregaTotals.percent > 0
                              ? "text-amber-600"
                              : "text-slate-400"
                        }`}
                      >
                        {entregaTotals.percent}%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {entregaTotals.deliveredUnidades} de {entregaTotals.totalUnidades} uds entregadas
                  </span>
                </div>

                {/* Grid Header */}
                <div className="bg-slate-50 border-b border-slate-200/80">
                  <div className="grid grid-cols-[2.5fr_0.9fr_1fr_auto_1.2fr_auto_1.2fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center px-4">Item</div>
                    <div className="flex items-center justify-center">Cant. / Entrega</div>
                    <div className="flex items-center justify-center">Precio Unit.</div>
                    <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                    <div className="flex items-center justify-center">Promoción</div>
                    <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                    <div className="flex items-center justify-end pr-4">Subtotal</div>
                  </div>
                </div>

                {/* Items */}
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

                    const delivered = entregaMap.get(`${item.sku}-${idx}`) ?? 0
                    const itemPercent =
                      item.quantity === 0 ? 0 : Math.round((delivered / item.quantity) * 100)
                    const accent =
                      itemPercent === 100
                        ? "border-l-emerald-400"
                        : itemPercent > 0
                          ? "border-l-amber-400"
                          : "border-l-slate-200"

                    return (
                      <div
                        key={`${venta.id}-item-${idx}`}
                        onClick={() => setViewingItem(item)}
                        className={`border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/50 cursor-pointer border-l-2 ${accent}`}
                      >
                        <div className="grid grid-cols-[2.5fr_0.9fr_1fr_auto_1.2fr_auto_1.2fr] min-h-[72px]">
                          {/* Item Info */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <Image
                                src={getCategoryImage(display.categoria || "") || "/placeholder.svg"}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {display.name}
                                </p>
                                {display.tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {display.tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">sku: {item.sku || "Sin SKU"}</p>
                              {(display.marca || display.categoria) && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {display.marca && (
                                    <span className="text-xs text-slate-400">{display.marca}</span>
                                  )}
                                  {display.marca && display.categoria && (
                                    <span className="text-xs text-slate-300">·</span>
                                  )}
                                  {display.categoria && (
                                    <span className="text-xs text-slate-400">{display.categoria}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Cantidad / Entrega */}
                          <div className="flex flex-col items-center justify-center gap-1 px-2">
                            {itemPercent === 100 ? (
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-sm text-slate-700 tabular-nums">
                                  {item.quantity}
                                </span>
                                <span className="text-[10px] text-slate-400">uds</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-baseline gap-1 tabular-nums">
                                  <span
                                    className={`text-sm font-medium ${
                                      itemPercent > 0 ? "text-amber-600" : "text-slate-400"
                                    }`}
                                  >
                                    {delivered}
                                  </span>
                                  <span className="text-xs text-slate-400">/</span>
                                  <span className="text-sm text-slate-700">{item.quantity}</span>
                                  <span className="text-[10px] text-slate-400 ml-0.5">uds</span>
                                </div>
                                <div className="w-14 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      itemPercent > 0 ? "bg-amber-400" : "bg-slate-300"
                                    }`}
                                    style={{ width: `${itemPercent}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Precio Unit */}
                          <div className="flex items-center justify-center">
                            <span className="text-sm text-slate-700">
                              ${item.unitPrice.toLocaleString("es-AR")}
                            </span>
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center justify-center w-6 text-slate-300">→</div>

                          {/* Promoción */}
                          <div className="flex flex-col items-center justify-center">
                            {item.discount > 0 ? (
                              <>
                                <span className="text-sm text-red-500">
                                  {item.discountType === "percent"
                                    ? `-${item.discount}%`
                                    : `-$${item.discount.toLocaleString("es-AR")}`}
                                </span>
                                <span className="text-[10px] text-slate-400 leading-tight">
                                  → ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center justify-center w-6 text-slate-300">→</div>

                          {/* Subtotal */}
                          <div className="flex flex-col items-center justify-center pr-4 text-right w-full">
                            <span className="text-[11px] text-slate-400 leading-tight">
                              {item.quantity} x ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                            </span>
                            <span className="text-sm font-semibold text-slate-800 leading-tight">
                              ${item.total.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              </div>{/* end col-span-2 items grid wrapper */}

              {/* Right: Cobro & Total card (col-span-1) */}
              {venta.items.length > 0 && (
                <div className="col-span-1">
                  <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm flex flex-col">
                    {/* Cobro progress strip */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-slate-500" />
                          <h3 className="text-sm font-semibold text-slate-800">Cobro</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                cobroTotals.percent === 100
                                  ? "bg-emerald-500"
                                  : cobroTotals.percent > 0
                                    ? "bg-amber-500"
                                    : "bg-slate-300"
                              }`}
                              style={{ width: `${cobroTotals.percent}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold tabular-nums ${
                              cobroTotals.percent === 100
                                ? "text-emerald-600"
                                : cobroTotals.percent > 0
                                  ? "text-amber-600"
                                  : "text-slate-400"
                            }`}
                          >
                            {cobroTotals.percent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cobros list */}
                    {cobros.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {cobros.map((cobro) => (
                          <div key={cobro.id} className="px-4 py-2.5 flex items-center gap-3">
                            <div className="text-[11px] text-slate-500 tabular-nums w-14 shrink-0">
                              {new Date(cobro.date).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 tabular-nums">
                                ${cobro.amount.toLocaleString("es-AR")}
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {metodoPagoLabels[cobro.medioPago]}
                              </div>
                            </div>
                            <Receipt className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-center">
                        <p className="text-[11px] text-slate-400">Sin cobros registrados</p>
                      </div>
                    )}

                    {/* Financial breakdown */}
                    <div className="px-4 py-3 border-t border-slate-100 space-y-1.5 bg-slate-50/40">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="text-slate-700 tabular-nums">
                          ${Math.round(venta.subtotal).toLocaleString("es-AR")}
                        </span>
                      </div>
                      {itemDiscountAmount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-red-500">Promociones</span>
                          <span className="text-red-500 tabular-nums">
                            -${Math.round(itemDiscountAmount).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                      {venta.descuento > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">
                            Descuento
                            <span className="text-[10px] text-slate-400 ml-1">
                              (
                              {venta.descuentoTipo === "percent"
                                ? `${venta.descuento}%`
                                : `$${venta.descuento.toLocaleString("es-AR")}`}
                              )
                            </span>
                          </span>
                          <span className="text-red-500 tabular-nums">
                            -$
                            {Math.round(
                              venta.descuentoTipo === "percent"
                                ? venta.subtotal * (venta.descuento / 100)
                                : venta.descuento,
                            ).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-slate-200">
                        <span className="text-slate-700">Total</span>
                        <span className="text-slate-900 tabular-nums">
                          ${Math.round(venta.total).toLocaleString("es-AR")}
                        </span>
                      </div>
                      {cobroTotals.restante > 0 && (
                        <div className="flex justify-between text-[11px] pt-0.5">
                          <span className="text-slate-400">Restante por cobrar</span>
                          <span className="text-amber-600 font-medium tabular-nums">
                            ${cobroTotals.restante.toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registrar Cobro CTA */}
                    <div className="px-4 py-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={cobroTotals.percent === 100}
                        className={`w-full h-9 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                          cobroTotals.percent === 100
                            ? "bg-emerald-50 text-emerald-700 cursor-not-allowed"
                            : "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                        }`}
                      >
                        {cobroTotals.percent === 100 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Cobrado
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Registrar Cobro
                          </>
                        )}
                      </button>
                    </div>

                    {/* Vendedor / Observaciones footer */}
                    <div className="px-4 py-2.5 border-t border-slate-100 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Vendedor</span>
                        <span className="text-slate-600">{venta.vendedor}</span>
                      </div>
                      {venta.observaciones && (
                        <div className="flex justify-between text-[11px] gap-3">
                          <span className="text-slate-400 shrink-0">Observaciones</span>
                          <span className="text-slate-600 text-right">{venta.observaciones}</span>
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
