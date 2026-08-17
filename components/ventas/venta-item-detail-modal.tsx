"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X, Copy, Check } from "lucide-react"
import type { VentaItem } from "@/lib/types"
import { useItems } from "@/hooks/use-items"
import { getItemPhoto } from "@/lib/utils/category-images"
import { getVentaItemDisplay, lookupLiveItemBySku } from "@/lib/utils/venta-item-lookup"

interface VentaItemDetailModalProps {
  ventaItem: VentaItem
  onClose: () => void
}

export function VentaItemDetailModal({ ventaItem, onClose }: VentaItemDetailModalProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [rightTab, setRightTab] = useState<"info" | "atributos">("info")
  const [skuCopied, setSkuCopied] = useState(false)
  const [codigoCopied, setCodigoCopied] = useState(false)

  // Live items for up-to-date stock values
  const { items: liveItems } = useItems()

  const display = getVentaItemDisplay(ventaItem)
  const { resolved, parent, isChild, name, marca, categoria, tags } = display

  // Resolve all fields from resolved item or parent
  const sku = ventaItem.sku
  const r = resolved as any
  const p = parent as any

  // Look up live stock from the current useItems store
  const liveResolved = lookupLiveItemBySku(sku, liveItems)
  const lr = liveResolved.resolved as any
  const lp = liveResolved.parent as any

  const isActive = r?.isActive !== false
  const codigoUniversal = r?.codigoUniversal || p?.codigoUniversal || ""
  const precioFinal = r?.precio?.precioFinal || p?.precio?.precioFinal || 0
  // Always use live stock — falls back to snapshot if item not found in live store
  const stockTotal = Number.parseInt(lr?.stock?.total ?? lp?.stock?.total ?? r?.stock?.total ?? p?.stock?.total ?? "0")
  const stockReservado = Number.parseInt(lr?.stock?.reservado ?? lp?.stock?.reservado ?? r?.stock?.reservado ?? p?.stock?.reservado ?? "0")
  const stockDisponible = stockTotal - stockReservado

  // Info fields
  const formatoVenta = r?.formatoVenta || p?.formatoVenta || ""
  const unidadesPorPack = r?.unidadesPorPack ?? p?.unidadesPorPack ?? null
  const volumenActive = r?.volumenActive ?? p?.volumenActive ?? false
  const volumenCantidad = r?.volumenCantidad ?? p?.volumenCantidad ?? null
  const volumenUnidad = r?.volumenUnidad || p?.volumenUnidad || ""
  const proveedor = r?.proveedor || p?.proveedor || ""
  const codigoProveedor = r?.codigoProveedor || p?.codigoProveedor || ""
  const descripcion = r?.descripcion || p?.descripcion || ""

  // Back side media: use item's own photo or fall back to default
  const imageSrc = getItemPhoto((r?.media ? r : p) as any)

  // Atributos informativos — merge parent + variant overrides
  const atributosInformativos = (() => {
    if (isChild) {
      const parentAttrs = p?.atributosInformativos || []
      const variantAttrs = r?.atributosInformativos || []
      const map = new Map<string, string>()
      parentAttrs.forEach((a: any) => map.set(a.key, a.value))
      variantAttrs.forEach((a: any) => map.set(a.key, a.value))
      return Array.from(map.entries()).map(([key, value]) => ({ key, value }))
    }
    return r?.atributosInformativos || []
  })()

  const atributosPrincipales: { key: string; value: string }[] = isChild ? (r?.atributosPrincipales || []) : []

  const handleCopySku = () => {
    navigator.clipboard.writeText(sku).catch(() => {})
    setSkuCopied(true)
    setTimeout(() => setSkuCopied(false), 1500)
  }

  const handleCopyCodigo = () => {
    navigator.clipboard.writeText(codigoUniversal).catch(() => {})
    setCodigoCopied(true)
    setTimeout(() => setCodigoCopied(false), 1500)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
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
        className="flex items-stretch gap-5 max-w-[900px] w-full px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT: FLIPPING CARD ── */}
        <div className="relative shrink-0" style={{ perspective: "1200px", width: "360px" }}>
          <div
            className="relative transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: "630px",
            }}
          >
            {/* FRONT */}
            <div
              className={`absolute inset-0 p-6 px-9 border border-black rounded-xl bg-black shadow-md ${isFlipped ? "pointer-events-none" : ""}`}
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              {/* Estado — top left */}
              <div className="absolute top-5 left-7 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"}`} />
                <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                  {isActive ? "Activo" : "Pausado"}
                </span>
              </div>

              {/* Detalles — top right (flip trigger) */}
              <button
                onClick={() => setIsFlipped(true)}
                className="absolute top-0 right-0 w-1/2 h-1/3 cursor-pointer z-10"
                aria-label="Ver detalles"
              >
                <div className="absolute top-5 right-6 flex items-center gap-1 text-slate-500">
                  <span className="text-[11px] uppercase tracking-wider">Detalles</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>

              {/* Image */}
              <div className="mt-8 w-full h-64 flex items-center justify-center">
                <Image
                  src={imageSrc}
                  alt={name}
                  width={200}
                  height={256}
                  className="object-contain rounded-xl shadow-xl"
                />
              </div>

              {/* Title */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <h2 className="font-semibold text-white text-2xl text-center text-balance leading-tight">{name}</h2>
                {atributosPrincipales.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {atributosPrincipales.map((attr, i) => (
                      <span key={i} className="text-sm px-2.5 py-0.5 rounded bg-white/20 text-white/80 whitespace-nowrap">
                        {attr.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SKU */}
              <div className="mt-3 flex items-center justify-center gap-1.5 group/sku">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">SKU</span>
                <span className="text-xs font-light text-slate-400 tracking-wide">{sku}</span>
                <button onClick={handleCopySku} className="text-slate-600 hover:text-slate-400 transition-colors p-0.5">
                  {skuCopied ? <span className="text-green-400 text-[10px]">✓</span> : <Copy className="h-2.5 w-2.5" />}
                </button>
              </div>

              {/* Metrics */}
              <div className="mt-5 px-2">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                <div className="flex flex-col items-center py-3">
                  <span className="text-[11px] text-slate-500 uppercase tracking-[0.12em] mb-0.5">Precio Venta</span>
                  <span className="text-white font-light text-lg tracking-tight tabular-nums">
                    ${precioFinal.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                <div className="flex flex-col items-center py-3">
                  <span className="text-[11px] text-slate-500 uppercase tracking-[0.12em] mb-0.5">Stock</span>
                  <span className="text-white font-light text-lg tracking-tight tabular-nums">
                    {stockDisponible} disponibles
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
              </div>
            </div>

            {/* BACK */}
            <div
              className={`absolute inset-0 p-6 px-9 border border-black rounded-xl bg-black shadow-md overflow-y-auto ${!isFlipped ? "pointer-events-none" : ""}`}
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {/* Volver — absolute top-right, same pattern as catalogo */}
              <button
                onClick={() => setIsFlipped(false)}
                className="absolute top-0 right-0 w-32 h-12 cursor-pointer z-10 flex items-center justify-end pr-6 gap-1 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Volver"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span className="text-[11px] uppercase tracking-wider">Volver</span>
              </button>

              {/* Código Universal */}
              <div className="mt-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-50 mb-2">
                  Código Universal
                </h3>
                <div className="flex items-center gap-2 group/cu">
                  <span className="text-sm font-light text-slate-300 tracking-wide">
                    {codigoUniversal || "N/A"}
                  </span>
                  {codigoUniversal && (
                    <button onClick={handleCopyCodigo} className="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
                      {codigoCopied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-700 my-4" />

              {/* Media */}
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-50 mb-3">Media</h3>
              <div className="flex gap-3 mb-5">
                <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-600">
                  <Image
                    src={imageSrc}
                    alt={name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 px-1">
                    <span className="text-[8px] font-bold text-white uppercase tracking-wider">Portada</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700 my-4" />

              {/* Descripción */}
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-50 mb-3">Descripción</h3>
              <div className="w-full min-h-[80px] px-3 py-2 bg-slate-800/30 rounded-lg text-sm text-slate-300">
                {descripcion || <span className="text-slate-500 italic">Sin descripción</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: TECHNICAL SHEET ── */}
        <div className="flex-1 bg-white rounded-2xl shadow-[0_4px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-200/60 flex flex-col max-h-[630px]">

          {/* Close + Tab switcher */}
          <div className="flex items-center gap-3 px-7 pt-6 pb-0">
            <div className="flex-1 flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setRightTab("info")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${rightTab === "info" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Info
              </button>
              <button
                onClick={() => setRightTab("atributos")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${rightTab === "atributos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Atributos
              </button>
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

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-5">

            {rightTab === "info" && (
              <>
                {/* Información del Producto */}
                <section>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">
                    Información del Producto
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <ReadField label="Categoría" value={categoria} />
                    <ReadField label="Marca" value={marca} />
                  </div>
                </section>

                <div className="border-t border-slate-200/80" />

                {/* Presentación */}
                <section>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">
                    Presentación
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <ReadField label="Formato de venta" value={formatoVenta ? capitalize(formatoVenta) : undefined} />
                    <ReadField
                      label="Unidades por pack"
                      value={unidadesPorPack != null ? String(unidadesPorPack) : undefined}
                    />
                  </div>

                  {/* Volumen */}
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wider">Contenido</span>
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${volumenActive ? "bg-slate-800" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${volumenActive ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </div>
                    {volumenActive && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <ReadField label="Cantidad" value={volumenCantidad != null ? String(volumenCantidad) : undefined} />
                        <ReadField label="Unidad de medida" value={volumenUnidad} />
                      </div>
                    )}
                  </div>
                </section>

                {(proveedor || codigoProveedor) && (
                  <>
                    <div className="border-t border-slate-200/80" />
                    <section>
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">
                        Información del Proveedor
                      </h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <ReadField label="Proveedor" value={proveedor} />
                        <ReadField label="Código Proveedor" value={codigoProveedor} mono />
                      </div>
                    </section>
                  </>
                )}
              </>
            )}

            {rightTab === "atributos" && (
              <>
                {atributosInformativos.length > 0 ? (
                  <section>
                    <div className="mb-4">
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
                        Atributos Informativos
                      </h4>
                      <p className="text-[11px] text-slate-400 italic mt-1">
                        Atributos que describen propiedades adicionales del producto
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {atributosInformativos.map((attr, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Atributo</label>
                            <div className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800">
                              {attr.key || "—"}
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Valor</label>
                            <div className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800">
                              {attr.value || "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <p className="text-sm text-slate-400">Sin atributos informativos</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</span>
      <div className={`px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 truncate ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  )
}

function capitalize(str: string) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}
