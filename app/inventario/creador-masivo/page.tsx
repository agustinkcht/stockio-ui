"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS, VOLUMEN_UNITS } from "@/lib/constants"
import { ChevronRight, ChevronLeft, Plus, X, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

// Section definitions based on the CSV structure
const SECTIONS = [
  { id: "obligatorio", label: "Obligatorio", defaultExpanded: true },
  { id: "datos-principales", label: "Datos Principales", defaultExpanded: false },
  { id: "atributos-principales", label: "Atributos Principales", defaultExpanded: false },
  { id: "info-comercial", label: "Información Comercial", defaultExpanded: false },
  { id: "stock", label: "Stock", defaultExpanded: false },
  { id: "media", label: "Media", defaultExpanded: false },
  { id: "atributos-informativos", label: "Atributos Informativos", defaultExpanded: false },
]

// Column definitions with section grouping
const COLUMN_GROUPS = {
  "obligatorio": {
    subHeader: "Título",
    columns: [
      { id: "titulo", label: "Título", width: "200px", placeholder: "Título" },
      { id: "caracteres", label: "Cant. de Caracteres", width: "80px", type: "readonly" },
    ],
  },
  "datos-principales": {
    subHeader: "Códigos",
    columns: [
      { id: "sku", label: "SKU", width: "140px", placeholder: "Generar Automáticamente" },
      { id: "codigoUniversal", label: "Código Universal", width: "140px", placeholder: "N.A." },
    ],
  },
  "atributos-principales": {
    subHeaders: ["Atributo 1", "Atributo 2"],
    columns: [
      { id: "atributo1Key", label: "Atributo", width: "120px", placeholder: "Ej: Talle" },
      { id: "atributo1Value", label: "Valor", width: "120px", placeholder: "Ej: M" },
      { id: "atributo2Key", label: "Atributo", width: "120px", placeholder: "Ej: Color" },
      { id: "atributo2Value", label: "Valor", width: "120px", placeholder: "Ej: Negro" },
    ],
  },
  "info-comercial": {
    subHeaders: ["Info del producto", "Presentación", "Volumen de la unidad", "Vencimiento", "Información del Proveedor"],
    columns: [
      { id: "categoria", label: "Categoría", width: "130px", placeholder: "Categoría", type: "text" },
      { id: "marca", label: "Marca", width: "130px", placeholder: "Marca", type: "text" },
      { id: "formatoVenta", label: "Formato de Venta", width: "120px", type: "select", options: ["unidad", "pack"], default: "unidad" },
      { id: "unidadesPorPack", label: "U. por Pack", width: "80px", type: "number", default: "1" },
      { id: "volumenCantidad", label: "Cantidad", width: "80px", placeholder: "Ej: 750", type: "number" },
      { id: "volumenUnidad", label: "U. de Medida", width: "90px", type: "select", options: ["ml", "L", "cm³", "m³"] },
      { id: "vencimientoDia", label: "Día", width: "60px", placeholder: "", type: "number" },
      { id: "vencimientoMes", label: "Mes", width: "60px", placeholder: "", type: "number" },
      { id: "vencimientoAnio", label: "Año", width: "70px", placeholder: "", type: "number" },
      { id: "proveedor", label: "Proveedor", width: "130px", placeholder: "Proveedor", type: "text" },
      { id: "codigoProveedor", label: "Código Proveedor", width: "120px", placeholder: "", type: "text" },
    ],
  },
  "stock": {
    subHeader: "Stock en el depósito",
    columns: [
      { id: "stockTotal", label: "Total", width: "70px", type: "number", default: "0" },
      { id: "stockReservado", label: "Reservado", width: "70px", type: "number", default: "0" },
      { id: "stockDisponible", label: "Disponible", width: "70px", type: "readonly" },
    ],
  },
  "media": {
    subHeaders: ["Descripción", "Foto (url)"],
    columns: [
      { id: "descripcion", label: "", width: "200px", placeholder: "Descripción", type: "textarea" },
      { id: "fotoUrl", label: "", width: "200px", placeholder: "Foto (url)", type: "text" },
    ],
  },
  "atributos-informativos": {
    subHeader: "Atributo Informativo",
    columns: [
      { id: "atributoInfoKey", label: "Atributo", width: "120px", placeholder: "Ej: Material" },
      { id: "atributoInfoValue", label: "Valor", width: "120px", placeholder: "Ej: Algodón" },
    ],
    canAddMore: true,
  },
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
  vencimientoDia: string
  vencimientoMes: string
  vencimientoAnio: string
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
  vencimientoDia: "",
  vencimientoMes: "",
  vencimientoAnio: "",
  proveedor: "",
  codigoProveedor: "",
  stockTotal: "0",
  stockReservado: "0",
  descripcion: "",
  fotoUrl: "",
  atributosInformativos: [{ key: "", value: "" }],
})

export default function CreadorMasivoPage() {
  const router = useRouter()
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: section.defaultExpanded }), {})
  )
  const [rows, setRows] = useState<WorkableRow[]>([createEmptyRow()])

  const breadcrumbs = [
    { label: "Inventario", href: "/inventario" },
    { label: "Creador Masivo", href: "/inventario/creador-masivo" },
  ]

  const handleDropdownMouseEnter = (index: number) => setHoveredDropdown(index)
  const handleDropdownMouseLeave = () => setHoveredDropdown(null)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const addRow = (afterIndex: number) => {
    const newRows = [...rows]
    newRows.splice(afterIndex + 1, 0, createEmptyRow())
    setRows(newRows)
  }

  const removeRow = (index: number) => {
    if (rows.length === 1) return // Keep at least one row
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (rowIndex: number, field: keyof WorkableRow, value: string) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      return { ...row, [field]: value }
    }))
  }

  const addAtributoInformativo = (rowIndex: number) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      return {
        ...row,
        atributosInformativos: [...row.atributosInformativos, { key: "", value: "" }],
      }
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

  const getCharacterCount = (titulo: string) => titulo.length

  const getDisponible = (total: string, reservado: string) => {
    const t = parseInt(total) || 0
    const r = parseInt(reservado) || 0
    return Math.max(0, t - r).toString()
  }

  const renderCell = (
    row: WorkableRow,
    rowIndex: number,
    columnId: string,
    column: any
  ) => {
    // Special handling for readonly fields
    if (column.type === "readonly") {
      if (columnId === "caracteres") {
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            {getCharacterCount(row.titulo)}
          </div>
        )
      }
      if (columnId === "stockDisponible") {
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            {getDisponible(row.stockTotal, row.stockReservado)}
          </div>
        )
      }
    }

    // Select fields
    if (column.type === "select") {
      const value = row[columnId as keyof WorkableRow] as string
      const isUnidadesPorPackDisabled = columnId === "unidadesPorPack" && row.formatoVenta !== "pack"
      
      if (columnId === "formatoVenta" || columnId === "volumenUnidad") {
        return (
          <select
            value={value || column.default || ""}
            onChange={(e) => updateRow(rowIndex, columnId as keyof WorkableRow, e.target.value)}
            className="w-full h-full text-xs px-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer"
          >
            {columnId === "volumenUnidad" && <option value="">-</option>}
            {column.options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      }
      
      if (columnId === "unidadesPorPack") {
        return (
          <input
            type="number"
            min="1"
            value={value || "1"}
            onChange={(e) => updateRow(rowIndex, columnId as keyof WorkableRow, e.target.value)}
            disabled={isUnidadesPorPackDisabled}
            className={`w-full h-full text-xs px-2 text-center border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
              isUnidadesPorPackDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
            }`}
          />
        )
      }
    }

    // Number fields
    if (column.type === "number") {
      const value = row[columnId as keyof WorkableRow] as string
      return (
        <input
          type="number"
          min="0"
          value={value || ""}
          onChange={(e) => updateRow(rowIndex, columnId as keyof WorkableRow, e.target.value)}
          placeholder={column.placeholder || ""}
          className="w-full h-full text-xs px-2 text-center border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        />
      )
    }

    // Textarea fields
    if (column.type === "textarea") {
      const value = row[columnId as keyof WorkableRow] as string
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => updateRow(rowIndex, columnId as keyof WorkableRow, e.target.value)}
          placeholder={column.placeholder || ""}
          className="w-full h-full text-xs px-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        />
      )
    }

    // Default text input
    const value = row[columnId as keyof WorkableRow] as string
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => updateRow(rowIndex, columnId as keyof WorkableRow, e.target.value)}
        placeholder={column.placeholder || ""}
        className="w-full h-full text-xs px-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen">
        <div className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
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
            {/* Toolbar - empty for now */}
            <div className="sticky top-0 z-10 backdrop-blur-[2px] bg-slate-50">
              <div className="w-full h-2 bg-transparent" />
              <div className="px-4 bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] mt-2 pt-1 pb-1 mx-4">
                <div className="px-4 pt-3 pb-3 pl-0 pr-0">
                  <div className="flex items-center justify-between border-b border-gray-200 border-none pl-0 pr-0 pb-0">
                    <div className="flex items-center gap-2 border-0 border-none ml-1.5 mr-0 flex-shrink-0">
                      {/* Toolbar buttons will go here */}
                      <span className="text-sm text-gray-500">Creador Masivo de Items</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Excel-like Grid */}
            <div className="flex-1 overflow-auto px-4 py-4">
              <div className="bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] overflow-hidden">
                {/* Section Tab Header */}
                <div className="flex h-10 bg-slate-100 border-b border-gray-200">
                  {/* Empty cell for row controls */}
                  <div className="w-14 flex-shrink-0 border-r border-gray-200" />
                  
                  {SECTIONS.map((section) => {
                    const isExpanded = expandedSections[section.id]
                    const sectionConfig = COLUMN_GROUPS[section.id as keyof typeof COLUMN_GROUPS]
                    const columnCount = sectionConfig?.columns?.length || 0
                    
                    return (
                      <div
                        key={section.id}
                        className={`flex items-center justify-between px-3 border-r border-gray-200 transition-all ${
                          isExpanded ? "" : "w-10"
                        }`}
                        style={isExpanded ? { minWidth: `${columnCount * 100}px` } : {}}
                      >
                        {isExpanded && (
                          <span className="text-xs font-semibold text-gray-700 truncate flex-1">
                            {section.label}
                          </span>
                        )}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors cursor-pointer flex-shrink-0"
                          title={isExpanded ? "Colapsar sección" : "Expandir sección"}
                        >
                          {isExpanded ? (
                            <ChevronLeft className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Sub-headers Row (Row 2 from CSV) */}
                <div className="flex h-8 bg-slate-50 border-b border-gray-200">
                  <div className="w-14 flex-shrink-0 border-r border-gray-200" />
                  
                  {SECTIONS.map((section) => {
                    const isExpanded = expandedSections[section.id]
                    const sectionConfig = COLUMN_GROUPS[section.id as keyof typeof COLUMN_GROUPS]
                    
                    if (!isExpanded) {
                      return <div key={section.id} className="w-10 border-r border-gray-200 flex-shrink-0" />
                    }
                    
                    // Handle sections with multiple sub-headers
                    if ('subHeaders' in sectionConfig && sectionConfig.subHeaders) {
                      return (
                        <div key={section.id} className="flex border-r border-gray-200">
                          {sectionConfig.subHeaders.map((subHeader, idx) => {
                            // Calculate width based on columns belonging to this subheader
                            let colCount = 2 // Default for pairs
                            if (section.id === "info-comercial") {
                              if (idx === 0) colCount = 2 // Info del producto (categoria, marca)
                              else if (idx === 1) colCount = 2 // Presentación (formato, unidades)
                              else if (idx === 2) colCount = 2 // Volumen (cantidad, unidad)
                              else if (idx === 3) colCount = 3 // Vencimiento (dia, mes, año)
                              else if (idx === 4) colCount = 2 // Proveedor (proveedor, codigo)
                            } else if (section.id === "media") {
                              colCount = 1
                            }
                            
                            return (
                              <div
                                key={subHeader}
                                className="flex items-center justify-center px-2 text-[10px] font-medium text-gray-500 uppercase border-r border-gray-100 last:border-r-0"
                                style={{ minWidth: `${colCount * 100}px` }}
                              >
                                {subHeader}
                              </div>
                            )
                          })}
                        </div>
                      )
                    }
                    
                    // Single sub-header
                    const subHeader = 'subHeader' in sectionConfig ? sectionConfig.subHeader : ""
                    return (
                      <div
                        key={section.id}
                        className="flex items-center justify-center px-2 text-[10px] font-medium text-gray-500 uppercase border-r border-gray-200"
                        style={{ minWidth: `${(sectionConfig?.columns?.length || 1) * 100}px` }}
                      >
                        {subHeader}
                      </div>
                    )
                  })}
                </div>

                {/* Column Labels Row (Row 3 from CSV) */}
                <div className="flex h-8 bg-gray-50 border-b border-gray-300">
                  <div className="w-14 flex-shrink-0 border-r border-gray-200" />
                  
                  {SECTIONS.map((section) => {
                    const isExpanded = expandedSections[section.id]
                    const sectionConfig = COLUMN_GROUPS[section.id as keyof typeof COLUMN_GROUPS]
                    
                    if (!isExpanded) {
                      return <div key={section.id} className="w-10 border-r border-gray-200 flex-shrink-0" />
                    }
                    
                    return (
                      <div key={section.id} className="flex border-r border-gray-200">
                        {sectionConfig?.columns?.map((col, idx) => (
                          <div
                            key={col.id}
                            className="flex items-center justify-center px-1 text-[10px] font-medium text-gray-600 border-r border-gray-100 last:border-r-0"
                            style={{ width: col.width, minWidth: col.width }}
                          >
                            {col.label}
                          </div>
                        ))}
                        {/* Add button cell for atributos informativos */}
                        {section.id === "atributos-informativos" && (
                          <div className="w-10 flex items-center justify-center border-l border-gray-100" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Workable Rows */}
                {rows.map((row, rowIndex) => (
                  <div key={row.id} className="flex h-9 border-b border-gray-200 hover:bg-blue-50/30">
                    {/* Row controls */}
                    <div className="w-14 flex-shrink-0 border-r border-gray-200 flex items-center justify-center gap-1 bg-gray-50">
                      <button
                        onClick={() => addRow(rowIndex)}
                        className="p-0.5 hover:bg-green-100 rounded transition-colors cursor-pointer"
                        title="Agregar fila"
                      >
                        <Plus className="w-3.5 h-3.5 text-green-600" />
                      </button>
                      <button
                        onClick={() => removeRow(rowIndex)}
                        className={`p-0.5 rounded transition-colors ${
                          rows.length === 1 
                            ? "text-gray-300 cursor-not-allowed" 
                            : "hover:bg-red-100 text-red-600 cursor-pointer"
                        }`}
                        title="Eliminar fila"
                        disabled={rows.length === 1}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Data cells */}
                    {SECTIONS.map((section) => {
                      const isExpanded = expandedSections[section.id]
                      const sectionConfig = COLUMN_GROUPS[section.id as keyof typeof COLUMN_GROUPS]
                      
                      if (!isExpanded) {
                        return <div key={section.id} className="w-10 border-r border-gray-200 flex-shrink-0 bg-gray-50" />
                      }

                      return (
                        <div key={section.id} className="flex border-r border-gray-200">
                          {section.id === "atributos-informativos" ? (
                            <>
                              {/* Render all atributos informativos for this row */}
                              {row.atributosInformativos.map((attr, attrIdx) => (
                                <div key={attrIdx} className="flex">
                                  <div
                                    className="border-r border-gray-100"
                                    style={{ width: "120px", minWidth: "120px" }}
                                  >
                                    <input
                                      type="text"
                                      value={attr.key}
                                      onChange={(e) => updateAtributoInformativo(rowIndex, attrIdx, "key", e.target.value)}
                                      placeholder="Ej: Material"
                                      className="w-full h-full text-xs px-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                                    />
                                  </div>
                                  <div
                                    className="border-r border-gray-100"
                                    style={{ width: "120px", minWidth: "120px" }}
                                  >
                                    <input
                                      type="text"
                                      value={attr.value}
                                      onChange={(e) => updateAtributoInformativo(rowIndex, attrIdx, "value", e.target.value)}
                                      placeholder="Ej: Algodón"
                                      className="w-full h-full text-xs px-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                                    />
                                  </div>
                                </div>
                              ))}
                              {/* Add button */}
                              <div className="w-10 flex items-center justify-center border-l border-gray-100">
                                <button
                                  onClick={() => addAtributoInformativo(rowIndex)}
                                  className="p-1 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                  title="Agregar atributo informativo"
                                >
                                  <Plus className="w-3 h-3 text-blue-600" />
                                </button>
                              </div>
                            </>
                          ) : (
                            sectionConfig?.columns?.map((col) => (
                              <div
                                key={col.id}
                                className="border-r border-gray-100 last:border-r-0"
                                style={{ width: col.width, minWidth: col.width }}
                              >
                                {renderCell(row, rowIndex, col.id, col)}
                              </div>
                            ))
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
