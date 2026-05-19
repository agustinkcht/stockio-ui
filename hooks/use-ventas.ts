"use client"

import { useState, useEffect, useCallback } from "react"
import type { Venta } from "@/lib/types"
import { VENTAS } from "@/lib/data/ventas"
import { useAccount } from "@/lib/contexts/account-context"

// Bump this when the Venta type or seed data changes to force re-seeding
const VENTAS_SEED_VERSION = "v2"

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
        setVentas(JSON.parse(storedVentas))
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
      return newVenta
    },
    [ventas, saveVentas],
  )

  // Update an existing venta
  const updateVenta = useCallback(
    (ventaId: string, updates: Partial<Venta>) => {
      const updatedVentas = ventas.map((v) =>
        v.id === ventaId ? { ...v, ...updates } : v
      )
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
    },
    [ventas, saveVentas],
  )

  return {
    ventas,
    isLoading,
    addVenta,
    updateVenta,
  }
}
