"use client"

import { useState, useMemo, Suspense, use } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import {
  Plus,
  Trash2,
  FileText,
  FileDown,
  ShoppingCart,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { EstadoOrdenDeCompra } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ORDENES_DE_COMPRA } from "@/lib/data/initial-ordenes-de-compra"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"
import type { Item, OrdenDeCompraItem } from "@/lib/types"

const estadoLabels: Record<EstadoOrdenDeCompra, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
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
  
  // New item state
  const [newItemSearch, setNewItemSearch] = useState("")
  const [showNewItemRow, setShowNewItemRow] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // Get all items (standalone and variants) that match the proveedor
  const availableItems = useMemo(() => {
    if (!orden) return []
    const items: Array<{ id: string; name: string; sku: string; categoria?: string; tags?: string[]; precio?: number }> = []
    
    INITIAL_ITEMS.forEach((item) => {
      if (item.proveedor === orden.proveedorNombre) {
        if (item.hasVariants && item.variants) {
          item.variants.forEach((variant) => {
            items.push({
              id: variant.id,
              name: variant.name || item.name,
              sku: `${item.skuPrefix}-${variant.skuSuffix}`,
              categoria: variant.categoria || item.categoria,
              tags: variant.atributosPrincipales?.map(a => a.value),
              precio: variant.precio?.costo || 0,
            })
          })
        } else {
          items.push({
            id: item.id,
            name: item.name,
            sku: item.sku || "",
            categoria: item.categoria,
            precio: item.precio?.costo || 0,
          })
        }
      }
    })
    return items
  }, [orden])
  
  // Filter items based on search
  const searchResults = useMemo(() => {
    if (!newItemSearch.trim()) return []
    const search = newItemSearch.toLowerCase()
    return availableItems.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search)
    ).slice(0, 6)
  }, [newItemSearch, availableItems])

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
    setShowNewItemRow(false)
    setNewItemSearch("")
  }

  const handleGuardar = () => {
    // TODO: Save to backend
    setHasChanges(false)
  }

  const handleSelectItem = (item: typeof availableItems[0]) => {
    if (!orden) return
    const newItem: OrdenDeCompraItem = {
      sku: item.sku,
      name: item.name,
      quantity: 1,
      unitPrice: item.precio || 0,
      total: item.precio || 0,
      categoria: item.categoria,
      tags: item.tags,
    }
    const newItems = [...orden.items, newItem]
    const newTotal = newItems.reduce((sum, it) => sum + it.total, 0)
    setOrden({ ...orden, items: newItems, importeEstimado: newTotal })
    setHasChanges(true)
    setShowNewItemRow(false)
    setNewItemSearch("")
    setShowSearchResults(false)
  }

  const handleAddFreeItem = () => {
    if (!orden || !newItemSearch.trim()) return
    const newItem: OrdenDeCompraItem = {
      sku: "",
      name: newItemSearch,
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    const newItems = [...orden.items, newItem]
    setOrden({ ...orden, items: newItems })
    setHasChanges(true)
    setShowNewItemRow(false)
    setNewItemSearch("")
    setShowSearchResults(false)
  }

  const handleShowNewItemRow = () => {
    setShowNewItemRow(true)
    setNewItemSearch("")
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
            {/* Order Header */}
            <div className="px-6 py-4 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title and info */}
                <div className="flex items-center gap-8">
                  {/* Order ID as title with label */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Orden de Compra</span>
                    <div className="flex items-baseline gap-2">
                      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">ODC-{orden.numero}</h1>
                      <span className="text-xs text-slate-400">Creación {formatDateShort(orden.fechaCreacion)}</span>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="h-10 w-px bg-border/40" />
                  
                  {/* Proveedor - more salient */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Proveedor</span>
                    <span className="text-sm font-semibold text-gray-800">{orden.proveedorNombre}</span>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Estado:</span>
                    <span className="text-sm font-medium text-gray-700">{estadoLabels[orden.estado]}</span>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    onClick={() => {/* TODO: Export PDF */}}
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar PDF
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    onClick={() => {/* TODO: Export Text */}}
                  >
                    <FileText className="w-4 h-4" />
                    Exportar Texto
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                    onClick={() => {/* TODO: Convert to Compra */}}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Llevar a Compras
                  </button>
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

                {/* New Item Row - Search */}
                {showNewItemRow && (
                  <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-slate-100 bg-amber-50/30 relative">
                    {/* Item - Search Input */}
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-11 h-11 rounded bg-slate-200/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0 relative">
                        <input
                          type="text"
                          value={newItemSearch}
                          onChange={(e) => {
                            setNewItemSearch(e.target.value)
                            setShowSearchResults(true)
                          }}
                          onFocus={() => setShowSearchResults(true)}
                          placeholder="Buscar item, o escribir una descripción libre"
                          className="w-full text-sm bg-white border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
                          autoFocus
                        />
                        
                        {/* Search Results Dropdown */}
                        {showSearchResults && newItemSearch.trim() && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            {searchResults.length > 0 ? (
                              <>
                                {searchResults.map((item) => (
                                  <button
                                    key={item.id}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                                    onClick={() => handleSelectItem(item)}
                                  >
                                    <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                      <Image
                                        src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                        alt={item.name}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                                        {item.tags && item.tags.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            {item.tags.map((tag, i) => (
                                              <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-slate-200/80 text-slate-500">
                                                {tag}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-xs text-slate-400">{item.sku}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">${item.precio?.toLocaleString("es-AR")}</span>
                                  </button>
                                ))}
                              </>
                            ) : (
                              <div className="px-3 py-4 text-center">
                                <p className="text-sm text-slate-500 mb-2">No se encontraron items</p>
                                <button
                                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                                  onClick={handleAddFreeItem}
                                >
                                  Agregar &quot;{newItemSearch}&quot; como item libre
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Costo Unit. - Empty */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-xs text-slate-300">—</span>
                    </div>

                    {/* Cantidad - Empty */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-xs text-slate-300">—</span>
                    </div>

                    {/* Subtotal - Cancel button */}
                    <div className="col-span-2 flex items-center justify-end">
                      <button
                        onClick={() => {
                          setShowNewItemRow(false)
                          setNewItemSearch("")
                          setShowSearchResults(false)
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Cancelar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Add Item Button */}
                {!showNewItemRow && (
                  <button
                    className="w-full py-4 text-sm text-slate-400 hover:text-amber-600 hover:bg-amber-50/30 transition-colors flex items-center justify-center gap-2 border-t border-dashed border-slate-200 cursor-pointer"
                    onClick={handleShowNewItemRow}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar item
                  </button>
                )}

                {/* Total Row - Part of the grid */}
                <div className="border-t border-slate-200 bg-slate-50/50 py-4 px-4">
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
              </div>

              {/* Bottom border to close the table */}
              <div className="h-px bg-slate-200/80" />
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
