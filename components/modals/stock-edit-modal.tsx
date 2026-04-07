"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, X } from "lucide-react"

interface StockEditModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (total: number, reservado: number) => void
  initialTotal: number
  initialReservado: number
  itemName?: string
}

export function StockEditModal({
  isOpen,
  onClose,
  onAccept,
  initialTotal,
  initialReservado,
  itemName,
}: StockEditModalProps) {
  const [total, setTotal] = useState(initialTotal)
  const [reservado, setReservado] = useState(initialReservado)
  const [operation, setOperation] = useState<"add" | "remove" | "set">("add")
  const [inputValue, setInputValue] = useState("")
  const [activeField, setActiveField] = useState<"total" | "reservado">("total")

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTotal(initialTotal)
      setReservado(initialReservado)
      setOperation("add")
      setInputValue("")
      setActiveField("total")
    }
  }, [isOpen, initialTotal, initialReservado])

  const disponible = total - reservado
  const hasChanges = total !== initialTotal || reservado !== initialReservado

  // Validation helpers
  const validateTotal = (value: number): number => {
    // Cannot be negative, cannot go below reservado
    return Math.max(reservado, Math.max(0, value))
  }

  const validateReservado = (value: number): number => {
    // Cannot be negative, cannot exceed total
    return Math.min(total, Math.max(0, value))
  }

  const handleIncrement = (field: "total" | "reservado", delta: number) => {
    if (field === "total") {
      setTotal(validateTotal(total + delta))
    } else {
      setReservado(validateReservado(reservado + delta))
    }
  }

  const applyOperation = () => {
    const value = parseInt(inputValue) || 0
    if (value <= 0) return

    let newValue: number
    const currentValue = activeField === "total" ? total : reservado

    if (operation === "add") {
      newValue = currentValue + value
    } else if (operation === "remove") {
      newValue = currentValue - value
    } else {
      newValue = value
    }

    if (activeField === "total") {
      setTotal(validateTotal(newValue))
    } else {
      setReservado(validateReservado(newValue))
    }
    setInputValue("")
  }

  const handleAccept = () => {
    onAccept(total, reservado)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/50">
          <div>
            <h3 className="text-sm font-medium text-slate-200">Editar Stock</h3>
            {itemName && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{itemName}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Total Row */}
          <div 
            className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
              activeField === "total" 
                ? "bg-slate-800/80 ring-1 ring-slate-700" 
                : "bg-slate-900/50 hover:bg-slate-800/50"
            }`}
            onClick={() => setActiveField("total")}
          >
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleIncrement("total", -1) }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-slate-300" />
              </button>
              <span className={`text-xl font-semibold tabular-nums min-w-[3rem] text-center ${
                total !== initialTotal ? "text-cyan-400" : "text-slate-100"
              }`}>
                {total}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleIncrement("total", 1) }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Reservado Row */}
          <div 
            className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
              activeField === "reservado" 
                ? "bg-slate-800/80 ring-1 ring-slate-700" 
                : "bg-slate-900/50 hover:bg-slate-800/50"
            }`}
            onClick={() => setActiveField("reservado")}
          >
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reservado</span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleIncrement("reservado", -1) }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-slate-300" />
              </button>
              <span className={`text-xl font-semibold tabular-nums min-w-[3rem] text-center ${
                reservado !== initialReservado ? "text-cyan-400" : "text-slate-100"
              }`}>
                {reservado}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleIncrement("reservado", 1) }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Quick operation row */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as "add" | "remove" | "set")}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            >
              <option value="add">Agregar</option>
              <option value="remove">Remover</option>
              <option value="set">Fijar en</option>
            </select>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyOperation()}
              className="flex-1 text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-center tabular-nums placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
            <span className="text-xs text-slate-500">a</span>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              activeField === "total" ? "bg-slate-700 text-slate-300" : "bg-slate-800 text-slate-400"
            }`}>
              {activeField === "total" ? "Total" : "Reservado"}
            </span>
            <button
              onClick={applyOperation}
              disabled={!inputValue || parseInt(inputValue) <= 0}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                inputValue && parseInt(inputValue) > 0
                  ? "bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              Aplicar
            </button>
          </div>

          {/* Disponible display */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${
            disponible > 0 
              ? "bg-emerald-950/50 border border-emerald-800/50" 
              : disponible === 0
                ? "bg-amber-950/50 border border-amber-800/50"
                : "bg-red-950/50 border border-red-800/50"
          }`}>
            <span className={`text-xs font-medium uppercase tracking-wider ${
              disponible > 0 ? "text-emerald-400" : disponible === 0 ? "text-amber-400" : "text-red-400"
            }`}>
              Disponible
            </span>
            <span className={`text-2xl font-bold tabular-nums ${
              disponible > 0 ? "text-emerald-400" : disponible === 0 ? "text-amber-400" : "text-red-400"
            }`}>
              {disponible}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800/50 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleAccept}
            disabled={!hasChanges}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              hasChanges
                ? "bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
