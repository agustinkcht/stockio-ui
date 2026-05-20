import type { Venta } from "@/lib/types"

// Helper: compute subtotal from items
// subtotal = sum of (unitPrice * quantity with discount applied)

export const VENTAS: Venta[] = [
  // ─────────────────────────────────────────────
  // VTA-001 · FINALIZADA · 3 productos · cliente cuenta
  // Cobro: 100% (transferencia) · Entrega: 100%
  // ─────────────────────────────────────────────
  {
    id: "VTA-001",
    fecha: "2025-12-25",
    hora: "10:32",
    cliente: { tipo: "cuenta", id: "CLI-003", nombre: "Distribuidora Norte S.A." },
    items: [
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 6,
        unitPrice: 18500,
        discount: 10,
        discountType: "percent",
        total: 99900,
        categoria: "Espumantes",
      },
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 3,
        unitPrice: 42000,
        discount: 0,
        discountType: "percent",
        total: 126000,
        categoria: "Vinos",
      },
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 12,
        unitPrice: 15000,
        discount: 5,
        discountType: "percent",
        total: 171000,
        categoria: "Espumantes",
      },
    ],
    subtotal: 396900,
    descuento: 0,
    descuentoTipo: "percent",
    total: 396900,
    entregaItems: [
      { sku: "ESP-CHAND-BRUT", quantityEntregada: 6 },
      { sku: "VNO-PROGRES-MALB-2019", quantityEntregada: 3 },
      { sku: "ESP-NAVCOR-EXBR", quantityEntregada: 12 },
    ],
    entregaEntries: [
      { id: "VTA-001-ENT-1", fecha: "2025-12-25", hora: "10:34", items: [{ sku: "ESP-CHAND-BRUT", quantity: 6 }, { sku: "VNO-PROGRES-MALB-2019", quantity: 3 }, { sku: "ESP-NAVCOR-EXBR", quantity: 12 }] },
    ],
    cobros: [
      {
        id: "COB-001-01",
        fecha: "2025-12-25",
        hora: "10:35",
        medioPago: "transferencia",
        monto: 396900,
      },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────
  // VTA-002 · FINALIZADA · 7 productos · consumidor final
  // Cobro: 100% (efectivo) · Entrega: 100%
  // ─────────────────────────────────────────────
  {
    id: "VTA-002",
    fecha: "2025-12-24",
    hora: "16:20",
    cliente: { tipo: "consumidor_final" },
    items: [
      {
        sku: "WHKY-JW750-BLK",
        name: "Johnnie Walker Black Label",
        quantity: 2,
        unitPrice: 42000,
        discount: 0,
        discountType: "percent",
        total: 84000,
        categoria: "Whiskies",
      },
      {
        sku: "GIN-BOMBAY-ORIG",
        name: "Bombay Sapphire",
        quantity: 2,
        unitPrice: 16000,
        discount: 0,
        discountType: "percent",
        total: 32000,
        categoria: "Gin",
      },
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 3,
        unitPrice: 42000,
        discount: 10,
        discountType: "percent",
        total: 113400,
        categoria: "Vinos",
      },
      {
        sku: "ESP-CHAND-BRTROS",
        name: "Chandon Brut Rosé",
        quantity: 2,
        unitPrice: 19000,
        discount: 0,
        discountType: "percent",
        total: 38000,
        categoria: "Espumantes",
      },
      {
        sku: "LICR-COIN700-ORIG",
        name: "Cointreau 700 ml",
        quantity: 1,
        unitPrice: 19000,
        discount: 0,
        discountType: "percent",
        total: 19000,
        categoria: "Licores",
      },
      {
        sku: "VDKA-ABSO-ORIG",
        name: "Absolut Original",
        quantity: 3,
        unitPrice: 12000,
        discount: 0,
        discountType: "percent",
        total: 36000,
        categoria: "Vodka",
      },
      {
        sku: "RON-HAVCL-7ANS",
        name: "Havana Club 7 Años",
        quantity: 2,
        unitPrice: 16000,
        discount: 0,
        discountType: "percent",
        total: 32000,
        categoria: "Ron",
      },
    ],
    subtotal: 354400,
    descuento: 0,
    descuentoTipo: "percent",
    total: 354400,
    entregaItems: [
      { sku: "WHKY-JW750-BLK", quantityEntregada: 2 },
      { sku: "GIN-BOMBAY-ORIG", quantityEntregada: 2 },
      { sku: "VNO-PROGRES-MALB-2019", quantityEntregada: 3 },
      { sku: "ESP-CHAND-BRTROS", quantityEntregada: 2 },
      { sku: "LICR-COIN700-ORIG", quantityEntregada: 1 },
      { sku: "VDKA-ABSO-ORIG", quantityEntregada: 3 },
      { sku: "RON-HAVCL-7ANS", quantityEntregada: 2 },
    ],
    entregaEntries: [
      { id: "VTA-002-ENT-1", fecha: "2025-12-24", hora: "16:24", items: [{ sku: "WHKY-JW750-BLK", quantity: 2 }, { sku: "GIN-BOMBAY-ORIG", quantity: 2 }, { sku: "VNO-PROGRES-MALB-2019", quantity: 3 }, { sku: "ESP-CHAND-BRTROS", quantity: 2 }, { sku: "LICR-COIN700-ORIG", quantity: 1 }, { sku: "VDKA-ABSO-ORIG", quantity: 3 }, { sku: "RON-HAVCL-7ANS", quantity: 2 }] },
    ],
    cobros: [
      {
        id: "COB-002-01",
        fecha: "2025-12-24",
        hora: "16:25",
        medioPago: "efectivo",
        monto: 354400,
      },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────
  // VTA-003 · EN CURSO · 3 productos · cliente cuenta
  // Cobro: parcial (50%) · Entrega: 100%
  // ─────────────────────────────────────────────
  {
    id: "VTA-003",
    fecha: "2025-12-23",
    hora: "14:05",
    cliente: { tipo: "cuenta", id: "CLI-006", nombre: "Restaurant La Esquina" },
    items: [
      {
        sku: "VNO-SALRES-MALB-2020",
        name: "Salentein Reserve Malbec 2020",
        quantity: 24,
        unitPrice: 17000,
        discount: 10,
        discountType: "percent",
        total: 367200,
        categoria: "Vinos",
      },
      {
        sku: "VNO-SALRES-CHARD-2021",
        name: "Salentein Reserve Chardonnay 2021",
        quantity: 12,
        unitPrice: 16000,
        discount: 10,
        discountType: "percent",
        total: 172800,
        categoria: "Vinos",
      },
      {
        sku: "ESP-CHAND-BRUT",
        name: "Chandon Brut",
        quantity: 6,
        unitPrice: 18500,
        discount: 0,
        discountType: "percent",
        total: 111000,
        categoria: "Espumantes",
      },
    ],
    subtotal: 651000,
    descuento: 0,
    descuentoTipo: "percent",
    total: 651000,
    entregaItems: [
      { sku: "VNO-SALRES-MALB-2020", quantityEntregada: 24 },
      { sku: "VNO-SALRES-CHARD-2021", quantityEntregada: 12 },
      { sku: "ESP-CHAND-BRUT", quantityEntregada: 6 },
    ],
    entregaEntries: [
      { id: "VTA-003-ENT-1", fecha: "2025-12-23", hora: "14:08", items: [{ sku: "VNO-SALRES-MALB-2020", quantity: 24 }, { sku: "VNO-SALRES-CHARD-2021", quantity: 12 }, { sku: "ESP-CHAND-BRUT", quantity: 6 }] },
    ],
    cobros: [
      {
        id: "COB-003-01",
        fecha: "2025-12-23",
        hora: "14:10",
        medioPago: "transferencia",
        monto: 325500,
      },
    ],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────
  // VTA-004 · EN CURSO · 1 producto · cliente cuenta
  // Cobro: 100% · Entrega: parcial (0/12 entregadas)
  // ─────────────────────────────────────────────
  {
    id: "VTA-004",
    fecha: "2025-12-22",
    hora: "11:00",
    cliente: { tipo: "cuenta", id: "CLI-004", nombre: "Vinoteca El Sabor SRL" },
    items: [
      {
        sku: "RON-HAVCL-7ANS",
        name: "Havana Club 7 Años",
        quantity: 12,
        unitPrice: 16000,
        discount: 5,
        discountType: "percent",
        total: 182400,
        categoria: "Ron",
      },
    ],
    subtotal: 182400,
    descuento: 0,
    descuentoTipo: "percent",
    total: 182400,
    entregaItems: [
      { sku: "RON-HAVCL-7ANS", quantityEntregada: 0 },
    ],
    entregaEntries: [],
    cobros: [
      {
        id: "COB-004-01",
        fecha: "2025-12-22",
        hora: "11:05",
        medioPago: "transferencia",
        monto: 182400,
      },
    ],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────
  // VTA-005 · EN CURSO · 3 productos · consumidor final
  // Cobro: 0% · Entrega: 0%
  // ─────────────────────────────────────────────
  {
    id: "VTA-005",
    fecha: "2025-12-20",
    hora: "09:30",
    cliente: { tipo: "consumidor_final" },
    items: [
      {
        sku: "WHKY-JD-OLD7",
        name: "Jack Daniel's Old No.7",
        quantity: 2,
        unitPrice: 18000,
        discount: 0,
        discountType: "percent",
        total: 36000,
        categoria: "Whiskies",
      },
      {
        sku: "VNO-PROICON-CABS-2019",
        name: "Proemio Ícono Cabernet Sauvignon 2019",
        quantity: 3,
        unitPrice: 48000,
        discount: 0,
        discountType: "percent",
        total: 144000,
        categoria: "Vinos",
      },
      {
        sku: "ESP-CHAND-BRTROS",
        name: "Chandon Brut Rosé",
        quantity: 2,
        unitPrice: 19000,
        discount: 0,
        discountType: "percent",
        total: 38000,
        categoria: "Espumantes",
      },
    ],
    subtotal: 218000,
    descuento: 0,
    descuentoTipo: "percent",
    total: 218000,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "en_curso",
  },
]
