"use client"

import { useState, useEffect, useCallback } from "react"
import type { Proveedor } from "@/lib/data/proveedores"
import { useAccount } from "@/lib/contexts/account-context"

export function useProveedores() {
  const { currentAccount } = useAccount()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getStorageKey = useCallback(() => {
    return `stockio-proveedores-${currentAccount}`
  }, [currentAccount])

  useEffect(() => {
    const loadProveedores = async () => {
      setIsLoading(true)

      const storageKey = getStorageKey()
      const savedProveedores = localStorage.getItem(storageKey)

      if (savedProveedores) {
        setProveedores(JSON.parse(savedProveedores))
      } else {
        // Load initial proveedores based on current account
        try {
          if (currentAccount === "invino") {
            const { INITIAL_PROVEEDORES } = await import("@/lib/data/initial-proveedores-invino")
            setProveedores(INITIAL_PROVEEDORES)
            localStorage.setItem(storageKey, JSON.stringify(INITIAL_PROVEEDORES))
          } else if (currentAccount === "noire") {
            const { INITIAL_PROVEEDORES } = await import("@/lib/data/initial-proveedores-noire")
            setProveedores(INITIAL_PROVEEDORES)
            localStorage.setItem(storageKey, JSON.stringify(INITIAL_PROVEEDORES))
          }
        } catch (error) {
          console.error("Error loading initial proveedores:", error)
          setProveedores([])
        }
      }

      setIsLoading(false)
    }

    loadProveedores()
  }, [currentAccount, getStorageKey])

  const saveProveedores = useCallback(
    (newProveedores: Proveedor[]) => {
      const storageKey = getStorageKey()
      setProveedores(newProveedores)
      localStorage.setItem(storageKey, JSON.stringify(newProveedores))
    },
    [getStorageKey],
  )

  const addProveedor = useCallback(
    (proveedor: Proveedor) => {
      const newProveedores = [...proveedores, proveedor]
      saveProveedores(newProveedores)
    },
    [proveedores, saveProveedores],
  )

  const updateProveedor = useCallback(
    (id: string, updates: Partial<Proveedor>) => {
      const newProveedores = proveedores.map((p) => (p.id === id ? { ...p, ...updates } : p))
      saveProveedores(newProveedores)
    },
    [proveedores, saveProveedores],
  )

  const deleteProveedor = useCallback(
    (id: string) => {
      const newProveedores = proveedores.filter((p) => p.id !== id)
      saveProveedores(newProveedores)
    },
    [proveedores, saveProveedores],
  )

  const getProveedorById = useCallback(
    (id: string) => {
      return proveedores.find((p) => p.id === id)
    },
    [proveedores],
  )

  const incrementProveedorTransaction = useCallback(
    (proveedorId: string) => {
      const storageKey = getStorageKey()
      const storedProveedores = localStorage.getItem(storageKey)
      if (!storedProveedores) return

      const currentProveedores: Proveedor[] = JSON.parse(storedProveedores)
      const updatedProveedores = currentProveedores.map((p) => {
        if (p.id === proveedorId) {
          return {
            ...p,
            transactionCount: (p.transactionCount || 0) + 1,
          }
        }
        return p
      })

      localStorage.setItem(storageKey, JSON.stringify(updatedProveedores))
      setProveedores(updatedProveedores)
      console.log(`[v0] useProveedores - Incremented transaction count for proveedor: ${proveedorId}`)
    },
    [getStorageKey],
  )

  return {
    proveedores,
    isLoading,
    addProveedor,
    updateProveedor,
    deleteProveedor,
    getProveedorById,
    incrementProveedorTransaction,
  }
}
