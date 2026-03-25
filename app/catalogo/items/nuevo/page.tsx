"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Package, Grid, Asterisk, Plus, X, Upload, Sparkles } from "lucide-react"
import { generateStandaloneSKU } from "@/lib/utils/sku-generator"
import { getCategoryImage } from "@/lib/utils/category-images"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

const MAX_TITLE_LENGTH = 60

const STEPS = [
  { id: 1, label: "Información del Item" },
  { id: 2, label: "Detalle del Item" },
  { id: 3, label: "Información Comercial" },
]

export default function NuevoItemPage() {
  const router = useRouter()
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
      // Scroll to steps section after a short delay for the state to update
      setTimeout(() => {
        stepsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
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
                    Paso {currentStep} de {STEPS.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content - Full Screen Steps View */}
            <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden" ref={stepsContainerRef}>
              {/* 20-column grid layout */}
              <div className="w-full h-full grid" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
                {/* Left Column - Steps Indicator (3 cols) */}
                <div className="col-span-3 border-r border-gray-200 bg-white p-6 flex flex-col">
                  <div className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Creando Item Individual</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{titulo}</p>
                  </div>
                  
                  <div className="flex flex-col">
                    {STEPS.map((step, index) => (
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
                          {index < STEPS.length - 1 && (
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

                {/* Right Column - Step Content (17 cols) */}
                <div className="col-span-17 overflow-auto p-8">
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
                    {currentStep === 3 && (
                      <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.1)]">
                        <div className="h-full flex flex-col py-2">
                          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                            Información Comercial
                          </h3>
                          <p className="text-[11px] text-slate-400 mb-6 italic">
                            Define precios y stock del item.
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
                                // TODO: Create item with all collected data
                                console.log("Creating item with:", {
                                  titulo,
                                  tipo: "individual",
                                  // Step 1 data
                                  categoria,
                                  marca,
                                  formatoVenta,
                                  unidadesPorPack,
                                  volumenActive,
                                  volumenCantidad,
                                  volumenUnidad,
                                  vencimientoActive,
                                  fechaVencimiento,
                                  atributosInformativos,
                                  // Step 2 data
                                  sku,
                                  codigoUniversal,
                                  mediaPhotos,
                                  descripcion,
                                })
                                router.push("/catalogo/items")
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
