"use client"

import { useState, useEffect, useRef } from "react"
import { Minus, Plus, X } from "lucide-react"

interface StockEditModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (total: number, reservado: number) => void
  initialTotal: number
  initialReservado: number
  itemName?: string
  itemMarca?: string
  itemCategoria?: string
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
}: StockEditModalProps) {
  const [enStock, setEnStock] = useState(initialTotal)
  const [operation, setOperation] = useState<"add" | "remove" | "set">("add")
  const [inputValue, setInputValue] = useState("")

  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setEnStock(initialTotal)
      setOperation("add")
      setInputValue("")
    }
    wasOpenRef.current = isOpen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const disponible = Math.max(0, enStock - initialReservado)
  const delta = enStock - initialTotal
  const hasChanges = enStock !== initialTotal

  const handleIncrement = (d: number) => {
    setEnStock((v) => Math.max(initialReservado, Math.max(0, v + d)))
  }

  const applyOperation = () => {
    const value = parseInt(inputValue) || 0
    if (value <= 0) return
    let newValue: number
    if (operation === "add") newValue = enStock + value
    else if (operation === "remove") newValue = enStock - value
    else newValue = value
    setEnStock(Math.max(initialReservado, Math.max(0, newValue)))
    setInputValue("")
  }

  const handleAccept = () => {
    onAccept(enStock, initialReservado)
    onClose()
  }

  if (!isOpen) return null

  const opLabels = { add: "AGREGAR", remove: "REMOVER", set: "FIJAR EN" }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xs mx-4 bg-[#0f1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden font-mono">

        {/* Header */}
        <div className="px-5 pt-4 pb-3.5 flex items-center justify-between border-b border-white/8">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.15em] text-white/30 uppercase">EDITAR STOCK</p>
            {itemName && (
              <p className="text-sm font-semibold text-white/90 mt-0.5 truncate">{itemName}</p>
            )}
            {(itemMarca || itemCategoria) && (
              <p className="text-[11px] text-white/30 truncate mt-0.5">
                {[itemMarca, itemCategoria].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/8 transition-colors shrink-0 ml-3"
          >
            <X className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>

        {/* EN STOCK — main editable */}
        <div className="px-5 pt-5 pb-4 border-b border-white/8">
          <p className="text-[10px] tracking-[0.15em] text-white/30 uppercase mb-3">EN STOCK</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleIncrement(-1)}
              className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:border-white/25 transition-all active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="text-center">
              <span className={`text-5xl font-bold tabular-nums tracking-tight leading-none ${
                hasChanges ? "text-white" : "text-white/60"
              }`}>
                {enStock}
              </span>
              {hasChanges && (
                <p className={`text-[11px] mt-1 tabular-nums ${
                  delta > 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {delta > 0 ? `+${delta}` : delta} vs actual
                </p>
              )}
            </div>

            <button
              onClick={() => handleIncrement(1)}
              className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:border-white/25 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Operation bar */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              {(["add", "remove", "set"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setOperation(op)}
                  className={`px-2.5 py-1.5 text-[10px] tracking-widest transition-all cursor-pointer ${
                    operation === op
                      ? "bg-white/12 text-white"
                      : "text-white/30 hover:text-white/60 hover:bg-white/5"
                  }`}
                >
                  {opLabels[op]}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyOperation()}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 text-center tabular-nums placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
            />
            <button
              onClick={applyOperation}
              disabled={!inputValue || parseInt(inputValue) <= 0}
              className={`px-3 py-1.5 rounded-lg text-[10px] tracking-widest transition-all cursor-pointer ${
                inputValue && parseInt(inputValue) > 0
                  ? "bg-white text-[#0f1117] hover:bg-white/90"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              OK
            </button>
          </div>
        </div>

        {/* Reservado + Disponible */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-white/8">
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.15em] text-white/25 uppercase">Reservado</p>
            <p className="text-2xl font-bold tabular-nums text-white/40">{initialReservado}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.15em] text-white/25 uppercase">Disponible</p>
            <p className={`text-2xl font-bold tabular-nums ${
              disponible > 0 ? "text-emerald-400" : "text-amber-400"
            }`}>
              {disponible}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[11px] tracking-widest text-white/30 hover:text-white/60 transition-colors cursor-pointer uppercase"
          >
            Cancelar
          </button>
          <button
            onClick={handleAccept}
            disabled={!hasChanges}
            className={`px-5 py-2 text-[11px] tracking-widest rounded-lg transition-all uppercase ${
              hasChanges
                ? "bg-white text-[#0f1117] hover:bg-white/90 cursor-pointer"
                : "bg-white/6 text-white/20 cursor-not-allowed"
            }`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
