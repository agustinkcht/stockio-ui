"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, Package, Grid, Asterisk, Plus, X, Upload, Sparkles, Pencil, ImageIcon } from "lucide-react"
import { generateStandaloneSKU, generateUniqueSKU } from "@/lib/utils/sku-generator"
import { getCategoryImage } from "@/lib/utils/category-images"
import { generateId } from "@/lib/utils/item-utils"
import { useItems } from "@/hooks/use-items"
import { useAccount } from "@/lib/contexts/account-context"
import type { Item } from "@/lib/types"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

const MAX_TITLE_LENGTH = 60

const STEPS_INDIVIDUAL = [
  { id: 1, label: "Información del Item" },
  { id: 2, label: "Detalle del Item" },
  { id: 3, label: "Información Comercial" },
]

const STEPS_VARIANTES = [
  { id: 1, label: "Información Compartida" },
  { id: 2, label: "Variantes" },
  { id: 3, label: "Información Comercial" },
]

export default function NuevoItemPage() {
  const router = useRouter()
  const { items, setItems } = useItems()
  const { currentAccount } = useAccount()
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

  // Validate title - must have actual content (not just spaces)
  const isTituloValid = useMemo(() => {
    return titulo.trim().length > 0
  }, [titulo])

  // Generate suggested SKU based on title and category
  const suggestedSku = useMemo(() => {
    if (!titulo.trim()) return ""
    return generateStandaloneSKU({
      category: categoria || undefined,
      title: titulo.trim(),
    })
  }, [titulo, categoria])

  // Initialize SKU with suggested value when it changes and user hasn't modified it
  useEffect(() => {
    if (suggestedSku && !skuUserModified) {
      setSku(suggestedSku)
    }
  }, [suggestedSku, skuUserModified])

  // Calculate precio final - if user manually set precioVenta, use that; otherwise calculate from costo/margen/iva
  const precioFinal = useMemo(() => {
    if (precioVenta !== "") {
      return parseFloat(precioVenta) || 0
    }
    const costoNum = parseFloat(costo) || 0
    const margenNum = parseFloat(margen) || 0
    const ivaNum = parseFloat(iva) || 0
    
    const precioConMargen = costoNum * (1 + margenNum / 100)
    const precioConIva = precioConMargen * (1 + ivaNum / 100)
    return precioConIva
  }, [costo, margen, iva, precioVenta])

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
                  {/* Step indicator in header */}
                  <span className="text-xs text-gray-500">
                    Paso {currentStep} de {STEPS_VARIANTES.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content - Full Screen Steps View */}
            <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden" ref={stepsContainerRef}>
              {/* 20-column grid layout */}
              <div className="w-full h-full grid" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
                {/* Left Column - Steps Indicator (4 cols) */}
                <div className="col-span-4 border-r border-gray-200 bg-white p-6 flex flex-col">
                  <div className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Creando Item con Variantes</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{titulo}</p>
                  </div>
                  
                  <div className="flex flex-col">
                    {STEPS_VARIANTES.map((step, index) => (
                      <div key={step.id} className="flex items-start">
                        {/* Vertical line and dot */}
                        <div className="flex flex-col items-center mr-3">
                          <div 
                            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                              currentStep === step.id 
                                ? 'bg-purple-500 border-purple-500 shadow-md shadow-purple-200' 
                                : currentStep > step.id
                                  ? 'bg-green-500 border-green-500'
                                  : 'bg-white border-gray-300'
                            }`}
                          />
                          {index < STEPS_VARIANTES.length - 1 && (
                            <div 
                              className={`w-0.5 h-16 transition-all duration-300 ${
                                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        {/* Step label */}
                        <div className="pb-16">
                          <button
                            onClick={() => setCurrentStep(step.id)}
                            className={`text-left transition-all duration-200 cursor-pointer ${
                              currentStep === step.id 
                                ? 'text-purple-600 font-semibold' 
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

                {/* Right Column - Step Content (16 cols) */}
                <div className="col-span-16 overflow-auto p-8">
                  <div className="max-w-3xl mx-auto">
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

                              {/* Vencimiento Section */}
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

                          {/* Atributos de Variantes section - 50% width */}
                          <div className="mb-6 pb-6 border-b border-gray-200 w-1/2">
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

                    {/* Step 3: Información Comercial - Placeholder for now */}
                    {currentStep === 3 && !createdItemId && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        <div className="h-full flex flex-col py-2">
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                            Información Comercial
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Define precios y stock de las variantes.
                          </p>

                          <div className="flex-1 flex items-center justify-center text-gray-400 min-h-[200px]">
                            Contenido del paso 3 (proximamente)
                          </div>

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(2)}
                              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              onClick={() => {
                                // Placeholder - will implement full creation later
                                alert("Creación de item con variantes (proximamente)")
                              }}
                              className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer"
                            >
                              Crear Item
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
                  {/* Step indicator in header */}
                  <span className="text-xs text-gray-500">
                    Paso {currentStep} de {STEPS_INDIVIDUAL.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content - Full Screen Steps View */}
            <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden" ref={stepsContainerRef}>
              {/* 20-column grid layout */}
              <div className="w-full h-full grid" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
                {/* Left Column - Steps Indicator (4 cols) */}
                <div className="col-span-4 border-r border-gray-200 bg-white p-6 flex flex-col">
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
                              className={`w-0.5 h-16 transition-all duration-300 ${
                                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        {/* Step label */}
                        <div className="pb-16">
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

                {/* Right Column - Step Content (16 cols) */}
                <div className="col-span-16 overflow-auto p-8">
                  <div className="max-w-3xl mx-auto">
                    {/* Step 1: Información del Item */}
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
                              Información del Producto
                            </h3>
                            <p className="text-[11px] text-slate-400 mb-3 italic">
                              Completa la información basica del item.
                            </p>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-gray-700">Categoría</label>
                                  <input
                                    type="text"
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900"
                                    placeholder="Ej: Vinos"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-gray-700">Marca</label>
                                  <input
                                    type="text"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900"
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
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white border-gray-300 text-gray-900 cursor-pointer"
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
                                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                                      volumenActive ? "bg-blue-500" : "bg-gray-300"
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
                                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900"
                                        placeholder="0"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <label className="text-sm font-medium text-gray-700">Unidad de medida</label>
                                      <select
                                        value={volumenUnidad}
                                        onChange={(e) => setVolumenUnidad(e.target.value)}
                                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white border-gray-300 text-gray-900 cursor-pointer"
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
                                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
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
                          </div>
                        )}

                        {/* Atributos Tab Content */}
                        {selectedDetailTab === "atributos" && (
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

                                  {atributosInformativos.map((attr, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      <div className="flex-1">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Atributo</label>
                                        <input
                                          type="text"
                                          value={attr.key}
                                          onChange={(e) => {
                                            const updated = [...atributosInformativos]
                                            updated[index].key = e.target.value
                                            setAtributosInformativos(updated)
                                          }}
                                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all text-slate-800 hover:border-slate-300"
                                          placeholder="Ej: Material"
                                        />
                                      </div>

                                      <div className="flex-1">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Valor</label>
                                        <input
                                          type="text"
                                          value={attr.value}
                                          onChange={(e) => {
                                            const updated = [...atributosInformativos]
                                            updated[index].value = e.target.value
                                            setAtributosInformativos(updated)
                                          }}
                                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-sm transition-all text-slate-800 hover:border-slate-300"
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
                                          className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
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

                        {/* Navigation buttons */}
                        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            Continuar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Detalle del Item */}
                    {currentStep === 2 && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        <div className="h-full flex flex-col py-2">
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                            Detalle del Item
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Agrega información adicional y atributos del item.
                          </p>

                          <div className="space-y-6">
                            {/* SKU and Codigo Universal */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">SKU</label>
                                <input
                                  type="text"
                                  value={sku}
                                  onChange={(e) => {
                                    setSku(e.target.value.toUpperCase())
                                    setSkuUserModified(e.target.value.toUpperCase() !== suggestedSku)
                                  }}
                                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 font-mono text-sm"
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
                                <label className="text-sm font-medium text-gray-700">Codigo Universal</label>
                                <input
                                  type="text"
                                  value={codigoUniversal}
                                  onChange={(e) => setCodigoUniversal(e.target.value)}
                                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 font-mono text-sm"
                                  placeholder="Ej: 7790001234567"
                                />
                              </div>
                            </div>

                            <div className="border-t border-gray-200 my-4"></div>

                            {/* Media Section */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
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

                            <div className="border-t border-gray-200 my-4"></div>

                            {/* Descripción Section */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                                Descripcion
                              </h3>
                              {editingDescripcion ? (
                                <textarea
                                  value={descripcion}
                                  onChange={(e) => setDescripcion(e.target.value)}
                                  onBlur={() => setEditingDescripcion(false)}
                                  className="w-full min-h-[120px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm placeholder:text-gray-400"
                                  placeholder="Agregar descripcion del producto..."
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingDescripcion(true)}
                                  className="w-full min-h-[120px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 cursor-text hover:bg-gray-100 transition-colors text-sm"
                                >
                                  {descripcion || (
                                    <span className="text-gray-400">Click para agregar descripcion...</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

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
                              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
                            >
                              Continuar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Información Comercial */}
                    {currentStep === 3 && !createdItemId && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        <div className="h-full flex flex-col py-2">
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                            Información Comercial
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Define precios y stock del item.
                          </p>

                          <div className="space-y-6">
                            {/* Precio Section - 60% width */}
                            <div className="w-[60%]">
                              <h4 className="text-sm font-medium text-gray-700 mb-4">Precio</h4>
                              
                              {/* Precio de Venta - Above and editable */}
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
                                <span className="text-xs font-medium text-green-700 uppercase tracking-wider">Precio de Venta</span>
                                {editingPrecioVenta ? (
                                  <div className="mt-1 flex items-center">
                                    <span className="text-3xl font-bold text-green-700 mr-1">$</span>
                                    <input
                                      type="number"
                                      value={precioVenta}
                                      onChange={(e) => setPrecioVenta(e.target.value)}
                                      onBlur={() => setEditingPrecioVenta(false)}
                                      onKeyDown={(e) => e.key === 'Enter' && setEditingPrecioVenta(false)}
                                      className="text-3xl font-bold text-green-700 bg-transparent border-none outline-none w-full"
                                      placeholder={precioFinal.toFixed(2)}
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    onClick={() => setEditingPrecioVenta(true)}
                                    className="mt-1 text-3xl font-bold text-green-700 cursor-pointer hover:opacity-80"
                                  >
                                    ${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">Costo</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                    <input
                                      type="number"
                                      value={costo}
                                      onChange={(e) => {
                                        setCosto(e.target.value)
                                        setPrecioVenta("") // Reset manual price when cost changes
                                      }}
                                      className="w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 text-sm"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">Margen</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={margen}
                                      onChange={(e) => {
                                        setMargen(e.target.value)
                                        setPrecioVenta("") // Reset manual price when margin changes
                                      }}
                                      className="w-full pl-3 pr-7 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 text-sm"
                                      placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">IVA</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={iva}
                                      onChange={(e) => {
                                        setIva(e.target.value)
                                        setPrecioVenta("") // Reset manual price when IVA changes
                                      }}
                                      className="w-full pl-3 pr-7 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 text-sm"
                                      placeholder="21"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 my-4"></div>

                            {/* Stock Section - 60% width */}
                            <div className="w-[60%]">
                              <h4 className="text-sm font-medium text-gray-700 mb-4">Stock</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">Inicial</label>
                                  <input
                                    type="number"
                                    value={stockInicial}
                                    onChange={(e) => setStockInicial(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 text-sm"
                                    placeholder="0"
                                    min="0"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">Reservado</label>
                                  <input
                                    type="number"
                                    value={stockReservado}
                                    onChange={(e) => setStockReservado(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 text-sm"
                                    placeholder="0"
                                    min="0"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">Disponible</label>
                                  <div className="px-3 py-2 border rounded-lg bg-blue-50 border-blue-200 text-blue-700 text-sm font-semibold">
                                    {stockDisponible}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 my-4"></div>

                            {/* Información del Proveedor Section */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-4">Información del Proveedor</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">Proveedor</label>
                                  <input
                                    type="text"
                                    value={proveedor}
                                    onChange={(e) => setProveedor(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 text-sm"
                                    placeholder="Nombre del proveedor"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-600">Codigo Proveedor</label>
                                  <input
                                    type="text"
                                    value={codigoProveedor}
                                    onChange={(e) => setCodigoProveedor(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-gray-900 text-sm"
                                    placeholder="Codigo del proveedor"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Navigation buttons */}
                          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
                            <button
                              onClick={() => setCurrentStep(2)}
                              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
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
                                    name: titulo,
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
                                  const updatedItems = [newItem, ...items]
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
