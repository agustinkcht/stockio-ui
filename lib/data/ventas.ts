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
    origen: "presupuesto",
    presupuestoId: "PRE-003",
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

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-011 · FINALIZADA · María González · 3 productos (vinos + espumante)
  // Cobro: 100% efectivo · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-011",
    fecha: "2026-04-23",
    hora: "11:00",
    cliente: { tipo: "cuenta", id: "CLI-002", nombre: "María González" },
    items: [
      {
        sku: "VNO-DOMESTE-MALB",
        name: "Domiciano Estelar Malbec",
        quantity: 3,
        unitPrice: 25410,
        discount: 0,
        discountType: "percent",
        total: 76230,
        categoria: "Vinos",
      },
      {
        sku: "VNO-DOMESTE-CHRD",
        name: "Domiciano Estelar Chardonnay",
        quantity: 3,
        unitPrice: 29040,
        discount: 0,
        discountType: "percent",
        total: 87120,
        categoria: "Vinos",
      },
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 2,
        unitPrice: 27150,
        discount: 0,
        discountType: "percent",
        total: 54300,
        categoria: "Espumantes",
      },
    ],
    subtotal: 217650,
    descuento: 0,
    descuentoTipo: "percent",
    total: 217650,
    entregaItems: [
      { sku: "VNO-DOMESTE-MALB", quantityEntregada: 3 },
      { sku: "VNO-DOMESTE-CHRD", quantityEntregada: 3 },
      { sku: "ESP-NAVCOR-EXBR", quantityEntregada: 2 },
    ],
    entregaEntries: [
      {
        id: "VTA-011-ENT-1",
        fecha: "2026-04-23",
        hora: "11:05",
        items: [
          { sku: "VNO-DOMESTE-MALB", quantity: 3 },
          { sku: "VNO-DOMESTE-CHRD", quantity: 3 },
          { sku: "ESP-NAVCOR-EXBR", quantity: 2 },
        ],
      },
    ],
    cobros: [
      { id: "COB-011-01", fecha: "2026-04-23", hora: "11:08", medioPago: "efectivo", monto: 217650 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-012 · EN CURSO · Vinoteca El Sabor SRL · 4 productos desde presupuesto
  // Cobro: 50% transferencia · Entrega: 0%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-012",
    fecha: "2026-04-25",
    hora: "10:30",
    cliente: { tipo: "cuenta", id: "CLI-004", nombre: "Vinoteca El Sabor SRL" },
    items: [
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 6,
        unitPrice: 76230,
        discount: 8,
        discountType: "percent",
        total: 420307,
        categoria: "Vinos",
      },
      {
        sku: "VNO-PROGRES-CABS-2019",
        name: "Proemio Grand Reserve Cabernet Sauvignon 2019",
        quantity: 6,
        unitPrice: 83490,
        discount: 8,
        discountType: "percent",
        total: 460583,
        categoria: "Vinos",
      },
      {
        sku: "ESP-SALENT-BRNA",
        name: "Salentein Brut Nature",
        quantity: 4,
        unitPrice: 43560,
        discount: 0,
        discountType: "percent",
        total: 174240,
        categoria: "Espumantes",
      },
      {
        sku: "ESP-SALENT-BRRO",
        name: "Salentein Brut Rosé",
        quantity: 4,
        unitPrice: 41730,
        discount: 0,
        discountType: "percent",
        total: 166920,
        categoria: "Espumantes",
      },
    ],
    subtotal: 1222050,
    descuento: 0,
    descuentoTipo: "percent",
    envio: 9000,
    total: 1231050,
    entregaItems: [],
    entregaEntries: [],
    cobros: [
      { id: "COB-012-01", fecha: "2026-04-25", hora: "10:35", medioPago: "transferencia", monto: 615525 },
    ],
    estado: "en_curso",
    origen: "presupuesto",
    presupuestoId: "PRE-011",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-013 · FINALIZADA · Roberto Fernández · 2 productos manual
  // Cobro: 100% posnet · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-013",
    fecha: "2026-04-27",
    hora: "16:15",
    cliente: { tipo: "cuenta", id: "CLI-005", nombre: "Roberto Fernández" },
    items: [
      {
        sku: "WHKY-JW750-BLACK",
        name: "Johnnie Walker Black Label",
        quantity: 2,
        unitPrice: 52500,
        discount: 0,
        discountType: "percent",
        total: 105000,
        categoria: "Whiskies",
      },
      {
        sku: "WHKY-JMSOR",
        name: "Jameson Original",
        quantity: 2,
        unitPrice: 35940,
        discount: 0,
        discountType: "percent",
        total: 71880,
        categoria: "Whiskies",
      },
    ],
    subtotal: 176880,
    descuento: 0,
    descuentoTipo: "percent",
    total: 176880,
    entregaItems: [
      { sku: "WHKY-JW750-BLACK", quantityEntregada: 2 },
      { sku: "WHKY-JMSOR", quantityEntregada: 2 },
    ],
    entregaEntries: [
      {
        id: "VTA-013-ENT-1",
        fecha: "2026-04-27",
        hora: "16:20",
        items: [
          { sku: "WHKY-JW750-BLACK", quantity: 2 },
          { sku: "WHKY-JMSOR", quantity: 2 },
        ],
      },
    ],
    cobros: [
      { id: "COB-013-01", fecha: "2026-04-27", hora: "16:18", medioPago: "posnet", monto: 176880 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-014 · EN CURSO · Distribuidora Norte S.A. · 3 productos desde presupuesto
  // Cobro: 0% · Entrega: parcial (6/12 Proemio Malbec)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-014",
    fecha: "2026-04-29",
    hora: "09:00",
    cliente: { tipo: "cuenta", id: "CLI-003", nombre: "Distribuidora Norte S.A." },
    items: [
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve Malbec 2019",
        quantity: 12,
        unitPrice: 76230,
        discount: 10,
        discountType: "percent",
        total: 823284,
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
        sku: "VNO-PROGRES-SYGA-2019",
        name: "Proemio Grand Reserve Syrah Garnacha 2019",
        quantity: 6,
        unitPrice: 78045,
        discount: 10,
        discountType: "percent",
        total: 421443,
        categoria: "Vinos",
      },
    ],
    subtotal: 1695573,
    descuento: 0,
    descuentoTipo: "percent",
    envio: 15000,
    total: 1710573,
    entregaItems: [
      { sku: "VNO-PROGRES-MALB-2019", quantityEntregada: 6 },
      { sku: "VNO-PROGRES-CABS-2019", quantityEntregada: 0 },
      { sku: "VNO-PROGRES-SYGA-2019", quantityEntregada: 0 },
    ],
    entregaEntries: [
      {
        id: "VTA-014-ENT-1",
        fecha: "2026-04-30",
        hora: "10:00",
        items: [{ sku: "VNO-PROGRES-MALB-2019", quantity: 6 }],
      },
    ],
    cobros: [],
    estado: "en_curso",
    origen: "presupuesto",
    presupuestoId: "PRE-001",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-015 · CANCELADA · Consumidor Final · 2 productos
  // Cobro: parcial devolución · Entrega: 0%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-015",
    fecha: "2026-04-30",
    hora: "14:45",
    cliente: { tipo: "consumidor_final" },
    items: [
      {
        sku: "TEQ-PATSLVR",
        name: "Patrón Silver",
        quantity: 1,
        unitPrice: 47030,
        discount: 0,
        discountType: "percent",
        total: 47030,
        categoria: "Tequila",
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
    subtotal: 98130,
    descuento: 0,
    descuentoTipo: "percent",
    total: 98130,
    entregaItems: [],
    entregaEntries: [],
    cobros: [
      { id: "COB-015-01", fecha: "2026-04-30", hora: "14:47", medioPago: "posnet", monto: 98130 },
    ],
    estado: "cancelada",
    observaciones: "Cliente arrepentido. Reembolso procesado 01/05/2026.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-016 · FINALIZADA · Vinoteca Moderna S.A. · 3 productos desde presupuesto
  // Cobro: 100% transferencia (2 pagos) · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-016",
    fecha: "2026-05-02",
    hora: "10:00",
    cliente: { tipo: "cuenta", id: "CLI-010", nombre: "Vinoteca Moderna S.A." },
    items: [
      {
        sku: "WHKY-JW750-BLACK",
        name: "Johnnie Walker Black Label",
        quantity: 6,
        unitPrice: 52500,
        discount: 5,
        discountType: "percent",
        total: 299250,
        categoria: "Whiskies",
      },
      {
        sku: "WHKY-JDOLD7",
        name: "Jack Daniel's Old No.7",
        quantity: 6,
        unitPrice: 34020,
        discount: 5,
        discountType: "percent",
        total: 193914,
        categoria: "Whiskies",
      },
      {
        sku: "GIN-BOMSAPH",
        name: "Bombay Sapphire",
        quantity: 4,
        unitPrice: 29040,
        discount: 0,
        discountType: "percent",
        total: 116160,
        categoria: "Gin",
      },
    ],
    subtotal: 609324,
    descuento: 0,
    descuentoTipo: "percent",
    total: 609324,
    entregaItems: [
      { sku: "WHKY-JW750-BLACK", quantityEntregada: 6 },
      { sku: "WHKY-JDOLD7", quantityEntregada: 6 },
      { sku: "GIN-BOMSAPH", quantityEntregada: 4 },
    ],
    entregaEntries: [
      {
        id: "VTA-016-ENT-1",
        fecha: "2026-05-02",
        hora: "10:10",
        items: [
          { sku: "WHKY-JW750-BLACK", quantity: 6 },
          { sku: "WHKY-JDOLD7", quantity: 6 },
          { sku: "GIN-BOMSAPH", quantity: 4 },
        ],
      },
    ],
    cobros: [
      { id: "COB-016-01", fecha: "2026-05-02", hora: "10:05", medioPago: "transferencia", monto: 400000 },
      { id: "COB-016-02", fecha: "2026-05-03", hora: "09:30", medioPago: "transferencia", monto: 209324 },
    ],
    estado: "finalizada",
    origen: "presupuesto",
    presupuestoId: "PRE-002",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-017 · FINALIZADA · Valentina Gómez · 3 productos manual
  // Cobro: 100% efectivo · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-017",
    fecha: "2026-05-05",
    hora: "12:30",
    cliente: { tipo: "cuenta", id: "CLI-012", nombre: "Valentina Gómez" },
    items: [
      {
        sku: "ESP-SALENT-BRNA",
        name: "Salentein Brut Nature",
        quantity: 2,
        unitPrice: 43560,
        discount: 0,
        discountType: "percent",
        total: 87120,
        categoria: "Espumantes",
      },
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 2,
        unitPrice: 27150,
        discount: 0,
        discountType: "percent",
        total: 54300,
        categoria: "Espumantes",
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
    subtotal: 171660,
    descuento: 0,
    descuentoTipo: "percent",
    total: 171660,
    entregaItems: [
      { sku: "ESP-SALENT-BRNA", quantityEntregada: 2 },
      { sku: "ESP-NAVCOR-EXBR", quantityEntregada: 2 },
      { sku: "LICR-SHEROR", quantityEntregada: 1 },
    ],
    entregaEntries: [
      {
        id: "VTA-017-ENT-1",
        fecha: "2026-05-05",
        hora: "12:35",
        items: [
          { sku: "ESP-SALENT-BRNA", quantity: 2 },
          { sku: "ESP-NAVCOR-EXBR", quantity: 2 },
          { sku: "LICR-SHEROR", quantity: 1 },
        ],
      },
    ],
    cobros: [
      { id: "COB-017-01", fecha: "2026-05-05", hora: "12:33", medioPago: "efectivo", monto: 171660 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-018 · EN CURSO · Martín López · 3 productos desde presupuesto
  // Cobro: 100% · Entrega: parcial
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-018",
    fecha: "2026-05-07",
    hora: "15:00",
    cliente: { tipo: "cuenta", id: "CLI-009", nombre: "Martín López" },
    items: [
      {
        sku: "VNO-DOMGRES-BLND",
        name: "Domiciano Gran Reserva Blend",
        quantity: 4,
        unitPrice: 32580,
        discount: 0,
        discountType: "percent",
        total: 130320,
        categoria: "Vinos",
      },
      {
        sku: "VNO-DOMESTE-BLND",
        name: "Domiciano Estelar Blend",
        quantity: 4,
        unitPrice: 27150,
        discount: 0,
        discountType: "percent",
        total: 108600,
        categoria: "Vinos",
      },
      {
        sku: "ESP-DOMES-BRNA",
        name: "Domiciano Estelar Brut Nature",
        quantity: 3,
        unitPrice: 27150,
        discount: 0,
        discountType: "percent",
        total: 81450,
        categoria: "Espumantes",
      },
    ],
    subtotal: 320370,
    descuento: 0,
    descuentoTipo: "percent",
    total: 320370,
    entregaItems: [
      { sku: "VNO-DOMGRES-BLND", quantityEntregada: 4 },
      { sku: "VNO-DOMESTE-BLND", quantityEntregada: 0 },
      { sku: "ESP-DOMES-BRNA", quantityEntregada: 0 },
    ],
    entregaEntries: [
      {
        id: "VTA-018-ENT-1",
        fecha: "2026-05-07",
        hora: "15:10",
        items: [{ sku: "VNO-DOMGRES-BLND", quantity: 4 }],
      },
    ],
    cobros: [
      { id: "COB-018-01", fecha: "2026-05-07", hora: "15:05", medioPago: "transferencia", monto: 320370 },
    ],
    estado: "en_curso",
    origen: "presupuesto",
    presupuestoId: "PRE-009",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-019 · FINALIZADA · Juan Pérez · 3 productos manual
  // Cobro: 100% posnet · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-019",
    fecha: "2026-05-09",
    hora: "17:45",
    cliente: { tipo: "cuenta", id: "CLI-001", nombre: "Juan Pérez" },
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
    subtotal: 241770,
    descuento: 0,
    descuentoTipo: "percent",
    total: 241770,
    entregaItems: [
      { sku: "WHKY-JW750-BLUE", quantityEntregada: 1 },
      { sku: "GIN-BOMSAPH", quantityEntregada: 2 },
      { sku: "VDKA-ABSO-RASP", quantityEntregada: 2 },
    ],
    entregaEntries: [
      {
        id: "VTA-019-ENT-1",
        fecha: "2026-05-09",
        hora: "17:50",
        items: [
          { sku: "WHKY-JW750-BLUE", quantity: 1 },
          { sku: "GIN-BOMSAPH", quantity: 2 },
          { sku: "VDKA-ABSO-RASP", quantity: 2 },
        ],
      },
    ],
    cobros: [
      { id: "COB-019-01", fecha: "2026-05-09", hora: "17:48", medioPago: "posnet", monto: 241770 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-020 · EN CURSO · Distribuciones Cortés · 4 productos desde presupuesto
  // Cobro: 0% · Entrega: 0%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-020",
    fecha: "2026-05-12",
    hora: "09:30",
    cliente: { tipo: "cuenta", id: "CLI-011", nombre: "Distribuciones Cortés" },
    items: [
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
      {
        sku: "WHKY-JMSBB",
        name: "Jameson Black Barrel",
        quantity: 4,
        unitPrice: 41250,
        discount: 0,
        discountType: "percent",
        total: 165000,
        categoria: "Whiskies",
      },
      {
        sku: "WHKY-JW750-DBLK",
        name: "Johnnie Walker Double Black",
        quantity: 3,
        unitPrice: 60000,
        discount: 0,
        discountType: "percent",
        total: 180000,
        categoria: "Whiskies",
      },
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
    ],
    subtotal: 764760,
    descuento: 0,
    descuentoTipo: "percent",
    total: 764760,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "en_curso",
    origen: "presupuesto",
    presupuestoId: "PRE-005",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-021 · FINALIZADA · Restaurant La Esquina · 3 productos manual
  // Cobro: 100% transferencia · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-021",
    fecha: "2026-05-14",
    hora: "11:15",
    cliente: { tipo: "cuenta", id: "CLI-006", nombre: "Restaurant La Esquina" },
    items: [
      {
        sku: "VNO-DOMESTE-MALB",
        name: "Domiciano Estelar Malbec",
        quantity: 6,
        unitPrice: 25410,
        discount: 0,
        discountType: "percent",
        total: 152460,
        categoria: "Vinos",
      },
      {
        sku: "ESP-SALENT-EXBR",
        name: "Salentein Extra Brut",
        quantity: 4,
        unitPrice: 39930,
        discount: 0,
        discountType: "percent",
        total: 159720,
        categoria: "Espumantes",
      },
      {
        sku: "LICR-JGRM700",
        name: "Jägermeister 700 ml",
        quantity: 3,
        unitPrice: 27615,
        discount: 0,
        discountType: "percent",
        total: 82845,
        categoria: "Licores",
      },
    ],
    subtotal: 395025,
    descuento: 0,
    descuentoTipo: "percent",
    total: 395025,
    entregaItems: [
      { sku: "VNO-DOMESTE-MALB", quantityEntregada: 6 },
      { sku: "ESP-SALENT-EXBR", quantityEntregada: 4 },
      { sku: "LICR-JGRM700", quantityEntregada: 3 },
    ],
    entregaEntries: [
      {
        id: "VTA-021-ENT-1",
        fecha: "2026-05-14",
        hora: "11:20",
        items: [
          { sku: "VNO-DOMESTE-MALB", quantity: 6 },
          { sku: "ESP-SALENT-EXBR", quantity: 4 },
          { sku: "LICR-JGRM700", quantity: 3 },
        ],
      },
    ],
    cobros: [
      { id: "COB-021-01", fecha: "2026-05-14", hora: "11:18", medioPago: "transferencia", monto: 395025 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-022 · CANCELADA · Omar el Malo · 2 productos manual
  // Cobro: 0% · Entrega: 0% — no llegó a concretarse
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-022",
    fecha: "2026-05-15",
    hora: "13:00",
    cliente: { tipo: "cuenta", id: "CLI-008", nombre: "Omar el Malo" },
    items: [
      {
        sku: "VDKA-CRCOR",
        name: "Cîroc Original",
        quantity: 3,
        unitPrice: 36300,
        discount: 0,
        discountType: "percent",
        total: 108900,
        categoria: "Vodka",
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
    ],
    subtotal: 152340,
    descuento: 0,
    descuentoTipo: "percent",
    total: 152340,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "cancelada",
    observaciones: "Cliente no respondió para coordinar entrega. Pedido cancelado.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-023 · FINALIZADA · Consumidor Final · 4 productos manual
  // Cobro: 100% efectivo · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-023",
    fecha: "2026-05-17",
    hora: "16:00",
    cliente: { tipo: "consumidor_final" },
    items: [
      {
        sku: "VNO-DVCAT-MALB",
        name: "DV Catena Malbec",
        quantity: 2,
        unitPrice: 97860,
        discount: 0,
        discountType: "percent",
        total: 195720,
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
        sku: "LICR-FIRB750",
        name: "Fireball 750 ml",
        quantity: 2,
        unitPrice: 26400,
        discount: 0,
        discountType: "percent",
        total: 52800,
        categoria: "Licores",
      },
      {
        sku: "RON-MALIBU",
        name: "Malibu",
        quantity: 1,
        unitPrice: 25550,
        discount: 0,
        discountType: "percent",
        total: 25550,
        categoria: "Ron",
      },
    ],
    subtotal: 328370,
    descuento: 0,
    descuentoTipo: "percent",
    total: 328370,
    entregaItems: [
      { sku: "VNO-DVCAT-MALB", quantityEntregada: 2 },
      { sku: "ESP-DOMES-BRNA", quantityEntregada: 2 },
      { sku: "LICR-FIRB750", quantityEntregada: 2 },
      { sku: "RON-MALIBU", quantityEntregada: 1 },
    ],
    entregaEntries: [
      {
        id: "VTA-023-ENT-1",
        fecha: "2026-05-17",
        hora: "16:05",
        items: [
          { sku: "VNO-DVCAT-MALB", quantity: 2 },
          { sku: "ESP-DOMES-BRNA", quantity: 2 },
          { sku: "LICR-FIRB750", quantity: 2 },
          { sku: "RON-MALIBU", quantity: 1 },
        ],
      },
    ],
    cobros: [
      { id: "COB-023-01", fecha: "2026-05-17", hora: "16:03", medioPago: "efectivo", monto: 328370 },
    ],
    estado: "finalizada",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-024 · EN CURSO · Dani Fiambre · 3 productos manual
  // Cobro: 100% posnet · Entrega: 0%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-024",
    fecha: "2026-05-19",
    hora: "10:45",
    cliente: { tipo: "cuenta", id: "CLI-007", nombre: "Dani Fiambre" },
    items: [
      {
        sku: "GIN-ACCGOR",
        name: "Aconcagua Original",
        quantity: 4,
        unitPrice: 18150,
        discount: 0,
        discountType: "percent",
        total: 72600,
        categoria: "Gin",
      },
      {
        sku: "GIN-MYRBOT",
        name: "Myrica Botánicos",
        quantity: 4,
        unitPrice: 21720,
        discount: 0,
        discountType: "percent",
        total: 86880,
        categoria: "Gin",
      },
      {
        sku: "GIN-RESTINGA-ORIG",
        name: "Restinga Original",
        quantity: 4,
        unitPrice: 19965,
        discount: 0,
        discountType: "percent",
        total: 79860,
        categoria: "Gin",
      },
    ],
    subtotal: 239340,
    descuento: 0,
    descuentoTipo: "percent",
    total: 239340,
    entregaItems: [],
    entregaEntries: [],
    cobros: [
      { id: "COB-024-01", fecha: "2026-05-19", hora: "10:48", medioPago: "posnet", monto: 239340 },
    ],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-025 · FINALIZADA · Vinoteca El Sabor SRL · 2 productos manual
  // Cobro: 100% transferencia · Entrega: 100% · factura emitida
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-025",
    fecha: "2026-05-21",
    hora: "14:00",
    cliente: { tipo: "cuenta", id: "CLI-004", nombre: "Vinoteca El Sabor SRL" },
    items: [
      {
        sku: "VNO-DVCAT-CABS",
        name: "DV Catena Cabernet Sauvignon",
        quantity: 6,
        unitPrice: 96090,
        discount: 5,
        discountType: "percent",
        total: 547713,
        categoria: "Vinos",
      },
      {
        sku: "VNO-PROGRES-SYGA-2012",
        name: "Proemio Grand Reserve Syrah Garnacha 2012",
        quantity: 6,
        unitPrice: 79860,
        discount: 5,
        discountType: "percent",
        total: 455202,
        categoria: "Vinos",
      },
    ],
    subtotal: 1002915,
    descuento: 0,
    descuentoTipo: "percent",
    envio: 7000,
    total: 1009915,
    entregaItems: [
      { sku: "VNO-DVCAT-CABS", quantityEntregada: 6 },
      { sku: "VNO-PROGRES-SYGA-2012", quantityEntregada: 6 },
    ],
    entregaEntries: [
      {
        id: "VTA-025-ENT-1",
        fecha: "2026-05-21",
        hora: "14:10",
        items: [
          { sku: "VNO-DVCAT-CABS", quantity: 6 },
          { sku: "VNO-PROGRES-SYGA-2012", quantity: 6 },
        ],
      },
    ],
    cobros: [
      { id: "COB-025-01", fecha: "2026-05-21", hora: "14:05", medioPago: "transferencia", monto: 1009915 },
    ],
    estado: "finalizada",
    facturaEmitida: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-026 · EN CURSO · María González · 2 productos manual
  // Cobro: 0% · Entrega: 0%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-026",
    fecha: "2026-05-23",
    hora: "18:00",
    cliente: { tipo: "cuenta", id: "CLI-002", nombre: "María González" },
    items: [
      {
        sku: "VDKA-ABSO-PEAR",
        name: "Absolut Pear",
        quantity: 3,
        unitPrice: 23595,
        discount: 0,
        discountType: "percent",
        total: 70785,
        categoria: "Vodka",
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
    ],
    subtotal: 114225,
    descuento: 0,
    descuentoTipo: "percent",
    total: 114225,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-027 · FINALIZADA · Consumidor Final · 3 productos desde presupuesto
  // Cobro: 100% posnet · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-027",
    fecha: "2026-05-26",
    hora: "12:00",
    cliente: { tipo: "consumidor_final" },
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
    subtotal: 217760,
    descuento: 0,
    descuentoTipo: "percent",
    total: 217760,
    entregaItems: [
      { sku: "TEQ-PATSLVR", quantityEntregada: 2 },
      { sku: "VDKA-CRCOR", quantityEntregada: 2 },
      { sku: "RON-MALIBU", quantityEntregada: 2 },
    ],
    entregaEntries: [
      {
        id: "VTA-027-ENT-1",
        fecha: "2026-05-26",
        hora: "12:05",
        items: [
          { sku: "TEQ-PATSLVR", quantity: 2 },
          { sku: "VDKA-CRCOR", quantity: 2 },
          { sku: "RON-MALIBU", quantity: 2 },
        ],
      },
    ],
    cobros: [
      { id: "COB-027-01", fecha: "2026-05-26", hora: "12:03", medioPago: "posnet", monto: 217760 },
    ],
    estado: "finalizada",
    origen: "presupuesto",
    presupuestoId: "PRE-008",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-028 · EN CURSO · Restaurant La Esquina · 3 productos manual
  // Cobro: 50% efectivo · Entrega: 100%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-028",
    fecha: "2026-05-29",
    hora: "10:00",
    cliente: { tipo: "cuenta", id: "CLI-006", nombre: "Restaurant La Esquina" },
    items: [
      {
        sku: "VNO-DOMESTE-CHRD",
        name: "Domiciano Estelar Chardonnay",
        quantity: 6,
        unitPrice: 29040,
        discount: 0,
        discountType: "percent",
        total: 174240,
        categoria: "Vinos",
      },
      {
        sku: "ESP-SALENT-BRRO",
        name: "Salentein Brut Rosé",
        quantity: 4,
        unitPrice: 41730,
        discount: 0,
        discountType: "percent",
        total: 166920,
        categoria: "Espumantes",
      },
      {
        sku: "LICR-JGRM700",
        name: "Jägermeister 700 ml",
        quantity: 2,
        unitPrice: 27615,
        discount: 0,
        discountType: "percent",
        total: 55230,
        categoria: "Licores",
      },
    ],
    subtotal: 396390,
    descuento: 0,
    descuentoTipo: "percent",
    total: 396390,
    entregaItems: [
      { sku: "VNO-DOMESTE-CHRD", quantityEntregada: 6 },
      { sku: "ESP-SALENT-BRRO", quantityEntregada: 4 },
      { sku: "LICR-JGRM700", quantityEntregada: 2 },
    ],
    entregaEntries: [
      {
        id: "VTA-028-ENT-1",
        fecha: "2026-05-29",
        hora: "10:10",
        items: [
          { sku: "VNO-DOMESTE-CHRD", quantity: 6 },
          { sku: "ESP-SALENT-BRRO", quantity: 4 },
          { sku: "LICR-JGRM700", quantity: 2 },
        ],
      },
    ],
    cobros: [
      { id: "COB-028-01", fecha: "2026-05-29", hora: "10:05", medioPago: "efectivo", monto: 198195 },
    ],
    estado: "en_curso",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-029 · FINALIZADA · Distribuidora Norte S.A. · 3 productos manual
  // Cobro: 100% transferencia · Entrega: 100% · factura emitida
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-029",
    fecha: "2026-06-02",
    hora: "09:15",
    cliente: { tipo: "cuenta", id: "CLI-003", nombre: "Distribuidora Norte S.A." },
    items: [
      {
        sku: "VNO-PROGRES-MALB-2012",
        name: "Proemio Grand Reserve Malbec 2012",
        quantity: 6,
        unitPrice: 81675,
        discount: 10,
        discountType: "percent",
        total: 441045,
        categoria: "Vinos",
      },
      {
        sku: "VNO-PROGRES-SYGA-2012",
        name: "Proemio Grand Reserve Syrah Garnacha 2012",
        quantity: 6,
        unitPrice: 79860,
        discount: 10,
        discountType: "percent",
        total: 431244,
        categoria: "Vinos",
      },
      {
        sku: "ESP-NAVCOR-EXBR",
        name: "Navarro Correas Extra Brut",
        quantity: 6,
        unitPrice: 27150,
        discount: 5,
        discountType: "percent",
        total: 154755,
        categoria: "Espumantes",
      },
    ],
    subtotal: 1027044,
    descuento: 0,
    descuentoTipo: "percent",
    envio: 8500,
    total: 1035544,
    entregaItems: [
      { sku: "VNO-PROGRES-MALB-2012", quantityEntregada: 6 },
      { sku: "VNO-PROGRES-SYGA-2012", quantityEntregada: 6 },
      { sku: "ESP-NAVCOR-EXBR", quantityEntregada: 6 },
    ],
    entregaEntries: [
      {
        id: "VTA-029-ENT-1",
        fecha: "2026-06-02",
        hora: "09:20",
        items: [
          { sku: "VNO-PROGRES-MALB-2012", quantity: 6 },
          { sku: "VNO-PROGRES-SYGA-2012", quantity: 6 },
          { sku: "ESP-NAVCOR-EXBR", quantity: 6 },
        ],
      },
    ],
    cobros: [
      { id: "COB-029-01", fecha: "2026-06-02", hora: "09:22", medioPago: "transferencia", monto: 1035544 },
    ],
    estado: "finalizada",
    facturaEmitida: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VTA-030 · EN CURSO · Valentina Gómez · 3 productos manual
  // Cobro: 0% · Entrega: 0%
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "VTA-030",
    fecha: "2026-06-04",
    hora: "15:30",
    cliente: { tipo: "cuenta", id: "CLI-012", nombre: "Valentina Gómez" },
    items: [
      {
        sku: "VNO-DOMGRES-BLND",
        name: "Domiciano Gran Reserva Blend",
        quantity: 3,
        unitPrice: 32580,
        discount: 0,
        discountType: "percent",
        total: 97740,
        categoria: "Vinos",
      },
      {
        sku: "ESP-SALENT-EXBR",
        name: "Salentein Extra Brut",
        quantity: 3,
        unitPrice: 39930,
        discount: 0,
        discountType: "percent",
        total: 119790,
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
    ],
    subtotal: 260970,
    descuento: 0,
    descuentoTipo: "percent",
    total: 260970,
    entregaItems: [],
    entregaEntries: [],
    cobros: [],
    estado: "en_curso",
  },
]
