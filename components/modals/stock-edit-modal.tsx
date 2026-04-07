"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, Check, X } from "lucide-react"

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
  const [activeField, setActiveField] = useState<"total" | "reservado" | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTotal(initialTotal)
      setReservado(initialReservado)
      setOperation("add")
      setInputValue("")
      setActiveField(null)
    }
  }, [isOpen, initialTotal, initialReservado])

  const disponible = total - reservado
  const hasChanges = total !== initialTotal || reservado !== initialReservado

  // Validation helpers
  const validateTotal = (value: number): number => {
    return Math.max(reservado, Math.max(0, value))
  }

  const validateReservado = (value: number): number => {
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
    if (!activeField) return
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

  const isAdvancedActive = activeField !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Editar Stock</h3>
            {itemName && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{itemName}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Stock fields */}
          <div className="space-y-3">
            {/* Total Row */}
            <div 
              className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                activeField === "total" 
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" 
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
              }`}
              onClick={() => setActiveField(activeField === "total" ? null : "total")}
            >
              <span className={`text-xs font-medium uppercase tracking-wider ${
                activeField === "total" ? "text-blue-600" : "text-slate-500"
              }`}>Total</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleIncrement("total", -1) }}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3 h-3 text-slate-600" />
                </button>
                <span className={`text-lg font-semibold tabular-nums min-w-[2.5rem] text-center ${
                  total !== initialTotal ? "text-blue-600" : "text-slate-900"
                }`}>
                  {total}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleIncrement("total", 1) }}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Reservado Row */}
            <div 
              className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                activeField === "reservado" 
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" 
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
              }`}
              onClick={() => setActiveField(activeField === "reservado" ? null : "reservado")}
            >
              <span className={`text-xs font-medium uppercase tracking-wider ${
                activeField === "reservado" ? "text-blue-600" : "text-slate-500"
              }`}>Reservado</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleIncrement("reservado", -1) }}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3 h-3 text-slate-600" />
                </button>
                <span className={`text-lg font-semibold tabular-nums min-w-[2.5rem] text-center ${
                  reservado !== initialReservado ? "text-blue-600" : "text-slate-900"
                }`}>
                  {reservado}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleIncrement("reservado", 1) }}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Advanced operation row - visually linked with blue when active */}
            <div className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
              isAdvancedActive 
                ? "bg-blue-50/70 border-blue-200" 
                : "bg-slate-50/30 border-slate-100 opacity-50"
            }`}>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as "add" | "remove" | "set")}
                disabled={!isAdvancedActive}
                className={`w-24 flex-shrink-0 text-sm border rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                  isAdvancedActive 
                    ? "bg-white border-blue-200 text-slate-700 cursor-pointer" 
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
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
                disabled={!isAdvancedActive}
                className={`flex-1 min-w-0 text-sm border rounded-lg px-2 py-2 text-center tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                  isAdvancedActive 
                    ? "bg-white border-blue-200 text-slate-900" 
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              />
              <button
                onClick={applyOperation}
                disabled={!isAdvancedActive || !inputValue || parseInt(inputValue) <= 0}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                  isAdvancedActive && inputValue && parseInt(inputValue) > 0
                    ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Disponible display */}
          <div className={`mt-4 flex items-center justify-between p-4 rounded-xl ${
            disponible > 0 
              ? "bg-emerald-50 border border-emerald-200" 
              : disponible === 0
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200"
          }`}>
            <span className={`text-xs font-medium uppercase tracking-wider ${
              disponible > 0 ? "text-emerald-600" : disponible === 0 ? "text-amber-600" : "text-red-600"
            }`}>
              Disponible
            </span>
            <span className={`text-2xl font-bold tabular-nums ${
              disponible > 0 ? "text-emerald-600" : disponible === 0 ? "text-amber-600" : "text-red-600"
            }`}>
              {disponible}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleAccept}
            disabled={!hasChanges}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              hasChanges
                ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
