import type { Item } from "../types"

export const INITIAL_ITEMS: Item[] = [
  {
    name: "Item Sin Atributos 1",
    stock: {
      total: "45",
      reservado: "8",
      disponible: "37",
    },
    hasVariants: false,
    isAgrupador: false,
    sku: "aB12cD34e56",
    codigoUniversal: "7501234567890",
    marca: "",
    proveedor: "",
    codigoProveedor: "",
    atributosPrincipales: [],
    atributosInformativos: [],
  },
  {
    name: "Vino Trapiche Gran Medalla",
    hasVariants: true,
    isAgrupador: true,
    sku: "VINO-TRAPI",
    marca: "Trapiche",
    proveedor: "Grupo Peñaflor",
    codigoProveedor: "",
    formatoVenta: "unidad",
    volumenActive: true,
    volumenCantidad: 750,
    volumenUnidad: "ml",
    containerAtributosPrincipales: [
      { key: "Varietal", variantes: ["Malbec", "Cabernet Sauvignon", "Cabernet Franc", "Pinot Noir", "Chardonnay"] },
      { key: "Año", variantes: ["2014", "2020"] },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "" },
      { key: "Bodega", value: "Trapiche" },
      { key: "Origen", value: "Valle de Uco, Mendoza" },
      { key: "Tiempo en Barrica", value: "" },
      { key: "Potencial de Guarda", value: "10 años" },
      { key: "Enólogo", value: "Daniel Pi" },
    ],
    variantCount: 10,
    variants: [
      {
        name: "Vino Trapiche Gran Medalla Malbec 2014",
        sku: "VINO-TRAPI-malbec-2014",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2014" },
        ],
        stock: {
          total: "45",
          reservado: "12",
          disponible: "33",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Malbec 2020",
        sku: "VINO-TRAPI-malbec-2020",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Malbec" },
          { key: "Año", value: "2020" },
        ],
        stock: {
          total: "38",
          reservado: "8",
          disponible: "30",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Cabernet Sauvignon 2014",
        sku: "VINO-TRAPI-cabernet-sauvignon-2014",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2014" },
        ],
        stock: {
          total: "52",
          reservado: "15",
          disponible: "37",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Cabernet Sauvignon 2020",
        sku: "VINO-TRAPI-cabernet-sauvignon-2020",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Sauvignon" },
          { key: "Año", value: "2020" },
        ],
        stock: {
          total: "29",
          reservado: "6",
          disponible: "23",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Cabernet Franc 2014",
        sku: "VINO-TRAPI-cabernet-franc-2014",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2014" },
        ],
        stock: {
          total: "31",
          reservado: "7",
          disponible: "24",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Cabernet Franc 2020",
        sku: "VINO-TRAPI-cabernet-franc-2020",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Cabernet Franc" },
          { key: "Año", value: "2020" },
        ],
        stock: {
          total: "22",
          reservado: "4",
          disponible: "18",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Pinot Noir 2014",
        sku: "VINO-TRAPI-pinot-noir-2014",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Pinot Noir" },
          { key: "Año", value: "2014" },
        ],
        stock: {
          total: "18",
          reservado: "3",
          disponible: "15",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Pinot Noir 2020",
        sku: "VINO-TRAPI-pinot-noir-2020",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Pinot Noir" },
          { key: "Año", value: "2020" },
        ],
        stock: {
          total: "25",
          reservado: "5",
          disponible: "20",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Chardonnay 2014",
        sku: "VINO-TRAPI-chardonnay-2014",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2014" },
        ],
        stock: {
          total: "35",
          reservado: "9",
          disponible: "26",
        },
      },
      {
        name: "Vino Trapiche Gran Medalla Chardonnay 2020",
        sku: "VINO-TRAPI-chardonnay-2020",
        codigoUniversal: "",
        atributosPrincipales: [
          { key: "Varietal", value: "Chardonnay" },
          { key: "Año", value: "2020" },
        ],
        stock: {
          total: "41",
          reservado: "11",
          disponible: "30",
        },
      },
    ],
  },
]
