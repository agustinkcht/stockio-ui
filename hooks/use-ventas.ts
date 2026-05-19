"use client"

import { useState, useEffect, useCallback } from "react"
import type { Venta, VentaItem, VentaCobro, VentaEntregaItem, VentaEstado } from "@/lib/types"
import { VENTAS } from "@/lib/data/ventas"
import { useAccount } from "@/lib/contexts/account-context"

// Bump this when the Venta type or seed data changes to force re-seeding
const VENTAS_SEED_VERSION = "v3"

// Ensures a venta object loaded from localStorage has all required fields,
// even if it was saved before a type extension.
function migrateVenta(raw: Partial<Venta> & Record<string, unknown>): Venta {
  return {
    ...raw,
    items: Array.isArray(raw.items) ? raw.items : [],
    cobros: Array.isArray(raw.cobros) ? raw.cobros : [],
    entregaItems: Array.isArray(raw.entregaItems) ? raw.entregaItems : [],
    subtotal: raw.subtotal ?? 0,
    total: raw.total ?? 0,
    descuento: raw.descuento ?? 0,
    descuentoTipo: raw.descuentoTipo ?? "percent",
    estado: raw.estado ?? "en_curso",
  } as Venta
}

// Recomputes derived totals + estado from items/cobros/entregaItems.
function recomputeVenta(v: Venta): Venta {
  const subtotal = v.items.reduce((sum, it) => {
    const baseGross = it.unitPrice * it.quantity
    const discount =
      it.discountType === "percent" ? baseGross * (it.discount / 100) : it.discount * it.quantity
    return sum + (baseGross - discount)
  }, 0)

  const ventaDescuento =
    v.descuentoTipo === "percent" ? subtotal * (v.descuento / 100) : v.descuento
  const total = Math.max(0, subtotal - ventaDescuento)

  const cobrado = v.cobros.reduce((s, c) => s + c.monto, 0)
  const fullyPaid = cobrado + 0.001 >= total && total > 0
  const fullyDelivered = v.items.every((it) => {
    const e = v.entregaItems.find((ei) => ei.sku === it.sku)
    return (e?.quantityEntregada ?? 0) >= it.quantity
  })
  const estado: VentaEstado = fullyPaid && fullyDelivered ? "finalizada" : "en_curso"

  return { ...v, subtotal, total, estado }
}

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentAccount } = useAccount()

  const getStorageKey = useCallback(() => {
    return `stockio_ventas_${currentAccount || "default"}`
  }, [currentAccount])

  // Load ventas from localStorage on mount
  useEffect(() => {
    if (!currentAccount) {
      setIsLoading(false)
      return
    }

    try {
      const storageKey = getStorageKey()
      const versionKey = `${storageKey}_version`
      const storedVersion = localStorage.getItem(versionKey)
      const storedVentas = localStorage.getItem(storageKey)

      if (storedVentas && storedVersion === VENTAS_SEED_VERSION) {
        const parsed = (JSON.parse(storedVentas) as unknown[]).map((v) =>
          migrateVenta(v as Partial<Venta> & Record<string, unknown>)
        )
        setVentas(parsed)
      } else {
        // Re-seed: type changed or first load
        localStorage.setItem(storageKey, JSON.stringify(VENTAS))
        localStorage.setItem(versionKey, VENTAS_SEED_VERSION)
        setVentas(VENTAS)
      }
    } catch (error) {
      console.error("[v0] Error loading ventas:", error)
      setVentas(VENTAS)
    }
    setIsLoading(false)
  }, [currentAccount, getStorageKey])

  // Save ventas to localStorage
  const saveVentas = useCallback(
    (newVentas: Venta[]) => {
      if (!currentAccount) return

      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(newVentas))
      localStorage.setItem(`${storageKey}_version`, VENTAS_SEED_VERSION)
    },
    [currentAccount, getStorageKey],
  )

  // Add a new venta
  const addVenta = useCallback(
    (venta: Omit<Venta, "id">) => {
      // Generate new ID based on existing ventas
      const existingIds = ventas.map((v) => {
        const match = v.id.match(/VTA-(\d+)/)
        return match ? Number.parseInt(match[1], 10) : 0
      })
      const maxId = Math.max(0, ...existingIds)
      const newId = `VTA-${String(maxId + 1).padStart(3, "0")}`

      const newVenta: Venta = {
        ...venta,
        id: newId,
      }

      const updatedVentas = [newVenta, ...ventas]
      setVentas(updatedVentas)
      saveVentas(updatedVentas)

      console.log(`[v0] useVentas - Added new venta: ${newId}`)
      return newVenta
    },
    [ventas, saveVentas],
  )

  // Update an existing venta (low-level)
  const updateVenta = useCallback(
    (ventaId: string, updates: Partial<Venta>) => {
      const updatedVentas = ventas.map((v) =>
        v.id === ventaId ? recomputeVenta({ ...v, ...updates }) : v,
      )
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
      console.log(`[v0] useVentas - Updated venta: ${ventaId}`)
    },
    [ventas, saveVentas],
  )

  // ── Domain helpers ─────────────────────────────────────────

  // Add items to a venta. If the sku already exists, increment quantity.
  const addItemsToVenta = useCallback(
    (ventaId: string, newItems: VentaItem[]) => {
      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v
        const itemsCopy = [...v.items]
        for (const it of newItems) {
          const idx = itemsCopy.findIndex((x) => x.sku === it.sku)
          if (idx >= 0) {
            const existing = itemsCopy[idx]
            const nextQty = existing.quantity + it.quantity
            const baseGross = existing.unitPrice * nextQty
            const disc =
              existing.discountType === "percent"
                ? baseGross * (existing.discount / 100)
                : existing.discount * nextQty
            itemsCopy[idx] = { ...existing, quantity: nextQty, total: baseGross - disc }
          } else {
            itemsCopy.push(it)
          }
        }
        return recomputeVenta({ ...v, items: itemsCopy })
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
      console.log(`[v0] useVentas - Added ${newItems.length} item(s) to ${ventaId}`)
    },
    [ventas, saveVentas],
  )

  // Append a new cobro entry to a venta.
  const addCobro = useCallback(
    (ventaId: string, cobro: Omit<VentaCobro, "id">) => {
      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v
        const newCobro: VentaCobro = {
          ...cobro,
          id: `${ventaId}-COB-${v.cobros.length + 1}-${Date.now()}`,
        }
        return recomputeVenta({ ...v, cobros: [...v.cobros, newCobro] })
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
      console.log(`[v0] useVentas - Added cobro to ${ventaId}`)
    },
    [ventas, saveVentas],
  )

  // Add (sum) delivered units to existing entregaItems entries. Caps at item.quantity.
  const addEntregas = useCallback(
    (ventaId: string, entregas: VentaEntregaItem[]) => {
      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v
        const next = [...v.entregaItems]
        for (const e of entregas) {
          const item = v.items.find((it) => it.sku === e.sku)
          if (!item) continue
          const idx = next.findIndex((ei) => ei.sku === e.sku)
          const existing = idx >= 0 ? next[idx].quantityEntregada : 0
          const newQty = Math.min(item.quantity, existing + e.quantityEntregada)
          if (idx >= 0) next[idx] = { ...next[idx], quantityEntregada: newQty }
          else next.push({ sku: e.sku, quantityEntregada: newQty })
        }
        return recomputeVenta({ ...v, entregaItems: next })
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
      console.log(`[v0] useVentas - Updated entregas on ${ventaId}`)
    },
    [ventas, saveVentas],
  )

  // Manually flip estado. Useful for "Marcar como Finalizada".
  const setEstado = useCallback(
    (ventaId: string, estado: VentaEstado) => {
      const updatedVentas = ventas.map((v) => (v.id === ventaId ? { ...v, estado } : v))
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
      console.log(`[v0] useVentas - Set estado of ${ventaId} to ${estado}`)
    },
    [ventas, saveVentas],
  )

  return {
    ventas,
    isLoading,
    addVenta,
    updateVenta,
    addItemsToVenta,
    addCobro,
    addEntregas,
    setEstado,
  }
}

