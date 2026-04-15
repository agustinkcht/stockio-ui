"use client"

import { useState, useMemo, Suspense, use, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Plus,
  Trash2,
  FileText,
  FileDown,
  ShoppingCart,
  X,
  Search,
  Check,
  Minus,
  Pencil,
  ArrowRight,
  Percent,
  ChevronDown,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { EstadoOrdenDeCompra } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import type { Item, OrdenDeCompraItem, OrdenDeCompra, OrdenCompra, OrdenCompraItem } from "@/lib/types"
import { useOrdenesDeCompra } from "@/hooks/use-ordenes-de-compra"
import { useAccount } from "@/lib/contexts/account-context"
import { useItems } from "@/hooks/use-items"
import { ORDENES_COMPRA } from "@/lib/data/initial-ordenes"
import { Eye } from "lucide-react"

const estadoLabels: Record<EstadoOrdenDeCompra, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
}



function formatDateShort(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

function OrdenDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  // Use hooks for data persistence
  const { ordenes, updateOrden, updateEstado } = useOrdenesDeCompra()
  const { currentAccount } = useAccount()
  const { items: allItems } = useItems()
  
  // Proveedor change state
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false)
  const [proveedorSearch, setProveedorSearch] = useState("")
  const [showProveedorConfirmModal, setShowProveedorConfirmModal] = useState(false)
  const [pendingProveedor, setPendingProveedor] = useState<string | null>(null)
  const [isHoveringProveedor, setIsHoveringProveedor] = useState(false)
  const proveedorDropdownRef = useRef<HTMLDivElement>(null)
  
  // Click outside handler for proveedor dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (proveedorDropdownRef.current && !proveedorDropdownRef.current.contains(event.target as Node)) {
        setShowProveedorDropdown(false)
      }
    }
    if (showProveedorDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showProveedorDropdown])
  
  // Discount state
  const [itemDiscounts, setItemDiscounts] = useState<{ [idx: number]: { value: number; type: "cash" | "percent" } }>({})
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "cash" | "percent" }>({ value: 0, type: "percent" })

  // Find orden from ordenes array directly (not via callback during render)
  const foundOrden = useMemo(() => {
    return ordenes.find(o => o.id === id) || null
  }, [ordenes, id])
  
  const [orden, setOrden] = useState<OrdenDeCompra | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Sync local state with found orden
  useEffect(() => {
    if (foundOrden) {
      setOrden(foundOrden)
    }
  }, [foundOrden])
  
  // Check if order is editable (only borrador state)
  const isEditable = orden?.estado === "borrador"
  
  // New item modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [newItemSearch, setNewItemSearch] = useState("")
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  
  // Selection state for empty order item picker
  const [selectedProveedorItems, setSelectedProveedorItems] = useState<{ [id: string]: boolean }>({})
  const [showSelectionMode, setShowSelectionMode] = useState(false)
  
  // Get unique proveedores from all items
  const uniqueProveedores = useMemo(() => {
    const proveedores = new Set<string>()
    INITIAL_ITEMS.forEach(item => {
      if (item.proveedor) proveedores.add(item.proveedor)
    })
    return Array.from(proveedores).sort()
  }, [])
  
  // Filter proveedores based on search
  const filteredProveedores = useMemo(() => {
    if (!proveedorSearch) return uniqueProveedores
    return uniqueProveedores.filter(p => 
      p.toLowerCase().includes(proveedorSearch.toLowerCase())
    )
  }, [proveedorSearch, uniqueProveedores])
  
  // Helper to get stock for an item by SKU
  const getStockBySku = (sku: string): number => {
    // First check standalone items
    const standaloneItem = allItems.find(item => item.sku === sku)
    if (standaloneItem?.stock?.disponible !== undefined) {
      return standaloneItem.stock.disponible
    }
    
    // Check variants
    for (const item of allItems) {
      if (item.variants) {
        const variant = item.variants.find(v => v.sku === sku || `${item.skuPrefix}-${v.skuSuffix}` === sku)
        if (variant?.stock?.disponible !== undefined) {
          return variant.stock.disponible
        }
      }
    }
    return 0
  }
  
  // Get all items (standalone and variants) that match the proveedor - flat list for modal
  const availableItems = useMemo(() => {
    if (!orden) return []
    const items: Array<{ id: string; name: string; sku: string; categoria?: string; tags?: string[]; precio?: number; stockDisponible?: number; stockReservado?: number }> = []
    
    INITIAL_ITEMS.forEach((item) => {
      if (item.proveedor === orden.proveedorNombre) {
        if (item.hasVariants && item.variants) {
          item.variants.forEach((variant) => {
            const sku = `${item.skuPrefix}-${variant.skuSuffix}`
            items.push({
              id: variant.id,
              name: variant.name || item.name,
              sku,
              categoria: variant.categoria || item.categoria,
              tags: variant.atributosPrincipales?.map(a => a.value),
              precio: variant.precio?.costo || 0,
              stockDisponible: variant.stock?.disponible || 0,
              stockReservado: variant.stock?.reservado || 0,
            })
          })
        } else {
          items.push({
            id: item.id,
            name: item.name,
            sku: item.sku || "",
            categoria: item.categoria,
            precio: item.precio?.costo || 0,
            stockDisponible: item.stock?.disponible || 0,
            stockReservado: item.stock?.reservado || 0,
          })
        }
      }
    })
    return items
  }, [orden])
  
  // Get proveedor items with parent-child structure for the empty order picker
  const proveedorItemsStructured = useMemo(() => {
    if (!orden) return []
    return INITIAL_ITEMS.filter(item => item.proveedor === orden.proveedorNombre)
  }, [orden])
  
  // Selection helpers for empty order picker
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
  
  const selectAllActive = useMemo(() => {
    if (getAllSelectableIds.length === 0) return false
    return getAllSelectableIds.every(id => selectedProveedorItems[id])
  }, [getAllSelectableIds, selectedProveedorItems])
  
  const selectAllIndeterminate = useMemo(() => {
    const someSelected = getAllSelectableIds.some(id => selectedProveedorItems[id])
    return someSelected && !selectAllActive
  }, [getAllSelectableIds, selectedProveedorItems, selectAllActive])
  
  const handleSelectAllProveedorItems = () => {
    const shouldSelect = !selectAllActive && !selectAllIndeterminate
    const next: { [id: string]: boolean } = {}
    for (const id of getAllSelectableIds) next[id] = shouldSelect
    setSelectedProveedorItems(next)
  }
  
  const handleProveedorItemSelection = (item: any, isChild: boolean = false) => {
    const isParent = !isChild && item.hasVariants && item.variants && item.variants.length > 0
    if (isParent) {
      // Toggle all children
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
  
  const selectedProveedorCount = useMemo(() => {
    return Object.values(selectedProveedorItems).filter(Boolean).length
  }, [selectedProveedorItems])
  
  // Handle "Generar Compra" - convert selected items to order items
  const handleGenerarCompra = () => {
    if (!orden || selectedProveedorCount === 0) return
    
    // Start with existing items if in selection mode (to preserve them)
    const existingSkus = new Set(orden.items.map(it => it.sku))
    const newItems: OrdenDeCompraItem[] = [...orden.items]
    
    for (const item of proveedorItemsStructured) {
      const isParent = item.hasVariants && item.variants && item.variants.length > 0
      if (isParent) {
        for (const variant of item.variants!) {
          const id = getItemId(variant)
          const sku = `${item.skuPrefix}-${variant.skuSuffix}`
          if (selectedProveedorItems[id] && !existingSkus.has(sku)) {
            newItems.push({
              sku,
              name: variant.name || item.name,
              quantity: 1,
              unitPrice: variant.precio?.costo || 0,
              total: variant.precio?.costo || 0,
              categoria: variant.categoria || item.categoria,
              tags: variant.atributosPrincipales?.map(a => a.value),
            })
          }
        }
      } else {
        const id = getItemId(item)
        const sku = item.sku || ""
        if (selectedProveedorItems[id] && !existingSkus.has(sku)) {
          newItems.push({
            sku,
            name: item.name,
            quantity: 1,
            unitPrice: item.precio?.costo || 0,
            total: item.precio?.costo || 0,
            categoria: item.categoria,
          })
        }
      }
    }
    
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    const updatedOrden = { ...orden, items: newItems, importeEstimado: newTotal }
    setOrden(updatedOrden)
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setSelectedProveedorItems({})
    setShowSelectionMode(false)
    setHasChanges(true)
  }
  
  // Filter items based on search
  const searchResults = useMemo(() => {
    if (!newItemSearch.trim()) return []
    const search = newItemSearch.toLowerCase()
    return availableItems.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search)
    ).slice(0, 6)
  }, [newItemSearch, availableItems])
  
  // Handle "Llevar a Compras" - converts orden to aceptada and creates a compra
  const handleLlevarACompras = () => {
    if (!orden || orden.items.length === 0 || !currentAccount) return
    
    // Update orden estado to aceptada
    updateEstado(orden.id, "aceptada")
    
    // Get compras from localStorage
    const storageKey = `stockio_compras_${currentAccount}`
    let compras: OrdenCompra[] = []
    try {
      const storedCompras = localStorage.getItem(storageKey)
      compras = storedCompras ? JSON.parse(storedCompras) : ORDENES_COMPRA
    } catch {
      compras = ORDENES_COMPRA
    }
    
    // Generate new ID based on existing compras
    const existingNumbers = compras.map(c => c.numero)
    const maxNumber = Math.max(0, ...existingNumbers)
    const newNumber = maxNumber + 1
    const newId = `OC-${newNumber}`
    
    // Create new compra with OrdenCompra type
    const now = new Date()
    const newCompra: OrdenCompra = {
      id: newId,
      numero: newNumber,
      fechaCreacion: now.toISOString().split("T")[0],
      proveedorId: orden.proveedorId,
      proveedorNombre: orden.proveedorNombre,
      medioPago: "transferencia",
      estadoPago: 0, // 0% by default
      estadoEntrega: "prevista",
      fechaEntrega: now.toISOString().split("T")[0], // Same day by default
      items: orden.items.map(item => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        quantityReceived: 0, // 0% received by default
        unitPrice: item.unitPrice,
        total: item.total,
        categoria: item.categoria,
        thumbnail: "/placeholder.svg",
      })),
      importeTotal: orden.importeEstimado,
    }
    
    // Save to localStorage
    const updatedCompras = [newCompra, ...compras]
    localStorage.setItem(storageKey, JSON.stringify(updatedCompras))
    
    // Navigate to compras
    router.push("/compras/compras")
  }
  
  // Handle "Ver en Compras" - just navigate
  const handleVerEnCompras = () => {
    router.push("/compras/compras")
  }

  // Filter out already selected items - MUST be before early return
  const notSelectedItems = useMemo(() => {
    if (!orden) return availableItems
    const selectedSkus = new Set(orden.items.map(it => it.sku))
    return availableItems.filter(it => !selectedSkus.has(it.sku))
  }, [availableItems, orden])

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Órdenes de Compra", href: "/compras/ordenes-de-compra" },
    { label: orden ? `ODC-${orden.numero}` : "Detalle" },
  ]

  // All event handlers - defined as arrow functions, safe after hooks
  const handleQuantityChange = (idx: number, newQuantity: number) => {
    if (!orden) return
    const newItems = orden.items.map((it, i) =>
      i === idx ? { ...it, quantity: newQuantity, total: newQuantity * it.unitPrice } : it
    )
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
  }

  const handlePriceChange = (idx: number, newPrice: number) => {
    if (!orden) return
    const newItems = orden.items.map((it, i) =>
      i === idx ? { ...it, unitPrice: newPrice, total: it.quantity * newPrice } : it
    )
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
  }

  const handleDeleteItem = (idx: number) => {
    if (!orden) return
    const newItems = orden.items.filter((_, i) => i !== idx)
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
  }

  const handleDeshacer = () => {
    // Reset to the stored version from ordenes array
    setOrden(foundOrden)
    setHasChanges(false)
    setShowAddItemModal(false)
    setNewItemSearch("")
  }

  const handleGuardar = () => {
    if (orden) {
      updateOrden(orden.id, orden)
    }
    setHasChanges(false)
  }

  const handleSelectItem = (item: typeof availableItems[0]) => {
    if (!orden) return
    const newItem: OrdenDeCompraItem = {
      sku: item.sku,
      name: item.name,
      quantity: 1,
      unitPrice: item.precio || 0,
      total: item.precio || 0,
      categoria: item.categoria,
      tags: item.tags,
    }
    const newItems = [...orden.items, newItem]
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
    setShowAddItemModal(false)
    setNewItemSearch("")
  }

  const handleAddFreeItem = () => {
    if (!orden || !newItemSearch.trim()) return
    const newItem: OrdenDeCompraItem = {
      sku: "",
      name: newItemSearch,
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    const newItems = [...orden.items, newItem]
    setOrden({ ...orden, items: newItems })
    updateOrden(orden.id, { items: newItems })
    setHasChanges(true)
    setShowAddItemModal(false)
    setNewItemSearch("")
  }
  
  // Handle clear all items
  const handleClearAllItems = () => {
    if (!orden) return
    setOrden({ ...orden, items: [], importeEstimado: 0 })
    updateOrden(orden.id, { items: [], importeEstimado: 0 })
    setItemDiscounts({})
    setGlobalDiscount({ value: 0, type: "percent" })
    setHasChanges(true)
    setShowSelectionMode(false)
  }
  
  // Handle go to selection mode (keeping current selections)
  const handleGoToSelectionMode = () => {
    if (!orden) return
    // Pre-select current items in selection state
    const currentSelections: { [id: string]: boolean } = {}
    orden.items.forEach(item => {
      // Find the item in availableItems by SKU to get its ID
      const found = availableItems.find(ai => ai.sku === item.sku)
      if (found) {
        currentSelections[found.id] = true
      }
    })
    setSelectedProveedorItems(currentSelections)
    setShowSelectionMode(true)
  }
  
  // Handle stock proyectado change (updates a pedir accordingly)
  const handleStockProyectadoChange = (idx: number, newStockProyectado: number) => {
    if (!orden) return
    const item = orden.items[idx]
    const stockActual = Number(getStockBySku(item.sku)) || 0
    const newQuantity = Math.max(0, newStockProyectado - stockActual)
    handleQuantityChange(idx, newQuantity)
  }
  
  // Handle proveedor change request
  const handleProveedorClick = () => {
    if (!isEditable) return
    setProveedorSearch(orden?.proveedorNombre || "")
    setShowProveedorDropdown(true)
  }
  
  const handleProveedorSelect = (proveedor: string) => {
    if (!orden || proveedor === orden.proveedorNombre) {
      setShowProveedorDropdown(false)
      setProveedorSearch("")
      return
    }
    // Show confirmation modal
    setPendingProveedor(proveedor)
    setShowProveedorConfirmModal(true)
    setShowProveedorDropdown(false)
  }
  
  const handleConfirmProveedorChange = () => {
    if (!orden || !pendingProveedor) return
    // Reset the order with new proveedor
    const resetOrden = {
      ...orden,
      proveedorNombre: pendingProveedor,
      items: [],
      importeEstimado: 0,
    }
    setOrden(resetOrden)
    updateOrden(orden.id, resetOrden)
    setShowProveedorConfirmModal(false)
    setPendingProveedor(null)
    setProveedorSearch("")
    setItemDiscounts({})
    setGlobalDiscount({ value: 0, type: "percent" })
    setHasChanges(true)
  }
  
  // Handle item discount change
  const handleItemDiscountChange = (idx: number, value: number, type: "cash" | "percent") => {
    setItemDiscounts(prev => ({ ...prev, [idx]: { value, type } }))
    setHasChanges(true)
  }
  
  // Calculate subtotal and total with discounts
  const calculateTotals = useMemo(() => {
    if (!orden) return { subtotal: 0, discountAmount: 0, total: 0 }
    
    let subtotal = 0
    orden.items.forEach((item, idx) => {
      const itemTotal = item.total
      const discount = itemDiscounts[idx]
      if (discount && discount.value > 0) {
        const discountAmount = discount.type === "percent" 
          ? (itemTotal * discount.value / 100) 
          : discount.value
        subtotal += itemTotal - discountAmount
      } else {
        subtotal += itemTotal
      }
    })
    
    let discountAmount = 0
    if (globalDiscount.value > 0) {
      discountAmount = globalDiscount.type === "percent" 
        ? (subtotal * globalDiscount.value / 100) 
        : globalDiscount.value
    }
    
    const total = subtotal - discountAmount
    return { subtotal, discountAmount, total }
  }, [orden, itemDiscounts, globalDiscount])

  // Early return for not found - AFTER all hooks
  if (!orden) {
    return (
      <div className="flex items-center justify-center h-screen bg-[rgb(243,242,238)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Orden no encontrada</h2>
          <p className="text-muted-foreground mb-4">La orden de compra que buscas no existe.</p>
          <Button onClick={() => router.push("/compras/ordenes-de-compra")}>
            Volver a Órdenes
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
          {/* Utility Bar - Same as all other views */}
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
                  disabled={!hasChanges}
                  onClick={handleDeshacer}
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground hover:bg-muted text-sm font-medium"
                  title="Deshacer cambios"
                >
                  Deshacer
                </button>

                <button
                  disabled={!hasChanges}
                  onClick={handleGuardar}
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary hover:bg-muted text-sm font-medium"
                  title="Guardar cambios"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Order Header */}
            <div className="px-6 py-4 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title and info */}
                <div className="flex items-center gap-6">
                  {/* Order ID as title with label */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orden de Compra</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ODC-{orden.numero}</h1>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        orden.estado === "aceptada" ? "bg-emerald-50 text-emerald-700" :
                        orden.estado === "enviada" ? "bg-blue-50 text-blue-700" :
                        orden.estado === "rechazada" ? "bg-red-50 text-red-700" :
                        orden.estado === "cancelada" ? "bg-gray-100 text-gray-600" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {estadoLabels[orden.estado]}
                      </span>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="h-10 w-px bg-border/40" />
                  
                  {/* Proveedor */}
                  <div className="relative" ref={proveedorDropdownRef}>
                    <div 
                      className={`flex flex-col ${isEditable ? "cursor-pointer group" : ""}`}
                      onMouseEnter={() => setIsHoveringProveedor(true)}
                      onMouseLeave={() => setIsHoveringProveedor(false)}
                      onClick={handleProveedorClick}
                    >
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Proveedor</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-800">{orden.proveedorNombre}</span>
                        {isEditable && isHoveringProveedor && (
                          <Pencil className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Proveedor Dropdown */}
                    {showProveedorDropdown && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-64">
                        <div className="p-2 border-b border-slate-100">
                          <input
                            type="text"
                            value={proveedorSearch}
                            onChange={(e) => setProveedorSearch(e.target.value)}
                            placeholder="Buscar proveedor..."
                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {filteredProveedores.map((proveedor) => (
                            <button
                              key={proveedor}
                              onClick={() => handleProveedorSelect(proveedor)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                proveedor === orden.proveedorNombre ? "bg-blue-50 text-blue-700" : "text-gray-700"
                              }`}
                            >
                              {proveedor}
                            </button>
                          ))}
                          {filteredProveedores.length === 0 && (
                            <p className="px-3 py-2 text-sm text-slate-400">No se encontraron proveedores</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Creación */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Creación</span>
                  <span className="text-sm text-gray-600">{formatDateShort(orden.fechaCreacion)}</span>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  {/* Exportar Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center"
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-500" />
                      Exportar
                    </button>
                    {showExportDropdown && (
                      <div
                        className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]"
                        onMouseLeave={() => setShowExportDropdown(false)}
                      >
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                          onClick={() => {
                            // TODO: Export PDF
                            setShowExportDropdown(false)
                          }}
                        >
                          <FileDown className="w-4 h-4 text-slate-400" />
                          Exportar PDF
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                          onClick={() => {
                            // TODO: Export Text
                            setShowExportDropdown(false)
                          }}
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          Exportar Texto
                        </button>
                      </div>
                    )}
                  </div>
                  {orden.estado === "aceptada" ? (
                    <button
                      onClick={handleVerEnCompras}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Ver en Compras
                    </button>
                  ) : (
                    <button
                      onClick={handleLlevarACompras}
                      disabled={orden.items.length === 0}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                      Llevar a Compras
                    </button>
                  )}
                </div>
              </div>
            </div>



            {/* Items Section with Tab Header */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
              {(orden.items.length === 0 || showSelectionMode) ? (
                /* Empty State or Selection Mode - Proveedor Items Picker */
                <>
                  {/* Tab Header with Select All */}
                  <div className="bg-slate-100 border border-slate-200/80 rounded-t-md">
                    <div className="grid grid-cols-12 h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="col-span-5 flex items-center px-4 gap-3">
                        {/* Select All Checkbox */}
                        <button
                          onClick={handleSelectAllProveedorItems}
className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-blue-500 transition-colors bg-white"
                                  >
                                  {selectAllActive && <Check className="w-3 h-3 text-blue-600" />}
                          {selectAllIndeterminate && <Minus className="w-3 h-3 text-blue-600" />}
                        </button>
                        <span>Item</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">Stock</div>
                      <div className="col-span-3 flex items-center justify-center">Costo Unitario</div>
                      <div className="col-span-2"></div>
                    </div>
                  </div>

                  {/* Proveedor Items List */}
                  <div className="bg-white border-x border-slate-200/80">
                    {proveedorItemsStructured.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-slate-500">No hay items asociados a este proveedor</p>
                      </div>
                    ) : (
                      proveedorItemsStructured.map((item, idx) => {
                        const isParent = item.hasVariants && item.variants && item.variants.length > 0
                        const selectionState = getProveedorSelectionState(item)
                        
                        return (
                          <div key={idx}>
                            {/* Parent/Standalone Row */}
                            <div
                              className={`grid grid-cols-12 items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                                selectionState.checked || selectionState.indeterminate ? "bg-blue-50/30" : ""
                              }`}
                              onClick={() => handleProveedorItemSelection(item)}
                            >
                              {/* Checkbox + Item */}
                              <div className="col-span-5 flex items-center gap-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleProveedorItemSelection(item) }}
className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-blue-500 transition-colors bg-white flex-shrink-0"
                                  >
                                  {selectionState.checked && <Check className="w-3 h-3 text-blue-600" />}
                                  {selectionState.indeterminate && <Minus className="w-3 h-3 text-blue-600" />}
                                </button>
                                <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                  <Image
                                    src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                    alt={item.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                    {isParent && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500">
                                        {item.variants!.length} var.
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400">
                                    {[item.marca, item.categoria].filter(Boolean).join(" · ")}
                                  </p>
                                </div>
                              </div>

                              {/* Stock */}
                              <div className="col-span-2 flex items-center justify-center">
                                {!isParent && (
                                  <span className="text-sm text-slate-600">
                                    {parseInt(item.stock?.disponible || "0")} <span className="text-slate-400">disponibles</span>
                                  </span>
                                )}
                              </div>

                              {/* Costo Unitario */}
                              <div className="col-span-3 flex items-center justify-center">
                                {!isParent && (
                                  <span className="text-sm font-medium text-gray-700">
                                    ${(item.precio?.costo || 0).toLocaleString("es-AR")}
                                  </span>
                                )}
                              </div>

                              {/* Empty column */}
                              <div className="col-span-2"></div>
                            </div>

                            {/* Children Rows */}
                            {isParent && item.variants!.map((variant, vIdx) => {
                              const childSelectionState = getProveedorSelectionState(variant, true)
                              return (
                                <div
                                  key={vIdx}
                                  className={`grid grid-cols-12 items-center py-2.5 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer pl-12 ${
                                    childSelectionState.checked ? "bg-blue-50/30" : ""
                                  }`}
                                  onClick={() => handleProveedorItemSelection(variant, true)}
                                >
                                  {/* Checkbox + Item */}
                                  <div className="col-span-5 flex items-center gap-3">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleProveedorItemSelection(variant, true) }}
className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-blue-500 transition-colors bg-white flex-shrink-0"
                                  >
                                  {childSelectionState.checked && <Check className="w-3 h-3 text-blue-600" />}
                                    </button>
                                    <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                      <Image
                                        src={getCategoryImage(variant.categoria || item.categoria) || "/placeholder.svg"}
                                        alt={variant.name || item.name}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-700 truncate">{variant.name || item.name}</p>
                                        {variant.atributosPrincipales && variant.atributosPrincipales.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            {variant.atributosPrincipales.map((attr, i) => (
                                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500">
                                                {attr.value}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-400">
                                        {[item.marca, variant.categoria || item.categoria].filter(Boolean).join(" · ")}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Stock */}
                                  <div className="col-span-2 flex items-center justify-center">
                                    <span className="text-sm text-slate-600">
                                      {parseInt(variant.stock?.disponible || "0")} <span className="text-slate-400">disponibles</span>
                                    </span>
                                  </div>

                                  {/* Costo Unitario */}
                                  <div className="col-span-3 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      ${(variant.precio?.costo || 0).toLocaleString("es-AR")}
                                    </span>
                                  </div>

                                  {/* Empty column */}
                                  <div className="col-span-2"></div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Bottom Row - Seguir Button */}
                  <div className="border-t border-b border-x border-slate-200 bg-slate-100 py-4 px-4 rounded-b-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {selectedProveedorCount > 0 
                          ? `${selectedProveedorCount} item${selectedProveedorCount > 1 ? "s" : ""} seleccionado${selectedProveedorCount > 1 ? "s" : ""}`
                          : showSelectionMode ? "Selecciona más items para agregar" : "Selecciona los items para la orden"
                        }
                      </span>
                      <div className="flex items-center gap-2">
                        {showSelectionMode && orden.items.length > 0 && (
                          <button
                            onClick={() => {
                              setShowSelectionMode(false)
                              setSelectedProveedorItems({})
                            }}
                            className="px-4 py-2 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          onClick={handleGenerarCompra}
                          disabled={selectedProveedorCount === 0}
                          className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {showSelectionMode ? "Agregar Seleccionados" : "Seguir"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Normal State - Order Items Grid */
                <>
                  {/* Tab Header */}
                  <div className="bg-slate-100 border border-slate-200/80 rounded-t-md">
                    {isEditable ? (
                      <div className="flex items-center justify-between h-9 px-4">
                        <div className="grid grid-cols-[2.5fr_1fr_auto_1.2fr_auto_1fr_1.2fr_1.5fr] flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider items-center">
                          <div className="flex items-center">Item</div>
                          <div className="flex items-center justify-center">Stock Actual</div>
                          <div className="flex items-center justify-center w-6"></div>
                          <div className="flex items-center justify-center">A Pedir</div>
                          <div className="flex items-center justify-center w-6"></div>
                          <div className="flex items-center justify-center whitespace-nowrap">Stock Proyectado</div>
                          <div className="flex items-center justify-center">Costo Unitario</div>
                          <div className="flex items-center justify-end">Subtotal</div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={handleGoToSelectionMode}
                            className="text-[10px] px-2 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Agregar más items"
                          >
                            + Agregar
                          </button>
                          <button
                            onClick={handleClearAllItems}
                            className="text-[10px] px-2 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Quitar todos los items"
                          >
                            Vaciar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[3fr_1.5fr_1.5fr_2fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center px-4">Item</div>
                        <div className="flex items-center justify-center">Costo Unitario</div>
                        <div className="flex items-center justify-center">Cantidad</div>
                        <div className="flex items-center justify-end pr-4">Subtotal</div>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="bg-white border-x border-slate-200/80">
                    {orden.items.map((item, idx) => {
                      const stockActual = Number(getStockBySku(item.sku)) || 0
                      const stockProyectado = stockActual + Number(item.quantity)
                      const itemDiscount = itemDiscounts[idx]
                      const itemSubtotal = item.total
                      const discountAmount = itemDiscount?.value 
                        ? (itemDiscount.type === "percent" ? itemSubtotal * itemDiscount.value / 100 : itemDiscount.value)
                        : 0
                      const finalSubtotal = itemSubtotal - discountAmount
                      
                      return (
                      <div
                        key={idx}
                        className={`grid items-center py-3 px-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors group ${
                          isEditable 
                            ? "grid-cols-[2.5fr_1fr_auto_1.2fr_auto_1fr_1.2fr_1.5fr]" 
                            : "grid-cols-[3fr_1.5fr_1.5fr_2fr]"
                        }`}
                      >
                        {/* Item - Thumbnail, Name, SKU */}
                        <div className="flex items-center gap-3">
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
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {item.tags.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{item.sku}</p>
                          </div>
                        </div>

                        {/* Stock Actual - only when editable */}
                        {isEditable && (
                          <>
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-600 tabular-nums">{stockActual}</span>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex items-center justify-center w-6">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          </>
                        )}

                        {/* A Pedir (Cantidad) */}
                        <div className="flex items-center justify-center">
                          {isEditable ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                              className="w-20 text-center text-sm font-medium bg-blue-50 border border-blue-200 focus:border-blue-400 rounded px-2 py-1 focus:outline-none transition-all"
                              min={1}
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                          )}
                        </div>
                        
                        {/* Arrow and Stock Proyectado - only when editable */}
                        {isEditable && (
                          <>
                            <div className="flex items-center justify-center w-6">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                            
                            {/* Stock Proyectado - Editable */}
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                value={stockProyectado}
                                onChange={(e) => handleStockProyectadoChange(idx, parseInt(e.target.value) || 0)}
                                className="w-20 text-center text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 focus:border-emerald-400 rounded px-2 py-1 focus:outline-none transition-all tabular-nums"
                                min={stockActual}
                              />
                            </div>
                          </>
                        )}

                        {/* Costo Unit. */}
                        <div className="flex items-center justify-center">
                          {isEditable ? (
                            <div className="flex items-center">
                              <span className="text-xs text-slate-400 mr-0.5">$</span>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handlePriceChange(idx, parseInt(e.target.value) || 0)}
                                className="w-20 text-center text-sm font-medium bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-1 focus:outline-none focus:bg-white transition-all"
                                min={0}
                              />
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              ${item.unitPrice.toLocaleString("es-AR")}
                            </span>
                          )}

                        {/* Subtotal with Discount */}
                        <div className="flex items-center justify-end gap-2">
                          <div className="text-right">
                            {discountAmount > 0 ? (
                              <>
                                <span className="text-sm font-semibold text-gray-900">
                                  ${finalSubtotal.toLocaleString("es-AR")}
                                </span>
                                <p className="text-[10px] text-slate-400 line-through">
                                  ${itemSubtotal.toLocaleString("es-AR")}
                                </p>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-semibold text-gray-900">
                                  ${itemSubtotal.toLocaleString("es-AR")}
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {item.quantity} x ${item.unitPrice.toLocaleString("es-AR")}
                                </p>
                              </>
                            )}
                            {/* Discount input */}
                            {isEditable && (
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
                            )}
                          </div>
                          {isEditable && (
                            <button
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )})}

                    {/* Add Item Button - only show when editable */}
                    {isEditable && (
                      <button
                        className="w-full py-4 text-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-2 border-t border-dashed border-slate-200 cursor-pointer"
                        onClick={() => setShowAddItemModal(true)}
                      >
                        <Plus className="w-4 h-4" />
                        Agregar item
                      </button>
                    )}
                  </div>

                  {/* Total Row - Part of the grid, closes the table */}
                  <div className="border-t border-b border-x border-slate-200 bg-slate-100 py-4 px-4 rounded-b-md">
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
                        {isEditable && (
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
                        )}
                        
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
                        
                        {/* Total Estimado */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-slate-500 font-medium">Total Estimado</span>
                          <span className="text-xl font-bold text-gray-900">
                            ${calculateTotals.total.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

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
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={newItemSearch}
                  onChange={(e) => setNewItemSearch(e.target.value)}
                  placeholder="Buscar item, o escribir una descripción libre"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {newItemSearch.trim() ? (
                <>
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                          onClick={() => handleSelectItem(item)}
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {item.tags.slice(0, 2).map((tag, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{item.sku}</span>
                          </div>
                          {/* Stock Info */}
                          <div className="flex items-center gap-3 text-xs">
                            <div className="text-center">
                              <span className="text-slate-400 block">Disponible</span>
                              <span className="font-medium text-slate-700">{item.stockDisponible || 0}</span>
                            </div>
                            {(item.stockReservado || 0) > 0 && (
                              <div className="text-center">
                                <span className="text-slate-400 block">Reservado</span>
                                <span className="font-medium text-orange-600">{item.stockReservado}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700 min-w-[80px] text-right">${item.precio?.toLocaleString("es-AR")}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-500 mb-3">No se encontraron items</p>
                      <button
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        onClick={handleAddFreeItem}
                      >
                        <Plus className="w-4 h-4" />
                        Agregar &quot;{newItemSearch}&quot; como item
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-2">
                  <p className="px-4 py-2 text-xs text-slate-400 uppercase tracking-wider">Productos del proveedor</p>
                  {notSelectedItems.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      onClick={() => handleSelectItem(item)}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {item.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{item.sku}</span>
                      </div>
                      {/* Stock Info */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-center">
                          <span className="text-slate-400 block">Disponible</span>
                          <span className="font-medium text-slate-700">{item.stockDisponible || 0}</span>
                        </div>
                        {(item.stockReservado || 0) > 0 && (
                          <div className="text-center">
                            <span className="text-slate-400 block">Reservado</span>
                            <span className="font-medium text-orange-600">{item.stockReservado}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-[80px] text-right">${item.precio?.toLocaleString("es-AR")}</span>
                    </button>
                  ))}
                  {notSelectedItems.length === 0 && (
                    <p className="px-4 py-6 text-sm text-slate-400 text-center">Todos los productos ya fueron agregados</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Proveedor Change Confirmation Modal */}
      {showProveedorConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowProveedorConfirmModal(false)
              setPendingProveedor(null)
            }}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Cambiar de proveedor?
              </h3>
              <p className="text-sm text-slate-600 mb-1">
                Estás por cambiar el proveedor de <span className="font-medium">{orden?.proveedorNombre}</span> a <span className="font-medium">{pendingProveedor}</span>.
              </p>
              <p className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-md mt-3">
                La orden de compra se reiniciará y perderás todos los items agregados.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowProveedorConfirmModal(false)
                  setPendingProveedor(null)
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmProveedorChange}
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sí, cambiar proveedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <OrdenDetailContent params={params} />
    </Suspense>
  )
}
