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
    { key: "Varietal", variantes: ["Tempranillo", "Syrah", "Chardonnay", "Cabernet", "Sauvignon Blanc", "Torrontés", "Malbec Rosado"] },
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
        { key: "Perfil Sensorial", value: "Fruta negra intensa y chocolate con final especiado" }, // see tasting notes patterns :contentReference[oaicite:1]{index=1}
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
  codigoUniversal: "7799002000001",        // generated
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
      atributosInformativos: [
        { key: "Perfil Sensorial", value: "Fruta roja, taninos suaves" },
      ],
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
      atributosInformativos: [
        { key: "Perfil Sensorial", value: "Cítrico, notas a manzana verde" },
      ],
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
      atributosInformativos: [
        { key: "Perfil Sensorial", value: "Fruta roja y frescor" },
      ],
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
  atributosPrincipales: [
    { key: "Sabor", value: "Original" },
  ],
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
  atributosPrincipales: [
    { key: "Sabor", value: "Café y crema" },
  ],
  atributosInformativos: [
    { key: "Tipo de Licor", value: "Licor de crema y café" },
    { key: "Origen", value: "Irlanda" },
    { key: "ABV", value: "15.5%" },
    { key: "Estuche", value: "Sin estuche" },
  ],
}
]
