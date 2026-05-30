import type { OrdenDeCompra } from "@/lib/types"

export const ORDENES_DE_COMPRA: OrdenDeCompra[] = [
  // 1 — aceptada — Proemio Wines
  {
    id: "ODC-1",
    numero: 1,
    fechaCreacion: "2026-03-04T09:12:00.000Z",
    proveedorId: "PROV-005",
    proveedorNombre: "Proemio Wines",
    estado: "aceptada",
    items: [
      {
        sku: "VNO-PROGRES-MALB-2019",
        name: "Proemio Grand Reserve · Malbec · 2019",
        quantity: 48,
        unitPrice: 42000,
        total: 2016000,
        categoria: "Vinos",
        marca: "Proemio",
      },
      {
        sku: "VNO-PROGRES-CABS-2012",
        name: "Proemio Grand Reserve · Cabernet Sauvignon · 2012",
        quantity: 24,
        unitPrice: 48000,
        total: 1152000,
        categoria: "Vinos",
        marca: "Proemio",
      },
      {
        sku: "VNO-PROGRES-SYGA-2019",
        name: "Proemio Grand Reserve · Syrah Garnacha · 2019",
        quantity: 12,
        unitPrice: 43000,
        total: 516000,
        categoria: "Vinos",
        marca: "Proemio",
      },
    ],
    importeEstimado: 3684000,
  },

  // 2 — aceptada — Catena Zapata
  {
    id: "ODC-2",
    numero: 2,
    fechaCreacion: "2026-03-11T11:30:00.000Z",
    proveedorId: "PROV-007",
    proveedorNombre: "Catena Zapata",
    estado: "aceptada",
    items: [
      {
        sku: "VNO-DVCAT-MALB",
        name: "DV Catena · Malbec",
        quantity: 36,
        unitPrice: 54000,
        total: 1944000,
        categoria: "Vinos",
        marca: "Catena Zapata",
      },
      {
        sku: "VNO-DVCAT-CABS",
        name: "DV Catena · Cabernet Sauvignon",
        quantity: 24,
        unitPrice: 53000,
        total: 1272000,
        categoria: "Vinos",
        marca: "Catena Zapata",
      },
    ],
    importeEstimado: 3216000,
  },

  // 3 — aceptada — Bodega Domiciano
  {
    id: "ODC-3",
    numero: 3,
    fechaCreacion: "2026-03-20T14:05:00.000Z",
    proveedorId: "PROV-011",
    proveedorNombre: "Bodega Domiciano",
    estado: "aceptada",
    items: [
      {
        sku: "VNO-DOMGRES-BLND",
        name: "Domiciano Gran Reserva Blend",
        quantity: 30,
        unitPrice: 32000,
        total: 960000,
        categoria: "Vinos",
        marca: "Domiciano",
      },
      {
        sku: "ESP-DOMES-BRNA",
        name: "Domiciano Estelar Brut Nature",
        quantity: 24,
        unitPrice: 15000,
        total: 360000,
        categoria: "Espumantes",
        marca: "Domiciano",
      },
      {
        sku: "LICR-DOMIMST",
        name: "Domiciano Mistela",
        quantity: 18,
        unitPrice: 12000,
        total: 216000,
        categoria: "Licores",
        marca: "Domiciano",
      },
    ],
    importeEstimado: 1536000,
  },

  // 4 — aceptada — Bodegas Salentein
  {
    id: "ODC-4",
    numero: 4,
    fechaCreacion: "2026-04-02T08:20:00.000Z",
    proveedorId: "PROV-012",
    proveedorNombre: "Bodegas Salentein",
    estado: "aceptada",
    items: [
      {
        sku: "ESP-SALENT-EXBR",
        name: "Salentein · Extra Brut",
        quantity: 48,
        unitPrice: 22000,
        total: 1056000,
        categoria: "Espumantes",
        marca: "Salentein",
      },
      {
        sku: "ESP-SALENT-BRNA",
        name: "Salentein · Brut Nature",
        quantity: 36,
        unitPrice: 22000,
        total: 792000,
        categoria: "Espumantes",
        marca: "Salentein",
      },
      {
        sku: "ESP-SALENT-BRRO",
        name: "Salentein · Brut Rosé",
        quantity: 24,
        unitPrice: 24000,
        total: 576000,
        categoria: "Espumantes",
        marca: "Salentein",
      },
    ],
    importeEstimado: 2424000,
  },

  // 5 — aceptada — Chañarmuyo Bodega
  {
    id: "ODC-5",
    numero: 5,
    fechaCreacion: "2026-04-10T16:55:00.000Z",
    proveedorId: "PROV-009",
    proveedorNombre: "Chañarmuyo Bodega",
    estado: "aceptada",
    items: [
      {
        sku: "VNO-CHM5HIL-BLND",
        name: "Chañarmuyo 5 Hileras Blend",
        quantity: 60,
        unitPrice: 18000,
        total: 1080000,
        categoria: "Vinos",
        marca: "Chañarmuyo",
      },
    ],
    importeEstimado: 1080000,
  },

  // 6 — rechazada — Diageo
  {
    id: "ODC-6",
    numero: 6,
    fechaCreacion: "2026-04-15T15:33:00.000Z",
    proveedorId: "PROV-020",
    proveedorNombre: "Diageo",
    estado: "rechazada",
    items: [
      {
        sku: "DEST-JOHNWALKER-BLK",
        name: "Johnnie Walker Black Label",
        quantity: 24,
        unitPrice: 85000,
        total: 2040000,
        categoria: "Whiskies",
        marca: "Johnnie Walker",
      },
      {
        sku: "DEST-TANQUERAY-750",
        name: "Tanqueray London Dry Gin",
        quantity: 18,
        unitPrice: 62000,
        total: 1116000,
        categoria: "Gin",
        marca: "Tanqueray",
      },
    ],
    importeEstimado: 3156000,
  },

  // 7 — rechazada — Pernod Ricard
  {
    id: "ODC-7",
    numero: 7,
    fechaCreacion: "2026-04-22T13:10:00.000Z",
    proveedorId: "PROV-023",
    proveedorNombre: "Pernod Ricard",
    estado: "rechazada",
    items: [
      {
        sku: "DEST-CHIVAS-12",
        name: "Chivas Regal 12 Years",
        quantity: 18,
        unitPrice: 92000,
        total: 1656000,
        categoria: "Whiskies",
        marca: "Chivas Regal",
      },
      {
        sku: "GIN-BEEFEATER-750",
        name: "Beefeater London Dry Gin",
        quantity: 24,
        unitPrice: 48000,
        total: 1152000,
        categoria: "Gin",
        marca: "Beefeater",
      },
    ],
    importeEstimado: 2808000,
  },

  // 8 — borrador — Bacardi
  {
    id: "ODC-8",
    numero: 8,
    fechaCreacion: "2026-05-06T16:45:00.000Z",
    proveedorId: "PROV-015",
    proveedorNombre: "Bacardi",
    estado: "borrador",
    items: [
      {
        sku: "RON-BACARDI-BLK-750",
        name: "Bacardi Black",
        quantity: 30,
        unitPrice: 38000,
        total: 1140000,
        categoria: "Rones",
        marca: "Bacardi",
      },
      {
        sku: "RON-BACARDI-WHT-750",
        name: "Bacardi Superior",
        quantity: 30,
        unitPrice: 32000,
        total: 960000,
        categoria: "Rones",
        marca: "Bacardi",
      },
    ],
    importeEstimado: 2100000,
  },

  // 9 — borrador — Bodega Navarro Correas
  {
    id: "ODC-9",
    numero: 9,
    fechaCreacion: "2026-05-14T10:02:00.000Z",
    proveedorId: "PROV-013",
    proveedorNombre: "Bodega Navarro Correas",
    estado: "borrador",
    items: [
      {
        sku: "VNO-NAVCOR-MALB",
        name: "Navarro Correas Colección Privada Malbec",
        quantity: 36,
        unitPrice: 28000,
        total: 1008000,
        categoria: "Vinos",
        marca: "Navarro Correas",
      },
    ],
    importeEstimado: 1008000,
  },

  // 10 — borrador — Proemio Wines (reposición)
  {
    id: "ODC-10",
    numero: 10,
    fechaCreacion: "2026-05-21T09:55:00.000Z",
    proveedorId: "PROV-005",
    proveedorNombre: "Proemio Wines",
    estado: "borrador",
    items: [
      {
        sku: "VNO-PROGRES-MALB-2012",
        name: "Proemio Grand Reserve · Malbec · 2012",
        quantity: 60,
        unitPrice: 45000,
        total: 2700000,
        categoria: "Vinos",
        marca: "Proemio",
      },
      {
        sku: "VNO-PROGRES-CABS-2019",
        name: "Proemio Grand Reserve · Cabernet Sauvignon · 2019",
        quantity: 24,
        unitPrice: 46000,
        total: 1104000,
        categoria: "Vinos",
        marca: "Proemio",
      },
    ],
    importeEstimado: 3804000,
  },
]
