"use client"

import { useState, useMemo, Suspense, use, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  FileDown,
  ChevronDown,
  ChevronRight,
  Check,
  Package,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { OrdenCompra } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ORDENES_COMPRA } from "@/lib/data/initial-ordenes"
import { useAccount } from "@/lib/contexts/account-context"

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const month = months[date.getMonth()]
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

// Type for received items tracking
interface ReceivedGroup {
  date: string
  items: { sku: string; name: string; quantity: number; categoria?: string }[]
}

function CompraDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { currentAccount } = useAccount()

  // Storage key for localStorage
  const getStorageKey = useCallback(() => {
    return `stockio_compras_${currentAccount || "default"}`
  }, [currentAccount])

  const [compra, setCompra] = useState<OrdenCompra | null>(null)
  const [isResumenExpanded, setIsResumenExpanded] = useState(false)
  
  // Selection state for entrega items
  const [selectedEntregaItems, setSelectedEntregaItems] = useState<{ [sku: string]: number }>({})
  
  // Received groups (items marked as received with dates)
  const [receivedGroups, setReceivedGroups] = useState<ReceivedGroup[]>([])
  const [expandedReceivedGroups, setExpandedReceivedGroups] = useState<Set<number>>(new Set())

  // Load compra from localStorage
  useEffect(() => {
    if (!currentAccount) return

    try {
      const storageKey = getStorageKey()
      const storedCompras = localStorage.getItem(storageKey)
      const compras: OrdenCompra[] = storedCompras ? JSON.parse(storedCompras) : ORDENES_COMPRA

      // Parse numero from "C-X" format
      const numeroMatch = id.match(/^C-(\d+)$/)
      const numero = numeroMatch ? parseInt(numeroMatch[1], 10) : null
      
      const found = numero !== null 
        ? compras.find((c) => c.numero === numero)
        : compras.find((c) => c.id === id) // Fallback to id match
        
      if (found) {
        setCompra(found)
        
        // Initialize received groups from already received items
        const alreadyReceived = found.items.filter(item => item.quantityReceived > 0)
        if (alreadyReceived.length > 0) {
          // Group all already received items into a single "previous" group
          setReceivedGroups([{
            date: found.fechaCreacion,
            items: alreadyReceived.map(item => ({
              sku: item.sku,
              name: item.name,
              quantity: item.quantityReceived,
              categoria: item.categoria,
            }))
          }])
        }
      }
    } catch (error) {
      console.error("[v0] Error loading compra:", error)
    }
  }, [currentAccount, getStorageKey, id])

  // Calculate stats
  const stats = useMemo(() => {
    if (!compra) return { totalItems: 0, totalUnidades: 0, receivedItems: 0, entregaPercent: 0, montoPagado: 0 }
    
    const totalItems = compra.items.length
    const totalUnidades = compra.items.reduce((sum, item) => sum + item.quantity, 0)
    const receivedUnidades = compra.items.reduce((sum, item) => sum + (item.quantityReceived || 0), 0)
    const entregaPercent = totalUnidades > 0 ? Math.round((receivedUnidades / totalUnidades) * 100) : 0
    const montoPagado = Math.round((compra.estadoPago / 100) * compra.importeTotal)
    
    return { totalItems, totalUnidades, receivedItems: receivedUnidades, entregaPercent, montoPagado }
  }, [compra])

  // Items pending to receive (quantity - quantityReceived > 0)
  const pendingItems = useMemo(() => {
    if (!compra) return []
    return compra.items.filter(item => (item.quantity - (item.quantityReceived || 0)) > 0)
      .map(item => ({
        ...item,
        pendingQuantity: item.quantity - (item.quantityReceived || 0)
      }))
  }, [compra])

  // Estado general
  const estadoGeneral = useMemo(() => {
    if (!compra) return "En curso"
    return stats.entregaPercent === 100 && compra.estadoPago === 100 ? "Finalizada" : "En curso"
  }, [compra, stats])

  // Handle item selection for entrega
  const handleEntregaItemSelection = (sku: string, quantity: number) => {
    setSelectedEntregaItems(prev => {
      if (prev[sku]) {
        const { [sku]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [sku]: quantity }
    })
  }

  // Handle select all pending items
  const handleSelectAllPending = () => {
    const allSelected = pendingItems.every(item => selectedEntregaItems[item.sku])
    if (allSelected) {
      setSelectedEntregaItems({})
    } else {
      const newSelected: { [sku: string]: number } = {}
      pendingItems.forEach(item => {
        newSelected[item.sku] = item.pendingQuantity
      })
      setSelectedEntregaItems(newSelected)
    }
  }

  // Handle marking selected items as received
  const handleMarcarRecibido = () => {
    if (!compra || Object.keys(selectedEntregaItems).length === 0) return

    const today = new Date().toISOString().split("T")[0]
    
    // Create new received group
    const newReceivedItems = Object.entries(selectedEntregaItems).map(([sku, quantity]) => {
      const item = compra.items.find(i => i.sku === sku)
      return {
        sku,
        name: item?.name || "",
        quantity,
        categoria: item?.categoria,
      }
    })

    setReceivedGroups(prev => [...prev, { date: today, items: newReceivedItems }])

    // Update compra items with new received quantities
    const updatedItems = compra.items.map(item => {
      const addedQuantity = selectedEntregaItems[item.sku] || 0
      return {
        ...item,
        quantityReceived: (item.quantityReceived || 0) + addedQuantity
      }
    })

    const updatedCompra = { ...compra, items: updatedItems }
    setCompra(updatedCompra)

    // Save to localStorage
    try {
      const storageKey = getStorageKey()
      const storedCompras = localStorage.getItem(storageKey)
      const compras: OrdenCompra[] = storedCompras ? JSON.parse(storedCompras) : ORDENES_COMPRA
      const updatedCompras = compras.map(c => c.id === compra.id ? updatedCompra : c)
      localStorage.setItem(storageKey, JSON.stringify(updatedCompras))
    } catch (error) {
      console.error("[v0] Error saving compra:", error)
    }

    // Clear selection
    setSelectedEntregaItems({})
  }

  // Toggle received group expansion
  const toggleReceivedGroup = (index: number) => {
    setExpandedReceivedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const selectedCount = Object.keys(selectedEntregaItems).length
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every(item => selectedEntregaItems[item.sku])
  const somePendingSelected = pendingItems.some(item => selectedEntregaItems[item.sku])

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Compras", href: "/compras/compras" },
    { label: compra ? `C-${compra.numero}` : "Detalle" },
  ]

  if (!compra) {
    return (
      <div className="flex items-center justify-center h-screen bg-[rgb(243,242,238)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Compra no encontrada</h2>
          <p className="text-muted-foreground mb-4">La compra que buscas no existe.</p>
          <Button onClick={() => router.push("/compras/compras")}>
            Volver a Compras
          </Button>
        </div>
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
          {/* Utility Bar */}
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

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title and info */}
                <div className="flex items-center gap-6">
                  {/* Order ID as title with label */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compra</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">C-{compra.numero}</h1>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        estadoGeneral === "Finalizada" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {estadoGeneral}
                      </span>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="h-10 w-px bg-border/40" />

                  {/* Proveedor */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Proveedor</span>
                    <span className="text-sm font-semibold text-gray-800">{compra.proveedorNombre}</span>
                  </div>
                </div>

                {/* Center: Creación */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Creación</span>
                  <span className="text-sm text-gray-600">{formatDateFull(compra.fechaCreacion)}</span>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>

            {/* Resumen Section */}
            <div className="px-6 pt-4">
              <div 
                className="bg-white border border-slate-200/80 rounded-lg cursor-pointer hover:border-slate-300 transition-colors"
                onClick={() => setIsResumenExpanded(!isResumenExpanded)}
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-slate-700">Resumen</span>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{stats.totalItems} items</span>
                      <span className="text-slate-300">|</span>
                      <span>{stats.totalUnidades} unidades</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-medium text-slate-700">
                        Total: ${compra.importeTotal.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                  <button className="p-1 text-slate-400">
                    {isResumenExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Content - Order Items */}
                {isResumenExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Header */}
                    <div className="bg-slate-50 border-b border-slate-100">
                      <div className="grid grid-cols-12 h-8 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <div className="col-span-6 flex items-center px-4">Item</div>
                        <div className="col-span-2 flex items-center justify-center">Costo Unit.</div>
                        <div className="col-span-2 flex items-center justify-center">Cantidad</div>
                        <div className="col-span-2 flex items-center justify-end pr-4">Subtotal</div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-slate-50">
                      {compra.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 items-center py-2.5 px-4 hover:bg-slate-50/50">
                          {/* Item */}
                          <div className="col-span-6 flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                              <Image
                                src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                alt={item.name}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-slate-400">{item.sku}</p>
                            </div>
                          </div>

                          {/* Costo Unit. */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="text-sm text-gray-700">
                              ${item.unitPrice.toLocaleString("es-AR")}
                            </span>
                          </div>

                          {/* Cantidad */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="text-sm text-gray-700">{item.quantity}</span>
                          </div>

                          {/* Subtotal */}
                          <div className="col-span-2 flex items-center justify-end">
                            <span className="text-sm font-medium text-gray-900">
                              ${item.total.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Row */}
                    <div className="bg-slate-50 border-t border-slate-200 py-3 px-4">
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-10 text-right">
                          <span className="text-sm font-medium text-slate-600">Total Estimado</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-base font-bold text-gray-900">
                            ${compra.importeTotal.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estado Section - Two Cards Grid */}
            <div className="px-6 py-4 flex-1">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Entrega Card */}
                <div className="bg-white border border-slate-200/80 rounded-lg flex flex-col">
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-800">Entrega</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              stats.entregaPercent === 100 ? "bg-green-500" : 
                              stats.entregaPercent > 0 ? "bg-amber-500" : "bg-gray-300"
                            }`}
                            style={{ width: `${stats.entregaPercent}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          stats.entregaPercent === 100 ? "text-green-600" : 
                          stats.entregaPercent > 0 ? "text-amber-600" : "text-gray-500"
                        }`}>
                          {stats.entregaPercent}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {stats.receivedItems} de {stats.totalUnidades} items recibidos
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 overflow-auto">
                    {/* Pending Items Section */}
                    {pendingItems.length > 0 && (
                      <div className="border-b border-slate-100">
                        {/* Select All Header */}
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSelectAllPending}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                allPendingSelected 
                                  ? "bg-amber-500 border-amber-500 text-white" 
                                  : somePendingSelected
                                    ? "bg-amber-200 border-amber-400"
                                    : "border-slate-300 hover:border-amber-500"
                              }`}
                            >
                              {allPendingSelected && <Check className="w-3 h-3" />}
                              {somePendingSelected && !allPendingSelected && <div className="w-2 h-0.5 bg-amber-600" />}
                            </button>
                            <span className="text-xs font-medium text-slate-600">Pendientes de recibir</span>
                          </div>
                          <span className="text-xs text-slate-400">{pendingItems.length} items</span>
                        </div>

                        {/* Pending Items List */}
                        <div className="divide-y divide-slate-50">
                          {pendingItems.map((item) => {
                            const isSelected = !!selectedEntregaItems[item.sku]
                            return (
                              <div 
                                key={item.sku}
                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-amber-50/50" : ""}`}
                                onClick={() => handleEntregaItemSelection(item.sku, item.pendingQuantity)}
                              >
                                <button
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected 
                                      ? "bg-amber-500 border-amber-500 text-white" 
                                      : "border-slate-300 hover:border-amber-500"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </button>
                                <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                  <Image
                                    src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                    alt={item.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 truncate">{item.name}</p>
                                  <p className="text-xs text-slate-400">{item.sku}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-sm font-medium text-slate-700">{item.pendingQuantity}</span>
                                  <span className="text-xs text-slate-400 ml-1">uds</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Action Bar */}
                        {selectedCount > 0 && (
                          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                              {selectedCount} item{selectedCount > 1 ? "s" : ""} seleccionado{selectedCount > 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={handleMarcarRecibido}
                              className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                            >
                              Marcar como recibido
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Received Groups */}
                    {receivedGroups.length > 0 && (
                      <div>
                        {receivedGroups.map((group, groupIndex) => {
                          const isExpanded = expandedReceivedGroups.has(groupIndex)
                          const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0)
                          return (
                            <div key={groupIndex} className="border-b border-slate-100 last:border-b-0">
                              <button
                                onClick={() => toggleReceivedGroup(groupIndex)}
                                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-green-50/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-green-600" />
                                  )}
                                  <Check className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-medium text-green-700">
                                    {totalQuantity} items recibidos el {formatDateShort(group.date)}
                                  </span>
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="bg-green-50/30 divide-y divide-green-100/50">
                                  {group.items.map((item, itemIndex) => (
                                    <div 
                                      key={itemIndex}
                                      className="flex items-center gap-3 px-4 py-2 pl-10"
                                    >
                                      <div className="w-7 h-7 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                        <Image
                                          src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                          alt={item.name}
                                          width={28}
                                          height={28}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-700 truncate">{item.name}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <span className="text-sm text-green-600">{item.quantity}</span>
                                        <span className="text-xs text-slate-400 ml-1">uds</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Empty State */}
                    {pendingItems.length === 0 && receivedGroups.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Package className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-sm">No hay items en esta compra</p>
                      </div>
                    )}

                    {/* All Received State */}
                    {pendingItems.length === 0 && receivedGroups.length > 0 && (
                      <div className="px-4 py-4 flex items-center gap-2 text-green-600 bg-green-50/50">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">Todos los items han sido recibidos</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pago Card */}
                <div className="bg-white border border-slate-200/80 rounded-lg flex flex-col">
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-800">Pago</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              compra.estadoPago === 100 ? "bg-green-500" : 
                              compra.estadoPago > 0 ? "bg-amber-500" : "bg-gray-300"
                            }`}
                            style={{ width: `${compra.estadoPago}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          compra.estadoPago === 100 ? "text-green-600" : 
                          compra.estadoPago > 0 ? "text-amber-600" : "text-gray-500"
                        }`}>
                          {compra.estadoPago}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      ${stats.montoPagado.toLocaleString("es-AR")} de ${compra.importeTotal.toLocaleString("es-AR")} pagado
                    </span>
                  </div>

                  {/* Card Content - Empty for now */}
                  <div className="flex-1 flex items-center justify-center text-slate-400">
                    <p className="text-sm">Funcionalidad de pago próximamente</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function CompraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <CompraDetailContent params={params} />
    </Suspense>
  )
}
