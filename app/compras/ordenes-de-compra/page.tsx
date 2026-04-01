"use client"

import { useState, useMemo, Suspense, useRef, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Search,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Banknote,
  Building2,
  ArrowRightLeft,
  Package,
  Plus,
  ArrowUpDown,
  ListFilterIcon,
  X,
  Check,
  Minus,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { OrdenCompra, MedioPago } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ORDENES_COMPRA } from "@/lib/data/initial-ordenes"

const medioPagoLabels: Record<MedioPago, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  cuenta_corriente: "Cuenta Cte.",
}

const medioPagoIcons: Record<MedioPago, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: ArrowRightLeft,
  cuenta_corriente: Building2,
}

type SortDirection = "asc" | "desc"
type SortFactor = "fecha" | "total" | "proveedor" | "numero"

interface SortConfig {
  factor: SortFactor
  direction: SortDirection
}

interface FilterConfig {
  medioPago: MedioPago[]
  estadoEntrega: string[]
}

const FILTRO_OPTIONS = {
  medioPago: [
    { value: "efectivo", label: "Efectivo" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "transferencia", label: "Transferencia" },
    { value: "cuenta_corriente", label: "Cuenta Cte." },
  ],
  estadoEntrega: [
    { value: "prevista", label: "Prevista" },
    { value: "recibida", label: "Recibida" },
  ],
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const month = months[date.getMonth()]
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

function OrdenesDeCompraContent() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    medioPago: [],
    estadoEntrega: [],
  })

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    factor: "numero",
    direction: "desc",
  })

  const breadcrumbs = [{ label: "Compras" }, { label: "Ordenes de Compra", href: "/compras/ordenes-de-compra" }]

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

  const filteredOrdenes = useMemo(() => {
    let result = ORDENES_COMPRA.filter((orden) => {
      const matchesSearch =
        searchQuery === "" ||
        orden.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.proveedorNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })

    if (activeFilters.medioPago.length > 0) {
      result = result.filter((o) => activeFilters.medioPago.includes(o.medioPago))
    }
    if (activeFilters.estadoEntrega.length > 0) {
      result = result.filter((o) => activeFilters.estadoEntrega.includes(o.estadoEntrega))
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortConfig.factor) {
        case "fecha":
          comparison = a.fechaCreacion.localeCompare(b.fechaCreacion)
          break
        case "total":
          comparison = a.importeTotal - b.importeTotal
          break
        case "proveedor":
          comparison = a.proveedorNombre.localeCompare(b.proveedorNombre)
          break
        case "numero":
          comparison = a.numero - b.numero
          break
      }
      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return result
  }, [searchQuery, activeFilters, sortConfig])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedOrders(newExpanded)
  }

  const hasActiveFilters = activeFilters.medioPago.length > 0 || activeFilters.estadoEntrega.length > 0

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
            {/* Toolbar */}
            <div className="px-6 pt-6 pb-4">
              <div className="bg-white border border-border/40 rounded-lg shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  {/* Left: Nueva Orden Button */}
                  <div className="flex items-center gap-4 shrink-0">
                    <Button
                      onClick={() => {/* TODO: Nueva Orden */}}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      Nueva Orden
                    </Button>
                  </div>

                  {/* Center: Search Bar */}
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black opacity-100 z-10" />
                    <input
                      type="text"
                      placeholder="Buscar ordenes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        title="Limpiar busqueda"
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
                            { value: "numero", label: "Numero" },
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
                              className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted/50 flex items-center justify-between cursor-pointer ${
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
                            <p className="text-xs font-medium text-muted-foreground">Medio de Pago</p>
                            <div className="mt-2 space-y-1">
                              {FILTRO_OPTIONS.medioPago.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={activeFilters.medioPago.includes(option.value as MedioPago)}
                                    onChange={() => toggleFilter("medioPago", option.value)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  {option.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="px-3 py-2">
                            <p className="text-xs font-medium text-muted-foreground">Estado Entrega</p>
                            <div className="mt-2 space-y-1">
                              {FILTRO_OPTIONS.estadoEntrega.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={activeFilters.estadoEntrega.includes(option.value)}
                                    onChange={() => toggleFilter("estadoEntrega", option.value)}
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
                                onClick={() => setActiveFilters({ medioPago: [], estadoEntrega: [] })}
                                className="text-xs text-amber-600 hover:underline cursor-pointer"
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

            {/* Tab Header */}
            <div className="px-6">
              <div className="bg-slate-200 border border-[rgba(202,213,227,0.61)] rounded-t-sm">
                <div className="grid grid-cols-100 h-9">
                  {/* Chevron spacer */}
                  <div className="col-span-3 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                  </div>
                  {/* Orden */}
                  <div className="col-span-8 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Orden</span>
                  </div>
                  {/* Proveedor */}
                  <div className="col-span-20 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Proveedor</span>
                  </div>
                  {/* Entrega */}
                  <div className="col-span-10 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Entrega</span>
                  </div>
                  {/* Estado Entrega */}
                  <div className="col-span-12 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Estado Entrega</span>
                  </div>
                  {/* Medio de Pago */}
                  <div className="col-span-10 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Medio Pago</span>
                  </div>
                  {/* Estado del Pago */}
                  <div className="col-span-17 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Estado Pago</span>
                  </div>
                  {/* Importe Total */}
                  <div className="col-span-20 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Importe Total</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredOrdenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Package className="w-12 h-12 mb-3 opacity-30" />
                  <p>No se encontraron ordenes de compra</p>
                </div>
              ) : (
                <div className="space-y-[1px]">
                  {filteredOrdenes.map((orden) => {
                    const isExpanded = expandedOrders.has(orden.id)
                    const MedioPagoIcon = medioPagoIcons[orden.medioPago]
                    
                    // Calcular estado de entrega: productos recibidos / total productos
                    const totalItems = orden.items.reduce((sum, item) => sum + item.quantity, 0)
                    const receivedItems = orden.items.reduce((sum, item) => sum + (item.quantityReceived || 0), 0)
                    const entregaCompleta = receivedItems === totalItems && totalItems > 0

                    return (
                      <div key={orden.id} className="bg-white border-x border-b border-[rgba(202,213,227,0.61)] first:border-t-0">
                        {/* Main Row */}
                        <div
                          className="grid grid-cols-100 min-h-[56px] cursor-pointer hover:bg-gray-50/50 transition-colors"
                          onClick={() => toggleExpanded(orden.id)}
                        >
                          {/* Chevron */}
                          <div className="col-span-3 flex items-center justify-center border-r border-[rgba(202,213,227,0.3)]">
                            <button className="p-0.5 text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {/* Orden */}
                          <div className="col-span-8 flex flex-col items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className="text-sm font-medium text-gray-900">OC-{orden.numero}</span>
                            <span className="text-xs text-muted-foreground">{formatDateShort(orden.fechaCreacion)}</span>
                          </div>

                          {/* Proveedor */}
                          <div className="col-span-20 flex items-center px-4 py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className="text-sm text-gray-700 truncate">{orden.proveedorNombre}</span>
                          </div>

                          {/* Entrega */}
                          <div className="col-span-10 flex flex-col items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className={`text-xs font-medium ${entregaCompleta ? "text-green-600" : "text-amber-600"}`}>
                              {entregaCompleta ? "Recibida" : "Prevista"}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDateShort(orden.fechaEntrega)}</span>
                          </div>

                          {/* Estado Entrega - Items recibidos */}
                          <div className="col-span-12 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <div className="flex items-center gap-1.5">
                              <Package className={`w-3.5 h-3.5 ${entregaCompleta ? "text-green-500" : receivedItems > 0 ? "text-amber-500" : "text-gray-400"}`} />
                              <span className={`text-xs font-medium ${
                                entregaCompleta ? "text-green-600" : 
                                receivedItems > 0 ? "text-amber-600" : "text-gray-500"
                              }`}>
                                {receivedItems} de {totalItems}
                              </span>
                            </div>
                          </div>

                          {/* Medio de Pago */}
                          <div className="col-span-10 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50">
                              <MedioPagoIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{medioPagoLabels[orden.medioPago]}</span>
                            </div>
                          </div>

                          {/* Estado del Pago */}
                          <div className="col-span-17 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    orden.estadoPago === 100 ? "bg-green-500" : 
                                    orden.estadoPago > 0 ? "bg-amber-500" : "bg-gray-300"
                                  }`}
                                  style={{ width: `${orden.estadoPago}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${
                                orden.estadoPago === 100 ? "text-green-600" : 
                                orden.estadoPago > 0 ? "text-amber-600" : "text-gray-500"
                              }`}>
                                {orden.estadoPago}%
                              </span>
                            </div>
                          </div>

                          {/* Importe Total */}
                          <div className="col-span-20 flex items-center justify-center py-2">
                            <span className="text-sm font-semibold text-gray-900">
                              ${orden.importeTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Items */}
                        {isExpanded && (
                          <div className="border-t border-border/30 bg-muted/20">
                            <div className="px-4 py-2 space-y-1">
                              {orden.items.map((item, idx) => {
                                const itemRecibido = item.quantityReceived === item.quantity
                                const itemParcial = item.quantityReceived > 0 && item.quantityReceived < item.quantity
                                return (
                                  <div key={idx} className="grid grid-cols-100 items-center py-2">
                                    {/* Item Info (leftmost) */}
                                    <div className="col-span-53 flex items-center gap-3 pl-8">
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
                                        <span className="text-xs text-muted-foreground">{item.sku}</span>
                                      </div>
                                    </div>

                                    {/* Item Estado Recepcion - alineado con Estado Entrega */}
                                    <div className="col-span-27 flex items-center justify-center">
                                      <div className="flex items-center gap-1.5">
                                        {itemRecibido ? (
                                          <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : itemParcial ? (
                                          <Minus className="w-3.5 h-3.5 text-amber-500" />
                                        ) : (
                                          <Package className="w-3.5 h-3.5 text-gray-400" />
                                        )}
                                        <span className={`text-xs font-medium ${
                                          itemRecibido ? "text-green-600" : 
                                          itemParcial ? "text-amber-600" : "text-gray-500"
                                        }`}>
                                          {item.quantityReceived} de {item.quantity} recibidos
                                        </span>
                                      </div>
                                    </div>

                                    {/* Item Subtotal (rightmost, aligned with importe total) */}
                                    <div className="col-span-20 flex flex-col items-center justify-center">
                                      <p className="text-sm font-medium">
                                        ${item.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.quantity} x ${item.unitPrice.toLocaleString("es-AR")}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function OrdenesDeCompraPage() {
  return (
    <Suspense fallback={null}>
      <OrdenesDeCompraContent />
    </Suspense>
  )
}
