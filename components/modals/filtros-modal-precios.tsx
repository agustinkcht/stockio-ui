"use client"

import { useState, forwardRef, type Dispatch, type SetStateAction } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FilterConfig, ItemTipo } from "@/lib/types"

interface FiltrosModalPreciosProps {
  onClose: () => void
  activeFilters: FilterConfig
  setActiveFilters: Dispatch<SetStateAction<FilterConfig>>
  availableCategorias: string[]
  availableMarcas: string[]
  availableProveedores: string[]
  availableDepositos: string[]
}

const TIPO_OPTIONS: { value: ItemTipo; label: string }[] = [
  { value: "individual", label: "Item Individual" },
  { value: "variantes", label: "Item con Variantes" },
  { value: "agrupador", label: "Agrupador" },
]

const DEFAULT_FILTERS: FilterConfig = {
  tipos: [],
  categorias: [],
  marcas: [],
  proveedores: [],
  stock: [],
  depositos: [],
}

export const FiltrosModalPrecios = forwardRef<HTMLDivElement, FiltrosModalPreciosProps>(
  (
    {
      onClose,
      activeFilters,
      setActiveFilters,
      availableCategorias,
      availableMarcas,
      availableProveedores,
      availableDepositos,
    },
    ref
  ) => {
    const [filters, setFilters] = useState<FilterConfig>(activeFilters || DEFAULT_FILTERS)
    const [categoriaInput, setCategoriaInput] = useState("")
    const [marcaInput, setMarcaInput] = useState("")
    const [proveedorInput, setProveedorInput] = useState("")
    const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false)
    const [showMarcaDropdown, setShowMarcaDropdown] = useState(false)
    const [showProveedorDropdown, setShowProveedorDropdown] = useState(false)

    const toggleTipo = (tipo: ItemTipo) => {
      setFilters((prev) => ({
        ...prev,
        tipos: prev.tipos.includes(tipo) ? prev.tipos.filter((t) => t !== tipo) : [...prev.tipos, tipo],
      }))
    }

    const addCategoria = (categoria: string) => {
      if (categoria && !filters.categorias.includes(categoria)) {
        setFilters((prev) => ({ ...prev, categorias: [...prev.categorias, categoria] }))
        setCategoriaInput("")
        setShowCategoriaDropdown(false)
      }
    }

    const removeCategoria = (categoria: string) => {
      setFilters((prev) => ({ ...prev, categorias: prev.categorias.filter((c) => c !== categoria) }))
    }

    const addMarca = (marca: string) => {
      if (marca && !filters.marcas.includes(marca)) {
        setFilters((prev) => ({ ...prev, marcas: [...prev.marcas, marca] }))
        setMarcaInput("")
        setShowMarcaDropdown(false)
      }
    }

    const removeMarca = (marca: string) => {
      setFilters((prev) => ({ ...prev, marcas: prev.marcas.filter((m) => m !== marca) }))
    }

    const addProveedor = (proveedor: string) => {
      if (proveedor && !filters.proveedores.includes(proveedor)) {
        setFilters((prev) => ({ ...prev, proveedores: [...prev.proveedores, proveedor] }))
        setProveedorInput("")
        setShowProveedorDropdown(false)
      }
    }

    const removeProveedor = (proveedor: string) => {
      setFilters((prev) => ({ ...prev, proveedores: prev.proveedores.filter((p) => p !== proveedor) }))
    }

    const handleApply = () => {
      setActiveFilters(filters)
      onClose()
    }

    const handleReset = () => {
      setFilters(DEFAULT_FILTERS)
      setCategoriaInput("")
      setMarcaInput("")
      setProveedorInput("")
    }

    const filteredCategorias = availableCategorias.filter(
      (cat) => cat.toLowerCase().includes(categoriaInput.toLowerCase()) && !filters.categorias.includes(cat),
    )

    const filteredMarcas = availableMarcas.filter(
      (marca) => marca.toLowerCase().includes(marcaInput.toLowerCase()) && !filters.marcas.includes(marca),
    )

    const filteredProveedores = availableProveedores.filter(
      (proveedor) => proveedor.toLowerCase().includes(proveedorInput.toLowerCase()) && !filters.proveedores.includes(proveedor),
    )

    const hasActiveFilters =
      filters.tipos.length > 0 ||
      filters.categorias.length > 0 ||
      filters.marcas.length > 0 ||
      filters.proveedores.length > 0

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div ref={ref} className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filtrar Lista de Precios</h2>
              <p className="text-sm text-gray-500 mt-0.5">Aplica filtros para refinar la lista de precios</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Item</label>
              <div className="flex flex-wrap gap-2">
                {TIPO_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleTipo(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      filters.tipos.includes(option.value)
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proveedor */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Proveedor</label>
              {filters.proveedores.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.proveedores.map((proveedor) => (
                    <span
                      key={proveedor}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      {proveedor}
                      <button onClick={() => removeProveedor(proveedor)} className="hover:text-blue-900">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={proveedorInput}
                  onChange={(e) => {
                    setProveedorInput(e.target.value)
                    setShowProveedorDropdown(true)
                  }}
                  onFocus={() => setShowProveedorDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && proveedorInput.trim()) {
                      addProveedor(proveedorInput.trim())
                    }
                  }}
                  placeholder="Escribe o selecciona un proveedor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showProveedorDropdown && filteredProveedores.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredProveedores.map((proveedor) => (
                      <button
                        key={proveedor}
                        onClick={() => addProveedor(proveedor)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                      >
                        {proveedor}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Marca */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Marca</label>
              {filters.marcas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.marcas.map((marca) => (
                    <span
                      key={marca}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      {marca}
                      <button onClick={() => removeMarca(marca)} className="hover:text-blue-900">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={marcaInput}
                  onChange={(e) => {
                    setMarcaInput(e.target.value)
                    setShowMarcaDropdown(true)
                  }}
                  onFocus={() => setShowMarcaDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && marcaInput.trim()) {
                      addMarca(marcaInput.trim())
                    }
                  }}
                  placeholder="Escribe o selecciona una marca..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showMarcaDropdown && filteredMarcas.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredMarcas.map((marca) => (
                      <button
                        key={marca}
                        onClick={() => addMarca(marca)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                      >
                        {marca}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Categoría</label>
              {filters.categorias.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.categorias.map((categoria) => (
                    <span
                      key={categoria}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      {categoria}
                      <button onClick={() => removeCategoria(categoria)} className="hover:text-blue-900">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={categoriaInput}
                  onChange={(e) => {
                    setCategoriaInput(e.target.value)
                    setShowCategoriaDropdown(true)
                  }}
                  onFocus={() => setShowCategoriaDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && categoriaInput.trim()) {
                      addCategoria(categoriaInput.trim())
                    }
                  }}
                  placeholder="Escribe o selecciona una categoría..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showCategoriaDropdown && filteredCategorias.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCategorias.map((categoria) => (
                      <button
                        key={categoria}
                        onClick={() => addCategoria(categoria)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                      >
                        {categoria}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Filtros activos:</strong> Filtros aplicados a la lista de precios
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <Button variant="ghost" onClick={handleReset} className="text-sm">
              Limpiar Filtros
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white">
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
