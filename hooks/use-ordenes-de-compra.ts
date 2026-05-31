"use client"

import { useState, useEffect, useCallback } from "react"
import type { OrdenDeCompra, EstadoOrdenDeCompra } from "@/lib/types"
import { ORDENES_DE_COMPRA } from "@/lib/data/initial-ordenes-de-compra"
import { useAccount } from "@/lib/contexts/account-context"

const STORAGE_KEY_PREFIX = "stockio_ordenes_de_compra"
const DATA_VERSION = "v4" // bump to reseed localStorage with new dataset

export function useOrdenesDeCompra() {
  const [ordenes, setOrdenes] = useState<OrdenDeCompra[]>(ORDENES_DE_COMPRA)
  const [isLoading, setIsLoading] = useState(true)
  const { currentAccount } = useAccount()

  const getStorageKey = useCallback(() => {
    return `${STORAGE_KEY_PREFIX}_${currentAccount || "default"}_${DATA_VERSION}`
  }, [currentAccount])

  // Load ordenes from localStorage on mount
  useEffect(() => {
    if (!currentAccount) {
      setIsLoading(false)
      return
    }

    try {
      const storageKey = getStorageKey()
      const storedOrdenes = localStorage.getItem(storageKey)

      if (storedOrdenes) {
        const parsedOrdenes = JSON.parse(storedOrdenes)
        setOrdenes(parsedOrdenes)
      } else {
        localStorage.setItem(storageKey, JSON.stringify(ORDENES_DE_COMPRA))
        setOrdenes(ORDENES_DE_COMPRA)
      }
    } catch (error) {
      setOrdenes(ORDENES_DE_COMPRA)
    }
    setIsLoading(false)
  }, [currentAccount, getStorageKey])

  // Save ordenes to localStorage
  const saveOrdenes = useCallback(
    (newOrdenes: OrdenDeCompra[]) => {
      if (!currentAccount) return

      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(newOrdenes))
    },
    [currentAccount, getStorageKey],
  )

  // Generate next order number
  const getNextOrderNumber = useCallback(() => {
    const maxNumber = ordenes.reduce((max, o) => Math.max(max, o.numero), 0)
    return maxNumber + 1
  }, [ordenes])

  // Add a new orden
  const addOrden = useCallback(
    (orden: Omit<OrdenDeCompra, "id" | "numero">) => {
      const nextNumber = getNextOrderNumber()
      const newOrden: OrdenDeCompra = {
        ...orden,
        id: `ODC-${nextNumber}`,
        numero: nextNumber,
      }

      const updatedOrdenes = [newOrden, ...ordenes]
      setOrdenes(updatedOrdenes)
      saveOrdenes(updatedOrdenes)
      return newOrden
    },
    [ordenes, saveOrdenes, getNextOrderNumber],
  )

  // Update an existing orden
  const updateOrden = useCallback(
    (id: string, updates: Partial<OrdenDeCompra>) => {
      const updatedOrdenes = ordenes.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      )
      setOrdenes(updatedOrdenes)
      saveOrdenes(updatedOrdenes)
    },
    [ordenes, saveOrdenes],
  )

  // Update estado of an orden
  const updateEstado = useCallback(
    (id: string, estado: EstadoOrdenDeCompra) => {
      updateOrden(id, { estado })
    },
    [updateOrden],
  )

  // Delete an orden
  const deleteOrden = useCallback(
    (id: string) => {
      const updatedOrdenes = ordenes.filter((o) => o.id !== id)
      setOrdenes(updatedOrdenes)
      saveOrdenes(updatedOrdenes)
    },
    [ordenes, saveOrdenes],
  )

  // Get a single orden by ID
  const getOrdenById = useCallback(
    (id: string) => {
      return ordenes.find((o) => o.id === id) || null
    },
    [ordenes],
  )

  return {
    ordenes,
    isLoading,
    addOrden,
    updateOrden,
    updateEstado,
    deleteOrden,
    getOrdenById,
    getNextOrderNumber,
  }
}
