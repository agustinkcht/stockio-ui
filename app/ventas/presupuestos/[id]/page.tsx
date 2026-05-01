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
  Eye,
  Pencil,
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
import { useVentas } from "@/hooks/use-ventas"
import { NuevoClienteModal } from "@/components/modals/nuevo-cliente-modal"
import type { Cliente } from "@/lib/data/clientes"
import jsPDF from "jspdf"

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
  const { clientes, addCliente } = useClientes()
  const { addVenta } = useVentas()
  
  // Track mousedown target for selection
  const mouseDownTargetRef = useRef<EventTarget | null>(null)
  // Track if persisted state has been loaded (prevents premature overwrite)
  const isLoadedRef = useRef(false)
  
  // Cliente change state
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [clienteSearch, setClienteSearch] = useState("")
  const [isHoveringCliente, setIsHoveringCliente] = useState(false)
  const clienteDropdownRef = useRef<HTMLDivElement>(null)
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false)
  const estadoDropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false)
      }
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(event.target as Node)) {
        setShowEstadoDropdown(false)
      }
    }
    if (showClienteDropdown || showEstadoDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showClienteDropdown, showEstadoDropdown])
  
  // Promoción state (always discount - percent, cash, or unit)
  const [itemAjustes, setItemAjustes] = useState<{ [idx: number]: { value: number; type: "percent" | "cash" | "unit" } }>({})
  const [itemIvas, setItemIvas] = useState<{ [idx: number]: number }>({})
  const [globalDiscount, setGlobalDiscount] = useState<{ value: number; type: "cash" | "percent" }>({ value: 0, type: "percent" })
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false)
  const [showEnvio, setShowEnvio] = useState(false)
  const [envioAmount, setEnvioAmount] = useState(0)
  const [customCharges, setCustomCharges] = useState<{ id: number; label: string; value: number }[]>([])
  const [editingCustomChargeId, setEditingCustomChargeId] = useState<number | null>(null)
  const [showIvaColumn, setShowIvaColumn] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("presupuesto_show_iva") === "true"
    }
    return false
  })
  const [showColumnMenu, setShowColumnMenu] = useState(false)

  const foundPresupuesto = useMemo(() => {
    return presupuestos.find(p => p.id === id) || null
  }, [presupuestos, id])
  
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  useEffect(() => {
    if (foundPresupuesto && !isLoadedRef.current) {
      setPresupuesto(foundPresupuesto)
      // Restore persisted detail-page state
      if (foundPresupuesto.itemAjustes) setItemAjustes(foundPresupuesto.itemAjustes)
      if (foundPresupuesto.itemIvas) setItemIvas(foundPresupuesto.itemIvas)
      if (foundPresupuesto.globalDiscount) {
        setGlobalDiscount(foundPresupuesto.globalDiscount)
        setShowGlobalDiscount(foundPresupuesto.globalDiscount.value > 0)
      }
      if (typeof foundPresupuesto.envio === "number") {
        setEnvioAmount(foundPresupuesto.envio)
        setShowEnvio(foundPresupuesto.envio > 0)
      }
      if (foundPresupuesto.customCharges) setCustomCharges(foundPresupuesto.customCharges)
      isLoadedRef.current = true
    } else if (foundPresupuesto) {
      // Subsequent updates (e.g., from updatePresupuesto on item changes) - just update presupuesto reference
      setPresupuesto(foundPresupuesto)
    }
  }, [foundPresupuesto])
  
  useEffect(() => {
    localStorage.setItem("presupuesto_show_iva", showIvaColumn.toString())
  }, [showIvaColumn])
  
  // Persist itemAjustes, itemIvas, globalDiscount, envio, customCharges to the presupuesto
  useEffect(() => {
    if (!presupuesto || !isLoadedRef.current) return
    updatePresupuesto(presupuesto.id, {
      itemAjustes,
      itemIvas,
      globalDiscount: showGlobalDiscount ? globalDiscount : { value: 0, type: "percent" },
      envio: showEnvio ? envioAmount : 0,
      customCharges,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemAjustes, itemIvas, globalDiscount, showGlobalDiscount, envioAmount, showEnvio, customCharges])
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showColumnMenu && !(e.target as HTMLElement).closest("[data-column-menu]")) {
        setShowColumnMenu(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [showColumnMenu])
  
  const isEditable = presupuesto?.estado === "borrador"
  
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [selectedModalSkus, setSelectedModalSkus] = useState<Set<string>>(new Set())
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
  const [showPromocionMassMenu, setShowPromocionMassMenu] = useState(false)
  const [showIvaMassMenu, setShowIvaMassMenu] = useState(false)
  const [massCantidadValue, setMassCantidadValue] = useState("")
  const [massPrecioValue, setMassPrecioValue] = useState("")
  const [massPrecioType, setMassPrecioType] = useState<"set" | "add" | "subtract" | "addPercent" | "subtractPercent">("set")
  const [massPromocionValue, setMassPromocionValue] = useState("")
  const [massPromocionType, setMassPromocionType] = useState<"percent" | "cash" | "unit">("percent")
  const [massIvaValue, setMassIvaValue] = useState("")
  
  // Column visibility
  const [showPromocionColumn, setShowPromocionColumn] = useState(true)
  const [showSectionMenu, setShowSectionMenu] = useState(false)
  
  const [editingLibreItem, setEditingLibreItem] = useState<{ idx: number; field: "name" | "sku" | "marca" | "categoria"; value: string } | null>(null)
  
  // Selection state for bulk actions
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(new Set())
  
  // Individual price adjustment modal
  const [showIndividualPriceModal, setShowIndividualPriceModal] = useState<{ idx: number; value: string; type: "set" | "add" | "subtract" | "addPercent" | "subtractPercent" } | null>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-mass-menu]')) {
        setShowCantidadMassMenu(false)
        setShowPrecioMassMenu(false)
        setShowPromocionMassMenu(false)
        setShowIvaMassMenu(false)
      }
      if (!target.closest('[data-section-menu]')) {
        setShowSectionMenu(false)
      }
    }
    if (showCantidadMassMenu || showPrecioMassMenu || showPromocionMassMenu || showIvaMassMenu || showSectionMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showCantidadMassMenu, showPrecioMassMenu])
  
  const uniqueClientes = useMemo(() => {
    return clientes.map(c => {
      if (c.tipo === "empresa" && c.razonSocial) {
        return c.razonSocial
      }
      return `${c.nombre} ${c.apellido}`.trim()
    }).sort()
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
  
  const getStockBySku = (sku: string): number => {
    const standaloneItem = allItems.find(item => item.sku === sku)
    if (standaloneItem?.stock?.disponible) return parseInt(standaloneItem.stock.disponible) || 0
    
    for (const item of allItems) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === sku || `${item.skuPrefix}-${v.skuSuffix}` === sku)
        if (variant?.stock?.disponible) return parseInt(variant.stock.disponible) || 0
      }
    }
    return 0
  }
  
  const getIvaBySku = (sku: string): number => {
    const standaloneItem = allItems.find(item => item.sku === sku)
    if (standaloneItem?.precio?.iva !== undefined) return standaloneItem.precio.iva
    
    for (const item of allItems) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === sku || `${item.skuPrefix}-${v.skuSuffix}` === sku)
        if (variant?.precio?.iva !== undefined) return variant.precio.iva
      }
    }
    return 21 // Default IVA
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
          const sku = `${item.skuPrefix}-${variant.skuSuffix}`
          if (selectedModalSkus.has(sku) && !existingSkus.has(sku)) {
            const unitPrice = variant.precio?.precioFinal || 0
            newItems.push({
              sku,
              name: variant.name || item.name,
              quantity: 1,
              unitPrice,
              total: unitPrice,
              categoria: variant.categoria || item.categoria,
              marca: variant.marca || item.marca,
              tags: variant.atributosPrincipales?.map(a => a.value),
            })
          }
        }
      } else {
        const sku = item.sku || ""
        if (selectedModalSkus.has(sku) && !existingSkus.has(sku)) {
          const unitPrice = item.precio?.precioFinal || 0
          newItems.push({
            sku,
            name: item.name,
            quantity: 1,
            unitPrice,
            total: unitPrice,
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
    setSelectedModalSkus(new Set())
    setModalSearch("")
  }
  
  // Toggle selection for a single SKU
  const toggleModalSku = (sku: string) => {
    setSelectedModalSkus(prev => {
      const next = new Set(prev)
      if (next.has(sku)) {
        next.delete(sku)
      } else {
        next.add(sku)
      }
      return next
    })
  }
  
  // Toggle all variants of a parent item
  const toggleParentSelection = (item: CatalogItem) => {
    if (!item.variants) return
    const variantSkus = item.variants.map(v => `${item.skuPrefix}-${v.skuSuffix}`)
    const allSelected = variantSkus.every(sku => selectedModalSkus.has(sku))
    
    setSelectedModalSkus(prev => {
      const next = new Set(prev)
      if (allSelected) {
        // Deselect all
        variantSkus.forEach(sku => next.delete(sku))
      } else {
        // Select all
        variantSkus.forEach(sku => next.add(sku))
      }
      return next
    })
  }
  
  // Check if all variants of a parent are selected
  const areAllVariantsSelected = (item: CatalogItem) => {
    if (!item.variants) return false
    return item.variants.every(v => selectedModalSkus.has(`${item.skuPrefix}-${v.skuSuffix}`))
  }
  
  // Check if some (but not all) variants are selected
  const areSomeVariantsSelected = (item: CatalogItem) => {
    if (!item.variants) return false
    const variantSkus = item.variants.map(v => `${item.skuPrefix}-${v.skuSuffix}`)
    const selectedCount = variantSkus.filter(sku => selectedModalSkus.has(sku)).length
    return selectedCount > 0 && selectedCount < variantSkus.length
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
  
  // Mass actions - apply to selected items only if any are selected, otherwise all
  const handleApplyMassCantidad = () => {
    if (!presupuesto || !massCantidadValue) return
    const value = parseInt(massCantidadValue) || 0
    const hasSelection = selectedItemIndices.size > 0
    const newItems = presupuesto.items.map((item, idx) => {
      if (hasSelection && !selectedItemIndices.has(idx)) return item
      return {
        ...item,
        quantity: value,
        total: value * item.unitPrice
      }
    })
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
    const hasSelection = selectedItemIndices.size > 0
    const newItems = presupuesto.items.map((item, idx) => {
      if (hasSelection && !selectedItemIndices.has(idx)) return item
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
  
  const handleApplyMassPromocion = () => {
    if (!presupuesto) return
    const value = parseFloat(massPromocionValue) || 0
    const hasSelection = selectedItemIndices.size > 0
    
    const newAjustes = { ...itemAjustes }
    presupuesto.items.forEach((item, idx) => {
      if (hasSelection && !selectedItemIndices.has(idx)) return
      // For unit type, limit to quantity
      const adjustedValue = massPromocionType === "unit" ? Math.min(value, item.quantity) : value
      newAjustes[idx] = { type: massPromocionType, value: adjustedValue }
    })
    setItemAjustes(newAjustes)
    setShowPromocionMassMenu(false)
    setMassPromocionValue("")
  }
  
  const handleApplyMassIva = () => {
    if (!presupuesto) return
    const value = parseFloat(massIvaValue) || 0
    const hasSelection = selectedItemIndices.size > 0
    
    const newIva = { ...itemIvas }
    presupuesto.items.forEach((_, idx) => {
      if (hasSelection && !selectedItemIndices.has(idx)) return
      newIva[idx] = value
    })
    setItemIvas(newIva)
    setShowIvaMassMenu(false)
    setMassIvaValue("")
  }
  
  const handleBulkDelete = () => {
    if (!presupuesto || selectedItemIndices.size === 0) return
    const newItems = presupuesto.items.filter((_, idx) => !selectedItemIndices.has(idx))
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setPresupuesto({ ...presupuesto, items: newItems, importeTotal: newTotal })
    updatePresupuesto(presupuesto.id, { items: newItems, importeTotal: newTotal })
    setHasChanges(true)
    setSelectedItemIndices(new Set())
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
  
  // Selection helpers
  const toggleItemSelection = (idx: number) => {
    setSelectedItemIndices(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }
  
  // Individual price adjustment
  const handleApplyIndividualPrice = () => {
    if (!presupuesto || !showIndividualPriceModal) return
    const { idx, value, type } = showIndividualPriceModal
    const numValue = parseFloat(value) || 0
    if (numValue === 0) return
    
    const newItems = [...presupuesto.items]
    const item = newItems[idx]
    let newPrice = item.unitPrice
    
    if (type === "set") {
      newPrice = numValue
    } else if (type === "add") {
      newPrice = item.unitPrice + numValue
    } else if (type === "subtract") {
      newPrice = item.unitPrice - numValue
    } else if (type === "addPercent") {
      newPrice = item.unitPrice * (1 + numValue / 100)
    } else if (type === "subtractPercent") {
      newPrice = item.unitPrice * (1 - numValue / 100)
    }
    
    newPrice = Math.max(0, Math.round(newPrice))
    newItems[idx] = { ...item, unitPrice: newPrice, total: item.quantity * newPrice }
    
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setPresupuesto({ ...presupuesto, items: newItems, importeTotal: newTotal })
    updatePresupuesto(presupuesto.id, { items: newItems, importeTotal: newTotal })
    setHasChanges(true)
    setShowIndividualPriceModal(null)
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
  
  const handleSaveNuevoCliente = (clienteData: Omit<Cliente, "id">) => {
    const newCliente = addCliente(clienteData)
    // Select the new client for this presupuesto
    const clienteName = clienteData.tipo === "empresa" && clienteData.razonSocial 
      ? clienteData.razonSocial 
      : `${clienteData.nombre} ${clienteData.apellido}`.trim()
    handleClienteChange(clienteName)
    setShowNuevoClienteModal(false)
  }
  
  const handleDeletePresupuesto = () => {
    if (!presupuesto) return
    deletePresupuesto(presupuesto.id)
    router.push("/ventas/presupuestos")
  }
  
  // Export PDF
  const handleExportPDF = () => {
    if (!presupuesto) return
    setShowExportDropdown(false)
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text(`Presupuesto PRE-${presupuesto.numero}`, 14, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Cliente: ${presupuesto.clienteNombre}`, 14, 35)
    doc.text(`Fecha: ${new Date(presupuesto.fechaCreacion).toLocaleDateString("es-AR")}`, 14, 42)
    doc.text(`Estado: ${presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}`, 14, 49)
    
    let yPos = 65
    doc.setFillColor(240, 240, 240)
    doc.rect(14, yPos - 5, pageWidth - 28, 10, "F")
    doc.setFont("helvetica", "bold")
    doc.text("Item", 16, yPos)
    doc.text("Cant.", 100, yPos)
    doc.text("Precio Unit.", 120, yPos)
    doc.text("Subtotal", 160, yPos)
    
    doc.setFont("helvetica", "normal")
    yPos += 10
    
    presupuesto.items.forEach((item) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      
      const name = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name
      doc.text(name, 16, yPos)
      doc.text(String(item.quantity), 100, yPos)
      doc.text(`$${item.unitPrice.toLocaleString("es-AR")}`, 120, yPos)
      doc.text(`$${item.total.toLocaleString("es-AR")}`, 160, yPos)
      yPos += 8
    })
    
    yPos += 10
    doc.setDrawColor(200, 200, 200)
    doc.line(14, yPos - 5, pageWidth - 14, yPos - 5)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(`Total: $${Math.round(finalTotal).toLocaleString("es-AR")}`, pageWidth - 14, yPos, { align: "right" })
    
    doc.save(`PRE-${presupuesto.numero}.pdf`)
  }
  
  // Export Text
  const handleExportText = () => {
    if (!presupuesto) return
    setShowExportDropdown(false)
    
    let content = `PRESUPUESTO PRE-${presupuesto.numero}\n`
    content += `${"=".repeat(40)}\n\n`
    content += `Cliente: ${presupuesto.clienteNombre}\n`
    content += `Fecha: ${new Date(presupuesto.fechaCreacion).toLocaleDateString("es-AR")}\n`
    content += `Estado: ${presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}\n\n`
    content += `ITEMS\n`
    content += `${"-".repeat(40)}\n`
    
    presupuesto.items.forEach((item, idx) => {
      content += `${idx + 1}. ${item.name}\n`
      content += `   SKU: ${item.sku || "N/A"}\n`
      content += `   Cantidad: ${item.quantity}\n`
      content += `   Precio Unit.: $${item.unitPrice.toLocaleString("es-AR")}\n`
      content += `   Subtotal: $${item.total.toLocaleString("es-AR")}\n\n`
    })
    
    content += `${"-".repeat(40)}\n`
    content += `TOTAL: $${Math.round(finalTotal).toLocaleString("es-AR")}\n`
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `PRE-${presupuesto.numero}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  // Llevar a ventas - converts presupuesto to aceptado and creates a venta
  const handleLlevarAVentas = () => {
    if (!presupuesto || presupuesto.items.length === 0) return
    
    const now = new Date()
    const newVenta = addVenta({
      fecha: now.toISOString().split("T")[0],
      hora: now.toTimeString().split(" ")[0].substring(0, 5),
      clienteId: presupuesto.clienteId,
      clienteNombre: presupuesto.clienteNombre,
      items: presupuesto.items.map(item => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        discountType: "percent" as const,
        total: item.total,
        categoria: item.categoria,
      })),
      subtotal: rawSubtotal,
      descuento: showGlobalDiscount ? globalDiscount.value : 0,
      descuentoTipo: showGlobalDiscount ? (globalDiscount.type === "cash" ? "fixed" : "percent") : "percent",
      total: finalTotal,
      metodoPago: "efectivo",
      estado: "completada",
      vendedor: "—",
    })
    
    updatePresupuesto(presupuesto.id, { estado: "aceptado", ventaId: newVenta.id })
    router.push("/ventas/ventasb")
  }
  
  // Ver en ventas - just navigate
  const handleVerEnVentas = () => {
    router.push("/ventas/ventasb")
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

  // Calculate raw subtotal (without any discounts)
  const rawSubtotal = presupuesto.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)
  
  // Calculate subtotal with item-level promociones applied
  const subtotalWithAjustes = presupuesto.items.reduce((sum, item, idx) => {
    const ajuste = itemAjustes[idx] || { value: 0, type: "percent" }
    
    if (ajuste.type === "unit") {
      // Unit discount: reduce quantity by discount units (max is item.quantity)
      const discountUnits = Math.min(ajuste.value, item.quantity)
      const effectiveQuantity = Math.max(0, item.quantity - discountUnits)
      return sum + (effectiveQuantity * item.unitPrice)
    } else {
      // Percent or cash discount on unit price
      const ajusteAmt = ajuste.type === "percent"
        ? item.unitPrice * (ajuste.value / 100)
        : ajuste.value
      const adjustedUnitPrice = Math.max(0, item.unitPrice - ajusteAmt)
      return sum + (item.quantity * adjustedUnitPrice)
    }
  }, 0)
  
  // Calculate item-level discount amount
  const itemDiscountAmount = rawSubtotal - subtotalWithAjustes
  
  const globalDiscountAmount = globalDiscount.type === "percent"
    ? subtotalWithAjustes * (globalDiscount.value / 100)
    : globalDiscount.value
  
  // Total discount (item-level + global)
  const totalDiscountAmount = itemDiscountAmount + globalDiscountAmount
  
  // Calculate additional charges (envio + custom)
  const totalAdditionalCharges = (showEnvio ? envioAmount : 0) + customCharges.reduce((sum, c) => sum + c.value, 0)
  
  const finalTotal = Math.max(0, subtotalWithAjustes - globalDiscountAmount + totalAdditionalCharges)

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
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!hasChanges}
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground hover:bg-muted text-sm font-medium"
                >
                  Deshacer
                </button>
                <button
                  disabled={!hasChanges}
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary hover:bg-muted text-sm font-medium"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Order Header - styled like ODC */}
            <div className="px-6 py-4 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title and info */}
                <div className="flex items-center gap-6">
                  {/* Presupuesto ID */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Presupuesto</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{presupuesto.id}</h1>
                    </div>
                  </div>
                  
                  <div className="h-10 w-px bg-border/40" />
                  
                  {/* Cliente */}
                  <div className="relative" ref={clienteDropdownRef}>
                    <div 
                      className={`flex flex-col ${isEditable ? "cursor-pointer group" : ""}`}
                      onMouseEnter={() => setIsHoveringCliente(true)}
                      onMouseLeave={() => setIsHoveringCliente(false)}
                      onClick={() => isEditable && setShowClienteDropdown(!showClienteDropdown)}
                    >
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cliente</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-800">{presupuesto.clienteNombre}</span>
                        {isEditable && <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showClienteDropdown ? "rotate-180" : ""}`} />}
                      </div>
                    </div>
                    
                    {/* Cliente Dropdown */}
                    {showClienteDropdown && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-64">
                        <div className="p-2 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={clienteSearch}
                              onChange={(e) => setClienteSearch(e.target.value)}
                              placeholder="Buscar cliente..."
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {/* Consumidor Final - always first */}
                          <button
                            onClick={() => handleClienteChange("Consumidor Final")}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                              presupuesto.clienteNombre === "Consumidor Final" ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                            }`}
                          >
                            Consumidor Final
                          </button>
                          
                          {/* Nuevo Cliente option */}
                          <button
                            onClick={() => {
                              setShowClienteDropdown(false)
                              setShowNuevoClienteModal(true)
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                          >
                            + Nuevo cliente
                          </button>
                          
                          {/* Separator */}
                          <div className="h-px bg-slate-200 my-1" />
                          
                          {/* Saved clients (alphabetically sorted, excluding "Consumidor Final") */}
                          {filteredClientes
                            .filter(c => c !== "Consumidor Final")
                            .map((cliente) => (
                              <button
                                key={cliente}
                                onClick={() => handleClienteChange(cliente)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
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
                  
                  <div className="h-10 w-px bg-border/40" />
                  
                  {/* Estado */}
                  <div className="relative flex flex-col" ref={estadoDropdownRef}>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Estado</span>
                    <button
                      onClick={() => isEditable && setShowEstadoDropdown(!showEstadoDropdown)}
                      className={`flex items-center gap-1.5 ${isEditable ? "cursor-pointer" : ""}`}
                    >
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoStyle.bg} ${estadoStyle.text}`}>
                        {estadoLabels[presupuesto.estado]}
                      </span>
                      {isEditable && <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showEstadoDropdown ? "rotate-180" : ""}`} />}
                    </button>
                    
                    {showEstadoDropdown && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                        <button
                          onClick={() => { handleEstadoChange("borrador"); setShowEstadoDropdown(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${presupuesto.estado === "borrador" ? "bg-slate-50 font-medium" : ""}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Borrador
                          </span>
                        </button>
                        <button
                          onClick={() => { handleEstadoChange("aceptado"); setShowEstadoDropdown(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${presupuesto.estado === "aceptado" ? "bg-slate-50 font-medium" : ""}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Aceptado
                          </span>
                        </button>
                        <button
                          onClick={() => { handleEstadoChange("rechazado"); setShowEstadoDropdown(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${presupuesto.estado === "rechazado" ? "bg-slate-50 font-medium" : ""}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Rechazado
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-10 w-px bg-border/40" />
                  
                  {/* Fecha Creación */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha Creación</span>
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(presupuesto.fechaCreacion).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  {/* Export dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      disabled={presupuesto.items.length === 0}
                      className={`h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center ${
                        presupuesto.items.length === 0
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100 cursor-pointer"
                      }`}
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
                          onClick={handleExportPDF}
                        >
                          <FileDown className="w-4 h-4 text-slate-400" />
                          Exportar PDF
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                          onClick={handleExportText}
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          Exportar Texto
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Llevar a ventas / Ver en ventas */}
                  {presupuesto.estado === "borrador" && (
                    <button
                      onClick={handleLlevarAVentas}
                      disabled={presupuesto.items.length === 0}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      Llevar a ventas
                    </button>
                  )}
                  {presupuesto.estado === "aceptado" && (
                    <button
                      onClick={handleVerEnVentas}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Ver en ventas
                    </button>
                  )}
                  
                  {/* More Options Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMoreOptionsMenu(!showMoreOptionsMenu)}
                      className="h-8 w-8 flex items-center justify-center text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer rounded-md"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                    {showMoreOptionsMenu && (
                      <div
                        className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[200px]"
                        onMouseLeave={() => setShowMoreOptionsMenu(false)}
                      >
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          onClick={() => {
                            setShowMoreOptionsMenu(false)
                            setShowDeleteConfirmModal(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar Presupuesto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
              {/* Action buttons above grid */}
              {isEditable && (
                <div className="flex items-center gap-2 mb-2">
                  {/* Secciones button */}
                  <div className="relative" data-section-menu>
                    <button
                      onClick={() => setShowSectionMenu(!showSectionMenu)}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-gray-100 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Secciones</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    {showSectionMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                        <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={showIvaColumn}
                            onChange={(e) => setShowIvaColumn(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          IVA
                        </label>
                      </div>
                    )}
                  </div>
                  {/* Bulk delete button when items selected */}
                  {selectedItemIndices.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="h-8 text-xs transition-colors border shadow-sm border-red-200 bg-red-50 gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-red-100 cursor-pointer text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar {selectedItemIndices.size}</span>
                    </button>
                  )}
                </div>
              )}
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
                {/* Grid Header */}
                <div className="bg-slate-100 border-b border-slate-200/80 rounded-t-lg">
                  {isEditable ? (
                    <div className={`grid ${showIvaColumn && showPromocionColumn ? "grid-cols-[2fr_0.8fr_1fr_auto_1.2fr_auto_0.8fr_auto_1.2fr_auto]" : showPromocionColumn ? "grid-cols-[2fr_0.8fr_1fr_auto_1.2fr_auto_1.2fr_auto]" : showIvaColumn ? "grid-cols-[2fr_0.8fr_1fr_auto_0.8fr_auto_1.2fr_auto]" : "grid-cols-[2fr_0.8fr_1fr_auto_1.2fr_auto]"} h-9 text-xs font-medium text-slate-500 uppercase tracking-wider`}>
                      {/* Item */}
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
                            <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">
                              Modificar cantidad de {selectedItemIndices.size > 0 ? `${selectedItemIndices.size} item${selectedItemIndices.size > 1 ? "s" : ""}` : "todos"}
                            </p>
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
                            <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">
                              Modificar precio de {selectedItemIndices.size > 0 ? `${selectedItemIndices.size} item${selectedItemIndices.size > 1 ? "s" : ""}` : "todos"}
                            </p>
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
                      
                      {/* Arrow between Precio and Promoción/IVA/Subtotal */}
                      <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                      
                      {showPromocionColumn && (
                        <>
                          {/* Promoción with mass action */}
                          <div className="flex items-center justify-center gap-1 relative" data-mass-menu>
                            <span>Promoción</span>
                            <button
                              onClick={() => { 
                                setShowPromocionMassMenu(!showPromocionMassMenu)
                                setShowCantidadMassMenu(false)
                                setShowPrecioMassMenu(false)
                                setShowIvaMassMenu(false)
                              }}
                              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {showPromocionMassMenu && (
                              <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                                <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">
                                  Modificar promoción de {selectedItemIndices.size > 0 ? `${selectedItemIndices.size} item${selectedItemIndices.size > 1 ? "s" : ""}` : "todos"}
                                </p>
                                <div className="flex flex-col gap-2">
                                  <div className="flex border border-slate-200 rounded overflow-hidden">
                                    <button
                                      onClick={() => setMassPromocionType("percent")}
                                      className={`flex-1 px-2 py-1.5 text-xs cursor-pointer ${massPromocionType === "percent" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
                                    >
                                      %
                                    </button>
                                    <button
                                      onClick={() => setMassPromocionType("cash")}
                                      className={`flex-1 px-2 py-1.5 text-xs cursor-pointer ${massPromocionType === "cash" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
                                    >
                                      $
                                    </button>
                                    <button
                                      onClick={() => setMassPromocionType("unit")}
                                      className={`flex-1 px-2 py-1.5 text-xs cursor-pointer ${massPromocionType === "unit" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
                                      title="Unidades"
                                    >
                                      U
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      placeholder={massPromocionType === "percent" ? "%" : massPromocionType === "cash" ? "$" : "Unidades"}
                                      value={massPromocionValue}
                                      onChange={(e) => setMassPromocionValue(e.target.value)}
                                      className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                                      min={0}
                                    />
                                    <button
                                      onClick={handleApplyMassPromocion}
                                      className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                    >
                                      Aplicar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {showIvaColumn && (
                            <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                          )}
                        </>
                      )}
                      
                      {showIvaColumn && (
                        <>
                          {/* IVA with mass action */}
                          <div className="flex items-center justify-center gap-1 relative" data-mass-menu>
                            <span>IVA Cont.</span>
                            <button
                              onClick={() => { 
                                setShowIvaMassMenu(!showIvaMassMenu)
                                setShowCantidadMassMenu(false)
                                setShowPrecioMassMenu(false)
                                setShowPromocionMassMenu(false)
                              }}
                              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {showIvaMassMenu && (
                              <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[180px]">
                                <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">
                                  Modificar IVA de {selectedItemIndices.size > 0 ? `${selectedItemIndices.size} item${selectedItemIndices.size > 1 ? "s" : ""}` : "todos"}
                                </p>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="%"
                                    value={massIvaValue}
                                    onChange={(e) => setMassIvaValue(e.target.value)}
                                    className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                                    min={0}
                                  />
                                  <button
                                    onClick={handleApplyMassIva}
                                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                  >
                                    Aplicar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      
                      {/* Arrow between Promoción/IVA and Subtotal */}
                      <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                      
                      <div className="flex items-center justify-end pr-2">Subtotal</div>
                      
                      {/* X delete button column */}
                      <div className="w-10" />
                    </div>
                  ) : (
                    <div className={`grid ${showIvaColumn ? "grid-cols-[2.5fr_0.8fr_1fr_auto_1.2fr_auto_0.8fr_auto_1.2fr]" : "grid-cols-[2.5fr_0.8fr_1fr_auto_1.2fr_auto_1.2fr]"} h-9 text-xs font-medium text-slate-500 uppercase tracking-wider`}>
                      <div className="flex items-center px-4">Item</div>
                      <div className="flex items-center justify-center">Cantidad</div>
                      <div className="flex items-center justify-center">Precio Unit.</div>
                      <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                      <div className="flex items-center justify-center">Promoción</div>
                      {showIvaColumn && (
                        <>
                          <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                          <div className="flex items-center justify-center">IVA Cont.</div>
                        </>
                      )}
                      <div className="flex items-center justify-center w-6 text-slate-300">→</div>
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
                    const ajuste = itemAjustes[idx] || { value: 0, type: "percent" }
                    
                    // Calculate values based on promoción type
                    let adjustedUnitPrice = item.unitPrice
                    let effectiveQuantity = item.quantity
                    let finalItemTotal = 0
                    
                    if (ajuste.type === "unit") {
                      // Unit discount: reduce quantity
                      const discountUnits = Math.min(ajuste.value, item.quantity)
                      effectiveQuantity = Math.max(0, item.quantity - discountUnits)
                      finalItemTotal = effectiveQuantity * item.unitPrice
                    } else {
                      // Percent or cash discount on unit price
                      const ajusteAmt = ajuste.type === "percent" 
                        ? item.unitPrice * (ajuste.value / 100) 
                        : ajuste.value
                      adjustedUnitPrice = Math.max(0, item.unitPrice - ajusteAmt)
                      finalItemTotal = item.quantity * adjustedUnitPrice
                    }
                    
                    const stockDisponible = getStockBySku(item.sku)
                    const exceedsStock = !item.isDescripcionLibre && item.quantity > stockDisponible
                    
                    return (
                      <div 
                        key={idx} 
                        className={`border-b border-slate-100 last:border-b-0 transition-colors ${isEditable ? "cursor-pointer" : ""} ${selectedItemIndices.has(idx) ? "bg-blue-50/50 border-l-2 border-l-blue-400" : isEditable ? "hover:bg-slate-50/50" : ""}`}
                        onMouseDown={(e) => {
                          mouseDownTargetRef.current = e.target
                        }}
                        onClick={(e) => {
                          // Only allow selection in borrador
                          if (!isEditable) return
                          const target = e.target as HTMLElement
                          // The click must end on a non-interactive element (not input/button/select)
                          if (target.closest('input') || target.closest('button') || target.closest('select') || target.closest('textarea')) return
                          // The click must have started on the same target (not a drag from an interactive element)
                          if (mouseDownTargetRef.current !== e.target) return
                          toggleItemSelection(idx)
                        }}
                      >
                        {isEditable ? (
                          <div className={`grid ${showIvaColumn && showPromocionColumn ? "grid-cols-[2fr_0.8fr_1fr_auto_1.2fr_auto_0.8fr_auto_1.2fr_auto]" : showPromocionColumn ? "grid-cols-[2fr_0.8fr_1fr_auto_1.2fr_auto_1.2fr_auto]" : showIvaColumn ? "grid-cols-[2fr_0.8fr_1fr_auto_0.8fr_auto_1.2fr_auto]" : "grid-cols-[2fr_0.8fr_1fr_auto_1.2fr_auto]"} min-h-[72px]`}>
                            {/* Item Info */}
                            <div className="flex items-center gap-3 px-4 py-3">
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
                            <div className="flex flex-col items-center justify-center">
                              <div className="flex items-center border border-slate-200 rounded-full px-1 py-0.5 bg-white">
                                <button
                                  onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-400 hover:text-teal-500 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity || ""}
                                  placeholder="0"
                                  onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                                  onFocus={(e) => { if (item.quantity === 0) e.target.value = "" }}
                                  className="w-10 text-center text-sm py-1 focus:outline-none placeholder:text-slate-300 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-400 hover:text-teal-500 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              {exceedsStock && (
                                <span className="text-[10px] text-red-500 mt-0.5 text-center leading-tight">Supera stock disponible</span>
                              )}
                            </div>
                            
                            {/* Precio */}
                            <div className="flex items-center justify-center gap-1">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-sm">$</span>
                                <input
                                  type="number"
                                  value={item.unitPrice || ""}
                                  placeholder="0"
                                  onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                                  onFocus={(e) => { if (item.unitPrice === 0) e.target.value = "" }}
                                  className="w-20 text-center text-sm py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400 placeholder:text-slate-300"
                                />
                              </div>
                              <button
                                onClick={() => setShowIndividualPriceModal({ idx, value: "", type: "set" })}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                title="Ajustar precio"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                            
                            {/* Promoción */}
                            {showPromocionColumn && (
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                placeholder="0"
                                min="0"
                                max={ajuste.type === "unit" ? item.quantity : undefined}
                                value={ajuste.value || ""}
                                onChange={(e) => {
                                  let val = parseFloat(e.target.value) || 0
                                  // Limit unit discount to quantity
                                  if (ajuste.type === "unit" && val > item.quantity) {
                                    val = item.quantity
                                  }
                                  setItemAjustes(prev => ({
                                    ...prev,
                                    [idx]: { ...ajuste, value: val }
                                  }))
                                }}
                                className="w-12 text-center text-xs py-1 border border-slate-200 rounded focus:outline-none focus:border-blue-400 placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="flex border border-slate-200 rounded overflow-hidden">
                                <button
                                  onClick={() => setItemAjustes(prev => ({
                                    ...prev,
                                    [idx]: { ...ajuste, type: "percent" }
                                  }))}
                                  className={`px-1.5 py-1 text-xs cursor-pointer ${ajuste.type === "percent" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  %
                                </button>
                                <button
                                  onClick={() => setItemAjustes(prev => ({
                                    ...prev,
                                    [idx]: { ...ajuste, type: "cash" }
                                  }))}
                                  className={`px-1.5 py-1 text-xs cursor-pointer ${ajuste.type === "cash" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  $
                                </button>
                                <button
                                  onClick={() => setItemAjustes(prev => ({
                                    ...prev,
                                    [idx]: { ...ajuste, type: "unit", value: Math.min(ajuste.value, item.quantity) }
                                  }))}
                                  className={`px-1.5 py-1 text-xs cursor-pointer ${ajuste.type === "unit" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                  title="Unidades"
                                >
                                  <Package className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            )}
                            
                            {showIvaColumn && (
                              <>
                                {/* Arrow between Promocion and IVA */}
                                {showPromocionColumn && (
                                  <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                                )}
                                
                                {/* IVA Contenido */}
                                <div className="flex items-center justify-center">
                                  <select
                                    value={itemIvas[idx] ?? getIvaBySku(item.sku)}
                                    onChange={(e) => setItemIvas(prev => ({ ...prev, [idx]: parseInt(e.target.value) }))}
                                    className="text-xs py-1 px-2 border border-slate-200 rounded focus:outline-none focus:border-blue-400 cursor-pointer bg-white"
                                  >
                                    <option value={0}>0%</option>
                                    <option value={10}>10%</option>
                                    <option value={21}>21%</option>
                                  </select>
                                </div>
                              </>
                            )}
                            
                            {/* Arrow */}
                            <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                            
                            {/* Subtotal */}
                            <div className="flex flex-col items-end justify-center">
                              {ajuste.value > 0 ? (
                                // With promoción applied
                                ajuste.type === "unit" ? (
                                  // Unit discount
                                  <>
                                    <span className="text-xs font-medium text-slate-700">
                                      {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-[10px] text-orange-600 font-medium">
                                      -{Math.min(ajuste.value, item.quantity)} unidad{Math.min(ajuste.value, item.quantity) > 1 ? "es" : ""} OFF
                                    </span>
                                    <span className="text-base font-bold text-slate-900">
                                      ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                    </span>
                                  </>
                                ) : ajuste.type === "percent" ? (
                                  // Percent discount
                                  <>
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-[10px] text-red-500 font-medium">
                                      {ajuste.value}% OFF
                                    </span>
                                    <span className="text-xs font-medium text-slate-700">
                                      {item.quantity} × ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-base font-bold text-slate-900">
                                      ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                    </span>
                                  </>
                                ) : (
                                  // Cash discount
                                  <>
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-[10px] text-red-500 font-medium">
                                      -${ajuste.value.toLocaleString("es-AR")} OFF c/u
                                    </span>
                                    <span className="text-xs font-medium text-slate-700">
                                      {item.quantity} × ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-base font-bold text-slate-900">
                                      ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                    </span>
                                  </>
                                )
                              ) : (
                                // No promoción
                                <>
                                  <span className="text-xs font-medium text-slate-600">
                                    {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                  </span>
                                  <span className="text-base font-bold text-slate-900">
                                    ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Delete button */}
                            <div className="flex items-center justify-center w-10">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`grid ${showIvaColumn ? "grid-cols-[2.5fr_0.8fr_1fr_auto_1.2fr_auto_0.8fr_auto_1.2fr]" : "grid-cols-[2.5fr_0.8fr_1fr_auto_1.2fr_auto_1.2fr]"} min-h-[56px]`}>
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
                              <span className="text-sm text-slate-700">{item.quantity}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-700">${item.unitPrice.toLocaleString("es-AR")}</span>
                            </div>
                            <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                            <div className="flex items-center justify-center">
                              {ajuste.value > 0 ? (
                                <span className="text-sm text-red-500">
                                  -{ajuste.value}{ajuste.type === "percent" ? "%" : ajuste.type === "unit" ? " u." : "$"}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-300">-</span>
                              )}
                            </div>
                            {showIvaColumn && (
                              <>
                                <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                                <div className="flex items-center justify-center">
                                  <span className="text-sm text-slate-700">{itemIvas[idx] ?? getIvaBySku(item.sku)}%</span>
                                </div>
                              </>
                            )}
                            <div className="flex items-center justify-center w-6 text-slate-300">→</div>
                            <div className="flex flex-col items-end justify-center pr-4">
                              {ajuste.value > 0 ? (
                                // With promoción applied
                                ajuste.type === "unit" ? (
                                  <>
                                    <span className="text-xs font-medium text-slate-700">
                                      {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-[10px] text-orange-600 font-medium">
                                      -{Math.min(ajuste.value, item.quantity)} unidad{Math.min(ajuste.value, item.quantity) > 1 ? "es" : ""} OFF
                                    </span>
                                    <span className="text-base font-bold text-slate-900">
                                      ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                    </span>
                                  </>
                                ) : ajuste.type === "percent" ? (
                                  <>
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-[10px] text-red-500 font-medium">
                                      {ajuste.value}% OFF
                                    </span>
                                    <span className="text-xs font-medium text-slate-700">
                                      {item.quantity} × ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-base font-bold text-slate-900">
                                      ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-[10px] text-red-500 font-medium">
                                      -${ajuste.value.toLocaleString("es-AR")} OFF c/u
                                    </span>
                                    <span className="text-xs font-medium text-slate-700">
                                      {item.quantity} × ${Math.round(adjustedUnitPrice).toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-base font-bold text-slate-900">
                                      ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                    </span>
                                  </>
                                )
                              ) : (
                                <>
                                  <span className="text-xs font-medium text-slate-600">
                                    {item.quantity} × ${Math.round(item.unitPrice).toLocaleString("es-AR")}
                                  </span>
                                  <span className="text-base font-bold text-slate-900">
                                    ${Math.round(finalItemTotal).toLocaleString("es-AR")}
                                  </span>
                                </>
                              )}
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
                
              </div>
              
              {/* Totals Card - Separate from grid */}
              {presupuesto.items.length > 0 && (
                <div className="flex justify-end mt-3">
                  <div className="w-1/2 bg-white border border-slate-200/60 rounded-lg shadow-sm p-4">
                    <div className="space-y-2">
                      {/* Subtotal */}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="text-slate-700">${Math.round(rawSubtotal).toLocaleString("es-AR")}</span>
                      </div>
                      
                      {/* Promociones (item-level discount amount) */}
                      {itemDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-red-500">Promociones</span>
                          <span className="text-red-500">-${Math.round(itemDiscountAmount).toLocaleString("es-AR")}</span>
                        </div>
                      )}
                      
                      {/* Additional items column (Descuento Global, Envío, Otro) */}
                      {showGlobalDiscount && (
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-1">
                            {isEditable && (
                              <button
                                onClick={() => {
                                  setShowGlobalDiscount(false)
                                  setGlobalDiscount({ value: 0, type: "percent" })
                                }}
                                className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="text-slate-500">Descuento global</span>
                            {!isEditable && globalDiscountAmount > 0 && (
                              <span className="text-xs text-slate-400">
                                ({globalDiscount.type === "cash" ? `$${globalDiscount.value.toLocaleString("es-AR")}` : `${globalDiscount.value}%`})
                              </span>
                            )}
                          </div>
                          {isEditable ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={globalDiscount.value || ""}
                                onChange={(e) => setGlobalDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                className="w-16 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="flex border border-slate-200 rounded overflow-hidden">
                                <button
                                  onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "cash" }))}
                                  className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "cash" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  $
                                </button>
                                <button
                                  onClick={() => setGlobalDiscount(prev => ({ ...prev, type: "percent" }))}
                                  className={`px-2 py-1 text-xs cursor-pointer ${globalDiscount.type === "percent" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-red-500">-${Math.round(globalDiscountAmount).toLocaleString("es-AR")}</span>
                          )}
                        </div>
                      )}
                      
                      {showEnvio && (
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-1">
                            {isEditable && (
                              <button
                                onClick={() => {
                                  setShowEnvio(false)
                                  setEnvioAmount(0)
                                }}
                                className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="text-slate-500">Envío</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-sm">$</span>
                            {isEditable ? (
                              <input
                                type="number"
                                value={envioAmount || ""}
                                onChange={(e) => setEnvioAmount(parseFloat(e.target.value) || 0)}
                                className="w-20 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-slate-700">{envioAmount.toLocaleString("es-AR")}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {customCharges.map((charge) => (
                        <div key={charge.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-1">
                            {isEditable && (
                              <button
                                onClick={() => setCustomCharges(prev => prev.filter(c => c.id !== charge.id))}
                                className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isEditable && editingCustomChargeId === charge.id ? (
                              <input
                                type="text"
                                value={charge.label}
                                onChange={(e) => setCustomCharges(prev => prev.map(c => c.id === charge.id ? { ...c, label: e.target.value } : c))}
                                onBlur={() => setEditingCustomChargeId(null)}
                                onKeyDown={(e) => e.key === "Enter" && setEditingCustomChargeId(null)}
                                className="text-sm px-1 py-0.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400 w-24"
                                autoFocus
                              />
                            ) : (
                              <span 
                                className={`text-slate-500 ${isEditable ? "cursor-pointer hover:text-slate-700" : ""}`}
                                onClick={() => isEditable && setEditingCustomChargeId(charge.id)}
                              >
                                {charge.label || "Otro"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-sm">$</span>
                            {isEditable ? (
                              <input
                                type="number"
                                value={charge.value || ""}
                                onChange={(e) => setCustomCharges(prev => prev.map(c => c.id === charge.id ? { ...c, value: parseFloat(e.target.value) || 0 } : c))}
                                className="w-20 text-right text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-slate-700">{charge.value.toLocaleString("es-AR")}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Agregar tags - only the ones not yet added */}
                      {isEditable && (!showGlobalDiscount || !showEnvio || customCharges.length === 0) && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-xs text-slate-400">Agregar:</span>
                          {!showGlobalDiscount && (
                            <button
                              onClick={() => setShowGlobalDiscount(true)}
                              className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              Descuento Global
                            </button>
                          )}
                          {!showEnvio && (
                            <button
                              onClick={() => setShowEnvio(true)}
                              className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              Envío
                            </button>
                          )}
                          {customCharges.length === 0 && (
                            <button
                              onClick={() => setCustomCharges([{ id: Date.now(), label: "Otro", value: 0 }])}
                              className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              Otro
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Total */}
                      <div className="flex justify-between text-base font-semibold pt-2 border-t border-slate-200">
                        <span className="text-slate-700">Total</span>
                        <span className="text-slate-900">${Math.round(finalTotal).toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  setSelectedModalSkus(new Set())
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
                      const allSelected = areAllVariantsSelected(item)
                      const someSelected = areSomeVariantsSelected(item)
                      
                      return (
                        <div key={itemId} className="border border-slate-100 rounded-lg">
                          <div 
                            className={`px-4 py-3 flex items-center gap-3 rounded-t-lg cursor-pointer transition-colors ${
                              allSelected ? "bg-blue-50/50" : someSelected ? "bg-blue-50/30" : "bg-slate-50/50 hover:bg-slate-100/50"
                            }`}
                            onClick={() => toggleParentSelection(item)}
                          >
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <Image
                                src={getCategoryImage(item.categoria || "")}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                                <span className="text-xs text-slate-400">{item.variants?.length} variantes</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {item.marca}{item.marca && item.categoria && " · "}{item.categoria}
                              </p>
                            </div>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {item.variants?.map((variant: any, variantIdx: number) => {
                              const variantSku = `${item.skuPrefix}-${variant.skuSuffix}`
                              const stock = parseInt(variant.stock?.disponible || "0")
                              const isSelected = selectedModalSkus.has(variantSku)
                              const isLastChild = variantIdx === (item.variants?.length || 0) - 1
                              
                              return (
                                <div
                                  key={variantSku}
                                  onClick={() => toggleModalSku(variantSku)}
                                  className={`flex items-center gap-3 pl-10 pr-4 py-2.5 cursor-pointer transition-colors ${isLastChild ? "rounded-b-lg" : ""} ${isSelected ? "bg-blue-50/50 border-l-2 border-l-blue-400" : "hover:bg-slate-50"}`}
                                >
                                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image
                                      src={getCategoryImage(item.categoria || "")}
                                      alt={variant.name || item.name}
                                      width={32}
                                      height={32}
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-slate-700 truncate">{variant.name || item.name}</p>
                                      {variant.atributosPrincipales?.map((attr: any, i: number) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded whitespace-nowrap">
                                          {attr.value}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                                    ${(variant.precio?.precioFinal || 0).toLocaleString("es-AR")}
                                  </span>
                                  
                                  <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                                    {stock} {stock === 1 ? "disponible" : "disponibles"}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }
                    
                    const sku = item.sku || ""
                    const stock = parseInt(item.stock?.disponible || "0")
                    const isSelected = selectedModalSkus.has(sku)
                    
                    return (
                      <div
                        key={itemId}
                        onClick={() => toggleModalSku(sku)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? "border-blue-200 bg-blue-50/50 border-l-2 border-l-blue-400" : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <Image
                            src={getCategoryImage(item.categoria || "")}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                          <p className="text-xs text-slate-400">
                            {item.marca}{item.marca && item.categoria && " · "}{item.categoria}
                          </p>
                        </div>
                        
                        <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                          ${(item.precio?.precioFinal || 0).toLocaleString("es-AR")}
                        </span>
                        
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                          {stock} {stock === 1 ? "disponible" : "disponibles"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-xl">
              <span className="text-sm text-slate-500">
                {selectedModalSkus.size > 0 ? `${selectedModalSkus.size} item${selectedModalSkus.size > 1 ? "s" : ""} seleccionado${selectedModalSkus.size > 1 ? "s" : ""}` : "Ningún item seleccionado"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddItemModal(false)
                    setSelectedModalSkus(new Set())
                    setModalSearch("")
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSelectedItems}
                  disabled={selectedModalSkus.size === 0}
                  className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Individual Price Adjustment Modal */}
      {showIndividualPriceModal && presupuesto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs mx-4">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Ajustar precio</h3>
              <p className="text-xs text-slate-500 mt-1">
                {presupuesto.items[showIndividualPriceModal.idx]?.name}
              </p>
              <p className="text-xs text-slate-400">
                Precio actual: ${presupuesto.items[showIndividualPriceModal.idx]?.unitPrice.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-col gap-3">
                <select
                  value={showIndividualPriceModal.type}
                  onChange={(e) => setShowIndividualPriceModal({ ...showIndividualPriceModal, type: e.target.value as any })}
                  className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                >
                  <option value="set">Reemplazar por $</option>
                  <option value="add">Agregar $</option>
                  <option value="subtract">Disminuir $</option>
                  <option value="addPercent">Agregar %</option>
                  <option value="subtractPercent">Disminuir %</option>
                </select>
                <input
                  type="number"
                  placeholder={showIndividualPriceModal.type.includes("Percent") ? "%" : "$"}
                  value={showIndividualPriceModal.value}
                  onChange={(e) => setShowIndividualPriceModal({ ...showIndividualPriceModal, value: e.target.value })}
                  className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                  min={0}
                  autoFocus
                />
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 rounded-b-xl">
              <button
                onClick={() => setShowIndividualPriceModal(null)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyIndividualPrice}
                disabled={!showIndividualPriceModal.value}
                className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Aplicar
              </button>
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
      
      {/* Nuevo Cliente Modal */}
      <NuevoClienteModal
        isOpen={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        onSave={handleSaveNuevoCliente}
      />
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
