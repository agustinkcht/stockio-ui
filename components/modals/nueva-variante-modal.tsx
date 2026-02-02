"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"

interface NuevaVarianteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (attributeValues: Record<string, string>) => void
  containerAtributosPrincipales: Array<{ key: string; variantes: string[] }>
}

export function NuevaVarianteModal({
  isOpen,
  onClose,
  onSubmit,
  containerAtributosPrincipales,
}: NuevaVarianteModalProps) {
  // Initialize state with empty values for each attribute
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    containerAtributosPrincipales.forEach((attr) => {
      if (attr.key) initial[attr.key] = ""
    })
    return initial
  })

  const resetForm = () => {
    const reset: Record<string, string> = {}
    containerAtributosPrincipales.forEach((attr) => {
      if (attr.key) reset[attr.key] = ""
    })
    setAttributeValues(reset)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all attributes have values
    const allFilled = containerAtributosPrincipales.every(
      (attr) => attr.key && attributeValues[attr.key]?.trim()
    )
    
    if (!allFilled) {
      alert("Por favor, completa todos los atributos")
      return
    }
    
    onSubmit(attributeValues)
    handleClose()
  }

  const handleTagClick = (attributeKey: string, value: string) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attributeKey]: value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Crear Nueva Variante</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-5">
            {containerAtributosPrincipales.map((attr) => {
              if (!attr.key) return null
              
              return (
                <div key={attr.key}>
                  {/* Attribute Label */}
                  <label className="block text-sm font-medium mb-2 text-muted-foreground capitalize">
                    {attr.key}
                  </label>
                  
                  {/* Input Field */}
                  <input
                    type="text"
                    value={attributeValues[attr.key] || ""}
                    onChange={(e) =>
                      setAttributeValues((prev) => ({
                        ...prev,
                        [attr.key]: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder={`Ingrese ${attr.key}...`}
                    required
                  />
                  
                  {/* Existing Tags as Quick-Select Options */}
                  {attr.variantes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Opciones disponibles:</p>
                      <div className="flex flex-wrap gap-2">
                        {attr.variantes.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleTagClick(attr.key, value)}
                            className={`px-3 py-1.5 text-xs rounded-md border transition-all cursor-pointer ${
                              attributeValues[attr.key] === value
                                ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                : "bg-muted/50 border-border text-foreground hover:bg-muted hover:border-muted-foreground/50"
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
              Crear Variante
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
