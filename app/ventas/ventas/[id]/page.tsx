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
  Undo2,
  Pencil,
  RotateCcw,
  ShoppingCart,
} from "lucide-react"
import Image from "next/image"
import type { Venta, VentaItem, PaymentMethod, Item, ItemVariant, VentaEntregaItem, VentaEntregaEntry, VentaDevolucionItem } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { ClienteModal } from "@/components/ventas/cliente-modal"
import { TicketModal } from "@/components/ventas/ticket-modal"
import { CLIENTES } from "@/lib/data/clientes"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { useVentas } from "@/hooks/use-ventas"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadVentasPDF } from "@/lib/utils/generate-venta-pdf"

type VentaEstadoUI = "en_curso" | "finalizada" | "cancelada"

const metodoPagoLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  posnet: "Posnet",
  transferencia: "Transferencia",
  no_especificado: "No especificado",
  anulacion: "Anulación",
}

function ClienteSelectorInlineModal({
  currentClienteId,
  onSelect,
  onClose,
}: {
  currentClienteId: string | null
  onSelect: (id: string, nombre: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const filtered = CLIENTES.filter((c) => {
    const name = c.tipo === "empresa" ? (c.razonSocial ?? "") : `${c.nombre} ${c.apellido}`.trim()
    return name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())
  })
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden flex flex-col max-h-[70vh]">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Seleccionar cliente</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {/* Consumidor Final — always pinned at top */}
          {("consumidor final".includes(search.toLowerCase()) || search === "") && (
            <>
              <button
                onClick={() => onSelect("__consumidor_final__", "Consumidor Final")}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${currentClienteId === null ? "bg-slate-50" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-300 border border-slate-300 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-slate-600">CF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Consumidor Final</p>
                  <p className="text-xs text-slate-400">Sin cuenta registrada</p>
                </div>
                {currentClienteId === null && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
              {filtered.length > 0 && <div className="mx-4 border-t border-slate-100" />}
            </>
          )}
          {/* Named clients */}
          <div className="divide-y divide-slate-50">
            {filtered.map((c) => {
              const name = c.tipo === "empresa" ? (c.razonSocial ?? "") : `${c.nombre} ${c.apellido}`.trim()
              const initials = name.slice(0, 2).toUpperCase()
              const isSelected = c.id === currentClienteId
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id, name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${isSelected ? "bg-slate-50" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    <p className="text-xs text-slate-400">{c.tipo === "empresa" ? "Empresa" : "Particular"} · {c.condicionIva}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              )
            })}
            {filtered.length === 0 && search !== "" && !("consumidor final".includes(search.toLowerCase())) && (
              <p className="text-sm text-slate-400 text-center py-6">Sin resultados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VentaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const { ventas, isLoading: isLoadingVentas, addItemsToVenta, updateVenta, addCobro, addEntregas, addDevolucion, setEstado, finalizarVenta, undoCobro, undoEntregaEntry, updateCobroMedioPago, cancelarVenta } = useVentas()
  const { miNegocio } = useSettings()
  const venta = useMemo(() => ventas.find((v) => v.id === id) || null, [ventas, id])

  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [showClienteInfoModal, setShowClienteInfoModal] = useState(false)
  const [showClienteSelectorModal, setShowClienteSelectorModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showCancelarVentaModal, setShowCancelarVentaModal] = useState(false)
  const [cancelarDevolverUnidades, setCancelarDevolverUnidades] = useState(true)
  const [cancelarDevolverCobros, setCancelarDevolverCobros] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showClientePanel, setShowClientePanel] = useState(false)
  // estado is derived from venta (persisted via useVentas)
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false)
  const [showSubtotalBreakdown, setShowSubtotalBreakdown] = useState(false)
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)
  const [showRegistrarCobro, setShowRegistrarCobro] = useState(false)
  const [showRegistrarEntrega, setShowRegistrarEntrega] = useState(false)
  const [showFinalizarVenta, setShowFinalizarVenta] = useState(false)
  // Devolución modal
  const [showDevolucion, setShowDevolucion] = useState(false)
  const [devolucionStep, setDevolucionStep] = useState<1 | 2>(1)
  const [devolucionSelectedItems, setDevolucionSelectedItems] = useState<{ [sku: string]: boolean }>({})
  const [devolucionQuantities, setDevolucionQuantities] = useState<{ [sku: string]: string }>({})
  // View mode toggle: "productos" | "entrega" | "devolucion"
  const [viewMode, setViewMode] = useState<"productos" | "entrega" | "devolucion">("productos")
  const [finalizarMedioPago, setFinalizarMedioPago] = useState<PaymentMethod | "no_especificado">("no_especificado")
  const [entregaSelectedItems, setEntregaSelectedItems] = useState<{ [sku: string]: boolean }>({})
  const [viewingEntregaEntry, setViewingEntregaEntry] = useState<VentaEntregaEntry | null>(null)
  const [undoCobroTarget, setUndoCobroTarget] = useState<{ id: string; monto: number } | null>(null)
  const [undoEntregaTarget, setUndoEntregaTarget] = useState<VentaEntregaEntry | null>(null)
  const [editarMedioPagoTarget, setEditarMedioPagoTarget] = useState<{ id: string; current: PaymentMethod } | null>(null)
  const [editarMedioPagoValue, setEditarMedioPagoValue] = useState<PaymentMethod>("efectivo")

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editItems, setEditItems] = useState<VentaItem[]>([])
  const [editAjustes, setEditAjustes] = useState<{ [idx: number]: { value: number; type: "percent" | "cash" | "unit" } }>({})

  const enterEditMode = () => {
    setEditItems(ventaItems.map(i => ({ ...i })))
    setEditAjustes(
      Object.fromEntries(ventaItems.map((item, idx) => [
        idx,
        item.discount > 0
          ? { value: item.discount, type: (item.discountType === "fixed" ? "cash" : item.discountType === "unit" ? "unit" : "percent") as "percent" | "cash" | "unit" }
          : { value: 0, type: "percent" as const },
      ]))
    )
    // Restore current venta adjustments into edit mode
    if (venta && venta.descuento > 0) {
      setShowGlobalDiscount(true)
      setGlobalDiscount({ value: venta.descuento, type: venta.descuentoTipo === "fixed" ? "cash" : "percent" })
    } else {
      setShowGlobalDiscount(false)
      setGlobalDiscount({ value: 0, type: "percent" })
    }
    if (venta && venta.envio && venta.envio > 0) {
      setShowEnvio(true)
      setEnvioAmount(venta.envio)
    } else {
      setShowEnvio(false)
      setEnvioAmount(0)
    }
    setCustomCharges(venta?.customCharges?.filter(c => c.value > 0) ?? [])
    setIsEditMode(true)
  }

  const cancelEditMode = () => { setIsEditMode(false); setEditItems([]); setEditAjustes({}) }

  const saveEditMode = () => {
    if (!venta) return
    const saved: VentaItem[] = editItems.map((item, idx) => {
      const aj = editAjustes[idx] ?? { value: 0, type: "percent" }
      return {
        ...item,
        discount: aj.value,
        discountType: aj.type === "cash" ? "fixed" : aj.type,
        total: (() => {
          if (aj.value === 0) return item.quantity * item.unitPrice
          if (aj.type === "unit") return Math.max(0, item.quantity - Math.min(aj.value, item.quantity)) * item.unitPrice
          const adj = aj.type === "percent" ? item.unitPrice * (1 - aj.value / 100) : Math.max(0, item.unitPrice - aj.value)
          return item.quantity * adj
        })(),
      }
    })
    const newDescuento = showGlobalDiscount && globalDiscount.value > 0 ? globalDiscount.value : 0
    const newDescuentoTipo: "percent" | "fixed" = globalDiscount.type === "cash" ? "fixed" : "percent"
    const newEnvio = showEnvio && envioAmount > 0 ? envioAmount : 0
    const newCustomCharges = customCharges.filter(c => c.value > 0)
    updateVenta(venta.id, {
      items: saved,
      descuento: newDescuento,
      descuentoTipo: newDescuentoTipo,
      envio: newEnvio,
      customCharges: newCustomCharges,
    })
    // Commit resumen adjustments to view mode
    if (newDescuento > 0) setSavedGlobalDiscount({ ...globalDiscount })
    else setSavedGlobalDiscount(null)
    setSavedEnvio(newEnvio > 0 ? newEnvio : null)
    setSavedCustomCharges(newCustomCharges)
    cancelEditMode()
  }

  // Resumen adjustments (local, en_curso only)
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" }>({ value: 0, type: "percent" })
  const [showEnvio, setShowEnvio] = useState(false)
  const [envioAmount, setEnvioAmount] = useState(0)
  const [customCharges, setCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])

  // Saved (committed) adjustments shown in view mode — initialized from venta once loaded
  const [savedGlobalDiscount, setSavedGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" } | null>(null)
  const [savedEnvio, setSavedEnvio] = useState<number | null>(null)
  const [savedCustomCharges, setSavedCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])
  const [adjustmentsInitialized, setAdjustmentsInitialized] = useState(false)

  // Saved adjustment totals for view mode
  const savedGlobalDiscountAmount = savedGlobalDiscount
    ? savedGlobalDiscount.type === "percent"
      ? (venta?.subtotal ?? 0) * (savedGlobalDiscount.value / 100)
      : savedGlobalDiscount.value
    : 0
  const savedAdjTotal = savedGlobalDiscountAmount * -1 + (savedEnvio ?? 0) + savedCustomCharges.reduce((s, c) => s + c.value, 0)

  const globalDiscountAmount = showGlobalDiscount
    ? globalDiscount.type === "percent"
      ? (venta?.subtotal ?? 0) * (globalDiscount.value / 100)
      : globalDiscount.value
    : 0
  const [entregaQuantities, setEntregaQuantities] = useState<{ [sku: string]: string }>({})
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalSearch, setModalSearch] = useState("")
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)
  const [cobroFecha, setCobroFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [cobroMedio, setCobroMedio] = useState<"efectivo" | "posnet" | "transferencia">("efectivo")
  const [cobroMonto, setCobroMonto] = useState("")

  const estadoDropdownRef = useRef<HTMLDivElement>(null)

  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // ── All useMemo hooks MUST be above any early return (Rules of Hooks) ──

  // Defensive aliases — safe even when venta is null
  const ventaItems = venta?.items ?? []
  const ventaCobros = venta?.cobros ?? []
  const ventaEntregaItems = venta?.entregaItems ?? []
  const ventaEntregaEntries = venta?.entregaEntries ?? []
  const ventaDevolucionItems = venta?.devolucionItems ?? []
  const ventaDevolucionEntries = venta?.devolucionEntries ?? []

  const itemDevolucionMap = useMemo(() => new Map(
    ventaItems.map((item) => {
      const d = ventaDevolucionItems.find(di => di.sku === item.sku)
      return [item.sku, d?.quantityDevuelta ?? 0]
    })
  ), [ventaItems, ventaDevolucionItems])

  const totalDevueltas = useMemo(() => ventaDevolucionItems.reduce((s, d) => s + d.quantityDevuelta, 0), [ventaDevolucionItems])
  const montoTotalDevuelto = useMemo(() => ventaDevolucionEntries.reduce((s, e) => s + e.montoDevuelto, 0), [ventaDevolucionEntries])

  const montoCobrado = useMemo(() => ventaCobros.reduce((sum, c) => sum + c.monto, 0), [ventaCobros])
  const montoRestante = useMemo(() => Math.max(0, (venta?.total ?? 0) - montoCobrado), [venta, montoCobrado])
  const pagoPct = useMemo(() => (venta?.total ?? 0) > 0 ? Math.min(100, Math.round((montoCobrado / venta!.total) * 100)) : 0, [venta, montoCobrado])

  const totalUnidades = useMemo(() => ventaItems.reduce((s, it) => s + it.quantity, 0), [ventaItems])
  const entregadasUnidades = useMemo(() => ventaItems.reduce((s, item) => {
    const e = ventaEntregaItems.find(ei => ei.sku === item.sku)
    return s + (e?.quantityEntregada ?? 0)
  }, 0), [ventaItems, ventaEntregaItems])
  const entregaPct = useMemo(() => totalUnidades > 0 ? Math.min(100, Math.round((entregadasUnidades / totalUnidades) * 100)) : 0, [entregadasUnidades, totalUnidades])

  const itemEntregaMap = useMemo(() => new Map(
    ventaItems.map((item) => {
      const e = ventaEntregaItems.find(ei => ei.sku === item.sku)
      return [item.sku, e?.quantityEntregada ?? 0]
    })
  ), [ventaItems, ventaEntregaItems])

  const itemDiscountAmount = useMemo(() => ventaItems.reduce((sum, it) => {
    if (it.discountType === "unit") {
      return sum + Math.min(it.discount, it.quantity) * it.unitPrice
    }
    const baseGross = it.unitPrice * it.quantity
    const discount =
      it.discountType === "percent" ? baseGross * (it.discount / 100) : it.discount * it.quantity
    return sum + discount
  }, 0), [ventaItems])

  // Detect pending changes in edit mode — must be after ventaItems is defined
  const hasItemChanges = useMemo(() => {
    if (!isEditMode) return false
    if (editItems.length !== ventaItems.length) return true
    return editItems.some((ei, i) => {
      const orig = ventaItems[i]
      const aj = editAjustes[i] ?? { value: 0, type: "percent" }
      return ei.quantity !== orig.quantity || ei.unitPrice !== orig.unitPrice || aj.value !== orig.discount
    })
  }, [isEditMode, editItems, editAjustes, ventaItems])

  const hasResumenChanges = useMemo(() => {
    if (!isEditMode) return false
    return (showGlobalDiscount && globalDiscount.value > 0) || (showEnvio && envioAmount > 0) || customCharges.some(c => c.value > 0)
  }, [isEditMode, showGlobalDiscount, globalDiscount, showEnvio, envioAmount, customCharges])

  const hasAnyEditChanges = hasItemChanges || hasResumenChanges

  // Modal computed values
  const allModalItems = INITIAL_ITEMS

  const uniqueModalCategorias = useMemo(() => {
    const cats = new Set<string>()
    allModalItems.forEach(item => { if (item.categoria) cats.add(item.categoria) })
    return Array.from(cats).sort()
  }, [])

  const uniqueModalMarcas = useMemo(() => {
    const marcas = new Set<string>()
    allModalItems.forEach(item => { if (item.marca) marcas.add(item.marca) })
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

  // ── useEffect hooks MUST also be above early returns ──

  // Initialize saved adjustments from venta once it's available
  useEffect(() => {
    if (!venta || adjustmentsInitialized) return
    setAdjustmentsInitialized(true)
    if (venta.descuento > 0) {
      setSavedGlobalDiscount({ value: venta.descuento, type: venta.descuentoTipo === "fixed" ? "cash" : "percent" })
    }
    if (venta.envio && venta.envio > 0) {
      setSavedEnvio(venta.envio)
    }
    if (venta.customCharges && venta.customCharges.length > 0) {
      setSavedCustomCharges(venta.customCharges)
    }
  }, [venta, adjustmentsInitialized])

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
  }, [showExportDropdown, showMoreOptionsMenu, showEstadoDropdown])

  // ── Early returns AFTER all hooks ──

  if (isLoadingVentas) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando venta...</p>
      </div>
    )
  }

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

  const clienteNombre = venta.cliente.tipo === "cuenta" ? venta.cliente.nombre : "Consumidor Final"
  const clienteId = venta.cliente.tipo === "cuenta" ? venta.cliente.id : null
  const isFacturada = !!venta.facturaEmitida
  const estadoUI = venta.estado
  const setEstadoUI = (next: typeof venta.estado) => setEstado(venta.id, next)

  const handleGuardar = async () => {
    setIsSaving(true)
    try {
      saveEditMode()
      setShowSaveSuccess(true)
      await new Promise(r => setTimeout(r, 1500))
      setShowSaveSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeshacer = () => {
    cancelEditMode()
  }

  const handleDownloadPDF = () => downloadVentasPDF([venta], miNegocio)
  const fechaCreacion = new Date(venta.fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

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

  // Build VentaItems from currently selected modal selections and persist them.
  const handleConfirmAgregarProductos = () => {
    if (!venta) return
    const newVentaItems: VentaItem[] = []

    for (const item of allModalItems) {
      const isParent = item.hasVariants && (item as Item).variants && (item as Item).variants!.length > 0

      if (isParent) {
        for (const variant of (item as Item).variants!) {
          const id = (variant as ItemVariant).id || `${(item as Item).skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          if (!selectedModalItems[id]) continue
          const sku = `${(item as Item).skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          const unitPrice = (variant as ItemVariant).precio?.precioFinal || 0
          newVentaItems.push({
            sku,
            name: `${item.name}${(variant as ItemVariant).atributosPrincipales?.length ? " · " + (variant as ItemVariant).atributosPrincipales!.map(a => a.value).join(" · ") : ""}`,
            quantity: 1,
            unitPrice,
            discount: 0,
            discountType: "percent",
            total: unitPrice,
            categoria: (variant as ItemVariant).categoria || (item as Item).categoria,
          })
        }
      } else {
        const id = (item as Item).id || (item as Item).sku || (item as Item).name
        if (!selectedModalItems[id]) continue
        const sku = (item as Item).sku || id
        const unitPrice = (item as Item).precio?.precioFinal || 0
        newVentaItems.push({
          sku,
          name: (item as Item).name,
          quantity: 1,
          unitPrice,
          discount: 0,
          discountType: "percent",
          total: unitPrice,
          categoria: (item as Item).categoria,
        })
      }
    }

    if (newVentaItems.length > 0) {
      addItemsToVenta(venta.id, newVentaItems)
    }
    closeAgregarProductos()
  }

  // Persist a new cobro entry from the Registrar Cobro modal.
  const handleConfirmCobro = () => {
    if (!venta) return
    const monto = Number(cobroMonto)
    if (!monto || monto <= 0) return
    addCobro(venta.id, {
      fecha: cobroFecha,
      hora: new Date().toTimeString().slice(0, 5),
      medioPago: cobroMedio,
      monto,
    })
    setShowRegistrarCobro(false)
    setCobroMonto("")
    setCobroMedio("efectivo")
  }

  // Persist deliveries for currently selected rows in the Registrar Entrega modal.
  const handleConfirmEntrega = () => {
    if (!venta) return
    const entregas: VentaEntregaItem[] = []
    for (const item of ventaItems) {
      if (!entregaSelectedItems[item.sku]) continue
      const delivered = ventaEntregaItems.find(e => e.sku === item.sku)?.quantityEntregada ?? 0
      const remaining = item.quantity - delivered
      const raw = entregaQuantities[item.sku]
      const qty = raw === "" || raw === undefined ? remaining : Math.max(0, Math.min(remaining, parseInt(raw, 10) || 0))
      if (qty > 0) entregas.push({ sku: item.sku, quantityEntregada: qty })
    }
    if (entregas.length > 0) {
      addEntregas(venta.id, entregas)
    }
    setShowRegistrarEntrega(false)
    setEntregaSelectedItems({})
    setEntregaQuantities({})
  }

  // Confirm "Marcar como Finalizada": atomic — delivers all pending units + registers cobro in one save.
  const handleConfirmFinalizar = () => {
    if (!venta) return
    const now = new Date()
    finalizarVenta(
      venta.id,
      finalizarMedioPago,
      now.toISOString().slice(0, 10),
      now.toTimeString().slice(0, 5),
    )
    setShowFinalizarVenta(false)
    setFinalizarMedioPago("no_especificado")
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
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2 min-w-[200px] justify-end">
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Cambios guardados</span>
                  </div>
                )}
                {isEditMode && hasAnyEditChanges && !showSaveSuccess && (
                  <>
                    <button
                      onClick={handleDeshacer}
                      className="px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all cursor-pointer text-red-700 text-sm font-medium"
                    >
                      Deshacer
                    </button>
                    <button
                      onClick={handleGuardar}
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-all cursor-pointer text-green-700 text-sm font-medium disabled:opacity-50"
                    >
                      {isSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Items Grid + Totals side by side */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
              <div className="max-w-[1240px] mx-auto">
              <div className="grid grid-cols-3 gap-4 items-start">

              {/* Left col-span-2 */}
              <div className="col-span-2 flex flex-col gap-4">

                {/* ── Venta Info card ── */}
                {(() => {
                  const fechaObj = new Date(venta.fecha)
                  const mesCorto = fechaObj.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
                  const dia = fechaObj.toLocaleDateString("es-AR", { day: "2-digit" })
                  const inicial = clienteNombre.charAt(0).toUpperCase()
                  return (
                    <div className="pt-8 px-0 pb-3 flex flex-col gap-6">
                      {/* Row 1: Venta ID + estado + fecha + origen + actions */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Venta</span>
                            <span className="text-2xl font-bold text-slate-900 leading-none tracking-tight">{venta.id}</span>
                          </div>
                          <div className="h-5 w-px bg-slate-300 shrink-0 mx-5" />
                          <span className="text-sm font-medium text-slate-600 tabular-nums shrink-0">
                            {dia} {mesCorto} {fechaObj.getFullYear()} · {venta.hora}
                          </span>
                          <div className="h-5 w-px bg-slate-300 shrink-0 mx-5" />
                          {/* Estado badge */}
                          {estadoUI === "finalizada" ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-xs font-medium text-emerald-700">Finalizada</span>
                            </div>
                          ) : estadoUI === "cancelada" ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 shrink-0">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-xs font-medium text-red-600">Cancelada</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-xs font-medium text-amber-700">En Curso</span>
                            </div>
                          )}
                        </div>

                        {/* Actions — moved here from row 2 */}
                        <div className="flex items-center gap-2 shrink-0">
                          {estadoUI === "en_curso" && (
                            <button
                              type="button"
                              onClick={() => isEditMode ? cancelEditMode() : enterEditMode()}
                              className={`h-8 text-xs cursor-pointer gap-1.5 px-3 rounded-md flex items-center font-medium transition-colors shadow-sm ${
                                isEditMode
                                  ? "bg-slate-900 text-white border border-slate-900"
                                  : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowTicketModal(true)}
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
                                <button
                                  onClick={() => { setShowMoreOptionsMenu(false); handleDownloadPDF() }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <FileDown className="w-4 h-4 text-slate-400" />
                                  Descargar PDF
                                </button>
                                {estadoUI !== "cancelada" && (
                                  <button
                                    onClick={() => { setShowMoreOptionsMenu(false); setShowCancelarVentaModal(true) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                  >
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    Cancelar venta
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Cliente widget (left) + Estado widget (right) */}
                      <div className="grid grid-cols-2 gap-3">

                        {/* Cliente widget — original */}
                        <button
                          type="button"
                          onClick={() => isEditMode ? setShowClienteSelectorModal(true) : (clienteId ? setShowClienteInfoModal(true) : undefined)}
                          className={`bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex items-center gap-4 transition-colors text-left ${clienteId || isEditMode ? "hover:bg-slate-100 cursor-pointer" : "cursor-default"}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-white">{clienteNombre.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none mb-1">Cliente</span>
                            <span className="text-base font-semibold text-slate-900 truncate block">{clienteNombre}</span>
                          </div>
                          {isEditMode && <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />}
                        </button>

                        {/* Actions widget */}
                        <div className="flex items-center justify-center px-4 py-3">
                          {estadoUI === "en_curso" && !isEditMode && (
                            <button
                              type="button"
                              onClick={() => setShowFinalizarVenta(true)}
                              className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer group w-full justify-center"
                            >
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:text-emerald-600 shrink-0" />
                              <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">Marcar como finalizada</span>
                            </button>
                          )}
                          {estadoUI === "finalizada" && !isEditMode && (
                            <div className="flex items-center gap-2 w-full justify-center">
                              <button
                                type="button"
                                onClick={() => { setShowDevolucion(true); setDevolucionStep(1) }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
                              >
                                <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-slate-700 shrink-0" />
                                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">Gestionar devoluciones</span>
                              </button>
                            </div>
                          )}

                          {isEditMode && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>

                      </div>

                    </div>
                  )
                })()}

                {/* ── Entrega / Cobro — only shown when en_curso ── */}
                {estadoUI === "en_curso" && <div className="grid grid-cols-2 gap-3">

                  {/* Widget 1 — Entrega */}
                  <div className={`bg-white border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-2 ${entregaPct === 100 && estadoUI !== "cancelada" ? "items-center justify-center" : ""}`}>
                    {estadoUI === "cancelada" ? (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-base font-semibold text-red-600">No Concretada</span>
                      </div>
                    ) : (
                      <>
                        {entregaPct === 100 ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-slate-800" />
                            <span className="text-base font-semibold text-slate-900">Entregada</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-slate-400" />
                              <span className="text-base font-semibold text-slate-700">Entrega {entregaPct}%</span>
                            </div>
                            <span className="text-sm text-slate-400 tabular-nums">
                              {totalUnidades - entregadasUnidades} {totalUnidades - entregadasUnidades === 1 ? "unidad pendiente" : "unidades pendientes"} de entrega
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowRegistrarEntrega(true)}
                              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Registrar entrega
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Widget 2 — Cobro */}
                  <div className={`bg-white border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-2 ${pagoPct === 100 && estadoUI !== "cancelada" ? "items-center justify-center" : ""}`}>
                    {estadoUI === "cancelada" ? (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-base font-semibold text-red-600">No Concretado</span>
                      </div>
                    ) : (
                      <>
                        {pagoPct === 100 ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-slate-800" />
                            <span className="text-base font-semibold text-slate-900">Cobrada</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-slate-400" />
                              <span className="text-base font-semibold text-slate-700">Cobro {pagoPct}%</span>
                            </div>
                        {pagoPct < 100 && (
                          <>
                            <span className="text-sm text-slate-400 tabular-nums">
                              ${Math.round(montoRestante).toLocaleString("es-AR")} pendiente de cobro
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowRegistrarCobro(true)}
                              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Registrar cobro
                            </button>
                          </>
                        )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                </div>}

                {/* Entrega + Items card */}
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">

                {/* ── Title strip — toggle buttons ── */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("productos")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "productos" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Productos
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("entrega")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "entrega" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Entrega
                  </button>
                  {ventaDevolucionEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setViewMode("devolucion")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        viewMode === "devolucion" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Devolución
                    </button>
                  )}
                </div>

                {/* ── Grid title ── */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  {viewMode === "entrega" ? (
                    <>
                      <Truck className="w-4 h-4 text-slate-600" />
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {entregadasUnidades}/{totalUnidades} {totalUnidades === 1 ? "unidad entregada" : "unidades entregadas"}
                      </span>
                    </>
                  ) : viewMode === "devolucion" ? (
                    <>
                      <RotateCcw className="w-4 h-4 text-red-500" />
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {totalDevueltas}/{totalUnidades} {totalUnidades === 1 ? "unidad devuelta" : "unidades devueltas"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 text-slate-600" />
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {ventaItems.length} {ventaItems.length === 1 ? "producto" : "productos"} · {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
                      </span>
                    </>
                  )}
                </div>

                {/* ── Entrega activity log ── */}
                {viewMode === "entrega" && (
                  <div className="px-4 pb-2 flex flex-col">
                    {ventaEntregaEntries.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">Sin entregas registradas</p>
                    ) : (
                      [...ventaEntregaEntries].reverse().map((entry) => {
                        const isAnulacion = !!entry.anulacion
                        const totalEntryUnits = isAnulacion
                          ? (entry.anulacionTotal ?? Math.abs(entry.items.reduce((s, i) => s + i.quantity, 0)))
                          : entry.items.reduce((s, i) => s + i.quantity, 0)
                        const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
                        return (
                          <div key={entry.id} className="flex items-center group border-b border-slate-100 last:border-0">
                            <button
                              type="button"
                              onClick={() => !isAnulacion && setViewingEntregaEntry(entry)}
                              className={`flex-1 flex items-center gap-2 py-1.5 -ml-4 pl-4 pr-2 transition-colors text-left ${!isAnulacion ? "hover:bg-slate-50/60" : "cursor-default"}`}
                            >
                              <span className={`text-xs tabular-nums ${isAnulacion ? "text-red-400" : "text-slate-400"}`}>{dateLabel}</span>
                              <span className="text-xs text-slate-300">·</span>
                              {isAnulacion ? (
                                <span className="text-xs text-red-400">Anulación de entrega: {totalEntryUnits} {totalEntryUnits === 1 ? "unidad" : "unidades"}</span>
                              ) : (
                                <span className="text-xs text-slate-400 tabular-nums">{totalEntryUnits} {totalEntryUnits === 1 ? "unidad" : "unidades"}</span>
                              )}
                            </button>
                            {!isAnulacion && estadoUI === "en_curso" && (
                              <button
                                type="button"
                                onClick={() => setUndoEntregaTarget(entry)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 pr-0"
                                title="Deshacer entrega"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* ── Devolución activity log ── */}
                {viewMode === "devolucion" && (
                  <div className="px-4 pb-2 flex flex-col">
                    {ventaDevolucionEntries.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">Sin devoluciones registradas</p>
                    ) : (
                      [...ventaDevolucionEntries].filter(e => e.items.length > 0).reverse().map((entry) => {
                        const totalEntryUnits = entry.items.reduce((s, i) => s + i.quantity, 0)
                        const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
                        return (
                          <div key={entry.id} className="flex items-center border-b border-slate-100 last:border-0">
                            <div className="flex-1 flex items-center gap-2 py-1.5">
                              <span className="text-xs text-slate-400 tabular-nums">{dateLabel}</span>
                              <span className="text-xs text-slate-300">·</span>
                              <span className="text-xs text-slate-400 tabular-nums">{entry.hora}</span>
                              <span className="text-xs text-slate-300">·</span>
                              <span className="text-xs text-slate-400 tabular-nums">{totalEntryUnits} {totalEntryUnits === 1 ? "unidad" : "unidades"}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* ── Grid (padded inside card) ── */}
                <div className="px-3 pb-3">
                <div className="rounded-md border border-slate-200/80 overflow-hidden">



                {/* ── Edit mode column headers ── */}
                {isEditMode && viewMode === "productos" && (
                  <div className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1.2fr_auto] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center px-4">Item</div>
                    <div className="flex items-center justify-center">Cantidad</div>
                    <div className="flex items-center justify-center">Precio Unit.</div>
                    <div className="flex items-center justify-center">Promoción</div>
                    <div className="w-10" />
                  </div>
                )}

                {/* ── Items ── */}
                {ventaItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Package className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-slate-500 mb-1">Sin items</p>
                    <p className="text-xs text-slate-400">Esta venta no tiene items asociados</p>
                  </div>
                ) : (
                  ventaItems.map((item, idx) => {
                    const display = getVentaItemDisplay(item)
                    const baseGross = item.unitPrice * item.quantity
                    const discountAmount =
                      item.discountType === "percent"
                        ? baseGross * (item.discount / 100)
                        : item.discountType === "unit"
                        ? Math.min(item.discount, item.quantity) * item.unitPrice
                        : item.discount * item.quantity
                    const adjustedUnitPrice = Math.max(0, item.unitPrice - (discountAmount / Math.max(item.quantity, 1)))
                    const delivered = itemEntregaMap.get(item.sku) ?? 0
                    const itemPct = item.quantity === 0 ? 0 : Math.round((delivered / item.quantity) * 100)

                    return (
                      <div
                        key={`${venta.id}-item-${idx}`}
                        onClick={() => !isEditMode && viewMode === "productos" && setViewingItem(item)}
                        className={`border-b border-slate-100 last:border-b-0 transition-colors ${!isEditMode && viewMode === "productos" ? "hover:bg-slate-50/50 cursor-pointer" : ""}`}
                      >
                        {viewMode === "entrega" ? (
                          <div className="flex items-center h-[56px] gap-3 px-4">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            {/* Entregadas col */}
                            <div className="flex items-center gap-2 shrink-0 pr-2">
                              {itemPct === 100 ? (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-sm font-medium text-emerald-700 tabular-nums">{item.quantity}/{item.quantity}</span>
                                  <span className="text-xs text-slate-400">entregadas</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-sm font-semibold tabular-nums ${delivered > 0 ? "text-amber-600" : "text-slate-400"}`}>{delivered}/{item.quantity}</span>
                                  <span className="text-xs text-slate-400">entregadas</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : viewMode === "devolucion" ? (
                          (() => {
                            const devuelta = itemDevolucionMap.get(item.sku) ?? 0
                            return (
                              <div className="flex items-center h-[56px] gap-3 px-4">
                                {/* Item Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
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
                                {/* Devueltas col */}
                                <div className="flex items-center gap-2 shrink-0 pr-2">
                                  {devuelta > 0 ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-semibold text-red-500 tabular-nums">{devuelta}/{item.quantity}</span>
                                      <span className="text-xs text-slate-400">devueltas</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm text-slate-300 tabular-nums">0/{item.quantity}</span>
                                      <span className="text-xs text-slate-300">devueltas</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })()
                        ) : isEditMode ? (
                          /* ── Edit mode row (presupuesto-style) ── */
                          (() => {
                            const editItem = editItems[idx] ?? item
                            const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                            let adjUnit = editItem.unitPrice
                            let finalTotal = 0
                            if (aj.value > 0) {
                              if (aj.type === "unit") {
                                finalTotal = Math.max(0, editItem.quantity - Math.min(aj.value, editItem.quantity)) * editItem.unitPrice
                              } else {
                                adjUnit = aj.type === "percent"
                                  ? editItem.unitPrice * (1 - aj.value / 100)
                                  : Math.max(0, editItem.unitPrice - aj.value)
                                finalTotal = editItem.quantity * adjUnit
                              }
                            } else {
                              finalTotal = editItem.quantity * editItem.unitPrice
                            }
                            return (
                              <div className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1.2fr_auto] min-h-[72px]">
                                {/* Item Info */}
                                <div className="flex items-center gap-3 px-4 py-3">
                                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image src={getCategoryImage(display.categoria || "") || "/placeholder.svg"} alt={item.name} width={32} height={32} className="object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <p className="text-sm font-medium text-gray-900 break-words leading-tight">{display.name}</p>
                                      {display.tags.length > 0 && display.tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
                                      ))}
                                    </div>
                                    {(display.marca || display.categoria) && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {display.marca && <span className="text-xs text-slate-400">{display.marca}</span>}
                                        {display.marca && display.categoria && <span className="text-xs text-slate-300">·</span>}
                                        {display.categoria && <span className="text-xs text-slate-400">{display.categoria}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Cantidad */}
                                <div className="flex items-center justify-center">
                                  <div className="flex items-center border border-slate-200 rounded-full px-1 py-0.5 bg-white">
                                    <button onClick={() => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))} className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors">
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      value={editItem.quantity || ""}
                                      onChange={(e) => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                                      className="w-10 text-center text-sm py-1 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button onClick={() => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))} className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {/* Precio Unit. */}
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-slate-400 text-sm">$</span>
                                  <input
                                    type="number"
                                    value={editItem.unitPrice || ""}
                                    onChange={(e) => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: parseFloat(e.target.value) || 0 } : it))}
                                    className="w-20 text-center text-sm py-1.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                                {/* Promocion */}
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={aj.value || ""}
                                    onChange={(e) => {
                                      let val = parseFloat(e.target.value) || 0
                                      if (aj.type === "unit") val = Math.min(val, editItem.quantity)
                                      setEditAjustes(prev => ({ ...prev, [idx]: { ...aj, value: val } }))
                                    }}
                                    className="w-12 text-center text-xs py-1 border border-slate-200 rounded focus:outline-none focus:border-slate-400 placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <div className="flex border border-slate-200 rounded overflow-hidden">
                                    {(["percent", "cash", "unit"] as const).map((t) => (
                                      <button key={t} onClick={() => setEditAjustes(prev => ({ ...prev, [idx]: { ...aj, type: t } }))} className={`px-1.5 py-1 text-xs cursor-pointer ${aj.type === t ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>
                                        {t === "percent" ? "%" : t === "cash" ? "$" : <Package className="w-3 h-3" />}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {/* Subtotal */}
                                <div className="flex flex-col items-end justify-center pr-4">
                                  {aj.value > 0 ? (
                                    <>
                                      <span className="text-[10px] text-slate-400 line-through tabular-nums">{editItem.quantity} × ${Math.round(editItem.unitPrice).toLocaleString("es-AR")}</span>
                                      <span className="text-sm font-bold text-slate-900 tabular-nums">${Math.round(finalTotal).toLocaleString("es-AR")}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[10px] text-slate-500 tabular-nums">{editItem.quantity} × ${Math.round(editItem.unitPrice).toLocaleString("es-AR")}</span>
                                      <span className="text-sm font-bold text-slate-900 tabular-nums">${Math.round(finalTotal).toLocaleString("es-AR")}</span>
                                    </>
                                  )}
                                </div>
                                {/* Delete */}
                                <div className="flex items-center justify-center w-10">
                                  <button onClick={() => { setEditItems(prev => prev.filter((_, i) => i !== idx)); setEditAjustes(prev => { const next = { ...prev }; delete next[idx]; return next }) }} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )
                          })()
                        ) : (
                          <div className="grid grid-cols-[50%_25%_25%] min-h-[56px]">
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

                            {/* Cantidad col */}
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-sm text-slate-700 tabular-nums">{item.quantity}</span>
                              <span className="text-xs text-slate-400">{item.quantity === 1 ? "unidad" : "unidades"}</span>
                            </div>

                            {/* Precio Unit. col — with promo logic for %, $, and unit bonificadas */}
                            <div className="flex flex-col items-center justify-center gap-0.5 py-2">
                              {item.discount > 0 && item.discountType === "unit" ? (
                                <>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                    <span className="text-xs text-slate-400">c/u</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-600 font-medium">
                                    {Math.min(item.discount, item.quantity)} unidades bonificadas
                                  </span>
                                </>
                              ) : item.discount > 0 && (item.discountType === "percent" || item.discountType === "fixed") ? (
                                <>
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
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-medium text-slate-800 tabular-nums">
                                      ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-xs text-slate-400">c/u</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-sm text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                  <span className="text-xs text-slate-400">c/u</span>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              {isEditMode && viewMode === "productos" && (
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

              {/* Right col-span-1: two stacked cards */}
              {ventaItems.length > 0 && (
                <div className="col-span-1 flex flex-col gap-4">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-5 py-5 flex flex-col gap-0">

                    {/* ── Resumen section ── */}
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Resumen</h3>
                    </div>

                    {/* Productos — expandable */}
                    <button
                      type="button"
                      onClick={() => setShowSubtotalBreakdown(!showSubtotalBreakdown)}
                      className="flex items-center py-3 border-b border-slate-100 text-left hover:bg-slate-50/50 transition-colors -mx-5 px-5 w-[calc(100%+2.5rem)]"
                    >
                      <span className="text-sm text-slate-500 flex-1">Productos</span>
                      <span className="text-sm text-slate-700 tabular-nums mr-1.5">${Math.round(venta.subtotal).toLocaleString("es-AR")}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSubtotalBreakdown ? "rotate-180" : ""}`} />
                    </button>
                    {showSubtotalBreakdown && (
                      <div>
                        {ventaItems.map((item, idx) => {
                          const display = getVentaItemDisplay(item)
                          const paidQty = item.discountType === "unit"
                            ? Math.max(0, item.quantity - Math.min(item.discount, item.quantity))
                            : item.quantity
                          const adjustedUnit = item.discountType === "percent"
                            ? item.unitPrice * (1 - item.discount / 100)
                            : item.discountType === "unit"
                            ? item.unitPrice
                            : item.unitPrice - (item.discount / Math.max(item.quantity, 1))
                          const lineTotal = item.discountType === "unit"
                            ? Math.round(adjustedUnit * paidQty)
                            : Math.round(adjustedUnit * item.quantity)
                          return (
                            <div key={idx} className="flex justify-between items-start gap-3 py-2.5 -mx-5 px-5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs text-slate-700 leading-tight">{display.name}</p>
                                  {display.tags.map((tag, i) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{tag}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {item.discountType === "unit" && item.discount > 0 ? (
                                  <>
                                    <p className="text-[10px] text-emerald-600">{Math.min(item.discount, item.quantity)} bonificadas</p>
                                    <p className="text-[11px] text-slate-400 tabular-nums">{paidQty} × ${Math.round(adjustedUnit).toLocaleString("es-AR")}</p>
                                  </>
                                ) : (
                                  <p className="text-[11px] text-slate-400 tabular-nums">{item.quantity} × ${Math.round(adjustedUnit).toLocaleString("es-AR")}</p>
                                )}
                                <p className="text-xs font-medium text-slate-700 tabular-nums">${lineTotal.toLocaleString("es-AR")}</p>
                              </div>
                            </div>
                          )
                        })}
                        <div className="-mx-5 w-[calc(100%+2.5rem)] border-b border-slate-100" />
                      </div>
                    )}

                    {/* ── Edit mode ajuste inputs ── */}
                    {isEditMode && showGlobalDiscount && (
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setShowGlobalDiscount(false); setGlobalDiscount({ value: 0, type: "percent" }) }} className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-slate-500">Descuento global</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={globalDiscount.value || ""}
                            onChange={(e) => setGlobalDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                            className="w-16 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <div className="flex border border-slate-200 rounded overflow-hidden">
                            <button onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "cash" }))} className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "cash" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>$</button>
                            <button onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "percent" }))} className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "percent" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>%</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {isEditMode && showEnvio && (
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setShowEnvio(false); setEnvioAmount(0) }} className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-slate-500">Envío</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-400">$</span>
                          <input
                            type="number"
                            value={envioAmount || ""}
                            onChange={(e) => setEnvioAmount(parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    )}
                    {isEditMode && customCharges.map((charge, idx) => (
                      <div key={charge.id} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setCustomCharges(prev => prev.filter((_, i) => i !== idx))} className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                          <input
                            type="text"
                            value={charge.label}
                            onChange={(e) => setCustomCharges(prev => prev.map((c, i) => i === idx ? { ...c, label: e.target.value } : c))}
                            className="text-sm text-slate-500 bg-transparent border-none outline-none w-24"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-400">$</span>
                          <input
                            type="number"
                            value={charge.value || ""}
                            onChange={(e) => setCustomCharges(prev => prev.map((c, i) => i === idx ? { ...c, value: parseFloat(e.target.value) || 0 } : c))}
                            className="w-20 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Agregar tags — only shown in edit mode */}
                    {isEditMode && estadoUI === "en_curso" && (!showGlobalDiscount || !showEnvio || customCharges.length === 0) && (
                      <div className="flex items-center gap-2 flex-wrap py-2">
                        <span className="text-xs text-slate-400">Agregar:</span>
                        {!showGlobalDiscount && (
                          <button onClick={() => setShowGlobalDiscount(true)} className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                            Descuento Global
                          </button>
                        )}
                        {!showEnvio && (
                          <button onClick={() => setShowEnvio(true)} className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                            Envío
                          </button>
                        )}
                        {customCharges.length === 0 && (
                          <button onClick={() => setCustomCharges([{ id: Date.now(), label: "Otro", value: 0 }])} className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                            Otro
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── View mode: saved adjustments ── */}
                    {!isEditMode && savedGlobalDiscount && savedGlobalDiscount.value > 0 && (
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">
                          Descuento Global{" "}
                          <span className="text-xs text-slate-400">
                            ({savedGlobalDiscount.type === "percent" ? `${savedGlobalDiscount.value}%` : `$${savedGlobalDiscount.value.toLocaleString("es-AR")}`})
                          </span>
                        </span>
                        <span className="text-sm text-red-500 tabular-nums">
                          −${Math.round(savedGlobalDiscountAmount).toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}
                    {!isEditMode && savedEnvio != null && savedEnvio > 0 && (
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">Envío</span>
                        <span className="text-sm text-slate-700 tabular-nums">+${savedEnvio.toLocaleString("es-AR")}</span>
                      </div>
                    )}
                    {!isEditMode && savedCustomCharges.map((c) => (
                      <div key={c.id} className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">{c.label}</span>
                        <span className="text-sm text-slate-700 tabular-nums">+${c.value.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                    {/* Devolución line */}
                    {!isEditMode && montoTotalDevuelto > 0 && (
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">Devolución</span>
                        <span className="text-sm font-medium text-red-500 tabular-nums">−${Math.round(montoTotalDevuelto).toLocaleString("es-AR")}</span>
                      </div>
                    )}
                    {/* Border below adjustments only if any exist */}
                    {!isEditMode && (savedGlobalDiscount?.value > 0 || (savedEnvio != null && savedEnvio > 0) || savedCustomCharges.length > 0 || montoTotalDevuelto > 0) && (
                      <div className="-mx-5 w-[calc(100%+2.5rem)] border-b border-slate-100" />
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center py-3 mt-1">
                      <span className="text-base font-bold text-slate-900">Total</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        ${Math.round(
                          isEditMode
                            ? venta.subtotal - globalDiscountAmount + envioAmount + customCharges.reduce((s, c) => s + c.value, 0)
                            : venta.total
                        ).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>{/* end resumen card */}

                {/* ── Detalle del Cobro card ── */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-5 py-5 flex flex-col gap-0">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Detalle del Cobro</p>

                    {ventaCobros.length > 0 ? (
                      ventaCobros.map((cobro) => {
                        const isAnulacion = cobro.medioPago === "anulacion"
                        const isNegative = cobro.monto < 0
                        const isEditable = !isAnulacion && !isNegative
                        return (
                          <div key={cobro.id} className="flex items-center py-2.5 border-b border-slate-100 gap-2 group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`text-xs tabular-nums ${isAnulacion ? "text-red-400" : "text-slate-400"}`}>
                                {new Date(cobro.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                              </span>
                              <span className="text-xs text-slate-300">·</span>
                              {isAnulacion ? (
                                <span className="text-xs text-red-400">Anulación</span>
                              ) : isNegative ? (
                                <span className="text-xs text-slate-500">Devolución</span>
                              ) : (
                                <span className="flex items-center gap-1 group/mp cursor-default">
                                  <span className="text-xs text-slate-500">{metodoPagoLabels[cobro.medioPago as PaymentMethod] ?? cobro.medioPago}</span>
                                  {isEditable && (
                                    <button
                                      type="button"
                                      onClick={() => { setEditarMedioPagoTarget({ id: cobro.id, current: cobro.medioPago }); setEditarMedioPagoValue(cobro.medioPago) }}
                                      className="opacity-0 group-hover/mp:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500"
                                      title="Editar medio de pago"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              )}
                            </div>
                            <span className={`text-sm font-semibold tabular-nums ${isAnulacion || isNegative ? "text-red-500" : "text-slate-900"}`}>
                              {isNegative || isAnulacion ? `−$${Math.abs(cobro.monto).toLocaleString("es-AR")}` : `$${cobro.monto.toLocaleString("es-AR")}`}
                            </span>
                            {!isAnulacion && !isNegative && estadoUI === "en_curso" && (
                              <button
                                type="button"
                                onClick={() => setUndoCobroTarget({ id: cobro.id, monto: cobro.monto })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                title="Deshacer cobro"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <span className="text-xs text-slate-400">Sin cobros registrados</span>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              )}

              </div>{/* end grid grid-cols-3 */}
              </div>{/* end max-w-[1240px] */}
            </div>
          </main>
        </div>
      </div>

      {viewingItem && (
        <VentaItemDetailModal ventaItem={viewingItem} onClose={() => setViewingItem(null)} />
      )}

      {/* ── Cliente Info Modal (view mode) ── */}
      {showClienteInfoModal && clienteId && (
        <ClienteModal clienteId={clienteId} onClose={() => setShowClienteInfoModal(false)} />
      )}

      {/* ── Cliente Selector Modal (edit mode) ── */}
      {showClienteSelectorModal && (() => {
        return (
          <ClienteSelectorInlineModal
            currentClienteId={clienteId}
            onSelect={(id, nombre) => {
              updateVenta(venta.id, { cliente: { tipo: "cuenta", id, nombre } })
              setShowClienteSelectorModal(false)
            }}
            onClose={() => setShowClienteSelectorModal(false)}
          />
        )
      })()}

      {/* ── Ticket Modal ── */}
      {showTicketModal && (
        <TicketModal venta={venta} onClose={() => setShowTicketModal(false)} />
      )}

      {/* ── Cancelar Venta Modal ── */}
      {showCancelarVentaModal && (() => {
        const totalEntregadas = venta.entregaItems.reduce((s, ei) => s + ei.quantityEntregada, 0)
        const totalCobrado = venta.cobros.reduce((s, c) => s + Math.max(0, c.monto), 0)
        const hasEntregas = totalEntregadas > 0
        const hasCobros = totalCobrado > 0
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelarVentaModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Cancelar venta</h3>
                </div>
                <p className="text-sm text-slate-500 mt-2 ml-12">
                  Vas a cancelar la venta <span className="font-semibold text-slate-800">{venta.id}</span>. Esta acción es irreversible.
                </p>
              </div>

              {/* Body */}
              {(hasEntregas || hasCobros) && (
                <div className="px-5 py-4 flex flex-col gap-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">¿Qué hacer con los registros existentes?</p>

                  {hasEntregas && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{totalEntregadas} {totalEntregadas === 1 ? "unidad entregada" : "unidades entregadas"}</p>
                        <p className="text-xs text-slate-400">Unidades ya despachadas</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => setCancelarDevolverUnidades(true)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cancelarDevolverUnidades ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          Devolver
                        </button>
                        <button
                          onClick={() => setCancelarDevolverUnidades(false)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!cancelarDevolverUnidades ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          No hacer nada
                        </button>
                      </div>
                    </div>
                  )}

                  {hasCobros && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">${totalCobrado.toLocaleString("es-AR")} cobrados</p>
                        <p className="text-xs text-slate-400">Pagos ya registrados</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => setCancelarDevolverCobros(true)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cancelarDevolverCobros ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          Devolver
                        </button>
                        <button
                          onClick={() => setCancelarDevolverCobros(false)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!cancelarDevolverCobros ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          No hacer nada
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowCancelarVentaModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Salir
                </button>
                <button
                  onClick={() => {
                    cancelarVenta(venta.id, {
                      devolverUnidades: hasEntregas ? cancelarDevolverUnidades : false,
                      devolverCobros: hasCobros ? cancelarDevolverCobros : false,
                    })
                    setShowCancelarVentaModal(false)
                    setCancelarDevolverUnidades(true)
                    setCancelarDevolverCobros(true)
                    if (isEditMode) cancelEditMode()
                  }}
                  className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancelar venta
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Editar Medio de Pago Modal ── */}
      {editarMedioPagoTarget && venta && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditarMedioPagoTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Editar medio de pago</h3>
              <button onClick={() => setEditarMedioPagoTarget(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2">
              {(["efectivo", "posnet", "transferencia"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEditarMedioPagoValue(m)}
                  className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors text-left ${
                    editarMedioPagoValue === m
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {metodoPagoLabels[m]}
                </button>
              ))}
            </div>
            <div className="px-5 pb-4 flex gap-2 justify-end">
              <button onClick={() => setEditarMedioPagoTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateCobroMedioPago(venta.id, editarMedioPagoTarget.id, editarMedioPagoValue)
                  setEditarMedioPagoTarget(null)
                }}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Undo Cobro Modal ── */}
      {undoCobroTarget && venta && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUndoCobroTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Undo2 className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Deshacer cobro</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"¿Estás seguro? "}
                <span className="font-semibold text-slate-900">${undoCobroTarget.monto.toLocaleString("es-AR")}</span>
                {" van a volver a estar pendientes de cobro."}
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setUndoCobroTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { undoCobro(venta.id, undoCobroTarget.id); setUndoCobroTarget(null) }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Undo Entrega Modal ── */}
      {undoEntregaTarget && venta && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUndoEntregaTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Undo2 className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Deshacer entrega</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"¿Estás seguro? "}
                <span className="font-semibold text-slate-900">
                  {undoEntregaTarget.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                  {undoEntregaTarget.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "unidad va" : "unidades van"}
                </span>
                {" a volver a estar pendientes de entrega."}
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setUndoEntregaTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { undoEntregaEntry(venta.id, undoEntregaTarget.id); setUndoEntregaTarget(null) }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Entrega Entry Detail Modal ── */}
      {viewingEntregaEntry && (() => {
        const entry = viewingEntregaEntry
        const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
        const totalUnits = entry.items.reduce((s, i) => s + i.quantity, 0)
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingEntregaEntry(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Detalle de entrega</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{dateLabel} · {entry.hora}</p>
                </div>
                <button onClick={() => setViewingEntregaEntry(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Items */}
              <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto max-h-80">
                {entry.items.map((ei, idx) => {
                  const ventaItem = ventaItems.find(it => it.sku === ei.sku)
                  const display = ventaItem ? getVentaItemDisplay(ventaItem) : null
                  const name = display?.name ?? ei.sku
                  return (
                    <div key={idx} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {display && (
                          <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                            <Image src={getCategoryImage(display.categoria || "") || "/placeholder.svg"} alt={name} width={32} height={32} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-sm text-slate-800 truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">{ei.quantity}</span>
                        <span className="text-xs text-slate-400">{ei.quantity === 1 ? "unidad" : "unidades"}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">{totalUnits} {totalUnits === 1 ? "unidad entregada" : "unidades entregadas"}</span>
                <button onClick={() => setViewingEntregaEntry(null)} className="px-4 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Registrar Entrega Modal ── */}
      {showRegistrarEntrega && (() => {
        // Items with units still pending delivery
        const pendingItems = ventaItems.filter(item => {
          const delivered = itemEntregaMap.get(item.sku) ?? 0
          return delivered < item.quantity
        })

        const pendingSkus = pendingItems.map(i => i.sku)

        const allSelected = pendingSkus.length > 0 && pendingSkus.every(sku => entregaSelectedItems[sku])
        const someSelected = pendingSkus.some(sku => entregaSelectedItems[sku])
        const indeterminate = someSelected && !allSelected

        const selectedCount = pendingSkus.filter(sku => entregaSelectedItems[sku]).length

        const handleSelectAllEntrega = () => {
          const selecting = !allSelected && !indeterminate
          const nextSelected: { [sku: string]: boolean } = {}
          const nextQty: { [sku: string]: string } = { ...entregaQuantities }
          for (const item of pendingItems) {
            nextSelected[item.sku] = selecting
            if (selecting) {
              const delivered = itemEntregaMap.get(item.sku) ?? 0
              nextQty[item.sku] = String(item.quantity - delivered)
            } else {
              delete nextQty[item.sku]
            }
          }
          setEntregaSelectedItems(nextSelected)
          setEntregaQuantities(nextQty)
        }

        const handleToggleEntregaItem = (sku: string) => {
          const willBeSelected = !entregaSelectedItems[sku]
          setEntregaSelectedItems(prev => ({ ...prev, [sku]: willBeSelected }))
          if (willBeSelected) {
            const item = pendingItems.find(i => i.sku === sku)
            if (item) {
              const delivered = itemEntregaMap.get(sku) ?? 0
              setEntregaQuantities(prev => ({ ...prev, [sku]: String(item.quantity - delivered) }))
            }
          } else {
            setEntregaQuantities(prev => { const next = { ...prev }; delete next[sku]; return next })
          }
        }

        const closeEntrega = () => {
          setShowRegistrarEntrega(false)
          setEntregaSelectedItems({})
          setEntregaQuantities({})
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEntrega} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Registrar entrega</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Indicá las unidades a marcar como entregadas</p>
                </div>
                <button onClick={closeEntrega} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Column headers */}
              <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
                <div className="grid grid-cols-[3fr_1fr_1.4fr] h-9 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center px-4 gap-3">
                    <button
                      onClick={handleSelectAllEntrega}
                      className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white"
                    >
                      {allSelected && <Check className="w-3 h-3 text-slate-800" />}
                      {indeterminate && <Minus className="w-3 h-3 text-slate-800" />}
                    </button>
                    <span>Producto</span>
                  </div>
                  <div className="flex items-center justify-center">Restantes</div>
                  <div className="flex items-center justify-center">Entregar</div>
                </div>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto bg-white">
                {pendingItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Todos los productos ya fueron entregados</p>
                  </div>
                ) : (
                  pendingItems.map((item, idx) => {
                    const delivered = itemEntregaMap.get(item.sku) ?? 0
                    const remaining = item.quantity - delivered
                    const display = getVentaItemDisplay(item)
                    const isSelected = !!entregaSelectedItems[item.sku]
                    const qtyValue = entregaQuantities[item.sku] ?? ""

                    return (
                      <div
                        key={idx}
                        className={`grid grid-cols-[3fr_1fr_1.4fr] items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? "bg-slate-50/70" : ""}`}
                        onClick={() => handleToggleEntregaItem(item.sku)}
                      >
                        {/* Product info */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleEntregaItem(item.sku) }}
                            className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white flex-shrink-0"
                          >
                            {isSelected && <Check className="w-3 h-3 text-slate-800" />}
                          </button>
                          <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                            <Image
                              src={getCategoryImage(display.categoria || "") || "/placeholder.svg"}
                              alt={display.name}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{display.name}</p>
                            <p className="text-xs text-slate-400">{[display.marca, display.categoria].filter(Boolean).join(" · ")}</p>
                          </div>
                        </div>

                        {/* Restantes */}
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-slate-600 tabular-nums">{remaining}</span>
                        </div>

                        {/* Entregar input */}
                        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                          {isSelected && (
                            <input
                              type="number"
                              min={0}
                              max={remaining}
                              value={qtyValue}
                              placeholder={String(remaining)}
                              onChange={(e) => {
                                const raw = e.target.value
                                if (raw === "") { setEntregaQuantities(prev => ({ ...prev, [item.sku]: "" })); return }
                                const num = parseInt(raw, 10)
                                if (isNaN(num) || num < 0) { setEntregaQuantities(prev => ({ ...prev, [item.sku]: "0" })); return }
                                if (num > remaining) { setEntregaQuantities(prev => ({ ...prev, [item.sku]: String(remaining) })); return }
                                setEntregaQuantities(prev => ({ ...prev, [item.sku]: String(num) }))
                              }}
                              className="w-14 text-center text-sm tabular-nums bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-slate-400 transition-colors"
                            />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
                <span className="text-sm text-slate-500">
                  {selectedCount > 0
                    ? `${selectedCount} producto${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`
                    : "Seleccioná productos para registrar"}
                </span>
                <button
                  onClick={handleConfirmEntrega}
                  disabled={selectedCount === 0}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Registrar entrega
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── Registrar Devolución Modal ── */}
      {showDevolucion && (() => {
        // Items that have been delivered (can be returned)
        const deliverableItems = ventaItems.filter(item => {
          const delivered = itemEntregaMap.get(item.sku) ?? 0
          return delivered > 0
        })

        const devSkus = deliverableItems.map(i => i.sku)
        const allSelected = devSkus.length > 0 && devSkus.every(sku => devolucionSelectedItems[sku])
        const someSelected = devSkus.some(sku => devolucionSelectedItems[sku])
        const indeterminate = someSelected && !allSelected
        const selectedCount = devSkus.filter(sku => devolucionSelectedItems[sku]).length

        // Calculate total units and amount for selected items
        const selectedEntries = deliverableItems
          .filter(item => devolucionSelectedItems[item.sku])
          .map(item => {
            const qty = parseInt(devolucionQuantities[item.sku] ?? "0", 10) || 0
            const unitPrice = item.total / Math.max(item.quantity, 1)
            return { item, qty, amount: qty * unitPrice }
          })
        const totalDevUnits = selectedEntries.reduce((s, e) => s + e.qty, 0)
        const totalDevAmount = selectedEntries.reduce((s, e) => s + e.amount, 0)

        const handleSelectAll = () => {
          const selecting = !allSelected && !indeterminate
          const nextSelected: { [sku: string]: boolean } = {}
          const nextQty: { [sku: string]: string } = { ...devolucionQuantities }
          for (const item of deliverableItems) {
            nextSelected[item.sku] = selecting
            if (selecting) {
              const delivered = itemEntregaMap.get(item.sku) ?? 0
              nextQty[item.sku] = String(delivered)
            } else {
              delete nextQty[item.sku]
            }
          }
          setDevolucionSelectedItems(nextSelected)
          setDevolucionQuantities(nextQty)
        }

        const handleToggleItem = (sku: string) => {
          const willBeSelected = !devolucionSelectedItems[sku]
          setDevolucionSelectedItems(prev => ({ ...prev, [sku]: willBeSelected }))
          if (willBeSelected) {
            const item = deliverableItems.find(i => i.sku === sku)
            if (item) {
              const delivered = itemEntregaMap.get(sku) ?? 0
              setDevolucionQuantities(prev => ({ ...prev, [sku]: String(delivered) }))
            }
          } else {
            setDevolucionQuantities(prev => { const next = { ...prev }; delete next[sku]; return next })
          }
        }

        const closeModal = () => {
          setShowDevolucion(false)
          setDevolucionStep(1)
          setDevolucionSelectedItems({})
          setDevolucionQuantities({})
        }

        const handleConfirmDevolucion = () => {
          if (!venta) return
          const devoluciones: VentaDevolucionItem[] = selectedEntries
            .filter(e => e.qty > 0)
            .map(e => ({ sku: e.item.sku, quantityDevuelta: e.qty }))
          if (devoluciones.length === 0) return
          addDevolucion(venta.id, devoluciones, Math.round(totalDevAmount))
          setViewMode("devolucion")
          closeModal()
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Registrar devolución</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Indicá las unidades para generar la devolución</p>
                </div>
                <button onClick={closeModal} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {devolucionStep === 1 ? (
                <>
                  {/* Column headers */}
                  <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
                    <div className="grid grid-cols-[3fr_1fr_1.4fr] h-9 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center px-4 gap-3">
                        <button
                          onClick={handleSelectAll}
                          className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white"
                        >
                          {allSelected && <Check className="w-3 h-3 text-slate-800" />}
                          {indeterminate && <Minus className="w-3 h-3 text-slate-800" />}
                        </button>
                        <span>Producto</span>
                      </div>
                      <div className="flex items-center justify-center">Entregadas</div>
                      <div className="flex items-center justify-center">Devolver</div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="flex-1 overflow-y-auto bg-white">
                    {deliverableItems.length === 0 ? (
                      <div className="py-12 text-center">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No hay unidades entregadas para devolver</p>
                      </div>
                    ) : (
                      deliverableItems.map((item, idx) => {
                        const delivered = itemEntregaMap.get(item.sku) ?? 0
                        const display = getVentaItemDisplay(item)
                        const isSelected = !!devolucionSelectedItems[item.sku]
                        const qtyValue = devolucionQuantities[item.sku] ?? ""

                        return (
                          <div
                            key={idx}
                            className={`grid grid-cols-[3fr_1fr_1.4fr] items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? "bg-slate-50/70" : ""}`}
                            onClick={() => handleToggleItem(item.sku)}
                          >
                            {/* Product info */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleItem(item.sku) }}
                                className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white flex-shrink-0"
                              >
                                {isSelected && <Check className="w-3 h-3 text-slate-800" />}
                              </button>
                              <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                <Image src={getCategoryImage(display.categoria || "") || "/placeholder.svg"} alt={display.name} width={36} height={36} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{display.name}</p>
                                <p className="text-xs text-slate-400">{[display.marca, display.categoria].filter(Boolean).join(" · ")}</p>
                              </div>
                            </div>

                            {/* Entregadas */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-600 tabular-nums">{delivered}</span>
                            </div>

                            {/* Devolver input */}
                            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                              {isSelected && (
                                <input
                                  type="number"
                                  min={0}
                                  max={delivered}
                                  value={qtyValue}
                                  placeholder={String(delivered)}
                                  onChange={(e) => {
                                    const raw = e.target.value
                                    if (raw === "") { setDevolucionQuantities(prev => ({ ...prev, [item.sku]: "" })); return }
                                    const num = parseInt(raw, 10)
                                    if (isNaN(num) || num < 0) { setDevolucionQuantities(prev => ({ ...prev, [item.sku]: "0" })); return }
                                    if (num > delivered) { setDevolucionQuantities(prev => ({ ...prev, [item.sku]: String(delivered) })); return }
                                    setDevolucionQuantities(prev => ({ ...prev, [item.sku]: String(num) }))
                                  }}
                                  className="w-14 text-center text-sm tabular-nums bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-slate-400 transition-colors"
                                />
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Footer step 1 */}
                  <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
                    <span className="text-sm text-slate-500">
                      {selectedCount > 0
                        ? `${selectedCount} producto${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`
                        : "Seleccioná productos para devolver"}
                    </span>
                    <button
                      onClick={() => setDevolucionStep(2)}
                      disabled={selectedCount === 0 || totalDevUnits === 0}
                      className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continuar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2 — confirmation */}
                  <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                      <RotateCcw className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-base text-slate-700 text-center leading-relaxed">
                      <span className="font-semibold text-slate-900">{totalDevUnits} {totalDevUnits === 1 ? "unidad" : "unidades"}</span>
                      {" "}se registrar{totalDevUnits === 1 ? "á" : "án"} como devuelta{totalDevUnits !== 1 ? "s" : ""}, y se generará una devolución por{" "}
                      <span className="font-semibold text-red-600">${Math.round(totalDevAmount).toLocaleString("es-AR")}</span>
                    </p>
                    <ul className="w-full max-w-xs flex flex-col gap-1.5 mt-2">
                      {selectedEntries.filter(e => e.qty > 0).map(e => {
                        const display = getVentaItemDisplay(e.item)
                        return (
                          <li key={e.item.sku} className="flex items-center justify-between text-sm text-slate-600">
                            <span className="truncate">{display.name}</span>
                            <span className="tabular-nums ml-4 text-slate-500 shrink-0">{e.qty} ud.</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* Footer step 2 */}
                  <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-end gap-3 flex-shrink-0">
                    <button
                      onClick={() => setDevolucionStep(1)}
                      className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleConfirmDevolucion}
                      className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Aceptar
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )
      })()}

      {/* ── Finalizar Venta Modal ── */}
      {showFinalizarVenta && (() => {
        const pendingItems = ventaItems.filter(item => {
          const delivered = itemEntregaMap.get(item.sku) ?? 0
          return delivered < item.quantity
        })
        const hasPendingEntrega = pendingItems.length > 0
        const hasPendingCobro = montoRestante > 0

        const metodoOptions: { value: PaymentMethod | "no_especificado"; label: string }[] = [
          { value: "no_especificado", label: "No especificado" },
          { value: "efectivo", label: "Efectivo" },
          { value: "posnet", label: "Posnet" },
          { value: "transferencia", label: "Transferencia" },
        ]

        const closeModal = () => {
          setShowFinalizarVenta(false)
          setFinalizarMedioPago("no_especificado")
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Marcar como Finalizada</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Revisá los cambios que se aplicarán al confirmar</p>
                </div>
                <button onClick={closeModal} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex flex-col gap-4">

                {/* Summary items */}
                <div className="flex flex-col gap-2">
                  {/* Entrega */}
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasPendingEntrega ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${hasPendingEntrega ? "bg-amber-100" : "bg-emerald-100"}`}>
                      {hasPendingEntrega
                        ? <Package className="w-3.5 h-3.5 text-amber-600" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${hasPendingEntrega ? "text-amber-800" : "text-emerald-800"}`}>
                        {hasPendingEntrega ? "Entrega pendiente" : "Entrega completa"}
                      </p>
                      <p className={`text-xs mt-0.5 ${hasPendingEntrega ? "text-amber-700" : "text-emerald-700"}`}>
                        {hasPendingEntrega
                          ? `${pendingItems.length} producto${pendingItems.length !== 1 ? "s" : ""} sin entregar serán marcados como entregados`
                          : "Todos los productos ya fueron entregados"}
                      </p>
                    </div>
                  </div>

                  {/* Cobro */}
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasPendingCobro ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${hasPendingCobro ? "bg-amber-100" : "bg-emerald-100"}`}>
                      {hasPendingCobro
                        ? <Wallet className="w-3.5 h-3.5 text-amber-600" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${hasPendingCobro ? "text-amber-800" : "text-emerald-800"}`}>
                        {hasPendingCobro ? "Cobro pendiente" : "Cobro completo"}
                      </p>
                      <p className={`text-xs mt-0.5 ${hasPendingCobro ? "text-amber-700" : "text-emerald-700"}`}>
                        {hasPendingCobro
                          ? `Se registrará un cobro de $${Math.round(montoRestante).toLocaleString("es-AR")} para cubrir el saldo restante`
                          : "El total de la venta ya fue cobrado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medio de pago — only shown if there's a pending cobro */}
                {hasPendingCobro && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      Medio de pago del cobro
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {metodoOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFinalizarMedioPago(opt.value)}
                          className={`px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors ${
                            finalizarMedioPago === opt.value
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinalizar}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar y Finalizar
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ���─ Agregar Productos Modal ── */}
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
                onClick={handleConfirmAgregarProductos}
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
              {/* Fecha */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha</label>
                <input
                  type="date"
                  value={cobroFecha}
                  onChange={(e) => setCobroFecha(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                />
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
                onClick={handleConfirmCobro}
                disabled={!cobroMonto || Number(cobroMonto) <= 0}
                className="flex-1 py-2.5 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
