"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { ChevronRight, ChevronLeft, Plus, X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useItems } from "@/hooks/use-items"

// Define column widths (in pixels) for consistent alignment
const COL_WIDTHS = {
  rowControls: 56,
  titulo: 200,
  caracteres: 100,
  sku: 140,
  codigoUniversal: 140,
  atributo1Key: 120,
  atributo1Value: 120,
  atributo2Key: 120,
  atributo2Value: 120,
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
  atributoInfoKey: 120,
  atributoInfoValue: 120,
  atributoInfoAdd: 50,
}

// Section definitions
const SECTIONS = [
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
    id: "atributos-principales", 
    label: "Atributos Principales", 
    defaultExpanded: false,
    columns: ["atributo1Key", "atributo1Value", "atributo2Key", "atributo2Value"],
    subHeaders: [
      { label: "ATRIBUTO 1", cols: ["atributo1Key", "atributo1Value"] },
      { label: "ATRIBUTO 2", cols: ["atributo2Key", "atributo2Value"] },
    ],
  },
  { 
    id: "info-comercial", 
    label: "Información Comercial", 
    defaultExpanded: false,
    columns: ["categoria", "marca", "formatoVenta", "unidadesPorPack", "volumenCantidad", "volumenUnidad", "vencimiento", "proveedor", "codigoProveedor"],
    subHeaders: [
      { label: "INFO DEL PRODUCTO", cols: ["categoria", "marca"] },
      { label: "PRESENTACIÓN", cols: ["formatoVenta", "unidadesPorPack"] },
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
    subHeaders: [{ label: "STOCK EN EL DEPÓSITO", cols: ["stockTotal", "stockReservado", "stockDisponible"] }],
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
    columns: ["atributoInfoKey", "atributoInfoValue", "atributoInfoAdd"],
    subHeaders: [{ label: "ATRIBUTO INFORMATIVO", cols: ["atributoInfoKey", "atributoInfoValue", "atributoInfoAdd"] }],
    canAddMore: true,
  },
]

// Column labels for the third row
const COLUMN_LABELS: Record<string, string> = {
  titulo: "Título",
  caracteres: "Cant. de Caracteres",
  sku: "SKU",
  codigoUniversal: "Código Universal",
  atributo1Key: "Atributo",
  atributo1Value: "Valor",
  atributo2Key: "Atributo",
  atributo2Value: "Valor",
  categoria: "Categoría",
  marca: "Marca",
  formatoVenta: "Formato de Venta",
  unidadesPorPack: "U. por Pack",
  volumenCantidad: "Cantidad",
  volumenUnidad: "U. de Medida",
  vencimiento: "Fecha",
  proveedor: "Proveedor",
  codigoProveedor: "Código Proveedor",
  stockTotal: "Total",
  stockReservado: "Reservado",
  stockDisponible: "Disponible",
  descripcion: "",
  fotoUrl: "",
  atributoInfoKey: "Atributo",
  atributoInfoValue: "Valor",
  atributoInfoAdd: "",
}

interface WorkableRow {
  id: string
  titulo: string
  sku: string
  codigoUniversal: string
  atributo1Key: string
  atributo1Value: string
  atributo2Key: string
  atributo2Value: string
  categoria: string
  marca: string
  formatoVenta: string
  unidadesPorPack: string
  volumenCantidad: string
  volumenUnidad: string
  vencimiento: string
  proveedor: string
  codigoProveedor: string
  stockTotal: string
  stockReservado: string
  descripcion: string
  fotoUrl: string
  atributosInformativos: Array<{ key: string; value: string }>
}

const createEmptyRow = (): WorkableRow => ({
  id: crypto.randomUUID(),
  titulo: "",
  sku: "",
  codigoUniversal: "",
  atributo1Key: "",
  atributo1Value: "",
  atributo2Key: "",
  atributo2Value: "",
  categoria: "",
  marca: "",
  formatoVenta: "unidad",
  unidadesPorPack: "1",
  volumenCantidad: "",
  volumenUnidad: "",
  vencimiento: "",
  proveedor: "",
  codigoProveedor: "",
  stockTotal: "0",
  stockReservado: "0",
  descripcion: "",
  fotoUrl: "",
  atributosInformativos: [{ key: "", value: "" }],
})

export default function CreadorMasivoPage() {
  const { bulkCreateItems } = useItems()
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: section.defaultExpanded }), {})
  )
  const [rows, setRows] = useState<WorkableRow[]>([createEmptyRow()])
  
  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Check if at least one row has a title
  const hasValidRows = rows.some(row => row.titulo.trim() !== "")
  
  // Check if all rows with any data have titles
  const allRowsValid = rows.every(row => row.titulo.trim() !== "")
  
  // Count rows that will be created (rows with titles)
  const rowsToCreateCount = rows.filter(row => row.titulo.trim() !== "").length

  // Handle crear button click
  const handleCrearClick = () => {
    if (!allRowsValid) {
      setShowErrorModal(true)
      return
    }
    setShowConfirmModal(true)
  }

  // Handle confirmed creation
  const handleConfirmCreate = async () => {
    setIsCreating(true)
    setShowConfirmModal(false)
    
    // Prepare items data from rows
    const itemsToCreate = rows
      .filter(row => row.titulo.trim() !== "")
      .map(row => {
        // Build atributos principales
        const atributosPrincipales: Array<{ key: string; value: string }> = []
        if (row.atributo1Key.trim() && row.atributo1Value.trim()) {
          atributosPrincipales.push({ key: row.atributo1Key, value: row.atributo1Value })
        }
        if (row.atributo2Key.trim() && row.atributo2Value.trim()) {
          atributosPrincipales.push({ key: row.atributo2Key, value: row.atributo2Value })
        }
        
        // Build atributos informativos
        const atributosInformativos = row.atributosInformativos
          .filter(attr => attr.key.trim() && attr.value.trim())
        
        // Check if volumenUnidad should be included
        const hasVolumenUnidad = row.volumenCantidad.trim() && row.volumenUnidad.trim()
        
        // Check if vencimiento should be included
        const hasVencimiento = row.vencimiento.trim()
        
        return {
          name: row.titulo.trim(),
          sku: row.sku.trim() || undefined,
          codigoUniversal: row.codigoUniversal.trim() || undefined,
          categoria: row.categoria.trim() || undefined,
          marca: row.marca.trim() || undefined,
          formatoVenta: row.formatoVenta,
          unidadesPorPack: row.formatoVenta === "pack" ? parseInt(row.unidadesPorPack) || 1 : 1,
          volumenActive: hasVolumenUnidad,
          volumenCantidad: hasVolumenUnidad ? row.volumenCantidad : undefined,
          volumenUnidad: hasVolumenUnidad ? row.volumenUnidad : undefined,
          vencimientoActive: hasVencimiento,
          fechaVencimiento: hasVencimiento ? row.vencimiento : undefined,
          proveedor: row.proveedor.trim() || undefined,
          codigoProveedor: row.codigoProveedor.trim() || undefined,
          atributosPrincipales: atributosPrincipales.length > 0 ? atributosPrincipales : undefined,
          atributosInformativos: atributosInformativos.length > 0 ? atributosInformativos : undefined,
          descripcion: row.descripcion.trim() || undefined,
          stockTotal: parseInt(row.stockTotal) || 0,
          stockReservado: parseInt(row.stockReservado) || 0,
          imagenUrl: row.fotoUrl.trim() || undefined,
        }
      })
    
    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Create items
    bulkCreateItems(itemsToCreate)
    
    // Reset to initial state
    setRows([createEmptyRow()])
    setIsCreating(false)
    
    // Show success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const breadcrumbs = [
    { label: "Inventario", href: "/inventario" },
    { label: "Creador Masivo", href: "/inventario/creador-masivo" },
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
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

  const updateAtributoInformativo = (rowIndex: number, attrIndex: number, field: "key" | "value", value: string) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const newAttrs = [...row.atributosInformativos]
      newAttrs[attrIndex] = { ...newAttrs[attrIndex], [field]: value }
      return { ...row, atributosInformativos: newAttrs }
    }))
  }

  // Calculate width for a section
  const getSectionWidth = (section: typeof SECTIONS[0]) => {
    return section.columns.reduce((sum, col) => sum + (COL_WIDTHS[col as keyof typeof COL_WIDTHS] || 100), 0)
  }

  // Calculate width for a subheader
  const getSubHeaderWidth = (cols: string[]) => {
    return cols.reduce((sum, col) => sum + (COL_WIDTHS[col as keyof typeof COL_WIDTHS] || 100), 0)
  }

  // Get visible columns based on expanded sections
  const getVisibleColumns = () => {
    const cols: string[] = []
    SECTIONS.forEach(section => {
      if (expandedSections[section.id]) {
        cols.push(...section.columns)
      }
    })
    return cols
  }

  // Calculate total table width
  const getTotalWidth = () => {
    let width = COL_WIDTHS.rowControls
    SECTIONS.forEach(section => {
      if (expandedSections[section.id]) {
        width += getSectionWidth(section)
      } else {
        width += 140 // Collapsed section width (wider to show title)
      }
    })
    return width
  }

  const renderCell = (row: WorkableRow, rowIndex: number, colId: string) => {
    const baseInputClass = "w-full h-full text-xs px-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
    
    switch (colId) {
      case "caracteres":
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            {row.titulo.length}
          </div>
        )
      case "stockDisponible":
        const disponible = Math.max(0, (parseInt(row.stockTotal) || 0) - (parseInt(row.stockReservado) || 0))
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
      case "atributo1Key":
      case "atributo2Key":
        const keyField = colId === "atributo1Key" ? "atributo1Key" : "atributo2Key"
        return (
          <input
            type="text"
            value={row[keyField]}
            onChange={(e) => updateRow(rowIndex, keyField, e.target.value)}
            placeholder="Ej: Talle"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "atributo1Value":
      case "atributo2Value":
        const valField = colId === "atributo1Value" ? "atributo1Value" : "atributo2Value"
        return (
          <input
            type="text"
            value={row[valField]}
            onChange={(e) => updateRow(rowIndex, valField, e.target.value)}
            placeholder="Ej: M"
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
      case "vencimiento":
        return (
          <input
            type="date"
            value={row.vencimiento}
            onChange={(e) => updateRow(rowIndex, "vencimiento", e.target.value)}
            className={`${baseInputClass} cursor-pointer`}
          />
        )
      case "proveedor":
        return (
          <input
            type="text"
            value={row.proveedor}
            onChange={(e) => updateRow(rowIndex, "proveedor", e.target.value)}
            placeholder="Proveedor"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
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
      case "stockTotal":
        return (
          <input
            type="number"
            min="0"
            value={row.stockTotal}
            onChange={(e) => updateRow(rowIndex, "stockTotal", e.target.value)}
            className={`${baseInputClass} text-center`}
          />
        )
      case "stockReservado":
        return (
          <input
            type="number"
            min="0"
            value={row.stockReservado}
            onChange={(e) => updateRow(rowIndex, "stockReservado", e.target.value)}
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
      case "atributoInfoKey":
        return (
          <input
            type="text"
            value={row.atributosInformativos[0]?.key || ""}
            onChange={(e) => updateAtributoInformativo(rowIndex, 0, "key", e.target.value)}
            placeholder="Ej: Material"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "atributoInfoValue":
        return (
          <input
            type="text"
            value={row.atributosInformativos[0]?.value || ""}
            onChange={(e) => updateAtributoInformativo(rowIndex, 0, "value", e.target.value)}
            placeholder="Ej: Algodón"
            className={`${baseInputClass} placeholder:text-gray-300`}
          />
        )
      case "atributoInfoAdd":
        return (
          <button
            onClick={() => addAtributoInformativo(rowIndex)}
            className="w-full h-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            title="Agregar atributo informativo"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        )
      default:
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
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
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
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 backdrop-blur-[2px] bg-transparent">
              <div className="w-full h-2 bg-transparent" />
              <div className="px-4 bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] mt-2 pt-1 pb-1 mx-4">
                <div className="px-4 pt-3 pb-3 pl-0 pr-0">
                  <div className="flex items-center justify-between border-b border-gray-200 border-none pl-0 pr-0 pb-0">
                    <div className="flex items-center gap-2 border-0 border-none ml-1.5 mr-0 flex-shrink-0">
                      <span className="text-sm text-gray-500">Creador Masivo de Items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleCrearClick}
                        disabled={!hasValidRows || isCreating}
                        variant="ghost"
                        size="sm"
                        className={`h-8 text-xs transition-colors border shadow-sm cursor-pointer ${
                          hasValidRows && !isCreating
                            ? "border-green-300 hover:bg-green-50 text-green-700"
                            : "border-[rgba(228,230,235,0.6)] text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Plus className={`w-3.5 h-3.5 mr-1.5 ${hasValidRows && !isCreating ? "text-green-600" : "text-gray-400"}`} />
                        {isCreating ? "Creando..." : "Crear"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Excel-like Grid with horizontal scroll */}
            <div className="border-gray-200 bg-transparent px-5 py-0 border-b-0 border-r-0">
              <div className="bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] overflow-x-auto">
                <table className="border-collapse" style={{ minWidth: getTotalWidth() }}>
                  {/* Row 1: Section Headers */}
                  <thead>
                    <tr className="h-10 bg-slate-100">
                      <th 
                        className="border-r border-b border-gray-200 bg-slate-200"
                        style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}
                      />
                      {SECTIONS.map((section) => {
                        const isExpanded = expandedSections[section.id]
                        const sectionWidth = isExpanded ? getSectionWidth(section) : 140
                        const colSpan = isExpanded ? section.columns.length : 1
                        
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
                      {SECTIONS.map((section) => {
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
                        
                        return section.subHeaders.map((subHeader, idx) => {
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
                      {SECTIONS.map((section) => {
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
                        
                        return section.columns.map((colId) => {
                          const width = COL_WIDTHS[colId as keyof typeof COL_WIDTHS] || 100
                          return (
                            <th
                              key={colId}
                              className="border-r border-b border-gray-300 bg-gray-50 px-2"
                              style={{ width, minWidth: width }}
                            >
                              <span className="text-[10px] font-medium text-gray-600">
                                {COLUMN_LABELS[colId] || ""}
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
                      <tr key={row.id} className="h-9 hover:bg-gray-50/50">
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
                        {SECTIONS.map((section) => {
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
                          
                          return section.columns.map((colId) => {
                            const width = COL_WIDTHS[colId as keyof typeof COL_WIDTHS] || 100
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
            </div>
          </div>
        </div>
      </div>

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
                Todos los items deben tener título. Completá los títulos faltantes, o eliminá las filas sobrantes.
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
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600">
                Vas a crear <span className="font-semibold text-gray-900">{rowsToCreateCount}</span> item{rowsToCreateCount !== 1 ? "s" : ""} individual{rowsToCreateCount !== 1 ? "es" : ""}.
              </p>
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
