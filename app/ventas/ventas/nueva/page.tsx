"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  CheckCircle2,
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
} from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

import { CLIENTES } from "@/lib/data/clientes"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { useVentas } from "@/hooks/use-ventas"
import { getCategoryImage } from "@/lib/utils/category-images"
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

  // Step 1: Cliente
  const [cliente, setCliente] = useState<VentaCliente>({ tipo: "consumidor_final" })
  const [clienteSearch, setClienteSearch] = useState("")

  // Step 2: Productos — edit-mode state
  const [selectedItems, setSelectedItems] = useState<VentaItem[]>([])
  const [editAjustes, setEditAjustes] = useState<Record<number, { value: number; type: "percent" | "cash" | "unit" }>>({})
  const [showAgregarProductos, setShowAgregarProductos] = useState(false)

  // Modal state (exact copy from venta detail)
  const [modalSearch, setModalSearch] = useState("")
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalFilters, setModalFilters] = useState<{ categoria: string; marca: string }>({ categoria: "", marca: "" })
  const [modalSort, setModalSort] = useState<"name" | "precio">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)

  // Step 3: Entrega y Cobro
  const [entregaMode, setEntregaMode] = useState<EntregaMode>("en_el_acto")
  const [cobroMode, setCobroMode] = useState<CobroMode>("en_el_acto")
  const [medioPago, setMedioPago] = useState<PaymentMethod>("efectivo")

  // Creation state
  const [isCreating, setIsCreating] = useState(false)
  const [createdVentaId, setCreatedVentaId] = useState<string | null>(null)

  const breadcrumbs = [
    { label: "Ventas" },
    { label: "Ventas", href: "/ventas/ventas" },
    { label: "Nueva Venta" },
  ]

  // ── Derived ───────────────────────────────────────────────
  const clienteNombre =
    cliente.tipo === "cuenta" ? cliente.nombre : "Consumidor Final"

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
  const canAdvance = useMemo(() => {
    if (currentStep === 1) return true
    if (currentStep === 2) return selectedItems.length > 0
    if (currentStep === 3) return true
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

      const entregaItems: VentaEntregaItem[] =
        entregaMode === "en_el_acto"
          ? items.map((it) => ({ sku: it.sku, quantityEntregada: it.quantity }))
          : items.map((it) => ({ sku: it.sku, quantityEntregada: 0 }))

      const entregaEntries: VentaEntregaEntry[] =
        entregaMode === "en_el_acto"
          ? [{ id: `ENT-${Date.now()}`, fecha, hora, items: items.map((it) => ({ sku: it.sku, quantity: it.quantity })) }]
          : []

      const cobros: VentaCobro[] =
        cobroMode === "en_el_acto"
          ? [{ id: `COB-${Date.now()}`, fecha, hora, medioPago, monto: subtotal }]
          : []

      const fullyPaid = cobros.reduce((s, c) => s + c.monto, 0) >= subtotal && subtotal > 0
      const fullyDelivered = entregaMode === "en_el_acto"

      const newVenta: Omit<Venta, "id"> = {
        fecha,
        hora,
        cliente,
        items,
        subtotal,
        descuento: 0,
        descuentoTipo: "percent",
        total: subtotal,
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
                    const isDisabled =
                      (step.id === 3 && selectedItems.length === 0) ||
                      (step.id === 4 && selectedItems.length === 0)
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
              <div className="col-span-16 overflow-auto p-8 pr-[15%]">

                {/* ── Step 1: Cliente ── */}
                {currentStep === 1 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Cliente</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 italic">
                      Selecciona el cliente para esta venta. Por defecto es Consumidor Final.
                    </p>

                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 mb-3">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        value={clienteSearch}
                        onChange={(e) => setClienteSearch(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
                      {("consumidor final".includes(clienteSearch.toLowerCase()) || clienteSearch === "") && (
                        <button
                          onClick={() => setCliente({ tipo: "consumidor_final" })}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 ${cliente.tipo === "consumidor_final" ? "bg-blue-50/50" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-slate-600">CF</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">Consumidor Final</p>
                            <p className="text-xs text-slate-400">Sin cuenta registrada</p>
                          </div>
                          {cliente.tipo === "consumidor_final" && (
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </button>
                      )}
                      <div className="divide-y divide-slate-50">
                        {filteredClientes.map((c) => {
                          const name =
                            c.tipo === "empresa"
                              ? c.razonSocial ?? ""
                              : `${c.nombre} ${c.apellido}`.trim()
                          const initials = name.slice(0, 2).toUpperCase()
                          const isSelected = cliente.tipo === "cuenta" && cliente.id === c.id
                          return (
                            <button
                              key={c.id}
                              onClick={() => setCliente({ tipo: "cuenta", id: c.id, nombre: name })}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${isSelected ? "bg-blue-50/50" : ""}`}
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
                              {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            </button>
                          )
                        })}
                        {filteredClientes.length === 0 && (
                          <p className="text-sm text-slate-400 text-center py-6">Sin resultados</p>
                        )}
                      </div>
                    </div>

                    <StepNav onNext={() => setCurrentStep(2)} canAdvance={canAdvance} />
                  </div>
                )}

                {/* ── Step 2: Productos (edit-mode grid) ── */}
                {currentStep === 2 && (
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-6 pt-6 pb-4 border-b border-slate-100">
                      <Package className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Productos</h3>
                    </div>

                    {/* Column headers (always visible once items exist) */}
                    {selectedItems.length > 0 && (
                      <div className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1.2fr_auto] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                        <div className="flex items-center px-4">Item</div>
                        <div className="flex items-center justify-center">Cantidad</div>
                        <div className="flex items-center justify-center">Precio Unit.</div>
                        <div className="flex items-center justify-center">Promoción</div>
                        <div className="flex items-center justify-end pr-4">Subtotal</div>
                        <div className="w-10" />
                      </div>
                    )}

                    {/* Items or empty state */}
                    {selectedItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-6">
                        <Package className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-slate-500 mb-1">Sin productos</p>
                        <p className="text-xs text-slate-400 mb-4">Agrega al menos un producto para continuar</p>
                      </div>
                    ) : (
                      selectedItems.map((item, idx) => {
                        const aj = editAjustes[idx] ?? { value: 0, type: "percent" as const }
                        let finalTotal = 0
                        if (aj.value > 0) {
                          if (aj.type === "unit") {
                            finalTotal = Math.max(0, item.quantity - Math.min(aj.value, item.quantity)) * item.unitPrice
                          } else {
                            const adjUnit = aj.type === "percent"
                              ? item.unitPrice * (1 - aj.value / 100)
                              : Math.max(0, item.unitPrice - aj.value)
                            finalTotal = item.quantity * adjUnit
                          }
                        } else {
                          finalTotal = item.unitPrice * item.quantity
                        }
                        return (
                          <div key={item.sku} className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1.2fr_auto] min-h-[72px] border-b border-slate-100 last:border-b-0">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 px-4 py-3">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                  src={getCategoryImage(item.categoria || "") || "/placeholder.svg"}
                                  alt={item.name}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 break-words leading-tight">{item.name}</p>
                                <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
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
                            {/* Precio Unit. */}
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-slate-400 text-sm">$</span>
                              <input
                                type="number"
                                value={item.unitPrice || ""}
                                onChange={(e) => setSelectedItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: parseFloat(e.target.value) || 0 } : it))}
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
                                  if (aj.type === "unit") val = Math.min(val, item.quantity)
                                  setEditAjustes(prev => ({ ...prev, [idx]: { ...aj, value: val } }))
                                }}
                                className="w-12 text-center text-xs py-1 border border-slate-200 rounded focus:outline-none focus:border-slate-400 placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="flex border border-slate-200 rounded overflow-hidden">
                                {(["percent", "cash", "unit"] as const).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => setEditAjustes(prev => ({ ...prev, [idx]: { ...aj, type: t } }))}
                                    className={`px-1.5 py-1 text-xs cursor-pointer ${aj.type === t ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}
                                  >
                                    {t === "percent" ? "%" : t === "cash" ? "$" : <Package className="w-3 h-3" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Subtotal */}
                            <div className="flex flex-col items-end justify-center pr-4">
                              {aj.value > 0 ? (
                                <>
                                  <span className="text-[10px] text-slate-400 line-through tabular-nums">{item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}</span>
                                  <span className="text-sm font-bold text-slate-900 tabular-nums">${Math.round(finalTotal).toLocaleString("es-AR")}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-slate-500 tabular-nums">{item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}</span>
                                  <span className="text-sm font-bold text-slate-900 tabular-nums">${Math.round(finalTotal).toLocaleString("es-AR")}</span>
                                </>
                              )}
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

                    {/* Agregar productos row */}
                    <button
                      type="button"
                      onClick={() => setShowAgregarProductos(true)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      Agregar productos
                    </button>

                    {/* Total + nav */}
                    {selectedItems.length > 0 && (
                      <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-t border-slate-100">
                        <span className="text-sm font-medium text-slate-600">Total</span>
                        <span className="text-base font-bold text-slate-900 tabular-nums">${Math.round(total).toLocaleString("es-AR")}</span>
                      </div>
                    )}

                    <div className="px-6 pb-6">
                      <StepNav
                        onBack={() => setCurrentStep(1)}
                        onNext={() => setCurrentStep(3)}
                        canAdvance={canAdvance}
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 3: Entrega y Cobro ── */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {/* Entrega card */}
                    <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Entrega</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4 italic">
                        Indica si la entrega se realiza ahora o de forma diferida.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <ModeCard
                          active={entregaMode === "en_el_acto"}
                          onClick={() => setEntregaMode("en_el_acto")}
                          color="blue"
                          icon={CheckCircle2}
                          title="En el acto"
                          description="Se marca como entregada (100%)"
                        />
                        <ModeCard
                          active={entregaMode === "diferida"}
                          onClick={() => setEntregaMode("diferida")}
                          color="amber"
                          icon={Truck}
                          title="Diferida"
                          description="Quedará en 0% para completar luego"
                        />
                      </div>
                    </div>

                    {/* Cobro card */}
                    <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Cobro</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4 italic">
                        Indica si el cobro se realiza ahora o de forma diferida.
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <ModeCard
                          active={cobroMode === "en_el_acto"}
                          onClick={() => setCobroMode("en_el_acto")}
                          color="blue"
                          icon={CheckCircle2}
                          title="En el acto"
                          description="Se marca como cobrada (100%)"
                        />
                        <ModeCard
                          active={cobroMode === "diferida"}
                          onClick={() => setCobroMode("diferida")}
                          color="amber"
                          icon={Wallet}
                          title="Diferida"
                          description="Quedará en 0% para completar luego"
                        />
                      </div>

                      {cobroMode === "en_el_acto" && (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">
                            Medio de Pago
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["efectivo", "transferencia", "posnet"] as PaymentMethod[]).map((mp) => {
                              const Icon = medioPagoIcons[mp]
                              const active = medioPago === mp
                              return (
                                <button
                                  key={mp}
                                  onClick={() => setMedioPago(mp)}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                                    active
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                  }`}
                                >
                                  <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                                  <span className="text-xs font-medium">{medioPagoLabels[mp]}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <StepNav
                      onBack={() => setCurrentStep(2)}
                      onNext={() => setCurrentStep(4)}
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
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Productos ({selectedItems.length})
                        </p>
                        <div className="space-y-1.5 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                          {selectedItems.map((it, idx) => {
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
                            return (
                              <div key={it.sku} className="flex items-center justify-between text-xs">
                                <span className="text-slate-700 truncate flex-1 pr-3">
                                  {it.quantity}× {it.name}
                                </span>
                                <span className="text-slate-900 font-medium tabular-nums">
                                  ${Math.round(lineTotal).toLocaleString("es-AR")}
                                </span>
                              </div>
                            )
                          })}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60">
                            <span className="text-sm font-semibold text-slate-700">Total</span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              ${Math.round(total).toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <SummaryCard
                          icon={Truck}
                          label="Entrega"
                          value={entregaMode === "en_el_acto" ? "En el acto · 100%" : "Diferida · 0%"}
                          tone={entregaMode === "en_el_acto" ? "green" : "amber"}
                        />
                        <SummaryCard
                          icon={Wallet}
                          label="Cobro"
                          value={cobroMode === "en_el_acto" ? `En el acto · ${medioPagoLabels[medioPago]}` : "Diferida · 0%"}
                          tone={cobroMode === "en_el_acto" ? "green" : "amber"}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        Atrás
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
    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
      {onBack ? (
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Atrás
        </button>
      ) : (
        <div />
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
