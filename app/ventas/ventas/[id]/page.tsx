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
  ChevronDown,
  MoreVertical,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Wallet,
  ScanLine,
  Plus,
  Search,
  Check,
  Minus,
  Filter,
  ArrowUpDown,
  X,
} from "lucide-react"
import Image from "next/image"
import { VENTAS } from "@/lib/data/ventas"
import type { Venta, VentaItem, PaymentMethod, Item, ItemVariant } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"

type VentaEstadoUI = "en_curso" | "finalizada"

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
  const [estadoUI, setEstadoUI] = useState<VentaEstadoUI>("en_curso")
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false)
  const [showSubtotalBreakdown, setShowSubtotalBreakdown] = useState(false)
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)
  const [showRegistrarCobro, setShowRegistrarCobro] = useState(false)
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalSearch, setModalSearch] = useState("")
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)
  const [cobroFecha, setCobroFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [cobroHora, setCobroHora] = useState(() => new Date().toTimeString().slice(0, 5))
  const [cobroMedio, setCobroMedio] = useState<"efectivo" | "posnet" | "transferencia">("efectivo")
  const [cobroMonto, setCobroMonto] = useState("")

  const estadoDropdownRef = useRef<HTMLDivElement>(null)

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
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(event.target as Node)) {
        setShowEstadoDropdown(false)
      }
    }
    if (showExportDropdown || showMoreOptionsMenu || showEstadoDropdown) {
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

  // ── Modal computed values ──
  const allModalItems = INITIAL_ITEMS

  const uniqueModalCategorias = useMemo(() => {
    const cats = new Set<string>()
    allModalItems.forEach(item => {
      if (item.categoria) cats.add(item.categoria)
    })
    return Array.from(cats).sort()
  }, [])

  const uniqueModalMarcas = useMemo(() => {
    const marcas = new Set<string>()
    allModalItems.forEach(item => {
      if (item.marca) marcas.add(item.marca)
    })
    return Array.from(marcas).sort()
  }, [])

  const filteredModalItems = useMemo(() => {
    let items = [...allModalItems]
    if (modalSearch.trim()) {
      const words = modalSearch.toLowerCase().trim().split(/\s+/)
      items = items.filter(item => {
        const text = [item.name, item.sku, item.marca, item.categoria, item.proveedor].filter(Boolean).join(" ").toLowerCase()
        return words.every(w => text.includes(w))
      })
    }
    if (modalFilters.categoria) items = items.filter(i => i.categoria === modalFilters.categoria)
    if (modalFilters.marca) items = items.filter(i => i.marca === modalFilters.marca)
    const dir = modalSortDirection === "asc" ? 1 : -1
    items.sort((a, b) => {
      if (modalSort === "precio") return ((a.precio?.precioFinal || 0) - (b.precio?.precioFinal || 0)) * dir
      return a.name.localeCompare(b.name) * dir
    })
    return items
  }, [modalSearch, modalFilters, modalSort, modalSortDirection])

  const getModalItemId = (item: any): string => item.id || item.sku || item.name || ""

  const getAllModalSelectableIds = useMemo(() => {
    return filteredModalItems.flatMap(item => {
      if (item.hasVariants && item.variants?.length) {
        return item.variants.map((v: any) => getModalItemId(v))
      }
      return [getModalItemId(item)]
    }).filter(Boolean)
  }, [filteredModalItems])

  const modalSelectAllActive = useMemo(() =>
    getAllModalSelectableIds.length > 0 && getAllModalSelectableIds.every(id => selectedModalItems[id]),
    [getAllModalSelectableIds, selectedModalItems])

  const modalSelectAllIndeterminate = useMemo(() => {
    const some = getAllModalSelectableIds.some(id => selectedModalItems[id])
    return some && !modalSelectAllActive
  }, [getAllModalSelectableIds, selectedModalItems, modalSelectAllActive])

  const selectedModalCount = useMemo(() =>
    Object.values(selectedModalItems).filter(Boolean).length,
    [selectedModalItems])

  const getModalSelectionState = (item: any, isChild = false): { checked: boolean; indeterminate: boolean } => {
    const isParent = !isChild && item.hasVariants && item.variants?.length > 0
    if (isParent) {
      const childIds = item.variants.map((v: any) => getModalItemId(v)).filter(Boolean)
      const all = childIds.every((id: string) => selectedModalItems[id])
      const some = childIds.some((id: string) => selectedModalItems[id])
      return { checked: all, indeterminate: some && !all }
    }
    const id = getModalItemId(item)
    return { checked: !!selectedModalItems[id], indeterminate: false }
  }

  const handleModalItemSelection = (item: any, isChild = false) => {
    const isParent = !isChild && item.hasVariants && item.variants?.length > 0
    if (isParent) {
      const childIds = item.variants.map((v: any) => getModalItemId(v)).filter(Boolean)
      const allSel = childIds.every((id: string) => selectedModalItems[id])
      setSelectedModalItems(prev => {
        const next = { ...prev }
        for (const id of childIds) next[id] = !allSel
        return next
      })
    } else {
      const id = getModalItemId(item)
      if (id) setSelectedModalItems(prev => ({ ...prev, [id]: !prev[id] }))
    }
  }

  const handleSelectAllModal = () => {
    const shouldSelect = !modalSelectAllActive && !modalSelectAllIndeterminate
    const next: { [id: string]: boolean } = {}
    for (const id of getAllModalSelectableIds) next[id] = shouldSelect
    setSelectedModalItems(next)
  }

  const closeAgregarProductos = () => {
    setShowAgregarProductos(false)
    setModalSearch("")
    setSelectedModalItems({})
    setModalFilters({ categoria: "", marca: "" })
    setShowModalFilters(false)
  }

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
                    <div className="pt-8 px-4 pb-3 flex flex-col gap-3">
                      {/* Row 1: Venta ID + date + origen + actions */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Venta ID + fecha/hora + origen — spread across available width */}
                        <div className="flex items-center flex-1 min-w-0">
                          {/* Venta ID */}
                          <div className="flex items-baseline gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Venta</span>
                            <span className="text-2xl font-bold text-slate-900 leading-none tracking-tight">{venta.id}</span>
                          </div>

                          <div className="h-5 w-px bg-slate-300 shrink-0 mx-5" />

                          {/* Fecha */}
                          <span className="text-sm font-medium text-slate-600 tabular-nums shrink-0">
                            {dia} {mesCorto} {fechaObj.getFullYear()} · {venta.hora}
                          </span>

                          <div className="h-5 w-px bg-slate-300 shrink-0 mx-5" />

                          {/* Origen */}
                          <span className="text-sm text-slate-400 shrink-0">{getOrigen(venta.metodoPago)}</span>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className="h-8 text-xs transition-colors bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer gap-1.5 px-3 rounded-md flex items-center text-slate-700 font-medium shadow-sm"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                            Ver ticket
                          </button>
                          <div className="relative" ref={moreMenuRef}>
                            <button
                              onClick={() => setShowMoreOptionsMenu(!showMoreOptionsMenu)}
                              className="h-8 w-8 flex items-center justify-center transition-colors bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer rounded-md shadow-sm"
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

                      {/* Row 2: Productos + unidades + total */}
                      <div className="flex items-baseline gap-1.5 px-1">
                        <span className="text-lg font-semibold text-slate-900 tabular-nums">{venta.items.length}</span>
                        <span className="text-sm text-slate-400">{venta.items.length === 1 ? "producto" : "productos"}</span>
                        <span className="text-slate-300 mx-1">·</span>
                        <span className="text-lg font-semibold text-slate-900 tabular-nums">{totalUnidades}</span>
                        <span className="text-sm text-slate-400">{totalUnidades === 1 ? "unidad" : "unidades"}</span>
                        <span className="text-slate-300 mx-1">·</span>
                        <span className="text-lg font-semibold text-slate-900 tabular-nums">${Math.round(venta.total).toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  )
                })()}

                {/* ── Cliente card ── */}
                <div className="bg-slate-100 border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-white">{venta.clienteNombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Cliente</span>
                    <span className="text-sm font-semibold text-slate-900 leading-tight">{venta.clienteNombre}</span>
                  </div>
                </div>

                {/* ── Estado card ── */}
                <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm px-5 py-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-3">Estado de la Venta</span>

                  {estadoUI === "en_curso" ? (
                    /* 3-col grid: estado | entrega | cobro */
                    <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">

                      {/* Col 1 — Estado selector */}
                      <div className="pr-5 flex flex-col justify-center">
                        <div className="relative" ref={estadoDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                            className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              En Curso
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEstadoDropdown ? "rotate-180" : ""}`} />
                          </button>
                          {showEstadoDropdown && (
                            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                              <button
                                onClick={() => { setEstadoUI("en_curso"); setShowEstadoDropdown(false) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors font-semibold text-amber-700"
                              >
                                <Clock className="w-4 h-4 text-amber-500" /> En Curso
                              </button>
                              <button
                                onClick={() => { setEstadoUI("finalizada"); setShowEstadoDropdown(false) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors text-slate-700"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Finalizada
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Col 2 — Entrega */}
                      <div className="px-5 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            {entregaPct === 100 ? (
                              <span className="text-sm font-semibold text-emerald-600">Entregada</span>
                            ) : (
                              <span className="text-sm font-semibold text-slate-700">Entrega {entregaPct}%</span>
                            )}
                          </div>
                          {entregaPct === 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                        {entregaPct < 100 && (
                          <>
                            <span className="text-xs text-slate-400 tabular-nums">{entregadasUnidades}/{totalUnidades} unidades</span>
                            <button
                              type="button"
                              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Registrar entrega
                            </button>
                          </>
                        )}
                      </div>

                      {/* Col 3 — Cobro */}
                      <div className="pl-5 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-slate-400" />
                            {pagoPct === 100 ? (
                              <span className="text-sm font-semibold text-emerald-600">Cobrada</span>
                            ) : (
                              <span className="text-sm font-semibold text-slate-700">Cobro {pagoPct}%</span>
                            )}
                          </div>
                          {pagoPct === 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                        {pagoPct < 100 && (
                          <>
                            <span className="text-xs text-slate-400 tabular-nums">
                              ${montoCobrado.toLocaleString("es-AR")}/${Math.round(venta.total).toLocaleString("es-AR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowRegistrarCobro(true)}
                              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Registrar cobro
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Finalizada — just the badge */
                    <div className="relative" ref={estadoDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                        className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors w-1/3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Finalizada
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEstadoDropdown ? "rotate-180" : ""}`} />
                      </button>
                      {showEstadoDropdown && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                          <button
                            onClick={() => { setEstadoUI("en_curso"); setShowEstadoDropdown(false) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors text-slate-700"
                          >
                            <Clock className="w-4 h-4 text-amber-500" /> En Curso
                          </button>
                          <button
                            onClick={() => { setEstadoUI("finalizada"); setShowEstadoDropdown(false) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors font-semibold text-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Finalizada
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Entrega + Items card */}
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">

                {/* ── Title strip — toggle buttons ── */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEntregaMode(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      !entregaMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    {venta.items.length} {venta.items.length === 1 ? "producto" : "productos"} · {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntregaMode(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      entregaMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Entrega {entregaPct}% · {entregadasUnidades}/{totalUnidades}
                  </button>
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
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-sm text-slate-700 tabular-nums">{item.quantity}</span>
                              <span className="text-xs text-slate-400">{item.quantity === 1 ? "unidad" : "unidades"}</span>
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
              {estadoUI === "en_curso" && (
                <button
                  type="button"
                  onClick={() => setShowAgregarProductos(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  Agregar productos
                </button>
              )}
              </div>{/* end rounded inner grid */}
              </div>{/* end p-3 padding wrapper */}
              </div>{/* end entrega+items card */}

              {/* ── Notas card ── */}
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Notas</span>
                <textarea
                  placeholder="Agregar una nota sobre esta venta..."
                  defaultValue={venta.observaciones ?? ""}
                  rows={3}
                  className="w-full resize-none text-sm text-slate-700 placeholder:text-slate-300 bg-transparent border-none outline-none leading-relaxed"
                />
              </div>

              </div>{/* end col-span-2 flex column */}

              {/* Right col-span-1: single white panel, content directly on background */}
              {venta.items.length > 0 && (
                <div className="col-span-1 bg-white rounded-lg shadow-sm overflow-hidden sticky top-0">
                  <div className="px-5 py-5 flex flex-col gap-0">

                    {/* ��─ Resumen section ── */}
                    <p className="text-sm font-semibold text-slate-800 mb-4">Resumen</p>

                    {/* Subtotal — expandable */}
                    <button
                      type="button"
                      onClick={() => setShowSubtotalBreakdown(!showSubtotalBreakdown)}
                      className="w-full flex justify-between items-center py-2.5 border-b border-slate-100 group text-left hover:bg-slate-50/50 -mx-5 px-5 transition-colors"
                    >
                      <span className="text-sm text-slate-500">Subtotal</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 tabular-nums">${Math.round(venta.subtotal).toLocaleString("es-AR")}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSubtotalBreakdown ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {showSubtotalBreakdown && (
                      <div className="border-b border-slate-100">
                        {venta.items.map((item, idx) => {
                          const display = getVentaItemDisplay(item)
                          const adjustedUnit = item.discountType === "percent"
                            ? item.unitPrice * (1 - item.discount / 100)
                            : item.unitPrice - (item.discount / Math.max(item.quantity, 1))
                          const lineTotal = Math.round(adjustedUnit * item.quantity)
                          return (
                            <div key={idx} className="flex justify-between items-start gap-3 py-2.5 -mx-5 px-5 border-b border-slate-50 last:border-0">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-700 leading-tight">{display.name}</p>
                                {display.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {display.tags.map((tag, i) => (
                                      <span key={i} className="text-[10px] text-slate-400">{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[11px] text-slate-400 tabular-nums">{item.quantity} × ${Math.round(adjustedUnit).toLocaleString("es-AR")}</p>
                                <p className="text-xs font-medium text-slate-700 tabular-nums">${lineTotal.toLocaleString("es-AR")}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

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

                    {/* Entries */}
                    {montoCobrado > 0 ? (
                      <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
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
                      <div className="flex items-center justify-center py-4">
                        <span className="text-xs text-slate-400">Sin cobros registrados</span>
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

      {/* ── Agregar Productos Modal ── */}
      {showAgregarProductos && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAgregarProductos} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Agregar productos</h3>
                <p className="text-xs text-slate-500 mt-0.5">Selecciona los productos a agregar a la venta</p>
              </div>
              <button onClick={closeAgregarProductos} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search + Filters */}
            <div className="border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                    autoFocus
                  />
                </div>
                {/* Filter button */}
                <div className="relative">
                  <button
                    onClick={() => setShowModalFilters(!showModalFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                      Object.values(modalFilters).some(v => v)
                        ? "border-slate-800 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </button>
                  {showModalFilters && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-56 p-3 space-y-3">
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
                        <select
                          value={modalFilters.categoria}
                          onChange={(e) => setModalFilters(prev => ({ ...prev, categoria: e.target.value }))}
                          className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                        >
                          <option value="">Todas</option>
                          {uniqueModalCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Marca</label>
                        <select
                          value={modalFilters.marca}
                          onChange={(e) => setModalFilters(prev => ({ ...prev, marca: e.target.value }))}
                          className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                        >
                          <option value="">Todas</option>
                          {uniqueModalMarcas.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      {Object.values(modalFilters).some(v => v) && (
                        <button onClick={() => setModalFilters({ categoria: "", marca: "" })} className="w-full text-xs text-slate-500 hover:text-slate-700 py-1">
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Sort */}
                <div className="flex items-center gap-1">
                  <select
                    value={modalSort}
                    onChange={(e) => setModalSort(e.target.value as "name" | "precio")}
                    className="appearance-none pl-3 pr-7 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 cursor-pointer"
                  >
                    <option value="name">Nombre</option>
                    <option value="precio">Precio</option>
                  </select>
                  <button
                    onClick={() => setModalSortDirection(d => d === "asc" ? "desc" : "asc")}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${modalSortDirection === "desc" ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Column headers */}
            <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <div className="grid grid-cols-[3fr_1fr_1.2fr] h-9 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                <div className="flex items-center px-4 gap-3">
                  <button
                    onClick={handleSelectAllModal}
                    className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white"
                  >
                    {modalSelectAllActive && <Check className="w-3 h-3 text-slate-800" />}
                    {modalSelectAllIndeterminate && <Minus className="w-3 h-3 text-slate-800" />}
                  </button>
                  <span>Producto</span>
                </div>
                <div className="flex items-center justify-center">Stock</div>
                <div className="flex items-center justify-center">Precio</div>
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto bg-white">
              {filteredModalItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">No se encontraron productos{modalSearch ? ` para "${modalSearch}"` : ""}</p>
                </div>
              ) : (
                filteredModalItems.map((item, idx) => {
                  const isParent = item.hasVariants && item.variants && item.variants.length > 0
                  const selState = getModalSelectionState(item)
                  return (
                    <div key={idx}>
                      {/* Parent / standalone row */}
                      <div
                        className={`grid grid-cols-[3fr_1fr_1.2fr] items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${selState.checked || selState.indeterminate ? "bg-slate-50/70" : ""}`}
                        onClick={() => handleModalItemSelection(item)}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleModalItemSelection(item) }}
                            className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white flex-shrink-0"
                          >
                            {selState.checked && <Check className="w-3 h-3 text-slate-800" />}
                            {selState.indeterminate && <Minus className="w-3 h-3 text-slate-800" />}
                          </button>
                          <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                            <Image src={getCategoryImage(item.categoria || "") || "/placeholder.svg"} alt={item.name} width={36} height={36} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                              {isParent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500">{item.variants!.length} var.</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{[item.marca, item.categoria].filter(Boolean).join(" · ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          {!isParent && <span className="text-sm text-slate-600 tabular-nums">{parseInt(item.stock?.disponible || "0")}</span>}
                        </div>
                        <div className="flex items-center justify-center">
                          {!isParent && <span className="text-sm font-medium text-slate-800">${(item.precio?.precioFinal || 0).toLocaleString("es-AR")}</span>}
                        </div>
                      </div>

                      {/* Variant rows */}
                      {isParent && item.variants!.map((variant: any, vIdx: number) => {
                        const vState = getModalSelectionState(variant, true)
                        return (
                          <div
                            key={vIdx}
                            className={`grid grid-cols-[3fr_1fr_1.2fr] items-center py-2.5 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer pl-12 ${vState.checked ? "bg-slate-50/70" : ""}`}
                            onClick={() => handleModalItemSelection(variant, true)}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleModalItemSelection(variant, true) }}
                                className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white flex-shrink-0"
                              >
                                {vState.checked && <Check className="w-3 h-3 text-slate-800" />}
                              </button>
                              <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                <Image src={getCategoryImage(variant.categoria || item.categoria || "") || "/placeholder.svg"} alt={variant.name || item.name} width={32} height={32} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm text-slate-700 truncate">{variant.name || item.name}</p>
                                  {variant.atributosPrincipales?.map((a: any, i: number) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500">{a.value}</span>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-400">{`${item.skuPrefix}-${variant.skuSuffix}`}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-600 tabular-nums">{parseInt(variant.stock?.disponible || "0")}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-800">${(variant.precio?.precioFinal || 0).toLocaleString("es-AR")}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-slate-500">
                {selectedModalCount > 0
                  ? `${selectedModalCount} producto${selectedModalCount > 1 ? "s" : ""} seleccionado${selectedModalCount > 1 ? "s" : ""}`
                  : "Seleccioná productos para agregar"}
              </span>
              <button
                onClick={closeAgregarProductos}
                disabled={selectedModalCount === 0}
                className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Agregar seleccionados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Registrar Cobro Modal ── */}
      {showRegistrarCobro && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRegistrarCobro(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[420px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Registrar cobro</h2>
              <button onClick={() => setShowRegistrarCobro(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="px-5 py-5 flex flex-col gap-4">
              {/* Fecha + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha</label>
                  <input
                    type="date"
                    value={cobroFecha}
                    onChange={(e) => setCobroFecha(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Hora</label>
                  <input
                    type="time"
                    value={cobroHora}
                    onChange={(e) => setCobroHora(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>
              {/* Medio de pago */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Medio de pago</label>
                <div className="flex gap-2">
                  {(["efectivo", "posnet", "transferencia"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCobroMedio(m)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors capitalize ${
                        cobroMedio === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Monto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Monto</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      value={cobroMonto}
                      onChange={(e) => setCobroMonto(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCobroMonto(String(montoRestante))}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200 shrink-0"
                  >
                    Total
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 tabular-nums">Restante: ${montoRestante.toLocaleString("es-AR")}</p>
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowRegistrarCobro(false)}
                className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowRegistrarCobro(false)}
                className="flex-1 py-2.5 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors font-medium"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
