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
      { key: "Año", variantes: ["2018", "2019"] },
    ],

    // Parent-level info (shared across all variants)
    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Grand Reserve" },
      { key: "Perfil Sensorial", value: "" }, // filled per variant
      { key: "Bodega", value: "Proemio Wines" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // filled per variant
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "" }, // filled per variant
      { key: "Enólogo", value: "Marcelo Bocardo" },
      { key: "ABV", value: "14%" },
      { key: "Temperatura de Servicio", value: "16–19°C" },
      { key: "Maridaje", value: "Carnes rojas y platos especiados" },
      { key: "Estuche", value: "" },
    ],

    variantCount: 8,
    variants: [
      // --- MALBEC ---
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-MALB-2018",
        codigoUniversal: "7798123400013",
        codigoProveedor: "PROE-GR-MALB-2018",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja madura, especias y notas de chocolate" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "60", reservado: "12", disponible: "48" },
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
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "54", reservado: "10", disponible: "44" },
      },

      // --- CABERNET SAUVIGNON ---
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-CABS-2018",
        codigoUniversal: "7798123400037",
        codigoProveedor: "PROE-GR-CABS-2018",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra, especias y notas ahumadas de barrica" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "48", reservado: "9", disponible: "39" },
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
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "42", reservado: "8", disponible: "34" },
      },

      // --- SYRAH ---
      {
        name: "Proemio Grand Reserve",
        sku: "VNO-PROGRES-SYGA-2018",
        codigoUniversal: "7798123400051",
        codigoProveedor: "PROE-GR-SYGA-2018",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Syrah Garnacha" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra madura, pimienta y notas tostadas" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "9 años" },
        ],
        stock: { total: "36", reservado: "6", disponible: "30" },
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
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "32", reservado: "5", disponible: "27" },
      },
    ],
  },
  {
    name: "Proemio Ícono",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-PROICON",
    marca: "Proemio",
    proveedor: "Proemio Wines",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon", "Petit Verdot"] },
      { key: "Año", variantes: ["2018", "2019"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Ícono" },
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Bodega", value: "Proemio Wines" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Marcelo Bocardo" },
      { key: "ABV", value: "14.5%" },
      { key: "Temperatura de Servicio", value: "16–19°C" },
      { key: "Maridaje", value: "Carnes rojas y alta gastronomía" },
      { key: "Estuche", value: "Caja premium" },
    ],

    variantCount: 6,
    variants: [
      // --- MALBEC ---
      {
        name: "Proemio Ícono",
        sku: "VNO-PROICON-MALB-2018",
        codigoUniversal: "7798123400099",
        codigoProveedor: "PROE-ICO-MALB-2018",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          {
            key: "Perfil Sensorial",
            value: "Frutos rojos y negros maduros, especias y café; taninos dulces y persistentes",
          },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "40", reservado: "8", disponible: "32" },
      },
      {
        name: "Proemio Ícono",
        sku: "VNO-PROICON-MALB-2019",
        codigoUniversal: "7798123400105",
        codigoProveedor: "PROE-ICO-MALB-2019",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          {
            key: "Perfil Sensorial",
            value: "Fruta negra intensa, especias y notas de cacao; textura rica y elegante",
          },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "9 años" },
        ],
        stock: { total: "36", reservado: "7", disponible: "29" },
      },

      // --- CABERNET SAUVIGNON ---
      {
        name: "Proemio Ícono",
        sku: "VNO-PROICON-CABS-2018",
        codigoUniversal: "7798123400112",
        codigoProveedor: "PROE-ICO-CABS-2018",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          {
            key: "Perfil Sensorial",
            value: "Fruta negra, especias, café y notas terrosas; taninos firmes y sedosos",
          },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "34", reservado: "6", disponible: "28" },
      },
      {
        name: "Proemio Ícono",
        sku: "VNO-PROICON-CABS-2019",
        codigoUniversal: "7798123400129",
        codigoProveedor: "PROE-ICO-CABS-2019",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          {
            key: "Perfil Sensorial",
            value: "Cassis, frutos negros y especias, con final largo y elegante",
          },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "9 años" },
        ],
        stock: { total: "30", reservado: "5", disponible: "25" },
      },

      // --- PETIT VERDOT ---
      {
        name: "Proemio Ícono",
        sku: "VNO-PROICON-PVER-2018",
        codigoUniversal: "7798123400136",
        codigoProveedor: "PROE-ICO-PVER-2018",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Petit Verdot" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          {
            key: "Perfil Sensorial",
            value: "Fruta negra concentrada, especias y notas florales; estructura robusta",
          },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "26", reservado: "4", disponible: "22" },
      },
      {
        name: "Proemio Ícono",
        sku: "VNO-PROICON-PVER-2019",
        codigoUniversal: "7798123400143",
        codigoProveedor: "PROE-ICO-PVER-2019",
        categoria: "Vinos",
        marca: "Proemio",
        atributosPrincipales: [
          { key: "Varietal", value: "Petit Verdot" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          {
            key: "Perfil Sensorial",
            value: "Fruta negra, especias y café, con taninos marcados y final largo",
          },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "9 años" },
        ],
        stock: { total: "24", reservado: "4", disponible: "20" },
      },
    ],
  },
  {
    name: "Puna",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-PUNA",
    marca: "Puna",
    proveedor: "Bodega Puna",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Varietal × Año (not all combos exist; see explicit variants below)
    containerAtributosPrincipales: [
      {
        key: "Varietal",
        variantes: ["Tempranillo", "Syrah", "Chardonnay", "Cabernet", "Sauvignon Blanc", "Torrontés", "Malbec Rosado"],
      },
      { key: "Año", variantes: ["2023", "2024"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "" }, // varies per variant (tinto/blanco/rosado)
      { key: "Línea", value: "Varietales" },
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Bodega", value: "Bodega Puna" },
      { key: "Origen", value: "Valles Calchaquíes (Salta / Catamarca)" },
      { key: "Crianza", value: "" }, // per variant
      { key: "Tipo de Barrica", value: "" }, // per variant
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Equipo Enológico Puna" },
      { key: "ABV", value: "" }, // per variant
      { key: "Temperatura de Servicio", value: "" }, // per variant
      { key: "Maridaje", value: "" }, // per variant
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 7,
    variants: [
      // --- TEMPRANILLO ---
      {
        name: "Puna",
        sku: "VNO-PUNA-TEMP-2024",
        codigoUniversal: "7799001000042",
        codigoProveedor: "PUNA-VAR-TEMP-24",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Tempranillo" },
          { key: "Año", value: "2024" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta roja fresca, especias suaves" },
          { key: "Crianza", value: "Sin crianza" },
          { key: "Tipo de Barrica", value: "No aplica" },
          { key: "Potencial de Guarda", value: "4 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "15–17°C" },
          { key: "Maridaje", value: "Pastas y carnes blancas" },
        ],
        stock: { total: "40", reservado: "5", disponible: "35" },
      },

      // --- SYRAH ---
      {
        name: "Puna",
        sku: "VNO-PUNA-SYRA-2024",
        codigoUniversal: "7799001000059",
        codigoProveedor: "PUNA-VAR-SYRA-24",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Syrah" },
          { key: "Año", value: "2024" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, especias suaves" },
          { key: "Crianza", value: "Sin crianza" },
          { key: "Tipo de Barrica", value: "No aplica" },
          { key: "Potencial de Guarda", value: "4 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "15–17°C" },
          { key: "Maridaje", value: "Carnes y platos especiados" },
        ],
        stock: { total: "38", reservado: "4", disponible: "34" },
      },

      // --- CHARDONNAY ---
      {
        name: "Puna",
        sku: "VNO-PUNA-CHRD-2024",
        codigoUniversal: "7799001000158",
        codigoProveedor: "PUNA-CHRD-24",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2024" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Fruta blanca madura, vainilla y tostado" },
          { key: "Crianza", value: "Con lías (batonnage) y paso por barrica" },
          { key: "Tipo de Barrica", value: "Roble francés (barrica nueva)" },
          { key: "Potencial de Guarda", value: "5 años" },
          { key: "ABV", value: "12.9%" },
          { key: "Temperatura de Servicio", value: "8–10°C" },
          { key: "Maridaje", value: "Pescados y pastas cremosas" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },

      // --- CABERNET ---
      {
        name: "Puna",
        sku: "VNO-PUNA-CABN-2023",
        codigoUniversal: "7799001000165",
        codigoProveedor: "PUNA-CABN-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, especias y notas herbales" },
          { key: "Crianza", value: "" },
          { key: "Tipo de Barrica", value: "" },
          { key: "Potencial de Guarda", value: "6 años" },
          { key: "ABV", value: "" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes y quesos duros" },
        ],
        stock: { total: "22", reservado: "3", disponible: "19" },
      },

      // --- SAUVIGNON BLANC ---
      {
        name: "Puna",
        sku: "VNO-PUNA-SBLC-2023",
        codigoUniversal: "7799001000172",
        codigoProveedor: "PUNA-SBLC-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Sauvignon Blanc" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Cítrico, herbal y fresco" },
          { key: "Crianza", value: "Sin crianza" },
          { key: "Tipo de Barrica", value: "No aplica" },
          { key: "Potencial de Guarda", value: "3 años" },
          { key: "ABV", value: "" },
          { key: "Temperatura de Servicio", value: "7–9°C" },
          { key: "Maridaje", value: "Ensaladas y mariscos" },
        ],
        stock: { total: "26", reservado: "3", disponible: "23" },
      },

      // --- TORRONTÉS ---
      {
        name: "Puna",
        sku: "VNO-PUNA-TORR-2023",
        codigoUniversal: "7799001000189",
        codigoProveedor: "PUNA-TORR-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Torrontés" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Floral, cítrico y frutado" },
          { key: "Crianza", value: "Sin crianza" },
          { key: "Tipo de Barrica", value: "No aplica" },
          { key: "Potencial de Guarda", value: "3 años" },
          { key: "ABV", value: "" },
          { key: "Temperatura de Servicio", value: "7–9°C" },
          { key: "Maridaje", value: "Comida asiática y quesos suaves" },
        ],
        stock: { total: "30", reservado: "4", disponible: "26" },
      },

      // --- MALBEC ROSADO ---
      {
        name: "Puna",
        sku: "VNO-PUNA-MLRS-2024",
        codigoUniversal: "7799001000196",
        codigoProveedor: "PUNA-MLRS-24",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec Rosado" },
          { key: "Año", value: "2024" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Rosado" },
          { key: "Perfil Sensorial", value: "Fruta roja y frescura floral" },
          { key: "Crianza", value: "Sin crianza" },
          { key: "Tipo de Barrica", value: "No aplica" },
          { key: "Potencial de Guarda", value: "2 años" },
          { key: "ABV", value: "" },
          { key: "Temperatura de Servicio", value: "8–10°C" },
          { key: "Maridaje", value: "Aperitivos y picadas" },
        ],
        stock: { total: "28", reservado: "3", disponible: "25" },
      },
    ],
  },
  // Puna Reserva
  {
    name: "Puna Reserva",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-PUNARES",
    marca: "Puna",
    proveedor: "Bodega Puna",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon"] },
      { key: "Año", variantes: ["2023"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Reserva" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Bodega Puna" },
      { key: "Origen", value: "Valles Calchaquíes, Salta" },
      { key: "Crianza", value: "" },
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "" },
      { key: "Enólogo", value: "Equipo Enológico Puna" },
      { key: "ABV", value: "14.5%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Carnes asadas y platos especiados" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 2,
    variants: [
      {
        name: "Puna Reserva",
        sku: "VNO-PUNARES-MALB-2023",
        codigoUniversal: "7799001000011",
        codigoProveedor: "PUNA-RES-MALB-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja madura, especias y final persistente" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Potencial de Guarda", value: "6 años" },
        ],
        stock: { total: "48", reservado: "6", disponible: "42" },
      },
      {
        name: "Puna Reserva",
        sku: "VNO-PUNARES-CABS-2023",
        codigoUniversal: "7799001000028",
        codigoProveedor: "PUNA-RES-CABS-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra, pimienta y notas herbales" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Potencial de Guarda", value: "7 años" },
        ],
        stock: { total: "36", reservado: "4", disponible: "32" },
      },
    ],
  },
  // Puna Gran Reserva
  {
    name: "Puna Gran Reserva",
    categoria: "Vinos",
    hasVariants: false,
    isAgrupador: false,
    sku: "VNO-PUNAGR-MALB-2020",
    codigoUniversal: "7799001000035",
    marca: "Puna",
    proveedor: "Bodega Puna",
    codigoProveedor: "PUNA-GR-MALB-20",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    stock: { total: "24", reservado: "3", disponible: "21" },

    atributosPrincipales: [
      { key: "Varietal", value: "Malbec" },
      { key: "Año", value: "2020" },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Gran Reserva" },
      { key: "Perfil Sensorial", value: "Fruta negra concentrada, especias y notas de roble" },
      { key: "Bodega", value: "Bodega Puna" },
      { key: "Origen", value: "Valles Calchaquíes, Salta" },
      { key: "Crianza", value: "18 meses en barrica" },
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "10 años" },
      { key: "Enólogo", value: "Equipo Enológico Puna" },
      { key: "ABV", value: "15%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Carnes rojas y platos intensos" },
      { key: "Estuche", value: "Caja" },
    ],
  },

  {
    name: "Puna Helios",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-PUNAHEL",
    marca: "Puna",
    proveedor: "Bodega Puna",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon", "Blend"] },
      { key: "Año", variantes: ["2023"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Helios" },
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Bodega", value: "Bodega Puna" },
      { key: "Origen", value: "Valles Calchaquíes (Salta / Catamarca)" },
      { key: "Crianza", value: "" }, // per variant
      { key: "Tipo de Barrica", value: "" }, // per variant
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Equipo Enológico Puna" },
      { key: "ABV", value: "" }, // per variant
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Carnes rojas y platos intensos" },
      { key: "Estuche", value: "" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Puna Helios",
        sku: "VNO-PUNAHEL-MALB-2023",
        codigoUniversal: "7799001000202",
        codigoProveedor: "PUNA-HEL-MALB-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra, violetas y especias" },
          { key: "Crianza", value: "" },
          { key: "Tipo de Barrica", value: "" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "" },
        ],
        stock: { total: "20", reservado: "2", disponible: "18" },
      },
      {
        name: "Puna Helios",
        sku: "VNO-PUNAHEL-CABS-2023",
        codigoUniversal: "7799001000219",
        codigoProveedor: "PUNA-HEL-CABS-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Cassis, pimienta y notas herbales" },
          { key: "Crianza", value: "" },
          { key: "Tipo de Barrica", value: "" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
      {
        name: "Puna Helios",
        sku: "VNO-PUNAHEL-BLND-2023",
        codigoUniversal: "7799001000226",
        codigoProveedor: "PUNA-HEL-BLND-23",
        categoria: "Vinos",
        marca: "Puna",
        atributosPrincipales: [
          { key: "Varietal", value: "Blend" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Varietales del Blend", value: "60% Malbec, 32% Cabernet, 8% Tannat" },
          { key: "Perfil Sensorial", value: "Fruta negra, especias y final largo" },
          { key: "Crianza", value: "" },
          { key: "Tipo de Barrica", value: "" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },
    ],
  },
  {
    name: "DV Catena",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-DVCAT-MALB",
    marca: "Catena Zapata",
    proveedor: "Catena Zapata",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec"] },
      { key: "Año", variantes: ["2014", "2016", "2018", "2019", "2021", "2022", "2023"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "DV Catena" },
      { key: "Perfil Sensorial", value: "" }, // filled per variant
      { key: "Bodega", value: "Catena Zapata" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant (e.g., oak aging)
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Equipo Enológico Catena" },
      { key: "ABV", value: "14%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Carnes rojas, guisos y quesos curados" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 7,
    variants: [
      // --- 2014 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB-2014",
        codigoUniversal: "7799002000146",
        codigoProveedor: "DVCAT-MALB-14",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2014" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Frutos negros maduros, toques de cuero y especias dulces" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "18", reservado: "3", disponible: "15" },
      },

      // --- 2016 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB-2016",
        codigoUniversal: "7799002000160",
        codigoProveedor: "DVCAT-MALB-16",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2016" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Notorio equilibrio fruta-roble, taninos sedosos y notas de ciruela" },
          { key: "Crianza", value: "18 meses en barrica" },
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "22", reservado: "4", disponible: "18" },
      },

      // --- 2018 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB-2018",
        codigoUniversal: "7799002000184",
        codigoProveedor: "DVCAT-MALB-18",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra intensa y chocolate con final especiado" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Potencial de Guarda", value: "9 años" },
        ],
        stock: { total: "30", reservado: "6", disponible: "24" },
      },

      // --- 2019 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB-2019",
        codigoUniversal: "7799002000191",
        codigoProveedor: "DVCAT-MALB-19",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Frutos negros y rojos, pimienta y chocolate, taninos firmes" },
          { key: "Crianza", value: "18 meses en barrica de roble francés" },
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "42", reservado: "7", disponible: "35" },
      },

      // --- 2021 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB-2021",
        codigoUniversal: "7799002000214",
        codigoProveedor: "DVCAT-MALB-21",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Intenso rojo oscuro con notas florales y especiadas" },
          { key: "Crianza", value: "18 meses en barrica" },
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "38", reservado: "6", disponible: "32" },
      },

      // --- 2022 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB-2022",
        codigoUniversal: "7799002000221",
        codigoProveedor: "DVCAT-MALB-22",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta madura, taninos suaves y notas de vainilla" },
          { key: "Crianza", value: "18 meses en barrica" },
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "46", reservado: "9", disponible: "37" },
      },

      // --- 2023 ---
      {
        name: "DV Catena",
        sku: "VNO-DVCAT-MALB-2023",
        codigoUniversal: "7799002000238",
        codigoProveedor: "DVCAT-MALB-23",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Frutos rojos brillantes, especias dulces y taninos equilibrados" },
          { key: "Crianza", value: "18 meses en barrica" },
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "50", reservado: "10", disponible: "40" },
      },
    ],
  },
  {
    name: "Angélica Zapata Alta",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-ANGALTA",
    marca: "Catena Zapata",
    proveedor: "Bodega Catena Zapata",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Matrix: Varietal × Año
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon", "Cabernet Franc", "Merlot", "Chardonnay"] },
      { key: "Año", variantes: ["2019", "2020", "2021"] },
    ],

    // Parent-level info (shared across all variants)
    atributosInformativos: [
      { key: "Tipo de Vino", value: "" }, // tinto/blanco depende del varietal (se define en el hijo)
      { key: "Línea", value: "Alta" },
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Bodega", value: "Bodega Catena Zapata" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant (tiempo + detalle)
      { key: "Tipo de Barrica", value: "" }, // per variant (detalle de roble/% nuevas)
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Equipo Enológico Catena Zapata" },
      { key: "ABV", value: "" }, // per variant
      { key: "Temperatura de Servicio", value: "" }, // per variant
      { key: "Maridaje", value: "" }, // per variant
      { key: "Estuche", value: "" },
    ],

    variantCount: 15,
    variants: [
      // -------------------- MALBEC --------------------
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-MALB-2019",
        codigoUniversal: "7798123491001",
        codigoProveedor: "CZ-AZA-MALB-2019",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, violetas y especias; final largo" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "10 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes rojas, pastas y quesos curados" },
        ],
        stock: { total: "36", reservado: "5", disponible: "31" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-MALB-2020",
        codigoUniversal: "7798123491002",
        codigoProveedor: "CZ-AZA-MALB-2020",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Ciruela madura, cacao y especias dulces" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "10 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes a la parrilla y platos intensos" },
        ],
        stock: { total: "34", reservado: "4", disponible: "30" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-MALB-2021",
        codigoUniversal: "7798123491003",
        codigoProveedor: "CZ-AZA-MALB-2021",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra fresca, flores y notas de roble" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "9 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Cordero, carnes rojas y guisos" },
        ],
        stock: { total: "30", reservado: "4", disponible: "26" },
      },

      // -------------------- CABERNET SAUVIGNON --------------------
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CABS-2019",
        codigoUniversal: "7798123491011",
        codigoProveedor: "CZ-AZA-CABS-2019",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Cassis, pimienta negra y vainilla sutil" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "12 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes rojas, hongos y platos especiados" },
        ],
        stock: { total: "28", reservado: "4", disponible: "24" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CABS-2020",
        codigoUniversal: "7798123491012",
        codigoProveedor: "CZ-AZA-CABS-2020",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, hierbas y especias; buena estructura" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "12 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Bife, estofados y quesos curados" },
        ],
        stock: { total: "26", reservado: "3", disponible: "23" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CABS-2021",
        codigoUniversal: "7798123491013",
        codigoProveedor: "CZ-AZA-CABS-2021",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Cassis, especias y notas balsámicas; final largo" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "10 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes rojas y platos intensos" },
        ],
        stock: { total: "22", reservado: "3", disponible: "19" },
      },

      // -------------------- CABERNET FRANC --------------------
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CABF-2019",
        codigoUniversal: "7798123491021",
        codigoProveedor: "CZ-AZA-CABF-2019",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Especias, hierbas y fruta negra; estructura firme" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "12 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes, platos con hierbas y quesos" },
        ],
        stock: { total: "20", reservado: "3", disponible: "17" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CABF-2020",
        codigoUniversal: "7798123491022",
        codigoProveedor: "CZ-AZA-CABF-2020",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, eucalipto suave y especias" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "10 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Cordero y platos especiados" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CABF-2021",
        codigoUniversal: "7798123491023",
        codigoProveedor: "CZ-AZA-CABF-2021",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Hierbas frescas, fruta negra y notas de roble" },
          { key: "Crianza", value: "18 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈50% nuevas)" },
          { key: "Potencial de Guarda", value: "9 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes y platos con hongos" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },

      // -------------------- MERLOT --------------------
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-MERL-2019",
        codigoUniversal: "7798123491031",
        codigoProveedor: "CZ-AZA-MERL-2019",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Merlot" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta roja/negra y taninos suaves; elegante" },
          { key: "Crianza", value: "16 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈40% nuevas)" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Pastas, aves y carnes suaves" },
        ],
        stock: { total: "22", reservado: "3", disponible: "19" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-MERL-2020",
        codigoUniversal: "7798123491032",
        codigoProveedor: "CZ-AZA-MERL-2020",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Merlot" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Ciruela, especias suaves y roble integrado" },
          { key: "Crianza", value: "16 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈40% nuevas)" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Carnes blancas y quesos semiduros" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-MERL-2021",
        codigoUniversal: "7798123491033",
        codigoProveedor: "CZ-AZA-MERL-2021",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Merlot" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta roja madura, cacao y taninos redondos" },
          { key: "Crianza", value: "16 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈40% nuevas)" },
          { key: "Potencial de Guarda", value: "7 años" },
          { key: "ABV", value: "14%" },
          { key: "Temperatura de Servicio", value: "16–18°C" },
          { key: "Maridaje", value: "Pastas y carnes al horno" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },

      // -------------------- CHARDONNAY --------------------
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CHAR-2019",
        codigoUniversal: "7798123491041",
        codigoProveedor: "CZ-AZA-CHAR-2019",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Cítricos, pera y notas sutiles de roble" },
          { key: "Crianza", value: "14 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈40% nuevas)" },
          { key: "Potencial de Guarda", value: "6 años" },
          { key: "ABV", value: "13.9%" },
          { key: "Temperatura de Servicio", value: "8–10°C" },
          { key: "Maridaje", value: "Pescados, mariscos y quesos suaves" },
        ],
        stock: { total: "26", reservado: "4", disponible: "22" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CHAR-2020",
        codigoUniversal: "7798123491042",
        codigoProveedor: "CZ-AZA-CHAR-2020",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Fruta blanca, floral y toque mineral" },
          { key: "Crianza", value: "14 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈40% nuevas)" },
          { key: "Potencial de Guarda", value: "6 años" },
          { key: "ABV", value: "13.9%" },
          { key: "Temperatura de Servicio", value: "8–10°C" },
          { key: "Maridaje", value: "Sushi, mariscos y pastas suaves" },
        ],
        stock: { total: "22", reservado: "3", disponible: "19" },
      },
      {
        name: "Angélica Zapata Alta",
        sku: "VNO-ANGALTA-CHAR-2021",
        codigoUniversal: "7798123491043",
        codigoProveedor: "CZ-AZA-CHAR-2021",
        categoria: "Vinos",
        marca: "Catena Zapata",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Cítrico, manzana y roble elegante" },
          { key: "Crianza", value: "14 meses en roble francés" },
          { key: "Tipo de Barrica", value: "Roble francés (≈40% nuevas)" },
          { key: "Potencial de Guarda", value: "5 años" },
          { key: "ABV", value: "13.9%" },
          { key: "Temperatura de Servicio", value: "8–10°C" },
          { key: "Maridaje", value: "Pescados grasos y quesos semiblandos" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
    ],
  },
  {
    name: "Chañarmuyo 5 Hileras",
    categoria: "Vinos",
    hasVariants: false,
    isAgrupador: false,
    sku: "VNO-CHM5HIL-2021",
    codigoUniversal: "7799002000001", // generated
    marca: "Chañarmuyo",
    proveedor: "Chañarmuyo Bodega",
    codigoProveedor: "CHM-5HIL-21",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    stock: { total: "18", reservado: "2", disponible: "16" },
    atributosPrincipales: [
      { key: "Varietal", value: "Blend" },
      { key: "Año", value: "2021" },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "5 Hileras" },
      { key: "Perfil Sensorial", value: "Fruta roja madura, taninos redondos y notas tostadas" },
      { key: "Bodega", value: "Chañarmuyo" },
      { key: "Origen", value: "Valle de Chañarmuyo, La Rioja" },
      { key: "Crianza", value: "24 meses en barrica" },
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "8 años" },
      { key: "ABV", value: "14.1%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Asados y guisos intensos" },
    ],
  },
  {
    name: "Chañarmuyo Clásico",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-CHMCLAS",
    marca: "Chañarmuyo",
    proveedor: "Chañarmuyo Bodega",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Blend", "Chardonnay", "Rosado"] },
      { key: "Año", variantes: ["2023"] },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "" },
      { key: "Línea", value: "Clásico" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Chañarmuyo" },
      { key: "Origen", value: "Valle de Chañarmuyo, La Rioja" },
      { key: "Crianza", value: "" },
      { key: "Tipo de Barrica", value: "" },
      { key: "Potencial de Guarda", value: "" },
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "" },
      { key: "Temperatura de Servicio", value: "" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "" },
    ],
    variantCount: 4,
    variants: [
      {
        name: "Chañarmuyo Clásico",
        sku: "VNO-CHMCLAS-MALB-2023",
        codigoUniversal: "7799002000002",
        codigoProveedor: "CHM-CL-MALB-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [{ key: "Perfil Sensorial", value: "Fruta roja, taninos suaves" }],
        stock: { total: "30", reservado: "4", disponible: "26" },
      },
      {
        name: "Chañarmuyo Clásico",
        sku: "VNO-CHMCLAS-BLND-2023",
        codigoUniversal: "7799002000003",
        codigoProveedor: "CHM-CL-BLND-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Blend" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Características del Blend", value: "Cabernet Franc - Cabernet Sauvignon" },
          { key: "Perfil Sensorial", value: "Fruta negra, especias y estructura equilibrada" },
        ],
        stock: { total: "26", reservado: "3", disponible: "23" },
      },
      {
        name: "Chañarmuyo Clásico",
        sku: "VNO-CHMCLAS-CHAR-2023",
        codigoUniversal: "7799002000004",
        codigoProveedor: "CHM-CL-CHAR-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [{ key: "Perfil Sensorial", value: "Cítrico, notas a manzana verde" }],
        stock: { total: "22", reservado: "2", disponible: "20" },
      },
      {
        name: "Chañarmuyo Clásico",
        sku: "VNO-CHMCLAS-ROSA-2023",
        codigoUniversal: "7799002000005",
        codigoProveedor: "CHM-CL-ROSA-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Rosado" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [{ key: "Perfil Sensorial", value: "Fruta roja y frescor" }],
        stock: { total: "24", reservado: "3", disponible: "21" },
      },
    ],
  },
  {
    name: "Chañarmuyo Gran Vino",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-CHMGRAN",
    marca: "Chañarmuyo",
    proveedor: "Chañarmuyo Bodega",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Cabernet Franc", "Tannat", "Cabernet Sauvignon", "Malbec"] },
      { key: "Año", variantes: ["2022", "2023"] },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "" },
      { key: "Línea", value: "Gran Vino" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Chañarmuyo" },
      { key: "Origen", value: "Valle de Chañarmuyo, La Rioja" },
      { key: "Crianza", value: "18–24 meses en barrica" },
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "" },
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "14–15%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "" },
    ],
    variantCount: 8,
    variants: [
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-CFR-2022",
        codigoUniversal: "7799002000010",
        codigoProveedor: "CHM-GV-CFR-22",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra, especias y taninos firmes" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "18", reservado: "3", disponible: "15" },
      },
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-CFR-2023",
        codigoUniversal: "7799002000017",
        codigoProveedor: "CHM-GV-CFR-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja intensa y pimienta" },
          { key: "Potencial de Guarda", value: "9 años" },
        ],
        stock: { total: "20", reservado: "4", disponible: "16" },
      },
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-TANN-2022",
        codigoUniversal: "7799002000024",
        codigoProveedor: "CHM-GV-TANN-22",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Tannat" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra madura y estructura robusta" },
          { key: "Potencial de Guarda", value: "12 años" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-TANN-2023",
        codigoUniversal: "7799002000021",
        codigoProveedor: "CHM-GV-TANN-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Tannat" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra y especias dulces" },
          { key: "Potencial de Guarda", value: "11 años" },
        ],
        stock: { total: "18", reservado: "3", disponible: "15" },
      },
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-CSAW-2022",
        codigoUniversal: "7799002000028",
        codigoProveedor: "CHM-GV-CSAW-22",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra y pimiento verde" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "22", reservado: "4", disponible: "18" },
      },
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-CSAW-2023",
        codigoUniversal: "7799002000035",
        codigoProveedor: "CHM-GV-CSAW-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra intensa y notas herbales" },
          { key: "Potencial de Guarda", value: "9 años" },
        ],
        stock: { total: "24", reservado: "4", disponible: "20" },
      },
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-MALB-2022",
        codigoUniversal: "7799002000032",
        codigoProveedor: "CHM-GV-MALB-22",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja madura y especias" },
          { key: "Potencial de Guarda", value: "11 años" },
        ],
        stock: { total: "20", reservado: "3", disponible: "17" },
      },
      {
        name: "Chañarmuyo Gran Vino",
        sku: "VNO-CHMGRAN-MALB-2023",
        codigoUniversal: "7799002000039",
        codigoProveedor: "CHM-GV-MALB-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja y notas florales" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "22", reservado: "3", disponible: "19" },
      },
    ],
  },
  {
    name: "Chañarmuyo Viña Providencia",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-CHMPROV",
    marca: "Chañarmuyo",
    proveedor: "Chañarmuyo Bodega",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Gran Malbec", "Red Blend"] },
      { key: "Año", variantes: ["2023"] },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "" },
      { key: "Línea", value: "Viña Providencia" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Chañarmuyo" },
      { key: "Origen", value: "Valle de Chañarmuyo, La Rioja" },
      { key: "Crianza", value: "18–24 meses barrica" },
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "" },
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "14–14.5%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "" },
    ],
    variantCount: 2,
    variants: [
      {
        name: "Chañarmuyo Viña Providencia",
        sku: "VNO-CHMPROV-GMAL-2023",
        codigoUniversal: "7799002000045",
        codigoProveedor: "CHM-PROV-GMAL-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Gran Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja madura y taninos persistentes" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "18", reservado: "3", disponible: "15" },
      },
      {
        name: "Chañarmuyo Viña Providencia",
        sku: "VNO-CHMPROV-RBLD-2023",
        codigoUniversal: "7799002000048",
        codigoProveedor: "CHM-PROV-RBLD-23",
        categoria: "Vinos",
        marca: "Chañarmuyo",
        atributosPrincipales: [
          { key: "Varietal", value: "Red Blend" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta roja y especias con estructura suave" },
          { key: "Potencial de Guarda", value: "8 años" },
        ],
        stock: { total: "20", reservado: "4", disponible: "16" },
      },
    ],
  },
  {
    name: "Fausto",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-FAUSTO",
    marca: "Falasco",
    proveedor: "Falasco",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Matrix: Varietal × Año
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Blend"] },
      { key: "Año", variantes: ["2021"] },
    ],

    // Parent-level info (shared across all variants)
    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Fausto" },
      { key: "Perfil Sensorial", value: "" }, // filled per variant
      { key: "Bodega", value: "Falasco" },
      { key: "Origen", value: "Vista Flores, Valle de Uco, Mendoza" },
      { key: "Crianza", value: "" }, // filled per variant
      { key: "Tipo de Barrica", value: "" }, // filled per variant
      { key: "Potencial de Guarda", value: "" }, // filled per variant
      { key: "Enólogo", value: "Equipo Enológico Falasco" },
      { key: "ABV", value: "" }, // filled per variant when available
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Carnes rojas, pastas y platos intensos" },
      { key: "Estuche", value: "" }, // filled per variant
    ],

    variantCount: 4,
    variants: [
      // --- MALBEC (sin estuche) ---
      {
        name: "Fausto",
        sku: "VNO-FAUSTO-MALB-2021",
        codigoUniversal: "7799002001015",
        codigoProveedor: "FAL-FAU-MALB-21",
        categoria: "Vinos",
        marca: "Falasco",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra madura, especias y vainilla suave" },
          { key: "Crianza", value: "12–14 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés y americano" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "36", reservado: "4", disponible: "32" },
      },

      // --- MALBEC (Estuche de Duelas) ---
      {
        name: "Fausto",
        sku: "VNO-FAUSTO-MALB-21DU",
        codigoUniversal: "7799002001022",
        codigoProveedor: "FAL-FAU-MALB-21-DU",
        categoria: "Vinos",
        marca: "Falasco",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra madura, especias y vainilla suave" },
          { key: "Crianza", value: "12–14 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés y americano" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "" },
          { key: "Estuche", value: "Estuche de Duelas" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },

      // --- BLEND (sin estuche) ---
      {
        name: "Fausto",
        sku: "VNO-FAUSTO-BLND-2021",
        codigoUniversal: "7799002001039",
        codigoProveedor: "FAL-FAU-BLND-21",
        categoria: "Vinos",
        marca: "Falasco",
        atributosPrincipales: [
          { key: "Varietal", value: "Blend" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Características del blend", value: "Malbec - Cabernet Franc" },
          { key: "Perfil Sensorial", value: "Fruta negra, especias y notas tostadas" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "70% roble francés, 30% roble americano" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "14.9%" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "30", reservado: "3", disponible: "27" },
      },

      // --- BLEND (Estuche de Duelas) ---
      {
        name: "Fausto",
        sku: "VNO-FAUSTO-BLND-21DU",
        codigoUniversal: "7799002001046",
        codigoProveedor: "FAL-FAU-BLND-21-DU",
        categoria: "Vinos",
        marca: "Falasco",
        atributosPrincipales: [
          { key: "Varietal", value: "Blend" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Características del blend", value: "Malbec - Cabernet Franc" },
          { key: "Perfil Sensorial", value: "Fruta negra, especias y notas tostadas" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "70% roble francés, 30% roble americano" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "14.9%" },
          { key: "Estuche", value: "Estuche de Duelas" },
        ],
        stock: { total: "14", reservado: "2", disponible: "12" },
      },
    ],
  },
  {
    name: "Domiciano Corte Estrella",
    categoria: "Vinos",
    hasVariants: false,
    isAgrupador: false,
    sku: "VNO-DOMCES-BLND-2022",
    codigoUniversal: "7798123401012",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    codigoProveedor: "DOM-CE-BLND-2022",
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
      { key: "Año", value: "2022" },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Corte Estrella" },
      { key: "Perfil Sensorial", value: "Cerezas y ciruelas maduras, con café, cacao y tabaco" },
      { key: "Bodega", value: "Bodega Domiciano" },
      { key: "Origen", value: "Barrancas, Maipú, Mendoza, Argentina" },
      { key: "Crianza", value: "12 meses en barricas (2do y 3er uso)" },
      { key: "Tipo de Barrica", value: "Roble francés" },
      { key: "Potencial de Guarda", value: "6 años" },
      { key: "Enólogo", value: "Equipo Enológico Domiciano" },
      { key: "ABV", value: "14%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Carnes rojas, parrilla, pastas con salsas intensas" },
      { key: "Estuche", value: "Sin estuche" },
    ],
  },

  {
    name: "Domiciano Gran Reserva",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-DOMGRES",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Franc"] },
      { key: "Año", variantes: ["2021"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "Tinto" },
      { key: "Línea", value: "Gran Reserva" },
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Bodega", value: "Bodega Domiciano" },
      { key: "Origen", value: "Barrancas, Maipú, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant
      { key: "Tipo de Barrica", value: "Roble francés (100%, 1er y 2do uso)" },
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Equipo Enológico Domiciano" },
      { key: "ABV", value: "14%" },
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "Carnes rojas, platos intensos, quesos estacionados" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 2,
    variants: [
      {
        name: "Domiciano Gran Reserva",
        sku: "VNO-DOMGRES-MALB-2021",
        codigoUniversal: "7798123401029",
        codigoProveedor: "DOM-GR-MALB-2021",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Cerezas y ciruelas maduras, con café, cacao y tabaco" },
          { key: "Crianza", value: "18 meses en roble francés (1er y 2do uso) + descanso en botella" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "24", reservado: "3", disponible: "21" },
      },
      {
        name: "Domiciano Gran Reserva",
        sku: "VNO-DOMGRES-CFRN-2021",
        codigoUniversal: "7798123401036",
        codigoProveedor: "DOM-GR-CFRN-2021",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Fruta negra, hierbas finas y especias; final largo" },
          { key: "Crianza", value: "18 meses en roble francés (1er y 2do uso) + descanso en botella" },
          { key: "Potencial de Guarda", value: "10 años" },
        ],
        stock: { total: "20", reservado: "2", disponible: "18" },
      },
    ],
  },
  {
    name: "Domiciano Reserva Nocturna",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-DOMNOCT",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Matrix: Varietal × Año
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Franc", "Syrah"] },
      { key: "Año", variantes: ["2023"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "" }, // per variant
      { key: "Línea", value: "Reserva Nocturna" },
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Bodega", value: "Bodega Domiciano" },
      { key: "Origen", value: "Maipú, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant (no especificado en la página)
      { key: "Tipo de Barrica", value: "" }, // per variant / no especificado
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Equipo Enológico Domiciano" },
      { key: "ABV", value: "" }, // per variant / no especificado
      { key: "Temperatura de Servicio", value: "16–18°C" },
      { key: "Maridaje", value: "" }, // per variant
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Domiciano Reserva Nocturna",
        sku: "VNO-DOMNOCT-MALB-2023",
        codigoUniversal: "7799002000011",
        codigoProveedor: "DOM-RN-MALB-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Cerezas y ciruelas, especias, cacao y café" },
          { key: "Maridaje", value: "Empanadas de carne" },
        ],
        stock: { total: "30", reservado: "4", disponible: "26" },
      },
      {
        name: "Domiciano Reserva Nocturna",
        sku: "VNO-DOMNOCT-CABF-2023",
        codigoUniversal: "7799002000028",
        codigoProveedor: "DOM-RN-CABF-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta roja, tabaco y pimiento; cacao y café" },
          { key: "Maridaje", value: "Estofado de osobuco" },
        ],
        stock: { total: "24", reservado: "3", disponible: "21" },
      },
      {
        name: "Domiciano Reserva Nocturna",
        sku: "VNO-DOMNOCT-SYRA-2023",
        codigoUniversal: "7799002000035",
        codigoProveedor: "DOM-RN-SYRA-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Syrah" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Frutos rojos y negros maduros; taninos dulces" },
          { key: "Maridaje", value: "Cordero a las finas hierbas" },
        ],
        stock: { total: "22", reservado: "3", disponible: "19" },
      },
    ],
  },
  {
    name: "Domiciano Espumante",
    categoria: "Espumantes",
    hasVariants: false,
    isAgrupador: false,
    sku: "ESP-DOMI-EXBR",
    codigoUniversal: "7798123490312",
    codigoProveedor: "DOM-EB-750",
    marca: "Domiciano",
    proveedor: "Bodega Domiciano",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: {
      total: "24",
      reservado: "3",
      disponible: "21",
    },

    atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Reserva Nocturna" },
      { key: "Perfil Sensorial", value: "Fresco, cítrico y elegante, con burbuja fina" },
      { key: "Bodega", value: "Bodega Domiciano" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "Método tradicional, crianza sobre lías" },
      { key: "Enólogo", value: "Equipo Enológico Domiciano" },
      { key: "ABV", value: "12%" },
      { key: "Temperatura de Servicio", value: "8–10°C" },
      { key: "Maridaje", value: "Aperitivos, mariscos, sushi" },
      { key: "Estuche", value: "Sin estuche" },
    ],
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
      { key: "Varietal", variantes: ["Blend", "Malbec", "Blanco Dulce", "Blend", "Chardonnay"] },
      { key: "Año", variantes: ["2023"] },
    ],

    atributosInformativos: [
      { key: "Tipo de Vino", value: "" }, // per variant
      { key: "Línea", value: "Estelar" },
      { key: "Perfil Sensorial", value: "" }, // per variant
      { key: "Bodega", value: "Bodega Domiciano" },
      { key: "Origen", value: "Maipú, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per variant / no especificado
      { key: "Tipo de Barrica", value: "" }, // per variant / no especificado
      { key: "Potencial de Guarda", value: "" }, // per variant
      { key: "Enólogo", value: "Equipo Enológico Domiciano" },
      { key: "ABV", value: "" }, // per variant / no especificado
      { key: "Temperatura de Servicio", value: "Tinto 15–17°C / Blanco 8–10°C" },
      { key: "Maridaje", value: "" }, // per variant
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 5,
    variants: [
      // Blend (Malbec - Syrah)
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-BLND-2023",
        codigoUniversal: "7799002000042",
        codigoProveedor: "DOM-EST-BLND-MS-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Blend" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Características del Blend", value: "Malbec - Syrah" },
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Mora y ciruela, pimienta; cacao y ahumado sutil" },
          { key: "Maridaje", value: "Sandwich de ojo de bife y provolone" },
        ],
        stock: { total: "28", reservado: "4", disponible: "24" },
      },

      // Malbec
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-MALB-2023",
        codigoUniversal: "7799002000059",
        codigoProveedor: "DOM-EST-MALB-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta madura, roble sutil, vainilla y especias" },
          { key: "Maridaje", value: "Pastas rellenas con bolognesa" },
        ],
        stock: { total: "34", reservado: "5", disponible: "29" },
      },

      // Blanco Dulce
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-BLDL-2023",
        codigoUniversal: "7799002000066",
        codigoProveedor: "DOM-EST-BLDL-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Blanco Dulce" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Jazmín y azahar, mango y durazno; final mielado" },
          { key: "Maridaje", value: "Cheesecake o crème brûlée" },
        ],
        stock: { total: "20", reservado: "3", disponible: "17" },
      },

      // Blend (Malbec - Cabernet Franc)
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-BLND-2023-B",
        codigoUniversal: "7799002000073",
        codigoProveedor: "DOM-EST-BLND-MC-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Blend" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Características del Blend", value: "Malbec - Cabernet Franc" },
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta roja, pimiento y violetas; final herbal fresco" },
          { key: "Maridaje", value: "A elección (estilo relaxed)" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },

      // Chardonnay
      {
        name: "Domiciano Estelar",
        sku: "VNO-DOMESTE-CHRD-2023",
        codigoUniversal: "7799002000080",
        codigoProveedor: "DOM-EST-CHRD-2023",
        categoria: "Vinos",
        marca: "Domiciano",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Tropical (piña/banana), cítricos; acidez filosa" },
          { key: "Maridaje", value: "A elección (estilo relaxed)" },
        ],
        stock: { total: "26", reservado: "4", disponible: "22" },
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
  },
  {
    name: "Salentein Single Vineyard",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-SALSVYD",
    marca: "Salentein",
    proveedor: "Bodegas Salentein",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Matrix: Varietal × Año
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Franc", "Chardonnay"] },
      { key: "Año", variantes: ["2018", "2019", "2020"] },
    ],

    // Parent-level info (shared across all variants)
    atributosInformativos: [
      { key: "Línea", value: "Single Vineyard" },
      { key: "Perfil Sensorial", value: "" }, // filled per variant
      { key: "Bodega", value: "Bodegas Salentein" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // filled per variant
      { key: "Tipo de Barrica", value: "" }, // filled per variant
      { key: "Potencial de Guarda", value: "" }, // filled per variant
      { key: "Enólogo", value: "Equipo enológico Salentein" },
      { key: "ABV", value: "" }, // filled per variant
      { key: "Temperatura de Servicio", value: "Tinto 16–18°C / Blanco 8–10°C" },
      { key: "Maridaje", value: "Carnes, pastas y quesos (según varietal)" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 9,
    variants: [
      // --- MALBEC ---
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-MALB-2018",
        codigoUniversal: "7798074863661",
        codigoProveedor: "SAL-SV-MALB-2018",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, violeta, final especiado" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "14.5%" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-MALB-2019",
        codigoUniversal: "7798074868369",
        codigoProveedor: "SAL-SV-MALB-2019",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Ciruela, cacao suave, taninos firmes" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés" },
          { key: "Potencial de Guarda", value: "7 años" },
          { key: "ABV", value: "14.5%" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-MALB-2020",
        codigoUniversal: "7798074868376",
        codigoProveedor: "SAL-SV-MALB-2020",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Mora, especias, final largo" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés" },
          { key: "Potencial de Guarda", value: "6 años" },
          { key: "ABV", value: "14.5%" },
        ],
        stock: { total: "14", reservado: "1", disponible: "13" },
      },

      // --- CABERNET FRANC ---
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-CABF-2018",
        codigoUniversal: "7798074868383",
        codigoProveedor: "SAL-SV-CABF-2018",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Pimiento asado, cassis, herbal fino" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés" },
          { key: "Potencial de Guarda", value: "8 años" },
          { key: "ABV", value: "14.5%" },
        ],
        stock: { total: "12", reservado: "1", disponible: "11" },
      },
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-CABF-2019",
        codigoUniversal: "7798074868390",
        codigoProveedor: "SAL-SV-CABF-2019",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, grafito, especias" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés" },
          { key: "Potencial de Guarda", value: "7 años" },
          { key: "ABV", value: "14.5%" },
        ],
        stock: { total: "12", reservado: "2", disponible: "10" },
      },
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-CABF-2020",
        codigoUniversal: "7798074868406",
        codigoProveedor: "SAL-SV-CABF-2020",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Herbal elegante, frutos negros, cacao" },
          { key: "Crianza", value: "12 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble francés" },
          { key: "Potencial de Guarda", value: "6 años" },
          { key: "ABV", value: "14.5%" },
        ],
        stock: { total: "10", reservado: "1", disponible: "9" },
      },

      // --- CHARDONNAY ---
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-CHAR-2018",
        codigoUniversal: "7798074868413",
        codigoProveedor: "SAL-SV-CHAR-2018",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2018" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Cítrico, pera, toque mineral" },
          { key: "Crianza", value: "6 meses sobre lías" },
          { key: "Tipo de Barrica", value: "Parcial en roble (mix)" },
          { key: "Potencial de Guarda", value: "4 años" },
          { key: "ABV", value: "13.5%" },
        ],
        stock: { total: "14", reservado: "2", disponible: "12" },
      },
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-CHAR-2019",
        codigoUniversal: "7798074868420",
        codigoProveedor: "SAL-SV-CHAR-2019",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2019" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Manzana, flores blancas, final fresco" },
          { key: "Crianza", value: "6 meses sobre lías" },
          { key: "Tipo de Barrica", value: "Parcial en roble (mix)" },
          { key: "Potencial de Guarda", value: "4 años" },
          { key: "ABV", value: "13.5%" },
        ],
        stock: { total: "12", reservado: "1", disponible: "11" },
      },
      {
        name: "Salentein Single Vineyard",
        sku: "VNO-SALSVYD-CHAR-2020",
        codigoUniversal: "7798074868437",
        codigoProveedor: "SAL-SV-CHAR-2020",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2020" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Cítrico, durazno blanco, cremoso leve" },
          { key: "Crianza", value: "6 meses sobre lías" },
          { key: "Tipo de Barrica", value: "Parcial en roble (mix)" },
          { key: "Potencial de Guarda", value: "3 años" },
          { key: "ABV", value: "13.5%" },
        ],
        stock: { total: "10", reservado: "1", disponible: "9" },
      },
    ],
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
      },
    ],
  },
  {
    name: "Salentein Reserva",
    categoria: "Vinos",
    hasVariants: true,
    isAgrupador: true,
    sku: "VNO-SALRES",
    marca: "Salentein",
    proveedor: "Bodegas Salentein",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    // Matrix: Varietal × Año
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon", "Chardonnay"] },
      { key: "Año", variantes: ["2021", "2022", "2023"] },
    ],

    atributosInformativos: [
      { key: "Línea", value: "Reserva" },
      { key: "Perfil Sensorial", value: "" }, // filled per variant
      { key: "Bodega", value: "Bodegas Salentein" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // filled per variant
      { key: "Tipo de Barrica", value: "" }, // filled per variant
      { key: "Potencial de Guarda", value: "" }, // filled per variant
      { key: "Enólogo", value: "Equipo enológico Salentein" },
      { key: "ABV", value: "" }, // filled per variant
      { key: "Temperatura de Servicio", value: "Tinto 16–18°C / Blanco 8–10°C" },
      { key: "Maridaje", value: "Comida diaria, pastas y carnes (según varietal)" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 9,
    variants: [
      // --- MALBEC ---
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-MALB-2021",
        codigoUniversal: "7798074865313",
        codigoProveedor: "SAL-RES-MALB-2021",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Ciruela, violeta, especias suaves" },
          { key: "Crianza", value: "8 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble (mix)" },
          { key: "Potencial de Guarda", value: "5 años" },
          { key: "ABV", value: "14%" },
        ],
        stock: { total: "36", reservado: "4", disponible: "32" },
      },
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-MALB-2022",
        codigoUniversal: "7798074868444",
        codigoProveedor: "SAL-RES-MALB-2022",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta roja, cacao leve, taninos redondos" },
          { key: "Crianza", value: "8 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble (mix)" },
          { key: "Potencial de Guarda", value: "5 años" },
          { key: "ABV", value: "14%" },
        ],
        stock: { total: "34", reservado: "3", disponible: "31" },
      },
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-MALB-2023",
        codigoUniversal: "7798074868451",
        codigoProveedor: "SAL-RES-MALB-2023",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta fresca, floral, final jugoso" },
          { key: "Crianza", value: "8 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble (mix)" },
          { key: "Potencial de Guarda", value: "4 años" },
          { key: "ABV", value: "14%" },
        ],
        stock: { total: "32", reservado: "3", disponible: "29" },
      },

      // --- CABERNET SAUVIGNON ---
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-CABS-2021",
        codigoUniversal: "7798074868468",
        codigoProveedor: "SAL-RES-CABS-2021",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Cassis, pimiento asado, especias" },
          { key: "Crianza", value: "8 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble (mix)" },
          { key: "Potencial de Guarda", value: "6 años" },
          { key: "ABV", value: "14%" },
        ],
        stock: { total: "28", reservado: "3", disponible: "25" },
      },
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-CABS-2022",
        codigoUniversal: "7798074868475",
        codigoProveedor: "SAL-RES-CABS-2022",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Fruta negra, pimienta, final seco" },
          { key: "Crianza", value: "8 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble (mix)" },
          { key: "Potencial de Guarda", value: "6 años" },
          { key: "ABV", value: "14%" },
        ],
        stock: { total: "26", reservado: "2", disponible: "24" },
      },
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-CABS-2023",
        codigoUniversal: "7798074868482",
        codigoProveedor: "SAL-RES-CABS-2023",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Tinto" },
          { key: "Perfil Sensorial", value: "Cassis, hierbas, tanino firme" },
          { key: "Crianza", value: "8 meses en barrica" },
          { key: "Tipo de Barrica", value: "Roble (mix)" },
          { key: "Potencial de Guarda", value: "5 años" },
          { key: "ABV", value: "14%" },
        ],
        stock: { total: "24", reservado: "2", disponible: "22" },
      },

      // --- CHARDONNAY ---
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-CHAR-2021",
        codigoUniversal: "7798074868499",
        codigoProveedor: "SAL-RES-CHAR-2021",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2021" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Cítrico, pera, toque cremoso" },
          { key: "Crianza", value: "4 meses sobre lías" },
          { key: "Tipo de Barrica", value: "Parcial en roble (mix)" },
          { key: "Potencial de Guarda", value: "3 años" },
          { key: "ABV", value: "13.5%" },
        ],
        stock: { total: "30", reservado: "3", disponible: "27" },
      },
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-CHAR-2022",
        codigoUniversal: "7798074868505",
        codigoProveedor: "SAL-RES-CHAR-2022",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2022" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Manzana, flores blancas, final fresco" },
          { key: "Crianza", value: "4 meses sobre lías" },
          { key: "Tipo de Barrica", value: "Parcial en roble (mix)" },
          { key: "Potencial de Guarda", value: "3 años" },
          { key: "ABV", value: "13.5%" },
        ],
        stock: { total: "28", reservado: "2", disponible: "26" },
      },
      {
        name: "Salentein Reserva",
        sku: "VNO-SALRES-CHAR-2023",
        codigoUniversal: "7798074868512",
        codigoProveedor: "SAL-RES-CHAR-2023",
        categoria: "Vinos",
        marca: "Salentein",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2023" },
        ],
        atributosInformativos: [
          { key: "Tipo de Vino", value: "Blanco" },
          { key: "Perfil Sensorial", value: "Durazno blanco, cítrico, suave" },
          { key: "Crianza", value: "4 meses sobre lías" },
          { key: "Tipo de Barrica", value: "Parcial en roble (mix)" },
          { key: "Potencial de Guarda", value: "2 años" },
          { key: "ABV", value: "13.5%" },
        ],
        stock: { total: "26", reservado: "2", disponible: "24" },
      },
    ],
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
      },
    ],
  },
  {
    name: "Baron B Héritage 001",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-BRBH001",
    marca: "Baron B",
    proveedor: "Chandon Argentina",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Extra Brut"] }],

    atributosInformativos: [
      { key: "Varietal", value: "Chardonnay & Pinot Noir" },
      { key: "Línea", value: "Hérité 001" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Chandon Argentina" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "Larga sobre lías" },
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Baron B Héritage 001",
        sku: "ESP-BRBH001-2001",
        codigoUniversal: "7799990012001",
        codigoProveedor: "BB-H001-2001",
        categoria: "Espumantes",
        marca: "Baron B",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "" },
          { key: "Crianza", value: "Chardonnay/Pinot Noir 2001" },
        ],
        stock: { total: "12", reservado: "2", disponible: "10" },
      },
      {
        name: "Baron B Héritage 001",
        sku: "ESP-BRBH001-2011",
        codigoUniversal: "7799990012011",
        codigoProveedor: "BB-H001-2011",
        categoria: "Espumantes",
        marca: "Baron B",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "" },
          { key: "Crianza", value: "Chardonnay/Pinot Noir 2011" },
        ],
        stock: { total: "10", reservado: "1", disponible: "9" },
      },
      {
        name: "Baron B Héritage 001",
        sku: "ESP-BRBH001-2015",
        codigoUniversal: "7799990012015",
        codigoProveedor: "BB-H001-2015",
        categoria: "Espumantes",
        marca: "Baron B",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "" },
          { key: "Crianza", value: "Chardonnay/Pinot Noir 2015" },
        ],
        stock: { total: "8", reservado: "1", disponible: "7" },
      },
    ],
  },
  {
    name: "Baron B Héritage 003",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-BRBH003",
    marca: "Baron B",
    proveedor: "Chandon Argentina",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Extra Brut"] }],

    atributosInformativos: [
      { key: "Varietal", value: "Chardonnay" },
      { key: "Línea", value: "Hérité 003" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Chandon Argentina" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "Larga sobre lías" },
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Baron B Héritage 003",
        sku: "ESP-BRBH003-2011",
        codigoUniversal: "7799990032011",
        codigoProveedor: "BB-H003-2011",
        categoria: "Espumantes",
        marca: "Baron B",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "" },
          { key: "Crianza", value: "Chardonnay 2011" },
        ],
        stock: { total: "10", reservado: "1", disponible: "9" },
      },
      {
        name: "Baron B Héritage 003",
        sku: "ESP-BRBH003-2015",
        codigoUniversal: "7799990032015",
        codigoProveedor: "BB-H003-2015",
        categoria: "Espumantes",
        marca: "Baron B",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "" },
          { key: "Crianza", value: "Chardonnay 2015" },
        ],
        stock: { total: "9", reservado: "1", disponible: "8" },
      },
      {
        name: "Baron B Héritage 003",
        sku: "ESP-BRBH003-2019",
        codigoUniversal: "7799990032019",
        codigoProveedor: "BB-H003-2019",
        categoria: "Espumantes",
        marca: "Baron B",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "" },
          { key: "Crianza", value: "Chardonnay 2019" },
        ],
        stock: { total: "8", reservado: "1", disponible: "7" },
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
  },
  // =========================
  // CRUZAT
  // =========================
  {
    name: "Cruzat Single Vineyard",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-CRZSVYD",
    marca: "Cruzat",
    proveedor: "Bodega Cruzat",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Extra Brut", "Brut Nature"] }],

    atributosInformativos: [
      { key: "Varietal", value: "" }, // per child
      { key: "Línea", value: "Single Vineyard" },
      { key: "Perfil Sensorial", value: "" }, // per child
      { key: "Bodega", value: "Bodega Cruzat" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per child
      { key: "Enólogo", value: "Equipo enológico Cruzat" },
      { key: "ABV", value: "" }, // per child
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // per child
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 2,
    variants: [
      {
        name: "Cruzat Single Vineyard",
        sku: "ESP-CRZSVYD-EXBR",
        codigoUniversal: "7799901002101",
        codigoProveedor: "CRZ-SV-EXBR",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Chardonnay (Blanc de Blancs)" },
          { key: "Perfil Sensorial", value: "Cítrico, floral, burbuja fina" },
          { key: "Crianza", value: "Crianza sobre lías (método tradicional)" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Ostras, sushi, aperitivos" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
      {
        name: "Cruzat Single Vineyard",
        sku: "ESP-CRZSVYD-BRNT",
        codigoUniversal: "7799901002102",
        codigoProveedor: "CRZ-SV-BRNT-ORG",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Orgánico", value: "Sí" },
          { key: "Varietal", value: "Chardonnay & Pinot Noir" },
          { key: "Perfil Sensorial", value: "Seco, mineral, elegante" },
          { key: "Crianza", value: "Crianza sobre lías (método tradicional)" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Mariscos, quesos suaves" },
        ],
        stock: { total: "14", reservado: "1", disponible: "13" },
      },
    ],
  },

  {
    name: "Cruzat Cuvée",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-CRZCUV",
    marca: "Cruzat",
    proveedor: "Bodega Cruzat",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Brut", "Extra Brut", "Brut Rosé", "Brut Nature"] }],

    atributosInformativos: [
      { key: "Varietal", value: "" }, // per child
      { key: "Línea", value: "Cuvée" },
      { key: "Perfil Sensorial", value: "" }, // per child
      { key: "Bodega", value: "Bodega Cruzat" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per child
      { key: "Enólogo", value: "Equipo enológico Cruzat" },
      { key: "ABV", value: "" }, // per child
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // per child
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 4,
    variants: [
      {
        name: "Cruzat Cuvée",
        sku: "ESP-CRZCUV-BRUT",
        codigoUniversal: "7799901002201",
        codigoProveedor: "CRZ-CUV-BRUT",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Perfil Sensorial", value: "Frutado, fresco, burbuja fina" },
          { key: "Crianza", value: "Método Charmat / crianza corta" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Aperitivos, entradas" },
        ],
        stock: { total: "40", reservado: "4", disponible: "36" },
      },
      {
        name: "Cruzat Cuvée",
        sku: "ESP-CRZCUV-EXBR",
        codigoUniversal: "7799901002202",
        codigoProveedor: "CRZ-CUV-EXBR",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Perfil Sensorial", value: "Cítrico, seco, elegante" },
          { key: "Crianza", value: "Método tradicional, crianza sobre lías" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Sushi, mariscos" },
        ],
        stock: { total: "34", reservado: "3", disponible: "31" },
      },
      {
        name: "Cruzat Cuvée",
        sku: "ESP-CRZCUV-BRRS",
        codigoUniversal: "7799901002203",
        codigoProveedor: "CRZ-CUV-BRRS",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend (base Pinot Noir / Malbec)" },
          { key: "Perfil Sensorial", value: "Frutos rojos, floral, fresco" },
          { key: "Crianza", value: "Método tradicional, crianza sobre lías" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Salmón, tapeo" },
        ],
        stock: { total: "22", reservado: "2", disponible: "20" },
      },
      {
        name: "Cruzat Cuvée",
        sku: "ESP-CRZCUV-BRNT",
        codigoUniversal: "7799901002204",
        codigoProveedor: "CRZ-CUV-BRNT",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Perfil Sensorial", value: "Muy seco, mineral, final largo" },
          { key: "Crianza", value: "Método tradicional, crianza sobre lías" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Ostras, quesos" },
        ],
        stock: { total: "16", reservado: "1", disponible: "15" },
      },
    ],
  },

  {
    name: "Cruzat Premier",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-CRZPRM",
    marca: "Cruzat",
    proveedor: "Bodega Cruzat",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Extra Brut", "Extra Brut Rosé", "Brut Nature"] }],

    atributosInformativos: [
      { key: "Varietal", value: "" }, // per child
      { key: "Línea", value: "Premier" },
      { key: "Perfil Sensorial", value: "" }, // per child
      { key: "Bodega", value: "Bodega Cruzat" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "Larga sobre lías" },
      { key: "Enólogo", value: "Equipo enológico Cruzat" },
      { key: "ABV", value: "" }, // per child
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // per child
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Cruzat Premier",
        sku: "ESP-CRZPRM-EXBR",
        codigoUniversal: "7799901002301",
        codigoProveedor: "CRZ-PRM-EXBR",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Chardonnay & Pinot Noir" },
          { key: "Perfil Sensorial", value: "Cítrico, brioche, burbuja fina" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Mariscos, cocina fina" },
        ],
        stock: { total: "12", reservado: "1", disponible: "11" },
      },
      {
        name: "Cruzat Premier",
        sku: "ESP-CRZPRM-EXRS",
        codigoUniversal: "7799901002302",
        codigoProveedor: "CRZ-PRM-EXRS",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Pinot Noir (rosé)" },
          { key: "Perfil Sensorial", value: "Frutos rojos, floral, elegante" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Salmón, tapas" },
        ],
        stock: { total: "10", reservado: "1", disponible: "9" },
      },
      {
        name: "Cruzat Premier",
        sku: "ESP-CRZPRM-BRNT",
        codigoUniversal: "7799901002303",
        codigoProveedor: "CRZ-PRM-BRNT",
        categoria: "Espumantes",
        marca: "Cruzat",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Perfil Sensorial", value: "Seco, mineral, final largo" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Ostras, quesos" },
        ],
        stock: { total: "8", reservado: "1", disponible: "7" },
      },
    ],
  },

  // =========================
  // ALMA NEGRA
  // =========================
  {
    name: "Alma Negra",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-ALMNEG",
    marca: "Alma Negra",
    proveedor: "Tikal (Ernesto Catena)",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Brut Nature", "Brut Nature Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Alma Negra" },
      { key: "Perfil Sensorial", value: "" }, // per child
      { key: "Bodega", value: "Tikal" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "Método tradicional, crianza sobre lías" },
      { key: "Enólogo", value: "Equipo enológico" },
      { key: "ABV", value: "12%" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // per child
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 2,
    variants: [
      {
        name: "Alma Negra",
        sku: "ESP-ALMNEG-BRNT",
        codigoUniversal: "7799901002401",
        codigoProveedor: "ALMN-EPN-BRNT",
        categoria: "Espumantes",
        marca: "Alma Negra",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Seco, cítrico, burbuja fina" },
          { key: "Maridaje", value: "Mariscos, aperitivos" },
        ],
        stock: { total: "20", reservado: "2", disponible: "18" },
      },
      {
        name: "Alma Negra",
        sku: "ESP-ALMNEG-BRRS",
        codigoUniversal: "7799901002402",
        codigoProveedor: "ALMN-EPN-BRRS",
        categoria: "Espumantes",
        marca: "Alma Negra",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature Rosé" }],
        atributosInformativos: [
          { key: "Perfil Sensorial", value: "Frutos rojos, seco, elegante" },
          { key: "Maridaje", value: "Salmón, tapeo" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },
    ],
  },

  // =========================
  // LUIGI BOSCA (standalone)
  // =========================
  {
    name: "Luigi Bosca",
    categoria: "Espumantes",
    hasVariants: false,
    isAgrupador: false,
    sku: "ESP-LBOSCA-EXBR",
    codigoUniversal: "7799901002501",
    codigoProveedor: "LB-ESP-EXBR-750",
    marca: "Luigi Bosca",
    proveedor: "Luigi Bosca (Familia Arizu)",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "18", reservado: "2", disponible: "16" },

    atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Espumante" },
      { key: "Perfil Sensorial", value: "Cítrico, brioche, burbuja fina" },
      { key: "Bodega", value: "Luigi Bosca" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "Crianza sobre lías" },
      { key: "Enólogo", value: "Equipo enológico" },
      { key: "ABV", value: "12%" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "Mariscos, sushi" },
      { key: "Estuche", value: "Sin estuche" },
    ],
  },

  // =========================
  // LAGARDE (2 agrupadores/lineas -> 1 agrupador con 2 dosajes)
  // =========================
  {
    name: "Lagarde",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-LAGARD",
    marca: "Lagarde",
    proveedor: "Bodega Lagarde",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Extra Brut", "Brut Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "" }, // per child
      { key: "Línea", value: "Espumante" },
      { key: "Perfil Sensorial", value: "" }, // per child
      { key: "Bodega", value: "Bodega Lagarde" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // per child
      { key: "Enólogo", value: "Equipo enológico Lagarde" },
      { key: "ABV", value: "" }, // per child
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // per child
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 2,
    variants: [
      {
        name: "Lagarde",
        sku: "ESP-LAGARD-EXBR",
        codigoUniversal: "7799901002601",
        codigoProveedor: "LAG-ESP-EXBR",
        categoria: "Espumantes",
        marca: "Lagarde",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Chardonnay & Pinot Noir" },
          { key: "Perfil Sensorial", value: "Cítrico, seco, elegante" },
          { key: "Crianza", value: "Crianza sobre lías" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Aperitivos, mariscos" },
        ],
        stock: { total: "14", reservado: "2", disponible: "12" },
      },
      {
        name: "Lagarde",
        sku: "ESP-LAGARD-BRRS",
        codigoUniversal: "7799901002602",
        codigoProveedor: "LAG-ESP-BRRS",
        categoria: "Espumantes",
        marca: "Lagarde",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend (rosé)" },
          { key: "Perfil Sensorial", value: "Frutos rojos, fresco, burbuja fina" },
          { key: "Crianza", value: "Crianza sobre lías" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Salmón, tapeo" },
        ],
        stock: { total: "12", reservado: "1", disponible: "11" },
      },
    ],
  },

  // =========================
  // BRESSIA (2 lineas -> 1 agrupador Royale con 2 dosajes)
  // =========================
  {
    name: "Bressia Royale",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-BRROY",
    marca: "Bressia",
    proveedor: "Bodega Bressia",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Brut Nature", "Brut Nature Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "" }, // per child
      { key: "Línea", value: "Royale" },
      { key: "Perfil Sensorial", value: "" }, // per child
      { key: "Bodega", value: "Bodega Bressia" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "Crianza sobre lías" },
      { key: "Enólogo", value: "Equipo enológico Bressia" },
      { key: "ABV", value: "12%" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // per child
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 2,
    variants: [
      {
        name: "Bressia Royale",
        sku: "ESP-BRROY-BRNT",
        codigoUniversal: "7799901002701",
        codigoProveedor: "BRE-ROY-BRNT",
        categoria: "Espumantes",
        marca: "Bressia",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Varietal", value: "Pinot Noir & Chardonnay" },
          { key: "Perfil Sensorial", value: "Seco, mineral, burbuja fina" },
          { key: "Maridaje", value: "Ostras, mariscos" },
        ],
        stock: { total: "10", reservado: "1", disponible: "9" },
      },
      {
        name: "Bressia Royale",
        sku: "ESP-BRROY-BRRS",
        codigoUniversal: "7799901002702",
        codigoProveedor: "BRE-ROY-BRRS",
        categoria: "Espumantes",
        marca: "Bressia",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Pinot Noir (rosé)" },
          { key: "Perfil Sensorial", value: "Frutos rojos, seco, elegante" },
          { key: "Maridaje", value: "Salmón, sushi" },
        ],
        stock: { total: "8", reservado: "1", disponible: "7" },
      },
    ],
  },

  // --- NORTON (agrupador por dosaje) ---
  {
    name: "Norton",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-NORTON",
    marca: "Norton",
    proveedor: "Bodega Norton",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Extra Brut", "Brut Nature", "Brut Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "" }, // por hijo
      { key: "Línea", value: "Espumantes" },
      { key: "Perfil Sensorial", value: "" }, // por hijo
      { key: "Bodega", value: "Bodega Norton" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" }, // por hijo
      { key: "Enólogo", value: "" },
      { key: "ABV", value: "" }, // por hijo
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" }, // por hijo
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Norton",
        sku: "ESP-NORTON-EXBR",
        codigoUniversal: "7798123401058",
        codigoProveedor: "NOR-ESP-EXBR-750",
        categoria: "Espumantes",
        marca: "Norton",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Perfil Sensorial", value: "Fresco y frutal, burbuja fina" },
          { key: "Crianza", value: "" },
          { key: "ABV", value: "12%" },
          { key: "Maridaje", value: "Aperitivos, pescados, mariscos" },
        ],
        stock: { total: "22", reservado: "3", disponible: "19" },
      },
      {
        name: "Norton",
        sku: "ESP-NORTON-BRNA",
        codigoUniversal: "7798123401065",
        codigoProveedor: "NOR-ESP-BRNA-750",
        categoria: "Espumantes",
        marca: "Norton",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Varietal", value: "" },
          { key: "Perfil Sensorial", value: "Seco, elegante y mineral" },
          { key: "Crianza", value: "" },
          { key: "ABV", value: "" },
          { key: "Maridaje", value: "Ostras, sushi, quesos suaves" },
        ],
        stock: { total: "14", reservado: "2", disponible: "12" },
      },
      {
        name: "Norton",
        sku: "ESP-NORTON-BRRO",
        codigoUniversal: "7798123401072",
        codigoProveedor: "NOR-ESP-BRRO-750",
        categoria: "Espumantes",
        marca: "Norton",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "" },
          { key: "Perfil Sensorial", value: "Frutos rojos y frescura" },
          { key: "Crianza", value: "" },
          { key: "ABV", value: "" },
          { key: "Maridaje", value: "Salmón, sushi, tapas" },
        ],
        stock: { total: "12", reservado: "1", disponible: "11" },
      },
    ],
  },

  // =========================
  // ALTA VISTA
  // =========================
  {
    name: "Alta Vista Atemporal",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-ALTVAT-ATMP",
    marca: "Alta Vista",
    proveedor: "Bodega Alta Vista",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Brut", "Extra Brut", "Brut Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Atemporal" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Bodega Alta Vista" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" },
      { key: "Enólogo", value: "Equipo Enológico Alta Vista" },
      { key: "ABV", value: "" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Alta Vista Atemporal",
        sku: "ESP-ALTVAT-BRUT",
        codigoUniversal: "7799002000002",
        codigoProveedor: "ALTV-ATMP-BRUT-750",
        categoria: "Espumantes",
        marca: "Alta Vista",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Atemporal" },
          { key: "Perfil Sensorial", value: "Fresco, frutal, burbuja fina" },
          { key: "Bodega", value: "Bodega Alta Vista" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Alta Vista" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Aperitivos, mariscos, sushi" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "24", reservado: "3", disponible: "21" },
      },
      {
        name: "Alta Vista Atemporal",
        sku: "ESP-ALTVAT-EXBR",
        codigoUniversal: "7799002000019",
        codigoProveedor: "ALTV-ATMP-EXBR-750",
        categoria: "Espumantes",
        marca: "Alta Vista",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Atemporal" },
          { key: "Perfil Sensorial", value: "Seco, cítrico, elegante" },
          { key: "Bodega", value: "Bodega Alta Vista" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Alta Vista" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Ostras, quesos suaves, sushi" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
      {
        name: "Alta Vista Atemporal",
        sku: "ESP-ALTVAT-BRRO",
        codigoUniversal: "7799002000026",
        codigoProveedor: "ALTV-ATMP-BRRO-750",
        categoria: "Espumantes",
        marca: "Alta Vista",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Atemporal" },
          { key: "Perfil Sensorial", value: "Frutos rojos, floral, suave" },
          { key: "Bodega", value: "Bodega Alta Vista" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Alta Vista" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Salmón, entradas, postres frutales" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "14", reservado: "2", disponible: "12" },
      },
    ],
  },

  // =========================
  // DOMAINE BOUSQUET (ONE agrupador only) — ORGANIC
  // =========================
  {
    name: "Domaine Bousquet Organic",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-DBOORG",
    marca: "Domaine Bousquet",
    proveedor: "Domaine Bousquet",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Brut", "Extra Brut", "Brut Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Organic" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Domaine Bousquet" },
      { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
      { key: "Crianza", value: "" },
      { key: "Enólogo", value: "Equipo Enológico Domaine Bousquet" },
      { key: "ABV", value: "" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Domaine Bousquet Organic",
        sku: "ESP-DBOORG-BRUT",
        codigoUniversal: "7799002000033",
        codigoProveedor: "DBO-ORG-BRUT-750",
        categoria: "Espumantes",
        marca: "Domaine Bousquet",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut" }],
        atributosInformativos: [
          { key: "Orgánico", value: "Sí" },
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Organic" },
          { key: "Perfil Sensorial", value: "Fresco, manzana, cítrico" },
          { key: "Bodega", value: "Domaine Bousquet" },
          { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Domaine Bousquet" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Aperitivos, pescados, ensaladas" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "20", reservado: "2", disponible: "18" },
      },
      {
        name: "Domaine Bousquet Organic",
        sku: "ESP-DBOORG-EXBR",
        codigoUniversal: "7799002000040",
        codigoProveedor: "DBO-ORG-EXBR-750",
        categoria: "Espumantes",
        marca: "Domaine Bousquet",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Orgánico", value: "Sí" },
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Organic" },
          { key: "Perfil Sensorial", value: "Seco, cítrico, mineral" },
          { key: "Bodega", value: "Domaine Bousquet" },
          { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Domaine Bousquet" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Mariscos, sushi, quesos suaves" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },
      {
        name: "Domaine Bousquet Organic",
        sku: "ESP-DBOORG-BRRO",
        codigoUniversal: "7799002000057",
        codigoProveedor: "DBO-ORG-BRRO-750",
        categoria: "Espumantes",
        marca: "Domaine Bousquet",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Orgánico", value: "Sí" },
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Organic" },
          { key: "Perfil Sensorial", value: "Frutilla, cereza, floral" },
          { key: "Bodega", value: "Domaine Bousquet" },
          { key: "Origen", value: "Valle de Uco, Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Domaine Bousquet" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Aperitivos, sushi, postres frutales" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "12", reservado: "1", disponible: "11" },
      },
    ],
  },

  // =========================
  // NIETO SENETINER
  // =========================
  {
    name: "Nieto Senetiner",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-NIETSEN",
    marca: "Nieto Senetiner",
    proveedor: "Bodega Nieto Senetiner",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Dosaje", variantes: ["Brut Nature", "Extra Brut", "Brut Rosé"] }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Espumante" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Bodega Nieto Senetiner" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" },
      { key: "Enólogo", value: "Equipo Enológico Nieto Senetiner" },
      { key: "ABV", value: "" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Nieto Senetiner",
        sku: "ESP-NIETSEN-BRNA",
        codigoUniversal: "7799002000064",
        codigoProveedor: "NIETO-ESP-BRNA-750",
        categoria: "Espumantes",
        marca: "Nieto Senetiner",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Espumante" },
          { key: "Perfil Sensorial", value: "Muy seco, cítrico, mineral" },
          { key: "Bodega", value: "Bodega Nieto Senetiner" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Nieto Senetiner" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Ostras, sushi, quesos suaves" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "14", reservado: "2", disponible: "12" },
      },
      {
        name: "Nieto Senetiner",
        sku: "ESP-NIETSEN-EXBR",
        codigoUniversal: "7799002000071",
        codigoProveedor: "NIETO-ESP-EXBR-750",
        categoria: "Espumantes",
        marca: "Nieto Senetiner",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Espumante" },
          { key: "Perfil Sensorial", value: "Seco, manzana verde, elegante" },
          { key: "Bodega", value: "Bodega Nieto Senetiner" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Nieto Senetiner" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Aperitivos, pescados, sushi" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "18", reservado: "2", disponible: "16" },
      },
      {
        name: "Nieto Senetiner",
        sku: "ESP-NIETSEN-BRRO",
        codigoUniversal: "7799002000088",
        codigoProveedor: "NIETO-ESP-BRRO-750",
        categoria: "Espumantes",
        marca: "Nieto Senetiner",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Espumante" },
          { key: "Perfil Sensorial", value: "Frutos rojos, floral, fresco" },
          { key: "Bodega", value: "Bodega Nieto Senetiner" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Nieto Senetiner" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Entradas, salmón, postres frutales" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "12", reservado: "1", disponible: "11" },
      },
    ],
  },

  // =========================
  // BIANCHI
  // =========================
  {
    name: "Bianchi Particular",
    categoria: "Espumantes",
    hasVariants: false,
    isAgrupador: false,
    sku: "ESP-BIANPAR-BRUT",
    codigoUniversal: "7799002000095",
    marca: "Bianchi",
    proveedor: "Bodegas Bianchi",
    codigoProveedor: "BIAN-PART-BRUT-750",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: {
      total: "18",
      reservado: "2",
      disponible: "16",
    },

    atributosPrincipales: [{ key: "Dosaje", value: "Brut" }],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Particular" },
      { key: "Perfil Sensorial", value: "Fresco, cítrico, burbuja fina" },
      { key: "Bodega", value: "Bodegas Bianchi" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "Método Charmat" },
      { key: "Enólogo", value: "Equipo Enológico Bianchi" },
      { key: "ABV", value: "12%" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "Aperitivos, mariscos, ensaladas" },
      { key: "Estuche", value: "Sin estuche" },
    ],
  },

  // =========================
  // CHANDON
  // =========================
  {
    name: "Chandon",
    categoria: "Espumantes",
    hasVariants: true,
    isAgrupador: true,
    sku: "ESP-CHANDON",
    marca: "Chandon",
    proveedor: "Chandon Argentina",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [
      { key: "Dosaje", variantes: ["Brut Nature", "Extra Brut", "Brut", "Demi Sec", "Brut Rosé"] },
    ],

    atributosInformativos: [
      { key: "Varietal", value: "Blend" },
      { key: "Línea", value: "Chandon" },
      { key: "Perfil Sensorial", value: "" },
      { key: "Bodega", value: "Chandon Argentina" },
      { key: "Origen", value: "Mendoza, Argentina" },
      { key: "Crianza", value: "" },
      { key: "Enólogo", value: "Equipo Enológico Chandon" },
      { key: "ABV", value: "" },
      { key: "Temperatura de Servicio", value: "6–8°C" },
      { key: "Maridaje", value: "" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 5,
    variants: [
      {
        name: "Chandon",
        sku: "ESP-CHANDON-BRNA",
        codigoUniversal: "7799002000101",
        codigoProveedor: "CHAN-BRNA-750",
        categoria: "Espumantes",
        marca: "Chandon",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Nature" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Chandon" },
          { key: "Perfil Sensorial", value: "Muy seco, cítrico, mineral" },
          { key: "Bodega", value: "Chandon Argentina" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Chandon" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Ostras, sushi, quesos suaves" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "20", reservado: "2", disponible: "18" },
      },
      {
        name: "Chandon",
        sku: "ESP-CHANDON-EXBR",
        codigoUniversal: "7799002000118",
        codigoProveedor: "CHAN-EXBR-750",
        categoria: "Espumantes",
        marca: "Chandon",
        atributosPrincipales: [{ key: "Dosaje", value: "Extra Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Chandon" },
          { key: "Perfil Sensorial", value: "Seco, manzana verde, elegante" },
          { key: "Bodega", value: "Chandon Argentina" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Chandon" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Aperitivos, pescados, sushi" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "24", reservado: "3", disponible: "21" },
      },
      {
        name: "Chandon",
        sku: "ESP-CHANDON-BRUT",
        codigoUniversal: "7799002000125",
        codigoProveedor: "CHAN-BRUT-750",
        categoria: "Espumantes",
        marca: "Chandon",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Chandon" },
          { key: "Perfil Sensorial", value: "Fresco, frutal, burbuja fina" },
          { key: "Bodega", value: "Chandon Argentina" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Chandon" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Aperitivos, entradas, ensaladas" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "30", reservado: "4", disponible: "26" },
      },
      {
        name: "Chandon",
        sku: "ESP-CHANDON-DMSE",
        codigoUniversal: "7799002000132",
        codigoProveedor: "CHAN-DMSE-750",
        categoria: "Espumantes",
        marca: "Chandon",
        atributosPrincipales: [{ key: "Dosaje", value: "Demi Sec" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Chandon" },
          { key: "Perfil Sensorial", value: "Dulce amable, frutado, floral" },
          { key: "Bodega", value: "Chandon Argentina" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Chandon" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Postres, frutas, quesos suaves" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "16", reservado: "2", disponible: "14" },
      },
      {
        name: "Chandon",
        sku: "ESP-CHANDON-BRRO",
        codigoUniversal: "7799002000149",
        codigoProveedor: "CHAN-BRRO-750",
        categoria: "Espumantes",
        marca: "Chandon",
        atributosPrincipales: [{ key: "Dosaje", value: "Brut Rosé" }],
        atributosInformativos: [
          { key: "Varietal", value: "Blend" },
          { key: "Línea", value: "Chandon" },
          { key: "Perfil Sensorial", value: "Frutos rojos, floral, fresco" },
          { key: "Bodega", value: "Chandon Argentina" },
          { key: "Origen", value: "Mendoza, Argentina" },
          { key: "Crianza", value: "Método Charmat" },
          { key: "Enólogo", value: "Equipo Enológico Chandon" },
          { key: "ABV", value: "12%" },
          { key: "Temperatura de Servicio", value: "6–8°C" },
          { key: "Maridaje", value: "Salmón, entradas, postres frutales" },
          { key: "Estuche", value: "Sin estuche" },
        ],
        stock: { total: "14", reservado: "2", disponible: "12" },
      },
    ],
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
  },

  // ===============================
  // ACONCAGUA SPECIAL EDITION
  // ===============================
  {
    name: "Aconcagua Special Edition",
    categoria: "Gin",
    hasVariants: true,
    isAgrupador: true,
    sku: "GIN-ACONSPC",
    marca: "Aconcagua",
    proveedor: "Destilería Andina",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",

    containerAtributosPrincipales: [{ key: "Sabor", variantes: ["Original", "Red Berries", "Cardamom"] }],

    atributosInformativos: [
      { key: "Estilo", value: "London Dry" },
      { key: "Origen", value: "Argentina" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],

    variantCount: 3,
    variants: [
      {
        name: "Aconcagua Special Edition",
        sku: "GIN-ACSP-ORIG",
        codigoUniversal: "7798765432116",
        categoria: "Gin",
        marca: "Aconcagua",
        atributosPrincipales: [{ key: "Sabor", value: "Original" }],
        atributosInformativos: [],
        stock: { total: "10", reservado: "1", disponible: "9" },
      },
      {
        name: "Aconcagua Special Edition",
        sku: "GIN-ACSP-REDB",
        codigoUniversal: "7798765432123",
        categoria: "Gin",
        marca: "Aconcagua",
        atributosPrincipales: [{ key: "Sabor", value: "Red Berries" }],
        atributosInformativos: [],
        stock: { total: "8", reservado: "1", disponible: "7" },
      },
      {
        name: "Aconcagua Special Edition",
        sku: "GIN-ACSP-CARD",
        codigoUniversal: "7798765432130",
        categoria: "Gin",
        marca: "Aconcagua",
        atributosPrincipales: [{ key: "Sabor", value: "Cardamom" }],
        atributosInformativos: [],
        stock: { total: "8", reservado: "1", disponible: "7" },
      },
    ],
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
  },
  {
    name: "Grey Goose",
    categoria: "Vodka",
    hasVariants: false,
    isAgrupador: false,
    sku: "VDKA-GRGO-ORIG",
    codigoUniversal: "080480280116",
    codigoProveedor: "GG-FR-750",
    marca: "Grey Goose",
    proveedor: "Bacardi",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",

    stock: { total: "24", reservado: "2", disponible: "22" },

    atributosPrincipales: [{ key: "Sabor", value: "Original" }],

    atributosInformativos: [
      { key: "Origen", value: "Francia" },
      { key: "ABV", value: "40%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
  },
  // --- RON: HAVANA CLUB (AGRUPADOR) ---
{
  name: "Havana Club",
  categoria: "Ron",
  hasVariants: true,
  isAgrupador: true,
  sku: "RON-HAVCLUB",
  marca: "Havana Club",
  proveedor: "Havana Club International",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  containerAtributosPrincipales: [
    { key: "Tipo", variantes: ["Añejo 3 Años", "Especial", "Añejo 7 Años"] },
  ],

  atributosInformativos: [
    { key: "Origen", value: "Cuba" },
    { key: "Añejamiento", value: "" }, // per variant
    { key: "ABV", value: "" }, // per variant
    { key: "Estuche", value: "Sin estuche" },
  ],

  variantCount: 3,
  variants: [
    {
      name: "Havana Club",
      sku: "RON-HAVCLUB-AN3",
      codigoUniversal: "7799002001001",
      codigoProveedor: "HC-AN3-750",
      categoria: "Ron",
      marca: "Havana Club",
      atributosPrincipales: [{ key: "Tipo", value: "Añejo 3 Años" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "3 años" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "30", reservado: "4", disponible: "26" },
    },
    {
      name: "Havana Club",
      sku: "RON-HAVCLUB-ESPC",
      codigoUniversal: "7799002001002",
      codigoProveedor: "HC-ESP-750",
      categoria: "Ron",
      marca: "Havana Club",
      atributosPrincipales: [{ key: "Tipo", value: "Especial" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Blend añejado (no especificado)" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "26", reservado: "3", disponible: "23" },
    },
    {
      name: "Havana Club",
      sku: "RON-HAVCLUB-AN7",
      codigoUniversal: "7799002001003",
      codigoProveedor: "HC-AN7-750",
      categoria: "Ron",
      marca: "Havana Club",
      atributosPrincipales: [{ key: "Tipo", value: "Añejo 7 Años" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "7 años" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "18", reservado: "2", disponible: "16" },
    },
  ],
},

// --- RON: BACARDI (AGRUPADOR) ---
{
  name: "Bacardí",
  categoria: "Ron",
  hasVariants: true,
  isAgrupador: true,
  sku: "RON-BACARDI",
  marca: "Bacardí",
  proveedor: "Bacardi Limited",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  containerAtributosPrincipales: [
    { key: "Tipo", variantes: ["Blanco", "Dorado", "Añejo"] },
  ],

  atributosInformativos: [
    { key: "Origen", value: "Puerto Rico" },
    { key: "Añejamiento", value: "" }, // per variant
    { key: "ABV", value: "" }, // per variant
    { key: "Estuche", value: "Sin estuche" },
  ],

  variantCount: 3,
  variants: [
    {
      name: "Bacardí",
      sku: "RON-BACARDI-BLCO",
      codigoUniversal: "7799002001101",
      codigoProveedor: "BAC-BLC-750",
      categoria: "Ron",
      marca: "Bacardí",
      atributosPrincipales: [{ key: "Tipo", value: "Blanco" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Breve (no especificado)" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "40", reservado: "6", disponible: "34" },
    },
    {
      name: "Bacardí",
      sku: "RON-BACARDI-DORD",
      codigoUniversal: "7799002001102",
      codigoProveedor: "BAC-ORO-750",
      categoria: "Ron",
      marca: "Bacardí",
      atributosPrincipales: [{ key: "Tipo", value: "Dorado" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Añejo (no especificado)" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "32", reservado: "5", disponible: "27" },
    },
    {
      name: "Bacardí",
      sku: "RON-BACARDI-ANJO",
      codigoUniversal: "7799002001103",
      codigoProveedor: "BAC-ANJ-750",
      categoria: "Ron",
      marca: "Bacardí",
      atributosPrincipales: [{ key: "Tipo", value: "Añejo" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Añejo (no especificado)" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "22", reservado: "3", disponible: "19" },
    },
  ],
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
},

// --- TEQUILA: DON JULIO (AGRUPADOR) ---
{
  name: "Don Julio",
  categoria: "Tequila",
  hasVariants: true,
  isAgrupador: true,
  sku: "TEQ-DONJUL",
  marca: "Don Julio",
  proveedor: "Diageo",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  containerAtributosPrincipales: [
    { key: "Tipo", variantes: ["Blanco", "Reposado", "Añejo"] },
  ],

  atributosInformativos: [
    { key: "Origen", value: "México" },
    { key: "Añejamiento", value: "" }, // per variant
    { key: "ABV", value: "" }, // per variant
    { key: "Estuche", value: "Sin estuche" },
  ],

  variantCount: 3,
  variants: [
    {
      name: "Don Julio",
      sku: "TEQ-DONJUL-BLCO",
      codigoUniversal: "7799002001301",
      codigoProveedor: "DJ-BLC-750",
      categoria: "Tequila",
      marca: "Don Julio",
      atributosPrincipales: [{ key: "Tipo", value: "Blanco" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Sin añejamiento" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "18", reservado: "2", disponible: "16" },
    },
    {
      name: "Don Julio",
      sku: "TEQ-DONJUL-REPO",
      codigoUniversal: "7799002001302",
      codigoProveedor: "DJ-REP-750",
      categoria: "Tequila",
      marca: "Don Julio",
      atributosPrincipales: [{ key: "Tipo", value: "Reposado" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Reposado (no especificado)" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "14", reservado: "2", disponible: "12" },
    },
    {
      name: "Don Julio",
      sku: "TEQ-DONJUL-ANJO",
      codigoUniversal: "7799002001303",
      codigoProveedor: "DJ-ANJ-750",
      categoria: "Tequila",
      marca: "Don Julio",
      atributosPrincipales: [{ key: "Tipo", value: "Añejo" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Añejo (no especificado)" },
        { key: "ABV", value: "40%" },
      ],
      stock: { total: "10", reservado: "1", disponible: "9" },
    },
  ],
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
    },
  ],
},

{
  name: "Johnnie Walker 1 L",
  categoria: "Whiskies",
  hasVariants: true,
  isAgrupador: true,
  sku: "WHKY-JW1L",
  marca: "Johnnie Walker",
  proveedor: "Diageo",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 1000,
  volumenUnidad: "ml",

  containerAtributosPrincipales: [
    { key: "Línea", variantes: ["Red Label", "Black Label"] },
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

  variantCount: 2,
  variants: [
    {
      name: "Johnnie Walker 1 L",
      sku: "WHKY-JW1L-RED",
      codigoUniversal: "5000267011110",
      codigoProveedor: "JW-RED-1L",
      categoria: "Whiskies",
      marca: "Johnnie Walker",
      atributosPrincipales: [{ key: "Línea", value: "Red Label" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "Sin declaración de edad" },
        { key: "ABV", value: "40%" },
        { key: "Estuche", value: "Sin estuche" },
      ],
      stock: { total: "30", reservado: "4", disponible: "26" },
    },
    {
      name: "Johnnie Walker 1 L",
      sku: "WHKY-JW1L-BLACK",
      codigoUniversal: "5000267024318",
      codigoProveedor: "JW-BLACK-1L",
      categoria: "Whiskies",
      marca: "Johnnie Walker",
      atributosPrincipales: [{ key: "Línea", value: "Black Label" }],
      atributosInformativos: [
        { key: "Añejamiento", value: "12 años" },
        { key: "ABV", value: "40%" },
        { key: "Estuche", value: "Caja" },
      ],
      stock: { total: "20", reservado: "3", disponible: "17" },
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
},

{
  name: "Jack Daniel’s Tennessee Honey",
  categoria: "Whiskies",
  hasVariants: false,
  isAgrupador: false,
  sku: "WHKY-JD-HONEY",
  codigoUniversal: "5099873021343",
  marca: "Jack Daniel’s",
  proveedor: "Brown-Forman",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  stock: { total: "28", reservado: "4", disponible: "24" },

  atributosPrincipales: [{ key: "Línea", value: "Tennessee Honey" }],
  atributosInformativos: [
    { key: "Tipo de Whisky", value: "Tennessee con licor de miel" },
    { key: "Método de Elaboración", value: "Blended" },
    { key: "Origen", value: "Estados Unidos" },
    { key: "Añejamiento", value: "Sin declaración de edad" },
    { key: "Tipo de Barrica", value: "Roble americano" },
    { key: "ABV", value: "35%" },
    { key: "Estuche", value: "Sin estuche" },
  ],
},

{
  name: "Jack Daniel’s Single Barrel",
  categoria: "Whiskies",
  hasVariants: false,
  isAgrupador: false,
  sku: "WHKY-JD-SBAR",
  codigoUniversal: "5099873018008",
  marca: "Jack Daniel’s",
  proveedor: "Brown-Forman",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  stock: { total: "18", reservado: "2", disponible: "16" },

  atributosPrincipales: [{ key: "Línea", value: "Single Barrel" }],
  atributosInformativos: [
    { key: "Tipo de Whisky", value: "Tennessee" },
    { key: "Método de Elaboración", value: "Single Barrel" },
    { key: "Origen", value: "Estados Unidos" },
    { key: "Añejamiento", value: "Selección especial" },
    { key: "Tipo de Barrica", value: "Roble americano tostado" },
    { key: "ABV", value: "45%" },
    { key: "Estuche", value: "Caja" },
  ],
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
},
// --- LICORES ---
  //LICORES
  {
    name: "Jägermeister 700ml",
    categoria: "Licores",
    hasVariants: false,
    isAgrupador: false,
    sku: "LICR-JGRM700-ORIG",
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
    atributosPrincipales: [{ key: "Sabor", value: "Original" }],
    atributosInformativos: [
      { key: "Tipo de Licor", value: "Licor herbal amargo" },
      { key: "Origen", value: "Alemania" },
      { key: "ABV", value: "35%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
  },
  {
    name: "Sheridan's Original",
    categoria: "Licores",
    hasVariants: false,
    isAgrupador: false,
    sku: "LICR-SHER700-CACR",
    codigoUniversal: "5391530012345",
    marca: "Sheridan's",
    proveedor: "Diageo",
    codigoProveedor: "DIA-SHER-700",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 700,
    volumenUnidad: "ml",
    stock: {
      total: "36",
      reservado: "5",
      disponible: "31",
    },
    atributosPrincipales: [{ key: "Sabor", value: "Café y crema" }],
    atributosInformativos: [
      { key: "Tipo de Licor", value: "Licor de crema y café" },
      { key: "Origen", value: "Irlanda" },
      { key: "ABV", value: "15.5%" },
      { key: "Estuche", value: "Sin estuche" },
    ],
  },

// FIREBALL
{
  name: "Fireball 750 ml",
  categoria: "Licores",
  hasVariants: false,
  isAgrupador: false,
  sku: "LICR-FIRB750-CANE",
  codigoUniversal: "088004009303",
  marca: "Fireball",
  proveedor: "Sazerac Company",
  codigoProveedor: "SAZ-FIRB-750-CANE",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  stock: { total: "24", reservado: "3", disponible: "21" },

  atributosPrincipales: [{ key: "Sabor", value: "Canela" }],
  atributosInformativos: [
    { key: "Tipo de Licor", value: "Licor de whisky y canela" },
    { key: "Origen", value: "Canadá" },
    { key: "ABV", value: "33%" },
    { key: "Estuche", value: "Sin estuche" },
  ],
},

// COINTREAU
{
  name: "Cointreau 700 ml",
  categoria: "Licores",
  hasVariants: false,
  isAgrupador: false,
  sku: "LICR-COIN700-ORIG",
  codigoUniversal: "07035542004202",
  marca: "Cointreau",
  proveedor: "Rémy Cointreau",
  codigoProveedor: "RC-COIN-700-ORIG",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 700,
  volumenUnidad: "ml",

  stock: { total: "18", reservado: "2", disponible: "16" },

  atributosPrincipales: [{ key: "Sabor", value: "Original" }],
  atributosInformativos: [
    { key: "Tipo de Licor", value: "Triple sec (licor de naranja)" },
    { key: "Origen", value: "Francia" },
    { key: "ABV", value: "40%" },
    { key: "Estuche", value: "Sin estuche" },
  ],
},

// BAILEYS (AGRUPADOR)
{
  name: "Baileys",
  categoria: "Licores",
  hasVariants: true,
  isAgrupador: true,
  sku: "LICR-BAILYS",
  marca: "Baileys",
  proveedor: "Diageo",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  containerAtributosPrincipales: [
    { key: "Sabor", variantes: ["Original", "Chocolate Luxe", "Salted Caramel", "Strawberries & Cream"] },
  ],

  atributosInformativos: [
    { key: "Tipo de Licor", value: "Licor de crema" },
    { key: "Origen", value: "Irlanda" },
    { key: "ABV", value: "17%" },
    { key: "Estuche", value: "Sin estuche" },
  ],

  variantCount: 4,
  variants: [
    {
      name: "Baileys",
      sku: "LICR-BAIO750-ORIG",
      codigoUniversal: "5011013100132",
      codigoProveedor: "DIA-BAIO-750-ORIG",
      categoria: "Licores",
      marca: "Baileys",
      atributosPrincipales: [{ key: "Sabor", value: "Original" }],
      stock: { total: "30", reservado: "4", disponible: "26" },
    },
    {
      name: "Baileys",
      sku: "LICR-BAIO750-CHOC",
      codigoUniversal: "5011013933877",
      codigoProveedor: "DIA-BAIO-750-CHOC",
      categoria: "Licores",
      marca: "Baileys",
      atributosPrincipales: [{ key: "Sabor", value: "Chocolate Luxe" }],
      stock: { total: "14", reservado: "2", disponible: "12" },
    },
    {
      name: "Baileys",
      sku: "LICR-BAIO750-CARA",
      codigoUniversal: "5011013935048",
      codigoProveedor: "DIA-BAIO-750-CARA",
      categoria: "Licores",
      marca: "Baileys",
      atributosPrincipales: [{ key: "Sabor", value: "Salted Caramel" }],
      stock: { total: "16", reservado: "2", disponible: "14" },
    },
    {
      name: "Baileys",
      sku: "LICR-BAIO750-STCR",
      codigoUniversal: "5011013935055",
      codigoProveedor: "DIA-BAIO-750-STCR",
      categoria: "Licores",
      marca: "Baileys",
      atributosPrincipales: [{ key: "Sabor", value: "Strawberries & Cream" }],
      stock: { total: "12", reservado: "1", disponible: "11" },
    },
  ],
},

// WILD AFRICA CREAM
{
  name: "Wild Africa Cream 750 ml",
  categoria: "Licores",
  hasVariants: false,
  isAgrupador: false,
  sku: "LICR-WAFC750-CREM",
  codigoUniversal: "6009653011924",
  marca: "Wild Africa Cream",
  proveedor: "Wild Africa Cream",
  codigoProveedor: "WAC-WAFC-750-CREM",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 750,
  volumenUnidad: "ml",

  stock: { total: "16", reservado: "2", disponible: "14" },

  atributosPrincipales: [{ key: "Sabor", value: "Crema" }],
  atributosInformativos: [
    { key: "Tipo de Licor", value: "Licor de crema" },
    { key: "Origen", value: "Sudáfrica" },
    { key: "ABV", value: "15%" },
    { key: "Estuche", value: "Sin estuche" },
  ],
},

// STREGA
{
  name: "Strega 700 ml",
  categoria: "Licores",
  hasVariants: false,
  isAgrupador: false,
  sku: "LICR-STRE700-ORIG",
  codigoUniversal: "0000080220718",
  marca: "Strega",
  proveedor: "Strega Alberti",
  codigoProveedor: "STA-STRE-700-ORIG",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 700,
  volumenUnidad: "ml",

  stock: { total: "14", reservado: "2", disponible: "12" },

  atributosPrincipales: [{ key: "Sabor", value: "Original" }],
  atributosInformativos: [
    { key: "Tipo de Licor", value: "Licor herbal" },
    { key: "Origen", value: "Italia" },
    { key: "ABV", value: "40%" },
    { key: "Estuche", value: "Sin estuche" },
  ],
},

// TOFKA
{
  name: "Tofka 700 ml",
  categoria: "Licores",
  hasVariants: false,
  isAgrupador: false,
  sku: "LICR-TOFK700-TOFF",
  codigoUniversal: "5060049029993",
  marca: "Tofka",
  proveedor: "Tofka",
  codigoProveedor: "TOF-TOFK-700-TOFF",
  formatoVenta: "unidad",
  volumenActive: true,
  volumenCantidad: 700,
  volumenUnidad: "ml",

  stock: { total: "12", reservado: "1", disponible: "11" },

  atributosPrincipales: [{ key: "Sabor", value: "Toffee" }],
  atributosInformativos: [
    { key: "Tipo de Licor", value: "Licor a base de vodka sabor toffee" },
    { key: "Origen", value: "Reino Unido" },
    { key: "ABV", value: "35%" },
    { key: "Estuche", value: "Sin estuche" },
  ],
}


]
