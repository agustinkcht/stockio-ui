"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, Check, X } from "lucide-react"
import { getItemPhoto } from "@/lib/utils/category-images"

interface StockEditModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (total: number, reservado: number) => void
  initialTotal: number
  initialReservado: number
  itemName?: string
  itemMarca?: string
  itemCategoria?: string
  itemMedia?: { photo: string; descripcion: string }[]
}

export function StockEditModal({
  isOpen,
  onClose,
  onAccept,
  initialTotal,
  initialReservado,
  itemName,
  itemMarca,
  itemCategoria,
  itemMedia,
}: StockEditModalProps) {
  const [enStock, setEnStock] = useState(initialTotal)
  const [operation, setOperation] = useState<"add" | "remove" | "set">("add")
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setEnStock(initialTotal)
      setOperation("add")
      setInputValue("")
    }
  }, [isOpen, initialTotal])

  const disponible = Math.max(0, enStock - initialReservado)
  const hasChanges = enStock !== initialTotal

  const handleIncrement = (delta: number) => {
    setEnStock((v) => Math.max(initialReservado, Math.max(0, v + delta)))
  }

  const applyOperation = () => {
    const raw = inputValue.trim()
    if (raw === "") return
    const value = parseInt(raw)
    if (isNaN(value)) return
    if (operation !== "set" && value <= 0) return

    let newValue: number
    if (operation === "add") newValue = enStock + value
    else if (operation === "remove") newValue = enStock - value
    else newValue = value

    setEnStock(Math.max(initialReservado, Math.max(0, newValue)))
    setInputValue("")
  }

  const isApplyEnabled = (() => {
    const raw = inputValue.trim()
    if (raw === "") return false
    const value = parseInt(raw)
    if (isNaN(value)) return false
    if (operation === "set") return value >= 0
    return value > 0
  })()

  const handleAccept = () => {
    onAccept(enStock, initialReservado)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {(itemName || itemCategoria) && (
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                  <img
                    src={getItemPhoto({ media: itemMedia })}
                    alt={itemName || ""}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                {itemName && <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{itemName}</p>}
                {(itemMarca || itemCategoria) && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {[itemMarca, itemCategoria].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">

          {/* En Stock + Agregar controls — grouped */}
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">

            {/* En Stock row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">En Stock</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleIncrement(-1)}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3 h-3 text-slate-600" />
                </button>
                <span className={`text-lg font-semibold tabular-nums min-w-[2.5rem] text-center ${
                  enStock !== initialTotal ? "text-slate-700" : "text-slate-900"
                }`}>
                  {enStock}
                </span>
                <button
                  onClick={() => handleIncrement(1)}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200" />

            {/* Agregar / Remover / Fijar en */}
            <div className="flex items-center gap-2">
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as "add" | "remove" | "set")}
                className="w-24 flex-shrink-0 text-sm border rounded-lg px-2 py-2 bg-white border-slate-200 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
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
                className="flex-1 min-w-0 text-sm border rounded-lg px-2 py-2 text-center tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white border-slate-200 text-slate-900"
              />
              <button
                onClick={applyOperation}
                disabled={!isApplyEnabled}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                  isApplyEnabled
                    ? "bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reservado — read-only, compact */}
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
            initialReservado > 0
              ? "bg-amber-50 border border-amber-100"
              : "bg-slate-50 border border-slate-100"
          }`}>
            <span className={`text-xs font-medium uppercase tracking-wider ${
              initialReservado > 0 ? "text-amber-600" : "text-slate-400"
            }`}>Reservado</span>
            <span className={`text-base font-semibold tabular-nums ${
              initialReservado > 0 ? "text-amber-600" : "text-slate-500"
            }`}>{initialReservado}</span>
          </div>

          {/* Disponible — read-only */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${
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
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
