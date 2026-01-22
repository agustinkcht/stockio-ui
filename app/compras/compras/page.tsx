"use client"

import { useState, useMemo, Suspense, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { useCompras } from "@/hooks/use-compras"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Banknote,
  Building2,
  ArrowRightLeft,
  Copy,
  Package,
  Plus,
  ArrowUpDown,
  ListFilterIcon,
  X,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { Compra, PaymentMethod } from "@/lib/types"
import { Button } from "@/components/ui/button"

const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  cuenta_corriente: "Cuenta Cte.",
}

const paymentMethodIcons: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: ArrowRightLeft,
  cuenta_corriente: Building2,
}

const FILTRO_OPTIONS = {
  metodoPago: [
    { value: "efectivo", label: "Efectivo" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "transferencia", label: "Transferencia" },
    { value: "cuenta_corriente", label: "Cuenta Cte." },
  ],
  estado: [
    { value: "completada", label: "Completada" },
    { value: "pendiente", label: "Pendiente" },
    { value: "cancelada", label: "Cancelada" },
  ],
}

type SortDirection = "asc" | "desc"
type SortFactor = "fecha" | "total" | "proveedor"

interface SortConfig {
  factor: SortFactor
  direction: SortDirection
}

interface FilterConfig {
  metodoPago: PaymentMethod[]
  estado: string[]
}

function ComprasContent() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { compras, isLoading } = useCompras()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedPurchases, setExpandedPurchases] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    metodoPago: [],
    estado: [],
  })

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    factor: "fecha",
    direction: "desc",
  })

  const breadcrumbs = [{ label: "Compras" }, { label: "Compras", href: "/compras/compras" }]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderRef.current && !orderRef.current.contains(event.target as Node)) {
        setShowOrderModal(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterModal(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredCompras = useMemo(() => {
    let result = compras.filter((compra) => {
      const matchesSearch =
        searchQuery === "" ||
        compra.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        compra.proveedorNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        compra.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })

    if (activeFilters.metodoPago.length > 0) {
      result = result.filter((c) => activeFilters.metodoPago.includes(c.metodoPago))
    }
    if (activeFilters.estado.length > 0) {
      result = result.filter((c) => activeFilters.estado.includes(c.estado))
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortConfig.factor) {
        case "fecha":
          comparison = a.fecha.localeCompare(b.fecha)
          break
        case "total":
          comparison = a.total - b.total
          break
        case "proveedor":
          comparison = a.proveedorNombre.localeCompare(b.proveedorNombre)
          break
      }
      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return result
  }, [compras, searchQuery, activeFilters, sortConfig])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedPurchases)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedPurchases(newExpanded)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const formatDate = (fecha: string) => {
    const date = new Date(fecha)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (fecha === today.toISOString().split("T")[0]) {
      return "Hoy"
    } else if (fecha === yesterday.toISOString().split("T")[0]) {
      return "Ayer"
    } else {
      return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    }
  }

  const purchasesByDate = useMemo(() => {
    const grouped: Record<string, Compra[]> = {}
    filteredCompras.forEach((compra) => {
      if (!grouped[compra.fecha]) {
        grouped[compra.fecha] = []
      }
      grouped[compra.fecha].push(compra)
    })
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredCompras])

  const totalCompras = filteredCompras.reduce((acc, c) => acc + c.total, 0)
  const totalTransacciones = filteredCompras.length

  const hasActiveFilters = activeFilters.metodoPago.length > 0 || activeFilters.estado.length > 0

  const toggleFilter = (category: keyof FilterConfig, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[category] as string[]
      const newValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [category]: newValues }
    })
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
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground hover:bg-muted text-sm font-medium"
                  title="Deshacer cambios"
                >
                  Deshacer
                </button>

                <button
                  disabled
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary hover:bg-muted text-sm font-medium"
                  title="Guardar cambios"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="bg-white border border-border/40 rounded-lg shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  {/* Left: Stats and Nueva Compra Button */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Transacciones</p>
                        <p className="text-lg font-semibold">{totalTransacciones}</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Compras</p>
                        <p className="text-lg font-semibold text-amber-600">
                          ${totalCompras.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <Button
                      onClick={() => router.push("/compras/portal-de-compras")}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      Nueva Compra
                    </Button>
                  </div>

                  {/* Center: Search Bar */}
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black opacity-100 z-10" />
                    <input
                      type="text"
                      placeholder="Buscar compras..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        title="Limpiar búsqueda"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right: Order and Filter Buttons */}
                  <div className="flex items-center gap-0 flex-shrink-0">
                    <div className="relative mr-3" ref={orderRef}>
                      <button
                        onClick={() => setShowOrderModal(!showOrderModal)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm mr-[-4px]"
                        title="Ordenar"
                      >
                        <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                      </button>

                      {/* Order Modal */}
                      {showOrderModal && (
                        <div className="absolute right-0 top-10 bg-white border border-border/40 rounded-lg shadow-lg z-50 w-48 py-2">
                          <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Ordenar por</p>
                          {[
                            { value: "fecha", label: "Fecha" },
                            { value: "total", label: "Total" },
                            { value: "proveedor", label: "Proveedor" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  factor: option.value as SortFactor,
                                  direction:
                                    prev.factor === option.value ? (prev.direction === "asc" ? "desc" : "asc") : "desc",
                                }))
                              }}
                              className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted/50 flex items-center justify-between ${
                                sortConfig.factor === option.value ? "text-amber-600 font-medium" : ""
                              }`}
                            >
                              {option.label}
                              {sortConfig.factor === option.value && (
                                <span className="text-xs">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative" ref={filterRef}>
                      <button
                        onClick={() => setShowFilterModal(!showFilterModal)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group cursor-pointer border shadow-sm mr-2 ${
                          hasActiveFilters ? "border-amber-500 bg-amber-50" : "border-gray-200/40"
                        }`}
                        title="Filtros"
                      >
                        <ListFilterIcon
                          className={`w-4 h-4 ${hasActiveFilters ? "text-amber-600" : "text-gray-600 group-hover:text-gray-900"}`}
                        />
                      </button>

                      {/* Filter Modal */}
                      {showFilterModal && (
                        <div className="absolute right-0 top-10 bg-white border border-border/40 rounded-lg shadow-lg z-50 w-56 py-2">
                          <div className="px-3 py-2 border-b border-border/30">
                            <p className="text-xs font-medium text-muted-foreground">Método de Pago</p>
                            <div className="mt-2 space-y-1">
                              {FILTRO_OPTIONS.metodoPago.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={activeFilters.metodoPago.includes(option.value as PaymentMethod)}
                                    onChange={() => toggleFilter("metodoPago", option.value)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  {option.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="px-3 py-2">
                            <p className="text-xs font-medium text-muted-foreground">Estado</p>
                            <div className="mt-2 space-y-1">
                              {FILTRO_OPTIONS.estado.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={activeFilters.estado.includes(option.value)}
                                    onChange={() => toggleFilter("estado", option.value)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  {option.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          {hasActiveFilters && (
                            <div className="px-3 pt-2 border-t border-border/30">
                              <button
                                onClick={() => setActiveFilters({ metodoPago: [], estado: [] })}
                                className="text-xs text-amber-600 hover:underline"
                              >
                                Limpiar filtros
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>Cargando compras...</p>
                </div>
              ) : purchasesByDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Package className="w-12 h-12 mb-3 opacity-30" />
                  <p>No se encontraron compras</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {purchasesByDate.map(([date, purchases]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{formatDate(date)}</span>
                        <span className="text-xs text-muted-foreground/60">
                          ({purchases.length} compra{purchases.length > 1 ? "s" : ""})
                        </span>
                      </div>

                      <div className="space-y-[2px]">
                        {purchases.map((compra) => {
                          const isExpanded = expandedPurchases.has(compra.id)
                          const PaymentIcon = paymentMethodIcons[compra.metodoPago]

                          return (
                            <div key={compra.id} className="bg-white rounded-sm overflow-hidden">
                              <div
                                className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors"
                                onClick={() => toggleExpanded(compra.id)}
                              >
                                <button className="p-0.5 text-muted-foreground">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{compra.proveedorNombre}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {compra.items.length} item{compra.items.length > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">{compra.id}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        copyToClipboard(compra.id, compra.id)
                                      }}
                                      className="p-0.5 hover:bg-muted rounded transition-colors"
                                    >
                                      <Copy
                                        className={`w-3 h-3 ${copiedId === compra.id ? "text-amber-500" : "text-muted-foreground/50"}`}
                                      />
                                    </button>
                                    <span className="text-xs text-muted-foreground/50">·</span>
                                    <span className="text-xs text-muted-foreground/70">{compra.hora}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50">
                                  <PaymentIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {paymentMethodLabels[compra.metodoPago]}
                                  </span>
                                </div>

                                <div className="text-right min-w-[100px]">
                                  <p className="font-semibold text-sm">
                                    ${compra.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                                  </p>
                                  {compra.descuento > 0 && (
                                    <p className="text-[10px] text-amber-600">-{compra.descuento}% desc.</p>
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="border-t border-border/30 bg-muted/20">
                                  <div className="px-4 py-2 space-y-1">
                                    {compra.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-3 py-2">
                                        <div className="w-10 h-10 rounded bg-muted/50 overflow-hidden flex-shrink-0">
                                          <Image
                                            src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                            alt={item.name}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm truncate">{item.name}</p>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{item.sku}</span>
                                            {item.discount > 0 && (
                                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">
                                                -{item.discount}%
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="text-right">
                                          <p className="text-sm font-medium">
                                            ${item.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {item.quantity} × ${item.unitPrice.toLocaleString("es-AR")}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="px-4 py-2 border-t border-border/30 flex justify-end">
                                    <div className="text-right text-xs space-y-0.5">
                                      <div className="flex items-center gap-4 text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>${compra.subtotal.toLocaleString("es-AR")}</span>
                                      </div>
                                      {compra.descuento > 0 && (
                                        <div className="flex items-center gap-4 text-amber-600">
                                          <span>Descuento ({compra.descuento}%)</span>
                                          <span>
                                            -${((compra.subtotal * compra.descuento) / 100).toLocaleString("es-AR")}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-4 font-semibold text-sm pt-1">
                                        <span>Total</span>
                                        <span>${compra.total.toLocaleString("es-AR")}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function ComprasPage() {
  return (
    <Suspense fallback={null}>
      <ComprasContent />
    </Suspense>
  )
}
