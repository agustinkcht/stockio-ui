"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  Compra,
  CompraItem,
  CompraPago,
  CompraRecepcionItem,
  CompraDevolucionItem,
  CompraEstado,
} from "@/lib/types"
import { COMPRAS } from "@/lib/data/compras"
import { useAccount } from "@/lib/contexts/account-context"

// Bump when type or seed changes to force re-seeding
const COMPRAS_SEED_VERSION = "v3"

function migrateCompra(raw: Partial<Compra> & Record<string, unknown>): Compra {
  return {
    ...raw,
    items: Array.isArray(raw.items) ? raw.items : [],
    recepcionItems: Array.isArray(raw.recepcionItems) ? raw.recepcionItems : [],
    recepcionEntries: Array.isArray(raw.recepcionEntries) ? raw.recepcionEntries : [],
    pagos: Array.isArray(raw.pagos) ? raw.pagos : [],
    devolucionItems: Array.isArray(raw.devolucionItems) ? raw.devolucionItems : [],
    devolucionEntries: Array.isArray(raw.devolucionEntries) ? raw.devolucionEntries : [],
    subtotal: raw.subtotal ?? 0,
    total: raw.total ?? 0,
    descuento: raw.descuento ?? 0,
    descuentoTipo: raw.descuentoTipo ?? "percent",
    envio: raw.envio ?? 0,
    customCharges: Array.isArray(raw.customCharges) ? raw.customCharges : [],
    estado: (raw.estado as CompraEstado) ?? "en_curso",
  } as Compra
}

function recomputeCompra(c: Compra): Compra {
  const subtotal = c.items.reduce((sum, it) => {
    const baseGross = it.unitPrice * it.quantity
    const discount =
      it.discountType === "percent" ? baseGross * (it.discount / 100) : it.discount * it.quantity
    return sum + (baseGross - discount)
  }, 0)

  const compraDescuento =
    c.descuentoTipo === "percent" ? subtotal * (c.descuento / 100) : c.descuento
  const montoDevuelto = (c.devolucionEntries ?? []).reduce((s, e) => s + e.montoDevuelto, 0)
  const envio = c.envio ?? 0
  const customChargesTotal = (c.customCharges ?? []).reduce((s, ch) => s + ch.value, 0)
  const total = Math.max(0, subtotal - compraDescuento + envio + customChargesTotal - montoDevuelto)

  const pagado = c.pagos.reduce((s, p) => s + p.monto, 0)
  const fullyPaid = pagado + 0.001 >= total && total > 0
  const fullyReceived = c.items.every((it) => {
    const r = c.recepcionItems.find((ri) => ri.sku === it.sku)
    return (r?.quantityRecepcionada ?? 0) >= it.quantity
  })

  const estado: CompraEstado =
    c.estado === "cancelada" ? "cancelada"
    : c.estado === "finalizada" ? "finalizada"
    : (fullyPaid && fullyReceived ? "finalizada" : "en_curso")

  return { ...c, subtotal, total, estado }
}

export function useCompras() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentAccount } = useAccount()

  const getStorageKey = useCallback(() => {
    return `stockio_compras_${currentAccount || "default"}`
  }, [currentAccount])

  useEffect(() => {
    if (!currentAccount) {
      setIsLoading(false)
      return
    }

    try {
      const storageKey = getStorageKey()
      const versionKey = `${storageKey}_version`
      const storedVersion = localStorage.getItem(versionKey)
      const storedCompras = localStorage.getItem(storageKey)

      if (storedCompras && storedVersion === COMPRAS_SEED_VERSION) {
        const parsed = (JSON.parse(storedCompras) as unknown[]).map((c) =>
          migrateCompra(c as Partial<Compra> & Record<string, unknown>)
        )
        setCompras(parsed)
      } else {
        localStorage.setItem(storageKey, JSON.stringify(COMPRAS))
        localStorage.setItem(versionKey, COMPRAS_SEED_VERSION)
        setCompras(COMPRAS)
      }
    } catch (error) {
      console.error("[v0] Error loading compras:", error)
      setCompras(COMPRAS)
    }
    setIsLoading(false)
  }, [currentAccount, getStorageKey])

  const saveCompras = useCallback(
    (newCompras: Compra[]) => {
      if (!currentAccount) return
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(newCompras))
      localStorage.setItem(`${storageKey}_version`, COMPRAS_SEED_VERSION)
    },
    [currentAccount, getStorageKey],
  )

  // Add a new compra
  const addCompra = useCallback(
    (compra: Omit<Compra, "id">) => {
      const existingIds = compras.map((c) => {
        const match = c.id.match(/COMP-(\d+)/)
        return match ? Number.parseInt(match[1], 10) : 0
      })
      const maxId = Math.max(0, ...existingIds)
      const newId = `COMP-${String(maxId + 1).padStart(3, "0")}`
      const newCompra: Compra = { ...compra, id: newId }
      const updatedCompras = [newCompra, ...compras]
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
      return newCompra
    },
    [compras, saveCompras],
  )

  // Low-level update
  const updateCompra = useCallback(
    (compraId: string, updates: Partial<Compra>) => {
      const updatedCompras = compras.map((c) =>
        c.id === compraId ? recomputeCompra({ ...c, ...updates }) : c,
      )
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Add items — if SKU exists, increment quantity
  const addItemsToCompra = useCallback(
    (compraId: string, newItems: CompraItem[]) => {
      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c
        const itemsCopy = [...c.items]
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
        return recomputeCompra({ ...c, items: itemsCopy })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Add a payment
  const addPago = useCallback(
    (compraId: string, pago: Omit<CompraPago, "id">) => {
      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c
        const newPago: CompraPago = {
          ...pago,
          id: `${compraId}-PAG-${c.pagos.length + 1}-${Date.now()}`,
        }
        return recomputeCompra({ ...c, pagos: [...c.pagos, newPago] })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Undo a payment by appending a negative "Anulación" entry
  const undoPago = useCallback(
    (compraId: string, pagoId: string) => {
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = now.toTimeString().slice(0, 5)
      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c
        const original = c.pagos.find((p) => p.id === pagoId)
        if (!original) return c
        const anulacion: CompraPago = {
          id: `${compraId}-PAG-ANUL-${Date.now()}`,
          fecha,
          hora,
          medioPago: "anulacion",
          monto: -Math.abs(original.monto),
        }
        return recomputeCompra({ ...c, pagos: [...c.pagos, anulacion] })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Update the medioPago of an existing pago
  const updatePagoMedioPago = useCallback(
    (compraId: string, pagoId: string, medioPago: CompraPago["medioPago"]) => {
      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c
        const pagos = c.pagos.map((p) => p.id === pagoId ? { ...p, medioPago } : p)
        return recomputeCompra({ ...c, pagos })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Register received units and append a log entry
  const addRecepcion = useCallback(
    (compraId: string, recepciones: CompraRecepcionItem[], fecha?: string, hora?: string) => {
      const now = new Date()
      const entryFecha = fecha ?? now.toISOString().slice(0, 10)
      const entryHora = hora ?? now.toTimeString().slice(0, 5)

      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c
        const next = [...c.recepcionItems]
        const entryItems: { sku: string; quantity: number }[] = []

        for (const r of recepciones) {
          const item = c.items.find((it) => it.sku === r.sku)
          if (!item) continue
          const idx = next.findIndex((ri) => ri.sku === r.sku)
          const existing = idx >= 0 ? next[idx].quantityRecepcionada : 0
          const newQty = Math.min(item.quantity, existing + r.quantityRecepcionada)
          const actualReceived = newQty - existing
          if (actualReceived <= 0) continue
          if (idx >= 0) next[idx] = { ...next[idx], quantityRecepcionada: newQty }
          else next.push({ sku: r.sku, quantityRecepcionada: newQty })
          entryItems.push({ sku: r.sku, quantity: actualReceived })
        }

        const newEntry = {
          id: `${compraId}-REC-${(c.recepcionEntries ?? []).length + 1}-${Date.now()}`,
          fecha: entryFecha,
          hora: entryHora,
          items: entryItems,
        }

        return recomputeCompra({
          ...c,
          recepcionItems: next,
          recepcionEntries: [...(c.recepcionEntries ?? []), newEntry],
        })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Undo a recepcion entry — subtracts units, appends negative log entry
  const undoRecepcionEntry = useCallback(
    (compraId: string, entryId: string) => {
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = now.toTimeString().slice(0, 5)
      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c
        const entry = (c.recepcionEntries ?? []).find((e) => e.id === entryId)
        if (!entry) return c
        const recepcionItems = c.recepcionItems.map((ri) => {
          const undone = entry.items.find((i) => i.sku === ri.sku)
          if (!undone) return ri
          return { ...ri, quantityRecepcionada: Math.max(0, ri.quantityRecepcionada - undone.quantity) }
        })
        const totalUnits = entry.items.reduce((s, i) => s + i.quantity, 0)
        const anulacionEntry = {
          id: `${compraId}-REC-ANUL-${Date.now()}`,
          fecha,
          hora,
          items: entry.items.map((i) => ({ sku: i.sku, quantity: -i.quantity })),
          anulacion: true,
          anulacionTotal: totalUnits,
          originalRecepcionId: entryId,
        }
        return recomputeCompra({
          ...c,
          recepcionItems,
          recepcionEntries: [...(c.recepcionEntries ?? []), anulacionEntry],
        })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Atomic finalizar: receives all pending units + registers remaining pago in one save
  const finalizarCompra = useCallback(
    (compraId: string, pagoMedioPago: CompraPago["medioPago"], pagoFecha: string, pagoHora: string) => {
      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c

        // 1. Complete all pending recepcion
        const recepcionNext = [...c.recepcionItems]
        const entryItems: { sku: string; quantity: number }[] = []
        for (const item of c.items) {
          const idx = recepcionNext.findIndex((ri) => ri.sku === item.sku)
          const existing = idx >= 0 ? recepcionNext[idx].quantityRecepcionada : 0
          const remaining = item.quantity - existing
          if (remaining <= 0) continue
          if (idx >= 0) recepcionNext[idx] = { ...recepcionNext[idx], quantityRecepcionada: item.quantity }
          else recepcionNext.push({ sku: item.sku, quantityRecepcionada: item.quantity })
          entryItems.push({ sku: item.sku, quantity: remaining })
        }
        const recepcionEntriesNext = [...(c.recepcionEntries ?? [])]
        if (entryItems.length > 0) {
          recepcionEntriesNext.push({
            id: `${compraId}-REC-${recepcionEntriesNext.length + 1}-${Date.now()}`,
            fecha: pagoFecha,
            hora: pagoHora,
            items: entryItems,
          })
        }

        // 2. Register pago for remaining balance
        const interim = recomputeCompra({ ...c, recepcionItems: recepcionNext, recepcionEntries: recepcionEntriesNext })
        const pagado = interim.pagos.reduce((s, p) => s + p.monto, 0)
        const remaining = Math.max(0, interim.total - pagado)
        const pagosNext = [...interim.pagos]
        if (remaining > 0) {
          pagosNext.push({
            id: `${compraId}-PAG-${pagosNext.length + 1}-${Date.now()}`,
            fecha: pagoFecha,
            hora: pagoHora,
            medioPago: pagoMedioPago,
            monto: remaining,
          })
        }

        // 3. Force estado finalizada
        return {
          ...recomputeCompra({ ...interim, pagos: pagosNext }),
          estado: "finalizada" as CompraEstado,
        }
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Register a devolucion (decreases stock): updates running totals + appends entry + negative pago
  const addDevolucion = useCallback(
    (compraId: string, devoluciones: CompraDevolucionItem[], montoDevuelto: number) => {
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = now.toTimeString().slice(0, 5)

      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c

        const nextDevItems = [...(c.devolucionItems ?? [])]
        for (const d of devoluciones) {
          const idx = nextDevItems.findIndex((di) => di.sku === d.sku)
          if (idx >= 0) nextDevItems[idx] = { ...nextDevItems[idx], quantityDevuelta: nextDevItems[idx].quantityDevuelta + d.quantityDevuelta }
          else nextDevItems.push({ sku: d.sku, quantityDevuelta: d.quantityDevuelta })
        }

        const newEntry = {
          id: `${compraId}-DEV-${(c.devolucionEntries ?? []).length + 1}-${Date.now()}`,
          fecha,
          hora,
          items: devoluciones.map((d) => ({ sku: d.sku, quantity: d.quantityDevuelta })),
          montoDevuelto,
          medioPago: "",
        }

        // Negative pago entry for the refund (supplier owes us)
        const refundPago: CompraPago = {
          id: `${compraId}-DEV-PAG-${Date.now()}`,
          fecha,
          hora,
          medioPago: "devolucion" as CompraPago["medioPago"],
          monto: -montoDevuelto,
        }

        return recomputeCompra({
          ...c,
          devolucionItems: nextDevItems,
          devolucionEntries: [...(c.devolucionEntries ?? []), newEntry],
          pagos: [...c.pagos, refundPago],
        })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  // Cancel a compra — optionally reverses recepcion units and payments
  const cancelarCompra = useCallback(
    (compraId: string, opts: { devolverUnidades: boolean; devolverPagos: boolean }) => {
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = now.toTimeString().slice(0, 5)

      const updatedCompras = compras.map((c) => {
        if (c.id !== compraId) return c

        let pagosNext = [...c.pagos]
        let devolucionItemsNext = [...(c.devolucionItems ?? [])]
        let devolucionEntriesNext = [...(c.devolucionEntries ?? [])]

        if (opts.devolverUnidades) {
          const recepcionadasItems = c.recepcionItems.filter((ri) => ri.quantityRecepcionada > 0)
          if (recepcionadasItems.length > 0) {
            for (const ri of recepcionadasItems) {
              const idx = devolucionItemsNext.findIndex((di) => di.sku === ri.sku)
              if (idx >= 0) devolucionItemsNext[idx] = { ...devolucionItemsNext[idx], quantityDevuelta: devolucionItemsNext[idx].quantityDevuelta + ri.quantityRecepcionada }
              else devolucionItemsNext.push({ sku: ri.sku, quantityDevuelta: ri.quantityRecepcionada })
            }
            devolucionEntriesNext.push({
              id: `${compraId}-DEV-${devolucionEntriesNext.length + 1}-${Date.now()}`,
              fecha,
              hora,
              items: recepcionadasItems.map((ri) => ({ sku: ri.sku, quantity: ri.quantityRecepcionada })),
              montoDevuelto: 0,
              medioPago: "",
            })
          }
        }

        if (opts.devolverPagos) {
          const totalPagado = c.pagos.filter((p) => p.monto > 0).reduce((s, p) => s + p.monto, 0)
          if (totalPagado > 0) {
            const lastDevIdx = devolucionEntriesNext.length - 1
            if (opts.devolverUnidades && lastDevIdx >= 0) {
              devolucionEntriesNext[lastDevIdx] = { ...devolucionEntriesNext[lastDevIdx], montoDevuelto: totalPagado }
            } else {
              devolucionEntriesNext.push({
                id: `${compraId}-DEV-PAG-${devolucionEntriesNext.length + 1}-${Date.now()}`,
                fecha,
                hora,
                items: [],
                montoDevuelto: totalPagado,
                medioPago: "devolucion",
              })
            }
            pagosNext.push({
              id: `${compraId}-PAG-DEV-${pagosNext.length + 1}-${Date.now()}`,
              fecha,
              hora,
              medioPago: "devolucion" as CompraPago["medioPago"],
              monto: -totalPagado,
            })
          }
        }

        return recomputeCompra({
          ...c,
          estado: "cancelada" as CompraEstado,
          pagos: pagosNext,
          devolucionItems: devolucionItemsNext,
          devolucionEntries: devolucionEntriesNext,
        })
      })
      setCompras(updatedCompras)
      saveCompras(updatedCompras)
    },
    [compras, saveCompras],
  )

  return {
    compras,
    isLoading,
    addCompra,
    updateCompra,
    addItemsToCompra,
    addPago,
    undoPago,
    updatePagoMedioPago,
    addRecepcion,
    undoRecepcionEntry,
    finalizarCompra,
    addDevolucion,
    cancelarCompra,
  }
}
