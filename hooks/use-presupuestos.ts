"use client"

import { useState, useEffect, useCallback } from "react"
import type { Presupuesto, EstadoPresupuesto } from "@/lib/types"
import { useAccount } from "@/lib/contexts/account-context"
import { INITIAL_PRESUPUESTOS as SEED_PRESUPUESTOS } from "@/lib/data/initial-presupuestos"

const STORAGE_KEY_PREFIX = "stockio_presupuestos"
// Bump when the Presupuesto type changes or seed data changes to force a clean reset.
const PRESUPUESTOS_SEED_VERSION = "v4"

const INITIAL_PRESUPUESTOS: Presupuesto[] = SEED_PRESUPUESTOS

// Recomputes derived totals from items + ajustes (mirrors recomputeVenta, no cobro/entrega).
function recomputePresupuesto(p: Presupuesto): Presupuesto {
  const subtotal = p.items.reduce((sum, it) => {
    if (it.discountType === "unit") {
      const paidQty = Math.max(0, it.quantity - Math.min(it.discount, it.quantity))
      return sum + paidQty * it.unitPrice
    }
    const baseGross = it.unitPrice * it.quantity
    const discount =
      it.discountType === "percent" ? baseGross * (it.discount / 100) : it.discount * it.quantity
    return sum + (baseGross - discount)
  }, 0)

  const presupuestoDescuento =
    p.descuentoTipo === "percent" ? subtotal * (p.descuento / 100) : p.descuento
  const envio = p.envio ?? 0
  const customChargesTotal = (p.customCharges ?? []).reduce((s, c) => s + c.value, 0)
  const total = Math.max(0, subtotal - presupuestoDescuento + envio + customChargesTotal)

  return { ...p, subtotal, total }
}

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
      const versionKey = `${storageKey}_version`
      const storedVersion = localStorage.getItem(versionKey)
      const storedPresupuestos = localStorage.getItem(storageKey)

      if (storedPresupuestos && storedVersion === PRESUPUESTOS_SEED_VERSION) {
        setPresupuestos(JSON.parse(storedPresupuestos))
      } else {
        // Stale or missing → reset to empty with current version
        localStorage.setItem(storageKey, JSON.stringify(INITIAL_PRESUPUESTOS))
        localStorage.setItem(versionKey, PRESUPUESTOS_SEED_VERSION)
        setPresupuestos(INITIAL_PRESUPUESTOS)
      }
    } catch (error) {
      console.error("[usePresupuestos] Error loading presupuestos:", error)
      setPresupuestos(INITIAL_PRESUPUESTOS)
    }
    setIsLoading(false)
  }, [currentAccount, getStorageKey])

  const savePresupuestos = useCallback(
    (newPresupuestos: Presupuesto[]) => {
      if (!currentAccount) return
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(newPresupuestos))
      localStorage.setItem(`${storageKey}_version`, PRESUPUESTOS_SEED_VERSION)
    },
    [currentAccount, getStorageKey],
  )

  const getNextPresupuestoNumber = useCallback(() => {
    const maxNumber = presupuestos.reduce((max, p) => Math.max(max, p.numero), 0)
    return maxNumber + 1
  }, [presupuestos])

  // Add a new presupuesto
  const addPresupuesto = useCallback(
    (presupuesto: Omit<Presupuesto, "id" | "numero">) => {
      const nextNumber = getNextPresupuestoNumber()
      const newPresupuesto: Presupuesto = recomputePresupuesto({
        ...presupuesto,
        id: `PRE-${String(nextNumber).padStart(3, "0")}`,
        numero: nextNumber,
      } as Presupuesto)

      const updatedPresupuestos = [newPresupuesto, ...presupuestos]
      setPresupuestos(updatedPresupuestos)
      savePresupuestos(updatedPresupuestos)
      return newPresupuesto
    },
    [presupuestos, savePresupuestos, getNextPresupuestoNumber],
  )

  // Update an existing presupuesto (recomputes totals)
  const updatePresupuesto = useCallback(
    (id: string, updates: Partial<Presupuesto>) => {
      const updatedPresupuestos = presupuestos.map((p) =>
        p.id === id
          ? recomputePresupuesto({
              ...p,
              ...updates,
              fechaModificacion: new Date().toISOString().split("T")[0],
            })
          : p,
      )
      setPresupuestos(updatedPresupuestos)
      savePresupuestos(updatedPresupuestos)
    },
    [presupuestos, savePresupuestos],
  )

  const updateEstado = useCallback(
    (id: string, estado: EstadoPresupuesto) => {
      updatePresupuesto(id, { estado })
    },
    [updatePresupuesto],
  )

  const deletePresupuesto = useCallback(
    (id: string) => {
      const updatedPresupuestos = presupuestos.filter((p) => p.id !== id)
      setPresupuestos(updatedPresupuestos)
      savePresupuestos(updatedPresupuestos)
    },
    [presupuestos, savePresupuestos],
  )

  const getPresupuestoById = useCallback(
    (id: string) => presupuestos.find((p) => p.id === id) || null,
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
