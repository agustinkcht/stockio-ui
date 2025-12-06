import {
  Store,
  Network,
  ShoppingBag,
  Slack,
  PackagePlus,
  Box,
  Tag,
  TrendingUp,
  HelpCircle,
  Settings,
} from "lucide-react"
import type { SidebarItem, Template } from "./types"

export const SAVED_ATRIBUTOS: Record<string, string[]> = {
  Color: ["Blanco", "Negro", "Marino", "Rojo", "Azul", "Azul Marino"],
  Varietal: ["Malbec", "Cabernet Sauvignon", "Cabernet Franc", "Merlot", "Syrah"],
  Año: [],
  "Tipo de Vino": ["Tinto", "Blanco", "Rosado", "Espumante"],
  Bodega: [],
  Origen: [],
  Crianza: [],
  "Tiempo en Barrica": ["6 meses", "12 meses", "18 meses"],
  "Potencial de Guarda": [],
  Enólogo: [],
  Medida: [],
  "Numero de Cadena": [],
  "Material de Cadena": ["metal", "plástico"],
  Deslizador: ["Standard", "Alt", "O"],
  Grosor: ["40", "50", "60", "80/12", "90/14"],
  Longitud: ["500m", "400m", "10m", "5m", "150cm", "20cm", "25cm", "30cm", "38mm", "32mm"],
  Tamaño: ["12mm", "15mm", "20cm", "25cm"],
  Material: [
    "Poliéster",
    "Algodón",
    "Metal",
    "Plástico",
    "Poliéster/Elastano",
    "Acero",
    "Acero reforzado",
    "Plástico/Metal",
    "Cera",
    "Fibra de Vidrio",
    "Acero inoxidable",
  ],
  Cantidad: ["Pack x100", "Pack x10", "Pack x3", "Pack x4", "10 tubos"],
  Tipo: [
    "Universal",
    "Jeans",
    "Separable",
    "No separable",
    "Profesional",
    "Estándar",
    "Cabeza Plástica",
    "Cabeza Vidrio",
    "Tradicional",
    "Ergonómico",
    "Manual",
    "Lápiz",
    "Triangular",
  ],
  Ancho: ["20mm", "30mm", "18mm", "25mm"],
  Uso: ["Tela", "Universal"],
  Unidades: ["cm/pulgadas"],
  Talla: ["M", "L"],
}

export const TEMPLATES: Template[] = [
  {
    name: "Vinos",
    atributosPrincipales: [
      { key: "Varietal", value: "" },
      { key: "Año", value: "" },
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "" },
      { key: "Bodega", value: "" },
      { key: "Origen", value: "" },
      { key: "Tiempo en Barrica", value: "" },
      { key: "Potencial de Guarda", value: "" },
      { key: "Enólogo", value: "" },
    ],
  },
  {
    name: "Cierres",
    atributosPrincipales: [
      { key: "Medida", value: "" },
      { key: "Color", value: "" },
    ],
    atributosInformativos: [
      { key: "Numero de Cadena", value: "" },
      { key: "Material de Cadena", value: "" },
      { key: "Deslizador", value: "" },
    ],
  },
  {
    name: "Mercería",
    atributosPrincipales: [
      { key: "Color", value: "" },
      { key: "Material", value: "" },
    ],
    atributosInformativos: [
      { key: "Tipo", value: "" },
      { key: "Longitud", value: "" },
      { key: "Cantidad", value: "" },
    ],
  },
]

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    icon: Store,
    label: "Mi Negocio",
    hasDropdown: true,
    dropdownItems: ["Punto de Venta", "Cajas", "Facturación", "Presupuestos", "Clientes"],
  },
  {
    icon: ShoppingBag,
    label: "Canales de Venta",
    hasDropdown: true,
    dropdownItems: ["Ventas", "Facturación", "Compradores"],
  },
  {
    icon: Slack,
    label: "Postventa",
    hasDropdown: true,
    dropdownItems: ["Envíos", "Cambios y Devoluciones", "Cancelaciones"],
  },
  {
    icon: Tag,
    label: "Precios",
    hasDropdown: true,
    dropdownItems: ["Listas de Precios", "Gestión de Ofertas"],
  },
  {
    icon: Box,
    label: "Inventario",
    hasDropdown: true,
    dropdownItems: ["Artículos", "Colecciones", "Categorías", "Marcas", "Atributos", "Depósitos"],
    active: true,
  },
  {
    icon: PackagePlus,
    label: "Compras",
    hasDropdown: true,
    dropdownItems: ["Compras", "Proveedores"],
  },

]

export const BOTTOM_SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: HelpCircle, label: "Soporte" },
  { icon: Settings, label: "Ajustes" },
]

export const DEPOSITS = ["Ibiza", "Trujui", "Ciudadela"] as const

export const IVA_OPTIONS = ["0", "10.5", "21", "27"] as const

export const IMPUESTO_INTERNO_OPTIONS = ["0", "4", "8", "17"] as const

export const VOLUMEN_UNITS = ["ml", "L", "cm³", "m³"] as const
