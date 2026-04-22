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
  ShoppingCart,
  X,
  Search,
  Check,
  Minus,
  Pencil,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Package,
} from "lucide-react"
import jsPDF from "jspdf"
import { StockEditModal } from "@/components/modals/stock-edit-modal"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { EstadoOrdenDeCompra } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import type { OrdenDeCompraItem, OrdenDeCompra, OrdenCompra } from "@/lib/types"
import { useOrdenesDeCompra } from "@/hooks/use-ordenes-de-compra"
import { useAccount } from "@/lib/contexts/account-context"
import { useSettings } from "@/lib/contexts/settings-context"
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

function OrdenDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  // Use hooks for data persistence
  const { ordenes, updateOrden, updateEstado, deleteOrden } = useOrdenesDeCompra()
  const { currentAccount } = useAccount()
  const { items: allItems } = useItems()
  const { stock } = useSettings()
  
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

  // Find orden from ordenes array directly
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
  
  // Add item modal state (the selection modal)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  
  // Selection state for add item modal
  const [selectedModalItems, setSelectedModalItems] = useState<{ [id: string]: boolean }>({})
  
  // Selection modal search and filters
  const [modalSearch, setModalSearch] = useState("")
  const [modalFilters, setModalFilters] = useState<{
    categoria: string
    marca: string
    stockRange: string
  }>({ categoria: "", marca: "", stockRange: "" })
  const [modalSort, setModalSort] = useState<"name" | "stock" | "precio">("name")
  const [modalSortDirection, setModalSortDirection] = useState<"asc" | "desc">("asc")
  const [showModalFilters, setShowModalFilters] = useState(false)
  
  // Stock edit modal state
  const [stockEditModal, setStockEditModal] = useState<{
    isOpen: boolean
    itemIndex: number
    sku: string
    itemName: string
    total: number
    reservado: number
  } | null>(null)
  
  // Stock proyectado editing state
  const [editingStockProyectado, setEditingStockProyectado] = useState<{
    idx: number
    value: string
  } | null>(null)
  
  // Track original prices for "restablecer" functionality
  const [originalPrices, setOriginalPrices] = useState<{ [idx: number]: number }>({})
  
  // Unidades bonificadas state
  const [itemBonificadas, setItemBonificadas] = useState<{ [idx: number]: { value: number; visible: boolean } }>({})
  
  // Confirmation modals state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showLlevarComprasModal, setShowLlevarComprasModal] = useState(false)
  const [showMoreOptionsMenu, setShowMoreOptionsMenu] = useState(false)
  
  // Mass actions dropdowns state
  const [showAPedirMassMenu, setShowAPedirMassMenu] = useState(false)
  const [showProyectadoMassMenu, setShowProyectadoMassMenu] = useState(false)
  const [showCostoMassMenu, setShowCostoMassMenu] = useState(false)
  const [massAPedirValue, setMassAPedirValue] = useState("")
  const [massProyectadoValue, setMassProyectadoValue] = useState("")
  const [massCostoValue, setMassCostoValue] = useState("")
  const [massCostoType, setMassCostoType] = useState<"set" | "add" | "subtract" | "addPercent" | "subtractPercent">("set")
  
  // Editing descripcion libre items
  const [editingLibreItem, setEditingLibreItem] = useState<{ idx: number; field: "name" | "sku" | "marca" | "categoria"; value: string } | null>(null)
  
  // Click outside handler for mass action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-mass-menu]')) {
        setShowAPedirMassMenu(false)
        setShowProyectadoMassMenu(false)
        setShowCostoMassMenu(false)
      }
    }
    if (showAPedirMassMenu || showProyectadoMassMenu || showCostoMassMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showAPedirMassMenu, showProyectadoMassMenu, showCostoMassMenu])
  
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
    const standaloneItem = allItems.find(item => item.sku === sku)
    if (standaloneItem?.stock?.disponible !== undefined) {
      return parseInt(standaloneItem.stock.disponible)
    }
    
    for (const item of allItems) {
      if (item.variants) {
        const variant = item.variants.find(v => v.sku === sku || `${item.skuPrefix}-${v.skuSuffix}` === sku)
        if (variant?.stock?.disponible !== undefined) {
          return parseInt(variant.stock.disponible)
        }
      }
    }
    return 0
  }
  
  // Get proveedor items with parent-child structure for the modal
  const proveedorItemsStructured = useMemo(() => {
    if (!orden) return []
    return INITIAL_ITEMS.filter(item => item.proveedor === orden.proveedorNombre)
  }, [orden])
  
  // Get unique categorias and marcas for filters
  const uniqueCategorias = useMemo(() => {
    const cats = new Set<string>()
    proveedorItemsStructured.forEach(item => {
      if (item.categoria) cats.add(item.categoria)
      if (item.variants) {
        item.variants.forEach(v => {
          if (v.categoria) cats.add(v.categoria)
        })
      }
    })
    return Array.from(cats).sort()
  }, [proveedorItemsStructured])
  
  const uniqueMarcas = useMemo(() => {
    const marcas = new Set<string>()
    proveedorItemsStructured.forEach(item => {
      if (item.marca) marcas.add(item.marca)
    })
    return Array.from(marcas).sort()
  }, [proveedorItemsStructured])
  
  // Filtered and sorted proveedor items for modal
  const filteredModalItems = useMemo(() => {
    let items = [...proveedorItemsStructured]
    
    const getSearchableFields = (item: any, parentSkuPrefix?: string): string[] => {
      const fields: string[] = []
      if (item.name) fields.push(item.name)
      if (item.sku) fields.push(item.sku)
      if (item.skuPrefix) fields.push(item.skuPrefix)
      if (item.skuSuffix) {
        fields.push(item.skuSuffix)
        if (parentSkuPrefix) fields.push(`${parentSkuPrefix}-${item.skuSuffix}`)
      }
      if (item.marca) fields.push(item.marca)
      if (item.categoria) fields.push(item.categoria)
      if (item.proveedor) fields.push(item.proveedor)
      if (item.modelo) fields.push(item.modelo)
      if (item.atributosPrincipales) {
        item.atributosPrincipales.forEach((attr: any) => {
          fields.push(attr.key)
          fields.push(attr.value)
        })
      }
      return fields
    }
    
    // Apply search filter
    if (modalSearch.trim()) {
      const searchWords = modalSearch.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0)
      
      items = items.map(item => {
        const parentFields = getSearchableFields(item)
        const parentText = parentFields.join(" ").toLowerCase()
        const parentMatches = searchWords.every(word => parentText.includes(word))
        
        if (parentMatches) return item
        
        if (item.variants && item.variants.length > 0) {
          const matchingVariants = item.variants.filter((v: any) => {
            const variantFields = getSearchableFields(v, item.skuPrefix)
            const combinedFields = [...parentFields, ...variantFields]
            const combinedText = combinedFields.join(" ").toLowerCase()
            return searchWords.every(word => combinedText.includes(word))
          })
          
          if (matchingVariants.length > 0) {
            return { ...item, variants: matchingVariants }
          }
        }
        
        return null
      }).filter(Boolean) as typeof items
    }
    
    // Apply categoria filter
    if (modalFilters.categoria) {
      items = items.filter(item => 
        item.categoria === modalFilters.categoria ||
        item.variants?.some((v: any) => v.categoria === modalFilters.categoria)
      )
    }
    
    // Apply marca filter
    if (modalFilters.marca) {
      items = items.filter(item => item.marca === modalFilters.marca)
    }
    
    // Apply stock range filter
    if (modalFilters.stockRange) {
      items = items.filter(item => {
        const getStock = (i: any) => parseInt(i.stock?.disponible || "0")
        const checkStockRange = (stockVal: number) => {
          if (modalFilters.stockRange === "sin-stock") return stockVal === 0
          if (modalFilters.stockRange === "bajo") return stockVal > 0 && stockVal <= 10
          if (modalFilters.stockRange === "medio") return stockVal > 10 && stockVal <= 50
          if (modalFilters.stockRange === "alto") return stockVal > 50
          return true
        }
        
        if (item.hasVariants && item.variants) {
          return item.variants.some((v: any) => checkStockRange(getStock(v)))
        } else {
          return checkStockRange(getStock(item))
        }
      })
    }
    
    // Apply sorting
    const direction = modalSortDirection === "asc" ? 1 : -1
    items.sort((a, b) => {
      let result = 0
      if (modalSort === "name") {
        result = a.name.localeCompare(b.name)
      } else if (modalSort === "stock") {
        const getMinStock = (item: any) => {
          if (item.hasVariants && item.variants) {
            return Math.min(...item.variants.map((v: any) => parseInt(v.stock?.disponible || "0")))
          }
          return parseInt(item.stock?.disponible || "0")
        }
        result = getMinStock(a) - getMinStock(b)
      } else if (modalSort === "precio") {
        const getMinPrice = (item: any) => {
          if (item.hasVariants && item.variants) {
            return Math.min(...item.variants.map((v: any) => v.precio?.costo || 0))
          }
          return item.precio?.costo || 0
        }
        result = getMinPrice(a) - getMinPrice(b)
      }
      return result * direction
    })
    
    return items
  }, [proveedorItemsStructured, modalSearch, modalFilters, modalSort, modalSortDirection])
  
  // Check if search has no results (for "descripcion libre" feature)
  const hasNoSearchResults = useMemo(() => {
    if (!modalSearch.trim()) return false
    return filteredModalItems.length === 0
  }, [modalSearch, filteredModalItems])
  
  // Selection helpers for modal
  const getItemId = (item: any): string => item.id || item.sku || ""
  
  const getAllSelectableIds = useMemo(() => {
    const ids: string[] = []
    for (const item of proveedorItemsStructured) {
      const isParent = item.hasVariants && item.variants && item.variants.length > 0
      if (isParent) {
        for (const child of item.variants!) {
          const itemId = getItemId(child)
          if (itemId) ids.push(itemId)
        }
      } else {
        const itemId = getItemId(item)
        if (itemId) ids.push(itemId)
      }
    }
    return ids
  }, [proveedorItemsStructured])
  
  const selectAllActive = useMemo(() => {
    if (getAllSelectableIds.length === 0) return false
    return getAllSelectableIds.every(itemId => selectedModalItems[itemId])
  }, [getAllSelectableIds, selectedModalItems])
  
  const selectAllIndeterminate = useMemo(() => {
    const someSelected = getAllSelectableIds.some(itemId => selectedModalItems[itemId])
    return someSelected && !selectAllActive
  }, [getAllSelectableIds, selectedModalItems, selectAllActive])
  
  const handleSelectAllModalItems = () => {
    const shouldSelect = !selectAllActive && !selectAllIndeterminate
    const next: { [id: string]: boolean } = {}
    for (const itemId of getAllSelectableIds) next[itemId] = shouldSelect
    setSelectedModalItems(next)
  }
  
  const handleModalItemSelection = (item: any, isChild: boolean = false) => {
    const isParent = !isChild && item.hasVariants && item.variants && item.variants.length > 0
    if (isParent) {
      const childrenIds = item.variants!.map((v: any) => getItemId(v)).filter(Boolean)
      const allSelected = childrenIds.every((itemId: string) => selectedModalItems[itemId])
      const someSelected = childrenIds.some((itemId: string) => selectedModalItems[itemId])
      const shouldSelect = !allSelected && !someSelected
      setSelectedModalItems(prev => {
        const next = { ...prev }
        for (const itemId of childrenIds) next[itemId] = shouldSelect
        return next
      })
    } else {
      const itemId = getItemId(item)
      if (itemId) {
        setSelectedModalItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))
      }
    }
  }
  
  const getModalSelectionState = (item: any, isChild: boolean = false): { checked: boolean; indeterminate: boolean } => {
    const isParent = !isChild && item.hasVariants && item.variants && item.variants.length > 0
    if (isParent) {
      const childrenIds = item.variants!.map((v: any) => getItemId(v)).filter(Boolean)
      const allSelected = childrenIds.every((itemId: string) => selectedModalItems[itemId])
      const someSelected = childrenIds.some((itemId: string) => selectedModalItems[itemId])
      return { checked: allSelected, indeterminate: someSelected && !allSelected }
    }
    const itemId = getItemId(item)
    return { checked: itemId ? !!selectedModalItems[itemId] : false, indeterminate: false }
  }
  
  const selectedModalCount = useMemo(() => {
    return Object.values(selectedModalItems).filter(Boolean).length
  }, [selectedModalItems])
  
  // Handle adding selected items from modal to order
  const handleAddSelectedItems = () => {
    if (!orden || selectedModalCount === 0) return
    
    const existingSkus = new Set(orden.items.map(item => item.sku))
    const newItems: OrdenDeCompraItem[] = [...orden.items]
    
    for (const item of proveedorItemsStructured) {
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
              unitPrice: variant.precio?.costo || 0,
              total: variant.precio?.costo || 0,
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
            unitPrice: item.precio?.costo || 0,
            total: item.precio?.costo || 0,
            categoria: item.categoria,
            marca: item.marca,
          })
        }
      }
    }
    
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    const updatedOrden = { ...orden, items: newItems, importeEstimado: newTotal }
    setOrden(updatedOrden)
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setSelectedModalItems({})
    setHasChanges(true)
    setShowAddItemModal(false)
    setModalSearch("")
    setModalFilters({ categoria: "", marca: "", stockRange: "" })
  }
  
  // Handle adding free description item
  const handleAddFreeItem = () => {
    if (!orden || !modalSearch.trim()) return
    const newItem: OrdenDeCompraItem = {
      sku: "",
      name: modalSearch.trim(),
      quantity: 1,
      unitPrice: 0,
      total: 0,
      isDescripcionLibre: true,
    }
    const newItems = [...orden.items, newItem]
    setOrden({ ...orden, items: newItems })
    updateOrden(orden.id, { items: newItems })
    setHasChanges(true)
    setShowAddItemModal(false)
    setModalSearch("")
    setModalFilters({ categoria: "", marca: "", stockRange: "" })
  }
  
  // Handle updating descripcion libre item name, sku, marca, or categoria
  const handleUpdateLibreItem = (idx: number, field: "name" | "sku" | "marca" | "categoria", value: string) => {
    if (!orden) return
    const newItems = [...orden.items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    setOrden({ ...orden, items: newItems })
    updateOrden(orden.id, { items: newItems })
    setHasChanges(true)
    setEditingLibreItem(null)
  }
  
  // Mass actions handlers
  const handleApplyMassAPedir = () => {
    if (!orden || !massAPedirValue) return
    const value = parseInt(massAPedirValue) || 0
    const newItems = orden.items.map(item => ({
      ...item,
      quantity: value,
      total: value * item.unitPrice
    }))
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
    setShowAPedirMassMenu(false)
    setMassAPedirValue("")
  }
  
  const handleApplyMassProyectado = () => {
    if (!orden || !massProyectadoValue) return
    const targetValue = parseInt(massProyectadoValue) || 0
    const newItems = orden.items.map(item => {
      const stockActual = Number(getStockBySku(item.sku)) || 0
      const newQuantity = Math.max(0, targetValue - stockActual)
      return {
        ...item,
        quantity: newQuantity,
        total: newQuantity * item.unitPrice
      }
    })
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
    setShowProyectadoMassMenu(false)
    setMassProyectadoValue("")
  }
  
  const handleApplyMassCosto = () => {
    if (!orden || !massCostoValue) return
    const value = parseFloat(massCostoValue) || 0
    const newItems = orden.items.map(item => {
      let newPrice = item.unitPrice
      switch (massCostoType) {
        case "set":
          newPrice = value
          break
        case "add":
          newPrice = item.unitPrice + value
          break
        case "subtract":
          newPrice = Math.max(0, item.unitPrice - value)
          break
        case "addPercent":
          newPrice = item.unitPrice * (1 + value / 100)
          break
        case "subtractPercent":
          newPrice = item.unitPrice * (1 - value / 100)
          break
      }
      newPrice = Math.round(newPrice)
      return {
        ...item,
        unitPrice: newPrice,
        total: item.quantity * newPrice
      }
    })
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
    setShowCostoMassMenu(false)
    setMassCostoValue("")
    setMassCostoType("set")
  }
  
  // Handle "Llevar a Compras" - shows confirmation modal first
  const handleLlevarAComprasClick = () => {
    if (!orden || orden.items.length === 0) return
    setShowLlevarComprasModal(true)
  }
  
  // Confirm "Llevar a Compras" - converts orden to aceptada and creates a compra
  const handleConfirmLlevarACompras = () => {
    if (!orden || orden.items.length === 0 || !currentAccount) return
    
    updateEstado(orden.id, "aceptada")
    
    const storageKey = `stockio_compras_${currentAccount}`
    let compras: OrdenCompra[] = []
    try {
      const storedCompras = localStorage.getItem(storageKey)
      compras = storedCompras ? JSON.parse(storedCompras) : ORDENES_COMPRA
    } catch {
      compras = ORDENES_COMPRA
    }
    
    const existingNumbers = compras.map(c => c.numero)
    const maxNumber = Math.max(0, ...existingNumbers)
    const newNumber = maxNumber + 1
    const newId = `OC-${newNumber}`
    
    const now = new Date()
    const newCompra: OrdenCompra = {
      id: newId,
      numero: newNumber,
      fechaCreacion: now.toISOString().split("T")[0],
      proveedorId: orden.proveedorId,
      proveedorNombre: orden.proveedorNombre,
      medioPago: "transferencia",
      estadoPago: 0,
      estadoEntrega: "prevista",
      fechaEntrega: now.toISOString().split("T")[0],
      items: orden.items.map(item => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        quantityReceived: 0,
        unitPrice: item.unitPrice,
        total: item.total,
        categoria: item.categoria,
        thumbnail: "/placeholder.svg",
      })),
      importeTotal: orden.importeEstimado,
    }
    
    const updatedCompras = [newCompra, ...compras]
    localStorage.setItem(storageKey, JSON.stringify(updatedCompras))
    
    setShowLlevarComprasModal(false)
    router.push("/compras/compras")
  }
  
  // Handle "Ver en Compras" - just navigate
  const handleVerEnCompras = () => {
    router.push("/compras/compras")
  }
  
  // Handle delete orden
  const handleDeleteOrden = () => {
    if (!orden) return
    deleteOrden(orden.id)
    setShowDeleteConfirmModal(false)
    router.push("/compras/ordenes-de-compra")
  }
  
  // Export PDF
  const handleExportPDF = () => {
    if (!orden) return
    setShowExportDropdown(false)
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text(`Orden de Compra ODC-${orden.numero}`, 14, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Proveedor: ${orden.proveedorNombre}`, 14, 35)
    doc.text(`Fecha: ${new Date(orden.fechaCreacion).toLocaleDateString("es-AR")}`, 14, 42)
    doc.text(`Estado: ${orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}`, 14, 49)
    
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
    
    orden.items.forEach((item) => {
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
    doc.text(`Total Estimado: $${orden.importeEstimado.toLocaleString("es-AR")}`, pageWidth - 14, yPos, { align: "right" })
    
    doc.save(`ODC-${orden.numero}.pdf`)
  }
  
  // Export Text
  const handleExportText = () => {
    if (!orden) return
    setShowExportDropdown(false)
    
    let content = `ORDEN DE COMPRA ODC-${orden.numero}\n`
    content += `${"=".repeat(40)}\n\n`
    content += `Proveedor: ${orden.proveedorNombre}\n`
    content += `Fecha: ${new Date(orden.fechaCreacion).toLocaleDateString("es-AR")}\n`
    content += `Estado: ${orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}\n\n`
    content += `ITEMS\n`
    content += `${"-".repeat(40)}\n`
    
    orden.items.forEach((item, idx) => {
      content += `${idx + 1}. ${item.name}\n`
      content += `   SKU: ${item.sku || "N/A"}\n`
      content += `   Cantidad: ${item.quantity}\n`
      content += `   Precio Unit.: $${item.unitPrice.toLocaleString("es-AR")}\n`
      content += `   Subtotal: $${item.total.toLocaleString("es-AR")}\n\n`
    })
    
    content += `${"-".repeat(40)}\n`
    content += `TOTAL ESTIMADO: $${orden.importeEstimado.toLocaleString("es-AR")}\n`
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ODC-${orden.numero}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Órdenes de Compra", href: "/compras/ordenes-de-compra" },
    { label: orden ? `ODC-${orden.numero}` : "Detalle" },
  ]

  // Event handlers
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
  
  const handleStockProyectadoChange = (idx: number, newStockProyectado: number, stockActual: number) => {
    if (!orden) return
    const newQuantity = Math.max(0, newStockProyectado - stockActual)
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
    if (originalPrices[idx] === undefined) {
      setOriginalPrices(prev => ({ ...prev, [idx]: orden.items[idx].unitPrice }))
    }
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
    setOriginalPrices(prev => {
      const newPrices = { ...prev }
      delete newPrices[idx]
      return newPrices
    })
    setItemBonificadas(prev => {
      const newBonif = { ...prev }
      delete newBonif[idx]
      return newBonif
    })
  }
  
  const handleResetPrice = (idx: number) => {
    if (!orden || originalPrices[idx] === undefined) return
    const originalPrice = originalPrices[idx]
    const newItems = orden.items.map((it, i) =>
      i === idx ? { ...it, unitPrice: originalPrice, total: it.quantity * originalPrice } : it
    )
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setOriginalPrices(prev => {
      const newPrices = { ...prev }
      delete newPrices[idx]
      return newPrices
    })
    setHasChanges(true)
  }
  
  const handleStockEditModalAccept = () => {
    setStockEditModal(null)
  }
  
  const handleBonificadasChange = (idx: number, value: number) => {
    setItemBonificadas(prev => ({
      ...prev,
      [idx]: { ...prev[idx], value: Math.max(0, value), visible: true }
    }))
    setHasChanges(true)
  }
  
  const handleToggleBonificadas = (idx: number) => {
    setItemBonificadas(prev => {
      if (prev[idx]?.visible) {
        const newBonif = { ...prev }
        delete newBonif[idx]
        return newBonif
      } else {
        return { ...prev, [idx]: { value: 0, visible: true } }
      }
    })
    setHasChanges(true)
  }

  const handleDeshacer = () => {
    setOrden(foundOrden)
    setHasChanges(false)
  }

  const handleGuardar = () => {
    if (orden) {
      updateOrden(orden.id, orden)
    }
    setHasChanges(false)
  }
  
  // Handle proveedor change
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
    setPendingProveedor(proveedor)
    setShowProveedorConfirmModal(true)
    setShowProveedorDropdown(false)
  }
  
  const handleConfirmProveedorChange = () => {
    if (!orden || !pendingProveedor) return
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
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={proveedorSearch}
                              onChange={(e) => setProveedorSearch(e.target.value)}
                              placeholder="Buscar proveedor..."
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {filteredProveedores.map(prov => (
                            <button
                              key={prov}
                              onClick={() => handleProveedorSelect(prov)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                prov === orden.proveedorNombre ? "bg-blue-50 text-blue-700" : "text-slate-700"
                              }`}
                            >
                              {prov}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-10 w-px bg-border/40" />
                  
                  {/* Fecha */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha</span>
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(orden.fechaCreacion).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  {/* Export dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      disabled={orden.items.length === 0}
                      className={`h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center ${
                        orden.items.length === 0 
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
                      onClick={handleLlevarAComprasClick}
                      disabled={orden.items.length === 0}
                      className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0 px-3 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                      Llevar a Compras
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
                        className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]"
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
                          Eliminar orden de compra
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section - Always Grid View */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
              {/* Tab Header */}
              <div className="bg-slate-100 border border-slate-200/80 rounded-t-md">
                {isEditable ? (
                  <div className="grid grid-cols-[1.9fr_0.8fr_auto_1fr_auto_1.1fr_1.1fr_1.5fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center px-4 gap-2">
                      <span>Item</span>
                    </div>
                    <div className="flex items-center justify-center">Stock Actual</div>
                    <div className="flex items-center justify-center w-6"></div>
                    
                    {/* A Pedir with mass action */}
                    <div className="flex items-center justify-center gap-1 relative" data-mass-menu>
                      <span>A Pedir</span>
                      <button
                        onClick={() => { setShowAPedirMassMenu(!showAPedirMassMenu); setShowProyectadoMassMenu(false); setShowCostoMassMenu(false) }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {showAPedirMassMenu && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[180px]">
                          <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">Aplicar a todos los items</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Cantidad"
                              value={massAPedirValue}
                              onChange={(e) => setMassAPedirValue(e.target.value)}
                              className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                              min={0}
                            />
                            <button
                              onClick={handleApplyMassAPedir}
                              disabled={!massAPedirValue}
                              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center w-6"></div>
                    
                    {/* Stock Proyectado with mass action */}
                    <div className="flex items-center justify-center gap-1 relative" data-mass-menu>
                      <span className="whitespace-nowrap">Stock Proyectado</span>
                      <button
                        onClick={() => { setShowProyectadoMassMenu(!showProyectadoMassMenu); setShowAPedirMassMenu(false); setShowCostoMassMenu(false) }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {showProyectadoMassMenu && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[180px]">
                          <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">Fijar stock proyectado a</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Stock"
                              value={massProyectadoValue}
                              onChange={(e) => setMassProyectadoValue(e.target.value)}
                              className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                              min={0}
                            />
                            <button
                              onClick={handleApplyMassProyectado}
                              disabled={!massProyectadoValue}
                              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Costo Unit. with mass action */}
                    <div className="flex items-center justify-center gap-1 relative" data-mass-menu>
                      <span>Costo Unit.</span>
                      <button
                        onClick={() => { setShowCostoMassMenu(!showCostoMassMenu); setShowAPedirMassMenu(false); setShowProyectadoMassMenu(false) }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {showCostoMassMenu && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-[220px]">
                          <p className="text-[10px] text-slate-500 mb-2 normal-case tracking-normal font-normal">Modificar costo de todos</p>
                          <div className="flex flex-col gap-2">
                            <select
                              value={massCostoType}
                              onChange={(e) => setMassCostoType(e.target.value as any)}
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
                                placeholder={massCostoType.includes("Percent") ? "%" : "$"}
                                value={massCostoValue}
                                onChange={(e) => setMassCostoValue(e.target.value)}
                                className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                                min={0}
                              />
                              <button
                                onClick={handleApplyMassCosto}
                                disabled={!massCostoValue}
                                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end pr-4">Subtotal</div>
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
                {orden.items.length === 0 ? (
                  /* Empty State */
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin items</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                      Esta orden de compra aun no tiene items. Agrega items del proveedor para continuar.
                    </p>
                    {isEditable && (
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Agregar Item
                      </button>
                    )}
                  </div>
                ) : (
                  /* Items Grid */
                  <>
                  {orden.items.map((item, idx) => {
                    const stockActual = Number(getStockBySku(item.sku)) || 0
                    const itemDiscount = itemDiscounts[idx]
                    const bonificadas = itemBonificadas[idx]
                    const itemSubtotal = item.total
                    const discountAmount = itemDiscount?.value 
                      ? (itemDiscount.type === "percent" ? itemSubtotal * itemDiscount.value / 100 : itemDiscount.value)
                      : 0
                    const bonificadasAmount = (bonificadas?.value || 0) * item.unitPrice
                    const finalSubtotal = Math.max(0, itemSubtotal - discountAmount - bonificadasAmount)
                    const isPriceEdited = originalPrices[idx] !== undefined && originalPrices[idx] !== item.unitPrice
                    
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
                      className={`grid items-center py-3 px-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors group ${
                        isEditable 
                          ? "grid-cols-[1.9fr_0.8fr_auto_1fr_auto_1.1fr_1.1fr_1.5fr]" 
                          : "grid-cols-[3fr_1.5fr_1.5fr_2fr]"
                      }`}
                    >
                      {/* Item - Thumbnail, Name, SKU + Delete button */}
                      <div className="flex items-center gap-3">
                        {isEditable && (
                          <button
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                            title="Eliminar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
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
                          {/* Item Name - editable for descripcion libre items */}
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
                                  <span
                                    key={i}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.isDescripcionLibre && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                                Libre
                              </span>
                            )}
                          </div>
                          
                          {/* SKU - editable for descripcion libre items */}
                          {item.isDescripcionLibre && isEditable ? (
                            editingLibreItem?.idx === idx && editingLibreItem?.field === "sku" ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-xs text-slate-400">sku:</span>
                                <input
                                  type="text"
                                  value={editingLibreItem.value}
                                  onChange={(e) => setEditingLibreItem({ idx, field: "sku", value: e.target.value })}
                                  onBlur={() => handleUpdateLibreItem(idx, "sku", editingLibreItem.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateLibreItem(idx, "sku", editingLibreItem.value)
                                    if (e.key === "Escape") setEditingLibreItem(null)
                                  }}
                                  autoFocus
                                  className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400"
                                  placeholder="Agregar SKU"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingLibreItem({ idx, field: "sku", value: item.sku || "" })}
                                className="text-xs text-slate-400 mt-0.5 hover:text-blue-600 hover:underline cursor-pointer transition-colors text-left"
                              >
                                sku: {item.sku || <span className="italic">agregar</span>}
                              </button>
                            )
                          ) : (
                            <p className="text-xs text-slate-400 mt-0.5">sku: {item.sku || "Sin SKU"}</p>
                          )}
                          
                          {/* Marca · Categoria */}
                          {item.isDescripcionLibre && isEditable ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              {/* Editable Marca */}
                              {editingLibreItem?.idx === idx && editingLibreItem?.field === "marca" ? (
                                <input
                                  type="text"
                                  value={editingLibreItem.value}
                                  onChange={(e) => setEditingLibreItem({ idx, field: "marca", value: e.target.value })}
                                  onBlur={() => handleUpdateLibreItem(idx, "marca", editingLibreItem.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateLibreItem(idx, "marca", editingLibreItem.value)
                                    if (e.key === "Escape") setEditingLibreItem(null)
                                  }}
                                  autoFocus
                                  className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400 w-20"
                                  placeholder="Marca"
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingLibreItem({ idx, field: "marca", value: item.marca || "" })}
                                  className="text-xs text-slate-400 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                >
                                  {item.marca || <span className="italic">marca</span>}
                                </button>
                              )}
                              <span className="text-xs text-slate-300">·</span>
                              {/* Editable Categoria */}
                              {editingLibreItem?.idx === idx && editingLibreItem?.field === "categoria" ? (
                                <input
                                  type="text"
                                  value={editingLibreItem.value}
                                  onChange={(e) => setEditingLibreItem({ idx, field: "categoria", value: e.target.value })}
                                  onBlur={() => handleUpdateLibreItem(idx, "categoria", editingLibreItem.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateLibreItem(idx, "categoria", editingLibreItem.value)
                                    if (e.key === "Escape") setEditingLibreItem(null)
                                  }}
                                  autoFocus
                                  className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400 w-20"
                                  placeholder="Categoria"
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingLibreItem({ idx, field: "categoria", value: item.categoria || "" })}
                                  className="text-xs text-slate-400 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                >
                                  {item.categoria || <span className="italic">categoria</span>}
                                </button>
                              )}
                            </div>
                          ) : (item.marca || item.categoria) ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              {item.marca && <span className="text-xs text-slate-400">{item.marca}</span>}
                              {item.marca && item.categoria && <span className="text-xs text-slate-300">·</span>}
                              {item.categoria && <span className="text-xs text-slate-400">{item.categoria}</span>}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Stock Actual - clickable to open modal */}
                      {isEditable && (
                        <>
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setStockEditModal({
                                isOpen: true,
                                itemIndex: idx,
                                sku: item.sku,
                                itemName: item.name,
                                total: stockInfo.total,
                                reservado: stockInfo.reservado
                              })}
                              className="text-sm text-slate-600 tabular-nums hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                            >
                              {stockActual}
                            </button>
                          </div>
                          
                          {/* Arrow */}
                          <div className="flex items-center justify-center w-6">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                        </>
                      )}

                      {/* A Pedir (Cantidad) with chevrons inside (edit mode) / Costo Unitario (view mode) */}
                      <div className="flex items-center justify-center">
                        {isEditable ? (
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity === 0 ? "" : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === "" || val === "-") {
                                  handleQuantityChange(idx, 0)
                                } else {
                                  const num = parseInt(val)
                                  if (!isNaN(num) && num >= 0) {
                                    handleQuantityChange(idx, num)
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const val = e.target.value
                                if (val === "" || parseInt(val) < 0 || isNaN(parseInt(val))) {
                                  handleQuantityChange(idx, 0)
                                }
                              }}
                              className="w-20 text-center text-sm font-medium bg-blue-50 border border-blue-200 focus:border-blue-400 rounded pl-2 pr-6 py-1 focus:outline-none transition-all"
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                              <button
                                onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleQuantityChange(idx, Math.max(0, item.quantity - 1))}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                        )}
                      </div>
                      
                      {/* Arrow and Stock Proyectado - editable on click */}
                      {isEditable && (
                        <>
                          <div className="flex items-center justify-center w-6">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                          
                          {/* Stock Proyectado - click to edit, chevrons on right */}
                          <div className="flex items-center justify-center">
                            <div className="flex items-center">
                              {editingStockProyectado?.idx === idx ? (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editingStockProyectado.value}
                                  onChange={(e) => setEditingStockProyectado({ idx, value: e.target.value })}
                                  onBlur={() => {
                                    const newValue = parseInt(editingStockProyectado.value) || stockActual
                                    const validValue = Math.max(stockActual, newValue)
                                    handleStockProyectadoChange(idx, validValue, stockActual)
                                    setEditingStockProyectado(null)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const newValue = parseInt(editingStockProyectado.value) || stockActual
                                      const validValue = Math.max(stockActual, newValue)
                                      handleStockProyectadoChange(idx, validValue, stockActual)
                                      setEditingStockProyectado(null)
                                    } else if (e.key === "Escape") {
                                      setEditingStockProyectado(null)
                                    }
                                  }}
                                  autoFocus
                                  className="w-14 text-center text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-300 rounded px-1 py-0.5 focus:outline-none focus:border-emerald-400"
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingStockProyectado({ idx, value: String(stockActual + item.quantity) })}
                                  className="w-10 text-center text-sm font-medium text-emerald-600 tabular-nums hover:bg-emerald-50 rounded px-1 py-0.5 transition-colors"
                                >
                                  {stockActual + item.quantity}
                                </button>
                              )}
                              <div className="flex flex-col ml-0.5">
                                <button
                                  onClick={() => handleStockProyectadoChange(idx, stockActual + item.quantity + 1, stockActual)}
                                  className="text-emerald-500 hover:text-emerald-700 transition-colors"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleStockProyectadoChange(idx, Math.max(stockActual, stockActual + item.quantity - 1), stockActual)}
                                  className="text-emerald-500 hover:text-emerald-700 transition-colors"
                                  disabled={item.quantity <= 0}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Costo Unit. with restablecer (edit mode) / Cantidad (view mode) */}
                      <div className="flex items-center justify-center">
                        {isEditable ? (
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
                            {isPriceEdited && (
                              <button
                                onClick={() => handleResetPrice(idx)}
                                className="text-[9px] text-blue-500 hover:text-blue-700 hover:underline mt-0.5"
                              >
                                restablecer
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            ${item.unitPrice.toLocaleString("es-AR")}
                          </span>
                        )}
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
                          {isEditable && (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}

                {/* Add Item Button - only show when editable and has items */}
                {isEditable && orden.items.length > 0 && (
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
            </div>
          </main>
        </div>
      </div>

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

      {/* Add Item Modal - Full Selection View */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowAddItemModal(false)
              setModalSearch("")
              setSelectedModalItems({})
              setModalFilters({ categoria: "", marca: "", stockRange: "" })
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Agregar Items</h3>
                <p className="text-xs text-slate-500 mt-0.5">Selecciona items de {orden.proveedorNombre}</p>
              </div>
              <button
                onClick={() => {
                  setShowAddItemModal(false)
                  setModalSearch("")
                  setSelectedModalItems({})
                  setModalFilters({ categoria: "", marca: "", stockRange: "" })
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search and Filters Bar */}
            <div className="border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3 p-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Buscar items, o escribir una descripcion libre..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                    autoFocus
                  />
                </div>
                
                {/* Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowModalFilters(!showModalFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                      Object.values(modalFilters).some(v => v)
                        ? "border-blue-300 bg-blue-50 text-blue-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </button>
                  
                  {/* Filters Dropdown */}
                  {showModalFilters && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-64 p-3">
                      <div className="space-y-3">
                        {/* Categoria Filter */}
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoria</label>
                          <select
                            value={modalFilters.categoria}
                            onChange={(e) => setModalFilters(prev => ({ ...prev, categoria: e.target.value }))}
                            className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
                          >
                            <option value="">Todas</option>
                            {uniqueCategorias.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Marca Filter */}
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Marca</label>
                          <select
                            value={modalFilters.marca}
                            onChange={(e) => setModalFilters(prev => ({ ...prev, marca: e.target.value }))}
                            className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
                          >
                            <option value="">Todas</option>
                            {uniqueMarcas.map(marca => (
                              <option key={marca} value={marca}>{marca}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Stock Filter */}
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</label>
                          <select
                            value={modalFilters.stockRange}
                            onChange={(e) => setModalFilters(prev => ({ ...prev, stockRange: e.target.value }))}
                            className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
                          >
                            <option value="">Todos</option>
                            <option value="sin-stock">Sin stock</option>
                            <option value="bajo">Bajo (1-10)</option>
                            <option value="medio">Medio (11-50)</option>
                            <option value="alto">Alto (50+)</option>
                          </select>
                        </div>
                        
                        {/* Clear Filters */}
                        {Object.values(modalFilters).some(v => v) && (
                          <button
                            onClick={() => setModalFilters({ categoria: "", marca: "", stockRange: "" })}
                            className="w-full text-xs text-blue-600 hover:text-blue-700 py-1"
                          >
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sort Button */}
                <div className="flex items-center gap-1">
                  <select
                    value={modalSort}
                    onChange={(e) => setModalSort(e.target.value as "name" | "stock" | "precio")}
                    className="appearance-none pl-3 pr-7 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                  >
                    <option value="name">Nombre</option>
                    <option value="stock">Stock</option>
                    <option value="precio">Precio</option>
                  </select>
                  <button
                    onClick={() => setModalSortDirection(d => d === "asc" ? "desc" : "asc")}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    title={modalSortDirection === "asc" ? "Orden ascendente" : "Orden descendente"}
                  >
                    <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${modalSortDirection === "desc" ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Tab Header with Select All */}
            <div className="bg-slate-100 flex-shrink-0">
              <div className="grid grid-cols-[3fr_1fr_1fr_1.2fr_1.2fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="flex items-center px-4 gap-3">
                  {/* Select All Checkbox */}
                  <button
                    onClick={handleSelectAllModalItems}
                    className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center hover:border-blue-500 transition-colors bg-white"
                  >
                    {selectAllActive && <Check className="w-3 h-3 text-blue-600" />}
                    {selectAllIndeterminate && <Minus className="w-3 h-3 text-blue-600" />}
                  </button>
                  <span>Item</span>
                </div>
                <div className="flex items-center justify-center">Stock</div>
                <div className="flex items-center justify-center whitespace-nowrap">Stock Min.</div>
                <div className="flex items-center justify-center">Costo Unit.</div>
                <div className="flex items-center justify-center">Precio Venta</div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {hasNoSearchResults ? (
                /* No results - show "descripcion libre" option */
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500 mb-4">No se encontraron items que coincidan con &quot;{modalSearch}&quot;</p>
                  <button
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    onClick={handleAddFreeItem}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar &quot;{modalSearch}&quot; como item
                  </button>
                </div>
              ) : filteredModalItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">
                    {Object.values(modalFilters).some(v => v)
                      ? "No hay items que coincidan con los filtros"
                      : "No hay items asociados a este proveedor"
                    }
                  </p>
                </div>
              ) : (
                filteredModalItems.map((item, idx) => {
                  const isParent = item.hasVariants && item.variants && item.variants.length > 0
                  const selectionState = getModalSelectionState(item)
                  
                  // Check if item is already in order
                  const isAlreadyInOrder = (sku: string) => orden.items.some(oi => oi.sku === sku)
                  const itemSku = item.sku || ""
                  const itemAlreadyInOrder = !isParent && isAlreadyInOrder(itemSku)
                  
                  return (
                    <div key={idx}>
                      {/* Parent/Standalone Row */}
                      <div
                        className={`grid grid-cols-[3fr_1fr_1fr_1.2fr_1.2fr] items-center py-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                          itemAlreadyInOrder ? "opacity-50" : "cursor-pointer"
                        } ${
                          selectionState.checked || selectionState.indeterminate ? "bg-blue-50/30" : ""
                        }`}
                        onClick={() => !itemAlreadyInOrder && handleModalItemSelection(item)}
                      >
                        {/* Checkbox + Item */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); if (!itemAlreadyInOrder) handleModalItemSelection(item) }}
                            disabled={itemAlreadyInOrder}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors bg-white flex-shrink-0 ${
                              itemAlreadyInOrder 
                                ? "border-slate-200 cursor-not-allowed" 
                                : "border-slate-300 hover:border-blue-500"
                            }`}
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
                              {itemAlreadyInOrder && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">
                                  Ya agregado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {[item.marca, item.categoria].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="flex items-center justify-center">
                          {!isParent && (
                            <span className="text-sm text-slate-600 tabular-nums">
                              {parseInt(item.stock?.disponible || "0")}
                            </span>
                          )}
                        </div>

                        {/* Stock Minimo */}
                        <div className="flex items-center justify-center">
                          {!isParent && (
                            <span className="text-sm text-slate-400 tabular-nums">
                              {item.stockMinimo || stock.stockMinimoPorDefecto}
                            </span>
                          )}
                        </div>

                        {/* Costo Unitario */}
                        <div className="flex items-center justify-center">
                          {!isParent && (
                            <span className="text-sm font-medium text-gray-700">
                              ${(item.precio?.costo || 0).toLocaleString("es-AR")}
                            </span>
                          )}
                        </div>

                        {/* Precio Venta */}
                        <div className="flex items-center justify-center">
                          {!isParent && (
                            <span className="text-sm text-slate-600">
                              ${(item.precio?.precioFinal || 0).toLocaleString("es-AR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Children Rows */}
                      {isParent && item.variants!.map((variant, vIdx) => {
                        const childSelectionState = getModalSelectionState(variant, true)
                        const variantSku = `${item.skuPrefix}-${variant.skuSuffix}`
                        const variantAlreadyInOrder = isAlreadyInOrder(variantSku)
                        
                        return (
                          <div
                            key={vIdx}
                            className={`grid grid-cols-[3fr_1fr_1fr_1.2fr_1.2fr] items-center py-2.5 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors pl-12 ${
                              variantAlreadyInOrder ? "opacity-50" : "cursor-pointer"
                            } ${
                              childSelectionState.checked ? "bg-blue-50/30" : ""
                            }`}
                            onClick={() => !variantAlreadyInOrder && handleModalItemSelection(variant, true)}
                          >
                            {/* Checkbox + Item */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); if (!variantAlreadyInOrder) handleModalItemSelection(variant, true) }}
                                disabled={variantAlreadyInOrder}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors bg-white flex-shrink-0 ${
                                  variantAlreadyInOrder 
                                    ? "border-slate-200 cursor-not-allowed" 
                                    : "border-slate-300 hover:border-blue-500"
                                }`}
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
                                  {variantAlreadyInOrder && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">
                                      Ya agregado
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400">
                                  {variantSku}
                                </p>
                              </div>
                            </div>

                            {/* Stock */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-600 tabular-nums">
                                {parseInt(variant.stock?.disponible || "0")}
                              </span>
                            </div>

                            {/* Stock Minimo */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-400 tabular-nums">
                                {variant.stockMinimo || stock.stockMinimoPorDefecto}
                              </span>
                            </div>

                            {/* Costo Unitario */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                ${(variant.precio?.costo || 0).toLocaleString("es-AR")}
                              </span>
                            </div>

                            {/* Precio Venta */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-slate-600">
                                ${(variant.precio?.precioFinal || 0).toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom Row - Add Selected Button */}
            <div className="border-t border-slate-200 bg-slate-50 py-4 px-5 flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-slate-500">
                {selectedModalCount > 0 
                  ? `${selectedModalCount} item${selectedModalCount > 1 ? "s" : ""} seleccionado${selectedModalCount > 1 ? "s" : ""}`
                  : "Selecciona items para agregar"
                }
              </span>
              <button
                onClick={handleAddSelectedItems}
                disabled={selectedModalCount === 0}
                className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar seleccionados
              </button>
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
                Cambiar de proveedor?
              </h3>
              <p className="text-sm text-slate-600 mb-1">
                Estas por cambiar el proveedor de <span className="font-medium">{orden?.proveedorNombre}</span> a <span className="font-medium">{pendingProveedor}</span>.
              </p>
              <p className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-md mt-3">
                La orden de compra se reiniciara y perderas todos los items agregados.
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
                Si, cambiar proveedor
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirmModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Eliminar orden de compra
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Estas seguro de que deseas eliminar la orden de compra ODC-{orden?.numero}? Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteOrden}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Llevar a Compras Confirmation Modal */}
      {showLlevarComprasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLlevarComprasModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirmar orden de compra
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Al continuar, la orden pasara a estado <span className="font-medium text-blue-600">Aceptada</span> y se creara una compra asociada. Podras seguir editando el contenido desde la seccion de Compras.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLlevarComprasModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLlevarACompras}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Aceptar
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
