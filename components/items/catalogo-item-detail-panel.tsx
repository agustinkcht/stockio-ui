"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import type { Item } from "@/lib/types"
import { ChevronDown, Plus, Copy, X, Minus, Check, ArrowDownToLine, Pencil, Upload, Layers, Maximize2, Minimize2, Info, MoreVertical, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { TEMPLATES } from "@/lib/constants" // DEPOSITS and SAVED_ATRIBUTOS imports removed
import { getItemPhoto } from "@/lib/utils/category-images"
import { generateId } from "@/lib/utils/item-utils"
import Image from "next/image"
import { NuevaVarianteModal } from "@/components/modals/nueva-variante-modal"
import { StockEditModal } from "@/components/modals/stock-edit-modal"
import { PrecioEditModal } from "@/components/modals/precio-edit-modal"
import { useSettings } from "@/lib/contexts/settings-context"
import { NuevoProveedorModal } from "@/components/modals/nuevo-proveedor-modal"
import { useProveedores } from "@/hooks/use-proveedores"
import type { Proveedor } from "@/lib/data/proveedores"
// import { Breadcrumb } from "@/components/layout/breadcrumb"

// Single deposit for simplified stock management
const DEPOSITS = ["Torcuato"]

// Child SKU editor with local state for suffix editing
function ChildSkuEditor({ fatherSku, skuSuffix, onSave }: { fatherSku: string; skuSuffix: string; onSave: (suffix: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [localSuffix, setLocalSuffix] = useState(skuSuffix)

  useEffect(() => {
    setLocalSuffix(skuSuffix)
  }, [skuSuffix])

  const prefix = `${fatherSku}-`

  return (
    <div className="flex items-center gap-0 flex-1 group/sku-inner">
      <span className="font-mono text-slate-400/80 whitespace-nowrap select-none">
        {prefix}
      </span>
      {editing ? (
        <input
          type="text"
          value={localSuffix}
          onChange={(e) => setLocalSuffix(e.target.value)}
          onBlur={() => {
            setEditing(false)
            if (localSuffix !== skuSuffix) {
              onSave(localSuffix)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur()
            if (e.key === "Escape") {
              setLocalSuffix(skuSuffix)
              setEditing(false)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-slate-100 bg-transparent border-b border-white/40 focus:border-white outline-none w-full max-w-[120px]"
          autoFocus
        />
      ) : (
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
        >
          <span className="text-slate-100">{localSuffix}</span>
          <Pencil className="w-3 h-3 text-white/40 opacity-0 group-hover/sku:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  )
}

interface ItemDetailPanelProps {
  selectedItem: Item
  selectedDetailTab: string
  setSelectedDetailTab: (tab: string) => void
  expandedItems: Set<string>
  toggleVariantExpansion: (sku: string) => void
  updateStock: (sku: string, field: "total" | "reservado", value: number) => void
  updateItem: (sku: string, updates: Partial<Item>) => void
  allItems: Item[]
  onDynamicContentChange?: (content: React.ReactNode) => void
  item: any
  onClose: () => void
  onFieldChange: (itemSku: string, field: string, value: any) => void
  isSaving?: boolean
  onDuplicate?: (item: any) => void
  onDelete?: (item: any) => void
  variantChangeHandlers: any
  isExpanded?: boolean
  onSaveNow?: () => void
  onShowToast?: (label: string) => void
}

export function CatalogoItemDetailPanel({
  selectedItem,
  selectedDetailTab,
  setSelectedDetailTab,
  expandedItems,
  toggleVariantExpansion,
  updateStock,
  updateItem,
  allItems,
  onDynamicContentChange,
  item,
  onClose,
  onFieldChange,
  isSaving,
  onDuplicate,
  onDelete,
  variantChangeHandlers,
  isExpanded = true,
  onSaveNow,
  onShowToast,
}: ItemDetailPanelProps) {
  const router = useRouter()
  const { catalogo, stock, precios } = useSettings()

  // Safety check: ensure selectedItem is a valid object, not a string or null
  if (!selectedItem || typeof selectedItem === 'string') {
    console.error("[v0] CatalogoItemDetailPanel: selectedItem is invalid:", selectedItem)
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Item no encontrado o datos inválidos.
      </div>
    )
  }

  const isViewingContainer = selectedItem?.isAgrupador || selectedItem?.hasVariants || false

  // Find the parent item that contains this child - prioritize ID match for accuracy
  const fatherItem = !isViewingContainer
    ? allItems.find(
      (item) => (item.hasVariants || item.isAgrupador) && item.variants?.some((v: any) =>
        v.id === selectedItem.id  // ID is unique and should be the primary match
      ),
    )
    : null

  const isChildItem = fatherItem !== null && fatherItem !== undefined

  const shouldStrictlyInherit = (fieldValue: any) => {
    return isChildItem && fatherItem && fieldValue !== undefined && fieldValue !== null
  }

  const shouldInheritField = (fieldValue: any) => {
    return isChildItem && fatherItem && fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
  }

  // Merge parent's atributosInformativos with child's following inheritance rules:
  // Case 1 (Locked): Parent has key+value -> inherit complete pair as read-only
  // Case 2 (Key-only): Parent has key with empty value -> child can fill its own value
  // Case 3 (Exclusive): Child can have additional attributes not in parent
  const getMergedAtributosInformativos = (
    parentAttrs: Array<{ key: string; value: string; inheritValue?: boolean; inherit?: boolean }> | undefined,
    childAttrs: Array<{ key: string; value: string; inheritValue?: boolean; inherit?: boolean }> | undefined,
  ): Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean; inheritValue?: boolean }> => {
    if (!isChildItem || !fatherItem) {
      // Not a child item, just return child's attributes (normalizing inherit/inheritValue to inheritValue)
      return (childAttrs || []).map(attr => ({
        ...attr,
        keyOpen: false,
        valueOpen: false,
        inheritValue: attr.inheritValue || attr.inherit || false
      }))
    }

    const result: Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }> = []
    const childMap = new Map<string, { key: string; value: string }>()

      // Build a map of child's attributes by key
      ; (childAttrs || []).forEach(attr => {
        childMap.set(attr.key, attr)
      })

      // First, add all parent attributes (Case 1 and Case 2)
      ; (parentAttrs || []).forEach(parentAttr => {
        const childAttr = childMap.get(parentAttr.key)

        // Normalize inherit/inheritValue property
        const inheritFlag = parentAttr.inheritValue || parentAttr.inherit || false

        // Case 2 is now determined by inheritValue flag (or empty value for backward compatibility)
        const isCase2 = inheritFlag || (!parentAttr.value && inheritFlag !== false)

        if (!isCase2 && parentAttr.value) {
          // Case 1: Parent has value filled and not marked for inherit - use parent's complete pair (locked)
          result.push({ key: parentAttr.key, value: parentAttr.value, keyOpen: false, valueOpen: false, inheritValue: false })
        } else if (isCase2) {
          // Case 2: Parent marked inheritValue - child can fill value
          result.push({
            key: parentAttr.key,
            value: childAttr?.value || "",
            keyOpen: false,
            valueOpen: false,
            inheritValue: true
          })
        } else {
          // Parent has value - Case 1
          result.push({ key: parentAttr.key, value: parentAttr.value || "", keyOpen: false, valueOpen: false, inheritValue: false })
        }

        // Remove from child map so we don't duplicate
        childMap.delete(parentAttr.key)
      })

    // Then, add remaining child-exclusive attributes (Case 3)
    childMap.forEach(childAttr => {
      result.push({ ...childAttr, keyOpen: false, valueOpen: false })
    })

    return result
  }

  const isUnidadesPorPackLocked = isChildItem && fatherItem

  const isTitleLocked = isChildItem && fatherItem

  const [itemTitulo, setItemTitulo] = useState(selectedItem?.name || "")
  const [categoria, setCategoria] = useState(
    shouldStrictlyInherit(fatherItem?.categoria) ? fatherItem!.categoria : selectedItem?.categoria || "",
  )
  const [marca, setMarca] = useState(
    shouldStrictlyInherit(fatherItem?.marca) ? fatherItem!.marca : selectedItem?.marca || "",
  )
  const [modelo, setModelo] = useState(selectedItem?.modelo || "")
  const [formatoVenta, setFormatoVenta] = useState(
    shouldStrictlyInherit(fatherItem?.formatoVenta) ? fatherItem!.formatoVenta : selectedItem?.formatoVenta || "unidad",
  )
  const [unidadesPorPack, setUnidadesPorPack] = useState(() => {
    const inherited = shouldStrictlyInherit(fatherItem?.unidadesPorPack)
      ? fatherItem!.unidadesPorPack?.toString()
      : selectedItem?.unidadesPorPack?.toString()
    if (!inherited || inherited === "N.E.") return "1"
    return inherited
  })
  const [unidadesPorPackActive, setUnidadesPorPackActive] = useState(
    shouldStrictlyInherit(fatherItem?.unidadesPorPackActive)
      ? fatherItem!.unidadesPorPackActive
      : selectedItem?.unidadesPorPack !== undefined && selectedItem?.unidadesPorPack !== null,
  )
  const [volumenActive, setVolumenActive] = useState(
    shouldStrictlyInherit(fatherItem?.volumenActive) ? fatherItem!.volumenActive : selectedItem?.volumenActive || false,
  )
  const [volumenCantidad, setVolumenCantidad] = useState(
    shouldStrictlyInherit(fatherItem?.volumenCantidad)
      ? fatherItem!.volumenCantidad?.toString()
      : selectedItem?.volumenCantidad?.toString() || "",
  )
  const [volumenUnidad, setVolumenUnidad] = useState(
    shouldStrictlyInherit(fatherItem?.volumenUnidad) ? fatherItem!.volumenUnidad : selectedItem?.volumenUnidad || "",
  )
  // If fechaVencimiento exists but vencimientoActive is undefined, default to true
  const [vencimientoActive, setVencimientoActive] = useState(
    selectedItem?.vencimientoActive ?? (selectedItem?.fechaVencimiento ? true : false)
  )
  const [fechaVencimiento, setFechaVencimiento] = useState(selectedItem?.fechaVencimiento || "")
  const [proveedor, setProveedor] = useState(
    shouldInheritField(fatherItem?.proveedor) ? fatherItem!.proveedor : selectedItem?.proveedor || "",
  )
  const [codigoProveedor, setCodigoProveedor] = useState(selectedItem?.codigoProveedor || "")

  const [editingSku, setEditingSku] = useState(false)
  const [editingSkuPadre, setEditingSkuPadre] = useState(false)
  const [editingCodigoUniversal, setEditingCodigoUniversal] = useState(false)
  // For parent items, use skuPrefix; for standalone, use sku
  // Safety check: ensure selectedItem is an object, not a string
  const [skuValue, setSkuValue] = useState(() => {
    if (!selectedItem || typeof selectedItem === 'string') return ""
    return selectedItem.hasVariants ? (selectedItem.skuPrefix || selectedItem.sku || "") : (selectedItem.sku || "")
  })
  const [codigoUniversalValue, setCodigoUniversalValue] = useState(selectedItem.codigoUniversal || "")
  const [imageView, setImageView] = useState<"imagen" | "descripcion">("imagen")
  const [isCardFlipped, setIsCardFlipped] = useState(false)

  const [editingDescripcion, setEditingDescripcion] = useState(false)
  const [descripcionValue, setDescripcionValue] = useState(selectedItem.descripcion || "")
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(selectedItem.name || "")

  // Card edit modals
  const [isEditNombreModalOpen, setIsEditNombreModalOpen] = useState(false)
  const [modalNombreValue, setModalNombreValue] = useState("")
  const [isEditSkuModalOpen, setIsEditSkuModalOpen] = useState(false)
  const [modalSkuValue, setModalSkuValue] = useState("")
  const [isEditCodigoUniversalModalOpen, setIsEditCodigoUniversalModalOpen] = useState(false)
  const [modalCodigoUniversalValue, setModalCodigoUniversalValue] = useState("")
  const [isEditCodigoProveedorModalOpen, setIsEditCodigoProveedorModalOpen] = useState(false)
  const [modalCodigoProveedorValue, setModalCodigoProveedorValue] = useState("")
  const [isEditDescripcionModalOpen, setIsEditDescripcionModalOpen] = useState(false)
  const [modalDescripcionValue, setModalDescripcionValue] = useState("")
  const [proveedorDropdownOpen, setProveedorDropdownOpen] = useState(false)
  const [proveedorSearch, setProveedorSearch] = useState("")
  const [isNuevoProveedorModalOpen, setIsNuevoProveedorModalOpen] = useState(false)
  const { proveedores, addProveedor } = useProveedores()
  const proveedorDropdownRef = useRef<HTMLDivElement>(null)

  // Media photos state - initialize from item's media array
  const [mediaPhotos, setMediaPhotos] = useState<string[]>(() => {
    return (selectedItem?.media || []).map((m) => m.photo).filter(Boolean)
  })
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null)

  const [containerAtributosPrincipales, setContainerAtributosPrincipales] = useState<
    Array<{ key: string; variantes: string[]; keyOpen?: boolean; variantesOpen?: boolean }>
  >(selectedItem?.containerAtributosPrincipales || [])

  // Nueva Variante modal state
  const [isNuevaVarianteModalOpen, setIsNuevaVarianteModalOpen] = useState(false)

  const [atributosPrincipales, setAtributosPrincipales] = useState<
    Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>
  >(selectedItem?.atributosPrincipales || [])

  const [atributosInformativos, setAtributosInformativos] = useState<
    Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean; inheritValue?: boolean }>
  >(() => getMergedAtributosInformativos(fatherItem?.atributosInformativos, selectedItem?.atributosInformativos))



  // const [history, setHistory] = useState<any[]>([])
  // const [historyIndex, setHistoryIndex] = useState(-1)
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [skuCopied, setSkuCopied] = useState(false)
  const [codigoUniversalCopied, setCodigoUniversalCopied] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSelectingTemplateForContainer, setIsSelectingTemplateForContainer] = useState(false)

  const [showAtributosView, setShowAtributosView] = useState(false)
  const [showIndividualAtributosView, setShowIndividualAtributosView] = useState(false)
  // Atributos de Variantes collapsed by default — user can expand to edit them
  const [isAtributosCollapsed, setIsAtributosCollapsed] = useState(true)

  // variantItems: skuSuffix is the source of truth, full SKU is computed as {skuValue}-{skuSuffix}
  const [variantItems, setVariantItems] = useState<
    Array<{
      id: string
      skuSuffix: string // Source of truth - the suffix part only (e.g. "negro" for "CAMDELI-negro")
      codigoUniversal: string
      descripcion: string
      foto: string
      variant1: string | null
      variant2: string | null
    }>
  >([])
  const [expandedVariantStock, setExpandedVariantStock] = useState<{ [sku: string]: boolean }>({})

  const [variantStockModification, setVariantStockModification] = useState<{
    [sku: string]: {
      total: { type: string; value: string }
      reservado: { type: string; value: string }
    }
  }>({})

  const previousVariantsRef = useRef<string | null>(null)

  // State for variant input
  const [varianteInput, setVarianteInput] = useState<Record<number, string>>({})

  // State for duplicate tag errors
  const [duplicateTagError, setDuplicateTagError] = useState<Record<number, boolean>>({})

  // State for stock dropdown visibility
  const [showTotalDropdown, setShowTotalDropdown] = useState(false)
  const [showReservadoDropdown, setShowReservadoDropdown] = useState(false)

  // Section toggle: 'info', 'both', or 'stock' - default to both expanded
  const [expandedSection, setExpandedSection] = useState<"info" | "both" | "stock">("both")

  // Precio and Stock modal states
  const [isPrecioModalOpen, setIsPrecioModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)

  // Matrix variant modal states (for editing variant precio/stock from the parent card matrix)
  const [matrixVariantItem, setMatrixVariantItem] = useState<any>(null)
  const [isMatrixPrecioModalOpen, setIsMatrixPrecioModalOpen] = useState(false)
  const [isMatrixStockModalOpen, setIsMatrixStockModalOpen] = useState(false)
  const [matrixPrecioModalValues, setMatrixPrecioModalValues] = useState({ costo: 0, margen: 0, iva: 0, precioFinal: 0 })

  // Precio modal editing values
  const [precioModalValues, setPrecioModalValues] = useState({
    costo: 0,
    margen: 0,
    iva: 0,
    precioFinal: 0,
  })

  // Right card mode toggle for parent items: 'info' or 'atributos'
  const [rightCardMode, setRightCardMode] = useState<"info" | "atributos">("info")

  // Right panel edit mode (standalone/children only)
  const [isRightEditing, setIsRightEditing] = useState(false)
  const rightEditSnapshotRef = useRef<any>(null)

  const enterRightEditMode = () => {
    rightEditSnapshotRef.current = {
      categoria, marca, modelo, formatoVenta, unidadesPorPack, unidadesPorPackActive,
      volumenActive, volumenCantidad, volumenUnidad, vencimientoActive, fechaVencimiento,
      proveedor, codigoProveedor, atributosInformativos: [...atributosInformativos],
    }
    setIsRightEditing(true)
  }

  const cancelRightEditMode = () => {
    const s = rightEditSnapshotRef.current
    if (s) {
      setCategoria(s.categoria); setMarca(s.marca); setModelo(s.modelo)
      setFormatoVenta(s.formatoVenta); setUnidadesPorPack(s.unidadesPorPack)
      setUnidadesPorPackActive(s.unidadesPorPackActive); setVolumenActive(s.volumenActive)
      setVolumenCantidad(s.volumenCantidad); setVolumenUnidad(s.volumenUnidad)
      setVencimientoActive(s.vencimientoActive); setFechaVencimiento(s.fechaVencimiento)
      setProveedor(s.proveedor); setCodigoProveedor(s.codigoProveedor)
      setAtributosInformativos(s.atributosInformativos)
    }
    setIsRightEditing(false)
  }

  const saveRightEditMode = () => {
    const id = selectedItem.id
    const s = rightEditSnapshotRef.current || {}
    if (categoria !== s.categoria) onFieldChange(id, "categoria", categoria)
    if (marca !== s.marca) onFieldChange(id, "marca", marca)
    if (modelo !== s.modelo) onFieldChange(id, "modelo", modelo)
    if (formatoVenta !== s.formatoVenta) onFieldChange(id, "formatoVenta", formatoVenta)
    if (unidadesPorPack !== s.unidadesPorPack) onFieldChange(id, "unidadesPorPack", unidadesPorPack)
    if (volumenActive !== s.volumenActive) onFieldChange(id, "volumenActive", volumenActive)
    if (volumenCantidad !== s.volumenCantidad) onFieldChange(id, "volumenCantidad", volumenCantidad)
    if (volumenUnidad !== s.volumenUnidad) onFieldChange(id, "volumenUnidad", volumenUnidad)
    if (vencimientoActive !== s.vencimientoActive) onFieldChange(id, "vencimientoActive", vencimientoActive)
    if (fechaVencimiento !== s.fechaVencimiento) onFieldChange(id, "fechaVencimiento", fechaVencimiento)
    if (proveedor !== s.proveedor) onFieldChange(id, "proveedor", proveedor)
    if (codigoProveedor !== s.codigoProveedor) onFieldChange(id, "codigoProveedor", codigoProveedor)
    if (JSON.stringify(atributosInformativos) !== JSON.stringify(s.atributosInformativos)) {
      onFieldChange(id, "atributosInformativos", atributosInformativos)
    }
    onSaveNow?.()
    setIsRightEditing(false)
  }

  // Expanded variant matrix modal state
  const [isExpandedMatrixOpen, setIsExpandedMatrixOpen] = useState(false)
  const [expandedMatrixPrecioModal, setExpandedMatrixPrecioModal] = useState<{ open: boolean; variant: any | null }>({ open: false, variant: null })
  const [expandedMatrixStockModal, setExpandedMatrixStockModal] = useState<{ open: boolean; variant: any | null }>({ open: false, variant: null })
  const [expandedMatrixPrecioValues, setExpandedMatrixPrecioValues] = useState({ costo: 0, margen: 0, iva: 0, precioFinal: 0 })
  const [expandedMatrixStockValues, setExpandedMatrixStockValues] = useState({ total: 0, reservado: 0 })
  const [expandedMatrixDescModal, setExpandedMatrixDescModal] = useState<{ open: boolean; variant: any | null; value: string }>({ open: false, variant: null, value: "" })
  const [expandedMatrixMediaModal, setExpandedMatrixMediaModal] = useState<{ open: boolean; variant: any | null }>({ open: false, variant: null })

  // Compute whether item has existing attributes (including inherited from parent)
  const hasExistingAttributes =
    (selectedItem?.atributosPrincipales && selectedItem.atributosPrincipales.length > 0) ||
    (selectedItem?.atributosInformativos && selectedItem.atributosInformativos.length > 0) ||
    (selectedItem?.containerAtributosPrincipales && selectedItem.containerAtributosPrincipales.length > 0) ||
    // Also check if parent has atributosInformativos that would be inherited
    (isChildItem && fatherItem?.atributosInformativos && fatherItem.atributosInformativos.length > 0)

  // Update visibility states when item changes
  useEffect(() => {
    if (isViewingContainer) {
      setShowAtributosView(hasExistingAttributes)
    } else {
      setShowIndividualAtributosView(hasExistingAttributes)
    }
  }, [selectedItem, hasExistingAttributes, isViewingContainer, fatherItem, isChildItem])

  // State for variant input
  // const [varianteInput, setVarianteInput] = useState<Record<number, string>>({})

  useEffect(() => {
    const hasAttributes =
      (selectedItem?.atributosPrincipales && selectedItem.atributosPrincipales.length > 0) ||
      (selectedItem?.atributosInformativos && selectedItem.atributosInformativos.length > 0) ||
      (selectedItem?.containerAtributosPrincipales && selectedItem.containerAtributosPrincipales.length > 0) ||
      // Also check if parent has atributosInformativos that would be inherited
      (isChildItem && fatherItem?.atributosInformativos && fatherItem.atributosInformativos.length > 0)

    setShowIndividualAtributosView(hasAttributes)
  }, [selectedItem, fatherItem, isChildItem])

  const handleFieldChange = (field: string, value: any, setter: (val: any) => void) => {
    setter(value)
    // For standalone/children right panel in edit mode: buffer in local state only.
    // Changes are saved to the store on "Guardar" via saveRightEditMode.
    // For container items: always propagate immediately (no edit mode concept there).
    if (isViewingContainer) {
      onFieldChange(selectedItem.id, field, value)
    }
  }

  const handleAtributosPrincipalesChange = (
    updated: Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>,
  ) => {
    setAtributosPrincipales(updated)
    if (onFieldChange && selectedItem?.id) {
      onFieldChange(selectedItem.id, "atributosPrincipales", updated)
    }
  }

  const handleAtributosInformativosChange = (
    updated: Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>,
  ) => {
    setAtributosInformativos(updated)
    // Only propagate immediately for containers; standalone/children buffer and save on Guardar
    if (onFieldChange && selectedItem?.id && isViewingContainer) {
      onFieldChange(selectedItem.id, "atributosInformativos", updated)
    }
  }

  const handleContainerAtributosPrincipalesChange = (
    updated: Array<{ key: string; variantes: string[]; keyOpen?: boolean; variantesOpen?: boolean }>,
  ) => {
    setContainerAtributosPrincipales(updated)
    if (onFieldChange && selectedItem?.id) {
      onFieldChange(selectedItem.id, "containerAtributosPrincipales", updated)
    }
  }

  const prevItemIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const currentId = selectedItem?.id
    const idChanged = currentId !== prevItemIdRef.current
    prevItemIdRef.current = currentId

    // Only re-sync fields and reset edit mode when the item ID actually changes.
    // This prevents the effect from firing (and exiting edit mode) on every
    // keystroke, which causes a new object reference for selectedItem via items state.
    if (!idChanged && !isRightEditing) {
      // Still sync if not in edit mode (covers undo/redo restoring values)
    }

    if (idChanged) {
      setIsRightEditing(false)
    }

    // Always sync fields when not in edit mode; when in edit mode only sync on item change
    if (!isRightEditing || idChanged) {
      setItemTitulo(selectedItem?.name || "")
      setCategoria(shouldStrictlyInherit(fatherItem?.categoria) ? fatherItem!.categoria : selectedItem?.categoria || "")
      setMarca(shouldStrictlyInherit(fatherItem?.marca) ? fatherItem!.marca : selectedItem?.marca || "")
      setModelo(selectedItem?.modelo || "")
      setFormatoVenta(
        shouldStrictlyInherit(fatherItem?.formatoVenta)
          ? fatherItem!.formatoVenta
          : selectedItem?.formatoVenta || "unidad",
      )
      setProveedor(shouldInheritField(fatherItem?.proveedor) ? fatherItem!.proveedor : selectedItem?.proveedor || "")
      setCodigoProveedor(selectedItem?.codigoProveedor || "")
      setSkuValue(selectedItem.hasVariants ? (selectedItem.skuPrefix || selectedItem.sku || "") : (selectedItem.sku || ""))
      setCodigoUniversalValue(selectedItem.codigoUniversal || "")
      setDescripcionValue(selectedItem.descripcion || "")
      setAtributosPrincipales(selectedItem?.atributosPrincipales || [])
      setAtributosInformativos(getMergedAtributosInformativos(fatherItem?.atributosInformativos, selectedItem?.atributosInformativos))
      if (selectedItem?.variants && selectedItem.variants.length > 0) {
        setVariantItems(convertSavedVariantsToDisplay(selectedItem.variants))
      }
      setUnidadesPorPack(() => {
        const inherited = shouldStrictlyInherit(fatherItem?.unidadesPorPack)
          ? fatherItem!.unidadesPorPack?.toString()
          : selectedItem?.unidadesPorPack?.toString()
        if (!inherited || inherited === "N.E.") return "1"
        return inherited
      })
      setVolumenActive(
        shouldStrictlyInherit(fatherItem?.volumenActive)
          ? fatherItem!.volumenActive
          : selectedItem?.volumenActive || false,
      )
      setVolumenCantidad(
        shouldStrictlyInherit(fatherItem?.volumenCantidad)
          ? fatherItem!.volumenCantidad?.toString()
          : selectedItem?.volumenCantidad?.toString() || "",
      )
      setVolumenUnidad(
        shouldStrictlyInherit(fatherItem?.volumenUnidad) ? fatherItem!.volumenUnidad : selectedItem?.volumenUnidad || "",
      )
    }
  }, [selectedItem, fatherItem])

  // Sync atributos from selectedItem when it changes (for undo) — skip while right panel is in edit mode
  useEffect(() => {
    if (selectedItem && !isRightEditing) {
      setAtributosPrincipales(selectedItem.atributosPrincipales || [])
      setAtributosInformativos(getMergedAtributosInformativos(fatherItem?.atributosInformativos, selectedItem?.atributosInformativos))
      setContainerAtributosPrincipales(selectedItem.containerAtributosPrincipales || [])
    }
  }, [selectedItem, fatherItem])

  // Removed internal history management as it's now handled by the parent via onFieldChange
  // useEffect(() => {
  //   // Skip the initial mount
  //   if (isInitialMount.current) {
  //     isInitialMount.current = false
  //     return
  //   }

  //   // Save to history whenever any field changes
  //   saveToHistory()
  // }, [
  //   itemTitulo,
  //   marca,
  //   modelo,
  //   formatoVenta,
  //   unidadesPorPack,
  //   volumenActive,
  //   volumenCantidad,
  //   volumenUnidad,
  //   proveedor,
  //   codigoProveedor,
  //   atributosPrincipales,
  //   atributosInformativos,
  //   skuValue,
  //   codigoUniversalValue,
  //   descripcionValue, // Added for description
  //   categoria, // Added for categoria
  // ])

  // Pass dynamic content to parent (e.g., undo/redo buttons)
  // Replaced hasUnsavedChanges and history-related logic with direct calls to onFieldChange
  // useEffect(() => {
  //   if (onDynamicContentChange) {
  //     const content = hasUnsavedChanges ? (
  //       <>
  //         <button
  //           onClick={handleUndo}
  //           disabled={!canUndo}
  //           className={`p-0.5 rounded transition-colors ${
  //             canUndo
  //               ? "text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
  //               : "text-gray-700 cursor-not-allowed"
  //           }`}
  //           title="Deshacer"
  //         >
  //           <Undo2 className="h-3.5 w-3.5" />
  //         </button>
  //         <button
  //           onClick={handleRedo}
  //           disabled={!canRedo}
  //           className={`p-0.5 rounded transition-colors ${
  //             canRedo
  //               ? "text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
  //               : "text-gray-700 cursor-not-allowed"
  //           }`}
  //           title="Rehacer"
  //         >
  //           <Redo2 className="h-3.5 w-3.5" />
  //         </button>
  //         <div className="w-px h-4 bg-gray-800 mx-1"></div>
  //         <button
  //           onClick={handleDiscard}
  //           className="px-2 py-0.5 rounded text-xs transition-colors hover:bg-red-900/40 hover:text-red-300 border border-red-900/50 text-red-400 bg-red-950/40 font-medium"
  //         >
  //           Deshacer
  //         </button>
  //         <button
  //           onClick={handleSave}
  //           className="px-2 py-0.5 rounded text-xs transition-colors hover:bg-emerald-900/40 hover:text-emerald-300 border border-emerald-900/50 bg-emerald-950/40 text-emerald-400 font-medium"
  //         >
  //           Guardar
  //         </button>
  //       </>
  //     ) : null

  //     onDynamicContentChange(content)
  //   }
  // }, [hasUnsavedChanges, canUndo, canRedo, onDynamicContentChange])

  useEffect(() => {
    if (formatoVenta === "unidad") {
      setUnidadesPorPack("1")
    }
  }, [formatoVenta])

  // Generate NEW variant combinations that don't already exist
  const generateNewVariantCombinations = (existingVariants: any[]) => {
    if (!selectedItem || !selectedItem.hasVariants) return []

    const attrs = containerAtributosPrincipales.filter((attr) => attr.key && attr.variantes.length > 0)
    if (attrs.length === 0) return []

    const skuPadre =
      selectedItem.skuPrefix ||
      selectedItem.sku ||
      selectedItem.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .split(" ")
        .map((word) => word.substring(0, 3))
        .join("-")
        .substring(0, 15)

    // Helper to check if a variant combination already exists
    const variantExists = (v1: string, v2: string | null) => {
      return existingVariants.some((v: any) => {
        if (!v.atributosPrincipales) return false
        const attr1 = v.atributosPrincipales[0]?.value
        const attr2 = v.atributosPrincipales[1]?.value || null
        return attr1 === v1 && attr2 === v2
      })
    }

    const newCombinations: any[] = []

    if (attrs.length === 1) {
      attrs[0].variantes.forEach((v1) => {
        if (!variantExists(v1, null)) {
          const skuSuffix = v1.toLowerCase().replace(/\s+/g, "-")
          newCombinations.push({
            skuSuffix, // Source of truth - full SKU is computed as {skuPadre}-{skuSuffix}
            codigoUniversal: "",
            descripcion: "",
            foto: "",
            variant1: v1,
            variant2: null,
          })
        }
      })
    } else if (attrs.length === 2) {
      attrs[0].variantes.forEach((v1) => {
        attrs[1].variantes.forEach((v2) => {
          if (!variantExists(v1, v2)) {
            const skuSuffix = `${v1.toLowerCase().replace(/\s+/g, "-")}-${v2.toLowerCase().replace(/\s+/g, "-")}`
            newCombinations.push({
              skuSuffix, // Source of truth - full SKU is computed as {skuPadre}-{skuSuffix}
              codigoUniversal: "",
              descripcion: "",
              foto: "",
              variant1: v1,
              variant2: v2,
            })
          }
        })
      })
    }

    return newCombinations
  }

  // Convert saved variants to variantItems format for display
  // skuSuffix is the source of truth - stored directly in variant data
  // Full SKU is computed on-the-fly as {skuValue}-{skuSuffix}
  const convertSavedVariantsToDisplay = (savedVariants: any[]) => {
    return savedVariants.map((v: any) => {
      // skuSuffix must exist in stored data; if not, this is legacy data
      const skuSuffix = v.skuSuffix || ""
      return {
        id: v.id,
        skuSuffix, // This is the source of truth
        codigoUniversal: v.codigoUniversal || "",
        descripcion: v.descripcion || "",
        foto: v.foto || "",
        variant1: v.atributosPrincipales?.[0]?.value || null,
        variant2: v.atributosPrincipales?.[1]?.value || null,
      }
    })
  }

  // DISABLED: Automatic variant generation - now triggered manually by "Generar Variantes" button
  // useEffect(() => {
  //   if (selectedItem && selectedItem.hasVariants && isViewingContainer) {
  //     const existingVariants = selectedItem.variants || []
  //     
  //     // Generate only NEW combinations that don't already exist
  //     const newCombinations = generateNewVariantCombinations(existingVariants)
  //     
  //     // If there are new combinations, add them to the variants
  //     if (newCombinations.length > 0) {
  //       // Prepare inherited atributosInformativos for new variants
  //       // For Case 1 (parent has value and not marked inheritValue): inherit complete key+value (locked)
  //       // For Case 2 (parent marked inheritValue): inherit key with empty value so child can fill it
  //       const inheritedAtributosInformativos = (selectedItem.atributosInformativos || []).map(attr => ({
  //         key: attr.key,
  //         value: attr.inheritValue ? "" : (attr.value || ""), // Empty for Case 2 (inheritValue), parent's value for Case 1
  //         inheritValue: attr.inheritValue, // Preserve the flag for UI display
  //       }))
  //
  //       const newVariantObjects = newCombinations.map((combo) => ({
  //         sku: combo.sku,
  //         name: selectedItem.name,
  //         codigoUniversal: combo.codigoUniversal || "",
  //         descripcion: combo.descripcion || "",
  //         foto: combo.foto || "",
  //         categoria: selectedItem.categoria,
  //         atributosPrincipales: [
  //           combo.variant1 ? { key: containerAtributosPrincipales[0]?.key || "", value: combo.variant1 } : null,
  //           combo.variant2 ? { key: containerAtributosPrincipales[1]?.key || "", value: combo.variant2 } : null,
  //         ].filter(Boolean),
  //         atributosInformativos: inheritedAtributosInformativos,
  //         stock: {
  //           total: "0",
  //           reservado: "0",
  //           disponible: "0",
  //         },
  //       }))
  //
  //       const updatedVariants = [...existingVariants, ...newVariantObjects]
  //       
  //       // Update variantItems for display (existing + new)
  //       setVariantItems(convertSavedVariantsToDisplay(updatedVariants))
  //
  //       const variantsKey = JSON.stringify(updatedVariants.map((v) => ({ sku: v.sku, attrs: v.atributosPrincipales })))
  //       
  //       if (previousVariantsRef.current === null) {
  //         previousVariantsRef.current = variantsKey
  //       } else if (previousVariantsRef.current !== variantsKey) {
  //         previousVariantsRef.current = variantsKey
  //         if (onFieldChange && selectedItem.sku) {
  //           onFieldChange(selectedItem.id, "variants", updatedVariants)
  //         }
  //       }
  //     } else {
  //       // No new combinations - just display existing variants
  //       setVariantItems(convertSavedVariantsToDisplay(existingVariants))
  //       
  //       // Update the ref without triggering changes
  //       const variantsKey = JSON.stringify(existingVariants.map((v: any) => ({ sku: v.sku, attrs: v.atributosPrincipales })))
  //       if (previousVariantsRef.current === null) {
  //         previousVariantsRef.current = variantsKey
  //       }
  //     }
  //   }
  // }, [containerAtributosPrincipales, selectedItem, isViewingContainer])

  // Display existing variants on load (no generation, just display)
  // Close proveedor dropdown on outside click
  useEffect(() => {
    if (!proveedorDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (proveedorDropdownRef.current && !proveedorDropdownRef.current.contains(e.target as Node)) {
        setProveedorDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [proveedorDropdownOpen])

  useEffect(() => {
    if (selectedItem && selectedItem.hasVariants && isViewingContainer) {
      const existingVariants = selectedItem.variants || []

      // Just display existing variants, don't generate new ones
      if (existingVariants.length > 0) {
        setVariantItems(convertSavedVariantsToDisplay(existingVariants))

        // Initialize the ref
        const variantsKey = JSON.stringify(existingVariants.map((v: any) => ({ sku: v.sku, attrs: v.atributosPrincipales })))
        if (previousVariantsRef.current === null) {
          previousVariantsRef.current = variantsKey
        }
      } else {
        // No existing variants - clear display
        setVariantItems([])
      }
    }
  }, [selectedItem, isViewingContainer])

  // Manual variant generation function - triggered by "Generar Variantes" button
  // Handler for creating a new variant manually
  const handleNuevaVariante = (attributeValues: Record<string, string>) => {
    console.log("[v0] Creating new variant with values:", attributeValues)

    // Check if any new tags need to be added to containerAtributosPrincipales
    const updatedContainerAttrs = [...containerAtributosPrincipales]
    let hasNewTags = false

    Object.entries(attributeValues).forEach(([key, value]) => {
      const attrIndex = updatedContainerAttrs.findIndex((attr) => attr.key === key)
      if (attrIndex !== -1) {
        // Check if this value already exists
        if (!updatedContainerAttrs[attrIndex].variantes.includes(value)) {
          // Add new tag to existing attribute
          updatedContainerAttrs[attrIndex].variantes.push(value)
          hasNewTags = true
        }
      }
    })

    // If new tags were added, update containerAtributosPrincipales
    if (hasNewTags) {
      console.log("[v0] New tags added to atributos principales:", updatedContainerAttrs)
      setContainerAtributosPrincipales(updatedContainerAttrs)
      if (onFieldChange && selectedItem.sku) {
        onFieldChange(selectedItem.id, "containerAtributosPrincipales", updatedContainerAttrs)
      }
    }

    // Get variant values for SKU suffix
    const variantValues = Object.values(attributeValues)
    const skuSuffix = variantValues
      .map((v) => v.substring(0, 3).toUpperCase())
      .join("-")

    // Create the new variant object - only store skuSuffix, full SKU is computed
    const newVariant: any = {
      id: generateId("VAR"),
      skuSuffix, // Source of truth - full SKU computed as {skuPadre}-{skuSuffix}
      codigoUniversal: "",
      descripcion: "",
      foto: selectedItem.foto || "",
      atributosPrincipales: Object.entries(attributeValues).map(([key, value]) => ({
        key,
        value,
      })),
    }

    // Add the new variant to the existing variants array
    const existingVariants = selectedItem?.variants || []
    const updatedVariants = [...existingVariants, newVariant]

    console.log("[v0] Updated variants array:", updatedVariants)

    // Update display
    setVariantItems(convertSavedVariantsToDisplay(updatedVariants))

    // Save to parent
    if (onFieldChange && selectedItem.sku) {
      onFieldChange(selectedItem.id, "variants", updatedVariants)
    }
  }

  const handleGenerarVariantes = () => {
    console.log("[v0] Generar Variantes clicked - starting manual generation")

    if (!selectedItem || !selectedItem.hasVariants || !isViewingContainer) {
      console.log("[v0] Cannot generate variants - conditions not met")
      return
    }

    const existingVariants = selectedItem.variants || []
    console.log("[v0] Existing variants:", existingVariants)

    // Count how many atributos principales we currently have
    const currentAttrCount = containerAtributosPrincipales.filter(
      (attr) => attr.key && attr.variantes.length > 0
    ).length
    console.log("[v0] Current atributo count:", currentAttrCount)

    // Filter out existing variants that don't match the current atributo count
    // (e.g., if we now have 2 atributos, remove variants with only 1 atributo)
    const validExistingVariants = existingVariants.filter((v: any) => {
      if (!v.atributosPrincipales) return false
      const variantAttrCount = v.atributosPrincipales.filter((a: any) => a && a.value).length
      return variantAttrCount === currentAttrCount
    })
    console.log("[v0] Valid existing variants (matching attr count):", validExistingVariants)

    // Generate only NEW combinations that don't already exist among valid variants
    const newCombinations = generateNewVariantCombinations(validExistingVariants)
    console.log("[v0] New combinations to add:", newCombinations)

    // Prepare inherited atributosInformativos for new variants
    const inheritedAtributosInformativos = (selectedItem.atributosInformativos || []).map(attr => ({
      key: attr.key,
      value: attr.inheritValue ? "" : (attr.value || ""),
      inheritValue: attr.inheritValue,
    }))

    const skuPadre = selectedItem.skuPrefix || selectedItem.sku || ""
    const newVariantObjects = newCombinations.map((combo) => ({
      id: generateId("VAR"),
      skuSuffix: combo.skuSuffix, // Source of truth - full SKU computed as {skuPadre}-{skuSuffix}
      name: selectedItem.name,
      codigoUniversal: combo.codigoUniversal || "",
      descripcion: combo.descripcion || "",
      foto: combo.foto || "",
      categoria: selectedItem.categoria,
      atributosPrincipales: [
        combo.variant1 ? { key: containerAtributosPrincipales[0]?.key || "", value: combo.variant1 } : null,
        combo.variant2 ? { key: containerAtributosPrincipales[1]?.key || "", value: combo.variant2 } : null,
      ].filter(Boolean),
      atributosInformativos: inheritedAtributosInformativos,
      stock: {
        total: "0",
        reservado: "0",
        disponible: "0",
      },
    }))

    // Combine valid existing variants + new ones
    const updatedVariants = [...validExistingVariants, ...newVariantObjects]

    // Update variantItems for display
    setVariantItems(convertSavedVariantsToDisplay(updatedVariants))

    const variantsKey = JSON.stringify(updatedVariants.map((v) => ({ sku: v.sku, attrs: v.atributosPrincipales })))

    // Always call onFieldChange to save the variants
    if (onFieldChange && selectedItem.sku) {
      onFieldChange(selectedItem.id, "variants", updatedVariants)
    }

    // Update the ref for change tracking
    previousVariantsRef.current = variantsKey
  }

  // The stock is now managed via onFieldChange/editField
  // useEffect(() => {
  //   if (selectedItem && selectedItem.hasVariants && isViewingContainer && variantItems.length > 0) {
  //     variantItems.forEach((variant) => {
  //       // Check if variant has existing stock data from the parent component
  //       // If not, initialize stock for all deposits
  //       if (!selectedItem.variants?.find((v) => v.sku === variant.sku)?.stock) {
  //         DEPOSITS.forEach((deposit) => {
  //           // Initialize with 0 for total and reserved for each deposit
  //           updateStock(variant.sku, "total", 0)
  //           updateStock(variant.sku, "reservado", 0)
  //         })
  //       } else {
  //         // If stock data exists, ensure all deposits are present and initialized if missing
  //         const existingVariant = selectedItem.variants?.find((v) => v.sku === variant.sku)
  //         DEPOSITS.forEach((deposit) => {
  //           if (!existingVariant?.stock?.[deposit]) {
  //             updateStock(variant.sku, "total", 0)
  //             updateStock(variant.sku, "reservado", 0)
  //           }
  //         })
  //       }
  //     })
  //   }
  // }, [variantItems, selectedItem, isViewingContainer, updateStock])

  const toggleVariantStockExpansion = (sku: string) => {
    setExpandedVariantStock((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }))
  }

  const updateVariantField = (sku: string, field: "sku" | "codigoUniversal" | "descripcion" | "foto", value: string) => {
    setVariantItems((prev) => prev.map((item) => (item.sku === sku ? { ...item, [field]: value } : item)))
    // Optionally notify parent via onFieldChange if needed
    onFieldChange(sku, field, value)
  }

  const handleCopySku = async () => {
    const skuToCopy = editingSku ? skuValue : selectedItem?.sku
    if (skuToCopy) {
      await navigator.clipboard.writeText(skuToCopy)
      setSkuCopied(true)
      setTimeout(() => setSkuCopied(false), 2000)
    } else if (isViewingContainer && selectedItem?.name) {
      const skuPadre = selectedItem.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .split(" ")
        .map((word: string) => word.substring(0, 3))
        .join("-")
        .substring(0, 15)
      await navigator.clipboard.writeText(skuPadre)
      setSkuCopied(true)
      setTimeout(() => setSkuCopied(false), 2000)
    }
  }

  const handleCopyCodigoUniversal = async () => {
    // Fixed variable name typo `constcodigoUniversalToCopy` to `constcodigoUniversalToCopy`
    const codigoUniversalToCopy = editingCodigoUniversal ? codigoUniversalValue : selectedItem?.codigoUniversal
    if (codigoUniversalToCopy) {
      await navigator.clipboard.writeText(codigoUniversalToCopy)
      setCodigoUniversalCopied(true)
      setTimeout(() => setCodigoUniversalCopied(false), 2000)
    }
  }

  const applyTemplate = (templateName: string, isContainer: boolean) => {
    const template = TEMPLATES.find((t) => t.name === templateName)
    if (!template) return

    if (isContainer) {
      setContainerAtributosPrincipales(
        template.atributosPrincipales.map((attr) => ({
          key: attr.key,
          variantes: [],
        })),
      )
      setAtributosInformativos(template.atributosInformativos)
      setShowAtributosView(true)
    } else {
      setAtributosPrincipales(template.atributosPrincipales)
      setAtributosInformativos(template.atributosInformativos)
      setShowIndividualAtributosView(true)
    }

    setShowTemplateModal(false)
  }

  const updateProductTitle = () => {
    // Logic to update product title based on attributes
    // This function might need to be fleshed out to update the `itemTitulo` state
    // or directly update the `selectedItem` if it's intended to reflect immediately.
  }

  const handleSkuBlur = () => {
    if (selectedItem?.sku && editingSku) {
      // For child items, also extract and persist skuSuffix
      let skuSuffix: string | undefined
      if (isChildItem && fatherItem) {
        const prefix = fatherItem.sku + "-"
        skuSuffix = skuValue.startsWith(prefix) ? skuValue.slice(prefix.length) : skuValue
      }
      updateItem(selectedItem.sku, { sku: skuValue, ...(skuSuffix !== undefined && { skuSuffix }) })
      setEditingSku(false)
      // Notify parent of change
      onFieldChange(selectedItem.id, "sku", skuValue)
      if (skuSuffix !== undefined) {
        onFieldChange(skuValue, "skuSuffix", skuSuffix)
      }
    }
  }

  const handleCodigoUniversalBlur = () => {
    if (selectedItem?.sku && editingCodigoUniversal) {
      updateItem(selectedItem.sku, { codigoUniversal: codigoUniversalValue })
      setEditingCodigoUniversal(false)
      // Notify parent of change
      onFieldChange(selectedItem.id, "codigoUniversal", codigoUniversalValue)
    }
  }

  const handleDescripcionBlur = () => {
    if (selectedItem?.sku && editingDescripcion) {
      updateItem(selectedItem.sku, { descripcion: descripcionValue })
      setEditingDescripcion(false)
      onFieldChange(selectedItem.id, "descripcion", descripcionValue)
    }
  }

  const handleNameBlur = () => {
    if (editingName) {
      const trimmed = nameValue.trim()
      if (trimmed && trimmed !== selectedItem.name) {
        // Use id for lookup so it works for both standalone and parent items
        if (selectedItem?.id) {
          onFieldChange(selectedItem.id, "name", trimmed)
        } else if (selectedItem?.sku) {
          updateItem(selectedItem.sku, { name: trimmed })
          onFieldChange(selectedItem.id, "name", trimmed)
        }
      } else {
        setNameValue(selectedItem.name || "")
      }
      setEditingName(false)
    }
  }

  const handleSaveNombreModal = () => {
    const trimmed = modalNombreValue.trim()
    if (trimmed && trimmed !== (nameValue || selectedItem.name)) {
      setNameValue(trimmed)
      onFieldChange(selectedItem.id, "name", trimmed)
      onSaveNow?.()
    }
    setIsEditNombreModalOpen(false)
  }

  const handleSaveSkuModal = () => {
    const trimmed = modalSkuValue.trim()
    if (!trimmed) { setIsEditSkuModalOpen(false); return }
    setSkuValue(trimmed)
    if (isChildItem && fatherItem) {
      const updatedVariants = fatherItem.variants?.map((v: any) =>
        v.id === selectedItem.id ? { ...v, skuSuffix: trimmed } : v
      )
      if (updatedVariants) {
        onFieldChange(fatherItem.id, "variants", updatedVariants)
        onSaveNow?.()
      }
    } else {
      onFieldChange(selectedItem.id, "sku", trimmed)
      onSaveNow?.()
    }
    setIsEditSkuModalOpen(false)
  }

  const handleSaveCodigoUniversalModal = () => {
    setCodigoUniversalValue(modalCodigoUniversalValue)
    onFieldChange(selectedItem.id, "codigoUniversal", modalCodigoUniversalValue)
    onSaveNow?.()
    setIsEditCodigoUniversalModalOpen(false)
  }

  const handleSaveCodigoProveedorModal = () => {
    setCodigoProveedor(modalCodigoProveedorValue)
    onFieldChange(selectedItem.id, "codigoProveedor", modalCodigoProveedorValue)
    onSaveNow?.()
    setIsEditCodigoProveedorModalOpen(false)
  }

  const handleSaveDescripcionModal = () => {
    setDescripcionValue(modalDescripcionValue)
    onFieldChange(selectedItem.id, "descripcion", modalDescripcionValue)
    onSaveNow?.()
    setIsEditDescripcionModalOpen(false)
  }

  // Removed handleUndo, handleRedo, handleSave, handleDiscard, saveToHistory, applyState as they are replaced by onFieldChange
  // const handleUndo = () => { ... }
  // const handleRedo = () => { ... }
  // const applyState = (state: any) => { ... }
  // const saveToHistory = () => { ... }
  // const handleSave = () => { ... }
  // const handleDiscard = () => { ... }

  return (
    <>
      {/* <Breadcrumb dynamicContent={null} /> */}

      <div className="px-8 pb-8 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
        {/* Section header — shared for all item types */}
        <div className="flex items-start justify-between pt-12 pb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              {isChildItem ? "Detalle de la Variante" : "Detalle del Item"}
            </h1>
            {isChildItem && fatherItem && (
              <button
                type="button"
                onClick={() => router.push(`/catalogo/items/${fatherItem.id}`)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium text-left cursor-pointer transition-colors w-fit"
              >
                Ver Agrupador
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 shrink-0">
            {!isRightEditing ? (
              <button
                type="button"
                onClick={enterRightEditMode}
                className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                Editar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancelRightEditMode}
                  className="h-9 px-4 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveRightEditMode}
                  className="h-9 px-4 text-sm font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                >
                  Guardar
                </button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer shadow-sm"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2">
                  <Trash2 className="w-4 h-4" />
                  {isViewingContainer ? "Eliminar agrupador" : isChildItem ? "Eliminar variante" : "Eliminar item"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={`grid gap-2 py-2 items-start ${isViewingContainer ? (isExpandedMatrixOpen ? "grid-cols-1 gap-6" : "grid-cols-10 gap-6") : "grid-cols-10 gap-16"}`}>
          {/* Left Column - Image Card (only for standalone/children) - col-span-4 */}
          {!isViewingContainer && (
            <div className="col-span-4 order-1 z-20 rounded-xl flex flex-col transition-all duration-300 border-none shadow-none">
              {/* Flip card container */}
              <div className="sticky top-4" style={{ perspective: "1200px" }}>
                <div
                  className="relative transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    minHeight: "630px",
                  }}
                >
                  {/* FRONT SIDE */}
                  <div
                    className={`absolute inset-0 p-6 px-8 pr-11 border-solid border border-black rounded-xl bg-black shadow-md pl-11 ${isCardFlipped ? "pointer-events-none" : ""}`}
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    {/* Estado indicator - top-left */}
                    {!isViewingContainer && (
                      <div className="absolute top-4 left-6 z-10">
                        <div 
                          className="relative group/estado"
                          onMouseLeave={(e) => {
                            const dropdown = e.currentTarget.querySelector("[data-estado-dropdown-top]") as HTMLElement
                            if (dropdown) dropdown.style.display = "none"
                          }}
                        >
                          <button
                            className="flex items-center gap-1.5 cursor-pointer transition-all group/estadoBtn"
                            onClick={(e) => {
                              e.stopPropagation()
                              const el = e.currentTarget.parentElement?.querySelector("[data-estado-dropdown-top]") as HTMLElement
                              if (el) el.style.display = el.style.display === "none" || !el.style.display ? "flex" : "none"
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              selectedItem?.isActive !== false
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                            }`} />
                            <span className="text-[11px] text-slate-500 uppercase tracking-wider group-hover/estadoBtn:text-slate-300 transition-colors">
                              {selectedItem?.isActive !== false ? "Activo" : "Pausado"}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-600 opacity-0 group-hover/estadoBtn:opacity-100 transition-opacity" />
                          </button>
                          <div
                            data-estado-dropdown-top
                            style={{ display: "none" }}
                            className="absolute top-full left-0 mt-1 z-50 flex-col min-w-[110px] bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden"
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLElement
                              setTimeout(() => {
                                el.style.display = "none"
                              }, 1000)
                            }}
                          >
                            {[
                              { label: "Activo", value: true },
                              { label: "Pausado", value: false },
                            ].map(({ label, value }) => {
                              const isCurrent = (selectedItem?.isActive !== false) === value
                              return (
                                <button
                                  key={label}
                                  className={`flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors w-full ${
                                    isCurrent
                                      ? "bg-slate-800/80 text-white font-medium cursor-default"
                                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white cursor-pointer"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isCurrent && selectedItem) {
                                      if (isChildItem && fatherItem) {
                                        const updatedVariants = fatherItem.variants?.map((v: any) =>
                                          v.id === selectedItem.id ? { ...v, isActive: value } : v
                                        )
                                        if (updatedVariants) {
                                          onFieldChange(fatherItem.id, "variants", updatedVariants)
                                        }
                                      } else {
                                        onFieldChange(selectedItem.id, "isActive", value)
                                      }
                                    }
                                    setTimeout(() => {
                                      ;(e.currentTarget.parentElement as HTMLElement).style.display = "none"
                                    }, 1000)
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-amber-400"}`} />
                                    {label}
                                  </div>
                                  {isCurrent && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Flip clickable area - top 1/3 height, right half width */}
                    <button
                      onClick={() => setIsCardFlipped(true)}
                      className="absolute top-0 right-0 w-1/2 h-1/3 cursor-pointer z-10"
                    >
                      {/* Visual hint in top-right corner */}
                      <div className="absolute top-4 right-6 flex items-center gap-1 text-slate-500">
                        <span className="text-[11px] uppercase tracking-wider">Detalles</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </button>

                    <div className="mt-2">
                      <div className="w-full h-64 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden shadow-2xl border-slate-700/30 border-none border-0 bg-transparent shadow-none">
                        <Image
                          src={getItemPhoto(selectedItem)}
                          alt={selectedItem.name}
                          width={200}
                          height={256}
                          className="object-contain rounded-xl shadow-xl"
                        />
                      </div>
                    </div>

                    <div className="mb-0 mt-6">
                      <div className="flex items-center justify-center gap-2 mt-[-20px] mb-0 flex-wrap group/title">
                          {isChildItem ? (
                          <h2 className="font-semibold text-white text-2xl text-center">{nameValue || selectedItem.name}</h2>
                        ) : (
                          <div
                            className="flex items-center gap-1.5 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setModalNombreValue(nameValue || selectedItem.name || "")
                              setIsEditNombreModalOpen(true)
                            }}
                          >
                            <h2 className="font-semibold text-white text-2xl text-center">{nameValue || selectedItem.name}</h2>
                            <Pencil className="w-3.5 h-3.5 text-white/40 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                          </div>
                        )}
                        {isChildItem && selectedItem.atributosPrincipales && selectedItem.atributosPrincipales.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {selectedItem.atributosPrincipales.map((attr, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap"
                              >
                                {attr.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SKU below title - editable */}
                      {!isViewingContainer && (
                        <div className="flex items-center justify-center gap-1.5 mt-1.5 group/sku">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">SKU</span>
                          {isChildItem && fatherItem ? (
                            <div
                              className="flex items-center gap-0 cursor-pointer group/skuval"
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalSkuValue(selectedItem.skuSuffix || selectedItem.sku || "")
                                setIsEditSkuModalOpen(true)
                              }}
                            >
                              <span className="text-xs font-light text-slate-500 tracking-wide">
                                {fatherItem.skuPrefix || fatherItem.sku || ""}-
                              </span>
                              <span className="text-xs font-light text-slate-400 tracking-wide hover:text-slate-300 transition-colors">
                                {selectedItem.skuSuffix || selectedItem.sku || ""}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="text-xs font-light text-slate-400 tracking-wide cursor-pointer hover:text-slate-300 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalSkuValue(skuValue || selectedItem.sku || "")
                                setIsEditSkuModalOpen(true)
                              }}
                            >
                              {skuValue || selectedItem.sku}
                            </span>
                          )}
                          <Pencil className="h-2.5 w-2.5 text-slate-500 opacity-0 group-hover/sku:opacity-100 transition-opacity" />
                        </div>
                      )}

                      {/* Metrics - Precio Venta and Stock stacked with horizontal lines */}
                      {!isViewingContainer && (
                        <div className="mt-5 px-2">
                          {/* Top horizontal line */}
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                          
                          {/* Precio Venta */}
                          <div
                            className="flex flex-col items-center py-3 group/precio cursor-pointer transition-all hover:scale-105"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPrecioModalValues({
                                costo: selectedItem?.precio?.costo || 0,
                                margen: selectedItem?.precio?.margen || 0,
                                iva: selectedItem?.precio?.iva || 0,
                                precioFinal: selectedItem?.precio?.precioFinal || 0,
                              })
                              setIsPrecioModalOpen(true)
                            }}
                          >
                            <span className="text-[11px] text-slate-500 uppercase tracking-[0.12em] mb-0.5">Precio Venta</span>
                            <div className="flex items-center gap-2.5">
                              <span className="text-white font-light text-lg tracking-tight tabular-nums">
                                ${(selectedItem?.precio?.precioFinal || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                              <Pencil className="h-3 w-3 text-slate-600 opacity-0 group-hover/precio:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          {/* Middle horizontal line */}
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

                          {/* Stock */}
                          <div
                            className="flex flex-col items-center py-3 group/stock cursor-pointer transition-all hover:scale-105"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsStockModalOpen(true)
                            }}
                          >
                            <span className="text-[11px] text-slate-500 uppercase tracking-[0.12em] mb-0.5">Stock</span>
                            <div className="flex items-center gap-2.5">
                              <span className="text-white font-light text-lg tracking-tight tabular-nums">
                                {selectedItem?.stock?.disponible ?? Number.parseInt(selectedItem?.stock?.enStock || "0") - Number.parseInt(selectedItem?.stock?.reservado || "0")} disponibles
                              </span>
                              <Pencil className="h-3 w-3 text-slate-600 opacity-0 group-hover/stock:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          {/* Bottom horizontal line */}
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                        </div>
                      )}

                      {/* PRESERVED FOR RECOVERY: Full SKU and Código Universal centered below title
                      {!isViewingContainer && (
                        <div className="flex flex-col items-center gap-0.5 mt-1">
                          <div className="flex items-center justify-center gap-1.5 group/sku">
                            <span className="text-[11px] font-medium text-slate-500/70 uppercase tracking-wider">SKU:</span>
                            {isChildItem && fatherItem ? (
                              <div className="flex items-center gap-0">
                                <span className="text-xs font-light text-slate-400/70 tracking-wide">
                                  {fatherItem.skuPrefix || fatherItem.sku || ""}-
                                </span>
                                {editingSku ? (
                                  <input
                                    type="text"
                                    value={skuValue}
                                    onChange={(e) => setSkuValue(e.target.value)}
                                    onBlur={() => {
                                      setEditingSku(false)
                                      const newSuffix = skuValue
                                      const updatedVariants = fatherItem.variants?.map((v: any) =>
                                        v.id === selectedItem.id ? { ...v, skuSuffix: newSuffix } : v
                                      )
                                      if (updatedVariants && onFieldChange) {
                                        onFieldChange(fatherItem.id, "variants", updatedVariants)
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                                      if (e.key === "Escape") {
                                        setSkuValue(selectedItem.skuSuffix || selectedItem.sku || "")
                                        setEditingSku(false)
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs font-light text-slate-300 tracking-wide bg-transparent border-b border-white/30 focus:border-white/60 outline-none w-auto max-w-[100px]"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className="text-xs font-light text-slate-300 tracking-wide cursor-pointer hover:text-white transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSkuValue(selectedItem.skuSuffix || selectedItem.sku || "")
                                      setEditingSku(true)
                                    }}
                                  >
                                    {selectedItem.skuSuffix || selectedItem.sku || ""}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <>
                              {editingSku ? (
                                <input
                                  type="text"
                                  value={skuValue}
                                  onChange={(e) => setSkuValue(e.target.value)}
                                  onBlur={handleSkuBlur}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                                    if (e.key === "Escape") {
                                      setSkuValue(selectedItem.sku || "")
                                      setEditingSku(false)
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-light text-slate-300 tracking-wide bg-transparent border-b border-white/30 focus:border-white/60 outline-none text-center w-auto max-w-[140px]"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="text-xs font-light text-slate-400/80 tracking-wide cursor-pointer hover:text-slate-300 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); setEditingSku(true) }}
                                >
                                  {skuValue || selectedItem.sku}
                                </span>
                              )}
                              </>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopySku() }}
                              className="text-slate-600 hover:text-slate-400 transition-colors p-0.5 opacity-0 group-hover/sku:opacity-100"
                              title="Copiar SKU"
                            >
                              {skuCopied ? (
                                <span className="text-green-400 text-[10px]">✓</span>
                              ) : (
                                <Copy className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 group/codigoTop">
                            <span className="text-[11px] font-medium text-slate-500/70 uppercase tracking-wider">Cód. Universal:</span>
                            {editingCodigoUniversal ? (
                              <input
                                type="text"
                                value={codigoUniversalValue}
                                onChange={(e) => setCodigoUniversalValue(e.target.value)}
                                onBlur={handleCodigoUniversalBlur}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                                  if (e.key === "Escape") {
                                    setCodigoUniversalValue(selectedItem.codigoUniversal || "")
                                    setEditingCodigoUniversal(false)
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-light text-slate-300 tracking-wide bg-transparent border-b border-white/30 focus:border-white/60 outline-none text-center w-auto max-w-[140px]"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="text-xs font-light text-slate-400/80 tracking-wide cursor-pointer hover:text-slate-300 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setEditingCodigoUniversal(true) }}
                              >
                                {codigoUniversalValue || selectedItem.codigoUniversal || "N/A"}
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyCodigoUniversal() }}
                              className="text-slate-600 hover:text-slate-400 transition-colors p-0.5 opacity-0 group-hover/codigoTop:opacity-100"
                              title="Copiar Código Universal"
                            >
                              {codigoUniversalCopied ? (
                                <span className="text-green-400 text-[10px]">✓</span>
                              ) : (
                                <Copy className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      */}

                                          </div>
                  </div>

                  {/* BACK SIDE */}
                  <div
                    className={`absolute inset-0 p-6 px-8 pr-11 border-solid border border-black rounded-xl bg-black shadow-md pl-11 ml-0 ${!isCardFlipped ? "pointer-events-none" : ""}`}
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {/* Flip back clickable area - just the top-right corner for Volver button */}
                    <button
                      onClick={() => setIsCardFlipped(false)}
                      className="absolute top-0 right-0 w-32 h-12 cursor-pointer z-10 flex items-center justify-end pr-6 gap-1 text-slate-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      <span className="text-[11px] uppercase tracking-wider">Volver</span>
                    </button>

                    <div className="flex flex-col h-full pt-2 overflow-y-auto overflow-x-hidden">
                      {/* Códigos Section */}
                      <div className="mb-5">
                        <h3 className="text-sm font-medium uppercase tracking-wider mb-4 text-slate-50">
                          Códigos
                        </h3>

                        {/* Cod. Universal */}
                        <div className="mb-4 group/codUniversal">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Cod. Universal</span>
                            <div className="relative">
                              <div className="peer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-600 cursor-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 16v-4" />
                                  <path d="M12 8h.01" />
                                </svg>
                              </div>
                              <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 w-48 leading-relaxed opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-xl">
                                Número único de 8 a 14 dígitos, generalmente impreso bajo el código de barras, que identifica un producto a nivel global.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-sm font-semibold text-slate-200 tracking-wide cursor-pointer hover:text-slate-100 transition-colors truncate"
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalCodigoUniversalValue(codigoUniversalValue || selectedItem.codigoUniversal || "")
                                setIsEditCodigoUniversalModalOpen(true)
                              }}
                            >
                              {codigoUniversalValue || selectedItem.codigoUniversal || (
                                <span className="text-slate-500 italic font-normal">Agregar...</span>
                              )}
                            </span>
                            <Pencil className="h-3 w-3 text-slate-500 opacity-0 group-hover/codUniversal:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </div>

                        {/* Horizontal divider */}
                        <div className="border-t border-slate-700/50 mb-4" />

                        {/* Cod. Proveedor */}
                        <div className="group/codProveedor">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Cod. Proveedor</span>
                            <div className="relative">
                              <div className="peer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-600 cursor-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 16v-4" />
                                  <path d="M12 8h.01" />
                                </svg>
                              </div>
                              <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 w-48 leading-relaxed opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 z-[100] pointer-events-none shadow-xl">
                                Identificador único que el proveedor le asigna a un producto.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-sm font-semibold text-slate-200 tracking-wide cursor-pointer hover:text-slate-100 transition-colors truncate"
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalCodigoProveedorValue(codigoProveedor || "")
                                setIsEditCodigoProveedorModalOpen(true)
                              }}
                            >
                              {codigoProveedor || (
                                <span className="text-slate-500 italic font-normal">Agregar...</span>
                              )}
                            </span>
                            <Pencil className="h-3 w-3 text-slate-500 opacity-0 group-hover/codProveedor:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-700 mb-4"></div>

                      {/* Media Section */}
                      <h3 className="text-sm font-medium uppercase tracking-wider mb-3 text-slate-50">
                        Media
                      </h3>
                      <div className="flex gap-3 mb-5">
                        {/* Upload Button */}
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-blue-400/60 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                        >
                          <Upload className="w-5 h-5 text-blue-400" />
                          <span className="text-[10px] text-blue-400 font-medium">Seleccionar</span>
                        </button>

                        {/* Photo Thumbnails */}
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {mediaPhotos.map((photo, index) => (
                            <div
                              key={index}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation()
                                setDraggedPhotoIndex(index)
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (draggedPhotoIndex !== null && draggedPhotoIndex !== index) {
                                  const newPhotos = [...mediaPhotos]
                                  const [draggedPhoto] = newPhotos.splice(draggedPhotoIndex, 1)
                                  newPhotos.splice(index, 0, draggedPhoto)
                                  setMediaPhotos(newPhotos)
                                }
                                setDraggedPhotoIndex(null)
                              }}
                              onDragEnd={() => setDraggedPhotoIndex(null)}
                              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 cursor-move group ${draggedPhotoIndex === index ? 'opacity-50 border-blue-400' : 'border-slate-600 hover:border-slate-400'
                                }`}
                            >
                              <img
                                src={photo}
                                alt={`Product photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />

                              {/* Delete button - currently disabled/does nothing */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // TODO: Implement delete functionality
                                }}
                                className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                              >
                                <X className="w-3 h-3 text-slate-600" />
                              </button>

                              {/* Portada tag for first photo */}
                              {index === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 px-1">
                                  <span className="text-[8px] font-bold text-white uppercase tracking-wider">Portada</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-700 mb-4"></div>

                      {/* Descripción Section */}
                      <h3 className="text-sm font-medium uppercase tracking-wider mb-3 text-slate-50">
                        Descripción
                      </h3>
                      <div className="mb-5">
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            setModalDescripcionValue(descripcionValue)
                            setIsEditDescripcionModalOpen(true)
                          }}
                          className="w-full min-h-[100px] px-3 py-2 bg-slate-800/30 rounded-lg text-slate-200 cursor-pointer hover:bg-slate-800/40 transition-colors text-sm"
                        >
                          {descripcionValue || (
                            <span className="text-slate-500 hover:text-slate-400 transition-colors">Agregar descripción...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Right Column - Variantes Card (only for parent items, hidden when matrix is expanded) */}
          {isViewingContainer && !isExpandedMatrixOpen && (
            <div className="col-span-5 order-2 self-start flex flex-col">
              <div className="sticky top-4 p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                {/* Flush tab bar */}
                <div className="z-20 mb-0 -mx-6 -mt-6 flex flex-col rounded-t-2xl overflow-hidden">
                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => setRightCardMode("info")}
                      className={`flex-1 flex items-center justify-center py-3.5 transition-all duration-200 cursor-pointer relative ${rightCardMode === "info" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest">Info</span>
                      {rightCardMode === "info" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />}
                    </button>
                    <button
                      onClick={() => setRightCardMode("atributos")}
                      className={`flex-1 flex items-center justify-center py-3.5 transition-all duration-200 cursor-pointer relative ${rightCardMode === "atributos" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest">Atributos</span>
                      {rightCardMode === "atributos" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />}
                    </button>
                  </div>
                  {/* Shared info notice — only in edit mode */}
                  {isRightEditing && (
                    <div className="px-6 pt-4 pb-0">
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {rightCardMode === "info"
                          ? "Esta información es compartida por todas las variantes."
                          : "Estos atributos son compartidos por todas las variantes. El valor puede asignarse desde acá, o marcarse para completarse en cada variante."}
                      </p>
                      <div className="mt-3 border-b border-slate-100" />
                    </div>
                  )}
                </div>

                {/* Info tab */}
                {rightCardMode === "info" && (
                  <div className="h-full flex flex-col mt-4">

                    {/* ── INFORMACIÓN DEL PRODUCTO ── */}
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">
                      Información del Producto
                    </h3>

                    {isRightEditing ? (
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Categoría</label>
                            <input
                              type="text"
                              value={categoria}
                              onChange={(e) => handleFieldChange("categoria", e.target.value, setCategoria)}
                              className="px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                              placeholder="Escribir categoría..."
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Marca</label>
                            <input
                              type="text"
                              value={marca}
                              onChange={(e) => handleFieldChange("marca", e.target.value, setMarca)}
                              className="px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                              placeholder="Escribir marca..."
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1 relative" ref={proveedorDropdownRef}>
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Proveedor</label>
                            <button
                              type="button"
                              onClick={() => setProveedorDropdownOpen((o) => !o)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm text-left flex items-center justify-between hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                            >
                              <span className={proveedor ? "text-slate-800" : "text-slate-400"}>{proveedor || "Seleccionar..."}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            </button>
                            {proveedorDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden" onMouseDown={(e) => e.preventDefault()}>
                                <button type="button" onClick={() => { handleFieldChange("proveedor", "", setProveedor); setProveedorDropdownOpen(false); setProveedorSearch("") }} className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-sm text-slate-500 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                  <span>Sin proveedor</span>
                                  {!proveedor && <Check className="w-3.5 h-3.5 text-slate-400" />}
                                </button>
                                <button type="button" onClick={() => { setProveedorDropdownOpen(false); setIsNuevoProveedorModalOpen(true) }} className="w-full px-3 py-2.5 flex items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                                  Nuevo proveedor
                                </button>
                                <div className="px-3 py-2 border-b border-slate-100">
                                  <input type="text" value={proveedorSearch} onChange={(e) => setProveedorSearch(e.target.value)} placeholder="Buscar proveedor..." className="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400" autoFocus />
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {proveedores.length === 0 ? (
                                    <p className="px-3 py-3 text-sm text-slate-400 text-center">Sin proveedores</p>
                                  ) : (() => {
                                    const filtered = [...proveedores].map((p) => ({ p, displayName: p.tipo === "empresa" ? (p.razonSocial || p.nombre) : `${p.nombre}${p.apellido ? " " + p.apellido : ""}` })).sort((a, b) => a.displayName.localeCompare(b.displayName, "es")).filter(({ displayName }) => displayName.toLowerCase().includes(proveedorSearch.toLowerCase()))
                                    return filtered.length === 0 ? <p className="px-3 py-3 text-sm text-slate-400 text-center">Sin resultados</p> : filtered.map(({ p, displayName }) => (
                                      <button key={p.id} type="button" onClick={() => { handleFieldChange("proveedor", displayName, setProveedor); setProveedorDropdownOpen(false); setProveedorSearch("") }} className="w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <span>{displayName}</span>
                                        {proveedor === displayName && <Check className="w-3.5 h-3.5 text-slate-500" />}
                                      </button>
                                    ))
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                        <div className="grid grid-cols-2 divide-x divide-slate-200">
                          <div className="px-4 py-3 flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Categoría</span>
                            <span className="text-[15px] font-medium text-slate-800 leading-snug">{categoria || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                          </div>
                          <div className="px-4 py-3 flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Marca</span>
                            <span className="text-[15px] font-medium text-slate-800 leading-snug">{marca || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-200 px-4 py-3 flex flex-col gap-1">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Proveedor</span>
                          <span className="text-[15px] font-medium text-slate-800 leading-snug">{proveedor || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                        </div>
                      </div>
                    )}

                    {/* ── PRESENTACIÓN ── */}
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 mt-5">
                      Presentación
                    </h3>

                    {isRightEditing ? (
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Formato de venta</label>
                            <select value={formatoVenta} onChange={(e) => handleFieldChange("formatoVenta", e.target.value, setFormatoVenta)} className="px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none transition-all text-sm bg-white border-slate-200 text-slate-800 cursor-pointer hover:border-slate-300">
                              <option value="unidad">Unidad</option>
                              <option value="pack">Pack</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidades por pack</label>
                            <input type="text" value={formatoVenta === "unidad" ? "1" : (unidadesPorPack === "N.E." ? "" : unidadesPorPack)} onChange={(e) => { const value = e.target.value; if (value === "") { handleFieldChange("unidadesPorPack", "N.E.", setUnidadesPorPack) } else if (/^\d+$/.test(value)) { const numValue = Number.parseInt(value); handleFieldChange("unidadesPorPack", numValue < 1 ? "1" : value, setUnidadesPorPack) } }} disabled={formatoVenta === "unidad"} className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${formatoVenta === "unidad" ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`} placeholder="N.E." />
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2.5">
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contenido</label>
                            <button onClick={() => handleFieldChange("volumenActive", !volumenActive, setVolumenActive)} className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${volumenActive ? "bg-slate-800" : "bg-slate-200"}`}>
                              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${volumenActive ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                          </div>
                          {volumenActive && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Cantidad</label>
                                <input type="number" value={volumenCantidad} onChange={(e) => handleFieldChange("volumenCantidad", e.target.value, setVolumenCantidad)} className="px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm bg-white border-slate-200 text-slate-800 hover:border-slate-300" placeholder="0" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidad de medida</label>
                                <select value={volumenUnidad} onChange={(e) => handleFieldChange("volumenUnidad", e.target.value, setVolumenUnidad)} className="px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none transition-all text-sm bg-white border-slate-200 text-slate-800 cursor-pointer hover:border-slate-300">
                                  <option value="ml">mL</option>
                                  <option value="l">L</option>
                                  <option value="mg">mg</option>
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                  <option value="cm">cm</option>
                                  <option value="mm">mm</option>
                                  <option value="cm3">cm³</option>
                                  <option value="m3">m³</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                        {catalogo.incluirVencimiento && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2.5">
                              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Vencimiento</label>
                              <button onClick={() => setVencimientoActive(!vencimientoActive)} className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${vencimientoActive ? "bg-slate-800" : "bg-slate-200"}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${vencimientoActive ? "translate-x-4" : "translate-x-0"}`} />
                              </button>
                            </div>
                            {vencimientoActive && (
                              <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800 text-sm transition-all hover:border-slate-300" />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                          <div className="grid grid-cols-2 divide-x divide-slate-200">
                            <div className="px-4 py-3 flex flex-col gap-1">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Formato de venta</span>
                              <span className="text-[15px] font-medium text-slate-800 leading-snug capitalize">{formatoVenta || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                            </div>
                            <div className="px-4 py-3 flex flex-col gap-1">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidades por pack</span>
                              <span className="text-[15px] font-medium text-slate-800 leading-snug">{formatoVenta === "unidad" ? "1" : (unidadesPorPack || <span className="text-slate-300 font-normal">No aplica</span>)}</span>
                            </div>
                          </div>
                        </div>
                        {volumenActive && (
                          <>
                            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 mt-5">Contenido</h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                              <div className="grid grid-cols-2 divide-x divide-slate-200">
                                <div className="px-4 py-3 flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Cantidad</span>
                                  <span className="text-[15px] font-medium text-slate-800 leading-snug">{volumenCantidad || <span className="text-slate-300 font-normal">No especificado</span>}</span>
                                </div>
                                <div className="px-4 py-3 flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidad de medida</span>
                                  <span className="text-[15px] font-medium text-slate-800 leading-snug">{volumenUnidad ? ({ ml: "mL", l: "L", mg: "mg", g: "g", kg: "kg", cm: "cm", mm: "mm", cm3: "cm³", m3: "m³" } as Record<string, string>)[volumenUnidad] ?? volumenUnidad : <span className="text-slate-300 font-normal">No especificado</span>}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {catalogo.incluirVencimiento && vencimientoActive && (
                          <>
                            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 mt-5">Vencimiento</h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                              <div className="px-4 py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fecha de vencimiento</span>
                                <span className="text-[15px] font-medium text-slate-800 leading-snug">{fechaVencimiento || <span className="text-slate-300 font-normal">No especificado</span>}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Atributos tab */}
                {rightCardMode === "atributos" && (
                  <div className="h-full flex flex-col mt-2">
                    {!showAtributosView ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                        <p className="text-slate-400 text-sm">No hay atributos configurados</p>
                        {isRightEditing && (
                          <button onClick={() => setShowAtributosView(true)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all text-sm font-medium cursor-pointer">
                            Agregar atributos
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Atributos Informativos</h3>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-slate-400 cursor-pointer shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px] text-xs">
                                Atributos que describen propiedades adicionales del producto
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {isRightEditing ? (
                          <div className="flex flex-col gap-2">
                            {/* Column headers */}
                            <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 2fr auto auto" }}>
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">Atributo</span>
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">Valor</span>
                              <span className="w-7" title="Variantes completan">
                                <ArrowDownToLine className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                              </span>
                              <span className="w-8" />
                            </div>

                            {atributosInformativos.map((attr, index) => (
                              <div key={index} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 2fr auto auto" }}>
                                <input
                                  type="text"
                                  value={attr.key}
                                  onChange={(e) => { const updated = [...atributosInformativos]; updated[index].key = e.target.value; handleAtributosInformativosChange(updated) }}
                                  className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                                  placeholder="Ej: Color"
                                />
                                <input
                                  type="text"
                                  value={attr.value}
                                  onChange={(e) => { if (!attr.inheritValue) { const updated = [...atributosInformativos]; updated[index].value = e.target.value; handleAtributosInformativosChange(updated) } }}
                                  disabled={!!attr.inheritValue}
                                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all ${attr.inheritValue ? "bg-slate-50 border-dashed border-2 border-slate-300 text-slate-400 cursor-not-allowed italic" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`}
                                  placeholder={attr.inheritValue ? "Variantes completarán..." : "Ej: Negro"}
                                />
                                <button
                                  onClick={() => { const updated = [...atributosInformativos]; updated[index].inheritValue = !updated[index].inheritValue; if (updated[index].inheritValue) updated[index].value = ""; handleAtributosInformativosChange(updated) }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${attr.inheritValue ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                                  title={attr.inheritValue ? "Desactivar — variantes ya no completarán" : "Variantes completarán el valor"}
                                >
                                  <ArrowDownToLine className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { const updated = atributosInformativos.filter((_, i) => i !== index); handleAtributosInformativosChange(updated); if (updated.length === 0) setShowAtributosView(false) }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-400 hover:border-red-200 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            <button
                              onClick={() => handleAtributosInformativosChange([...atributosInformativos, { key: "", value: "" }])}
                              className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar atributo
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="grid gap-4 pb-2 border-b border-slate-200" style={{ gridTemplateColumns: "1fr 2fr" }}>
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Atributo</span>
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Valor</span>
                            </div>
                            {atributosInformativos.map((attr, index) => (
                              <div key={index} className="grid gap-4 py-3 border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: "1fr 2fr" }}>
                                <span className="text-[13px] font-medium text-slate-600">{attr.key || <span className="text-slate-300 font-normal">—</span>}</span>
                                <span className="text-[15px] font-semibold text-slate-800">{attr.value || (attr.inheritValue ? <span className="text-slate-400 italic text-[13px] font-normal">Varía por variante</span> : <span className="text-slate-300 font-normal">No aplica</span>)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info/Atributos Column - col-span-6 for standalone/children, col-span-1 for container */}
          <div className={`flex flex-col transition-all duration-500 overflow-hidden pb-0 ${isViewingContainer ? "order-1 col-span-5 pt-6 pb-8 px-8 bg-gradient-to-b from-white to-slate-50/30 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)] border border-slate-200/60" : "order-2 col-span-6 relative pb-8 px-8 bg-gradient-to-b from-white to-slate-50/30 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-200/60 z-10"}`}>

            {/* Title Header for Parent Items */}
            {isViewingContainer && (
              <div className="mb-3 pb-5 border-b border-slate-200/60 -mt-6 -mx-8 px-8 pt-6 rounded-t-2xl bg-gradient-to-b from-white to-slate-50/30">
                <button
                  className="group/title flex items-center gap-2 min-w-0 max-w-full text-left cursor-pointer"
                  onClick={() => { setModalNombreValue(selectedItem.name || ""); setIsEditNombreModalOpen(true) }}
                  title="Editar nombre"
                >
                  <h2 className="font-bold text-slate-900 text-xl truncate leading-tight group-hover/title:text-slate-600 transition-colors">{selectedItem.name}</h2>
                  <Pencil className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
                </button>
                <p className="text-[10px] uppercase tracking-widest mt-1.5 text-slate-400 font-medium">Agrupador de variantes</p>
              </div>
            )}

            {/* Flush tab bar (only for non-container items) */}
            {!isViewingContainer && (
              <div className="z-20 mb-6 sticky top-[0px] -mx-8 flex flex-col rounded-t-2xl overflow-hidden">
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setSelectedDetailTab("info")}
                    className={`flex-1 flex items-center justify-center py-3.5 transition-all duration-200 cursor-pointer relative ${
                      selectedDetailTab === "info"
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest">Info</span>
                    {selectedDetailTab === "info" && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedDetailTab("atributos")}
                    className={`flex-1 flex items-center justify-center py-3.5 transition-all duration-200 cursor-pointer relative ${
                      selectedDetailTab === "atributos"
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest">Atributos</span>
                    {selectedDetailTab === "atributos" && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />
                    )}
                  </button>
                </div>
                {/* Shared info notice — only in edit mode */}
                {isRightEditing && (
                  <div className="px-8 pt-4 pb-0">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {isChildItem
                        ? selectedDetailTab === "info"
                          ? "Esta información se completa desde el agrupador y es compartida por todas las variantes."
                          : "Los atributos no editables se completan desde el agrupador y son compartidos por todas las variantes."
                        : selectedDetailTab === "info"
                          ? "Esta información es compartida por todas las variantes."
                          : "Estos atributos son compartidos por todas las variantes."}
                    </p>
                    <div className="mt-3 border-b border-slate-100" />
                  </div>
                )}
              </div>
            )}

            {/* Tab Content */}
            {(
              <div className="flex-1 w-full overflow-hidden">
                {isViewingContainer && isExpandedMatrixOpen ? (
                  // Expanded Variant Matrix View (single card mode)
                  <div className="h-full flex flex-col py-2">
                    {/* Atributos de Variantes section - 50% width - ABOVE matrix */}
                    <div className="mb-6 pb-6 border-b border-gray-200 w-1/2">
                      {!showAtributosView ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                          <p className="text-gray-500 text-sm">No hay atributos configurados</p>
                          <button
                            onClick={() => setShowAtributosView(true)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors cursor-pointer"
                          >
                            Agregar atributo
                          </button>
                        </div>
                      ) : (
                        <div>
                          {/* Collapsible header */}
                          <button
                            onClick={() => setIsAtributosCollapsed((prev) => !prev)}
                            className="w-full flex items-center justify-between mb-3 group/atributos-header cursor-pointer"
                          >
                            <div className="text-left">
                              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                                Atributos de Variantes
                              </h3>
                              {!isAtributosCollapsed && (
                                <p className="text-xs text-gray-500 italic">
                                  Atributos que definen las variantes del producto (máximo 2)
                                </p>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isAtributosCollapsed ? "" : "rotate-180"}`}
                            />
                          </button>

                          {/* Collapsible content */}
                          {!isAtributosCollapsed && (
                            <div className="flex flex-col gap-3">
                              {containerAtributosPrincipales.map((attr, index) => (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Atributo</label>
                                    <input
                                      type="text"
                                      value={attr.key}
                                      onChange={(e) => {
                                        const updated = [...containerAtributosPrincipales]
                                        updated[index].key = e.target.value
                                        handleContainerAtributosPrincipalesChange(updated)
                                      }}
                                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all hover:border-slate-300"
                                      placeholder="Ej: Color"
                                    />
                                  </div>

                                  <div className="flex-1">
                                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Variantes</label>
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={varianteInput[index] || ""}
                                        onChange={(e) =>
                                          setVarianteInput({ ...varianteInput, [index]: e.target.value })
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && varianteInput[index]?.trim()) {
                                            const newTag = varianteInput[index].trim()
                                            const updated = [...containerAtributosPrincipales]
                                            const isDuplicate = updated[index].variantes.some(
                                              (existing) => existing.toLowerCase() === newTag.toLowerCase()
                                            )
                                            if (!isDuplicate) {
                                              updated[index].variantes.push(newTag)
                                              handleContainerAtributosPrincipalesChange(updated)
                                              setDuplicateTagError({ ...duplicateTagError, [index]: false })
                                            } else {
                                              setDuplicateTagError({ ...duplicateTagError, [index]: true })
                                              setTimeout(() => {
                                                setDuplicateTagError((prev) => ({ ...prev, [index]: false }))
                                              }, 2000)
                                            }
                                            setVarianteInput({ ...varianteInput, [index]: "" })
                                          }
                                        }}
                                        onFocus={() => setDuplicateTagError({ ...duplicateTagError, [index]: false })}
                                        placeholder="Ej: Rojo"
                                        className={`w-full px-3 py-2.5 bg-white border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all hover:border-slate-300 text-sm ${duplicateTagError[index]
                                          ? "border-red-400 focus:ring-red-400"
                                          : "border-slate-200 focus:ring-slate-300"
                                          }`}
                                      />

                                      {duplicateTagError[index] && (
                                        <p className="text-red-500 text-xs mt-1 font-medium animate-pulse">
                                          Este tag ya existe
                                        </p>
                                      )}

                                      <div className="flex flex-wrap gap-2">
                                        {attr.variantes.map((variante, vIndex) => {
                                          const existingVariants = selectedItem?.variants || []
                                          const otherAttrIndex = index === 0 ? 1 : 0
                                          const otherAttr = containerAtributosPrincipales[otherAttrIndex]
                                          let isComplete = true
                                          if (existingVariants.length > 0 && otherAttr && otherAttr.variantes.length > 0) {
                                            for (const otherValue of otherAttr.variantes) {
                                              const hasCombination = existingVariants.some((v: any) => {
                                                if (!v.atributosPrincipales) return false
                                                const attr1Val = v.atributosPrincipales[0]?.value
                                                const attr2Val = v.atributosPrincipales[1]?.value
                                                if (index === 0) {
                                                  return attr1Val === variante && attr2Val === otherValue
                                                } else {
                                                  return attr1Val === otherValue && attr2Val === variante
                                                }
                                              })
                                              if (!hasCombination) { isComplete = false; break }
                                            }
                                          } else if (existingVariants.length > 0 && containerAtributosPrincipales.length === 1) {
                                            isComplete = existingVariants.some((v: any) => {
                                              if (!v.atributosPrincipales) return false
                                              return v.atributosPrincipales[0]?.value === variante
                                            })
                                          } else if (existingVariants.length === 0) {
                                            isComplete = false
                                          }
                                          return (
                                            <span
                                              key={vIndex}
                                              className={`px-3 py-1.5 bg-white rounded-md text-sm flex items-center gap-2 ${isComplete
                                                ? "border border-gray-300 text-gray-900"
                                                : "border-2 border-dashed border-gray-300 text-gray-500"
                                                }`}
                                            >
                                              {variante}
                                              <button
                                                onClick={() => {
                                                  const updated = [...containerAtributosPrincipales]
                                                  updated[index].variantes = updated[index].variantes.filter((_, i) => i !== vIndex)
                                                  const updatedVariants = (selectedItem?.variants || []).filter((v: any) => {
                                                    if (!v.atributosPrincipales) return true
                                                    if (index === 0) return v.atributosPrincipales[0]?.value !== variante
                                                    else return v.atributosPrincipales[1]?.value !== variante
                                                  })
                                                  setContainerAtributosPrincipales(updated)
                                                  setVariantItems(convertSavedVariantsToDisplay(updatedVariants))
                                                  if (onFieldChange && selectedItem.sku) {
                                                    onFieldChange(selectedItem.id, "containerAtributosPrincipales", updated)
                                                    onFieldChange(selectedItem.id, "variants", updatedVariants)
                                                  }
                                                }}
                                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </span>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      const updated = containerAtributosPrincipales.filter((_, i) => i !== index)
                                      handleContainerAtributosPrincipalesChange(updated)
                                      setVariantItems([])
                                      if (onFieldChange && selectedItem?.id) {
                                        onFieldChange(selectedItem.id, "variants", [])
                                      }
                                      if (updated.length === 0 && atributosInformativos.length === 0) {
                                        setShowAtributosView(false)
                                      }
                                    }}
                                    className="mt-8 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}

                              {containerAtributosPrincipales.length < 2 && (
                                <button
                                  onClick={() => {
                                    handleContainerAtributosPrincipalesChange([
                                      ...containerAtributosPrincipales,
                                      { key: "", variantes: [] },
                                    ])
                                  }}
                                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-sm">Agregar atributo</span>
                                </button>
                              )}

                              {containerAtributosPrincipales.length > 0 && (() => {
                                const hasAtLeastOneVariante = containerAtributosPrincipales.some(
                                  (attr) => attr.key.trim() !== "" && attr.variantes.length > 0
                                )
                                const existingVariants = selectedItem?.variants || []
                                const potentialNewVariants = generateNewVariantCombinations(existingVariants)
                                const isEnabled = hasAtLeastOneVariante && potentialNewVariants.length > 0
                                return (
                                  <button
                                    onClick={handleGenerarVariantes}
                                    disabled={!isEnabled}
                                    className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${isEnabled
                                      ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      }`}
                                  >
                                    Generar Variantes
                                  </button>
                                )
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Variantes header with Nueva Variante button */}
                    {variantItems.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                            {variantItems.length} {variantItems.length === 1 ? "Variante" : "Variantes"}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsExpandedMatrixOpen(false)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Minimizar"
                            >
                              <Minimize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setIsNuevaVarianteModalOpen(true)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Nueva Variante</span>
                            </button>
                          </div>
                        </div>

                        {/* SKU Prefijo */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 group/skupadre">
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                              SKU Prefijo
                            </span>
                            {editingSkuPadre ? (
                              <input
                                type="text"
                                value={skuValue}
                                autoFocus
                                onChange={(e) => setSkuValue(e.target.value.toUpperCase())}
                                onBlur={() => {
                                  setEditingSkuPadre(false)
                                  const currentPrefix = selectedItem?.skuPrefix || selectedItem?.sku || ""
                                  if (skuValue !== currentPrefix) {
                                    onFieldChange(selectedItem.id, "skuPrefix", skuValue)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                                  if (e.key === "Escape") {
                                    setSkuValue(selectedItem?.skuPrefix || selectedItem?.sku || "")
                                    setEditingSkuPadre(false)
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="font-mono text-sm text-slate-800 bg-transparent border-b border-slate-400 focus:border-slate-600 focus:outline-none w-full max-w-[180px]"
                                placeholder="Ej: VNO-KNECHT"
                              />
                            ) : (
                              <div
                                className="flex items-center gap-1.5 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingSkuPadre(true)
                                }}
                              >
                                <span className="font-mono text-sm text-slate-800">{skuValue || selectedItem?.skuPrefix || selectedItem?.sku}</span>
                                <Pencil className="w-3 h-3 text-slate-400/60 opacity-0 group-hover/skupadre:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 italic">
                            Base para generar SKUs de variantes
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Variant Matrix Table */}
                    <div className="bg-white border border-border/40 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-[40px_1fr_minmax(120px,1fr)_minmax(100px,0.8fr)_100px_100px_1fr] bg-slate-50 border-b border-border/30">
                        <div className="px-2 py-3" />
                        <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Variante</div>
                        <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">SKU</div>
                        <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cód. Universal</div>
                        <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Precio Final</div>
                        <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Stock Disp.</div>
                        <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Descripción</div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-border/30">
                        {variantItems.map((variant) => {
                          const sourceVariant = selectedItem?.variants?.find((v: any) => {
                            if (!v.atributosPrincipales) return false
                            const hasMatchingAttr1 = variant.variant1
                              ? v.atributosPrincipales.some((attr: any) => attr.value === variant.variant1)
                              : true
                            const hasMatchingAttr2 = variant.variant2
                              ? v.atributosPrincipales.some((attr: any) => attr.value === variant.variant2)
                              : true
                            return hasMatchingAttr1 && hasMatchingAttr2
                          })

                          return (
                            <div
                              key={variant.id || variant.skuSuffix || variant.sku}
                              className="grid grid-cols-[40px_1fr_minmax(120px,1fr)_minmax(100px,0.8fr)_100px_100px_1fr] items-center hover:bg-accent/30 transition-colors"
                            >
                              {/* Thumbnail - with edit pencil on hover */}
                              <div className="px-2 py-2 flex items-center justify-center">
                                <div
                                  className="relative w-8 h-8 rounded-md bg-gradient-to-br from-muted to-muted/50 overflow-hidden flex-shrink-0 flex items-center justify-center group/thumb cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedMatrixMediaModal({ open: true, variant: { ...variant, sourceVariant } })
                                  }}
                                >
                                  <Image
                                    src={getItemPhoto((sourceVariant as any)?.media ? sourceVariant as any : selectedItem)}
                                    alt={selectedItem?.categoria || ""}
                                    width={32}
                                    height={32}
                                    className={`w-full h-full object-cover ${!sourceVariant?.imagenUrl ? "w-5 h-5 object-contain opacity-60" : ""}`}
                                  />
                                  {/* Edit pencil overlay */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                    <Pencil className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                              </div>

                              {/* Variant tags - clickable to navigate to child */}
                              <div
                                className="px-3 py-2 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 rounded transition-colors"
                                onClick={() => { if (variant.id) router.push(`/catalogo/items/${variant.id}`) }}
                              >
                                {variant.variant1 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[80px]">
                                    {variant.variant1}
                                  </span>
                                )}
                                {variant.variant1 && variant.variant2 && (
                                  <span className="text-[9px] text-muted-foreground/50 font-medium">×</span>
                                )}
                                {variant.variant2 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[80px]">
                                    {variant.variant2}
                                  </span>
                                )}
                              </div>

                              {/* SKU - editable */}
                              <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center w-full">
                                  <span className="text-[11px] font-mono text-muted-foreground/60 select-none whitespace-nowrap">
                                    {skuValue}-
                                  </span>
                                  <input
                                    type="text"
                                    value={variant.skuSuffix}
                                    onChange={(e) => {
                                      const newSuffix = e.target.value
                                      setVariantItems((prev) =>
                                        prev.map((v) => v.id === variant.id ? { ...v, skuSuffix: newSuffix } : v)
                                      )
                                      const updatedVariants = (selectedItem?.variants || []).map((ov: any) =>
                                        ov.id === variant.id ? { ...ov, skuSuffix: newSuffix } : ov
                                      )
                                      onFieldChange(selectedItem.id, "variants", updatedVariants)
                                    }}
                                    className="flex-1 min-w-0 bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-primary/50 px-0 py-0.5 text-[11px] font-mono text-foreground focus:outline-none transition-colors"
                                    placeholder="sufijo..."
                                  />
                                </div>
                              </div>

                              {/* Código Universal - editable */}
                              <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={sourceVariant?.codigoUniversal || ""}
                                  onChange={(e) => {
                                    const newCodigo = e.target.value
                                    const updatedVariants = (selectedItem?.variants || []).map((ov: any) =>
                                      ov.id === variant.id ? { ...ov, codigoUniversal: newCodigo } : ov
                                    )
                                    onFieldChange(selectedItem.id, "variants", updatedVariants)
                                  }}
                                  className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-primary/50 px-0 py-0.5 text-[11px] font-mono text-foreground focus:outline-none transition-colors"
                                  placeholder="Ej: 7790001234567"
                                />
                              </div>

                              {/* Precio Final - clickable */}
                              <div
                                className="px-3 py-2 text-right cursor-pointer hover:bg-slate-100 rounded transition-colors group/precio"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const precio = sourceVariant?.precio || { costo: 0, margen: 0, iva: 0, precioFinal: 0 }
                                  setExpandedMatrixPrecioValues({
                                    costo: precio.costo || 0,
                                    margen: precio.margen || 0,
                                    iva: precio.iva || 0,
                                    precioFinal: precio.precioFinal || 0,
                                  })
                                  setExpandedMatrixPrecioModal({ open: true, variant: { ...variant, sourceVariant } })
                                }}
                              >
                                <span className="text-sm font-medium text-foreground group-hover/precio:text-blue-600 transition-colors">
                                  ${Math.round(sourceVariant?.precio?.precioFinal || 0).toLocaleString("es-AR")}
                                </span>
                              </div>

                              {/* Stock Disponible - clickable */}
                              <div
                                className="px-3 py-2 text-center cursor-pointer hover:bg-slate-100 rounded transition-colors group/stock"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const stock = sourceVariant?.stock || { enStock: "0", reservado: "0" }
                                  setExpandedMatrixStockValues({
                                    total: parseInt((stock as any).enStock || (stock as any).total || "0") || 0,
                                    reservado: parseInt(stock.reservado) || 0,
                                  })
                                  setExpandedMatrixActiveStockEdit("total")
                                  setExpandedMatrixStockModification({
                                    total: { operation: "agregar", value: "" },
                                    reservado: { operation: "agregar", value: "" },
                                  })
                                  setExpandedMatrixStockModal({ open: true, variant: { ...variant, sourceVariant } })
                                }}
                              >
                                <span className={`text-sm font-medium tabular-nums group-hover/stock:text-blue-600 transition-colors ${(sourceVariant?.stock?.disponible ?? 0) > 0
                                  ? "text-foreground"
                                  : (sourceVariant?.stock?.disponible ?? 0) < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                  }`}>
                                  {sourceVariant?.stock?.disponible ?? 0}
                                </span>
                              </div>

                              {/* Descripción - clickable to open modal */}
                              <div
                                className="px-3 py-2 cursor-pointer hover:bg-slate-100 rounded transition-colors group/desc"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedMatrixDescModal({
                                    open: true,
                                    variant: { ...variant, sourceVariant },
                                    value: sourceVariant?.descripcion || ""
                                  })
                                }}
                              >
                                <span className="text-[11px] text-foreground group-hover/desc:text-blue-600 transition-colors line-clamp-1">
                                  {sourceVariant?.descripcion || <span className="text-muted-foreground italic">Descripción...</span>}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : isViewingContainer ? (
                  // Container item tab content (dual card mode)
                  <>
                    {selectedDetailTab === "info" && (
                      <div className="h-full flex flex-col py-2">
                        {showAtributosView && (
                          <div className="mb-6">
                            {/* Collapsible content always shown */}
                            {!isAtributosCollapsed && (
                              <div className="flex flex-col gap-3">
                                {containerAtributosPrincipales.map((attr, index) => (
                                  <div key={index} className="flex items-start gap-3">
                                    <div className="flex-1">
                                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Atributo</label>
                                      <input
                                        type="text"
                                        value={attr.key}
                                        onChange={(e) => {
                                          const updated = [...containerAtributosPrincipales]
                                          updated[index].key = e.target.value
                                          handleContainerAtributosPrincipalesChange(updated)
                                        }}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all hover:border-slate-300"
                                        placeholder="Ej: Color"
                                      />
                                    </div>

                                    <div className="flex-1">
                                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Variantes</label>
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={varianteInput[index] || ""}
                                          onChange={(e) =>
                                            setVarianteInput({ ...varianteInput, [index]: e.target.value })
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && varianteInput[index]?.trim()) {
                                              const newTag = varianteInput[index].trim()
                                              const updated = [...containerAtributosPrincipales]
                                              const isDuplicate = updated[index].variantes.some(
                                                (existing) => existing.toLowerCase() === newTag.toLowerCase()
                                              )
                                              if (!isDuplicate) {
                                                updated[index].variantes.push(newTag)
                                                handleContainerAtributosPrincipalesChange(updated)
                                                setDuplicateTagError({ ...duplicateTagError, [index]: false })
                                              } else {
                                                setDuplicateTagError({ ...duplicateTagError, [index]: true })
                                                setTimeout(() => {
                                                  setDuplicateTagError((prev) => ({ ...prev, [index]: false }))
                                                }, 2000)
                                              }
                                              setVarianteInput({ ...varianteInput, [index]: "" })
                                            }
                                          }}
                                          onFocus={() => setDuplicateTagError({ ...duplicateTagError, [index]: false })}
                                          placeholder="Ej: Rojo"
                                          className={`w-full px-3 py-2.5 bg-white border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all hover:border-slate-300 text-sm ${duplicateTagError[index]
                                            ? "border-red-400 focus:ring-red-400"
                                            : "border-slate-200 focus:ring-slate-300"
                                            }`}
                                        />

                                        {duplicateTagError[index] && (
                                          <p className="text-red-500 text-xs mt-1 font-medium animate-pulse">
                                            Este tag ya existe (no se permiten duplicados, incluso con diferente capitalización)
                                          </p>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                          {attr.variantes.map((variante, vIndex) => {
                                            const existingVariants = selectedItem?.variants || []
                                            const otherAttrIndex = index === 0 ? 1 : 0
                                            const otherAttr = containerAtributosPrincipales[otherAttrIndex]
                                            let isComplete = true
                                            if (existingVariants.length > 0 && otherAttr && otherAttr.variantes.length > 0) {
                                              for (const otherValue of otherAttr.variantes) {
                                                const hasCombination = existingVariants.some((v: any) => {
                                                  if (!v.atributosPrincipales) return false
                                                  const attr1Val = v.atributosPrincipales[0]?.value
                                                  const attr2Val = v.atributosPrincipales[1]?.value
                                                  if (index === 0) {
                                                    return attr1Val === variante && attr2Val === otherValue
                                                  } else {
                                                    return attr1Val === otherValue && attr2Val === variante
                                                  }
                                                })
                                                if (!hasCombination) { isComplete = false; break }
                                              }
                                            } else if (existingVariants.length > 0 && containerAtributosPrincipales.length === 1) {
                                              isComplete = existingVariants.some((v: any) => {
                                                if (!v.atributosPrincipales) return false
                                                return v.atributosPrincipales[0]?.value === variante
                                              })
                                            } else if (existingVariants.length === 0) {
                                              isComplete = false
                                            }
                                            return (
                                              <span
                                                key={vIndex}
                                                className={`px-3 py-1.5 bg-white rounded-md text-sm flex items-center gap-2 ${isComplete
                                                  ? "border border-gray-300 text-gray-900"
                                                  : "border-2 border-dashed border-gray-300 text-gray-500"
                                                  }`}
                                              >
                                                {variante}
                                                <button
                                                  onClick={() => {
                                                    const updated = [...containerAtributosPrincipales]
                                                    updated[index].variantes = updated[index].variantes.filter((_, i) => i !== vIndex)
                                                    const updatedVariants = (selectedItem?.variants || []).filter((v: any) => {
                                                      if (!v.atributosPrincipales) return true
                                                      if (index === 0) return v.atributosPrincipales[0]?.value !== variante
                                                      else return v.atributosPrincipales[1]?.value !== variante
                                                    })
                                                    setContainerAtributosPrincipales(updated)
                                                    setVariantItems(convertSavedVariantsToDisplay(updatedVariants))
                                                    if (onFieldChange && selectedItem.sku) {
                                                      onFieldChange(selectedItem.id, "containerAtributosPrincipales", updated)
                                                      onFieldChange(selectedItem.id, "variants", updatedVariants)
                                                    }
                                                  }}
                                                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => {
                                        const updated = containerAtributosPrincipales.filter((_, i) => i !== index)
                                        handleContainerAtributosPrincipalesChange(updated)
                                        setVariantItems([])
                                        if (onFieldChange && selectedItem?.id) {
                                          onFieldChange(selectedItem.id, "variants", [])
                                        }
                                        if (updated.length === 0 && atributosInformativos.length === 0) {
                                          setShowAtributosView(false)
                                        }
                                      }}
                                      className="mt-8 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}

                                {containerAtributosPrincipales.length < 2 && (
                                  <button
                                    onClick={() => {
                                      handleContainerAtributosPrincipalesChange([
                                        ...containerAtributosPrincipales,
                                        { key: "", variantes: [] },
                                      ])
                                    }}
                                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm">Agregar atributo</span>
                                  </button>
                                )}

                                {containerAtributosPrincipales.length > 0 && (() => {
                                  const hasAtLeastOneVariante = containerAtributosPrincipales.some(
                                    (attr) => attr.key.trim() !== "" && attr.variantes.length > 0
                                  )
                                  const existingVariants = selectedItem?.variants || []
                                  const potentialNewVariants = generateNewVariantCombinations(existingVariants)
                                  const isEnabled = hasAtLeastOneVariante && potentialNewVariants.length > 0
                                  return (
                                    <button
                                      onClick={handleGenerarVariantes}
                                      disabled={!isEnabled}
                                      className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${isEnabled
                                        ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                    >
                                      Generar Variantes
                                    </button>
                                  )
                                })()}
                              </div>
                            )} {/* end !isAtributosCollapsed */}
                          </div>
                        )}

                        {/* Variantes header */}
                        {variantItems.length > 0 && (
                          <div className="mt-4 mb-3 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                              {variantItems.length} {variantItems.length === 1 ? "Variante" : "Variantes"}
                            </span>
                            <button
                              onClick={() => setIsExpandedMatrixOpen(true)}
                              className="px-3 py-1.5 border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Expandir</span>
                            </button>
                          </div>
                        )}

                        {variantItems.length > 0 ? (
                          <div className="bg-slate-900 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-12 border-b border-white/10">
                              <div className="col-span-1 px-1 py-2.5" />
                              <div className="col-span-5 px-3 py-2.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Variante</div>
                              <div className="col-span-4 px-3 py-2.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Precio venta</div>
                              <div className="col-span-2 px-3 py-2.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Stock</div>
                            </div>
                            <div className="divide-y divide-white/[0.06]">
                              {variantItems.map((variant) => {
                                const sourceVariant = selectedItem.variants?.find((v: any) => {
                                  if (!v.atributosPrincipales) return false
                                  const hasMatchingAttr1 = variant.variant1
                                    ? v.atributosPrincipales.some((attr: any) => attr.value === variant.variant1)
                                    : true
                                  const hasMatchingAttr2 = variant.variant2
                                    ? v.atributosPrincipales.some((attr: any) => attr.value === variant.variant2)
                                    : true
                                  return hasMatchingAttr1 && hasMatchingAttr2
                                })
                                const variantId = variant.id || sourceVariant?.id
                                const fullSku = `${skuValue}-${variant.skuSuffix || ""}`.replace(/-$/, "")
                                const stockDisp = sourceVariant?.stock?.disponible ?? 0
                                // Look up in allItems; fall back to sourceVariant data for modal purposes
                                const variantItem = variantId ? allItems?.find((i: any) => i.id === variantId) : null
                                const itemForModal = variantItem || (sourceVariant ? { ...sourceVariant, id: variantId } : null)

                                const handleDeleteVariant = () => {
                                  const attr1Value = variant.variant1
                                  const attr2Value = variant.variant2
                                  const updatedVariants = (selectedItem.variants || []).filter((v: any) => {
                                    if (!v.atributosPrincipales) return true
                                    const variantAttr1 = v.atributosPrincipales[0]?.value
                                    const variantAttr2 = v.atributosPrincipales[1]?.value
                                    if (!attr2Value) return variantAttr1 !== attr1Value
                                    return !(variantAttr1 === attr1Value && variantAttr2 === attr2Value)
                                  })
                                  const updatedContainerAttrs = containerAtributosPrincipales.map((attr, attrIndex) => {
                                    const otherAttrIndex = attrIndex === 0 ? 1 : 0
                                    const otherAttr = containerAtributosPrincipales[otherAttrIndex]
                                    if (!otherAttr || otherAttr.variantes.length === 0) {
                                      return {
                                        ...attr, variantes: attr.variantes.filter(tag =>
                                          updatedVariants.some((v: any) => v.atributosPrincipales?.[attrIndex]?.value === tag)
                                        )
                                      }
                                    }
                                    return {
                                      ...attr, variantes: attr.variantes.filter(tag =>
                                        updatedVariants.some((v: any) => {
                                          if (!v.atributosPrincipales) return false
                                          return attrIndex === 0
                                            ? v.atributosPrincipales[0]?.value === tag
                                            : v.atributosPrincipales[1]?.value === tag
                                        })
                                      )
                                    }
                                  })
                                  setVariantItems(convertSavedVariantsToDisplay(updatedVariants))
                                  const tagsChanged = JSON.stringify(containerAtributosPrincipales) !== JSON.stringify(updatedContainerAttrs)
                                  if (tagsChanged) {
                                    setContainerAtributosPrincipales(updatedContainerAttrs)
                                    if (onFieldChange && selectedItem.sku) {
                                      onFieldChange(selectedItem.id, "containerAtributosPrincipales", updatedContainerAttrs)
                                    }
                                  }
                                  if (onFieldChange && selectedItem.sku) {
                                    onFieldChange(selectedItem.id, "variants", updatedVariants)
                                  }
                                }

                                return (
                                  <div
                                    key={variant.id || variant.skuSuffix || variant.sku}
                                    onClick={() => { if (variantId) router.push(`/catalogo/items/${variantId}`) }}
                                    className="group grid grid-cols-12 items-center hover:bg-white/[0.04] transition-colors cursor-pointer"
                                  >
                                    {/* Thumbnail — pencil only on thumbnail hover */}
                                    <div className="col-span-1 pl-2 py-2.5 flex items-center justify-center">
                                      <div className="group/thumb w-9 h-9 shrink-0 rounded-md bg-white/10 overflow-hidden flex items-center justify-center relative cursor-pointer">
                                        <Image
                                          src={getItemPhoto(variantItem || selectedItem)}
                                          alt={selectedItem?.categoria || ""}
                                          width={36}
                                          height={36}
                                          className="object-cover w-full h-full"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                                          <Pencil className="w-3 h-3 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Variante tags + SKU below */}
                                    <div className="col-span-5 px-3 py-2.5 flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {variant.variant1 && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-slate-200 border border-white/15 truncate max-w-[70px]">
                                            {variant.variant1}
                                          </span>
                                        )}
                                        {variant.variant1 && variant.variant2 && (
                                          <span className="text-[9px] text-white/30 font-medium">×</span>
                                        )}
                                        {variant.variant2 && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-slate-200 border border-white/15 truncate max-w-[70px]">
                                            {variant.variant2}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-mono text-white/30 leading-none">
                                        {fullSku}
                                      </span>
                                    </div>

                                    {/* Precio venta — pencil on hover triggers modal */}
                                    <div
                                      className="col-span-4 px-3 py-2.5 group/precio"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (itemForModal) {
                                          setMatrixVariantItem(itemForModal)
                                          const p = sourceVariant?.precio || itemForModal.precio || {}
                                          setMatrixPrecioModalValues({ costo: p.costo ?? 0, margen: p.margen ?? 0, iva: p.iva ?? 0, precioFinal: p.precioFinal ?? 0 })
                                          setIsMatrixPrecioModalOpen(true)
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-slate-100 tabular-nums">
                                          {sourceVariant?.precio?.precioFinal
                                            ? `$${Math.round(sourceVariant.precio.precioFinal).toLocaleString("es-AR")}`
                                            : <span className="text-white/25 text-xs">—</span>}
                                        </span>
                                        <Pencil className="w-3 h-3 text-white/30 opacity-0 group-hover/precio:opacity-100 transition-opacity" />
                                      </div>
                                    </div>

                                    {/* Stock disponible — pencil on hover triggers modal */}
                                    <div
                                      className="col-span-2 px-3 py-2.5 group/stock"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (itemForModal) {
                                          setMatrixVariantItem(itemForModal)
                                          setIsMatrixStockModalOpen(true)
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        {stockDisp > 0 ? (
                                          <span className="text-xs font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
                                            {stockDisp} disp.
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-medium text-white/25 whitespace-nowrap">
                                            sin stock disp.
                                          </span>
                                        )}
                                        <Pencil className="w-3 h-3 text-white/30 opacity-0 group-hover/stock:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-slate-500 py-8 border border-dashed border-white/10 rounded-lg bg-slate-900">
                            No hay variantes configuradas
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  // Individual item tab content
                  <>
                    {selectedDetailTab === "info" && (
                      <div className="h-full flex flex-col mt-5">

                        {/* ── INFORMACIÓN DEL PRODUCTO ── */}
                        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">
                          Información del Producto
                        </h3>

                        {isRightEditing ? (
                          <div className="flex flex-col gap-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Categoría</label>
                                <input
                                  type="text"
                                  value={categoria}
                                  onChange={(e) => handleFieldChange("categoria", e.target.value, setCategoria)}
                                  disabled={shouldStrictlyInherit(fatherItem?.categoria)}
                                  className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${shouldStrictlyInherit(fatherItem?.categoria) ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`}
                                  placeholder="Escribir categoría..."
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Marca</label>
                                <input
                                  type="text"
                                  value={marca}
                                  onChange={(e) => handleFieldChange("marca", e.target.value, setMarca)}
                                  disabled={shouldStrictlyInherit(fatherItem?.marca)}
                                  className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${shouldStrictlyInherit(fatherItem?.marca) ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`}
                                  placeholder="Escribir marca..."
                                />
                              </div>
                            </div>
                            {/* Proveedor — half-width dropdown, same row as Categoría/Marca grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1 relative" ref={proveedorDropdownRef}>
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Proveedor</label>
                                {shouldInheritField(fatherItem?.proveedor) ? (
                                  <div className="px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-sm cursor-not-allowed">
                                    {proveedor || "—"}
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setProveedorDropdownOpen((o) => !o)}
                                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm text-left flex items-center justify-between hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                                    >
                                      <span className={proveedor ? "text-slate-800" : "text-slate-400"}>
                                        {proveedor || "Seleccionar..."}
                                      </span>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    </button>
                                    {proveedorDropdownOpen && (
                                      <div
                                        className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                                        onMouseDown={(e) => e.preventDefault()}
                                      >
                                        {/* Sin proveedor */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleFieldChange("proveedor", "", setProveedor)
                                            setProveedorDropdownOpen(false)
                                            setProveedorSearch("")
                                          }}
                                          className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-sm text-slate-500 hover:bg-slate-50 border-b border-slate-100 transition-colors"
                                        >
                                          <span>Sin proveedor</span>
                                          {!proveedor && <Check className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                        {/* Nuevo proveedor */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setProveedorDropdownOpen(false)
                                            setIsNuevoProveedorModalOpen(true)
                                          }}
                                          className="w-full px-3 py-2.5 flex items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors"
                                        >
                                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                                          Nuevo proveedor
                                        </button>
                                        {/* Search */}
                                        <div className="px-3 py-2 border-b border-slate-100">
                                          <input
                                            type="text"
                                            value={proveedorSearch}
                                            onChange={(e) => setProveedorSearch(e.target.value)}
                                            placeholder="Buscar proveedor..."
                                            className="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400"
                                            autoFocus
                                          />
                                        </div>
                                        {/* Existing proveedores — alphabetical + filtered */}
                                        <div className="max-h-48 overflow-y-auto">
                                          {proveedores.length === 0 ? (
                                            <p className="px-3 py-3 text-sm text-slate-400 text-center">Sin proveedores</p>
                                          ) : (() => {
                                            const filtered = [...proveedores]
                                              .map((p) => ({ p, displayName: p.tipo === "empresa" ? (p.razonSocial || p.nombre) : `${p.nombre}${p.apellido ? " " + p.apellido : ""}` }))
                                              .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"))
                                              .filter(({ displayName }) => displayName.toLowerCase().includes(proveedorSearch.toLowerCase()))
                                            return filtered.length === 0 ? (
                                              <p className="px-3 py-3 text-sm text-slate-400 text-center">Sin resultados</p>
                                            ) : filtered.map(({ p, displayName }) => (
                                              <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                  handleFieldChange("proveedor", displayName, setProveedor)
                                                  setProveedorDropdownOpen(false)
                                                  setProveedorSearch("")
                                                }}
                                                className="w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                              >
                                                <span>{displayName}</span>
                                                {proveedor === displayName && <Check className="w-3.5 h-3.5 text-slate-500" />}
                                              </button>
                                            ))
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                            <div className="grid grid-cols-2 divide-x divide-slate-200">
                              <div className="px-4 py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Categoría</span>
                                <span className="text-[15px] font-medium text-slate-800 leading-snug">{categoria || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                              </div>
                              <div className="px-4 py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Marca</span>
                                <span className="text-[15px] font-medium text-slate-800 leading-snug">{marca || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                              </div>
                            </div>
                            <div className="border-t border-slate-200 px-4 py-3 flex flex-col gap-1">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Proveedor</span>
                              <span className="text-[15px] font-medium text-slate-800 leading-snug">{proveedor || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                            </div>
                          </div>
                        )}

                        {isRightEditing && <div className="border-t border-slate-100" />}

                        {/* ── PRESENTACIÓN ── */}
                        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 mt-5">
                          Presentación
                        </h3>

                        {isRightEditing ? (
                          <div className="flex flex-col gap-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Formato de venta</label>
                                <select
                                  value={formatoVenta}
                                  onChange={(e) => handleFieldChange("formatoVenta", e.target.value, setFormatoVenta)}
                                  disabled={shouldStrictlyInherit(fatherItem?.formatoVenta)}
                                  className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none transition-all text-sm ${shouldStrictlyInherit(fatherItem?.formatoVenta) ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 cursor-pointer hover:border-slate-300"}`}
                                >
                                  <option value="unidad">Unidad</option>
                                  <option value="pack">Pack</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidades por pack</label>
                                <input
                                  type="text"
                                  value={formatoVenta === "unidad" ? "1" : (unidadesPorPack === "N.E." ? "" : unidadesPorPack)}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (value === "") {
                                      handleFieldChange("unidadesPorPack", "N.E.", setUnidadesPorPack)
                                    } else if (/^\d+$/.test(value)) {
                                      const numValue = Number.parseInt(value)
                                      handleFieldChange("unidadesPorPack", numValue < 1 ? "1" : value, setUnidadesPorPack)
                                    }
                                  }}
                                  disabled={formatoVenta === "unidad" || isUnidadesPorPackLocked}
                                  className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${formatoVenta === "unidad" || isUnidadesPorPackLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`}
                                  placeholder="N.E."
                                />
                              </div>
                            </div>

                            {/* Volumen edit controls */}
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2.5">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contenido</label>
                                <button
                                  onClick={() => handleFieldChange("volumenActive", !volumenActive, setVolumenActive)}
                                  disabled={isChildItem}
                                  className={`w-9 h-5 rounded-full transition-all relative ${volumenActive ? "bg-slate-800" : "bg-slate-200"} ${isChildItem ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${volumenActive ? "translate-x-4" : "translate-x-0"}`} />
                                </button>
                              </div>
                              {volumenActive && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Cantidad</label>
                                    <input
                                      type="number"
                                      value={volumenCantidad}
                                      onChange={(e) => handleFieldChange("volumenCantidad", e.target.value, setVolumenCantidad)}
                                      disabled={isChildItem}
                                      className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${isChildItem ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidad de medida</label>
                                    <select
                                      value={volumenUnidad}
                                      onChange={(e) => handleFieldChange("volumenUnidad", e.target.value, setVolumenUnidad)}
                                      disabled={isChildItem}
                                      className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none transition-all text-sm ${isChildItem ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 cursor-pointer hover:border-slate-300"}`}
                                    >
                                      <option value="ml">mL</option>
                                      <option value="l">L</option>
                                      <option value="mg">mg</option>
                                      <option value="g">g</option>
                                      <option value="kg">kg</option>
                                      <option value="cm">cm</option>
                                      <option value="mm">mm</option>
                                      <option value="cm3">cm³</option>
                                      <option value="m3">m³</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Presentación card */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                              <div className="grid grid-cols-2 divide-x divide-slate-200">
                                <div className="px-4 py-3 flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Formato de venta</span>
                                  <span className="text-[15px] font-medium text-slate-800 leading-snug capitalize">{formatoVenta || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                                </div>
                                <div className="px-4 py-3 flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidades por pack</span>
                                  <span className="text-[15px] font-medium text-slate-800 leading-snug">
                                    {formatoVenta === "unidad"
                                      ? "1"
                                      : (unidadesPorPack || <span className="text-slate-300 font-normal">No aplica</span>)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Contenido section */}
                            {volumenActive && (
                              <>
                                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 mt-5">
                                  Contenido
                                </h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                                    <div className="px-4 py-3 flex flex-col gap-1">
                                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Cantidad</span>
                                      <span className="text-[15px] font-medium text-slate-800 leading-snug">{volumenCantidad || <span className="text-slate-300 font-normal">No especificado</span>}</span>
                                    </div>
                                    <div className="px-4 py-3 flex flex-col gap-1">
                                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unidad de medida</span>
                                      <span className="text-[15px] font-medium text-slate-800 leading-snug">{volumenUnidad ? ({ ml: "mL", l: "L", mg: "mg", g: "g", kg: "kg", cm: "cm", mm: "mm", cm3: "cm³", m3: "m³" } as Record<string, string>)[volumenUnidad] ?? volumenUnidad : <span className="text-slate-300 font-normal">No especificado</span>}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* Vencimiento Section */}
                        {catalogo.incluirVencimiento && (
                          <div className="flex flex-col gap-2 mb-6">
                            <div className="flex items-center gap-3">
                              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Vencimiento</label>
                              {isRightEditing ? (
                                <button
                                  onClick={() => setVencimientoActive(!vencimientoActive)}
                                  className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${vencimientoActive ? "bg-slate-800" : "bg-slate-200"}`}
                                >
                                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${vencimientoActive ? "translate-x-4" : "translate-x-0"}`} />
                                </button>
                              ) : (
                                !isRightEditing && vencimientoActive && (
                                  <span className="text-xs text-slate-500">Activo</span>
                                )
                              )}
                            </div>
                            {vencimientoActive && (
                              isRightEditing ? (
                                <div className="mt-2 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Fecha de Vencimiento</label>
                                  <input
                                    type="date"
                                    value={fechaVencimiento}
                                    onChange={(e) => setFechaVencimiento(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800 text-sm transition-all hover:border-slate-300"
                                  />
                                </div>
                              ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                  <div className="px-4 py-3 flex flex-col gap-1">
                                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fecha de vencimiento</span>
                                    <span className="text-[15px] font-medium text-slate-800 leading-snug">{fechaVencimiento || <span className="text-slate-300 font-normal">No especificado</span>}</span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}

                      </div>
                    )}

                    {selectedDetailTab === "atributos" && (
                      <div className="h-full flex flex-col mt-2">
                        {!showIndividualAtributosView ? (
                          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                            <p className="text-slate-400 text-sm">No hay atributos configurados</p>
                            {isRightEditing && (
                              <button
                                onClick={() => setShowIndividualAtributosView(true)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all text-sm font-medium cursor-pointer"
                              >
                                Agregar atributos
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {/* Section header */}
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Atributos Informativos</h3>
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-slate-400 cursor-pointer shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                                    Atributos que describen propiedades adicionales del producto
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            {isRightEditing ? (
                              /* ── EDIT MODE ── */
                              <div className="flex flex-col gap-2">
                                {/* Column headers */}
                                <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 2fr auto" }}>
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">Atributo</span>
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">Valor</span>
                                  <span className="w-8" />
                                </div>

                                {atributosInformativos.map((attr, index) => {
                                  const fatherAttr = isChildItem
                                    ? fatherItem?.atributosInformativos?.find((a) => a.key === attr.key)
                                    : undefined
                                  const isAttributeLocked = isChildItem && fatherAttr !== undefined
                                  const isValueLocked = isChildItem && fatherAttr && fatherAttr.value && !fatherAttr.inheritValue

                                  return (
                                    <div key={index} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 2fr auto" }}>
                                      <input
                                        type="text"
                                        value={attr.key}
                                        onChange={(e) => {
                                          if (!isAttributeLocked) {
                                            const updated = [...atributosInformativos]
                                            updated[index].key = e.target.value
                                            handleAtributosInformativosChange(updated)
                                          }
                                        }}
                                        disabled={isAttributeLocked}
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all ${isAttributeLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`}
                                        placeholder="Ej: Color"
                                      />
                                      <input
                                        type="text"
                                        value={attr.value}
                                        onChange={(e) => {
                                          if (!isValueLocked) {
                                            const updated = [...atributosInformativos]
                                            updated[index].value = e.target.value
                                            handleAtributosInformativosChange(updated)
                                          }
                                        }}
                                        disabled={!!isValueLocked}
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all ${isValueLocked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"}`}
                                        placeholder="Ej: Negro"
                                      />
                                      {!isAttributeLocked ? (
                                        <button
                                          onClick={() => {
                                            const updated = atributosInformativos.filter((_, i) => i !== index)
                                            handleAtributosInformativosChange(updated)
                                            if (atributosPrincipales.length === 0 && updated.length === 0) {
                                              setShowIndividualAtributosView(false)
                                            }
                                          }}
                                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-400 hover:border-red-200 transition-colors cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      ) : (
                                        <div className="w-8" />
                                      )}
                                    </div>
                                  )
                                })}

                                <button
                                  onClick={() => {
                                    handleAtributosInformativosChange([...atributosInformativos, { key: "", value: "" }])
                                  }}
                                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  Agregar atributo
                                </button>
                              </div>
                            ) : (
                              /* ── READ MODE ── */
                              <div>
                                {/* Column headers + divider */}
                                <div className="grid gap-4 pb-2 border-b border-slate-200" style={{ gridTemplateColumns: "1fr 2fr" }}>
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Atributo</span>
                                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Valor</span>
                                </div>

                                {atributosInformativos.map((attr, index) => (
                                  <div key={index} className="grid gap-4 py-3 border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: "1fr 2fr" }}>
                                    <span className="text-[13px] font-medium text-slate-600">{attr.key || <span className="text-slate-300 font-normal">—</span>}</span>
                                    <span className="text-[15px] font-semibold text-slate-800">{attr.value || <span className="text-slate-300 font-normal">No aplica</span>}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}


                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Precio Modal */}
      <PrecioEditModal
        isOpen={isPrecioModalOpen}
        onClose={() => setIsPrecioModalOpen(false)}
        onSave={(values) => {
          const itemIdentifier = selectedItem?.id || selectedItem?.sku
          if (itemIdentifier) {
            onFieldChange(itemIdentifier, "precio", values)
            onSaveNow?.()
            onShowToast?.("Precio actualizado")
          }
        }}
        itemName={selectedItem?.name}
        itemMarca={selectedItem?.marca}
        itemCategoria={selectedItem?.categoria}
        itemMedia={selectedItem?.media}
        itemTags={isChildItem ? (selectedItem?.atributosPrincipales || []) : undefined}
        initialValues={precioModalValues}
        costoBehavior={precios.costoBehavior}
        zIndex={50}
      />
      {/* Stock Modal */}
      <StockEditModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onAccept={(newTotal, newReservado) => {
          const id = selectedItem?.id || selectedItem?.sku
          if (id) {
            const currentTotal = Number.parseInt((selectedItem?.stock as any)?.enStock || selectedItem?.stock?.total || "0")
            const currentReservado = Number.parseInt(selectedItem?.stock?.reservado || "0")
            if (newTotal !== currentTotal || newReservado !== currentReservado) {
              const newStock = {
                enStock: newTotal.toString(),
                reservado: newReservado.toString(),
                disponible: (newTotal - newReservado).toString(),
              }
              onFieldChange(id, "stock", newStock)
              onSaveNow?.()
              onShowToast?.("Stock actualizado")
            }
          }
        }}
        initialTotal={Number.parseInt((selectedItem?.stock as any)?.enStock || selectedItem?.stock?.total || "0")}
        initialReservado={Number.parseInt(selectedItem?.stock?.reservado || "0")}
        itemName={selectedItem?.name}
        itemMarca={selectedItem?.marca}
        itemCategoria={selectedItem?.categoria}
        itemMedia={selectedItem?.media}
        itemTags={isChildItem ? (selectedItem?.atributosPrincipales || []) : undefined}
      />

      {/* Matrix Variant - Precio Modal */}
      <PrecioEditModal
        isOpen={isMatrixPrecioModalOpen}
        onClose={() => { setIsMatrixPrecioModalOpen(false); setMatrixVariantItem(null) }}
        onSave={(values) => {
          if (matrixVariantItem?.id) {
            const updatedVariants = (selectedItem.variants || []).map((ov: any) =>
              ov.id === matrixVariantItem.id ? { ...ov, precio: values } : ov
            )
            onFieldChange(selectedItem.id, "variants", updatedVariants)
            onSaveNow?.()
            onShowToast?.("Precio actualizado")
          }
        }}
        itemName={matrixVariantItem?.name}
        itemMarca={selectedItem?.marca}
        itemCategoria={selectedItem?.categoria}
        itemMedia={matrixVariantItem?.media || selectedItem?.media}
        itemTags={matrixVariantItem?.atributosPrincipales || []}
        initialValues={matrixPrecioModalValues}
        costoBehavior={precios.costoBehavior}
        zIndex={50}
      />
      {/* Matrix Variant - Stock Modal */}
      <StockEditModal
        isOpen={isMatrixStockModalOpen}
        onClose={() => { setIsMatrixStockModalOpen(false); setMatrixVariantItem(null) }}
        onAccept={(newTotal, newReservado) => {
          if (matrixVariantItem?.id) {
            const currentTotal = Number.parseInt((matrixVariantItem?.stock as any)?.enStock || matrixVariantItem?.stock?.total || "0")
            const currentReservado = Number.parseInt(matrixVariantItem?.stock?.reservado || "0")
            if (newTotal !== currentTotal || newReservado !== currentReservado) {
              const newStock = { enStock: newTotal.toString(), reservado: newReservado.toString(), disponible: (newTotal - newReservado).toString() }
              const updatedVariants = (selectedItem.variants || []).map((ov: any) =>
                ov.id === matrixVariantItem.id ? { ...ov, stock: newStock } : ov
              )
              onFieldChange(selectedItem.id, "variants", updatedVariants)
              onSaveNow?.()
              onShowToast?.("Stock actualizado")
            }
          }
        }}
        initialTotal={Number.parseInt((matrixVariantItem?.stock as any)?.enStock || matrixVariantItem?.stock?.total || "0")}
        initialReservado={Number.parseInt(matrixVariantItem?.stock?.reservado || "0")}
        itemName={matrixVariantItem?.name}
        itemMarca={selectedItem?.marca}
        itemCategoria={selectedItem?.categoria}
        itemMedia={matrixVariantItem?.media || selectedItem?.media}
        itemTags={matrixVariantItem?.atributosPrincipales || []}
      />

      {/* Expanded Matrix - Precio Modal */}
      <PrecioEditModal
        isOpen={expandedMatrixPrecioModal.open}
        onClose={() => setExpandedMatrixPrecioModal({ open: false, variant: null })}
        onSave={(values) => {
          if (expandedMatrixPrecioModal.variant?.id && fatherItem) {
            const updatedVariants = (fatherItem.variants || []).map((ov: any) =>
              ov.id === expandedMatrixPrecioModal.variant.id ? { ...ov, precio: values } : ov
            )
            onFieldChange(fatherItem.id, "variants", updatedVariants)
            onSaveNow?.()
            onShowToast?.("Precio actualizado")
          }
        }}
        itemName={expandedMatrixPrecioModal.variant?.name}
        itemMarca={selectedItem?.marca}
        itemCategoria={selectedItem?.categoria}
        itemMedia={expandedMatrixPrecioModal.variant?.media || selectedItem?.media}
        itemTags={expandedMatrixPrecioModal.variant?.atributosPrincipales || []}
        initialValues={expandedMatrixPrecioValues}
        costoBehavior={precios.costoBehavior}
        zIndex={60}
      />

      {/* Expanded Matrix - Stock Modal */}
      <StockEditModal
        isOpen={expandedMatrixStockModal.open}
        onClose={() => setExpandedMatrixStockModal({ open: false, variant: null })}
        onAccept={(newTotal, newReservado) => {
          if (expandedMatrixStockModal.variant?.id) {
            const newStock = {
              enStock: newTotal.toString(),
              reservado: newReservado.toString(),
              disponible: (newTotal - newReservado).toString(),
            }
            const updatedVariants = (selectedItem?.variants || []).map((ov: any) =>
              ov.id === expandedMatrixStockModal.variant.id ? { ...ov, stock: newStock } : ov
            )
            onFieldChange(selectedItem.id, "variants", updatedVariants)
            onSaveNow?.()
            onShowToast?.("Stock actualizado")
          }
        }}
        initialTotal={expandedMatrixStockValues.total}
        initialReservado={expandedMatrixStockValues.reservado}
        itemName={expandedMatrixStockModal.variant?.nombre || expandedMatrixStockModal.variant?.sku}
        itemTags={expandedMatrixStockModal.variant?.atributosPrincipales || []}
      />

      {/* Expanded Matrix - Description Modal */}
      {expandedMatrixDescModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setExpandedMatrixDescModal({ open: false, variant: null, value: "" })} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={getItemPhoto(expandedMatrixDescModal.variant)} alt={expandedMatrixDescModal.variant?.name || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {expandedMatrixDescModal.variant?.name && (
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{expandedMatrixDescModal.variant.name}</p>
                      )}
                      {expandedMatrixDescModal.variant?.atributosPrincipales?.map((attr: any, i: number) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                          {attr.value}
                        </span>
                      ))}
                    </div>
                    {(selectedItem?.marca || selectedItem?.categoria) && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {[selectedItem.marca, selectedItem.categoria].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setExpandedMatrixDescModal({ open: false, variant: null, value: "" })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
            <div className="mb-6">
              <textarea
                value={expandedMatrixDescModal.value}
                onChange={(e) => setExpandedMatrixDescModal(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
                placeholder="Ingresa la descripción de la variante..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExpandedMatrixDescModal({ open: false, variant: null, value: "" })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (expandedMatrixDescModal.variant?.id) {
                    const updatedVariants = (selectedItem?.variants || []).map((ov: any) =>
                      ov.id === expandedMatrixDescModal.variant.id ? { ...ov, descripcion: expandedMatrixDescModal.value } : ov
                    )
                    onFieldChange(selectedItem.id, "variants", updatedVariants)
                  }
                  setExpandedMatrixDescModal({ open: false, variant: null, value: "" })
                }}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Aceptar
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Matrix - Media Modal */}
      {expandedMatrixMediaModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setExpandedMatrixMediaModal({ open: false, variant: null })} />
          <div className="relative bg-slate-900 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Media</h3>
              <button
                onClick={() => setExpandedMatrixMediaModal({ open: false, variant: null })}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variant info with parent name + variant tags */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700">
              <span className="text-sm font-medium text-white">{selectedItem?.name}</span>
              {(expandedMatrixMediaModal.variant?.variant1 || expandedMatrixMediaModal.variant?.variant2) && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {[expandedMatrixMediaModal.variant?.variant1, expandedMatrixMediaModal.variant?.variant2].filter(Boolean).join(" × ")}
                </span>
              )}
            </div>

            {/* Media section */}
            <div className="flex gap-3 mb-4">
              {/* Upload Button */}
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-blue-400/60 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
              >
                <Upload className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] text-blue-400 font-medium">Seleccionar</span>
              </button>

              {/* Current photo (if any) */}
              {expandedMatrixMediaModal.variant?.sourceVariant?.imagenUrl && (
                <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-600 group">
                  <img
                    src={expandedMatrixMediaModal.variant.sourceVariant.imagenUrl}
                    alt="Variant photo"
                    className="w-full h-full object-cover"
                  />
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Remove the image
                      const updatedVariants = (selectedItem?.variants || []).map((ov: any) =>
                        ov.id === expandedMatrixMediaModal.variant.id ? { ...ov, imagenUrl: null } : ov
                      )
                      onFieldChange(selectedItem.id, "variants", updatedVariants)
                      setExpandedMatrixMediaModal({ open: false, variant: null })
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3 h-3 text-slate-600" />
                  </button>
                  {/* Portada tag */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 px-1">
                    <span className="text-[8px] font-bold text-white uppercase tracking-wider">Portada</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setExpandedMatrixMediaModal({ open: false, variant: null })}
                className="px-4 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nueva Variante Modal */}
      <NuevaVarianteModal
        isOpen={isNuevaVarianteModalOpen}
        onClose={() => setIsNuevaVarianteModalOpen(false)}
        onSubmit={handleNuevaVariante}
        containerAtributosPrincipales={containerAtributosPrincipales}
        existingVariants={selectedItem?.variants || []}
      />

      <NuevoProveedorModal
        isOpen={isNuevoProveedorModalOpen}
        onClose={() => setIsNuevoProveedorModalOpen(false)}
        onSave={(data) => {
          const newProveedor: Proveedor = { ...data, id: `PROV-${Date.now()}` }
          addProveedor(newProveedor)
          const displayName = newProveedor.tipo === "empresa"
            ? (newProveedor.razonSocial || newProveedor.nombre)
            : `${newProveedor.nombre}${newProveedor.apellido ? " " + newProveedor.apellido : ""}`
          handleFieldChange("proveedor", displayName, setProveedor)
          setIsNuevoProveedorModalOpen(false)
        }}
      />

      {/* Editar Nombre Modal */}
      {isEditNombreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditNombreModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={getItemPhoto(selectedItem)} alt={selectedItem?.name || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedItem?.name && <p className="text-sm font-semibold text-slate-900 leading-tight">{selectedItem.name}</p>}
                      {isChildItem && atributosPrincipales.map((attr, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                          {attr.value}
                        </span>
                      ))}
                    </div>
                    {(selectedItem?.marca || selectedItem?.categoria) && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {[selectedItem.marca, selectedItem.categoria].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsEditNombreModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">{isViewingContainer ? "Nombre del Agrupador" : "Nombre del Item"}</label>
              <input
                type="text"
                value={modalNombreValue}
                onChange={(e) => setModalNombreValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveNombreModal(); if (e.key === "Escape") setIsEditNombreModalOpen(false) }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Nombre del producto"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setIsEditNombreModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleSaveNombreModal}
                disabled={!modalNombreValue.trim()}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${modalNombreValue.trim() ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editar SKU Modal */}
      {isEditSkuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditSkuModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={getItemPhoto(selectedItem)} alt={selectedItem?.name || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">Editar SKU</h3>
                    {selectedItem?.name && <p className="text-xs text-slate-400 truncate mt-0.5">{selectedItem.name}</p>}
                  </div>
                </div>
                <button onClick={() => setIsEditSkuModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-5">
              {isChildItem && fatherItem ? (
                <>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">Sufijo</label>
                  <div className="flex items-center gap-0 border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-slate-400">
                    <span className="px-3 py-2.5 text-sm font-mono text-slate-400 bg-slate-50 border-r border-slate-200 select-none whitespace-nowrap">
                      {fatherItem.skuPrefix || fatherItem.sku || ""}-
                    </span>
                    <input
                      type="text"
                      value={modalSkuValue}
                      onChange={(e) => setModalSkuValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveSkuModal(); if (e.key === "Escape") setIsEditSkuModalOpen(false) }}
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm font-mono focus:outline-none bg-white"
                      placeholder="sufijo"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">SKU completo: <span className="font-mono">{fatherItem.skuPrefix || fatherItem.sku || ""}-{modalSkuValue}</span></p>
                </>
              ) : (
                <>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">SKU</label>
                  <input
                    type="text"
                    value={modalSkuValue}
                    onChange={(e) => setModalSkuValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveSkuModal(); if (e.key === "Escape") setIsEditSkuModalOpen(false) }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="SKU del producto"
                    autoFocus
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setIsEditSkuModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleSaveSkuModal}
                disabled={!modalSkuValue.trim()}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${modalSkuValue.trim() ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editar Código Universal Modal */}
      {isEditCodigoUniversalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditCodigoUniversalModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={getItemPhoto(selectedItem)} alt={selectedItem?.name || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedItem?.name && <p className="text-sm font-semibold text-slate-900 leading-tight">{selectedItem.name}</p>}
                      {isChildItem && atributosPrincipales.map((attr, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                          {attr.value}
                        </span>
                      ))}
                    </div>
                    {(selectedItem?.marca || selectedItem?.categoria) && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {[selectedItem.marca, selectedItem.categoria].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsEditCodigoUniversalModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">Código Universal (EAN / UPC / GTIN)</label>
              <input
                type="text"
                value={modalCodigoUniversalValue}
                onChange={(e) => setModalCodigoUniversalValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveCodigoUniversalModal(); if (e.key === "Escape") setIsEditCodigoUniversalModalOpen(false) }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="7790001234567"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1.5">Número de 8 a 14 dígitos impreso bajo el código de barras.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setIsEditCodigoUniversalModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleSaveCodigoUniversalModal}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editar Código Proveedor Modal */}
      {isEditCodigoProveedorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditCodigoProveedorModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={getItemPhoto(selectedItem)} alt={selectedItem?.name || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedItem?.name && <p className="text-sm font-semibold text-slate-900 leading-tight">{selectedItem.name}</p>}
                      {isChildItem && atributosPrincipales.map((attr, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                          {attr.value}
                        </span>
                      ))}
                    </div>
                    {(selectedItem?.marca || selectedItem?.categoria) && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {[selectedItem.marca, selectedItem.categoria].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsEditCodigoProveedorModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">Código Proveedor</label>
              <input
                type="text"
                value={modalCodigoProveedorValue}
                onChange={(e) => setModalCodigoProveedorValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveCodigoProveedorModal(); if (e.key === "Escape") setIsEditCodigoProveedorModalOpen(false) }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Ej: JW-DBLACK-750"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1.5">Identificador único que el proveedor le asigna a este producto.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setIsEditCodigoProveedorModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleSaveCodigoProveedorModal}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editar Descripción Modal */}
      {isEditDescripcionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditDescripcionModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={getItemPhoto(selectedItem)} alt={selectedItem?.name || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedItem?.name && <p className="text-sm font-semibold text-slate-900 leading-tight">{selectedItem.name}</p>}
                      {isChildItem && atributosPrincipales.map((attr, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                          {attr.value}
                        </span>
                      ))}
                    </div>
                    {(selectedItem?.marca || selectedItem?.categoria) && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {[selectedItem.marca, selectedItem.categoria].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsEditDescripcionModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">Descripción</label>
              <textarea
                value={modalDescripcionValue}
                onChange={(e) => setModalDescripcionValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setIsEditDescripcionModalOpen(false) }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                placeholder="Descripción del producto..."
                rows={5}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setIsEditDescripcionModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleSaveDescripcionModal}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
        </div>{/* end max-w-6xl */}
    </>
  )
}
