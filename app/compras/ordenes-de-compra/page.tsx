"use client"

import { useState, useMemo, Suspense, useRef, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Search,
  Package,
  Plus,
  ArrowUpDown,
  ListFilterIcon,
  X,
  CheckCircle2,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { OrdenDeCompra, EstadoOrdenDeCompra, OrdenDeCompraItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ORDENES_DE_COMPRA } from "@/lib/data/initial-ordenes-de-compra"

const estadoLabels: Record<EstadoOrdenDeCompra, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
}

const estadoColors: Record<EstadoOrdenDeCompra, { bg: string; text: string; icon: string }> = {
  borrador: { bg: "bg-gray-100", text: "text-gray-600", icon: "text-gray-400" },
  enviada: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  aceptada: { bg: "bg-green-50", text: "text-green-600", icon: "text-green-500" },
  rechazada: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
  cancelada: { bg: "bg-gray-100", text: "text-gray-500", icon: "text-gray-400" },
}

type SortDirection = "asc" | "desc"
type SortFactor = "fecha" | "total" | "proveedor" | "numero" | "items"

interface SortConfig {
  factor: SortFactor
  direction: SortDirection
}

interface FilterConfig {
  estado: EstadoOrdenDeCompra[]
}

const FILTRO_OPTIONS = {
  estado: [
    { value: "borrador", label: "Borrador" },
    { value: "enviada", label: "Enviada" },
    { value: "aceptada", label: "Aceptada" },
    { value: "rechazada", label: "Rechazada" },
    { value: "cancelada", label: "Cancelada" },
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
  const [selectedOrdenId, setSelectedOrdenId] = useState<string | null>(null)
  const [ordenes, setOrdenes] = useState(ORDENES_DE_COMPRA)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    estado: [],
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

  const selectedOrden = useMemo(() => {
    return ordenes.find(o => o.id === selectedOrdenId) || null
  }, [ordenes, selectedOrdenId])

  const filteredOrdenes = useMemo(() => {
    let result = ordenes.filter((orden) => {
      const matchesSearch =
        searchQuery === "" ||
        orden.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.proveedorNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })

    if (activeFilters.estado.length > 0) {
      result = result.filter((o) => activeFilters.estado.includes(o.estado))
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortConfig.factor) {
        case "fecha":
          comparison = a.fechaCreacion.localeCompare(b.fechaCreacion)
          break
        case "total":
          comparison = a.importeEstimado - b.importeEstimado
          break
        case "proveedor":
          comparison = a.proveedorNombre.localeCompare(b.proveedorNombre)
          break
        case "numero":
          comparison = a.numero - b.numero
          break
        case "items":
          comparison = a.items.length - b.items.length
          break
      }
      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return result
  }, [searchQuery, activeFilters, sortConfig])

  const hasActiveFilters = activeFilters.estado.length > 0

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

        <div className={`flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10 transition-all duration-300 ${selectedOrden ? "flex-1" : "flex-1"}`}>
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
                            { value: "total", label: "Importe" },
                            { value: "proveedor", label: "Proveedor" },
                            { value: "items", label: "Cantidad Items" },
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
                                    checked={activeFilters.estado.includes(option.value as EstadoOrdenDeCompra)}
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
                                onClick={() => setActiveFilters({ estado: [] })}
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
                  {/* ID */}
                  <div className="col-span-12 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">ID</span>
                  </div>
                  {/* Estado Orden - moved before Proveedor */}
                  <div className="col-span-15 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</span>
                  </div>
                  {/* Proveedor - moved after Estado */}
                  <div className="col-span-33 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Proveedor</span>
                  </div>
                  {/* Cantidad Items */}
                  <div className="col-span-15 flex items-center justify-center border-r border-[rgba(202,213,227,0.61)]">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Items</span>
                  </div>
                  {/* Importe Estimado */}
                  <div className="col-span-25 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Importe Estimado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredOrdenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="w-12 h-12 mb-3 opacity-30" />
                  <p>No se encontraron ordenes de compra</p>
                </div>
              ) : (
                <div className="space-y-[1px]">
                  {filteredOrdenes.map((orden) => {
                    const estadoStyle = estadoColors[orden.estado]
                    const totalItems = orden.items.reduce((sum, item) => sum + item.quantity, 0)
                    const isSelected = selectedOrdenId === orden.id

                    return (
                      <div
                        key={orden.id}
                        className={`bg-white border-x border-b border-[rgba(202,213,227,0.61)] first:border-t-0 cursor-pointer transition-colors ${
                          isSelected ? "bg-amber-50/50 border-l-2 border-l-amber-500" : "hover:bg-gray-50/50"
                        }`}
                        onClick={() => setSelectedOrdenId(orden.id)}
                      >
                        {/* Main Row */}
                        <div className="grid grid-cols-100 min-h-[56px]">
                          {/* ID */}
                          <div className="col-span-12 flex flex-col items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className="text-sm font-medium text-gray-900">ODC-{orden.numero}</span>
                            <span className="text-xs text-muted-foreground">{formatDateShort(orden.fechaCreacion)}</span>
                          </div>

                          {/* Estado Orden - now before Proveedor */}
                          <div className="col-span-15 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoStyle.bg}`}>
                              <CheckCircle2 className={`w-3.5 h-3.5 ${estadoStyle.icon}`} />
                              <span className={`text-xs font-medium ${estadoStyle.text}`}>
                                {estadoLabels[orden.estado]}
                              </span>
                            </div>
                          </div>

                          {/* Proveedor - now after Estado */}
                          <div className="col-span-33 flex items-center px-4 py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <span className="text-sm text-gray-700 truncate">{orden.proveedorNombre}</span>
                          </div>

                          {/* Cantidad Items */}
                          <div className="col-span-15 flex items-center justify-center py-2 border-r border-[rgba(202,213,227,0.3)]">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {orden.items.length} productos
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({totalItems} u.)
                            </span>
                          </div>

                          {/* Importe Estimado */}
                          <div className="col-span-25 flex items-center justify-center py-2">
                            <span className="text-sm font-semibold text-gray-900">
                              ${orden.importeEstimado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Orden Detail Panel */}
        {selectedOrden && (
          <div className="w-[480px] flex-shrink-0 bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden flex flex-col border-l border-border/30">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">ODC-{selectedOrden.numero}</h2>
                <p className="text-xs text-muted-foreground">{selectedOrden.proveedorNombre}</p>
              </div>
              <button
                onClick={() => setSelectedOrdenId(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Info Section */}
            <div className="px-4 py-3 border-b border-border/30 bg-white">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Fecha Creación</span>
                  <p className="font-medium text-gray-900">{formatDateShort(selectedOrden.fechaCreacion)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Última Edición</span>
                  <p className="font-medium text-gray-900">{selectedOrden.fechaModificacion ? formatDateShort(selectedOrden.fechaModificacion) : "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Proveedor</span>
                  <p className="font-medium text-gray-900">{selectedOrden.proveedorNombre}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Estado</span>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full mt-1 ${estadoColors[selectedOrden.estado].bg}`}>
                    <CheckCircle2 className={`w-3 h-3 ${estadoColors[selectedOrden.estado].icon}`} />
                    <span className={`text-xs font-medium ${estadoColors[selectedOrden.estado].text}`}>
                      {estadoLabels[selectedOrden.estado]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-0">
                {selectedOrden.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-3 border-b border-border/20 last:border-b-0">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                      <Image
                        src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>

                    {/* Quantity - editable */}
                    <div className="flex flex-col items-center gap-0.5 w-20">
                      <span className="text-[10px] text-muted-foreground uppercase">Cantidad</span>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0
                          const newItems = selectedOrden.items.map((it, i) =>
                            i === idx ? { ...it, quantity: newQuantity, total: newQuantity * it.unitPrice } : it
                          )
                          const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
                          setOrdenes(prev => prev.map(o => o.id === selectedOrden.id ? { ...o, items: newItems, importeEstimado: newTotal } : o))
                        }}
                        className="w-16 text-center text-sm font-medium border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        min={1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Costo Unit - editable */}
                    <div className="flex flex-col items-center gap-0.5 w-24">
                      <span className="text-[10px] text-muted-foreground uppercase">Costo Unit.</span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-0.5">$</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newPrice = parseInt(e.target.value) || 0
                            const newItems = selectedOrden.items.map((it, i) =>
                              i === idx ? { ...it, unitPrice: newPrice, total: it.quantity * newPrice } : it
                            )
                            const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
                            setOrdenes(prev => prev.map(o => o.id === selectedOrden.id ? { ...o, items: newItems, importeEstimado: newTotal } : o))
                          }}
                          className="w-20 text-center text-sm font-medium border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          min={0}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="flex flex-col items-end gap-0.5 w-24">
                      <span className="text-sm font-bold text-gray-900">
                        ${item.total.toLocaleString("es-AR")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.quantity} x ${item.unitPrice.toLocaleString("es-AR")}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const newItems = selectedOrden.items.filter((_, i) => i !== idx)
                        const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
                        setOrdenes(prev => prev.map(o => o.id === selectedOrden.id ? { ...o, items: newItems, importeEstimado: newTotal } : o))
                      }}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <button
                className="w-full mt-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  // TODO: Open item selector modal (filtered by proveedor)
                }}
              >
                <Plus className="w-4 h-4" />
                Agregar Item
              </button>
            </div>

            {/* Total Footer */}
            <div className="px-4 py-4 border-t border-border/40 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Estimado</span>
                <span className="text-xl font-bold text-gray-900">
                  ${selectedOrden.importeEstimado.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>
        )}
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
