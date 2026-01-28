"use client"

import type React from "react"
import { useState } from "react"
import { X, ChevronDown } from "lucide-react"

interface BulkStockModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (operation: string, value: number) => void
  itemCount: number
  type: "total" | "reservado"
}

export function BulkStockModal({ isOpen, onClose, onApply, itemCount, type }: BulkStockModalProps) {
  const [operation, setOperation] = useState<string>("aumentar")
  const [value, setValue] = useState<string>("")
  const [operationDropdownOpen, setOperationDropdownOpen] = useState(false)

  const resetForm = () => {
    setOperation("aumentar")
    setValue("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0) {
      onApply(operation, numValue)
    }
    resetForm()
  }

  const operationOptions = [
    { value: "aumentar", label: "Aumentar" },
    { value: "disminuir", label: "Disminuir" },
    { value: "sobreescribir", label: "Sobreescribir" },
  ]

  const title = type === "total" 
    ? `Modificar Stock Total de ${itemCount} items`
    : `Modificar Stock Reservado de ${itemCount} items`

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 min-h-[140px]">
            <div className="flex items-end gap-3">
              {/* Operation Selector */}
              <div className="relative flex-1">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Operación</label>
                <button
                  type="button"
                  onClick={() => setOperationDropdownOpen(!operationDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg text-sm bg-white hover:border-muted-foreground/50 transition-colors cursor-pointer"
                >
                  <span className="font-medium capitalize">{operation}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${operationDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {operationDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg py-1 z-20">
                    {operationOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setOperation(opt.value)
                          setOperationDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors cursor-pointer ${
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
                  step="1"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
