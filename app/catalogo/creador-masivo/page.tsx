"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { ChevronRight, ChevronLeft, Plus, X, Check, AlertCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useItems } from "@/hooks/use-items"
import { useProveedores } from "@/hooks/use-proveedores"
import { NuevoProveedorModal } from "@/components/modals/nuevo-proveedor-modal"
import { CreadorMasivoConVariantes, SECTIONS_CON_VARIANTES, createEmptyParentRow, type ParentRow } from "@/components/creador-masivo/creador-masivo-con-variantes"

// Define column widths (in pixels) for consistent alignment
const COL_WIDTHS: Record<string, number> = {
  rowControls: 56,
  titulo: 200,
  caracteres: 100,
  sku: 140,
  codigoUniversal: 140,
  categoria: 130,
  marca: 130,
  formatoVenta: 120,
  unidadesPorPack: 90,
  volumenCantidad: 90,
  volumenUnidad: 100,
  proveedor: 160,
  codigoProveedor: 130,
  costo: 110,
  margen: 90,
  iva: 80,
  precioVenta: 120,
  enStock: 170,
  descripcion: 200,
  fotoUrl: 200,
}

// Dynamic width getter for atributos (both principales and informativos)
const getColWidth = (colId: string): number => {
  // Check if it's a dynamic atributo informativo column
  if (colId.startsWith("atributoInfo")) {
    if (colId.includes("Key")) return 100
    if (colId.includes("Value")) return 100
    if (colId.includes("Add")) return 40
    if (colId.includes("Remove")) return 40
  }
  return COL_WIDTHS[colId] || 100
}

// Section type definition
interface Section {
  id: string
  label: string
  defaultExpanded: boolean
  columns?: string[]
  subHeaders?: Array<{ label: string; cols: string[] }>
  isDynamic?: boolean
  dynamicType?: "atributosInformativos"
}

// Section definitions
const SECTIONS: Section[] = [
  { 
    id: "obligatorio", 
    label: "Obligatorio", 
    defaultExpanded: true,
    columns: ["titulo", "caracteres"],
    subHeaders: [{ label: "TÍTULO", cols: ["titulo", "caracteres"] }],
  },
  { 
    id: "datos-principales", 
    label: "Datos Principales", 
    defaultExpanded: false,
    columns: ["sku", "codigoUniversal"],
    subHeaders: [{ label: "CÓDIGOS", cols: ["sku", "codigoUniversal"] }],
  },
  { 
    id: "info-comercial", 
    label: "Información Comercial", 
    defaultExpanded: false,
    columns: ["categoria", "marca", "formatoVenta", "unidadesPorPack", "volumenCantidad", "volumenUnidad", "proveedor", "codigoProveedor"],
    subHeaders: [
      { label: "INFO DEL PRODUCTO", cols: ["categoria", "marca"] },
      { label: "PRESENTACIÓN", cols: ["formatoVenta", "unidadesPorPack"] },
      { label: "VOLUMEN DE LA UNIDAD", cols: ["volumenCantidad", "volumenUnidad"] },
      { label: "INFO DEL PROVEEDOR", cols: ["proveedor", "codigoProveedor"] },
    ],
  },
  { 
    id: "precio", 
    label: "Precio", 
    defaultExpanded: false,
    columns: ["costo", "margen", "iva", "precioVenta"],
    subHeaders: [
      { label: "PRECIO", cols: ["costo", "margen", "iva", "precioVenta"] },
    ],
  },
  { 
    id: "stock", 
    label: "Stock", 
    defaultExpanded: false,
    columns: ["enStock"],
    subHeaders: [{ label: "STOCK EN EL DEPÓSITO", cols: ["enStock"] }],
  },
  { 
    id: "media", 
    label: "Media", 
    defaultExpanded: false,
    columns: ["descripcion", "fotoUrl"],
    subHeaders: [
      { label: "DESCRIPCIÓN", cols: ["descripcion"] },
      { label: "FOTO (URL)", cols: ["fotoUrl"] },
    ],
  },
  { 
    id: "atributos-informativos", 
    label: "Atributos Informativos", 
    defaultExpanded: false,
    isDynamic: true,
    dynamicType: "atributosInformativos",
  },
]

// Column labels for the third row
const COLUMN_LABELS: Record<string, string> = {
  titulo: "Título",
  caracteres: "Cant. de Caracteres",
  sku: "SKU",
  codigoUniversal: "Código Universal",
  categoria: "Categoría",
  marca: "Marca",
  formatoVenta: "Formato de Venta",
  unidadesPorPack: "U. por Pack",
  volumenCantidad: "Cantidad",
  volumenUnidad: "U. de Medida",
  proveedor: "Proveedor",
  codigoProveedor: "Código Proveedor",
  costo: "Costo",
  margen: "Margen %",
  iva: "IVA %",
  precioVenta: "Precio Venta",
  enStock: "En Stock",
  descripcion: "",
  fotoUrl: "",
}

interface WorkableRow {
  id: string
  titulo: string
  sku: string
  codigoUniversal: string
  categoria: string
  marca: string
  formatoVenta: string
  unidadesPorPack: string
  volumenCantidad: string
  volumenUnidad: string
  proveedor: string
  codigoProveedor: string
  costo: string
  margen: string
  iva: string
  precioVenta: string
  enStock: string
  descripcion: string
  fotoUrl: string
  atributosInformativos: Array<{ key: string; value: string }>
}

const createEmptyRow = (): WorkableRow => ({
  id: crypto.randomUUID(),
  titulo: "",
  sku: "",
  codigoUniversal: "",
  categoria: "",
  marca: "",
  formatoVenta: "unidad",
  unidadesPorPack: "1",
  volumenCantidad: "",
  volumenUnidad: "",
  proveedor: "",
  codigoProveedor: "",
  costo: "",
  margen: "",
  iva: "21",
  precioVenta: "",
  enStock: "0",
  descripcion: "",
  fotoUrl: "",
  atributosInformativos: [{ key: "", value: "" }],
})

export default function CreadorMasivoPage() {
  const { bulkCreateItems, bulkCreateItemsConVariantes } = useItems()
  const { proveedores, addProveedor } = useProveedores()
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false)
  const [pendingProveedorRowIndex, setPendingProveedorRowIndex] = useState<number | null>(null)
  const [creatorMode, setCreatorMode] = useState<"standalone" | "conVariantes">("standalone")
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: section.defaultExpanded }), {})
  )
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
  )
  // Con Variantes sections visibility
  const [visibleSectionsConVariantes, setVisibleSectionsConVariantes] = useState<Record<string, boolean>>(
    SECTIONS_CON_VARIANTES.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
  )
  // Standalone rows state - start with one default row
  const [rows, setRows] = useState<WorkableRow[]>([createEmptyRow()])
  // Con Variantes rows state (lifted from component for persistence) - start with one default row
  const [parentRows, setParentRows] = useState<ParentRow[]>([createEmptyParentRow()])
  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Helper: Check if a standalone row is completely empty (no data at all)
  const isStandaloneRowEmpty = (row: WorkableRow): boolean => {
    return (
      !row.titulo.trim() &&
      !row.sku.trim() &&
      !row.codigoUniversal.trim() &&
      !row.categoria.trim() &&
      !row.marca.trim() &&
      !row.proveedor.trim() &&
      !row.codigoProveedor.trim() &&
      !row.descripcion.trim() &&
      (row.enStock.trim() === "" || row.enStock.trim() === "0") &&
      !row.costo.trim() &&
      !row.margen.trim() &&
      !row.iva.trim() &&
      !row.precioVenta.trim() &&
      !row.fotoUrl.trim() &&
      !row.volumenCantidad.trim() &&
      !row.volumenUnidad.trim() &&
      (row.formatoVenta === "unidad") &&
      (row.unidadesPorPack === "1" || row.unidadesPorPack === "") &&
      row.atributosInformativos.every(attr => !attr.key.trim() && !attr.value.trim())
    )
  }

  // Helper: Check if a con variantes row is completely empty
  const isConVariantesRowEmpty = (row: ParentRow): boolean => {
    return (
      !row.titulo.trim() &&
      !row.skuPadre.trim() &&
      !row.codigoUniversal.trim() &&
      !row.categoria.trim() &&
      !row.marca.trim() &&
      !row.proveedor.trim() &&
      !row.descripcion.trim() &&
      !row.fotoUrl.trim() &&
      !row.volumenCantidad.trim() &&
      !row.volumenUnidad.trim() &&
      !row.vencimiento.trim() &&
      row.atributosPrincipales.every(attr => !attr.key.trim() && attr.tags.length === 0) &&
      row.atributosInformativos.every(attr => !attr.key.trim() && !attr.value.trim() && !attr.inherit) &&
      row.variants.length === 0
    )
  }

  // Filter out completely empty rows
  const nonEmptyStandaloneRows = rows.filter(row => !isStandaloneRowEmpty(row))
  const nonEmptyConVariantesRows = parentRows.filter(row => !isConVariantesRowEmpty(row))
  
  // Count rows that will be created (non-empty rows with titles)
  const standaloneRowsToCreateCount = nonEmptyStandaloneRows.filter(row => row.titulo.trim() !== "").length
  const conVariantesRowsToCreateCount = nonEmptyConVariantesRows.filter(row => row.titulo.trim() !== "").length
  
  // Check if at least one valid row exists
  const hasValidRows = standaloneRowsToCreateCount > 0 || conVariantesRowsToCreateCount > 0
  
  // Validation: non-empty rows MUST have titles
  const allStandaloneRowsValid = nonEmptyStandaloneRows.every(row => row.titulo.trim() !== "")
  const allConVariantesRowsValid = nonEmptyConVariantesRows.every(row => row.titulo.trim() !== "")
  
  // All rows valid for both modes
  const allRowsValid = allStandaloneRowsValid && allConVariantesRowsValid

  // Handle crear button click
  const handleCrearClick = () => {
    if (!allRowsValid) {
      setShowErrorModal(true)
      return
    }
    setShowConfirmModal(true)
  }
  
  // Toggle section visibility for con variantes
  const toggleSectionVisibilityConVariantes = (sectionId: string) => {
    if (sectionId === "obligatorio") return
    setVisibleSectionsConVariantes(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  // Handle confirmed creation - creates BOTH standalone AND con variantes items
  const handleConfirmCreate = async () => {
    setShowConfirmModal(false)
    setIsCreating(true)
    
    // Prepare standalone items data from rows (filter out completely empty rows)
    const standaloneItemsToCreate = nonEmptyStandaloneRows
      .filter(row => row.titulo.trim() !== "")
      .map(row => {
        const atributosInformativos = row.atributosInformativos
          .filter(attr => attr.key.trim() && attr.value.trim())
        const hasVolumenUnidad = row.volumenCantidad.trim() && row.volumenUnidad.trim()
        
        return {
          name: row.titulo.trim(),
          sku: row.sku.trim() || undefined,
          codigoUniversal: row.codigoUniversal.trim() || undefined,
          categoria: row.categoria.trim() || undefined,
          marca: row.marca.trim() || undefined,
          formatoVenta: row.formatoVenta,
          unidadesPorPack: row.formatoVenta === "pack" ? parseInt(row.unidadesPorPack) || 1 : 1,
          volumenActive: !!hasVolumenUnidad,
          volumenCantidad: hasVolumenUnidad ? row.volumenCantidad : undefined,
          volumenUnidad: hasVolumenUnidad ? row.volumenUnidad : undefined,
          proveedor: row.proveedor.trim() || undefined,
          codigoProveedor: row.codigoProveedor.trim() || undefined,
          atributosInformativos: atributosInformativos.length > 0 ? atributosInformativos : undefined,
          descripcion: row.descripcion.trim() || undefined,
          enStock: parseInt(row.enStock) || 0,
          costo: parseFloat(row.costo) > 0 ? parseFloat(row.costo) : undefined,
          margen: parseFloat(row.margen) > 0 ? parseFloat(row.margen) : undefined,
          iva: parseFloat(row.iva) > 0 ? parseFloat(row.iva) : undefined,
          precioVenta: parseFloat(row.precioVenta) > 0 ? parseFloat(row.precioVenta) : undefined,
          imagenUrl: row.fotoUrl.trim() || undefined,
        }
      })
    
    // Prepare items con variantes data from parentRows (filter out completely empty rows)
    const conVariantesItemsToCreate = nonEmptyConVariantesRows
      .filter(row => row.titulo.trim() !== "")
      .map(parentRow => {
        // Generate SKU padre if not provided
        let skuPadre = parentRow.skuPadre.trim()
        if (!skuPadre) {
          skuPadre = parentRow.titulo
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, "")
            .split(" ")
            .map((word) => word.substring(0, 3))
            .join("-")
            .substring(0, 15)
        }
        
        const containerAtributosPrincipales = (parentRow.atributosPrincipales || [])
          .filter(attr => attr && attr.key && attr.key.trim() && attr.tags && attr.tags.length > 0)
          .map(attr => ({ key: attr.key, variantes: attr.tags }))
        
        const parentAtributosInformativos = (parentRow.atributosInformativos || [])
          .filter(attr => attr && attr.key && attr.key.trim() && (attr.value?.trim() || attr.inherit))
          .map(attr => ({
            key: attr.key,
            value: attr.inherit ? "" : (attr.value || ""),
            inherit: attr.inherit
          }))
        
        const hasVolumenUnidad = parentRow.volumenCantidad.trim() && parentRow.volumenUnidad.trim()
        const hasVencimiento = parentRow.vencimiento.trim()
        
        // Build variants array
        const variants = parentRow.variants.map(variant => {
          const skuSuffix = variant.skuSufijo?.trim()
            || (variant.atributosPrincipales || [])
              .filter(a => a && a.value)
              .map(a => a.value.toLowerCase().replace(/\s+/g, "-"))
              .join("-")
          
          const variantEnStock = parseInt(variant.enStock || "0") || 0
          const variantCosto = parseFloat(variant.costo || "") || 0
          const variantMargen = parseFloat(variant.margen || "") || 0
          const variantIva = parseFloat(variant.iva || "21") || 0
          const variantPrecioVenta = parseFloat(variant.precioVenta || "") || 0
          const variantPrecio = (variantCosto > 0 || variantPrecioVenta > 0)
            ? { costo: variantCosto, margen: variantMargen, iva: variantIva, precioFinal: variantPrecioVenta || variantCosto * (1 + variantMargen / 100) * (1 + variantIva / 100) }
            : undefined
          return {
            sku: `${skuPadre}-${skuSuffix}`,
            codigoUniversal: variant.codigoUniversal || "",
            descripcion: variant.descripcion || parentRow.descripcion,
            foto: variant.fotoUrl || parentRow.fotoUrl,
            atributosPrincipales: (variant.atributosPrincipales || []).filter(a => a && a.key && a.value),
            stock: {
              enStock: variantEnStock.toString(),
              reservado: "0",
              disponible: variantEnStock.toString(),
            },
            precio: variantPrecio,
            codigoProveedor: variant.codigoProveedor || undefined,
            atributosInformativos: (variant.atributosInformativos || [])
              .filter(attr => attr && attr.key && attr.key.trim())
              .map(attr => ({ key: attr.key, value: attr.value || "" })),
          }
        })
        
        return {
          name: parentRow.titulo.trim(),
          sku: skuPadre,
          codigoUniversal: parentRow.codigoUniversal.trim() || undefined,
          categoria: parentRow.categoria.trim() || undefined,
          marca: parentRow.marca.trim() || undefined,
          formatoVenta: parentRow.formatoVenta,
          unidadesPorPack: parentRow.formatoVenta === "pack" ? parseInt(parentRow.unidadesPorPack) || 1 : 1,
          volumenActive: !!hasVolumenUnidad,
          volumenCantidad: hasVolumenUnidad ? parentRow.volumenCantidad : undefined,
          volumenUnidad: hasVolumenUnidad ? parentRow.volumenUnidad : undefined,
          vencimientoActive: !!hasVencimiento,
          fechaVencimiento: hasVencimiento ? parentRow.vencimiento : undefined,
          proveedor: parentRow.proveedor.trim() || undefined,
          descripcion: parentRow.descripcion.trim() || undefined,
          imagenUrl: parentRow.fotoUrl.trim() || undefined,
          containerAtributosPrincipales: containerAtributosPrincipales.length > 0 ? containerAtributosPrincipales : undefined,
          atributosInformativos: parentAtributosInformativos.length > 0 ? parentAtributosInformativos : undefined,
          variants: variants,
        }
      })
    
    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Create standalone items
    if (standaloneItemsToCreate.length > 0) {
      bulkCreateItems(standaloneItemsToCreate)
    }
    
    // Create items con variantes
    if (conVariantesItemsToCreate.length > 0) {
      bulkCreateItemsConVariantes(conVariantesItemsToCreate)
    }
    
    // Reset to initial state for both modes
    setRows([createEmptyRow()])
    setParentRows([createEmptyParentRow()])
    setIsCreating(false)
    
    // Show success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const breadcrumbs = [
    { label: "Catálogo", href: "/catalogo/items" },
    { label: "Creador Masivo", href: "/catalogo/creador-masivo" },
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const toggleSectionVisibility = (sectionId: string) => {
    // "obligatorio" section cannot be hidden
    if (sectionId === "obligatorio") return
    setVisibleSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const addRow = (afterIndex: number) => {
    const newRows = [...rows]
    newRows.splice(afterIndex + 1, 0, createEmptyRow())
    setRows(newRows)
  }

  const removeRow = (index: number) => {
    if (rows.length === 1) return
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (rowIndex: number, field: keyof WorkableRow, value: string) => {
    setRows(prev => prev.map((row, i) => i !== rowIndex ? row : { ...row, [field]: value }))
  }

  const addAtributoInformativo = (rowIndex: number) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      return { ...row, atributosInformativos: [...row.atributosInformativos, { key: "", value: "" }] }
    }))
  }

  const removeAtributoInformativo = (rowIndex: number, attrIndex: number) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex || row.atributosInformativos.length <= 1) return row
      return { ...row, atributosInformativos: row.atributosInformativos.filter((_, idx) => idx !== attrIndex) }
    }))
  }

  const updateAtributoInformativo = (rowIndex: number, attrIndex: number, field: "key" | "value", value: string) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const newAttrs = [...row.atributosInformativos]
      newAttrs[attrIndex] = { ...newAttrs[attrIndex], [field]: value }
      return { ...row, atributosInformativos: newAttrs }
    }))
  }

  // Get the maximum number of atributos across all rows for a given type
  const getMaxAtributos = (type: "atributosPrincipales" | "atributosInformativos") => {
    return Math.max(...rows.map(row => row[type].length))
  }

  // Get dynamic columns for a section based on row data
  const getDynamicColumns = (section: typeof SECTIONS[0]) => {
    if (!section.isDynamic) return section.columns || []
    
    if (section.dynamicType === "atributosPrincipales") {
      const maxAttrs = getMaxAtributos("atributosPrincipales")
      const cols: string[] = []
      for (let i = 0; i < maxAttrs; i++) {
        cols.push(`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Value`)
        if (i === 0 && maxAttrs === 1) {
          cols.push(`atributoPrincipal1Add`)
        } else if (i === 1) {
          cols.push(`atributoPrincipal2Remove`)
        }
      }
      return cols
    }
    
    if (section.dynamicType === "atributosInformativos") {
      const maxAttrs = getMaxAtributos("atributosInformativos")
      const cols: string[] = []
      for (let i = 0; i < maxAttrs; i++) {
        cols.push(`atributoInfo${i}Key`, `atributoInfo${i}Value`)
        // First one only gets + button, others get both x and + buttons
        if (i === 0 && maxAttrs === 1) {
          cols.push(`atributoInfo${i}Add`)
        } else {
          // Non-first attributes get remove button, last one also gets add button
          cols.push(`atributoInfo${i}Remove`)
          if (i === maxAttrs - 1) {
            cols.push(`atributoInfo${i}Add`)
          }
        }
      }
      return cols
    }
    
    return []
  }

  // Get dynamic subheaders for a section
  const getDynamicSubHeaders = (section: typeof SECTIONS[0]) => {
    if (!section.isDynamic) return section.subHeaders || []
    
    if (section.dynamicType === "atributosPrincipales") {
      const maxAttrs = getMaxAtributos("atributosPrincipales")
      const subHeaders: Array<{ label: string; cols: string[] }> = []
      for (let i = 0; i < maxAttrs; i++) {
        const cols = [`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Value`]
        if (i === 0 && maxAttrs === 1) {
          cols.push(`atributoPrincipal1Add`)
        } else if (i === 1) {
          cols.push(`atributoPrincipal2Remove`)
        }
        subHeaders.push({ label: `ATRIBUTO PRINCIPAL ${i + 1}`, cols })
      }
      return subHeaders
    }
    
    if (section.dynamicType === "atributosInformativos") {
      const maxAttrs = getMaxAtributos("atributosInformativos")
      const subHeaders: Array<{ label: string; cols: string[] }> = []
      for (let i = 0; i < maxAttrs; i++) {
        const cols = [`atributoInfo${i}Key`, `atributoInfo${i}Value`]
        if (i === 0 && maxAttrs === 1) {
          cols.push(`atributoInfo${i}Add`)
        } else {
          cols.push(`atributoInfo${i}Remove`)
          if (i === maxAttrs - 1) {
            cols.push(`atributoInfo${i}Add`)
          }
        }
        subHeaders.push({ label: "ATRIBUTO INFORMATIVO", cols })
      }
      return subHeaders
    }
    
    return []
  }

  // Calculate width for a section
  const getSectionWidth = (section: typeof SECTIONS[0]) => {
    const columns = getDynamicColumns(section)
    return columns.reduce((sum, col) => sum + getColWidth(col), 0)
  }

  // Calculate width for a subheader
  const getSubHeaderWidth = (cols: string[]) => {
    return cols.reduce((sum, col) => sum + getColWidth(col), 0)
  }

  // Calculate total table width
  const getTotalWidth = () => {
    let width = COL_WIDTHS.rowControls
    SECTIONS.forEach(section => {
      // Only count visible sections
      if (visibleSections[section.id]) {
        if (expandedSections[section.id]) {
          width += getSectionWidth(section)
        } else {
          width += 140 // Collapsed section width
        }
      }
    })
    return width
  }

  const getRowHeight = () => "h-12"

  const renderCell = (row: WorkableRow, rowIndex: number, colId: string) => {
    const baseInputClass = "w-full h-full text-xs px-2 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
    
    switch (colId) {
      case "caracteres":
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            {row.titulo.length}
          </div>
        )
      case "stockDisponible":
        const disponible = Math.max(0, (parseInt(row.enStock) || 0) - (parseInt(row.stockReservado) || 0))
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            {disponible}
          </div>
        )
      case "formatoVenta":
        return (
          <select
            value={row.formatoVenta}
            onChange={(e) => updateRow(rowIndex, "formatoVenta", e.target.value)}
            className={`${baseInputClass} cursor-pointer`}
          >
            <option value="unidad">unidad</option>
            <option value="pack">pack</option>
          </select>
        )
      case "volumenUnidad":
        return (
          <select
            value={row.volumenUnidad}
            onChange={(e) => updateRow(rowIndex, "volumenUnidad", e.target.value)}
            className={`${baseInputClass} cursor-pointer`}
          >
            <option value="">-</option>
            <option value="ml">ml</option>
            <option value="L">L</option>
            <option value="cm³">cm³</option>
            <option value="m³">m³</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
          </select>
        )
      case "unidadesPorPack":
        const isDisabled = row.formatoVenta !== "pack"
        return (
          <input
            type="number"
            min="1"
            value={row.unidadesPorPack}
            onChange={(e) => updateRow(rowIndex, "unidadesPorPack", e.target.value)}
            disabled={isDisabled}
            className={`${baseInputClass} text-center ${isDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
          />
        )
      case "titulo":
        return (
          <input
            type="text"
            value={row.titulo}
            onChange={(e) => updateRow(rowIndex, "titulo", e.target.value)}
            placeholder="Título"
            className={baseInputClass}
          />
        )
      case "sku":
        return (
          <input
            type="text"
            value={row.sku}
            onChange={(e) => updateRow(rowIndex, "sku", e.target.value)}
            placeholder="Generar Automático"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "codigoUniversal":
        return (
          <input
            type="text"
            value={row.codigoUniversal}
            onChange={(e) => updateRow(rowIndex, "codigoUniversal", e.target.value)}
            placeholder="N.A."
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "categoria":
        return (
          <input
            type="text"
            value={row.categoria}
            onChange={(e) => updateRow(rowIndex, "categoria", e.target.value)}
            placeholder="Categoría"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "marca":
        return (
          <input
            type="text"
            value={row.marca}
            onChange={(e) => updateRow(rowIndex, "marca", e.target.value)}
            placeholder="Marca"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "volumenCantidad":
        return (
          <input
            type="number"
            value={row.volumenCantidad}
            onChange={(e) => updateRow(rowIndex, "volumenCantidad", e.target.value)}
            placeholder="Ej: 750"
            className={`${baseInputClass} text-center placeholder:text-gray-300`}
          />
        )
      case "proveedor": {
        const proveedorNombre = (p: typeof proveedores[0]) =>
          p.tipo === "empresa" ? p.razonSocial || p.nombre : `${p.nombre} ${p.apellido || ""}`.trim()
        return (
          <select
            value={row.proveedor}
            onChange={(e) => {
              if (e.target.value === "__nuevo__") {
                setPendingProveedorRowIndex(rowIndex)
                setShowNuevoProveedorModal(true)
              } else {
                updateRow(rowIndex, "proveedor", e.target.value)
              }
            }}
            className={`${baseInputClass} cursor-pointer`}
          >
            <option value="">— Proveedor —</option>
            <option value="__nuevo__">+ Nuevo Proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={proveedorNombre(p)}>{proveedorNombre(p)}</option>
            ))}
          </select>
        )
      }
      case "codigoProveedor":
        return (
          <input
            type="text"
            value={row.codigoProveedor}
            onChange={(e) => updateRow(rowIndex, "codigoProveedor", e.target.value)}
            placeholder="Código"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "costo":
        return (
          <div className="relative w-full h-full">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.costo}
              onChange={(e) => {
                updateRow(rowIndex, "costo", e.target.value)
                const costo = parseFloat(e.target.value) || 0
                const margen = parseFloat(row.margen) || 0
                const iva = parseFloat(row.iva) || 0
                if (costo > 0) {
                  const pv = costo * (1 + margen / 100) * (1 + iva / 100)
                  updateRow(rowIndex, "precioVenta", pv.toFixed(2))
                }
              }}
              placeholder="0"
              className={`${baseInputClass} pl-5 text-right placeholder:text-gray-300`}
            />
          </div>
        )
      case "margen":
        return (
          <div className="relative w-full h-full">
            <input
              type="number"
              min="0"
              step="0.1"
              value={row.margen}
              onChange={(e) => {
                updateRow(rowIndex, "margen", e.target.value)
                const costo = parseFloat(row.costo) || 0
                const margen = parseFloat(e.target.value) || 0
                const iva = parseFloat(row.iva) || 0
                if (costo > 0) {
                  const pv = costo * (1 + margen / 100) * (1 + iva / 100)
                  updateRow(rowIndex, "precioVenta", pv.toFixed(2))
                }
              }}
              placeholder="0"
              className={`${baseInputClass} pr-5 text-right placeholder:text-gray-300`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none">%</span>
          </div>
        )
      case "iva":
        return (
          <select
            value={row.iva || "21"}
            onChange={(e) => {
              updateRow(rowIndex, "iva", e.target.value)
              const costo = parseFloat(row.costo) || 0
              const margen = parseFloat(row.margen) || 0
              const iva = parseFloat(e.target.value) || 0
              if (costo > 0) {
                const pv = costo * (1 + margen / 100) * (1 + iva / 100)
                updateRow(rowIndex, "precioVenta", pv.toFixed(2))
              }
            }}
            className={`${baseInputClass} cursor-pointer`}
          >
            <option value="0">0%</option>
            <option value="10">10%</option>
            <option value="21">21%</option>
          </select>
        )
      case "precioVenta":
        return (
          <div className="relative w-full h-full">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-green-600 text-[11px] font-medium pointer-events-none">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.precioVenta}
              onChange={(e) => updateRow(rowIndex, "precioVenta", e.target.value)}
              placeholder="0"
              className={`${baseInputClass} pl-5 text-right placeholder:text-gray-300`}
            />
          </div>
        )
      case "enStock":
        return (
          <input
            type="number"
            min="0"
            value={row.enStock}
            onChange={(e) => updateRow(rowIndex, "enStock", e.target.value)}
            className={`${baseInputClass} text-center`}
          />
        )
      case "descripcion":
        return (
          <input
            type="text"
            value={row.descripcion}
            onChange={(e) => updateRow(rowIndex, "descripcion", e.target.value)}
            placeholder="Descripción"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "fotoUrl":
        return (
          <input
            type="text"
            value={row.fotoUrl}
            onChange={(e) => updateRow(rowIndex, "fotoUrl", e.target.value)}
            placeholder="https://..."
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      default:
        // Handle dynamic atributos informativos columns
        if (colId.startsWith("atributoInfo")) {
          const match = colId.match(/atributoInfo(\d+)(Key|Value|Add|Remove)/)
          if (match) {
            const attrIndex = parseInt(match[1])
            const fieldType = match[2]
            const maxAttrs = row.atributosInformativos.length
            
            if (fieldType === "Key") {
              return (
                <input
                  type="text"
                  value={row.atributosInformativos[attrIndex]?.key || ""}
                  onChange={(e) => updateAtributoInformativo(rowIndex, attrIndex, "key", e.target.value)}
                  placeholder="Ej: Material"
                  className={`${baseInputClass} placeholder:text-gray-300`}
                />
              )
            }
            if (fieldType === "Value") {
              return (
                <input
                  type="text"
                  value={row.atributosInformativos[attrIndex]?.value || ""}
                  onChange={(e) => updateAtributoInformativo(rowIndex, attrIndex, "value", e.target.value)}
                  placeholder="Ej: Algodón"
                  className={`${baseInputClass} placeholder:text-gray-300`}
                />
              )
            }
            if (fieldType === "Remove") {
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <button
                    onClick={() => removeAtributoInformativo(rowIndex, attrIndex)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer rounded"
                    title="Eliminar atributo informativo"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )
            }
            if (fieldType === "Add") {
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <button
                    onClick={() => addAtributoInformativo(rowIndex)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer rounded"
                    title="Agregar atributo informativo"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )
            }
          }
        }
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen">
        <div className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={setHoveredDropdown}
            onDropdownClose={() => setHoveredDropdown(null)}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Header */}
          <div className="relative border-b border-[#2E2F35] h-[44px] bg-[#1B1C20] z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2 min-w-[280px] justify-end">
                {/* Future: Save/Create buttons */}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-slate-50">

            {/* Top row */}
            <div className="px-8 pt-12 pb-8">
              <div className="max-w-[1400px] mx-auto flex items-start justify-between gap-6">
                {/* Title + mode switcher stacked */}
                <div className="flex flex-col gap-3">
                  <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                    Creador Masivo de Items
                  </h1>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm self-start">
                    <button
                      onClick={() => setCreatorMode("standalone")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        creatorMode === "standalone"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Items Individuales
                    </button>
                    <button
                      onClick={() => setCreatorMode("conVariantes")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        creatorMode === "conVariantes"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Items con Variantes
                    </button>
                  </div>
                </div>

                {/* Crear button */}
                <div className="flex items-center gap-2 mt-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCrearClick}
                    disabled={!hasValidRows || isCreating}
                    className={`h-9 px-4 text-sm font-semibold transition-colors border shadow-sm gap-2 rounded-lg flex items-center cursor-pointer ${
                      hasValidRows && !isCreating
                        ? "border-[rgba(228,230,235,0.8)] bg-white text-slate-900 hover:bg-slate-50"
                        : "border-slate-200 bg-white text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Plus className={`w-4 h-4 ${hasValidRows && !isCreating ? "text-slate-600" : "text-slate-300"}`} strokeWidth={2.25} />
                    {isCreating ? "Creando..." : "Crear"}
                  </button>
                </div>
              </div>
            </div>

            {/* Secciones selector + grid */}
            <div className="px-8 pb-8">
              <div className="max-w-[1400px] mx-auto">

                {/* Secciones row — right above the grid */}
                <div className="flex items-center justify-between mb-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="h-8 px-3 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-700">Secciones</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="start">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Mostrar/Ocultar Secciones</div>
                        {(creatorMode === "standalone" ? SECTIONS : SECTIONS_CON_VARIANTES).map((section) => (
                          <div key={section.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`section-${section.id}`}
                              checked={creatorMode === "standalone" ? visibleSections[section.id] : visibleSectionsConVariantes[section.id]}
                              onCheckedChange={() => creatorMode === "standalone" ? toggleSectionVisibility(section.id) : toggleSectionVisibilityConVariantes(section.id)}
                              disabled={section.id === "obligatorio"}
                              className={section.id === "obligatorio" ? "opacity-50 cursor-not-allowed" : ""}
                            />
                            <label
                              htmlFor={`section-${section.id}`}
                              className={`text-xs ${section.id === "obligatorio" ? "text-gray-500 cursor-not-allowed" : "text-gray-700 cursor-pointer"}`}
                            >
                              {section.label}
                              {section.id === "obligatorio" && (
                                <span className="ml-1 text-[10px] text-gray-400">(requerido)</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

            {/* Excel-like Grid with horizontal scroll */}
            <div className="border-gray-200 bg-transparent border-b-0 border-r-0">
              {creatorMode === "standalone" ? (
                <div className="bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] overflow-x-auto">
                  <table className="border-collapse" style={{ minWidth: getTotalWidth() }}>
                  {/* Row 1: Section Headers */}
                  <thead>
                    <tr className="h-10 bg-slate-100">
                      <th 
                        className="border-r border-b border-gray-200 bg-slate-200"
                        style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
                      />
                      {SECTIONS.filter(section => visibleSections[section.id]).map((section) => {
                        const isExpanded = expandedSections[section.id]
                        const columns = getDynamicColumns(section)
                        const sectionWidth = isExpanded ? getSectionWidth(section) : 140
                        const colSpan = isExpanded ? columns.length : 1
                        
                        return (
                          <th
                            key={section.id}
                            colSpan={colSpan}
                            className="border-r border-b border-gray-200 px-2 cursor-pointer hover:bg-slate-150 transition-colors bg-slate-300 text-background"
                            style={{ width: sectionWidth, minWidth: sectionWidth }}
                            onClick={() => toggleSection(section.id)}
                            title={isExpanded ? "Colapsar sección" : "Expandir sección"}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold truncate flex-1 text-left text-slate-900">
                                {section.label}
                              </span>
                              <div className="flex-shrink-0">
                                {isExpanded ? (
                                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                            </div>
                          </th>
                        )
                      })}
                    </tr>

                    {/* Row 2: Sub-headers */}
                    <tr className="h-8 bg-slate-50">
                      <th 
                        className="border-r border-b border-gray-200 bg-slate-100"
                        style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
                      />
                      {SECTIONS.filter(section => visibleSections[section.id]).map((section) => {
                        const isExpanded = expandedSections[section.id]
                        
                        if (!isExpanded) {
                          return (
                            <th
                              key={section.id}
                              className="border-r border-b border-gray-200 bg-slate-50"
                              style={{ width: 140, minWidth: 140 }}
                            />
                          )
                        }
                        
                        const subHeaders = getDynamicSubHeaders(section)
                        return subHeaders.map((subHeader, idx) => {
                          const subHeaderWidth = getSubHeaderWidth(subHeader.cols)
                          return (
                            <th
                              key={`${section.id}-sub-${idx}`}
                              colSpan={subHeader.cols.length}
                              className="border-r border-b border-gray-200 px-2 bg-slate-200"
                              style={{ width: subHeaderWidth, minWidth: subHeaderWidth }}
                            >
                              <span className="text-[10px] font-medium text-gray-500 uppercase">
                                {subHeader.label}
                              </span>
                            </th>
                          )
                        })
                      })}
                    </tr>

                    {/* Row 3: Column Labels */}
                    <tr className="h-8 bg-gray-50">
                      <th 
                        className="border-r border-b border-gray-300 bg-slate-100"
                        style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
                      />
                      {SECTIONS.filter(section => visibleSections[section.id]).map((section) => {
                        const isExpanded = expandedSections[section.id]
                        
                        if (!isExpanded) {
                          return (
                            <th
                              key={section.id}
                              className="border-r border-b border-gray-200 bg-white"
                              style={{ width: 140, minWidth: 140 }}
                            />
                          )
                        }
                        
                        const columns = getDynamicColumns(section)
                        return columns.map((colId) => {
                          const width = getColWidth(colId)
                          // Generate label for dynamic columns
                          let label = COLUMN_LABELS[colId] || ""
                          if (colId.includes("Key")) label = "Atributo"
                          if (colId.includes("Value")) label = "Valor"
                          if (colId.includes("Add") || colId.includes("Remove")) label = ""
                          
                          return (
                            <th
                              key={colId}
                              className="border-r border-b border-gray-300 bg-gray-50 px-2"
                              style={{ width, minWidth: width }}
                            >
                              <span className="text-[10px] font-medium text-gray-600">
                                {label}
                              </span>
                            </th>
                          )
                        })
                      })}
                    </tr>
                  </thead>

                  {/* Workable Rows */}
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={row.id} className={`${getRowHeight()} hover:bg-gray-50/50`}>
                        {/* Row controls */}
                        <td 
                          className="border-r border-b border-gray-200 bg-white"
                          style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
                        >
                          <div className="flex items-center justify-center gap-1 h-full">
                            <button
                              onClick={() => addRow(rowIndex)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Agregar fila debajo"
                            >
                              <Plus className="w-3.5 h-3.5 text-green-600" />
                            </button>
                            <button
                              onClick={() => removeRow(rowIndex)}
                              disabled={rows.length === 1}
                              className={`p-1 rounded transition-colors ${
                                rows.length === 1 
                                  ? "text-gray-300 cursor-not-allowed" 
                                  : "hover:bg-gray-100 text-red-500 cursor-pointer"
                              }`}
                              title="Eliminar fila"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        
                        {/* Data cells */}
                        {SECTIONS.filter(section => visibleSections[section.id]).map((section) => {
                          const isExpanded = expandedSections[section.id]
                          
                          if (!isExpanded) {
                            return (
                              <td
                                key={section.id}
                                className="border-r border-b border-gray-200 bg-gray-50"
                                style={{ width: 140, minWidth: 140 }}
                              />
                            )
                          }
                          
                          const columns = getDynamicColumns(section)
                          return columns.map((colId) => {
                            const width = getColWidth(colId)
                            return (
                              <td
                                key={colId}
                                className="border-r border-b border-gray-200 p-0"
                                style={{ width, minWidth: width }}
                              >
                                {renderCell(row, rowIndex, colId)}
                              </td>
                            )
                          })
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
                // Items con Variantes mode
                <CreadorMasivoConVariantes
                  gridSize="md"
                  setGridSize={() => {}}
                  parentRows={parentRows}
                  setParentRows={setParentRows}
                  visibleSections={visibleSectionsConVariantes}
                />
              )}
            </div>{/* /grid */}
              </div>{/* /max-w */}
            </div>{/* /px-8 */}
          </div>{/* /main content */}
        </div>{/* /panel */}
      </div>{/* /layout */}

      {/* Nuevo Proveedor Modal */}
      <NuevoProveedorModal
        isOpen={showNuevoProveedorModal}
        onClose={() => {
          setShowNuevoProveedorModal(false)
          setPendingProveedorRowIndex(null)
        }}
        onSave={(proveedorData) => {
          const newProveedor = { ...proveedorData, id: crypto.randomUUID() }
          addProveedor(newProveedor)
          if (pendingProveedorRowIndex !== null) {
            const nombre = newProveedor.tipo === "empresa"
              ? newProveedor.razonSocial || newProveedor.nombre
              : `${newProveedor.nombre} ${newProveedor.apellido || ""}`.trim()
            updateRow(pendingProveedorRowIndex, "proveedor", nombre)
          }
          setShowNuevoProveedorModal(false)
          setPendingProveedorRowIndex(null)
        }}
      />

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-[100020] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Items creados correctamente</span>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100010] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowErrorModal(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold">Error</h2>
              </div>
              <button onClick={() => setShowErrorModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600">
                Todos los items deben tener título. Completá los títulos faltantes o eliminá las filas sobrantes en ambas vistas (standalone e items con variantes).
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100010] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Crear Items</h2>
              <button onClick={() => setShowConfirmModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-2">
              {standaloneRowsToCreateCount > 0 && (
                <p className="text-sm text-gray-600">
                  Vas a crear <span className="font-semibold text-gray-900">{standaloneRowsToCreateCount}</span> item{standaloneRowsToCreateCount !== 1 ? "s" : ""} individual{standaloneRowsToCreateCount !== 1 ? "es" : ""}.
                </p>
              )}
              {conVariantesRowsToCreateCount > 0 && (
                <p className="text-sm text-gray-600">
                  Vas a crear <span className="font-semibold text-gray-900">{conVariantesRowsToCreateCount}</span> item{conVariantesRowsToCreateCount !== 1 ? "s" : ""} con variantes.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="ghost"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmCreate}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
