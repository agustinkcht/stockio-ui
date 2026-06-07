"use client"

import { useState } from "react"
import { Trash2, Minus, Plus, AlertTriangle, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CartItem } from "@/hooks/use-pos"

interface CartPanelProps {
  cart: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  onUpdatePrice: (itemId: string, price: number) => void
  onUpdateDiscount: (itemId: string, discount: number, type: "percentage" | "fixed") => void
}

export function CartPanel({ cart, onUpdateQuantity, onRemove, onUpdatePrice, onUpdateDiscount }: CartPanelProps) {
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [tempPrice, setTempPrice] = useState("")

  const getTags = (item: CartItem): string[] => {
    const baseItem = item.variant || item.item
    if (!baseItem.atributosPrincipales || !Array.isArray(baseItem.atributosPrincipales)) return []
    return baseItem.atributosPrincipales
      .map((attr: any) => attr.value || attr.valor)
      .filter((v: any) => v && String(v).trim() !== "")
      .map(String)
  }

  const getDisplayName = (item: CartItem): string => {
    // For variants, show parent name; tags shown separately
    if (item.variant) return item.item.name
    return item.item.name
  }

  const handleStartEditPrice = (item: CartItem) => {
    setEditingPrice(item.id)
    setTempPrice((item.priceOverride ?? item.originalPrice).toString())
  }

  const handleSavePrice = (itemId: string) => {
    const price = Number.parseFloat(tempPrice)
    if (!isNaN(price) && price >= 0) {
      onUpdatePrice(itemId, price)
    }
    setEditingPrice(null)
  }

  const getStockWarning = (item: CartItem) => {
    const stock = item.variant?.stock || item.item.stock
    const disponible = Number.parseInt(stock?.disponible || "0")
    if (item.quantity >= disponible && disponible > 0) {
      return { show: true, message: "Últimas unidades" }
    }
    if (item.quantity > disponible) {
      return { show: true, message: "Stock insuficiente", critical: true }
    }
    return { show: false }
  }

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium">Carrito vacío</p>
        <p className="text-xs mt-1">Agregá productos para comenzar</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-2 space-y-1">
        {cart.map((item) => {
          const stockWarning = getStockWarning(item)
          const displayName = getDisplayName(item)
          const tags = getTags(item)
          const hasPriceOverride = item.priceOverride !== undefined

          return (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-lg bg-muted/20 border border-transparent transition-all",
                stockWarning.critical && "border-red-500/30 bg-red-500/5",
              )}
            >
              {/* Title + marca/categoria + trash */}
              <div className="flex items-start gap-2 mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-sm truncate">{displayName}</p>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium leading-none flex-shrink-0"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {item.item.marca && <span className="text-xs text-muted-foreground">{item.item.marca}</span>}
                    {item.item.marca && item.item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                    {item.item.categoria && <span className="text-xs text-muted-foreground">{item.item.categoria}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-red-500 flex-shrink-0"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Separator */}
              <div className="border-t border-border/30 mb-2.5" />

              {/* Stock Warning */}
              {stockWarning.show && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded",
                    stockWarning.critical ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {stockWarning.message}
                </div>
              )}

              {/* Cantidad (left) + Precio (right) — same row */}
              <div className="flex items-center justify-between gap-3">
                {/* Quantity — pill style matching nueva venta step 2 */}
                <div className="flex items-center border border-slate-200 rounded-full px-1 py-0.5 bg-white">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      onUpdateQuantity(item.id, val)
                    }}
                    className="w-10 text-center text-sm py-1 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Price — label / value / pencil */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Precio:</span>
                  {editingPrice === item.id ? (
                    <div className="flex items-center gap-1.5">
                      {/* $ + input — matching nueva venta precio unit style */}
                      <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-1">
                        <span className="text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          autoFocus
                          className="w-20 text-sm focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      {/* Check / X wrapped in black button-like divs */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSavePrice(item.id)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-700 text-white transition-colors"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingPrice(null)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-700 text-white transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={cn("text-sm font-medium", hasPriceOverride && "text-blue-500")}>
                        ${(item.priceOverride ?? item.originalPrice).toLocaleString("es-AR")}
                      </span>
                      {hasPriceOverride && (
                        <span className="text-xs text-muted-foreground line-through">
                          ${item.originalPrice.toLocaleString("es-AR")}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleStartEditPrice(item)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Separator + Total */}
              <div className="border-t border-border/30 mt-2.5 pt-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="font-semibold text-sm">
                  ${item.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
