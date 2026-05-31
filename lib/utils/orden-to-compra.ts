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
    discount: 0,
    discountType: "percent" as const,
    total: it.total,
    categoria: it.categoria,
  }))

  const subtotal = items.reduce((s, it) => s + it.total, 0)

  return {
    fecha,
    hora,
    proveedorId: orden.proveedorId,
    proveedorNombre: orden.proveedorNombre,
    items,
    subtotal,
    descuento: 0,
    descuentoTipo: "percent",
    envio: 0,
    customCharges: [],
    total: subtotal,
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
