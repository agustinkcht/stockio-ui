"use client"

import { useState, useMemo, use, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import {
  ChevronDown,
  MoreVertical,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Wallet,
  Plus,
  Search,
  Check,
  Minus,
  X,
  Undo2,
  Pencil,
  RotateCcw,
  Copy,
  ShoppingCart,
  Filter,
  ArrowUpDown,
  FileDown,
} from "lucide-react"
import Image from "next/image"
import type {
  Compra,
  CompraItem,
  PaymentMethod,
  Item,
  ItemVariant,
  CompraRecepcionItem,
  CompraRecepcionEntry,
  CompraDevolucionItem,
  CompraDevolucionEntry,
  CompraPago,
} from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { PROVEEDORES } from "@/lib/data/proveedores"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { useCompras } from "@/hooks/use-compras"
import { useItems } from "@/hooks/use-items"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadComprasPDF } from "@/lib/utils/generate-compra-pdf"
import { ProveedorModal } from "@/components/compras/proveedor-modal"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"

const metodoPagoLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  posnet: "Posnet",
  transferencia: "Transferencia",
  no_especificado: "No especificado",
  anulacion: "Anulación",
}

// ── NotasCard ─────────────────────────────────────────────────────────────────
function NotasCard({
  value,
  readOnly,
  placeholder,
  onSave,
}: {
  value: string
  readOnly: boolean
  placeholder: string
  onSave: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const isDirty = draft !== value

  return (
    <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-2">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Notas</span>
      <textarea
        value={draft}
        onChange={(e) => !readOnly && setDraft(e.target.value)}
        placeholder={placeholder}
        rows={3}
        readOnly={readOnly}
        className="w-full resize-none text-sm text-slate-700 placeholder:text-slate-300 bg-transparent border-none outline-none leading-relaxed"
      />
      {!readOnly && isDirty && (
        <div className="flex items-center justify-end pt-1 border-t border-slate-100">
          <div className="flex items-center rounded-md overflow-hidden border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setDraft(value)}
              className="h-7 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors px-3 flex items-center border-r border-slate-200 bg-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="h-7 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors px-3 flex items-center"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Proveedor Selector Modal ──────────────────────────────────────────────────
function ProveedorSelectorInlineModal({
  currentProveedorId,
  onSelect,
  onClose,
}: {
  currentProveedorId: string | null
  onSelect: (id: string, nombre: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const filtered = PROVEEDORES.filter((p) => {
    const name = p.tipo === "empresa" ? (p.razonSocial ?? "") : `${p.nombre} ${p.apellido}`.trim()
    return name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  })
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden flex flex-col max-h-[70vh]">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Seleccionar proveedor</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proveedor..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="divide-y divide-slate-50">
            {filtered.map((p) => {
              const name = p.tipo === "empresa" ? (p.razonSocial ?? "") : `${p.nombre} ${p.apellido}`.trim()
              const initials = name.slice(0, 2).toUpperCase()
              const isSelected = p.id === currentProveedorId
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id, name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${isSelected ? "bg-slate-50" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    <p className="text-xs text-slate-400">{p.tipo === "empresa" ? "Empresa" : "Particular"} · {p.condicionIva}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Sin resultados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CompraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const {
    compras,
    isLoading: isLoadingCompras,
    updateCompra,
    addItemsToCompra,
    addPago,
    undoPago,
    updatePagoMedioPago,
    addRecepcion,
    undoRecepcionEntry,
    finalizarCompra,
    addDevolucion,
    cancelarCompra,
  } = useCompras()

  const compra = useMemo(() => compras.find((c) => c.id === id) || null, [compras, id])
  const { miNegocio } = useSettings()
  const { decreaseStock, increaseStock, updatePricing } = useItems()
  const handleDownloadPDF = () => compra && downloadComprasPDF([compra], miNegocio)

  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  const [showProveedorSelectorModal, setShowProveedorSelectorModal] = useState(false)
  const [showProveedorInfoModal, setShowProveedorInfoModal] = useState(false)
  const [viewingItem, setViewingItem] = useState<CompraItem | null>(null)
  const [showCancelarCompraModal, setShowCancelarCompraModal] = useState(false)
  const [cancelarDevolverUnidades, setCancelarDevolverUnidades] = useState(true)
  const [cancelarDevolverPagos, setCancelarDevolverPagos] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const [showSubtotalBreakdown, setShowSubtotalBreakdown] = useState(false)
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)
  const [showRegistrarPago, setShowRegistrarPago] = useState(false)
  const [showRegistrarRecepcion, setShowRegistrarRecepcion] = useState(false)
  const [showFinalizarCompra, setShowFinalizarCompra] = useState(false)

  // Devolucion modal
  const [showDevolucion, setShowDevolucion] = useState(false)
  const [devolucionStep, setDevolucionStep] = useState<1 | 2>(1)
  const [devolucionSelectedItems, setDevolucionSelectedItems] = useState<{ [sku: string]: boolean }>({})
  const [devolucionQuantities, setDevolucionQuantities] = useState<{ [sku: string]: string }>({})

  // View mode toggle
  const [viewMode, setViewMode] = useState<"productos" | "recepcion" | "devolucion">("productos")

  const [finalizarMedioPago, setFinalizarMedioPago] = useState<PaymentMethod | "no_especificado">("no_especificado")
  const [recepcionSelectedItems, setRecepcionSelectedItems] = useState<{ [sku: string]: boolean }>({})
  const [recepcionQuantities, setRecepcionQuantities] = useState<{ [sku: string]: string }>({})

  const [viewingRecepcionEntry, setViewingRecepcionEntry] = useState<CompraRecepcionEntry | null>(null)
  const [viewingReingresoEntry, setViewingReingresoEntry] = useState<CompraRecepcionEntry | null>(null)
  const [viewingDevolucionEntry, setViewingDevolucionEntry] = useState<CompraDevolucionEntry | null>(null)
  const [undoPagoTarget, setUndoPagoTarget] = useState<{ id: string; monto: number } | null>(null)
  const [undoRecepcionTarget, setUndoRecepcionTarget] = useState<CompraRecepcionEntry | null>(null)
  const [editarMedioPagoTarget, setEditarMedioPagoTarget] = useState<{ id: string; current: PaymentMethod } | null>(null)
  const [editarMedioPagoValue, setEditarMedioPagoValue] = useState<PaymentMethod>("efectivo")

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editItems, setEditItems] = useState<CompraItem[]>([])
  const [editAjustes, setEditAjustes] = useState<{ [idx: number]: { value: number; type: "percent" | "cash" } }>({})
  const [discountModalIdx, setDiscountModalIdx] = useState<number | null>(null)
  const [modalAjuste, setModalAjuste] = useState<{ value: number; type: "percent" | "cash" }>({ value: 0, type: "percent" })
  const [showModalDescuento, setShowModalDescuento] = useState(false)

  // Resumen adjustments
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" }>({ value: 0, type: "percent" })
  const [showEnvio, setShowEnvio] = useState(false)
  const [envioAmount, setEnvioAmount] = useState(0)
  const [customCharges, setCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])

  const [savedGlobalDiscount, setSavedGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" } | null>(null)
  const [savedEnvio, setSavedEnvio] = useState<number | null>(null)
  const [savedCustomCharges, setSavedCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])
  const [adjustmentsInitialized, setAdjustmentsInitialized] = useState(false)

  // Pago form
  const [pagoFecha, setPagoFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [pagoMedio, setPagoMedio] = useState<"efectivo" | "posnet" | "transferencia">("transferencia")
  const [pagoMonto, setPagoMonto] = useState("")

  // Add products modal
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalSearch, setModalSearch] = useState("")
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)

  const moreMenuRef = useRef<HTMLDivElement>(null)

  // ── Defensive aliases ──────────────────────────────────────────────────────
  const compraItems = compra?.items ?? []
  const compraPagos = compra?.pagos ?? []
  const compraRecepcionItems = compra?.recepcionItems ?? []
  const compraRecepcionEntries = compra?.recepcionEntries ?? []
  const compraDevolucionItems = compra?.devolucionItems ?? []
  const compraDevolucionEntries = compra?.devolucionEntries ?? []

  const itemDevolucionMap = useMemo(() => new Map(
    compraItems.map((item) => {
      const d = compraDevolucionItems.find((di) => di.sku === item.sku)
      return [item.sku, d?.quantityDevuelta ?? 0]
    })
  ), [compraItems, compraDevolucionItems])

  const totalDevueltas = useMemo(() => compraDevolucionItems.reduce((s, d) => s + d.quantityDevuelta, 0), [compraDevolucionItems])
  const montoTotalDevuelto = useMemo(() => compraDevolucionEntries.reduce((s, e) => s + e.montoDevuelto, 0), [compraDevolucionEntries])

  const montoPagado = useMemo(() => compraPagos.reduce((sum, p) => sum + p.monto, 0), [compraPagos])
  const montoRestante = useMemo(() => Math.max(0, (compra?.total ?? 0) - montoPagado), [compra, montoPagado])
  const pagoPct = useMemo(() => (compra?.total ?? 0) > 0 ? Math.min(100, Math.round((montoPagado / compra!.total) * 100)) : 0, [compra, montoPagado])

  const totalUnidades = useMemo(() => compraItems.reduce((s, it) => s + it.quantity, 0), [compraItems])
  const recepcionadasUnidades = useMemo(() => compraItems.reduce((s, item) => {
    const r = compraRecepcionItems.find((ri) => ri.sku === item.sku)
    return s + (r?.quantityRecepcionada ?? 0)
  }, 0), [compraItems, compraRecepcionItems])
  const recepcionPct = useMemo(() => totalUnidades > 0 ? Math.min(100, Math.round((recepcionadasUnidades / totalUnidades) * 100)) : 0, [recepcionadasUnidades, totalUnidades])

  const itemRecepcionMap = useMemo(() => new Map(
    compraItems.map((item) => {
      const r = compraRecepcionItems.find((ri) => ri.sku === item.sku)
      return [item.sku, r?.quantityRecepcionada ?? 0]
    })
  ), [compraItems, compraRecepcionItems])

  const savedGlobalDiscountAmount = savedGlobalDiscount
    ? savedGlobalDiscount.type === "percent"
      ? (compra?.subtotal ?? 0) * (savedGlobalDiscount.value / 100)
      : savedGlobalDiscount.value
    : 0

  // Edit subtotal
  const editSubtotal = useMemo(() => {
    return editItems.reduce((sum, item, idx) => {
      const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
      if (aj.value > 0) {
        if (aj.type === "percent") return sum + item.quantity * item.unitPrice * (1 - aj.value / 100)
        if (aj.type === "cash") return sum + item.quantity * Math.max(0, item.unitPrice - aj.value)
      }
      return sum + item.quantity * item.unitPrice
    }, 0)
  }, [editItems, editAjustes])

  const activeEditSubtotal = isEditMode ? editSubtotal : (compra?.subtotal ?? 0)
  const globalDiscountAmount = showGlobalDiscount
    ? globalDiscount.type === "percent"
      ? activeEditSubtotal * (globalDiscount.value / 100)
      : globalDiscount.value
    : 0
  const activeEditTotal = activeEditSubtotal - globalDiscountAmount + (showEnvio ? envioAmount : 0) + customCharges.reduce((s, c) => s + c.value, 0)

  // Modal items
  const allModalItems = INITIAL_ITEMS

  const uniqueModalCategorias = useMemo(() => {
    const cats = new Set<string>()
    allModalItems.forEach((item) => { if (item.categoria) cats.add(item.categoria) })
    return Array.from(cats).sort()
  }, [])

  const uniqueModalMarcas = useMemo(() => {
    const marcas = new Set<string>()
    allModalItems.forEach((item) => { if (item.marca) marcas.add(item.marca) })
    return Array.from(marcas).sort()
  }, [])

  const filteredModalItems = useMemo(() => {
    let items = [...allModalItems]
    if (modalSearch.trim()) {
      const words = modalSearch.toLowerCase().trim().split(/\s+/)
      items = items.filter((item) => {
        const text = [item.name, item.sku, item.marca, item.categoria, item.proveedor].filter(Boolean).join(" ").toLowerCase()
        return words.every((w) => text.includes(w))
      })
    }
    if (modalFilters.categoria) items = items.filter((i) => i.categoria === modalFilters.categoria)
    if (modalFilters.marca) items = items.filter((i) => i.marca === modalFilters.marca)
    const dir = modalSortDirection === "asc" ? 1 : -1
    items.sort((a, b) => {
      if (modalSort === "precio") return ((a.precio?.precioFinal || 0) - (b.precio?.precioFinal || 0)) * dir
      return a.name.localeCompare(b.name) * dir
    })
    return items
  }, [modalSearch, modalFilters, modalSort, modalSortDirection])

  const getModalItemId = (item: any): string => item.id || item.sku || item.name || ""

  const getAllModalSelectableIds = useMemo(() => {
    return filteredModalItems.flatMap((item) => {
      if (item.hasVariants && item.variants?.length) {
        return item.variants.map((v: any) => getModalItemId(v))
      }
      return [getModalItemId(item)]
    }).filter(Boolean)
  }, [filteredModalItems])

  const modalSelectAllActive = useMemo(() =>
    getAllModalSelectableIds.length > 0 && getAllModalSelectableIds.every((id) => selectedModalItems[id]),
    [getAllModalSelectableIds, selectedModalItems])

  const modalSelectAllIndeterminate = useMemo(() => {
    const some = getAllModalSelectableIds.some((id) => selectedModalItems[id])
    return some && !modalSelectAllActive
  }, [getAllModalSelectableIds, selectedModalItems, modalSelectAllActive])

  const selectedModalCount = useMemo(() =>
    Object.values(selectedModalItems).filter(Boolean).length,
    [selectedModalItems])

  // ── useEffects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!compra || adjustmentsInitialized) return
    setAdjustmentsInitialized(true)
    if (compra.descuento > 0) {
      setSavedGlobalDiscount({ value: compra.descuento, type: compra.descuentoTipo === "fixed" ? "cash" : "percent" })
    }
    if (compra.envio && compra.envio > 0) {
      setSavedEnvio(compra.envio)
    }
    if (compra.customCharges && compra.customCharges.length > 0) {
      setSavedCustomCharges(compra.customCharges)
    }
  }, [compra, adjustmentsInitialized])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreOptionsMenu(false)
      }
    }
    if (showMoreOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMoreOptionsMenu])

  // ── Edit mode ─────────────────────────────────────────────────────────────

  const enterEditMode = () => {
    setViewMode("productos")
    setDiscountModalIdx(null)
    setShowModalDescuento(false)
    setEditItems(compraItems.map((i) => ({ ...i })))
    setEditAjustes(
      Object.fromEntries(compraItems.map((item, idx) => [
        idx,
        item.discount > 0
          ? { value: item.discount, type: (item.discountType === "fixed" ? "cash" : item.discountType === "unit" ? "unit" : "percent") as "percent" | "cash" | "unit" }
          : { value: 0, type: "percent" as const },
      ]))
    )
    if (compra && compra.descuento > 0) {
      setShowGlobalDiscount(true)
      setGlobalDiscount({ value: compra.descuento, type: compra.descuentoTipo === "fixed" ? "cash" : "percent" })
    } else {
      setShowGlobalDiscount(false)
      setGlobalDiscount({ value: 0, type: "percent" })
    }
    if (compra && compra.envio && compra.envio > 0) {
      setShowEnvio(true)
      setEnvioAmount(compra.envio)
    } else {
      setShowEnvio(false)
      setEnvioAmount(0)
    }
    setCustomCharges(compra?.customCharges?.filter((c) => c.value > 0) ?? [])
    setIsEditMode(true)
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
    setEditItems([])
    setEditAjustes({})
    setDiscountModalIdx(null)
    setShowModalDescuento(false)
  }

  const doSave = async () => {
    if (!compra) return
    setIsSaving(true)
    try {
      const saved: CompraItem[] = editItems.map((item, idx) => {
        const aj = editAjustes[idx] ?? { value: 0, type: "percent" }
        const discountType: "percent" | "fixed" = aj.type === "percent" ? "percent" : "fixed"
        const total = (() => {
          if (aj.value === 0) return item.quantity * item.unitPrice
          if (aj.type === "unit") {
            const paidQty = Math.max(0, item.quantity - Math.min(aj.value, item.quantity))
            return paidQty * item.unitPrice
          }
          const adj = aj.type === "percent"
            ? item.unitPrice * (1 - aj.value / 100)
            : Math.max(0, item.unitPrice - aj.value)
          return item.quantity * adj
        })()
        return { ...item, discount: aj.value, discountType, total }
      })
      const newDescuento = showGlobalDiscount && globalDiscount.value > 0 ? globalDiscount.value : 0
      const newDescuentoTipo: "percent" | "fixed" = globalDiscount.type === "cash" ? "fixed" : "percent"
      const newEnvio = showEnvio && envioAmount > 0 ? envioAmount : 0
      const newCustomCharges = customCharges.filter((c) => c.value > 0)
      const newSubtotal = editSubtotal
      const newTotal = activeEditTotal

      updateCompra(compra.id, {
        items: saved,
        subtotal: newSubtotal,
        total: newTotal,
        descuento: newDescuento,
        descuentoTipo: newDescuentoTipo,
        envio: newEnvio,
        customCharges: newCustomCharges,
      })

      if (newDescuento > 0) setSavedGlobalDiscount({ ...globalDiscount })
      else setSavedGlobalDiscount(null)
      setSavedEnvio(newEnvio > 0 ? newEnvio : null)
      setSavedCustomCharges(newCustomCharges)

      cancelEditMode()
      setShowSaveSuccess(true)
      await new Promise((r) => setTimeout(r, 1500))
      setShowSaveSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleConfirmPago = () => {
    if (!compra) return
    const monto = Number(pagoMonto)
    if (!monto || monto <= 0) return
    addPago(compra.id, {
      fecha: pagoFecha,
      hora: new Date().toTimeString().slice(0, 5),
      medioPago: pagoMedio,
      monto,
    })
    setShowRegistrarPago(false)
    setPagoMonto("")
    setPagoMedio("transferencia")
  }

  const handleConfirmRecepcion = () => {
    if (!compra) return
    const recepciones: CompraRecepcionItem[] = []
    for (const item of compraItems) {
      if (!recepcionSelectedItems[item.sku]) continue
      const received = compraRecepcionItems.find((r) => r.sku === item.sku)?.quantityRecepcionada ?? 0
      const remaining = item.quantity - received
      const raw = recepcionQuantities[item.sku]
      const qty = raw === "" || raw === undefined ? remaining : Math.max(0, Math.min(remaining, parseInt(raw, 10) || 0))
      if (qty > 0) recepciones.push({ sku: item.sku, quantityRecepcionada: qty })
    }
    if (recepciones.length > 0) {
      addRecepcion(compra.id, recepciones)
      // Update stock for received units
      for (const r of recepciones) {
        if (r.quantityRecepcionada > 0) increaseStock(r.sku, r.quantityRecepcionada)
      }
    }
    setShowRegistrarRecepcion(false)
    setRecepcionSelectedItems({})
    setRecepcionQuantities({})
  }

  const handleConfirmFinalizar = () => {
    if (!compra) return
    const now = new Date()
    // Increase stock for all units not yet recepcionadas (finalizar receives everything)
    for (const item of compra.items) {
      const already = compra.recepcionItems.find(r => r.sku === item.sku)?.quantityRecepcionada ?? 0
      const remaining = item.quantity - already
      if (remaining > 0) increaseStock(item.sku, remaining)
    }
    finalizarCompra(
      compra.id,
      finalizarMedioPago,
      now.toISOString().slice(0, 10),
      now.toTimeString().slice(0, 5),
    )
    setShowFinalizarCompra(false)
    setFinalizarMedioPago("no_especificado")
  }

  const closeAgregarProductos = () => {
    setShowAgregarProductos(false)
    setModalSearch("")
    setSelectedModalItems({})
    setModalFilters({ categoria: "", marca: "" })
    setShowModalFilters(false)
  }

  const handleConfirmAgregarProductos = () => {
    if (!compra) return
    const newCompraItems: CompraItem[] = []

    for (const item of allModalItems) {
      const isParent = item.hasVariants && (item as Item).variants && (item as Item).variants!.length > 0

      if (isParent) {
        for (const variant of (item as Item).variants!) {
          const vid = (variant as ItemVariant).id || `${(item as Item).skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          if (!selectedModalItems[vid]) continue
          const sku = `${(item as Item).skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          const unitPrice = (variant as ItemVariant).precio?.costo || 0
          newCompraItems.push({
            sku,
            name: `${item.name}${(variant as ItemVariant).atributosPrincipales?.length ? " · " + (variant as ItemVariant).atributosPrincipales!.map((a) => a.value).join(" · ") : ""}`,
            quantity: 1,
            unitPrice,
            discount: 0,
            discountType: "percent",
            total: unitPrice,
            categoria: (variant as ItemVariant & { categoria?: string }).categoria || (item as Item).categoria,
          })
        }
      } else {
        const iid = (item as Item).id || (item as Item).sku || (item as Item).name
        if (!selectedModalItems[iid]) continue
        const sku = (item as Item).sku || iid
        const unitPrice = (item as Item).precio?.costo || 0
        newCompraItems.push({
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

    if (newCompraItems.length > 0) {
      if (isEditMode) {
        setEditItems((prev) => {
          const merged = [...prev]
          for (const ni of newCompraItems) {
            const existing = merged.findIndex((e) => e.sku === ni.sku)
            if (existing >= 0) {
              merged[existing] = { ...merged[existing], quantity: merged[existing].quantity + 1 }
            } else {
              merged.push(ni)
            }
          }
          return merged
        })
      } else {
        addItemsToCompra(compra.id, newCompraItems)
      }
    }
    closeAgregarProductos()
  }

  const getModalSelectionState = (item: any, isChild = false): { checked: boolean; indeterminate: boolean } => {
    const isParent = !isChild && item.hasVariants && item.variants?.length > 0
    if (isParent) {
      const childIds = item.variants.map((v: any) => getModalItemId(v)).filter(Boolean)
      const all = childIds.every((cid: string) => selectedModalItems[cid])
      const some = childIds.some((cid: string) => selectedModalItems[cid])
      return { checked: all, indeterminate: some && !all }
    }
    const mid = getModalItemId(item)
    return { checked: !!selectedModalItems[mid], indeterminate: false }
  }

  const handleModalItemSelection = (item: any, isChild = false) => {
    const isParent = !isChild && item.hasVariants && item.variants?.length > 0
    if (isParent) {
      const childIds = item.variants.map((v: any) => getModalItemId(v)).filter(Boolean)
      const allSel = childIds.every((cid: string) => selectedModalItems[cid])
      setSelectedModalItems((prev) => {
        const next = { ...prev }
        for (const cid of childIds) next[cid] = !allSel
        return next
      })
    } else {
      const mid = getModalItemId(item)
      if (mid) setSelectedModalItems((prev) => ({ ...prev, [mid]: !prev[mid] }))
    }
  }

  const handleSelectAllModal = () => {
    const shouldSelect = !modalSelectAllActive && !modalSelectAllIndeterminate
    const next: { [id: string]: boolean } = {}
    for (const sid of getAllModalSelectableIds) next[sid] = shouldSelect
    setSelectedModalItems(next)
  }

  // ── Early returns ─────────────────────────────────────────────────────────

  if (isLoadingCompras) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando compra...</p>
      </div>
    )
  }

  if (!compra) {
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
            <p className="text-slate-500 mb-1">Compra no encontrada</p>
            <p className="text-xs text-slate-400 mb-4">La compra {id} no existe</p>
            <button
              onClick={() => router.push("/compras/compras")}
              className="text-sm text-blue-600 hover:underline"
            >
              Volver a compras
            </button>
          </div>
        </div>
      </div>
    )
  }

  const estadoUI = compra.estado
  const proveedorNombre = compra.proveedorNombre

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Compras", href: "/compras/compras" },
    { label: compra.id },
  ]

  // ── JSX ───────────────────────────────────────────────────────────────────

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
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
              <div className="max-w-[1240px] mx-auto">
                <div className="grid grid-cols-3 gap-4 items-start">

                  {/* Left col-span-2 */}
                  <div className="col-span-2 flex flex-col gap-4">

                    {/* ── Compra Info card ── */}
                    {(() => {
                      const _MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
                      const fechaObj = new Date(compra.fecha + "T12:00:00")
                      const dia = fechaObj.getDate()
                      const mesCorto = _MONTHS[fechaObj.getMonth()]
                      const yearCompra = fechaObj.getFullYear()
                      const _currentYear = new Date().getFullYear()

                      return (
                        <div className="pt-8 px-0 pb-3 flex flex-col">

                          {/* Row 1: Compra ID · fecha · origen */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 shrink-0">
                                <span className="text-xl font-bold text-slate-900 leading-none uppercase tracking-wide">Compra</span>
                                <span className="text-base font-medium text-slate-400 leading-none tabular-nums">{compra.id}</span>
                              </div>
                              <span className="h-5 w-px bg-slate-300 shrink-0 mx-5 inline-block" />
                              <span className="text-sm font-medium text-slate-600 tabular-nums shrink-0">
                                {yearCompra < _currentYear ? `${dia} ${mesCorto} ${yearCompra}` : `${dia} ${mesCorto}`} · {compra.hora} hs
                              </span>
                              <span className="h-5 w-px bg-slate-300 shrink-0 mx-5 inline-block" />
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-medium text-slate-500">
                                  {compra.origen === "orden" ? "Creada desde orden de compra" : "Creada manualmente"}
                                </span>
                                {compra.origen === "orden" && compra.ordenId && (
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/compras/ordenes-de-compra/${compra.ordenId}`)}
                                    className="text-sm font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700 transition-colors"
                                  >
                                    Ver orden
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Proveedor pill + more options */}
                          <div className="flex items-center justify-between gap-3 mt-8">
                            {/* Proveedor pill */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditMode) setShowProveedorSelectorModal(true)
                                else setShowProveedorInfoModal(true)
                              }}
                              className={`inline-flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-2xl border bg-slate-50 shadow-sm transition-colors text-left ${isEditMode ? "hover:bg-slate-100 cursor-pointer border-slate-200" : "hover:bg-slate-100 cursor-pointer border-slate-200/60"}`}
                            >
                              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-white leading-none">{proveedorNombre.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-1">Proveedor</span>
                                <span className="text-sm font-bold text-slate-900 truncate max-w-[220px]">{proveedorNombre}</span>
                              </div>
                              {isEditMode && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />}
                            </button>

                            {/* Edit controls + more options */}
                            <div className="flex items-center gap-2 shrink-0">
                              {estadoUI === "en_curso" && !isEditMode && (
                                <button
                                  type="button"
                                  onClick={enterEditMode}
                                  className="h-8 text-xs transition-colors bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer gap-1.5 px-3 rounded-md flex items-center text-slate-600 font-medium shadow-sm"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                  Editar
                                </button>
                              )}
                              {estadoUI === "en_curso" && isEditMode && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center rounded-md overflow-hidden border border-slate-200 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={cancelEditMode}
                                      className="h-8 text-xs transition-colors bg-white hover:bg-slate-50 cursor-pointer px-3 flex items-center text-slate-600 font-medium border-r border-slate-200"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={doSave}
                                      disabled={isSaving}
                                      className="h-8 text-xs transition-colors bg-slate-900 hover:bg-slate-800 cursor-pointer px-3 flex items-center text-white font-medium disabled:opacity-50"
                                    >
                                      {isSaving ? "Guardando..." : "Guardar cambios"}
                                    </button>
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={handleDownloadPDF}
                                className="h-8 text-xs transition-colors bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer gap-1.5 px-3 rounded-md flex items-center text-slate-700 font-medium shadow-sm"
                              >
                                <FileDown className="w-3.5 h-3.5 text-slate-500" />
                                Descargar PDF
                              </button>
                              <div className="relative" ref={moreMenuRef}>
                                <button
                                  onClick={() => setShowMoreOptionsMenu(!showMoreOptionsMenu)}
                                  className="h-8 w-8 flex items-center justify-center transition-colors bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer rounded-md shadow-sm"
                                >
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                </button>
                                {showMoreOptionsMenu && (
                                  <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                                    <button
                                      onClick={() => { setShowMoreOptionsMenu(false); router.push(`/compras/compras/nueva?duplicar=${compra.id}`) }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                    >
                                      <Copy className="w-4 h-4 text-slate-400" />
                                      Duplicar compra
                                    </button>
                                    {estadoUI !== "cancelada" && (
                                      <button
                                        onClick={() => { setShowMoreOptionsMenu(false); setShowCancelarCompraModal(true) }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                      >
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        Cancelar compra
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Estado widget + action widget */}
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            {/* Estado widget */}
                            {estadoUI === "finalizada" && (
                              <div className="bg-emerald-50 border border-emerald-200/60 rounded-lg shadow-sm px-5 py-4 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span className="text-lg font-bold text-emerald-700">Finalizada</span>
                              </div>
                            )}
                            {estadoUI === "en_curso" && (
                              <div className="bg-amber-50 border border-amber-200/60 rounded-lg shadow-sm px-5 py-4 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                                <span className="text-lg font-bold text-amber-700">En Curso</span>
                              </div>
                            )}
                            {estadoUI === "cancelada" && (
                              <div className="bg-red-50 border border-red-200/60 rounded-lg shadow-sm px-5 py-4 flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                                <span className="text-lg font-bold text-red-600">Cancelada</span>
                              </div>
                            )}

                            {/* Action widget */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm px-4 py-4 flex items-center justify-center">
                              {estadoUI === "finalizada" && (
                                <button
                                  type="button"
                                  onClick={() => !isEditMode && (setShowDevolucion(true), setDevolucionStep(1))}
                                  disabled={isEditMode}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group ${isEditMode ? "opacity-40 cursor-not-allowed" : "hover:bg-white cursor-pointer"}`}
                                >
                                  <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-slate-700 shrink-0" />
                                  <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">Gestionar devoluciones</span>
                                </button>
                              )}
                              {estadoUI === "en_curso" && (
                                <button
                                  type="button"
                                  onClick={() => !isEditMode && setShowFinalizarCompra(true)}
                                  disabled={isEditMode}
                                  className={`flex items-center gap-2.5 px-4 py-2 rounded-lg transition-colors group ${isEditMode ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"}`}
                                >
                                  <CheckCircle2 className="w-5 h-5 text-slate-700 group-hover:text-slate-900 shrink-0" />
                                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Marcar como finalizada</span>
                                </button>
                              )}
                              {estadoUI === "cancelada" && (
                                <span className="text-sm text-slate-400">Esta compra fue cancelada</span>
                              )}
                            </div>
                          </div>

                        </div>
                      )
                    })()}

                    {/* ── Recepcion + Pago widgets — only shown when en_curso ── */}
                    {estadoUI === "en_curso" && (
                      <div className="grid grid-cols-2 gap-3">

                        {/* Widget 1 — Recepción */}
                        <div className={`bg-white border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-2 ${recepcionPct === 100 ? "items-center justify-center" : ""}`}>
                          {recepcionPct === 100 ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-slate-800" />
                              <span className="text-base font-semibold text-slate-900">Recepcionada</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-400" />
                                <span className="text-base font-semibold text-slate-700">Recepción {recepcionPct}%</span>
                              </div>
                              <span className="text-sm text-slate-400 tabular-nums">
                                {totalUnidades - recepcionadasUnidades} {totalUnidades - recepcionadasUnidades === 1 ? "unidad pendiente" : "unidades pendientes"} de recepción
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowRegistrarRecepcion(true)}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Registrar recepción
                              </button>
                            </>
                          )}
                        </div>

                        {/* Widget 2 — Pago */}
                        <div className={`bg-white border border-slate-200/60 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-2 ${pagoPct === 100 ? "items-center justify-center" : ""}`}>
                          {pagoPct === 100 ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-slate-800" />
                              <span className="text-base font-semibold text-slate-900">Pagada</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-slate-400" />
                                <span className="text-base font-semibold text-slate-700">Pago {pagoPct}%</span>
                              </div>
                              <span className="text-sm text-slate-400 tabular-nums">
                                ${Math.round(montoRestante).toLocaleString("es-AR")} pendiente de pago
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowRegistrarPago(true)}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Registrar pago
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    )}

                    {/* ── Items card ── */}
                    <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">

                      {/* Title strip — toggle buttons */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewMode("productos")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "productos" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          Productos
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("recepcion")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "recepcion" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Recepción
                        </button>
                        {compraDevolucionEntries.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setViewMode("devolucion")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "devolucion" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Devolución
                          </button>
                        )}
                      </div>

                      {/* Grid title */}
                      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                        {viewMode === "recepcion" ? (
                          <>
                            <Truck className="w-4 h-4 text-slate-600" />
                            <span className="text-base font-bold text-slate-900 tabular-nums">
                              {recepcionadasUnidades}/{totalUnidades} {totalUnidades === 1 ? "unidad recepcionada" : "unidades recepcionadas"}
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
                              {compraItems.length} {compraItems.length === 1 ? "producto" : "productos"} · {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Recepcion activity log */}
                      {viewMode === "recepcion" && (
                        <div className="px-4 pb-2 flex flex-col">
                          {compraRecepcionEntries.length === 0 ? (
                            <p className="text-xs text-slate-400 py-1">Sin recepciones registradas</p>
                          ) : (
                            (() => {
                              const anulatedEntryIds = new Set(
                                compraRecepcionEntries
                                  .filter((e) => !!e.anulacion && e.originalRecepcionId)
                                  .map((e) => e.originalRecepcionId as string)
                              )
                              return compraRecepcionEntries.map((entry) => {
                                const isAnulacion = !!entry.anulacion
                                const alreadyAnulado = !isAnulacion && anulatedEntryIds.has(entry.id)
                                const totalEntryUnits = isAnulacion
                                  ? (entry.anulacionTotal ?? Math.abs(entry.items.reduce((s, i) => s + i.quantity, 0)))
                                  : entry.items.reduce((s, i) => s + i.quantity, 0)
                                const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
                                return (
                                  <div key={entry.id} className="flex items-center group border-b border-slate-100 last:border-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isAnulacion) setViewingReingresoEntry(entry)
                                        else setViewingRecepcionEntry(entry)
                                      }}
                                      className="flex-1 flex items-center gap-2 py-1.5 -ml-4 pl-4 pr-2 transition-colors text-left hover:bg-slate-50/60"
                                    >
                                      <span className="text-xs text-slate-400 tabular-nums">{dateLabel}</span>
                                      <span className="text-xs text-slate-300">·</span>
                                      {isAnulacion ? (
                                        <span className="text-xs text-red-400 tabular-nums">
                                          {totalEntryUnits} {totalEntryUnits === 1 ? "unidad" : "unidades"} con recepción anulada
                                        </span>
                                      ) : (
                                        <span className="text-xs text-slate-400 tabular-nums">{totalEntryUnits} {totalEntryUnits === 1 ? "unidad" : "unidades"} recepcionadas</span>
                                      )}
                                    </button>
                                    {!isAnulacion && !alreadyAnulado && estadoUI === "en_curso" && (
                                      <button
                                        type="button"
                                        onClick={() => setUndoRecepcionTarget(entry)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 pr-0"
                                        title="Anular recepción"
                                      >
                                        <Undo2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )
                              })
                            })()
                          )}
                        </div>
                      )}

                      {/* Devolucion activity log */}
                      {viewMode === "devolucion" && (
                        <div className="px-4 pb-2 flex flex-col">
                          {compraDevolucionEntries.length === 0 ? (
                            <p className="text-xs text-slate-400 py-1">Sin devoluciones registradas</p>
                          ) : (
                            [...compraDevolucionEntries].filter((e) => e.items.length > 0).map((entry) => {
                              const totalEntryUnits = entry.items.reduce((s, i) => s + i.quantity, 0)
                              const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
                              return (
                                <div key={entry.id} className="flex items-center border-b border-slate-100 last:border-0">
                                  <button
                                    type="button"
                                    onClick={() => setViewingDevolucionEntry(entry)}
                                    className="flex-1 flex items-center gap-2 py-1.5 -ml-4 pl-4 pr-2 transition-colors text-left hover:bg-slate-50/60"
                                  >
                                    <span className="text-xs text-slate-400 tabular-nums">{dateLabel}</span>
                                    <span className="text-xs text-slate-300">·</span>
                                    <span className="text-xs text-red-400 tabular-nums">
                                      {totalEntryUnits} {totalEntryUnits === 1 ? "unidad devuelta" : "unidades devueltas"} al proveedor
                                    </span>
                                  </button>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}

                      {/* Items grid */}
                      <div className="px-3 pb-3">
                        <div className="rounded-md border border-slate-200/80 overflow-hidden">

                          {/* Edit mode column headers */}
                          {isEditMode && viewMode === "productos" && (
                            <div className="grid grid-cols-[2fr_0.8fr_1fr_auto] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                              <div className="flex items-center px-4">Item</div>
                              <div className="flex items-center justify-center">Cantidad</div>
                              <div className="flex items-center justify-center">Precio</div>
                              <div className="w-10" />
                            </div>
                          )}

                          {compraItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                              <Package className="w-12 h-12 text-slate-200 mb-3" />
                              <p className="text-slate-500 mb-1">Sin items</p>
                              <p className="text-xs text-slate-400">Esta compra no tiene items asociados</p>
                            </div>
                          ) : (
                            (isEditMode ? editItems : compraItems).map((item, idx) => {
                              const display = getVentaItemDisplay(item as any)
                              const baseGross = item.unitPrice * item.quantity
                              const discountAmount =
                                item.discountType === "percent"
                                  ? baseGross * (item.discount / 100)
                                  : item.discountType === "unit"
                                    ? 0 // unit bonificada: price per unit stays same, just fewer paid units
                                    : item.discount * item.quantity
                              const adjustedUnitPrice = Math.max(0, item.unitPrice - (discountAmount / Math.max(item.quantity, 1)))
                              const received = itemRecepcionMap.get(item.sku) ?? 0
                              const itemPct = item.quantity === 0 ? 0 : Math.round((received / item.quantity) * 100)

                              return (
                                <div
                                  key={isEditMode ? `edit-${item.sku}-${idx}` : `${compra.id}-item-${idx}`}
                                  className={`border-b border-slate-100 last:border-b-0 transition-colors`}
                                >
                                  {viewMode === "recepcion" ? (
                                    <div className="flex items-center h-[56px] gap-3 px-4">
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
                                      <div className="flex items-center gap-2 shrink-0 pr-2">
                                        {itemPct === 100 ? (
                                          <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-sm font-medium text-emerald-700 tabular-nums">{item.quantity}/{item.quantity}</span>
                                            <span className="text-xs text-slate-400">recepcionadas</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-sm font-semibold tabular-nums ${received > 0 ? "text-amber-600" : "text-slate-400"}`}>{received}/{item.quantity}</span>
                                            <span className="text-xs text-slate-400">recepcionadas</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : viewMode === "devolucion" ? (
                                    (() => {
                                      const devuelta = itemDevolucionMap.get(item.sku) ?? 0
                                      return (
                                        <div className="flex items-center h-[56px] gap-3 px-4">
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
                                    (() => {
                                      const editItem = editItems[idx] ?? item
                                      const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                                      const hasDiscount = aj.value > 0
                                      let adjUnitPrice = editItem.unitPrice
                                      if (hasDiscount) {
                                        if (aj.type === "percent") adjUnitPrice = editItem.unitPrice * (1 - aj.value / 100)
                                        else if (aj.type === "cash") adjUnitPrice = Math.max(0, editItem.unitPrice - aj.value)
                                      }
                                      return (
                                        <div className="grid grid-cols-[2fr_0.8fr_1fr_auto] min-h-[72px]">
                                          <div className="flex items-center gap-3 px-4 py-3">
                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                              <Image src={getCategoryImage(display.categoria || "") || "/placeholder.svg"} alt={item.name} width={32} height={32} className="object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5 flex-wrap">
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
                                          <div className="flex items-center justify-center">
                                            <div className="flex items-center border border-slate-200 rounded-full px-1 py-0.5 bg-white">
                                              <button onClick={() => setEditItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))} className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors">
                                                <Minus className="w-3 h-3" />
                                              </button>
                                              <input
                                                type="number"
                                                value={editItem.quantity || ""}
                                                onChange={(e) => setEditItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                                                className="w-10 text-center text-sm py-1 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                              <button onClick={() => setEditItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))} className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors">
                                                <Plus className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1">
                                            <div className="flex items-center gap-1.5">
                                              <div className="flex flex-col items-end">
                                                {hasDiscount && (
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-[11px] text-slate-400 line-through tabular-nums">${Math.round(editItem.unitPrice).toLocaleString("es-AR")}</span>
                                                    <span className="text-[10px] text-red-500 font-medium">{aj.type === "percent" ? `-${aj.value}%` : `-$${aj.value.toLocaleString("es-AR")}`}</span>
                                                  </div>
                                                )}
                                                <span className="text-sm font-medium text-slate-900 tabular-nums">
                                                  ${Math.round(hasDiscount ? adjUnitPrice : editItem.unitPrice).toLocaleString("es-AR")}
                                                </span>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setDiscountModalIdx(idx)
                                                  setModalAjuste(hasDiscount ? { ...aj } : { value: 0, type: "percent" })
                                                  setShowModalDescuento(hasDiscount)
                                                }}
                                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                              >
                                                <Pencil className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-center w-10">
                                            <button
                                              onClick={() => {
                                                setEditItems((prev) => prev.filter((_, i) => i !== idx))
                                                setEditAjustes((prev) => {
                                                  const next: typeof prev = {}
                                                  Object.entries(prev).forEach(([k, v]) => {
                                                    const ki = parseInt(k)
                                                    if (ki < idx) next[ki] = v
                                                    else if (ki > idx) next[ki - 1] = v
                                                  })
                                                  return next
                                                })
                                              }}
                                              className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      )
                                    })()
                                  ) : (
                                    <div
                                      className="grid grid-cols-[50%_25%_25%] min-h-[56px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                                      onClick={() => setViewingItem(item)}
                                    >
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
                                      <div className="flex items-center justify-center gap-1.5">
                                        <span className="text-sm text-slate-700 tabular-nums">{item.quantity}</span>
                                        <span className="text-xs text-slate-400">{item.quantity === 1 ? "unidad" : "unidades"}</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center gap-0.5 py-2">
                                        {item.discount > 0 && item.discountType === "unit" ? (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] font-semibold text-red-500 whitespace-nowrap">
                                              {item.discount} {item.discount === 1 ? "unidad" : "unidades"} bonificada{item.discount === 1 ? "" : "s"}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                              <span className="text-sm text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                              <span className="text-xs text-slate-400">c/u</span>
                                            </div>
                                          </div>
                                        ) : item.discount > 0 && (item.discountType === "percent" || item.discountType === "fixed") ? (
                                          <>
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-slate-400 line-through tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                              <span className="text-[10px] font-semibold text-red-500">
                                                {item.discountType === "percent" ? `-${item.discount}%` : `-$${item.discount.toLocaleString("es-AR")}`}
                                              </span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                              <span className="text-sm font-medium text-slate-800 tabular-nums">${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}</span>
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

                        </div>
                      </div>
                    </div>

                    {/* ── Notas card ── */}
                    <NotasCard
                      value={compra.observaciones ?? ""}
                      readOnly={false}
                      placeholder="Agregar una nota sobre esta compra..."
                      onSave={(v) => updateCompra(compra.id, { observaciones: v })}
                    />

                  </div>{/* end col-span-2 */}

                  {/* Right col-span-1 */}
                  {compraItems.length > 0 && (
                    <div className="col-span-1 flex flex-col gap-4">

                      {/* Resumen card */}
                      <div className="bg-white rounded-lg shadow-sm">
                        <div className="px-5 py-5 flex flex-col gap-0">

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
                            <span className="text-sm text-slate-700 tabular-nums mr-1.5">${Math.round(activeEditSubtotal).toLocaleString("es-AR")}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSubtotalBreakdown ? "rotate-180" : ""}`} />
                          </button>
                          {showSubtotalBreakdown && (
                            <div>
                              {(isEditMode ? editItems : compraItems).map((item, idx) => {
                                const display = getVentaItemDisplay(item as any)
                                let lineTotal: number
                                if (isEditMode) {
                                  const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                                  if (aj.value > 0) {
                                    if (aj.type === "unit") lineTotal = Math.max(0, item.quantity - Math.min(aj.value, item.quantity)) * item.unitPrice
                                    else if (aj.type === "percent") lineTotal = item.quantity * item.unitPrice * (1 - aj.value / 100)
                                    else lineTotal = item.quantity * Math.max(0, item.unitPrice - aj.value)
                                  } else {
                                    lineTotal = item.quantity * item.unitPrice
                                  }
                                } else {
                                  lineTotal = item.discountType === "percent"
                                    ? Math.round(item.quantity * item.unitPrice * (1 - item.discount / 100))
                                    : item.discountType === "unit"
                                      ? Math.round(Math.max(0, item.quantity - Math.min(item.discount, item.quantity)) * item.unitPrice)
                                      : Math.round(item.quantity * Math.max(0, item.unitPrice - item.discount))
                                }
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
                                    <p className="text-xs font-medium text-slate-700 tabular-nums shrink-0">${Math.round(lineTotal).toLocaleString("es-AR")}</p>
                                  </div>
                                )
                              })}
                              <hr className="-mx-5 w-[calc(100%+2.5rem)] border-t border-slate-100 border-0" />
                            </div>
                          )}

                          {/* Edit mode adjustments */}
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
                                  onChange={(e) => setGlobalDiscount((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                  className="w-16 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="flex border border-slate-200 rounded overflow-hidden">
                                  <button onClick={() => setGlobalDiscount((prev) => ({ ...prev, type: "cash" }))} className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "cash" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>$</button>
                                  <button onClick={() => setGlobalDiscount((prev) => ({ ...prev, type: "percent" }))} className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "percent" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>%</button>
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
                          {isEditMode && customCharges.map((charge, cidx) => (
                            <div key={charge.id} className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-1">
                                <button onClick={() => setCustomCharges((prev) => prev.filter((_, i) => i !== cidx))} className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                                <input
                                  type="text"
                                  value={charge.label}
                                  onChange={(e) => setCustomCharges((prev) => prev.map((c, i) => i === cidx ? { ...c, label: e.target.value } : c))}
                                  className="text-sm text-slate-500 bg-transparent border-none outline-none w-24"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-slate-400">$</span>
                                <input
                                  type="number"
                                  value={charge.value || ""}
                                  onChange={(e) => setCustomCharges((prev) => prev.map((c, i) => i === cidx ? { ...c, value: parseFloat(e.target.value) || 0 } : c))}
                                  className="w-20 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </div>
                          ))}

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

                          {/* View mode saved adjustments */}
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
                          {!isEditMode && ((savedGlobalDiscount != null && savedGlobalDiscount.value > 0) || (savedEnvio != null && savedEnvio > 0) || savedCustomCharges.length > 0) && (
                            <hr className="-mx-5 w-[calc(100%+2.5rem)] border-t border-slate-100 border-0" />
                          )}

                          {/* Total */}
                          <div className="flex justify-between items-center py-3 mt-1">
                            <span className="text-base font-bold text-slate-900">Total</span>
                            <span className="text-base font-bold text-slate-900 tabular-nums">
                              ${Math.round(isEditMode ? activeEditTotal : compra.total).toLocaleString("es-AR")}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Detalle del Pago card */}
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="px-5 py-5 flex flex-col gap-0">
                          <p className="text-sm font-semibold text-slate-800 mb-3">Detalle del Pago</p>

                          {compraPagos.length > 0 ? (
                            compraPagos.map((pago) => {
                              const isAnulacion = pago.medioPago === "anulacion"
                              const isNegative = pago.monto < 0
                              const isEditable = !isAnulacion && !isNegative
                              return (
                                <div key={pago.id} className="flex items-center py-2.5 border-b border-slate-100 gap-2 group">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-xs tabular-nums text-slate-400">
                                      {new Date(pago.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                                    </span>
                                    <span className="text-xs text-slate-300">·</span>
                                    {isAnulacion ? (
                                      <span className="text-xs text-red-400">Anulación de pago</span>
                                    ) : isNegative ? (
                                      <span className="text-xs text-emerald-500 font-medium">Reintegro de dinero</span>
                                    ) : (
                                      <span className="flex items-center gap-1 group/mp cursor-default">
                                        <span className="text-xs text-slate-500">{metodoPagoLabels[pago.medioPago as PaymentMethod] ?? pago.medioPago}</span>
                                        {isEditable && (
                                          <button
                                            type="button"
                                            onClick={() => { setEditarMedioPagoTarget({ id: pago.id, current: pago.medioPago }); setEditarMedioPagoValue(pago.medioPago) }}
                                            className="opacity-0 group-hover/mp:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500"
                                            title="Editar medio de pago"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-sm font-semibold tabular-nums ${isAnulacion ? "text-red-500" : isNegative ? "text-emerald-600" : "text-slate-900"}`}>
                                    {isAnulacion ? `−$${Math.abs(pago.monto).toLocaleString("es-AR")}` : isNegative ? `+$${Math.abs(pago.monto).toLocaleString("es-AR")}` : `$${pago.monto.toLocaleString("es-AR")}`}
                                  </span>
                                  {!isAnulacion && !isNegative && estadoUI === "en_curso" && (
                                    <button
                                      type="button"
                                      onClick={() => setUndoPagoTarget({ id: pago.id, monto: pago.monto })}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                      title="Anular pago"
                                    >
                                      <Undo2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <span className="text-xs text-slate-400">Sin pagos registrados</span>
                            </div>
                          )}
                          {montoPagado > (compra.total ?? 0) + 0.01 && (
                            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
                              <span className="text-xs text-slate-500">Saldo a favor proveedor</span>
                              <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                                ${Math.round(montoPagado - (compra.total ?? 0)).toLocaleString("es-AR")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── Proveedor Selector Modal ── */}
      {showProveedorSelectorModal && (
        <ProveedorSelectorInlineModal
          currentProveedorId={compra.proveedorId}
          onSelect={(pid, nombre) => {
            updateCompra(compra.id, { proveedorId: pid, proveedorNombre: nombre })
            setShowProveedorSelectorModal(false)
          }}
          onClose={() => setShowProveedorSelectorModal(false)}
        />
      )}

      {/* ── Cancelar Compra Modal ── */}
      {showCancelarCompraModal && (() => {
        const totalRecepcionadas = compra.recepcionItems.reduce((s, ri) => s + ri.quantityRecepcionada, 0)
        const totalPagado = compra.pagos.reduce((s, p) => s + Math.max(0, p.monto), 0)
        const hasRecepciones = totalRecepcionadas > 0
        const hasPagos = totalPagado > 0
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelarCompraModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Cancelar compra</h3>
                </div>
                <p className="text-sm text-slate-500 mt-2 ml-12">
                  Vas a cancelar la compra <span className="font-semibold text-slate-800">{compra.id}</span>. Esta acción es irreversible.
                </p>
              </div>
              {(hasRecepciones || hasPagos) && (
                <div className="px-5 py-4 flex flex-col gap-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">¿Qué hacer con los registros existentes?</p>
                  {hasRecepciones && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{totalRecepcionadas} {totalRecepcionadas === 1 ? "unidad recepcionada" : "unidades recepcionadas"}</p>
                        <p className="text-xs text-slate-400">Unidades ya recibidas en stock</p>
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
                  {hasPagos && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">${totalPagado.toLocaleString("es-AR")} pagados</p>
                        <p className="text-xs text-slate-400">Pagos ya registrados</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => setCancelarDevolverPagos(true)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cancelarDevolverPagos ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          Devolver
                        </button>
                        <button
                          onClick={() => setCancelarDevolverPagos(false)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!cancelarDevolverPagos ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          No hacer nada
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="px-5 py-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowCancelarCompraModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Salir
                </button>
                <button
                  onClick={() => {
                    cancelarCompra(compra.id, {
                      devolverUnidades: hasRecepciones ? cancelarDevolverUnidades : false,
                      devolverPagos: hasPagos ? cancelarDevolverPagos : false,
                    })
                    setShowCancelarCompraModal(false)
                    setCancelarDevolverUnidades(true)
                    setCancelarDevolverPagos(true)
                    if (isEditMode) cancelEditMode()
                  }}
                  className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancelar compra
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Editar Medio de Pago Modal ── */}
      {editarMedioPagoTarget && (
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
                  className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors text-left ${editarMedioPagoValue === m ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
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
                  updatePagoMedioPago(compra.id, editarMedioPagoTarget.id, editarMedioPagoValue)
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

      {/* ── Undo Pago Modal ── */}
      {undoPagoTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUndoPagoTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Undo2 className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Anular pago</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"¿Estás seguro? "}
                <span className="font-semibold text-slate-900">${undoPagoTarget.monto.toLocaleString("es-AR")}</span>
                {" van a volver a estar pendientes de pago."}
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setUndoPagoTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { undoPago(compra.id, undoPagoTarget.id); setUndoPagoTarget(null) }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Undo Recepcion Modal ── */}
      {undoRecepcionTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUndoRecepcionTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Undo2 className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Anular recepción</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"¿Estás seguro? "}
                <span className="font-semibold text-slate-900">
                  {undoRecepcionTarget.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                  {undoRecepcionTarget.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "unidad va" : "unidades van"}
                </span>
                {" a volver a estar pendientes de recepción."}
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setUndoRecepcionTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { undoRecepcionEntry(compra.id, undoRecepcionTarget.id); setUndoRecepcionTarget(null) }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recepcion Entry Detail Modal ── */}
      {viewingRecepcionEntry && (() => {
        const entry = viewingRecepcionEntry
        const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
        const totalUnits = entry.items.reduce((s, i) => s + i.quantity, 0)
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingRecepcionEntry(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Detalle de recepción</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{dateLabel}</p>
                </div>
                <button onClick={() => setViewingRecepcionEntry(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto max-h-80">
                {entry.items.map((ei, idx) => {
                  const compraItem = compraItems.find((it) => it.sku === ei.sku)
                  const display = compraItem ? getVentaItemDisplay(compraItem as any) : null
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
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">{totalUnits} {totalUnits === 1 ? "unidad recepcionada" : "unidades recepcionadas"}</span>
                <button onClick={() => setViewingRecepcionEntry(null)} className="px-4 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Reingreso Entry Detail Modal ── */}
      {viewingReingresoEntry && (() => {
        const entry = viewingReingresoEntry
        const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
        const totalUnits = entry.items.reduce((s, i) => s + Math.abs(i.quantity), 0)
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingReingresoEntry(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Detalle de anulación de recepción</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{dateLabel}</p>
                </div>
                <button onClick={() => setViewingReingresoEntry(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto max-h-80">
                {entry.items.map((ei, idx) => {
                  const qty = Math.abs(ei.quantity)
                  const compraItem = compraItems.find((it) => it.sku === ei.sku)
                  const display = compraItem ? getVentaItemDisplay(compraItem as any) : null
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
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">{qty}</span>
                        <span className="text-xs text-slate-400">{qty === 1 ? "unidad" : "unidades"}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">{totalUnits} {totalUnits === 1 ? "unidad devuelta al stock" : "unidades devueltas al stock"}</span>
                <button onClick={() => setViewingReingresoEntry(null)} className="px-4 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Devolucion Entry Detail Modal ── */}
      {viewingDevolucionEntry && (() => {
        const entry = viewingDevolucionEntry
        const dateLabel = new Date(entry.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
        const totalUnits = entry.items.reduce((s, i) => s + i.quantity, 0)
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingDevolucionEntry(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Detalle de devolución</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{dateLabel}</p>
                </div>
                <button onClick={() => setViewingDevolucionEntry(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto max-h-72">
                {entry.items.map((ei, idx) => {
                  const compraItem = compraItems.find((it) => it.sku === ei.sku)
                  const display = compraItem ? getVentaItemDisplay(compraItem as any) : null
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
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-500">{totalUnits} {totalUnits === 1 ? "unidad devuelta" : "unidades devueltas"}</span>
                  {entry.montoDevuelto > 0 && (
                    <span className="text-xs text-slate-400">Monto recuperado: <span className="font-medium text-slate-700">${entry.montoDevuelto.toLocaleString("es-AR")}</span></span>
                  )}
                </div>
                <button onClick={() => setViewingDevolucionEntry(null)} className="px-4 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Registrar Recepción Modal ── */}
      {showRegistrarRecepcion && (() => {
        const pendingItems = compraItems.filter((item) => {
          const received = itemRecepcionMap.get(item.sku) ?? 0
          return received < item.quantity
        })
        const pendingSkus = pendingItems.map((i) => i.sku)
        const allSel = pendingSkus.length > 0 && pendingSkus.every((sku) => recepcionSelectedItems[sku])
        const someSel = pendingSkus.some((sku) => recepcionSelectedItems[sku])
        const indet = someSel && !allSel
        const selectedCount = pendingSkus.filter((sku) => recepcionSelectedItems[sku]).length

        const handleSelectAll = () => {
          const selecting = !allSel && !indet
          const nextSel: { [sku: string]: boolean } = {}
          const nextQty: { [sku: string]: string } = { ...recepcionQuantities }
          for (const item of pendingItems) {
            nextSel[item.sku] = selecting
            if (selecting) {
              const received = itemRecepcionMap.get(item.sku) ?? 0
              nextQty[item.sku] = String(item.quantity - received)
            } else {
              delete nextQty[item.sku]
            }
          }
          setRecepcionSelectedItems(nextSel)
          setRecepcionQuantities(nextQty)
        }

        const handleToggle = (sku: string) => {
          const willBeSelected = !recepcionSelectedItems[sku]
          setRecepcionSelectedItems((prev) => ({ ...prev, [sku]: willBeSelected }))
          if (willBeSelected) {
            const item = pendingItems.find((i) => i.sku === sku)
            if (item) {
              const received = itemRecepcionMap.get(sku) ?? 0
              setRecepcionQuantities((prev) => ({ ...prev, [sku]: String(item.quantity - received) }))
            }
          } else {
            setRecepcionQuantities((prev) => { const next = { ...prev }; delete next[sku]; return next })
          }
        }

        const closeRecepcion = () => {
          setShowRegistrarRecepcion(false)
          setRecepcionSelectedItems({})
          setRecepcionQuantities({})
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRecepcion} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Registrar recepción</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Indicá las unidades a marcar como recepcionadas</p>
                </div>
                <button onClick={closeRecepcion} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
                <div className="grid grid-cols-[3fr_1fr_1.4fr] h-9 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center px-4 gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white"
                    >
                      {allSel && <Check className="w-3 h-3 text-slate-800" />}
                      {indet && <Minus className="w-3 h-3 text-slate-800" />}
                    </button>
                    <span>Producto</span>
                  </div>
                  <div className="flex items-center justify-center">Pendientes</div>
                  <div className="flex items-center justify-center">Recepcionar</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-white">
                {pendingItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Todos los productos ya fueron recepcionados</p>
                  </div>
                ) : (
                  pendingItems.map((item, idx) => {
                    const received = itemRecepcionMap.get(item.sku) ?? 0
                    const remaining = item.quantity - received
                    const display = getVentaItemDisplay(item as any)
                    const isSelected = !!recepcionSelectedItems[item.sku]
                    const qtyValue = recepcionQuantities[item.sku] ?? ""
                    return (
                      <div
                        key={idx}
                        className={`grid grid-cols-[3fr_1fr_1.4fr] items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? "bg-slate-50/70" : ""}`}
                        onClick={() => handleToggle(item.sku)}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggle(item.sku) }}
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
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-slate-600 tabular-nums">{remaining}</span>
                        </div>
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
                                if (raw === "") { setRecepcionQuantities((prev) => ({ ...prev, [item.sku]: "" })); return }
                                const num = parseInt(raw, 10)
                                if (isNaN(num) || num < 0) { setRecepcionQuantities((prev) => ({ ...prev, [item.sku]: "0" })); return }
                                if (num > remaining) { setRecepcionQuantities((prev) => ({ ...prev, [item.sku]: String(remaining) })); return }
                                setRecepcionQuantities((prev) => ({ ...prev, [item.sku]: String(num) }))
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
              <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
                <span className="text-sm text-slate-500">
                  {selectedCount > 0
                    ? `${selectedCount} producto${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`
                    : "Seleccioná productos para registrar"}
                </span>
                <button
                  onClick={handleConfirmRecepcion}
                  disabled={selectedCount === 0}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Registrar recepción
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Registrar Pago Modal ── */}
      {showRegistrarPago && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRegistrarPago(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Registrar pago</h2>
              <button onClick={() => setShowRegistrarPago(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                  value={pagoFecha}
                  onChange={(e) => setPagoFecha(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                />
              </div>
              {/* Monto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Monto</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      value={pagoMonto}
                      onChange={(e) => setPagoMonto(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPagoMonto(String(Math.round(montoRestante)))}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200 shrink-0"
                  >
                    Total
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 tabular-nums">Restante: ${Math.round(montoRestante).toLocaleString("es-AR")}</p>
              </div>
              {/* Medio de pago */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Medio de pago</label>
                <div className="flex gap-2">
                  {(["efectivo", "posnet", "transferencia"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPagoMedio(m)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors capitalize ${
                        pagoMedio === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowRegistrarPago(false)}
                className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPago}
                disabled={!pagoMonto || Number(pagoMonto) <= 0}
                className="flex-1 py-2.5 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Registrar Devolucion Modal ── */}
      {showDevolucion && (() => {
        // disponible = recepcionadas - ya devueltas
        const getDisponible = (sku: string) =>
          Math.max(0, (itemRecepcionMap.get(sku) ?? 0) - (itemDevolucionMap.get(sku) ?? 0))

        const deliverableItems = compraItems.filter((item) => getDisponible(item.sku) > 0)
        const devSkus = deliverableItems.map((i) => i.sku)
        const allSel = devSkus.length > 0 && devSkus.every((sku) => devolucionSelectedItems[sku])
        const someSel = devSkus.some((sku) => devolucionSelectedItems[sku])
        const indet = someSel && !allSel
        const selectedCount = devSkus.filter((sku) => devolucionSelectedItems[sku]).length

        const selectedEntries = deliverableItems
          .filter((item) => devolucionSelectedItems[item.sku])
          .map((item) => {
            const qty = parseInt(devolucionQuantities[item.sku] ?? "0", 10) || 0
            const unitPrice = item.total / Math.max(item.quantity, 1)
            return { item, qty, amount: qty * unitPrice }
          })
        const totalDevUnits = selectedEntries.reduce((s, e) => s + e.qty, 0)
        const totalDevAmount = selectedEntries.reduce((s, e) => s + e.amount, 0)

        const handleSelectAll = () => {
          const selecting = !allSel && !indet
          const nextSel: { [sku: string]: boolean } = {}
          const nextQty: { [sku: string]: string } = { ...devolucionQuantities }
          for (const item of deliverableItems) {
            nextSel[item.sku] = selecting
            if (selecting) {
              nextQty[item.sku] = String(getDisponible(item.sku))
            } else {
              delete nextQty[item.sku]
            }
          }
          setDevolucionSelectedItems(nextSel)
          setDevolucionQuantities(nextQty)
        }

        const handleToggleItem = (sku: string) => {
          const willBeSelected = !devolucionSelectedItems[sku]
          setDevolucionSelectedItems((prev) => ({ ...prev, [sku]: willBeSelected }))
          if (willBeSelected) {
            setDevolucionQuantities((prev) => ({ ...prev, [sku]: String(getDisponible(sku)) }))
          } else {
            setDevolucionQuantities((prev) => { const next = { ...prev }; delete next[sku]; return next })
          }
        }

        const closeModal = () => {
          setShowDevolucion(false)
          setDevolucionStep(1)
          setDevolucionSelectedItems({})
          setDevolucionQuantities({})
        }

        const handleConfirmDevolucion = () => {
          if (!compra) return
          const devoluciones: CompraDevolucionItem[] = selectedEntries
            .filter((e) => e.qty > 0)
            .map((e) => ({ sku: e.item.sku, quantityDevuelta: e.qty }))
          if (devoluciones.length === 0) return
          addDevolucion(compra.id, devoluciones, Math.round(totalDevAmount))
          // Devolucion subtracts units from stock
          for (const d of devoluciones) {
            decreaseStock(d.sku, d.quantityDevuelta)
          }
          setViewMode("devolucion")
          closeModal()
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Registrar devolución</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Indicá las unidades a devolver al proveedor</p>
                </div>
                <button onClick={closeModal} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {devolucionStep === 1 ? (
                <>
                  <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
                    <div className="grid grid-cols-[3fr_1fr_1.4fr] h-9 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center px-4 gap-3">
                        <button
                          onClick={handleSelectAll}
                          className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white"
                        >
                          {allSel && <Check className="w-3 h-3 text-slate-800" />}
                          {indet && <Minus className="w-3 h-3 text-slate-800" />}
                        </button>
                        <span>Producto</span>
                      </div>
                      <div className="flex items-center justify-center">Disponible devolución</div>
                      <div className="flex items-center justify-center">Devolver</div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white">
                    {deliverableItems.length === 0 ? (
                      <div className="py-12 text-center">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No hay unidades recepcionadas para devolver</p>
                      </div>
                    ) : (
                      deliverableItems.map((item, idx) => {
                        const disponible = getDisponible(item.sku)
                        const display = getVentaItemDisplay(item as any)
                        const isSelected = !!devolucionSelectedItems[item.sku]
                        const qtyValue = devolucionQuantities[item.sku] ?? ""
                        return (
                          <div
                            key={idx}
                            className={`grid grid-cols-[3fr_1fr_1.4fr] items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? "bg-slate-50/70" : ""}`}
                            onClick={() => handleToggleItem(item.sku)}
                          >
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
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-600 tabular-nums">{disponible}</span>
                            </div>
                            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                              {isSelected && (
                                <input
                                  type="number"
                                  min={0}
                                  max={disponible}
                                  value={qtyValue}
                                  placeholder={String(disponible)}
                                  onChange={(e) => {
                                    const raw = e.target.value
                                    if (raw === "") { setDevolucionQuantities((prev) => ({ ...prev, [item.sku]: "" })); return }
                                    const num = parseInt(raw, 10)
                                    if (isNaN(num) || num < 0) { setDevolucionQuantities((prev) => ({ ...prev, [item.sku]: "0" })); return }
                                    if (num > disponible) { setDevolucionQuantities((prev) => ({ ...prev, [item.sku]: String(disponible) })); return }
                                    setDevolucionQuantities((prev) => ({ ...prev, [item.sku]: String(num) }))
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
                  <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                      <RotateCcw className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-base text-slate-700 text-center leading-relaxed">
                      <span className="font-semibold text-slate-900">{totalDevUnits} {totalDevUnits === 1 ? "unidad" : "unidades"}</span>
                      {" "}se registrar{totalDevUnits === 1 ? "á" : "án"} como devuelta{totalDevUnits !== 1 ? "s" : ""} al proveedor, y se generará un reintegro por{" "}
                      <span className="font-semibold text-emerald-600">${Math.round(totalDevAmount).toLocaleString("es-AR")}</span>
                    </p>
                    <ul className="w-full max-w-xs flex flex-col gap-1.5 mt-2">
                      {selectedEntries.filter((e) => e.qty > 0).map((e) => {
                        const display = getVentaItemDisplay(e.item as any)
                        return (
                          <li key={e.item.sku} className="flex items-center justify-between text-sm text-slate-600">
                            <span className="truncate">{display.name}</span>
                            <span className="tabular-nums ml-4 text-slate-500 shrink-0">{e.qty} ud.</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
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

      {/* ── Finalizar Compra Modal ── */}
      {showFinalizarCompra && (() => {
        const pendingItems = compraItems.filter((item) => {
          const received = itemRecepcionMap.get(item.sku) ?? 0
          return received < item.quantity
        })
        const pendingUnits = pendingItems.reduce((sum, item) => {
          const received = itemRecepcionMap.get(item.sku) ?? 0
          return sum + Math.max(0, item.quantity - received)
        }, 0)
        const hasPendingRecepcion = pendingItems.length > 0
        const hasPendingPago = montoRestante > 0

        const metodoOptions: { value: PaymentMethod | "no_especificado"; label: string }[] = [
          { value: "no_especificado", label: "No especificado" },
          { value: "efectivo", label: "Efectivo" },
          { value: "posnet", label: "Posnet" },
          { value: "transferencia", label: "Transferencia" },
        ]

        const closeModal = () => {
          setShowFinalizarCompra(false)
          setFinalizarMedioPago("no_especificado")
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Marcar como Finalizada</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Revisá los cambios que se aplicarán al confirmar</p>
                </div>
                <button onClick={closeModal} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {/* Recepcion */}
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasPendingRecepcion ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${hasPendingRecepcion ? "bg-amber-100" : "bg-emerald-100"}`}>
                      {hasPendingRecepcion
                        ? <Package className="w-3.5 h-3.5 text-amber-600" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${hasPendingRecepcion ? "text-amber-800" : "text-emerald-800"}`}>
                        {hasPendingRecepcion ? "Recepción pendiente" : "Recepción completa"}
                      </p>
                      <p className={`text-xs mt-0.5 ${hasPendingRecepcion ? "text-amber-700" : "text-emerald-700"}`}>
                        {hasPendingRecepcion
                          ? `${pendingUnits} unidad${pendingUnits !== 1 ? "es" : ""} sin recepcionar serán marcadas como recepcionadas`
                          : "Todas las unidades ya fueron recepcionadas"}
                      </p>
                    </div>
                  </div>

                  {/* Pago */}
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasPendingPago ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${hasPendingPago ? "bg-amber-100" : "bg-emerald-100"}`}>
                      {hasPendingPago
                        ? <Wallet className="w-3.5 h-3.5 text-amber-600" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${hasPendingPago ? "text-amber-800" : "text-emerald-800"}`}>
                        {hasPendingPago ? "Pago pendiente" : "Pago completo"}
                      </p>
                      <p className={`text-xs mt-0.5 ${hasPendingPago ? "text-amber-700" : "text-emerald-700"}`}>
                        {hasPendingPago
                          ? `Se registrará un pago de $${Math.round(montoRestante).toLocaleString("es-AR")} para cubrir el saldo restante`
                          : "El total de la compra ya fue pagado"}
                      </p>
                    </div>
                  </div>
                </div>

                {hasPendingPago && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      Medio de pago
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {metodoOptions.map((opt) => (
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

      {/* ── Agregar Productos Modal ── */}
      {showAgregarProductos && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAgregarProductos} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Agregar productos</h3>
                <p className="text-xs text-slate-500 mt-0.5">Buscá y seleccioná productos del catálogo</p>
              </div>
              <button onClick={closeAgregarProductos} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Search + filters */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  autoFocus
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Buscar por nombre, SKU, marca..."
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
              <button
                onClick={() => setShowModalFilters(!showModalFilters)}
                className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${showModalFilters || modalFilters.categoria || modalFilters.marca ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros
              </button>
              <button
                onClick={() => setModalSortDirection((d) => d === "asc" ? "desc" : "asc")}
                className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {showModalFilters && (
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Categoría:</span>
                  <select value={modalFilters.categoria} onChange={(e) => setModalFilters((f) => ({ ...f, categoria: e.target.value }))} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 bg-white">
                    <option value="">Todas</option>
                    {uniqueModalCategorias.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Marca:</span>
                  <select value={modalFilters.marca} onChange={(e) => setModalFilters((f) => ({ ...f, marca: e.target.value }))} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 bg-white">
                    <option value="">Todas</option>
                    {uniqueModalMarcas.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}
            {/* Column headers */}
            <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <div className="grid grid-cols-[auto_1fr_auto] h-9 text-[10px] font-medium text-slate-500 uppercase tracking-wider items-center px-4 gap-3">
                <button
                  onClick={handleSelectAllModal}
                  className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white"
                >
                  {modalSelectAllActive && <Check className="w-3 h-3 text-slate-800" />}
                  {modalSelectAllIndeterminate && <Minus className="w-3 h-3 text-slate-800" />}
                </button>
                <span>Producto</span>
                <span>Precio costo</span>
              </div>
            </div>
            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {filteredModalItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">Sin resultados para tu búsqueda</p>
                </div>
              ) : (
                filteredModalItems.map((item, idx) => {
                  const isParent = item.hasVariants && item.variants && item.variants.length > 0
                  if (isParent) {
                    const { checked: parentChecked, indeterminate: parentIndet } = getModalSelectionState(item)
                    return (
                      <div key={idx}>
                        <div
                          className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50/50"
                          onClick={() => handleModalItemSelection(item)}
                        >
                          <div className="flex items-center gap-3 mr-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleModalItemSelection(item) }}
                              className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 bg-white flex-shrink-0"
                            >
                              {parentChecked && <Check className="w-3 h-3 text-slate-800" />}
                              {parentIndet && <Minus className="w-3 h-3 text-slate-800" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                              <Image src={getCategoryImage(item.categoria || "") || "/placeholder.svg"} alt={item.name} width={32} height={32} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{item.name}</p>
                              <p className="text-xs text-slate-400">{item.marca} · {item.variants?.length} variantes</p>
                            </div>
                          </div>
                          <div />
                        </div>
                        {item.variants?.map((v: any, vi: number) => {
                          const vid = v.id || `${item.skuPrefix}-${v.skuSuffix}`
                          const { checked: vChecked } = getModalSelectionState(v, true)
                          const attrLabel = v.atributosPrincipales?.map((a: any) => a.value).join(" · ") || v.name
                          return (
                            <div
                              key={vi}
                              className={`grid grid-cols-[auto_1fr_auto] items-center px-4 py-2.5 border-b border-slate-100 bg-slate-50/30 cursor-pointer hover:bg-slate-50/70 ${vChecked ? "bg-slate-50" : ""}`}
                              onClick={() => handleModalItemSelection(v, true)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-4 ml-7" />
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleModalItemSelection(v, true) }}
                                  className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 bg-white flex-shrink-0"
                                >
                                  {vChecked && <Check className="w-3 h-3 text-slate-800" />}
                                </button>
                              </div>
                              <div className="min-w-0 pl-4">
                                <p className="text-sm text-slate-700">{attrLabel}</p>
                              </div>
                              <div className="text-xs text-slate-500 tabular-nums">
                                {v.precio?.costo ? `$${v.precio.costo.toLocaleString("es-AR")}` : "—"}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                  const iid = item.id || item.sku || item.name
                  const { checked: iChecked } = getModalSelectionState(item)
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[auto_1fr_auto] items-center px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50/50 ${iChecked ? "bg-slate-50" : ""}`}
                      onClick={() => handleModalItemSelection(item)}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleModalItemSelection(item) }}
                          className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 bg-white flex-shrink-0"
                        >
                          {iChecked && <Check className="w-3 h-3 text-slate-800" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                          <Image src={getCategoryImage(item.categoria || "") || "/placeholder.svg"} alt={item.name} width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400">{[item.marca, item.categoria].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {item.precio?.costo ? `$${item.precio.costo.toLocaleString("es-AR")}` : "—"}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-slate-500">
                {selectedModalCount > 0
                  ? `${selectedModalCount} producto${selectedModalCount !== 1 ? "s" : ""} seleccionado${selectedModalCount !== 1 ? "s" : ""}`
                  : "Seleccioná productos para agregar"}
              </span>
              <button
                onClick={handleConfirmAgregarProductos}
                disabled={selectedModalCount === 0}
                className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Agregar productos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Per-item discount modal (edit mode) ── */}
      {discountModalIdx !== null && editItems[discountModalIdx] && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDiscountModalIdx(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Descuento / ajuste de precio</h3>
              <button onClick={() => setDiscountModalIdx(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={modalAjuste.value || ""}
                  onChange={(e) => setModalAjuste((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                  <button onClick={() => setModalAjuste((prev) => ({ ...prev, type: "cash" }))} className={`px-3 py-2 text-sm cursor-pointer ${modalAjuste.type === "cash" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>$</button>
                  <button onClick={() => setModalAjuste((prev) => ({ ...prev, type: "percent" }))} className={`px-3 py-2 text-sm cursor-pointer ${modalAjuste.type === "percent" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>%</button>
                </div>
              </div>
            </div>
            <div className="px-5 pb-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditAjustes((prev) => { const next = { ...prev }; delete next[discountModalIdx!]; return next })
                  setDiscountModalIdx(null)
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Quitar
              </button>
              <button
                onClick={() => {
                  setEditAjustes((prev) => ({ ...prev, [discountModalIdx!]: modalAjuste }))
                  setDiscountModalIdx(null)
                }}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingItem && (
        <VentaItemDetailModal ventaItem={viewingItem as unknown as import("@/lib/types").VentaItem} onClose={() => setViewingItem(null)} />
      )}
      {showProveedorInfoModal && compra && (() => {
        const prov = PROVEEDORES.find(p => {
          const name = p.tipo === "empresa" ? p.razonSocial ?? "" : `${p.nombre} ${p.apellido}`.trim()
          return name === compra.proveedorNombre
        })
        return prov ? <ProveedorModal proveedorId={prov.id} onClose={() => setShowProveedorInfoModal(false)} /> : null
      })()}
    </div>
  )
}
