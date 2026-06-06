"use client"

import type React from "react"
import { useState } from "react"
import { X, ChevronDown } from "lucide-react"

interface BulkPriceModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (operation: string, value: number, unit: string) => void
  itemCount: number
  title: string
  type: "costo" | "precioFinal" | "margen" | "iva"
}

const IVA_OPTIONS = [
  { value: 0, label: "0%" },
  { value: 10.5, label: "10.5%" },
  { value: 21, label: "21%" },
  { value: 27, label: "27%" },
]

export function BulkPriceModal({ isOpen, onClose, onApply, itemCount, title, type }: BulkPriceModalProps) {
  const [operation, setOperation] = useState<string>(type === "margen" ? "aumentar" : "aumentar")
  const [value, setValue] = useState<string>("")
  const [unit, setUnit] = useState<string>(type === "costo" || type === "precioFinal" ? "$" : "%")
  const [selectedIva, setSelectedIva] = useState<number>(21)
  const [operationDropdownOpen, setOperationDropdownOpen] = useState(false)
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false)
  const [ivaDropdownOpen, setIvaDropdownOpen] = useState(false)

  const resetForm = () => {
    setOperation(type === "margen" ? "aumentar" : "aumentar")
    setValue("")
    setUnit(type === "costo" || type === "precioFinal" ? "$" : "%")
    setSelectedIva(21)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (type === "iva") {
      onApply("reemplazar", selectedIva, "%")
    } else {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        onApply(operation, numValue, unit)
      }
    }
    resetForm()
  }

  const getOperationOptions = () => {
    if (type === "costo" || type === "precioFinal") {
      return [
        { value: "aumentar", label: "Aumentar" },
        { value: "reducir", label: "Reducir" },
        { value: "fijar_en", label: "Fijar en" },
      ]
    }
    // margen
    return [
      { value: "aumentar", label: "Aumentar" },
      { value: "reducir", label: "Reducir" },
      { value: "fijar_en", label: "Fijar en" },
    ]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title.replace("x", String(itemCount))}</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 min-h-[180px]">
            {type === "iva" ? (
              /* IVA Selector */
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Seleccionar IVA</label>
                <button
                  type="button"
                  onClick={() => setIvaDropdownOpen(!ivaDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg text-sm bg-white hover:border-muted-foreground/50 transition-colors"
                >
                  <span className="font-medium">{selectedIva}%</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${ivaDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {ivaDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg py-1 z-20">
                    {IVA_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedIva(opt.value)
                          setIvaDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${
                          selectedIva === opt.value ? "bg-primary/5 text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Costo, Precio Final, Margen Controls */
              <div className="flex items-end gap-3">
                {/* Operation Selector */}
                <div className="relative flex-1">
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">Operación</label>
                  <button
                    type="button"
                    onClick={() => setOperationDropdownOpen(!operationDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg text-sm bg-white hover:border-muted-foreground/50 transition-colors"
                  >
                    <span className="font-medium capitalize">{operation}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${operationDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {operationDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg py-1 z-20">
                      {getOperationOptions().map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setOperation(opt.value)
                            setOperationDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${
                            operation === opt.value ? "bg-primary/5 text-primary font-medium" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Value Input */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Unit Selector (only for costo and precioFinal) */}
                {(type === "costo" || type === "precioFinal") && (
                  <div className="relative w-24">
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Unidad</label>
                    <button
                      type="button"
                      onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg text-sm bg-white hover:border-muted-foreground/50 transition-colors"
                    >
                      <span className="font-medium">{unit}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${unitDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {unitDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg py-1 z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setUnit("%")
                            setUnitDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${
                            unit === "%" ? "bg-primary/5 text-primary font-medium" : "text-foreground"
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUnit("$")
                            setUnitDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${
                            unit === "$" ? "bg-primary/5 text-primary font-medium" : "text-foreground"
                          }`}
                        >
                          $
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* % sign for margen */}
                {type === "margen" && (
                  <div className="flex items-center justify-center w-12 h-[50px] text-sm font-medium text-muted-foreground">
                    %
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
