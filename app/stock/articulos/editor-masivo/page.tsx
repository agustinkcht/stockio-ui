"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { ChevronRight, ChevronLeft, Plus, X, Check, AlertCircle, Eye, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useItems } from "@/hooks/use-items"
import { useAccount } from "@/lib/contexts/account-context"
import { CreadorMasivoConVariantes, SECTIONS_CON_VARIANTES, type ParentRow } from "@/components/creador-masivo/creador-masivo-con-variantes"
import type { Item } from "@/lib/types"

// ---- Column widths (same as creador masivo) ----
const COL_WIDTHS: Record<string, number> = {
  rowControls: 56,
  titulo: 200,
  caracteres: 100,
  sku: 140,
  codigoUniversal: 140,
  atributoPrincipal1Key: 100,
  atributoPrincipal1Value: 100,
  atributoPrincipal1Add: 40,
  atributoPrincipal2Key: 100,
  atributoPrincipal2Value: 100,
  atributoPrincipal2Remove: 40,
  categoria: 130,
  marca: 130,
  formatoVenta: 120,
  unidadesPorPack: 90,
  volumenCantidad: 90,
  volumenUnidad: 100,
  vencimiento: 150,
  proveedor: 130,
  codigoProveedor: 130,
  enStock: 80,
  stockReservado: 90,
  stockDisponible: 90,
  descripcion: 200,
  fotoUrl: 200,
}

const getColWidth = (colId: string): number => {
  if (colId.startsWith("atributoInfo")) {
    if (colId.includes("Key")) return 100
    if (colId.includes("Value")) return 100
    if (colId.includes("Add")) return 40
    if (colId.includes("Remove")) return 40
  }
  if (colId.startsWith("atributoPrincipal")) {
    if (colId.includes("Key")) return 100
    if (colId.includes("Value")) return 100
    if (colId.includes("Add")) return 40
    if (colId.includes("Remove")) return 40
  }
  return COL_WIDTHS[colId] || 100
}

interface Section {
  id: string
  label: string
  defaultExpanded: boolean
  columns?: string[]
  subHeaders?: Array<{ label: string; cols: string[] }>
  isDynamic?: boolean
  dynamicType?: "atributosPrincipales" | "atributosInformativos"
}

const SECTIONS: Section[] = [
  { id: "obligatorio", label: "Obligatorio", defaultExpanded: true, columns: ["titulo", "caracteres"], subHeaders: [{ label: "TITULO", cols: ["titulo", "caracteres"] }] },
  { id: "datos-principales", label: "Datos Principales", defaultExpanded: false, columns: ["sku", "codigoUniversal"], subHeaders: [{ label: "CODIGOS", cols: ["sku", "codigoUniversal"] }] },
  { id: "atributos-principales", label: "Atributos Principales", defaultExpanded: false, isDynamic: true, dynamicType: "atributosPrincipales" },
  { id: "info-comercial", label: "Informacion Comercial", defaultExpanded: false, columns: ["categoria", "marca", "formatoVenta", "unidadesPorPack", "volumenCantidad", "volumenUnidad", "vencimiento", "proveedor", "codigoProveedor"], subHeaders: [{ label: "INFO DEL PRODUCTO", cols: ["categoria", "marca"] }, { label: "PRESENTACION", cols: ["formatoVenta", "unidadesPorPack"] }, { label: "VOLUMEN DE LA UNIDAD", cols: ["volumenCantidad", "volumenUnidad"] }, { label: "VENCIMIENTO", cols: ["vencimiento"] }, { label: "INFO DEL PROVEEDOR", cols: ["proveedor", "codigoProveedor"] }] },
  { id: "stock", label: "Stock", defaultExpanded: false, columns: ["enStock", "stockReservado", "stockDisponible"], subHeaders: [{ label: "STOCK EN EL DEPOSITO", cols: ["enStock", "stockReservado", "stockDisponible"] }] },
  { id: "media", label: "Media", defaultExpanded: false, columns: ["descripcion", "fotoUrl"], subHeaders: [{ label: "DESCRIPCION", cols: ["descripcion"] }, { label: "FOTO (URL)", cols: ["fotoUrl"] }] },
  { id: "atributos-informativos", label: "Atributos Informativos", defaultExpanded: false, isDynamic: true, dynamicType: "atributosInformativos" },
]

const COLUMN_LABELS: Record<string, string> = {
  titulo: "Titulo",
  caracteres: "Cant. de Caracteres",
  sku: "SKU",
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
  enStock: "En Stock",
  stockReservado: "Reservado",
  stockDisponible: "Disponible",
  descripcion: "",
  fotoUrl: "",
}

// ---- WorkableRow (standalone) ----
interface WorkableRow {
  id: string
  originalSku: string // Track the original SKU for saving back
  titulo: string
  sku: string
  codigoUniversal: string
  atributosPrincipales: Array<{ key: string; value: string }>
  categoria: string
  marca: string
  formatoVenta: string
  unidadesPorPack: string
  volumenCantidad: string
  volumenUnidad: string
  vencimiento: string
  proveedor: string
  codigoProveedor: string
  enStock: string
  stockReservado: string
  descripcion: string
  fotoUrl: string
  atributosInformativos: Array<{ key: string; value: string }>
}

// ---- Convert Item -> WorkableRow ----
function itemToWorkableRow(item: Item): WorkableRow {
  return {
    id: crypto.randomUUID(),
    originalSku: item.sku || "",
    titulo: item.name || "",
    sku: item.sku || "",
    codigoUniversal: item.codigoUniversal || "",
    atributosPrincipales: item.atributosPrincipales && item.atributosPrincipales.length > 0
      ? item.atributosPrincipales.map(a => ({ key: a.key, value: a.value }))
      : [{ key: "", value: "" }],
    categoria: item.categoria || "",
    marca: item.marca || "",
    formatoVenta: item.formatoVenta || "unidad",
    unidadesPorPack: item.unidadesPorPack ? String(item.unidadesPorPack) : "1",
    volumenCantidad: item.volumenCantidad ? String(item.volumenCantidad) : "",
    volumenUnidad: item.volumenUnidad || "",
    vencimiento: item.fechaVencimiento || "",
    proveedor: item.proveedor || "",
    codigoProveedor: item.codigoProveedor || "",
    enStock: item.stock?.enStock || "0",
    stockReservado: item.stock?.reservado || "0",
    descripcion: item.descripcion || "",
    fotoUrl: item.imagenUrl || "",
    atributosInformativos: item.atributosInformativos && item.atributosInformativos.length > 0
      ? item.atributosInformativos.map(a => ({ key: a.key, value: a.value }))
      : [{ key: "", value: "" }],
  }
}

// ---- Convert Item con variantes -> ParentRow ----
function itemConVariantesToParentRow(item: Item): ParentRow {
  const containerAttrs = item.containerAtributosPrincipales || []
  const atributosPrincipales = containerAttrs.length > 0
    ? containerAttrs.map(a => ({ key: a.key, tags: a.variantes || [] }))
    : [{ key: "", tags: [] as string[] }]

  const atributosInformativos = item.atributosInformativos && item.atributosInformativos.length > 0
    ? item.atributosInformativos.map(a => ({ key: a.key, value: a.value, inherit: false }))
    : [{ key: "", value: "", inherit: false }]

  const variants = (item.variants || []).map(v => ({
    id: crypto.randomUUID(),
    parentId: "", // will be set below
    atributosPrincipales: v.atributosPrincipales?.map(a => ({ key: a.key, value: a.value })) || [],
    codigoProveedor: v.codigoProveedor || "",
    enStock: v.stock?.enStock || "0",
    stockReservado: v.stock?.reservado || "0",
    descripcion: (v as any).descripcion || item.descripcion || "",
    fotoUrl: (v as any).foto || (v as any).fotoUrl || item.imagenUrl || "",
    atributosInformativos: (v as any).atributosInformativos?.map((a: any) => ({ key: a.key, value: a.value })) || [],
  }))

  const parentId = crypto.randomUUID()
  const row: ParentRow = {
    id: parentId,
    titulo: item.name || "",
    skuPadre: item.sku || "",
    codigoUniversal: item.codigoUniversal || "",
    atributosPrincipales,
    categoria: item.categoria || "",
    marca: item.marca || "",
    formatoVenta: item.formatoVenta || "unidad",
    unidadesPorPack: item.unidadesPorPack ? String(item.unidadesPorPack) : "1",
    volumenCantidad: item.volumenCantidad ? String(item.volumenCantidad) : "",
    volumenUnidad: item.volumenUnidad || "",
    vencimiento: item.fechaVencimiento || "",
    proveedor: item.proveedor || "",
    descripcion: item.descripcion || "",
    fotoUrl: item.imagenUrl || "",
    atributosInformativos,
    variants: variants.map(v => ({ ...v, parentId })),
  }
  return row
}

export default function EditorMasivoPage() {
  const router = useRouter()
  const { items, setItems, forceSaveItems } = useItems()
  const { currentAccount } = useAccount()
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [editorMode, setEditorMode] = useState<"standalone" | "conVariantes">("standalone")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultExpanded }), {})
  )
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
  )
  const [visibleSectionsConVariantes, setVisibleSectionsConVariantes] = useState<Record<string, boolean>>(
    SECTIONS_CON_VARIANTES.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
  )

  // Workable rows
  const [rows, setRows] = useState<WorkableRow[]>([])
  const [parentRows, setParentRows] = useState<ParentRow[]>([])
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("sm")

  // Snapshots for undo
  const [originalRows, setOriginalRows] = useState<WorkableRow[]>([])
  const [originalParentRows, setOriginalParentRows] = useState<ParentRow[]>([])

  // Change tracking
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // Load items from sessionStorage on mount
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    if (items.length === 0 || isLoaded) return

    const skusJson = sessionStorage.getItem("editor-masivo-skus")
    if (!skusJson) {
      router.push("/stock/articulos")
      return
    }

    const selectedSkus: string[] = JSON.parse(skusJson)
    if (selectedSkus.length === 0) {
      router.push("/stock/articulos")
      return
    }

    // Separate standalone items and parent items (items con variantes)
    const standaloneItems: Item[] = []
    const parentItemsMap = new Map<string, Item>() // parent SKU -> parent Item

    for (const sku of selectedSkus) {
      // Check if this SKU is a standalone item
      const standaloneMatch = items.find(i => i.sku === sku && !i.hasVariants && !i.isAgrupador)
      if (standaloneMatch) {
        standaloneItems.push(standaloneMatch)
        continue
      }

      // Check if this SKU belongs to a variant child
      for (const item of items) {
        if (item.hasVariants && item.variants) {
          const variant = item.variants.find(v => v.sku === sku)
          if (variant && item.sku) {
            // Add the parent item to the map (deduplicates)
            if (!parentItemsMap.has(item.sku)) {
              parentItemsMap.set(item.sku, item)
            }
            break
          }
        }
      }
    }

    // Convert to WorkableRows and ParentRows
    const standaloneRows = standaloneItems.map(itemToWorkableRow)
    const conVariantesRows = Array.from(parentItemsMap.values()).map(itemConVariantesToParentRow)

    setRows(standaloneRows.length > 0 ? standaloneRows : [])
    setParentRows(conVariantesRows.length > 0 ? conVariantesRows : [])
    // Store originals for undo
    setOriginalRows(JSON.parse(JSON.stringify(standaloneRows)))
    setOriginalParentRows(JSON.parse(JSON.stringify(conVariantesRows)))

    // Auto-select the right mode
    if (standaloneRows.length > 0 && conVariantesRows.length === 0) {
      setEditorMode("standalone")
    } else if (conVariantesRows.length > 0 && standaloneRows.length === 0) {
      setEditorMode("conVariantes")
    }

    setIsLoaded(true)
  }, [items, isLoaded, router])

  // Detect changes by comparing current state to original state
  useEffect(() => {
    if (!isLoaded) return
    const currentRowsJson = JSON.stringify(rows)
    const originalRowsJson = JSON.stringify(originalRows)
    const currentParentRowsJson = JSON.stringify(parentRows)
    const originalParentRowsJson = JSON.stringify(originalParentRows)
    setHasChanges(currentRowsJson !== originalRowsJson || currentParentRowsJson !== originalParentRowsJson)
  }, [rows, parentRows, originalRows, originalParentRows, isLoaded])

  // ---- Deshacer (undo all changes) ----
  const handleDeshacer = () => {
    setRows(JSON.parse(JSON.stringify(originalRows)))
    setParentRows(JSON.parse(JSON.stringify(originalParentRows)))
  }

  // ---- Guardar (save changes to localStorage) ----
  const handleGuardar = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 400))

    // Build updated items array
    const updatedItems = [...items]

    // Update standalone items
    for (const row of rows) {
      const idx = updatedItems.findIndex(i => i.sku === row.originalSku)
      if (idx === -1) continue

      const item = updatedItems[idx]
      const atributosPrincipales = row.atributosPrincipales.filter(a => a.key.trim() && a.value.trim())
      const atributosInformativos = row.atributosInformativos.filter(a => a.key.trim() && a.value.trim())
      const hasVolumen = row.volumenCantidad.trim() && row.volumenUnidad.trim()

      updatedItems[idx] = {
        ...item,
        name: row.titulo.trim(),
        sku: row.sku.trim() || item.sku,
        codigoUniversal: row.codigoUniversal.trim() || undefined,
        categoria: row.categoria.trim() || undefined,
        marca: row.marca.trim() || undefined,
        formatoVenta: row.formatoVenta,
        unidadesPorPack: row.formatoVenta === "pack" ? parseInt(row.unidadesPorPack) || 1 : 1,
        volumenActive: !!hasVolumen,
        volumenCantidad: hasVolumen ? Number(row.volumenCantidad) : undefined,
        volumenUnidad: hasVolumen ? row.volumenUnidad : undefined,
        vencimientoActive: !!row.vencimiento.trim(),
        fechaVencimiento: row.vencimiento.trim() || undefined,
        proveedor: row.proveedor.trim() || undefined,
        codigoProveedor: row.codigoProveedor.trim() || undefined,
        descripcion: row.descripcion.trim() || undefined,
        imagenUrl: row.fotoUrl.trim() || undefined,
        stock: {
          enStock: row.enStock || "0",
          reservado: row.stockReservado || "0",
          disponible: String(Math.max(0, (parseInt(row.enStock) || 0) - (parseInt(row.stockReservado) || 0))),
        },
        atributosPrincipales: atributosPrincipales.length > 0 ? atributosPrincipales : undefined,
        atributosInformativos: atributosInformativos.length > 0 ? atributosInformativos : undefined,
      }
    }

    // Update items con variantes
    for (const parentRow of parentRows) {
      const idx = updatedItems.findIndex(i => i.sku === parentRow.skuPadre)
      if (idx === -1) continue

      const item = updatedItems[idx]
      const hasVolumen = parentRow.volumenCantidad.trim() && parentRow.volumenUnidad.trim()

      const containerAtributosPrincipales = parentRow.atributosPrincipales
        .filter(a => a.key.trim() && a.tags.length > 0)
        .map(a => ({ key: a.key, variantes: a.tags }))

      const atributosInformativos = parentRow.atributosInformativos
        .filter(a => a.key.trim() && (a.value.trim() || a.inherit))
        .map(a => ({ key: a.key, value: a.inherit ? "" : a.value }))

      // Update variants
      const updatedVariants = parentRow.variants.map(v => {
        const skuSuffix = (v.atributosPrincipales || [])
          .filter(a => a && a.value)
          .map(a => a.value.substring(0, 3).toUpperCase())
          .join("-")
        
        return {
          name: `${parentRow.titulo} - ${(v.atributosPrincipales || []).map(a => a.value).join(" / ")}`,
          sku: `${parentRow.skuPadre}-${skuSuffix}`,
          codigoUniversal: "",
          stock: {
            enStock: v.enStock || "0",
            reservado: v.stockReservado || "0",
            disponible: String(Math.max(0, (parseInt(v.enStock || "0")) - (parseInt(v.stockReservado || "0")))),
          },
          atributosPrincipales: (v.atributosPrincipales || []).filter(a => a.key && a.value),
          codigoProveedor: v.codigoProveedor || undefined,
          descripcion: v.descripcion || parentRow.descripcion,
          foto: v.fotoUrl || parentRow.fotoUrl,
        }
      })

      updatedItems[idx] = {
        ...item,
        name: parentRow.titulo.trim(),
        sku: parentRow.skuPadre.trim() || item.sku,
        codigoUniversal: parentRow.codigoUniversal.trim() || undefined,
        categoria: parentRow.categoria.trim() || undefined,
        marca: parentRow.marca.trim() || undefined,
        formatoVenta: parentRow.formatoVenta,
        unidadesPorPack: parentRow.formatoVenta === "pack" ? parseInt(parentRow.unidadesPorPack) || 1 : 1,
        volumenActive: !!hasVolumen,
        volumenCantidad: hasVolumen ? Number(parentRow.volumenCantidad) : undefined,
        volumenUnidad: hasVolumen ? parentRow.volumenUnidad : undefined,
        vencimientoActive: !!parentRow.vencimiento.trim(),
        fechaVencimiento: parentRow.vencimiento.trim() || undefined,
        proveedor: parentRow.proveedor.trim() || undefined,
        descripcion: parentRow.descripcion.trim() || undefined,
        imagenUrl: parentRow.fotoUrl.trim() || undefined,
        containerAtributosPrincipales: containerAtributosPrincipales.length > 0 ? containerAtributosPrincipales : undefined,
        atributosInformativos: atributosInformativos.length > 0 ? atributosInformativos : undefined,
        variants: updatedVariants as any,
      }
    }

    // Persist via the shared hook so all useItems instances sync
    setItems(updatedItems)
    forceSaveItems(updatedItems)

    // Update originals so changes reset
    setOriginalRows(JSON.parse(JSON.stringify(rows)))
    setOriginalParentRows(JSON.parse(JSON.stringify(parentRows)))

    setIsSaving(false)
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const toggleSectionVisibilityConVariantes = (sectionId: string) => {
    if (sectionId === "obligatorio") return
    setVisibleSectionsConVariantes(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const breadcrumbs = [
    { label: "Stock", href: "/stock" },
    { label: "Articulos", href: "/stock/articulos" },
    { label: "Editor Masivo", href: "/stock/articulos/editor-masivo" },
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const toggleSectionVisibility = (sectionId: string) => {
    if (sectionId === "obligatorio") return
    setVisibleSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const addRow = (afterIndex: number) => {
    const newRows = [...rows]
    const emptyRow: WorkableRow = {
      id: crypto.randomUUID(),
      originalSku: "",
      titulo: "",
      sku: "",
      codigoUniversal: "",
      atributosPrincipales: [{ key: "", value: "" }],
      categoria: "",
      marca: "",
      formatoVenta: "unidad",
      unidadesPorPack: "1",
      volumenCantidad: "",
      volumenUnidad: "",
      vencimiento: "",
      proveedor: "",
      codigoProveedor: "",
      enStock: "0",
      stockReservado: "0",
      descripcion: "",
      fotoUrl: "",
      atributosInformativos: [{ key: "", value: "" }],
    }
    newRows.splice(afterIndex + 1, 0, emptyRow)
    setRows(newRows)
  }

  const removeRow = (index: number) => {
    if (rows.length === 1) return
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (rowIndex: number, field: keyof WorkableRow, value: string) => {
    setRows(prev => prev.map((row, i) => i !== rowIndex ? row : { ...row, [field]: value }))
  }

  const addAtributoPrincipal = (rowIndex: number) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex || row.atributosPrincipales.length >= 2) return row
      return { ...row, atributosPrincipales: [...row.atributosPrincipales, { key: "", value: "" }] }
    }))
  }

  const removeAtributoPrincipal = (rowIndex: number, attrIndex: number) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex || row.atributosPrincipales.length <= 1) return row
      return { ...row, atributosPrincipales: row.atributosPrincipales.filter((_, idx) => idx !== attrIndex) }
    }))
  }

  const updateAtributoPrincipal = (rowIndex: number, attrIndex: number, field: "key" | "value", value: string) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const newAttrs = [...row.atributosPrincipales]
      newAttrs[attrIndex] = { ...newAttrs[attrIndex], [field]: value }
      return { ...row, atributosPrincipales: newAttrs }
    }))
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

  const getMaxAtributos = (type: "atributosPrincipales" | "atributosInformativos") => {
    if (rows.length === 0) return 1
    return Math.max(...rows.map(row => row[type].length))
  }

  const getDynamicColumns = (section: typeof SECTIONS[0]) => {
    if (!section.isDynamic) return section.columns || []
    if (section.dynamicType === "atributosPrincipales") {
      const maxAttrs = getMaxAtributos("atributosPrincipales")
      const cols: string[] = []
      for (let i = 0; i < maxAttrs; i++) {
        cols.push(`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Value`)
        if (i === 0 && maxAttrs === 1) cols.push(`atributoPrincipal1Add`)
        else if (i === 1) cols.push(`atributoPrincipal2Remove`)
      }
      return cols
    }
    if (section.dynamicType === "atributosInformativos") {
      const maxAttrs = getMaxAtributos("atributosInformativos")
      const cols: string[] = []
      for (let i = 0; i < maxAttrs; i++) {
        cols.push(`atributoInfo${i}Key`, `atributoInfo${i}Value`)
        if (i === 0 && maxAttrs === 1) cols.push(`atributoInfo${i}Add`)
        else {
          cols.push(`atributoInfo${i}Remove`)
          if (i === maxAttrs - 1) cols.push(`atributoInfo${i}Add`)
        }
      }
      return cols
    }
    return []
  }

  const getDynamicSubHeaders = (section: typeof SECTIONS[0]) => {
    if (!section.isDynamic) return section.subHeaders || []
    if (section.dynamicType === "atributosPrincipales") {
      const maxAttrs = getMaxAtributos("atributosPrincipales")
      const subHeaders: Array<{ label: string; cols: string[] }> = []
      for (let i = 0; i < maxAttrs; i++) {
        const cols = [`atributoPrincipal${i + 1}Key`, `atributoPrincipal${i + 1}Value`]
        if (i === 0 && maxAttrs === 1) cols.push(`atributoPrincipal1Add`)
        else if (i === 1) cols.push(`atributoPrincipal2Remove`)
        subHeaders.push({ label: `ATRIBUTO PRINCIPAL ${i + 1}`, cols })
      }
      return subHeaders
    }
    if (section.dynamicType === "atributosInformativos") {
      const maxAttrs = getMaxAtributos("atributosInformativos")
      const subHeaders: Array<{ label: string; cols: string[] }> = []
      for (let i = 0; i < maxAttrs; i++) {
        const cols = [`atributoInfo${i}Key`, `atributoInfo${i}Value`]
        if (i === 0 && maxAttrs === 1) cols.push(`atributoInfo${i}Add`)
        else {
          cols.push(`atributoInfo${i}Remove`)
          if (i === maxAttrs - 1) cols.push(`atributoInfo${i}Add`)
        }
        subHeaders.push({ label: "ATRIBUTO INFORMATIVO", cols })
      }
      return subHeaders
    }
    return []
  }

  const getSectionWidth = (section: typeof SECTIONS[0]) => {
    const columns = getDynamicColumns(section)
    return columns.reduce((sum, col) => sum + getColWidth(col), 0)
  }

  const getSubHeaderWidth = (cols: string[]) => {
    return cols.reduce((sum, col) => sum + getColWidth(col), 0)
  }

  const getTotalWidth = () => {
    let width = COL_WIDTHS.rowControls
    SECTIONS.forEach(section => {
      if (visibleSections[section.id]) {
        if (expandedSections[section.id]) width += getSectionWidth(section)
        else width += 140
      }
    })
    return width
  }

  const getRowHeight = () => {
    switch (gridSize) {
      case "sm": return "h-9"
      case "md": return "h-12"
      case "lg": return "h-16"
      default: return "h-9"
    }
  }

  const renderCell = (row: WorkableRow, rowIndex: number, colId: string) => {
    const baseInputClass = "w-full h-full text-xs px-2 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"

    switch (colId) {
      case "caracteres":
        return <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">{row.titulo.length}</div>
      case "stockDisponible":
        return <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">{Math.max(0, (parseInt(row.enStock) || 0) - (parseInt(row.stockReservado) || 0))}</div>
      case "formatoVenta":
        return <select value={row.formatoVenta} onChange={e => updateRow(rowIndex, "formatoVenta", e.target.value)} className={`${baseInputClass} cursor-pointer`}><option value="unidad">unidad</option><option value="pack">pack</option></select>
      case "volumenUnidad":
        return <select value={row.volumenUnidad} onChange={e => updateRow(rowIndex, "volumenUnidad", e.target.value)} className={`${baseInputClass} cursor-pointer`}><option value="">-</option><option value="ml">ml</option><option value="L">L</option><option value="cm3">cm3</option><option value="m3">m3</option><option value="g">g</option><option value="kg">kg</option></select>
      case "unidadesPorPack":
        const isDisabled = row.formatoVenta !== "pack"
        return <input type="number" min="1" value={row.unidadesPorPack} onChange={e => updateRow(rowIndex, "unidadesPorPack", e.target.value)} disabled={isDisabled} className={`${baseInputClass} text-center ${isDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`} />
      case "titulo":
        return <input type="text" value={row.titulo} onChange={e => updateRow(rowIndex, "titulo", e.target.value)} placeholder="Titulo" className={baseInputClass} />
      case "sku":
        return <input type="text" value={row.sku} onChange={e => updateRow(rowIndex, "sku", e.target.value)} placeholder="SKU" className={`${baseInputClass} placeholder:text-gray-300`} />
      case "codigoUniversal":
        return <input type="text" value={row.codigoUniversal} onChange={e => updateRow(rowIndex, "codigoUniversal", e.target.value)} placeholder="N.A." className={`${baseInputClass} placeholder:text-gray-300`} />
      case "vencimiento":
        return <input type="date" value={row.vencimiento} onChange={e => updateRow(rowIndex, "vencimiento", e.target.value)} className={baseInputClass} />
      case "enStock":
        return <input type="number" min="0" value={row.enStock} onChange={e => updateRow(rowIndex, "enStock", e.target.value)} className={`${baseInputClass} text-center`} />
      case "stockReservado":
        return <input type="number" min="0" value={row.stockReservado} onChange={e => updateRow(rowIndex, "stockReservado", e.target.value)} className={`${baseInputClass} text-center`} />
      case "descripcion":
        return <input type="text" value={row.descripcion} onChange={e => updateRow(rowIndex, "descripcion", e.target.value)} placeholder="Descripcion" className={`${baseInputClass} placeholder:text-gray-300`} />
      case "fotoUrl":
        return <input type="text" value={row.fotoUrl} onChange={e => updateRow(rowIndex, "fotoUrl", e.target.value)} placeholder="URL de imagen" className={`${baseInputClass} placeholder:text-gray-300`} />
      default:
        // Simple fields
        const simpleFields: Record<string, keyof WorkableRow> = {
          categoria: "categoria",
          marca: "marca",
          proveedor: "proveedor",
          codigoProveedor: "codigoProveedor",
          volumenCantidad: "volumenCantidad",
        }
        if (simpleFields[colId]) {
          return <input type="text" value={row[simpleFields[colId]] as string} onChange={e => updateRow(rowIndex, simpleFields[colId], e.target.value)} placeholder={COLUMN_LABELS[colId] || ""} className={`${baseInputClass} placeholder:text-gray-300`} />
        }

        // Atributos principales
        const attrPrincipalMatch = colId.match(/^atributoPrincipal(\d+)(Key|Value|Add|Remove)$/)
        if (attrPrincipalMatch) {
          const attrIndex = parseInt(attrPrincipalMatch[1]) - 1
          const fieldType = attrPrincipalMatch[2]
          if (fieldType === "Key") return <input type="text" value={row.atributosPrincipales[attrIndex]?.key || ""} onChange={e => updateAtributoPrincipal(rowIndex, attrIndex, "key", e.target.value)} placeholder="Ej: Color" className={`${baseInputClass} placeholder:text-gray-300`} />
          if (fieldType === "Value") return <input type="text" value={row.atributosPrincipales[attrIndex]?.value || ""} onChange={e => updateAtributoPrincipal(rowIndex, attrIndex, "value", e.target.value)} placeholder="Ej: Rojo" className={`${baseInputClass} placeholder:text-gray-300`} />
          if (fieldType === "Add") return <div className="w-full h-full flex items-center justify-center"><button onClick={() => addAtributoPrincipal(rowIndex)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer rounded" title="Agregar atributo"><Plus className="w-4 h-4 text-gray-400" /></button></div>
          if (fieldType === "Remove") return <div className="w-full h-full flex items-center justify-center"><button onClick={() => removeAtributoPrincipal(rowIndex, attrIndex)} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer rounded" title="Eliminar atributo"><X className="w-4 h-4 text-red-400" /></button></div>
        }

        // Atributos informativos
        const attrInfoMatch = colId.match(/^atributoInfo(\d+)(Key|Value|Add|Remove)$/)
        if (attrInfoMatch) {
          const attrIndex = parseInt(attrInfoMatch[1])
          const fieldType = attrInfoMatch[2]
          if (fieldType === "Key") return <input type="text" value={row.atributosInformativos[attrIndex]?.key || ""} onChange={e => updateAtributoInformativo(rowIndex, attrIndex, "key", e.target.value)} placeholder="Ej: Material" className={`${baseInputClass} placeholder:text-gray-300`} />
          if (fieldType === "Value") return <input type="text" value={row.atributosInformativos[attrIndex]?.value || ""} onChange={e => updateAtributoInformativo(rowIndex, attrIndex, "value", e.target.value)} placeholder="Ej: Algodon" className={`${baseInputClass} placeholder:text-gray-300`} />
          if (fieldType === "Remove") return <div className="w-full h-full flex items-center justify-center"><button onClick={() => removeAtributoInformativo(rowIndex, attrIndex)} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer rounded" title="Eliminar atributo informativo"><X className="w-4 h-4 text-red-400" /></button></div>
          if (fieldType === "Add") return <div className="w-full h-full flex items-center justify-center"><button onClick={() => addAtributoInformativo(rowIndex)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer rounded" title="Agregar atributo informativo"><Plus className="w-4 h-4 text-gray-400" /></button></div>
        }
        return null
    }
  }

  const standaloneCount = rows.length
  const conVariantesCount = parentRows.length

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
                {isSaving && (
                  <div className="w-full max-w-[200px] h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary animate-loading-bar bg-[length:200%_100%]" />
                  </div>
                )}

                {showSaveSuccess && !isSaving && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Cambios Guardados</span>
                  </div>
                )}

                {hasChanges && !showSaveSuccess && !isSaving && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                    <button
                      onClick={handleDeshacer}
                      className="px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all cursor-pointer text-red-700 text-sm font-medium"
                      title="Deshacer cambios"
                    >
                      Deshacer
                    </button>
                    <button
                      onClick={handleGuardar}
                      className="px-4 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-all cursor-pointer text-green-700 text-sm font-medium"
                      title="Guardar cambios"
                    >
                      Guardar
                    </button>
                  </div>
                )}
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
                    <div className="flex items-center gap-4 border-0 border-none ml-1.5 mr-0 flex-shrink-0">
                      <span className="text-sm text-gray-500">Editor Masivo de Items</span>

                      {/* Mode Switcher */}
                      {(standaloneCount > 0 || conVariantesCount > 0) && (
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                          {standaloneCount > 0 && (
                            <button
                              onClick={() => setEditorMode("standalone")}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                editorMode === "standalone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              Items Standalone ({standaloneCount})
                            </button>
                          )}
                          {conVariantesCount > 0 && (
                            <button
                              onClick={() => setEditorMode("conVariantes")}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                editorMode === "conVariantes" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              Items con Variantes ({conVariantesCount})
                            </button>
                          )}
                        </div>
                      )}

                      {/* Section Visibility Dropdown */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Secciones</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3" align="start">
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Mostrar/Ocultar Secciones</div>
                            {(editorMode === "standalone" ? SECTIONS : SECTIONS_CON_VARIANTES).map(section => (
                              <div key={section.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`section-editor-${section.id}`}
                                  checked={editorMode === "standalone" ? visibleSections[section.id] : visibleSectionsConVariantes[section.id]}
                                  onCheckedChange={() => editorMode === "standalone" ? toggleSectionVisibility(section.id) : toggleSectionVisibilityConVariantes(section.id)}
                                  disabled={section.id === "obligatorio"}
                                  className={section.id === "obligatorio" ? "opacity-50 cursor-not-allowed" : ""}
                                />
                                <label htmlFor={`section-editor-${section.id}`} className={`text-xs ${section.id === "obligatorio" ? "text-gray-500 cursor-not-allowed" : "text-gray-700 cursor-pointer"}`}>
                                  {section.label}
                                  {section.id === "obligatorio" && <span className="ml-1 text-[10px] text-gray-400">(requerido)</span>}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Grid Size Selector */}
                      <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
                        {(["sm", "md", "lg"] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => setGridSize(size)}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                              gridSize === size ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {size.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* No Crear button here - this is editor, not creator */}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Content */}
            <div className="border-gray-200 bg-transparent px-5 py-0 border-b-0 border-r-0">
              {editorMode === "standalone" ? (
                rows.length > 0 ? (
                  <div className="bg-white border rounded-lg shadow-sm border-[rgba(228,230,235,0.5)] overflow-x-auto">
                    <table className="border-collapse" style={{ minWidth: getTotalWidth() }}>
                      <thead>
                        {/* Row 1: Section Headers */}
                        <tr className="h-10 bg-slate-100">
                          <th className="border-r border-b border-gray-200 bg-slate-200" style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }} />
                          {SECTIONS.filter(s => visibleSections[s.id]).map(section => {
                            const isExpanded = expandedSections[section.id]
                            const columns = getDynamicColumns(section)
                            const sectionWidth = isExpanded ? getSectionWidth(section) : 140
                            const colSpan = isExpanded ? columns.length : 1
                            return (
                              <th key={section.id} colSpan={colSpan} className="border-r border-b border-gray-200 px-2 cursor-pointer hover:bg-slate-150 transition-colors bg-slate-300 text-background" style={{ width: sectionWidth, minWidth: sectionWidth }} onClick={() => toggleSection(section.id)} title={isExpanded ? "Colapsar seccion" : "Expandir seccion"}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold truncate flex-1 text-left text-slate-900">{section.label}</span>
                                  <div className="flex-shrink-0">{isExpanded ? <ChevronLeft className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}</div>
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                        {/* Row 2: Sub-headers */}
                        <tr className="h-8 bg-slate-50">
                          <th className="border-r border-b border-gray-200 bg-slate-100" style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }} />
                          {SECTIONS.filter(s => visibleSections[s.id]).map(section => {
                            const isExpanded = expandedSections[section.id]
                            if (!isExpanded) return <th key={section.id} className="border-r border-b border-gray-200 bg-slate-50" style={{ width: 140, minWidth: 140 }} />
                            const subHeaders = getDynamicSubHeaders(section)
                            return subHeaders.map((subHeader, idx) => (
                              <th key={`${section.id}-sub-${idx}`} colSpan={subHeader.cols.length} className="border-r border-b border-gray-200 px-2 bg-slate-200" style={{ width: getSubHeaderWidth(subHeader.cols), minWidth: getSubHeaderWidth(subHeader.cols) }}>
                                <span className="text-[10px] font-medium text-gray-500 uppercase">{subHeader.label}</span>
                              </th>
                            ))
                          })}
                        </tr>
                        {/* Row 3: Column Labels */}
                        <tr className="h-8 bg-gray-50">
                          <th className="border-r border-b border-gray-300 bg-slate-100" style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }} />
                          {SECTIONS.filter(s => visibleSections[s.id]).map(section => {
                            const isExpanded = expandedSections[section.id]
                            if (!isExpanded) return <th key={section.id} className="border-r border-b border-gray-200 bg-white" style={{ width: 140, minWidth: 140 }} />
                            const columns = getDynamicColumns(section)
                            return columns.map(colId => {
                              const width = getColWidth(colId)
                              let label = COLUMN_LABELS[colId] || ""
                              if (colId.includes("Key")) label = "Atributo"
                              if (colId.includes("Value")) label = "Valor"
                              if (colId.includes("Add") || colId.includes("Remove")) label = ""
                              return <th key={colId} className="border-r border-b border-gray-300 bg-gray-50 px-2" style={{ width, minWidth: width }}><span className="text-[10px] font-medium text-gray-600">{label}</span></th>
                            })
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr key={row.id} className={`${getRowHeight()} hover:bg-gray-50/50`}>
                            <td className="border-r border-b border-gray-200 bg-white" style={{ width: COL_WIDTHS.rowControls, minWidth: COL_WIDTHS.rowControls }}>
                              <div className="flex items-center justify-center gap-1 h-full">
                                <button onClick={() => addRow(rowIndex)} className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Agregar fila debajo"><Plus className="w-3.5 h-3.5 text-green-600" /></button>
                                <button onClick={() => removeRow(rowIndex)} disabled={rows.length === 1} className={`p-1 rounded transition-colors ${rows.length === 1 ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-red-500 cursor-pointer"}`} title="Eliminar fila"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                            {SECTIONS.filter(s => visibleSections[s.id]).map(section => {
                              const isExpanded = expandedSections[section.id]
                              if (!isExpanded) return <td key={section.id} className="border-r border-b border-gray-200 bg-gray-50" style={{ width: 140, minWidth: 140 }} />
                              const columns = getDynamicColumns(section)
                              return columns.map(colId => {
                                const width = getColWidth(colId)
                                return <td key={colId} className="border-r border-b border-gray-200 p-0" style={{ width, minWidth: width }}>{renderCell(row, rowIndex, colId)}</td>
                              })
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                    No hay items standalone seleccionados para editar.
                  </div>
                )
              ) : (
                parentRows.length > 0 ? (
                  <CreadorMasivoConVariantes
                    gridSize={gridSize}
                    setGridSize={setGridSize}
                    parentRows={parentRows}
                    setParentRows={setParentRows}
                    visibleSections={visibleSectionsConVariantes}
                  />
                ) : (
                  <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                    No hay items con variantes seleccionados para editar.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
