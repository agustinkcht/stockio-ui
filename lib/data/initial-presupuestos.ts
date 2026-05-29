import type { Presupuesto } from "@/lib/types"

// Helper: apply item discount and compute total for a single item
function itemTotal(
  unitPrice: number,
  quantity: number,
  discount: number,
  discountType: "percent" | "fixed" | "unit",
): number {
  if (discountType === "unit") {
    const paidQty = Math.max(0, quantity - Math.min(discount, quantity))
    return paidQty * unitPrice
  }
  const gross = unitPrice * quantity
  const disc =
    discountType === "percent" ? gross * (discount / 100) : discount * quantity
  return gross - disc
}

export const INITIAL_PRESUPUESTOS: Presupuesto[] = [
  // ─────────────────────────────────────────────
  // PRE-001 · BORRADOR · Distribuidora Norte S.A.
  // ─────────────────────────────────────────────
  {
    id: "PRE-001",
    numero: 1,
    fecha: "2025-12-20",
    hora: "09:15",
    cliente: { tipo: "cuenta", id: "CLI-003", nombre: "Distribuidora Norte S.A." },
    items: [
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 12,
        unitPrice: 18500,
        discount: 10,
        discountType: "percent",
        total: itemTotal(18500, 12, 10, "percent"),
        categoria: "Espumantes",
      },
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 6,
        unitPrice: 42000,
        discount: 0,
        discountType: "percent",
        total: itemTotal(42000, 6, 0, "percent"),
        categoria: "Vinos",
      },
    ],
    subtotal: itemTotal(18500, 12, 10, "percent") + itemTotal(42000, 6, 0, "percent"),
    descuento: 5,
    descuentoTipo: "percent",
    envio: 0,
    total:
      (itemTotal(18500, 12, 10, "percent") + itemTotal(42000, 6, 0, "percent")) * 0.95,
    estado: "borrador",
    observaciones: "Cliente solicitó cotización para fin de año.",
    fechaValidez: "2026-01-05",
  },

  // ─────────────────────────────────────────────
  // PRE-002 · BORRADOR · Vinoteca El Sabor SRL
  // ─────────────────────────────────────────────
  {
    id: "PRE-002",
    numero: 2,
    fecha: "2025-12-22",
    hora: "11:40",
    cliente: { tipo: "cuenta", id: "CLI-004", nombre: "Vinoteca El Sabor SRL" },
    items: [
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 24,
        unitPrice: 15000,
        discount: 8,
        discountType: "percent",
        total: itemTotal(15000, 24, 8, "percent"),
        categoria: "Espumantes",
      },
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 12,
        unitPrice: 18500,
        discount: 8,
        discountType: "percent",
        total: itemTotal(18500, 12, 8, "percent"),
        categoria: "Espumantes",
      },
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 12,
        unitPrice: 42000,
        discount: 5,
        discountType: "percent",
        total: itemTotal(42000, 12, 5, "percent"),
        categoria: "Vinos",
      },
    ],
    subtotal:
      itemTotal(15000, 24, 8, "percent") +
      itemTotal(18500, 12, 8, "percent") +
      itemTotal(42000, 12, 5, "percent"),
    descuento: 0,
    descuentoTipo: "percent",
    envio: 3500,
    total:
      itemTotal(15000, 24, 8, "percent") +
      itemTotal(18500, 12, 8, "percent") +
      itemTotal(42000, 12, 5, "percent") +
      3500,
    estado: "borrador",
    fechaValidez: "2026-01-10",
  },

  // ─────────────────────────────────────────────
  // PRE-003 · ACEPTADO · Juan Pérez
  // ─────────────────────────────────────────────
  {
    id: "PRE-003",
    numero: 3,
    fecha: "2025-12-10",
    hora: "14:20",
    cliente: { tipo: "cuenta", id: "CLI-001", nombre: "Juan Pérez" },
    items: [
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 3,
        unitPrice: 42000,
        discount: 0,
        discountType: "percent",
        total: itemTotal(42000, 3, 0, "percent"),
        categoria: "Vinos",
      },
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 6,
        unitPrice: 18500,
        discount: 0,
        discountType: "percent",
        total: itemTotal(18500, 6, 0, "percent"),
        categoria: "Espumantes",
      },
    ],
    subtotal: itemTotal(42000, 3, 0, "percent") + itemTotal(18500, 6, 0, "percent"),
    descuento: 0,
    descuentoTipo: "percent",
    total: itemTotal(42000, 3, 0, "percent") + itemTotal(18500, 6, 0, "percent"),
    estado: "aceptado",
    ventaId: "VTA-005",
    fechaValidez: "2025-12-25",
  },

  // ─────────────────────────────────────────────
  // PRE-004 · ACEPTADO · Distribuidora Norte S.A.
  // ─────────────────────────────────────────────
  {
    id: "PRE-004",
    numero: 4,
    fecha: "2025-12-05",
    hora: "10:00",
    cliente: { tipo: "cuenta", id: "CLI-003", nombre: "Distribuidora Norte S.A." },
    items: [
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 48,
        unitPrice: 15000,
        discount: 12,
        discountType: "percent",
        total: itemTotal(15000, 48, 12, "percent"),
        categoria: "Espumantes",
      },
    ],
    subtotal: itemTotal(15000, 48, 12, "percent"),
    descuento: 0,
    descuentoTipo: "percent",
    envio: 5000,
    total: itemTotal(15000, 48, 12, "percent") + 5000,
    estado: "aceptado",
    ventaId: "VTA-001",
    fechaValidez: "2025-12-15",
  },

  // ─────────────────────────────────────────────
  // PRE-005 · BORRADOR · María González
  // ─────────────────────────────────────────────
  {
    id: "PRE-005",
    numero: 5,
    fecha: "2025-12-28",
    hora: "16:55",
    cliente: { tipo: "cuenta", id: "CLI-002", nombre: "María González" },
    items: [
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 2,
        unitPrice: 18500,
        discount: 0,
        discountType: "percent",
        total: itemTotal(18500, 2, 0, "percent"),
        categoria: "Espumantes",
      },
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 4,
        unitPrice: 15000,
        discount: 0,
        discountType: "percent",
        total: itemTotal(15000, 4, 0, "percent"),
        categoria: "Espumantes",
      },
    ],
    subtotal: itemTotal(18500, 2, 0, "percent") + itemTotal(15000, 4, 0, "percent"),
    descuento: 0,
    descuentoTipo: "percent",
    total: itemTotal(18500, 2, 0, "percent") + itemTotal(15000, 4, 0, "percent"),
    estado: "borrador",
    observaciones: "Cliente consultó para evento de cumpleaños.",
    fechaValidez: "2026-01-15",
  },

  // ─────────────────────────────────────────────
  // PRE-006 · RECHAZADO · Consumidor Final
  // ─────────────────────────────────────────────
  {
    id: "PRE-006",
    numero: 6,
    fecha: "2025-11-30",
    hora: "13:10",
    cliente: { tipo: "consumidor_final" },
    items: [
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 6,
        unitPrice: 42000,
        discount: 0,
        discountType: "percent",
        total: itemTotal(42000, 6, 0, "percent"),
        categoria: "Vinos",
      },
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 6,
        unitPrice: 18500,
        discount: 0,
        discountType: "percent",
        total: itemTotal(18500, 6, 0, "percent"),
        categoria: "Espumantes",
      },
    ],
    subtotal: itemTotal(42000, 6, 0, "percent") + itemTotal(18500, 6, 0, "percent"),
    descuento: 0,
    descuentoTipo: "percent",
    total: itemTotal(42000, 6, 0, "percent") + itemTotal(18500, 6, 0, "percent"),
    estado: "rechazado",
    observaciones: "Cliente indicó que encontró mejor precio en otro proveedor.",
    fechaValidez: "2025-12-10",
  },

  // ─────────────────────────────────────────────
  // PRE-007 · ACEPTADO · Vinoteca El Sabor SRL
  // ─────────────────────────────────────────────
  {
    id: "PRE-007",
    numero: 7,
    fecha: "2025-12-01",
    hora: "09:30",
    cliente: { tipo: "cuenta", id: "CLI-004", nombre: "Vinoteca El Sabor SRL" },
    items: [
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 36,
        unitPrice: 15000,
        discount: 10,
        discountType: "percent",
        total: itemTotal(15000, 36, 10, "percent"),
        categoria: "Espumantes",
      },
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 6,
        unitPrice: 42000,
        discount: 5,
        discountType: "percent",
        total: itemTotal(42000, 6, 5, "percent"),
        categoria: "Vinos",
      },
    ],
    subtotal:
      itemTotal(15000, 36, 10, "percent") + itemTotal(42000, 6, 5, "percent"),
    descuento: 3,
    descuentoTipo: "percent",
    envio: 4000,
    total:
      (itemTotal(15000, 36, 10, "percent") + itemTotal(42000, 6, 5, "percent")) *
        0.97 +
      4000,
    estado: "aceptado",
    ventaId: "VTA-003",
    fechaValidez: "2025-12-12",
  },

  // ─────────────────────────────────────────────
  // PRE-008 · BORRADOR · Distribuidora Norte S.A.
  // Large quote, descuento global + envío
  // ─────────────────────────────────────────────
  {
    id: "PRE-008",
    numero: 8,
    fecha: "2025-12-29",
    hora: "08:45",
    cliente: { tipo: "cuenta", id: "CLI-003", nombre: "Distribuidora Norte S.A." },
    items: [
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 60,
        unitPrice: 18500,
        discount: 15,
        discountType: "percent",
        total: itemTotal(18500, 60, 15, "percent"),
        categoria: "Espumantes",
      },
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 60,
        unitPrice: 15000,
        discount: 15,
        discountType: "percent",
        total: itemTotal(15000, 60, 15, "percent"),
        categoria: "Espumantes",
      },
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 24,
        unitPrice: 42000,
        discount: 10,
        discountType: "percent",
        total: itemTotal(42000, 24, 10, "percent"),
        categoria: "Vinos",
      },
    ],
    subtotal:
      itemTotal(18500, 60, 15, "percent") +
      itemTotal(15000, 60, 15, "percent") +
      itemTotal(42000, 24, 10, "percent"),
    descuento: 5,
    descuentoTipo: "percent",
    envio: 12000,
    total:
      (itemTotal(18500, 60, 15, "percent") +
        itemTotal(15000, 60, 15, "percent") +
        itemTotal(42000, 24, 10, "percent")) *
        0.95 +
      12000,
    estado: "borrador",
    observaciones: "Cotización para pedido mayorista enero 2026.",
    fechaValidez: "2026-01-20",
  },
]
