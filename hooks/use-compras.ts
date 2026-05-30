"use client"

import { useState, useEffect, useCallback } from "react"
import type { Compra } from "@/lib/types"
import { COMPRAS } from "@/lib/data/compras"
import { useAccount } from "@/lib/contexts/account-context"

export function useCompras() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentAccount } = useAccount()

  const getStorageKey = useCallback(() => {
    return `stockio_compras_${currentAccount || "default"}_v2`
  }, [currentAccount])

  // Load compras from localStorage on mount
  useEffect(() => {
    if (!currentAccount) {
      setIsLoading(false)
      return
    }

    try {
      const storageKey = getStorageKey()
      const storedCompras = localStorage.getItem(storageKey)

      if (storedCompras) {
        setCompras(JSON.parse(storedCompras))
      } else {
        localStorage.setItem(storageKey, JSON.stringify(COMPRAS))
        setCompras(COMPRAS)
      }
    } catch (error) {
      console.error("[v0] Error loading compras:", error)
      setCompras(COMPRAS)
    }
    setIsLoading(false)
  }, [currentAccount, getStorageKey])

  // Save compras to localStorage
  const saveCompras = useCallback(
    (newCompras: Compra[]) => {
      if (!currentAccount) return

      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(newCompras))

    },
    [currentAccount, getStorageKey],
  )

  // Add a new compra
  const addCompra = useCallback(
    (compra: Omit<Compra, "id">) => {
      // Generate new ID based on existing compras
      const existingIds = compras.map((c) => {
        const match = c.id.match(/COMP-(\d+)/)
        return match ? Number.parseInt(match[1], 10) : 0
      })
      const maxId = Math.max(0, ...existingIds)
      const newId = `COMP-${String(maxId + 1).padStart(3, "0")}`

      const newCompra: Compra = {
        ...compra,
        id: newId,
      }

      const updatedCompras = [newCompra, ...compras]
      setCompras(updatedCompras)
      saveCompras(updatedCompras)

      return newCompra
    },
    [compras, saveCompras],
  )

  return {
    compras,
    isLoading,
    addCompra,
  }
}
