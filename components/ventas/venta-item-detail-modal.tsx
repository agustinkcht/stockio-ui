"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import type { VentaItem } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"

interface VentaItemDetailModalProps {
  ventaItem: VentaItem
  onClose: () => void
}

export function VentaItemDetailModal({ ventaItem, onClose }: VentaItemDetailModalProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const display = getVentaItemDisplay(ventaItem)
  const { resolved, parent, isChild, name, marca, categoria, tags } = display

  // Resolve fields that may live on parent or variant
  const sku = ventaItem.sku
  const codigoUniversal =
    (resolved as { codigoUniversal?: string } | null)?.codigoUniversal || parent?.codigoUniversal
  const proveedor = (resolved as { proveedor?: string } | null)?.proveedor || parent?.proveedor
  const formatoVenta = (resolved as { formatoVenta?: string } | null)?.formatoVenta || parent?.formatoVenta

  // Atributos principales for child: use the variant's
  const atributosPrincipales =
    isChild && (resolved as { atributosPrincipales?: { key: string; value: string }[] } | null)?.atributosPrincipales
      ? (resolved as { atributosPrincipales: { key: string; value: string }[] }).atributosPrincipales
      : []

  // Atributos informativos: parent + variant for child, item's own for standalone
  const atributosInformativos = (() => {
    if (isChild) {
      const parentAttrs = parent?.atributosInformativos || []
      const variantAttrs =
        (resolved as { atributosInformativos?: { key: string; value: string }[] } | null)?.atributosInformativos || []
      // Variant overrides parent for same key
      const map = new Map<string, string>()
      parentAttrs.forEach((a) => map.set(a.key, a.value))
      variantAttrs.forEach((a) => map.set(a.key, a.value))
      return Array.from(map.entries()).map(([key, value]) => ({ key, value }))
    }
    return (
      (resolved as { atributosInformativos?: { key: string; value: string }[] } | null)?.atributosInformativos || []
    )
  })()

  const imageSrc = getCategoryImage(categoria) || "/placeholder.svg"

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex items-stretch gap-5 max-w-[860px] w-full px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FLIPPING CARD */}
        <div
          className="relative shrink-0"
          style={{ perspective: "1200px", width: "360px" }}
        >
          <div
            className="relative transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: "600px",
            }}
          >
            {/* FRONT */}
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="absolute inset-0 p-6 px-8 border border-black rounded-xl bg-black shadow-md text-left cursor-pointer"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              aria-label="Ver detalles"
            >
              {/* Estado tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">Activo</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="text-[11px] uppercase tracking-wider">Detalles</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* Image */}
              <div className="mt-2 w-full h-64 flex items-center justify-center">
                <Image
                  src={imageSrc || "/placeholder.svg"}
                  alt={name}
                  width={200}
                  height={256}
                  className="object-contain rounded-xl drop-shadow-2xl"
                />
              </div>

              {/* Title + variant pills */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <h2 className="font-semibold text-white text-2xl text-center text-balance leading-tight">
                  {name}
                </h2>
                {isChild && tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-sm px-2.5 py-0.5 rounded bg-white/15 text-white/80 whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SKU */}
              <div className="mt-4 flex items-center justify-center gap-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">SKU</span>
                <span className="text-xs font-light text-slate-400 tracking-wide">{sku}</span>
              </div>

              {/* Marca · Categoria */}
              {(marca || categoria) && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                  {marca && <span>{marca}</span>}
                  {marca && categoria && <span>·</span>}
                  {categoria && <span>{categoria}</span>}
                </div>
              )}
            </button>

            {/* BACK */}
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="absolute inset-0 p-6 px-8 border border-black rounded-xl bg-black shadow-md text-left cursor-pointer overflow-y-auto"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              aria-label="Volver"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider">Atributos</span>
                <div className="flex items-center gap-1 text-slate-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span className="text-[11px] uppercase tracking-wider">Volver</span>
                </div>
              </div>

              <h3 className="mt-6 font-semibold text-white text-lg leading-tight">{name}</h3>

              <div className="mt-5 flex flex-col gap-3">
                {atributosInformativos.length > 0 ? (
                  atributosInformativos.map((attr, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{attr.key}</span>
                      <span className="text-sm text-white/90">{attr.value || "—"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Sin atributos informativos.</p>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* INFO / ATRIBUTOS PANEL */}
        <div className="flex-1 bg-gradient-to-b from-white to-slate-50/30 rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-200/60 max-h-[600px] overflow-y-auto">
          <div className="flex items-start justify-between p-5 border-b border-slate-100">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-lg truncate">{name}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                {marca && <span>{marca}</span>}
                {marca && categoria && <span>·</span>}
                {categoria && <span>{categoria}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Información del Producto */}
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Información del Producto</h4>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoField label="SKU" value={sku} mono />
              {codigoUniversal && <InfoField label="Código universal" value={codigoUniversal} mono />}
              {marca && <InfoField label="Marca" value={marca} />}
              {categoria && <InfoField label="Categoría" value={categoria} />}
              {formatoVenta && <InfoField label="Formato de venta" value={formatoVenta} />}
            </dl>
          </div>

          {/* Atributos principales (only for children) */}
          {atributosPrincipales.length > 0 && (
            <div className="p-5 border-b border-slate-100">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                Atributos principales
              </h4>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {atributosPrincipales.map((attr, i) => (
                  <InfoField key={i} label={attr.key} value={attr.value} />
                ))}
              </dl>
            </div>
          )}

          {/* Atributos informativos */}
          {atributosInformativos.length > 0 && (
            <div className={`p-5 ${proveedor ? "border-b border-slate-100" : ""}`}>
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
                Atributos informativos
              </h4>
              <dl className="flex flex-col gap-3">
                {atributosInformativos.map((attr, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <dt className="text-[11px] text-slate-500">{attr.key}</dt>
                    <dd className="text-sm text-slate-800">{attr.value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Información del Proveedor */}
          {proveedor && (
            <div className="p-5">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Información del Proveedor</h4>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoField label="Proveedor" value={proveedor} />
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className={`text-sm text-slate-800 truncate ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  )
}
