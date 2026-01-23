"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import type { Item } from "@/lib/types"
import { ChevronDown, ChevronRight, Plus, Copy, X, Minus, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { SAVED_ATRIBUTOS, TEMPLATES } from "@/lib/constants" // DEPOSITS import removed
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
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

export function ItemDetailPanel({
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
  const [proveedor, setProveedor] = useState(
    shouldInheritField(fatherItem?.proveedor) ? fatherItem!.proveedor : selectedItem?.proveedor || "",
  )
  const [codigoProveedor, setCodigoProveedor] = useState(selectedItem?.codigoProveedor || "")

  const [editingSku, setEditingSku] = useState(false)
  const [editingCodigoUniversal, setEditingCodigoUniversal] = useState(false)
  const [skuValue, setSkuValue] = useState(selectedItem.sku || "")
  const [codigoUniversalValue, setCodigoUniversalValue] = useState(selectedItem.codigoUniversal || "")
  const [imageView, setImageView] = useState<"imagen" | "descripcion">("imagen")

  const [editingDescripcion, setEditingDescripcion] = useState(false)
  const [descripcionValue, setDescripcionValue] = useState(selectedItem.descripcion || "")

  const [containerAtributosPrincipales, setContainerAtributosPrincipales] = useState<
    Array<{ key: string; variantes: string[]; keyOpen?: boolean; variantesOpen?: boolean }>
  >(selectedItem?.containerAtributosPrincipales || [])

  const [atributosPrincipales, setAtributosPrincipales] = useState<
    Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>
  >(selectedItem?.atributosPrincipales || [])

  const [atributosInformativos, setAtributosInformativos] = useState<
    Array<{ key: string; value: string; keyOpen?: boolean; valueOpen?: boolean }>
  >(selectedItem?.atributosInformativos || [])

  const [stockModification, setStockModification] = useState({
    total: { operation: "aumentar", value: "" },
    reservado: { operation: "aumentar", value: "" },
  })

  const [advancedStockEditMode, setAdvancedStockEditMode] = useState(false)

  const handleStockModificationAccept = (stockType: "total" | "reservado") => {
    if (!selectedItem?.sku) return

    const modification = stockModification[stockType]
    const inputValue = Number.parseInt(modification.value)

    if (isNaN(inputValue) || inputValue < 0) return

    const currentValue = Number.parseInt(selectedItem?.stock?.[stockType] || "0")
    let newValue = currentValue

    if (modification.operation === "aumentar") {
      newValue = currentValue + inputValue
    } else if (modification.operation === "disminuir") {
      newValue = Math.max(0, currentValue - inputValue)
    } else if (modification.operation === "reemplazar") {
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

  // State for stock dropdown visibility
  const [showTotalDropdown, setShowTotalDropdown] = useState(false)
  const [showReservadoDropdown, setShowReservadoDropdown] = useState(false)

  // Compute whether item has existing attributes
  const hasExistingAttributes =
    (selectedItem?.atributosPrincipales && selectedItem.atributosPrincipales.length > 0) ||
    (selectedItem?.atributosInformativos && selectedItem.atributosInformativos.length > 0) ||
    (selectedItem?.containerAtributosPrincipales && selectedItem.containerAtributosPrincipales.length > 0)

  // Update visibility states when item changes
  useEffect(() => {
    if (isViewingContainer) {
      setShowAtributosView(hasExistingAttributes)
    } else {
      setShowIndividualAtributosView(hasExistingAttributes)
    }
  }, [selectedItem, hasExistingAttributes, isViewingContainer])

  // State for variant input
  // const [varianteInput, setVarianteInput] = useState<Record<number, string>>({})

  useEffect(() => {
    const hasAttributes =
      (selectedItem?.atributosPrincipales && selectedItem.atributosPrincipales.length > 0) ||
      (selectedItem?.atributosInformativos && selectedItem.atributosInformativos.length > 0) ||
      (selectedItem?.containerAtributosPrincipales && selectedItem.containerAtributosPrincipales.length > 0)

    console.log("[v0] useEffect running - hasAttributes:", hasAttributes)
    console.log("[v0] useEffect - setting showIndividualAtributosView to:", hasAttributes)
    setShowIndividualAtributosView(hasAttributes)
  }, [selectedItem])

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
    setAtributosPrincipales(selectedItem?.atributosPrincipales || [])
    setAtributosInformativos(selectedItem?.atributosInformativos || [])
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
  }, [selectedItem])

  // Sync atributos from selectedItem when it changes (for undo)
  useEffect(() => {
    if (selectedItem) {
      setAtributosPrincipales(selectedItem.atributosPrincipales || [])
      setAtributosInformativos(selectedItem.atributosInformativos || [])
      setContainerAtributosPrincipales(selectedItem.containerAtributosPrincipales || [])
    }
  }, [selectedItem])

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

  const generateVariantCombinations = () => {
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

    if (attrs.length === 1) {
      return attrs[0].variantes.map((v1) => ({
        sku: `${skuPadre}-${v1.toLowerCase().replace(/\s+/g, "-")}`,
        codigoUniversal: "",
        descripcion: "",
        foto: "",
        variant1: v1,
        variant2: null,
      }))
    } else if (attrs.length === 2) {
      const combinations: any[] = []
      attrs[0].variantes.forEach((v1) => {
        attrs[1].variantes.forEach((v2) => {
          combinations.push({
            sku: `${skuPadre}-${v1.toLowerCase().replace(/\s+/g, "-")}-${v2.toLowerCase().replace(/\s+/g, "-")}`,
            codigoUniversal: "",
            descripcion: "",
            foto: "",
            variant1: v1,
            variant2: v2,
          })
        })
      })
      return combinations
    }

    return []
  }

  useEffect(() => {
    // Changed dependency to `selectedItem?.hasVariants` to satisfy lint rule
    if (selectedItem && selectedItem.hasVariants && isViewingContainer) {
      console.log("[v0] Variant generation - selectedItem.variants:", selectedItem.variants)

      const combinations = generateVariantCombinations()
      setVariantItems(combinations)

      const updatedVariants = combinations.map((combo) => {
        const existingVariant = selectedItem.variants?.find((v: any) => {
          if (!v.atributosPrincipales) return false

          // Check if attributes match
          const hasMatchingAttr1 = combo.variant1
            ? v.atributosPrincipales.some((attr: any) => attr.value === combo.variant1)
            : true
          const hasMatchingAttr2 = combo.variant2
            ? v.atributosPrincipales.some((attr: any) => attr.value === combo.variant2)
            : true

          return hasMatchingAttr1 && hasMatchingAttr2
        })

        console.log("[v0] Variant generation - combo:", combo, "existingVariant found:", !!existingVariant)
        if (existingVariant) {
          console.log(
            "[v0] Variant generation - existingVariant.sku:",
            existingVariant.sku,
            "stock:",
            existingVariant.stock,
          )
        }

        if (existingVariant) {
          // Keep ALL existing variant data including SKU, stock, foto, etc.
          return {
            ...existingVariant,
            name: selectedItem.name, // Update name to match parent
            categoria: selectedItem.categoria, // Keep category synced
            atributosPrincipales: [
              combo.variant1 ? { key: containerAtributosPrincipales[0]?.key || "", value: combo.variant1 } : null,
              combo.variant2 ? { key: containerAtributosPrincipales[1]?.key || "", value: combo.variant2 } : null,
            ].filter(Boolean),
          }
        } else {
          // New variant - create with default values
          return {
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
            stock: {
              total: "0",
              reservado: "0",
              disponible: "0",
            },
          }
        }
      })

      const variantsKey = JSON.stringify(updatedVariants.map((v) => ({ sku: v.sku, attrs: v.atributosPrincipales })))
      
      // Only trigger onFieldChange if variants actually changed and this isn't the initial mount
      if (previousVariantsRef.current === null) {
        // First time - just set the reference, don't trigger change
        previousVariantsRef.current = variantsKey
      } else if (previousVariantsRef.current !== variantsKey) {
        // Variants changed - trigger update
        previousVariantsRef.current = variantsKey
        if (onFieldChange && selectedItem.sku) {
          onFieldChange(selectedItem.sku, "variants", updatedVariants)
        }
      }
    }
  }, [containerAtributosPrincipales, selectedItem, isViewingContainer]) // Fixed dependency array to include full selectedItem object

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
      // Notify parent of change
      onFieldChange(selectedItem.sku, "descripcion", descripcionValue)
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
        <div className="grid grid-cols-9 gap-2">
          <div className="col-span-3 sticky top-4 z-20 rounded-xl max-h-[calc(100vh-2rem)] border flex flex-col transition-all duration-300 border-slate-100 mt-4 bg-transparent border-none shadow-none pr-1.5 pl-0">
            <div className="p-6 mt-0 px-8 bg-transparent border-none shadow-none pl-7 pr-11">
              {isViewingContainer && (
                <div className="mt-2">
                  <div className="w-full h-64 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src={getCategoryImage(selectedItem.categoria) || "/placeholder.svg"}
                      alt={selectedItem.name}
                      width={200}
                      height={256}
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {!isViewingContainer && (
                <div className="mt-2 px-7">
                  <div className="w-full h-64 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src={getCategoryImage(selectedItem.categoria) || "/placeholder.svg"}
                      alt={selectedItem.name}
                      width={200}
                      height={256}
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 mb-0">
                <h2 className="font-semibold text-foreground text-lg mb-0">{selectedItem.name}</h2>
                <div className="border-t border-slate-200 my-4 px-0"></div>

                {/* Stock section for standalone/children items */}
                {!isViewingContainer && (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">
                      Stock en Depósito: Torcuato
                    </h3>

                    <div className="space-y-2">
                      {/* Disponible - Read only */}
                      <div className="border border-emerald-200 rounded-lg bg-emerald-50/50 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Disponible</div>
                          <span className="text-base font-bold text-emerald-600 tabular-nums mr-[35px]">
                            {Number.parseInt(selectedItem?.stock?.total || "0") -
                              Number.parseInt(selectedItem?.stock?.reservado || "0")}
                          </span>
                        </div>
                      </div>

                      {/* Total - Editable */}
                      <div className="border border-border/40 rounded-lg bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</div>
                          {!advancedStockEditMode ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (selectedItem?.sku) {
                                    const current = Number.parseInt(selectedItem?.stock?.total || "0")
                                    updateStock(selectedItem.sku, "total", Math.max(0, current - 1))
                                  }
                                }}
                                className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-semibold text-foreground min-w-[2rem] text-center tabular-nums">
                                {Number.parseInt(selectedItem?.stock?.total || "0")}
                              </span>
                              <button
                                onClick={() => {
                                  if (selectedItem?.sku) {
                                    const current = Number.parseInt(selectedItem?.stock?.total || "0")
                                    updateStock(selectedItem.sku, "total", current + 1)
                                  }
                                }}
                                className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={stockModification.total.operation}
                                onChange={(e) =>
                                  setStockModification((prev) => ({
                                    ...prev,
                                    total: { ...prev.total, operation: e.target.value },
                                  }))
                                }
                                className="text-xs border border-border/50 rounded bg-background hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer px-1 py-1"
                              >
                                <option value="aumentar">Aumentar</option>
                                <option value="disminuir">Disminuir</option>
                                <option value="reemplazar">Reemplazar</option>
                              </select>
                              <input
                                type="number"
                                placeholder="0"
                                value={stockModification.total.value}
                                onChange={(e) =>
                                  setStockModification((prev) => ({
                                    ...prev,
                                    total: { ...prev.total, value: e.target.value },
                                  }))
                                }
                                className="w-14 text-xs border border-border/50 rounded px-1.5 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-sm font-semibold text-foreground tabular-nums min-w-[2rem] text-center">
                                {Number.parseInt(selectedItem?.stock?.total || "0")}
                              </span>
                              <button
                                onClick={() => handleStockModificationAccept("total")}
                                disabled={!stockModification.total.value}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                                  stockModification.total.value
                                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 cursor-pointer"
                                    : "bg-muted/30 text-muted-foreground/30 border-border/30 cursor-not-allowed"
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reservado - Editable */}
                      <div className="border border-border/40 rounded-lg bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Reservado
                          </div>
                          {!advancedStockEditMode ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (selectedItem?.sku) {
                                    const current = Number.parseInt(selectedItem?.stock?.reservado || "0")
                                    updateStock(selectedItem.sku, "reservado", Math.max(0, current - 1))
                                  }
                                }}
                                className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-semibold text-foreground min-w-[2rem] text-center tabular-nums">
                                {Number.parseInt(selectedItem?.stock?.reservado || "0")}
                              </span>
                              <button
                                onClick={() => {
                                  if (selectedItem?.sku) {
                                    const current = Number.parseInt(selectedItem?.stock?.reservado || "0")
                                    updateStock(selectedItem.sku, "reservado", current + 1)
                                  }
                                }}
                                className="w-6 h-6 rounded border border-border/50 hover:bg-accent hover:border-border transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={stockModification.reservado.operation}
                                onChange={(e) =>
                                  setStockModification((prev) => ({
                                    ...prev,
                                    reservado: { ...prev.reservado, operation: e.target.value },
                                  }))
                                }
                                className="text-xs border border-border/50 rounded bg-background hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer px-1 py-1"
                              >
                                <option value="aumentar">Aumentar</option>
                                <option value="disminuir">Disminuir</option>
                                <option value="reemplazar">Reemplazar</option>
                              </select>
                              <input
                                type="number"
                                placeholder="0"
                                value={stockModification.reservado.value}
                                onChange={(e) =>
                                  setStockModification((prev) => ({
                                    ...prev,
                                    reservado: { ...prev.reservado, value: e.target.value },
                                  }))
                                }
                                className="w-14 text-xs border border-border/50 rounded px-1.5 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-sm font-semibold text-foreground tabular-nums min-w-[2rem] text-center">
                                {Number.parseInt(selectedItem?.stock?.reservado || "0")}
                              </span>
                              <button
                                onClick={() => handleStockModificationAccept("reservado")}
                                disabled={!stockModification.reservado.value}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                                  stockModification.reservado.value
                                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 cursor-pointer"
                                    : "bg-muted/30 text-muted-foreground/30 border-border/30 cursor-not-allowed"
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Edit Mode Toggle Button */}
                      <button
                        onClick={() => setAdvancedStockEditMode(!advancedStockEditMode)}
                        className="w-full mt-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 rounded-lg hover:bg-accent transition-all cursor-pointer"
                      >
                        Modo de edición: {advancedStockEditMode ? "Avanzado" : "Simple"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rest of the content with updated light mode styling */}
            </div>
          </div>

          {/* Right Column - Segment Buttons + Content */}
          <div className="col-span-6 flex flex-col">
            {/* Sticky Segment Buttons */}
            <div className="sticky top-[0px] z-20 backdrop-blur-[2px] bg-slate-50 mb-4">
              <div className="flex items-center gap-0 h-10 mt-3">
                {isViewingContainer ? (
                  <>
                    <button
                      onClick={() => setSelectedDetailTab("info")}
                      className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer rounded-tl-md ${
                        selectedDetailTab === "info"
                          ? "border-primary bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm font-medium uppercase tracking-wider">Info</span>
                    </button>
                    <button
                      onClick={() => setSelectedDetailTab("atributos")}
                      className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                        selectedDetailTab === "atributos"
                          ? "border-primary bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm font-medium uppercase tracking-wider">Atributos</span>
                    </button>
                    <button
                      onClick={() => setSelectedDetailTab("variantes")}
                      className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer rounded-tr-md ${
                        selectedDetailTab === "variantes"
                          ? "border-primary bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm font-medium uppercase tracking-wider">Variantes</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedDetailTab("info")}
                      className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer rounded-tl-md ${
                        selectedDetailTab === "info"
                          ? "border-primary bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm font-medium uppercase tracking-wider">Info</span>
                    </button>
                    <button
                      onClick={() => setSelectedDetailTab("atributos")}
                      className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer rounded-tr-md ${
                        selectedDetailTab === "atributos"
                          ? "border-primary bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm font-medium uppercase tracking-wider">Atributos</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Content */}
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

                  {selectedDetailTab === "atributos" && (
                    <div className="h-full flex flex-col py-2">
                      {!showAtributosView ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
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
                                Atributos Principales
                              </h3>
                              <p className="text-xs text-gray-500 italic mt-1">
                                Atributos que definen las variantes del producto (máximo 2)
                              </p>
                            </div>

                            {containerAtributosPrincipales.map((attr, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="flex-1">
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">Atributo</label>
                                  <Popover
                                    open={attr.keyOpen || false}
                                    onOpenChange={(open) => {
                                      const updated = [...containerAtributosPrincipales]
                                      updated[index].keyOpen = open
                                      handleContainerAtributosPrincipalesChange(updated)
                                    }}
                                  >
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={attr.key}
                                        onChange={(e) => {
                                          const updated = [...containerAtributosPrincipales]
                                          updated[index].key = e.target.value
                                          handleContainerAtributosPrincipalesChange(updated)
                                        }}
                                        className="w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: Color"
                                      />
                                      {Object.keys(SAVED_ATRIBUTOS).length > 0 && (
                                        <PopoverTrigger asChild>
                                          <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const updated = [...containerAtributosPrincipales]
                                              updated[index].keyOpen = !updated[index].keyOpen
                                              handleContainerAtributosPrincipalesChange(updated)
                                            }}
                                          >
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                          </button>
                                        </PopoverTrigger>
                                      )}
                                    </div>
                                    <PopoverContent className="w-[200px] p-0" align="start">
                                      <Command>
                                        <CommandList>
                                          <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                          <CommandGroup>
                                            {Object.keys(SAVED_ATRIBUTOS).map((key) => (
                                              <CommandItem
                                                key={key}
                                                value={key}
                                                onSelect={() => {
                                                  const updated = [...containerAtributosPrincipales]
                                                  updated[index].key = key
                                                  updated[index].keyOpen = false
                                                  handleContainerAtributosPrincipalesChange(updated)
                                                }}
                                              >
                                                {key}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                <div className="flex-1">
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">Variantes</label>
                                  <div className="space-y-2">
                                    <Popover
                                      open={attr.variantesOpen || false}
                                      onOpenChange={(open) => {
                                        const updated = [...containerAtributosPrincipales]
                                        updated[index].variantesOpen = open
                                        handleContainerAtributosPrincipalesChange(updated)
                                      }}
                                    >
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={varianteInput[index] || ""}
                                          onChange={(e) =>
                                            setVarianteInput({ ...varianteInput, [index]: e.target.value })
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && varianteInput[index]?.trim()) {
                                              const updated = [...containerAtributosPrincipales]
                                              updated[index].variantes.push(varianteInput[index].trim())
                                              handleContainerAtributosPrincipalesChange(updated)
                                              setVarianteInput({ ...varianteInput, [index]: "" })
                                            }
                                          }}
                                          placeholder="Ej: Rojo"
                                          className="w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {attr.key && SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                          <PopoverTrigger asChild>
                                            <button
                                              type="button"
                                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const updated = [...containerAtributosPrincipales]
                                                updated[index].variantesOpen = !updated[index].variantesOpen
                                                handleContainerAtributosPrincipalesChange(updated)
                                              }}
                                            >
                                              <ChevronDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                        )}
                                      </div>
                                      {attr.key && SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandList>
                                              <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                              <CommandGroup>
                                                {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS].map(
                                                  (val) => (
                                                    <CommandItem
                                                      key={val}
                                                      value={val}
                                                      onSelect={() => {
                                                        const updated = [...containerAtributosPrincipales]
                                                        if (!updated[index].variantes.includes(val)) {
                                                          updated[index].variantes.push(val)
                                                        }
                                                        updated[index].variantesOpen = false
                                                        handleContainerAtributosPrincipalesChange(updated)
                                                      }}
                                                    >
                                                      {val}
                                                    </CommandItem>
                                                  ),
                                                )}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      )}
                                    </Popover>

                                    <div className="flex flex-wrap gap-2">
                                      {attr.variantes.map((variante, vIndex) => (
                                        <span
                                          key={vIndex}
                                          className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-900 text-sm flex items-center gap-2"
                                        >
                                          {variante}
                                          <button
                                            onClick={() => {
                                              const updated = [...containerAtributosPrincipales]
                                              updated[index].variantes = updated[index].variantes.filter(
                                                (_, i) => i !== vIndex,
                                              )
                                              handleContainerAtributosPrincipalesChange(updated)
                                            }}
                                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const updated = containerAtributosPrincipales.filter((_, i) => i !== index)
                                    handleContainerAtributosPrincipalesChange(updated)
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
                          </div>

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
                              const isValueLocked = isChildItem && fatherAttr && fatherAttr.value

                              return (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Atributo</label>
                                    <Popover
                                      open={!isAttributeLocked && (attr.keyOpen || false)}
                                      onOpenChange={(open) => {
                                        if (!isAttributeLocked) {
                                          const updated = [...atributosInformativos]
                                          updated[index].keyOpen = open
                                          handleAtributosInformativosChange(updated)
                                        }
                                      }}
                                    >
                                      <div className="relative">
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
                                          className={`w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            isAttributeLocked ? "opacity-50 cursor-not-allowed" : ""
                                          }`}
                                          placeholder="Ej: Material"
                                        />
                                        {!isAttributeLocked && Object.keys(SAVED_ATRIBUTOS).length > 0 && (
                                          <PopoverTrigger asChild>
                                            <button
                                              type="button"
                                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const updated = [...atributosInformativos]
                                                updated[index].keyOpen = !updated[index].keyOpen
                                                handleAtributosInformativosChange(updated)
                                              }}
                                            >
                                              <ChevronDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                        )}
                                      </div>
                                      {!isAttributeLocked && (
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandList>
                                              <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                              <CommandGroup>
                                                {Object.keys(SAVED_ATRIBUTOS).map((key) => (
                                                  <CommandItem
                                                    key={key}
                                                    value={key}
                                                    onSelect={() => {
                                                      const updated = [...atributosInformativos]
                                                      updated[index].key = key
                                                      updated[index].keyOpen = false
                                                      handleAtributosInformativosChange(updated)
                                                    }}
                                                  >
                                                    {key}
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      )}
                                    </Popover>
                                  </div>

                                  <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Valor</label>
                                    <Popover
                                      open={!isValueLocked && (attr.valueOpen || false)}
                                      onOpenChange={(open) => {
                                        if (!isValueLocked) {
                                          const updated = [...atributosInformativos]
                                          updated[index].valueOpen = open
                                          handleAtributosInformativosChange(updated)
                                        }
                                      }}
                                    >
                                      <div className="relative">
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
                                          className={`w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            isValueLocked ? "opacity-50 cursor-not-allowed" : ""
                                          }`}
                                          placeholder="Ej: Algodón"
                                        />
                                        {!isValueLocked &&
                                          attr.key &&
                                          SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                            <PopoverTrigger asChild>
                                              <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  const updated = [...atributosInformativos]
                                                  updated[index].valueOpen = !updated[index].valueOpen
                                                  handleAtributosInformativosChange(updated)
                                                }}
                                              >
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                              </button>
                                            </PopoverTrigger>
                                          )}
                                      </div>
                                      {!isValueLocked &&
                                        attr.key &&
                                        SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandList>
                                                <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                                <CommandGroup>
                                                  {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS].map(
                                                    (val) => (
                                                      <CommandItem
                                                        key={val}
                                                        value={val}
                                                        onSelect={() => {
                                                          const updated = [...atributosInformativos]
                                                          updated[index].value = val
                                                          updated[index].valueOpen = false
                                                          handleAtributosInformativosChange(updated)
                                                        }}
                                                      >
                                                        {val}
                                                      </CommandItem>
                                                    ),
                                                  )}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        )}
                                    </Popover>
                                  </div>

                                  {!isAttributeLocked && (
                                    <button
                                      onClick={() => {
                                        const updated = atributosInformativos.filter((_, i) => i !== index)
                                        handleAtributosInformativosChange(updated)
                                        if (fatherItem?.atributosInformativos?.length === 0 && updated.length === 0) {
                                          setShowAtributosView(false)
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

                  {selectedDetailTab === "variantes" && (
                    <div className="h-full flex flex-col py-2">
                      {variantItems.length > 0 ? (
                        <div className="flex-1 overflow-y-auto">
                          <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-4 bg-gray-100 border-b border-gray-300">
                              <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                SKU
                              </div>
                              <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Código Universal
                              </div>
                              <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Descripción
                              </div>
                              <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Foto
                              </div>
                            </div>

                            {variantItems.map((variant) => (
                              <div
                                key={variant.sku}
                                className="grid grid-cols-4 border-b border-gray-300 last:border-b-0 hover:bg-gray-50"
                              >
                                <div className="px-4 py-3 text-sm text-gray-900 font-mono">{variant.sku}</div>
                                <div className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={variant.codigoUniversal}
                                    onChange={(e) => updateVariantField(variant.sku, "codigoUniversal", e.target.value)}
                                    placeholder="Código..."
                                    className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={variant.descripcion}
                                    onChange={(e) => updateVariantField(variant.sku, "descripcion", e.target.value)}
                                    placeholder="Descripción..."
                                    className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={variant.foto}
                                    onChange={(e) => updateVariantField(variant.sku, "foto", e.target.value)}
                                    placeholder="URL de foto..."
                                    className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                          <p className="text-sm">
                            No hay variantes configuradas. Agrega variantes en la sección de Atributos.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Individual item tab content
                <>
                  {selectedDetailTab === "info" && (
                    <div className="h-full flex flex-col py-2">
                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                        Información del Producto
                      </h3>

                      <div className="space-y-3">
                        {/* SKU and Código Universal */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">SKU</label>
                            <div className="flex items-center gap-2">
                              {editingSku ? (
                                <input
                                  type="text"
                                  value={skuValue}
                                  onChange={(e) => setSkuValue(e.target.value)}
                                  onBlur={handleSkuBlur}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSkuBlur()
                                  }}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingSku(true)}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 cursor-pointer hover:border-gray-400 font-mono text-sm"
                                >
                                  {selectedItem?.sku ||
                                    selectedItem?.name
                                      .toUpperCase()
                                      .replace(/[^A-Z0-9\s]/g, "")
                                      .split(" ")
                                      .map((word: string) => word.substring(0, 3))
                                      .join("-")
                                      .substring(0, 15)}
                                </div>
                              )}
                              {!editingSku && (
                                <button
                                  onClick={handleCopySku}
                                  className="text-muted-foreground hover:text-foreground transition-colors p-2"
                                  title="Copiar SKU"
                                >
                                  {skuCopied ? (
                                    <span className="text-success text-xs">✓</span>
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Código Universal</label>
                            <div className="flex items-center gap-2">
                              {editingCodigoUniversal ? (
                                <input
                                  type="text"
                                  value={codigoUniversalValue}
                                  onChange={(e) => setCodigoUniversalValue(e.target.value)}
                                  onBlur={handleCodigoUniversalBlur}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCodigoUniversalBlur()
                                  }}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingCodigoUniversal(true)}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 cursor-pointer hover:border-gray-400 font-mono text-sm"
                                >
                                  {selectedItem.codigoUniversal || "N/A"}
                                </div>
                              )}
                              {!editingCodigoUniversal && (
                                <button
                                  onClick={handleCopyCodigoUniversal}
                                  className="text-muted-foreground hover:text-foreground transition-colors p-2"
                                  title="Copiar Código Universal"
                                  disabled={!selectedItem?.codigoUniversal}
                                >
                                  {codigoUniversalCopied ? (
                                    <span className="text-success text-xs">✓</span>
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Categoría and Marca */}
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

                      <div className="border-t border-gray-200 my-4"></div>

                      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                        Descripción del Item
                      </h3>

                      <div className="flex flex-col gap-2">
                        {editingDescripcion ? (
                          <textarea
                            value={descripcionValue}
                            onChange={(e) => setDescripcionValue(e.target.value)}
                            onBlur={handleDescripcionBlur}
                            className="w-full h-28 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                            placeholder="Agregar descripción del producto..."
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => setEditingDescripcion(true)}
                            className="w-full min-h-[70px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 cursor-pointer hover:border-gray-400 text-sm"
                          >
                            {descripcionValue || (
                              <span className="text-gray-400">Click para agregar descripción...</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailTab === "atributos" && (
                    <div className="h-full flex flex-col py-2">
                      {!showIndividualAtributosView ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                          <p className="text-gray-500 text-sm">No hay atributos configurados</p>
                          <button
                            onClick={() => setShowIndividualAtributosView(true)}
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
                                Atributos Principales
                              </h3>
                              <p className="text-xs text-gray-500 italic mt-1">
                                Atributos que definen las características principales del producto (máximo 2)
                              </p>
                            </div>

                            {atributosPrincipales.map((attr, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="flex-1">
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">Atributo</label>
                                  <Popover
                                    open={!isChildItem && (attr.keyOpen || false)}
                                    onOpenChange={(open) => {
                                      if (!isChildItem) {
                                        const updated = [...atributosPrincipales]
                                        updated[index].keyOpen = open
                                        handleAtributosPrincipalesChange(updated)
                                      }
                                    }}
                                  >
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={attr.key}
                                        onChange={(e) => {
                                          if (!isChildItem) {
                                            const updated = [...atributosPrincipales]
                                            updated[index].key = e.target.value
                                            handleAtributosPrincipalesChange(updated)
                                          }
                                        }}
                                        disabled={isChildItem}
                                        className={`w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          isChildItem ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                        placeholder="Ej: Color"
                                      />
                                      {!isChildItem && Object.keys(SAVED_ATRIBUTOS).length > 0 && (
                                        <PopoverTrigger asChild>
                                          <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const updated = [...atributosPrincipales]
                                              updated[index].keyOpen = !updated[index].keyOpen
                                              handleAtributosPrincipalesChange(updated)
                                            }}
                                          >
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                          </button>
                                        </PopoverTrigger>
                                      )}
                                    </div>
                                    {!isChildItem && (
                                      <PopoverContent className="w-[200px] p-0" align="start">
                                        <Command>
                                          <CommandList>
                                            <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                            <CommandGroup>
                                              {Object.keys(SAVED_ATRIBUTOS).map((attrKey) => (
                                                <CommandItem
                                                  key={attrKey}
                                                  value={attrKey}
                                                  onSelect={() => {
                                                    const updated = [...atributosPrincipales]
                                                    updated[index].key = attrKey
                                                    updated[index].keyOpen = false
                                                    handleAtributosPrincipalesChange(updated)
                                                  }}
                                                >
                                                  {attrKey}
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    )}
                                  </Popover>
                                </div>

                                <div className="flex-1">
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">Dato</label>
                                  <Popover
                                    open={!isChildItem && (attr.valueOpen || false)}
                                    onOpenChange={(open) => {
                                      if (!isChildItem) {
                                        const updated = [...atributosPrincipales]
                                        updated[index].valueOpen = open
                                        handleAtributosPrincipalesChange(updated)
                                        updateProductTitle()
                                      }
                                    }}
                                  >
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={attr.value}
                                        onChange={(e) => {
                                          if (!isChildItem) {
                                            const updated = [...atributosPrincipales]
                                            updated[index].value = e.target.value
                                            handleAtributosPrincipalesChange(updated)
                                            updateProductTitle()
                                          }
                                        }}
                                        disabled={isChildItem}
                                        className={`w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          isChildItem ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                        placeholder="Ej: Negro"
                                      />
                                      {!isChildItem &&
                                        attr.key &&
                                        SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                          <PopoverTrigger asChild>
                                            <button
                                              type="button"
                                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const updated = [...atributosPrincipales]
                                                updated[index].valueOpen = !updated[index].valueOpen
                                                handleAtributosPrincipalesChange(updated)
                                              }}
                                            >
                                              <ChevronDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                        )}
                                    </div>
                                    {!isChildItem &&
                                      attr.key &&
                                      SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandList>
                                              <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                              <CommandGroup>
                                                {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS].map(
                                                  (val) => (
                                                    <CommandItem
                                                      key={val}
                                                      value={val}
                                                      onSelect={() => {
                                                        const updated = [...atributosPrincipales]
                                                        updated[index].value = val
                                                        updated[index].valueOpen = false
                                                        handleAtributosPrincipalesChange(updated)
                                                        updateProductTitle()
                                                      }}
                                                    >
                                                      {val}
                                                    </CommandItem>
                                                  ),
                                                )}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      )}
                                  </Popover>
                                </div>

                                {!isChildItem && (
                                  <button
                                    onClick={() => {
                                      const updated = atributosPrincipales.filter((_, i) => i !== index)
                                      handleAtributosPrincipalesChange(updated)
                                      updateProductTitle()
                                      if (updated.length === 0 && atributosInformativos.length === 0) {
                                        setShowIndividualAtributosView(false)
                                      }
                                    }}
                                    className="mt-8 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                                {isChildItem && <div className="mt-8 w-4"></div>}
                              </div>
                            ))}

                            {!isChildItem && atributosPrincipales.length < 2 && (
                              <button
                                onClick={() => {
                                  handleAtributosPrincipalesChange([...atributosPrincipales, { key: "", value: "" }])
                                }}
                                className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Agregar atributo</span>
                              </button>
                            )}
                          </div>

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
                              const isValueLocked = isChildItem && fatherAttr && fatherAttr.value

                              return (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Atributo</label>
                                    <Popover
                                      open={!isAttributeLocked && (attr.keyOpen || false)}
                                      onOpenChange={(open) => {
                                        if (!isAttributeLocked) {
                                          const updated = [...atributosInformativos]
                                          updated[index].keyOpen = open
                                          handleAtributosInformativosChange(updated)
                                        }
                                      }}
                                    >
                                      <div className="relative">
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
                                          className={`w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                                            isAttributeLocked ? "opacity-50 cursor-not-allowed" : ""
                                          }`}
                                          placeholder="Ej: Material"
                                        />
                                        {!isAttributeLocked && Object.keys(SAVED_ATRIBUTOS).length > 0 && (
                                          <PopoverTrigger asChild>
                                            <button
                                              type="button"
                                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const updated = [...atributosInformativos]
                                                updated[index].keyOpen = !updated[index].keyOpen
                                                handleAtributosInformativosChange(updated)
                                              }}
                                            >
                                              <ChevronDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                        )}
                                      </div>
                                      {!isAttributeLocked && (
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandList>
                                              <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                              <CommandGroup>
                                                {Object.keys(SAVED_ATRIBUTOS).map((key) => (
                                                  <CommandItem
                                                    key={key}
                                                    value={key}
                                                    onSelect={() => {
                                                      const updated = [...atributosInformativos]
                                                      updated[index].key = key
                                                      updated[index].keyOpen = false
                                                      handleAtributosInformativosChange(updated)
                                                    }}
                                                  >
                                                    {key}
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      )}
                                    </Popover>
                                  </div>

                                  <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Valor</label>
                                    <Popover
                                      open={!isValueLocked && (attr.valueOpen || false)}
                                      onOpenChange={(open) => {
                                        if (!isValueLocked) {
                                          const updated = [...atributosInformativos]
                                          updated[index].valueOpen = open
                                          handleAtributosInformativosChange(updated)
                                        }
                                      }}
                                    >
                                      <div className="relative">
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
                                          className={`w-full px-3 py-2 pr-9 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                                            isValueLocked ? "opacity-50 cursor-not-allowed" : ""
                                          }`}
                                          placeholder="Ej: Algodón"
                                        />
                                        {!isValueLocked &&
                                          attr.key &&
                                          SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                            <PopoverTrigger asChild>
                                              <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  const updated = [...atributosInformativos]
                                                  updated[index].valueOpen = !updated[index].valueOpen
                                                  handleAtributosInformativosChange(updated)
                                                }}
                                              >
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                              </button>
                                            </PopoverTrigger>
                                          )}
                                      </div>
                                      {!isValueLocked &&
                                        attr.key &&
                                        SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] && (
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandList>
                                                <CommandEmpty>No hay opciones guardadas</CommandEmpty>
                                                <CommandGroup>
                                                  {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS].map(
                                                    (val) => (
                                                      <CommandItem
                                                        key={val}
                                                        value={val}
                                                        onSelect={() => {
                                                          const updated = [...atributosInformativos]
                                                          updated[index].value = val
                                                          updated[index].valueOpen = false
                                                          handleAtributosInformativosChange(updated)
                                                        }}
                                                      >
                                                        {val}
                                                      </CommandItem>
                                                    ),
                                                  )}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        )}
                                    </Popover>
                                  </div>

                                  {!isAttributeLocked && (
                                    <button
                                      onClick={() => {
                                        const updated = atributosInformativos.filter((_, i) => i !== index)
                                        handleAtributosInformativosChange(updated)
                                        if (atributosPrincipales.length === 0 && updated.length === 0) {
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
          </div>
        </div>
      </div>
    </>
  )
}
