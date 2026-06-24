"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown } from "lucide-react"
import { getItemPhoto } from "@/lib/utils/category-images"

export interface PrecioValues {
  precioFinal: number
  costo: number
  margen: number
  iva: number
}

interface PrecioEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (values: PrecioValues) => void
  itemName?: string
  itemMarca?: string
  itemCategoria?: string
  itemMedia?: { photo: string; descripcion: string }[]
  itemTags?: { key?: string; value: string }[]
  initialValues: PrecioValues
  costoBehavior?: "preservePrecioFinal" | "preserveMargen"
  zIndex?: number
}

export function PrecioEditModal({
  isOpen,
  onClose,
  onSave,
  itemName,
  itemMarca,
  itemCategoria,
  itemMedia,
  itemTags,
  initialValues,
  costoBehavior = "preserveMargen",
  zIndex = 50,
}: PrecioEditModalProps) {
  const [values, setValues] = useState<PrecioValues>(initialValues)
  const [isCostoExpanded, setIsCostoExpanded] = useState(false)
  const [isIvaExpanded, setIsIvaExpanded] = useState(false)

  // Sync with initialValues whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues)
      setIsCostoExpanded(false)
      setIsIvaExpanded(false)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={getItemPhoto({ media: itemMedia, categoria: itemCategoria })}
                  alt={itemName || ""}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                {itemName && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{itemName}</p>
                    {itemTags && itemTags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                        {tag.value}
                      </span>
                    ))}
                  </div>
                )}
                {(itemMarca || itemCategoria) && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {[itemMarca, itemCategoria].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">

          {/* Precio Venta */}
          <div className="border border-slate-200 rounded-xl px-4 pt-3 pb-4">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Precio Venta</label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-slate-400">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={values.precioFinal > 0 ? values.precioFinal.toLocaleString("es-AR") : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, "").replace(/,/g, ".")
                  const precioFinal = Number.parseFloat(raw) || 0
                  const base = precioFinal / (1 + values.iva / 100)
                  const margen = values.costo > 0 ? ((base / values.costo) - 1) * 100 : 0
                  setValues((prev) => ({ ...prev, precioFinal, margen: Math.round(margen * 10) / 10 }))
                }}
                className="flex-1 text-base font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Collapsible: Costo y márgenes */}
          <div className="rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCostoExpanded((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors rounded-xl cursor-pointer"
            >
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCostoExpanded ? "rotate-180" : ""}`} />
              Costo y márgenes
            </button>
            {isCostoExpanded && (
              <div className="grid grid-cols-2 divide-x divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {/* Costo */}
                <div className="bg-white px-4 pt-3 pb-4 flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Costo</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values.costo > 0 ? values.costo.toLocaleString("es-AR") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\./g, "").replace(/,/g, ".")
                        const costo = Number.parseFloat(raw) || 0
                        if (costoBehavior === "preservePrecioFinal") {
                          const keptPF = values.precioFinal
                          const newMargen = costo > 0
                            ? Math.round(((keptPF / (costo * (1 + values.iva / 100))) - 1) * 1000) / 10
                            : values.margen
                          setValues((prev) => ({ ...prev, costo, margen: newMargen }))
                        } else {
                          const precioFinal = costo * (1 + values.margen / 100) * (1 + values.iva / 100)
                          setValues((prev) => ({ ...prev, costo, precioFinal: Math.round(precioFinal) }))
                        }
                      }}
                      className="w-full text-sm font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300"
                      placeholder="0"
                    />
                  </div>
                </div>
                {/* Margen */}
                <div className="bg-white px-4 pt-3 pb-4 flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Margen</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={values.margen}
                      step="0.1"
                      onChange={(e) => {
                        const margen = Math.round((Number.parseFloat(e.target.value) || 0) * 10) / 10
                        const precioFinal = values.costo * (1 + margen / 100) * (1 + values.iva / 100)
                        setValues((prev) => ({ ...prev, margen, precioFinal: Math.round(precioFinal) }))
                      }}
                      className="w-full text-sm font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible: IVA */}
          <div className="rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsIvaExpanded((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors rounded-xl cursor-pointer"
            >
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isIvaExpanded ? "rotate-180" : ""}`} />
              IVA
            </button>
            {isIvaExpanded && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-white px-4 pt-3 pb-4 flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">IVA</label>
                  <select
                    value={values.iva}
                    onChange={(e) => {
                      const iva = Number.parseFloat(e.target.value)
                      const precioFinal = values.costo * (1 + values.margen / 100) * (1 + iva / 100)
                      setValues((prev) => ({ ...prev, iva, precioFinal: Math.round(precioFinal) }))
                    }}
                    className="text-sm text-slate-600 bg-transparent border-0 focus:outline-none cursor-pointer"
                  >
                    <option value={0}>0%</option>
                    <option value={10.5}>10.5%</option>
                    <option value={21}>21%</option>
                    <option value={27}>27%</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onSave({
                  ...values,
                  costo: Math.round(values.costo * 100) / 100,
                  margen: Math.round(values.margen * 10) / 10,
                  precioFinal: Math.round(values.precioFinal),
                })
                onClose()
              }}
              className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Guardar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
