"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import type { Item } from "@/lib/types"
import { ChevronDown, ChevronRight, Plus, Copy, X, Undo2, Redo2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { SAVED_ATRIBUTOS, TEMPLATES, DEPOSITS } from "@/lib/constants"
// import { Breadcrumb } from "@/components/layout/breadcrumb"

interface ItemDetailPanelProps {
  selectedItem: Item
  selectedDetailTab: string
  setSelectedDetailTab: (tab: string) => void
  expandedItems: Set<string>
  toggleVariantExpansion: (sku: string) => void
  depositStock: Record<string, number> // Changed from Record<string, DepositStock> to Record<string, number>
  updateDepositStock: (sku: string, quantity: number) => void
  updateItem: (sku: string, updates: Partial<Item>) => void
  allItems: Item[]
  onDynamicContentChange?: (content: React.ReactNode) => void
  item: any
  onClose: () => void
  onFieldChange: (itemId: string, field: string, value: any) => void
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
  depositStock,
  updateDepositStock,
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
    Array<{ key: string; value: string; isOpen?: boolean; keyOpen?: boolean }>
  >(() => {
    if (isChildItem && fatherItem?.containerAtributosPrincipales) {
      // For child items, enforce strict inheritance from parent's containerAtributosPrincipales
      // Filter out invalid attributes (those with empty variantes arrays)
      const validParentAttributes = fatherItem.containerAtributosPrincipales.filter(
        (attr) => attr.variantes && attr.variantes.length > 0,
      )

      // Map to child format, preserving existing values or defaulting to first variante
      return validParentAttributes.map((parentAttr) => {
        const existingChildAttr = selectedItem?.atributosPrincipales?.find((a) => a.key === parentAttr.key)
        return {
          key: parentAttr.key,
          value: existingChildAttr?.value || parentAttr.variantes[0] || "",
        }
      })
    }

    // For standalone items or containers, use their own attributes
    return selectedItem?.atributosPrincipales || []
  })

  const [atributosInformativos, setAtributosInformativos] = useState<
    Array<{ key: string; value: string; isOpen?: boolean; keyOpen?: boolean }>
  >(() => {
    if (isChildItem && fatherItem?.atributosInformativos) {
      // Start with father's attributes (Case 1 & 2)
      const mergedAttributes = fatherItem.atributosInformativos.map((fatherAttr) => {
        // Check if child has this attribute
        const childAttr = selectedItem?.atributosInformativos?.find((a) => a.key === fatherAttr.key)
        // If father has a value, use it (locked). If not, use child's value (editable)
        return {
          key: fatherAttr.key,
          value: fatherAttr.value || childAttr?.value || "",
        }
      })

      // Add variant-exclusive attributes (Case 3)
      if (selectedItem?.atributosInformativos) {
        selectedItem.atributosInformativos.forEach((childAttr) => {
          // Only add if this attribute doesn't exist in father
          const existsInFather = fatherItem.atributosInformativos.some((f) => f.key === childAttr.key)
          if (!existsInFather) {
            mergedAttributes.push({
              key: childAttr.key,
              value: childAttr.value,
            })
          }
        })
      }

      return mergedAttributes
    }

    // For standalone items or containers, return their own attributes
    return selectedItem?.atributosInformativos || []
  })

  const [skuCopied, setSkuCopied] = useState(false)
  const [codigoUniversalCopied, setCodigoUniversalCopied] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSelectingTemplateForContainer, setIsSelectingTemplateForContainer] = useState(false)

  const [showAtributosView, setShowAtributosView] = useState(false)
  const [showIndividualAtributosView, setShowIndividualAtributosView] = useState(false)

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

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1)
      // Apply previous state
      const previousState = history[historyIndex - 1]
      applyState(previousState)
    }
  }

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1)
      // Apply next state
      const nextState = history[historyIndex + 1]
      applyState(nextState)
    }
  }

  const applyState = (state: any) => {
    setItemTitulo(state.itemTitulo)
    setMarca(state.marca)
    setModelo(state.modelo)
    setFormatoVenta(state.formatoVenta)
    setUnidadesPorPack(state.unidadesPorPack)
    setVolumenActive(state.volumenActive)
    setVolumenCantidad(state.volumenCantidad)
    setVolumenUnidad(state.volumenUnidad)
    setProveedor(state.proveedor)
    setCodigoProveedor(state.codigoProveedor)
    setAtributosPrincipales(state.atributosPrincipales)
    setAtributosInformativos(state.atributosInformativos)
    setSkuValue(state.skuValue)
    setCodigoUniversalValue(state.codigoUniversalValue)
    setDescripcionValue(state.descripcionValue) // Added for description
    setCategoria(state.categoria) // Added for categoria
  }

  const saveToHistory = () => {
    const currentState = {
      itemTitulo,
      marca,
      modelo,
      formatoVenta,
      unidadesPorPack,

      volumenActive,
      volumenCantidad,
      volumenUnidad,
      proveedor,
      codigoProveedor,
      atributosPrincipales,
      atributosInformativos,
      skuValue,
      codigoUniversalValue,
      descripcionValue, // Added for description
      categoria, // Added for categoria
    }

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(currentState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    // Save changes logic here
    // Assuming updateItem is called elsewhere with the final values from state
    setHasUnsavedChanges(false)
  }

  const handleDiscard = () => {
    // Discard changes and reset to original state
    if (history.length > 0) {
      applyState(history[0])
      setHistoryIndex(0)
    }
    setHasUnsavedChanges(false)
  }

  const isInitialMount = useRef(true)

  // State for attribute views
  // const [showAtributosView, setShowAtributosView] = useState(false) // <-- REMOVED DUPLICATE STATE
  // const hasExistingAttributes = Boolean( // <-- REMOVED DUPLICATE LOGIC
  //   (selectedItem?.atributosPrincipales && selectedItem.atributosPrincipales.length > 0) ||
  //     (selectedItem?.atributosInformativos && selectedItem.atributosInformativos.length > 0) ||
  //     (selectedItem?.containerAtributosPrincipales && selectedItem.containerAtributosPrincipales.length > 0),
  // )

  // const [showIndividualAtributosView, setShowIndividualAtributosView] = useState(false) // <-- REMOVED DUPLICATE STATE

  useEffect(() => {
    //setShowIndividualAtributosView(hasExistingAttributes) // <-- REMOVED DUPLICATE LOGIC
  }, [selectedItem?.sku, hasExistingAttributes])

  // State for variant input
  const [varianteInput, setVarianteInput] = useState<Record<number, string>>({})

  useEffect(() => {
    const hasAttributes =
      (selectedItem?.atributosPrincipales && selectedItem.atributosPrincipales.length > 0) ||
      (selectedItem?.atributosInformativos && selectedItem.atributosInformativos.length > 0) ||
      (selectedItem?.containerAtributosPrincipales && selectedItem.containerAtributosPrincipales.length > 0)

    console.log("[v0] useEffect running - hasAttributes:", hasAttributes)
    console.log("[v0] useEffect - setting showIndividualAtributosView to:", hasAttributes)
    setShowIndividualAtributosView(hasAttributes)
  }, [selectedItem])

  useEffect(() => {
    // Skip the initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Save to history whenever any field changes
    saveToHistory()
  }, [
    itemTitulo,
    marca,
    modelo,
    formatoVenta,
    unidadesPorPack,
    volumenActive,
    volumenCantidad,
    volumenUnidad,
    proveedor,
    codigoProveedor,
    atributosPrincipales,
    atributosInformativos,
    skuValue,
    codigoUniversalValue,
    descripcionValue, // Added for description
    categoria, // Added for categoria
  ])

  // Pass dynamic content to parent
  useEffect(() => {
    if (onDynamicContentChange) {
      const content = hasUnsavedChanges ? (
        <>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-0.5 rounded transition-colors ${
              canUndo
                ? "text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
                : "text-gray-700 cursor-not-allowed"
            }`}
            title="Deshacer"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-0.5 rounded transition-colors ${
              canRedo
                ? "text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
                : "text-gray-700 cursor-not-allowed"
            }`}
            title="Rehacer"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-gray-800 mx-1"></div>
          <button
            onClick={handleDiscard}
            className="px-2 py-0.5 rounded text-xs transition-colors hover:bg-red-900/40 hover:text-red-300 border border-red-900/50 text-red-400 bg-red-950/40 font-medium"
          >
            Deshacer
          </button>
          <button
            onClick={handleSave}
            className="px-2 py-0.5 rounded text-xs transition-colors hover:bg-emerald-900/40 hover:text-emerald-300 border border-emerald-900/50 bg-emerald-950/40 text-emerald-400 font-medium"
          >
            Guardar
          </button>
        </>
      ) : null

      onDynamicContentChange(content)
    }
  }, [hasUnsavedChanges, canUndo, canRedo, onDynamicContentChange])

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
    if (selectedItem && selectedItem.hasVariants && isViewingContainer) {
      const combinations = generateVariantCombinations()
      setVariantItems(combinations)

      const updatedVariants = combinations.map((combo) => {
        // Check if this variant already exists in selectedItem.variants
        const existingVariant = selectedItem.variants?.find((v: any) => v.sku === combo.sku)

        if (existingVariant) {
          // Keep existing variant data but update		        atributosPrincipales and name
          return {
            ...existingVariant,
            name: selectedItem.name, // Store base title only (father's name)
            atributosPrincipales: [
              combo.variant1 ? { key: containerAtributosPrincipales[0]?.key || "", value: combo.variant1 } : null,
              combo.variant2 ? { key: containerAtributosPrincipales[1]?.key || "", value: combo.variant2 } : null,
            ].filter(Boolean),
          }
        } else {
          // Create new variant with default stock
          return {
            sku: combo.sku,
            name: selectedItem.name, // Store base title only (father's name)
            codigoUniversal: combo.codigoUniversal || "",
            descripcion: combo.descripcion || "",
            foto: combo.foto || "",
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

      // Update the item with new variants array
      updateItem(selectedItem.sku, {
        variants: updatedVariants,
      })
    }
  }, [containerAtributosPrincipales, selectedItem])

  useEffect(() => {
    if (selectedItem && selectedItem.hasVariants && isViewingContainer && variantItems.length > 0) {
      variantItems.forEach((variant) => {
        if (!depositStock[variant.sku]) {
          const sourceVariant = selectedItem.variants?.find((v: any) => v.sku === variant.sku)

          if (sourceVariant && (sourceVariant.total || sourceVariant.reservado)) {
            const total = Number.parseInt(sourceVariant.total) || 0
            const reservado = Number.parseInt(sourceVariant.reservado) || 0

            updateDepositStock(variant.sku, total)
            updateDepositStock(variant.sku, reservado)

            const otherDeposits = DEPOSITS.filter((d) => d !== DEPOSITS[0])
            otherDeposits.forEach((deposit) => {
              updateDepositStock(variant.sku, 0) // Set total to 0
              updateDepositStock(variant.sku, 0) // Set reserved to 0
            })
          } else {
            DEPOSITS.forEach((deposit) => {
              updateDepositStock(variant.sku, 0)
              updateDepositStock(variant.sku, 0)
            })
          }
        }
      })
    }
  }, [variantItems, selectedItem, isViewingContainer])

  const toggleVariantStockExpansion = (sku: string) => {
    setExpandedVariantStock((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }))
  }

  const updateVariantField = (sku: string, field: "codigoUniversal" | "descripcion" | "foto", value: string) => {
    setVariantItems((prev) => prev.map((item) => (item.sku === sku ? { ...item, [field]: value } : item)))
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
        .map((word) => word.substring(0, 3))
        .join("-")
        .substring(0, 15)
      await navigator.clipboard.writeText(skuPadre)
      setSkuCopied(true)
      setTimeout(() => setSkuCopied(false), 2000)
    }
  }

  const handleCopyCodigoUniversal = async () => {
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
      setHasUnsavedChanges(true)
    }
  }

  const handleCodigoUniversalBlur = () => {
    if (selectedItem?.sku && editingCodigoUniversal) {
      updateItem(selectedItem.sku, { codigoUniversal: codigoUniversalValue })
      setEditingCodigoUniversal(false)
      setHasUnsavedChanges(true)
    }
  }

  const handleDescripcionBlur = () => {
    if (selectedItem?.sku && editingDescripcion) {
      updateItem(selectedItem.sku, { descripcion: descripcionValue })
      setEditingDescripcion(false)
      setHasUnsavedChanges(true)
    }
  }

  return (
    <>
      {/* <Breadcrumb dynamicContent={null} /> */}

      <div className="px-8 pt-6 pb-6 bg-slate-50 min-h-screen">
        <div className="grid grid-cols-10 gap-24">
          {/* Left Column - Item Info (suspended card) - Made fixed to stay in place while scrolling */}
          <div className="col-span-3">
            <div
              className="fixed bg-card rounded-xl h-[550px] shadow-lg border border-border overflow-hidden flex flex-col transition-all duration-300"
              style={{
                width: isExpanded ? "calc((100vw - 16.5rem) * 0.3 - 1.5rem)" : "calc((100vw - 4rem) * 0.3 - 1.5rem)",
              }}
            >
              <div className="p-6 overflow-y-auto">
                <div>
                  <h2 className="font-semibold text-foreground text-lg">{selectedItem.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-muted-foreground">
                      {isViewingContainer ? "SKU Padre:" : "SKU:"}{" "}
                      {editingSku ? (
                        <input
                          type="text"
                          value={skuValue}
                          onChange={(e) => setSkuValue(e.target.value)}
                          onBlur={handleSkuBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSkuBlur()
                          }}
                          className="inline-block w-48 bg-secondary border border-border text-foreground px-2 py-0.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => setEditingSku(true)}
                          className="font-mono text-foreground cursor-pointer hover:underline"
                        >
                          {selectedItem?.sku ||
                            selectedItem?.name
                              .toUpperCase()
                              .replace(/[^A-Z0-9\s]/g, "")
                              .split(" ")
                              .map((word: string) => word.substring(0, 3))
                              .join("-")
                              .substring(0, 15)}
                        </span>
                      )}
                    </p>
                    {!editingSku && (
                      <button
                        onClick={handleCopySku}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copiar SKU"
                      >
                        {skuCopied ? <span className="text-success text-xs">✓</span> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>

                  {!isViewingContainer && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">Código Universal:</p>
                      {editingCodigoUniversal ? (
                        <input
                          type="text"
                          value={codigoUniversalValue}
                          onChange={(e) => setCodigoUniversalValue(e.target.value)}
                          onBlur={handleCodigoUniversalBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCodigoUniversalBlur()
                          }}
                          className="inline-block w-48 bg-secondary border border-border text-foreground px-2 py-0.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => setEditingCodigoUniversal(true)}
                          className="font-mono text-foreground cursor-pointer hover:underline"
                        >
                          {selectedItem.codigoUniversal || "N/A"}
                        </span>
                      )}
                      {!editingCodigoUniversal && (
                        <button
                          onClick={handleCopyCodigoUniversal}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copiar Código Universal"
                          disabled={!selectedItem?.codigoUniversal}
                        >
                          {codigoUniversalCopied ? (
                            <span className="text-success text-xs">✓</span>
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2 mt-2">
                    <h3 className="text-sm font-medium text-foreground">Imagen del Producto</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setImageView("imagen")}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          imageView === "imagen"
                            ? "bg-accent text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        Imagen
                      </button>
                      <button
                        onClick={() => setImageView("descripcion")}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          imageView === "descripcion"
                            ? "bg-accent text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        Descripción
                      </button>
                    </div>
                  </div>

                  {imageView === "imagen" ? (
                    <div className="w-full h-48 bg-accent rounded-lg flex items-center justify-center border-2 border-dashed border-border mt-8">
                      <span className="text-sm text-muted-foreground">Sin Imagen</span>
                    </div>
                  ) : (
                    <div className="w-full">
                      {editingDescripcion ? (
                        <textarea
                          value={descripcionValue}
                          onChange={(e) => setDescripcionValue(e.target.value)}
                          onBlur={handleDescripcionBlur}
                          className="w-full h-48 bg-secondary border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          placeholder="Agregar descripción del producto..."
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => setEditingDescripcion(true)}
                          className="w-full h-48 bg-secondary border border-border rounded-lg p-3 text-sm text-foreground cursor-text hover:border-muted-foreground overflow-y-auto"
                        >
                          {descripcionValue || (
                            <span className="text-muted-foreground">Click para agregar descripción...</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rest of the content with updated light mode styling */}
              </div>
            </div>
          </div>

          {/* Right Column - Tabs and Content */}
          <div className="col-span-7 flex flex-col w-full ml-0 overflow-hidden">
            {/* Tab Buttons - Now uses natural document flow */}
            <div className="flex items-center gap-0 h-10 mb-4 bg-slate-50 z-10">
              {isViewingContainer ? (
                <>
                  <button
                    onClick={() => setSelectedDetailTab("info")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
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
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "variantes"
                        ? "border-primary bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Variantes</span>
                  </button>
                  <button
                    onClick={() => setSelectedDetailTab("stock-variantes")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "stock-variantes"
                        ? "border-primary bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Stock</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedDetailTab("info")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
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
                    onClick={() => setSelectedDetailTab("stock")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "stock"
                        ? "border-primary bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Stock</span>
                  </button>
                </>
              )}
            </div>

            {/* Tab Content - Removed mt-14, now uses natural flow */}
            <div className="flex-1">
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
                              onChange={(e) => setCategoria(e.target.value)}
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
                              onChange={(e) => setMarca(e.target.value)}
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
                              onChange={(e) => setFormatoVenta(e.target.value)}
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
                                  setUnidadesPorPack("N.E.")
                                } else if (/^\d+$/.test(value)) {
                                  const numValue = Number.parseInt(value)
                                  if (numValue < 1) {
                                    setUnidadesPorPack("1")
                                  } else {
                                    setUnidadesPorPack(value)
                                  }
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
                              onClick={() => setVolumenActive(!volumenActive)}
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
                                  onChange={(e) => setVolumenCantidad(e.target.value)}
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
                                  onChange={(e) => setVolumenUnidad(e.target.value)}
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
                            onChange={(e) => setProveedor(e.target.value)}
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
                              onChange={(e) => setCodigoProveedor(e.target.value)}
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
                          <div className="flex gap-3">
                            <button
                              onClick={() => setShowAtributosView(true)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors cursor-pointer"
                            >
                              Agregar atributos
                            </button>
                            <button
                              onClick={() => {
                                setIsSelectingTemplateForContainer(true)
                                setShowTemplateModal(true)
                              }}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              Usar Template
                            </button>
                          </div>
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
                                      setContainerAtributosPrincipales(updated)
                                    }}
                                  >
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={attr.key}
                                        onChange={(e) => {
                                          const updated = [...containerAtributosPrincipales]
                                          updated[index].key = e.target.value
                                          setContainerAtributosPrincipales(updated)
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
                                              setContainerAtributosPrincipales(updated)
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
                                                  setContainerAtributosPrincipales(updated)
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
                                        setContainerAtributosPrincipales(updated)
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
                                              setContainerAtributosPrincipales(updated)
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
                                                setContainerAtributosPrincipales(updated)
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
                                                        setContainerAtributosPrincipales(updated)
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
                                              setContainerAtributosPrincipales(updated)
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
                                    setContainerAtributosPrincipales(updated)
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
                                  setContainerAtributosPrincipales([
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
                                          setAtributosInformativos(updated)
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
                                              setAtributosInformativos(updated)
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
                                                setAtributosInformativos(updated)
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
                                                      setAtributosInformativos(updated)
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
                                      open={!isValueLocked && (attr.isOpen || false)}
                                      onOpenChange={(open) => {
                                        if (!isValueLocked) {
                                          const updated = [...atributosInformativos]
                                          updated[index].isOpen = open
                                          setAtributosInformativos(updated)
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
                                              setAtributosInformativos(updated)
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
                                                  updated[index].isOpen = !updated[index].isOpen
                                                  setAtributosInformativos(updated)
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
                                                          updated[index].isOpen = false
                                                          setAtributosInformativos(updated)
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
                                        setAtributosInformativos(updated)
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
                                setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
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

                  {selectedDetailTab === "stock-variantes" && (
                    <div className="h-full flex flex-col py-2">
                      {variantItems.length > 0 ? (
                        <div className="space-y-2">
                          {variantItems.map((variant) => {
                            const sourceVariant = selectedItem.variants?.find((v: any) => v.sku === variant.sku)
                            const variantStock = depositStock[variant.sku] || {}

                            // Use source variant data if available, otherwise calculate from deposits
                            const totalStock = sourceVariant?.total
                              ? Number.parseInt(sourceVariant.total)
                              : Object.values(variantStock).reduce(
                                  (sum: number, dep: any) => sum + (dep?.total || 0),
                                  0,
                                )
                            const totalReservado = sourceVariant?.reservado
                              ? Number.parseInt(sourceVariant.reservado)
                              : Object.values(variantStock).reduce(
                                  (sum: number, dep: any) => sum + (dep?.reservado || 0),
                                  0,
                                )
                            const totalDisponible = totalStock - totalReservado

                            return (
                              <div key={variant.sku} className="border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleVariantStockExpansion(variant.sku)}
                                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    {expandedVariantStock[variant.sku] ? (
                                      <ChevronDown className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                    )}
                                    <span className="text-sm text-gray-900 font-mono">{variant.sku}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>Total: {totalStock}</span>
                                    <span>Reservado: {totalReservado}</span>
                                    <span> Disponible: {totalDisponible}</span>
                                  </div>
                                </button>

                                {expandedVariantStock[variant.sku] && (
                                  <div className="border-t border-gray-300">
                                    <div className="grid grid-cols-4 bg-gray-100 border-b border-gray-300">
                                      <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Depósito
                                      </div>
                                      <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                                        Total
                                      </div>
                                      <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                                        Reservado
                                      </div>
                                      <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                                        Disponible
                                      </div>
                                    </div>

                                    {DEPOSITS.map((deposit) => {
                                      const stock = variantStock[deposit] || { total: 0, reservado: 0 }
                                      const disponible = stock.total - stock.reservado

                                      return (
                                        <div
                                          key={deposit}
                                          className="grid grid-cols-4 border-b border-gray-300 last:border-b-0 bg-white"
                                        >
                                          <div className="px-4 py-3 text-sm text-gray-900">{deposit}</div>
                                          <div className="px-4 py-3 text-sm text-gray-800 text-right">
                                            <input
                                              type="number"
                                              value={stock.total}
                                              onChange={(e) =>
                                                updateDepositStock(
                                                  variant.sku,
                                                  deposit,
                                                  "total",
                                                  Number.parseInt(e.target.value) || 0,
                                                )
                                              }
                                              className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-100 px-2 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500"
                                            />
                                          </div>
                                          <div className="px-4 py-3 text-sm text-gray-800 text-right">
                                            <input
                                              type="number"
                                              value={stock.reservado}
                                              onChange={(e) =>
                                                updateDepositStock(
                                                  variant.sku,
                                                  deposit,
                                                  "reservado",
                                                  Number.parseInt(e.target.value) || 0,
                                                )
                                              }
                                              className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-100 px-2 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500"
                                            />
                                          </div>
                                          <div className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                                            {disponible}
                                          </div>
                                        </div>
                                      )
                                    })}

                                    <div className="grid grid-cols-4 bg-gray-200 font-medium">
                                      <div className="px-4 py-3 text-sm text-gray-800">Global</div>
                                      <div className="px-4 py-3 text-sm text-gray-800 text-right">{totalStock}</div>
                                      <div className="px-4 py-3 text-sm text-gray-800 text-right">{totalReservado}</div>
                                      <div className="px-4 py-3 text-sm text-gray-800 text-right">
                                        {totalDisponible}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                          <p className="text-sm">No hay variantes para mostrar stock.</p>
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Categoría</label>
                            <input
                              type="text"
                              value={categoria}
                              onChange={(e) => setCategoria(e.target.value)}
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
                              onChange={(e) => setMarca(e.target.value)}
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
                              onChange={(e) => setFormatoVenta(e.target.value)}
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
                                  setUnidadesPorPack("N.E.")
                                } else if (/^\d+$/.test(value)) {
                                  const numValue = Number.parseInt(value)
                                  if (numValue < 1) {
                                    setUnidadesPorPack("1")
                                  } else {
                                    setUnidadesPorPack(value)
                                  }
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
                              onClick={() => setVolumenActive(!volumenActive)}
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
                                  onChange={(e) => setVolumenCantidad(e.target.value)}
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
                                  onChange={(e) => setVolumenUnidad(e.target.value)}
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
                            onChange={(e) => setProveedor(e.target.value)}
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
                              onChange={(e) => setCodigoProveedor(e.target.value)}
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
                      {!showIndividualAtributosView ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                          <p className="text-gray-500 text-sm">No hay atributos configurados</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setShowIndividualAtributosView(true)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors cursor-pointer"
                            >
                              Agregar atributos
                            </button>
                            <button
                              onClick={() => {
                                setIsSelectingTemplateForContainer(false)
                                setShowTemplateModal(true)
                              }}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              Usar Template
                            </button>
                          </div>
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
                                        setAtributosPrincipales(updated)
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
                                            setAtributosPrincipales(updated)
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
                                              setAtributosPrincipales(updated)
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
                                                    setAtributosPrincipales(updated)
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
                                    open={!isChildItem && (attr.isOpen || false)}
                                    onOpenChange={(open) => {
                                      if (!isChildItem) {
                                        const updated = [...atributosPrincipales]
                                        updated[index].isOpen = open
                                        setAtributosPrincipales(updated)
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
                                            setAtributosPrincipales(updated)
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
                                                updated[index].isOpen = !updated[index].isOpen
                                                setAtributosPrincipales(updated)
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
                                                        updated[index].isOpen = false
                                                        setAtributosPrincipales(updated)
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
                                      setAtributosPrincipales(updated)
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
                                  setAtributosPrincipales([...atributosPrincipales, { key: "", value: "" }])
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
                                          setAtributosInformativos(updated)
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
                                              setAtributosInformativos(updated)
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
                                                setAtributosInformativos(updated)
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
                                                      setAtributosInformativos(updated)
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
                                      open={!isValueLocked && (attr.isOpen || false)}
                                      onOpenChange={(open) => {
                                        if (!isValueLocked) {
                                          const updated = [...atributosInformativos]
                                          updated[index].isOpen = open
                                          setAtributosInformativos(updated)
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
                                              setAtributosInformativos(updated)
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
                                                  updated[index].isOpen = !updated[index].isOpen
                                                  setAtributosInformativos(updated)
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
                                                          updated[index].isOpen = false
                                                          setAtributosInformativos(updated)
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
                                        setAtributosInformativos(updated)
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
                                setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
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

                  {selectedDetailTab === "stock" && (
                    <div className="space-y-4">
                      {isViewingContainer && (
                        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Stock por depósito
                        </h3>
                      )}

                      {selectedItem?.sku && depositStock[selectedItem.sku] && (
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-4 bg-gray-100 border-b border-gray-300">
                            <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Depósito
                            </div>
                            <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                              Total
                            </div>
                            <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                              Reservado
                            </div>
                            <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                              Disponible
                            </div>
                          </div>

                          {Object.entries(depositStock[selectedItem.sku]).map(([deposit, stock]: [string, any]) => {
                            const disponible = stock.total - stock.reservado

                            return (
                              <div
                                key={deposit}
                                className="grid grid-cols-4 border-b border-gray-300 last:border-b-0 bg-slate-50"
                              >
                                <div className="px-4 py-3 text-sm text-gray-900">{deposit}</div>
                                <div className="px-4 py-3 text-sm text-gray-800 text-right">
                                  <input
                                    type="number"
                                    value={stock.total}
                                    onChange={(e) =>
                                      updateDepositStock(
                                        selectedItem.sku!,
                                        deposit,
                                        "total",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-100 px-2 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3 text-sm text-gray-800 text-right">
                                  <input
                                    type="number"
                                    value={stock.reservado}
                                    onChange={(e) =>
                                      updateDepositStock(
                                        selectedItem.sku!,
                                        deposit,
                                        "reservado",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-100 px-2 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                                  {disponible}
                                </div>
                              </div>
                            )
                          })}

                          <div className="grid grid-cols-4 bg-gray-200 font-medium">
                            <div className="px-4 py-3 text-sm text-gray-800">Global</div>
                            <div className="px-4 py-3 text-sm text-gray-800 text-right">
                              {Object.values(depositStock[selectedItem.sku]).reduce((sum, d: any) => sum + d.total, 0)}
                            </div>
                            <div className="px-4 py-3 text-sm text-gray-800 text-right">
                              {Object.values(depositStock[selectedItem.sku]).reduce(
                                (sum, d: any) => sum + d.reservado,
                                0,
                              )}
                            </div>
                            <div className="px-4 py-3 text-sm text-gray-800 text-right">
                              {Object.values(depositStock[selectedItem.sku]).reduce(
                                (sum, d: any) => sum + (d.total - d.reservado),
                                0,
                              )}
                            </div>
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

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Template</h2>
            <div className="space-y-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => applyTemplate(template.name, isSelectingTemplateForContainer)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 hover:border-gray-400 transition-colors text-left"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.atributosPrincipales.length} principales, {template.atributosInformativos.length}
                    informativos
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
