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
  Trash2,
  ClipboardCheck,
  CreditCard,
  Banknote,
  ArrowRightLeft,
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

  // Step 2: Productos
  const [selectedItems, setSelectedItems] = useState<VentaItem[]>([])
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [itemSearch, setItemSearch] = useState("")

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
    return selectedItems.reduce((sum, it) => {
      const gross = it.unitPrice * it.quantity
      const disc =
        it.discountType === "percent"
          ? gross * (it.discount / 100)
          : it.discount * it.quantity
      return sum + (gross - disc)
    }, 0)
  }, [selectedItems])

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

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase()
    if (!q) return INITIAL_ITEMS
    return INITIAL_ITEMS.filter((it) => {
      const text = [it.name, it.sku, it.marca, it.categoria]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return text.includes(q)
    })
  }, [itemSearch])

  // ── Step gating ───────────────────────────────────────────
  const canAdvance = useMemo(() => {
    if (currentStep === 1) return true // cliente always valid (consumidor final default)
    if (currentStep === 2) return selectedItems.length > 0
    if (currentStep === 3) return true
    return false
  }, [currentStep, selectedItems])

  // ── Mutators ──────────────────────────────────────────────
  const addItemRow = (
    parent: Item,
    variant: ItemVariant | null,
  ) => {
    const sku = variant
      ? `${parent.skuPrefix}-${variant.skuSuffix}`
      : parent.sku || parent.id
    if (selectedItems.some((it) => it.sku === sku)) {
      // Already added - bump quantity
      setSelectedItems((prev) =>
        prev.map((it) =>
          it.sku === sku ? { ...it, quantity: it.quantity + 1 } : it,
        ),
      )
      return
    }
    const unitPrice = variant
      ? variant.precio?.precioFinal || 0
      : parent.precio?.precioFinal || 0
    const name = variant
      ? `${parent.name}${
          variant.atributosPrincipales?.length
            ? " · " +
              variant.atributosPrincipales.map((a) => a.value).join(" · ")
            : ""
        }`
      : parent.name
    setSelectedItems((prev) => [
      ...prev,
      {
        sku,
        name,
        quantity: 1,
        unitPrice,
        discount: 0,
        discountType: "percent",
        total: unitPrice,
        categoria: variant?.categoria || parent.categoria,
      },
    ])
  }

  const updateItemQty = (sku: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((it) =>
        it.sku === sku ? { ...it, quantity: Math.max(1, qty) } : it,
      ),
    )
  }

  const removeItem = (sku: string) => {
    setSelectedItems((prev) => prev.filter((it) => it.sku !== sku))
  }

  // ── Confirm / Create ──────────────────────────────────────
  const handleCreate = () => {
    setIsCreating(true)
    try {
      const fecha = getTodayDateStr()
      const hora = getNowTimeStr()

      // Recompute item totals with current discount
      const items: VentaItem[] = selectedItems.map((it) => {
        const gross = it.unitPrice * it.quantity
        const disc =
          it.discountType === "percent"
            ? gross * (it.discount / 100)
            : it.discount * it.quantity
        return { ...it, total: gross - disc }
      })

      const subtotal = items.reduce((s, it) => s + it.total, 0)

      // Entrega
      const entregaItems: VentaEntregaItem[] =
        entregaMode === "en_el_acto"
          ? items.map((it) => ({
              sku: it.sku,
              quantityEntregada: it.quantity,
            }))
          : items.map((it) => ({ sku: it.sku, quantityEntregada: 0 }))

      const entregaEntries: VentaEntregaEntry[] =
        entregaMode === "en_el_acto"
          ? [
              {
                id: `ENT-${Date.now()}`,
                fecha,
                hora,
                items: items.map((it) => ({
                  sku: it.sku,
                  quantity: it.quantity,
                })),
              },
            ]
          : []

      // Cobro
      const cobros: VentaCobro[] =
        cobroMode === "en_el_acto"
          ? [
              {
                id: `COB-${Date.now()}`,
                fecha,
                hora,
                medioPago,
                monto: subtotal,
              },
            ]
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
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Venta Creada Exitosamente
                  </h2>
                  <p className="text-sm text-gray-400 font-mono mb-2">{createdVentaId}</p>
                  <p className="text-gray-500 mb-8">{clienteNombre}</p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push(`/ventas/ventas/${createdVentaId}`)}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
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
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">
                    Creando Nueva Venta
                  </h2>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">
                    {clienteNombre}
                  </p>
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
                                currentStep > step.id
                                  ? "bg-green-500"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pb-20">
                          <button
                            onClick={() =>
                              !isDisabled && setCurrentStep(step.id)
                            }
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
                            <span className="text-xs uppercase tracking-wider">
                              {step.label}
                            </span>
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
                {/* Step 1: Cliente */}
                {currentStep === 1 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Cliente
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 italic">
                      Selecciona el cliente para esta venta. Por defecto es
                      Consumidor Final.
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
                      {/* Consumidor Final pinned */}
                      {("consumidor final".includes(
                        clienteSearch.toLowerCase(),
                      ) ||
                        clienteSearch === "") && (
                        <button
                          onClick={() =>
                            setCliente({ tipo: "consumidor_final" })
                          }
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 ${
                            cliente.tipo === "consumidor_final"
                              ? "bg-blue-50/50"
                              : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-slate-600">
                              CF
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              Consumidor Final
                            </p>
                            <p className="text-xs text-slate-400">
                              Sin cuenta registrada
                            </p>
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
                          const isSelected =
                            cliente.tipo === "cuenta" && cliente.id === c.id
                          return (
                            <button
                              key={c.id}
                              onClick={() =>
                                setCliente({
                                  tipo: "cuenta",
                                  id: c.id,
                                  nombre: name,
                                })
                              }
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                                isSelected ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                <span className="text-xs font-semibold text-white">
                                  {initials}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {c.tipo === "empresa"
                                    ? "Empresa"
                                    : "Particular"}{" "}
                                  · {c.condicionIva}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                        {filteredClientes.length === 0 && (
                          <p className="text-sm text-slate-400 text-center py-6">
                            Sin resultados
                          </p>
                        )}
                      </div>
                    </div>

                    <StepNav
                      onNext={() => setCurrentStep(2)}
                      canAdvance={canAdvance}
                    />
                  </div>
                )}

                {/* Step 2: Productos */}
                {currentStep === 2 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Productos
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowItemPicker(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar producto
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 italic">
                      Agrega los productos que se incluirán en esta venta.
                    </p>

                    {selectedItems.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-lg py-12 flex flex-col items-center justify-center text-center">
                        <Package className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500 mb-1">
                          No hay productos agregados
                        </p>
                        <p className="text-xs text-slate-400 mb-4">
                          Agrega al menos un producto para continuar
                        </p>
                        <button
                          onClick={() => setShowItemPicker(true)}
                          className="px-4 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Agregar producto
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedItems.map((it) => {
                          const img = getCategoryImage(it.categoria)
                          const lineTotal = it.unitPrice * it.quantity
                          return (
                            <div
                              key={it.sku}
                              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white"
                            >
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 shrink-0 relative">
                                {img && (
                                  <Image
                                    src={img}
                                    alt={it.name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {it.name}
                                </p>
                                <p className="text-xs text-slate-400 font-mono truncate">
                                  {it.sku}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-50 rounded-md p-1">
                                <button
                                  onClick={() =>
                                    updateItemQty(it.sku, it.quantity - 1)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-medium text-slate-800 w-8 text-center tabular-nums">
                                  {it.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateItemQty(it.sku, it.quantity + 1)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="w-24 text-right">
                                <p className="text-xs text-slate-400 tabular-nums">
                                  ${it.unitPrice.toLocaleString("es-AR")}
                                </p>
                                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                  ${lineTotal.toLocaleString("es-AR")}
                                </p>
                              </div>
                              <button
                                onClick={() => removeItem(it.sku)}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                aria-label="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                          <span className="text-sm font-medium text-slate-600">
                            Total
                          </span>
                          <span className="text-lg font-semibold text-slate-900 tabular-nums">
                            ${total.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>
                    )}

                    <StepNav
                      onBack={() => setCurrentStep(1)}
                      onNext={() => setCurrentStep(3)}
                      canAdvance={canAdvance}
                    />
                  </div>
                )}

                {/* Step 3: Entrega y Cobro */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {/* Entrega card */}
                    <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Entrega
                        </h3>
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
                        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Cobro
                        </h3>
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
                            {(
                              [
                                "efectivo",
                                "transferencia",
                                "posnet",
                              ] as PaymentMethod[]
                            ).map((mp) => {
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
                                  <Icon
                                    className={`w-4 h-4 ${
                                      active
                                        ? "text-blue-600"
                                        : "text-slate-400"
                                    }`}
                                  />
                                  <span className="text-xs font-medium">
                                    {medioPagoLabels[mp]}
                                  </span>
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

                {/* Step 4: Confirmación */}
                {currentStep === 4 && (
                  <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardCheck className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Confirmación
                      </h3>
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
                          {selectedItems.map((it) => (
                            <div
                              key={it.sku}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-700 truncate flex-1 pr-3">
                                {it.quantity}× {it.name}
                              </span>
                              <span className="text-slate-900 font-medium tabular-nums">
                                $
                                {(
                                  it.unitPrice * it.quantity
                                ).toLocaleString("es-AR")}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60">
                            <span className="text-sm font-semibold text-slate-700">
                              Total
                            </span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              ${total.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <SummaryCard
                          icon={Truck}
                          label="Entrega"
                          value={
                            entregaMode === "en_el_acto"
                              ? "En el acto · 100%"
                              : "Diferida · 0%"
                          }
                          tone={
                            entregaMode === "en_el_acto" ? "green" : "amber"
                          }
                        />
                        <SummaryCard
                          icon={Wallet}
                          label="Cobro"
                          value={
                            cobroMode === "en_el_acto"
                              ? `En el acto · ${medioPagoLabels[medioPago]}`
                              : "Diferida · 0%"
                          }
                          tone={
                            cobroMode === "en_el_acto" ? "green" : "amber"
                          }
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
                        className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Item Picker Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowItemPicker(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Agregar productos
              </h3>
              <button
                onClick={() => setShowItemPicker(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  autoFocus
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {filteredItems.map((item) => {
                const hasVariants =
                  item.hasVariants && item.variants && item.variants.length > 0
                if (hasVariants) {
                  return (
                    <div key={item.id} className="bg-slate-50/30">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {item.name}
                      </div>
                      {item.variants!.map((v) => {
                        const sku = `${item.skuPrefix}-${v.skuSuffix}`
                        const inCart = selectedItems.some(
                          (s) => s.sku === sku,
                        )
                        const variantLabel =
                          v.atributosPrincipales
                            ?.map((a) => a.value)
                            .join(" · ") || v.skuSuffix
                        return (
                          <button
                            key={v.id}
                            onClick={() => addItemRow(item, v)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors text-left"
                          >
                            <div className="w-1 h-8 bg-slate-200 rounded-full shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {variantLabel}
                              </p>
                              <p className="text-xs text-slate-400 font-mono truncate">
                                {sku}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 tabular-nums">
                              $
                              {(
                                v.precio?.precioFinal || 0
                              ).toLocaleString("es-AR")}
                            </p>
                            {inCart ? (
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                }
                const sku = item.sku || item.id
                const inCart = selectedItems.some((s) => s.sku === sku)
                return (
                  <button
                    key={item.id}
                    onClick={() => addItemRow(item, null)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono truncate">
                        {sku}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 tabular-nums">
                      $
                      {(item.precio?.precioFinal || 0).toLocaleString(
                        "es-AR",
                      )}
                    </p>
                    {inCart ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                )
              })}
              {filteredItems.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-10">
                  Sin resultados
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                {selectedItems.length} producto
                {selectedItems.length === 1 ? "" : "s"} agregado
                {selectedItems.length === 1 ? "" : "s"}
              </span>
              <button
                onClick={() => setShowItemPicker(false)}
                className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Listo
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
        active
          ? `${activeBorder} ${activeBg} shadow-sm`
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${
          active ? "bg-white" : "bg-slate-100"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${active ? activeIcon : "text-slate-400"}`}
        />
      </div>
      <span
        className={`text-sm font-semibold ${
          active ? activeText : "text-slate-700"
        }`}
      >
        {title}
      </span>
      <span className="text-xs text-slate-400 mt-1">{description}</span>
      {active && (
        <div className="absolute top-3 right-3">
          <CheckCircle2
            className={`w-4 h-4 ${
              color === "blue" ? "text-blue-500" : "text-amber-500"
            }`}
          />
        </div>
      )}
    </button>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
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
        <span className={`text-xs font-semibold uppercase tracking-wider ${text}`}>
          {label}
        </span>
      </div>
      <p className={`text-sm font-medium ${text}`}>{value}</p>
    </div>
  )
}
