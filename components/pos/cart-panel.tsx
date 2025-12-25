"use client"

import { useState } from "react"
import { Trash2, Minus, Plus, Percent, DollarSign, AlertTriangle, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null)
  const [tempPrice, setTempPrice] = useState("")
  const [tempDiscount, setTempDiscount] = useState("")
  const [tempDiscountType, setTempDiscountType] = useState<"percentage" | "fixed">("percentage")

  const getFullTitle = (item: CartItem): string => {
    const baseItem = item.variant || item.item
    const isParent = item.item.tipo === "agrupador"

    // For parent items (agrupador), just return the name
    if (isParent && !item.variant) {
      return item.item.name
    }

    // For standalone or child items, concatenate with attributes
    const attributes = baseItem.atributosPrincipales
      ? Object.values(baseItem.atributosPrincipales)
          .filter((attr) => attr && typeof attr === "object" && "valor" in attr)
          .map((attr) => attr.valor)
          .filter(Boolean)
      : []

    return attributes.length > 0 ? `${baseItem.name} ${attributes.join(" ")}` : baseItem.name
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

  const handleStartEditDiscount = (item: CartItem) => {
    setEditingDiscount(item.id)
    setTempDiscount(item.discount.toString())
    setTempDiscountType(item.discountType)
  }

  const handleSaveDiscount = (itemId: string) => {
    const discount = Number.parseFloat(tempDiscount)
    if (!isNaN(discount) && discount >= 0) {
      onUpdateDiscount(itemId, discount, tempDiscountType)
    }
    setEditingDiscount(null)
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
          const displayName = getFullTitle(item)
          const displaySku = item.variant?.sku || item.item.sku
          const hasDiscount = item.discount > 0
          const hasPriceOverride = item.priceOverride !== undefined

          return (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-lg bg-muted/20 border border-transparent transition-all",
                stockWarning.critical && "border-red-500/30 bg-red-500/5",
              )}
            >
              {/* Header Row */}
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{displaySku}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-red-500"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

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

              {/* Price Row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground w-12">Precio:</span>
                {editingPrice === item.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSavePrice(item.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPrice(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className={cn("text-sm", hasPriceOverride && "text-blue-500")}>
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
                      className="h-6 w-6 ml-auto"
                      onClick={() => handleStartEditPrice(item)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Discount Row */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground w-12">Desc.:</span>
                {editingDiscount === item.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="number"
                      value={tempDiscount}
                      onChange={(e) => setTempDiscount(e.target.value)}
                      className="h-7 text-sm w-20"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant={tempDiscountType === "percentage" ? "default" : "ghost"}
                      className="h-7 w-7"
                      onClick={() => setTempDiscountType("percentage")}
                    >
                      <Percent className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant={tempDiscountType === "fixed" ? "default" : "ghost"}
                      className="h-7 w-7"
                      onClick={() => setTempDiscountType("fixed")}
                    >
                      <DollarSign className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveDiscount(item.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingDiscount(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className={cn("text-sm", hasDiscount && "text-emerald-500")}>
                      {hasDiscount ? `${item.discount}${item.discountType === "percentage" ? "%" : "$"}` : "—"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => handleStartEditDiscount(item)}
                    >
                      <Percent className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Quantity & Subtotal Row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 bg-transparent"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 bg-transparent"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-semibold">${item.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
