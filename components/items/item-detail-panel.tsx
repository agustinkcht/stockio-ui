"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Item } from "@/lib/types"
import { ChevronDown, ChevronRight, Plus, Copy, ChevronsUpDown, X, Undo2, Redo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { SAVED_ATRIBUTOS, TEMPLATES, DEPOSITS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"

interface ItemDetailPanelProps {
  selectedItem: Item
  selectedDetailTab: string
  setSelectedDetailTab: (tab: string) => void
  expandedItems: Set<string>
  toggleVariantExpansion: (sku: string) => void
  depositStock: Record<string, number>
  updateDepositStock: (sku: string, quantity: number) => void
  updateItem: (sku: string, updates: Partial<Item>) => void
  allItems: Item[]
  onDynamicContentChange?: (content: React.ReactNode) => void
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
}: ItemDetailPanelProps) {
  const isViewingContainer = selectedItem?.isAgrupador || selectedItem?.hasVariants || false

  const isChildItem =
    selectedItem?.atributosPrincipales && selectedItem.atributosPrincipales.length > 0 && !isViewingContainer
  const fatherItem = isChildItem
    ? allItems.find(
        (item) => (item.hasVariants || item.isAgrupador) && item.variants?.some((v: any) => v.sku === selectedItem.sku),
      )
    : null

  const shouldInheritField = (fieldValue: any) => {
    return isChildItem && fatherItem && fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
  }

  const isUnidadesPorPackLocked = isChildItem && fatherItem

  const isTitleLocked = isChildItem && fatherItem

  const [itemTitulo, setItemTitulo] = useState(selectedItem?.name || "")
  const [marca, setMarca] = useState(
    shouldInheritField(fatherItem?.marca) ? fatherItem!.marca : selectedItem?.marca || "",
  )
  const [modelo, setModelo] = useState(selectedItem?.modelo || "")
  const [formatoVenta, setFormatoVenta] = useState(
    shouldInheritField(fatherItem?.formatoVenta) ? fatherItem!.formatoVenta : selectedItem?.formatoVenta || "unidad",
  )
  const [unidadesPorPack, setUnidadesPorPack] = useState(
    shouldInheritField(fatherItem?.unidadesPorPack)
      ? fatherItem!.unidadesPorPack?.toString()
      : selectedItem?.unidadesPorPack?.toString() || "",
  )
  const [unidadesPorPackActive, setUnidadesPorPackActive] = useState(
    shouldInheritField(fatherItem?.unidadesPorPackActive)
      ? fatherItem!.unidadesPorPackActive
      : selectedItem?.unidadesPorPack !== undefined && selectedItem?.unidadesPorPack !== null,
  )
  const [volumenActive, setVolumenActive] = useState(
    shouldInheritField(fatherItem?.volumenActive) ? fatherItem!.volumenActive : selectedItem?.volumenActive || false,
  )
  const [volumenCantidad, setVolumenCantidad] = useState(
    shouldInheritField(fatherItem?.volumenCantidad)
      ? fatherItem!.volumenCantidad?.toString()
      : selectedItem?.volumenCantidad?.toString() || "",
  )
  const [volumenUnidad, setVolumenUnidad] = useState(
    shouldInheritField(fatherItem?.volumenUnidad) ? fatherItem!.volumenUnidad : selectedItem?.volumenUnidad || "",
  )
  const [proveedor, setProveedor] = useState(
    shouldInheritField(fatherItem?.proveedor) ? fatherItem!.proveedor : selectedItem?.proveedor || "",
  )
  const [codigoProveedor, setCodigoProveedor] = useState(selectedItem?.codigoProveedor || "")

  const [atributosPrincipales, setAtributosPrincipales] = useState<Array<{ key: string; value: string }>>(
    selectedItem?.atributosPrincipales || [],
  )
  const [atributosInformativos, setAtributosInformativos] = useState<Array<{ key: string; value: string }>>(
    isChildItem && fatherItem?.atributosInformativos
      ? fatherItem.atributosInformativos.map((fatherAttr) => {
          // Check if child has this attribute
          const childAttr = selectedItem?.atributosInformativos?.find((a) => a.key === fatherAttr.key)
          // If father has a value, use it (locked). If not, use child's value (editable)
          return {
            key: fatherAttr.key,
            value: fatherAttr.value || childAttr?.value || "",
          }
        })
      : selectedItem?.atributosInformativos || [],
  )
  const [containerAtributosPrincipales, setContainerAtributosPrincipales] = useState<
    Array<{ key: string; variantes: string[] }>
  >(selectedItem?.containerAtributosPrincipales || [])
  const [varianteInput, setVarianteInput] = useState<{ [key: number]: string }>({})

  const [showIndividualAtributosView, setShowIndividualAtributosView] = useState(
    !isViewingContainer &&
      (selectedItem?.atributosPrincipales?.length > 0 || selectedItem?.atributosInformativos?.length > 0),
  )
  const [showAtributosView, setShowAtributosView] = useState(
    isViewingContainer &&
      ((selectedItem?.containerAtributosPrincipales && selectedItem?.containerAtributosPrincipales.length > 0) ||
        (selectedItem?.atributosInformativos && selectedItem?.atributosInformativos.length > 0)),
  )

  const [skuCopied, setSkuCopied] = useState(false)
  const [codigoUniversalCopied, setCodigoUniversalCopied] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSelectingTemplateForContainer, setIsSelectingTemplateForContainer] = useState(false)

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
    setUnidadesPorPackActive(state.unidadesPorPackActive)
    setVolumenActive(state.volumenActive)
    setVolumenCantidad(state.volumenCantidad)
    setVolumenUnidad(state.volumenUnidad)
    setProveedor(state.proveedor)
    setCodigoProveedor(state.codigoProveedor)
    setAtributosPrincipales(state.atributosPrincipales)
    setAtributosInformativos(state.atributosInformativos)
  }

  const saveToHistory = () => {
    const currentState = {
      itemTitulo,
      marca,
      modelo,
      formatoVenta,
      unidadesPorPack,
      unidadesPorPackActive,
      volumenActive,
      volumenCantidad,
      volumenUnidad,
      proveedor,
      codigoProveedor,
      atributosPrincipales,
      atributosInformativos,
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
    unidadesPorPackActive,
    volumenActive,
    volumenCantidad,
    volumenUnidad,
    proveedor,
    codigoProveedor,
    atributosPrincipales,
    atributosInformativos,
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

        const titleParts = [selectedItem.name]
        if (combo.variant1) titleParts.push(combo.variant1)
        if (combo.variant2) titleParts.push(combo.variant2)
        const generatedTitle = titleParts.join(" ")

        if (existingVariant) {
          // Keep existing variant data but update atributosPrincipales and name
          return {
            ...existingVariant,
            name: selectedItem.name, // Store base title only (father's name)
            displayTitle: generatedTitle, // Add display title with atributos
            atributosPrincipales: [
              combo.variant1 ? { key: containerAtributosPrincipales[0]?.key || "", value: combo.variant1 } : null,
              combo.variant2 ? { key: containerAtributosPrincipales[1]?.key || "", value: combo.variant2 } : null,
            ].filter(Boolean),
          }
        } else {
          // Create new variant with default stock and generated title
          return {
            sku: combo.sku,
            name: selectedItem.name, // Store base title only (father's name)
            displayTitle: generatedTitle, // Add display title with atributos
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

            // Assuming these are initializations, so setting other deposits to 0
            const otherDeposits = DEPOSITS.filter((d) => d !== "Ibiza")
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
    if (selectedItem?.sku) {
      await navigator.clipboard.writeText(selectedItem.sku)
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
    if (selectedItem?.codigoUniversal) {
      await navigator.clipboard.writeText(selectedItem.codigoUniversal)
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

  return (
    <>
      <Breadcrumb dynamicContent={null} />

      <div className="px-8 pt-6" style={{ marginTop: "2.5rem" }}>
        <div className="grid grid-cols-10 gap-0 h-[calc(100vh-5rem)]">
          {/* Left Column - Item Info */}
          <div className="col-span-3 flex flex-col gap-4 pr-6 border-r border-gray-700 h-full overflow-y-auto">
            <div>
              <h2 className="font-semibold text-white text-lg">
                {(selectedItem as any).displayTitle || selectedItem.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm text-gray-400">
                  {isViewingContainer ? "SKU Padre:" : "SKU:"}{" "}
                  {isViewingContainer
                    ? selectedItem.name
                        .toUpperCase()
                        .replace(/[^A-Z0-9\s]/g, "")
                        .split(" ")
                        .map((word) => word.substring(0, 3))
                        .join("-")
                        .substring(0, 15)
                    : selectedItem.sku}
                </p>
                <button
                  onClick={handleCopySku}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copiar SKU"
                >
                  {skuCopied ? <span className="text-green-500 text-xs">✓</span> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              {!isViewingContainer && selectedItem.codigoUniversal && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-400">Código Universal: {selectedItem.codigoUniversal}</p>
                  <button
                    onClick={handleCopyCodigoUniversal}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copiar Código Universal"
                  >
                    {codigoUniversalCopied ? (
                      <span className="text-green-500 text-xs">✓</span>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 my-0"></div>

            {/* Image */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Imagen</label>
              <div className="w-full aspect-square bg-gray-800 rounded-md border border-gray-700 flex items-center justify-center">
                {selectedItem.image ? (
                  <img
                    src={selectedItem.image || "/placeholder.svg"}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <span className="text-gray-500 text-sm">Sin imagen</span>
                )}
              </div>
            </div>

            {/* Descripción (moved below Proveedor info for individual items, kept here for containers) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Descripción</label>
              <textarea
                defaultValue={selectedItem.descripcion || ""}
                className="px-3 py-2 border border-gray-700 rounded-md text-white resize-none bg-gray-900 text-sm h-24"
                placeholder="Descripción del producto"
              />
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="col-span-7 flex flex-col pl-6 h-full overflow-hidden">
            {/* Tab Buttons */}
            <div className="flex items-center gap-0 h-10 mb-4">
              {isViewingContainer ? (
                <>
                  <button
                    onClick={() => setSelectedDetailTab("info")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "info"
                        ? "border-blue-500 bg-gray-900/30 text-white"
                        : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Info</span>
                  </button>
                  <button
                    onClick={() => setSelectedDetailTab("atributos")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "atributos"
                        ? "border-blue-500 bg-gray-900/30 text-white"
                        : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Atributos</span>
                  </button>
                  <button
                    onClick={() => setSelectedDetailTab("variantes")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "variantes"
                        ? "border-blue-500 bg-gray-900/30 text-white"
                        : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Variantes</span>
                  </button>
                  <button
                    onClick={() => setSelectedDetailTab("stock-variantes")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "stock-variantes"
                        ? "border-blue-500 bg-gray-900/30 text-white"
                        : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
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
                        ? "border-blue-500 bg-gray-900/30 text-white"
                        : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Info</span>
                  </button>
                  <button
                    onClick={() => setSelectedDetailTab("atributos")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "atributos"
                        ? "border-blue-500 bg-gray-900/30 text-white"
                        : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Atributos</span>
                  </button>
                  <button
                    onClick={() => setSelectedDetailTab("stock")}
                    className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                      selectedDetailTab === "stock"
                        ? "border-blue-500 bg-gray-900/30 text-white"
                        : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">Stock</span>
                  </button>
                </>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {isViewingContainer ? (
                // Container item tab content
                <>
                  {selectedDetailTab === "info" && (
                    <div className="h-full flex flex-col py-2">
                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                        Información del Producto
                      </h3>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Título</label>
                            <input
                              type="text"
                              value={itemTitulo}
                              onChange={(e) => setItemTitulo(e.target.value)}
                              disabled={isTitleLocked}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isTitleLocked
                                  ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white"
                              }`}
                              placeholder="Ej: Cierre Metálico"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Marca</label>
                            <input
                              type="text"
                              value={marca}
                              onChange={(e) => setMarca(e.target.value)}
                              disabled={shouldInheritField(fatherItem?.marca)}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                shouldInheritField(fatherItem?.marca)
                                  ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white"
                              }`}
                              placeholder="Ej: YKK"
                            />
                          </div>
                        </div>

                        <div className="border-t border-gray-800 my-4"></div>

                        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                          Presentación
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Formato de venta</label>
                            <select
                              value={formatoVenta}
                              onChange={(e) => setFormatoVenta(e.target.value)}
                              disabled={shouldInheritField(fatherItem?.formatoVenta)}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                                shouldInheritField(fatherItem?.formatoVenta)
                                  ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white cursor-pointer"
                              }`}
                            >
                              <option value="unidad">Unidad</option>
                              <option value="pack">Pack</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-400">Unidades por pack</label>
                              <button
                                onClick={() => setUnidadesPorPackActive(!unidadesPorPackActive)}
                                disabled={isUnidadesPorPackLocked}
                                className={`w-10 h-5 rounded-full transition-colors relative ${
                                  unidadesPorPackActive ? "bg-blue-500" : "bg-gray-700"
                                } ${isUnidadesPorPackLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <div
                                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                    unidadesPorPackActive ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <input
                              type="number"
                              value={unidadesPorPack}
                              onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 1
                                setUnidadesPorPack(value < 1 ? "1" : e.target.value)
                              }}
                              disabled={!unidadesPorPackActive || isUnidadesPorPackLocked}
                              min="1"
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                !unidadesPorPackActive || isUnidadesPorPackLocked
                                  ? "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white"
                              }`}
                              placeholder="1"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">Volumen de la unidad</label>
                            <button
                              onClick={() => setVolumenActive(!volumenActive)}
                              disabled={shouldInheritField(fatherItem?.volumenActive)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${
                                volumenActive ? "bg-blue-500" : "bg-gray-700"
                              } ${shouldInheritField(fatherItem?.volumenActive) ? "opacity-50 cursor-not-allowed" : ""}`}
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
                                <label className="text-sm text-gray-400">Cantidad</label>
                                <input
                                  type="number"
                                  value={volumenCantidad}
                                  onChange={(e) => setVolumenCantidad(e.target.value)}
                                  disabled={shouldInheritField(fatherItem?.volumenCantidad)}
                                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    shouldInheritField(fatherItem?.volumenCantidad)
                                      ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                      : "bg-gray-800 border-gray-700 text-white"
                                  }`}
                                  placeholder="0"
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400">Unidad de medida</label>
                                <select
                                  value={volumenUnidad}
                                  onChange={(e) => setVolumenUnidad(e.target.value)}
                                  disabled={shouldInheritField(fatherItem?.volumenUnidad)}
                                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                                    shouldInheritField(fatherItem?.volumenUnidad)
                                      ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                      : "bg-gray-800 border-gray-700 text-white cursor-pointer"
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

                      <div className="border-t border-gray-800 my-4"></div>

                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                        Información del Proveedor
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm text-gray-400">Proveedor</label>
                          <input
                            type="text"
                            value={proveedor}
                            onChange={(e) => setProveedor(e.target.value)}
                            disabled={shouldInheritField(fatherItem?.proveedor)}
                            className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                              shouldInheritField(fatherItem?.proveedor)
                                ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                : "bg-gray-800 border-gray-700 text-white"
                            }`}
                            placeholder="Nombre del proveedor"
                          />
                        </div>

                        {!isViewingContainer && (
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Código Proveedor</label>
                            <input
                              type="text"
                              value={codigoProveedor}
                              onChange={(e) => setCodigoProveedor(e.target.value)}
                              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Código del proveedor"
                            />
                          </div>
                        )}
                      </div>

                      {/* Descripción field for container items */}
                    </div>
                  )}

                  {selectedDetailTab === "atributos" && (
                    <div className="h-full flex flex-col py-2">
                      {!showAtributosView ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                          <p className="text-gray-400 text-sm">No hay atributos configurados</p>
                          <button
                            onClick={() => {
                              setIsSelectingTemplateForContainer(true)
                              setShowTemplateModal(true)
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          >
                            Usar Template
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col gap-3">
                            <div>
                              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                Atributos Principales
                              </h3>
                              <p className="text-xs text-gray-500 italic mt-1">
                                Atributos que definen las variantes del producto (máximo 2)
                              </p>
                            </div>

                            {containerAtributosPrincipales.map((attr, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="flex-1">
                                  <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                        <span className={attr.key ? "" : "text-gray-500"}>
                                          {attr.key || "Ej: Color"}
                                        </span>
                                        <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0" align="start">
                                      <Command>
                                        <CommandInput
                                          placeholder="Buscar o escribir..."
                                          value={attr.key}
                                          onValueChange={(value) => {
                                            const updated = [...containerAtributosPrincipales]
                                            updated[index].key = value
                                            setContainerAtributosPrincipales(updated)
                                          }}
                                        />
                                        <CommandList>
                                          <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                          <CommandGroup>
                                            {Object.keys(SAVED_ATRIBUTOS)
                                              .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                              .map((key) => (
                                                <CommandItem
                                                  key={key}
                                                  value={key}
                                                  onSelect={() => {
                                                    const updated = [...containerAtributosPrincipales]
                                                    updated[index].key = key
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
                                  <label className="text-sm text-gray-400 mb-2 block">Variantes</label>
                                  <div className="space-y-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            placeholder="Agregar variante..."
                                            value={varianteInput[index] || ""}
                                            onChange={(e) => {
                                              setVarianteInput({ ...varianteInput, [index]: e.target.value })
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" && varianteInput[index]?.trim()) {
                                                e.preventDefault()
                                                const updated = [...containerAtributosPrincipales]
                                                if (!updated[index].variantes.includes(varianteInput[index].trim())) {
                                                  updated[index].variantes.push(varianteInput[index].trim())
                                                  setContainerAtributosPrincipales(updated)
                                                }
                                                setVarianteInput({ ...varianteInput, [index]: "" })
                                              }
                                            }}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                        </div>
                                      </PopoverTrigger>
                                      {attr.key &&
                                        SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] &&
                                        varianteInput[index] && (
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandList>
                                                <CommandGroup>
                                                  {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                    .filter(
                                                      (val) =>
                                                        val
                                                          .toLowerCase()
                                                          .includes((varianteInput[index] || "").toLowerCase()) &&
                                                        !attr.variantes.includes(val),
                                                    )
                                                    .map((val) => (
                                                      <CommandItem
                                                        key={val}
                                                        value={val}
                                                        onSelect={() => {
                                                          const updated = [...containerAtributosPrincipales]
                                                          if (!updated[index].variantes.includes(val)) {
                                                            updated[index].variantes.push(val)
                                                            setContainerAtributosPrincipales(updated)
                                                          }
                                                          setVarianteInput({ ...varianteInput, [index]: "" })
                                                        }}
                                                      >
                                                        {val}
                                                      </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        )}
                                    </Popover>

                                    {attr.variantes.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {attr.variantes.map((variante, vIndex) => (
                                          <Badge
                                            key={vIndex}
                                            variant="secondary"
                                            className="bg-gray-800 text-white border border-gray-700 px-2 py-1 flex items-center gap-1"
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
                                              className="text-gray-400 hover:text-red-400"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const updated = containerAtributosPrincipales.filter((_, i) => i !== index)
                                    setContainerAtributosPrincipales(updated)
                                  }}
                                  className="mt-7 text-gray-500 hover:text-red-400 cursor-pointer"
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
                                className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Agregar atributo</span>
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-3 pt-3 border-t border-gray-800">
                            <div>
                              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                Atributos Informativos
                              </h3>
                              <p className="text-xs text-gray-500 italic mt-1">
                                Atributos que describen características generales del producto
                              </p>
                            </div>

                            {atributosInformativos.map((attr, index) => {
                              const fatherAttr = fatherItem?.atributosInformativos?.find((a) => a.key === attr.key)
                              const isAttributeLocked = isChildItem && fatherAttr !== undefined
                              const isValueLocked = isChildItem && fatherAttr && fatherAttr.value

                              return (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          disabled={isAttributeLocked}
                                          className={`w-full px-3 py-2 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
                                            isAttributeLocked
                                              ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                              : "bg-gray-800 border-gray-700 text-white"
                                          }`}
                                        >
                                          <span className={attr.key ? "" : "text-gray-500"}>
                                            {attr.key || "Ej: Color"}
                                          </span>
                                          {!isAttributeLocked && <ChevronsUpDown className="w-4 h-4 text-gray-500" />}
                                        </button>
                                      </PopoverTrigger>
                                      {!isAttributeLocked && (
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandInput
                                              placeholder="Buscar o escribir..."
                                              value={attr.key}
                                              onValueChange={(value) => {
                                                const updated = [...atributosInformativos]
                                                updated[index].key = value
                                                setAtributosInformativos(updated)
                                              }}
                                            />
                                            <CommandList>
                                              <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                              <CommandGroup>
                                                {Object.keys(SAVED_ATRIBUTOS)
                                                  .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                                  .map((key) => (
                                                    <CommandItem
                                                      key={key}
                                                      value={key}
                                                      onSelect={() => {
                                                        const updated = [...atributosInformativos]
                                                        updated[index].key = key
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
                                    <label className="text-sm text-gray-400 mb-2 block">Dato</label>
                                    {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] ? (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            disabled={isValueLocked}
                                            className={`w-full px-3 py-2 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
                                              isValueLocked
                                                ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                                : "bg-gray-800 border-gray-700 text-white"
                                            }`}
                                          >
                                            <span className={attr.value ? "" : "text-gray-500"}>
                                              {attr.value || "Ej: Negro"}
                                            </span>
                                            {!isValueLocked && <ChevronsUpDown className="w-4 h-4 text-gray-500" />}
                                          </button>
                                        </PopoverTrigger>
                                        {!isValueLocked && (
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandList>
                                                <CommandGroup>
                                                  {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                    .filter((val) =>
                                                      val.toLowerCase().includes(attr.value.toLowerCase()),
                                                    )
                                                    .map((val) => (
                                                      <CommandItem
                                                        key={val}
                                                        value={val}
                                                        onSelect={() => {
                                                          const updated = [...atributosInformativos]
                                                          updated[index].value = val
                                                          setAtributosInformativos(updated)
                                                        }}
                                                      >
                                                        {val}
                                                      </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        )}
                                      </Popover>
                                    ) : (
                                      <input
                                        type="text"
                                        value={attr.value}
                                        onChange={(e) => {
                                          const updated = [...atributosInformativos]
                                          updated[index].value = e.target.value
                                          setAtributosInformativos(updated)
                                        }}
                                        disabled={isValueLocked}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          isValueLocked
                                            ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                            : "bg-gray-800 border-gray-700 text-white"
                                        }`}
                                        placeholder="Ej: Negro"
                                      />
                                    )}
                                  </div>

                                  {!isAttributeLocked && (
                                    <button
                                      onClick={() => {
                                        const updated = atributosInformativos.filter((_, i) => i !== index)
                                        setAtributosInformativos(updated)
                                      }}
                                      className="mt-7 text-gray-500 hover:text-red-400 cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                  {isAttributeLocked && <div className="mt-7 w-4"></div>}
                                </div>
                              )
                            })}

                            <button
                              onClick={() => {
                                setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
                              }}
                              className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Variantes</h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Items generados por la combinación de variantes de atributos principales.
                      </p>

                      {variantItems.length > 0 ? (
                        <div className="flex-1 overflow-y-auto">
                          <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-4 bg-gray-900/50 border-b border-gray-800 sticky top-0">
                              <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                SKU
                              </div>
                              <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Código Universal
                              </div>
                              <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Descripción
                              </div>
                              <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Foto
                              </div>
                            </div>

                            {variantItems.map((variant) => (
                              <div
                                key={variant.sku}
                                className="grid grid-cols-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-900/30"
                              >
                                <div className="px-4 py-3 text-sm text-gray-300 font-mono">{variant.sku}</div>
                                <div className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={variant.codigoUniversal}
                                    onChange={(e) => updateVariantField(variant.sku, "codigoUniversal", e.target.value)}
                                    placeholder="Código..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={variant.descripcion}
                                    onChange={(e) => updateVariantField(variant.sku, "descripcion", e.target.value)}
                                    placeholder="Descripción..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={variant.foto}
                                    onChange={(e) => updateVariantField(variant.sku, "foto", e.target.value)}
                                    placeholder="URL de foto..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                        Stock por Variante
                      </h3>

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
                              <div key={variant.sku} className="border border-gray-800 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleVariantStockExpansion(variant.sku)}
                                  className="w-full px-4 py-3 bg-gray-900/30 hover:bg-gray-900/50 transition-colors flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    {expandedVariantStock[variant.sku] ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm text-white font-mono">{variant.sku}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span>Total: {totalStock}</span>
                                    <span>Reservado: {totalReservado}</span>
                                    <span> Disponible: {totalDisponible}</span>
                                  </div>
                                </button>

                                {expandedVariantStock[variant.sku] && (
                                  <div className="border-t border-gray-800">
                                    <div className="grid grid-cols-4 bg-gray-900/50 border-b border-gray-800">
                                      <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Depósito
                                      </div>
                                      <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                        Total
                                      </div>
                                      <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                        Reservado
                                      </div>
                                      <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                        Disponible
                                      </div>
                                    </div>

                                    {DEPOSITS.map((deposit) => {
                                      const stock = variantStock[deposit] || { total: 0, reservado: 0 }
                                      const disponible = stock.total - stock.reservado

                                      return (
                                        <div
                                          key={deposit}
                                          className="grid grid-cols-4 border-b border-gray-800 last:border-b-0"
                                        >
                                          <div className="px-4 py-3 text-sm text-white">{deposit}</div>
                                          <div className="px-4 py-3 text-sm text-gray-300 text-right">
                                            <input
                                              type="number"
                                              value={stock.total}
                                              onChange={(e) =>
                                                updateDepositStock(variant.sku, Number.parseInt(e.target.value) || 0)
                                              }
                                              className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded border border-transparent hover:border-gray-700 focus:border-blue-500"
                                            />
                                          </div>
                                          <div className="px-4 py-3 text-sm text-gray-300 text-right">
                                            <input
                                              type="number"
                                              value={stock.reservado}
                                              onChange={(e) =>
                                                updateDepositStock(variant.sku, Number.parseInt(e.target.value) || 0)
                                              }
                                              className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded border border-transparent hover:border-gray-700 focus:border-blue-500"
                                            />
                                          </div>
                                          <div className="px-4 py-3 text-sm text-white font-medium text-right">
                                            {disponible}
                                          </div>
                                        </div>
                                      )
                                    })}

                                    <div className="grid grid-cols-4 bg-gray-900/70 font-medium">
                                      <div className="px-4 py-3 text-sm text-gray-200">Global</div>
                                      <div className="px-4 py-3 text-sm text-gray-200 text-right">{totalStock}</div>
                                      <div className="px-4 py-3 text-sm text-gray-200 text-right">{totalReservado}</div>
                                      <div className="px-4 py-3 text-sm text-gray-200 text-right">
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
                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                        Información del Producto
                      </h3>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Título</label>
                            <input
                              type="text"
                              value={itemTitulo}
                              onChange={(e) => setItemTitulo(e.target.value)}
                              disabled={isTitleLocked}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isTitleLocked
                                  ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white"
                              }`}
                              placeholder="Ej: Cierre Metálico"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Marca</label>
                            <input
                              type="text"
                              value={marca}
                              onChange={(e) => setMarca(e.target.value)}
                              disabled={shouldInheritField(fatherItem?.marca)}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                shouldInheritField(fatherItem?.marca)
                                  ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white"
                              }`}
                              placeholder="Ej: YKK"
                            />
                          </div>
                        </div>

                        <div className="border-t border-gray-800 my-4"></div>

                        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                          Presentación
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Formato de venta</label>
                            <select
                              value={formatoVenta}
                              onChange={(e) => setFormatoVenta(e.target.value)}
                              disabled={shouldInheritField(fatherItem?.formatoVenta)}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                                shouldInheritField(fatherItem?.formatoVenta)
                                  ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white cursor-pointer"
                              }`}
                            >
                              <option value="unidad">Unidad</option>
                              <option value="pack">Pack</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-400">Unidades por pack</label>
                              <button
                                onClick={() => setUnidadesPorPackActive(!unidadesPorPackActive)}
                                disabled={isUnidadesPorPackLocked}
                                className={`w-10 h-5 rounded-full transition-colors relative ${
                                  unidadesPorPackActive ? "bg-blue-500" : "bg-gray-700"
                                } ${isUnidadesPorPackLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <div
                                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                    unidadesPorPackActive ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <input
                              type="number"
                              value={unidadesPorPack}
                              onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 1
                                setUnidadesPorPack(value < 1 ? "1" : e.target.value)
                              }}
                              disabled={!unidadesPorPackActive || isUnidadesPorPackLocked}
                              min="1"
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                !unidadesPorPackActive || isUnidadesPorPackLocked
                                  ? "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                                  : "bg-gray-800 border-gray-700 text-white"
                              }`}
                              placeholder="1"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">Volumen de la unidad</label>
                            <button
                              onClick={() => setVolumenActive(!volumenActive)}
                              disabled={shouldInheritField(fatherItem?.volumenActive)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${
                                volumenActive ? "bg-blue-500" : "bg-gray-700"
                              } ${shouldInheritField(fatherItem?.volumenActive) ? "opacity-50 cursor-not-allowed" : ""}`}
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
                                <label className="text-sm text-gray-400">Cantidad</label>
                                <input
                                  type="number"
                                  value={volumenCantidad}
                                  onChange={(e) => setVolumenCantidad(e.target.value)}
                                  disabled={shouldInheritField(fatherItem?.volumenCantidad)}
                                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    shouldInheritField(fatherItem?.volumenCantidad)
                                      ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                      : "bg-gray-800 border-gray-700 text-white"
                                  }`}
                                  placeholder="0"
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400">Unidad de medida</label>
                                <select
                                  value={volumenUnidad}
                                  onChange={(e) => setVolumenUnidad(e.target.value)}
                                  disabled={shouldInheritField(fatherItem?.volumenUnidad)}
                                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                                    shouldInheritField(fatherItem?.volumenUnidad)
                                      ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                      : "bg-gray-800 border-gray-700 text-white cursor-pointer"
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

                      <div className="border-t border-gray-800 my-4"></div>

                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                        Información del Proveedor
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm text-gray-400">Proveedor</label>
                          <input
                            type="text"
                            value={proveedor}
                            onChange={(e) => setProveedor(e.target.value)}
                            disabled={shouldInheritField(fatherItem?.proveedor)}
                            className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                              shouldInheritField(fatherItem?.proveedor)
                                ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                : "bg-gray-800 border-gray-700 text-white"
                            }`}
                            placeholder="Nombre del proveedor"
                          />
                        </div>

                        {!isViewingContainer && (
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">Código Proveedor</label>
                            <input
                              type="text"
                              value={codigoProveedor}
                              onChange={(e) => setCodigoProveedor(e.target.value)}
                              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Código del proveedor"
                            />
                          </div>
                        )}
                      </div>

                      {/* Descripción field for individual items */}
                    </div>
                  )}

                  {selectedDetailTab === "atributos" && (
                    <div className="h-full flex flex-col py-2">
                      {!showIndividualAtributosView ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                          <p className="text-gray-400 text-sm">No hay atributos configurados</p>
                          <button
                            onClick={() => {
                              setIsSelectingTemplateForContainer(false)
                              setShowTemplateModal(true)
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          >
                            Usar Template
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col gap-3">
                            <div>
                              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                Atributos Principales
                              </h3>
                              <p className="text-xs text-gray-500 italic mt-1">
                                Atributos que definen las características principales del producto (máximo 2)
                              </p>
                            </div>

                            {atributosPrincipales.map((attr, index) => {
                              const isAttributeLocked = isChildItem

                              return (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          disabled={isAttributeLocked}
                                          className={`w-full px-3 py-2 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
                                            isAttributeLocked
                                              ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                              : "bg-gray-800 border-gray-700 text-white"
                                          }`}
                                        >
                                          <span className={attr.key ? "" : "text-gray-500"}>
                                            {attr.key || "Ej: Color"}
                                          </span>
                                          {!isAttributeLocked && <ChevronsUpDown className="w-4 h-4 text-gray-500" />}
                                        </button>
                                      </PopoverTrigger>
                                      {!isAttributeLocked && (
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandInput
                                              placeholder="Buscar o escribir..."
                                              value={attr.key}
                                              onValueChange={(value) => {
                                                const updated = [...atributosPrincipales]
                                                updated[index].key = value
                                                setAtributosPrincipales(updated)
                                                updateProductTitle()
                                              }}
                                            />
                                            <CommandList>
                                              <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                              <CommandGroup>
                                                {Object.keys(SAVED_ATRIBUTOS)
                                                  .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                                  .map((key) => (
                                                    <CommandItem
                                                      key={key}
                                                      value={key}
                                                      onSelect={() => {
                                                        const updated = [...atributosPrincipales]
                                                        updated[index].key = key
                                                        setAtributosPrincipales(updated)
                                                        updateProductTitle()
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
                                    <label className="text-sm text-gray-400 mb-2 block">Dato</label>
                                    {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] ? (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                            <span className={attr.value ? "" : "text-gray-500"}>
                                              {attr.value || "Ej: Negro"}
                                            </span>
                                            <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandList>
                                              <CommandGroup>
                                                {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                  .filter((val) => val.toLowerCase().includes(attr.value.toLowerCase()))
                                                  .map((val) => (
                                                    <CommandItem
                                                      key={val}
                                                      value={val}
                                                      onSelect={() => {
                                                        const updated = [...atributosPrincipales]
                                                        updated[index].value = val
                                                        setAtributosPrincipales(updated)
                                                        updateProductTitle()
                                                      }}
                                                    >
                                                      {val}
                                                    </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    ) : (
                                      <input
                                        type="text"
                                        value={attr.value}
                                        onChange={(e) => {
                                          const updated = [...atributosPrincipales]
                                          updated[index].value = e.target.value
                                          setAtributosPrincipales(updated)
                                          updateProductTitle()
                                        }}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: Negro"
                                      />
                                    )}
                                  </div>

                                  {!isAttributeLocked && (
                                    <button
                                      onClick={() => {
                                        const updated = atributosPrincipales.filter((_, i) => i !== index)
                                        setAtributosPrincipales(updated)
                                        updateProductTitle()
                                      }}
                                      className="mt-7 text-gray-500 hover:text-red-400 cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                  {isAttributeLocked && <div className="mt-7 w-4"></div>}
                                </div>
                              )
                            })}

                            {atributosPrincipales.length < 2 && (
                              <button
                                onClick={() => {
                                  setAtributosPrincipales([...atributosPrincipales, { key: "", value: "" }])
                                }}
                                className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Agregar atributo</span>
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-3 pt-3 border-t border-gray-800">
                            <div>
                              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                Atributos Informativos
                              </h3>
                              <p className="text-xs text-gray-500 italic mt-1">
                                Atributos que describen características generales del producto
                              </p>
                            </div>

                            {atributosInformativos.map((attr, index) => {
                              const fatherAttr = fatherItem?.atributosInformativos?.find((a) => a.key === attr.key)
                              const isAttributeLocked = isChildItem && fatherAttr !== undefined
                              const isValueLocked = isChildItem && fatherAttr && fatherAttr.value

                              return (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          disabled={isAttributeLocked}
                                          className={`w-full px-3 py-2 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
                                            isAttributeLocked
                                              ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                              : "bg-gray-800 border-gray-700 text-white"
                                          }`}
                                        >
                                          <span className={attr.key ? "" : "text-gray-500"}>
                                            {attr.key || "Ej: Color"}
                                          </span>
                                          {!isAttributeLocked && <ChevronsUpDown className="w-4 h-4 text-gray-500" />}
                                        </button>
                                      </PopoverTrigger>
                                      {!isAttributeLocked && (
                                        <PopoverContent className="w-[200px] p-0" align="start">
                                          <Command>
                                            <CommandInput
                                              placeholder="Buscar o escribir..."
                                              value={attr.key}
                                              onValueChange={(value) => {
                                                const updated = [...atributosInformativos]
                                                updated[index].key = value
                                                setAtributosInformativos(updated)
                                              }}
                                            />
                                            <CommandList>
                                              <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                              <CommandGroup>
                                                {Object.keys(SAVED_ATRIBUTOS)
                                                  .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                                  .map((key) => (
                                                    <CommandItem
                                                      key={key}
                                                      value={key}
                                                      onSelect={() => {
                                                        const updated = [...atributosInformativos]
                                                        updated[index].key = key
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
                                    <label className="text-sm text-gray-400 mb-2 block">Dato</label>
                                    {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] ? (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            disabled={isValueLocked}
                                            className={`w-full px-3 py-2 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
                                              isValueLocked
                                                ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                                : "bg-gray-800 border-gray-700 text-white"
                                            }`}
                                          >
                                            <span className={attr.value ? "" : "text-gray-500"}>
                                              {attr.value || "Ej: Negro"}
                                            </span>
                                            {!isValueLocked && <ChevronsUpDown className="w-4 h-4 text-gray-500" />}
                                          </button>
                                        </PopoverTrigger>
                                        {!isValueLocked && (
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandInput
                                                placeholder="Buscar o escribir..."
                                                value={attr.value}
                                                onValueChange={(value) => {
                                                  const updated = [...atributosInformativos]
                                                  updated[index].value = value
                                                  setAtributosInformativos(updated)
                                                }}
                                              />
                                              <CommandList>
                                                <CommandEmpty>Presiona Enter para usar "{attr.value}"</CommandEmpty>
                                                <CommandGroup>
                                                  {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                    .filter((val) =>
                                                      val.toLowerCase().includes(attr.value.toLowerCase()),
                                                    )
                                                    .map((val) => (
                                                      <CommandItem
                                                        key={val}
                                                        value={val}
                                                        onSelect={() => {
                                                          const updated = [...atributosInformativos]
                                                          updated[index].value = val
                                                          setAtributosInformativos(updated)
                                                        }}
                                                      >
                                                        {val}
                                                      </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        )}
                                      </Popover>
                                    ) : (
                                      <input
                                        type="text"
                                        value={attr.value}
                                        onChange={(e) => {
                                          const updated = [...atributosInformativos]
                                          updated[index].value = e.target.value
                                          setAtributosInformativos(updated)
                                        }}
                                        disabled={isValueLocked}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          isValueLocked
                                            ? "bg-gray-900 border-gray-800 text-gray-400 cursor-not-allowed"
                                            : "bg-gray-800 border-gray-700 text-white"
                                        }`}
                                        placeholder="Ej: Negro"
                                      />
                                    )}
                                  </div>

                                  {!isAttributeLocked && (
                                    <button
                                      onClick={() => {
                                        const updated = atributosInformativos.filter((_, i) => i !== index)
                                        setAtributosInformativos(updated)
                                      }}
                                      className="mt-7 text-gray-500 hover:text-red-400 cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                  {isAttributeLocked && <div className="mt-7 w-4"></div>}
                                </div>
                              )
                            })}

                            <button
                              onClick={() => {
                                setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
                              }}
                              className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Stock por depósito</h3>

                      {selectedItem?.sku && depositStock[selectedItem.sku] && (
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-4 bg-gray-900/50 border-b border-gray-800">
                            <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Depósito
                            </div>
                            <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                              Total
                            </div>
                            <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                              Reservado
                            </div>
                            <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                              Disponible
                            </div>
                          </div>

                          {Object.entries(depositStock[selectedItem.sku]).map(([deposit, stock]: [string, any]) => {
                            const disponible = stock.total - stock.reservado

                            return (
                              <div key={deposit} className="grid grid-cols-4 border-b border-gray-800 last:border-b-0">
                                <div className="px-4 py-3 text-sm text-white">{deposit}</div>
                                <div className="px-4 py-3 text-sm text-gray-300 text-right">
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
                                    className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded border border-transparent hover:border-gray-700 focus:border-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3 text-sm text-gray-300 text-right">
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
                                    className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded border border-transparent hover:border-gray-700 focus:border-blue-500"
                                  />
                                </div>
                                <div className="px-4 py-3 text-sm text-white font-medium text-right">{disponible}</div>
                              </div>
                            )
                          })}

                          <div className="grid grid-cols-4 bg-gray-900/70 font-medium">
                            <div className="px-4 py-3 text-sm text-gray-200">Global</div>
                            <div className="px-4 py-3 text-sm text-gray-200 text-right">
                              {Object.values(depositStock[selectedItem.sku]).reduce((sum, d: any) => sum + d.total, 0)}
                            </div>
                            <div className="px-4 py-3 text-sm text-gray-200 text-right">
                              {Object.values(depositStock[selectedItem.sku]).reduce(
                                (sum, d: any) => sum + d.reservado,
                                0,
                              )}
                            </div>
                            <div className="px-4 py-3 text-sm text-gray-200 text-right">
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

        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96">
              <h2 className="text-lg font-semibold text-white mb-4">Seleccionar Template</h2>
              <div className="space-y-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => applyTemplate(template.name, isSelectingTemplateForContainer)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white hover:bg-gray-750 hover:border-gray-600 transition-colors text-left"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {template.atributosPrincipales.length} principales, {template.atributosInformativos.length}{" "}
                      informativos
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-full mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
