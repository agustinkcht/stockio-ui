import type { OrdenDeCompra, Compra } from "@/lib/types"

/**
 * Builds a brand-new Compra payload (without id) from an accepted OrdenDeCompra.
 * The compra starts en_curso with no recepcion/pagos registered yet.
 */
export function buildCompraFromOrden(
  orden: OrdenDeCompra,
  fecha: string,
  hora: string,
): Omit<Compra, "id"> {
  const items = orden.items.map((it) => ({
    sku: it.sku,
    name: it.name,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    // Carry over per-item discount from orden, preserving the discount type including unit
    discount: it.discount ?? 0,
    discountType: (it.discountType ?? "percent") as "percent" | "fixed" | "unit",
    total: it.total,
    categoria: it.categoria,
  }))

  const subtotal = items.reduce((s, it) => s + it.total, 0)

  // Carry over global adjustments from orden
  const descuento = orden.descuento ?? 0
  const descuentoTipo: "percent" | "fixed" = (orden.descuentoTipo as "percent" | "fixed") ?? "percent"
  const envio = orden.envio ?? 0
  const customCharges = orden.customCharges ?? []

  // Recompute grand total from orden fields
  const globalDiscountAmount = descuento > 0
    ? descuentoTipo === "percent" ? subtotal * (descuento / 100) : descuento
    : 0
  const total = Math.round(subtotal - globalDiscountAmount + envio + customCharges.reduce((s, c) => s + c.value, 0))

  return {
    fecha,
    hora,
    proveedorId: orden.proveedorId,
    proveedorNombre: orden.proveedorNombre,
    items,
    subtotal,
    descuento,
    descuentoTipo,
    envio,
    customCharges,
    total,
    recepcionItems: [],
    recepcionEntries: [],
    pagos: [],
    devolucionItems: [],
    devolucionEntries: [],
    estado: "en_curso",
    comprador: "Admin",
    origen: "orden",
    ordenId: orden.id,
  }
}
