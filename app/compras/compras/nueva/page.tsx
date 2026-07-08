"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  CheckCircle2,
  ChevronDown,
  Truck,
  Package,
  Plus,
  Minus,
  Search,
  Check,
  X,
  ClipboardCheck,
  Filter,
  ArrowUpDown,
  Pencil,
  ShoppingCart,
  FileText,
  Wallet,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

import { PROVEEDORES } from "@/lib/data/proveedores"

import { useCompras } from "@/hooks/use-compras"
import { useItems } from "@/hooks/use-items"
import { useSettings } from "@/lib/contexts/settings-context"
import { getItemPhoto } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import type { ItemVariant, VentaItem, VentaCustomCharge, PaymentMethod } from "@/lib/types"

const STEPS = [
  { id: 1, label: "Proveedor" },
  { id: 2, label: "Productos" },
  { id: 3, label: "Recepción y Pago" },
  { id: 4, label: "Confirmación" },
]

type RecepcionMode = "en_el_acto" | "diferida"
type PagoMode = "en_el_acto" | "diferida"

const medioPagoLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  posnet: "Posnet",
  transferencia: "Transferencia",
  no_especificado: "No especificado",
  anulacion: "Anulación",
}

const medioPagoIcons: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  posnet: CreditCard,
  transferencia: ArrowRightLeft,
  no_especificado: Wallet,
  anulacion: Wallet,
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function getTodayDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getNowTimeStr() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Look up the saved costo for an item SKU from the live catalog
function getSavedCosto(sku: string, catalog: any[]): number | null {
  for (const item of catalog) {
    if (item.hasVariants && item.variants) {
      for (const v of item.variants) {
        const vSku = `${item.skuPrefix}-${(v as ItemVariant).skuSuffix}`
        if (vSku === sku) return (v as ItemVariant).precio?.costo ?? null
      }
    } else {
      if ((item.sku || item.id) === sku) return item.precio?.costo ?? null
    }
  }
  return null
}

export default function NuevaCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave } = useSidebar()
  const { addCompra, compras } = useCompras()
  const { items: catalogItems, increaseStock, updatePricing } = useItems()
  const { precios: preciosSettings } = useSettings()
  const stepsContainerRef = useRef<HTMLDivElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1)

  // Step 1: Proveedor
  const [proveedorId, setProveedorId] = useState<string | null>(null)
  const [proveedorSearch, setProveedorSearch] = useState("")

  // Step 2: Productos
  const [selectedItems, setSelectedItems] = useState<VentaItem[]>([])
  const [editAjustes, setEditAjustes] = useState<Record<number, { value: number; type: "percent" | "cash" | "unit" }>>({})
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)
  const [discountModalIdx, setDiscountModalIdx] = useState<number | null>(null)
  const [modalAjuste, setModalAjuste] = useState<{ value: number; type: "percent" | "cash" | "unit" }>({ value: 0, type: "percent" })
  const [modalPrice, setModalPrice] = useState<string>("")
  const [showModalDescuento, setShowModalDescuento] = useState(false)

  // Agregar productos modal state
  const [modalSearch, setModalSearch] = useState("")
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio" | "stock">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)

  // Resumen sidebar
  const [showProductosBreakdown, setShowProductosBreakdown] = useState(false)
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" }>({ value: 0, type: "percent" })
  const [showEnvio, setShowEnvio] = useState(false)
  const [envioAmount, setEnvioAmount] = useState(0)
  const [customCharges, setCustomCharges] = useState<VentaCustomCharge[]>([])

  // Step 3: Recepción
  const [recepcionMode, setRecepcionMode] = useState<RecepcionMode>("en_el_acto")
  const [showRecepcionInicialModal, setShowRecepcionInicialModal] = useState(false)
  const [recepcionInicialEntries, setRecepcionInicialEntries] = useState<Array<{
    sku: string; name: string; categoria?: string; quantity: number; max: number; date: string; editingDate: boolean
  }>>([])
  const [recepcionModalSelected, setRecepcionModalSelected] = useState<{ [sku: string]: boolean }>({})
  const [recepcionModalQtys, setRecepcionModalQtys] = useState<{ [sku: string]: string }>({})

  // Step 3: Pago
  const [pagoMode, setPagoMode] = useState<PagoMode>("en_el_acto")
  const [medioPago, setMedioPago] = useState<PaymentMethod>("efectivo")
  const [showPagoInicialModal, setShowPagoInicialModal] = useState(false)
  const [pagoInicialEntries, setPagoInicialEntries] = useState<Array<{
    id: number; monto: string; medioPago: PaymentMethod; date: string; editingDate: boolean
  }>>([])
  const [pagoModalMonto, setPagoModalMonto] = useState("")
  const [pagoModalMedio, setPagoModalMedio] = useState<PaymentMethod>("efectivo")
  const [pagoModalFecha, setPagoModalFecha] = useState(getTodayDateStr())

  // Step 4: Costo diff — per-item selection (Set of SKUs to update)
  const [costoDiffs, setCostoDiffs] = useState<Array<{ sku: string; name: string; tags: string[]; savedCosto: number; newCosto: number }>>([])
  const [selectedCostoSkus, setSelectedCostoSkus] = useState<Set<string>>(new Set())

  // Derived: all selected = select-all checkbox state
  const allCostosSelected = costoDiffs.length > 0 && costoDiffs.every(d => selectedCostoSkus.has(d.sku))
  const someCostosSelected = costoDiffs.some(d => selectedCostoSkus.has(d.sku))

  const toggleAllCostos = (checked: boolean) => {
    setSelectedCostoSkus(checked ? new Set(costoDiffs.map(d => d.sku)) : new Set())
  }
  const toggleOneCosto = (sku: string, checked: boolean) => {
    setSelectedCostoSkus(prev => {
      const next = new Set(prev)
      if (checked) next.add(sku)
      else next.delete(sku)
      return next
    })
  }

  // Creation state
  const [isCreating, setIsCreating] = useState(false)
  const [createdCompraId, setCreatedCompraId] = useState<string | null>(null)

  // Duplicar compra: prefill from existing and jump to step 3
  useEffect(() => {
    const duplicarId = searchParams.get("duplicar")
    if (!duplicarId || compras.length === 0) return
    const source = compras.find((c) => c.id === duplicarId)
    if (!source) return

    setProveedorId(source.proveedorId)

    const prefillItems: VentaItem[] = source.items.map((it) => ({
      sku: it.sku,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: it.discount,
      discountType: it.discountType as "percent" | "fixed",
      total: it.total,
      categoria: it.categoria,
    }))
    setSelectedItems(prefillItems)

    const ajustes: Record<number, { value: number; type: "percent" | "cash" | "unit" }> = {}
    source.items.forEach((it, idx) => {
      if (it.discount && it.discount !== 0) {
        ajustes[idx] = {
          value: it.discount,
          type: it.discountType === "fixed" ? "cash" : "percent",
        }
      }
    })
    setEditAjustes(ajustes)

    if (source.descuento && source.descuento !== 0) {
      setGlobalDiscount({ value: source.descuento, type: source.descuentoTipo === "fixed" ? "cash" : "percent" })
      setShowGlobalDiscount(true)
    }
    if (source.envio && source.envio > 0) {
      setEnvioAmount(source.envio)
      setShowEnvio(true)
    }
    if (source.customCharges && source.customCharges.length > 0) {
      setCustomCharges(source.customCharges)
    }

    setCurrentStep(3)
    setMaxUnlockedStep(3)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compras.length])

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Compras", href: "/compras/compras" },
    { label: "Nueva Compra" },
  ]

  // ── Derived ───────────────────────────────────────────────
  const proveedor = useMemo(() => PROVEEDORES.find(p => p.id === proveedorId) ?? null, [proveedorId])

  const proveedorNombre = !proveedor
    ? "Sin proveedor"
    : proveedor.tipo === "empresa"
    ? proveedor.razonSocial ?? ""
    : `${proveedor.nombre} ${proveedor.apellido}`.trim()

  const total = useMemo(() => {
    return selectedItems.reduce((sum, it, idx) => {
      const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
      let lineTotal = 0
      if (aj.value > 0) {
        if (aj.type === "unit") {
          lineTotal = Math.max(0, it.quantity - Math.min(aj.value, it.quantity)) * it.unitPrice
        } else {
          const adjUnit = aj.type === "percent"
            ? it.unitPrice * (1 - aj.value / 100)
            : Math.max(0, it.unitPrice - aj.value)
          lineTotal = it.quantity * adjUnit
        }
      } else {
        lineTotal = it.unitPrice * it.quantity
      }
      return sum + lineTotal
    }, 0)
  }, [selectedItems, editAjustes])

  const filteredProveedores = useMemo(() => {
    const q = proveedorSearch.trim().toLowerCase()
    return PROVEEDORES.filter((p) => {
      if (!q) return true
      const name = p.tipo === "empresa"
        ? p.razonSocial ?? ""
        : `${p.nombre} ${p.apellido}`.trim()
      return name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    })
  }, [proveedorSearch])

  // ── Modal derived ─────────────────────────────────────────
  const allModalItems = useMemo(
    () => catalogItems.filter((item: any) => item.proveedor === proveedorNombre),
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
        const text = [item.name, item.sku, item.marca, item.categoria].filter(Boolean).join(" ").toLowerCase()
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

  const getModalSelectionState = (item: any, isChild = false): { checked: boolean; indeterminate: boolean } => {
    if (!isChild && item.hasVariants && item.variants?.length) {
      const childIds = item.variants.map((v: any) => getModalItemId(v)).filter(Boolean)
      const all = childIds.every((id: string) => selectedModalItems[id])
      const some = childIds.some((id: string) => selectedModalItems[id])
      return { checked: all, indeterminate: some && !all }
    }
    const id = getModalItemId(item)
    return { checked: !!selectedModalItems[id], indeterminate: false }
  }

  const handleModalItemSelection = (item: any, isChild = false) => {
    if (!isChild && item.hasVariants && item.variants?.length) {
      const childIds = item.variants.map((v: any) => getModalItemId(v)).filter(Boolean)
      const allSel = childIds.every((id: string) => selectedModalItems[id])
      setSelectedModalItems(prev => {
        const next = { ...prev }
        childIds.forEach((id: string) => { next[id] = !allSel })
        return next
      })
    } else {
      const id = getModalItemId(item)
      if (id) setSelectedModalItems(prev => ({ ...prev, [id]: !prev[id] }))
    }
  }

  const handleSelectAllModal = () => {
    const shouldSelect = !modalSelectAllActive
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
    const newItems: VentaItem[] = []
    for (const item of allModalItems) {
      const isParent = item.hasVariants && item.variants && item.variants.length > 0
      if (isParent) {
        for (const variant of item.variants!) {
          const id = (variant as ItemVariant).id || `${item.skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          if (!selectedModalItems[id]) continue
          const sku = `${item.skuPrefix}-${(variant as ItemVariant).skuSuffix}`
          const unitPrice = (variant as ItemVariant).precio?.costo || 0
          if (selectedItems.findIndex(it => it.sku === sku) >= 0) continue
          newItems.push({
            sku,
            name: `${item.name}${(variant as ItemVariant).atributosPrincipales?.length ? " · " + (variant as ItemVariant).atributosPrincipales!.map(a => a.value).join(" · ") : ""}`,
            quantity: 1,
            unitPrice,
            discount: 0,
            discountType: "percent",
            total: unitPrice,
            categoria: (variant as any).categoria || item.categoria,
          })
        }
      } else {
        const id = item.id || item.sku || item.name
        if (!selectedModalItems[id]) continue
        const sku = item.sku || id
        if (selectedItems.findIndex(it => it.sku === sku) >= 0) continue
        const unitPrice = item.precio?.costo || 0
        newItems.push({
          sku,
          name: item.name,
          quantity: 1,
          unitPrice,
          discount: 0,
          discountType: "percent",
          total: unitPrice,
          categoria: item.categoria,
        })
      }
    }
    setSelectedItems(prev => [...prev, ...newItems])
    closeAgregarProductos()
  }

  // ── Totals ───────────────────────────────────────────────
  const globalDiscountAmount = useMemo(() => {
    if (!showGlobalDiscount || globalDiscount.value === 0) return 0
    return globalDiscount.type === "percent"
      ? total * (globalDiscount.value / 100)
      : globalDiscount.value
  }, [showGlobalDiscount, globalDiscount, total])

  const grandTotal = useMemo(() => {
    return total - globalDiscountAmount + (showEnvio ? envioAmount : 0) + customCharges.reduce((s, c) => s + c.value, 0)
  }, [total, globalDiscountAmount, showEnvio, envioAmount, customCharges])

  const canAdvance = useMemo(() => {
    if (currentStep === 1) return proveedorId !== null
    if (currentStep === 2) return selectedItems.length > 0
    if (currentStep === 3) return true
    if (currentStep === 4) return true
    return false
  }, [currentStep, proveedorId, selectedItems])

  // ── Compute costo diffs when entering step 4 ─────────────
  const computeCostoDiffs = () => {
    const diffs: typeof costoDiffs = []
    for (const item of selectedItems) {
      const saved = getSavedCosto(item.sku, catalogItems)
      if (saved !== null && saved !== item.unitPrice) {
        const display = getVentaItemDisplay(item)
        diffs.push({
          sku: item.sku,
          name: display.name,
          tags: display.tags,
          savedCosto: saved,
          newCosto: item.unitPrice,
        })
      }
    }
    setCostoDiffs(diffs)
    setSelectedCostoSkus(new Set())
  }

  const goToConfirmacion = () => {
    computeCostoDiffs()
    setMaxUnlockedStep(s => Math.max(s, 4))
    setCurrentStep(4)
  }

  // Also recompute when user clicks the Confirmación step in the stepper
  const handleStepClick = (stepId: number) => {
    if (stepId > maxUnlockedStep) return
    if (stepId === 4) {
      computeCostoDiffs()
    }
    setCurrentStep(stepId)
  }

  // ── Create ────────────────────────────────────────────────
  const handleCreate = () => {
    if (!proveedor) return
    setIsCreating(true)
    try {
      const fecha = getTodayDateStr()
      const hora = getNowTimeStr()

      const items = selectedItems.map((it, idx) => {
        const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
        let lineTotal = 0
        if (aj.value > 0) {
          if (aj.type === "unit") {
            lineTotal = Math.max(0, it.quantity - Math.min(aj.value, it.quantity)) * it.unitPrice
          } else {
            const adjUnit = aj.type === "percent"
              ? it.unitPrice * (1 - aj.value / 100)
              : Math.max(0, it.unitPrice - aj.value)
            lineTotal = it.quantity * adjUnit
          }
        } else {
          lineTotal = it.unitPrice * it.quantity
        }
        return {
          sku: it.sku,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: aj.value,
          discountType: (aj.type === "percent" ? "percent" : aj.type === "unit" ? "unit" : "fixed") as "percent" | "fixed" | "unit",
          total: Math.round(lineTotal),
          categoria: it.categoria,
        }
      })

      const subtotal = items.reduce((s, it) => s + it.total, 0)
      const compraTotal = Math.round(grandTotal)

      // Recepcion items
      const recepcionItems = recepcionMode === "en_el_acto"
        ? items.map(it => ({ sku: it.sku, quantityRecepcionada: it.quantity }))
        : recepcionInicialEntries.map(en => ({ sku: en.sku, quantityRecepcionada: en.quantity }))

      // Recepcion entries
      const recepcionEntries = recepcionMode === "en_el_acto"
        ? [{ id: `REC-${Date.now()}`, fecha, hora, items: items.map(it => ({ sku: it.sku, quantity: it.quantity })) }]
        : recepcionInicialEntries.length > 0
          ? recepcionInicialEntries.reduce<Array<{ id: string; fecha: string; hora: string; items: { sku: string; quantity: number }[] }>>((acc, en) => {
              const existing = acc.find(e => e.fecha === en.date)
              if (existing) {
                existing.items.push({ sku: en.sku, quantity: en.quantity })
              } else {
                acc.push({ id: `REC-${Date.now()}-${en.sku}`, fecha: en.date, hora, items: [{ sku: en.sku, quantity: en.quantity }] })
              }
              return acc
            }, [])
          : []

      // Pagos
      const pagos = pagoMode === "en_el_acto"
        ? [{ id: `PAG-${Date.now()}`, fecha, hora, medioPago, monto: compraTotal }]
        : pagoInicialEntries.length > 0
          ? pagoInicialEntries.map((en, i) => ({
              id: `PAG-${Date.now()}-${i}`,
              fecha: en.date,
              hora,
              medioPago: en.medioPago,
              monto: Number(en.monto),
            }))
          : []

      // Determine estado: finalizada if recepción is fully covered and pago is fully covered
      const totalQty = items.reduce((s, it) => s + it.quantity, 0)
      const recepcionadoQty = recepcionItems.reduce((s, ri) => s + ri.quantityRecepcionada, 0)
      const totalPagado = pagos.reduce((s, p) => s + p.monto, 0)
      const isRecepcionCompleta = recepcionadoQty >= totalQty
      const isPagoCompleto = totalPagado >= compraTotal
      const estado = (isRecepcionCompleta && isPagoCompleto) ? "finalizada" : "en_curso"

      const created = addCompra({
        fecha,
        hora,
        proveedorId: proveedor.id,
        proveedorNombre,
        items,
        subtotal,
        descuento: showGlobalDiscount ? globalDiscount.value : 0,
        descuentoTipo: globalDiscount.type === "cash" ? "fixed" : "percent",
        envio: showEnvio && envioAmount > 0 ? envioAmount : 0,
        customCharges: customCharges.filter(c => c.value > 0),
        total: compraTotal,
        recepcionItems,
        recepcionEntries,
        pagos,
        estado,
        comprador: "Admin",
        origen: "manual",
        devolucionItems: [],
        devolucionEntries: [],
      })

      // Increase stock for every recepcionada unit
      for (const ri of recepcionItems) {
        if (ri.quantityRecepcionada > 0) {
          increaseStock(ri.sku, ri.quantityRecepcionada)
        }
      }

      // Update costo in lista de precios for selected SKUs
      for (const diff of costoDiffs) {
        if (selectedCostoSkus.has(diff.sku)) {
          updatePricing(diff.sku, { costo: diff.newCosto }, undefined, preciosSettings.costoBehavior)
        }
      }

      setCreatedCompraId(created.id)
    } catch (err) {
      console.error("[v0] Error creando compra:", err)
      alert("Error al crear la compra. Intenta nuevamente.")
    } finally {
      setIsCreating(false)
    }
  }

  // ── Success view ──────────────────────────────────────────
  if (createdCompraId) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)]">
        <div className="flex h-screen">
          <div className="relative h-screen sticky top-0 z-[100003]">
            <Sidebar
              sidebarItems={SIDEBAR_ITEMS}
              bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
              hoveredDropdown={hoveredDropdown}
              onDropdownOpen={handleDropdownMouseEnter}
              onDropdownClose={handleDropdownMouseLeave}
            />
          </div>
          <div className="flex-1 flex flex-col bg-white h-screen overflow-hidden relative z-10">
            <div className="relative h-[44px] bg-white">
              <div className="px-8 h-full flex items-center justify-between">
                <Breadcrumb items={breadcrumbs} />
                                <UserPanel />
              </div>
            </div>
            <main className="flex-1 flex items-center justify-center bg-[rgba(250,251,253,1)]">
              <div className="p-8 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)] max-w-md w-full">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Compra Creada</h2>
                  <p className="text-sm text-gray-400 font-mono mb-2">{createdCompraId}</p>
                  <p className="text-gray-500 mb-8">{proveedorNombre}</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push(`/compras/compras/${createdCompraId}`)}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Ver Compra
                    </button>
                    <button
                      onClick={() => router.push("/compras/compras")}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Volver a Compras
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // ── Main view ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="flex h-screen">
        <div className="relative h-screen sticky top-0 z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white h-screen overflow-hidden relative z-10">
          {/* Header */}
          <div className="relative h-[44px] bg-white z-[100004]">
            <div className="px-8 h-full flex items-center justify-between">
              <Breadcrumb items={breadcrumbs} />
                            <div className="flex items-center gap-2 min-w-[280px] justify-end" />
            </div>
          </div>

          {/* Main Steps Layout */}
          <main
            className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden"
            ref={stepsContainerRef}
          >
            <div
              className="w-full h-full grid"
              style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}
            >
              {/* Left: Stepper */}
              <div className="col-span-4 bg-transparent p-6 flex flex-col">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Nueva Compra</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{proveedorNombre}</p>
                  </div>
                  <button
                    onClick={() => router.push("/compras/compras")}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0 -mr-1 -mt-0.5"
                    aria-label="Cancelar y volver"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col">
                  {STEPS.map((step, index) => {
                    const isDisabled = step.id > maxUnlockedStep
                    return (
                      <div key={step.id} className="flex items-start">
                        <div className="flex flex-col items-center mr-3">
                          <div
                            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                              isDisabled
                                ? "bg-gray-100 border-gray-200 opacity-50"
                                : currentStep === step.id
                                ? "bg-blue-500 border-blue-500 shadow-md shadow-blue-200"
                                : currentStep > step.id
                                ? "bg-green-500 border-green-500"
                                : "bg-white border-gray-300"
                            }`}
                          />
                          {index < STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-20 transition-all duration-300 ${
                                currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pb-20">
                          <button
                            onClick={() => handleStepClick(step.id)}
                            disabled={isDisabled}
                            className={`text-left transition-all duration-200 ${
                              isDisabled
                                ? "text-gray-300 font-medium cursor-not-allowed"
                                : currentStep === step.id
                                ? "text-blue-600 font-semibold cursor-pointer"
                                : currentStep > step.id
                                ? "text-green-600 font-medium cursor-pointer"
                                : "text-gray-400 font-medium hover:text-gray-600 cursor-pointer"
                            }`}
                          >
                            <span className="text-xs uppercase tracking-wider">{step.label}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right: Step Content */}
              <div className={`col-span-16 overflow-auto p-8 ${currentStep === 2 ? "pr-8" : "pr-[15%]"}`}>

                {/* ── Step 1: Proveedor ── */}
                {currentStep === 1 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Proveedor</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 italic">
                      Selecciona el proveedor para esta compra.
                    </p>

                    {proveedor !== null ? (
                      <div className="inline-flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl max-w-full">
                        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-white">
                            {proveedorNombre.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Proveedor</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{proveedorNombre}</p>
                        </div>
                        <button
                          onClick={() => {
                            setProveedorId(null)
                            setProveedorSearch("")
                            setSelectedItems([])
                            setEditAjustes({})
                            setMaxUnlockedStep(1)
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-1"
                          title="Cambiar proveedor"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 mb-3">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            value={proveedorSearch}
                            onChange={(e) => setProveedorSearch(e.target.value)}
                            placeholder="Buscar proveedor..."
                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                            autoFocus
                          />
                          {proveedorSearch && (
                            <button onClick={() => setProveedorSearch("")} className="text-slate-400 hover:text-slate-600">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                          <div className="divide-y divide-slate-50">
                            {filteredProveedores.map((p) => {
                              const name = p.tipo === "empresa"
                                ? p.razonSocial ?? ""
                                : `${p.nombre} ${p.apellido}`.trim()
                              const initials = name.slice(0, 2).toUpperCase()
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    if (proveedorId && proveedorId !== p.id) {
                                      setSelectedItems([])
                                      setEditAjustes({})
                                    }
                                    setProveedorId(p.id)
                                    setMaxUnlockedStep(s => Math.max(s, 2))
                                    setCurrentStep(2)
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-semibold text-white">{initials}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                                    <p className="text-xs text-slate-400">
                                      {p.tipo === "empresa" ? "Empresa" : "Particular"} · {p.condicionIva}
                                    </p>
                                  </div>
                                </button>
                              )
                            })}

                            {filteredProveedores.length === 0 && (
                              <div className="py-8 flex flex-col items-center gap-2">
                                <p className="text-sm text-slate-400">Sin resultados</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {proveedor && (
                      <div className="flex items-center justify-end mt-6 pt-6 border-t border-slate-100">
                        <button
                          onClick={() => { setMaxUnlockedStep(s => Math.max(s, 2)); setCurrentStep(2) }}
                          className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                        >
                          Continuar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step 2: Productos + Resumen ── */}
                {currentStep === 2 && (
                  <div className="p-6 border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)]">
                  <div className="flex gap-5 items-start w-full">
                  {/* Products card */}
                  <div className="w-[60%] min-w-0 bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-6 pt-6 pb-4 border-b border-slate-100">
                      <Package className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Productos</h3>
                    </div>

                    {selectedItems.length > 0 && (
                      <div className="grid grid-cols-[2fr_0.8fr_1fr_auto] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                        <div className="flex items-center px-4">Item</div>
                        <div className="flex items-center justify-center">Cantidad</div>
                        <div className="flex items-center justify-center">Costo</div>
                        <div className="w-10" />
                      </div>
                    )}

                    {selectedItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-6">
                        <Package className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-slate-500 mb-1">Sin productos</p>
                        <p className="text-xs text-slate-400 mb-4">Agrega al menos un producto para continuar</p>
                        <button
                          type="button"
                          onClick={() => setShowAgregarProductos(true)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-slate-500" />
                          Agregar productos
                        </button>
                      </div>
                    ) : (
                      selectedItems.map((item, idx) => {
                        const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                        const hasDiscount = aj.value > 0
                        const display = getVentaItemDisplay(item)

                        let adjUnitPrice = item.unitPrice
                        if (hasDiscount) {
                          if (aj.type === "percent") adjUnitPrice = item.unitPrice * (1 - aj.value / 100)
                          else if (aj.type === "cash") adjUnitPrice = Math.max(0, item.unitPrice - aj.value)
                        }

                        return (
                          <div key={item.sku} className="grid grid-cols-[2fr_0.8fr_1fr_auto] min-h-[72px] border-b border-slate-100 last:border-b-0">
                            <div className="flex items-center gap-3 px-4 py-3">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                  src={getItemPhoto(display.resolved as any)}
                                  alt={display.name}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm font-medium text-gray-900 break-words leading-tight">{display.name}</p>
                                  {display.tags.length > 0 && display.tags.map((tag, ti) => (
                                    <span key={ti} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 whitespace-nowrap">{tag}</span>
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
                                <button
                                  onClick={() => setSelectedItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))}
                                  className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity || ""}
                                  onChange={(e) => setSelectedItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                                  className="w-10 text-center text-sm py-1 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() => setSelectedItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))}
                                  className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1">
                              <div className="flex items-center gap-1.5">
                                <div className="flex flex-col items-end">
                                  {hasDiscount && (aj.type === "percent" || aj.type === "cash") && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] text-slate-400 line-through tabular-nums">
                                        ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                      </span>
                                      <span className="text-[10px] text-red-500 font-medium">
                                        {aj.type === "percent" ? `-${aj.value}%` : `-$${aj.value.toLocaleString("es-AR")}`}
                                      </span>
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
                                    setModalAjuste(hasDiscount ? { ...aj } : { value: 0, type: "percent" })
                                    setModalPrice(String(item.unitPrice))
                                    setShowModalDescuento(hasDiscount)
                                    setDiscountModalIdx(idx)
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
                                  setSelectedItems(prev => prev.filter((_, i) => i !== idx))
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
                      })
                    )}

                    {selectedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAgregarProductos(true)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-100"
                      >
                        <Plus className="w-4 h-4 text-slate-400" />
                        Agregar productos
                      </button>
                    )}

                    <div className="px-6 pb-6" />
                  </div>

                  {/* Resumen card */}
                  <div className="w-[40%] shrink-0 sticky top-0 bg-white border border-slate-200/60 rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Resumen</h3>
                    </div>

                    {selectedItems.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Sin productos aún</p>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowProductosBreakdown(v => !v)}
                          className="flex items-center py-3 border-b border-slate-100 text-left hover:bg-slate-50/50 transition-colors -mx-5 px-5 w-[calc(100%+2.5rem)]"
                        >
                          <span className="text-sm text-slate-500 flex-1">Productos</span>
                          <span className="text-sm text-slate-700 tabular-nums mr-1.5">${Math.round(total).toLocaleString("es-AR")}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProductosBreakdown ? "rotate-180" : ""}`} />
                        </button>

                        {showProductosBreakdown && (
                          <div>
                            {selectedItems.map((it, idx) => {
                              const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                              const display = getVentaItemDisplay(it)
                              let lineTotal = 0
                              if (aj.value > 0) {
                                if (aj.type === "unit") {
                                  lineTotal = Math.max(0, it.quantity - Math.min(aj.value, it.quantity)) * it.unitPrice
                                } else {
                                  const adjUnit = aj.type === "percent"
                                    ? it.unitPrice * (1 - aj.value / 100)
                                    : Math.max(0, it.unitPrice - aj.value)
                                  lineTotal = it.quantity * adjUnit
                                }
                              } else {
                                lineTotal = it.unitPrice * it.quantity
                              }
                              return (
                                <div key={it.sku} className="flex justify-between items-center gap-2 py-2.5 -mx-5 px-5">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-sm text-slate-600 font-light leading-tight">{display.name}</p>
                                      {display.tags.map((tag, ti) => (
                                        <span key={ti} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{tag}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm font-light text-slate-700 tabular-nums shrink-0">${Math.round(lineTotal).toLocaleString("es-AR")}</p>
                                </div>
                              )
                            })}
                            <div className="-mx-5 w-[calc(100%+2.5rem)] border-b border-slate-100" />
                          </div>
                        )}

                        <div className="space-y-2 mt-1.5">
                          {showGlobalDiscount && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => { setShowGlobalDiscount(false); setGlobalDiscount({ value: 0, type: "percent" }) }}
                                  className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-light text-slate-500">Descuento global</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={globalDiscount.value || ""}
                                  onChange={(e) => setGlobalDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                  className="w-14 text-right text-sm px-1.5 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="flex border border-slate-200 rounded overflow-hidden">
                                  <button onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "cash" }))} className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "cash" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>$</button>
                                  <button onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "percent" }))} className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "percent" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}>%</button>
                                </div>
                              </div>
                            </div>
                          )}

                          {showEnvio && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setShowEnvio(false); setEnvioAmount(0) }} className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-light text-slate-500">Envío</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-slate-400">$</span>
                                <input
                                  type="number"
                                  value={envioAmount || ""}
                                  onChange={(e) => setEnvioAmount(parseFloat(e.target.value) || 0)}
                                  className="w-16 text-right text-sm px-1.5 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </div>
                          )}

                          {customCharges.map((charge, cidx) => (
                            <div key={charge.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => setCustomCharges(prev => prev.filter((_, i) => i !== cidx))} className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                                <input
                                  type="text"
                                  value={charge.label}
                                  onChange={(e) => setCustomCharges(prev => prev.map((c, i) => i === cidx ? { ...c, label: e.target.value } : c))}
                                  className="text-sm font-light text-slate-500 bg-transparent border-none outline-none w-24"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-slate-400">$</span>
                                <input
                                  type="number"
                                  value={charge.value || ""}
                                  onChange={(e) => setCustomCharges(prev => prev.map((c, i) => i === cidx ? { ...c, value: parseFloat(e.target.value) || 0 } : c))}
                                  className="w-16 text-right text-sm px-1.5 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {(!showGlobalDiscount || !showEnvio || customCharges.length === 0) && (
                          <div className="flex items-center gap-2 flex-wrap pt-3 mt-1">
                            <span className="text-xs text-slate-400">Agregar:</span>
                            {!showGlobalDiscount && (
                              <button onClick={() => setShowGlobalDiscount(true)} className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                                Descuento
                              </button>
                            )}
                            {!showEnvio && (
                              <button onClick={() => setShowEnvio(true)} className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                                Envío
                              </button>
                            )}
                            {customCharges.length === 0 && (
                              <button onClick={() => setCustomCharges([{ id: Date.now(), label: "Otro", value: 0 }])} className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                                Otro
                              </button>
                            )}
                          </div>
                        )}

                        {(showGlobalDiscount || showEnvio || customCharges.length > 0) && (
                          <div className="-mx-5 w-[calc(100%+2.5rem)] border-b border-slate-100 mt-1" />
                        )}

                        <div className="flex justify-between items-center pt-3 mt-1">
                          <span className="text-sm font-bold text-slate-900">Total</span>
                          <span className="text-sm font-bold text-slate-900 tabular-nums">${Math.round(grandTotal).toLocaleString("es-AR")}</span>
                        </div>
                      </>
                    )}
                  </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      onClick={() => { setMaxUnlockedStep(s => Math.max(s, 3)); setCurrentStep(3) }}
                      disabled={!canAdvance}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar
                    </button>
                  </div>
                  </div>
                )}

                {/* ── Step 3: Recepción y Pago ── */}
                {currentStep === 3 && (
                  <div className="p-6 border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)]">
                    <div className="grid grid-cols-2 gap-5 mb-6">

                      {/* Recepción card */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-slate-500" />
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Recepción</h3>
                        </div>

                        <div className="relative mb-3">
                          <select
                            value={recepcionMode}
                            onChange={(e) => setRecepcionMode(e.target.value as RecepcionMode)}
                            className="w-full appearance-none px-3 py-2.5 pr-8 border border-slate-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:border-slate-400 cursor-pointer text-slate-700"
                          >
                            <option value="en_el_acto">En el acto</option>
                            <option value="diferida">Diferida</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 ${recepcionMode === "en_el_acto" ? "bg-emerald-50 border border-emerald-100" : "bg-orange-50 border border-orange-100"}`}>
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${recepcionMode === "en_el_acto" ? "bg-emerald-500" : "bg-orange-400"}`} />
                          <div>
                            <p className={`text-sm font-medium ${recepcionMode === "en_el_acto" ? "text-emerald-700" : "text-orange-600"}`}>
                              {recepcionMode === "en_el_acto" ? "En el acto" : "Diferida"}
                            </p>
                            <p className={`text-xs mt-0.5 ${recepcionMode === "en_el_acto" ? "text-emerald-600" : "text-orange-500"}`}>
                              {recepcionMode === "en_el_acto"
                                ? "Los productos se reciben en el momento de la compra."
                                : "La compra queda pendiente de recepción de forma parcial o total."}
                            </p>
                          </div>
                        </div>

                        {recepcionMode === "diferida" && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">
                              Recepción inicial <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                            </p>

                            {recepcionInicialEntries.length > 0 && (() => {
                              const totalUnits = recepcionInicialEntries.reduce((s, e) => s + e.quantity, 0)
                              const firstEntry = recepcionInicialEntries[0]
                              const dateLabel = new Date(firstEntry.date + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
                              const isEditing = firstEntry.editingDate
                              return (
                                <div className="flex items-center group border-b border-slate-100 last:border-0 mb-1">
                                  <div className="flex-1 flex items-center gap-2 py-1.5">
                                    {isEditing ? (
                                      <input
                                        type="date"
                                        max={getTodayDateStr()}
                                        value={firstEntry.date}
                                        autoFocus
                                        onChange={(e) => setRecepcionInicialEntries(prev => prev.map(en => ({ ...en, date: e.target.value })))}
                                        onBlur={() => setRecepcionInicialEntries(prev => prev.map(en => ({ ...en, editingDate: false })))}
                                        className="text-xs px-2 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-white"
                                      />
                                    ) : (
                                      <button
                                        onClick={() => setRecepcionInicialEntries(prev => prev.map(en => ({ ...en, editingDate: true })))}
                                        className="text-xs text-slate-400 tabular-nums hover:text-slate-600 transition-colors cursor-pointer"
                                      >
                                        {dateLabel}
                                      </button>
                                    )}
                                    <span className="text-xs text-slate-300">·</span>
                                    <span className="text-xs text-slate-400 tabular-nums">{totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}</span>
                                  </div>
                                  <button
                                    onClick={() => setRecepcionInicialEntries([])}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )
                            })()}

                            {recepcionInicialEntries.length === 0 && (
                              <button
                                onClick={() => {
                                  setRecepcionModalSelected({})
                                  setRecepcionModalQtys({})
                                  setShowRecepcionInicialModal(true)
                                }}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Registrar recepción</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pago card */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Wallet className="w-4 h-4 text-slate-500" />
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Pago</h3>
                        </div>

                        <div className="relative mb-3">
                          <select
                            value={pagoMode}
                            onChange={(e) => setPagoMode(e.target.value as PagoMode)}
                            className="w-full appearance-none px-3 py-2.5 pr-8 border border-slate-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:border-slate-400 cursor-pointer text-slate-700"
                          >
                            <option value="en_el_acto">En el acto</option>
                            <option value="diferida">Diferido</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 ${pagoMode === "en_el_acto" ? "bg-emerald-50 border border-emerald-100" : "bg-orange-50 border border-orange-100"}`}>
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${pagoMode === "en_el_acto" ? "bg-emerald-500" : "bg-orange-400"}`} />
                          <div>
                            <p className={`text-sm font-medium ${pagoMode === "en_el_acto" ? "text-emerald-700" : "text-orange-600"}`}>
                              {pagoMode === "en_el_acto" ? "En el acto" : "Diferido"}
                            </p>
                            <p className={`text-xs mt-0.5 ${pagoMode === "en_el_acto" ? "text-emerald-600" : "text-orange-500"}`}>
                              {pagoMode === "en_el_acto"
                                ? "El pago se realiza en el momento de la compra."
                                : "La compra queda pendiente de pago de forma total o parcial."}
                            </p>
                          </div>
                        </div>

                        {pagoMode === "en_el_acto" && (
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                              Medio de Pago
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                              {(["efectivo", "transferencia", "posnet"] as PaymentMethod[]).map((mp) => {
                                const Icon = medioPagoIcons[mp]
                                const active = medioPago === mp
                                return (
                                  <button
                                    key={mp}
                                    onClick={() => setMedioPago(mp)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                                      active
                                        ? "border-slate-800 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                    }`}
                                  >
                                    <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-slate-400"}`} />
                                    <span className="text-xs font-medium">{medioPagoLabels[mp]}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {pagoMode === "diferida" && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">
                              Pago inicial <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                            </p>

                            {pagoInicialEntries.map((entry, i) => {
                              const dateLabel = new Date(entry.date + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
                              return (
                                <div key={entry.id} className="flex items-center group border-b border-slate-100 last:border-0 mb-1">
                                  <div className="flex items-center gap-2 flex-1 min-w-0 py-1.5">
                                    {entry.editingDate ? (
                                      <input
                                        type="date"
                                        max={getTodayDateStr()}
                                        value={entry.date}
                                        autoFocus
                                        onChange={(e) => setPagoInicialEntries(prev => prev.map((en, j) => j === i ? { ...en, date: e.target.value } : en))}
                                        onBlur={() => setPagoInicialEntries(prev => prev.map((en, j) => j === i ? { ...en, editingDate: false } : en))}
                                        className="text-xs px-2 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-white"
                                      />
                                    ) : (
                                      <button
                                        onClick={() => setPagoInicialEntries(prev => prev.map((en, j) => j === i ? { ...en, editingDate: true } : en))}
                                        className="text-xs text-slate-400 tabular-nums hover:text-slate-600 transition-colors cursor-pointer"
                                      >
                                        {dateLabel}
                                      </button>
                                    )}
                                    <span className="text-xs text-slate-300">·</span>
                                    <span className="text-xs text-slate-500">{medioPagoLabels[entry.medioPago]}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-800 tabular-nums mr-1.5">
                                    ${Number(entry.monto).toLocaleString("es-AR")}
                                  </span>
                                  <button
                                    onClick={() => setPagoInicialEntries(prev => prev.filter((_, j) => j !== i))}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )
                            })}

                            {pagoInicialEntries.length === 0 && (
                              <button
                                onClick={() => {
                                  setPagoModalMonto("")
                                  setPagoModalMedio("efectivo")
                                  setPagoModalFecha(getTodayDateStr())
                                  setShowPagoInicialModal(true)
                                }}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Registrar pago</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <StepNav
                      onBack={() => setCurrentStep(2)}
                      onNext={goToConfirmacion}
                      canAdvance={canAdvance}
                    />
                  </div>
                )}

                {/* ── Step 4: Confirmación ── */}
                {currentStep === 4 && (
                  <div className="p-6 border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardCheck className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Confirmación</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 italic">
                      Revisa los detalles antes de crear la compra.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</span>
                        <span className="text-sm text-slate-700">{proveedorNombre}</span>
                      </div>

                      {/* Resumen */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumen</p>
                        <div className="bg-white border border-slate-200 overflow-hidden">
                          {selectedItems.map((it, idx) => {
                            const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                            const display = getVentaItemDisplay(it)
                            let lineTotal = 0
                            let adjustedUnit = it.unitPrice
                            const hasDiscount = aj.value > 0
                            if (hasDiscount) {
                              if (aj.type === "unit") {
                                lineTotal = Math.max(0, it.quantity - Math.min(aj.value, it.quantity)) * it.unitPrice
                              } else {
                                adjustedUnit = aj.type === "percent"
                                  ? it.unitPrice * (1 - aj.value / 100)
                                  : Math.max(0, it.unitPrice - aj.value)
                                lineTotal = it.quantity * adjustedUnit
                              }
                            } else {
                              lineTotal = it.unitPrice * it.quantity
                            }
                            return (
                              <div key={it.sku} className="grid grid-cols-10 border-b border-slate-100 last:border-b-0 py-3">
                                <div className="col-span-4 flex items-center gap-2 px-4 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate">{display.name}</p>
                                  {display.tags.map((tag, ti) => (
                                    <span key={ti} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{tag}</span>
                                  ))}
                                </div>
                                <div className="col-span-2 flex flex-col items-end justify-center pr-4">
                                  <span className="text-sm text-slate-500 tabular-nums">{it.quantity} unidades</span>
                                  {aj.type === "unit" && hasDiscount && (
                                    <span className="text-[10px] text-emerald-600 font-medium">{Math.min(aj.value, it.quantity)} bonificadas</span>
                                  )}
                                </div>
                                <div className="col-span-2 flex flex-col items-end justify-center pr-4">
                                  {hasDiscount && aj.type !== "unit" && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-slate-300 line-through tabular-nums">${Math.round(it.unitPrice).toLocaleString("es-AR")} c/u</span>
                                      <span className="text-[10px] text-red-500 font-medium">
                                        {aj.type === "percent" ? `-${aj.value}%` : `-$${aj.value.toLocaleString("es-AR")}`}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-sm text-slate-500 tabular-nums">${Math.round(adjustedUnit).toLocaleString("es-AR")} c/u</span>
                                </div>
                                <div className="col-span-2 flex items-center justify-end px-4">
                                  <span className="text-sm font-semibold text-slate-700 tabular-nums">${Math.round(lineTotal).toLocaleString("es-AR")}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex justify-end px-4 pt-3 pb-4 border border-t-0 border-slate-200">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-500">Subtotal</span>
                              <span className="text-sm text-slate-700 tabular-nums">${Math.round(total).toLocaleString("es-AR")}</span>
                            </div>
                            {showGlobalDiscount && globalDiscount.value > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Descuento{globalDiscount.type === "percent" ? ` (${globalDiscount.value}%)` : ""}</span>
                                <span className="text-sm text-red-500 tabular-nums">−${Math.round(globalDiscountAmount).toLocaleString("es-AR")}</span>
                              </div>
                            )}
                            {showEnvio && envioAmount > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Envío</span>
                                <span className="text-sm text-slate-700 tabular-nums">+${Math.round(envioAmount).toLocaleString("es-AR")}</span>
                              </div>
                            )}
                            {customCharges.filter(c => c.value > 0).map(charge => (
                              <div key={charge.id} className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">{charge.label}</span>
                                <span className="text-sm text-slate-700 tabular-nums">+${Math.round(charge.value).toLocaleString("es-AR")}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center border-t-2 border-slate-800 pt-2.5">
                              <span className="text-base font-bold text-slate-900">Total</span>
                              <span className="text-base font-bold text-slate-900 tabular-nums">${Math.round(grandTotal).toLocaleString("es-AR")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recepción y Pago summary cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <SummaryCard
                          icon={Truck}
                          label="Recepción"
                          value={recepcionMode === "en_el_acto" ? "En el acto · 100%" : "Diferida"}
                          tone={recepcionMode === "en_el_acto" ? "green" : "amber"}
                        />
                        <SummaryCard
                          icon={Wallet}
                          label="Pago"
                          value={pagoMode === "en_el_acto" ? `En el acto · ${medioPagoLabels[medioPago]}` : "Diferido"}
                          tone={pagoMode === "en_el_acto" ? "green" : "amber"}
                        />
                      </div>

                      {/* Costo diff section */}
                      {costoDiffs.length > 0 && (
                        <div className="border border-amber-200 rounded-xl overflow-hidden">
                          {/* Header alert */}
                          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-sm font-medium text-amber-800">
                              {costoDiffs.length} {costoDiffs.length === 1 ? "producto tiene" : "productos tienen"} un costo distinto al guardado.
                            </p>
                          </div>

                          {/* Table with per-row checkboxes */}
                          <div className="bg-white border-t border-amber-100">
                            {/* Table header — select-all + column labels */}
                            <div className="grid grid-cols-[36px_1fr_auto_auto] h-9 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={allCostosSelected}
                                  ref={(el) => { if (el) el.indeterminate = someCostosSelected && !allCostosSelected }}
                                  onChange={(e) => toggleAllCostos(e.target.checked)}
                                  className="w-[14px] h-[14px] rounded border-slate-300 accent-slate-900 cursor-pointer"
                                  title="Actualizar costos en lista de precios"
                                />
                              </div>
                              <div className="flex items-center px-3 gap-1.5">
                                <span>Actualizar costos en lista de precios</span>
                                {someCostosSelected && (
                                  <span className="normal-case text-[10px] font-normal text-slate-400">
                                    ({selectedCostoSkus.size} seleccionado{selectedCostoSkus.size !== 1 ? "s" : ""})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-end px-4 whitespace-nowrap">Costo guardado</div>
                              <div className="flex items-center justify-end px-4 whitespace-nowrap">Nuevo costo</div>
                            </div>

                            {/* Rows */}
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
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={isCreating || selectedItems.length === 0}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating ? "Creando..." : "Crear Compra"}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── Editar Costo Modal ── */}
      {discountModalIdx !== null && (() => {
        const item = selectedItems[discountModalIdx]
        if (!item) return null
        const display = getVentaItemDisplay(item)
        const parsedPrice = parseFloat(modalPrice) || item.unitPrice
        let finalPrice = parsedPrice
        if (modalAjuste.value > 0) {
          if (modalAjuste.type === "percent") finalPrice = parsedPrice * (1 - modalAjuste.value / 100)
          else if (modalAjuste.type === "cash") finalPrice = Math.max(0, parsedPrice - modalAjuste.value)
        }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
                      setSelectedItems(prev => prev.map((it, i) => i === discountModalIdx ? { ...it, unitPrice: newPrice } : it))
                    }
                    const ajuste = showModalDescuento ? { ...modalAjuste } : { value: 0, type: "percent" as const }
                    setEditAjustes(prev => ({ ...prev, [discountModalIdx]: ajuste }))
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

      {/* ── Registrar Recepción Inicial Modal ── */}
      {showRecepcionInicialModal && (() => {
        const pendingSkus = selectedItems.map(it => it.sku)
        const allSel = pendingSkus.length > 0 && pendingSkus.every(s => recepcionModalSelected[s])
        const someSel = pendingSkus.some(s => recepcionModalSelected[s])
        const indeterminate = someSel && !allSel
        const selectedCount = pendingSkus.filter(s => recepcionModalSelected[s]).length

        const handleSelectAll = () => {
          const selecting = !allSel && !indeterminate
          const next: { [sku: string]: boolean } = {}
          const nextQtys: { [sku: string]: string } = { ...recepcionModalQtys }
          for (const it of selectedItems) {
            next[it.sku] = selecting
            if (selecting) nextQtys[it.sku] = String(it.quantity)
            else delete nextQtys[it.sku]
          }
          setRecepcionModalSelected(next)
          setRecepcionModalQtys(nextQtys)
        }

        const handleToggle = (sku: string) => {
          const willSelect = !recepcionModalSelected[sku]
          setRecepcionModalSelected(prev => ({ ...prev, [sku]: willSelect }))
          if (willSelect) {
            const it = selectedItems.find(i => i.sku === sku)
            if (it) setRecepcionModalQtys(prev => ({ ...prev, [sku]: String(it.quantity) }))
          } else {
            setRecepcionModalQtys(prev => { const n = { ...prev }; delete n[sku]; return n })
          }
        }

        const handleConfirm = () => {
          const today = getTodayDateStr()
          const newEntries = selectedItems
            .filter(it => recepcionModalSelected[it.sku])
            .map(it => {
              const qty = parseInt(recepcionModalQtys[it.sku] || "0", 10) || it.quantity
              const display = getVentaItemDisplay(it)
              return {
                sku: it.sku,
                name: display.name,
                categoria: display.categoria,
                quantity: Math.min(qty, it.quantity),
                max: it.quantity,
                date: today,
                editingDate: false,
              }
            })
          setRecepcionInicialEntries(prev => {
            const next = [...prev]
            for (const entry of newEntries) {
              const idx = next.findIndex(e => e.sku === entry.sku)
              if (idx >= 0) next[idx] = entry
              else next.push(entry)
            }
            return next
          })
          setShowRecepcionInicialModal(false)
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRecepcionInicialModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Registrar recepción</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Indicá las unidades a marcar como recepcionadas</p>
                </div>
                <button onClick={() => setShowRecepcionInicialModal(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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
                      {indeterminate && <Minus className="w-3 h-3 text-slate-800" />}
                    </button>
                    <span>Producto</span>
                  </div>
                  <div className="flex items-center justify-center">Cantidad</div>
                  <div className="flex items-center justify-center">Recepcionar</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-white">
                {selectedItems.map((it, idx) => {
                  const display = getVentaItemDisplay(it)
                  const isSel = !!recepcionModalSelected[it.sku]
                  const qtyVal = recepcionModalQtys[it.sku] ?? ""
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[3fr_1fr_1.4fr] items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${isSel ? "bg-slate-50/70" : ""}`}
                      onClick={() => handleToggle(it.sku)}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggle(it.sku) }}
                          className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-slate-600 transition-colors bg-white flex-shrink-0"
                        >
                          {isSel && <Check className="w-3 h-3 text-slate-800" />}
                        </button>
                        <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                          <Image
                            src={getItemPhoto(display.resolved as any)}
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
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-slate-600 tabular-nums">{it.quantity}</span>
                      </div>
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {isSel && (
                          <input
                            type="number"
                            min={0}
                            max={it.quantity}
                            value={qtyVal}
                            placeholder={String(it.quantity)}
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === "") { setRecepcionModalQtys(prev => ({ ...prev, [it.sku]: "" })); return }
                              const num = parseInt(raw, 10)
                              if (isNaN(num) || num < 0) { setRecepcionModalQtys(prev => ({ ...prev, [it.sku]: "0" })); return }
                              if (num > it.quantity) { setRecepcionModalQtys(prev => ({ ...prev, [it.sku]: String(it.quantity) })); return }
                              setRecepcionModalQtys(prev => ({ ...prev, [it.sku]: String(num) }))
                            }}
                            className="w-14 text-center text-sm tabular-nums bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-slate-400 transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
                <span className="text-sm text-slate-500">
                  {selectedCount > 0 ? `${selectedCount} producto${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}` : "Seleccioná productos para registrar"}
                </span>
                <button
                  onClick={handleConfirm}
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

      {/* ── Registrar Pago Inicial Modal ── */}
      {showPagoInicialModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPagoInicialModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[420px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Registrar pago</h2>
              <button onClick={() => setShowPagoInicialModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha</label>
                <input
                  type="date"
                  max={getTodayDateStr()}
                  value={pagoModalFecha}
                  onChange={(e) => setPagoModalFecha(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Monto</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      value={pagoModalMonto}
                      onChange={(e) => setPagoModalMonto(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPagoModalMonto(String(Math.round(grandTotal)))}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200 shrink-0"
                  >
                    Total
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 tabular-nums">Total de la compra: ${Math.round(grandTotal).toLocaleString("es-AR")}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Medio de pago</label>
                <div className="flex gap-2">
                  {(["efectivo", "posnet", "transferencia"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPagoModalMedio(m)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${
                        pagoModalMedio === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {medioPagoLabels[m]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPagoInicialModal(false)}
                className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!pagoModalMonto || Number(pagoModalMonto) <= 0}
                onClick={() => {
                  setPagoInicialEntries(prev => [...prev, {
                    id: Date.now(),
                    monto: pagoModalMonto,
                    medioPago: pagoModalMedio,
                    date: pagoModalFecha,
                    editingDate: false,
                  }])
                  setShowPagoInicialModal(false)
                }}
                className="flex-1 py-2.5 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Registrar
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
                <p className="text-xs text-slate-500 mt-0.5">Selecciona los productos a agregar a la compra</p>
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
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowModalFilters(!showModalFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                      Object.values(modalFilters).some(v => v)
                        ? "border-blue-500 text-blue-600 bg-blue-50"
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
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
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
                    <option value="precio">Precio</option>
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
                  <p className="text-sm text-slate-500">
                    {allModalItems.length === 0
                      ? `No hay productos registrados para ${proveedorNombre}`
                      : `No se encontraron productos${modalSearch ? ` para "${modalSearch}"` : ""}`}
                  </p>
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
                          {!isParent && <span className="text-sm font-medium text-slate-800">${(item.precio?.costo || 0).toLocaleString("es-AR")}</span>}
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
                              <span className="text-sm font-medium text-slate-800">${(variant.precio?.costo || 0).toLocaleString("es-AR")}</span>
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
                className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

// ── Sub-components ───────────────────���──────────────────────

function StepNav({
  onBack,
  onNext,
  canAdvance,
}: {
  onBack?: () => void
  onNext: () => void
  canAdvance: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-slate-100">
      {onBack && (
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Volver
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canAdvance}
        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continuar
      </button>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Truck
  label: string
  value: string
  tone: "green" | "amber"
}) {
  const bg = tone === "green" ? "bg-emerald-50" : "bg-amber-50"
  const text = tone === "green" ? "text-emerald-700" : "text-amber-700"
  const iconColor = tone === "green" ? "text-emerald-600" : "text-amber-600"
  return (
    <div className={`p-3 rounded-lg ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${text}`}>{label}</span>
      </div>
      <p className={`text-sm font-medium ${text}`}>{value}</p>
    </div>
  )
}
