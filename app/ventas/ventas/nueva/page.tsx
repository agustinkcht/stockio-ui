"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  CheckCircle2,
  ChevronDown,
  User,
  Package,
  Truck,
  Wallet,
  Plus,
  Minus,
  Search,
  Check,
  X,
  ClipboardCheck,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Filter,
  ArrowUpDown,
  Pencil,
  ShoppingCart,
} from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { NuevoClienteModal } from "@/components/modals/nuevo-cliente-modal"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

import { CLIENTES } from "@/lib/data/clientes"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { useVentas } from "@/hooks/use-ventas"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"
import type {
  Item,
  ItemVariant,
  PaymentMethod,
  Venta,
  VentaCliente,
  VentaCobro,
  VentaEntregaEntry,
  VentaEntregaItem,
  VentaItem,
} from "@/lib/types"

const STEPS = [
  { id: 1, label: "Cliente" },
  { id: 2, label: "Productos" },
  { id: 3, label: "Entrega y Cobro" },
  { id: 4, label: "Confirmación" },
]

type EntregaMode = "en_el_acto" | "diferida"
type CobroMode = "en_el_acto" | "diferida"

const medioPagoLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  posnet: "Posnet",
  transferencia: "Transferencia",
  no_especificado: "No especificado",
}

const medioPagoIcons: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  posnet: CreditCard,
  transferencia: ArrowRightLeft,
  no_especificado: Wallet,
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

export default function NuevaVentaPage() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave } = useSidebar()
  const { addVenta } = useVentas()
  const stepsContainerRef = useRef<HTMLDivElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  // maxUnlockedStep tracks how far the user has explicitly advanced
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1)

  // Step 1: Cliente
  const [cliente, setCliente] = useState<VentaCliente | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)

  // Step 2: Productos — edit-mode state
  const [selectedItems, setSelectedItems] = useState<VentaItem[]>([])
  const [editAjustes, setEditAjustes] = useState<Record<number, { value: number; type: "percent" | "cash" | "unit" }>>({})
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)
  // Inline price editing (idx → temp string value)
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null)
  const [tempPriceVal, setTempPriceVal] = useState("")
  // Editar precio modal
  const [discountModalIdx, setDiscountModalIdx] = useState<number | null>(null)
  const [modalAjuste, setModalAjuste] = useState<{ value: number; type: "percent" | "cash" | "unit" }>({ value: 0, type: "percent" })
  const [modalPrice, setModalPrice] = useState<string>("")
  const [showModalDescuento, setShowModalDescuento] = useState(false)

  // Modal state (exact copy from venta detail)
  const [modalSearch, setModalSearch] = useState("")
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio" | "stock">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)

  // Resumen sidebar
  const [showProductosBreakdown, setShowProductosBreakdown] = useState(false)

  // Step 3: Resumen adjustments
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "percent" | "cash" }>({ value: 0, type: "percent" })
  const [showEnvio, setShowEnvio] = useState(false)
  const [envioAmount, setEnvioAmount] = useState(0)
  const [customCharges, setCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])

  // Step 3: Entrega
  const [entregaMode, setEntregaMode] = useState<EntregaMode>("en_el_acto")
  // Entrega inicial (diferida)
  const [showEntregaInicialModal, setShowEntregaInicialModal] = useState(false)
  const [entregaInicialEntries, setEntregaInicialEntries] = useState<Array<{
    sku: string; name: string; categoria?: string; quantity: number; max: number; date: string; editingDate: boolean
  }>>([])
  const [entregaModalSelected, setEntregaModalSelected] = useState<{ [sku: string]: boolean }>({})
  const [entregaModalQtys, setEntregaModalQtys] = useState<{ [sku: string]: string }>({})

  // Step 4: Cobro
  const [cobroMode, setCobroMode] = useState<CobroMode>("en_el_acto")
  const [medioPago, setMedioPago] = useState<PaymentMethod>("efectivo")
  // Cobro inicial (diferida)
  const [showCobroInicialModal, setShowCobroInicialModal] = useState(false)
  const [cobroInicialEntries, setCobroInicialEntries] = useState<Array<{
    id: number; monto: string; medioPago: PaymentMethod; date: string; editingDate: boolean
  }>>([])
  // Cobro modal state
  const [cobroModalMonto, setCobroModalMonto] = useState("")
  const [cobroModalMedio, setCobroModalMedio] = useState<PaymentMethod>("efectivo")
  const [cobroModalFecha, setCobroModalFecha] = useState(getTodayDateStr())
  const [cobroModalHora, setCobroModalHora] = useState(getNowTimeStr())

  // Creation state
  const [isCreating, setIsCreating] = useState(false)
  const [createdVentaId, setCreatedVentaId] = useState<string | null>(null)

  const breadcrumbs = [
    { label: "Ventas" },
    { label: "Ventas", href: "/ventas/ventas" },
    { label: "Nueva Venta" },
  ]

  // ── Derived ───────────────────────────────────────────────
  const clienteNombre = !cliente
    ? "Sin cliente"
    : cliente.tipo === "cuenta"
    ? cliente.nombre
    : "Consumidor Final"

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

  const filteredClientes = useMemo(() => {
    const q = clienteSearch.trim().toLowerCase()
    return CLIENTES.filter((c) => {
      if (!q) return true
      const name =
        c.tipo === "empresa"
          ? c.razonSocial ?? ""
          : `${c.nombre} ${c.apellido}`.trim()
      return (
        name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      )
    })
  }, [clienteSearch])

  // ── Modal derived (exact copy from venta detail) ─────────
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
          const unitPrice = (variant as ItemVariant).precio?.precioFinal || 0
          // if already in list bump qty
          const existingIdx = selectedItems.findIndex(it => it.sku === sku)
          if (existingIdx >= 0) {
            // skip — already present, don't duplicate
            continue
          }
          newItems.push({
            sku,
            name: `${item.name}${(variant as ItemVariant).atributosPrincipales?.length ? " · " + (variant as ItemVariant).atributosPrincipales!.map(a => a.value).join(" · ") : ""}`,
            quantity: 1,
            unitPrice,
            discount: 0,
            discountType: "percent",
            total: unitPrice,
            categoria: (variant as ItemVariant).categoria || item.categoria,
          })
        }
      } else {
        const id = item.id || item.sku || item.name
        if (!selectedModalItems[id]) continue
        const sku = item.sku || id
        const existingIdx = selectedItems.findIndex(it => it.sku === sku)
        if (existingIdx >= 0) continue
        const unitPrice = item.precio?.precioFinal || 0
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

  // ── Step gating ───────────────────────────────────────────
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
    if (currentStep === 1) return cliente !== null
    if (currentStep === 2) return selectedItems.length > 0
    if (currentStep === 3) return true
    if (currentStep === 4) return true
    return false
  }, [currentStep, selectedItems])

  // ── Confirm / Create ──────────────────────────────────────
  const handleCreate = () => {
    setIsCreating(true)
    try {
      const fecha = getTodayDateStr()
      const hora = getNowTimeStr()

      const items: VentaItem[] = selectedItems.map((it, idx) => {
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
        const discountValue = aj.value
        const discountType = aj.type === "unit" ? "percent" : (aj.type === "percent" ? "percent" : "fixed")
        return { ...it, discount: discountValue, discountType, total: Math.round(lineTotal) }
      })

      const subtotal = items.reduce((s, it) => s + it.total, 0)
      const ventaTotal = Math.round(grandTotal)

      const entregaItems: VentaEntregaItem[] =
        entregaMode === "en_el_acto"
          ? items.map((it) => ({ sku: it.sku, quantityEntregada: it.quantity }))
          : items.map((it) => ({ sku: it.sku, quantityEntregada: 0 as number }))

      const entregaEntries: VentaEntregaEntry[] =
        entregaMode === "en_el_acto"
          ? [{ id: `ENT-${Date.now()}`, fecha, hora, items: items.map((it) => ({ sku: it.sku, quantity: it.quantity })) }]
          : entregaInicialEntries.length > 0
            ? entregaInicialEntries.reduce<VentaEntregaEntry[]>((acc, en) => {
                const existing = acc.find(e => e.fecha === en.date)
                if (existing) {
                  existing.items.push({ sku: en.sku, quantity: en.quantity })
                } else {
                  acc.push({ id: `ENT-${Date.now()}-${en.sku}`, fecha: en.date, hora, items: [{ sku: en.sku, quantity: en.quantity }] })
                }
                return acc
              }, [])
            : []

      // Update entregaItems to reflect any entrega inicial
      if (entregaMode === "diferida" && entregaInicialEntries.length > 0) {
        for (const en of entregaInicialEntries) {
          const idx = entregaItems.findIndex(ei => ei.sku === en.sku)
          if (idx >= 0) entregaItems[idx].quantityEntregada = en.quantity
        }
      }

      const cobros: VentaCobro[] =
        cobroMode === "en_el_acto"
          ? [{ id: `COB-${Date.now()}`, fecha, hora, medioPago, monto: ventaTotal }]
          : cobroInicialEntries.length > 0
            ? cobroInicialEntries.map((en, i) => ({
                id: `COB-${Date.now()}-${i}`,
                fecha: en.date,
                hora,
                medioPago: en.medioPago,
                monto: Number(en.monto),
              }))
            : []

      const fullyPaid = cobros.reduce((s, c) => s + c.monto, 0) >= subtotal && subtotal > 0
      const fullyDelivered = entregaMode === "en_el_acto"

      const newVenta: Omit<Venta, "id"> = {
        fecha,
        hora,
        cliente: cliente ?? { tipo: "consumidor_final" },
        items,
        subtotal,
        descuento: showGlobalDiscount ? globalDiscount.value : 0,
        descuentoTipo: globalDiscount.type === "cash" ? "fixed" : "percent",
        total: ventaTotal,
        entregaItems,
        entregaEntries,
        cobros,
        estado: fullyPaid && fullyDelivered ? "finalizada" : "en_curso",
      }

      const created = addVenta(newVenta)
      setCreatedVentaId(created.id)
    } catch (err) {
      console.error("[v0] Error creando venta:", err)
      alert("Error al crear la venta. Intenta nuevamente.")
    } finally {
      setIsCreating(false)
    }
  }

  // ── Success view ──────────────────────────────────────────
  if (createdVentaId) {
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
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
            <div className="relative border-b border-border h-[44px] bg-white">
              <div className="px-4 flex items-center justify-between h-full">
                <Breadcrumb items={breadcrumbs} />
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                  <UserPanel />
                </div>
                <div />
              </div>
            </div>
            <main className="flex-1 flex items-center justify-center bg-[rgba(250,251,253,1)]">
              <div className="p-8 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)] max-w-md w-full">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Venta Creada Exitosamente</h2>
                  <p className="text-sm text-gray-400 font-mono mb-2">{createdVentaId}</p>
                  <p className="text-gray-500 mb-8">{clienteNombre}</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push(`/ventas/ventas/${createdVentaId}`)}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Ver Venta
                    </button>
                    <button
                      onClick={() => router.push("/ventas/ventas")}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Volver a Ventas
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

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Header */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              <Breadcrumb items={breadcrumbs} />
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
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
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">Creando Nueva Venta</h2>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">{clienteNombre}</p>
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
                            onClick={() => !isDisabled && setCurrentStep(step.id)}
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

                <div className="mt-auto">
                  <button
                    onClick={() => router.push("/ventas/ventas")}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* Right: Step Content */}
              <div className={`col-span-16 overflow-auto p-8 ${currentStep === 2 ? "pr-8" : "pr-[15%]"}`}>

                {/* ── Step 1: Cliente ── */}
                {currentStep === 1 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Cliente</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 italic">
                      Selecciona el cliente para esta venta.
                    </p>

                    {/* ── Selected state: compact card, shrinks to content ── */}
                    {cliente !== null ? (
                      <div className="inline-flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl max-w-full">
                        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-white">
                            {cliente.tipo === "consumidor_final"
                              ? "CF"
                              : clienteNombre.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Cliente</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{clienteNombre}</p>
                        </div>
                        <button
                          onClick={() => {
                            setCliente(null)
                            setClienteSearch("")
                            setMaxUnlockedStep(1)
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-1"
                          title="Cambiar cliente"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* ── Search + dropdown ── */
                      <>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 mb-3">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            value={clienteSearch}
                            onChange={(e) => setClienteSearch(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                            autoFocus
                          />
                          {clienteSearch && (
                            <button onClick={() => setClienteSearch("")} className="text-slate-400 hover:text-slate-600">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[240px] overflow-y-auto">
                          {/* CF + Nuevo Cliente — ONLY when search is empty */}
                          {clienteSearch.trim() === "" && (
                            <>
                              <button
                                onClick={() => {
                                  setCliente({ tipo: "consumidor_final" })
                                  setMaxUnlockedStep(s => Math.max(s, 2))
                                  setCurrentStep(2)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-semibold text-slate-600">CF</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900">Consumidor Final</p>
                                  <p className="text-xs text-slate-400">Sin cuenta registrada</p>
                                </div>
                              </button>
                              <button
                                onClick={() => setShowNuevoClienteModal(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                  <Plus className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900">Nuevo Cliente</p>
                                  <p className="text-xs text-slate-400">Crear cuenta nueva</p>
                                </div>
                              </button>
                              <div className="border-t-2 border-slate-200" />
                            </>
                          )}

                          {/* Real clients */}
                          <div className="divide-y divide-slate-50">
                            {filteredClientes.map((c) => {
                              const name =
                                c.tipo === "empresa"
                                  ? c.razonSocial ?? ""
                                  : `${c.nombre} ${c.apellido}`.trim()
                              const initials = name.slice(0, 2).toUpperCase()
                              return (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    setCliente({ tipo: "cuenta", id: c.id, nombre: name })
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
                                      {c.tipo === "empresa" ? "Empresa" : "Particular"} · {c.condicionIva}
                                    </p>
                                  </div>
                                </button>
                              )
                            })}

                            {/* No results — ONLY sin resultados + nuevo cliente link, nothing else */}
                            {clienteSearch.trim() !== "" && filteredClientes.length === 0 && (
                              <div className="py-6 flex flex-col items-center gap-2">
                                <p className="text-sm text-slate-400">Sin resultados</p>
                                <button
                                  onClick={() => setShowNuevoClienteModal(true)}
                                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Nuevo Cliente
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Step 2: Productos (edit-mode grid) + Resumen ── */}
                {currentStep === 2 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                  <div className="flex gap-5 items-start w-full">
                  {/* Products card — 6/10 width */}
                  <div className="w-[60%] min-w-0 border border-slate-100 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-6 pt-6 pb-4 border-b border-slate-100">
                      <Package className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Productos</h3>
                    </div>

                    {/* Column headers */}
                    {selectedItems.length > 0 && (
                      <div className="grid grid-cols-[2fr_0.8fr_1fr_auto] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                        <div className="flex items-center px-4">Item</div>
                        <div className="flex items-center justify-center">Cantidad</div>
                        <div className="flex items-center justify-center">Precio</div>
                        <div className="w-10" />
                      </div>
                    )}

                    {/* Items or empty state */}
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
                        const isEditingPrice = editingPriceIdx === idx

                        // Derived adjusted unit price for display
                        let adjUnitPrice = item.unitPrice
                        if (hasDiscount) {
                          if (aj.type === "percent") adjUnitPrice = item.unitPrice * (1 - aj.value / 100)
                          else if (aj.type === "cash") adjUnitPrice = Math.max(0, item.unitPrice - aj.value)
                          // "unit" type: adjUnitPrice stays same, units are free
                        }

                        return (
                          <div key={item.sku} className="grid grid-cols-[2fr_0.8fr_1fr_auto] min-h-[72px] border-b border-slate-100 last:border-b-0">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 px-4 py-3">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                  src={getCategoryImage(display.categoria || "") || "/placeholder.svg"}
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

                            {/* Cantidad */}
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

                            {/* Precio */}
                            <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1">
                              <div className="flex items-center gap-1.5">
                                <div className="flex flex-col items-end">
                                  {/* $ or % discount: original struck-through + badge */}
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
                                  {/* Unit discount */}
                                  {hasDiscount && aj.type === "unit" && (
                                    <span className="text-[10px] text-emerald-600">{aj.value} unidades bonificadas</span>
                                  )}
                                </div>
                                {/* Pencil always opens the modal */}
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

                            {/* Delete */}
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

                    {/* Agregar productos row — only when items exist */}
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

                    <div className="px-6 pb-6">
                      <StepNav
                        onBack={() => setCurrentStep(1)}
                        onNext={() => { setMaxUnlockedStep(s => Math.max(s, 3)); setCurrentStep(3) }}
                        canAdvance={canAdvance}
                      />
                    </div>
                  </div>

                  {/* Resumen card — right side */}
                  <div className="w-[40%] shrink-0 sticky top-0 border border-slate-100 rounded-xl p-5">
                    {/* Title — same style as other step labels */}
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Resumen</h3>
                    </div>

                    {selectedItems.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Sin productos aún</p>
                    ) : (
                      <>
                        {/* Productos — collapsible subtotal row, full-bleed via negative margin */}
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
                          <div className="border-b border-slate-100">
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
                                <div key={it.sku} className="flex justify-between items-center gap-2 py-2.5 -mx-5 px-5 border-b border-slate-50 last:border-0">
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
                          </div>
                        )}

                        {/* Adjustments */}
                        <div className="space-y-2 mt-1.5">

                          {/* Global discount row */}
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

                          {/* Envío row */}
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

                          {/* Custom charges */}
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

                        {/* Agregar tags */}
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

                        {/* Grand Total */}
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                          <span className="text-sm font-bold text-slate-900">Total</span>
                          <span className="text-sm font-bold text-slate-900 tabular-nums">${Math.round(grandTotal).toLocaleString("es-AR")}</span>
                        </div>
                      </>
                    )}
                  </div>
                  </div>
                  </div>
                )}

                {/* ── Step 3: Entrega + Cobro ── */}
                {currentStep === 3 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="grid grid-cols-2 gap-5 mb-6">

                      {/* Entrega card */}
                      <div className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-slate-500" />
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Entrega</h3>
                        </div>

                        {/* Selector */}
                        <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-4">
                          <button
                            type="button"
                            onClick={() => setEntregaMode("en_el_acto")}
                            className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${entregaMode === "en_el_acto" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                          >
                            En el acto
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntregaMode("diferida")}
                            className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer border-l border-slate-200 ${entregaMode === "diferida" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                          >
                            Diferida
                          </button>
                        </div>

                        {/* Entrega inicial opcional — only when diferida */}
                        {entregaMode === "diferida" && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Entrega inicial (opcional)
                            </p>

                            {/* Aggregate all entries into one row per "session" */}
                            {entregaInicialEntries.length > 0 && (() => {
                              const totalUnits = entregaInicialEntries.reduce((s, e) => s + e.quantity, 0)
                              const firstEntry = entregaInicialEntries[0]
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
                                        onChange={(e) => setEntregaInicialEntries(prev => prev.map(en => ({ ...en, date: e.target.value })))}
                                        onBlur={() => setEntregaInicialEntries(prev => prev.map(en => ({ ...en, editingDate: false })))}
                                        className="text-xs px-2 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-white"
                                      />
                                    ) : (
                                      <button
                                        onClick={() => setEntregaInicialEntries(prev => prev.map(en => ({ ...en, editingDate: true })))}
                                        className="text-xs text-slate-400 tabular-nums hover:text-slate-600 transition-colors cursor-pointer"
                                      >
                                        {dateLabel}
                                      </button>
                                    )}
                                    <span className="text-xs text-slate-300">·</span>
                                    <span className="text-xs text-slate-400 tabular-nums">{totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}</span>
                                  </div>
                                  <button
                                    onClick={() => setEntregaInicialEntries([])}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )
                            })()}

                            {entregaInicialEntries.length === 0 && (
                              <button
                                onClick={() => {
                                  setEntregaModalSelected({})
                                  setEntregaModalQtys({})
                                  setShowEntregaInicialModal(true)
                                }}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Registrar entrega</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cobro card */}
                      <div className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Wallet className="w-4 h-4 text-slate-500" />
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Cobro</h3>
                        </div>

                        {/* Selector */}
                        <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-4">
                          <button
                            type="button"
                            onClick={() => setCobroMode("en_el_acto")}
                            className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${cobroMode === "en_el_acto" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                          >
                            En el acto
                          </button>
                          <button
                            type="button"
                            onClick={() => setCobroMode("diferida")}
                            className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer border-l border-slate-200 ${cobroMode === "diferida" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                          >
                            Diferido
                          </button>
                        </div>

                        {cobroMode === "en_el_acto" && (
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

                        {/* Cobro inicial opcional — only when diferida */}
                        {cobroMode === "diferida" && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Cobro inicial (opcional)
                            </p>

                            {cobroInicialEntries.map((entry, i) => {
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
                                        onChange={(e) => setCobroInicialEntries(prev => prev.map((en, j) => j === i ? { ...en, date: e.target.value } : en))}
                                        onBlur={() => setCobroInicialEntries(prev => prev.map((en, j) => j === i ? { ...en, editingDate: false } : en))}
                                        className="text-xs px-2 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-white"
                                      />
                                    ) : (
                                      <button
                                        onClick={() => setCobroInicialEntries(prev => prev.map((en, j) => j === i ? { ...en, editingDate: true } : en))}
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
                                    onClick={() => setCobroInicialEntries(prev => prev.filter((_, j) => j !== i))}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )
                            })}

                            {cobroInicialEntries.length === 0 && (
                              <button
                                onClick={() => {
                                  setCobroModalMonto("")
                                  setCobroModalMedio("efectivo")
                                  setCobroModalFecha(getTodayDateStr())
                                  setCobroModalHora(getNowTimeStr())
                                  setShowCobroInicialModal(true)
                                }}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Registrar cobro</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <StepNav
                      onBack={() => setCurrentStep(2)}
                      onNext={() => { setMaxUnlockedStep(s => Math.max(s, 4)); setCurrentStep(4) }}
                      canAdvance={canAdvance}
                    />
                  </div>
                )}

                {/* ── Step 4: Confirmación ── */}
                {currentStep === 4 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardCheck className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Confirmación</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 italic">
                      Revisa los detalles antes de crear la venta.
                    </p>

                    <div className="space-y-4">
                      <SummaryRow label="Cliente" value={clienteNombre} />

                      {/* Resumen */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumen</p>
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          {/* Column headers */}
                          <div className="grid grid-cols-[1fr_auto_auto] h-8 bg-slate-50 border-b border-slate-100 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            <div className="flex items-center px-4">Item</div>
                            <div className="flex items-center justify-end pr-4">Cantidad × Precio</div>
                            <div className="flex items-center justify-end px-4">Subtotal</div>
                          </div>

                          {/* Item rows */}
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
                              <div key={it.sku} className="grid grid-cols-[1fr_auto_auto] border-b border-slate-100 last:border-b-0 py-2.5">
                                {/* Item name + tags */}
                                <div className="flex items-center gap-1.5 px-4 min-w-0">
                                  <p className="text-xs font-medium text-slate-700 truncate">{display.name}</p>
                                  {display.tags.length > 0 && display.tags.map((tag, ti) => (
                                    <span key={ti} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{tag}</span>
                                  ))}
                                </div>
                                {/* Cantidad × precio */}
                                <div className="flex flex-col items-end justify-center pr-4">
                                  {hasDiscount && aj.type !== "unit" && (
                                    <span className="text-[10px] text-slate-300 line-through tabular-nums">{it.quantity} × ${Math.round(it.unitPrice).toLocaleString("es-AR")}</span>
                                  )}
                                  <span className="text-xs text-slate-500 tabular-nums">
                                    {aj.type === "unit" && hasDiscount
                                      ? <>{it.quantity} × ${Math.round(it.unitPrice).toLocaleString("es-AR")} <span className="text-amber-500">({aj.value} bonif.)</span></>
                                      : <>{it.quantity} × ${Math.round(adjustedUnit).toLocaleString("es-AR")}</>
                                    }
                                  </span>
                                </div>
                                {/* Line subtotal */}
                                <div className="flex items-center justify-end px-4">
                                  <span className="text-xs font-semibold text-slate-700 tabular-nums">${Math.round(lineTotal).toLocaleString("es-AR")}</span>
                                </div>
                              </div>
                            )
                          })}

                          {/* Subtotal row */}
                          <div className="grid grid-cols-[1fr_auto_auto] border-t border-slate-200 py-2.5">
                            <div className="px-4" />
                            <div className="flex items-center justify-end pr-4">
                              <span className="text-xs font-semibold text-slate-600">Subtotal</span>
                            </div>
                            <div className="flex items-center justify-end px-4">
                              <span className="text-xs font-semibold text-slate-700 tabular-nums">${Math.round(total).toLocaleString("es-AR")}</span>
                            </div>
                          </div>

                          {/* Descuento global */}
                          {showGlobalDiscount && globalDiscount.value > 0 && (
                            <div className="grid grid-cols-[1fr_auto_auto] border-t border-slate-100 py-2">
                              <div className="px-4">
                                <span className="text-xs text-slate-500">Descuento global{globalDiscount.type === "percent" ? ` (${globalDiscount.value}%)` : ""}</span>
                              </div>
                              <div className="pr-4" />
                              <div className="flex items-center justify-end px-4">
                                <span className="text-xs text-red-500 tabular-nums">−${Math.round(globalDiscountAmount).toLocaleString("es-AR")}</span>
                              </div>
                            </div>
                          )}

                          {/* Envío */}
                          {showEnvio && envioAmount > 0 && (
                            <div className="grid grid-cols-[1fr_auto_auto] border-t border-slate-100 py-2">
                              <div className="px-4">
                                <span className="text-xs text-slate-500">Envío</span>
                              </div>
                              <div className="pr-4" />
                              <div className="flex items-center justify-end px-4">
                                <span className="text-xs text-slate-600 tabular-nums">+${Math.round(envioAmount).toLocaleString("es-AR")}</span>
                              </div>
                            </div>
                          )}

                          {/* Custom charges */}
                          {customCharges.filter(c => c.value > 0).map(charge => (
                            <div key={charge.id} className="grid grid-cols-[1fr_auto_auto] border-t border-slate-100 py-2">
                              <div className="px-4">
                                <span className="text-xs text-slate-500">{charge.label}</span>
                              </div>
                              <div className="pr-4" />
                              <div className="flex items-center justify-end px-4">
                                <span className="text-xs text-slate-600 tabular-nums">+${Math.round(charge.value).toLocaleString("es-AR")}</span>
                              </div>
                            </div>
                          ))}

                          {/* Total */}
                          <div className="grid grid-cols-[1fr_auto_auto] border-t border-slate-200 py-3">
                            <div className="px-4">
                              <span className="text-sm font-bold text-slate-900">Total</span>
                            </div>
                            <div className="pr-4" />
                            <div className="flex items-center justify-end px-4">
                              <span className="text-sm font-bold text-slate-900 tabular-nums">${Math.round(grandTotal).toLocaleString("es-AR")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <SummaryCard
                          icon={Truck}
                          label="Entrega"
                          value={entregaMode === "en_el_acto" ? "En el acto · 100%" : "Diferida"}
                          tone={entregaMode === "en_el_acto" ? "green" : "amber"}
                        />
                        <SummaryCard
                          icon={Wallet}
                          label="Cobro"
                          value={cobroMode === "en_el_acto" ? `En el acto · ${medioPagoLabels[medioPago]}` : "Diferido"}
                          tone={cobroMode === "en_el_acto" ? "green" : "amber"}
                        />
                      </div>
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
                        {isCreating ? "Creando..." : "Crear Venta"}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── Descuento Modal ── */}
      {discountModalIdx !== null && (() => {
        const item = selectedItems[discountModalIdx]
        if (!item) return null
        const display = getVentaItemDisplay(item)
        const parsedPrice = parseFloat(modalPrice) || item.unitPrice
        let finalPrice = parsedPrice
        if (modalAjuste.value > 0) {
          if (modalAjuste.type === "percent") finalPrice = parsedPrice * (1 - modalAjuste.value / 100)
          else if (modalAjuste.type === "cash") finalPrice = Math.max(0, parsedPrice - modalAjuste.value)
          else if (modalAjuste.type === "unit") finalPrice = parsedPrice // unit doesn't change price per unit
        }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              {/* Item info header */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={getCategoryImage(display.categoria || "") || "/placeholder.svg"}
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
                {/* Precio editable */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Precio</label>
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

                {/* + agregar descuento — shown when discount area is collapsed */}
                {!showModalDescuento && (
                  <button
                    onClick={() => setShowModalDescuento(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + agregar descuento
                  </button>
                )}

                {/* Descuento area — shown when expanded */}
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

                    {/* Precio final — only when a discount value is entered */}
                    {modalAjuste.value > 0 && (
                      <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
                        <span className="text-sm font-medium text-slate-600">Precio final</span>
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

              {/* Footer */}
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
                    // If discount section was closed, clear any discount
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

      {/* ── Nuevo Cliente Modal ── */}
      <NuevoClienteModal
        isOpen={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        onSave={(nuevoCliente) => {
          // Use name from the new client and advance
          const name = nuevoCliente.tipo === "empresa"
            ? nuevoCliente.razonSocial ?? ""
            : `${nuevoCliente.nombre} ${nuevoCliente.apellido}`.trim()
          setCliente({ tipo: "cuenta", id: `nuevo-${Date.now()}`, nombre: name })
          setShowNuevoClienteModal(false)
          setMaxUnlockedStep(s => Math.max(s, 2))
          setCurrentStep(2)
        }}
      />

      {/* ── Registrar Entrega Inicial Modal ── */}
      {showEntregaInicialModal && (() => {
        const pendingSkus = selectedItems.map(it => it.sku)
        const allSel = pendingSkus.length > 0 && pendingSkus.every(s => entregaModalSelected[s])
        const someSel = pendingSkus.some(s => entregaModalSelected[s])
        const indeterminate = someSel && !allSel
        const selectedCount = pendingSkus.filter(s => entregaModalSelected[s]).length

        const handleSelectAll = () => {
          const selecting = !allSel && !indeterminate
          const next: { [sku: string]: boolean } = {}
          const nextQtys: { [sku: string]: string } = { ...entregaModalQtys }
          for (const it of selectedItems) {
            next[it.sku] = selecting
            if (selecting) nextQtys[it.sku] = String(it.quantity)
            else delete nextQtys[it.sku]
          }
          setEntregaModalSelected(next)
          setEntregaModalQtys(nextQtys)
        }

        const handleToggle = (sku: string) => {
          const willSelect = !entregaModalSelected[sku]
          setEntregaModalSelected(prev => ({ ...prev, [sku]: willSelect }))
          if (willSelect) {
            const it = selectedItems.find(i => i.sku === sku)
            if (it) setEntregaModalQtys(prev => ({ ...prev, [sku]: String(it.quantity) }))
          } else {
            setEntregaModalQtys(prev => { const n = { ...prev }; delete n[sku]; return n })
          }
        }

        const handleConfirm = () => {
          const today = getTodayDateStr()
          const newEntries = selectedItems
            .filter(it => entregaModalSelected[it.sku])
            .map(it => {
              const qty = parseInt(entregaModalQtys[it.sku] || "0", 10) || it.quantity
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
          setEntregaInicialEntries(prev => {
            const next = [...prev]
            for (const entry of newEntries) {
              const idx = next.findIndex(e => e.sku === entry.sku)
              if (idx >= 0) next[idx] = entry
              else next.push(entry)
            }
            return next
          })
          setShowEntregaInicialModal(false)
        }

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEntregaInicialModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Registrar entrega</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Indicá las unidades a marcar como entregadas</p>
                </div>
                <button onClick={() => setShowEntregaInicialModal(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Column headers */}
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
                  <div className="flex items-center justify-center">Entregar</div>
                </div>
              </div>
              {/* Items */}
              <div className="flex-1 overflow-y-auto bg-white">
                {selectedItems.map((it, idx) => {
                  const display = getVentaItemDisplay(it)
                  const isSel = !!entregaModalSelected[it.sku]
                  const qtyVal = entregaModalQtys[it.sku] ?? ""
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
                              if (raw === "") { setEntregaModalQtys(prev => ({ ...prev, [it.sku]: "" })); return }
                              const num = parseInt(raw, 10)
                              if (isNaN(num) || num < 0) { setEntregaModalQtys(prev => ({ ...prev, [it.sku]: "0" })); return }
                              if (num > it.quantity) { setEntregaModalQtys(prev => ({ ...prev, [it.sku]: String(it.quantity) })); return }
                              setEntregaModalQtys(prev => ({ ...prev, [it.sku]: String(num) }))
                            }}
                            className="w-14 text-center text-sm tabular-nums bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-slate-400 transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 py-3 px-5 flex items-center justify-between flex-shrink-0">
                <span className="text-sm text-slate-500">
                  {selectedCount > 0 ? `${selectedCount} producto${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}` : "Seleccioná productos para registrar"}
                </span>
                <button
                  onClick={handleConfirm}
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

      {/* ── Registrar Cobro Inicial Modal ── */}
      {showCobroInicialModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCobroInicialModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[420px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Registrar cobro</h2>
              <button onClick={() => setShowCobroInicialModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
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
                    max={getTodayDateStr()}
                    value={cobroModalFecha}
                    onChange={(e) => setCobroModalFecha(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Hora</label>
                  <input
                    type="time"
                    value={cobroModalHora}
                    onChange={(e) => setCobroModalHora(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>
              {/* Medio de pago */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Medio de pago</label>
                <div className="flex gap-2">
                  {(["efectivo", "posnet", "transferencia"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCobroModalMedio(m)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${
                        cobroModalMedio === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {medioPagoLabels[m]}
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
                      value={cobroModalMonto}
                      onChange={(e) => setCobroModalMonto(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-slate-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCobroModalMonto(String(Math.round(grandTotal)))}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200 shrink-0"
                  >
                    Total
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 tabular-nums">Total de la venta: ${Math.round(grandTotal).toLocaleString("es-AR")}</p>
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCobroInicialModal(false)}
                className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!cobroModalMonto || Number(cobroModalMonto) <= 0}
                onClick={() => {
                  setCobroInicialEntries(prev => [...prev, {
                    id: Date.now(),
                    monto: cobroModalMonto,
                    medioPago: cobroModalMedio,
                    date: cobroModalFecha,
                    editingDate: false,
                  }])
                  setShowCobroInicialModal(false)
                }}
                className="flex-1 py-2.5 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Agregar Productos Modal (exact copy from venta detail) ── */}
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
                    </>
                  )}
                </div>
                {/* Sort — up/down + field selector as one unified control */}
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
                <div className="flex items-center justify-end pr-6">Precio</div>
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
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

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

function ModeCard({
  active,
  onClick,
  color,
  icon: Icon,
  title,
  description,
}: {
  active: boolean
  onClick: () => void
  color: "blue" | "amber"
  icon: typeof CheckCircle2
  title: string
  description: string
}) {
  const activeBorder = color === "blue" ? "border-blue-500" : "border-amber-500"
  const activeBg = color === "blue" ? "bg-blue-50" : "bg-amber-50"
  const activeText = color === "blue" ? "text-blue-700" : "text-amber-700"
  const activeIcon = color === "blue" ? "text-blue-600" : "text-amber-600"
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left ${
        active ? `${activeBorder} ${activeBg} shadow-sm` : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${active ? "bg-white" : "bg-slate-100"}`}>
        <Icon className={`w-4 h-4 ${active ? activeIcon : "text-slate-400"}`} />
      </div>
      <span className={`text-sm font-semibold ${active ? activeText : "text-slate-700"}`}>{title}</span>
      <span className="text-xs text-slate-400 mt-1">{description}</span>
      {active && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className={`w-4 h-4 ${color === "blue" ? "text-blue-500" : "text-amber-500"}`} />
        </div>
      )}
    </button>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
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
