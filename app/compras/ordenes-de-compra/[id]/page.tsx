"use client"

import { useState, useMemo, Suspense, use } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Plus,
  CheckCircle2,
  Trash2,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { OrdenDeCompra, EstadoOrdenDeCompra } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ORDENES_DE_COMPRA } from "@/lib/data/initial-ordenes-de-compra"

const estadoLabels: Record<EstadoOrdenDeCompra, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
}

const estadoColors: Record<EstadoOrdenDeCompra, { bg: string; text: string; icon: string }> = {
  borrador: { bg: "bg-slate-100", text: "text-slate-600", icon: "text-slate-500" },
  enviada: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  aceptada: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500" },
  rechazada: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
  cancelada: { bg: "bg-gray-100", text: "text-gray-600", icon: "text-gray-500" },
}

function formatDateShort(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

function OrdenDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  // Find the orden
  const initialOrden = ORDENES_DE_COMPRA.find((o) => o.id === id)
  const [orden, setOrden] = useState<OrdenDeCompra | null>(initialOrden || null)
  const [hasChanges, setHasChanges] = useState(false)

  const breadcrumbs = [
    { label: "Compras" },
    { label: "Órdenes de Compra", href: "/compras/ordenes-de-compra" },
    { label: orden ? `ODC-${orden.numero}` : "Detalle" },
  ]

  if (!orden) {
    return (
      <div className="flex items-center justify-center h-screen bg-[rgb(243,242,238)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Orden no encontrada</h2>
          <p className="text-muted-foreground mb-4">La orden de compra que buscas no existe.</p>
          <Button onClick={() => router.push("/compras/ordenes-de-compra")}>
            Volver a Órdenes
          </Button>
        </div>
      </div>
    )
  }

  const estadoStyle = estadoColors[orden.estado]

  const handleQuantityChange = (idx: number, newQuantity: number) => {
    const newItems = orden.items.map((it, i) =>
      i === idx ? { ...it, quantity: newQuantity, total: newQuantity * it.unitPrice } : it
    )
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
  }

  const handlePriceChange = (idx: number, newPrice: number) => {
    const newItems = orden.items.map((it, i) =>
      i === idx ? { ...it, unitPrice: newPrice, total: it.quantity * newPrice } : it
    )
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
  }

  const handleDeleteItem = (idx: number) => {
    const newItems = orden.items.filter((_, i) => i !== idx)
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
  }

  const handleDeshacer = () => {
    setOrden(initialOrden || null)
    setHasChanges(false)
  }

  const handleGuardar = () => {
    // TODO: Save to backend
    setHasChanges(false)
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Utility Bar - Same as all other views */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={!hasChanges}
                  onClick={handleDeshacer}
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground hover:bg-muted text-sm font-medium"
                  title="Deshacer cambios"
                >
                  Deshacer
                </button>

                <button
                  disabled={!hasChanges}
                  onClick={handleGuardar}
                  className="px-4 py-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary hover:bg-muted text-sm font-medium"
                  title="Guardar cambios"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Order Header - ID as title, info inline */}
            <div className="px-6 py-5 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Order ID as title */}
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">ODC-{orden.numero}</h1>
                  
                  {/* Separator */}
                  <div className="h-6 w-px bg-border/60" />
                  
                  {/* Proveedor */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Proveedor</span>
                    <span className="text-sm font-medium text-gray-700">{orden.proveedorNombre}</span>
                  </div>

                  {/* Separator */}
                  <div className="h-4 w-px bg-border/40" />

                  {/* Fecha Creación */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Creación</span>
                    <span className="text-sm text-gray-600">{formatDateShort(orden.fechaCreacion)}</span>
                  </div>

                  {/* Separator */}
                  <div className="h-4 w-px bg-border/40" />

                  {/* Última Edición */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Edición</span>
                    <span className="text-sm text-gray-600">
                      {orden.fechaModificacion ? formatDateShort(orden.fechaModificacion) : "—"}
                    </span>
                  </div>
                </div>

                {/* Estado - rightmost */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${estadoStyle.bg}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${estadoStyle.icon}`} />
                  <span className={`text-xs font-medium ${estadoStyle.text}`}>
                    {estadoLabels[orden.estado]}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Section with Tab Header */}
            <div className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
              {/* Tab Header */}
              <div className="bg-slate-100 border border-slate-200/80 rounded-t-md">
                <div className="grid grid-cols-12 h-9 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="col-span-6 flex items-center px-4">Item</div>
                  <div className="col-span-2 flex items-center justify-center">Costo Unit.</div>
                  <div className="col-span-2 flex items-center justify-center">Cantidad</div>
                  <div className="col-span-2 flex items-center justify-end pr-12">Subtotal</div>
                </div>
              </div>

              {/* Items List - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-white border-x border-slate-200/80">
                {orden.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center py-3 px-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Item - Thumbnail, Name, SKU */}
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-11 h-11 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                        <Image
                          src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                          alt={item.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {item.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.sku}</p>
                      </div>
                    </div>

                    {/* Costo Unit. */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="flex items-center">
                        <span className="text-xs text-slate-400 mr-0.5">$</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(idx, parseInt(e.target.value) || 0)}
                          className="w-20 text-center text-sm font-medium bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 rounded px-2 py-1 focus:outline-none focus:bg-white transition-all"
                          min={0}
                        />
                      </div>
                    </div>

                    {/* Cantidad */}
                    <div className="col-span-2 flex items-center justify-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                        className="w-16 text-center text-sm font-medium bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 rounded px-2 py-1 focus:outline-none focus:bg-white transition-all"
                        min={1}
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ${item.total.toLocaleString("es-AR")}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {item.quantity} x ${item.unitPrice.toLocaleString("es-AR")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Item Row */}
                <button
                  className="w-full py-4 text-sm text-slate-400 hover:text-amber-600 hover:bg-amber-50/30 transition-colors flex items-center justify-center gap-2 border-t border-dashed border-slate-200"
                  onClick={() => {
                    // TODO: Open item selector modal (filtered by proveedor)
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Agregar item
                </button>
              </div>

              {/* Bottom border to close the table */}
              <div className="h-px bg-slate-200/80" />
            </div>

            {/* Total Footer - Fixed at bottom */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-border/30 bg-white">
              <div className="flex items-center justify-end gap-10">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Items</span>
                  <p className="text-sm font-medium text-gray-700">{orden.items.length}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Unidades</span>
                  <p className="text-sm font-medium text-gray-700">
                    {orden.items.reduce((sum, it) => sum + it.quantity, 0)}
                  </p>
                </div>
                <div className="text-right pl-6 border-l border-border/40">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Estimado</span>
                  <p className="text-xl font-bold text-gray-900">
                    ${orden.importeEstimado.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function OrdenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <OrdenDetailContent params={params} />
    </Suspense>
  )
}
