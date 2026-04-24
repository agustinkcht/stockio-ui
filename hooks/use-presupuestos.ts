"use client"

import { useState, useEffect, useCallback } from "react"
import type { Presupuesto, EstadoPresupuesto } from "@/lib/types"
import { useAccount } from "@/lib/contexts/account-context"

const STORAGE_KEY_PREFIX = "stockio_presupuestos"

// Initial empty presupuestos array - will be populated by user
const INITIAL_PRESUPUESTOS: Presupuesto[] = []

export function usePresupuestos() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(INITIAL_PRESUPUESTOS)
  const [isLoading, setIsLoading] = useState(true)
  const { currentAccount } = useAccount()

  const getStorageKey = useCallback(() => {
    return `${STORAGE_KEY_PREFIX}_${currentAccount || "default"}`
  }, [currentAccount])

  // Load presupuestos from localStorage on mount
  useEffect(() => {
    if (!currentAccount) {
      setIsLoading(false)
      return
    }

    try {
      const storageKey = getStorageKey()
      const storedPresupuestos = localStorage.getItem(storageKey)

      if (storedPresupuestos) {
        const parsedPresupuestos = JSON.parse(storedPresupuestos)
        setPresupuestos(parsedPresupuestos)
      } else {
        localStorage.setItem(storageKey, JSON.stringify(INITIAL_PRESUPUESTOS))
        setPresupuestos(INITIAL_PRESUPUESTOS)
      }
    } catch (error) {
      console.error("[usePresupuestos] Error loading presupuestos:", error)
      setPresupuestos(INITIAL_PRESUPUESTOS)
    }
    setIsLoading(false)
  }, [currentAccount, getStorageKey])

  // Save presupuestos to localStorage
  const savePresupuestos = useCallback(
    (newPresupuestos: Presupuesto[]) => {
      if (!currentAccount) return

      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(newPresupuestos))
    },
    [currentAccount, getStorageKey],
  )

  // Generate next presupuesto number
  const getNextPresupuestoNumber = useCallback(() => {
    const maxNumber = presupuestos.reduce((max, p) => Math.max(max, p.numero), 0)
    return maxNumber + 1
  }, [presupuestos])

  // Add a new presupuesto
  const addPresupuesto = useCallback(
    (presupuesto: Omit<Presupuesto, "id" | "numero">) => {
      const nextNumber = getNextPresupuestoNumber()
      const newPresupuesto: Presupuesto = {
        ...presupuesto,
        id: `PRE-${nextNumber}`,
        numero: nextNumber,
      }

      const updatedPresupuestos = [newPresupuesto, ...presupuestos]
      setPresupuestos(updatedPresupuestos)
      savePresupuestos(updatedPresupuestos)

      return newPresupuesto
    },
    [presupuestos, savePresupuestos, getNextPresupuestoNumber],
  )

  // Update an existing presupuesto
  const updatePresupuesto = useCallback(
    (id: string, updates: Partial<Presupuesto>) => {
      const updatedPresupuestos = presupuestos.map((p) =>
        p.id === id ? { ...p, ...updates, fechaModificacion: new Date().toISOString().split("T")[0] } : p
      )
      setPresupuestos(updatedPresupuestos)
      savePresupuestos(updatedPresupuestos)
    },
    [presupuestos, savePresupuestos],
  )

  // Update estado of a presupuesto
  const updateEstado = useCallback(
    (id: string, estado: EstadoPresupuesto) => {
      updatePresupuesto(id, { estado })
    },
    [updatePresupuesto],
  )

  // Delete a presupuesto
  const deletePresupuesto = useCallback(
    (id: string) => {
      const updatedPresupuestos = presupuestos.filter((p) => p.id !== id)
      setPresupuestos(updatedPresupuestos)
      savePresupuestos(updatedPresupuestos)
    },
    [presupuestos, savePresupuestos],
  )

  // Get a single presupuesto by ID
  const getPresupuestoById = useCallback(
    (id: string) => {
      return presupuestos.find((p) => p.id === id) || null
    },
    [presupuestos],
  )

  return {
    presupuestos,
    isLoading,
    addPresupuesto,
    updatePresupuesto,
    updateEstado,
    deletePresupuesto,
    getPresupuestoById,
    getNextPresupuestoNumber,
  }
}
