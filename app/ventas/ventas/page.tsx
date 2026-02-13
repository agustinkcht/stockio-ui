"use client"

import { useState, useMemo, Suspense, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { useVentas } from "@/hooks/use-ventas"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Banknote,
  Building2,
  ArrowRightLeft,
  Copy,
  Receipt,
  ArrowUpDown,
  ListFilterIcon,
  Plus,
  Search,
  X,
  MoreVertical,
  FileText,
  File,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { Venta, PaymentMethod } from "@/lib/types"

type SortFactor = "fecha" | "total" | "cliente"
type SortDirection = "asc" | "desc"

const FILTRO_OPTIONS = {
  metodoPago: [
    { value: "efectivo", label: "Efectivo" },
    { value: "posnet", label: "Posnet" },
    { value: "transferencia", label: "Transferencia" },
  ],
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  posnet: "Posnet",
  transferencia: "Transferencia",
}

const paymentMethodIcons: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  posnet: CreditCard,
  transferencia: ArrowRightLeft,
}

function VentasContent() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { ventas, isLoading, updateVenta } = useVentas()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ factor: SortFactor; direction: SortDirection }>({
    factor: "fecha",
    direction: "desc",
  })
  const [activeFilters, setActiveFilters] = useState<{
    metodoPago: PaymentMethod[]
  }>({
    metodoPago: [],
  })
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showEmitirFacturaModal, setShowEmitirFacturaModal] = useState(false)
  const [selectedVentaForFactura, setSelectedVentaForFactura] = useState<string | null>(null)
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null)

  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

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
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const breadcrumbs = [{ label: "Ventas" }, { label: "Ventas", href: "/ventas/ventas" }]

  const toggleFilter = (category: "metodoPago", value: string) => {
    setActiveFilters((prev) => {
      const currentValues = prev[category]
      const newValues = currentValues.includes(value as PaymentMethod)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as PaymentMethod]
      return { ...prev, [category]: newValues }
    })
  }

  const handleEmitirFactura = (ventaId: string) => {
    setSelectedVentaForFactura(ventaId)
    setShowEmitirFacturaModal(true)
  }

  const confirmEmitirFactura = () => {
    if (selectedVentaForFactura) {
      updateVenta(selectedVentaForFactura, { facturaEmitida: true })
      setShowEmitirFacturaModal(false)
      setSelectedVentaForFactura(null)
    }
  }

  const hasActiveFilters = activeFilters.metodoPago.length > 0

  const filteredVentas = useMemo(() => {
    const result = ventas.filter((venta) => {
      const matchesSearch =
        searchQuery === "" ||
        venta.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venta.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venta.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesPayment =
        activeFilters.metodoPago.length === 0 || activeFilters.metodoPago.includes(venta.metodoPago)

      return matchesSearch && matchesPayment
    })

    result.sort((a, b) => {
      let comparison = 0

      switch (sortConfig.factor) {
        case "fecha":
          comparison = a.fecha.localeCompare(b.fecha)
          break
        case "total":
          comparison = a.total - b.total
          break
        case "cliente":
          comparison = a.clienteNombre.localeCompare(b.clienteNombre)
          break
      }

      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return result
  }, [ventas, searchQuery, activeFilters, sortConfig])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSales)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSales(newExpanded)
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

  const salesByDate = useMemo(() => {
    const grouped: Record<string, Venta[]> = {}
    filteredVentas.forEach((venta) => {
      if (!grouped[venta.fecha]) {
        grouped[venta.fecha] = []
      }
      grouped[venta.fecha].push(venta)
    })
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredVentas])

  const totalVentas = filteredVentas.reduce((acc, v) => acc + v.total, 0)
  const totalTransacciones = filteredVentas.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <div className="text-muted-foreground">Cargando ventas...</div>
      </div>
    )
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

              <div />
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="bg-white border border-border/40 rounded-lg shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  {/* Left: Stats and Nueva Venta Button */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Transacciones</p>
                        <p className="text-lg font-semibold">{totalTransacciones}</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Ventas</p>
                        <p className="text-lg font-semibold text-emerald-600">
                          ${totalVentas.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <Button
                      onClick={() => router.push("/mi-negocio/pdv")}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      Nueva Venta
                    </Button>
                  </div>

                  {/* Center: Search Bar */}
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black opacity-100 z-10" />
                    <input
                      type="text"
                      placeholder="Buscar ventas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
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
                            { value: "cliente", label: "Cliente" },
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
                                sortConfig.factor === option.value ? "text-emerald-600 font-medium" : ""
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
                          hasActiveFilters ? "border-emerald-500 bg-emerald-50" : "border-gray-200/40"
                        }`}
                        title="Filtros"
                      >
                        <ListFilterIcon
                          className={`w-4 h-4 ${hasActiveFilters ? "text-emerald-600" : "text-gray-600 group-hover:text-gray-900"}`}
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
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  {option.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          {hasActiveFilters && (
                            <div className="px-3 pt-2 border-t border-border/30">
                              <button
                                onClick={() => setActiveFilters({ metodoPago: [] })}
                                className="text-xs text-emerald-600 hover:underline"
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

            <div className="flex-1 overflow-y-auto p-4">
              {salesByDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Receipt className="w-12 h-12 mb-3 opacity-30" />
                  <p>No se encontraron ventas</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {salesByDate.map(([date, sales]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{formatDate(date)}</span>
                        <span className="text-xs text-muted-foreground/60">
                          ({sales.length} venta{sales.length > 1 ? "s" : ""})
                        </span>
                      </div>

                      <div className="space-y-[2px]">
                        {sales.map((venta) => {
                          const isExpanded = expandedSales.has(venta.id)
                          const PaymentIcon = paymentMethodIcons[venta.metodoPago]

                          return (
                            <div key={venta.id} className="bg-white rounded-sm overflow-hidden">
                              <div
                                className="grid grid-cols-20 items-center px-4 py-3 cursor-pointer transition-colors"
                                onClick={() => toggleExpanded(venta.id)}
                              >
                                {/* Client-item part: col-span-8 */}
                                <div className="col-span-8 flex items-center gap-3 min-w-0">
                                  <button className="p-0.5 text-muted-foreground flex-shrink-0">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm truncate">{venta.clienteNombre}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                                        {venta.items.length} item{venta.items.length > 1 ? "s" : ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-muted-foreground">{venta.id}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          copyToClipboard(venta.id, venta.id)
                                        }}
                                        className="p-0.5 hover:bg-muted rounded transition-colors"
                                      >
                                        <Copy
                                          className={`w-3 h-3 ${copiedId === venta.id ? "text-emerald-500" : "text-muted-foreground/50"}`}
                                        />
                                      </button>
                                      <span className="text-xs text-muted-foreground/50">·</span>
                                      <span className="text-xs text-muted-foreground/70">{venta.hora}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment part: col-span-4 */}
                                <div className="col-span-4 flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50">
                                    <PaymentIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {paymentMethodLabels[venta.metodoPago]}
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <p className="font-semibold text-sm">
                                      ${venta.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                                    </p>
                                    {venta.descuento > 0 && (
                                      <p className="text-[10px] text-emerald-600">-{venta.descuento}% desc.</p>
                                    )}
                                  </div>
                                </div>

                                {/* Comprobantes section: col-span-7 */}
                                <div className="col-span-7 flex items-center gap-2 px-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // TODO: Handle ver ticket detalle
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/50 hover:bg-muted/50 transition-colors text-xs text-muted-foreground"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>Ver ticket detalle</span>
                                  </button>

                                  {venta.facturaEmitida ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // TODO: Handle ver factura
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/50 hover:bg-muted/50 transition-colors text-xs text-muted-foreground"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Ver factura</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEmitirFactura(venta.id)
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/50 hover:bg-muted/50 transition-colors text-xs text-muted-foreground"
                                    >
                                      <File className="w-3.5 h-3.5" />
                                      <span>Emitir factura</span>
                                    </button>
                                  )}
                                </div>

                                {/* More options: col-span-1 */}
                                <div className="col-span-1 flex justify-center relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowOptionsMenu(showOptionsMenu === venta.id ? null : venta.id)
                                    }}
                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                  </button>

                                  {showOptionsMenu === venta.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-md shadow-lg py-1 z-10 min-w-[180px]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // TODO: Handle cancelar venta
                                          setShowOptionsMenu(null)
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors text-muted-foreground"
                                      >
                                        Cancelar venta
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // TODO: Handle ir a cambios y devoluciones
                                          setShowOptionsMenu(null)
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors text-muted-foreground"
                                      >
                                        Ir a cambios y devoluciones
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="border-t border-border/30 bg-muted/20">
                                  <div className="grid grid-cols-20">
                                    <div className="col-span-8 px-4 py-2 space-y-1">
                                      {venta.items.map((item, idx) => (
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
                                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">
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

                                      <div className="pt-2 border-t border-border/30 flex justify-end">
                                        <div className="text-right text-xs space-y-0.5">
                                          <div className="flex items-center gap-4 text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>${venta.subtotal.toLocaleString("es-AR")}</span>
                                          </div>
                                          {venta.descuento > 0 && (
                                            <div className="flex items-center gap-4 text-emerald-600">
                                              <span>Descuento ({venta.descuento}%)</span>
                                              <span>
                                                -${((venta.subtotal * venta.descuento) / 100).toLocaleString("es-AR")}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-4 font-semibold text-sm pt-1">
                                            <span>Total</span>
                                            <span>${venta.total.toLocaleString("es-AR")}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-span-12" />
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

      {/* Emitir Factura Modal */}
      {showEmitirFacturaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg w-[400px] p-6">
            <h3 className="text-lg font-semibold mb-2">Vas a emitir factura</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Esta acción marcará la venta como facturada.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEmitirFacturaModal(false)
                  setSelectedVentaForFactura(null)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={confirmEmitirFactura}>Aceptar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VentasPage() {
  return (
    <Suspense fallback={null}>
      <VentasContent />
    </Suspense>
  )
}
