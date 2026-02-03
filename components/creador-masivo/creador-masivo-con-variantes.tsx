"use client"

import React, { useState } from "react"
import { ChevronRight, ChevronLeft, Plus, X, Check, Grid, Link2 } from "lucide-react"

// Define column widths (in pixels) for consistent alignment
const COL_WIDTHS: Record<string, number> = {
  rowControls: 56,
  titulo: 200,
  caracteres: 100,
  skuPadre: 140,
  codigoUniversal: 140,
  // Atributos principales for variants (max 2)
  atributoPrincipal1Key: 100,
  atributoPrincipal1Tags: 180,
  atributoPrincipal2Key: 100,
  atributoPrincipal2Tags: 180,
  atributoPrincipalAdd: 40,
  atributoPrincipalRemove: 40,
  generarVariantes: 100,
  // For child rows atributos
  atributoPrincipal1Value: 100,
  atributoPrincipal2Value: 100,
  categoria: 130,
  marca: 130,
  formatoVenta: 120,
  unidadesPorPack: 90,
  volumenCantidad: 90,
  volumenUnidad: 100,
  vencimiento: 150,
  proveedor: 130,
  codigoProveedor: 130,
  stockTotal: 80,
  stockReservado: 90,
  stockDisponible: 90,
  descripcion: 200,
  fotoUrl: 200,
}

// Dynamic width getter
const getColWidth = (colId: string): number => {
  if (colId.startsWith("atributoInfo")) {
    if (colId.includes("Key")) return 100
    if (colId.includes("Value")) return 130 // Wider to accommodate inherit button
    if (colId.includes("Add")) return 40
    if (colId.includes("Remove")) return 40
  }
  if (colId.startsWith("atributoPrincipal")) {
    if (colId.includes("Key")) return 100
    if (colId.includes("Tags")) return 180
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
  dynamicType?: "atributosPrincipales" | "atributosInformativos"
}

// Section definitions for Items con Variantes
const SECTIONS_CON_VARIANTES: Section[] = [
  { 
    id: "obligatorio", 
    label: "Obligatorio", 
    defaultExpanded: true,
    columns: ["titulo", "caracteres"],
    subHeaders: [{ label: "TITULO", cols: ["titulo", "caracteres"] }],
  },
  { 
    id: "datos-principales", 
    label: "Datos Principales", 
    defaultExpanded: false,
    columns: ["skuPadre", "codigoUniversal"],
    subHeaders: [{ label: "CODIGOS", cols: ["skuPadre", "codigoUniversal"] }],
  },
  {
    id: "atributos-principales",
    label: "Atributos Principales",
    defaultExpanded: true,
    isDynamic: true,
    dynamicType: "atributosPrincipales",
  },
  { 
    id: "info-comercial", 
    label: "Informacion Comercial", 
    defaultExpanded: false,
    columns: ["categoria", "marca", "formatoVenta", "unidadesPorPack", "volumenCantidad", "volumenUnidad", "vencimiento", "proveedor", "codigoProveedor"],
    subHeaders: [
      { label: "INFO DEL PRODUCTO", cols: ["categoria", "marca"] },
      { label: "PRESENTACION", cols: ["formatoVenta", "unidadesPorPack"] },
      { label: "VOLUMEN DE LA UNIDAD", cols: ["volumenCantidad", "volumenUnidad"] },
      { label: "VENCIMIENTO", cols: ["vencimiento"] },
      { label: "INFO DEL PROVEEDOR", cols: ["proveedor", "codigoProveedor"] },
    ],
  },
  { 
    id: "stock", 
    label: "Stock", 
    defaultExpanded: false,
    columns: ["stockTotal", "stockReservado", "stockDisponible"],
    subHeaders: [{ label: "STOCK EN EL DEPOSITO", cols: ["stockTotal", "stockReservado", "stockDisponible"] }],
  },
  { 
    id: "media", 
    label: "Media", 
    defaultExpanded: false,
    columns: ["descripcion", "fotoUrl"],
    subHeaders: [
      { label: "DESCRIPCION", cols: ["descripcion"] },
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

// Column labels
const COLUMN_LABELS: Record<string, string> = {
  titulo: "Titulo",
  caracteres: "Cant. de Caracteres",
  skuPadre: "SKU Padre",
  codigoUniversal: "Codigo Universal",
  categoria: "Categoria",
  marca: "Marca",
  formatoVenta: "Formato de Venta",
  unidadesPorPack: "U. por Pack",
  volumenCantidad: "Cantidad",
  volumenUnidad: "U. de Medida",
  vencimiento: "Fecha",
  proveedor: "Proveedor",
  codigoProveedor: "Codigo Proveedor",
  stockTotal: "Total",
  stockReservado: "Reservado",
  stockDisponible: "Disponible",
  descripcion: "",
  fotoUrl: "",
  generarVariantes: "Generar",
}

// Atributo informativo with inheritance support
interface AtributoInformativo {
  key: string
  value: string
  inherit: boolean // If true, children inherit the key but have editable value
}

// Child variant row
interface VariantRow {
  id: string
  parentId: string
  atributosPrincipales: Array<{ key: string; value: string }> // Filled from parent
  codigoProveedor: string
  stockTotal: string
  stockReservado: string
  descripcion: string
  fotoUrl: string
  atributosInformativos: Array<{ key: string; value: string }> // Own attributes
}

// Parent row with variants
interface ParentRow {
  id: string
  titulo: string
  skuPadre: string
  codigoUniversal: string
  // Atributos principales with multiple tags
  atributosPrincipales: Array<{ key: string; tags: string[] }>
  categoria: string
  marca: string
  formatoVenta: string
  unidadesPorPack: string
  volumenCantidad: string
  volumenUnidad: string
  vencimiento: string
  proveedor: string
  // codigoProveedor is NOT in parent, only in children
  descripcion: string
  fotoUrl: string
  atributosInformativos: AtributoInformativo[]
  // Generated variants
  variants: VariantRow[]
}

const createEmptyParentRow = (): ParentRow => ({
  id: crypto.randomUUID(),
  titulo: "",
  skuPadre: "",
  codigoUniversal: "",
  atributosPrincipales: [{ key: "", tags: [] }],
  categoria: "",
  marca: "",
  formatoVenta: "unidad",
  unidadesPorPack: "1",
  volumenCantidad: "",
  volumenUnidad: "",
  vencimiento: "",
  proveedor: "",
  descripcion: "",
  fotoUrl: "",
  atributosInformativos: [{ key: "", value: "", inherit: false }],
  variants: [],
})

interface CreadorMasivoConVariantesProps {
  gridSize: "sm" | "md" | "lg"
  setGridSize: (size: "sm" | "md" | "lg") => void
  // Lifted state from parent
  parentRows: ParentRow[]
  setParentRows: React.Dispatch<React.SetStateAction<ParentRow[]>>
  // For sections control
  visibleSections: Record<string, boolean>
}

export function CreadorMasivoConVariantes({ 
  gridSize, 
  setGridSize,
  parentRows,
  setParentRows,
  visibleSections,
}: CreadorMasivoConVariantesProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    SECTIONS_CON_VARIANTES.reduce((acc, section) => ({ ...acc, [section.id]: section.defaultExpanded }), {})
  )
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({}) // Track tag input values
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const addParentRow = (afterIndex: number) => {
    const newRows = [...parentRows]
    newRows.splice(afterIndex + 1, 0, createEmptyParentRow())
    setParentRows(newRows)
  }

  const removeParentRow = (index: number) => {
    setParentRows(parentRows.filter((_, i) => i !== index))
  }

  const updateParentRow = (rowIndex: number, field: keyof ParentRow, value: any) => {
    setParentRows(prev => prev.map((row, i) => i !== rowIndex ? row : { ...row, [field]: value }))
  }

  // Atributos principales management (with tags)
  const addAtributoPrincipal = (rowIndex: number) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex || row.atributosPrincipales.length >= 2) return row
      return { ...row, atributosPrincipales: [...row.atributosPrincipales, { key: "", tags: [] }] }
    }))
  }

  const removeAtributoPrincipal = (rowIndex: number, attrIndex: number) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex || row.atributosPrincipales.length <= 1) return row
      // Removing an atributo principal clears all variants
      return { 
        ...row, 
        atributosPrincipales: row.atributosPrincipales.filter((_, idx) => idx !== attrIndex),
        variants: [] 
      }
    }))
  }

  const updateAtributoPrincipalKey = (rowIndex: number, attrIndex: number, value: string) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const newAttrs = [...row.atributosPrincipales]
      newAttrs[attrIndex] = { ...newAttrs[attrIndex], key: value }
      return { ...row, atributosPrincipales: newAttrs }
    }))
  }

  const addTagToAtributo = (rowIndex: number, attrIndex: number, tag: string) => {
    if (!tag.trim()) return
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const newAttrs = [...row.atributosPrincipales]
      if (!newAttrs[attrIndex].tags.includes(tag.trim())) {
        newAttrs[attrIndex] = { ...newAttrs[attrIndex], tags: [...newAttrs[attrIndex].tags, tag.trim()] }
      }
      return { ...row, atributosPrincipales: newAttrs }
    }))
    // Clear the input
    setTagInputs(prev => ({ ...prev, [`${rowIndex}-${attrIndex}`]: "" }))
  }

  const removeTagFromAtributo = (rowIndex: number, attrIndex: number, tagIndex: number) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const removedTag = row.atributosPrincipales[attrIndex].tags[tagIndex]
      const newAttrs = [...row.atributosPrincipales]
      newAttrs[attrIndex] = { 
        ...newAttrs[attrIndex], 
        tags: newAttrs[attrIndex].tags.filter((_, idx) => idx !== tagIndex) 
      }
      // Remove variants that contain this tag value
      const newVariants = row.variants.filter(variant => {
        const variantAttr = variant.atributosPrincipales[attrIndex]
        return !variantAttr || variantAttr.value !== removedTag
      })
      return { ...row, atributosPrincipales: newAttrs, variants: newVariants }
    }))
  }

  // Atributos informativos management
  const addAtributoInformativo = (rowIndex: number) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      return { ...row, atributosInformativos: [...row.atributosInformativos, { key: "", value: "", inherit: false }] }
    }))
  }

  const removeAtributoInformativo = (rowIndex: number, attrIndex: number) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex || row.atributosInformativos.length <= 1) return row
      return { ...row, atributosInformativos: row.atributosInformativos.filter((_, idx) => idx !== attrIndex) }
    }))
  }

  const updateAtributoInformativo = (rowIndex: number, attrIndex: number, field: keyof AtributoInformativo, value: any) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const newAttrs = [...row.atributosInformativos]
      newAttrs[attrIndex] = { ...newAttrs[attrIndex], [field]: value }
      return { ...row, atributosInformativos: newAttrs }
    }))
  }

  const toggleAtributoInherit = (rowIndex: number, attrIndex: number) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const newAttrs = [...row.atributosInformativos]
      newAttrs[attrIndex] = { ...newAttrs[attrIndex], inherit: !newAttrs[attrIndex].inherit }
      // If switching to inherit, clear the value
      if (!newAttrs[attrIndex].inherit === true) {
        newAttrs[attrIndex].value = ""
      }
      return { ...row, atributosInformativos: newAttrs }
    }))
  }

  // Generate variants from atributos principales
  const generateVariants = (rowIndex: number) => {
    const parentRow = parentRows[rowIndex]
    const attrs = parentRow.atributosPrincipales.filter(a => a.key.trim() && a.tags.length > 0)
    
    if (attrs.length === 0) return
    
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
    
    // Generate all combinations
    const combinations: Array<Array<{ key: string; value: string }>> = []
    
    const generateCombinations = (
      currentCombination: Array<{ key: string; value: string }>,
      attrIndex: number
    ) => {
      if (attrIndex >= attrs.length) {
        combinations.push([...currentCombination])
        return
      }
      
      const attr = attrs[attrIndex]
      for (const tag of attr.tags) {
        currentCombination.push({ key: attr.key, value: tag })
        generateCombinations(currentCombination, attrIndex + 1)
        currentCombination.pop()
      }
    }
    
    generateCombinations([], 0)
    
    // Create variant rows
    const newVariants: VariantRow[] = combinations.map(combo => {
      const skuSuffix = combo.map(c => c.value.substring(0, 3).toUpperCase()).join("-")
      
      // Build inherited atributos informativos
      const inheritedAttrs = parentRow.atributosInformativos
        .filter(attr => attr.key.trim())
        .map(attr => ({
          key: attr.key,
          value: attr.inherit ? "" : attr.value, // Inherit keeps key, clears value for editing
        }))
      
      return {
        id: crypto.randomUUID(),
        parentId: parentRow.id,
        atributosPrincipales: combo,
        codigoProveedor: "",
        stockTotal: "0",
        stockReservado: "0",
        descripcion: parentRow.descripcion,
        fotoUrl: parentRow.fotoUrl,
        atributosInformativos: inheritedAttrs,
      }
    })
    
    // Update parent row
    setParentRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      return { 
        ...row, 
        skuPadre: skuPadre,
        variants: newVariants 
      }
    }))
  }

  // Remove a variant
  const removeVariant = (parentIndex: number, variantId: string) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== parentIndex) return row
      return { ...row, variants: row.variants.filter(v => v.id !== variantId) }
    }))
  }

  // Update variant field
  const updateVariant = (parentIndex: number, variantId: string, field: keyof VariantRow, value: any) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== parentIndex) return row
      return {
        ...row,
        variants: row.variants.map(v => v.id !== variantId ? v : { ...v, [field]: value })
      }
    }))
  }

  // Update variant's own atributo informativo
  const updateVariantAtributoInformativo = (
    parentIndex: number, 
    variantId: string, 
    attrIndex: number, 
    field: "key" | "value", 
    value: string
  ) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== parentIndex) return row
      return {
        ...row,
        variants: row.variants.map(v => {
          if (v.id !== variantId) return v
          const newAttrs = [...v.atributosInformativos]
          newAttrs[attrIndex] = { ...newAttrs[attrIndex], [field]: value }
          return { ...v, atributosInformativos: newAttrs }
        })
      }
    }))
  }

  // Add own atributo informativo to variant
  const addVariantAtributoInformativo = (parentIndex: number, variantId: string) => {
    setParentRows(prev => prev.map((row, i) => {
      if (i !== parentIndex) return row
      return {
        ...row,
        variants: row.variants.map(v => {
          if (v.id !== variantId) return v
          return { ...v, atributosInformativos: [...v.atributosInformativos, { key: "", value: "" }] }
        })
      }
    }))
  }

  // Get maximum atributos for columns calculation
  const getMaxAtributosPrincipales = () => {
    if (parentRows.length === 0) return 1 // Default to 1 column when no rows
    return Math.max(...parentRows.map(row => row.atributosPrincipales.length), 1)
  }

  const getMaxAtributosInformativos = () => {
    let max = 1
    parentRows.forEach(row => {
      max = Math.max(max, row.atributosInformativos.length)
      row.variants.forEach(v => {
        max = Math.max(max, v.atributosInformativos.length)
      })
    })
    return max
  }

  // Get dynamic columns for a section
  const getDynamicColumns = (section: Section, isChild: boolean = false) => {
    if (!section.isDynamic) return section.columns || []
    
    if (section.dynamicType === "atributosPrincipales") {
      const maxAttrs = getMaxAtributosPrincipales()
      const cols: string[] = []
      
      if (!isChild) {
        // Parent: key + tags input + generar button
        for (let i = 0; i < maxAttrs; i++) {
          cols.push(`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Tags`)
          if (i === 0 && maxAttrs === 1) {
            cols.push(`atributoPrincipalAdd`)
          } else if (i === 1) {
            cols.push(`atributoPrincipalRemove`)
          }
        }
        cols.push(`generarVariantes`)
      } else {
        // Child: key + value (readonly)
        for (let i = 0; i < maxAttrs; i++) {
          cols.push(`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Value`)
        }
        // Add placeholder columns to match parent width
        if (maxAttrs === 1) {
          cols.push(`atributoPrincipalAddPlaceholder`)
        } else if (maxAttrs === 2) {
          cols.push(`atributoPrincipalRemovePlaceholder`)
        }
        cols.push(`generarVariantesPlaceholder`)
      }
      return cols
    }
    
    if (section.dynamicType === "atributosInformativos") {
      const maxAttrs = getMaxAtributosInformativos()
      const cols: string[] = []
      for (let i = 0; i < maxAttrs; i++) {
        cols.push(`atributoInfo${i}Key`)
        cols.push(`atributoInfo${i}Value`)
        if (i === 0 && maxAttrs === 1) {
          cols.push(`atributoInfo${i}Add`)
        } else {
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

  // Get dynamic subheaders
  const getDynamicSubHeaders = (section: Section, isChild: boolean = false) => {
    if (!section.isDynamic) return section.subHeaders || []
    
    if (section.dynamicType === "atributosPrincipales") {
      const maxAttrs = getMaxAtributosPrincipales()
      const subHeaders: Array<{ label: string; cols: string[] }> = []
      
      if (!isChild) {
        for (let i = 0; i < maxAttrs; i++) {
          const cols = [`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Tags`]
          if (i === 0 && maxAttrs === 1) {
            cols.push(`atributoPrincipalAdd`)
          } else if (i === 1) {
            cols.push(`atributoPrincipalRemove`)
          }
          subHeaders.push({ label: `ATRIBUTO PRINCIPAL ${i + 1}`, cols })
        }
        subHeaders.push({ label: "VARIANTES", cols: [`generarVariantes`] })
      } else {
        for (let i = 0; i < maxAttrs; i++) {
          subHeaders.push({ 
            label: `ATRIBUTO ${i + 1}`, 
            cols: [`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Value`] 
          })
        }
      }
      return subHeaders
    }
    
    if (section.dynamicType === "atributosInformativos") {
      const maxAttrs = getMaxAtributosInformativos()
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

  // Calculate section width
  const getSectionWidth = (section: Section, isChild: boolean = false) => {
    const columns = getDynamicColumns(section, isChild)
    return columns.reduce((sum, col) => sum + getColWidth(col), 0)
  }

  // Calculate subheader width
  const getSubHeaderWidth = (cols: string[]) => {
    return cols.reduce((sum, col) => sum + getColWidth(col), 0)
  }

  // Calculate total table width
  const getTotalWidth = () => {
    let width = COL_WIDTHS.rowControls
    SECTIONS_CON_VARIANTES.forEach(section => {
      if (visibleSections[section.id]) {
        if (expandedSections[section.id]) {
          width += getSectionWidth(section)
        } else {
          width += 140
        }
      }
    })
    return width
  }

  // Get row height based on grid size
  const getRowHeight = () => {
    switch (gridSize) {
      case "sm": return "h-9"
      case "md": return "h-12"
      case "lg": return "h-16"
      default: return "h-9"
    }
  }

  const baseInputClass = "w-full h-full text-xs px-2 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
  const inactiveClass = "bg-gray-50 text-gray-400 cursor-not-allowed"

  // Render parent row cell
  const renderParentCell = (row: ParentRow, rowIndex: number, colId: string) => {
    switch (colId) {
      case "caracteres":
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            {row.titulo.length}
          </div>
        )
      
      case "titulo":
        return (
          <input
            type="text"
            value={row.titulo}
            onChange={(e) => updateParentRow(rowIndex, "titulo", e.target.value)}
            placeholder="Titulo del Producto"
            className={baseInputClass}
          />
        )
      
      case "skuPadre":
        return (
          <input
            type="text"
            value={row.skuPadre}
            onChange={(e) => updateParentRow(rowIndex, "skuPadre", e.target.value)}
            placeholder="Auto"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      
      case "codigoUniversal":
        return (
          <input
            type="text"
            value={row.codigoUniversal}
            onChange={(e) => updateParentRow(rowIndex, "codigoUniversal", e.target.value)}
            placeholder="N.A."
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      
      // Atributos principales with tags
      case "atributoPrincipal1Key":
      case "atributoPrincipal2Key": {
        const attrIndex = colId === "atributoPrincipal1Key" ? 0 : 1
        const attr = row.atributosPrincipales[attrIndex]
        if (!attr) return <div className={`w-full h-full ${inactiveClass}`} />
        return (
          <input
            type="text"
            value={attr.key}
            onChange={(e) => updateAtributoPrincipalKey(rowIndex, attrIndex, e.target.value)}
            placeholder="Ej: Color"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      }
      
      case "atributoPrincipal1Tags":
      case "atributoPrincipal2Tags": {
        const attrIndex = colId === "atributoPrincipal1Tags" ? 0 : 1
        const attr = row.atributosPrincipales[attrIndex]
        if (!attr) return <div className={`w-full h-full ${inactiveClass}`} />
        
        const inputKey = `${rowIndex}-${attrIndex}`
        const inputValue = tagInputs[inputKey] || ""
        
        return (
          <div className="w-full h-full flex items-center gap-1 px-1 overflow-hidden">
            {attr.tags.map((tag, tagIdx) => (
              <span 
                key={tagIdx} 
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-md flex-shrink-0"
              >
                {tag}
                <button 
                  onClick={() => removeTagFromAtributo(rowIndex, attrIndex, tagIdx)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setTagInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  addTagToAtributo(rowIndex, attrIndex, inputValue)
                }
              }}
              onBlur={() => addTagToAtributo(rowIndex, attrIndex, inputValue)}
              placeholder={attr.tags.length === 0 ? "Ej: Rojo, Azul" : "+"}
              className="flex-1 min-w-[40px] text-xs border-0 focus:outline-none bg-transparent placeholder:text-gray-300"
            />
          </div>
        )
      }
      
      case "atributoPrincipalAdd":
        return (
          <button
            onClick={() => addAtributoPrincipal(rowIndex)}
            disabled={row.atributosPrincipales.length >= 2}
            className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <Plus className="w-4 h-4" />
          </button>
        )
      
      case "atributoPrincipalRemove":
        return (
          <button
            onClick={() => removeAtributoPrincipal(rowIndex, 1)}
            className="w-full h-full flex items-center justify-center text-gray-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        )
      
      case "generarVariantes": {
        const hasValidAttrs = row.atributosPrincipales.some(a => a.key.trim() && a.tags.length > 0)
        return (
          <button
            onClick={() => generateVariants(rowIndex)}
            disabled={!hasValidAttrs}
            className={`w-full h-full flex items-center justify-center text-xs font-medium transition-colors ${
              hasValidAttrs 
                ? "bg-slate-800 text-white hover:bg-slate-700" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        )
      }
      
      // Info comercial
      case "categoria":
      case "marca":
      case "proveedor":
        return (
          <input
            type="text"
            value={row[colId as keyof ParentRow] as string}
            onChange={(e) => updateParentRow(rowIndex, colId as keyof ParentRow, e.target.value)}
            className={baseInputClass}
          />
        )
      
      case "codigoProveedor":
        // Always inactive in parent
        return <div className={`w-full h-full ${inactiveClass}`} />
      
      case "formatoVenta":
        return (
          <select
            value={row.formatoVenta}
            onChange={(e) => updateParentRow(rowIndex, "formatoVenta", e.target.value)}
            className={`${baseInputClass} cursor-pointer`}
          >
            <option value="unidad">unidad</option>
            <option value="pack">pack</option>
          </select>
        )
      
      case "unidadesPorPack": {
        const isDisabled = row.formatoVenta !== "pack"
        return (
          <input
            type="number"
            min="1"
            value={row.unidadesPorPack}
            onChange={(e) => updateParentRow(rowIndex, "unidadesPorPack", e.target.value)}
            disabled={isDisabled}
            className={`${baseInputClass} text-center ${isDisabled ? inactiveClass : ""}`}
          />
        )
      }
      
      case "volumenCantidad":
        return (
          <input
            type="text"
            value={row.volumenCantidad}
            onChange={(e) => updateParentRow(rowIndex, "volumenCantidad", e.target.value)}
            className={baseInputClass}
          />
        )
      
      case "volumenUnidad":
        return (
          <select
            value={row.volumenUnidad}
            onChange={(e) => updateParentRow(rowIndex, "volumenUnidad", e.target.value)}
            className={`${baseInputClass} cursor-pointer`}
          >
            <option value="">-</option>
            <option value="ml">ml</option>
            <option value="L">L</option>
            <option value="cm3">cm3</option>
            <option value="m3">m3</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
          </select>
        )
      
      case "vencimiento":
        return (
          <input
            type="date"
            value={row.vencimiento}
            onChange={(e) => updateParentRow(rowIndex, "vencimiento", e.target.value)}
            className={baseInputClass}
          />
        )
      
      // Stock - always inactive in parent
      case "stockTotal":
      case "stockReservado":
      case "stockDisponible":
        return <div className={`w-full h-full ${inactiveClass} flex items-center justify-center text-xs`}>-</div>
      
      // Media
      case "descripcion":
        return (
          <input
            type="text"
            value={row.descripcion}
            onChange={(e) => updateParentRow(rowIndex, "descripcion", e.target.value)}
            placeholder="Descripcion..."
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      
      case "fotoUrl":
        return (
          <input
            type="text"
            value={row.fotoUrl}
            onChange={(e) => updateParentRow(rowIndex, "fotoUrl", e.target.value)}
            placeholder="URL de imagen..."
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      
      default:
        // Handle dynamic atributos informativos
        if (colId.startsWith("atributoInfo")) {
          const match = colId.match(/atributoInfo(\d+)(Key|Value|Inherit|Add|Remove)/)
          if (match) {
            const attrIndex = parseInt(match[1])
            const field = match[2]
            const attr = row.atributosInformativos[attrIndex]
            
            if (field === "Key") {
              if (!attr) return <div className={`w-full h-full ${inactiveClass}`} />
              return (
                <input
                  type="text"
                  value={attr.key}
                  onChange={(e) => updateAtributoInformativo(rowIndex, attrIndex, "key", e.target.value)}
                  placeholder="Atributo"
                  className={`${baseInputClass} placeholder:text-gray-300`}
                />
              )
            }
            
            if (field === "Value") {
              if (!attr) return <div className={`w-full h-full ${inactiveClass}`} />
              // Value cell with inherit button inside - fixed width structure
              return (
                <div className="w-full h-full flex items-center">
                  <div className="flex-1 h-full min-w-0">
                    {attr.inherit ? (
                      <div className={`w-full h-full flex items-center px-2 text-xs text-gray-400 italic bg-blue-50/50`}>
                        Editable en hijos
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateAtributoInformativo(rowIndex, attrIndex, "value", e.target.value)}
                        placeholder="Valor"
                        className={`w-full h-full text-xs px-2 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white placeholder:text-gray-300`}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => toggleAtributoInherit(rowIndex, attrIndex)}
                    className={`w-7 h-full flex-shrink-0 flex items-center justify-center transition-colors border-l border-gray-200 ${
                      attr.inherit 
                        ? "text-blue-500 bg-blue-50" 
                        : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                    }`}
                    title={attr.inherit ? "Valor heredable (editable en hijos)" : "Valor fijo (copiado a hijos)"}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }
            
            if (field === "Add") {
              return (
                <button
                  onClick={() => addAtributoInformativo(rowIndex)}
                  className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )
            }
            
            if (field === "Remove") {
              if (!attr || row.atributosInformativos.length <= 1) {
                return <div className={`w-full h-full ${inactiveClass}`} />
              }
              return (
                <button
                  onClick={() => removeAtributoInformativo(rowIndex, attrIndex)}
                  className="w-full h-full flex items-center justify-center text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            }
          }
        }
        
        return <div className={`w-full h-full ${inactiveClass}`} />
    }
  }

  // Render child/variant row cell
  const renderChildCell = (
    parentRow: ParentRow, 
    parentIndex: number, 
    variant: VariantRow, 
    colId: string
  ) => {
    switch (colId) {
      // Obligatorio - inherited, inactive
      case "titulo":
        return (
          <div className={`w-full h-full flex items-center px-2 text-xs ${inactiveClass}`}>
            {parentRow.titulo}
          </div>
        )
      
      case "caracteres":
        return (
          <div className={`w-full h-full flex items-center justify-center text-xs ${inactiveClass}`}>
            {parentRow.titulo.length}
          </div>
        )
      
      // Datos principales - SKU auto-generated
      case "skuPadre": {
        const skuSuffix = variant.atributosPrincipales
          .map(a => a.value.substring(0, 3).toUpperCase())
          .join("-")
        const fullSku = parentRow.skuPadre ? `${parentRow.skuPadre}-${skuSuffix}` : skuSuffix
        return (
          <div className={`w-full h-full flex items-center px-2 text-xs font-mono ${inactiveClass}`}>
            {fullSku}
          </div>
        )
      }
      
      case "codigoUniversal":
        return (
          <div className={`w-full h-full flex items-center px-2 text-xs ${inactiveClass}`}>
            {parentRow.codigoUniversal}
          </div>
        )
      
      // Atributos principales - readonly, filled from generation
      case "atributoPrincipal1Key":
      case "atributoPrincipal2Key": {
        const attrIndex = colId === "atributoPrincipal1Key" ? 0 : 1
        const attr = variant.atributosPrincipales[attrIndex]
        return (
          <div className={`w-full h-full flex items-center px-2 text-xs ${inactiveClass}`}>
            {attr?.key || ""}
          </div>
        )
      }
      
      case "atributoPrincipal1Value":
      case "atributoPrincipal2Value": {
        const attrIndex = colId === "atributoPrincipal1Value" ? 0 : 1
        const attr = variant.atributosPrincipales[attrIndex]
        return (
          <div className={`w-full h-full flex items-center px-2 text-xs font-medium ${inactiveClass}`}>
            {attr?.value || ""}
          </div>
        )
      }
      
      case "atributoPrincipalAddPlaceholder":
      case "atributoPrincipalRemovePlaceholder":
      case "generarVariantesPlaceholder":
        return <div className={`w-full h-full ${inactiveClass}`} />
      
      // Info comercial - inherited except codigoProveedor
      case "categoria":
      case "marca":
      case "formatoVenta":
      case "unidadesPorPack":
      case "volumenCantidad":
      case "volumenUnidad":
      case "vencimiento":
      case "proveedor":
        return (
          <div className={`w-full h-full flex items-center px-2 text-xs ${inactiveClass}`}>
            {parentRow[colId as keyof ParentRow] as string}
          </div>
        )
      
      case "codigoProveedor":
        // Editable in children
        return (
          <input
            type="text"
            value={variant.codigoProveedor}
            onChange={(e) => updateVariant(parentIndex, variant.id, "codigoProveedor", e.target.value)}
            placeholder="Codigo..."
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      
      // Stock - editable in children
      case "stockTotal":
        return (
          <input
            type="number"
            value={variant.stockTotal}
            onChange={(e) => updateVariant(parentIndex, variant.id, "stockTotal", e.target.value)}
            onFocus={(e) => { if (e.target.value === "0") e.target.select() }}
            className={`${baseInputClass} text-center`}
          />
        )
      
      case "stockReservado":
        return (
          <input
            type="number"
            value={variant.stockReservado}
            onChange={(e) => updateVariant(parentIndex, variant.id, "stockReservado", e.target.value)}
            onFocus={(e) => { if (e.target.value === "0") e.target.select() }}
            className={`${baseInputClass} text-center`}
          />
        )
      
      case "stockDisponible": {
        const disponible = Math.max(0, (parseInt(variant.stockTotal) || 0) - (parseInt(variant.stockReservado) || 0))
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            {disponible}
          </div>
        )
      }
      
      // Media - editable in children
      case "descripcion":
        return (
          <input
            type="text"
            value={variant.descripcion}
            onChange={(e) => updateVariant(parentIndex, variant.id, "descripcion", e.target.value)}
            className={baseInputClass}
          />
        )
      
      case "fotoUrl":
        return (
          <input
            type="text"
            value={variant.fotoUrl}
            onChange={(e) => updateVariant(parentIndex, variant.id, "fotoUrl", e.target.value)}
            className={baseInputClass}
          />
        )
      
      default:
        // Handle atributos informativos
        if (colId.startsWith("atributoInfo")) {
          const match = colId.match(/atributoInfo(\d+)(Key|Value|Inherit|Add|Remove)/)
          if (match) {
            const attrIndex = parseInt(match[1])
            const field = match[2]
            const attr = variant.atributosInformativos[attrIndex]
            const parentAttr = parentRow.atributosInformativos[attrIndex]
            
            // Check if this is an inherited attribute
            const isInherited = parentAttr && parentAttr.key.trim() !== ""
            const isInheritEditable = isInherited && parentAttr.inherit
            
            if (field === "Key") {
              if (isInherited) {
                // Show inherited key as inactive
                return (
                  <div className={`w-full h-full flex items-center px-2 text-xs ${inactiveClass}`}>
                    {parentAttr.key}
                  </div>
                )
              }
              // Own attribute - editable
              if (!attr) return <div className={`w-full h-full ${inactiveClass}`} />
              return (
                <input
                  type="text"
                  value={attr.key}
                  onChange={(e) => updateVariantAtributoInformativo(parentIndex, variant.id, attrIndex, "key", e.target.value)}
                  placeholder="Atributo"
                  className={`${baseInputClass} placeholder:text-gray-300`}
                />
              )
            }
            
            if (field === "Inherit") {
              // Children don't have inherit button
              return <div className={`w-full h-full ${inactiveClass}`} />
            }
            
            if (field === "Value") {
              if (isInherited && !isInheritEditable) {
                // Fixed value - show as inactive
                return (
                  <div className={`w-full h-full flex items-center px-2 text-xs ${inactiveClass}`}>
                    {parentAttr.value}
                  </div>
                )
              }
              // Editable value when inherit is active
              if (isInheritEditable) {
                return (
                  <input
                    type="text"
                    value={attr?.value || ""}
                    onChange={(e) => updateVariantAtributoInformativo(parentIndex, variant.id, attrIndex, "value", e.target.value)}
                    placeholder={`Valor para ${parentAttr.key}`}
                    className={`${baseInputClass} placeholder:text-gray-300 bg-blue-50/30`}
                  />
                )
              }
              // Own attribute - editable
              if (!attr) return <div className={`w-full h-full ${inactiveClass}`} />
              return (
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateVariantAtributoInformativo(parentIndex, variant.id, attrIndex, "value", e.target.value)}
                  placeholder="Valor"
                  className={`${baseInputClass} placeholder:text-gray-300`}
                />
              )
            }
            
            if (field === "Add") {
              return (
                <button
                  onClick={() => addVariantAtributoInformativo(parentIndex, variant.id)}
                  className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )
            }
            
            if (field === "Remove") {
              // Can only remove own attributes (not inherited)
              if (isInherited || !attr) {
                return <div className={`w-full h-full ${inactiveClass}`} />
              }
              return (
                <button
                  onClick={() => {
                    setParentRows(prev => prev.map((row, i) => {
                      if (i !== parentIndex) return row
                      return {
                        ...row,
                        variants: row.variants.map(v => {
                          if (v.id !== variant.id) return v
                          return { ...v, atributosInformativos: v.atributosInformativos.filter((_, idx) => idx !== attrIndex) }
                        })
                      }
                    }))
                  }}
                  className="w-full h-full flex items-center justify-center text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            }
          }
        }
        
        return <div className={`w-full h-full ${inactiveClass}`} />
    }
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: getTotalWidth() }}>
        <thead>
          {/* Row 1: Section headers */}
          <tr className={getRowHeight()}>
            <th 
              rowSpan={3}
              className="border-r border-b border-gray-200 bg-slate-300 sticky left-0 z-20"
              style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
            />
            {SECTIONS_CON_VARIANTES.filter(section => visibleSections[section.id]).map((section) => {
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
                  title={isExpanded ? "Colapsar seccion" : "Expandir seccion"}
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
          <tr className={getRowHeight()}>
            {SECTIONS_CON_VARIANTES.filter(section => visibleSections[section.id]).map((section) => {
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
          
          {/* Row 3: Column labels */}
          <tr className={getRowHeight()}>
            {SECTIONS_CON_VARIANTES.filter(section => visibleSections[section.id]).map((section) => {
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
                let label = COLUMN_LABELS[colId] || ""
                if (colId.includes("Key")) label = "Atributo"
                if (colId.includes("Value")) label = "Valor"
                if (colId.includes("Tags")) label = "Valores"
                if (colId.includes("Add") || colId.includes("Remove") || colId.includes("Inherit") || colId.includes("Placeholder")) label = ""
                
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
        
                <tbody>
                {parentRows.length === 0 ? (
                  <tr>
                    <td colSpan={100} className="text-center py-12">
                      <button
                        onClick={() => setParentRows([createEmptyParentRow()])}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar primera fila
                      </button>
                    </td>
                  </tr>
                ) : parentRows.map((parentRow, parentIndex) => (
            <>
              {/* Parent Row */}
              <tr key={parentRow.id} className={`${getRowHeight()} group bg-slate-50/50`}>
                <td 
                  className="border-r border-b border-gray-200 sticky left-0 z-10 bg-white"
                  style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
                >
                  <div className="flex items-center justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => addParentRow(parentIndex)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Agregar agrupador"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  <button
                    onClick={() => removeParentRow(parentIndex)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar agrupador"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  </div>
                </td>
                
                {SECTIONS_CON_VARIANTES.filter(section => visibleSections[section.id]).map((section) => {
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
                        {renderParentCell(parentRow, parentIndex, colId)}
                      </td>
                    )
                  })
                })}
              </tr>
              
              {/* Variant/Child Rows */}
              {parentRow.variants.map((variant) => (
                <tr key={variant.id} className={`${getRowHeight()} group bg-white`}>
                  <td 
                    className="border-r border-b border-gray-200 sticky left-0 z-10 bg-white"
                    style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
                  >
                    <div className="flex items-center justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity pl-3">
                      <button
                        onClick={() => removeVariant(parentIndex, variant.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar variante"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  
                  {SECTIONS_CON_VARIANTES.filter(section => visibleSections[section.id]).map((section) => {
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
                    
                    const columns = getDynamicColumns(section, true)
                    return columns.map((colId) => {
                      const width = getColWidth(colId)
                      return (
                        <td
                          key={colId}
                          className="border-r border-b border-gray-200 p-0"
                          style={{ width, minWidth: width }}
                        >
                          {renderChildCell(parentRow, parentIndex, variant, colId)}
                        </td>
                      )
                    })
                  })}
                </tr>
                  ))}
                </>
                ))}
                </tbody>
      </table>
    </div>
  )
}

// Export sections, types and helper for parent to use
export { SECTIONS_CON_VARIANTES, createEmptyParentRow }
export type { ParentRow, VariantRow }
export default CreadorMasivoConVariantes
