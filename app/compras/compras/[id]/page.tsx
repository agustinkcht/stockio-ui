"use client"

import { useState, useMemo, Suspense, use, useEffect, useCallback, useRef } from "react"
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
  Plus,
  Minus,
  Trash2,
  Upload,
  Receipt,
  X,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { OrdenCompra, Item } from "@/lib/types"
import { ORDENES_COMPRA } from "@/lib/data/initial-ordenes"
import { useAccount } from "@/lib/contexts/account-context"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const month = months[date.getMonth()]
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// Type for received items tracking
interface ReceivedGroup {
  date: string
  items: { sku: string; name: string; quantity: number; categoria?: string }[]
}

// Type for payments
interface Pago {
  id: string
  date: string
  amount: number
  medioPago: string
  facturaUrl?: string
}

function CompraDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { currentAccount } = useAccount()

  // Storage keys for localStorage
  const getComprasStorageKey = useCallback(() => {
    return `stockio_compras_${currentAccount || "default"}`
  }, [currentAccount])
  
  const getItemsStorageKey = useCallback(() => {
    return `stockio-items-${currentAccount || "default"}`
  }, [currentAccount])

  // Original state for tracking changes
  const [originalCompra, setOriginalCompra] = useState<OrdenCompra | null>(null)
  const [compra, setCompra] = useState<OrdenCompra | null>(null)
  const [isResumenExpanded, setIsResumenExpanded] = useState(false)
  const [isEditingResumen, setIsEditingResumen] = useState(false)
  
  // Editable resumen state
  const [editableItems, setEditableItems] = useState<Array<{
    sku: string
    name: string
    categoria?: string
    unitPrice: number
    quantity: number
  }>>([])
  const [originalEditableItems, setOriginalEditableItems] = useState<Array<{
    sku: string
    name: string
    categoria?: string
    unitPrice: number
    quantity: number
  }>>([])
  const [discount, setDiscount] = useState<{ type: "cash" | "percent"; value: number }>({ type: "cash", value: 0 })
  const [originalDiscount, setOriginalDiscount] = useState<{ type: "cash" | "percent"; value: number }>({ type: "cash", value: 0 })
  
  // Entrega tab state
  const [entregaTab, setEntregaTab] = useState<"pendientes" | "recibidos">("pendientes")
  
  // Selection state for entrega items with partial quantities
  const [selectedEntregaItems, setSelectedEntregaItems] = useState<{ [sku: string]: number }>({})
  
  // Received groups (items marked as received with dates)
  const [receivedGroups, setReceivedGroups] = useState<ReceivedGroup[]>([])
  const [originalReceivedGroups, setOriginalReceivedGroups] = useState<ReceivedGroup[]>([])
  const [expandedReceivedGroups, setExpandedReceivedGroups] = useState<Set<number>>(new Set())
  
  // Payment state
  const [pagos, setPagos] = useState<Pago[]>([])
  const [originalPagos, setOriginalPagos] = useState<Pago[]>([])
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [newPago, setNewPago] = useState({ amount: "", medioPago: "Transferencia", facturaUrl: "" })
  
  // Track if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    // Check compra items changes (quantityReceived)
    if (compra && originalCompra) {
      const compraChanged = JSON.stringify(compra.items.map(i => ({ sku: i.sku, qr: i.quantityReceived }))) !== 
                           JSON.stringify(originalCompra.items.map(i => ({ sku: i.sku, qr: i.quantityReceived })))
      if (compraChanged) return true
    }
    
    // Check editable items changes
    if (JSON.stringify(editableItems) !== JSON.stringify(originalEditableItems)) return true
    
    // Check discount changes
    if (JSON.stringify(discount) !== JSON.stringify(originalDiscount)) return true
    
    // Check received groups changes
    if (JSON.stringify(receivedGroups) !== JSON.stringify(originalReceivedGroups)) return true
    
    // Check pagos changes
    if (JSON.stringify(pagos) !== JSON.stringify(originalPagos)) return true
    
    return false
  }, [compra, originalCompra, editableItems, originalEditableItems, discount, originalDiscount, receivedGroups, originalReceivedGroups, pagos, originalPagos])

  // Load compra from localStorage
  useEffect(() => {
    if (!currentAccount) return

    try {
      const storageKey = getComprasStorageKey()
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
        setOriginalCompra(JSON.parse(JSON.stringify(found)))
        
        const items = found.items.map(item => ({
          sku: item.sku,
          name: item.name,
          categoria: item.categoria,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        }))
        setEditableItems(items)
        setOriginalEditableItems(JSON.parse(JSON.stringify(items)))
        
        // Initialize received groups from already received items
        const alreadyReceived = found.items.filter(item => item.quantityReceived > 0)
        if (alreadyReceived.length > 0) {
          const groups = [{
            date: found.fechaCreacion,
            items: alreadyReceived.map(item => ({
              sku: item.sku,
              name: item.name,
              quantity: item.quantityReceived,
              categoria: item.categoria,
            }))
          }]
          setReceivedGroups(groups)
          setOriginalReceivedGroups(JSON.parse(JSON.stringify(groups)))
        }
        
        // Initialize pagos from estadoPago percentage
        if (found.estadoPago > 0) {
          const montoPagado = Math.round((found.estadoPago / 100) * found.importeTotal)
          const initialPagos = [{
            id: "initial",
            date: found.fechaCreacion,
            amount: montoPagado,
            medioPago: "Inicial",
          }]
          setPagos(initialPagos)
          setOriginalPagos(JSON.parse(JSON.stringify(initialPagos)))
        }
      }
    } catch (error) {
      console.error("[v0] Error loading compra:", error)
    }
  }, [currentAccount, getComprasStorageKey, id])

  // Calculate stats
  const stats = useMemo(() => {
    if (!compra) return { totalItems: 0, totalUnidades: 0, receivedUnidades: 0, entregaPercent: 0 }
    
    const totalItems = compra.items.length
    const totalUnidades = compra.items.reduce((sum, item) => sum + item.quantity, 0)
    const receivedUnidades = compra.items.reduce((sum, item) => sum + (item.quantityReceived || 0), 0)
    const entregaPercent = totalUnidades > 0 ? Math.round((receivedUnidades / totalUnidades) * 100) : 0
    
    return { totalItems, totalUnidades, receivedUnidades, entregaPercent }
  }, [compra])
  
  // Calculate total with editable items and discount
  const calculatedTotal = useMemo(() => {
    const subtotal = editableItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    if (discount.type === "cash") {
      return Math.max(0, subtotal - discount.value)
    } else {
      return Math.max(0, subtotal * (1 - discount.value / 100))
    }
  }, [editableItems, discount])
  
  // Calculate total pagado
  const totalPagado = useMemo(() => {
    return pagos.reduce((sum, p) => sum + p.amount, 0)
  }, [pagos])
  
  const pagoPercent = useMemo(() => {
    if (calculatedTotal === 0) return 0
    return Math.min(100, Math.round((totalPagado / calculatedTotal) * 100))
  }, [totalPagado, calculatedTotal])
  
  const restantePorPagar = Math.max(0, calculatedTotal - totalPagado)
  
  // Get minimum quantity for each item (based on received)
  const getMinQuantity = useCallback((sku: string) => {
    let received = 0
    receivedGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.sku === sku) received += item.quantity
      })
    })
    return received
  }, [receivedGroups])

  // Items pending to receive (quantity - quantityReceived > 0)
  const pendingItems = useMemo(() => {
    if (!compra) return []
    return compra.items.filter(item => (item.quantity - (item.quantityReceived || 0)) > 0)
      .map(item => ({
        ...item,
        pendingQuantity: item.quantity - (item.quantityReceived || 0)
      }))
  }, [compra])
  
  // Total received items count
  const totalReceivedItems = useMemo(() => {
    return receivedGroups.reduce((sum, group) => sum + group.items.reduce((s, i) => s + i.quantity, 0), 0)
  }, [receivedGroups])

  // Estado general
  const estadoGeneral = useMemo(() => {
    if (!compra) return "En curso"
    return stats.entregaPercent === 100 && pagoPercent === 100 ? "Finalizada" : "En curso"
  }, [compra, stats, pagoPercent])
  
  // Check if compra is editable (only when not finalized)
  const isEditable = estadoGeneral !== "Finalizada"

  // Handle item quantity selection for partial receiving
  const handleQuantityChange = (sku: string, quantity: number, maxQuantity: number) => {
    if (quantity <= 0) {
      const { [sku]: _, ...rest } = selectedEntregaItems
      setSelectedEntregaItems(rest)
    } else {
      setSelectedEntregaItems(prev => ({
        ...prev,
        [sku]: Math.min(quantity, maxQuantity)
      }))
    }
  }
  
  // Toggle item selection (select all or deselect)
  const toggleItemSelection = (sku: string, maxQuantity: number) => {
    if (selectedEntregaItems[sku]) {
      const { [sku]: _, ...rest } = selectedEntregaItems
      setSelectedEntregaItems(rest)
    } else {
      setSelectedEntregaItems(prev => ({ ...prev, [sku]: maxQuantity }))
    }
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

  // Handle marking selected items as received (now just updates local state, doesn't save)
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

    setCompra({ ...compra, items: updatedItems })

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
  
  // Handle adding new item to resumen
  const handleAddItem = () => {
    setEditableItems(prev => [...prev, {
      sku: `NEW-${Date.now()}`,
      name: "Nuevo item",
      unitPrice: 0,
      quantity: 1,
    }])
  }
  
  // Handle updating item in resumen
  const handleUpdateItem = (index: number, field: "unitPrice" | "quantity" | "name", value: number | string) => {
    setEditableItems(prev => {
      const updated = [...prev]
      if (field === "quantity") {
        const minQty = getMinQuantity(updated[index].sku)
        updated[index] = { ...updated[index], [field]: Math.max(minQty, value as number) }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }
  
  // Handle removing item from resumen
  const handleRemoveItem = (index: number) => {
    const item = editableItems[index]
    const minQty = getMinQuantity(item.sku)
    if (minQty > 0) return // Can't remove if items already received
    setEditableItems(prev => prev.filter((_, i) => i !== index))
  }
  
  // Handle registering a payment (now just updates local state)
  const handleRegistrarPago = () => {
    const amount = parseFloat(newPago.amount)
    if (isNaN(amount) || amount <= 0) return
    if (amount > restantePorPagar) return // Can't pay more than remaining
    
    const pago: Pago = {
      id: `pago-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      amount,
      medioPago: newPago.medioPago,
      facturaUrl: newPago.facturaUrl || undefined,
    }
    
    setPagos(prev => [...prev, pago])
    setShowPagoModal(false)
    setNewPago({ amount: "", medioPago: "Transferencia", facturaUrl: "" })
  }
  
  // Save all changes
  const handleSave = useCallback(async () => {
    if (!compra) return
    
    try {
      // Update stock for received items
      const itemsStorageKey = getItemsStorageKey()
      const storedItems = localStorage.getItem(itemsStorageKey)
      
      if (storedItems) {
        const items: Item[] = JSON.parse(storedItems)
        
        // Calculate the difference in received quantities since last save
        const originalReceivedBySku: { [sku: string]: number } = {}
        originalReceivedGroups.forEach(group => {
          group.items.forEach(item => {
            originalReceivedBySku[item.sku] = (originalReceivedBySku[item.sku] || 0) + item.quantity
          })
        })
        
        const currentReceivedBySku: { [sku: string]: number } = {}
        receivedGroups.forEach(group => {
          group.items.forEach(item => {
            currentReceivedBySku[item.sku] = (currentReceivedBySku[item.sku] || 0) + item.quantity
          })
        })
        
        // Update item stocks for the difference
        const updatedItems = items.map(item => {
          // Check if this item or its variants match the compra items
          if (item.hasVariants && item.variants) {
            const updatedVariants = item.variants.map(variant => {
              const fullSku = `${item.skuPrefix}-${variant.skuSuffix}`
              const originalReceived = originalReceivedBySku[fullSku] || 0
              const currentReceived = currentReceivedBySku[fullSku] || 0
              const diff = currentReceived - originalReceived
              
              if (diff > 0 && variant.stock) {
                const currentTotal = parseInt(variant.stock.total || "0", 10)
                const currentDisponible = parseInt(variant.stock.disponible || "0", 10)
                return {
                  ...variant,
                  stock: {
                    ...variant.stock,
                    total: String(currentTotal + diff),
                    disponible: String(currentDisponible + diff),
                  }
                }
              }
              return variant
            })
            return { ...item, variants: updatedVariants }
          } else {
            // Standalone item
            const sku = item.sku || `${item.skuPrefix}`
            const originalReceived = originalReceivedBySku[sku] || 0
            const currentReceived = currentReceivedBySku[sku] || 0
            const diff = currentReceived - originalReceived
            
            if (diff > 0 && item.stock) {
              const currentTotal = parseInt(item.stock.total || "0", 10)
              const currentDisponible = parseInt(item.stock.disponible || "0", 10)
              return {
                ...item,
                stock: {
                  ...item.stock,
                  total: String(currentTotal + diff),
                  disponible: String(currentDisponible + diff),
                }
              }
            }
            return item
          }
        })
        
        localStorage.setItem(itemsStorageKey, JSON.stringify(updatedItems))
      }
      
      // Save compra changes
      const newTotalPagado = pagos.reduce((sum, p) => sum + p.amount, 0)
      const newPagoPercent = calculatedTotal > 0 ? Math.min(100, Math.round((newTotalPagado / calculatedTotal) * 100)) : 0
      
      const updatedCompra: OrdenCompra = {
        ...compra,
        items: compra.items.map((item, idx) => ({
          ...item,
          name: editableItems[idx]?.name || item.name,
          unitPrice: editableItems[idx]?.unitPrice || item.unitPrice,
          quantity: editableItems[idx]?.quantity || item.quantity,
          total: (editableItems[idx]?.unitPrice || item.unitPrice) * (editableItems[idx]?.quantity || item.quantity),
        })),
        estadoPago: newPagoPercent,
        importeTotal: calculatedTotal,
      }
      
      const storageKey = getComprasStorageKey()
      const storedCompras = localStorage.getItem(storageKey)
      const compras: OrdenCompra[] = storedCompras ? JSON.parse(storedCompras) : ORDENES_COMPRA
      const updatedCompras = compras.map(c => c.id === compra.id ? updatedCompra : c)
      localStorage.setItem(storageKey, JSON.stringify(updatedCompras))
      
      // Update original states
      setOriginalCompra(JSON.parse(JSON.stringify(updatedCompra)))
      setCompra(updatedCompra)
      setOriginalEditableItems(JSON.parse(JSON.stringify(editableItems)))
      setOriginalDiscount(JSON.parse(JSON.stringify(discount)))
      setOriginalReceivedGroups(JSON.parse(JSON.stringify(receivedGroups)))
      setOriginalPagos(JSON.parse(JSON.stringify(pagos)))
      
    } catch (error) {
      console.error("[v0] Error saving compra:", error)
    }
  }, [compra, editableItems, discount, receivedGroups, pagos, calculatedTotal, getComprasStorageKey, getItemsStorageKey, originalReceivedGroups])
  
  // Discard all changes
  const handleDiscard = useCallback(() => {
    if (originalCompra) setCompra(JSON.parse(JSON.stringify(originalCompra)))
    setEditableItems(JSON.parse(JSON.stringify(originalEditableItems)))
    setDiscount(JSON.parse(JSON.stringify(originalDiscount)))
    setReceivedGroups(JSON.parse(JSON.stringify(originalReceivedGroups)))
    setPagos(JSON.parse(JSON.stringify(originalPagos)))
    setSelectedEntregaItems({})
  }, [originalCompra, originalEditableItems, originalDiscount, originalReceivedGroups, originalPagos])

  // Navigation guard
  const {
    showNavigationModal,
    handleSaveAndNavigate,
    handleDiscardAndNavigate,
    handleCancelNavigation,
  } = useNavigationGuard({
    hasUnsavedChanges,
    onSave: handleSave,
    onDiscard: handleDiscard,
  })

  const selectedCount = Object.keys(selectedEntregaItems).length
  const selectedUnitsCount = Object.values(selectedEntregaItems).reduce((sum, qty) => sum + qty, 0)
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every(item => selectedEntregaItems[item.sku] === item.pendingQuantity)
  const somePendingSelected = pendingItems.some(item => selectedEntregaItems[item.sku])

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Compras", href: "/compras/compras" },
    { label: compra ? `C-${compra.numero}` : "Detalle" },
  ]

  if (!compra) {
    return (
      <div className="flex h-screen bg-[#FBFBFB]">
  <Sidebar
  sidebarItems={SIDEBAR_ITEMS}
  bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
  hoveredDropdown={hoveredDropdown}
  onDropdownOpen={handleDropdownMouseEnter}
  onDropdownClose={handleDropdownMouseLeave}
/>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Compra no encontrada</p>
          </div>
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
          {/* Utility Bar - Same as orden de compra detail */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2">
                {isEditable && hasUnsavedChanges && (
                  <>
                    <button
                      onClick={handleDiscard}
                      className="px-4 py-1.5 bg-muted/50 rounded transition-all cursor-pointer text-foreground hover:bg-muted text-sm font-medium"
                    >
                      Deshacer
                    </button>

                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 bg-muted/50 rounded transition-all cursor-pointer text-primary hover:bg-muted text-sm font-medium"
                    >
                      Guardar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-auto">
            {/* Order Header */}
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
                  <span className="text-sm text-gray-600">{formatDateShort(compra.fechaCreacion)}</span>
                </div>

                {/* Right: Export button */}
                <div className="flex items-center gap-2">
                  <button className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center">
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    Exportar
                  </button>
                </div>
              </div>
            </div>

          {/* Resumen Section */}
          <div className="px-6 pt-4 pb-4">
            <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden">
              {/* Resumen Header - Clickable to expand */}
              <button
                onClick={() => setIsResumenExpanded(!isResumenExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {isResumenExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-slate-700">Resumen</span>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{editableItems.length} items</span>
                    <span className="text-slate-300">•</span>
                    <span>{editableItems.reduce((sum, i) => sum + i.quantity, 0)} unidades</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-700">Total: ${calculatedTotal.toLocaleString("es-AR")}</span>
                  </div>
                </div>
                {isResumenExpanded && isEditable && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsEditingResumen(!isEditingResumen) }}
                    className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
                      isEditingResumen 
                        ? "bg-amber-100 text-amber-700" 
                        : "text-amber-600 hover:bg-amber-50"
                    }`}
                  >
                    {isEditingResumen ? "Listo" : "Editar"}
                  </button>
                )}
              </button>

              {/* Resumen Content - Expanded */}
              {isResumenExpanded && (
                <div className="border-t border-slate-100">
                  {/* Items Table */}
                  <div className="divide-y divide-slate-50">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="col-span-5">Item</div>
                      <div className="col-span-2 text-right">Costo Unitario</div>
                      <div className="col-span-2 text-center">Cantidad</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                      {isEditingResumen && <div className="col-span-1"></div>}
                    </div>

                    {/* Item Rows */}
                    {editableItems.map((item, idx) => {
                      const minQty = getMinQuantity(item.sku)
                      const canDelete = minQty === 0
                      return (
                        <div key={idx} className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                          <div className="col-span-5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                              <Image
                                src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                alt={item.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {isEditingResumen ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
                                className="flex-1 text-sm border border-slate-200 rounded px-2 py-1"
                              />
                            ) : (
                              <div>
                                <p className="text-sm text-gray-800">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.sku}</p>
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            {isEditingResumen ? (
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                className="w-24 text-sm text-right border border-slate-200 rounded px-2 py-1"
                              />
                            ) : (
                              <span className="text-sm text-slate-600">${item.unitPrice.toLocaleString("es-AR")}</span>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            {isEditingResumen ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={minQty}
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(idx, "quantity", parseInt(e.target.value) || minQty)}
                                  className="w-16 text-sm text-center border border-slate-200 rounded px-2 py-1"
                                />
                                {minQty > 0 && (
                                  <span className="text-xs text-amber-500" title={`Mínimo ${minQty} (ya recibidos)`}>
                                    min {minQty}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-600">{item.quantity}</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-medium text-slate-800">
                              ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                            </span>
                          </div>
                          {isEditingResumen && (
                            <div className="col-span-1 flex justify-center">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                disabled={!canDelete}
                                className={`p-1 rounded transition-colors ${
                                  canDelete 
                                    ? "text-red-500 hover:bg-red-50" 
                                    : "text-slate-300 cursor-not-allowed"
                                }`}
                                title={canDelete ? "Eliminar" : "No se puede eliminar (items ya recibidos)"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Add Item Button */}
                    {isEditingResumen && (
                      <div className="px-4 py-2">
                        <button
                          onClick={handleAddItem}
                          className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar item
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Discount Row (when editing) */}
                  {isEditingResumen && (
                    <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Descuento</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={discount.type}
                            onChange={(e) => setDiscount(prev => ({ ...prev, type: e.target.value as "cash" | "percent" }))}
                            className="text-sm border border-slate-200 rounded px-2 py-1"
                          >
                            <option value="cash">$</option>
                            <option value="percent">%</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            value={discount.value || ""}
                            onChange={(e) => setDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                            placeholder="0"
                            className="w-24 text-sm text-right border border-slate-200 rounded px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total Row */}
                  <div className="bg-slate-50 border-t border-slate-200 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Total</span>
                      <span className="text-base font-bold text-gray-900">
                        ${calculatedTotal.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estado Section - Two Cards Grid */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                    {stats.receivedUnidades} de {stats.totalUnidades} uds recibidas
                  </span>
                </div>
                
                {/* Tabs - only show if there are received items */}
                {totalReceivedItems > 0 && (
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => setEntregaTab("recibidos")}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                        entregaTab === "recibidos" 
                          ? "text-green-700 border-b-2 border-green-500 bg-green-50/30" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Recibidos ({totalReceivedItems})
                    </button>
                    <button
                      onClick={() => setEntregaTab("pendientes")}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                        entregaTab === "pendientes" 
                          ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/30" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Pendientes ({pendingItems.reduce((s, i) => s + i.pendingQuantity, 0)})
                    </button>
                  </div>
                )}

                {/* Card Content */}
                <div className="flex-1">
                  {/* Recibidos Tab */}
                  {entregaTab === "recibidos" && totalReceivedItems > 0 && (
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
                                  {totalQuantity} uds recibidas el {formatDateShort(group.date)}
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
                  
                  {/* Pendientes Tab */}
                  {(entregaTab === "pendientes" || totalReceivedItems === 0) && pendingItems.length > 0 && (
                    <div>
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
                          const selectedQty = selectedEntregaItems[item.sku] || 0
                          const isSelected = selectedQty > 0
                          return (
                            <div 
                              key={item.sku}
                              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isSelected ? "bg-amber-50/50" : "hover:bg-slate-50"}`}
                            >
                              <button
                                onClick={() => toggleItemSelection(item.sku, item.pendingQuantity)}
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
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isSelected ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.sku, selectedQty - 1, item.pendingQuantity) }}
                                      className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-medium text-amber-700 min-w-[2rem] text-center">{selectedQty}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.sku, selectedQty + 1, item.pendingQuantity) }}
                                      disabled={selectedQty >= item.pendingQuantity}
                                      className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs text-slate-400">/ {item.pendingQuantity}</span>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-sm font-medium text-slate-700">{item.pendingQuantity}</span>
                                    <span className="text-xs text-slate-400">uds</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Action Bar */}
                      {isEditable && selectedCount > 0 && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            {selectedUnitsCount} unidad{selectedUnitsCount > 1 ? "es" : ""} de {selectedCount} item{selectedCount > 1 ? "s" : ""}
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

                  {/* Empty State */}
                  {pendingItems.length === 0 && totalReceivedItems === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Package className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">No hay items en esta compra</p>
                    </div>
                  )}

                  {/* All Received State */}
                  {pendingItems.length === 0 && totalReceivedItems > 0 && entregaTab === "pendientes" && (
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
                            pagoPercent === 100 ? "bg-green-500" : 
                            pagoPercent > 0 ? "bg-amber-500" : "bg-gray-300"
                          }`}
                          style={{ width: `${pagoPercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        pagoPercent === 100 ? "text-green-600" : 
                        pagoPercent > 0 ? "text-amber-600" : "text-gray-500"
                      }`}>
                        {pagoPercent}%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    ${totalPagado.toLocaleString("es-AR")} de ${calculatedTotal.toLocaleString("es-AR")} pagado
                  </span>
                </div>

                {/* Card Content */}
                <div className="flex-1">
                  {/* Pagos List */}
                  {pagos.length > 0 && (
                    <div className="divide-y divide-slate-100">
                      {pagos.map((pago) => (
                        <div key={pago.id} className="px-4 py-3 flex items-center gap-4">
                          <div className="text-xs text-slate-500 w-20">
                            {formatDateShort(pago.date)}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-slate-800">
                              ${pago.amount.toLocaleString("es-AR")}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 w-24">
                            {pago.medioPago}
                          </div>
                          <div className="w-8 flex justify-center">
                            {pago.facturaUrl ? (
                              <a href={pago.facturaUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                                <Receipt className="w-4 h-4" />
                              </a>
                            ) : (
                              <button className="text-slate-300 hover:text-slate-400">
                                <Upload className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Empty State */}
                  {pagos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Receipt className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No hay pagos registrados</p>
                    </div>
                  )}
                </div>
                
                {/* Register Payment Button */}
                {isEditable && (
                  <div className="p-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowPagoModal(true)}
                      disabled={pagoPercent === 100}
                      className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        pagoPercent === 100
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {pagoPercent === 100 ? "Pago completo" : "Registrar Pago"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Pago Modal */}
      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPagoModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Registrar Pago</h3>
              <button onClick={() => setShowPagoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    max={restantePorPagar}
                    value={newPago.amount}
                    onChange={(e) => setNewPago(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Restante por pagar: ${restantePorPagar.toLocaleString("es-AR")}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medio de Pago</label>
                <select
                  value={newPago.medioPago}
                  onChange={(e) => setNewPago(prev => ({ ...prev, medioPago: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Factura (URL)</label>
                <input
                  type="url"
                  value={newPago.facturaUrl}
                  onChange={(e) => setNewPago(prev => ({ ...prev, facturaUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPagoModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarPago}
                disabled={!newPago.amount || parseFloat(newPago.amount) <= 0 || parseFloat(newPago.amount) > restantePorPagar}
                className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showNavigationModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
      />
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
