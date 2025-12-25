"use client"

import { useState, useCallback, useMemo } from "react"
import type { Item, ItemVariant } from "@/lib/types"

export interface CartItem {
  id: string
  item: Item
  variant?: ItemVariant
  quantity: number
  unitPrice: number
  originalPrice: number
  priceOverride?: number
  discount: number
  discountType: "percentage" | "fixed"
  subtotal: number
}

export interface POSState {
  cart: CartItem[]
  selectedClientId: string | null
  globalDiscount: number
  globalDiscountType: "percentage" | "fixed"
  paymentMethod: "efectivo" | "tarjeta" | "transferencia" | "cuenta_corriente"
  notes: string
}

export function usePOS() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [globalDiscountType, setGlobalDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia" | "cuenta_corriente">(
    "efectivo",
  )
  const [notes, setNotes] = useState("")

  const addToCart = useCallback((item: Item, variant?: ItemVariant) => {
    const price = variant?.precio?.precioFinal ?? item.precio?.precioFinal ?? 0
    const itemId = variant ? `${item.sku}-${variant.sku}` : item.sku || crypto.randomUUID()

    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.id === itemId)

      if (existingIndex >= 0) {
        const updated = [...prev]
        const existing = updated[existingIndex]
        const newQuantity = existing.quantity + 1
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          subtotal: calculateSubtotal(
            existing.priceOverride ?? existing.originalPrice,
            newQuantity,
            existing.discount,
            existing.discountType,
          ),
        }
        return updated
      }

      return [
        ...prev,
        {
          id: itemId,
          item,
          variant,
          quantity: 1,
          unitPrice: price,
          originalPrice: price,
          discount: 0,
          discountType: "percentage" as const,
          subtotal: price,
        },
      ]
    })
  }, [])

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== itemId))
  }, [])

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(itemId)
        return
      }

      setCart((prev) =>
        prev.map((ci) => {
          if (ci.id === itemId) {
            return {
              ...ci,
              quantity,
              subtotal: calculateSubtotal(ci.priceOverride ?? ci.originalPrice, quantity, ci.discount, ci.discountType),
            }
          }
          return ci
        }),
      )
    },
    [removeFromCart],
  )

  const updatePrice = useCallback((itemId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.id === itemId) {
          return {
            ...ci,
            priceOverride: newPrice,
            unitPrice: newPrice,
            subtotal: calculateSubtotal(newPrice, ci.quantity, ci.discount, ci.discountType),
          }
        }
        return ci
      }),
    )
  }, [])

  const updateItemDiscount = useCallback((itemId: string, discount: number, discountType: "percentage" | "fixed") => {
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.id === itemId) {
          return {
            ...ci,
            discount,
            discountType,
            subtotal: calculateSubtotal(ci.priceOverride ?? ci.originalPrice, ci.quantity, discount, discountType),
          }
        }
        return ci
      }),
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedClientId(null)
    setGlobalDiscount(0)
    setNotes("")
  }, [])

  const subtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.subtotal, 0)
  }, [cart])

  const globalDiscountAmount = useMemo(() => {
    if (globalDiscountType === "percentage") {
      return subtotal * (globalDiscount / 100)
    }
    return globalDiscount
  }, [subtotal, globalDiscount, globalDiscountType])

  const total = useMemo(() => {
    return Math.max(0, subtotal - globalDiscountAmount)
  }, [subtotal, globalDiscountAmount])

  const itemCount = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.quantity, 0)
  }, [cart])

  return {
    cart,
    selectedClientId,
    globalDiscount,
    globalDiscountType,
    paymentMethod,
    notes,
    subtotal,
    globalDiscountAmount,
    total,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    updateItemDiscount,
    clearCart,
    setSelectedClientId,
    setGlobalDiscount,
    setGlobalDiscountType,
    setPaymentMethod,
    setNotes,
  }
}

function calculateSubtotal(
  price: number,
  quantity: number,
  discount: number,
  discountType: "percentage" | "fixed",
): number {
  const lineTotal = price * quantity
  if (discountType === "percentage") {
    return lineTotal * (1 - discount / 100)
  }
  return Math.max(0, lineTotal - discount)
}
