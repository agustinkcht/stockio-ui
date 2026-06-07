import type { Presupuesto, Venta } from "@/lib/types"

/**
 * Builds a brand-new Venta payload (without id) from an accepted Presupuesto.
 * The venta starts en_curso with no entregas/cobros registered yet.
 */
export function buildVentaFromPresupuesto(
  p: Presupuesto,
  fecha: string,
  hora: string,
): Omit<Venta, "id"> {
  return {
    fecha,
    hora,
    cliente: p.cliente,
    items: p.items,
    subtotal: p.subtotal,
    descuento: p.descuento,
    descuentoTipo: p.descuentoTipo,
    envio: p.envio ?? 0,
    customCharges: p.customCharges ?? [],
    total: p.total,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "en_curso",
    observaciones: p.observaciones,
    devolucionItems: [],
    devolucionEntries: [],
    // origen is read defensively as (venta as any).origen across the venta UI
    origen: "presupuesto",
  } as Omit<Venta, "id">
}
