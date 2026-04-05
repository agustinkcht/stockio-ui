"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, Package, Grid, Asterisk, Plus, X, Upload, Sparkles, Pencil, ImageIcon } from "lucide-react"
import { NuevaVarianteModal } from "@/components/modals/nueva-variante-modal"
import { generateStandaloneSKU, generateUniqueSKU } from "@/lib/utils/sku-generator"
import { getCategoryImage } from "@/lib/utils/category-images"
import { generateId } from "@/lib/utils/item-utils"
import { useItems } from "@/hooks/use-items"
import { useAccount } from "@/lib/contexts/account-context"
import { useSettings } from "@/lib/contexts/settings-context"
import type { Item, ItemVariant, Atributo } from "@/lib/types"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

const MAX_TITLE_LENGTH = 60

const STEPS_INDIVIDUAL = [
  { id: 1, label: "Información del Item" },
  { id: 2, label: "Stock" },
  { id: 3, label: "Precio" },
  { id: 4, label: "Detalles Finales" },
]

const STEPS_VARIANTES = [
  { id: 1, label: "Información Compartida" },
  { id: 2, label: "Variantes" },
  { id: 3, label: "Stock" },
  { id: 4, label: "Precio" },
]

export default function NuevoItemPage() {
  const router = useRouter()
  const { items, setItems } = useItems()
  const { currentAccount } = useAccount()
  const { catalogo, precios } = useSettings()
  const [titulo, setTitulo] = useState("")
  const [selectedType, setSelectedType] = useState<"individual" | "variantes" | null>(null)
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Refs for scrolling
  const stepsContainerRef = useRef<HTMLDivElement>(null)

  // Step 1 form fields - Info tab
  const [selectedDetailTab, setSelectedDetailTab] = useState<"info" | "atributos">("info")
  const [categoria, setCategoria] = useState("")
  const [marca, setMarca] = useState("")
  const [formatoVenta, setFormatoVenta] = useState("unidad")
  const [unidadesPorPack, setUnidadesPorPack] = useState("1")
  const [volumenActive, setVolumenActive] = useState(false)
  const [volumenCantidad, setVolumenCantidad] = useState("")
  const [volumenUnidad, setVolumenUnidad] = useState("ml")
  const [vencimientoActive, setVencimientoActive] = useState(false)
  const [fechaVencimiento, setFechaVencimiento] = useState("")

  // Step 1 form fields - Atributos tab
  const [showAtributosView, setShowAtributosView] = useState(false)
  const [atributosInformativos, setAtributosInformativos] = useState<{ key: string; value: string }[]>([])

  // Step 2 form fields - Detalle del Item
  const [sku, setSku] = useState("")
  const [skuUserModified, setSkuUserModified] = useState(false)
  const [codigoUniversal, setCodigoUniversal] = useState("")
  const [mediaPhotos, setMediaPhotos] = useState<string[]>([])
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [editingDescripcion, setEditingDescripcion] = useState(false)

  // Step 3 form fields - Información Comercial
  const [costo, setCosto] = useState("")
  const [margen, setMargen] = useState("")
  const [iva, setIva] = useState("21")
  const [precioVenta, setPrecioVenta] = useState("")
  const [editingPrecioVenta, setEditingPrecioVenta] = useState(false)
  const [stockInicial, setStockInicial] = useState("")
  const [stockReservado, setStockReservado] = useState("")
  const [proveedor, setProveedor] = useState("")
  const [codigoProveedor, setCodigoProveedor] = useState("")

  // Step 4 - Título final (can be edited, will regenerate SKU if changed)
  const [tituloFinal, setTituloFinal] = useState("")
  const [tituloFinalUserModified, setTituloFinalUserModified] = useState(false)

  // Creation state
  const [isCreating, setIsCreating] = useState(false)
  const [createdItemId, setCreatedItemId] = useState<string | null>(null)
  const [createdItemSkuDisplay, setCreatedItemSkuDisplay] = useState<string | null>(null)

  // Variantes creation state - Step 2 for "Item con Variantes"
  const [containerAtributosPrincipales, setContainerAtributosPrincipales] = useState<
    Array<{ key: string; variantes: string[] }>
  >([])
  const [varianteInput, setVarianteInput] = useState<Record<number, string>>({})
  const [duplicateTagError, setDuplicateTagError] = useState<Record<number, boolean>>({})
  const [showVariantAtributosView, setShowVariantAtributosView] = useState(false)
  const [variantItems, setVariantItems] = useState<
    Array<{
      id: string
      skuSuffix: string
      codigoUniversal: string
      descripcion: string
      foto: string
      variant1: string | null
      variant2: string | null
    }>
  >([])
  const [skuPadre, setSkuPadre] = useState("")
  const [editingSkuPadre, setEditingSkuPadre] = useState(false)
  const [variantMediaModal, setVariantMediaModal] = useState<{ open: boolean; variantId: string | null }>({ open: false, variantId: null })
  const [isNuevaVarianteModalOpen, setIsNuevaVarianteModalOpen] = useState(false)

  // Validate title - must have actual content (not just spaces)
  const isTituloValid = useMemo(() => {
    return titulo.trim().length > 0
  }, [titulo])

  // Generate suggested SKU based on final title and category
  const suggestedSku = useMemo(() => {
    // Use tituloFinal if set, otherwise use titulo
    const titleToUse = tituloFinal.trim() || titulo.trim()
    if (!titleToUse) return ""
    return generateStandaloneSKU({
      category: categoria || undefined,
      title: titleToUse,
    })
  }, [titulo, tituloFinal, categoria])

  // Initialize SKU with suggested value when it changes and user hasn't modified it
  useEffect(() => {
    if (suggestedSku && !skuUserModified) {
      setSku(suggestedSku)
    }
  }, [suggestedSku, skuUserModified])

  // Sync tituloFinal with titulo when user hasn't modified it
  useEffect(() => {
    if (!tituloFinalUserModified) {
      setTituloFinal(titulo)
    }
  }, [titulo, tituloFinalUserModified])

  // Helper functions for price calculations (matching price-grid.tsx)
  const calculatePrecioFinal = (costoVal: number, margenVal: number): number => {
    return Math.round(costoVal * (1 + margenVal / 100))
  }

  const calculateMargen = (precioFinalVal: number, costoVal: number): number => {
    if (costoVal === 0) return 0
    return Math.round((precioFinalVal / costoVal - 1) * 1000) / 10
  }

  // Calculate precio final based on costo and margen
  const precioFinal = useMemo(() => {
    if (precioVenta !== "") {
      return parseFloat(precioVenta) || 0
    }
    const costoNum = parseFloat(costo) || 0
    const margenNum = parseFloat(margen) || 0
    return calculatePrecioFinal(costoNum, margenNum)
  }, [costo, margen, precioVenta])

  // Handle costo change with settings-aware behavior
  const handleCostoChange = (newCosto: string) => {
    const newCostoNum = parseFloat(newCosto) || 0
    const currentPrecioFinal = precioVenta !== "" ? parseFloat(precioVenta) : precioFinal
    
    setCosto(newCosto)
    
    // If no costo or precio final is 0, set margen to 0
    if (newCostoNum === 0 || currentPrecioFinal === 0) {
      setMargen("0")
    } else if (precios.costoBehavior === "preservePrecioFinal") {
      // Preserve precio final, recalculate margen
      const newMargen = calculateMargen(currentPrecioFinal, newCostoNum)
      setMargen(newMargen.toString())
    } else {
      // Preserve margen, recalculate precio final
      setPrecioVenta("")
    }
  }

  // Handle margen change - always recalculate precio final
  const handleMargenChange = (newMargen: string) => {
    setMargen(newMargen)
    setPrecioVenta("") // Reset manual price, let it recalculate
  }

  // Handle precio final change - always recalculate margen
  const handlePrecioFinalChange = (newPrecioFinal: string) => {
    const newPrecioNum = parseFloat(newPrecioFinal) || 0
    const costoNum = parseFloat(costo) || 0
    
    setPrecioVenta(newPrecioFinal)
    
    // If precio final is 0 or no costo, set margen to 0
    if (newPrecioNum === 0 || costoNum === 0) {
      setMargen("0")
    } else {
      // Recalculate margen based on new precio final
      const newMargen = calculateMargen(newPrecioNum, costoNum)
      setMargen(newMargen.toString())
    }
  }

  // Calculate stock disponible
  const stockDisponible = useMemo(() => {
    const inicial = parseInt(stockInicial) || 0
    const reservado = parseInt(stockReservado) || 0
    return Math.max(0, inicial - reservado)
  }, [stockInicial, stockReservado])

  const breadcrumbs = [
    { label: "Catalogo" },
    { label: "Items", href: "/catalogo/items" },
    { label: "Nuevo Item" },
  ]

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= MAX_TITLE_LENGTH) {
      setTitulo(value)
    }
  }

  const handleTypeSelect = (type: "individual" | "variantes") => {
    if (isTituloValid) {
      setSelectedType(type)
      // Initialize skuPadre when selecting variantes type
      if (type === "variantes" && !skuPadre) {
        const suggestedParentSku = generateStandaloneSKU({
          category: categoria || undefined,
          title: titulo.trim(),
        })
        setSkuPadre(suggestedParentSku)
      }
      // Scroll to steps section after a short delay for the state to update
      setTimeout(() => {
        stepsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }

  // Generate new variant combinations based on atributos principales
  const generateNewVariantCombinations = () => {
    const attrs = containerAtributosPrincipales.filter((attr) => attr.key && attr.variantes.length > 0)
    if (attrs.length === 0) return []

    const currentSkuPadre = skuPadre || generateStandaloneSKU({
      category: categoria || undefined,
      title: titulo.trim(),
    })

    // Helper to check if a variant combination already exists
    const variantExists = (v1: string, v2: string | null) => {
      return variantItems.some((v) => {
        return v.variant1 === v1 && v.variant2 === v2
      })
    }

    const newCombinations: Array<{
      id: string
      skuSuffix: string
      codigoUniversal: string
      descripcion: string
      foto: string
      variant1: string | null
      variant2: string | null
    }> = []

    if (attrs.length === 1) {
      attrs[0].variantes.forEach((v1) => {
        if (!variantExists(v1, null)) {
          const skuSuffix = v1.toLowerCase().replace(/\s+/g, "-")
          newCombinations.push({
            id: generateId("VAR"),
            skuSuffix,
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
              id: generateId("VAR"),
              skuSuffix,
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

  // Handle generating variants
  const handleGenerarVariantes = () => {
    const currentAttrCount = containerAtributosPrincipales.filter(
      (attr) => attr.key && attr.variantes.length > 0
    ).length

    // Filter out existing variants that don't match the current atributo count
    const validExistingVariants = variantItems.filter((v) => {
      const variantAttrCount = (v.variant1 ? 1 : 0) + (v.variant2 ? 1 : 0)
      return variantAttrCount === currentAttrCount
    })

    const newCombinations = generateNewVariantCombinations()
    setVariantItems([...validExistingVariants, ...newCombinations])
  }

  // Check if variants can be generated
  const canGenerateVariants = useMemo(() => {
    const hasAtLeastOneVariante = containerAtributosPrincipales.some(
      (attr) => attr.key.trim() !== "" && attr.variantes.length > 0
    )
    const potentialNewVariants = generateNewVariantCombinations()
    return hasAtLeastOneVariante && potentialNewVariants.length > 0
  }, [containerAtributosPrincipales, variantItems])

  // Handle nueva variante from modal
  const handleNuevaVariante = (attributeValues: Record<string, string>) => {
    const values = Object.values(attributeValues).filter(v => v.trim() !== "")
    if (values.length === 0) return

    const variant1 = values[0] || null
    const variant2 = values[1] || null

    // Check if this combination already exists
    const exists = variantItems.some(v => v.variant1 === variant1 && v.variant2 === variant2)
    if (exists) return

    const skuSuffix = values.map(v => v.toLowerCase().replace(/\s+/g, "-")).join("-")
    const newVariant = {
      id: generateId("VAR"),
      skuSuffix,
      codigoUniversal: "",
      descripcion: "",
      foto: "",
      variant1,
      variant2,
    }

    setVariantItems([...variantItems, newVariant])
    setIsNuevaVarianteModalOpen(false)
  }

  // Success View - Full screen without stepper (must be checked BEFORE steps view)
  if (selectedType === "individual" && createdItemId) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)]">
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
                <div className="flex items-center gap-3">
                  <Breadcrumb items={breadcrumbs} />
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <UserPanel />
                </div>

                <div className="flex items-center gap-2 min-w-[280px] justify-end">
                </div>
              </div>
            </div>

            {/* Success Content */}
            <main className="flex-1 flex items-center justify-center bg-[rgba(250,251,253,1)]">
              <div className="p-8 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)] max-w-md w-full">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Item Creado Exitosamente</h2>
                  <p className="text-gray-500 mb-2">{titulo}</p>
                  <p className="text-sm text-gray-400 font-mono mb-8">{createdItemSkuDisplay}</p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push(`/catalogo/items/${createdItemId}`)}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      Ver Item
                    </button>
                    <button
                      onClick={() => {
                        // Reset all state for new item creation
                        setTitulo("")
                        setSelectedType(null)
                        setCurrentStep(1)
                        setSelectedDetailTab("info")
                        setCategoria("")
                        setMarca("")
                        setFormatoVenta("unidad")
                        setUnidadesPorPack("1")
                        setVolumenActive(false)
                        setVolumenCantidad("")
                        setVolumenUnidad("ml")
                        setVencimientoActive(false)
                        setFechaVencimiento("")
                        setShowAtributosView(false)
                        setAtributosInformativos([])
                        setSku("")
                        setSkuUserModified(false)
                        setCodigoUniversal("")
                        setMediaPhotos([])
                        setDescripcion("")
                        setEditingDescripcion(false)
                        setCosto("")
                        setMargen("")
                        setIva("21")
                        setPrecioVenta("")
                        setEditingPrecioVenta(false)
                        setStockInicial("")
                        setStockReservado("")
                        setProveedor("")
                        setCodigoProveedor("")
                        setCreatedItemId(null)
                        setCreatedItemSkuDisplay(null)
                      }}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Crear Otro Item
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Success View for Variantes - Full screen without stepper
  if (selectedType === "variantes" && createdItemId) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)]">
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
                <div className="flex items-center gap-3">
                  <Breadcrumb items={breadcrumbs} />
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <UserPanel />
                </div>

                <div className="flex items-center gap-2 min-w-[280px] justify-end">
                </div>
              </div>
            </div>

            {/* Success Content */}
            <main className="flex-1 flex items-center justify-center bg-[rgba(250,251,253,1)]">
              <div className="p-8 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)] max-w-md w-full">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Item Creado Exitosamente</h2>
                  <p className="text-gray-500 mb-2">{titulo}</p>
                  <p className="text-sm text-gray-400 font-mono mb-8">{createdItemSkuDisplay}</p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push(`/catalogo/items/${createdItemId}`)}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      Ver Item
                    </button>
                    <button
                      onClick={() => {
                        // Reset all state for new item creation
                        setTitulo("")
                        setSelectedType(null)
                        setCurrentStep(1)
                        setSelectedDetailTab("info")
                        setCategoria("")
                        setMarca("")
                        setFormatoVenta("unidad")
                        setUnidadesPorPack("1")
                        setVolumenActive(false)
                        setVolumenCantidad("")
                        setVolumenUnidad("ml")
                        setVencimientoActive(false)
                        setFechaVencimiento("")
                        setShowAtributosView(false)
                        setAtributosInformativos([])
                        setSku("")
                        setSkuUserModified(false)
                        setCodigoUniversal("")
                        setMediaPhotos([])
                        setDescripcion("")
                        setEditingDescripcion(false)
                        setCosto("")
                        setMargen("")
                        setIva("21")
                        setPrecioVenta("")
                        setEditingPrecioVenta(false)
                        setStockInicial("")
                        setStockReservado("")
                        setProveedor("")
                        setCodigoProveedor("")
                        setCreatedItemId(null)
                        setCreatedItemSkuDisplay(null)
                      }}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Crear Otro Item
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Show full-screen steps view when Item con Variantes is selected
  if (selectedType === "variantes") {
    return (
      <>
      <div className="min-h-screen bg-[rgb(243,242,238)]">
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
                <div className="flex items-center gap-3">
                  <Breadcrumb items={breadcrumbs} />
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <UserPanel />
                </div>

                <div className="flex items-center gap-2 min-w-[280px] justify-end">
                </div>
              </div>
            </div>

            {/* Main Content - Full Screen Steps View */}
            <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden" ref={stepsContainerRef}>
              {/* 20-column grid layout */}
              <div className="w-full h-full grid" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
                {/* Left Column - Steps Indicator (4 cols) */}
                <div className="col-span-4 bg-transparent p-6 flex flex-col">
                  <div className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Creando Item con Variantes</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{titulo}</p>
                  </div>
                  
                  <div className="flex flex-col">
                    {STEPS_VARIANTES.map((step, index) => {
                      // Steps 3 (Stock) and 4 (Precio) are disabled if no variants created
                      const isStepDisabled = (step.id === 3 || step.id === 4) && variantItems.length === 0
                      
                      return (
                        <div key={step.id} className="flex items-start">
                          {/* Vertical line and dot */}
                          <div className="flex flex-col items-center mr-3">
                            <div 
                              className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                                isStepDisabled
                                  ? 'bg-gray-100 border-gray-200 opacity-50'
                                  : currentStep === step.id 
                                    ? 'bg-purple-500 border-purple-500 shadow-md shadow-purple-200' 
                                    : currentStep > step.id
                                      ? 'bg-green-500 border-green-500'
                                      : 'bg-white border-gray-300'
                              }`}
                            />
                            {index < STEPS_VARIANTES.length - 1 && (
                              <div 
                                className={`w-0.5 h-20 transition-all duration-300 ${
                                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                              />
                            )}
                          </div>
                          {/* Step label */}
                          <div className="pb-20">
                            <button
                              onClick={() => !isStepDisabled && setCurrentStep(step.id)}
                              disabled={isStepDisabled}
                              className={`text-left transition-all duration-200 ${
                                isStepDisabled
                                  ? 'text-gray-300 font-medium cursor-not-allowed'
                                  : currentStep === step.id 
                                    ? 'text-purple-600 font-semibold cursor-pointer' 
                                    : currentStep > step.id
                                      ? 'text-green-600 font-medium cursor-pointer'
                                      : 'text-gray-400 font-medium hover:text-gray-600 cursor-pointer'
                              }`}
                            >
                              <span className="text-xs uppercase tracking-wider">{step.label}</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Back to type selection */}
                  <div className="mt-auto">
                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      Cambiar tipo de item
                    </button>
                  </div>
                </div>

                {/* Right Column - Step Content (16 cols, with right padding for visual 3-col spacing) */}
                <div className="col-span-16 overflow-auto p-8 pr-[15%]">
                  <div>
                    {/* Step 1: Información Compartida */}
                    {currentStep === 1 && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        {/* Info/Atributos Toggle */}
                        <div className="mb-6">
                          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 w-full">
                            <button
                              onClick={() => setSelectedDetailTab("info")}
                              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${selectedDetailTab === "info"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Info
                            </button>
                            <button
                              onClick={() => setSelectedDetailTab("atributos")}
                              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${selectedDetailTab === "atributos"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Atributos
                            </button>
                          </div>
                        </div>

                        {/* Info Tab Content */}
                        {selectedDetailTab === "info" && (
                          <div className="h-full flex flex-col py-2 overflow-y-auto">
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                              Información Compartida
                            </h3>
                            <p className="text-[11px] text-slate-400 mb-3 italic">
                              Esta información sera compartida por todas las variantes.
                            </p>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-gray-700">Categoria</label>
                                  <input
                                    type="text"
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300 text-gray-900"
                                    placeholder="Ej: Vinos"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-gray-700">Marca</label>
                                  <input
                                    type="text"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300 text-gray-900"
                                    placeholder="Ej: YKK"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-gray-200 my-4"></div>

                              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                                Presentacion
                              </h3>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-gray-700">Formato de venta</label>
                                  <select
                                    value={formatoVenta}
                                    onChange={(e) => setFormatoVenta(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white border-gray-300 text-gray-900 cursor-pointer"
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
                                        setUnidadesPorPack(numValue < 1 ? "1" : value)
                                      }
                                    }}
                                    disabled={formatoVenta === "unidad"}
                                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                      formatoVenta === "unidad"
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
                                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                      volumenActive ? "bg-purple-500" : "bg-gray-300"
                                    }`}
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
                                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300 text-gray-900"
                                        placeholder="0"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <label className="text-sm font-medium text-gray-700">Unidad de medida</label>
                                      <select
                                        value={volumenUnidad}
                                        onChange={(e) => setVolumenUnidad(e.target.value)}
                                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white border-gray-300 text-gray-900 cursor-pointer"
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

                              {/* Vencimiento Section - Only shown if enabled in settings */}
                              {catalogo.incluirVencimiento && (
                                <div className="flex flex-col gap-2 mt-4">
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Vencimiento</label>
                                    <button
                                      onClick={() => setVencimientoActive(!vencimientoActive)}
                                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                        vencimientoActive ? "bg-purple-500" : "bg-gray-300"
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
                                    <div className="mt-2 p-3 border border-purple-200/60 rounded-lg bg-gradient-to-br from-purple-50/50 to-indigo-50/30">
                                      <label className="text-xs font-semibold text-purple-900/70 uppercase tracking-wider mb-2 block">
                                        Fecha de Vencimiento
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="date"
                                          value={fechaVencimiento}
                                          onChange={(e) => setFechaVencimiento(e.target.value)}
                                          className="w-full px-3 py-2.5 border border-purple-300/50 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 text-gray-900 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Divider */}
                              <div className="border-t border-gray-200 my-4"></div>

                              {/* Proveedor Section */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-gray-700">Proveedor</label>
                                  <input
                                    type="text"
                                    value={proveedor}
                                    onChange={(e) => setProveedor(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300 text-gray-900"
                                    placeholder="Nombre del proveedor"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Atributos Tab Content */}
                        {selectedDetailTab === "atributos" && (
                          <div className="py-2">
                            {!showAtributosView ? (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                                  <Plus className="w-6 h-6 text-purple-400" />
                                </div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                  Atributos Informativos
                                </h4>
                                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                                  Agrega atributos adicionales que describan el item, como material, origen, etc.
                                </p>
                                <button
                                  onClick={() => {
                                    setShowAtributosView(true)
                                    if (atributosInformativos.length === 0) {
                                      setAtributosInformativos([{ key: "", value: "" }])
                                    }
                                  }}
                                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors cursor-pointer"
                                >
                                  Agregar Atributos
                                </button>
                              </div>
                            ) : (
                              <div>
                                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                                  Atributos Informativos
                                </h3>
                                <p className="text-[11px] text-slate-400 mb-4 italic">
                                  Estos atributos seran compartidos por todas las variantes.
                                </p>

                                <div className="space-y-3">
                                  {atributosInformativos.map((attr, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={attr.key}
                                        onChange={(e) => {
                                          const newAttrs = [...atributosInformativos]
                                          newAttrs[index].key = e.target.value
                                          setAtributosInformativos(newAttrs)
                                        }}
                                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300 text-gray-900 text-sm"
                                        placeholder="Atributo"
                                      />
                                      <input
                                        type="text"
                                        value={attr.value}
                                        onChange={(e) => {
                                          const newAttrs = [...atributosInformativos]
                                          newAttrs[index].value = e.target.value
                                          setAtributosInformativos(newAttrs)
                                        }}
                                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300 text-gray-900 text-sm"
                                        placeholder="Valor"
                                      />
                                      <button
                                        onClick={() => {
                                          const newAttrs = atributosInformativos.filter((_, i) => i !== index)
                                          setAtributosInformativos(newAttrs)
                                          if (newAttrs.length === 0) {
                                            setShowAtributosView(false)
                                          }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}

                                  <button
                                    onClick={() => {
                                      setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
                                    }}
                                    className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Agregar otro atributo
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Navigation buttons */}
                        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="px-6 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors cursor-pointer"
                          >
                            Continuar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Variantes */}
                    {currentStep === 2 && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        <div className="h-full flex flex-col py-2">
                          {/* Variant count */}
                          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-5">
                            {variantItems.length} {variantItems.length === 1 ? "variante" : "variantes"}
                          </h3>

                          {/* Atributos de Variantes section - full width */}
                          <div className="mb-6 pb-6 border-b border-gray-200">
                            {!showVariantAtributosView ? (
                              <div className="flex flex-col items-center justify-center gap-4 py-8">
                                <p className="text-gray-500 text-sm">No hay atributos configurados</p>
                                <button
                                  onClick={() => {
                                    setShowVariantAtributosView(true)
                                    if (containerAtributosPrincipales.length === 0) {
                                      setContainerAtributosPrincipales([{ key: "", variantes: [] }])
                                    }
                                  }}
                                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors cursor-pointer"
                                >
                                  Agregar atributo
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="text-left mb-3">
                                  <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                                    Atributos de Variantes
                                  </h3>
                                  <p className="text-xs text-gray-500 italic">
                                    Atributos que definen las variantes del producto (máximo 2)
                                  </p>
                                </div>

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
                                            setContainerAtributosPrincipales(updated)
                                          }}
                                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300 text-sm transition-all hover:border-slate-300"
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
                                                  setContainerAtributosPrincipales(updated)
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
                                              : "border-slate-200 focus:ring-purple-300"
                                              }`}
                                          />

                                          {duplicateTagError[index] && (
                                            <p className="text-red-500 text-xs mt-1 font-medium animate-pulse">
                                              Este tag ya existe
                                            </p>
                                          )}

                                          <div className="flex flex-wrap gap-2">
                                            {attr.variantes.map((variante, vIndex) => {
                                              // Check if this variante has all combinations generated
                                              const otherAttrIndex = index === 0 ? 1 : 0
                                              const otherAttr = containerAtributosPrincipales[otherAttrIndex]
                                              let isComplete = true
                                              if (variantItems.length > 0 && otherAttr && otherAttr.variantes.length > 0) {
                                                for (const otherValue of otherAttr.variantes) {
                                                  const hasCombination = variantItems.some((v) => {
                                                    if (index === 0) {
                                                      return v.variant1 === variante && v.variant2 === otherValue
                                                    } else {
                                                      return v.variant1 === otherValue && v.variant2 === variante
                                                    }
                                                  })
                                                  if (!hasCombination) { isComplete = false; break }
                                                }
                                              } else if (variantItems.length > 0 && containerAtributosPrincipales.length === 1) {
                                                isComplete = variantItems.some((v) => v.variant1 === variante)
                                              } else if (variantItems.length === 0) {
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
                                                      // Remove variants that use this variante value
                                                      const updatedVariants = variantItems.filter((v) => {
                                                        if (index === 0) return v.variant1 !== variante
                                                        else return v.variant2 !== variante
                                                      })
                                                      setContainerAtributosPrincipales(updated)
                                                      setVariantItems(updatedVariants)
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
                                          setContainerAtributosPrincipales(updated)
                                          setVariantItems([])
                                          if (updated.length === 0) {
                                            setShowVariantAtributosView(false)
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

                                  {containerAtributosPrincipales.length > 0 && (
                                    <button
                                      onClick={handleGenerarVariantes}
                                      disabled={!canGenerateVariants}
                                      className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${canGenerateVariants
                                        ? "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                    >
                                      Generar Variantes
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* SKU Padre and Variants header */}
                          {variantItems.length > 0 && (
                            <div className="mt-2 mb-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                                  Variantes
                                </h3>
                                <button
                                  onClick={() => setIsNuevaVarianteModalOpen(true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Nueva Variante</span>
                                </button>
                              </div>

                              {/* SKU Padre */}
                              <div className="mb-4">
                                <div className="flex items-center gap-2 group/skupadre">
                                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    SKU Padre
                                  </span>
                                  {editingSkuPadre ? (
                                    <input
                                      type="text"
                                      value={skuPadre}
                                      autoFocus
                                      onChange={(e) => setSkuPadre(e.target.value.toUpperCase())}
                                      onBlur={() => setEditingSkuPadre(false)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                                        if (e.key === "Escape") {
                                          setEditingSkuPadre(false)
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-mono text-sm text-slate-800 bg-transparent border-b border-slate-400 focus:border-purple-500 focus:outline-none w-full max-w-[180px]"
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
                                      <span className="font-mono text-sm text-slate-800">{skuPadre}</span>
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
                          {variantItems.length > 0 && (
                            <div className="bg-white border border-border/40 rounded-lg overflow-hidden">
                              {/* Table Header */}
                              <div className="grid grid-cols-[40px_1fr_minmax(120px,1fr)_minmax(100px,0.8fr)_1fr] bg-slate-50 border-b border-border/30">
                                <div className="px-2 py-3" />
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Variante</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">SKU</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cód. Universal</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Descripción</div>
                              </div>

                              {/* Table Body */}
                              <div className="divide-y divide-border/30">
                                {variantItems.map((variant) => (
                                  <div
                                    key={variant.id}
                                    className="grid grid-cols-[40px_1fr_minmax(120px,1fr)_minmax(100px,0.8fr)_1fr] items-center hover:bg-accent/30 transition-colors"
                                  >
                                    {/* Thumbnail */}
                                    <div className="px-2 py-2 flex items-center justify-center">
                                      <div 
                                        className="relative w-8 h-8 rounded-md bg-gradient-to-br from-muted to-muted/50 overflow-hidden flex-shrink-0 flex items-center justify-center group/thumb cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setVariantMediaModal({ open: true, variantId: variant.id })
                                        }}
                                      >
                                        {variant.foto ? (
                                          <Image
                                            src={variant.foto}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-5 h-5 text-gray-300">
                                            <ImageIcon className="w-full h-full" />
                                          </div>
                                        )}
                                        {/* Hover overlay with pencil */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                          <Pencil className="w-3 h-3 text-white" />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Variant tags */}
                                    <div className="px-3 py-2 flex items-center gap-1.5">
                                      {variant.variant1 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[80px]">
                                          {variant.variant1}
                                        </span>
                                      )}
                                      {variant.variant1 && variant.variant2 && (
                                        <span className="text-[9px] text-muted-foreground/50 font-medium">×</span>
                                      )}
                                      {variant.variant2 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[80px]">
                                          {variant.variant2}
                                        </span>
                                      )}
                                    </div>

                                    {/* SKU - editable */}
                                    <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center w-full">
                                        <span className="text-[11px] font-mono text-muted-foreground/60 select-none whitespace-nowrap">
                                          {skuPadre}-
                                        </span>
                                        <input
                                          type="text"
                                          value={variant.skuSuffix}
                                          onChange={(e) => {
                                            const newSuffix = e.target.value
                                            setVariantItems((prev) =>
                                              prev.map((v) => v.id === variant.id ? { ...v, skuSuffix: newSuffix } : v)
                                            )
                                          }}
                                          className="flex-1 min-w-0 bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-purple-500/50 px-0 py-0.5 text-[11px] font-mono text-foreground focus:outline-none transition-colors"
                                          placeholder="sufijo..."
                                        />
                                      </div>
                                    </div>

                                    {/* Código Universal - editable */}
                                    <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={variant.codigoUniversal}
                                        onChange={(e) => {
                                          const newCodigo = e.target.value
                                          setVariantItems((prev) =>
                                            prev.map((v) => v.id === variant.id ? { ...v, codigoUniversal: newCodigo } : v)
                                          )
                                        }}
                                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-purple-500/50 px-0 py-0.5 text-[11px] font-mono text-foreground focus:outline-none transition-colors"
                                        placeholder="Ej: 7790001234567"
                                      />
                                    </div>

                                    {/* Descripción - editable */}
                                    <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={variant.descripcion}
                                        onChange={(e) => {
                                          const newDesc = e.target.value
                                          setVariantItems((prev) =>
                                            prev.map((v) => v.id === variant.id ? { ...v, descripcion: newDesc } : v)
                                          )
                                        }}
                                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-purple-500/50 px-0 py-0.5 text-[11px] text-foreground focus:outline-none transition-colors"
                                        placeholder="Descripción..."
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(1)}
                              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              onClick={() => setCurrentStep(3)}
                              disabled={variantItems.length === 0}
                              className={`px-6 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                                variantItems.length > 0
                                  ? "bg-purple-500 text-white hover:bg-purple-600"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Continuar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Precio */}
                    {currentStep === 4 && !createdItemId && variantItems.length > 0 && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        <div className="h-full flex flex-col py-2">
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                            Precio
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Define los precios de cada variante.
                          </p>

                          {/* Precio Matrix Table */}
                          {variantItems.length > 0 && (
                            <div className="bg-white border border-border/40 rounded-lg overflow-hidden">
                              {/* Table Header */}
                              <div className="grid grid-cols-[40px_1fr_100px_80px_80px_100px] bg-slate-50 border-b border-border/30">
                                <div className="px-2 py-3" />
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Variante</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Costo</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Margen</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">IVA</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Precio Final</div>
                              </div>

                              {/* Table Body */}
                              <div className="divide-y divide-border/30">
                                {variantItems.map((variant) => {
                                  const variantCosto = (variant as any).costo || ""
                                  const variantMargen = (variant as any).margen || ""
                                  const variantIva = (variant as any).iva || "21"
                                  const variantPrecioFinal = (variant as any).precioFinal || ""
                                  const costoNum = parseFloat(variantCosto) || 0
                                  const margenNum = parseFloat(variantMargen) || 0
                                  const hasCosto = variantCosto !== "" && costoNum > 0
                                  
                                  // Precio final = costo * (1 + margen/100), IVA does NOT affect precio final
                                  const precioFinalCalc = variantPrecioFinal !== "" 
                                    ? parseFloat(variantPrecioFinal) 
                                    : (hasCosto ? costoNum * (1 + margenNum / 100) : 0)
                                  
                                  return (
                                    <div
                                      key={variant.id}
                                      className="grid grid-cols-[40px_1fr_100px_80px_80px_100px] items-center hover:bg-accent/30 transition-colors"
                                    >
                                      {/* Thumbnail */}
                                      <div className="px-2 py-2 flex items-center justify-center">
                                        <div className="relative w-8 h-8 rounded-md bg-gradient-to-br from-muted to-muted/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                          {variant.foto ? (
                                            <Image
                                              src={variant.foto}
                                              alt=""
                                              width={32}
                                              height={32}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-5 h-5 text-gray-300">
                                              <ImageIcon className="w-full h-full" />
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Variant tags */}
                                      <div className="px-3 py-2 flex items-center gap-1.5">
                                        {variant.variant1 && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[80px]">
                                            {variant.variant1}
                                          </span>
                                        )}
                                        {variant.variant1 && variant.variant2 && (
                                          <span className="text-[9px] text-muted-foreground/50 font-medium">×</span>
                                        )}
                                        {variant.variant2 && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[80px]">
                                            {variant.variant2}
                                          </span>
                                        )}
                                      </div>

                                      {/* Costo */}
                                      <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center">
                                          <span className="text-[11px] text-muted-foreground/60 mr-1">$</span>
                                          <input
                                            type="number"
                                            value={variantCosto}
                                            onChange={(e) => {
                                              setVariantItems((prev) =>
                                                prev.map((v) => v.id === variant.id ? { ...v, costo: e.target.value } as any : v)
                                              )
                                            }}
                                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-purple-500/50 px-0 py-0.5 text-[11px] text-foreground focus:outline-none transition-colors"
                                            placeholder="0.00"
                                          />
                                        </div>
                                      </div>

                                      {/* Margen - disabled if no costo */}
                                      <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center">
                                          <input
                                            type="number"
                                            value={hasCosto ? variantMargen : ""}
                                            onChange={(e) => {
                                              setVariantItems((prev) =>
                                                prev.map((v) => v.id === variant.id ? { ...v, margen: e.target.value } as any : v)
                                              )
                                            }}
                                            disabled={!hasCosto}
                                            className={`w-full bg-transparent border-0 border-b px-0 py-0.5 text-[11px] focus:outline-none transition-colors ${
                                              hasCosto 
                                                ? "border-transparent hover:border-border/40 focus:border-purple-500/50 text-foreground" 
                                                : "border-transparent text-muted-foreground/40 cursor-not-allowed"
                                            }`}
                                            placeholder="0"
                                          />
                                          <span className={`text-[11px] ml-1 ${hasCosto ? "text-muted-foreground/60" : "text-muted-foreground/30"}`}>%</span>
                                        </div>
                                      </div>

                                      {/* IVA - dropdown */}
                                      <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                        <select
                                          value={variantIva}
                                          onChange={(e) => {
                                            setVariantItems((prev) =>
                                              prev.map((v) => v.id === variant.id ? { ...v, iva: e.target.value } as any : v)
                                            )
                                          }}
                                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-purple-500/50 px-0 py-0.5 text-[11px] text-foreground focus:outline-none transition-colors cursor-pointer appearance-none"
                                        >
                                          <option value="0">0%</option>
                                          <option value="10">10%</option>
                                          <option value="21">21%</option>
                                        </select>
                                      </div>

                                      {/* Precio Final - editable */}
                                      <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center">
                                          <span className="text-[11px] text-green-600 mr-1">$</span>
                                          <input
                                            type="number"
                                            value={variantPrecioFinal !== "" ? variantPrecioFinal : (precioFinalCalc > 0 ? precioFinalCalc.toFixed(2) : "")}
                                            onChange={(e) => {
                                              setVariantItems((prev) =>
                                                prev.map((v) => v.id === variant.id ? { ...v, precioFinal: e.target.value } as any : v)
                                              )
                                            }}
                                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-green-500/50 px-0 py-0.5 text-[11px] text-green-700 font-medium focus:outline-none transition-colors"
                                            placeholder="0.00"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(3)}
                              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              disabled={isCreating}
                              onClick={async () => {
                                setIsCreating(true)
                                try {
                                  // Generate parent item ID
                                  const parentItemId = generateId("PAR")
                                  const finalSkuPrefix = skuPadre || generateStandaloneSKU({
                                    category: categoria || undefined,
                                    title: titulo.trim(),
                                    brand: marca || undefined,
                                  })
                                  
                                  // Build containerAtributosPrincipales for the parent
                                  const containerAttrs = containerAtributosPrincipales
                                    .filter(attr => attr.key && attr.variantes.length > 0)
                                    .map(attr => ({
                                      key: attr.key,
                                      variantes: attr.variantes
                                    }))
                                  
                                  // Build variant items with full data
                                  const variants: ItemVariant[] = variantItems.map((v) => {
                                    const variantCosto = (v as any).costo || ""
                                    const variantMargen = (v as any).margen || ""
                                    const variantIva = (v as any).iva || "21"
                                    const variantPrecioFinal = (v as any).precioFinal || ""
                                    const variantStockInicial = (v as any).stockInicial || "0"
                                    const variantStockReservado = (v as any).stockReservado || "0"
                                    
                                    const costoNum = parseFloat(variantCosto) || 0
                                    const margenNum = parseFloat(variantMargen) || 0
                                    const ivaNum = parseFloat(variantIva) || 21
                                    const hasCosto = variantCosto !== "" && costoNum > 0
                                    
                                    // Calculate precio final if not manually set
                                    let finalPrice = parseFloat(variantPrecioFinal) || 0
                                    if (!finalPrice && hasCosto) {
                                      finalPrice = costoNum * (1 + margenNum / 100)
                                    }
                                    
                                    // Build atributosPrincipales for the variant
                                    const attrPrincipales: Atributo[] = []
                                    if (v.variant1 && containerAtributosPrincipales[0]?.key) {
                                      attrPrincipales.push({ key: containerAtributosPrincipales[0].key, value: v.variant1 })
                                    }
                                    if (v.variant2 && containerAtributosPrincipales[1]?.key) {
                                      attrPrincipales.push({ key: containerAtributosPrincipales[1].key, value: v.variant2 })
                                    }
                                    
                                    // Build variant name from attributes
                                    const variantName = attrPrincipales.map(a => a.value).join(" ")
                                    
                                    const stockTotal = parseInt(variantStockInicial) || 0
                                    const stockReservado = parseInt(variantStockReservado) || 0
                                    const stockDisponible = stockTotal - stockReservado
                                    
                                    return {
                                      id: v.id,
                                      name: variantName,
                                      skuSuffix: v.skuSuffix || v.variant1?.toLowerCase().replace(/\s+/g, "-") || "",
                                      codigoUniversal: v.codigoUniversal || "",
                                      stock: {
                                        total: stockTotal.toString(),
                                        reservado: stockReservado.toString(),
                                        disponible: stockDisponible.toString(),
                                      },
                                      precio: {
                                        costo: costoNum,
                                        margen: margenNum,
                                        iva: ivaNum,
                                        precioFinal: finalPrice,
                                      },
                                      atributosPrincipales: attrPrincipales,
                                      isActive: true,
                                    }
                                  })
                                  
                                  // Create the parent item with variants
                                  const newParentItem: Item = {
                                    id: parentItemId,
                                    name: titulo,
                                    skuPrefix: finalSkuPrefix,
                                    codigoUniversal: codigoUniversal || "",
                                    marca: marca || "",
                                    modelo: "",
                                    categoria: categoria || "",
                                    formatoVenta: formatoVenta || "unidad",
                                    proveedor: proveedor || "",
                                    codigoProveedor: codigoProveedor || "",
                                    descripcion: descripcion || "",
                                    hasVariants: true,
                                    isAgrupador: false,
                                    variantCount: variants.length,
                                    itemCount: 0,
                                    containerAtributosPrincipales: containerAttrs,
                                    variants: variants,
                                    atributosInformativos: atributosInformativos,
                                    isActive: true,
                                  }
                                  
                                  // Add to items and persist to localStorage
                                  const validExistingItems = items.filter((item: any) => {
                                    if (!item || typeof item !== 'object') return false
                                    if (!item.id && !item.sku && !item.skuPrefix) return false
                                    if (!item.name || item.name.trim() === '') return false
                                    return true
                                  })
                                  const updatedItems = [newParentItem, ...validExistingItems]
                                  const storageKey = `stockio-items-${currentAccount}`
                                  localStorage.setItem(storageKey, JSON.stringify(updatedItems))
                                  setItems(updatedItems)
                                  
                                  // Store for success screen
                                  setCreatedItemId(parentItemId)
                                  setCreatedItemSkuDisplay(finalSkuPrefix)
                                } catch (error) {
                                  console.error('Error creating item with variants:', error)
                                  alert('Error al crear el item. Por favor intenta de nuevo.')
                                } finally {
                                  setIsCreating(false)
                                }
                              }}
                              className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCreating ? 'Creando...' : 'Crear Item'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Stock */}
                    {currentStep === 3 && !createdItemId && variantItems.length > 0 && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        <div className="h-full flex flex-col py-2">
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                            Stock
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Define el stock total de cada variante.
                          </p>

                          {/* Stock Matrix Table */}
                          {variantItems.length > 0 && (
                            <div className="bg-white border border-border/40 rounded-lg overflow-hidden">
                              {/* Table Header */}
                              <div className="grid grid-cols-[40px_1fr_100px_100px_100px] bg-slate-50 border-b border-border/30">
                                <div className="px-2 py-3" />
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Variante</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Stock Total</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Stock Reservado</div>
                                <div className="px-3 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Stock Disponible</div>
                              </div>

                              {/* Table Body */}
                              <div className="divide-y divide-border/30">
                                {variantItems.map((variant) => {
                                  const variantStockInicial = (variant as any).stockInicial || ""
                                  const variantStockReservado = (variant as any).stockReservado || ""
                                  const stockInicialNum = parseInt(variantStockInicial) || 0
                                  const stockReservadoNum = parseInt(variantStockReservado) || 0
                                  const stockDisponibleCalc = stockInicialNum - stockReservadoNum
                                  
                                  return (
                                    <div
                                      key={variant.id}
                                      className="grid grid-cols-[40px_1fr_100px_100px_100px] items-center hover:bg-accent/30 transition-colors"
                                    >
                                      {/* Thumbnail */}
                                      <div className="px-2 py-2 flex items-center justify-center">
                                        <div className="relative w-8 h-8 rounded-md bg-gradient-to-br from-muted to-muted/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                          {variant.foto ? (
                                            <Image
                                              src={variant.foto}
                                              alt=""
                                              width={32}
                                              height={32}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-5 h-5 text-gray-300">
                                              <ImageIcon className="w-full h-full" />
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Variant tags */}
                                      <div className="px-3 py-2 flex items-center gap-1.5">
                                        {variant.variant1 && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[80px]">
                                            {variant.variant1}
                                          </span>
                                        )}
                                        {variant.variant1 && variant.variant2 && (
                                          <span className="text-[9px] text-muted-foreground/50 font-medium">×</span>
                                        )}
                                        {variant.variant2 && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[80px]">
                                            {variant.variant2}
                                          </span>
                                        )}
                                      </div>

                                      {/* Stock Total */}
                                      <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="number"
                                          value={variantStockInicial}
                                          onChange={(e) => {
                                            setVariantItems((prev) =>
                                              prev.map((v) => v.id === variant.id ? { ...v, stockInicial: e.target.value } as any : v)
                                            )
                                          }}
                                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-purple-500/50 px-0 py-0.5 text-[11px] text-foreground focus:outline-none transition-colors"
                                          placeholder="0"
                                        />
                                      </div>

                                      {/* Stock Reservado */}
                                      <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="number"
                                          value={variantStockReservado}
                                          onChange={(e) => {
                                            setVariantItems((prev) =>
                                              prev.map((v) => v.id === variant.id ? { ...v, stockReservado: e.target.value } as any : v)
                                            )
                                          }}
                                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-purple-500/50 px-0 py-0.5 text-[11px] text-foreground focus:outline-none transition-colors"
                                          placeholder="0"
                                        />
                                      </div>

                                      {/* Stock Disponible - calculated */}
                                      <div className="px-3 py-2">
                                        <span className={`text-[11px] font-medium ${stockDisponibleCalc < 0 ? "text-red-500" : "text-foreground"}`}>
                                          {stockInicialNum > 0 || stockReservadoNum > 0 ? stockDisponibleCalc : "—"}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(2)}
                              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              onClick={() => setCurrentStep(4)}
                              className="px-6 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors cursor-pointer"
                            >
                              Continuar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Variant Media Modal */}
      {variantMediaModal.open && variantMediaModal.variantId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setVariantMediaModal({ open: false, variantId: null })} />
          <div className="relative bg-slate-900 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Media</h3>
              <button
                onClick={() => setVariantMediaModal({ open: false, variantId: null })}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variant info with parent item name + variant tags */}
            {(() => {
              const variant = variantItems.find(v => v.id === variantMediaModal.variantId)
              return variant ? (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700">
                  <span className="text-sm font-medium text-white">{titulo}</span>
                  {(variant.variant1 || variant.variant2) && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      {[variant.variant1, variant.variant2].filter(Boolean).join(" × ")}
                    </span>
                  )}
                </div>
              ) : null
            })()}

            {/* Media section */}
            <div className="flex gap-3 mb-4">
              {/* Upload Button */}
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-purple-400/60 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
              >
                <Upload className="w-5 h-5 text-purple-400" />
                <span className="text-[10px] text-purple-400 font-medium">Seleccionar</span>
              </button>

              {/* Current photo (if any) */}
              {(() => {
                const variant = variantItems.find(v => v.id === variantMediaModal.variantId)
                return variant?.foto ? (
                  <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-600 group">
                    <Image
                      src={variant.foto}
                      alt="Variant photo"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setVariantItems(prev => prev.map(v => 
                          v.id === variantMediaModal.variantId ? { ...v, foto: "" } : v
                        ))
                        setVariantMediaModal({ open: false, variantId: null })
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
                ) : null
              })()}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setVariantMediaModal({ open: false, variantId: null })}
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
        existingVariants={variantItems.map(v => ({
          id: v.id,
          atributos: [
            ...(v.variant1 ? [{ key: containerAtributosPrincipales[0]?.key || "", value: v.variant1 }] : []),
            ...(v.variant2 ? [{ key: containerAtributosPrincipales[1]?.key || "", value: v.variant2 }] : []),
          ]
        }))}
      />
      </>
    )
  }

  // Show full-screen steps view when Item Individual is selected
  if (selectedType === "individual") {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)]">
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
                <div className="flex items-center gap-3">
                  <Breadcrumb items={breadcrumbs} />
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <UserPanel />
                </div>

                <div className="flex items-center gap-2 min-w-[280px] justify-end">
                </div>
              </div>
            </div>

            {/* Main Content - Full Screen Steps View */}
            <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden" ref={stepsContainerRef}>
              {/* 20-column grid layout */}
              <div className="w-full h-full grid" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
                {/* Left Column - Steps Indicator (4 cols) */}
                <div className="col-span-4 bg-transparent p-6 flex flex-col">
                  <div className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Creando Item Individual</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{titulo}</p>
                  </div>
                  
                  <div className="flex flex-col">
                    {STEPS_INDIVIDUAL.map((step, index) => (
                      <div key={step.id} className="flex items-start">
                        {/* Vertical line and dot */}
                        <div className="flex flex-col items-center mr-3">
                          <div 
                            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                              currentStep === step.id 
                                ? 'bg-blue-500 border-blue-500 shadow-md shadow-blue-200' 
                                : currentStep > step.id
                                  ? 'bg-green-500 border-green-500'
                                  : 'bg-white border-gray-300'
                            }`}
                          />
                          {index < STEPS_INDIVIDUAL.length - 1 && (
                            <div 
                              className={`w-0.5 h-20 transition-all duration-300 ${
                                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        {/* Step label */}
                        <div className="pb-20">
                          <button
                            onClick={() => setCurrentStep(step.id)}
                            className={`text-left transition-all duration-200 cursor-pointer ${
                              currentStep === step.id 
                                ? 'text-blue-600 font-semibold' 
                                : currentStep > step.id
                                  ? 'text-green-600 font-medium'
                                  : 'text-gray-400 font-medium hover:text-gray-600'
                            }`}
                          >
                            <span className="text-xs uppercase tracking-wider">{step.label}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Back to type selection */}
                  <div className="mt-auto">
                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      Cambiar tipo de item
                    </button>
                  </div>
                </div>

                {/* Right Column - Step Content (16 cols, with right padding for visual 3-col spacing) */}
                <div className="col-span-16 overflow-auto p-8 pr-[15%]">
                  <div>
                    {/* Step 1: Información del Item */}
                    {currentStep === 1 && (
                      <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)]">
                        {/* Info/Atributos Toggle - Matching detail panel exactly */}
                        <div className="mb-6">
                          <div className="flex rounded-full border border-slate-200 p-1 bg-slate-50/80">
                            <button
                              onClick={() => setSelectedDetailTab("info")}
                              className={`flex-1 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${selectedDetailTab === "info"
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              INFO
                            </button>
                            <button
                              onClick={() => setSelectedDetailTab("atributos")}
                              className={`flex-1 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${selectedDetailTab === "atributos"
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              ATRIBUTOS
                            </button>
                          </div>
                        </div>

                        {/* Info Tab Content */}
                        {selectedDetailTab === "info" && (
                          <div className="h-full flex flex-col overflow-y-auto">
                            {/* Información del Producto Section */}
                            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-5">
                              Información del Producto
                            </h3>

                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
                                  <input
                                    type="text"
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                    placeholder="Ej: Vinos"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Marca</label>
                                  <input
                                    type="text"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                    placeholder="Ej: YKK"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-slate-100 my-6"></div>

                              {/* Presentación Section */}
                              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                                Presentación
                              </h3>

                              <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Formato de venta</label>
                                  <select
                                    value={formatoVenta}
                                    onChange={(e) => setFormatoVenta(e.target.value)}
                                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-slate-800 text-sm cursor-pointer transition-all"
                                  >
                                    <option value="unidad">Unidad</option>
                                    <option value="pack">Pack</option>
                                  </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Unidades por pack</label>
                                  <input
                                    type="text"
                                    value={unidadesPorPack === "N.E." ? "" : unidadesPorPack}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      if (value === "") {
                                        setUnidadesPorPack("N.E.")
                                      } else if (/^\d+$/.test(value)) {
                                        const numValue = Number.parseInt(value)
                                        setUnidadesPorPack(numValue < 1 ? "1" : value)
                                      }
                                    }}
                                    disabled={formatoVenta === "unidad"}
                                    className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all ${
                                      formatoVenta === "unidad"
                                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                        : "bg-white border-slate-200 text-slate-800"
                                    }`}
                                    placeholder="N.E."
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-3 mt-2">
                                <div className="flex items-center gap-3">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Volumen de la unidad</label>
                                  <button
                                    onClick={() => setVolumenActive(!volumenActive)}
                                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                      volumenActive ? "bg-slate-800" : "bg-slate-300"
                                    }`}
                                  >
                                    <div
                                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                        volumenActive ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {volumenActive && (
                                  <div className="grid grid-cols-2 gap-5 mt-1">
                                    <div className="flex flex-col gap-2">
                                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Cantidad</label>
                                      <input
                                        type="number"
                                        value={volumenCantidad}
                                        onChange={(e) => setVolumenCantidad(e.target.value)}
                                        className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                        placeholder="0"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Unidad de medida</label>
                                      <select
                                        value={volumenUnidad}
                                        onChange={(e) => setVolumenUnidad(e.target.value)}
                                        className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-slate-800 text-sm cursor-pointer transition-all"
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

                              {/* Vencimiento Section - Only shown if enabled in settings */}
                              {catalogo.incluirVencimiento && (
                                <div className="flex flex-col gap-3 mt-2">
                                  <div className="flex items-center gap-3">
                                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Vencimiento</label>
                                    <button
                                      onClick={() => setVencimientoActive(!vencimientoActive)}
                                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                        vencimientoActive ? "bg-slate-800" : "bg-slate-300"
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
                                    <div className="mt-1 p-4 border border-blue-200/60 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                                      <label className="text-[10px] font-medium text-blue-600/80 uppercase tracking-wider mb-2 block">
                                        Fecha de Vencimiento
                                      </label>
                                      <input
                                        type="date"
                                        value={fechaVencimiento}
                                        onChange={(e) => setFechaVencimiento(e.target.value)}
                                        className="w-full px-4 py-3 border border-blue-200/50 rounded-xl bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400 text-slate-800 text-sm transition-all"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Divider */}
                              <div className="border-t border-slate-200 my-5"></div>

                              {/* Proveedor Section */}
                              <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Proveedor</label>
                                  <input
                                    type="text"
                                    value={proveedor}
                                    onChange={(e) => setProveedor(e.target.value)}
                                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                    placeholder="Nombre del proveedor"
                                  />
                                </div>
                              </div>

                            </div>
                          </div>
                        )}

                        {/* Atributos Tab Content */}
                        {selectedDetailTab === "atributos" && (
                          <div>
                            {!showAtributosView ? (
                              <div className="flex flex-col items-center justify-center h-full gap-4 py-10">
                                <p className="text-slate-400 text-sm">No hay atributos configurados</p>
                                <button
                                  onClick={() => setShowAtributosView(true)}
                                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer text-sm font-medium"
                                >
                                  Agregar atributos
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4">
                                  <div>
                                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">
                                      Atributos Informativos
                                    </h3>
                                    <p className="text-[11px] text-slate-400 italic">
                                      Atributos que describen propiedades generales del producto
                                    </p>
                                  </div>

                                  {atributosInformativos.map((attr, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                      <div className="flex-1">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Atributo</label>
                                        <input
                                          type="text"
                                          value={attr.key}
                                          onChange={(e) => {
                                            const updated = [...atributosInformativos]
                                            updated[index].key = e.target.value
                                            setAtributosInformativos(updated)
                                          }}
                                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800 placeholder:text-slate-400"
                                          placeholder="Ej: Material"
                                        />
                                      </div>

                                      <div className="flex-1">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Valor</label>
                                        <input
                                          type="text"
                                          value={attr.value}
                                          onChange={(e) => {
                                            const updated = [...atributosInformativos]
                                            updated[index].value = e.target.value
                                            setAtributosInformativos(updated)
                                          }}
                                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800 placeholder:text-slate-400"
                                          placeholder="Ej: Algodon"
                                        />
                                      </div>

                                      <div className="flex items-center gap-1 mt-8">
                                        <button
                                          onClick={() => {
                                            const updated = atributosInformativos.filter((_, i) => i !== index)
                                            setAtributosInformativos(updated)
                                            if (updated.length === 0) {
                                              setShowAtributosView(false)
                                            }
                                          }}
                                          className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  <button
                                    onClick={() => {
                                      setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
                                    }}
                                    className="w-full px-4 py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-slate-600 hover:border-slate-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm">Agregar atributo</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Navigation buttons */}
                        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            Continuar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Stock */}
                    {currentStep === 2 && (
                      <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)]">
                        <div className="h-full flex flex-col">
                          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">
                            Stock
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Define el stock del item.
                          </p>

                          <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-5">
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Total</label>
                                <input
                                  type="number"
                                  value={stockInicial}
                                  onChange={(e) => setStockInicial(e.target.value)}
                                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Reservado</label>
                                <input
                                  type="number"
                                  value={stockReservado}
                                  onChange={(e) => setStockReservado(e.target.value)}
                                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Disponible</label>
                                <div className="px-4 py-3 border rounded-xl bg-blue-50/50 border-blue-200/60 text-blue-600 text-sm font-semibold">
                                  {stockDisponible}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(1)}
                              className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              onClick={() => setCurrentStep(3)}
                              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                            >
                              Continuar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Precio */}
                    {currentStep === 3 && (
                      <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)]">
                        <div className="h-full flex flex-col">
                          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">
                            Precio
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Define el precio del item.
                          </p>

                          <div className="space-y-6">
                            {/* 4 fields in one row */}
                            <div className="grid grid-cols-4 gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Costo</label>
                                <div className="relative">
                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                  <input
                                    type="number"
                                    value={costo}
                                    onChange={(e) => handleCostoChange(e.target.value)}
                                    className="w-full pl-8 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                    placeholder="0"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Margen</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={!costo || parseFloat(costo) === 0 || precioFinal === 0 ? "" : margen}
                                    onChange={(e) => handleMargenChange(e.target.value)}
                                    disabled={!costo || parseFloat(costo) === 0}
                                    className={`w-full pl-3.5 pr-8 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all ${
                                      !costo || parseFloat(costo) === 0
                                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                        : "bg-white border-slate-200 text-slate-800"
                                    }`}
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">IVA</label>
                                <select
                                  value={iva}
                                  onChange={(e) => setIva(e.target.value)}
                                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm cursor-pointer transition-all appearance-none"
                                >
                                  <option value="0">0%</option>
                                  <option value="10">10%</option>
                                  <option value="21">21%</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Precio Final</label>
                                <div className="relative">
                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600 text-sm font-medium">$</span>
                                  <input
                                    type="number"
                                    value={precioVenta !== "" ? precioVenta : (precioFinal > 0 ? precioFinal.toString() : "")}
                                    onChange={(e) => handlePrecioFinalChange(e.target.value)}
                                    className="w-full pl-8 pr-3 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50/50 text-green-700 text-sm font-semibold placeholder:text-green-400 transition-all"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(2)}
                              className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              onClick={() => setCurrentStep(4)}
                              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                            >
                              Continuar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Detalles Finales */}
                    {currentStep === 4 && !createdItemId && (
                      <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)]">
                        <div className="h-full flex flex-col">
                          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">
                            Detalles Finales
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Agrega información adicional del item.
                          </p>

                          <div className="space-y-6">
                            {/* Título */}
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Título</label>
                              <input
                                type="text"
                                value={tituloFinal}
                                onChange={(e) => {
                                  setTituloFinal(e.target.value)
                                  setTituloFinalUserModified(e.target.value !== titulo)
                                  // Reset SKU to auto-generate based on new title
                                  setSkuUserModified(false)
                                }}
                                className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 text-sm placeholder:text-slate-400 transition-all"
                                placeholder="Nombre del item"
                              />
                            </div>

                            {/* SKU and Codigo Universal */}
                            <div className="grid grid-cols-2 gap-5">
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">SKU</label>
                                <input
                                  type="text"
                                  value={sku}
                                  onChange={(e) => {
                                    setSku(e.target.value.toUpperCase())
                                    setSkuUserModified(e.target.value.toUpperCase() !== suggestedSku)
                                  }}
                                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-mono text-sm placeholder:text-slate-400 transition-all"
                                  placeholder="Ej: VNO-PROICON-MALB"
                                />
                                {!skuUserModified && sku && (
                                  <span className="flex items-center gap-1 text-[11px] text-violet-500/80">
                                    <Sparkles className="w-3 h-3" />
                                    generado automaticamente
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Código Universal</label>
                                <input
                                  type="text"
                                  value={codigoUniversal}
                                  onChange={(e) => setCodigoUniversal(e.target.value)}
                                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-mono text-sm placeholder:text-slate-400 transition-all"
                                  placeholder="Ej: 7790001234567"
                                />
                              </div>
                            </div>

                            <div className="border-t border-slate-100 my-4"></div>

                            {/* Media Section */}
                            <div>
                              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                                Media
                              </h3>
                              <div className="flex gap-3">
                                {/* Upload Button */}
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-blue-400/60 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                                >
                                  <Upload className="w-5 h-5 text-blue-400" />
                                  <span className="text-[10px] text-blue-400 font-medium">Seleccionar</span>
                                </button>

                                {/* Photo Thumbnails */}
                                <div className="flex gap-3 overflow-x-auto pb-1">
                                  {mediaPhotos.length === 0 ? (
                                    <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                      <span className="text-[10px] text-gray-400">Sin fotos</span>
                                    </div>
                                  ) : (
                                    mediaPhotos.map((photo, index) => (
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
                                          draggedPhotoIndex === index ? 'opacity-50 border-blue-400' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <img
                                          src={photo}
                                          alt={`Product photo ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />

                                        {/* Delete button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setMediaPhotos(mediaPhotos.filter((_, i) => i !== index))
                                          }}
                                          className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 cursor-pointer"
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
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 my-4"></div>

                            {/* Descripción Section */}
                            <div>
                              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                                Descripción
                              </h3>
                              {editingDescripcion ? (
                                <textarea
                                  value={descripcion}
                                  onChange={(e) => setDescripcion(e.target.value)}
                                  onBlur={() => setEditingDescripcion(false)}
                                  className="w-full min-h-[120px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm placeholder:text-slate-400 transition-all"
                                  placeholder="Agregar descripcion del producto..."
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingDescripcion(true)}
                                  className="w-full min-h-[120px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 cursor-text hover:border-slate-300 transition-colors text-sm"
                                >
                                  {descripcion || (
                                    <span className="text-slate-400">Click para agregar descripcion...</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(3)}
                              className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              disabled={isCreating}
                              onClick={() => {
                                setIsCreating(true)
                                try {
                                  // Generate unique SKU
                                  const existingSkus = items.map((item) => item.sku)
                                  const finalSku = generateUniqueSKU(sku, existingSkus)

                                  // Calculate stock values
                                  const stockTotal = parseInt(stockInicial) || 0
                                  const stockRes = parseInt(stockReservado) || 0
                                  const stockDisp = Math.max(0, stockTotal - stockRes)

                                  // Create new item object matching the useItems pattern
                                  const newItemId = generateId("STA")
                                  const newItem: Item = {
                                    id: newItemId,
                                    name: tituloFinal || titulo,
                                    sku: finalSku,
                                    codigoUniversal: codigoUniversal || "",
                                    marca: marca || "",
                                    modelo: "",
                                    categoria: categoria || "",
                                    formatoVenta: formatoVenta || "unidad",
                                    proveedor: proveedor || "",
                                    codigoProveedor: codigoProveedor || "",
                                    descripcion: descripcion || "",
                                    foto: mediaPhotos[0] || "",
                                    hasVariants: false,
                                    isAgrupador: false,
                                    variantCount: 0,
                                    itemCount: 0,
                                    stock: {
                                      total: stockTotal.toString(),
                                      reservado: stockRes.toString(),
                                      disponible: stockDisp.toString(),
                                    },
                                    atributosPrincipales: [],
                                    atributosInformativos: atributosInformativos,
                                    precio: {
                                      costo: parseFloat(costo) || 0,
                                      margen: parseFloat(margen) || 0,
                                      iva: parseFloat(iva) || 0,
                                      precioFinal: precioFinal,
                                    },
                                  }

                                  // Add to items and persist to localStorage
                                  // Filter out any invalid items to prevent corruption
                                  const validExistingItems = items.filter((item: any) => {
                                    if (!item || typeof item !== 'object') return false
                                    if (!item.id && !item.sku) return false
                                    if (!item.name || item.name.trim() === '') return false
                                    return true
                                  })
                                  const updatedItems = [newItem, ...validExistingItems]
                                  const storageKey = `stockio-items-${currentAccount}`
                                  localStorage.setItem(storageKey, JSON.stringify(updatedItems))
                                  setItems(updatedItems)
                                  
                                  // Store both ID (for navigation) and SKU (for display)
                                  setCreatedItemId(newItemId)
                                  setCreatedItemSkuDisplay(finalSku)
                                } catch (error) {
                                  console.error('Error creating item:', error)
                                  alert('Error al crear el item. Por favor intenta de nuevo.')
                                } finally {
                                  setIsCreating(false)
                                }
                              }}
                              className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCreating ? 'Creando...' : 'Crear Item'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Initial view - Type selection
  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
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
              <div className="flex items-center gap-3">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2 min-w-[280px] justify-end">
                {/* Future: navigation buttons */}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-auto">
            <div className="flex-1 flex flex-col items-center pt-12 px-8 pb-12">
              <div className="w-full max-w-2xl">
                {/* Page Title */}
                <h1 className="text-xl font-semibold text-gray-900 mb-6">Crear Nuevo Item</h1>

                {/* Title Section */}
                <div className="mb-8">
                  <Label htmlFor="titulo" className="text-base font-semibold text-gray-800 mb-2 block">
                    Titulo (obligatorio)
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        id="titulo"
                        type="text"
                        value={titulo}
                        onChange={handleTituloChange}
                        placeholder="Ingresa el titulo del item..."
                        className="pr-20 h-12 text-base"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className={`text-xs ${titulo.length >= MAX_TITLE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                          {titulo.length}/{MAX_TITLE_LENGTH}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isTituloValid ? (
                        <CheckCircle2 className="w-7 h-7 text-green-500" />
                      ) : (
                        <Asterisk className="w-7 h-7 text-red-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Type Selection Label */}
                <span className={`block text-sm font-medium mb-4 text-center transition-all duration-200 ${!isTituloValid ? 'text-gray-300 blur-[1px] opacity-50' : 'text-gray-700'}`}>
                  Selecciona el tipo de item
                </span>

                {/* Type Selection Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Item Individual Card */}
                  <button
                    onClick={() => handleTypeSelect("individual")}
                    disabled={!isTituloValid}
                    className={`
                      relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                      aspect-[4/5] min-h-[200px]
                      ${!isTituloValid 
                        ? 'border-gray-200 bg-gray-50 opacity-50 blur-[1px] cursor-not-allowed' 
                        : selectedType === 'individual'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-4
                      ${!isTituloValid 
                        ? 'bg-gray-100' 
                        : selectedType === 'individual'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }
                    `}>
                      <Package className={`w-8 h-8 ${!isTituloValid ? 'text-gray-300' : selectedType === 'individual' ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-base font-medium ${!isTituloValid ? 'text-gray-300' : selectedType === 'individual' ? 'text-blue-700' : 'text-gray-700'}`}>
                      Item Individual
                    </span>
                    <span className={`text-xs mt-2 text-center px-2 ${!isTituloValid ? 'text-gray-300' : 'text-gray-400'}`}>
                      Un producto unico sin variaciones de talle, color u otros atributos
                    </span>
                    {selectedType === 'individual' && isTituloValid && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                  </button>

                  {/* Item con Variantes Card */}
                  <button
                    onClick={() => handleTypeSelect("variantes")}
                    disabled={!isTituloValid}
                    className={`
                      relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                      aspect-[4/5] min-h-[200px]
                      ${!isTituloValid 
                        ? 'border-gray-200 bg-gray-50 opacity-50 blur-[1px] cursor-not-allowed' 
                        : selectedType === 'variantes'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-4
                      ${!isTituloValid 
                        ? 'bg-gray-100' 
                        : selectedType === 'variantes'
                          ? 'bg-purple-100'
                          : 'bg-gray-100'
                      }
                    `}>
                      <Grid className={`w-8 h-8 ${!isTituloValid ? 'text-gray-300' : selectedType === 'variantes' ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-base font-medium ${!isTituloValid ? 'text-gray-300' : selectedType === 'variantes' ? 'text-purple-700' : 'text-gray-700'}`}>
                      Item con Variantes
                    </span>
                    <span className={`text-xs mt-2 text-center px-2 ${!isTituloValid ? 'text-gray-300' : 'text-gray-400'}`}>
                      Un producto con multiples variaciones como talle, color, o material
                    </span>
                    {selectedType === 'variantes' && isTituloValid && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
