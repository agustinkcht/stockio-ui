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
  ChevronUp,
  Filter,
  ArrowUpDown,
  MoreVertical,
} from "lucide-react"
import jsPDF from "jspdf"
import { StockEditModal } from "@/components/modals/stock-edit-modal"
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
  const { ordenes, updateOrden, updateEstado, deleteOrden } = useOrdenesDeCompra()
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
  
  // State to force show selection view even when items exist
  const [forceSelectionView, setForceSelectionView] = useState(false)
  
  // Check if we're in selection view (empty order or forced)
  const isInSelectionView = (orden?.items.length === 0 || forceSelectionView)
  
  // Item selection view search and filters
  const [selectionSearch, setSelectionSearch] = useState("")
  const [selectionFilters, setSelectionFilters] = useState<{
    categoria: string
    marca: string
    stockRange: string
    precioRange: string
  }>({ categoria: "", marca: "", stockRange: "", precioRange: "" })
  const [selectionSort, setSelectionSort] = useState<"name" | "stock" | "precio">("name")
  const [selectionSortDirection, setSelectionSortDirection] = useState<"asc" | "desc">("asc")
  const [showSelectionFilters, setShowSelectionFilters] = useState(false)
  
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
  }, [orden])
  
  // Get proveedor items with parent-child structure for the empty order picker
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
  
  // Filtered and sorted proveedor items for selection view
  const filteredProveedorItems = useMemo(() => {
    let items = [...proveedorItemsStructured]
    
    // Helper: get all searchable fields from an item (similar to catalogo search)
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
    
    // Apply search filter (matching catalogo behavior - all words must match)
    // Also filters children to show only matching variants
    if (selectionSearch.trim()) {
      const searchWords = selectionSearch.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0)
      
      items = items.map(item => {
        // Get parent searchable fields
        const parentFields = getSearchableFields(item)
        const parentText = parentFields.join(" ").toLowerCase()
        const parentMatches = searchWords.every(word => parentText.includes(word))
        
        // If parent matches all terms, return item with all variants
        if (parentMatches) return item
        
        // Otherwise, filter variants to only matching ones
        if (item.variants && item.variants.length > 0) {
          const matchingVariants = item.variants.filter((v: any) => {
            const variantFields = getSearchableFields(v, item.skuPrefix)
            // Include parent name/marca for variant search context
            const combinedFields = [...parentFields, ...variantFields]
            const combinedText = combinedFields.join(" ").toLowerCase()
            return searchWords.every(word => combinedText.includes(word))
          })
          
          if (matchingVariants.length > 0) {
            // Return item with filtered variants
            return { ...item, variants: matchingVariants }
          }
        }
        
        return null // No match
      }).filter(Boolean) as typeof items
    }
    
    // Apply categoria filter
    if (selectionFilters.categoria) {
      items = items.filter(item => 
        item.categoria === selectionFilters.categoria ||
        item.variants?.some((v: any) => v.categoria === selectionFilters.categoria)
      )
    }
    
    // Apply marca filter
    if (selectionFilters.marca) {
      items = items.filter(item => item.marca === selectionFilters.marca)
    }
    
    // Apply stock range filter
    if (selectionFilters.stockRange) {
      items = items.filter(item => {
        const getStock = (i: any) => parseInt(i.stock?.disponible || "0")
        const checkStockRange = (stock: number) => {
          if (selectionFilters.stockRange === "sin-stock") return stock === 0
          if (selectionFilters.stockRange === "bajo") return stock > 0 && stock <= 10
          if (selectionFilters.stockRange === "medio") return stock > 10 && stock <= 50
          if (selectionFilters.stockRange === "alto") return stock > 50
          return true
        }
        
        if (item.hasVariants && item.variants) {
          return item.variants.some((v: any) => checkStockRange(getStock(v)))
        } else {
          return checkStockRange(getStock(item))
        }
      })
    }
    
    // Apply sorting with direction
    const direction = selectionSortDirection === "asc" ? 1 : -1
    items.sort((a, b) => {
      let result = 0
      if (selectionSort === "name") {
        result = a.name.localeCompare(b.name)
      } else if (selectionSort === "stock") {
        const getMinStock = (item: any) => {
          if (item.hasVariants && item.variants) {
            return Math.min(...item.variants.map((v: any) => parseInt(v.stock?.disponible || "0")))
          }
          return parseInt(item.stock?.disponible || "0")
        }
        result = getMinStock(a) - getMinStock(b)
      } else if (selectionSort === "precio") {
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
  }, [proveedorItemsStructured, selectionSearch, selectionFilters, selectionSort, selectionSortDirection])
  
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
    
    // Create a map of existing items by SKU to preserve their quantities
    const existingItemsBySku: { [sku: string]: OrdenDeCompraItem } = {}
    for (const item of orden.items) {
      existingItemsBySku[item.sku] = item
    }
    
    const newItems: OrdenDeCompraItem[] = []
    
    for (const item of proveedorItemsStructured) {
      const isParent = item.hasVariants && item.variants && item.variants.length > 0
      if (isParent) {
        for (const variant of item.variants!) {
          const id = getItemId(variant)
          const sku = `${item.skuPrefix}-${variant.skuSuffix}`
          if (selectedProveedorItems[id] || selectedProveedorItems[sku]) {
            // If item already exists, preserve its quantity and price
            if (existingItemsBySku[sku]) {
              newItems.push(existingItemsBySku[sku])
            } else {
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
        }
      } else {
        const id = getItemId(item)
        const sku = item.sku || ""
        if (selectedProveedorItems[id] || selectedProveedorItems[sku]) {
          // If item already exists, preserve its quantity and price
          if (existingItemsBySku[sku]) {
            newItems.push(existingItemsBySku[sku])
          } else {
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
    }
    
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    const updatedOrden = { ...orden, items: newItems, importeEstimado: newTotal }
    setOrden(updatedOrden)
    updateOrden(orden.id, { items: newItems, importeEstimado: newTotal })
    setSelectedProveedorItems({})
    setHasChanges(true)
    setForceSelectionView(false)
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
  
  // Handle "Llevar a Compras" - shows confirmation modal first
  const handleLlevarAComprasClick = () => {
    if (!orden || orden.items.length === 0) return
    setShowLlevarComprasModal(true)
  }
  
  // Confirm "Llevar a Compras" - converts orden to aceptada and creates a compra
  const handleConfirmLlevarACompras = () => {
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
    
    setShowLlevarComprasModal(false)
    // Navigate to compras
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
    
    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text(`Orden de Compra ODC-${orden.numero}`, 14, 20)
    
    // Info section
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Proveedor: ${orden.proveedorNombre}`, 14, 35)
    doc.text(`Fecha: ${new Date(orden.fechaCreacion).toLocaleDateString("es-AR")}`, 14, 42)
    doc.text(`Estado: ${orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}`, 14, 49)
    
    // Table header
    let yPos = 65
    doc.setFillColor(240, 240, 240)
    doc.rect(14, yPos - 5, pageWidth - 28, 10, "F")
    doc.setFont("helvetica", "bold")
    doc.text("Item", 16, yPos)
    doc.text("Cant.", 100, yPos)
    doc.text("Precio Unit.", 120, yPos)
    doc.text("Subtotal", 160, yPos)
    
    // Table rows
    doc.setFont("helvetica", "normal")
    yPos += 10
    
    orden.items.forEach((item) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      
      // Truncate long names
      const name = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name
      doc.text(name, 16, yPos)
      doc.text(String(item.quantity), 100, yPos)
      doc.text(`$${item.unitPrice.toLocaleString("es-AR")}`, 120, yPos)
      doc.text(`$${item.total.toLocaleString("es-AR")}`, 160, yPos)
      yPos += 8
    })
    
    // Total
    yPos += 10
    doc.setDrawColor(200, 200, 200)
    doc.line(14, yPos - 5, pageWidth - 14, yPos - 5)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(`Total Estimado: $${orden.importeEstimado.toLocaleString("es-AR")}`, pageWidth - 14, yPos, { align: "right" })
    
    // Download
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
    
    // Create and download file
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
  
  const handleStockProyectadoChange = (idx: number, newStockProyectado: number, stockActual: number) => {
    if (!orden) return
    // Calculate new quantity based on desired stock proyectado
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
    // Track original price if not already tracked
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
    // Clean up state for deleted item
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
  
  const handleStockEditModalAccept = (newTotal: number, newReservado: number) => {
    // In a real app, this would update the stock in the database
    // For now, we'll just close the modal
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
        // Hide and reset
        const newBonif = { ...prev }
        delete newBonif[idx]
        return newBonif
      } else {
        // Show
        return { ...prev, [idx]: { value: 0, visible: true } }
      }
    })
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
                  {/* Exportar Dropdown - only active when not in selection view */}
                  <div className="relative">
                    <button
                      onClick={() => !isInSelectionView && setShowExportDropdown(!showExportDropdown)}
                      disabled={isInSelectionView}
                      className={`h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center ${
                        isInSelectionView 
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

            {/* Items Section with Tab Header */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
              {(orden.items.length === 0 || forceSelectionView) ? (
                /* Empty State or Selection View - Proveedor Items Picker */
                <>
                  {/* Search and Filters Bar */}
                  <div className="bg-white border border-slate-200/80 rounded-t-md border-b-0">
                    <div className="flex items-center gap-3 p-3">
                      {/* Search Input */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={selectionSearch}
                          onChange={(e) => setSelectionSearch(e.target.value)}
                          placeholder="Buscar items..."
                          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                        />
                      </div>
                      
                      {/* Filter Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSelectionFilters(!showSelectionFilters)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                            Object.values(selectionFilters).some(v => v)
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Filter className="w-4 h-4" />
                          Filtrar
                        </button>
                        
                        {/* Filters Dropdown */}
                        {showSelectionFilters && (
                          <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-64 p-3">
                            <div className="space-y-3">
                              {/* Categoria Filter */}
                              <div>
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
                                <select
                                  value={selectionFilters.categoria}
                                  onChange={(e) => setSelectionFilters(prev => ({ ...prev, categoria: e.target.value }))}
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
                                  value={selectionFilters.marca}
                                  onChange={(e) => setSelectionFilters(prev => ({ ...prev, marca: e.target.value }))}
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
                                  value={selectionFilters.stockRange}
                                  onChange={(e) => setSelectionFilters(prev => ({ ...prev, stockRange: e.target.value }))}
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
                              {Object.values(selectionFilters).some(v => v) && (
                                <button
                                  onClick={() => setSelectionFilters({ categoria: "", marca: "", stockRange: "", precioRange: "" })}
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
  value={selectionSort}
  onChange={(e) => setSelectionSort(e.target.value as "name" | "stock" | "precio")}
  className="appearance-none pl-3 pr-7 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
  >
  <option value="name">Nombre</option>
  <option value="stock">Stock</option>
  <option value="precio">Precio</option>
  </select>
  <button
    onClick={() => setSelectionSortDirection(d => d === "asc" ? "desc" : "asc")}
    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
    title={selectionSortDirection === "asc" ? "Orden ascendente" : "Orden descendente"}
  >
    <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${selectionSortDirection === "desc" ? "rotate-180" : ""}`} />
  </button>
  </div>
                    </div>
                  </div>
                  
                  {/* Tab Header with Select All */}
                  <div className="bg-slate-100 border-x border-slate-200/80">
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
                    {filteredProveedorItems.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-slate-500">
                          {selectionSearch || Object.values(selectionFilters).some(v => v)
                            ? "No hay items que coincidan con los filtros"
                            : "No hay items asociados a este proveedor"
                          }
                        </p>
                      </div>
                    ) : (
                      filteredProveedorItems.map((item, idx) => {
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
                          : "Selecciona los items para la orden"
                        }
                      </span>
                      <button
                        onClick={handleGenerarCompra}
                        disabled={selectedProveedorCount === 0}
                        className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Seguir
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Normal State - Order Items Grid */
                <>
                  {/* Tab Header */}
                  <div className="bg-slate-100 border border-slate-200/80 rounded-t-md">
                    {isEditable ? (
                      <div className="grid grid-cols-[1.9fr_0.8fr_auto_1fr_auto_1.1fr_1.1fr_1.5fr] h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center px-4 gap-2">
                          <span>Item</span>
                          <button
                            onClick={() => {
                              // Pre-select existing items in selection view
                              // Need to map SKUs to the correct item IDs used by getItemId
                              const existingSelections: { [id: string]: boolean } = {}
                              for (const orderItem of orden.items) {
                                // Find the matching item in proveedorItemsStructured to get the correct ID
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
                        <div className="flex items-center justify-center">Stock Actual</div>
                        <div className="flex items-center justify-center w-6"></div>
                        <div className="flex items-center justify-center">A Pedir</div>
                        <div className="flex items-center justify-center w-6"></div>
                        <div className="flex items-center justify-center whitespace-nowrap">Stock Proyectado</div>
                        <div className="flex items-center justify-center">Costo Unit.</div>
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
                    {orden.items.map((item, idx) => {
                      const stockActual = Number(getStockBySku(item.sku)) || 0
                      const stockProyectado = editingStockProyectado?.idx === idx 
                        ? (parseInt(editingStockProyectado.value) || stockActual)
                        : stockActual + Number(item.quantity)
                      const itemDiscount = itemDiscounts[idx]
                      const bonificadas = itemBonificadas[idx]
                      const itemSubtotal = item.total
                      const discountAmount = itemDiscount?.value 
                        ? (itemDiscount.type === "percent" ? itemSubtotal * itemDiscount.value / 100 : itemDiscount.value)
                        : 0
                      const bonificadasAmount = (bonificadas?.value || 0) * item.unitPrice
                      const finalSubtotal = Math.max(0, itemSubtotal - discountAmount - bonificadasAmount)
                      const isPriceEdited = originalPrices[idx] !== undefined && originalPrices[idx] !== item.unitPrice
                      
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
              )}
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
                  placeholder="Buscar item, o escribir una descripcion libre"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Tab Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr] px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Item</span>
              <span className="text-center">Stock</span>
              <span className="text-right">Costo Unitario</span>
            </div>
            
            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {newItemSearch.trim() ? (
                <>
                  {searchResults.length > 0 ? (
                    <div>
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          className="w-full grid grid-cols-[2fr_1fr_1fr] items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
                          onClick={() => handleSelectItem(item)}
                        >
                          {/* Item Info */}
                          <div className="flex items-center gap-3">
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
                          </div>
                          
                          {/* Stock Info */}
                          <div className="text-center">
                            <span className="text-sm text-slate-600">
                              {item.stockDisponible || 0} <span className="text-slate-400">disponibles</span>
                            </span>
                            {(item.stockReservado || 0) > 0 && (
                              <p className="text-xs text-slate-400">
                                ({item.stockReservado} reservados)
                              </p>
                            )}
                          </div>
                          
                          {/* Costo */}
                          <span className="text-sm font-medium text-gray-700 text-right">${item.precio?.toLocaleString("es-AR")}</span>
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
                <div>
                  <p className="px-4 py-2 text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">Productos del proveedor</p>
                  {notSelectedItems.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      className="w-full grid grid-cols-[2fr_1fr_1fr] items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
                      onClick={() => handleSelectItem(item)}
                    >
                      {/* Item Info */}
                      <div className="flex items-center gap-3">
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
                      </div>
                      
                      {/* Stock Info */}
                      <div className="text-center">
                        <span className="text-sm text-slate-600">
                          {item.stockDisponible || 0} <span className="text-slate-400">disponibles</span>
                        </span>
                        {(item.stockReservado || 0) > 0 && (
                          <p className="text-xs text-slate-400">
                            ({item.stockReservado} reservados)
                          </p>
                        )}
                      </div>
                      
                      {/* Costo */}
                      <span className="text-sm font-medium text-gray-700 text-right">${item.precio?.toLocaleString("es-AR")}</span>
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
              ¿Estás seguro de que deseas eliminar la orden de compra ODC-{orden?.numero}? Esta acción no se puede deshacer.
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
              Al continuar, la orden pasará a estado <span className="font-medium text-blue-600">Aceptada</span> y se creará una compra asociada. Podrás seguir editando el contenido desde la sección de Compras.
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
