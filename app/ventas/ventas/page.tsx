"use client"

import { useState, useRef, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import {
  ChevronDown,
  FileDown,
  MoreVertical,
  Eye,
  ListFilter,
  ArrowUpDown,
  LayoutGrid,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  ReceiptText,
} from "lucide-react"
import { VENTAS } from "@/lib/data/ventas"
import type { Venta } from "@/lib/types"

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

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const month = months[date.getMonth()]
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

export default function VentasPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const [showSectionMenu, setShowSectionMenu] = useState(false)
  const sectionMenuRef = useRef<HTMLDivElement>(null)

  const [selectedVentas, setSelectedVentas] = useState<Set<string>>(new Set())
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionMenuRef.current && !sectionMenuRef.current.contains(event.target as Node)) {
        setShowSectionMenu(false)
      }
    }
    if (showSectionMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showSectionMenu])

  const toggleSelectAll = () => {
    if (selectedVentas.size === VENTAS.length) {
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
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
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
                  {/* Export */}
                  <button
                    disabled
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center opacity-50 cursor-not-allowed"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    Exportar
                  </button>

                  {/* More Options */}
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
              {/* Secciones + right-side actions */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative" ref={sectionMenuRef}>
                    <button
                      onClick={() => setShowSectionMenu(!showSectionMenu)}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-gray-100 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Secciones</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    {showSectionMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                        <div className="px-3 py-1.5 text-xs text-slate-400">Sin secciones</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Filtrar / Ordenar / Grilla */}
                <div className="flex items-center gap-2">
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

              {/* Grid */}
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">
                {/* Grid Header */}
                <div className="bg-slate-100 border-b border-slate-200/80">
                  <div className="grid grid-cols-100 h-9">
                    {/* Checkbox / select all */}
                    <div className="col-span-4 flex items-center justify-center border-r border-slate-200/60">
                      <input
                        type="checkbox"
                        checked={selectedVentas.size === VENTAS.length && VENTAS.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    {/* ID */}
                    <div className="col-span-8 flex items-center justify-center border-r border-slate-200/60">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">ID</span>
                    </div>
                    {/* Estado */}
                    <div className="col-span-8 flex items-center justify-center border-r border-slate-200/60">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</span>
                    </div>
                    {/* Cliente */}
                    <div className="col-span-28 flex items-center justify-center border-r border-slate-200/60">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</span>
                    </div>
                    {/* Items */}
                    <div className="col-span-18 flex items-center justify-center border-r border-slate-200/60">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Items</span>
                    </div>
                    {/* Facturación */}
                    <div className="col-span-12 flex items-center justify-center border-r border-slate-200/60">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Facturación</span>
                    </div>
                    {/* Total */}
                    <div className="col-span-18 flex items-center justify-center border-r border-slate-200/60">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</span>
                    </div>
                    {/* More */}
                    <div className="col-span-4 flex items-center justify-center" />
                  </div>
                </div>

                {/* Grid Body */}
                <div>
                  {VENTAS.map((venta) => {
                    const estadoStyle = estadoColors[venta.estado]
                    const EstadoIcon = estadoStyle.icon
                    const totalItems = venta.items.reduce((sum, it) => sum + it.quantity, 0)
                    const isSelected = selectedVentas.has(venta.id)
                    const isFacturada = !!venta.facturaEmitida

                    return (
                      <div
                        key={venta.id}
                        className={`border-b border-slate-200/60 last:border-b-0 transition-colors ${
                          isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="grid grid-cols-100 min-h-[56px]">
                          {/* Checkbox */}
                          <div
                            className="col-span-4 flex items-center justify-center py-2 border-r border-slate-200/30"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectVenta(venta.id)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {/* ID */}
                          <div className="col-span-8 flex flex-col items-center justify-center py-2 border-r border-slate-200/30">
                            <span className="text-sm font-medium text-slate-900">{venta.id}</span>
                            <span className="text-xs text-slate-400">{formatDateShort(venta.fecha)}</span>
                          </div>

                          {/* Estado */}
                          <div className="col-span-8 flex items-center justify-center py-2 border-r border-slate-200/30">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoStyle.bg}`}>
                              <EstadoIcon className={`w-3.5 h-3.5 ${estadoStyle.text}`} />
                              <span className={`text-xs font-medium ${estadoStyle.text}`}>
                                {estadoLabels[venta.estado]}
                              </span>
                            </div>
                          </div>

                          {/* Cliente */}
                          <div className="col-span-28 flex items-center px-4 py-2 border-r border-slate-200/30">
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {venta.clienteNombre}
                            </span>
                          </div>

                          {/* Items */}
                          <div className="col-span-18 flex items-center justify-center py-2 border-r border-slate-200/30">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-700">{venta.items.length}</span>
                            </div>
                            <span className="text-xs text-slate-400 ml-1">({totalItems} u.)</span>
                          </div>

                          {/* Facturación */}
                          <div className="col-span-12 flex items-center justify-center py-2 border-r border-slate-200/30">
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
                                className={`text-xs font-medium ${
                                  isFacturada ? "text-blue-600" : "text-slate-500"
                                }`}
                              >
                                {isFacturada ? "Facturada" : "Sin facturar"}
                              </span>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="col-span-18 flex items-center justify-center py-2 border-r border-slate-200/30">
                            <span className="text-sm font-semibold text-slate-900">
                              ${venta.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                            </span>
                          </div>

                          {/* More Options */}
                          <div
                            className="col-span-4 flex items-center justify-center py-2 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                              onClick={() => setOpenMoreMenu(openMoreMenu === venta.id ? null : venta.id)}
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
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
