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
  ChevronDown,
  MoreVertical,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Check,
  Minus,
  Filter,
  ArrowUpDown,
  X,
  Pencil,
  Copy,
  ShoppingCart,
  ExternalLink,
  FileText,
} from "lucide-react"
import Image from "next/image"
import type { Presupuesto, VentaItem, Item, ItemVariant, VentaCliente } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { ClienteModal } from "@/components/ventas/cliente-modal"
import { CLIENTES } from "@/lib/data/clientes"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { usePresupuestos } from "@/hooks/use-presupuestos"
import { useVentas } from "@/hooks/use-ventas"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadPresupuestosPDF } from "@/lib/utils/generate-presupuesto-pdf"

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

// ── ClienteSelectorInlineModal ────────────────────────────────────────────────
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
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PresupuestoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const { presupuestos, isLoading, updatePresupuesto, updateEstado, deletePresupuesto } = usePresupuestos()
  const { ventas, addVenta } = useVentas()
  const { miNegocio } = useSettings()

  const presupuesto = useMemo(() => presupuestos.find((p) => p.id === id) || null, [presupuestos, id])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  const [viewingItem, setViewingItem] = useState<VentaItem | null>(null)
  const [showClienteInfoModal, setShowClienteInfoModal] = useState(false)
  const [showClienteSelectorModal, setShowClienteSelectorModal] = useState(false)
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [showAceptarModal, setShowAceptarModal] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSubtotalBreakdown, setShowSubtotalBreakdown] = useState(false)
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editItems, setEditItems] = useState<VentaItem[]>([])
  const [editAjustes, setEditAjustes] = useState<{ [idx: number]: { value: number; type: "percent" | "cash" | "unit" } }>({})
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" }>({ value: 0, type: "percent" })
  const [showEnvio, setShowEnvio] = useState(false)
  const [envioAmount, setEnvioAmount] = useState(0)
  const [customCharges, setCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])

  // Saved adjustments (view mode) — initialized from presupuesto once loaded
  const [savedGlobalDiscount, setSavedGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" } | null>(null)
  const [savedEnvio, setSavedEnvio] = useState<number | null>(null)
  const [savedCustomCharges, setSavedCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])
  const [adjustmentsInitialized, setAdjustmentsInitialized] = useState(false)

  // Modal items
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalSearch, setModalSearch] = useState("")
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)

  const moreMenuRef = useRef<HTMLDivElement>(null)

  // ── Defensive aliases ─────────────────────────────────────────────────────
  const presupuestoItems = presupuesto?.items ?? []

  // ── Computed totals ───────────────────────────────────────────────────────
  const totalUnidades = useMemo(() => presupuestoItems.reduce((s, it) => s + it.quantity, 0), [presupuestoItems])

  const itemDiscountAmount = useMemo(() => presupuestoItems.reduce((sum, it) => {
    if (it.discountType === "unit") return sum + Math.min(it.discount, it.quantity) * it.unitPrice
    const baseGross = it.unitPrice * it.quantity
    return sum + (it.discountType === "percent" ? baseGross * (it.discount / 100) : it.discount * it.quantity)
  }, 0), [presupuestoItems])

  const hasItemChanges = useMemo(() => {
    if (!isEditMode) return false
    if (editItems.length !== presupuestoItems.length) return true
    return editItems.some((ei, i) => {
      const orig = presupuestoItems[i]
      const aj = editAjustes[i] ?? { value: 0, type: "percent" }
      return ei.quantity !== orig.quantity || ei.unitPrice !== orig.unitPrice || aj.value !== orig.discount
    })
  }, [isEditMode, editItems, editAjustes, presupuestoItems])

  const hasResumenChanges = useMemo(() => {
    if (!isEditMode) return false
    return (showGlobalDiscount && globalDiscount.value > 0) || (showEnvio && envioAmount > 0) || customCharges.some(c => c.value > 0)
  }, [isEditMode, showGlobalDiscount, globalDiscount, showEnvio, envioAmount, customCharges])

  const hasAnyEditChanges = hasItemChanges || hasResumenChanges

  const globalDiscountAmount = showGlobalDiscount
    ? globalDiscount.type === "percent"
      ? (presupuesto?.subtotal ?? 0) * (globalDiscount.value / 100)
      : globalDiscount.value
    : 0

  const savedGlobalDiscountAmount = savedGlobalDiscount
    ? savedGlobalDiscount.type === "percent"
      ? (presupuesto?.subtotal ?? 0) * (savedGlobalDiscount.value / 100)
      : savedGlobalDiscount.value
    : 0

  // ── Modal computed values ─────────────────────────────────────────────────
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

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!presupuesto || adjustmentsInitialized) return
    setAdjustmentsInitialized(true)
    if (presupuesto.descuento > 0) {
      setSavedGlobalDiscount({ value: presupuesto.descuento, type: presupuesto.descuentoTipo === "fixed" ? "cash" : "percent" })
    }
    if (presupuesto.envio && presupuesto.envio > 0) setSavedEnvio(presupuesto.envio)
    if (presupuesto.customCharges && presupuesto.customCharges.length > 0) setSavedCustomCharges(presupuesto.customCharges)
  }, [presupuesto, adjustmentsInitialized])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreOptionsMenu(false)
      }
    }
    if (showMoreOptionsMenu) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMoreOptionsMenu])

  // Block browser navigation (refresh/close tab) when there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isEditMode && hasAnyEditChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isEditMode, hasAnyEditChanges])

  // ── Early returns AFTER all hooks ───��─────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando presupuesto...</p>
      </div>
    )
  }

  if (!presupuesto) {
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
            <p className="text-slate-500 mb-1">Presupuesto no encontrado</p>
            <p className="text-xs text-slate-400 mb-4">El presupuesto {id} no existe</p>
            <button onClick={() => router.push("/ventas/presupuestos")} className="text-sm text-blue-600 hover:underline">
              Volver a presupuestos
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const clienteNombre = presupuesto.cliente.tipo === "cuenta" ? presupuesto.cliente.nombre : "Consumidor Final"
  const clienteId = presupuesto.cliente.tipo === "cuenta" ? presupuesto.cliente.id : null
  const estado = presupuesto.estado

  // Find the associated venta if it exists
  const ventaAsociada = presupuesto.ventaId ? ventas.find(v => v.id === presupuesto.ventaId) ?? null : null

  // ── Edit mode handlers ────────────────────────────────────────────────────
  const enterEditMode = () => {
    setEditItems(presupuestoItems.map(i => ({ ...i })))
    setEditAjustes(
      Object.fromEntries(presupuestoItems.map((item, idx) => [
        idx,
        item.discount > 0
          ? { value: item.discount, type: (item.discountType === "fixed" ? "cash" : item.discountType === "unit" ? "unit" : "percent") as "percent" | "cash" | "unit" }
          : { value: 0, type: "percent" as const },
      ]))
    )
    if (presupuesto.descuento > 0) {
      setShowGlobalDiscount(true)
      setGlobalDiscount({ value: presupuesto.descuento, type: presupuesto.descuentoTipo === "fixed" ? "cash" : "percent" })
    } else {
      setShowGlobalDiscount(false)
      setGlobalDiscount({ value: 0, type: "percent" })
    }
    if (presupuesto.envio && presupuesto.envio > 0) { setShowEnvio(true); setEnvioAmount(presupuesto.envio) }
    else { setShowEnvio(false); setEnvioAmount(0) }
    setCustomCharges(presupuesto.customCharges?.filter(c => c.value > 0) ?? [])
    setIsEditMode(true)
  }

  const cancelEditMode = () => { setIsEditMode(false); setEditItems([]); setEditAjustes({}) }

  const saveEditMode = () => {
    if (!presupuesto) return
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
    updatePresupuesto(presupuesto.id, {
      items: saved,
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
  }

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

  const handleDownloadPDF = () => downloadPresupuestosPDF([presupuesto], miNegocio)

  // ── Aceptar y llevar a ventas ─────────────────────────────────────────────
  const handleAceptarYLlevarAVentas = () => {
    if (!presupuesto) return
    const now = new Date()
    const fecha = now.toISOString().slice(0, 10)
    const hora = now.toTimeString().slice(0, 5)
    const newVenta = addVenta({
      fecha,
      hora,
      cliente: presupuesto.cliente,
      items: presupuesto.items,
      subtotal: presupuesto.subtotal,
      descuento: presupuesto.descuento,
      descuentoTipo: presupuesto.descuentoTipo,
      envio: presupuesto.envio,
      customCharges: presupuesto.customCharges,
      total: presupuesto.total,
      entregaItems: [],
      entregaEntries: [],
      cobros: [],
      estado: "en_curso",
      observaciones: presupuesto.observaciones,
      origen: "presupuesto",
      presupuestoId: presupuesto.id,
    })
    updatePresupuesto(presupuesto.id, { estado: "aceptado", ventaId: newVenta.id })
    setShowAceptarModal(false)
    router.push(`/ventas/ventas/${newVenta.id}`)
  }

  const handleRechazar = () => {
    updateEstado(presupuesto.id, "rechazado")
    setShowRechazarModal(false)
  }

  // Guard navigation when in edit mode with pending changes
  const safeNavigate = (href: string) => {
    if (isEditMode && hasAnyEditChanges) {
      setPendingNavHref(href)
      setShowUnsavedModal(true)
    } else {
      router.push(href)
    }
  }

  // ── Modal items selection ─────────────────────────────────────────────────
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

  const handleConfirmAgregarProductos = () => {
    if (!presupuesto) return
    const newItems: VentaItem[] = []
    for (const item of allModalItems) {
      const isParent = item.hasVariants && (item as Item).variants && (item as Item).variants!.length > 0
      if (isParent) {
        for (const variant of (item as Item).variants!) {
          const id = (variant as ItemVariant).id || `${(item as Item).skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          if (!selectedModalItems[id]) continue
          const sku = `${(item as Item).skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          const unitPrice = (variant as ItemVariant).precio?.precioFinal || 0
          newItems.push({
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
        newItems.push({
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
    if (newItems.length > 0) {
      const merged = [...presupuestoItems]
      for (const it of newItems) {
        const idx = merged.findIndex(x => x.sku === it.sku)
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + 1 }
        } else {
          merged.push(it)
        }
      }
      updatePresupuesto(presupuesto.id, { items: merged })
    }
    closeAgregarProductos()
  }

  const breadcrumbs = [
    { label: "Ventas" },
    { label: "Presupuestos", href: "/ventas/presupuestos" },
    { label: presupuesto.id },
  ]

  const fechaObj = new Date(presupuesto.fecha)
  const mesCorto = fechaObj.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
  const dia = fechaObj.toLocaleDateString("es-AR", { day: "2-digit" })

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

                {/* ── Presupuesto Info card ── */}
                <div className="pt-8 px-0 pb-3 flex flex-col">

                  {/* Row 1: ID · fecha */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Presupuesto</span>
                        <span className="text-2xl font-bold text-slate-900 leading-none tracking-tight">{presupuesto.id}</span>
                      </div>
                      <div className="h-5 w-px bg-slate-300 shrink-0 mx-5" />
                      <span className="text-sm font-medium text-slate-600 tabular-nums shrink-0">
                        {dia} {mesCorto} {fechaObj.getFullYear()} · {presupuesto.hora}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Cliente pill (left) + PDF / more options (right) */}
                  <div className="flex items-center justify-between gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode && estado === "borrador") { setShowClienteSelectorModal(true) }
                        else if (clienteId) { setShowClienteInfoModal(true) }
                      }}
                      className={`inline-flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-2xl border bg-slate-50 shadow-sm transition-colors text-left ${clienteId || (isEditMode && estado === "borrador") ? "hover:bg-slate-100 cursor-pointer border-slate-200" : "cursor-default border-slate-200/60"}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white leading-none">{clienteNombre.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-1">Cliente</span>
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[220px]">{clienteNombre}</span>
                      </div>
                      {isEditMode && estado === "borrador" && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />}
                    </button>

                    {/* PDF + edit controls + more options */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Pencil / Cancelar+Guardar — borrador only */}
                      {estado === "borrador" && !isEditMode && (
                        <button
                          type="button"
                          onClick={enterEditMode}
                          className="h-8 text-xs transition-colors bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer gap-1.5 px-3 rounded-md flex items-center text-slate-600 font-medium shadow-sm"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          Editar
                        </button>
                      )}
                      {estado === "borrador" && isEditMode && (
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
                            onClick={handleGuardar}
                            disabled={isSaving}
                            className="h-8 text-xs transition-colors bg-slate-900 hover:bg-slate-800 cursor-pointer px-3 flex items-center text-white font-medium disabled:opacity-50"
                          >
                            {isSaving ? "Guardando..." : "Guardar cambios"}
                          </button>
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
                          <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                            <button
                              onClick={() => { setShowMoreOptionsMenu(false); router.push(`/ventas/presupuestos/nuevo?duplicar=${presupuesto.id}`) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <Copy className="w-4 h-4 text-slate-400" />
                              Duplicar presupuesto
                            </button>
                            {estado === "borrador" && (
                              <button
                                onClick={() => { setShowMoreOptionsMenu(false); setShowRechazarModal(true) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                              >
                                <XCircle className="w-4 h-4 text-red-400" />
                                Rechazar presupuesto
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Estado widget (left) + action widget (right) */}
                  {!isEditMode && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {/* Estado widget */}
                      {estado === "aceptado" && (
                        <div className="bg-emerald-50 border border-emerald-200/60 rounded-lg shadow-sm px-5 py-4 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-lg font-bold text-emerald-700">Aceptado</span>
                        </div>
                      )}
                      {estado === "borrador" && (
                        <div className="bg-slate-100 border border-slate-300/60 rounded-lg shadow-sm px-5 py-4 flex items-center gap-3">
                          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                          <span className="text-lg font-bold text-slate-600">Borrador</span>
                        </div>
                      )}
                      {estado === "rechazado" && (
                        <div className="bg-red-50 border border-red-200/60 rounded-lg shadow-sm px-5 py-4 flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <span className="text-lg font-bold text-red-600">Rechazado</span>
                        </div>
                      )}

                      {/* Action widget */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm px-4 py-4 flex items-center justify-center">
                        {estado === "borrador" && (
                          <button
                            type="button"
                            onClick={() => setShowAceptarModal(true)}
                            className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer group"
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:text-emerald-600 shrink-0" />
                            <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">Aceptar y llevar a ventas</span>
                          </button>
                        )}
                        {estado === "aceptado" && ventaAsociada && (
                          <button
                            type="button"
                            onClick={() => router.push(`/ventas/ventas/${ventaAsociada.id}`)}
                            className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-700 shrink-0" />
                            <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">Ver venta asociada</span>
                          </button>
                        )}
                        {estado === "aceptado" && !ventaAsociada && (
                          <span className="text-sm text-slate-400">Presupuesto aceptado</span>
                        )}
                        {estado === "rechazado" && (
                          <span className="text-sm text-slate-400">Este presupuesto fue rechazado</span>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* ── Productos card ── */}
                <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">

                  {/* Title strip */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-slate-900 text-white"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Productos
                    </button>
                  </div>

                  {/* Grid title */}
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      {presupuestoItems.length} {presupuestoItems.length === 1 ? "producto" : "productos"} · {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
                    </span>
                  </div>

                  {/* Grid */}
                  <div className="px-3 pb-3">
                  <div className="rounded-md border border-slate-200/80 overflow-hidden">

                  {/* Edit mode column headers */}
                  {isEditMode && (
                    <div className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1.2fr_auto] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                      <div className="flex items-center px-4">Item</div>
                      <div className="flex items-center justify-center">Cantidad</div>
                      <div className="flex items-center justify-center">Precio Unit.</div>
                      <div className="flex items-center justify-center">Promoción</div>
                      <div className="flex items-center justify-end pr-4">Total</div>
                      <div className="w-10" />
                    </div>
                  )}

                  {/* Items */}
                  {presupuestoItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Package className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-slate-500 mb-1">Sin productos</p>
                      <p className="text-xs text-slate-400">Este presupuesto no tiene productos asociados</p>
                    </div>
                  ) : (
                    presupuestoItems.map((item, idx) => {
                      const display = getVentaItemDisplay(item)
                      const baseGross = item.unitPrice * item.quantity
                      const discountAmount =
                        item.discountType === "percent"
                          ? baseGross * (item.discount / 100)
                          : item.discountType === "unit"
                          ? Math.min(item.discount, item.quantity) * item.unitPrice
                          : item.discount * item.quantity
                      const adjustedUnitPrice = Math.max(0, item.unitPrice - (discountAmount / Math.max(item.quantity, 1)))

                      return (
                        <div
                          key={`${presupuesto.id}-item-${idx}`}
                          onClick={() => !isEditMode && setViewingItem(item)}
                          className={`border-b border-slate-100 last:border-b-0 transition-colors ${!isEditMode ? "hover:bg-slate-50/50 cursor-pointer" : ""}`}
                        >
                          {isEditMode ? (
                            (() => {
                              const editItem = editItems[idx] ?? item
                              const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                              let finalTotal = 0
                              if (aj.value > 0) {
                                if (aj.type === "unit") {
                                  finalTotal = Math.max(0, editItem.quantity - Math.min(aj.value, editItem.quantity)) * editItem.unitPrice
                                } else {
                                  const adjUnit = aj.type === "percent"
                                    ? editItem.unitPrice * (1 - aj.value / 100)
                                    : Math.max(0, editItem.unitPrice - aj.value)
                                  finalTotal = editItem.quantity * adjUnit
                                }
                              } else {
                                finalTotal = editItem.quantity * editItem.unitPrice
                              }
                              return (
                                <div className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1.2fr_auto] min-h-[72px]">
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
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 text-sm">$</span>
                                    <input
                                      type="number"
                                      value={editItem.unitPrice || ""}
                                      onChange={(e) => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: parseFloat(e.target.value) || 0 } : it))}
                                      className="w-20 text-center text-sm py-1.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
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

                  {/* Agregar productos row — only in edit mode for borradores */}
                  {isEditMode && estado === "borrador" && (
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
                  </div>{/* end padding wrapper */}
                </div>{/* end productos card */}

                {/* ── Notas card ── */}
                <NotasCard
                  value={presupuesto.observaciones ?? ""}
                  readOnly={estado !== "borrador"}
                  placeholder="Agregar una nota sobre este presupuesto..."
                  onSave={(v) => updatePresupuesto(presupuesto.id, { observaciones: v })}
                />

              </div>{/* end col-span-2 */}

              {/* Right col-span-1: resumen */}
              {presupuestoItems.length > 0 && (
                <div className="col-span-1 flex flex-col gap-4">
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
                      <span className="text-sm text-slate-700 tabular-nums mr-1.5">${Math.round(presupuesto.subtotal).toLocaleString("es-AR")}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSubtotalBreakdown ? "rotate-180" : ""}`} />
                    </button>
                    {showSubtotalBreakdown && (
                      <div>
                        {presupuestoItems.map((item, idx) => {
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

                    {/* Edit mode ajuste inputs */}
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

                    {/* Agregar tags — only in edit mode for borradores */}
                    {isEditMode && estado === "borrador" && (!showGlobalDiscount || !showEnvio || customCharges.length === 0) && (
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

                    {/* View mode: saved adjustments */}
                    {!isEditMode && savedGlobalDiscount && savedGlobalDiscount.value > 0 && (
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">
                          Descuento Global{" "}
                          <span className="text-xs text-slate-400">
                            ({savedGlobalDiscount.type === "percent" ? `${savedGlobalDiscount.value}%` : `$${savedGlobalDiscount.value.toLocaleString("es-AR")}`})
                          </span>
                        </span>
                        <span className="text-sm text-red-500 tabular-nums">
                          {`\u2212$${Math.round(savedGlobalDiscountAmount).toLocaleString("es-AR")}`}
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
                    {!isEditMode && (savedGlobalDiscount?.value ?? 0) > 0 || (savedEnvio != null && savedEnvio > 0) || savedCustomCharges.length > 0 ? (
                      <div className="-mx-5 w-[calc(100%+2.5rem)] border-b border-slate-100" />
                    ) : null}

                    {/* Total */}
                    <div className="flex justify-between items-center py-3 mt-1">
                      <span className="text-base font-bold text-slate-900">Total</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        ${Math.round(
                          isEditMode
                            ? presupuesto.subtotal - globalDiscountAmount + envioAmount + customCharges.reduce((s, c) => s + c.value, 0)
                            : presupuesto.total
                        ).toLocaleString("es-AR")}
                      </span>
                    </div>

                  </div>
                </div>{/* end resumen card */}
                </div>
              )}

              </div>{/* end grid */}
              </div>{/* end max-w */}
            </div>
          </main>
        </div>
      </div>

      {/* ── Unsaved Changes Guard Modal ── */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUnsavedModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Cambios sin guardar</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed ml-12">
                Guardá los cambios antes de continuar, o descartá las modificaciones.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowUnsavedModal(false)
                  cancelEditMode()
                  if (pendingNavHref) router.push(pendingNavHref)
                  setPendingNavHref(null)
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Descartar cambios
              </button>
              <button
                onClick={async () => {
                  setShowUnsavedModal(false)
                  await handleGuardar()
                  if (pendingNavHref) router.push(pendingNavHref)
                  setPendingNavHref(null)
                }}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Guardar y continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Item detail modal ── */}
      {viewingItem && (
        <VentaItemDetailModal ventaItem={viewingItem} onClose={() => setViewingItem(null)} />
      )}

      {/* ── Cliente Info Modal ── */}
      {showClienteInfoModal && clienteId && (
        <ClienteModal clienteId={clienteId} onClose={() => setShowClienteInfoModal(false)} />
      )}

      {/* ── Cliente Selector Modal ── */}
      {showClienteSelectorModal && (
        <ClienteSelectorInlineModal
          currentClienteId={clienteId}
          onSelect={(id, nombre) => {
            updatePresupuesto(presupuesto.id, { cliente: { tipo: "cuenta", id, nombre } })
            setShowClienteSelectorModal(false)
          }}
          onClose={() => setShowClienteSelectorModal(false)}
        />
      )}

      {/* ── Aceptar Modal ── */}
      {showAceptarModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAceptarModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Aceptar y llevar a ventas</h3>
              </div>
              <p className="text-sm text-slate-500 mt-2 ml-12">
                El presupuesto <span className="font-semibold text-slate-800">{presupuesto.id}</span> se marcará como <span className="font-semibold text-emerald-700">aceptado</span> y se creará una nueva venta con origen <span className="font-medium text-slate-700">&quot;Creada desde presupuesto&quot;</span>.
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAceptarModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptarYLlevarAVentas}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Aceptar y crear venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rechazar Modal ── */}
      {showRechazarModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRechazarModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Rechazar presupuesto</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"El presupuesto "}
                <span className="font-semibold text-slate-900">{presupuesto.id}</span>
                {" se marcará como rechazado. Esta acción es reversible desde la edición del presupuesto."}
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setShowRechazarModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Agregar Productos Modal ── */}
      {showAgregarProductos && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAgregarProductos} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Agregar productos</h3>
                <p className="text-xs text-slate-500 mt-0.5">Seleccioná los productos a agregar al presupuesto</p>
              </div>
              <button onClick={closeAgregarProductos} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search + filter bar */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  autoFocus
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
              <button
                onClick={() => setShowModalFilters(!showModalFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${showModalFilters ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros
              </button>
              <button
                onClick={() => setModalSortDirection(d => d === "asc" ? "desc" : "asc")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter panel */}
            {showModalFilters && (
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50 flex-shrink-0">
                <select
                  value={modalFilters.categoria}
                  onChange={e => setModalFilters(prev => ({ ...prev, categoria: e.target.value }))}
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none"
                >
                  <option value="">Todas las categorías</option>
                  {uniqueModalCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={modalFilters.marca}
                  onChange={e => setModalFilters(prev => ({ ...prev, marca: e.target.value }))}
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none"
                >
                  <option value="">Todas las marcas</option>
                  {uniqueModalMarcas.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white">
                  {(["name", "precio"] as const).map(s => (
                    <button key={s} onClick={() => setModalSort(s)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${modalSort === s ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                      {s === "name" ? "Nombre" : "Precio"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Column headers */}
            <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <div className="grid grid-cols-[3fr_1fr_1fr] h-9 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
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
                <div className="flex items-center justify-center">Precio</div>
                <div className="flex items-center justify-center">Seleccionado</div>
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto bg-white divide-y divide-slate-100">
              {filteredModalItems.map((item, idx) => {
                const isParent = !!(item.hasVariants && item.variants?.length)
                const { checked, indeterminate } = getModalSelectionState(item)
                const displayName = item.name
                const unitPrice = item.precio?.precioFinal
                return (
                  <div key={idx}>
                    <div
                      className={`grid grid-cols-[3fr_1fr_1fr] items-center py-2.5 px-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${checked ? "bg-slate-50/70" : ""}`}
                      onClick={() => !isParent && handleModalItemSelection(item)}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleModalItemSelection(item) }}
                          className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white flex-shrink-0"
                        >
                          {checked && !indeterminate && <Check className="w-3 h-3 text-slate-800" />}
                          {indeterminate && <Minus className="w-3 h-3 text-slate-800" />}
                        </button>
                        <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                          <Image src={getCategoryImage(item.categoria || "") || "/placeholder.svg"} alt={displayName} width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                          <p className="text-xs text-slate-400">{[item.marca, item.categoria].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        {unitPrice != null ? (
                          <span className="text-sm text-slate-700 tabular-nums">${unitPrice.toLocaleString("es-AR")}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        {checked && !isParent && <Check className="w-4 h-4 text-emerald-500" />}
                        {isParent && indeterminate && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </div>
                    {/* Variants */}
                    {isParent && item.variants?.map((v: any, vi: number) => {
                      const variantId = getModalItemId(v)
                      const isSelected = !!selectedModalItems[variantId]
                      const variantName = v.atributosPrincipales?.length
                        ? v.atributosPrincipales.map((a: any) => a.value).join(" · ")
                        : v.name
                      const variantPrice = v.precio?.precioFinal
                      return (
                        <div
                          key={vi}
                          className={`grid grid-cols-[3fr_1fr_1fr] items-center py-2 px-4 pl-12 hover:bg-slate-50/50 transition-colors cursor-pointer border-t border-slate-50 ${isSelected ? "bg-slate-50/70" : ""}`}
                          onClick={() => handleModalItemSelection(v, true)}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleModalItemSelection(v, true) }}
                              className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white flex-shrink-0"
                            >
                              {isSelected && <Check className="w-3 h-3 text-slate-800" />}
                            </button>
                            <p className="text-sm text-slate-700">{variantName}</p>
                          </div>
                          <div className="flex items-center justify-center">
                            {variantPrice != null ? (
                              <span className="text-sm text-slate-700 tabular-nums">${variantPrice.toLocaleString("es-AR")}</span>
                            ) : <span className="text-xs text-slate-300">—</span>}
                          </div>
                          <div className="flex items-center justify-center">
                            {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
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
                Agregar al presupuesto
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
