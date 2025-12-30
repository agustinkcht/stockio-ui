"use client"

import { useState, useEffect, useCallback } from "react"
import type { Venta } from "@/lib/types"
import { VENTAS } from "@/lib/data/ventas"
import { useAccount } from "@/lib/contexts/account-context"

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
      const storedVentas = localStorage.getItem(storageKey)

      if (storedVentas) {
        const parsedVentas = JSON.parse(storedVentas)
        console.log(`[v0] useVentas - Loaded ${parsedVentas.length} ventas from localStorage`)
        setVentas(parsedVentas)
      } else {
        console.log(`[v0] useVentas - Loading ${VENTAS.length} initial ventas`)
        localStorage.setItem(storageKey, JSON.stringify(VENTAS))
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
      console.log(`[v0] useVentas - Saved ${newVentas.length} ventas to localStorage`)
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

  return {
    ventas,
    isLoading,
    addVenta,
  }
}
