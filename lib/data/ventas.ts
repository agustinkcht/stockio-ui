import type { Venta } from "@/lib/types"

// All SKUs, prices and client IDs reference real records from initial-items.ts and clientes.ts
// Prices match the `precio.costo` field (what we paid) → ventas use precioFinal (what we charge)

export const VENTAS: Venta[] = [

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-001 · FINALIZADA · Distribuidora Norte S.A. · 3 productos
  // Cobro: 100% transferencia · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-001",
    fecha: "2026-04-02",
    hora: "10:15",
    cliente: { tipo: "cuenta", id: "CLI-003", nombre: "Distribuidora Norte S.A." },
    items: [
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 6,
        unitPrice: 76230,
        discount: 10,
        discountType: "percent",
        total: 411642,
        categoria: "Vinos",
      },
      {
        sku: "VNO-PROGRES-CABS-2019",
        name: "Proemio Grand Reserve Cabernet Sauvignon 2019",
        quantity: 6,
        unitPrice: 83490,
        discount: 10,
        discountType: "percent",
        total: 450846,
        categoria: "Vinos",
      },
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 12,
        unitPrice: 27150,
        discount: 5,
        discountType: "percent",
        total: 309510,
        categoria: "Espumantes",
      },
    ],
    subtotal: 1171998,
    descuento: 0,
    descuentoTipo: "percent",
    envio: 8500,
    total: 1180498,
    entregaItems: [
      { sku: "VNO-PROGRES-MALB-2019", quantityEntregada: 6 },
      { sku: "VNO-PROGRES-CABS-2019", quantityEntregada: 6 },
      { sku: "ESP-NAVCOR-EXBR", quantityEntregada: 12 },
    ],
    entregaEntries: [
      {
        id: "VTA-001-ENT-1",
        fecha: "2026-04-02",
        hora: "10:20",
        items: [
          { sku: "VNO-PROGRES-MALB-2019", quantity: 6 },
          { sku: "VNO-PROGRES-CABS-2019", quantity: 6 },
          { sku: "ESP-NAVCOR-EXBR", quantity: 12 },
        ],
      },
    ],
    cobros: [
      { id: "COB-001-01", fecha: "2026-04-02", hora: "10:22", medioPago: "transferencia", monto: 1180498 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-002 · FINALIZADA · Restaurant La Esquina · 5 productos · descuento global
  // Cobro: 100% (2 cuotas: transferencia + posnet) · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-002",
    fecha: "2026-04-05",
    hora: "15:40",
    cliente: { tipo: "cuenta", id: "CLI-006", nombre: "Restaurant La Esquina" },
    items: [
      {
        sku: "VNO-DOMESTE-MALB",
        name: "Domiciano Estelar Malbec",
        quantity: 12,
        unitPrice: 25410,
        discount: 0,
        discountType: "percent",
        total: 304920,
        categoria: "Vinos",
      },
      {
        sku: "VNO-DOMESTE-CHRD",
        name: "Domiciano Estelar Chardonnay",
        quantity: 12,
        unitPrice: 29040,
        discount: 0,
        discountType: "percent",
        total: 348480,
        categoria: "Vinos",
      },
      {
        sku: "ESP-SALENT-EXBR",
        name: "Salentein Extra Brut",
        quantity: 6,
        unitPrice: 39930,
        discount: 0,
        discountType: "percent",
        total: 239580,
        categoria: "Espumantes",
      },
      {
        sku: "ESP-SALENT-BRRO",
        name: "Salentein Brut Rosé",
        quantity: 6,
        unitPrice: 41730,
        discount: 0,
        discountType: "percent",
        total: 250380,
        categoria: "Espumantes",
      },
      {
        sku: "LICR-JGRM700",
        name: "Jägermeister 700 ml",
        quantity: 4,
        unitPrice: 27615,
        discount: 0,
        discountType: "percent",
        total: 110460,
        categoria: "Licores",
      },
    ],
    subtotal: 1253820,
    descuento: 5,
    descuentoTipo: "percent",
    total: 1191129,
    entregaItems: [
      { sku: "VNO-DOMESTE-MALB", quantityEntregada: 12 },
      { sku: "VNO-DOMESTE-CHRD", quantityEntregada: 12 },
      { sku: "ESP-SALENT-EXBR", quantityEntregada: 6 },
      { sku: "ESP-SALENT-BRRO", quantityEntregada: 6 },
      { sku: "LICR-JGRM700", quantityEntregada: 4 },
    ],
    entregaEntries: [
      {
        id: "VTA-002-ENT-1",
        fecha: "2026-04-05",
        hora: "15:45",
        items: [
          { sku: "VNO-DOMESTE-MALB", quantity: 12 },
          { sku: "VNO-DOMESTE-CHRD", quantity: 12 },
          { sku: "ESP-SALENT-EXBR", quantity: 6 },
          { sku: "ESP-SALENT-BRRO", quantity: 6 },
          { sku: "LICR-JGRM700", quantity: 4 },
        ],
      },
    ],
    cobros: [
      { id: "COB-002-01", fecha: "2026-04-05", hora: "15:47", medioPago: "transferencia", monto: 700000 },
      { id: "COB-002-02", fecha: "2026-04-06", hora: "10:00", medioPago: "posnet", monto: 491129 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-003 · FINALIZADA · Vinoteca El Sabor SRL · 2 productos
  // Cobro: 100% efectivo · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-003",
    fecha: "2026-04-08",
    hora: "11:30",
    cliente: { tipo: "cuenta", id: "CLI-004", nombre: "Vinoteca El Sabor SRL" },
    items: [
      {
        sku: "VNO-DVCAT-MALB",
        name: "DV Catena Malbec",
        quantity: 6,
        unitPrice: 97860,
        discount: 8,
        discountType: "percent",
        total: 540050,
        categoria: "Vinos",
      },
      {
        sku: "VNO-DVCAT-CABS",
        name: "DV Catena Cabernet Sauvignon",
        quantity: 6,
        unitPrice: 96090,
        discount: 8,
        discountType: "percent",
        total: 530657,
        categoria: "Vinos",
      },
    ],
    subtotal: 1070707,
    descuento: 0,
    descuentoTipo: "percent",
    total: 1070707,
    entregaItems: [
      { sku: "VNO-DVCAT-MALB", quantityEntregada: 6 },
      { sku: "VNO-DVCAT-CABS", quantityEntregada: 6 },
    ],
    entregaEntries: [
      {
        id: "VTA-003-ENT-1",
        fecha: "2026-04-08",
        hora: "11:35",
        items: [
          { sku: "VNO-DVCAT-MALB", quantity: 6 },
          { sku: "VNO-DVCAT-CABS", quantity: 6 },
        ],
      },
    ],
    cobros: [
      { id: "COB-003-01", fecha: "2026-04-08", hora: "11:38", medioPago: "efectivo", monto: 1070707 },
    ],
    estado: "finalizada",
    facturaEmitida: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-004 · EN CURSO · Juan Pérez · 4 productos
  // Cobro: 100% posnet · Entrega: parcial (2/4 JW Black entregados)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-004",
    fecha: "2026-04-10",
    hora: "17:05",
    cliente: { tipo: "cuenta", id: "CLI-001", nombre: "Juan Pérez" },
    items: [
      {
        sku: "WHKY-JW750-BLACK",
        name: "Johnnie Walker Black Label",
        quantity: 4,
        unitPrice: 52500,
        discount: 0,
        discountType: "percent",
        total: 210000,
        categoria: "Whiskies",
      },
      {
        sku: "GIN-BOMSAPH",
        name: "Bombay Sapphire",
        quantity: 2,
        unitPrice: 29040,
        discount: 0,
        discountType: "percent",
        total: 58080,
        categoria: "Gin",
      },
      {
        sku: "VDKA-ABSO-ORIG",
        name: "Absolut Original",
        quantity: 2,
        unitPrice: 21720,
        discount: 0,
        discountType: "percent",
        total: 43440,
        categoria: "Vodka",
      },
      {
        sku: "LICR-SHEROR",
        name: "Sheridan's Original",
        quantity: 1,
        unitPrice: 30240,
        discount: 0,
        discountType: "percent",
        total: 30240,
        categoria: "Licores",
      },
    ],
    subtotal: 341760,
    descuento: 0,
    descuentoTipo: "percent",
    total: 341760,
    entregaItems: [
      { sku: "WHKY-JW750-BLACK", quantityEntregada: 2 },
      { sku: "GIN-BOMSAPH", quantityEntregada: 0 },
      { sku: "VDKA-ABSO-ORIG", quantityEntregada: 0 },
      { sku: "LICR-SHEROR", quantityEntregada: 0 },
    ],
    entregaEntries: [
      {
        id: "VTA-004-ENT-1",
        fecha: "2026-04-10",
        hora: "17:10",
        items: [{ sku: "WHKY-JW750-BLACK", quantity: 2 }],
      },
    ],
    cobros: [
      { id: "COB-004-01", fecha: "2026-04-10", hora: "17:08", medioPago: "posnet", monto: 341760 },
    ],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-005 · EN CURSO · Vinoteca Moderna S.A. · 3 productos
  // Cobro: parcial (50% transferencia) · Entrega: 0%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-005",
    fecha: "2026-04-12",
    hora: "09:20",
    cliente: { tipo: "cuenta", id: "CLI-010", nombre: "Vinoteca Moderna S.A." },
    items: [
      {
        sku: "VNO-PROGRES-SYGA-2012",
        name: "Proemio Grand Reserve Syrah Garnacha 2012",
        quantity: 12,
        unitPrice: 79860,
        discount: 0,
        discountType: "percent",
        total: 958320,
        categoria: "Vinos",
      },
      {
        sku: "VNO-PROGRES-MALB-2012",
        name: "Proemio Grand Reserve Malbec 2012",
        quantity: 6,
        unitPrice: 81675,
        discount: 0,
        discountType: "percent",
        total: 490050,
        categoria: "Vinos",
      },
      {
        sku: "ESP-SALENT-BRNA",
        name: "Salentein Brut Nature",
        quantity: 6,
        unitPrice: 43560,
        discount: 0,
        discountType: "percent",
        total: 261360,
        categoria: "Espumantes",
      },
    ],
    subtotal: 1709730,
    descuento: 0,
    descuentoTipo: "percent",
    envio: 12000,
    total: 1721730,
    entregaItems: [],
    entregaEntries: [],
    cobros: [
      { id: "COB-005-01", fecha: "2026-04-12", hora: "09:25", medioPago: "transferencia", monto: 860865 },
    ],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-006 · EN CURSO · Distribuciones Cortés · 2 productos
  // Cobro: 0% · Entrega: 0% (pendiente de pago y despacho)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-006",
    fecha: "2026-04-14",
    hora: "14:00",
    cliente: { tipo: "cuenta", id: "CLI-011", nombre: "Distribuciones Cortés" },
    items: [
      {
        sku: "WHKY-JDOLD7",
        name: "Jack Daniel's Old No.7",
        quantity: 6,
        unitPrice: 34020,
        discount: 0,
        discountType: "percent",
        total: 204120,
        categoria: "Whiskies",
      },
      {
        sku: "WHKY-JMSOR",
        name: "Jameson Original",
        quantity: 6,
        unitPrice: 35940,
        discount: 0,
        discountType: "percent",
        total: 215640,
        categoria: "Whiskies",
      },
    ],
    subtotal: 419760,
    descuento: 0,
    descuentoTipo: "percent",
    total: 419760,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-007 · CANCELADA · María González · 3 productos
  // Motivo: cliente canceló antes de la entrega
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-007",
    fecha: "2026-03-28",
    hora: "16:45",
    cliente: { tipo: "cuenta", id: "CLI-002", nombre: "María González" },
    items: [
      {
        sku: "GIN-RESTINGA-ORIG",
        name: "Restinga Original",
        quantity: 3,
        unitPrice: 19965,
        discount: 0,
        discountType: "percent",
        total: 59895,
        categoria: "Gin",
      },
      {
        sku: "GIN-RESTINGA-OTON",
        name: "Restinga Destilado Otoño",
        quantity: 2,
        unitPrice: 21720,
        discount: 0,
        discountType: "percent",
        total: 43440,
        categoria: "Gin",
      },
      {
        sku: "VDKA-ABSO-RASP",
        name: "Absolut Raspberry",
        quantity: 2,
        unitPrice: 23595,
        discount: 0,
        discountType: "percent",
        total: 47190,
        categoria: "Vodka",
      },
    ],
    subtotal: 150525,
    descuento: 0,
    descuentoTipo: "percent",
    total: 150525,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "cancelada",
    observaciones: "Cliente canceló el pedido antes del despacho.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-008 · CANCELADA · Consumidor Final · 1 producto
  // Cobro realizado → devolución registrada en observaciones
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-008",
    fecha: "2026-03-30",
    hora: "12:10",
    cliente: { tipo: "consumidor_final" },
    items: [
      {
        sku: "WHKY-JW750-BLUE",
        name: "Johnnie Walker Blue Label",
        quantity: 1,
        unitPrice: 136500,
        discount: 0,
        discountType: "percent",
        total: 136500,
        categoria: "Whiskies",
      },
    ],
    subtotal: 136500,
    descuento: 0,
    descuentoTipo: "percent",
    total: 136500,
    entregaItems: [],
    entregaEntries: [],
    cobros: [
      { id: "COB-008-01", fecha: "2026-03-30", hora: "12:12", medioPago: "posnet", monto: 136500 },
    ],
    estado: "cancelada",
    observaciones: "Producto devuelto. Reembolso procesado por posnet el 31/03/2026.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-009 · EN CURSO · Roberto Fernández · 4 productos · descuento global
  // Cobro: parcial · Entrega: 50%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-009",
    fecha: "2026-04-15",
    hora: "18:30",
    cliente: { tipo: "cuenta", id: "CLI-005", nombre: "Roberto Fernández" },
    items: [
      {
        sku: "TEQ-PATSLVR",
        name: "Patrón Silver",
        quantity: 2,
        unitPrice: 47030,
        discount: 0,
        discountType: "percent",
        total: 94060,
        categoria: "Tequila",
      },
      {
        sku: "VDKA-CRCOR",
        name: "Cîroc Original",
        quantity: 2,
        unitPrice: 36300,
        discount: 0,
        discountType: "percent",
        total: 72600,
        categoria: "Vodka",
      },
      {
        sku: "LICR-FIRB750",
        name: "Fireball 750 ml",
        quantity: 3,
        unitPrice: 26400,
        discount: 0,
        discountType: "percent",
        total: 79200,
        categoria: "Licores",
      },
      {
        sku: "GIN-MYRBOT",
        name: "Myrica Botánicos",
        quantity: 2,
        unitPrice: 21720,
        discount: 0,
        discountType: "percent",
        total: 43440,
        categoria: "Gin",
      },
    ],
    subtotal: 289300,
    descuento: 300,
    descuentoTipo: "fixed",
    total: 289000,
    entregaItems: [
      { sku: "TEQ-PATSLVR", quantityEntregada: 2 },
      { sku: "VDKA-CRCOR", quantityEntregada: 2 },
      { sku: "LICR-FIRB750", quantityEntregada: 0 },
      { sku: "GIN-MYRBOT", quantityEntregada: 0 },
    ],
    entregaEntries: [
      {
        id: "VTA-009-ENT-1",
        fecha: "2026-04-15",
        hora: "18:35",
        items: [
          { sku: "TEQ-PATSLVR", quantity: 2 },
          { sku: "VDKA-CRCOR", quantity: 2 },
        ],
      },
    ],
    cobros: [
      { id: "COB-009-01", fecha: "2026-04-15", hora: "18:32", medioPago: "efectivo", monto: 150000 },
    ],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-010 · FINALIZADA · Consumidor Final · 6 productos · descuento global + envío
  // Cobro: 100% transferencia · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-010",
    fecha: "2026-04-17",
    hora: "13:00",
    cliente: { tipo: "consumidor_final" },
    items: [
      {
        sku: "VNO-DOMGRES-BLND",
        name: "Domiciano Gran Reserva Blend",
        quantity: 2,
        unitPrice: 32580,
        discount: 0,
        discountType: "percent",
        total: 65160,
        categoria: "Vinos",
      },
      {
        sku: "ESP-DOMES-BRNA",
        name: "Domiciano Estelar Brut Nature",
        quantity: 2,
        unitPrice: 27150,
        discount: 0,
        discountType: "percent",
        total: 54300,
        categoria: "Espumantes",
      },
      {
        sku: "LICR-DOMIMST",
        name: "Domiciano Mistela",
        quantity: 2,
        unitPrice: 21720,
        discount: 0,
        discountType: "percent",
        total: 43440,
        categoria: "Licores",
      },
      {
        sku: "GIN-ACCGOR",
        name: "Aconcagua Original",
        quantity: 1,
        unitPrice: 18150,
        discount: 0,
        discountType: "percent",
        total: 18150,
        categoria: "Gin",
      },
      {
        sku: "VDKA-ABSO-PEAR",
        name: "Absolut Pear",
        quantity: 2,
        unitPrice: 23595,
        discount: 0,
        discountType: "percent",
        total: 47190,
        categoria: "Vodka",
      },
      {
        sku: "RON-MALIBU",
        name: "Malibu",
        quantity: 2,
        unitPrice: 25550,
        discount: 0,
        discountType: "percent",
        total: 51100,
        categoria: "Ron",
      },
    ],
    subtotal: 279340,
    descuento: 10,
    descuentoTipo: "percent",
    envio: 5000,
    total: 256406,
    entregaItems: [
      { sku: "VNO-DOMGRES-BLND", quantityEntregada: 2 },
      { sku: "ESP-DOMES-BRNA", quantityEntregada: 2 },
      { sku: "LICR-DOMIMST", quantityEntregada: 2 },
      { sku: "GIN-ACCGOR", quantityEntregada: 1 },
      { sku: "VDKA-ABSO-PEAR", quantityEntregada: 2 },
      { sku: "RON-MALIBU", quantityEntregada: 2 },
    ],
    entregaEntries: [
      {
        id: "VTA-010-ENT-1",
        fecha: "2026-04-17",
        hora: "13:05",
        items: [
          { sku: "VNO-DOMGRES-BLND", quantity: 2 },
          { sku: "ESP-DOMES-BRNA", quantity: 2 },
          { sku: "LICR-DOMIMST", quantity: 2 },
          { sku: "GIN-ACCGOR", quantity: 1 },
          { sku: "VDKA-ABSO-PEAR", quantity: 2 },
          { sku: "RON-MALIBU", quantity: 2 },
        ],
      },
    ],
    cobros: [
      { id: "COB-010-01", fecha: "2026-04-17", hora: "13:10", medioPago: "transferencia", monto: 256406 },
    ],
    estado: "finalizada",
  },
]
