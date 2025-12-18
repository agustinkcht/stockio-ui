"use client"

import { useState } from "react"
import { X, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SortFactorConfig, SortFactor, SortDirection } from "@/lib/types"

interface OrdenModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (priorities: SortFactorConfig[]) => void
  initialPriorities?: SortFactorConfig[]
}

const FACTOR_LABELS: Record<SortFactor, string> = {
  titulo: "Título",
  categoria: "Categoría",
  marca: "Marca",
  fecha: "Fecha de Creación",
  stock: "Stock",
}

const DIRECTION_OPTIONS: Record<SortFactor, { label: string; value: SortDirection; description: string }[]> = {
  titulo: [
    { label: "A-Z", value: "asc", description: "Alfabético" },
    { label: "Z-A", value: "desc", description: "Alfabético inverso" },
  ],
  categoria: [
    { label: "A-Z", value: "asc", description: "Alfabético" },
    { label: "Z-A", value: "desc", description: "Alfabético inverso" },
  ],
  marca: [
    { label: "A-Z", value: "asc", description: "Alfabético" },
    { label: "Z-A", value: "desc", description: "Alfabético inverso" },
  ],
  fecha: [
    { label: "Más recientes", value: "desc", description: "Recientes primero" },
    { label: "Menos recientes", value: "asc", description: "Antiguos primero" },
  ],
  stock: [
    { label: "Mayor cantidad", value: "desc", description: "Mayor stock primero" },
    { label: "Menor cantidad", value: "asc", description: "Menor stock primero" },
  ],
}

const DEFAULT_PRIORITIES: SortFactorConfig[] = [{ factor: "fecha", direction: "desc" }]

export function OrdenModal({ isOpen, onClose, onApply, initialPriorities }: OrdenModalProps) {
  const [priorities, setPriorities] = useState<SortFactorConfig[]>(initialPriorities || DEFAULT_PRIORITIES)

  if (!isOpen) return null

  const activeFactor = new Set(priorities.map((p) => p.factor))
  const inactiveFactors: SortFactor[] = (Object.keys(FACTOR_LABELS) as SortFactor[]).filter(
    (factor) => !activeFactor.has(factor),
  )

  const movePriorityUp = (index: number) => {
    if (index === 0) return
    const newPriorities = [...priorities]
    ;[newPriorities[index - 1], newPriorities[index]] = [newPriorities[index], newPriorities[index - 1]]
    setPriorities(newPriorities)
  }

  const movePriorityDown = (index: number) => {
    if (index === priorities.length - 1) return
    const newPriorities = [...priorities]
    ;[newPriorities[index], newPriorities[index + 1]] = [newPriorities[index + 1], newPriorities[index]]
    setPriorities(newPriorities)
  }

  const removeFactor = (index: number) => {
    const newPriorities = priorities.filter((_, i) => i !== index)
    setPriorities(newPriorities)
  }

  const addFactor = (factor: SortFactor) => {
    const defaultDirection = factor === "fecha" || factor === "stock" ? "desc" : "asc"
    setPriorities([...priorities, { factor, direction: defaultDirection }])
  }

  const handleApply = () => {
    onApply(priorities)
    onClose()
  }

  const handleReset = () => {
    setPriorities(DEFAULT_PRIORITIES)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configurar Orden</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Establece el orden de prioridad de los factores para ordenar los artículos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {priorities.map((priority, index) => {
              const directionOptions = DIRECTION_OPTIONS[priority.factor]
              const currentOption = directionOptions.find((opt) => opt.value === priority.direction)

              return (
                <div
                  key={priority.factor}
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => movePriorityUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                      }`}
                      title="Subir prioridad"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => movePriorityDown(index)}
                      disabled={index === priorities.length - 1}
                      className={`p-1 rounded transition-colors ${
                        index === priorities.length - 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                      }`}
                      title="Bajar prioridad"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Priority number */}
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 font-semibold text-sm rounded">
                    {index + 1}
                  </div>

                  {/* Factor label */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{FACTOR_LABELS[priority.factor]}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{currentOption?.description}</div>
                  </div>

                  {/* Direction toggle */}
                  <div className="flex gap-1">
                    {directionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          const newPriorities = [...priorities]
                          newPriorities[index].direction = option.value
                          setPriorities(newPriorities)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                          priority.direction === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => removeFactor(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                    title="Eliminar factor"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {inactiveFactors.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Factores disponibles:</div>
              <div className="flex flex-wrap gap-2">
                {inactiveFactors.map((factor) => (
                  <button
                    key={factor}
                    onClick={() => addFactor(factor)}
                    className="px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-colors"
                  >
                    + {FACTOR_LABELS[factor]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Los factores en la parte superior tienen mayor prioridad. Los artículos se
              ordenarán primero por el factor #1, luego por #2, y así sucesivamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <Button variant="ghost" onClick={handleReset} className="text-sm">
            Restablecer
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
