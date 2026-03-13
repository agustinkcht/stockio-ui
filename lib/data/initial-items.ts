import type { Item } from "../types"

export const INITIAL_ITEMS: Item[] = [
  {
    name: "Proemio Grand Reserve",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-PROGRES",
    marca: "Proemio",
    proveedor: "Proemio Wines",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Matrix: Varietal × Año
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon", "Syrah Garnacha"] },
      { key: "Año", variantes: ["2012", "2019"] },
    ],

    // Parent-level info (shared across all variants)
    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Perfil Sensorial", value: "" }, // filled per variant
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // filled per variant
    ],

    variantCount: 6,
    variants: [
      // --- MALBEC ---
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-MALB-2012",
        codigoUniversal: "7798123400013",
        codigoProveedor: "PROE-GR-MALB-2012",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2012" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja madura, especias y notas de chocolate" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
        ],
        stock: { total: "60", reservado: "12", disponible: "48" },
        precio: { costo: 45000, margen: 50, iva: 21, precioFinal: 81675 },
      },
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-MALB-2019",
        codigoUniversal: "7798123400020",
        codigoProveedor: "PROE-GR-MALB-2019",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja fresca, cassis y vainilla suave" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
        ],
        stock: { total: "54", reservado: "10", disponible: "44" },
        precio: { costo: 42000, margen: 50, iva: 21, precioFinal: 76230 },
      },

      // --- CABERNET SAUVIGNON ---
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-CABS-2012",
        codigoUniversal: "7798123400037",
        codigoProveedor: "PROE-GR-CABS-2012",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2012" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra, especias y notas ahumadas de barrica" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
        ],
        stock: { total: "48", reservado: "9", disponible: "39" },
        precio: { costo: 48000, margen: 50, iva: 21, precioFinal: 87120 },
      },
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-CABS-2019",
        codigoUniversal: "7798123400044",
        codigoProveedor: "PROE-GR-CABS-2019",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Cassis, pimienta negra y cacao suave" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
        ],
        stock: { total: "42", reservado: "8", disponible: "34" },
        precio: { costo: 46000, margen: 50, iva: 21, precioFinal: 83490 },
      },

      // --- SYRAH GARNACHA ---
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-SYGA-2012",
        codigoUniversal: "7798123400051",
        codigoProveedor: "PROE-GR-SYGA-2012",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Syrah Garnacha" },
          { key: "Año", value: "2012" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra madura, pimienta y notas tostadas" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
        ],
        stock: { total: "36", reservado: "6", disponible: "30" },
        precio: { costo: 44000, margen: 50, iva: 21, precioFinal: 79860 },
      },
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-SYGA-2019",
        codigoUniversal: "7798123400068",
        codigoProveedor: "PROE-GR-SYGA-2019",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Syrah Garnacha" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra, especias dulces y chocolate amargo" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
        ],
        stock: { total: "32", reservado: "5", disponible: "27" },
        precio: { costo: 43000, margen: 50, iva: 21, precioFinal: 78045 },
      },
    ],
  },
  {
    name: "DV Catena",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-DVCAT",
    marca: "Catena Zapata",
    proveedor: "Catena Zapata",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Perfil Sensorial", value: "" }, // filled per variant
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant (e.g., oak aging)
    ],

    variantCount: 2,
    variants: [

      // --- malbec ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB",
        codigoUniversal: "7799002000214",
        codigoProveedor: "DVCAT-MALB",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Intenso rojo oscuro con notas florales y especiadas" },
          { key: "Crianza", value: "18 meses en barrica" },
        ],
        stock: { total: "38", reservado: "6", disponible: "32" },
        precio: { costo: 54000, margen: 50, iva: 21, precioFinal: 97860 },
      },

      // --- 2022 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-CABS",
        codigoUniversal: "7799002000221",
        codigoProveedor: "DVCAT-CABS",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta madura, taninos suaves y notas de vainilla" },
          { key: "Crianza", value: "18 meses en barrica" },
        ],
        stock: { total: "46", reservado: "9", disponible: "37" },
        precio: { costo: 53000, margen: 50, iva: 21, precioFinal: 96090 },
      },
    ],
  },
  
  {
    name: "Chañarmuyo 5 Hileras",
    categoria: "Vinos",
    hasVariants: false,
    isAgrupador: false,
    sku: "VNO-CHM5HIL",
    codigoUniversal: "7799002000001", // generated
    marca: "Chañarmuyo",
    proveedor: "Chañarmuyo Bodega",
    codigoProveedor: "CHM-5HIL-BLND",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    stock: { total: "18", reservado: "2", disponible: "16" },
    atributosPrincipales: [
      { key: "Varietal", value: "Blend" },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Perfil Sensorial", value: "Fruta roja madura, taninos redondos y notas tostadas" },
      { key: "Origen", value: "Valle de Chañarmuyo, La Rioja" },
      { key: "Crianza", value: "24 meses en barrica" },
      { key: "Maridaje", value: "Asados y guisos intensos" },
    ],
    precio: { costo: 18000, margen: 50, iva: 21, precioFinal: 32580 },
  },
  {
    name: "Domiciano Gran Reserva",
    categoria: "Vinos",
    hasVariants: false,
    isAgrupador: false,
    sku: "VNO-DOMGRES-BLND-2022",
    codigoUniversal: "7798123401012",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    codigoProveedor: "DOM-GRES-BLND-2022",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    stock: {
      total: "36",
      reservado: "4",
      disponible: "32",
    },
    atributosPrincipales: [
      { key: "Varietal", value: "Blend" },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Perfil Sensorial", value: "Cerezas y ciruelas maduras, con café, cacao y tabaco" },
      { key: "Origen", value: "Barrancas, Maipú, Mendoza, Argentina" },
      { key: "Crianza", value: "12 meses en barricas (2do y 3er uso)" },
      { key: "Maridaje", value: "Carnes rojas, parrilla, pastas con salsas intensas" },
    ],
    precio: { costo: 18000, margen: 50, iva: 21, precioFinal: 32580 },
  },
  {
    name: "Domiciano Estelar",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-DOMESTE",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Matrix: Varietal × Año
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Blend", "Malbec", "Blanco Dulce", "Chardonnay"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "" }, // per variant
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Origen", value: "Maipú, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant / no especificado
      { key: "Maridaje", value: "" }, // per variant
    ],

    variantCount: 4,
    variants: [
      // Blend (Malbec - Syrah)
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-BLND",
        codigoUniversal: "7799002000042",
        codigoProveedor: "DOM-EST-BLND-MS",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Blend" },
        ],
        atributosInformativos: [
          { key: "Características del Blend", value: "Malbec - Syrah" },
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Mora y ciruela, pimienta; cacao y ahumado sutil" },
          { key: "Maridaje", value: "Sandwich de ojo de bife y provolone" },
        ],
        stock: { total: "28", reservado: "4", disponible: "24" },
        precio: { costo: 15000, margen: 50, iva: 21, precioFinal: 27150 },
      },

      // Malbec
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-MALB",
        codigoUniversal: "7799002000059",
        codigoProveedor: "DOM-EST-MALB",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta madura, roble sutil, vainilla y especias" },
          { key: "Maridaje", value: "Pastas rellenas con bolognesa" },
        ],
        stock: { total: "34", reservado: "5", disponible: "29" },
        precio: { costo: 14000, margen: 50, iva: 21, precioFinal: 25410 },
      },

      // Blanco Dulce
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-BLDL",
        codigoUniversal: "7799002000066",
        codigoProveedor: "DOM-EST-BLDL",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Blanco Dulce" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Jazmín y azahar, mango y durazno; final mielado" },
          { key: "Maridaje", value: "Cheesecake o crème brûlée" },
        ],
        stock: { total: "20", reservado: "3", disponible: "17" },
        precio: { costo: 15000, margen: 50, iva: 21, precioFinal: 27150 },
      },

      // Chardonnay
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-CHRD",
        codigoUniversal: "7799002000080",
        codigoProveedor: "DOM-EST-CHRD",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Tropical (piña/banana), cítricos; acidez filosa" },
          { key: "Maridaje", value: "A elección (estilo relaxed)" },
        ],
        stock: { total: "26", reservado: "4", disponible: "22" },
        precio: { costo: 16000, margen: 50, iva: 21, precioFinal: 29040 },
      },
    ],
  },
  {
    name: "Domiciano Estelar",
    categoria: "Espumantes",
    hasVariants: false,
    isAgrupador: false,
    sku: "ESP-DOMES-DLNA",
    codigoUniversal: "7798123490329",
    codigoProveedor: "DOM-EST-DN-750",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: {
      total: "18",
      reservado: "2",
      disponible: "16",
    },

    atributosPrincipales: [{ key: "Dosaje", value: "Dulce Natural" }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Estelar" },
      { key: "Perfil Sensorial", value: "Dulce, frutado y floral, con burbuja suave" },
      { key: "Bodega", value: "Bodega Domiciano" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "Método Charmat" },
      { key: "Enólogo", value: "Equipo Enológico Domiciano" },
      { key: "ABV", value: "11%" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "Postres, quesos suaves, frutas" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 15000, margen: 50, iva: 21, precioFinal: 27150 },
  },
  {
    name: "Domiciano Mistela",
    categoria: "Licores",
    hasVariants: false,
    isAgrupador: false,
    sku: "LICR-DOMMIS-MOST",
    codigoUniversal: "7798123490305",
    codigoProveedor: "DOM-MIST-750",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: {
      total: "24",
      reservado: "2",
      disponible: "22",
    },

    atributosPrincipales: [{ key: "Sabor", value: "Dulce" }],

    atributosInformativos: [
      { key: "Tipo de Licor", value: "Espirituoso a base de mosto de uva" },
      { key: "Varietal", value: "Blend" },
      {
        key: "Características del Blend",
        value: "Moscatel - Torrontés",
      },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "ABV", value: "15%" },
      { key: "Temperatura de Servicio", value: "8–10°C" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 12000, margen: 50, iva: 21, precioFinal: 21720 },
  },

  // --- SALENTEIN (agrupador por dosaje) ---
  {
    name: "Salentein",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-SALENT",
    marca: "Salentein",
    proveedor: "Bodega Salentein",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Extra Brut", "Brut Nature", "Brut Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "" }, // varía por hijo cuando aplica
      { key: "Línea", value: "Espumantes" },
      { key: "Perfil Sensorial", value: "" }, // por hijo
      { key: "Bodega", value: "Bodega Salentein" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // por hijo cuando aplica
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "" }, // por hijo cuando aplica
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // por hijo
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Salentein",
        sku: "ESP-SALENT-EXBR",
        codigoUniversal: "7798123401027",
        codigoProveedor: "SAL-ESP-EXBR-750",
        categoria: "Espumantes",
        marca: "Salentein",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Chardonnay 65% - Pinot Noir 35%" },
          { key: "Perfil Sensorial", value: "Cítrico y frutal, con notas de pan tostado" },
          { key: "Crianza", value: "6 meses sobre lías (sur lie)" },
          { key: "ABV", value: "" },
          { key: "Maridaje", value: "Aperitivos, mariscos, sushi" },
        ],
        stock: { total: "24", reservado: "3", disponible: "21" },
        precio: { costo: 22000, margen: 50, iva: 21, precioFinal: 39930 },
      },
      {
        name: "Salentein",
        sku: "ESP-SALENT-BRNA",
        codigoUniversal: "7798123401034",
        codigoProveedor: "SAL-ESP-BRNA-750",
        categoria: "Espumantes",
        marca: "Salentein",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Varietal", value: "" },
          { key: "Perfil Sensorial", value: "Amplio y untuoso, con notas a pan tostado" },
          { key: "Crianza", value: "" },
          { key: "ABV", value: "" },
          { key: "Maridaje", value: "Mariscos, quesos suaves, aperitivos" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
        precio: { costo: 24000, margen: 50, iva: 21, precioFinal: 43560 },
      },
      {
        name: "Salentein",
        sku: "ESP-SALENT-BRRO",
        codigoUniversal: "7798123401041",
        codigoProveedor: "SAL-ESP-BRRO-750",
        categoria: "Espumantes",
        marca: "Salentein",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Pinot Noir" },
          { key: "Perfil Sensorial", value: "Frutas rojas y frescura marcada" },
          { key: "Crianza", value: "" },
          { key: "ABV", value: "12.5%" },
          { key: "Maridaje", value: "Salmón, sushi, tapas" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
        precio: { costo: 23000, margen: 50, iva: 21, precioFinal: 41730 },
      },
    ],
  },
  {
    name: "Navarro Correas",
    categoria: "Espumantes",
    hasVariants: false,
    isAgrupador: false,
    sku: "ESP-NAVCOR-EXBR",
    codigoUniversal: "7798123401010",
    marca: "Navarro Correas",
    proveedor: "Bodega Navarro Correas",
    codigoProveedor: "NC-ESP-EXBR-750",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "30", reservado: "4", disponible: "26" },

    atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],

    atributosInformativos: [
      { key: "Varietal", value: "Chardonnay 80% - Pinot Noir 20%" },
      { key: "Línea", value: "Extra Brut" },
      { key: "Perfil Sensorial", value: "Fresco, cítrico y frutal, con burbuja fina" },
      { key: "Bodega", value: "Bodega Navarro Correas" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" },
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "13%" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "Aperitivos, mariscos, sushi" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 15000, margen: 50, iva: 21, precioFinal: 27150 },
  },
  {
    name: "Bombay Sapphire",
    categoria: "Gin",
    hasVariants: false,
    isAgrupador: false,
    sku: "GIN-BOMBAY-ORIG",
    codigoUniversal: "7640175740373",
    marca: "Bombay Sapphire",
    proveedor: "Bacardi",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "30", reservado: "4", disponible: "26" },

    atributosPrincipales: [{ key: "Sabor", value: "Botánicos" }],
    atributosInformativos: [
      { key: "Estilo", value: "London Dry" },
      { key: "Origen", value: "Reino Unido" },
      { key: "ABV", value: "47%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 16000, margen: 50, iva: 21, precioFinal: 29040 },
  },

  {
    name: "Myrica",
    categoria: "Gin",
    hasVariants: false,
    isAgrupador: false,
    sku: "GIN-MYRICA-ORIG",
    codigoUniversal: "7799988776655",
    marca: "Myrica",
    proveedor: "Destilería Myrica",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",

    stock: { total: "14", reservado: "1", disponible: "13" },

    atributosPrincipales: [{ key: "Sabor", value: "Botánicos" }],
    atributosInformativos: [
      { key: "Estilo", value: "Artesanal" },
      { key: "Origen", value: "Argentina" },
      { key: "ABV", value: "41%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 12000, margen: 50, iva: 21, precioFinal: 21720 },
  },

  // =====================
  // RESTINGA (AGRUPADOR)
  // =====================
  {
    name: "Restinga",
    categoria: "Gin",
    hasVariants: true,
    isAgrupador: true,
    sku: "GIN-RESTINGA",
    marca: "Restinga",
    proveedor: "Destilería Restinga",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Sabor", variantes: ["Original", "Destilado Otoño", "Flavoured Edition"] }],

    atributosInformativos: [
      { key: "Estilo", value: "Artesanal" },
      { key: "Origen", value: "Argentina" },
      { key: "ABV", value: "42%" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Restinga",
        sku: "GIN-REST-ORIG",
        codigoUniversal: "7798123456789",
        categoria: "Gin",
        marca: "Restinga",
        atributosPrincipales: [{ key: "Sabor", value: "Original" }],
        atributosInformativos: [],
        stock: { total: "18", reservado: "2", disponible: "16" },
        precio: { costo: 11000, margen: 50, iva: 21, precioFinal: 19965 },
      },
      {
        name: "Restinga",
        sku: "GIN-REST-OTON",
        codigoUniversal: "7798123456796",
        categoria: "Gin",
        marca: "Restinga",
        atributosPrincipales: [{ key: "Sabor", value: "Destilado Otoño" }],
        atributosInformativos: [],
        stock: { total: "14", reservado: "2", disponible: "12" },
        precio: { costo: 12000, margen: 50, iva: 21, precioFinal: 21720 },
      },
      {
        name: "Restinga",
        sku: "GIN-REST-FLAV",
        codigoUniversal: "7798123456802",
        categoria: "Gin",
        marca: "Restinga",
        atributosPrincipales: [{ key: "Sabor", value: "Flavoured Edition" }],
        atributosInformativos: [],
        stock: { total: "12", reservado: "1", disponible: "11" },
        precio: { costo: 13000, margen: 50, iva: 21, precioFinal: 23595 },
      },
    ],
  },

  // =====================
  // ACONCAGUA (STANDALONE)
  // =====================
  {
    name: "Aconcagua",
    categoria: "Gin",
    hasVariants: false,
    isAgrupador: false,
    sku: "GIN-ACONCAG-ORIG",
    codigoUniversal: "7798765432109",
    marca: "Aconcagua",
    proveedor: "Destilería Andina",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",

    stock: { total: "16", reservado: "2", disponible: "14" },

    atributosPrincipales: [{ key: "Sabor", value: "Original" }],
    atributosInformativos: [
      { key: "Estilo", value: "London Dry" },
      { key: "Origen", value: "Argentina" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 10000, margen: 50, iva: 21, precioFinal: 18150 },
  },
  {
    name: "Absolut",
    categoria: "Vodka",
    hasVariants: true,
    isAgrupador: true,
    sku: "VDKA-ABSO",
    marca: "Absolut",
    proveedor: "The Absolut Company",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Sabor", variantes: ["Original", "Raspberry", "Pear", "Vanilla"] }],

    atributosInformativos: [
      { key: "Estilo", value: "Vodka premium" },
      { key: "Origen", value: "Suecia" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 4,
    variants: [
      {
        name: "Absolut",
        sku: "VDKA-ABSO-ORIG",
        codigoUniversal: "7312040017014",
        codigoProveedor: "ABS-ORG-750",
        categoria: "Vodka",
        marca: "Absolut",
        atributosPrincipales: [{ key: "Sabor", value: "Original" }],
        atributosInformativos: [],
        stock: { total: "48", reservado: "6", disponible: "42" },
        precio: { costo: 12000, margen: 50, iva: 21, precioFinal: 21720 },
      },
      {
        name: "Absolut",
        sku: "VDKA-ABSO-RASP",
        codigoUniversal: "7312040030754",
        codigoProveedor: "ABS-RASP-750",
        categoria: "Vodka",
        marca: "Absolut",
        atributosPrincipales: [{ key: "Sabor", value: "Raspberry" }],
        atributosInformativos: [],
        stock: { total: "36", reservado: "4", disponible: "32" },
        precio: { costo: 13000, margen: 50, iva: 21, precioFinal: 23595 },
      },
      {
        name: "Absolut",
        sku: "VDKA-ABSO-PEAR",
        codigoUniversal: "7312040030778",
        codigoProveedor: "ABS-PEAR-750",
        categoria: "Vodka",
        marca: "Absolut",
        atributosPrincipales: [{ key: "Sabor", value: "Pear" }],
        atributosInformativos: [],
        stock: { total: "30", reservado: "3", disponible: "27" },
        precio: { costo: 13000, margen: 50, iva: 21, precioFinal: 23595 },
      },
      {
        name: "Absolut",
        sku: "VDKA-ABSO-VANI",
        codigoUniversal: "7312040030761",
        codigoProveedor: "ABS-VANI-750",
        categoria: "Vodka",
        marca: "Absolut",
        atributosPrincipales: [{ key: "Sabor", value: "Vanilla" }],
        atributosInformativos: [],
        stock: { total: "28", reservado: "3", disponible: "25" },
        precio: { costo: 13000, margen: 50, iva: 21, precioFinal: 23595 },
      },
    ],
  },
  {
    name: "Cîroc",
    categoria: "Vodka",
    hasVariants: false,
    isAgrupador: false,
    sku: "VDKA-CIRO-ORIG",
    codigoUniversal: "088076168505",
    codigoProveedor: "CIROC-FR-750",
    marca: "Cîroc",
    proveedor: "Diageo",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "20", reservado: "2", disponible: "18" },

    atributosPrincipales: [{ key: "Sabor", value: "Original" }],

    atributosInformativos: [
      { key: "Origen", value: "Francia" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 20000, margen: 50, iva: 21, precioFinal: 36300 },
  },
  // --- RON: MALIBU (STANDALONE) ---
  {
    name: "Malibu",
    categoria: "Ron",
    hasVariants: false,
    isAgrupador: false,
    sku: "RON-MALIBU-COCO",
    codigoUniversal: "7799002001201",
    marca: "Malibu",
    proveedor: "Pernod Ricard",
    codigoProveedor: "MAL-COC-750",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "28", reservado: "4", disponible: "24" },

    atributosPrincipales: [{ key: "Tipo", value: "Saborizado" }],
    atributosInformativos: [
      { key: "Origen", value: "Barbados" },
      { key: "Añejamiento", value: "No aplica" },
      { key: "ABV", value: "21%" },
      { key: "Estuche", value: "Sin estuche" },

      // Extra (pedido específico)
      { key: "Sabor", value: "Coco" },
    ],
    precio: { costo: 14000, margen: 50, iva: 21, precioFinal: 25550 },
  },

  // --- TEQUILA: PATRÓN SILVER (STANDALONE) ---
  {
    name: "Patrón Silver",
    categoria: "Tequila",
    hasVariants: false,
    isAgrupador: false,
    sku: "TEQ-PATRON-SILV",
    codigoUniversal: "7799002001401",
    marca: "Patrón",
    proveedor: "Bacardi",
    codigoProveedor: "PAT-SIL-750",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "12", reservado: "2", disponible: "10" },

    atributosPrincipales: [{ key: "Tipo", value: "Silver" }],
    atributosInformativos: [
      { key: "Origen", value: "México" },
      { key: "Añejamiento", value: "Sin añejamiento" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 26000, margen: 50, iva: 21, precioFinal: 47030 },
  },
  {
    name: "Johnnie Walker 750 ml",
    categoria: "Whiskies",
    hasVariants: true,
    isAgrupador: true,
    sku: "WHKY-JW750",
    marca: "Johnnie Walker",
    proveedor: "Diageo",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Línea", variantes: ["Red Label", "Black Label", "Double Black", "Blue Label"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Whisky", value: "Scotch" },
      { key: "Método de Elaboración", value: "Blended" },
      { key: "Origen", value: "Escocia" },
      { key: "Añejamiento", value: "" },
      { key: "Tipo de Barrica", value: "Roble" },
      { key: "ABV", value: "" },
      { key: "Estuche", value: "" },
    ],

    variantCount: 4,
    variants: [
      {
        name: "Johnnie Walker 750 ml",
        sku: "WHKY-JW750-RED",
        codigoUniversal: "5000267011011",
        codigoProveedor: "JW-RED-750",
        categoria: "Whiskies",
        marca: "Johnnie Walker",
        atributosPrincipales: [{ key: "Línea", value: "Red Label" }],
        atributosInformativos: [
          { key: "Añejamiento", value: "Sin declaración de edad" },
          { key: "ABV", value: "40%" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "48", reservado: "6", disponible: "42" },
        precio: { costo: 20000, margen: 60, iva: 21, precioFinal: 37800 },
      },
      {
        name: "Johnnie Walker 750 ml",
        sku: "WHKY-JW750-BLACK",
        codigoUniversal: "5000267024233",
        codigoProveedor: "JW-BLACK-750",
        categoria: "Whiskies",
        marca: "Johnnie Walker",
        atributosPrincipales: [{ key: "Línea", value: "Black Label" }],
        atributosInformativos: [
          { key: "Añejamiento", value: "12 años" },
          { key: "ABV", value: "40%" },
          { key: "Estuche", value: "Caja" },
        ],
        stock: { total: "36", reservado: "4", disponible: "32" },
        precio: { costo: 28000, margen: 55, iva: 21, precioFinal: 52500 },
      },
      {
        name: "Johnnie Walker 750 ml",
        sku: "WHKY-JW750-DBLK",
        codigoUniversal: "5000267092843",
        codigoProveedor: "JW-DBLACK-750",
        categoria: "Whiskies",
        marca: "Johnnie Walker",
        atributosPrincipales: [{ key: "Línea", value: "Double Black" }],
        atributosInformativos: [
          { key: "Añejamiento", value: "Sin declaración de edad" },
          { key: "ABV", value: "40%" },
          { key: "Estuche", value: "Caja" },
        ],
        stock: { total: "24", reservado: "3", disponible: "21" },
        precio: { costo: 32000, margen: 55, iva: 21, precioFinal: 60000 },
      },
      {
        name: "Johnnie Walker 750 ml",
        sku: "WHKY-JW750-BLUE",
        codigoUniversal: "5000267014012",
        codigoProveedor: "JW-BLUE-750",
        categoria: "Whiskies",
        marca: "Johnnie Walker",
        atributosPrincipales: [{ key: "Línea", value: "Blue Label" }],
        atributosInformativos: [
          { key: "Añejamiento", value: "Selección de whiskies añejos" },
          { key: "ABV", value: "40%" },
          { key: "Estuche", value: "Estuche premium" },
        ],
        stock: { total: "12", reservado: "2", disponible: "10" },
        precio: { costo: 80000, margen: 40, iva: 21, precioFinal: 136500 },
      },
    ],
  },

  {
    name: "Jack Daniel’s Old No.7",
    categoria: "Whiskies",
    hasVariants: false,
    isAgrupador: false,
    sku: "WHKY-JD-OLD7",
    codigoUniversal: "5099873001338",
    marca: "Jack Daniel’s",
    proveedor: "Brown-Forman",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "40", reservado: "5", disponible: "35" },

    atributosPrincipales: [{ key: "Línea", value: "Old No.7" }],
    atributosInformativos: [
      { key: "Tipo de Whisky", value: "Tennessee" },
      { key: "Método de Elaboración", value: "Filtrado por carbón" },
      { key: "Origen", value: "Estados Unidos" },
      { key: "Añejamiento", value: "Sin declaración de edad" },
      { key: "Tipo de Barrica", value: "Roble americano" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 18000, margen: 60, iva: 21, precioFinal: 34020 },
  },

  {
    name: "Jameson Original",
    categoria: "Whiskies",
    hasVariants: false,
    isAgrupador: false,
    sku: "WHKY-JMS-ORIG",
    codigoUniversal: "5011007003005",
    marca: "Jameson",
    proveedor: "Pernod Ricard",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "34", reservado: "4", disponible: "30" },

    atributosPrincipales: [{ key: "Línea", value: "Original" }],
    atributosInformativos: [
      { key: "Tipo de Whisky", value: "Irish" },
      { key: "Método de Elaboración", value: "Triple destilado" },
      { key: "Origen", value: "Irlanda" },
      { key: "Añejamiento", value: "Mínimo 4 años" },
      { key: "Tipo de Barrica", value: "Bourbon & Jerez" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 19000, margen: 60, iva: 21, precioFinal: 35940 },
  },

  {
    name: "Jameson Black Barrel",
    categoria: "Whiskies",
    hasVariants: false,
    isAgrupador: false,
    sku: "WHKY-JMS-BBLK",
    codigoUniversal: "5011007024369",
    marca: "Jameson",
    proveedor: "Pernod Ricard",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "22", reservado: "3", disponible: "19" },

    atributosPrincipales: [{ key: "Línea", value: "Black Barrel" }],
    atributosInformativos: [
      { key: "Tipo de Whisky", value: "Irish" },
      { key: "Método de Elaboración", value: "Triple destilado" },
      { key: "Origen", value: "Irlanda" },
      { key: "Añejamiento", value: "Barricas doblemente tostadas" },
      { key: "Tipo de Barrica", value: "Roble americano" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Caja" },
    ],
    precio: { costo: 22000, margen: 55, iva: 21, precioFinal: 41250 },
  },
  // --- LICORES ---
  //LICORES
  {
    name: "Jägermeister 700 ml",
    categoria: "Licores",
    hasVariants: false,
    isAgrupador: false,
    sku: "LICR-JGRM700",
    codigoUniversal: "4067700013019",
    marca: "Jägermeister",
    proveedor: "Mast-Jägermeister SE",
    codigoProveedor: "MJ-DE-700-ORIG",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",
    stock: {
      total: "48",
      reservado: "6",
      disponible: "42",
    },
    atributosInformativos: [
      { key: "Tipo de Licor", value: "Licor herbal amargo" },
      { key: "Origen", value: "Alemania" },
      { key: "ABV", value: "35%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 14000, margen: 65, iva: 21, precioFinal: 27615 },
  },
  {
    name: "Sheridan's Original",
    categoria: "Licores",
    hasVariants: false,
    isAgrupador: false,
    sku: "LICR-SHEROR",
    codigoUniversal: "5060049029993",
    marca: "Sheridan's",
    proveedor: "Diageo",
    codigoProveedor: "DIA-SHEROR",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",
    stock: {
      total: "36",
      reservado: "5",
      disponible: "31",
    },
    atributosInformativos: [
      { key: "Tipo de Licor", value: "Licor de crema y café" },
      { key: "Origen", value: "Irlanda" },
      { key: "ABV", value: "15.5%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 16000, margen: 60, iva: 21, precioFinal: 30240 },
  },

  // FIREBALL
  {
    name: "Fireball 750 ml",
    categoria: "Licores",
    hasVariants: false,
    isAgrupador: false,
    sku: "LICR-FIRB750",
    codigoUniversal: "088004009303",
    marca: "Fireball",
    proveedor: "Sazerac Company",
    codigoProveedor: "SAZ-FIRB-750-CANE",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "24", reservado: "3", disponible: "21" },

    atributosInformativos: [
      { key: "Tipo de Licor", value: "Licor de whisky y canela" },
      { key: "Origen", value: "Canadá" },
      { key: "ABV", value: "33%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 13000, margen: 65, iva: 21, precioFinal: 25650 },
  },

  // COINTREAU
  {
    name: "Cointreau 700 ml",
    categoria: "Licores",
    hasVariants: false,
    isAgrupador: false,
    sku: "LICR-COIN700",
    codigoUniversal: "07035542004202",
    marca: "Cointreau",
    proveedor: "Rémy Cointreau",
    codigoProveedor: "RC-COIN-700-ORIG",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",
    stock: { total: "18", reservado: "2", disponible: "16" },
    atributosInformativos: [
      { key: "Tipo de Licor", value: "Triple sec (licor de naranja)" },
      { key: "Origen", value: "Francia" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
    precio: { costo: 20000, margen: 55, iva: 21, precioFinal: 37500 },
  },
]
