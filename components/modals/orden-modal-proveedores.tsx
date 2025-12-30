"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { X, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OrdenProveedores, ProveedorSortFactor } from "@/lib/types"

interface OrdenModalProveedoresProps {
  orden: OrdenProveedores
  onApplyOrden: (orden: OrdenProveedores) => void
}

export const OrdenModalProveedores = forwardRef<{ openModal: () => void }, OrdenModalProveedoresProps>(
  ({ orden, onApplyOrden }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [localOrden, setLocalOrden] = useState<OrdenProveedores>(orden)

    useImperativeHandle(ref, () => ({
      openModal: () => setIsOpen(true),
    }))

    const handleApply = () => {
      onApplyOrden(localOrden)
      setIsOpen(false)
    }

    const sortFactors: { value: ProveedorSortFactor; label: string }[] = [
      { value: "nombre", label: "Nombre" },
      { value: "tipo", label: "Tipo" },
      { value: "condicionIva", label: "Condición IVA" },
      { value: "ciudad", label: "Ciudad" },
    ]

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Orden</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Ordenar por</h3>
              <div className="space-y-2">
                {sortFactors.map((factor) => (
                  <button
                    key={factor.value}
                    onClick={() => setLocalOrden({ factor: factor.value, direction: localOrden.direction })}
                    className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${
                      localOrden.factor === factor.value ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-sm">{factor.label}</span>
                    {localOrden.factor === factor.value && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setLocalOrden({
                            ...localOrden,
                            direction: localOrden.direction === "asc" ? "desc" : "asc",
                          })
                        }}
                        className="p-1 hover:bg-accent rounded"
                      >
                        {localOrden.direction === "asc" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </div>
      </div>
    )
  },
)

OrdenModalProveedores.displayName = "OrdenModalProveedores"
