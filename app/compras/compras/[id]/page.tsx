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
  ChevronUp,
  Check,
  Package,
  Plus,
  Minus,
  Trash2,
  Upload,
  Receipt,
  X,
  ArrowRight,
  Search,
  Pencil,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { OrdenCompra, Item, OrdenCompraItem } from "@/lib/types"
import { ORDENES_COMPRA } from "@/lib/data/initial-ordenes"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { useAccount } from "@/lib/contexts/account-context"
import { useSettings } from "@/lib/contexts/settings-context"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { StockEditModal } from "@/components/modals/stock-edit-modal"
import { useItems } from "@/hooks/use-items"

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
  const { items: allItems } = useItems()
  const { stock } = useSettings()

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
  
  // New state for grid edit mode (matching ordenes-de-compra)
  const [itemDiscounts, setItemDiscounts] = useState<{ [idx: number]: { value: number; type: "cash" | "percent" } }>({})
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "cash" | "percent" }>({ value: 0, type: "percent" })
  const [originalPrices, setOriginalPrices] = useState<{ [idx: number]: number }>({})
  // State to track "Actualizar costo al recibir" checkbox per item (checked by default when price differs)
  const [actualizarCostoAlRecibir, setActualizarCostoAlRecibir] = useState<{ [idx: number]: boolean }>({})
  const [itemBonificadas, setItemBonificadas] = useState<{ [idx: number]: { value: number; visible: boolean } }>({})
  const [editingStockProyectado, setEditingStockProyectado] = useState<{ idx: number; value: string } | null>(null)
  const [stockEditModal, setStockEditModal] = useState<{
    isOpen: boolean
    itemIndex: number
    sku: string
    itemName: string
    total: number
    reservado: number
  } | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [newItemSearch, setNewItemSearch] = useState("")
  const [forceSelectionView, setForceSelectionView] = useState(false)
  
  // Selection view state
  const [selectionSearch, setSelectionSearch] = useState("")
  const [selectedProveedorItems, setSelectedProveedorItems] = useState<{ [id: string]: boolean }>({})
  
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
  
  // Check if we're in selection view (empty order or forced)
  const isInSelectionView = forceSelectionView
  
  // Helper to get stock for an item by SKU
  const getStockBySku = (sku: string): number => {
    // First check standalone items
    const standaloneItem = allItems.find(item => item.sku === sku)
    if (standaloneItem?.stock?.disponible !== undefined) {
      return parseInt(String(standaloneItem.stock.disponible))
    }
    
    // Check variants
    for (const item of allItems) {
      if (item.variants) {
        const variant = item.variants.find(v => v.sku === sku || `${item.skuPrefix}-${v.skuSuffix}` === sku)
        if (variant?.stock?.disponible !== undefined) {
          return parseInt(String(variant.stock.disponible))
        }
      }
    }
    return 0
  }
  
  // Get available items for adding to the compra (filtered by proveedor)
  const availableItems = useMemo(() => {
    if (!compra) return []
    const items: Array<{ id: string; name: string; sku: string; categoria?: string; tags?: string[]; precio?: number; stockDisponible?: number; stockReservado?: number }> = []
    
    INITIAL_ITEMS.forEach((item) => {
      if (item.proveedor === compra.proveedorNombre) {
        if (item.hasVariants && item.variants) {
          item.variants.forEach((variant) => {
            items.push({
              id: variant.id,
              name: variant.name || item.name,
              sku: `${item.skuPrefix}-${variant.skuSuffix}`,
              categoria: variant.categoria || item.categoria,
              tags: variant.atributosPrincipales?.map(a => a.value),
              precio: variant.precio?.costo || 0,
              stockDisponible: parseInt(variant.stock?.disponible || "0"),
              stockReservado: parseInt(variant.stock?.reservado || "0"),
            })
          })
        } else {
          items.push({
            id: item.id,
            name: item.name,
            sku: item.sku || "",
            categoria: item.categoria,
            precio: item.precio?.costo || 0,
            stockDisponible: parseInt(item.stock?.disponible || "0"),
            stockReservado: parseInt(item.stock?.reservado || "0"),
          })
        }
      }
    })
    return items
  }, [compra])
  
  // Get proveedor items with parent-child structure for the selection view
  const proveedorItemsStructured = useMemo(() => {
    if (!compra) return []
    return INITIAL_ITEMS.filter(item => item.proveedor === compra.proveedorNombre)
  }, [compra])
  
  // Filtered proveedor items for selection view
  const filteredProveedorItems = useMemo(() => {
    let items = [...proveedorItemsStructured]
    
    if (selectionSearch.trim()) {
      const searchWords = selectionSearch.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0)
      
      items = items.map(item => {
        const parentText = [item.name, item.sku, item.skuPrefix, item.marca, item.categoria].filter(Boolean).join(" ").toLowerCase()
        const parentMatches = searchWords.every(word => parentText.includes(word))
        
        if (parentMatches) return item
        
        if (item.variants && item.variants.length > 0) {
          const matchingVariants = item.variants.filter((v: any) => {
            const variantText = [v.name, v.sku, v.skuSuffix, v.categoria, item.name, item.marca].filter(Boolean).join(" ").toLowerCase()
            return searchWords.every(word => variantText.includes(word))
          })
          
          if (matchingVariants.length > 0) {
            return { ...item, variants: matchingVariants }
          }
        }
        
        return null
      }).filter(Boolean) as typeof items
    }
    
    return items
  }, [proveedorItemsStructured, selectionSearch])
  
  // Selection helpers
  const getItemId = (item: any): string => item.id || item.sku || ""
  
  const getAllSelectableIds = useMemo(() => {
    const ids: string[] = []
    for (const item of proveedorItemsStructured) {
      const isParent = item.hasVariants && item.variants && item.variants.length > 0
      if (isParent) {
        for (const child of item.variants!) {
          const id = getItemId(child)
          if (id) ids.push(id)
        }
      } else {
        const id = getItemId(item)
        if (id) ids.push(id)
      }
    }
    return ids
  }, [proveedorItemsStructured])
  
  const selectedProveedorCount = useMemo(() => {
    return Object.values(selectedProveedorItems).filter(Boolean).length
  }, [selectedProveedorItems])
  
  // Calculate subtotal and total with discounts (for grid view)
  const calculateTotals = useMemo(() => {
    if (!compra) return { subtotal: 0, discountAmount: 0, total: 0 }
    
    let subtotal = 0
    editableItems.forEach((item, idx) => {
      const itemTotal = item.unitPrice * item.quantity
      const discount = itemDiscounts[idx]
      const bonificadas = itemBonificadas[idx]
      const bonificadasAmount = (bonificadas?.value || 0) * item.unitPrice
      
      if (discount && discount.value > 0) {
        const discountAmount = discount.type === "percent" 
          ? (itemTotal * discount.value / 100) 
          : discount.value
        subtotal += itemTotal - discountAmount - bonificadasAmount
      } else {
        subtotal += itemTotal - bonificadasAmount
      }
    })
    
    // Apply global discount
    let discountAmount = 0
    if (globalDiscount.value > 0) {
      discountAmount = globalDiscount.type === "percent"
        ? (subtotal * globalDiscount.value / 100)
        : globalDiscount.value
    }
    
    return {
      subtotal,
      discountAmount,
      total: Math.max(0, subtotal - discountAmount)
    }
  }, [compra, editableItems, itemDiscounts, globalDiscount, itemBonificadas])

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
    // Clean up state for deleted item
    setOriginalPrices(prev => {
      const newPrices = { ...prev }
      delete newPrices[index]
      return newPrices
    })
    setItemBonificadas(prev => {
      const newBonif = { ...prev }
      delete newBonif[index]
      return newBonif
    })
    setItemDiscounts(prev => {
      const newDiscounts = { ...prev }
      delete newDiscounts[index]
      return newDiscounts
    })
  }
  
  // Handle price change with original price tracking
  const handlePriceChange = (idx: number, newPrice: number) => {
    // Track original price if not already tracked
    if (originalPrices[idx] === undefined) {
      setOriginalPrices(prev => ({ ...prev, [idx]: editableItems[idx].unitPrice }))
    }
    setEditableItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], unitPrice: newPrice }
      return updated
    })
    
    // Get the precio from precios data to compare
    const sku = editableItems[idx]?.sku
    const preciosOriginal = sku ? getPreciosOriginalPrice(sku) : null
    
    // Auto-check actualizar if price differs from precios original and not already set
    if (preciosOriginal !== null && newPrice !== preciosOriginal) {
      if (actualizarCostoAlRecibir[idx] === undefined) {
        setActualizarCostoAlRecibir(prev => ({ ...prev, [idx]: true }))
      }
    }
  }
  
  // Handle reset price to original
  const handleResetPrice = (idx: number) => {
    if (originalPrices[idx] === undefined) return
    const originalPrice = originalPrices[idx]
    setEditableItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], unitPrice: originalPrice }
      return updated
    })
    setOriginalPrices(prev => {
      const newPrices = { ...prev }
      delete newPrices[idx]
      return newPrices
    })
    // Also remove the actualizar checkbox state since we're resetting
    setActualizarCostoAlRecibir(prev => {
      const newState = { ...prev }
      delete newState[idx]
      return newState
    })
  }
  
  // Get the original price from precios data (INITIAL_ITEMS) for a given SKU
  const getPreciosOriginalPrice = useCallback((sku: string): number | null => {
    for (const item of INITIAL_ITEMS) {
      if (item.hasVariants && item.variants) {
        for (const variant of item.variants) {
          const variantSku = `${item.skuPrefix}-${variant.skuSuffix}`
          if (variantSku === sku) {
            return variant.precio?.costo || null
          }
        }
      } else if (item.sku === sku) {
        return item.precio?.costo || null
      }
    }
    return null
  }, [])
  
  // Handle stock proyectado change
  const handleStockProyectadoChange = (idx: number, newStockProyectado: number, stockActual: number) => {
    const newQuantity = Math.max(0, newStockProyectado - stockActual)
    setEditableItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], quantity: newQuantity }
      return updated
    })
  }
  
  // Handle item discount change
  const handleItemDiscountChange = (idx: number, value: number, type: "cash" | "percent") => {
    setItemDiscounts(prev => ({ ...prev, [idx]: { value, type } }))
  }
  
  // Handle bonificadas change
  const handleBonificadasChange = (idx: number, value: number) => {
    setItemBonificadas(prev => ({
      ...prev,
      [idx]: { ...prev[idx], value: Math.max(0, value), visible: true }
    }))
  }
  
  // Toggle bonificadas visibility
  const handleToggleBonificadas = (idx: number) => {
    setItemBonificadas(prev => {
      if (prev[idx]?.visible) {
        // Hide and reset
        const newBonif = { ...prev }
        delete newBonif[idx]
        return newBonif
      } else {
        // Show
        return { ...prev, [idx]: { value: 0, visible: true } }
      }
    })
  }
  
  // Handle stock edit modal accept
  const handleStockEditModalAccept = (newTotal: number, newReservado: number) => {
    setStockEditModal(null)
  }
  
  // Handle select item from modal
  const handleSelectItem = (item: typeof availableItems[0]) => {
    const newItem = {
      sku: item.sku,
      name: item.name,
      unitPrice: item.precio || 0,
      quantity: 1,
      categoria: item.categoria,
    }
    setEditableItems(prev => [...prev, newItem])
    setShowAddItemModal(false)
    setNewItemSearch("")
  }
  
  // Handle add free item
  const handleAddFreeItem = () => {
    if (!newItemSearch.trim()) return
    const newItem = {
      sku: "",
      name: newItemSearch,
      unitPrice: 0,
      quantity: 1,
    }
    setEditableItems(prev => [...prev, newItem])
    setShowAddItemModal(false)
    setNewItemSearch("")
  }
  
  // Handle proveedor selection for generating items
  const handleProveedorItemSelection = (item: any, isChild: boolean = false) => {
    const isParent = !isChild && item.hasVariants && item.variants && item.variants.length > 0
    if (isParent) {
      const childrenIds = item.variants!.map((v: any) => getItemId(v)).filter(Boolean)
      const allSelected = childrenIds.every((id: string) => selectedProveedorItems[id])
      const someSelected = childrenIds.some((id: string) => selectedProveedorItems[id])
      const shouldSelect = !allSelected && !someSelected
      setSelectedProveedorItems(prev => {
        const next = { ...prev }
        for (const id of childrenIds) next[id] = shouldSelect
        return next
      })
    } else {
      const id = getItemId(item)
      if (id) {
        setSelectedProveedorItems(prev => ({ ...prev, [id]: !prev[id] }))
      }
    }
  }
  
  const getProveedorSelectionState = (item: any, isChild: boolean = false): { checked: boolean; indeterminate: boolean } => {
    const isParent = !isChild && item.hasVariants && item.variants && item.variants.length > 0
    if (isParent) {
      const childrenIds = item.variants!.map((v: any) => getItemId(v)).filter(Boolean)
      const allSelected = childrenIds.every((id: string) => selectedProveedorItems[id])
      const someSelected = childrenIds.some((id: string) => selectedProveedorItems[id])
      return { checked: allSelected, indeterminate: someSelected && !allSelected }
    }
    const id = getItemId(item)
    return { checked: id ? !!selectedProveedorItems[id] : false, indeterminate: false }
  }
  
  // Handle generating items from selection
  const handleGenerarItems = () => {
    if (!compra || selectedProveedorCount === 0) return
    
    // Create a map of existing items by SKU
    const existingItemsBySku: { [sku: string]: typeof editableItems[0] } = {}
    for (const item of editableItems) {
      existingItemsBySku[item.sku] = item
    }
    
    const newItems: typeof editableItems = []
    
    for (const item of proveedorItemsStructured) {
      const isParent = item.hasVariants && item.variants && item.variants.length > 0
      if (isParent) {
        for (const variant of item.variants!) {
          const id = getItemId(variant)
          const sku = `${item.skuPrefix}-${variant.skuSuffix}`
          if (selectedProveedorItems[id] || selectedProveedorItems[sku]) {
            if (existingItemsBySku[sku]) {
              newItems.push(existingItemsBySku[sku])
            } else {
              newItems.push({
                sku,
                name: variant.name || item.name,
                quantity: 1,
                unitPrice: variant.precio?.costo || 0,
                categoria: variant.categoria || item.categoria,
              })
            }
          }
        }
      } else {
        const id = getItemId(item)
        const sku = item.sku || ""
        if (selectedProveedorItems[id] || selectedProveedorItems[sku]) {
          if (existingItemsBySku[sku]) {
            newItems.push(existingItemsBySku[sku])
          } else {
            newItems.push({
              sku,
              name: item.name,
              quantity: 1,
              unitPrice: item.precio?.costo || 0,
              categoria: item.categoria,
            })
          }
        }
      }
    }
    
    setEditableItems(newItems)
    setForceSelectionView(false)
    setSelectedProveedorItems({})
    setSelectionSearch("")
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
                  {isEditingResumen ? (
                    /* Edit Mode - Grid matching ordenes-de-compra */
                    <>
                      {/* Tab Header */}
                      <div className="bg-slate-100 border-b border-slate-200/80">
                        <div className="grid grid-cols-[2fr_0.8fr_2.2fr_1.2fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <div className="flex items-center px-4 gap-2">
                            <span>Item</span>
                            <button
                              onClick={() => {
                                // Pre-select existing items in selection view
                                const existingSelections: { [id: string]: boolean } = {}
                                for (const orderItem of editableItems) {
                                  for (const provItem of proveedorItemsStructured) {
                                    if (provItem.hasVariants && provItem.variants) {
                                      for (const variant of provItem.variants) {
                                        const variantSku = `${provItem.skuPrefix}-${variant.skuSuffix}`
                                        if (variantSku === orderItem.sku) {
                                          const id = getItemId(variant)
                                          if (id) existingSelections[id] = true
                                        }
                                      }
                                    } else if (provItem.sku === orderItem.sku) {
                                      const id = getItemId(provItem)
                                      if (id) existingSelections[id] = true
                                    }
                                  }
                                }
                                setSelectedProveedorItems(existingSelections)
                                setForceSelectionView(true)
                              }}
                              className="text-[10px] text-blue-500 hover:text-blue-700 font-normal normal-case tracking-normal hover:underline"
                            >
                              ir a seleccion
                            </button>
                          </div>
                          <div className="flex items-center justify-center">Cantidad</div>
                          <div className="flex items-center justify-center">Costo Unit.</div>
                          <div className="flex items-center justify-end pr-4">Subtotal</div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="bg-white">
                        {editableItems.map((item, idx) => {
                          const stockActual = Number(getStockBySku(item.sku)) || 0
                          const stockProyectado = editingStockProyectado?.idx === idx 
                            ? (parseInt(editingStockProyectado.value) || stockActual)
                            : stockActual + Number(item.quantity)
                          const itemDiscount = itemDiscounts[idx]
                          const bonificadas = itemBonificadas[idx]
                          const itemSubtotal = item.unitPrice * item.quantity
                          const discountAmount = itemDiscount?.value 
                            ? (itemDiscount.type === "percent" ? itemSubtotal * itemDiscount.value / 100 : itemDiscount.value)
                            : 0
                          const bonificadasAmount = (bonificadas?.value || 0) * item.unitPrice
                          const finalSubtotal = Math.max(0, itemSubtotal - discountAmount - bonificadasAmount)
                          const isPriceEdited = originalPrices[idx] !== undefined && originalPrices[idx] !== item.unitPrice
                          const minQty = getMinQuantity(item.sku)
                          const canDelete = minQty === 0
                          
                          // Get full stock info for modal
                          const getFullStockInfo = () => {
                            for (const stockItem of allItems) {
                              if (stockItem.variants) {
                                const variant = stockItem.variants.find(v => v.sku === item.sku || `${stockItem.skuPrefix}-${v.skuSuffix}` === item.sku)
                                if (variant?.stock) {
                                  return {
                                    total: parseInt(variant.stock.disponible || "0") + parseInt(variant.stock.reservado || "0"),
                                    reservado: parseInt(variant.stock.reservado || "0")
                                  }
                                }
                              }
                              if (stockItem.sku === item.sku && stockItem.stock) {
                                return {
                                  total: parseInt(stockItem.stock.disponible || "0") + parseInt(stockItem.stock.reservado || "0"),
                                  reservado: parseInt(stockItem.stock.reservado || "0")
                                }
                              }
                            }
                            return { total: stockActual, reservado: 0 }
                          }
                          const stockInfo = getFullStockInfo()
                          
                          return (
                            <div
                              key={idx}
                              className="grid grid-cols-[2fr_0.8fr_2.2fr_1.2fr] items-center py-3 px-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors group"
                            >
                              {/* Item - Thumbnail, Name, SKU + Delete button */}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  disabled={!canDelete}
                                  className={`p-1 rounded transition-colors flex-shrink-0 ${
                                    canDelete 
                                      ? "hover:bg-red-50 text-slate-300 hover:text-red-500" 
                                      : "text-slate-200 cursor-not-allowed"
                                  }`}
                                  title={canDelete ? "Eliminar" : "No se puede eliminar (items ya recibidos)"}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <div className="w-11 h-11 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                  <Image
                                    src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                    alt={item.name}
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{item.sku}</p>
                                </div>
                              </div>

                              {/* Cantidad with chevrons inside */}
                              <div className="flex items-center justify-center">
                                <div className="relative">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.quantity === 0 ? "" : item.quantity}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      if (val === "" || val === "-") {
                                        handleUpdateItem(idx, "quantity", Math.max(minQty, 0))
                                      } else {
                                        const num = parseInt(val)
                                        if (!isNaN(num) && num >= 0) {
                                          handleUpdateItem(idx, "quantity", Math.max(minQty, num))
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = e.target.value
                                      if (val === "" || parseInt(val) < minQty || isNaN(parseInt(val))) {
                                        handleUpdateItem(idx, "quantity", minQty)
                                      }
                                    }}
                                    className="w-20 text-center text-sm font-medium bg-blue-50 border border-blue-200 focus:border-blue-400 rounded pl-2 pr-6 py-1 focus:outline-none transition-all"
                                  />
                                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                                    <button
                                      onClick={() => handleUpdateItem(idx, "quantity", item.quantity + 1)}
                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateItem(idx, "quantity", Math.max(minQty, item.quantity - 1))}
                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Costo Unit. with original, restablecer, and actualizar checkbox */}
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const preciosOriginal = getPreciosOriginalPrice(item.sku)
                                  const pricesDiffer = preciosOriginal !== null && item.unitPrice !== preciosOriginal
                                  const showActualizarCheckbox = pricesDiffer
                                  
                                  return (
                                    <div className="flex items-center gap-3">
                                      {/* Price input and original/restablecer */}
                                      <div className="flex flex-col items-center">
                                        <div className="flex items-center">
                                          <span className="text-xs text-slate-400 mr-0.5">$</span>
                                          <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handlePriceChange(idx, parseInt(e.target.value) || 0)}
                                            className="w-20 text-center text-sm font-medium bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-1 py-1 focus:outline-none focus:bg-white transition-all"
                                            min={0}
                                          />
                                        </div>
                                        {pricesDiffer && (
                                          <>
                                            <span className="text-[9px] text-slate-400 mt-0.5">
                                              original: ${preciosOriginal?.toLocaleString("es-AR")}
                                            </span>
                                            <button
                                              onClick={() => handleResetPrice(idx)}
                                              className="text-[9px] text-blue-500 hover:text-blue-700 hover:underline"
                                            >
                                              restablecer
                                            </button>
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Actualizar costo al recibir checkbox */}
                                      {showActualizarCheckbox && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={actualizarCostoAlRecibir[idx] !== false}
                                            onChange={(e) => setActualizarCostoAlRecibir(prev => ({ ...prev, [idx]: e.target.checked }))}
                                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                                          />
                                          <span className="text-[9px] text-slate-500 whitespace-nowrap">
                                            Actualizar costo al recibir
                                          </span>
                                        </label>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>

                              {/* Subtotal with Discount and Bonificadas */}
                              <div className="flex items-center justify-end pr-4">
                                <div className="text-right">
                                  {(discountAmount > 0 || bonificadasAmount > 0) ? (
                                    <>
                                      <span className="text-sm font-semibold text-gray-900">
                                        ${finalSubtotal.toLocaleString("es-AR")}
                                      </span>
                                      <p className="text-[10px] text-slate-400 line-through">
                                        ${itemSubtotal.toLocaleString("es-AR")}
                                      </p>
                                    </>
                                  ) : (
                                    <span className="text-sm font-semibold text-gray-900">
                                      ${itemSubtotal.toLocaleString("es-AR")}
                                    </span>
                                  )}
                                  {/* Discount input */}
                                  <div className="flex items-center gap-1 mt-1 justify-end">
                                    <input
                                      type="number"
                                      placeholder="Dto"
                                      value={itemDiscount?.value || ""}
                                      onChange={(e) => handleItemDiscountChange(idx, parseFloat(e.target.value) || 0, itemDiscount?.type || "percent")}
                                      className="w-12 text-[10px] text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400"
                                    />
                                    <button
                                      onClick={() => handleItemDiscountChange(idx, itemDiscount?.value || 0, itemDiscount?.type === "percent" ? "cash" : "percent")}
                                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                        itemDiscount?.type === "percent" || !itemDiscount
                                          ? "bg-blue-50 border-blue-200 text-blue-600"
                                          : "bg-slate-50 border-slate-200 text-slate-500"
                                      }`}
                                    >
                                      {itemDiscount?.type === "cash" ? "$" : "%"}
                                    </button>
                                  </div>
                                  
                                  {/* Unidades Bonificadas */}
                                  {bonificadas?.visible ? (
                                    <div className="flex items-center gap-1 mt-1 justify-end">
                                      <span className="text-[9px] text-slate-500">Bonif:</span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={bonificadas.value || ""}
                                        onChange={(e) => handleBonificadasChange(idx, parseInt(e.target.value) || 0)}
                                        className="w-10 text-[10px] text-center bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 focus:outline-none focus:border-emerald-400"
                                      />
                                      <span className="text-[9px] text-slate-400">uds</span>
                                      <button
                                        onClick={() => handleToggleBonificadas(idx)}
                                        className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleBonificadas(idx)}
                                      className="text-[9px] text-blue-500 hover:text-blue-700 hover:underline mt-1 block ml-auto"
                                    >
                                      + uds bonificadas
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {/* Add Item Button */}
                        <button
                          className="w-full py-4 text-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-2 border-t border-dashed border-slate-200 cursor-pointer"
                          onClick={() => setShowAddItemModal(true)}
                        >
                          <Plus className="w-4 h-4" />
                          Agregar item
                        </button>
                      </div>

                      {/* Total Row - Part of the grid, closes the table */}
                      <div className="border-t border-slate-200 bg-slate-100 py-4 px-4">
                        <div className="flex justify-end">
                          <div className="flex flex-col items-end gap-2 min-w-[180px]">
                            {/* Subtotal Estimado */}
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs text-slate-500">Subtotal</span>
                              <span className="text-sm text-gray-700">
                                ${calculateTotals.subtotal.toLocaleString("es-AR")}
                              </span>
                            </div>
                            
                            {/* Global Discount */}
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs text-slate-500">Descuento</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={globalDiscount.value || ""}
                                  onChange={(e) => setGlobalDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                  className="w-14 text-sm text-center bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                                />
                                <button
                                  onClick={() => setGlobalDiscount(prev => ({ ...prev, type: prev.type === "percent" ? "cash" : "percent" }))}
                                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                                    globalDiscount.type === "percent"
                                      ? "bg-blue-50 border-blue-200 text-blue-600"
                                      : "bg-slate-50 border-slate-200 text-slate-500"
                                  }`}
                                >
                                  {globalDiscount.type === "cash" ? "$" : "%"}
                                </button>
                              </div>
                            </div>
                            
                            {/* Discount amount if applied */}
                            {calculateTotals.discountAmount > 0 && (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-slate-400"></span>
                                <span className="text-xs text-red-500">
                                  -${calculateTotals.discountAmount.toLocaleString("es-AR")}
                                </span>
                              </div>
                            )}
                            
                            {/* Divider */}
                            <div className="w-full border-t border-slate-300 my-1" />
                            
                            {/* Total Estimado - Label and Number stacked */}
                            <div className="flex flex-col items-end w-full pt-1">
                              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Estimado</span>
                              <span className="text-2xl font-bold text-gray-900 mt-0.5">
                                ${calculateTotals.total.toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* View Mode - Simple table */
                    <>
                      {/* Items Table */}
                      <div className="divide-y divide-slate-50">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <div className="col-span-5">Item</div>
                          <div className="col-span-2 text-center">Cantidad</div>
                          <div className="col-span-2 text-right">Costo Unitario</div>
                          <div className="col-span-3 text-right">Subtotal</div>
                        </div>

                        {/* Item Rows */}
                        {editableItems.map((item, idx) => (
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
                              <div>
                                <p className="text-sm text-gray-800">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.sku}</p>
                              </div>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="text-sm text-slate-600">{item.quantity}</span>
                            </div>
                            <div className="col-span-2 text-right">
                              {(() => {
                                const preciosOriginal = getPreciosOriginalPrice(item.sku)
                                const pricesDiffer = preciosOriginal !== null && item.unitPrice !== preciosOriginal
                                
                                return (
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm text-slate-600">${item.unitPrice.toLocaleString("es-AR")}</span>
                                    {pricesDiffer && (
                                      <>
                                        <span className="text-[9px] text-slate-400">
                                          original: ${preciosOriginal?.toLocaleString("es-AR")}
                                        </span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <input
                                            type="checkbox"
                                            checked={actualizarCostoAlRecibir[idx] !== false}
                                            disabled
                                            className="w-3 h-3 rounded border-slate-300 text-blue-600 cursor-not-allowed opacity-60"
                                          />
                                          <span className="text-[9px] text-slate-400 whitespace-nowrap">
                                            Actualizar al recibir
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="col-span-3 text-right">
                              <span className="text-sm font-medium text-slate-800">
                                ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Row */}
                      <div className="bg-slate-50 border-t border-slate-200 py-3 px-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">Total</span>
                          <span className="text-base font-bold text-gray-900">
                            ${calculatedTotal.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
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
      
  {/* Stock Edit Modal */}
  {stockEditModal && (
  <StockEditModal
  isOpen={stockEditModal.isOpen}
  onClose={() => setStockEditModal(null)}
  onAccept={handleStockEditModalAccept}
  initialTotal={stockEditModal.total}
  initialReservado={stockEditModal.reservado}
  itemName={stockEditModal.itemName}
  stockMinimo={stock.stockMinimoPorDefecto}
  />
  )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowAddItemModal(false)
              setNewItemSearch("")
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Agregar Item</h3>
              <button
                onClick={() => {
                  setShowAddItemModal(false)
                  setNewItemSearch("")
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar item o escribir nombre..."
                  value={newItemSearch}
                  onChange={(e) => setNewItemSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-80 overflow-auto">
              {availableItems
                .filter(item => 
                  !newItemSearch || 
                  item.name.toLowerCase().includes(newItemSearch.toLowerCase()) ||
                  item.sku.toLowerCase().includes(newItemSearch.toLowerCase())
                )
                .filter(item => !editableItems.some(ei => ei.sku === item.sku))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                      <Image
                        src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        ${(item.precio || 0).toLocaleString("es-AR")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.stockDisponible} disponibles
                      </p>
                    </div>
                  </button>
                ))}

              {/* No results / free text option */}
              {availableItems.filter(item => 
                !newItemSearch || 
                item.name.toLowerCase().includes(newItemSearch.toLowerCase()) ||
                item.sku.toLowerCase().includes(newItemSearch.toLowerCase())
              ).filter(item => !editableItems.some(ei => ei.sku === item.sku)).length === 0 && newItemSearch && (
                <button
                  onClick={handleAddFreeItem}
                  className="w-full px-5 py-4 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700">
                      Agregar &quot;{newItemSearch}&quot;
                    </p>
                    <p className="text-xs text-slate-400">Item libre (sin SKU)</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Selection View Modal */}
      {isInSelectionView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setForceSelectionView(false)
              setSelectedProveedorItems({})
              setSelectionSearch("")
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Seleccionar Items</h3>
                <p className="text-xs text-slate-500 mt-0.5">Productos de {compra?.proveedorNombre}</p>
              </div>
              <button
                onClick={() => {
                  setForceSelectionView(false)
                  setSelectedProveedorItems({})
                  setSelectionSearch("")
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={selectionSearch}
                  onChange={(e) => setSelectionSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-auto">
              {/* Grid Header */}
              <div className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                <div className="grid grid-cols-12 h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                      checked={selectedProveedorCount === getAllSelectableIds.length && getAllSelectableIds.length > 0}
                      onChange={() => {
                        if (selectedProveedorCount === getAllSelectableIds.length) {
                          setSelectedProveedorItems({})
                        } else {
                          const all: { [id: string]: boolean } = {}
                          getAllSelectableIds.forEach(id => all[id] = true)
                          setSelectedProveedorItems(all)
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-5 flex items-center px-4">Item</div>
                  <div className="col-span-3 flex items-center justify-center">Stock</div>
                  <div className="col-span-3 flex items-center justify-center">Costo Unitario</div>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-100">
                {filteredProveedorItems.map((item) => {
                  const isParent = item.hasVariants && item.variants && item.variants.length > 0
                  const parentState = getProveedorSelectionState(item)
                  
                  return (
                    <div key={item.id}>
                      {/* Parent Row */}
                      <div
                        className={`grid grid-cols-12 items-center py-3 px-4 cursor-pointer transition-colors ${
                          isParent ? "bg-slate-50/50 hover:bg-slate-100/50" : "hover:bg-slate-50"
                        }`}
                        onClick={() => handleProveedorItemSelection(item)}
                      >
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                            checked={parentState.checked}
                            ref={(el) => {
                              if (el) el.indeterminate = parentState.indeterminate
                            }}
                            onChange={() => {}}
                          />
                        </div>
                        <div className="col-span-5 flex items-center gap-3 px-4">
                          <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                            <Image
                              src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className={`text-sm text-gray-900 ${isParent ? "font-semibold" : "font-medium"}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {isParent ? `${item.variants?.length} variantes` : (item.sku || item.skuPrefix)}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-3 flex items-center justify-center">
                          {!isParent && (
                            <span className="text-sm text-slate-600">
                              {parseInt(item.stock?.disponible || "0")} disponibles
                            </span>
                          )}
                        </div>
                        <div className="col-span-3 flex items-center justify-center">
                          {!isParent && (
                            <span className="text-sm font-medium text-gray-700">
                              ${(item.precio?.costo || 0).toLocaleString("es-AR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Children Rows */}
                      {isParent && item.variants?.map((variant: any) => {
                        const childState = getProveedorSelectionState(variant, true)
                        return (
                          <div
                            key={variant.id}
                            className="grid grid-cols-12 items-center py-2.5 px-4 pl-12 hover:bg-slate-50 cursor-pointer transition-colors border-t border-slate-50"
                            onClick={() => handleProveedorItemSelection(variant, true)}
                          >
                            <div className="col-span-1 flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                                checked={childState.checked}
                                onChange={() => {}}
                              />
                            </div>
                            <div className="col-span-5 flex items-center gap-3 px-4">
                              <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                <Image
                                  src={getCategoryImage(variant.categoria || item.categoria) || "/placeholder.svg"}
                                  alt={variant.name || item.name}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-800">{variant.name || item.name}</p>
                                  {variant.atributosPrincipales?.map((attr: any, i: number) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                                      {attr.value}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-400">{item.skuPrefix}-{variant.skuSuffix}</p>
                              </div>
                            </div>
                            <div className="col-span-3 flex items-center justify-center">
                              <span className="text-sm text-slate-600">
                                {parseInt(variant.stock?.disponible || "0")} disponibles
                              </span>
                            </div>
                            <div className="col-span-3 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                ${(variant.precio?.costo || 0).toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-100 py-4 px-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {selectedProveedorCount > 0 
                    ? `${selectedProveedorCount} item${selectedProveedorCount > 1 ? "s" : ""} seleccionado${selectedProveedorCount > 1 ? "s" : ""}`
                    : "Selecciona los items para la compra"
                  }
                </span>
                <button
                  onClick={handleGenerarItems}
                  disabled={selectedProveedorCount === 0}
                  className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar selección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
