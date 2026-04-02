"use client"

import { useState, useMemo, Suspense, use } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Trash2,
  Calendar,
  Building2,
  FileText,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { OrdenDeCompra, EstadoOrdenDeCompra, OrdenDeCompraItem } from "@/lib/types"
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

  if (!orden) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
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
  }

  const handlePriceChange = (idx: number, newPrice: number) => {
    const newItems = orden.items.map((it, i) =>
      i === idx ? { ...it, unitPrice: newPrice, total: it.quantity * newPrice } : it
    )
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
  }

  const handleDeleteItem = (idx: number) => {
    const newItems = orden.items.filter((_, i) => i !== idx)
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
  }

  return (
    <div className="flex h-screen bg-[#f7f7f7] overflow-hidden p-[6px] gap-[6px]" onClick={handleCloseDropdowns}>
      {/* Sidebar */}
      <Sidebar
        sidebarItems={SIDEBAR_ITEMS}
        bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
        hoveredDropdown={hoveredDropdown}
        onDropdownOpen={handleDropdownMouseEnter}
        onDropdownClose={handleDropdownMouseLeave}
      />

      <div className="flex-1 flex flex-col gap-[6px] min-w-0">
        {/* User Panel */}
        <UserPanel />

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/compras/ordenes-de-compra")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">ODC-{orden.numero}</h1>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoStyle.bg}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${estadoStyle.icon}`} />
                    <span className={`text-xs font-medium ${estadoStyle.text}`}>
                      {estadoLabels[orden.estado]}
                    </span>
                  </div>
                </div>
                <Breadcrumb
                  items={[
                    { label: "Compras", href: "/compras" },
                    { label: "Órdenes de Compra", href: "/compras/ordenes-de-compra" },
                    { label: `ODC-${orden.numero}` },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Cancelar Orden
              </Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                Guardar Cambios
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            {/* Order Info Section */}
            <div className="px-6 py-5 border-b border-border/30 bg-slate-50/50">
              <div className="flex items-start gap-12">
                {/* Proveedor */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Proveedor</span>
                    <p className="text-base font-semibold text-gray-900">{orden.proveedorNombre}</p>
                  </div>
                </div>

                {/* Fecha Creación */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Fecha Creación</span>
                    <p className="text-base font-semibold text-gray-900">{formatDateShort(orden.fechaCreacion)}</p>
                  </div>
                </div>

                {/* Última Modificación */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Última Edición</span>
                    <p className="text-base font-semibold text-gray-900">
                      {orden.fechaModificacion ? formatDateShort(orden.fechaModificacion) : "-"}
                    </p>
                  </div>
                </div>

                {/* Orden ID */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">#</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">ID Orden</span>
                    <p className="text-base font-semibold text-gray-900">{orden.id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Items ({orden.items.length})
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    // TODO: Open item selector modal (filtered by proveedor)
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Agregar Item
                </Button>
              </div>

              {/* Items Grid - No borders between rows */}
              <div className="space-y-0">
                {orden.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 py-4 border-b border-border/20 last:border-b-0 hover:bg-slate-50/50 transition-colors -mx-2 px-2 rounded"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                      <Image
                        src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Info - Name, tags (if any), SKU below */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 whitespace-nowrap"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.sku}</p>
                    </div>

                    {/* Costo Unit - editable */}
                    <div className="flex flex-col items-center gap-1 w-28">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Costo Unit.</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-0.5">$</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(idx, parseInt(e.target.value) || 0)}
                          className="w-20 text-center text-sm font-medium border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                          min={0}
                        />
                      </div>
                    </div>

                    {/* Quantity - editable */}
                    <div className="flex flex-col items-center gap-1 w-24">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Cantidad</span>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                        className="w-16 text-center text-sm font-medium border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                        min={1}
                      />
                      <span className="text-[10px] text-muted-foreground">unidades</span>
                    </div>

                    {/* Subtotal */}
                    <div className="flex flex-col items-end gap-0.5 w-32">
                      <span className="text-base font-bold text-gray-900">
                        ${item.total.toLocaleString("es-AR")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity} x ${item.unitPrice.toLocaleString("es-AR")}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(idx)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Item Button (alternative) */}
              {orden.items.length > 0 && (
                <button
                  className="w-full mt-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    // TODO: Open item selector modal (filtered by proveedor)
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Agregar otro item
                </button>
              )}
            </div>
          </main>

          {/* Total Footer */}
          <footer className="px-6 py-4 border-t border-border/40 bg-slate-50">
            <div className="flex items-center justify-end gap-8">
              <div className="text-right">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Items</span>
                <p className="text-sm font-medium text-gray-700">{orden.items.length} productos</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Unidades Totales</span>
                <p className="text-sm font-medium text-gray-700">
                  {orden.items.reduce((sum, it) => sum + it.quantity, 0)} u.
                </p>
              </div>
              <div className="text-right border-l border-border/40 pl-8">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Estimado</span>
                <p className="text-2xl font-bold text-gray-900">
                  ${orden.importeEstimado.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </footer>
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
