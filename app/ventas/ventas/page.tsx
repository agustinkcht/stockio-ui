"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import {
  ChevronDown,
  FileDown,
  MoreVertical,
  ListFilter,
  ArrowUpDown,
  LayoutGrid,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  ReceiptText,
  Check,
  Minus,
  Search,
} from "lucide-react"
import { VENTAS } from "@/lib/data/ventas"
import type { Venta, VentaItem, PaymentMethod } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"

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

const monthsAbbr = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatVentaDateTime(dateStr: string, hora: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = monthsAbbr[date.getMonth()]
  return `${day} ${month} ${hora}`
}

function getOrigen(metodoPago: PaymentMethod): string {
  return metodoPago === "posnet" ? "Punto de Venta" : "Manual"
}

function getPagoPercent(estado: Venta["estado"]): number {
  if (estado === "completada") return 100
  if (estado === "pendiente") return 50
  return 0
}

function getEntregaPercent(estado: Venta["estado"]): number {
  if (estado === "completada") return 100
  return 0
}

export default function VentasPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const [selectedVentas, setSelectedVentas] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const allSelected = selectedVentas.size === VENTAS.length && VENTAS.length > 0
  const someSelected = selectedVentas.size > 0 && selectedVentas.size < VENTAS.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedVentas(new Set())
    } else {
      setSelectedVentas(new Set(VENTAS.map((v) => v.id)))
    }
  }

  const toggleSelectVenta = (id: string) => {
    const next = new Set(selectedVentas)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedVentas(next)
  }

  const breadcrumbs = [{ label: "Ventas" }, { label: "Ventas", href: "/ventas/ventas" }]

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
            {/* Toolbar - styled like presupuesto detail (empty) */}
            <div className="px-6 py-4 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title and info */}
                <div className="flex items-center gap-6">
                  {/* Venta */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Venta</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">&nbsp;</h1>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Cliente */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cliente</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-800">&nbsp;</span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Estado */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Estado</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      </span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Fecha Creación */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha Creación</span>
                    <span className="text-sm font-medium text-gray-700">&nbsp;</span>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center opacity-50 cursor-not-allowed"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    Exportar
                  </button>
                  <button
                    disabled
                    className="h-8 w-8 flex items-center justify-center text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] rounded-md opacity-50 cursor-not-allowed"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
              {/* Search + Período + right-side actions */}
              <div className="flex items-center mb-3 gap-2">
                <div className="w-[30%] h-8 flex items-center gap-2 px-3 rounded-md border shadow-sm border-[rgba(228,230,235,0.6)] bg-white">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar"
                    className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                </div>
                <button
                  type="button"
                  className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-gray-100 cursor-pointer"
                >
                  <span>Período</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Right: Filtrar / Ordenar / Grilla */}
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
                  <button
                    type="button"
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-gray-100 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                    <span>Grilla</span>
                  </button>
                </div>
              </div>

              {/* Floating Tab Header - spans full width, hosts batch actions */}
              <div className="mb-2">
                <div className="grid grid-cols-100 h-9 bg-slate-100 border border-slate-200/80 rounded-md shadow-sm">
                  <div className="col-span-4 flex items-center justify-center">
                    {someSelected ? (
                      <button
                        onClick={toggleSelectAll}
                        className="h-4 w-4 flex items-center justify-center rounded-sm bg-primary border border-primary cursor-pointer"
                        aria-label="Deseleccionar todo"
                      >
                        <Minus className="w-3 h-3 text-primary-foreground" />
                      </button>
                    ) : allSelected ? (
                      <button
                        onClick={toggleSelectAll}
                        className="h-4 w-4 flex items-center justify-center rounded-sm bg-primary border border-primary cursor-pointer hover:bg-primary/90"
                        aria-label="Deseleccionar todo"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </button>
                    ) : (
                      <button
                        onClick={toggleSelectAll}
                        className="h-4 w-4 transition-colors cursor-pointer flex items-center justify-center rounded-sm bg-white border border-slate-300 hover:border-muted-foreground"
                        aria-label="Seleccionar todo"
                      />
                    )}
                  </div>
                  <div className="col-span-96 flex items-center border-l border-slate-200/80" />
                </div>
              </div>

              {/* Floating Rows */}
              <div className="flex flex-col gap-2">
                {VENTAS.map((venta) => {
                  const estadoStyle = estadoColors[venta.estado]
                  const EstadoIcon = estadoStyle.icon
                  const isSelected = selectedVentas.has(venta.id)
                  const isFacturada = !!venta.facturaEmitida
                  const isMulti = venta.items.length > 1
                  const firstItem: VentaItem | undefined = venta.items[0]
                  const pagoPct = getPagoPercent(venta.estado)
                  const entregaPct = getEntregaPercent(venta.estado)

                  return (
                    <div
                      key={venta.id}
                      className={`bg-white border rounded-md shadow-sm transition-colors ${
                        isSelected
                          ? "border-blue-300 bg-blue-50/40"
                          : "border-slate-200/60 hover:border-slate-300"
                      }`}
                    >
                      {/* TOP ROW */}
                      <div className="grid grid-cols-100 min-h-[44px] pt-2">
                        {/* Selector + vertical line */}
                        <div
                          className="col-span-4 flex items-center justify-center border-r border-slate-200/70"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectVenta(venta.id)
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* ID */}
                        <div className="col-span-16 flex items-center justify-center px-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{venta.id}</span>
                        </div>

                        {/* Fecha */}
                        <div className="col-span-16 flex items-center justify-center px-2">
                          <span className="text-xs text-slate-600 truncate">
                            {formatVentaDateTime(venta.fecha, venta.hora)}
                          </span>
                        </div>

                        {/* Origen */}
                        <div className="col-span-16 flex items-center justify-center px-2">
                          <span className="text-xs text-slate-600 truncate">{getOrigen(venta.metodoPago)}</span>
                        </div>

                        {/* Empty 20 */}
                        <div className="col-span-20" />

                        {/* Cliente */}
                        <div className="col-span-24 flex items-center px-3">
                          <span className="text-sm font-semibold text-slate-800 truncate">{venta.clienteNombre}</span>
                        </div>

                        {/* More options + vertical line on its left */}
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
                        {/* Empty 4 (selector harmony) */}
                        <div className="col-span-4" />

                        {/* Estado */}
                        <div className="col-span-16 flex items-center justify-center px-2">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoStyle.bg}`}>
                            <EstadoIcon className={`w-3.5 h-3.5 ${estadoStyle.text}`} />
                            <span className={`text-xs font-medium ${estadoStyle.text}`}>
                              {estadoLabels[venta.estado]}
                            </span>
                          </div>
                        </div>

                        {/* Pago % */}
                        <div className="col-span-16 flex items-center justify-center px-2">
                          <span className="text-xs text-slate-600">Pago {pagoPct}%</span>
                        </div>

                        {/* Entrega % */}
                        <div className="col-span-16 flex items-center justify-center px-2">
                          <span className="text-xs text-slate-600">Entrega {entregaPct}%</span>
                        </div>

                        {/* Empty 20 */}
                        <div className="col-span-20" />

                        {/* Facturación */}
                        <div className="col-span-24 flex items-center px-3">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                              isFacturada ? "bg-blue-50" : "bg-slate-100"
                            }`}
                          >
                            {isFacturada ? (
                              <Receipt className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span
                              className={`text-xs font-medium ${isFacturada ? "text-blue-600" : "text-slate-500"}`}
                            >
                              {isFacturada ? "Facturada" : "Sin facturar"}
                            </span>
                          </div>
                        </div>

                        {/* Empty 4 (more options harmony) */}
                        <div className="col-span-4" />
                      </div>

                      {/* BOTTOM ROW - product(s) inset */}
                      <div className="grid grid-cols-100 pt-2 pb-2">
                        {/* Outside left padding */}
                        <div className="col-span-4" />

                        {/* Item content (48 cols) - rounded-l */}
                        <div className="col-span-48 bg-slate-50 rounded-l-md py-2.5 pl-3 pr-2 flex items-center gap-3">
                          {isMulti ? (
                            <>
                              <div className="flex items-center -space-x-2 shrink-0">
                                {venta.items.slice(0, 3).map((it, idx) => (
                                  <div
                                    key={`${venta.id}-thumb-${idx}`}
                                    className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                                    style={{ zIndex: 10 - idx }}
                                  >
                                    <img
                                      src={getCategoryImage(it.categoria) || "/placeholder.svg"}
                                      alt={it.categoria || "Producto"}
                                      className="w-5 h-5 object-contain opacity-70"
                                    />
                                  </div>
                                ))}
                              </div>
                              <span className="text-sm text-slate-700 truncate">
                                {venta.items.length} productos
                              </span>
                            </>
                          ) : firstItem ? (
                            <>
                              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                <img
                                  src={getCategoryImage(firstItem.categoria) || "/placeholder.svg"}
                                  alt={firstItem.categoria || "Producto"}
                                  className="w-5 h-5 object-contain opacity-70"
                                />
                              </div>
                              <div className="min-w-0 flex flex-col">
                                <span className="text-sm font-medium text-slate-800 truncate">{firstItem.name}</span>
                                {firstItem.categoria && (
                                  <span className="text-xs text-slate-500 truncate">{firstItem.categoria}</span>
                                )}
                              </div>
                            </>
                          ) : null}
                        </div>

                        {/* Empty 20 - middle of inset */}
                        <div className="col-span-20 bg-slate-50" />

                        {/* Empty 24 - right of inset, rounded-r */}
                        <div className="col-span-24 bg-slate-50 rounded-r-md" />

                        {/* Outside right padding */}
                        <div className="col-span-4" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
