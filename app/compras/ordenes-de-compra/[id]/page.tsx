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
  Truck,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import Image from "next/image"
import type { OrdenDeCompra, OrdenDeCompraItem, Item, ItemVariant, EstadoOrdenDeCompra } from "@/lib/types"
import { getItemPhoto } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import { VentaItemDetailModal } from "@/components/ventas/venta-item-detail-modal"
import { ProveedorModal } from "@/components/compras/proveedor-modal"

import { PROVEEDORES } from "@/lib/data/proveedores"
import { useOrdenesDeCompra } from "@/hooks/use-ordenes-de-compra"
import { useCompras } from "@/hooks/use-compras"
import { useItems } from "@/hooks/use-items"
import { useSettings } from "@/lib/contexts/settings-context"
import { downloadOrdenCompraPDF } from "@/lib/utils/generate-orden-compra-pdf"
import { buildCompraFromOrden } from "@/lib/utils/orden-to-compra"

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrdenDeCompraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const { ordenes, isLoading, updateOrden, updateEstado, deleteOrden } = useOrdenesDeCompra()
  const { addCompra } = useCompras()
  const { items: catalogItems, updatePricing } = useItems()
  const { miNegocio, precios: preciosSettings } = useSettings()

  const orden = useMemo(() => ordenes.find((o) => o.id === id) || null, [ordenes, id])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  const [viewingItem, setViewingItem] = useState<OrdenDeCompraItem | null>(null)
  const [showAceptarModal, setShowAceptarModal] = useState(false)
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  const [showEliminarModal, setShowEliminarModal] = useState(false)

  // Costo diffs for the aceptar modal
  const [costoDiffs, setCostoDiffs] = useState<Array<{ sku: string; name: string; tags: string[]; savedCosto: number; newCosto: number }>>([])
  const [selectedCostoSkus, setSelectedCostoSkus] = useState<Set<string>>(new Set())
  const [showProveedorInfoModal, setShowProveedorInfoModal] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSubtotalBreakdown, setShowSubtotalBreakdown] = useState(false)
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editItems, setEditItems] = useState<OrdenDeCompraItem[]>([])
  const [editAjustes, setEditAjustes] = useState<{ [idx: number]: { value: number; type: "percent" | "cash" | "unit" } }>({})

  // Per-item cost/discount modal
  const [discountModalIdx, setDiscountModalIdx] = useState<number | null>(null)
  const [modalAjuste, setModalAjuste] = useState<{ value: number; type: "percent" | "cash" | "unit" }>({ value: 0, type: "percent" })
  const [modalPrice, setModalPrice] = useState<string>("")
  const [showModalDescuento, setShowModalDescuento] = useState(false)

  // Modal items
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalSearch, setModalSearch] = useState("")
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio" | "stock">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)

  const moreMenuRef = useRef<HTMLDivElement>(null)

  // ── Defensive aliases ─────────────────────────────────────────────────────
  const ordenItems = orden?.items ?? []
  const proveedorNombre = orden?.proveedorNombre ?? ""

  // ── Computed totals ───────────────────────────────────────────────────────
  const totalUnidades = useMemo(() => ordenItems.reduce((s, it) => s + it.quantity, 0), [ordenItems])

  const hasItemChanges = useMemo(() => {
    if (!isEditMode) return false
    if (editItems.length !== ordenItems.length) return true
    return editItems.some((ei, i) => {
      const orig = ordenItems[i]
      const aj = editAjustes[i] ?? { value: 0, type: "percent" }
      return ei.quantity !== orig.quantity || ei.unitPrice !== orig.unitPrice || aj.value !== 0
    })
  }, [isEditMode, editItems, editAjustes, ordenItems])

  const hasAnyEditChanges = hasItemChanges

  // Real-time subtotal from editItems + editAjustes
  const editSubtotal = useMemo(() => {
    return editItems.reduce((sum, item, idx) => {
      const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
      if (aj.value > 0) {
        if (aj.type === "unit") {
          const paid = Math.max(0, item.quantity - Math.min(aj.value, item.quantity))
          return sum + paid * item.unitPrice
        }
        if (aj.type === "percent") return sum + item.quantity * item.unitPrice * (1 - aj.value / 100)
        if (aj.type === "cash") return sum + item.quantity * Math.max(0, item.unitPrice - aj.value)
      }
      return sum + item.quantity * item.unitPrice
    }, 0)
  }, [editItems, editAjustes])

  // In view mode, "Productos" shows the item-level subtotal (before global adjustments)
  const viewSubtotal = orden ? (orden.subtotal ?? orden.importeEstimado) : 0
  const activeSubtotal = isEditMode ? editSubtotal : viewSubtotal

  // Derived global adjustment values for view mode
  const viewGlobalDiscount = orden?.descuento ?? 0
  const viewGlobalDiscountTipo = orden?.descuentoTipo ?? "percent"
  const viewGlobalDiscountAmount = viewGlobalDiscount > 0
    ? viewGlobalDiscountTipo === "percent" ? viewSubtotal * (viewGlobalDiscount / 100) : viewGlobalDiscount
    : 0
  const viewEnvio = orden?.envio ?? 0
  const viewCustomCharges = orden?.customCharges ?? []
  const viewGrandTotal = orden?.importeEstimado ?? 0

  // ── Modal computed values ─────────────────────────────────────────────────
  const allModalItems = useMemo(
    () => catalogItems.filter((item: any) => proveedorNombre ? item.proveedor === proveedorNombre : true),
    [catalogItems, proveedorNombre]
  )

  const uniqueModalCategorias = useMemo(() => {
    const cats = new Set<string>()
    allModalItems.forEach(item => { if (item.categoria) cats.add(item.categoria) })
    return Array.from(cats).sort()
  }, [allModalItems])

  const uniqueModalMarcas = useMemo(() => {
    const marcas = new Set<string>()
    allModalItems.forEach(item => { if (item.marca) marcas.add(item.marca) })
    return Array.from(marcas).sort()
  }, [allModalItems])

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
      if (modalSort === "stock") return (parseInt(a.stock?.disponible || "0") - parseInt(b.stock?.disponible || "0")) * dir
      return a.name.localeCompare(b.name) * dir
    })
    return items
  }, [allModalItems, modalSearch, modalFilters, modalSort, modalSortDirection])

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
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreOptionsMenu(false)
      }
    }
    if (showMoreOptionsMenu) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMoreOptionsMenu])

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

  // ── Early returns AFTER all hooks ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando orden de compra...</p>
      </div>
    )
  }

  if (!orden) {
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
            <p className="text-slate-500 mb-1">Orden no encontrada</p>
            <p className="text-xs text-slate-400 mb-4">La orden {id} no existe</p>
            <button onClick={() => router.push("/compras/ordenes-de-compra")} className="text-sm text-blue-600 hover:underline">
              Volver a órdenes de compra
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const estado = orden.estado
  const isEditable = estado === "borrador"

  // ── Edit mode handlers ────────────────────────────────────────────────────
  const enterEditMode = () => {
    setEditItems(ordenItems.map(i => ({ ...i })))
    setEditAjustes(
      Object.fromEntries(ordenItems.map((it, idx) => {
        if ((it.discount ?? 0) > 0) {
          const type = it.discountType === "fixed" ? "cash" : it.discountType === "unit" ? "unit" : "percent"
          return [idx, { value: it.discount!, type }]
        }
        return [idx, { value: 0, type: "percent" as const }]
      }))
    )
    setIsEditMode(true)
  }

  const cancelEditMode = () => { setIsEditMode(false); setEditItems([]); setEditAjustes({}) }

  const saveEditMode = () => {
    if (!orden) return
    const saved: OrdenDeCompraItem[] = editItems.map((item, idx) => {
      const aj = editAjustes[idx] ?? { value: 0, type: "percent" }
      let total = item.quantity * item.unitPrice
      if (aj.value > 0) {
        if (aj.type === "unit") total = Math.max(0, item.quantity - Math.min(aj.value, item.quantity)) * item.unitPrice
        else if (aj.type === "percent") total = item.quantity * item.unitPrice * (1 - aj.value / 100)
        else total = item.quantity * Math.max(0, item.unitPrice - aj.value)
      }
      return {
        ...item,
        discount: aj.value,
        discountType: (aj.type === "percent" ? "percent" : aj.type === "unit" ? "unit" : "fixed") as "percent" | "fixed" | "unit",
        total,
      }
    })
    const newSubtotal = saved.reduce((s, it) => s + it.total, 0)
    // Carry global adjustments from stored orden
    const desc = orden.descuento ?? 0
    const descTipo = orden.descuentoTipo ?? "percent"
    const envio = orden.envio ?? 0
    const charges = (orden.customCharges ?? []).reduce((s, c) => s + c.value, 0)
    const globalDiscAmt = desc > 0 ? (descTipo === "percent" ? newSubtotal * (desc / 100) : desc) : 0
    const newImporte = Math.round(newSubtotal - globalDiscAmt + envio + charges)
    updateOrden(orden.id, { items: saved, subtotal: newSubtotal, importeEstimado: newImporte })
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

  // ── Costo diff helpers ────────────────────────────────────────────────────
  const getSavedCostoOrden = (sku: string): number | null => {
    for (const item of catalogItems) {
      if (item.hasVariants && item.variants) {
        for (const v of item.variants) {
          const vSku = `${item.skuPrefix}-${(v as any).skuSuffix}`
          if (vSku === sku) return (v as any).precio?.costo ?? null
        }
      } else {
        if ((item.sku || item.id) === sku) return item.precio?.costo ?? null
      }
    }
    return null
  }

  const computeCostoDiffs = () => {
    if (!orden) return
    const diffs: typeof costoDiffs = []
    for (const item of orden.items) {
      const saved = getSavedCostoOrden(item.sku)
      if (saved !== null && saved !== item.unitPrice) {
        const display = getVentaItemDisplay(item as any)
        diffs.push({ sku: item.sku, name: display.name, tags: display.tags, savedCosto: saved, newCosto: item.unitPrice })
      }
    }
    setCostoDiffs(diffs)
    setSelectedCostoSkus(new Set())
  }

  const allCostosSelected = costoDiffs.length > 0 && costoDiffs.every(d => selectedCostoSkus.has(d.sku))
  const someCostosSelected = costoDiffs.some(d => selectedCostoSkus.has(d.sku))
  const toggleAllCostos = (checked: boolean) =>
    setSelectedCostoSkus(checked ? new Set(costoDiffs.map(d => d.sku)) : new Set())
  const toggleOneCosto = (sku: string, checked: boolean) =>
    setSelectedCostoSkus(prev => { const next = new Set(prev); checked ? next.add(sku) : next.delete(sku); return next })

  // ── Aceptar y llevar a compras ────────────────────────────────────────────
  const handleAceptarYLlevarACompras = () => {
    if (!orden) return
    const now = new Date()
    const fecha = now.toISOString().slice(0, 10)
    const hora = now.toTimeString().slice(0, 5)
    const newCompra = addCompra(buildCompraFromOrden(orden, fecha, hora))
    updateOrden(orden.id, { estado: "aceptada", compraId: newCompra.id })
    // Update costo in lista de precios for selected SKUs
    for (const diff of costoDiffs) {
      if (selectedCostoSkus.has(diff.sku)) {
        updatePricing(diff.sku, { costo: diff.newCosto }, undefined, preciosSettings.costoBehavior)
      }
    }
    setShowAceptarModal(false)
    router.push(`/compras/compras/${newCompra.id}`)
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
    if (!orden) return
    const newItems: OrdenDeCompraItem[] = []
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
            name: `${item.name}${(variant as ItemVariant).atributosPrincipales?.length ? " · " + (variant as ItemVariant).atributosPrincipales!.map((a: any) => a.value).join(" · ") : ""}`,
            quantity: 1,
            unitPrice,
            total: unitPrice,
            categoria: (variant as ItemVariant).categoria || (item as Item).categoria,
            tags: (variant as ItemVariant).atributosPrincipales?.map((a: any) => a.value),
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
          total: unitPrice,
          categoria: (item as Item).categoria,
        })
      }
    }
    if (newItems.length > 0) {
      if (isEditMode) {
        setEditItems(prev => {
          const merged = [...prev]
          for (const it of newItems) {
            const idx = merged.findIndex(x => x.sku === it.sku)
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + 1 }
            } else {
              merged.push(it)
            }
          }
          return merged
        })
      } else {
        const merged = [...ordenItems]
        for (const it of newItems) {
          const idx = merged.findIndex(x => x.sku === it.sku)
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + 1 }
          } else {
            merged.push(it)
          }
        }
        const newImporte = merged.reduce((s, i) => s + i.total, 0)
        updateOrden(orden.id, { items: merged, importeEstimado: newImporte })
      }
    }
    closeAgregarProductos()
  }

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Órdenes de Compra", href: "/compras/ordenes-de-compra" },
    { label: orden.id },
  ]

  const MONTHS_ABBR = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const fechaObj = new Date(orden.fechaCreacion)
  const _isValidDate = !isNaN(fechaObj.getTime())
  const dia = _isValidDate ? fechaObj.getUTCDate() : "?"
  const mesCorto = _isValidDate ? MONTHS_ABBR[fechaObj.getUTCMonth()] : "?"
  const yearOrden = _isValidDate ? fechaObj.getUTCFullYear() : new Date().getFullYear()
  const horaOrden = _isValidDate
    ? `${String(fechaObj.getUTCHours()).padStart(2, "0")}:${String(fechaObj.getUTCMinutes()).padStart(2, "0")} hs`
    : ""
  const fechaLabel = yearOrden < new Date().getFullYear()
    ? `${dia} ${mesCorto} ${yearOrden} · ${horaOrden}`
    : `${dia} ${mesCorto} · ${horaOrden}`

  const estadoColors: Record<EstadoOrdenDeCompra, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    borrador: { bg: "bg-slate-100", border: "border-slate-300/60", text: "text-slate-600", icon: <Clock className="w-5 h-5 text-slate-400 shrink-0" /> },
    aceptada: { bg: "bg-emerald-50", border: "border-emerald-200/60", text: "text-emerald-700", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> },
  }
  const estadoDisplay: Record<EstadoOrdenDeCompra, string> = {
    borrador: "Borrador",
    aceptada: "Aceptada",
  }

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
            onNavigate={safeNavigate}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Utility Bar */}
          <div className="relative border-b border-[#2E2F35] h-[44px] bg-[#1B1C20]">
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

                {/* ── Orden Info card ── */}
                <div className="pt-8 px-0 pb-3 flex flex-col">

                  {/* Row 1: ID · fecha */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 shrink-0">
                        <span className="text-xl font-bold text-slate-900 leading-none uppercase tracking-wide">Orden de Compra</span>
                        <span className="text-base font-medium text-slate-400 leading-none tabular-nums">{orden.id}</span>
                      </div>
                      <div className="h-5 w-px bg-slate-300 shrink-0 mx-5" />
                      <span className="text-sm font-medium text-slate-600 tabular-nums shrink-0">
                        {fechaLabel}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Proveedor pill (read-only) + controls */}
                  <div className="flex items-center justify-between gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setShowProveedorInfoModal(true)}
                      className="inline-flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-2xl border bg-slate-50 shadow-sm transition-colors text-left hover:bg-slate-100 cursor-pointer border-slate-200/60"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white leading-none">{proveedorNombre.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-1">Proveedor</span>
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[220px]">{proveedorNombre}</span>
                      </div>
                    </button>

                    {/* Edit controls + more options */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditable && !isEditMode && (
                        <button
                          type="button"
                          onClick={enterEditMode}
                          className="h-8 text-xs transition-colors bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer gap-1.5 px-3 rounded-md flex items-center text-slate-600 font-medium shadow-sm"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          Editar
                        </button>
                      )}
                      {isEditable && isEditMode && (
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
                        onClick={() => orden && downloadOrdenCompraPDF([orden], miNegocio)}
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
                              onClick={() => { setShowMoreOptionsMenu(false); router.push(`/compras/ordenes-de-compra/nueva?duplicar=${orden.id}`) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <Copy className="w-4 h-4 text-slate-400" />
                              Duplicar orden
                            </button>
                            {estado === "borrador" && (
                              <button
                                onClick={() => { setShowMoreOptionsMenu(false); setShowEliminarModal(true) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                                Eliminar orden
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Estado widget (left) + action widget (right) */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {/* Estado widget */}
                    <div className={`${estadoColors[estado].bg} border ${estadoColors[estado].border} rounded-lg shadow-sm px-5 py-4 flex items-center gap-3`}>
                      {estadoColors[estado].icon}
                      <span className={`text-lg font-bold ${estadoColors[estado].text}`}>{estadoDisplay[estado]}</span>
                    </div>

                    {/* Action widget */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm px-4 py-4 flex items-center justify-center">
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => { if (!isEditMode) { computeCostoDiffs(); setShowAceptarModal(true) } }}
                          disabled={isEditMode}
                          className={`flex items-center gap-2.5 px-4 py-2 rounded-lg transition-colors ${isEditMode ? "opacity-40 cursor-not-allowed bg-slate-50 text-slate-900" : "bg-slate-50 hover:bg-slate-100 text-slate-900 cursor-pointer"}`}
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                          <span className="text-sm font-semibold text-slate-900">Aceptar y llevar a compras</span>
                        </button>
                      )}
                      {estado === "aceptada" && orden.compraId && (
                        <button
                          type="button"
                          onClick={() => router.push(`/compras/compras/${orden.compraId}`)}
                          className="flex items-center gap-2.5 px-4 py-2 rounded-lg transition-colors group hover:bg-slate-100 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-700 shrink-0" />
                          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">Ver compra relacionada</span>
                        </button>
                      )}
                      {estado === "aceptada" && !orden.compraId && (
                        <span className="text-sm text-slate-400">Orden aceptada</span>
                      )}

                    </div>
                  </div>

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
                      {ordenItems.length} {ordenItems.length === 1 ? "producto" : "productos"} · {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
                    </span>
                  </div>

                  {/* Grid */}
                  <div className="px-3 pb-3">
                  <div className="rounded-md border border-slate-200/80 overflow-hidden">

                  {/* Edit mode column headers */}
                  {isEditMode && (
                    <div className="grid grid-cols-[2fr_0.8fr_1fr_auto] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                      <div className="flex items-center px-4">Item</div>
                      <div className="flex items-center justify-center">Cantidad</div>
                      <div className="flex items-center justify-center">Costo</div>
                      <div className="w-10" />
                    </div>
                  )}

                  {/* Items */}
                  {(isEditMode ? editItems : ordenItems).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Package className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-slate-500 mb-1">Sin productos</p>
                      <p className="text-xs text-slate-400">Esta orden no tiene productos asociados</p>
                    </div>
                  ) : (
                    (isEditMode ? editItems : ordenItems).map((item, idx) => {
                      const display = getVentaItemDisplay(item as any)

                      return (
                        <div
                          key={`${orden.id}-item-${idx}`}
                          onClick={() => !isEditMode && setViewingItem(item)}
                          className={`border-b border-slate-100 last:border-b-0 transition-colors ${!isEditMode ? "hover:bg-slate-50/50 cursor-pointer" : ""}`}
                        >
                          {isEditMode ? (
                            (() => {
                              const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                              const hasDiscount = aj.value > 0
                              let adjUnitPrice = item.unitPrice
                              if (hasDiscount) {
                                if (aj.type === "percent") adjUnitPrice = item.unitPrice * (1 - aj.value / 100)
                                else if (aj.type === "cash") adjUnitPrice = Math.max(0, item.unitPrice - aj.value)
                              }
                              return (
                                <div className="grid grid-cols-[2fr_0.8fr_1fr_auto] min-h-[72px]">
                                  {/* ITEM */}
                                  <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                      <Image src={getItemPhoto(display.resolved as any)} alt={item.name} width={32} height={32} className="object-cover" />
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
                                  {/* CANTIDAD */}
                                  <div className="flex items-center justify-center">
                                    <div className="flex items-center border border-slate-200 rounded-full px-1 py-0.5 bg-white">
                                      <button onClick={() => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))} className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input
                                        type="number"
                                        value={item.quantity || ""}
                                        onChange={(e) => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                                        className="w-10 text-center text-sm py-1 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <button onClick={() => setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))} className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  {/* COSTO with pencil → opens descuento modal */}
                                  <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1">
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex flex-col items-end">
                                        {hasDiscount && (aj.type === "percent" || aj.type === "cash") && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-[11px] text-slate-400 line-through tabular-nums">${Math.round(item.unitPrice).toLocaleString("es-AR")}</span>
                                            <span className="text-[10px] text-red-500 font-medium">{aj.type === "percent" ? `-${aj.value}%` : `-$${aj.value.toLocaleString("es-AR")}`}</span>
                                          </div>
                                        )}
                                        <span className="text-sm font-medium text-slate-900 tabular-nums">
                                          ${Math.round(hasDiscount && (aj.type === "percent" || aj.type === "cash") ? adjUnitPrice : item.unitPrice).toLocaleString("es-AR")}
                                        </span>
                                        {hasDiscount && aj.type === "unit" && (
                                          <span className="text-[10px] text-emerald-600 font-medium">{Math.min(aj.value, item.quantity)} bonificadas</span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => {
                                          setDiscountModalIdx(idx)
                                          setModalAjuste(hasDiscount ? { ...aj } : { value: 0, type: "percent" })
                                          setModalPrice(String(item.unitPrice))
                                          setShowModalDescuento(hasDiscount)
                                        }}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  {/* REMOVE */}
                                  <div className="flex items-center justify-center w-10">
                                    <button
                                      onClick={() => {
                                        setEditItems(prev => prev.filter((_, i) => i !== idx))
                                        setEditAjustes(prev => {
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
                            <div className="grid grid-cols-[50%_25%_25%] min-h-[56px]">
                              <div className="flex items-center gap-3 px-4 py-2 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <Image src={getItemPhoto(display.resolved as any)} alt={item.name} width={32} height={32} className="object-cover" />
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
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-sm text-slate-700 tabular-nums">{item.quantity}</span>
                                  <span className="text-xs text-slate-400">{item.quantity === 1 ? "unidad" : "unidades"}</span>
                                </div>
                                {(item.discount ?? 0) > 0 && item.discountType === "unit" && (
                                  <span className="text-[10px] font-semibold text-green-600 whitespace-nowrap">
                                    ({Math.min(item.discount!, item.quantity)} bonif.)
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col items-center justify-center gap-0.5 py-2">
                                {(item.discount ?? 0) > 0 && item.discountType === "unit" ? (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-slate-700 tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                    <span className="text-xs text-slate-400">c/u</span>
                                  </div>
                                ) : (item.discount ?? 0) > 0 && (item.discountType === "percent" || item.discountType === "fixed") ? (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-slate-400 line-through tabular-nums">${item.unitPrice.toLocaleString("es-AR")}</span>
                                      <span className="text-[10px] font-semibold text-red-500">
                                        {item.discountType === "percent" ? `-${item.discount}%` : `-$${item.discount.toLocaleString("es-AR")}`}
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-sm font-medium text-slate-800 tabular-nums">
                                        ${Math.round(item.discountType === "percent"
                                          ? item.unitPrice * (1 - item.discount / 100)
                                          : Math.max(0, item.unitPrice - item.discount)
                                        ).toLocaleString("es-AR")}
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

                  {/* Agregar productos row — only in edit mode for editable states */}
                  {isEditMode && isEditable && (
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

              </div>{/* end col-span-2 */}

              {/* Right col-span-1: resumen */}
              {ordenItems.length > 0 && (
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
                      <span className="text-sm text-slate-700 tabular-nums mr-1.5">${Math.round(activeSubtotal).toLocaleString("es-AR")}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSubtotalBreakdown ? "rotate-180" : ""}`} />
                    </button>
                    {showSubtotalBreakdown && (
                      <div>
                        {(isEditMode ? editItems : ordenItems).map((item, idx) => {
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
                            lineTotal = item.total
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
                        <div className="-mx-5 w-[calc(100%+2.5rem)] border-b border-slate-100" />
                      </div>
                    )}

                    {/* View-mode global adjustments */}
                    {!isEditMode && viewGlobalDiscount > 0 && (
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">
                          Descuento Global{" "}
                          <span className="text-xs text-slate-400">
                            ({viewGlobalDiscountTipo === "percent" ? `${viewGlobalDiscount}%` : `$${viewGlobalDiscount.toLocaleString("es-AR")}`})
                          </span>
                        </span>
                        <span className="text-sm text-red-500 tabular-nums">−${Math.round(viewGlobalDiscountAmount).toLocaleString("es-AR")}</span>
                      </div>
                    )}
                    {!isEditMode && viewEnvio > 0 && (
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">Envío</span>
                        <span className="text-sm text-slate-700 tabular-nums">+${viewEnvio.toLocaleString("es-AR")}</span>
                      </div>
                    )}
                    {!isEditMode && viewCustomCharges.map((c) => (
                      <div key={c.id} className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500">{c.label}</span>
                        <span className="text-sm text-slate-700 tabular-nums">+${c.value.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                    {!isEditMode && (viewGlobalDiscount > 0 || viewEnvio > 0 || viewCustomCharges.length > 0) && (
                      <hr className="-mx-5 w-[calc(100%+2.5rem)] border-t border-slate-100 border-0" />
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center py-3 mt-1">
                      <span className="text-base font-bold text-slate-900">Total estimado</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        ${Math.round(isEditMode ? activeSubtotal : viewGrandTotal).toLocaleString("es-AR")}
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

      {/* ── Per-item Costo / Descuento Modal ── */}
      {discountModalIdx !== null && (() => {
        const item = editItems[discountModalIdx]
        if (!item) return null
        const display = getVentaItemDisplay(item as any)
        const parsedPrice = parseFloat(modalPrice) || item.unitPrice
        let finalPrice = parsedPrice
        if (modalAjuste.value > 0) {
          if (modalAjuste.type === "percent") finalPrice = parsedPrice * (1 - modalAjuste.value / 100)
          else if (modalAjuste.type === "cash") finalPrice = Math.max(0, parsedPrice - modalAjuste.value)
        }
        return (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={getItemPhoto(display.resolved as any)}
                    alt={display.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{display.name}</p>
                    {display.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {display.marca && <span className="text-xs text-slate-400">{display.marca}</span>}
                    {display.marca && display.categoria && <span className="text-xs text-slate-300">·</span>}
                    {display.categoria && <span className="text-xs text-slate-400">{display.categoria}</span>}
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Costo</label>
                  <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:border-slate-400 transition-colors">
                    <span className="text-slate-400 text-sm mr-1.5">$</span>
                    <input
                      type="number"
                      value={modalPrice}
                      onChange={(e) => setModalPrice(e.target.value)}
                      className="flex-1 text-sm bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {!showModalDescuento && (
                  <button
                    onClick={() => setShowModalDescuento(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + agregar descuento
                  </button>
                )}

                {showModalDescuento && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descuento</label>
                        <button
                          onClick={() => {
                            setShowModalDescuento(false)
                            setModalAjuste({ value: 0, type: "percent" })
                          }}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Quitar descuento"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:border-slate-400 transition-colors flex-1">
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            autoFocus
                            value={modalAjuste.value || ""}
                            onChange={(e) => {
                              let val = parseFloat(e.target.value) || 0
                              if (modalAjuste.type === "unit") val = Math.min(val, item.quantity)
                              setModalAjuste(prev => ({ ...prev, value: val }))
                            }}
                            className="w-full text-sm bg-transparent focus:outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                          {(["percent", "cash", "unit"] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setModalAjuste(prev => ({ ...prev, type: t }))}
                              className={`px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${modalAjuste.type === t ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                            >
                              {t === "percent" ? "% porcentaje" : t === "cash" ? "$ dinero" : "unidades"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {modalAjuste.value > 0 && (
                      <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                        <span className="text-sm font-medium text-slate-600">Costo final</span>
                        <div className="text-right">
                          <span className="text-base font-bold text-slate-900 tabular-nums">
                            ${Math.round(finalPrice).toLocaleString("es-AR")}
                          </span>
                          {modalAjuste.type === "unit" && (
                            <p className="text-[11px] text-emerald-600">{modalAjuste.value} unidades bonificadas</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-6 pb-6">
                <button
                  onClick={() => { setDiscountModalIdx(null); setShowModalDescuento(false) }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const newPrice = parseFloat(modalPrice)
                    if (!isNaN(newPrice) && newPrice >= 0) {
                      setEditItems(prev => prev.map((it, i) => i === discountModalIdx ? { ...it, unitPrice: newPrice } : it))
                    }
                    const ajuste = showModalDescuento ? { ...modalAjuste } : { value: 0, type: "percent" as const }
                    setEditAjustes(prev => ({ ...prev, [discountModalIdx!]: ajuste }))
                    setDiscountModalIdx(null)
                    setShowModalDescuento(false)
                  }}
                  className="px-5 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
        <VentaItemDetailModal ventaItem={viewingItem as any} onClose={() => setViewingItem(null)} />
      )}

      {showProveedorInfoModal && (() => {
        const prov = PROVEEDORES.find(p => {
          const name = p.tipo === "empresa" ? p.razonSocial ?? "" : `${p.nombre} ${p.apellido}`.trim()
          return name === proveedorNombre
        })
        return prov ? <ProveedorModal proveedorId={prov.id} onClose={() => setShowProveedorInfoModal(false)} /> : null
      })()}

      {/* ── Aceptar y llevar a compras Modal ── */}
      {showAceptarModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAceptarModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4 text-slate-700" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Aceptar y llevar a compras</h3>
              </div>
              <p className="text-sm text-slate-500 mt-2 ml-12">
                La orden <span className="font-semibold text-slate-800">{orden.id}</span> se marcará como <span className="font-semibold text-slate-900">aceptada</span> y se creará una nueva compra asociada a la misma.
              </p>
            </div>

            {/* Costo diffs section */}
            {costoDiffs.length > 0 && (
              <div className="px-5 pt-4">
                <div className="border border-amber-200 rounded-xl overflow-hidden">
                  <div className="flex items-start gap-3 px-4 py-3 bg-amber-50">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-amber-800">
                      {costoDiffs.length} {costoDiffs.length === 1 ? "producto tiene" : "productos tienen"} un costo distinto al guardado.
                    </p>
                  </div>
                  <div className="bg-white border-t border-amber-100">
                    <div className="grid grid-cols-[36px_1fr_auto_auto] h-9 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={allCostosSelected}
                          ref={(el) => { if (el) el.indeterminate = someCostosSelected && !allCostosSelected }}
                          onChange={(e) => toggleAllCostos(e.target.checked)}
                          className="w-[14px] h-[14px] rounded border-slate-300 accent-slate-900 cursor-pointer"
                          title="Actualizar costos"
                        />
                      </div>
                      <div className="flex items-center px-3 gap-1.5">
                        <span>Actualizar costos</span>
                        {someCostosSelected && (
                          <span className="normal-case text-[10px] font-normal text-slate-400">
                            ({selectedCostoSkus.size} seleccionado{selectedCostoSkus.size !== 1 ? "s" : ""})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-end px-4 whitespace-nowrap">Costo guardado</div>
                      <div className="flex items-center justify-end px-4 whitespace-nowrap">Nuevo costo</div>
                    </div>
                    {costoDiffs.map((diff) => {
                      const isChecked = selectedCostoSkus.has(diff.sku)
                      return (
                        <div
                          key={diff.sku}
                          className={`grid grid-cols-[36px_1fr_auto_auto] border-b border-slate-100 last:border-b-0 py-2.5 cursor-pointer transition-colors ${isChecked ? "bg-slate-50/70" : "hover:bg-slate-50/40"}`}
                          onClick={() => toggleOneCosto(diff.sku, !isChecked)}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => { e.stopPropagation(); toggleOneCosto(diff.sku, e.target.checked) }}
                              className="w-[14px] h-[14px] rounded border-slate-300 accent-slate-900 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 px-3 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{diff.name}</p>
                            {diff.tags.map((tag, ti) => (
                              <span key={ti} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{tag}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-end px-4">
                            <span className="text-sm text-slate-400 tabular-nums">${diff.savedCosto.toLocaleString("es-AR")}</span>
                          </div>
                          <div className="flex items-center justify-end px-4">
                            <span className={`text-sm font-semibold tabular-nums ${diff.newCosto > diff.savedCosto ? "text-amber-600" : "text-emerald-600"}`}>
                              ${diff.newCosto.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAceptarModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptarYLlevarACompras}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Aceptar y llevar a compras
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ── Eliminar Orden Modal ── */}
      {showEliminarModal && orden && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEliminarModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Eliminar orden de compra</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {"¿Seguro que querés eliminar la orden "}
                <span className="font-semibold text-slate-900">{orden.id}</span>
                {"? Esta acción es irreversible."}
              </p>
            </div>
            <div className="px-5 py-4 flex gap-2 justify-end">
              <button onClick={() => setShowEliminarModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { deleteOrden(orden.id); router.push("/compras/ordenes-de-compra") }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Eliminar orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Agregar Productos Modal ── */}
      {showAgregarProductos && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAgregarProductos} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">

            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Agregar productos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {proveedorNombre ? `Productos de ${proveedorNombre}` : "Selecciona los productos a agregar"}
                </p>
              </div>
              <button onClick={closeAgregarProductos} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-slate-400"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowModalFilters(!showModalFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-full transition-colors ${
                      Object.values(modalFilters).some(v => v)
                        ? "border-slate-900 text-white bg-slate-900"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </button>
                  {showModalFilters && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowModalFilters(false)} />
                      <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-56 p-3 space-y-3">
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{"Categoría"}</label>
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
                    </>
                  )}
                </div>
                <div className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-white">
                  <button
                    onClick={() => setModalSortDirection(d => d === "asc" ? "desc" : "asc")}
                    className="px-2.5 py-2 hover:bg-slate-50 transition-colors border-r border-slate-200"
                    title={modalSortDirection === "asc" ? "Ascendente" : "Descendente"}
                  >
                    <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${modalSortDirection === "desc" ? "rotate-180" : ""}`} />
                  </button>
                  <select
                    value={modalSort}
                    onChange={(e) => setModalSort(e.target.value as "name" | "precio" | "stock")}
                    className="appearance-none pl-2.5 pr-7 py-2 text-sm bg-transparent focus:outline-none cursor-pointer text-slate-700"
                  >
                    <option value="name">Nombre</option>
                    <option value="precio">Costo</option>
                    <option value="stock">Stock</option>
                  </select>
                </div>
              </div>
            </div>

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
                <div className="flex items-center justify-end pr-6">Costo</div>
              </div>
            </div>

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
                            <Image src={getItemPhoto(item)} alt={item.name} width={36} height={36} className="w-full h-full object-cover" />
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
                          {!isParent && (() => {
                            const disp = parseInt(item.stock?.disponible || "0")
                            return disp > 0
                              ? <span className="text-sm text-slate-600 tabular-nums">{disp} <span className="text-xs text-slate-400">disponibles</span></span>
                              : <span className="text-xs text-slate-400">sin stock</span>
                          })()}
                        </div>
                        <div className="flex items-center justify-end pr-6">
                          {!isParent && <span className="text-sm font-medium text-slate-800">${(item.precio?.precioFinal || 0).toLocaleString("es-AR")}</span>}
                        </div>
                      </div>

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
                                <Image src={getItemPhoto((variant as any).media ? variant as any : item)} alt={variant.name || item.name} width={32} height={32} className="w-full h-full object-cover" />
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
                              {(() => {
                                const disp = parseInt(variant.stock?.disponible || "0")
                                return disp > 0
                                  ? <span className="text-sm text-slate-600 tabular-nums">{disp} <span className="text-xs text-slate-400">disponibles</span></span>
                                  : <span className="text-xs text-slate-400">sin stock</span>
                              })()}
                            </div>
                            <div className="flex items-center justify-end pr-6">
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

            <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-slate-500">
                {selectedModalCount > 0
                  ? `${selectedModalCount} producto${selectedModalCount > 1 ? "s" : ""} seleccionado${selectedModalCount > 1 ? "s" : ""}`
                  : "Seleccioná productos para agregar"}
              </span>
              <button
                onClick={handleConfirmAgregarProductos}
                disabled={selectedModalCount === 0}
                className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Agregar seleccionados
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
