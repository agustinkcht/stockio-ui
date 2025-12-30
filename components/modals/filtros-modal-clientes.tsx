"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ClienteFilterConfig } from "@/lib/types"

interface FiltrosModalClientesProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: ClienteFilterConfig) => void
  initialFilters: ClienteFilterConfig
  availableCondiciones: string[]
  availableCiudades: string[]
}

export function FiltrosModalClientes({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  availableCondiciones,
  availableCiudades,
}: FiltrosModalClientesProps) {
  const [localFilters, setLocalFilters] = useState<ClienteFilterConfig>(initialFilters)

  useEffect(() => {
    setLocalFilters(initialFilters)
  }, [initialFilters])

  if (!isOpen) return null

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleReset = () => {
    const emptyFilters: ClienteFilterConfig = {
      tipos: [],
      condicionesIva: [],
      ciudades: [],
    }
    setLocalFilters(emptyFilters)
  }

  const toggleTipo = (tipo: "particular" | "empresa") => {
    setLocalFilters((prev) => ({
      ...prev,
      tipos: prev.tipos.includes(tipo) ? prev.tipos.filter((t) => t !== tipo) : [...prev.tipos, tipo],
    }))
  }

  const toggleCondicion = (condicion: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      condicionesIva: prev.condicionesIva.includes(condicion)
        ? prev.condicionesIva.filter((c) => c !== condicion)
        : [...prev.condicionesIva, condicion],
    }))
  }

  const toggleCiudad = (ciudad: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      ciudades: prev.ciudades.includes(ciudad) ? prev.ciudades.filter((c) => c !== ciudad) : [...prev.ciudades, ciudad],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100000]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tipo de Cliente */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tipo de Cliente</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.tipos.includes("particular")}
                  onChange={() => toggleTipo("particular")}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Particulares</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.tipos.includes("empresa")}
                  onChange={() => toggleTipo("empresa")}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Empresas</span>
              </label>
            </div>
          </div>

          {/* Condición IVA */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Condición IVA</h3>
            <div className="space-y-2">
              {availableCondiciones.map((condicion) => (
                <label key={condicion} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.condicionesIva.includes(condicion)}
                    onChange={() => toggleCondicion(condicion)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{condicion}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ciudad */}
          {availableCiudades.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Ciudad</h3>
              <div className="space-y-2">
                {availableCiudades.map((ciudad) => (
                  <label key={ciudad} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.ciudades.includes(ciudad)}
                      onChange={() => toggleCiudad(ciudad)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{ciudad}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button variant="ghost" onClick={handleReset} className="text-sm">
            Limpiar filtros
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="text-sm bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleApply} className="text-sm">
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
