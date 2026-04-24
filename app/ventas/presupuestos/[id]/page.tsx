"use client"

import { useState, useMemo, Suspense, use, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Plus,
  Trash2,
  FileText,
  FileDown,
  Receipt,
  X,
  Search,
  Check,
  Minus,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { EstadoPresupuesto, PresupuestoItem, Presupuesto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import { usePresupuestos } from "@/hooks/use-presupuestos"
import { useItems } from "@/hooks/use-items"
import { useClientes } from "@/hooks/use-clientes"

const estadoLabels: Record<EstadoPresupuesto, string> = {
  borrador: "Borrador",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
}

const estadoColors: Record<EstadoPresupuesto, { bg: string; text: string; border: string }> = {
  borrador: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" },
  aceptado: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-300" },
  rechazado: { bg: "bg-red-50", text: "text-red-600", border: "border-red-300" },
}

function PresupuestoDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const { presupuestos, updatePresupuesto, deletePresupuesto } = usePresupuestos()
  const { items: allItems } = useItems()
  const { clientes } = useClientes()
  
  // Cliente change state
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [clienteSearch, setClienteSearch] = useState("")
  const [isHoveringCliente, setIsHoveringCliente] = useState(false)
  const clienteDropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false)
      }
    }
    if (showClienteDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showClienteDropdown])
  
  // Discount state
  const [itemDiscounts, setItemDiscounts] = useState<{ [idx: number]: { value: number; type: "cash" | "percent" } }>({})
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "cash" | "percent" }>({ value: 0, type: "percent" })

  const foundPresupuesto = useMemo(() => {
    return presupuestos.find(p => p.id === id) || null
  }, [presupuestos, id])
  
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  useEffect(() => {
    if (foundPresupuesto) {
      setPresupuesto(foundPresupuesto)
    }
  }, [foundPresupuesto])
  
  const isEditable = presupuesto?.estado === "borrador"
  
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  const [modalSearch, setModalSearch] = useState("")
  const [modalFilters, setModalFilters] = useState<{
    categoria: string
    marca: string
    stockRange: string
  }>({ categoria: "", marca: "", stockRange: "" })
  const [modalSort, setModalSort] = useState<"name" | "stock" | "precio">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)
  
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  
  // Mass actions
  const [showCantidadMassMenu, setShowCantidadMassMenu] = useState(false)
  const [showPrecioMassMenu, setShowPrecioMassMenu] = useState(false)
  const [massCantidadValue, setMassCantidadValue] = useState("")
  const [massPrecioValue, setMassPrecioValue] = useState("")
  const [massPrecioType, setMassPrecioType] = useState<"set" | "add" | "subtract" | "addPercent" | "subtractPercent">("set")
  
  const [editingLibreItem, setEditingLibreItem] = useState<{ idx: number; field: "name" | "sku" | "marca" | "categoria"; value: string } | null>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-mass-menu]')) {
        setShowCantidadMassMenu(false)
        setShowPrecioMassMenu(false)
      }
    }
    if (showCantidadMassMenu || showPrecioMassMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showCantidadMassMenu, showPrecioMassMenu])
  
  const uniqueClientes = useMemo(() => {
    return clientes.map(c => c.nombre).sort()
  }, [clientes])
  
  const filteredClientes = useMemo(() => {
    if (!clienteSearch) return uniqueClientes
    return uniqueClientes.filter(c => 
      c.toLowerCase().includes(clienteSearch.toLowerCase())
    )
  }, [clienteSearch, uniqueClientes])
  
  // Helper to get precio for an item by SKU (uses precioFinal for presupuestos)
  const getPrecioBySku = (sku: string): number => {
    const standaloneItem = allItems.find(item => item.sku === sku)
    if (standaloneItem?.precio?.precioFinal !== undefined) {
      return standaloneItem.precio.precioFinal
    }
    
    for (const item of allItems) {
      if (item.variants) {
        const variant = item.variants.find(v => v.sku === sku || `${item.skuPrefix}-${v.skuSuffix}` === sku)
        if (variant?.precio?.precioFinal !== undefined) {
          return variant.precio.precioFinal
        }
      }
    }
    return 0
  }
  
  const getMarcaBySku = (sku: string): string | undefined => {
    const standaloneItem = allItems.find(item => item.sku === sku)
    if (standaloneItem?.marca) return standaloneItem.marca
    
    for (const item of allItems) {
      if (item.variants) {
        const variant = item.variants.find(v => v.sku === sku || `${item.skuPrefix}-${v.skuSuffix}` === sku)
        if (variant) return variant.marca || item.marca
      }
    }
    return undefined
  }

  // Get items for the modal (all catalog items)
  const catalogItems = useMemo(() => {
    return allItems.map(item => ({
      ...item,
      hasVariants: item.hasVariants || false,
    }))
  }, [allItems])

  const getItemId = (item: any) => item.sku || item.id || `${item.skuPrefix}-${item.skuSuffix}` || item.name
  
  const filteredModalItems = useMemo(() => {
    let items = [...catalogItems]
    
    if (modalSearch) {
      const search = modalSearch.toLowerCase()
      items = items.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(search)
        const skuMatch = (item.sku || item.skuPrefix || "").toLowerCase().includes(search)
        const marcaMatch = (item.marca || "").toLowerCase().includes(search)
        
        if (item.hasVariants && item.variants) {
          const variantMatch = item.variants.some((v: any) => 
            v.name?.toLowerCase().includes(search) ||
            v.sku?.toLowerCase().includes(search) ||
            v.skuSuffix?.toLowerCase().includes(search)
          )
          return nameMatch || skuMatch || marcaMatch || variantMatch
        }
        return nameMatch || skuMatch || marcaMatch
      })
    }
    
    if (modalFilters.categoria) {
      items = items.filter(item => item.categoria === modalFilters.categoria)
    }
    
    if (modalFilters.marca) {
      items = items.filter(item => item.marca === modalFilters.marca)
    }
    
    // Filter out items already in the presupuesto
    const existingSkus = new Set(presupuesto?.items.map(i => i.sku) || [])
    items = items.map(item => {
      if (item.hasVariants && item.variants) {
        const remainingVariants = item.variants.filter((v: any) => {
          const sku = `${item.skuPrefix}-${v.skuSuffix}`
          return !existingSkus.has(sku)
        })
        if (remainingVariants.length === 0) return null
        return { ...item, variants: remainingVariants }
      } else {
        if (existingSkus.has(item.sku)) return null
        return item
      }
    }).filter(Boolean) as typeof items
    
    // Sort
    items.sort((a, b) => {
      let comparison = 0
      switch (modalSort) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "precio":
          comparison = (a.precio?.precioFinal || 0) - (b.precio?.precioFinal || 0)
          break
      }
      return modalSortDirection === "asc" ? comparison : -comparison
    })
    
    return items
  }, [catalogItems, modalSearch, modalFilters, modalSort, modalSortDirection, presupuesto?.items])

  const handleAddSelectedItems = () => {
    if (!presupuesto) return
    
    const existingSkus = new Set(presupuesto.items.map(i => i.sku))
    const newItems: PresupuestoItem[] = []
    
    for (const item of catalogItems) {
      const isParent = item.hasVariants && item.variants && item.variants.length > 0
      
      if (isParent) {
        for (const variant of item.variants!) {
          const itemId = getItemId(variant)
          const sku = `${item.skuPrefix}-${variant.skuSuffix}`
          if ((selectedModalItems[itemId] || selectedModalItems[sku]) && !existingSkus.has(sku)) {
            newItems.push({
              sku,
              name: variant.name || item.name,
              quantity: 1,
              unitPrice: variant.precio?.precioFinal || 0,
              total: variant.precio?.precioFinal || 0,
              categoria: variant.categoria || item.categoria,
              marca: variant.marca || item.marca,
              tags: variant.atributosPrincipales?.map(a => a.value),
            })
          }
        }
      } else {
        const itemId = getItemId(item)
        const sku = item.sku || ""
        if ((selectedModalItems[itemId] || selectedModalItems[sku]) && !existingSkus.has(sku)) {
          newItems.push({
            sku,
            name: item.name,
            quantity: 1,
            unitPrice: item.precio?.precioFinal || 0,
            total: item.precio?.precioFinal || 0,
            categoria: item.categoria,
            marca: item.marca,
          })
        }
      }
    }
    
    if (newItems.length > 0) {
      const updatedItems = [...presupuesto.items, ...newItems]
      const newTotal = updatedItems.reduce((sum, it) => sum + it.total, 0)
      setPresupuesto({ ...presupuesto, items: updatedItems, importeTotal: newTotal })
      updatePresupuesto(presupuesto.id, { items: updatedItems, importeTotal: newTotal })
      setHasChanges(true)
    }
    
    setShowAddItemModal(false)
    setSelectedModalItems({})
    setModalSearch("")
  }
  
  const handleAddFreeItem = () => {
    if (!presupuesto || !modalSearch.trim()) return
    const newItem: PresupuestoItem = {
      sku: "",
      name: modalSearch.trim(),
      quantity: 1,
      unitPrice: 0,
      total: 0,
      isDescripcionLibre: true,
    }
    const newItems = [...presupuesto.items, newItem]
    setPresupuesto({ ...presupuesto, items: newItems })
    updatePresupuesto(presupuesto.id, { items: newItems })
    setHasChanges(true)
    setShowAddItemModal(false)
    setModalSearch("")
  }
  
  const handleUpdateLibreItem = (idx: number, field: "name" | "sku" | "marca" | "categoria", value: string) => {
    if (!presupuesto) return
    const newItems = [...presupuesto.items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    setPresupuesto({ ...presupuesto, items: newItems })
    updatePresupuesto(presupuesto.id, { items: newItems })
    setHasChanges(true)
    setEditingLibreItem(null)
  }
  
  // Mass actions
  const handleApplyMassCantidad = () => {
    if (!presupuesto || !massCantidadValue) return
    const value = parseInt(massCantidadValue) || 0
    const newItems = presupuesto.items.map(item => ({
      ...item,
      quantity: value,
      total: value * item.unitPrice
    }))
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setPresupuesto({ ...presupuesto, items: newItems, importeTotal: newTotal })
    updatePresupuesto(presupuesto.id, { items: newItems, importeTotal: newTotal })
    setHasChanges(true)
    setShowCantidadMassMenu(false)
    setMassCantidadValue("")
  }
  
  const handleApplyMassPrecio = () => {
    if (!presupuesto || !massPrecioValue) return
    const value = parseFloat(massPrecioValue) || 0
    const newItems = presupuesto.items.map(item => {
      let newPrice = item.unitPrice
      switch (massPrecioType) {
        case "set": newPrice = value; break
        case "add": newPrice = item.unitPrice + value; break
        case "subtract": newPrice = Math.max(0, item.unitPrice - value); break
        case "addPercent": newPrice = item.unitPrice * (1 + value / 100); break
        case "subtractPercent": newPrice = item.unitPrice * (1 - value / 100); break
      }
      newPrice = Math.round(newPrice)
      return { ...item, unitPrice: newPrice, total: item.quantity * newPrice }
    })
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setPresupuesto({ ...presupuesto, items: newItems, importeTotal: newTotal })
    updatePresupuesto(presupuesto.id, { items: newItems, importeTotal: newTotal })
    setHasChanges(true)
    setShowPrecioMassMenu(false)
    setMassPrecioValue("")
    setMassPrecioType("set")
  }

  const handleRemoveItem = (idx: number) => {
    if (!presupuesto) return
    const newItems = presupuesto.items.filter((_, i) => i !== idx)
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setPresupuesto({ ...presupuesto, items: newItems, importeTotal: newTotal })
    updatePresupuesto(presupuesto.id, { items: newItems, importeTotal: newTotal })
    setHasChanges(true)
  }
  
  const handleQuantityChange = (idx: number, newQuantity: number) => {
    if (!presupuesto || newQuantity < 0) return
    const newItems = [...presupuesto.items]
    newItems[idx] = {
      ...newItems[idx],
      quantity: newQuantity,
      total: newQuantity * newItems[idx].unitPrice
    }
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setPresupuesto({ ...presupuesto, items: newItems, importeTotal: newTotal })
    updatePresupuesto(presupuesto.id, { items: newItems, importeTotal: newTotal })
    setHasChanges(true)
  }
  
  const handlePriceChange = (idx: number, newPrice: number) => {
    if (!presupuesto || newPrice < 0) return
    const newItems = [...presupuesto.items]
    newItems[idx] = {
      ...newItems[idx],
      unitPrice: newPrice,
      total: newItems[idx].quantity * newPrice
    }
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setPresupuesto({ ...presupuesto, items: newItems, importeTotal: newTotal })
    updatePresupuesto(presupuesto.id, { items: newItems, importeTotal: newTotal })
    setHasChanges(true)
  }
  
  const handleEstadoChange = (newEstado: EstadoPresupuesto) => {
    if (!presupuesto) return
    setPresupuesto({ ...presupuesto, estado: newEstado })
    updatePresupuesto(presupuesto.id, { estado: newEstado })
    setHasChanges(true)
  }
  
  const handleClienteChange = (newCliente: string) => {
    if (!presupuesto) return
    setPresupuesto({ ...presupuesto, clienteNombre: newCliente })
    updatePresupuesto(presupuesto.id, { clienteNombre: newCliente })
    setShowClienteDropdown(false)
    setClienteSearch("")
    setHasChanges(true)
  }
  
  const handleDeletePresupuesto = () => {
    if (!presupuesto) return
    deletePresupuesto(presupuesto.id)
    router.push("/ventas/presupuestos")
  }

  const breadcrumbs = [
    { label: "Ventas" },
    { label: "Presupuestos", href: "/ventas/presupuestos" },
    { label: presupuesto?.id || id },
  ]

  if (!presupuesto) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Presupuesto no encontrado</p>
          <button 
            onClick={() => router.push("/ventas/presupuestos")}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Volver a Presupuestos
          </button>
        </div>
      </div>
    )
  }
  
  const estadoStyle = estadoColors[presupuesto.estado]

  // Calculate totals
  const subtotal = presupuesto.items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = globalDiscount.type === "percent" 
    ? subtotal * (globalDiscount.value / 100) 
    : globalDiscount.value
  const finalTotal = Math.max(0, subtotal - discountAmount)

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
          {/* Header */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/ventas/presupuestos")}
                  className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Top Bar - Presupuesto Info */}
            <div className="px-6 pt-6 pb-4">
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* ID */}
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Presupuesto</span>
                      <p className="text-lg font-semibold text-slate-900">{presupuesto.id}</p>
                    </div>
                    
                    {/* Cliente */}
                    <div className="relative" ref={clienteDropdownRef}>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Cliente</span>
                      {isEditable ? (
                        <button
                          onClick={() => setShowClienteDropdown(!showClienteDropdown)}
                          onMouseEnter={() => setIsHoveringCliente(true)}
                          onMouseLeave={() => setIsHoveringCliente(false)}
                          className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {presupuesto.clienteNombre}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showClienteDropdown ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <p className="text-lg font-semibold text-slate-900">{presupuesto.clienteNombre}</p>
                      )}
                      
                      {showClienteDropdown && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-64">
                          <div className="p-2 border-b border-slate-100">
                            <input
                              type="text"
                              placeholder="Buscar cliente..."
                              value={clienteSearch}
                              onChange={(e) => setClienteSearch(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto py-1">
                            {filteredClientes.map((cliente) => (
                              <button
                                key={cliente}
                                onClick={() => handleClienteChange(cliente)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                  presupuesto.clienteNombre === cliente ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                                }`}
                              >
                                {cliente}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Estado */}
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Estado</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoStyle.bg}`}>
                          {presupuesto.estado === "borrador" && <Clock className={`w-3.5 h-3.5 ${estadoStyle.text}`} />}
                          {presupuesto.estado === "aceptado" && <CheckCircle2 className={`w-3.5 h-3.5 ${estadoStyle.text}`} />}
                          {presupuesto.estado === "rechazado" && <XCircle className={`w-3.5 h-3.5 ${estadoStyle.text}`} />}
                          <span className={`text-xs font-medium ${estadoStyle.text}`}>
                            {estadoLabels[presupuesto.estado]}
                          </span>
                        </div>
                        {isEditable && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEstadoChange("aceptado")}
                              className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Marcar como aceptado"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEstadoChange("rechazado")}
                              className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
                              title="Marcar como rechazado"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-slate-600 hover:text-slate-900"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Exportar PDF
                    </Button>
                    
                    {isEditable && (
                      <button
                        onClick={() => setShowDeleteConfirmModal(true)}
                        className="p-2 rounded hover:bg-red-50 text-red-500 transition-colors"
                        title="Eliminar presupuesto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
                {/* Grid Header */}
                <div className="bg-slate-100 border-b border-slate-200/80 rounded-t-lg">
                  {isEditable ? (
                    <div className="grid grid-cols-[2fr_1fr_auto_1fr_1.2fr_1.5fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center px-4">Item</div>
                      
                      {/* Cantidad with mass action */}
                      <div className="flex items-center justify-center gap-1 relative" data-mass-menu>
                        <span>Cantidad</span>
                        <button
                          onClick={() => { setShowCantidadMassMenu(!showCantidadMassMenu); setShowPrecioMassMenu(false) }}
                          className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {showCantidadMassMenu && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[180px]">
                            <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">Aplicar a todos</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="Cantidad"
                                value={massCantidadValue}
                                onChange={(e) => setMassCantidadValue(e.target.value)}
                                className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                                min={0}
                              />
                              <button
                                onClick={handleApplyMassCantidad}
                                disabled={!massCantidadValue}
                                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center w-6"></div>
                      
                      {/* Precio with mass action */}
                      <div className="flex items-center justify-center gap-1 relative" data-mass-menu>
                        <span>Precio Unit.</span>
                        <button
                          onClick={() => { setShowPrecioMassMenu(!showPrecioMassMenu); setShowCantidadMassMenu(false) }}
                          className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {showPrecioMassMenu && (
                          <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[220px]">
                            <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">Modificar precio de todos</p>
                            <div className="flex flex-col gap-2">
                              <select
                                value={massPrecioType}
                                onChange={(e) => setMassPrecioType(e.target.value as any)}
                                className="text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                              >
                                <option value="set">Reemplazar por $</option>
                                <option value="add">Agregar $</option>
                                <option value="subtract">Disminuir $</option>
                                <option value="addPercent">Agregar %</option>
                                <option value="subtractPercent">Disminuir %</option>
                              </select>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder={massPrecioType.includes("Percent") ? "%" : "$"}
                                  value={massPrecioValue}
                                  onChange={(e) => setMassPrecioValue(e.target.value)}
                                  className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                                  min={0}
                                />
                                <button
                                  onClick={handleApplyMassPrecio}
                                  disabled={!massPrecioValue}
                                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                  Aplicar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center">Descuento</div>
                      <div className="flex items-center justify-end pr-4">Subtotal</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[3fr_1.5fr_1.5fr_2fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center px-4">Item</div>
                      <div className="flex items-center justify-center">Precio Unit.</div>
                      <div className="flex items-center justify-center">Cantidad</div>
                      <div className="flex items-center justify-end pr-4">Subtotal</div>
                    </div>
                  )}
                </div>
                
                {/* Items or Empty State */}
                {presupuesto.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Package className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-slate-500 mb-1">Sin items</p>
                    <p className="text-xs text-slate-400 mb-4">Agrega items al presupuesto</p>
                    {isEditable && (
                      <Button
                        onClick={() => setShowAddItemModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                  {presupuesto.items.map((item, idx) => {
                    const displayMarca = item.marca || getMarcaBySku(item.sku)
                    const discount = itemDiscounts[idx] || { value: 0, type: "percent" }
                    const itemSubtotal = item.total
                    const discountAmt = discount.type === "percent" ? itemSubtotal * (discount.value / 100) : discount.value
                    const finalItemTotal = Math.max(0, itemSubtotal - discountAmt)
                    
                    return (
                      <div key={idx} className="border-b border-slate-100 last:border-b-0">
                        {isEditable ? (
                          <div className="grid grid-cols-[2fr_1fr_auto_1fr_1.2fr_1.5fr] min-h-[72px]">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 px-4 py-3">
                              {isEditable && (
                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                  src={getCategoryImage(item.categoria || "")}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {item.isDescripcionLibre && isEditable ? (
                                    editingLibreItem?.idx === idx && editingLibreItem?.field === "name" ? (
                                      <input
                                        type="text"
                                        value={editingLibreItem.value}
                                        onChange={(e) => setEditingLibreItem({ idx, field: "name", value: e.target.value })}
                                        onBlur={() => handleUpdateLibreItem(idx, "name", editingLibreItem.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleUpdateLibreItem(idx, "name", editingLibreItem.value)
                                          if (e.key === "Escape") setEditingLibreItem(null)
                                        }}
                                        autoFocus
                                        className="text-sm font-medium text-gray-900 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400 w-full"
                                      />
                                    ) : (
                                      <button
                                        onClick={() => setEditingLibreItem({ idx, field: "name", value: item.name })}
                                        className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 hover:underline cursor-pointer transition-colors text-left"
                                      >
                                        {item.name}
                                      </button>
                                    )
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                  )}
                                  {item.tags && item.tags.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {item.tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {item.isDescripcionLibre && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Libre</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">sku: {item.sku || "Sin SKU"}</p>
                                {(displayMarca || item.categoria) && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {displayMarca && <span className="text-xs text-slate-400">{displayMarca}</span>}
                                    {displayMarca && item.categoria && <span className="text-xs text-slate-300">·</span>}
                                    {item.categoria && <span className="text-xs text-slate-400">{item.categoria}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Cantidad */}
                            <div className="flex items-center justify-center">
                              <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                                <button
                                  onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                                  className="w-12 text-center text-sm py-1 border-x border-slate-200 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                            
                            {/* Precio */}
                            <div className="flex items-center justify-center">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-sm">$</span>
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-center text-sm py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                                />
                              </div>
                            </div>
                            
                            {/* Descuento */}
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder="Dto"
                                value={discount.value || ""}
                                onChange={(e) => setItemDiscounts(prev => ({
                                  ...prev,
                                  [idx]: { ...discount, value: parseFloat(e.target.value) || 0 }
                                }))}
                                className="w-14 text-center text-xs py-1 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                              />
                              <div className="flex border border-slate-200 rounded overflow-hidden">
                                <button
                                  onClick={() => setItemDiscounts(prev => ({
                                    ...prev,
                                    [idx]: { ...discount, type: "cash" }
                                  }))}
                                  className={`px-1.5 py-1 text-xs ${discount.type === "cash" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  $
                                </button>
                                <button
                                  onClick={() => setItemDiscounts(prev => ({
                                    ...prev,
                                    [idx]: { ...discount, type: "percent" }
                                  }))}
                                  className={`px-1.5 py-1 text-xs ${discount.type === "percent" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                            
                            {/* Subtotal */}
                            <div className="flex items-center justify-end pr-4">
                              <span className="text-sm font-semibold text-slate-900">
                                ${finalItemTotal.toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-[3fr_1.5fr_1.5fr_2fr] min-h-[56px]">
                            <div className="flex items-center gap-3 px-4 py-3">
                              <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                                <Image
                                  src={getCategoryImage(item.categoria || "")}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-slate-400">sku: {item.sku || "Sin SKU"}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-700">${item.unitPrice.toLocaleString("es-AR")}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-700">{item.quantity}</span>
                            </div>
                            <div className="flex items-center justify-end pr-4">
                              <span className="text-sm font-semibold text-slate-900">${item.total.toLocaleString("es-AR")}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Add item button */}
                  {isEditable && presupuesto.items.length > 0 && (
                    <button
                      className="w-full py-4 text-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-2 border-t border-dashed border-slate-200 cursor-pointer"
                      onClick={() => setShowAddItemModal(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar item
                    </button>
                  )}
                  </>
                )}
                
                {/* Totals */}
                {presupuesto.items.length > 0 && (
                  <div className="border-t border-slate-200 bg-slate-50/50 rounded-b-lg">
                    <div className="px-4 py-4 flex justify-end">
                      <div className="w-72 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="text-slate-700">${subtotal.toLocaleString("es-AR")}</span>
                        </div>
                        {isEditable && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Descuento</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={globalDiscount.value || ""}
                                onChange={(e) => setGlobalDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                className="w-16 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                              />
                              <div className="flex border border-slate-200 rounded overflow-hidden">
                                <button
                                  onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "cash" }))}
                                  className={`px-2 py-1 text-xs ${globalDiscount.type === "cash" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  $
                                </button>
                                <button
                                  onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "percent" }))}
                                  className={`px-2 py-1 text-xs ${globalDiscount.type === "percent" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-slate-200">
                          <span className="text-slate-700">Total</span>
                          <span className="text-slate-900">${finalTotal.toLocaleString("es-AR")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Agregar Items</h2>
                <p className="text-sm text-slate-500 mt-0.5">Selecciona items del catálogo</p>
              </div>
              <button
                onClick={() => {
                  setShowAddItemModal(false)
                  setSelectedModalItems({})
                  setModalSearch("")
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Search & Filters */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar items..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <button
                onClick={() => setShowModalFilters(!showModalFilters)}
                className={`p-2 rounded-lg border transition-colors ${showModalFilters ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <Filter className={`w-4 h-4 ${showModalFilters ? "text-blue-600" : "text-slate-500"}`} />
              </button>
            </div>
            
            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {filteredModalItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No se encontraron items</p>
                  {modalSearch && (
                    <button
                      onClick={handleAddFreeItem}
                      className="mt-3 text-sm text-blue-600 hover:underline"
                    >
                      Agregar &quot;{modalSearch}&quot; como item
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredModalItems.map((item) => {
                    const hasVariants = item.hasVariants && item.variants && item.variants.length > 0
                    const itemId = getItemId(item)
                    
                    if (hasVariants) {
                      return (
                        <div key={itemId} className="border border-slate-100 rounded-lg">
                          <div className="px-4 py-3 bg-slate-50/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                              <Image
                                src={getCategoryImage(item.categoria || "")}
                                alt={item.name}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-400">{item.variants?.length} variantes</p>
                            </div>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {item.variants?.map((variant: any) => {
                              const variantSku = `${item.skuPrefix}-${variant.skuSuffix}`
                              const variantId = variant.sku || variantSku
                              const isSelected = selectedModalItems[variantId] || selectedModalItems[variantSku]
                              
                              return (
                                <label
                                  key={variantId}
                                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50/50" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setSelectedModalItems(prev => ({
                                        ...prev,
                                        [variantSku]: !isSelected
                                      }))
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700">{variant.name || item.name}</p>
                                    <p className="text-xs text-slate-400">sku: {variantSku}</p>
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">
                                    ${(variant.precio?.precioFinal || 0).toLocaleString("es-AR")}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }
                    
                    const isSelected = selectedModalItems[itemId] || selectedModalItems[item.sku || ""]
                    return (
                      <label
                        key={itemId}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer border transition-colors ${
                          isSelected ? "border-blue-200 bg-blue-50/50" : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedModalItems(prev => ({
                              ...prev,
                              [item.sku || itemId]: !isSelected
                            }))
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                          <Image
                            src={getCategoryImage(item.categoria || "")}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400">sku: {item.sku || "Sin SKU"}</p>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          ${(item.precio?.precioFinal || 0).toLocaleString("es-AR")}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-xl">
              <span className="text-sm text-slate-500">
                {Object.values(selectedModalItems).filter(Boolean).length} items seleccionados
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddItemModal(false)
                    setSelectedModalItems({})
                    setModalSearch("")
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSelectedItems}
                  disabled={Object.values(selectedModalItems).filter(Boolean).length === 0}
                  className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar seleccionados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900">Eliminar presupuesto</h3>
              <p className="text-sm text-slate-500 mt-2">
                ¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePresupuesto}
                className="px-5 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PresupuestoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <PresupuestoDetailContent params={params} />
    </Suspense>
  )
}
