"use client"

import { useState, useEffect, useCallback } from "react"
import type { Venta, VentaItem, VentaCobro, VentaEntregaItem, VentaEntregaEntry, VentaDevolucionItem, VentaDevolucionEntry, VentaEstado } from "@/lib/types"
import { VENTAS } from "@/lib/data/ventas"
import { useAccount } from "@/lib/contexts/account-context"

// Bump this when the Venta type or seed data changes to force re-seeding
const VENTAS_SEED_VERSION = "v6"

// Ensures a venta object loaded from localStorage has all required fields,
// even if it was saved before a type extension.
function migrateVenta(raw: Partial<Venta> & Record<string, unknown>): Venta {
  return {
    ...raw,
    items: Array.isArray(raw.items) ? raw.items : [],
    cobros: Array.isArray(raw.cobros) ? raw.cobros : [],
    entregaItems: Array.isArray(raw.entregaItems) ? raw.entregaItems : [],
    entregaEntries: Array.isArray(raw.entregaEntries) ? raw.entregaEntries : [],
    devolucionItems: Array.isArray(raw.devolucionItems) ? raw.devolucionItems : [],
    devolucionEntries: Array.isArray(raw.devolucionEntries) ? raw.devolucionEntries : [],
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
  const montoDevuelto = (v.devolucionEntries ?? []).reduce((s, e) => s + e.montoDevuelto, 0)
  const total = Math.max(0, subtotal - ventaDescuento - montoDevuelto)

  const cobrado = v.cobros.reduce((s, c) => s + c.monto, 0)
  const fullyPaid = cobrado + 0.001 >= total && total > 0
  const fullyDelivered = v.items.every((it) => {
    const e = v.entregaItems.find((ei) => ei.sku === it.sku)
    return (e?.quantityEntregada ?? 0) >= it.quantity
  })
  // A devolucion must never downgrade a finalizada venta
  const estado: VentaEstado =
    v.estado === "cancelada" ? "cancelada"
    : v.estado === "finalizada" ? "finalizada"
    : (fullyPaid && fullyDelivered ? "finalizada" : "en_curso")

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
  // Also appends a VentaEntregaEntry log entry with a timestamp.
  const addEntregas = useCallback(
    (ventaId: string, entregas: VentaEntregaItem[], fecha?: string, hora?: string) => {
      const now = new Date()
      const entryFecha = fecha ?? now.toISOString().slice(0, 10)
      const entryHora = hora ?? now.toTimeString().slice(0, 5)

      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v
        const next = [...v.entregaItems]
        const entryItems: VentaEntregaEntry["items"] = []

        for (const e of entregas) {
          const item = v.items.find((it) => it.sku === e.sku)
          if (!item) continue
          const idx = next.findIndex((ei) => ei.sku === e.sku)
          const existing = idx >= 0 ? next[idx].quantityEntregada : 0
          const newQty = Math.min(item.quantity, existing + e.quantityEntregada)
          const actualDelivered = newQty - existing
          if (actualDelivered <= 0) continue
          if (idx >= 0) next[idx] = { ...next[idx], quantityEntregada: newQty }
          else next.push({ sku: e.sku, quantityEntregada: newQty })
          entryItems.push({ sku: e.sku, quantity: actualDelivered })
        }

        const newEntry: VentaEntregaEntry = {
          id: `${ventaId}-ENT-${(v.entregaEntries ?? []).length + 1}-${Date.now()}`,
          fecha: entryFecha,
          hora: entryHora,
          items: entryItems,
        }

        return recomputeVenta({
          ...v,
          entregaItems: next,
          entregaEntries: [...(v.entregaEntries ?? []), newEntry],
        })
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
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

  // Atomic "Marcar como Finalizada": delivers all pending units + registers remaining cobro in one save.
  const finalizarVenta = useCallback(
    (ventaId: string, cobroMedioPago: PaymentMethod, cobroFecha: string, cobroHora: string) => {
      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v

        // 1. Complete all pending entregas + log entry
        const entregaNext = [...v.entregaItems]
        const entryItems: VentaEntregaEntry["items"] = []
        for (const item of v.items) {
          const idx = entregaNext.findIndex((ei) => ei.sku === item.sku)
          const existing = idx >= 0 ? entregaNext[idx].quantityEntregada : 0
          const remaining = item.quantity - existing
          if (remaining <= 0) continue
          if (idx >= 0) entregaNext[idx] = { ...entregaNext[idx], quantityEntregada: item.quantity }
          else entregaNext.push({ sku: item.sku, quantityEntregada: item.quantity })
          entryItems.push({ sku: item.sku, quantity: remaining })
        }
        const entregaEntriesNext = [...(v.entregaEntries ?? [])]
        if (entryItems.length > 0) {
          entregaEntriesNext.push({
            id: `${ventaId}-ENT-${entregaEntriesNext.length + 1}-${Date.now()}`,
            fecha: cobroFecha,
            hora: cobroHora,
            items: entryItems,
          })
        }

        // 2. Register cobro for remaining balance (recompute with fresh entregaNext first)
        const interim = recomputeVenta({ ...v, entregaItems: entregaNext, entregaEntries: entregaEntriesNext })
        const cobrado = interim.cobros.reduce((s, c) => s + c.monto, 0)
        const remaining = Math.max(0, interim.total - cobrado)
        const cobrosNext = [...interim.cobros]
        if (remaining > 0) {
          cobrosNext.push({
            id: `${ventaId}-COB-${cobrosNext.length + 1}-${Date.now()}`,
            fecha: cobroFecha,
            hora: cobroHora,
            medioPago: cobroMedioPago,
            monto: remaining,
          })
        }

        // 3. Force estado finalizada
        return { ...recomputeVenta({ ...interim, cobros: cobrosNext }), estado: "finalizada" as VentaEstado }
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
      console.log(`[v0] useVentas - Finalized venta: ${ventaId}`)
    },
    [ventas, saveVentas],
  )

  // Remove a cobro entry by id and recompute totals
  const undoCobro = useCallback(
    (ventaId: string, cobroId: string) => {
      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v
        const cobros = v.cobros.filter((c) => c.id !== cobroId)
        return recomputeVenta({ ...v, cobros })
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
    },
    [ventas, saveVentas],
  )

  // Remove an entrega entry by id, subtract its units from entregaItems, and recompute
  const undoEntregaEntry = useCallback(
    (ventaId: string, entryId: string) => {
      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v
        const entry = (v.entregaEntries ?? []).find((e) => e.id === entryId)
        if (!entry) return v
        const entregaItems = v.entregaItems.map((ei) => {
          const undone = entry.items.find((i) => i.sku === ei.sku)
          if (!undone) return ei
          return { ...ei, quantityEntregada: Math.max(0, ei.quantityEntregada - undone.quantity) }
        })
        const entregaEntries = (v.entregaEntries ?? []).filter((e) => e.id !== entryId)
        return recomputeVenta({ ...v, entregaItems, entregaEntries })
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
    },
    [ventas, saveVentas],
  )

  // Register a devolucion: reduce entregaItems, append devolucionItems + devolucionEntries, add negative cobro
  const addDevolucion = useCallback(
    (ventaId: string, devoluciones: VentaDevolucionItem[], montoDevuelto: number) => {
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = now.toTimeString().slice(0, 5)

      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v

        // Update running devolucionItems totals — entregaItems are NOT touched
        const nextDevItems = [...(v.devolucionItems ?? [])]
        for (const d of devoluciones) {
          const idx = nextDevItems.findIndex((di) => di.sku === d.sku)
          if (idx >= 0) nextDevItems[idx] = { ...nextDevItems[idx], quantityDevuelta: nextDevItems[idx].quantityDevuelta + d.quantityDevuelta }
          else nextDevItems.push({ sku: d.sku, quantityDevuelta: d.quantityDevuelta })
        }

        // New devolucion entry
        const newEntry: VentaDevolucionEntry = {
          id: `${ventaId}-DEV-${(v.devolucionEntries ?? []).length + 1}-${Date.now()}`,
          fecha,
          hora,
          items: devoluciones.map((d) => ({ sku: d.sku, quantity: d.quantityDevuelta })),
          montoDevuelto,
          medioPago: "",
        }

        // Cobro entry for the refund — monto negative so UI can render it distinctly
        const refundCobro: VentaCobro = {
          id: `${ventaId}-DEV-COB-${Date.now()}`,
          fecha,
          hora,
          medioPago: "devolucion" as PaymentMethod,
          monto: -montoDevuelto,
        }

        return recomputeVenta({
          ...v,
          devolucionItems: nextDevItems,
          devolucionEntries: [...(v.devolucionEntries ?? []), newEntry],
          cobros: [...v.cobros, refundCobro],
        })
      })
      setVentas(updatedVentas)
      saveVentas(updatedVentas)
    },
    [ventas, saveVentas],
  )

  // Cancel a venta. Optionally creates a refund cobro and/or a "devolucion" entrega entry.
  const cancelarVenta = useCallback(
    (ventaId: string, opts: { devolverUnidades: boolean; devolverCobros: boolean }) => {
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = now.toTimeString().slice(0, 5)

      const updatedVentas = ventas.map((v) => {
        if (v.id !== ventaId) return v

        let cobrosNext = [...v.cobros]
        let devolucionItemsNext = [...(v.devolucionItems ?? [])]
        let devolucionEntriesNext = [...(v.devolucionEntries ?? [])]

        // Devolucion for unidades — records in devolucion section (entregaItems untouched)
        if (opts.devolverUnidades) {
          const entregadasItems = v.entregaItems.filter((ei) => ei.quantityEntregada > 0)
          if (entregadasItems.length > 0) {
            for (const ei of entregadasItems) {
              const idx = devolucionItemsNext.findIndex((di) => di.sku === ei.sku)
              if (idx >= 0) devolucionItemsNext[idx] = { ...devolucionItemsNext[idx], quantityDevuelta: devolucionItemsNext[idx].quantityDevuelta + ei.quantityEntregada }
              else devolucionItemsNext.push({ sku: ei.sku, quantityDevuelta: ei.quantityEntregada })
            }
            devolucionEntriesNext.push({
              id: `${ventaId}-DEV-${devolucionEntriesNext.length + 1}-${Date.now()}`,
              fecha,
              hora,
              items: entregadasItems.map((ei) => ({ sku: ei.sku, quantity: ei.quantityEntregada })),
              montoDevuelto: 0,
              medioPago: "",
            })
          }
        }

        // Devolucion for cobros — only a negative cobro entry (no devolucionEntry, to avoid ghost log row)
        // The montoDevuelto on the units entry (if present) carries the amount for the resumen
        if (opts.devolverCobros) {
          const totalCobrado = v.cobros.filter((c) => c.monto > 0).reduce((s, c) => s + c.monto, 0)
          if (totalCobrado > 0) {
            // Patch the montoDevuelto on the units entry we may have just pushed
            const lastDevIdx = devolucionEntriesNext.length - 1
            if (opts.devolverUnidades && lastDevIdx >= 0) {
              devolucionEntriesNext[lastDevIdx] = { ...devolucionEntriesNext[lastDevIdx], montoDevuelto: totalCobrado }
            } else {
              // No units entry — create a minimal one just to carry the monto for recomputeVenta
              devolucionEntriesNext.push({
                id: `${ventaId}-DEV-COB-${devolucionEntriesNext.length + 1}-${Date.now()}`,
                fecha,
                hora,
                items: [],
                montoDevuelto: totalCobrado,
                medioPago: "devolucion",
              })
            }
            // Negative cobro entry for the cobro card
            cobrosNext.push({
              id: `${ventaId}-COB-DEV-${cobrosNext.length + 1}-${Date.now()}`,
              fecha,
              hora,
              medioPago: "devolucion" as PaymentMethod,
              monto: -totalCobrado,
            })
          }
        }

        return recomputeVenta({
          ...v,
          estado: "cancelada" as VentaEstado,
          cobros: cobrosNext,
          devolucionItems: devolucionItemsNext,
          devolucionEntries: devolucionEntriesNext,
        })
      })
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
    addItemsToVenta,
    addCobro,
    addEntregas,
    addDevolucion,
    setEstado,
    finalizarVenta,
    undoCobro,
    undoEntregaEntry,
    cancelarVenta,
  }
}

