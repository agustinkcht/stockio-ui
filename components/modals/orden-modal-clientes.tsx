"use client"

import { useState, useEffect } from "react"
import { X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ClienteSortFactorConfig, ClienteSortFactor, SortDirection } from "@/lib/types"

interface OrdenModalClientesProps {
  isOpen: boolean
  onClose: () => void
  onApply: (config: ClienteSortFactorConfig[]) => void
  initialPriorities: ClienteSortFactorConfig[]
}

const SORT_FACTORS: { value: ClienteSortFactor; label: string }[] = [
  { value: "nombre", label: "Nombre" },
  { value: "tipo", label: "Tipo" },
  { value: "condicionIva", label: "Condición IVA" },
  { value: "ciudad", label: "Ciudad" },
]

export function OrdenModalClientes({ isOpen, onClose, onApply, initialPriorities }: OrdenModalClientesProps) {
  const [priorities, setPriorities] = useState<ClienteSortFactorConfig[]>(initialPriorities)

  useEffect(() => {
    setPriorities(initialPriorities)
  }, [initialPriorities])

  if (!isOpen) return null

  const handleApply = () => {
    onApply(priorities)
    onClose()
  }

  const handleReset = () => {
    setPriorities([{ factor: "nombre", direction: "asc" }])
  }

  const addPriority = () => {
    const usedFactors = priorities.map((p) => p.factor)
    const availableFactors = SORT_FACTORS.filter((f) => !usedFactors.includes(f.value))
    if (availableFactors.length > 0) {
      setPriorities([...priorities, { factor: availableFactors[0].value, direction: "asc" }])
    }
  }

  const removePriority = (index: number) => {
    setPriorities(priorities.filter((_, i) => i !== index))
  }

  const updateFactor = (index: number, factor: ClienteSortFactor) => {
    const newPriorities = [...priorities]
    newPriorities[index].factor = factor
    setPriorities(newPriorities)
  }

  const toggleDirection = (index: number) => {
    const newPriorities = [...priorities]
    newPriorities[index].direction = newPriorities[index].direction === "asc" ? "desc" : "asc"
    setPriorities(newPriorities)
  }

  const getDirectionLabel = (factor: ClienteSortFactor, direction: SortDirection) => {
    if (factor === "nombre" || factor === "ciudad") {
      return direction === "asc" ? "A → Z" : "Z → A"
    }
    return direction === "asc" ? "Ascendente" : "Descendente"
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100000]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ordenar por</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {priorities.map((priority, index) => {
            const usedFactors = priorities.map((p) => p.factor)
            const availableFactors = SORT_FACTORS.filter(
              (f) => f.value === priority.factor || !usedFactors.includes(f.value),
            )

            return (
              <div key={index} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <select
                  value={priority.factor}
                  onChange={(e) => updateFactor(index, e.target.value as ClienteSortFactor)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {availableFactors.map((factor) => (
                    <option key={factor.value} value={factor.value}>
                      {factor.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => toggleDirection(index)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors min-w-[100px]"
                >
                  {getDirectionLabel(priority.factor, priority.direction)}
                </button>
                {priorities.length > 1 && (
                  <button
                    onClick={() => removePriority(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}

          {priorities.length < SORT_FACTORS.length && (
            <button
              onClick={addPriority}
              className="w-full py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              + Agregar criterio
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button variant="ghost" onClick={handleReset} className="text-sm">
            Restablecer
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
