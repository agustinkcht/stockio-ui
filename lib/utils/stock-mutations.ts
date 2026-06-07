/**
 * stock-mutations.ts
 *
 * Pure utility for computing stock patches from venta mutations.
 * Takes a flat list of {sku, deltaTotalOrReservado} deltas and merges them
 * against the current items state, clamping to ≥ 0.
 *
 * Convention:
 *   deltaTotal    > 0 → stock increases (return/cancel)
 *   deltaTotal    < 0 → stock decreases (entrega)
 *   deltaReservado > 0 → more units reserved (new venta / reingreso)
 *   deltaReservado < 0 → fewer units reserved (entrega consumes reservation, or cancel releases it)
 */

import type { Item, ItemVariant } from "@/lib/types"

export interface StockDelta {
  sku: string
  deltaTotal: number
  deltaReservado: number
}

/** Resolves current {total, reservado} for a sku from the item list. */
function currentStock(items: Item[], sku: string): { total: number; reservado: number } {
  for (const item of items) {
    // Standalone item
    if (item.sku === sku && item.stock) {
      return {
        total: parseFloat(item.stock.total) || 0,
        reservado: parseFloat(item.stock.reservado) || 0,
      }
    }
    // Variant child
    if (item.variants) {
      for (const v of item.variants) {
        const fullSku = item.skuPrefix && v.skuSuffix ? `${item.skuPrefix}-${v.skuSuffix}` : v.sku
        if (fullSku === sku && v.stock) {
          return {
            total: parseFloat(v.stock.total) || 0,
            reservado: parseFloat(v.stock.reservado) || 0,
          }
        }
      }
    }
  }
  return { total: 0, reservado: 0 }
}

/**
 * Merges a list of StockDelta onto the current items and returns a
 * `changes` map ready to pass into `useItems.bulkSaveStock()`.
 */
export function computeStockChanges(
  items: Item[],
  deltas: StockDelta[]
): Record<string, { total: number; reservado: number }> {
  // Accumulate deltas per sku first (multiple items in one venta may share a sku)
  const accumulated: Record<string, { deltaTotal: number; deltaReservado: number }> = {}
  for (const d of deltas) {
    if (!accumulated[d.sku]) accumulated[d.sku] = { deltaTotal: 0, deltaReservado: 0 }
    accumulated[d.sku].deltaTotal += d.deltaTotal
    accumulated[d.sku].deltaReservado += d.deltaReservado
  }

  const changes: Record<string, { total: number; reservado: number }> = {}
  for (const [sku, { deltaTotal, deltaReservado }] of Object.entries(accumulated)) {
    if (deltaTotal === 0 && deltaReservado === 0) continue
    const cur = currentStock(items, sku)
    changes[sku] = {
      total: Math.max(0, cur.total + deltaTotal),
      reservado: Math.max(0, cur.reservado + deltaReservado),
    }
  }
  return changes
}
