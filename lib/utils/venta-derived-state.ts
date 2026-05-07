import type { Venta } from "@/lib/types"

export interface VentaCobro {
  id: string
  date: string
  amount: number
  medioPago: "efectivo" | "transferencia" | "posnet"
}

const stableHash = (key: string): number => {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

/**
 * Deterministic mock of registered cobros (incoming payments) for a venta.
 * - completada → single cobro covering total on the venta date
 * - cancelada → no cobros
 * - pendiente → 0, 1 or 2 partial cobros (deterministic from id)
 */
export function getVentaCobros(venta: Venta): VentaCobro[] {
  if (venta.estado === "cancelada") return []
  if (venta.estado === "completada") {
    return [
      {
        id: `${venta.id}-c1`,
        date: venta.fecha,
        amount: venta.total,
        medioPago: venta.metodoPago,
      },
    ]
  }
  // pendiente
  const h = stableHash(venta.id)
  const bucket = h % 4 // 0 → none, 1 → 25%, 2 → 50%, 3 → 75% in two cobros
  if (bucket === 0) return []
  if (bucket === 3) {
    const first = Math.round(venta.total * 0.4)
    const second = Math.round(venta.total * 0.35)
    return [
      { id: `${venta.id}-c1`, date: venta.fecha, amount: first, medioPago: "transferencia" },
      { id: `${venta.id}-c2`, date: venta.fecha, amount: second, medioPago: "efectivo" },
    ]
  }
  const ratio = bucket === 1 ? 0.25 : 0.5
  return [
    {
      id: `${venta.id}-c1`,
      date: venta.fecha,
      amount: Math.round(venta.total * ratio),
      medioPago: venta.metodoPago,
    },
  ]
}

/**
 * Deterministic mock of per-item delivered quantities for a venta.
 * Returns a Map keyed by `${sku}-${index}` → quantityDelivered.
 */
export function getVentaItemEntregas(venta: Venta): Map<string, number> {
  const m = new Map<string, number>()
  if (venta.estado === "completada") {
    venta.items.forEach((it, i) => m.set(`${it.sku}-${i}`, it.quantity))
    return m
  }
  if (venta.estado === "cancelada") {
    venta.items.forEach((it, i) => m.set(`${it.sku}-${i}`, 0))
    return m
  }
  // pendiente → per-item deterministic partial
  venta.items.forEach((it, i) => {
    const h = stableHash(`${venta.id}-${it.sku}-${i}`)
    const r = h % 100
    let q: number
    if (r < 30) q = 0
    else if (r < 70) q = Math.max(0, Math.floor(it.quantity / 2))
    else q = it.quantity
    m.set(`${it.sku}-${i}`, q)
  })
  return m
}

export function getEntregaTotals(venta: Venta, entregas: Map<string, number>) {
  const totalUnidades = venta.items.reduce((s, it) => s + it.quantity, 0)
  const deliveredUnidades = venta.items.reduce(
    (s, it, i) => s + (entregas.get(`${it.sku}-${i}`) || 0),
    0,
  )
  const percent =
    totalUnidades === 0 ? 0 : Math.round((deliveredUnidades / totalUnidades) * 100)
  return { totalUnidades, deliveredUnidades, percent }
}

export function getCobroTotals(venta: Venta, cobros: VentaCobro[]) {
  const cobrado = cobros.reduce((s, c) => s + c.amount, 0)
  const percent = venta.total === 0 ? 0 : Math.min(100, Math.round((cobrado / venta.total) * 100))
  const restante = Math.max(0, venta.total - cobrado)
  return { cobrado, restante, percent }
}
