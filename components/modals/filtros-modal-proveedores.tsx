"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { FiltrosProveedores } from "@/lib/types"
import type { Proveedor } from "@/lib/data/proveedores"

interface FiltrosModalProveedoresProps {
  filtros: FiltrosProveedores
  onApplyFiltros: (filtros: FiltrosProveedores) => void
  proveedores: Proveedor[]
}

export const FiltrosModalProveedores = forwardRef<{ openModal: () => void }, FiltrosModalProveedoresProps>(
  ({ filtros, onApplyFiltros, proveedores }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [localFiltros, setLocalFiltros] = useState<FiltrosProveedores>(filtros)

    useImperativeHandle(ref, () => ({
      openModal: () => setIsOpen(true),
    }))

    const handleApply = () => {
      onApplyFiltros(localFiltros)
      setIsOpen(false)
    }

    const handleClear = () => {
      setLocalFiltros({})
      onApplyFiltros({})
      setIsOpen(false)
    }

    // Get unique values from proveedores
    const uniqueCiudades = Array.from(new Set(proveedores.map((p) => p.ciudad).filter(Boolean))) as string[]
    const condicionesIva = ["Consumidor Final", "Responsable Inscripto", "Monotributista", "Exento"]

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Filtros</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Tipo */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Tipo</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tipo-particular"
                    checked={localFiltros.tipo === "particular"}
                    onCheckedChange={(checked) => {
                      setLocalFiltros((prev) => ({
                        ...prev,
                        tipo: checked ? "particular" : prev.tipo === "empresa" ? "empresa" : undefined,
                      }))
                    }}
                  />
                  <Label htmlFor="tipo-particular" className="text-sm cursor-pointer">
                    Particular
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tipo-empresa"
                    checked={localFiltros.tipo === "empresa"}
                    onCheckedChange={(checked) => {
                      setLocalFiltros((prev) => ({
                        ...prev,
                        tipo: checked ? "empresa" : prev.tipo === "particular" ? "particular" : undefined,
                      }))
                    }}
                  />
                  <Label htmlFor="tipo-empresa" className="text-sm cursor-pointer">
                    Empresa
                  </Label>
                </div>
              </div>
            </div>

            {/* Condición IVA */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Condición IVA</h3>
              <div className="space-y-2">
                {condicionesIva.map((condicion) => (
                  <div key={condicion} className="flex items-center gap-2">
                    <Checkbox
                      id={`condicion-${condicion}`}
                      checked={localFiltros.condicionIva === condicion}
                      onCheckedChange={(checked) => {
                        setLocalFiltros((prev) => ({
                          ...prev,
                          condicionIva: checked ? condicion : undefined,
                        }))
                      }}
                    />
                    <Label htmlFor={`condicion-${condicion}`} className="text-sm cursor-pointer">
                      {condicion}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Ciudad */}
            {uniqueCiudades.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Ciudad</h3>
                <div className="space-y-2">
                  {uniqueCiudades.map((ciudad) => (
                    <div key={ciudad} className="flex items-center gap-2">
                      <Checkbox
                        id={`ciudad-${ciudad}`}
                        checked={localFiltros.ciudad === ciudad}
                        onCheckedChange={(checked) => {
                          setLocalFiltros((prev) => ({
                            ...prev,
                            ciudad: checked ? ciudad : undefined,
                          }))
                        }}
                      />
                      <Label htmlFor={`ciudad-${ciudad}`} className="text-sm cursor-pointer">
                        {ciudad}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 p-4 border-t">
            <Button variant="ghost" onClick={handleClear}>
              Limpiar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </div>
      </div>
    )
  },
)

FiltrosModalProveedores.displayName = "FiltrosModalProveedores"
