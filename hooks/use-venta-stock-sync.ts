"use client"

/**
 * use-venta-stock-sync.ts
 *
 * Wraps every useVentas mutation that changes stock and fires the
 * corresponding useItems.bulkSaveStock() side-effect automatically.
 *
 * Stock rules:
 *
 *  addVenta          → +reservado per item (units are now "held" for this sale)
 *  addEntregas       → −reservado & −total per actually-delivered unit
 *  undoEntregaEntry  → +reservado & +total per un-done unit (units come back as reserved)
 *  addDevolucion     → +total per returned unit (they go back to available stock)
 *  cancelarVenta     → release pending reservation (−reservado for undelivered units)
 *                       + restore total for delivered units if devolverUnidades=true
 *  finalizarVenta    → −reservado & −total for all still-pending units
 *                      (already-delivered units were handled by addEntregas)
 */

import { useCallback } from "react"
import { useVentas } from "@/hooks/use-ventas"
import { useItems } from "@/hooks/use-items"
import { computeStockChanges, type StockDelta } from "@/lib/utils/stock-mutations"
import type { Venta, VentaItem, VentaEntregaItem, VentaDevolucionItem } from "@/lib/types"

type PaymentMethod = Parameters<ReturnType<typeof useVentas>["finalizarVenta"]>[1]

export function useVentaStockSync() {
  const ventasHook = useVentas()
  const { items, bulkSaveStock } = useItems()

  // ── helpers ──────────────────────────────────────────────────────────────

  const applyDeltas = useCallback(
    (deltas: StockDelta[]) => {
      if (deltas.length === 0) return
      const changes = computeStockChanges(items, deltas)
      if (Object.keys(changes).length > 0) bulkSaveStock(changes)
    },
    [items, bulkSaveStock]
  )

  // ── addVenta ─────────────────────────────────────────────────────────────
  // Reserve stock for every item in the new venta.

  const addVenta = useCallback(
    (venta: Parameters<typeof ventasHook.addVenta>[0]) => {
      const result = ventasHook.addVenta(venta)
      const deltas: StockDelta[] = venta.items.map((it) => ({
        sku: it.sku,
        deltaTotal: 0,
        deltaReservado: it.quantity,
      }))
      applyDeltas(deltas)
      return result
    },
    [ventasHook, applyDeltas]
  )

  // ── addEntregas ───────────────────────────────────────────────────────────
  // For each actually-delivered unit: −reservado, −total.

  const addEntregas = useCallback(
    (
      ventaId: string,
      entregas: VentaEntregaItem[],
      fecha?: string,
      hora?: string
    ) => {
      // Snapshot the venta BEFORE the mutation to know the current entregaItems state
      const venta = ventasHook.ventas.find((v) => v.id === ventaId)
      if (!venta) { ventasHook.addEntregas(ventaId, entregas, fecha, hora); return }

      // Compute actually-deliverable units (mirrors the logic inside useVentas.addEntregas)
      const deltas: StockDelta[] = []
      for (const e of entregas) {
        const item = venta.items.find((it) => it.sku === e.sku)
        if (!item) continue
        const existing = venta.entregaItems.find((ei) => ei.sku === e.sku)?.quantityEntregada ?? 0
        const newQty = Math.min(item.quantity, existing + e.quantityEntregada)
        const actual = newQty - existing
        if (actual <= 0) continue
        deltas.push({ sku: e.sku, deltaTotal: -actual, deltaReservado: -actual })
      }

      ventasHook.addEntregas(ventaId, entregas, fecha, hora)
      applyDeltas(deltas)
    },
    [ventasHook, applyDeltas]
  )

  // ── undoEntregaEntry ──────────────────────────────────────────────────────
  // The un-done units go back into reservado (still pending delivery) and back
  // into total (physically back in the warehouse).

  const undoEntregaEntry = useCallback(
    (ventaId: string, entryId: string) => {
      const venta = ventasHook.ventas.find((v) => v.id === ventaId)
      if (!venta) { ventasHook.undoEntregaEntry(ventaId, entryId); return }

      const entry = (venta.entregaEntries ?? []).find((e) => e.id === entryId)
      if (!entry) { ventasHook.undoEntregaEntry(ventaId, entryId); return }

      const deltas: StockDelta[] = entry.items.map((i) => ({
        sku: i.sku,
        deltaTotal: i.quantity,      // units physically back in stock
        deltaReservado: i.quantity,  // still pending delivery → reserved again
      }))

      ventasHook.undoEntregaEntry(ventaId, entryId)
      applyDeltas(deltas)
    },
    [ventasHook, applyDeltas]
  )

  // ── addDevolucion ─────────────────────────────────────────────────────────
  // Returned units go back to total stock (no longer reserved — they've
  // already been delivered and are now physically returned).

  const addDevolucion = useCallback(
    (
      ventaId: string,
      devoluciones: VentaDevolucionItem[],
      montoDevuelto: number
    ) => {
      const deltas: StockDelta[] = devoluciones.map((d) => ({
        sku: d.sku,
        deltaTotal: d.quantityDevuelta,
        deltaReservado: 0,
      }))
      ventasHook.addDevolucion(ventaId, devoluciones, montoDevuelto)
      applyDeltas(deltas)
    },
    [ventasHook, applyDeltas]
  )

  // ── cancelarVenta ─────────────────────────────────────────────────────────
  // 1. Release reservation for all units still pending delivery (−reservado).
  // 2. If devolverUnidades=true, also restore total for already-delivered units.

  const cancelarVenta = useCallback(
    (ventaId: string, opts: { devolverUnidades: boolean; devolverCobros: boolean }) => {
      const venta = ventasHook.ventas.find((v) => v.id === ventaId)
      if (!venta) { ventasHook.cancelarVenta(ventaId, opts); return }

      const deltas: StockDelta[] = []
      for (const item of venta.items) {
        const entregada = venta.entregaItems.find((ei) => ei.sku === item.sku)?.quantityEntregada ?? 0
        const pending = Math.max(0, item.quantity - entregada)

        // Release reservation for units not yet delivered
        if (pending > 0) {
          deltas.push({ sku: item.sku, deltaTotal: 0, deltaReservado: -pending })
        }

        // Restore total for already-delivered units if we're returning them
        if (opts.devolverUnidades && entregada > 0) {
          deltas.push({ sku: item.sku, deltaTotal: entregada, deltaReservado: 0 })
        }
      }

      ventasHook.cancelarVenta(ventaId, opts)
      applyDeltas(deltas)
    },
    [ventasHook, applyDeltas]
  )

  // ── finalizarVenta ────────────────────────────────────────────────────────
  // Delivers all remaining pending units: −reservado & −total per pending unit.
  // (Already-delivered units were handled by prior addEntregas calls.)

  const finalizarVenta = useCallback(
    (
      ventaId: string,
      cobroMedioPago: PaymentMethod,
      cobroFecha: string,
      cobroHora: string
    ) => {
      const venta = ventasHook.ventas.find((v) => v.id === ventaId)
      if (!venta) { ventasHook.finalizarVenta(ventaId, cobroMedioPago, cobroFecha, cobroHora); return }

      const deltas: StockDelta[] = []
      for (const item of venta.items) {
        const entregada = venta.entregaItems.find((ei) => ei.sku === item.sku)?.quantityEntregada ?? 0
        const pending = Math.max(0, item.quantity - entregada)
        if (pending > 0) {
          deltas.push({ sku: item.sku, deltaTotal: -pending, deltaReservado: -pending })
        }
      }

      ventasHook.finalizarVenta(ventaId, cobroMedioPago, cobroFecha, cobroHora)
      applyDeltas(deltas)
    },
    [ventasHook, applyDeltas]
  )

  // Passthrough for mutations that don't affect stock
  return {
    // stock-synced
    addVenta,
    addEntregas,
    undoEntregaEntry,
    addDevolucion,
    cancelarVenta,
    finalizarVenta,
    // pass-through (no stock effect)
    ventas: ventasHook.ventas,
    isLoading: ventasHook.isLoading,
    addItemsToVenta: ventasHook.addItemsToVenta,
    addCobro: ventasHook.addCobro,
    undoCobro: ventasHook.undoCobro,
    updateCobroMedioPago: ventasHook.updateCobroMedioPago,
    setEstado: ventasHook.setEstado,
    updateVenta: ventasHook.updateVenta,
  }
}
