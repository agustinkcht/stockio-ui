"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import type { Item } from "@/lib/types"
import { ChevronDown, ChevronRight, Plus, Copy, X, Minus, Check, ArrowDownToLine, Lock, LockOpen, Pencil, Upload } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { TEMPLATES } from "@/lib/constants" // DEPOSITS and SAVED_ATRIBUTOS imports removed
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import { NuevaVarianteModal } from "@/components/modals/nueva-variante-modal"
// import { Breadcrumb } from "@/components/layout/breadcrumb"

// Single deposit for simplified stock management
const DEPOSITS = ["Torcuato"]

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
}: ItemDetailPanelProps) {
  const router = useRouter()
  const isViewingContainer = selectedItem?.isAgrupador || selectedItem?.hasVariants || false

  const fatherItem = !isViewingContainer
    ? allItems.find(
        (item) => (item.hasVariants || item.isAgrupador) && item.variants?.some((v: any) => v.sku === selectedItem.sku),
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
    ;(childAttrs || []).forEach(attr => {
      childMap.set(attr.key, attr)
    })
    
  // First, add all parent attributes (Case 1 and Case 2)
  ;(parentAttrs || []).forEach(parentAttr => {
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
  const [editingCodigoUniversal, setEditingCodigoUniversal] = useState(false)
  const [skuValue, setSkuValue] = useState(selectedItem.sku || "")
  const [codigoUniversalValue, setCodigoUniversalValue] = useState(selectedItem.codigoUniversal || "")
  const [imageView, setImageView] = useState<"imagen" | "descripcion">("imagen")
  const [isCardFlipped, setIsCardFlipped] = useState(false)

  const [editingDescripcion, setEditingDescripcion] = useState(false)
  const [descripcionValue, setDescripcionValue] = useState(selectedItem.descripcion || "")
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(selectedItem.name || "")
  const [proveedorDropdownOpen, setProveedorDropdownOpen] = useState(false)
  
  // Media photos state - initialize with category image as thumbnail/portada
  const [mediaPhotos, setMediaPhotos] = useState<string[]>(() => {
    const photos: string[] = []
    // Use category image as the default thumbnail
    const categoryImage = getCategoryImage(selectedItem?.categoria)
    if (categoryImage) {
      photos.push(categoryImage)
    }
    return photos
  })
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null)

  const [containerAtributosPrincipales, setContainerAtributosPrincipales] = useState<
    Array<{ key: string; variantes: string[]; keyOpen?: boolean; variantesOpen?: boolean }>
  >(selectedItem?.containerAtributosPrincipales || [])

  // Lock state for Atributos Principales section - locked by default when variants exist
  const [isAtributosPrincipalesLocked, setIsAtributosPrincipalesLocked] = useState(true)
  
  // Nueva Variante modal state
  const [isNuevaVarianteModalOpen, setIsNuevaVarianteModalOpen] = useState(false)

  const [atributosPrincipales, setAtributosPrincipales] = useState<
    Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>
  >((selectedItem as any)?.atributosPrincipales || [])

  const [atributosInformativos, setAtributosInformativos] = useState<
    Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean; inheritValue?: boolean }>
  >(() => getMergedAtributosInformativos(fatherItem?.atributosInformativos, selectedItem?.atributosInformativos))

  const [stockModification, setStockModification] = useState({
    total: { operation: "agregar", value: "" },
    reservado: { operation: "agregar", value: "" },
  })

  const [activeStockEdit, setActiveStockEdit] = useState<"total" | "reservado">("total")

  const [advancedStockEditMode, setAdvancedStockEditMode] = useState(false)

  const [stockSelection, setStockSelection] = useState<{ total: boolean; reservado: boolean }>({
    total: false,
    reservado: false,
  })

  const handleStockModificationAccept = (stockType: "total" | "reservado") => {
    if (!selectedItem?.sku) return

    const modification = stockModification[stockType]
    const inputValue = Number.parseInt(modification.value)

    if (isNaN(inputValue) || inputValue < 0) return

    const currentValue = Number.parseInt(selectedItem?.stock?.[stockType] || "0")
    let newValue = currentValue

    if (modification.operation === "agregar") {
      newValue = currentValue + inputValue
    } else if (modification.operation === "remover") {
      newValue = Math.max(0, currentValue - inputValue)
    } else if (modification.operation === "sobreescribir") {
      newValue = inputValue
    }

    updateStock(selectedItem.sku, stockType, newValue)

    // Clear input after applying
    setStockModification((prev) => ({
      ...prev,
      [stockType]: { ...prev[stockType], value: "" },
    }))
  }

  // const [history, setHistory] = useState<any[]>([])
  // const [historyIndex, setHistoryIndex] = useState(-1)
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [skuCopied, setSkuCopied] = useState(false)
  const [codigoUniversalCopied, setCodigoUniversalCopied] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSelectingTemplateForContainer, setIsSelectingTemplateForContainer] = useState(false)

  const [showAtributosView, setShowAtributosView] = useState(false)
  const [showIndividualAtributosView, setShowIndividualAtributosView] = useState(false)

  const [variantItems, setVariantItems] = useState<
    Array<{
      sku: string
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

  // Right card mode toggle for parent items: 'principales' or 'informativos'
  const [rightCardMode, setRightCardMode] = useState<"principales" | "informativos">("principales")

  // Compute whether item has existing attributes (including inherited from parent)
  const hasExistingAttributes =
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
      (selectedItem?.atributosInformativos && selectedItem.atributosInformativos.length > 0) ||
      (selectedItem?.containerAtributosPrincipales && selectedItem.containerAtributosPrincipales.length > 0) ||
      // Also check if parent has atributosInformativos that would be inherited
      (isChildItem && fatherItem?.atributosInformativos && fatherItem.atributosInformativos.length > 0)

    setShowIndividualAtributosView(hasAttributes)
  }, [selectedItem, fatherItem, isChildItem])

  const handleFieldChange = (field: string, value: any, setter: (val: any) => void) => {
    setter(value)
    onFieldChange(selectedItem.sku, field, value)
  }

  const handleAtributosPrincipalesChange = (
    updated: Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>,
  ) => {
    setAtributosPrincipales(updated)
    if (onFieldChange && selectedItem?.sku) {
      onFieldChange(selectedItem.sku, "atributosPrincipales", updated)
    }
  }

  const handleAtributosInformativosChange = (
    updated: Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>,
  ) => {
    setAtributosInformativos(updated)
    if (onFieldChange && selectedItem?.sku) {
      onFieldChange(selectedItem.sku, "atributosInformativos", updated)
    }
  }

  const handleContainerAtributosPrincipalesChange = (
    updated: Array<{ key: string; variantes: string[]; keyOpen?: boolean; variantesOpen?: boolean }>,
  ) => {
    setContainerAtributosPrincipales(updated)
    if (onFieldChange && selectedItem?.sku) {
      onFieldChange(selectedItem.sku, "containerAtributosPrincipales", updated)
    }
  }

  useEffect(() => {
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
    setSkuValue(selectedItem.sku || "")
    setCodigoUniversalValue(selectedItem.codigoUniversal || "")
    setDescripcionValue(selectedItem.descripcion || "")
    setAtributosPrincipales((selectedItem as any)?.atributosPrincipales || [])
    setAtributosInformativos(getMergedAtributosInformativos(fatherItem?.atributosInformativos, selectedItem?.atributosInformativos))
    // Ensure unitsPorPack and volume state are also synced if they are part of selectedItem
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
  }, [selectedItem, fatherItem])

  // Sync atributos from selectedItem when it changes (for undo)
  useEffect(() => {
    if (selectedItem) {
      setAtributosPrincipales((selectedItem as any).atributosPrincipales || [])
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
          newCombinations.push({
            sku: `${skuPadre}-${v1.toLowerCase().replace(/\s+/g, "-")}`,
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
            newCombinations.push({
              sku: `${skuPadre}-${v1.toLowerCase().replace(/\s+/g, "-")}-${v2.toLowerCase().replace(/\s+/g, "-")}`,
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
  const convertSavedVariantsToDisplay = (savedVariants: any[]) => {
    return savedVariants.map((v: any) => ({
      sku: v.sku,
      codigoUniversal: v.codigoUniversal || "",
      descripcion: v.descripcion || "",
      foto: v.foto || "",
      variant1: v.atributosPrincipales?.[0]?.value || null,
      variant2: v.atributosPrincipales?.[1]?.value || null,
    }))
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
  //           onFieldChange(selectedItem.sku, "variants", updatedVariants)
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
        onFieldChange(selectedItem.sku, "containerAtributosPrincipales", updatedContainerAttrs)
      }
    }
    
    // Generate SKU automatically using the same logic as "Generar Variantes"
    const skuPadre =
      selectedItem.sku ||
      selectedItem.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .split(" ")
        .map((word) => word.substring(0, 3))
        .join("-")
        .substring(0, 15)
    
    // Get variant values for SKU suffix
    const variantValues = Object.values(attributeValues)
    const variantSuffix = variantValues
      .map((v) => v.substring(0, 3).toUpperCase())
      .join("-")
    
    const generatedSku = `${skuPadre}-${variantSuffix}`
    
    // Create the new variant object
    const newVariant: any = {
      sku: generatedSku,
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
      onFieldChange(selectedItem.sku, "variants", updatedVariants)
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

    const newVariantObjects = newCombinations.map((combo) => ({
      sku: combo.sku,
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
    console.log("[v0] Updated variants:", updatedVariants)
    
    // Update variantItems for display
    setVariantItems(convertSavedVariantsToDisplay(updatedVariants))

    const variantsKey = JSON.stringify(updatedVariants.map((v) => ({ sku: v.sku, attrs: v.atributosPrincipales })))
    
    // Always call onFieldChange to save the variants
    if (onFieldChange && selectedItem.sku) {
      onFieldChange(selectedItem.sku, "variants", updatedVariants)
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

  const updateVariantField = (sku: string, field: "codigoUniversal" | "descripcion" | "foto", value: string) => {
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
      updateItem(selectedItem.sku, { sku: skuValue })
      setEditingSku(false)
      // Notify parent of change
      onFieldChange(selectedItem.sku, "sku", skuValue)
    }
  }

  const handleCodigoUniversalBlur = () => {
    if (selectedItem?.sku && editingCodigoUniversal) {
      updateItem(selectedItem.sku, { codigoUniversal: codigoUniversalValue })
      setEditingCodigoUniversal(false)
      // Notify parent of change
      onFieldChange(selectedItem.sku, "codigoUniversal", codigoUniversalValue)
    }
  }

  const handleDescripcionBlur = () => {
    if (selectedItem?.sku && editingDescripcion) {
      updateItem(selectedItem.sku, { descripcion: descripcionValue })
      setEditingDescripcion(false)
      onFieldChange(selectedItem.sku, "descripcion", descripcionValue)
    }
  }

  const handleNameBlur = () => {
    if (selectedItem?.sku && editingName) {
      const trimmed = nameValue.trim()
      if (trimmed && trimmed !== selectedItem.name) {
        updateItem(selectedItem.sku, { name: trimmed })
        onFieldChange(selectedItem.sku, "name", trimmed)
      } else {
        setNameValue(selectedItem.name || "")
      }
      setEditingName(false)
    }
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

      <div className="px-8 pb-6 bg-slate-50 min-h-screen pl-8 pt-0">
        <div className={`grid gap-2 ${isViewingContainer ? "grid-cols-2 gap-6" : "grid-cols-20 gap-3"}`}>
          {/* Middle Column - Image Card (only for standalone/children) - col-span-6 */}
          {!isViewingContainer && (
          <div className="col-span-6 order-1 z-20 rounded-xl flex flex-col transition-all duration-300 mt-4 border-none shadow-none pl-0 pr-0">
            {/* Flip card container */}
            <div className="sticky top-4 mt-7" style={{ perspective: "1200px" }}>
              <div
                className="relative transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  minHeight: "420px",
                }}
              >
                {/* FRONT SIDE */}
                <div
                  className="absolute inset-0 p-6 px-8 pr-11 border-solid border border-black rounded-xl bg-black shadow-md pl-11 ml-0 cursor-pointer"
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  onClick={() => setIsCardFlipped(true)}
                >
                  {/* Flip hint top-right */}
                  <div className="absolute top-3 right-4 flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors select-none pointer-events-none">
                    <span className="text-[10px] uppercase tracking-wider">Descripción</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>

                  <div className="mt-2">
                    <div className="w-full h-64 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden shadow-2xl border-slate-700/30 border-none border-0 bg-transparent shadow-none">
                      <Image
                        src={getCategoryImage(selectedItem.categoria) || "/placeholder.svg"}
                        alt={selectedItem.name}
                        width={200}
                        height={256}
                        className="object-contain rounded-xl shadow-xl"
                      />
                    </div>
                  </div>

                  <div className="mb-0 mt-6">
                    <div className="flex items-center justify-center gap-2 mt-[-20px] mb-0 flex-wrap group/title">
                      {!isChildItem && editingName ? (
                        <input
                          type="text"
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onBlur={handleNameBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                            if (e.key === "Escape") {
                              setNameValue(selectedItem.name || "")
                              setEditingName(false)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-white text-lg bg-transparent border-b border-white/40 focus:border-white outline-none text-center w-full max-w-[220px]"
                          autoFocus
                        />
                      ) : (
                        <div
                          className={`flex items-center gap-1.5 ${!isChildItem ? "cursor-pointer" : ""}`}
                          onClick={(e) => {
                            if (!isChildItem) {
                              e.stopPropagation()
                              setEditingName(true)
                            }
                          }}
                        >
                          <h2 className="font-semibold text-white text-lg">{nameValue || selectedItem.name}</h2>
                          {!isChildItem && (
                            <Pencil className="w-3.5 h-3.5 text-white/40 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                          )}
                        </div>
                      )}
                      {isChildItem && selectedItem.atributosPrincipales && selectedItem.atributosPrincipales.length > 0 && (
                        <div className="flex items-center gap-1">
                          {selectedItem.atributosPrincipales.map((attr, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white/80 whitespace-nowrap"
                            >
                              {attr.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SKU and Código Universal below the line, in column */}
                    {!isViewingContainer && (
                      <>
                        <div className="border-t border-slate-700/50 my-4"></div>
                        <div className="flex flex-col gap-2 text-xs text-slate-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-200 w-8">SKU:</span>
                            <span>{selectedItem.sku}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopySku() }}
                              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                              title="Copiar SKU"
                            >
                              {skuCopied ? (
                                <span className="text-green-400 text-xs">✓</span>
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-200 w-8">C.U.:</span>
                            <span>{selectedItem.codigoUniversal || "N/A"}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyCodigoUniversal() }}
                              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                              title="Copiar Código Universal"
                            >
                              {codigoUniversalCopied ? (
                                <span className="text-green-400 text-xs">✓</span>
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* BACK SIDE */}
                <div
                  className="absolute inset-0 p-6 px-8 pr-11 border-solid border border-black rounded-xl bg-black shadow-md pl-11 ml-0 cursor-pointer"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  onClick={() => setIsCardFlipped(false)}
                >
                  {/* Flip back hint top-right */}
                  <div className="absolute top-3 right-4 flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors select-none pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    <span className="text-[10px] uppercase tracking-wider">Volver</span>
                  </div>

                  <div className="flex flex-col h-full pt-2 overflow-y-auto">
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
                            className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 cursor-move group ${
                              draggedPhotoIndex === index ? 'opacity-50 border-blue-400' : 'border-slate-600 hover:border-slate-400'
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
                    <div className="flex-1">
                      {editingDescripcion ? (
                        <textarea
                          value={descripcionValue}
                          onChange={(e) => setDescripcionValue(e.target.value)}
                          onBlur={handleDescripcionBlur}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full min-h-[120px] px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none text-sm placeholder:text-slate-500"
                          placeholder="Agregar descripción del producto..."
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => { e.stopPropagation(); setEditingDescripcion(true) }}
                          className="w-full min-h-[120px] px-3 py-2 bg-slate-800/30 rounded-lg text-slate-200 cursor-text hover:bg-slate-800/50 transition-colors text-sm"
                        >
                          {descripcionValue || (
                            <span className="text-slate-500">Click para agregar descripción...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Vertical Toggle Toolstripe - Section Switcher (only for standalone/children items) - col-span-1 */}
          {!isViewingContainer && (
          <div className="order-2 col-span-1 flex flex-col justify-start mt-[44px] pt-6 items-center">
            <div className="sticky top-4 flex flex-col items-center">
              {/* Toggle Track */}
              <div className="relative flex flex-col items-center">
                {/* Vertical line */}
                <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200" />
                
                {/* Three-way Toggle */}
                <div className="relative z-10 flex flex-col items-center gap-1 py-2 px-1">
                  {/* Info indicator */}
                  <button
                    onClick={() => setExpandedSection("info")}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      expandedSection === "info" 
                        ? "bg-slate-800 scale-125" 
                        : "bg-slate-300 hover:bg-slate-400"
                    }`}
                    title="Expandir Info"
                  />
                  
                  {/* Both indicator */}
                  <button
                    onClick={() => setExpandedSection("both")}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer my-1 ${
                      expandedSection === "both" 
                        ? "bg-slate-800 scale-125" 
                        : "bg-slate-300 hover:bg-slate-400"
                    }`}
                    title="Mostrar ambos"
                  />
                  
                  {/* Stock indicator */}
                  <button
                    onClick={() => setExpandedSection("stock")}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      expandedSection === "stock" 
                        ? "bg-slate-800 scale-125" 
                        : "bg-slate-300 hover:bg-slate-400"
                    }`}
                    title="Expandir Stock"
                  />
                </div>
                
                {/* Labels */}
                <div className="mt-4 flex flex-col items-center gap-6">
                  <span className={`text-[8px] font-medium uppercase tracking-[0.12em] transition-all duration-300 ${
                    expandedSection === "info" 
                      ? "text-slate-700" 
                      : "text-slate-400"
                  }`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    Info
                  </span>
                  <span className={`text-[8px] font-medium uppercase tracking-[0.12em] transition-all duration-300 ${
                    expandedSection === "stock" 
                      ? "text-slate-700" 
                      : "text-slate-400"
                  }`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    Stock
                  </span>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Right Column - Variantes Card (only for parent items) */}
          {isViewingContainer && (
            <div className="col-span-1 order-2 flex flex-col mt-[44px]">
              <div className="sticky top-4 p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                {/* Toggle button for right card mode */}
                <div className="mb-6">
                  <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 w-full">
                    <button
                      onClick={() => setRightCardMode("principales")}
                      className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        rightCardMode === "principales"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Variantes
                    </button>
                    <button
                      onClick={() => setRightCardMode("informativos")}
                      className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        rightCardMode === "informativos"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Atributos
                    </button>
                  </div>
                </div>

                {/* Atributos Principales y Variantes view */}
                {rightCardMode === "principales" && (
                  <>
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-5">
                      {variantItems.length} {variantItems.length === 1 ? "variante" : "variantes"}
                    </h3>

                    {/* Atributos Principales Section */}
                    {!showAtributosView ? (
                      <div className="flex flex-col items-center justify-center gap-4 py-8 mb-6">
                        <p className="text-gray-500 text-sm">No hay atributos configurados</p>
                        <button
                          onClick={() => setShowAtributosView(true)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors cursor-pointer"
                        >
                          Agregar atributo
                        </button>
                      </div>
                    ) : (
                      <div className="mb-6">
                        {/* Title and description - always visible normally */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                              Atributos de Variantes
                            </h3>
                            <p className="text-xs text-gray-500 italic">
                              Atributos que definen las variantes del producto (máximo 2)
                            </p>
                          </div>
                          {/* Lock button - only visible when variants exist */}
                          {variantItems.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsAtributosPrincipalesLocked(!isAtributosPrincipalesLocked)
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                isAtributosPrincipalesLocked
                                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={isAtributosPrincipalesLocked ? "Desbloquear edición" : "Bloquear edición"}
                            >
                              {isAtributosPrincipalesLocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <LockOpen className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        {/* Atributo inputs and buttons - these get locked */}
                        <div className={`flex flex-col gap-3 transition-all duration-300 ${
                          variantItems.length > 0 && isAtributosPrincipalesLocked 
                            ? "opacity-50 pointer-events-none select-none" 
                            : ""
                        }`}>

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
                                    // Case-insensitive duplicate check
                                    const isDuplicate = updated[index].variantes.some(
                                      (existing) => existing.toLowerCase() === newTag.toLowerCase()
                                    )
                                    if (!isDuplicate) {
                                      updated[index].variantes.push(newTag)
                                      handleContainerAtributosPrincipalesChange(updated)
                                      setDuplicateTagError({ ...duplicateTagError, [index]: false })
                                    } else {
                                      // Show error for duplicate tag
                                      setDuplicateTagError({ ...duplicateTagError, [index]: true })
                                      // Auto-clear error after 2 seconds
                                      setTimeout(() => {
                                        setDuplicateTagError((prev) => ({ ...prev, [index]: false }))
                                      }, 2000)
                                    }
                                    setVarianteInput({ ...varianteInput, [index]: "" })
                                  }
                                }}
                                onFocus={() => setDuplicateTagError({ ...duplicateTagError, [index]: false })}
                                placeholder="Ej: Rojo"
                                className={`w-full px-3 py-2.5 bg-white border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all hover:border-slate-300 text-sm ${
                                  duplicateTagError[index]
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
                                  // Calculate if this tag is "complete" or "incomplete"
                                  // Complete = used in ALL potential combinations with the other attribute
                                  // Incomplete = missing from at least one potential combination
                                  const existingVariants = selectedItem?.variants || []
                                  const otherAttrIndex = index === 0 ? 1 : 0
                                  const otherAttr = containerAtributosPrincipales[otherAttrIndex]
                                  
                                  let isComplete = true
                                  
                                  if (existingVariants.length > 0 && otherAttr && otherAttr.variantes.length > 0) {
                                    // Check if this value is paired with EVERY value from the other attribute
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
                                      if (!hasCombination) {
                                        isComplete = false
                                        break
                                      }
                                    }
                                  } else if (existingVariants.length > 0 && containerAtributosPrincipales.length === 1) {
                                    // Single attribute case - check if variant exists
                                    const hasVariant = existingVariants.some((v: any) => {
                                      if (!v.atributosPrincipales) return false
                                      return v.atributosPrincipales[0]?.value === variante
                                    })
                                    isComplete = hasVariant
                                  } else if (existingVariants.length === 0) {
                                    // No variants generated yet - all tags are incomplete
                                    isComplete = false
                                  }
                                  
                                  return (
                                    <span
                                      key={vIndex}
                                      className={`px-3 py-1.5 bg-white rounded-md text-sm flex items-center gap-2 ${
                                        isComplete 
                                          ? "border border-gray-300 text-gray-900" 
                                          : "border-2 border-dashed border-gray-300 text-gray-500"
                                      }`}
                                    >
                                      {variante}
                                      <button
                                        onClick={() => {
                                          console.log("[v0] Removing tag:", variante, "from attribute index:", index)
                                          
                                          // Remove the tag from atributos principales
                                          const updated = [...containerAtributosPrincipales]
                                          updated[index].variantes = updated[index].variantes.filter(
                                            (_, i) => i !== vIndex,
                                          )
                                          
                                          // Also remove all variants that use this tag
                                          const existingVariants = selectedItem?.variants || []
                                          const updatedVariants = existingVariants.filter((v: any) => {
                                            if (!v.atributosPrincipales) return true
                                            
                                            // Check if this variant uses the removed tag
                                            if (index === 0) {
                                              // This is the first attribute
                                              return v.atributosPrincipales[0]?.value !== variante
                                            } else {
                                              // This is the second attribute
                                              return v.atributosPrincipales[1]?.value !== variante
                                            }
                                          })
                                          
                                          console.log("[v0] Removed variants using tag:", variante)
                                          console.log("[v0] Updated variants:", updatedVariants)
                                          
                                          // Update local state
                                          setContainerAtributosPrincipales(updated)
                                          setVariantItems(convertSavedVariantsToDisplay(updatedVariants))
                                          
                                          // Save both changes together (batched)
                                          if (onFieldChange && selectedItem.sku) {
                                            onFieldChange(selectedItem.sku, "containerAtributosPrincipales", updated)
                                            onFieldChange(selectedItem.sku, "variants", updatedVariants)
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
                              
                              // Clear all variants when removing an atributo principal
                              setVariantItems([])
                              if (onFieldChange && selectedItem?.sku) {
                                onFieldChange(selectedItem.sku, "variants", [])
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

                      {/* Button order logic: 
                          - If 0 atributos: Show only "Agregar atributo" button
                          - If 1 atributo: "Agregar atributo" button first, then "Generar Variantes"
                          - If 2 atributos: only "Generar Variantes" button */}
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

                      {/* Generar Variantes button - only visible when at least 1 atributo exists */}
                      {containerAtributosPrincipales.length > 0 && (() => {
                        const hasAtLeastOneVariante = containerAtributosPrincipales.some(
                          (attr) => attr.key.trim() !== "" && attr.variantes.length > 0
                        )
                        // Check if there are potential variants not yet generated
                        const existingVariants = selectedItem?.variants || []
                        const potentialNewVariants = generateNewVariantCombinations(existingVariants)
                        const hasPotentialVariants = potentialNewVariants.length > 0
                        const isEnabled = hasAtLeastOneVariante && hasPotentialVariants
                        return (
                          <button
                            onClick={handleGenerarVariantes}
                            disabled={!isEnabled}
                            className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                              isEnabled
                                ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            Generar Variantes
                          </button>
                        )
                      })()}
                        </div>
                      </div>
                    )}

                    {/* Visual separator and Variantes section */}
                    {variantItems.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                            Variantes
                          </h3>
                          <button
                            onClick={() => setIsNuevaVarianteModalOpen(true)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nueva Variante</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {variantItems.length > 0 ? (
                  <div className="bg-white border border-border/40 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_minmax(80px,1fr)_28px] bg-white border-b border-border/30">
                      <div className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {/* Empty label for atributos column */}
                      </div>
                      <div className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        SKU
                      </div>
                      <div />
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-border/30">
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

                        const displaySku = sourceVariant?.sku || variant.sku

                        // Delete variant handler - removes variant and cleans up unused tags
                        const handleDeleteVariant = () => {
                          const attr1Value = variant.variant1
                          const attr2Value = variant.variant2

                          console.log("[v0] Deleting variant:", attr1Value, "x", attr2Value)

                          const updatedVariants = (selectedItem.variants || []).filter((v: any) => {
                            if (!v.atributosPrincipales) return true
                            
                            const variantAttr1 = v.atributosPrincipales[0]?.value
                            const variantAttr2 = v.atributosPrincipales[1]?.value
                            
                            if (!attr2Value) {
                              return variantAttr1 !== attr1Value
                            }
                            
                            const isExactMatch = variantAttr1 === attr1Value && variantAttr2 === attr2Value
                            return !isExactMatch
                          })

                          console.log("[v0] Remaining variants after deletion:", updatedVariants)

                          // Check if any tags are now completely unused (not in any remaining combination)
                          // A tag is unused if it doesn't appear in all possible combinations with the other attribute
                          const updatedContainerAttrs = containerAtributosPrincipales.map((attr, attrIndex) => {
                            const otherAttrIndex = attrIndex === 0 ? 1 : 0
                            const otherAttr = containerAtributosPrincipales[otherAttrIndex]
                            
                            if (!otherAttr || otherAttr.variantes.length === 0) {
                              // No other attribute - keep all tags that appear in at least one variant
                              const usedTags = attr.variantes.filter(tag => {
                                return updatedVariants.some((v: any) => {
                                  if (!v.atributosPrincipales) return false
                                  return v.atributosPrincipales[attrIndex]?.value === tag
                                })
                              })
                              return { ...attr, variantes: usedTags }
                            }
                            
                            // Remove tags that have ZERO combinations with the other attribute
                            const tagsToKeep = attr.variantes.filter(tag => {
                              // Check if this tag appears in at least ONE variant
                              const hasAtLeastOneCombo = updatedVariants.some((v: any) => {
                                if (!v.atributosPrincipales) return false
                                if (attrIndex === 0) {
                                  return v.atributosPrincipales[0]?.value === tag
                                } else {
                                  return v.atributosPrincipales[1]?.value === tag
                                }
                              })
                              return hasAtLeastOneCombo
                            })
                            
                            return { ...attr, variantes: tagsToKeep }
                          })

                          console.log("[v0] Updated atributos after cleanup:", updatedContainerAttrs)

                          // Update display
                          setVariantItems(convertSavedVariantsToDisplay(updatedVariants))
                          
                          // Update atributos principales if any tags were removed
                          const tagsChanged = JSON.stringify(containerAtributosPrincipales) !== JSON.stringify(updatedContainerAttrs)
                          if (tagsChanged) {
                            setContainerAtributosPrincipales(updatedContainerAttrs)
                            if (onFieldChange && selectedItem.sku) {
                              onFieldChange(selectedItem.sku, "containerAtributosPrincipales", updatedContainerAttrs)
                            }
                          }

                          // Save the updated variants
                          if (onFieldChange && selectedItem.sku) {
                            onFieldChange(selectedItem.sku, "variants", updatedVariants)
                          }
                        }

                        return (
                          <div
                            key={variant.sku}
                            onClick={() => {
                              // Navigate to the child item when clicking on the variant row
                              if (displaySku) {
                                router.push(`/inventario/articulos/${displaySku}`)
                              }
                            }}
                            className="group grid grid-cols-[1fr_minmax(80px,1fr)_28px] items-center hover:bg-accent/50 transition-colors cursor-pointer"
                          >
                            <div className="px-3 py-2 flex items-center gap-1.5">
                              {variant.variant1 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[70px]">
                                  {variant.variant1}
                                </span>
                              )}
                              {variant.variant1 && variant.variant2 && (
                                <span className="text-[9px] text-muted-foreground/50 font-medium">×</span>
                              )}
                              {variant.variant2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[70px]">
                                  {variant.variant2}
                                </span>
                              )}
                            </div>

                            <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={displaySku}
                                onChange={(e) => updateVariantField(variant.sku, "sku", e.target.value)}
                                className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-primary/50 px-0 py-0.5 text-[11px] font-mono text-foreground focus:outline-none transition-colors"
                                placeholder="SKU..."
                              />
                            </div>

                            <div className="px-1 py-2 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={handleDeleteVariant}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                                title="Eliminar variante"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/60 rounded-lg">
                    No hay variantes configuradas
                  </div>
                )}
                  </>
                )}

                {/* Atributos Informativos view */}
                {rightCardMode === "informativos" && (
                  <div className="py-2">
                    {!showAtributosView ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                        <p className="text-gray-500 text-sm">No hay atributos configurados</p>
                        <button
                          onClick={() => setShowAtributosView(true)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors cursor-pointer"
                        >
                          Agregar atributos
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                              Atributos Informativos
                            </h3>
                            <p className="text-xs text-gray-500 italic mt-1">
                              Atributos que describen propiedades generales del producto
                            </p>
                          </div>

                          {atributosInformativos.map((attr, index) => {
                            const fatherAttr = fatherItem?.atributosInformativos?.find((a) => a.key === attr.key)
                            const isAttributeLocked = isChildItem && fatherAttr !== undefined
                            const isValueLocked = isChildItem && fatherAttr && fatherAttr.value && !fatherAttr.inheritValue
                            
                            return (
                              <div key={index} className="flex items-start gap-3">
                                <div className="flex-1">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Atributo</label>
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
                                    className={`w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all ${
                                      isAttributeLocked ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "text-slate-800 hover:border-slate-300"
                                    }`}
                                    placeholder="Ej: Material"
                                  />
                                </div>

                                <div className="flex-1">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Valor</label>
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
                                    disabled={isValueLocked || (!isChildItem && attr.inheritValue)}
                                    className={`w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all ${
                                      isValueLocked 
                                        ? "bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed" 
                                        : (!isChildItem && attr.inheritValue)
                                          ? "bg-slate-50 border-2 border-dashed border-slate-300 text-slate-400 cursor-not-allowed italic"
                                          : "bg-white border border-slate-200 text-slate-800 hover:border-slate-300"
                                    }`}
                                    placeholder={(!isChildItem && attr.inheritValue) ? "Variantes completarán..." : "Ej: Algodón"}
                                  />
                                </div>

                                <div className="flex items-center gap-1 mt-8">
                                  {!isChildItem && isViewingContainer && (
                                    <button
                                      onClick={() => {
                                        const updated = [...atributosInformativos]
                                        updated[index].inheritValue = !updated[index].inheritValue
                                        if (updated[index].inheritValue) {
                                          updated[index].value = ""
                                        }
                                        handleAtributosInformativosChange(updated)
                                      }}
                                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                        attr.inheritValue 
                                          ? "bg-slate-800 text-white" 
                                          : "text-gray-400 hover:text-slate-600 hover:bg-slate-100"
                                      }`}
                                      title={attr.inheritValue ? "Valor heredable a variantes (click para desactivar)" : "Marcar para que variantes completen el valor"}
                                    >
                                      <ArrowDownToLine className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {!isAttributeLocked && (
                                    <button
                                      onClick={() => {
                                        const updated = atributosInformativos.filter((_, i) => i !== index)
                                        handleAtributosInformativosChange(updated)
                                        if (containerAtributosPrincipales.length === 0 && updated.length === 0) {
                                          setShowAtributosView(false)
                                        }
                                      }}
                                      className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                {isAttributeLocked && <div className="mt-8 w-4"></div>}
                              </div>
                            )
                          })}

                          <button
                            onClick={() => {
                              handleAtributosInformativosChange([...atributosInformativos, { key: "", value: "" }])
                            }}
                            className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Agregar atributo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

{/* Info/Atributos Column - 12 cols when info expanded, 7 cols when both, 2 col when stock expanded */}
        <div className={`flex flex-col transition-all duration-300 overflow-hidden mr-3.5 pb-0 ${isViewingContainer ? "order-1 col-span-1 mt-[44px] pt-6 pb-8 px-8 bg-gradient-to-b from-white to-slate-50/30 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)] border border-slate-200/60" : `order-3 relative mt-[44px] pt-6 pb-8 bg-gradient-to-b from-white to-slate-50/30 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-200/60 z-10 ${expandedSection === "info" ? "col-span-11 px-8" : expandedSection === "both" ? "col-span-7 px-6" : "col-span-2 px-3"}`}`}>
            
            {/* Thumbnail + Title Header for Parent Items */}
            {isViewingContainer && (
              <div className="mb-6 pb-5 border-b border-slate-100">
                {/* Top row: Thumbnail + Title aligned horizontally */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                      src={getCategoryImage(selectedItem.categoria) || "/placeholder.svg"}
                      alt={selectedItem.name}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-slate-900 text-base truncate">{selectedItem.name}</h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Agrupador de variantes</p>
                  </div>
                </div>
                
                {/* SKU Padre field - below the header row */}
                <div className="mt-4">
                  <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                    SKU Padre
                  </label>
                  <input
                    type="text"
                    value={skuValue}
                    onChange={(e) => {
                      const newSkuPadre = e.target.value.toUpperCase()
                      const oldSkuPadre = skuValue
                      setSkuValue(newSkuPadre)
                      
                      // Update variant SKUs in real-time (visual only, no save until Guardar)
                      if (variantItems.length > 0) {
                        setVariantItems(prev => prev.map(variant => {
                          // Replace the old SKU padre part with the new one
                          const skuParts = variant.sku.split('-')
                          // The parent SKU is typically the first 1-2 segments (e.g., CZA-ISOR)
                          const oldPadreParts = oldSkuPadre.split('-')
                          const newPadreParts = newSkuPadre.split('-')
                          
                          // Replace the parent part of the variant SKU
                          if (skuParts.length > oldPadreParts.length) {
                            const variantSuffix = skuParts.slice(oldPadreParts.length).join('-')
                            return { ...variant, sku: newSkuPadre + '-' + variantSuffix }
                          }
                          return variant
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all hover:border-slate-300 font-mono"
                    placeholder="Ej: VNO-KNECHT"
                  />
                  <p className="text-[9px] text-slate-400 mt-1.5 italic">
                    Base para generar SKUs de variantes
                  </p>
                </div>
              </div>
            )}

            {/* Collapsed Info State - Minimal Slider View (only when stock is fully expanded) */}
            {!isViewingContainer && expandedSection === "stock" && (
              <div 
                onClick={() => setExpandedSection("both")}
                className="flex flex-col items-center justify-start h-full py-4 cursor-pointer group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.12em] group-hover:text-slate-600 transition-colors" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    Info
                  </span>
                </div>
              </div>
            )}

            {/* Sticky Segment Buttons - Show when info or both is active (only for non-container items) */}
            {!isViewingContainer && (expandedSection === "info" || expandedSection === "both") && (
            <div className="z-20 mb-6 sticky top-[0px]">
              <div className="flex items-center gap-1 h-11 p-1 bg-slate-100/80 rounded-xl">
                <button
                  onClick={() => setSelectedDetailTab("info")}
                  className={`flex-1 h-full flex items-center justify-center transition-all duration-200 cursor-pointer rounded-lg ${
                    selectedDetailTab === "info"
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-widest">Info</span>
                </button>
                <button
                  onClick={() => setSelectedDetailTab("atributos")}
                  className={`flex-1 h-full flex items-center justify-center transition-all duration-200 cursor-pointer rounded-lg ${
                    selectedDetailTab === "atributos"
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-widest">Atributos</span>
                </button>
              </div>
            </div>
            )}

            {/* Tab Content - Show when info or both is active */}
            {(isViewingContainer || expandedSection === "info" || expandedSection === "both") && (
            <div className="flex-1 w-full overflow-hidden">
              {isViewingContainer ? (
                // Container item tab content
                <>
                  {selectedDetailTab === "info" && (
                    <div className="h-full flex flex-col py-2">
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                        Información del Producto
                      </h3>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Categoría</label>
                            <input
                              type="text"
                              value={categoria}
                              onChange={(e) => handleFieldChange("categoria", e.target.value, setCategoria)}
                              disabled={shouldStrictlyInherit(fatherItem?.categoria)}
                              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                shouldStrictlyInherit(fatherItem?.categoria)
                                  ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                              placeholder="Ej: Vinos"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Marca</label>
                            <input
                              type="text"
                              value={marca}
                              onChange={(e) => handleFieldChange("marca", e.target.value, setMarca)}
                              disabled={shouldStrictlyInherit(fatherItem?.marca)}
                              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                shouldStrictlyInherit(fatherItem?.marca)
                                  ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                              placeholder="Ej: YKK"
                            />
                          </div>
                        </div>

                        <div className="border-t border-gray-200 my-4"></div>

                        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                          Presentación
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Formato de venta</label>
                            <select
                              value={formatoVenta}
                              onChange={(e) => handleFieldChange("formatoVenta", e.target.value, setFormatoVenta)}
                              disabled={shouldStrictlyInherit(fatherItem?.formatoVenta)}
                              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                                shouldStrictlyInherit(fatherItem?.formatoVenta)
                                  ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-white border-gray-300 text-gray-900 cursor-pointer"
                              }`}
                            >
                              <option value="unidad">Unidad</option>
                              <option value="pack">Pack</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Unidades por pack</label>
                            <input
                              type="text"
                              value={unidadesPorPack === "N.E." ? "" : unidadesPorPack}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "") {
                                  handleFieldChange("unidadesPorPack", "N.E.", setUnidadesPorPack)
                                } else if (/^\d+$/.test(value)) {
                                  const numValue = Number.parseInt(value)
                                  handleFieldChange("unidadesPorPack", numValue < 1 ? "1" : value, setUnidadesPorPack)
                                }
                                // Ignore non-numeric input
                              }}
                              disabled={formatoVenta === "unidad" || isUnidadesPorPackLocked}
                              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formatoVenta === "unidad" || isUnidadesPorPackLocked
                                  ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                              placeholder="N.E."
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Volumen de la unidad</label>
                            <button
                              onClick={() => handleFieldChange("volumenActive", !volumenActive, setVolumenActive)}
                              disabled={shouldStrictlyInherit(fatherItem?.volumenActive)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${
                                volumenActive ? "bg-blue-500" : "bg-gray-300"
                              } ${shouldStrictlyInherit(fatherItem?.volumenActive) ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                  volumenActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {volumenActive && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Cantidad</label>
                                <input
                                  type="number"
                                  value={volumenCantidad}
                                  onChange={(e) =>
                                    handleFieldChange("volumenCantidad", e.target.value, setVolumenCantidad)
                                  }
                                  disabled={shouldStrictlyInherit(fatherItem?.volumenCantidad)}
                                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    shouldStrictlyInherit(fatherItem?.volumenCantidad)
                                      ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                                      : "bg-white border-gray-300 text-gray-900"
                                  }`}
                                  placeholder="0"
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Unidad de medida</label>
                                <select
                                  value={volumenUnidad}
                                  onChange={(e) => handleFieldChange("volumenUnidad", e.target.value, setVolumenUnidad)}
                                  disabled={shouldStrictlyInherit(fatherItem?.volumenUnidad)}
                                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                                    shouldStrictlyInherit(fatherItem?.volumenUnidad)
                                      ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                                      : "bg-white border-gray-300 text-gray-900 cursor-pointer"
                                  }`}
                                >
                                  <option value="ml">ml</option>
                                  <option value="l">l</option>
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                  <option value="cm">cm</option>
                                  <option value="m">m</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Vencimiento Section */}
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Vencimiento</label>
                            <button
                              onClick={() => setVencimientoActive(!vencimientoActive)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${
                                vencimientoActive ? "bg-blue-500" : "bg-gray-300"
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                  vencimientoActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {vencimientoActive && (
                            <div className="mt-2 p-3 border border-blue-200/60 rounded-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                              <label className="text-xs font-semibold text-blue-900/70 uppercase tracking-wider mb-2 block">
                                Fecha de Vencimiento
                              </label>
                              <div className="relative">
                                <input
                                  type="date"
                                  value={fechaVencimiento}
                                  onChange={(e) => setFechaVencimiento(e.target.value)}
                                  className="w-full px-3 py-2.5 border border-blue-300/50 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-gray-900 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 my-4"></div>

                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                        Información del Proveedor
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-gray-700">Proveedor</label>
                          <input
                            type="text"
                            value={proveedor}
                            onChange={(e) => handleFieldChange("proveedor", e.target.value, setProveedor)}
                            disabled={shouldInheritField(fatherItem?.proveedor)}
                            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                              shouldInheritField(fatherItem?.proveedor)
                                ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                            placeholder="Nombre del proveedor"
                          />
                        </div>

                        {!isViewingContainer && (
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Código Proveedor</label>
                            <input
                              type="text"
                              value={codigoProveedor}
                              onChange={(e) => handleFieldChange("codigoProveedor", e.target.value, setCodigoProveedor)}
                              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Código del proveedor"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Individual item tab content
                <>
                  {selectedDetailTab === "info" && (
                    <div className="h-full flex flex-col mt-5">
                      <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Información del Producto
                      </h3>

                      <div className="space-y-4">
                        {/* Categoría and Marca */}
                        <div className="grid grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
                            <input
                              type="text"
                              value={categoria}
                              onChange={(e) => handleFieldChange("categoria", e.target.value, setCategoria)}
                              disabled={shouldStrictlyInherit(fatherItem?.categoria)}
                              className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${
                                shouldStrictlyInherit(fatherItem?.categoria)
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                              }`}
                              placeholder="Ej: Vinos"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Marca</label>
                            <input
                              type="text"
                              value={marca}
                              onChange={(e) => handleFieldChange("marca", e.target.value, setMarca)}
                              disabled={shouldStrictlyInherit(fatherItem?.marca)}
                              className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${
                                shouldStrictlyInherit(fatherItem?.marca)
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                              }`}
                              placeholder="Ej: YKK"
                            />
                          </div>
                        </div>

                        {/* Horizontal divider line */}
                        <div className="my-6 border-t border-slate-200"></div>

                        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                          Presentación
                        </h3>

                        <div className="grid grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Formato de venta</label>
                            <select
                              value={formatoVenta}
                              onChange={(e) => handleFieldChange("formatoVenta", e.target.value, setFormatoVenta)}
                              disabled={shouldStrictlyInherit(fatherItem?.formatoVenta)}
                              className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none transition-all text-sm ${
                                shouldStrictlyInherit(fatherItem?.formatoVenta)
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-200 text-slate-800 cursor-pointer hover:border-slate-300"
                              }`}
                            >
                              <option value="unidad">Unidad</option>
                              <option value="pack">Pack</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Unidades por pack</label>
                            <input
                              type="text"
                              value={unidadesPorPack === "N.E." ? "" : unidadesPorPack}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "") {
                                  handleFieldChange("unidadesPorPack", "N.E.", setUnidadesPorPack)
                                } else if (/^\d+$/.test(value)) {
                                  const numValue = Number.parseInt(value)
                                  handleFieldChange("unidadesPorPack", numValue < 1 ? "1" : value, setUnidadesPorPack)
                                }
                                // Ignore non-numeric input
                              }}
                              disabled={formatoVenta === "unidad" || isUnidadesPorPackLocked}
                              className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${
                                formatoVenta === "unidad" || isUnidadesPorPackLocked
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                              }`}
                              placeholder="N.E."
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-3">
                          <div className="flex items-center gap-3 mt-3.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Volumen de la unidad</label>
                            <button
                              onClick={() => handleFieldChange("volumenActive", !volumenActive, setVolumenActive)}
                              disabled={shouldStrictlyInherit(fatherItem?.volumenActive)}
                              className={`w-9 h-5 rounded-full transition-all relative ${
                                volumenActive ? "bg-slate-800" : "bg-slate-200"
                              } ${shouldStrictlyInherit(fatherItem?.volumenActive) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                                  volumenActive ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {volumenActive && (
                            <div className="grid grid-cols-2 gap-5 mt-2">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Cantidad</label>
                                <input
                                  type="number"
                                  value={volumenCantidad}
                                  onChange={(e) =>
                                    handleFieldChange("volumenCantidad", e.target.value, setVolumenCantidad)
                                  }
                                  disabled={shouldStrictlyInherit(fatherItem?.volumenCantidad)}
                                  className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${
                                    shouldStrictlyInherit(fatherItem?.volumenCantidad)
                                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                                  }`}
                                  placeholder="0"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Unidad de medida</label>
                                <select
                                  value={volumenUnidad}
                                  onChange={(e) => handleFieldChange("volumenUnidad", e.target.value, setVolumenUnidad)}
                                  disabled={shouldStrictlyInherit(fatherItem?.volumenUnidad)}
                                  className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none transition-all text-sm ${
                                    shouldStrictlyInherit(fatherItem?.volumenUnidad)
                                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                      : "bg-white border-slate-200 text-slate-800 cursor-pointer hover:border-slate-300"
                                  }`}
                                >
                                  <option value="ml">ml</option>
                                  <option value="l">l</option>
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                  <option value="cm">cm</option>
                                  <option value="m">m</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Vencimiento Section */}
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="flex items-center gap-3 mb-0 mt-3.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Vencimiento</label>
                            <button
                              onClick={() => setVencimientoActive(!vencimientoActive)}
                              className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${
                                vencimientoActive ? "bg-slate-800" : "bg-slate-200"
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                                  vencimientoActive ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {vencimientoActive && (
                            <div className="mt-2 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                                Fecha de Vencimiento
                              </label>
                              <div className="relative">
                                <input
                                  type="date"
                                  value={fechaVencimiento}
                                  onChange={(e) => setFechaVencimiento(e.target.value)}
                                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800 text-sm transition-all hover:border-slate-300"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Información del Proveedor Section - Below Vencimiento */}
                        <div className="border-t border-slate-200 pt-4 mt-4">
                          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                            Información del Proveedor
                          </h3>
                          <div className="grid grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Proveedor</label>
                              <input
                                type="text"
                                value={proveedor}
                                onChange={(e) => handleFieldChange("proveedor", e.target.value, setProveedor)}
                                disabled={shouldInheritField(fatherItem?.proveedor)}
                                className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm ${
                                  shouldInheritField(fatherItem?.proveedor)
                                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                                }`}
                                placeholder="Nombre del proveedor"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Código Proveedor</label>
                              <input
                                type="text"
                                value={codigoProveedor}
                                onChange={(e) => handleFieldChange("codigoProveedor", e.target.value, setCodigoProveedor)}
                                className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all hover:border-slate-300"
                                placeholder="Código del proveedor"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedDetailTab === "atributos" && (
                    <div className="h-full flex flex-col">
                      {!showIndividualAtributosView ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                          <p className="text-slate-400 text-sm">No hay atributos configurados</p>
                          <button
                            onClick={() => setShowIndividualAtributosView(true)}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all text-sm font-medium cursor-pointer"
                          >
                            Agregar atributos
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col gap-3">
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                                Atributos Informativos
                              </h3>
                              <p className="text-xs text-gray-500 italic mt-1">
                                Atributos que describen propiedades adicionales del producto
                              </p>
                            </div>

                            {atributosInformativos.map((attr, index) => {
                              const fatherAttr = isChildItem
                                ? fatherItem?.atributosInformativos?.find((a) => a.key === attr.key)
                                : undefined
                              const isAttributeLocked = isChildItem && fatherAttr !== undefined
                              // Value is locked if parent has a value AND inheritValue is NOT true (Case 1)
                              // Value is editable if parent marked inheritValue (Case 2)
                              const isValueLocked = isChildItem && fatherAttr && fatherAttr.value && !fatherAttr.inheritValue
                              
                              return (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Atributo</label>
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
                                      className={`w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all ${
                                        isAttributeLocked ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "text-slate-800 hover:border-slate-300"
                                      }`}
                                      placeholder="Ej: Material"
                                    />
                                  </div>

                                  <div className="flex-1">
                                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Valor</label>
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
                                      disabled={isValueLocked}
                                      className={`w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all ${
                                        isValueLocked ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "text-slate-800 hover:border-slate-300"
                                      }`}
                                      placeholder="Ej: Algodón"
                                    />
                                  </div>

                                  {!isAttributeLocked && (
                                    <button
                                      onClick={() => {
                                        const updated = atributosInformativos.filter((_, i) => i !== index)
                                        handleAtributosInformativosChange(updated)
                        if (updated.length === 0) {
                          setShowIndividualAtributosView(false)
                        }
                                      }}
                                      className="mt-8 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                  {isAttributeLocked && <div className="mt-8 w-4"></div>}
                                </div>
                              )
                            })}

                            <button
                              onClick={() => {
                                handleAtributosInformativosChange([...atributosInformativos, { key: "", value: "" }])
                              }}
                              className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-sm">Agregar atributo</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                </>
              )}
            </div>
            )}
          </div>

{/* Stock Column - 11 cols when stock expanded, 6 cols when both, 2 col when info expanded */}
          {!isViewingContainer && (
          <div className={`order-4 flex flex-col mt-[44px] transition-all duration-300 ${expandedSection === "stock" ? "col-span-11 pl-4" : expandedSection === "both" ? "col-span-6 pl-3" : "col-span-2 pl-2"}`}>

              {/* Precio Card - Above Stock Card */}
              {(expandedSection === "stock" || expandedSection === "both") && (
              <div className={`mb-4 bg-white border border-border/40 rounded-xl shadow-sm ${expandedSection === "stock" ? "p-5" : "p-4"}`}>
                <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-4">
                  Precio
                </h3>
                
                {/* Upper part: Costo, Margen, IVA */}
                <div className="space-y-2 mb-4">
                  {/* Costo */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-lg border border-border/40">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Costo</span>
                    <span className="text-base font-semibold text-slate-700 tabular-nums">
                      ${(selectedItem?.precio?.costo || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {/* Margen and IVA on same line */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-lg border border-border/40">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Margen</span>
                      <span className="text-base font-semibold text-slate-700 tabular-nums">
                        {selectedItem?.precio?.margen || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-lg border border-border/40">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">IVA</span>
                      <span className="text-base font-semibold text-slate-700 tabular-nums">
                        {selectedItem?.precio?.iva || 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Bottom part: Precio Final - Big and prominent */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/60">
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Precio Final</div>
                    <div className="font-bold text-emerald-600 tabular-nums text-2xl">
                      ${(selectedItem?.precio?.precioFinal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
              )}

              <div className={`sticky top-4 bg-white border border-border/40 rounded-xl shadow-sm ${expandedSection === "stock" ? "p-5" : expandedSection === "both" ? "p-4" : "p-3"}`}>
                
                {/* Collapsed Stock State - Minimal Slider View (only when info is fully expanded) */}
                {expandedSection === "info" && (
                  <div 
                    onClick={() => setExpandedSection("both")}
                    className="flex flex-col items-center justify-start py-2 cursor-pointer group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 rotate-180" />
                      </div>
                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.12em] group-hover:text-slate-600 transition-colors" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                        Stock
                      </span>
                      <div className="flex flex-col items-center gap-0.5 mt-2">
                        <span className="text-lg font-bold text-slate-600 tabular-nums">
                          {Number.parseInt(selectedItem?.stock?.total || "0")}
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider">Total</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Stock Content - show when stock or both is active */}
                {(expandedSection === "stock" || expandedSection === "both") && (
                <>
                <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-4">
                  Stock en Depósito: Torcuato
                </h3>

                <div className="space-y-2">
                  {/* Total Section */}
                  <div className="border border-border/40 rounded-lg bg-slate-50 overflow-hidden">
                    {/* Total Header - clickable to expand/collapse */}
                    <div 
                      onClick={() => setActiveStockEdit("total")}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                        activeStockEdit === "total" ? "bg-accent/30" : "hover:bg-accent/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                          activeStockEdit === "total" ? "rotate-0" : "-rotate-90"
                        }`} />
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeStockEdit === "total" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (selectedItem?.sku) {
                                  const current = Number.parseInt(selectedItem?.stock?.total || "0")
                                  updateStock(selectedItem.sku, "total", Math.max(0, current - 1))
                                }
                              }}
                              className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        <span className="text-base font-semibold text-foreground tabular-nums min-w-[2rem] text-center">
                          {Number.parseInt(selectedItem?.stock?.total || "0")}
                        </span>
                        {activeStockEdit === "total" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (selectedItem?.sku) {
                                const current = Number.parseInt(selectedItem?.stock?.total || "0")
                                updateStock(selectedItem.sku, "total", current + 1)
                              }
                            }}
                            className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Total Edición Avanzada Panel */}
                    {activeStockEdit === "total" && (
                      <div className="px-4 pb-3 pt-1 border-t border-border/30 bg-muted/10">
                        <div className="flex items-center gap-2">
                          <select
                            value={stockModification.total.operation}
                            onChange={(e) => setStockModification((prev) => ({
                              ...prev,
                              total: { ...prev.total, operation: e.target.value },
                            }))}
                            className="text-xs border border-border/50 rounded bg-background hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer px-2 py-1.5"
                          >
<option value="agregar">Agregar</option>
  <option value="remover">Remover</option>
  <option value="sobreescribir">Sobreescribir</option>
  </select>
  <input
                            type="number"
                            placeholder="0"
                            value={stockModification.total.value}
                            onChange={(e) => setStockModification((prev) => ({
                              ...prev,
                              total: { ...prev.total, value: e.target.value },
                            }))}
                            className="w-16 text-sm border border-border/50 rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-muted-foreground/50 text-sm">→</span>
                          <span className="text-sm font-medium text-muted-foreground/60 tabular-nums min-w-[2.5rem] text-right">
                            {stockModification.total.value
                              ? (() => {
                                  const current = Number.parseInt(selectedItem?.stock?.total || "0")
                                  const value = Number.parseInt(stockModification.total.value || "0")
                                  switch (stockModification.total.operation) {
                                    case "agregar": return Math.max(0, current + value)
                                    case "remover": return Math.max(0, current - value)
                                    case "sobreescribir": return Math.max(0, value)
                                    default: return current
                                  }
                                })()
                              : Number.parseInt(selectedItem?.stock?.total || "0")
                            }
                          </span>
                          <button
                            onClick={() => {
                              handleStockModificationAccept("total")
                              setStockModification((prev) => ({
                                ...prev,
                                total: { operation: "agregar", value: "" },
                              }))
                            }}
                            disabled={!stockModification.total.value}
                            className={`w-7 h-7 rounded border flex items-center justify-center transition-all ml-auto ${
                              stockModification.total.value
                                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 cursor-pointer"
                                : "bg-muted/30 text-muted-foreground/30 border-border/30 cursor-not-allowed"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

{/* Reservado Section */}
  <div className="border border-border/40 rounded-lg bg-slate-50 overflow-hidden">
  {/* Reservado Header - clickable to expand/collapse */}
  <div
  onClick={() => setActiveStockEdit("reservado")}
  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
  activeStockEdit === "reservado" ? "bg-accent/30" : "hover:bg-accent/20"
  }`}
  >
  <div className="flex items-center gap-2">
  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
  activeStockEdit === "reservado" ? "rotate-0" : "-rotate-90"
  }`} />
  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reservado</div>
  </div>
  <div className="flex items-center gap-2">
    {activeStockEdit === "reservado" && (
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (selectedItem?.sku) {
            const current = Number.parseInt(selectedItem?.stock?.reservado || "0")
            updateStock(selectedItem.sku, "reservado", Math.max(0, current - 1))
          }
        }}
        className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <Minus className="w-3 h-3" />
      </button>
    )}
    <span className="text-base font-semibold text-foreground tabular-nums min-w-[2rem] text-center">
      {Number.parseInt(selectedItem?.stock?.reservado || "0")}
    </span>
    {activeStockEdit === "reservado" && (
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (selectedItem?.sku) {
            const current = Number.parseInt(selectedItem?.stock?.reservado || "0")
            updateStock(selectedItem.sku, "reservado", current + 1)
          }
        }}
        className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <Plus className="w-3 h-3" />
      </button>
    )}
  </div>
  </div>

                    {/* Reservado Edición Avanzada Panel */}
                    {activeStockEdit === "reservado" && (
                      <div className="px-4 pb-3 pt-1 border-t border-border/30 bg-muted/10">
                        <div className="flex items-center gap-2">
                          <select
                            value={stockModification.reservado.operation}
                            onChange={(e) => setStockModification((prev) => ({
                              ...prev,
                              reservado: { ...prev.reservado, operation: e.target.value },
                            }))}
                            className="text-xs border border-border/50 rounded bg-background hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer px-2 py-1.5"
                          >
<option value="agregar">Agregar</option>
  <option value="remover">Remover</option>
  <option value="sobreescribir">Sobreescribir</option>
  </select>
  <input
                            type="number"
                            placeholder="0"
                            value={stockModification.reservado.value}
                            onChange={(e) => setStockModification((prev) => ({
                              ...prev,
                              reservado: { ...prev.reservado, value: e.target.value },
                            }))}
                            className="w-16 text-sm border border-border/50 rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-muted-foreground/50 text-sm">→</span>
                          <span className="text-sm font-medium text-muted-foreground/60 tabular-nums min-w-[2.5rem] text-right">
                            {stockModification.reservado.value
                              ? (() => {
                                  const current = Number.parseInt(selectedItem?.stock?.reservado || "0")
                                  const value = Number.parseInt(stockModification.reservado.value || "0")
                                  switch (stockModification.reservado.operation) {
                                    case "agregar": return Math.max(0, current + value)
                                    case "remover": return Math.max(0, current - value)
                                    case "sobreescribir": return Math.max(0, value)
                                    default: return current
                                  }
                                })()
                              : Number.parseInt(selectedItem?.stock?.reservado || "0")
                            }
                          </span>
                          <button
                            onClick={() => {
                              handleStockModificationAccept("reservado")
                              setStockModification((prev) => ({
                                ...prev,
                                reservado: { operation: "agregar", value: "" },
                              }))
                            }}
                            disabled={!stockModification.reservado.value}
                            className={`w-7 h-7 rounded border flex items-center justify-center transition-all ml-auto ${
                              stockModification.reservado.value
                                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 cursor-pointer"
                                : "bg-muted/30 text-muted-foreground/30 border-border/30 cursor-not-allowed"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Disponible - Read only */}
                  <div className="border border-emerald-200 rounded-lg bg-emerald-50/50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Disponible</div>
                      <span className="text-xl font-bold text-emerald-600 tabular-nums">
                        {Number.parseInt(selectedItem?.stock?.total || "0") -
                          Number.parseInt(selectedItem?.stock?.reservado || "0")}
                      </span>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nueva Variante Modal */}
      <NuevaVarianteModal
        isOpen={isNuevaVarianteModalOpen}
        onClose={() => setIsNuevaVarianteModalOpen(false)}
        onSubmit={handleNuevaVariante}
        containerAtributosPrincipales={containerAtributosPrincipales}
        existingVariants={selectedItem?.variants || []}
      />
    </>
  )
}
