"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  ShoppingBag,
  Store,
  Box,
  TrendingUp,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Network,
  MessageCircle,
  Bell,
  Plus,
  Layers,
  Pencil,
  Trash2,
  MoreHorizontal,
  Upload,
  Tag,
  Copy,
  Check,
  X,
  ArrowLeftRight,
  Edit,
  Slack,
  PackagePlus,
  ChevronLeft,
  Minus,
  ChevronsUpDown,
  Grid3x3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge" // Added for Badge component

const SAVED_ATRIBUTOS = {
  Color: ["Blanco", "Negro", "Marino", "Rojo", "Azul", "Azul Marino", "Transparente", "Multicolor"],
  Cepa: ["Malbec", "Cabernet Sauvignon", "Cabernet Franc", "Merlot", "Syrah"],
  Año: [] as string[],
  Bodega: [] as string[],
  Enólogo: [] as string[],
  "Tiempo en Barrica": ["6 meses", "12 meses", "18 meses"],
  Medida: [] as string[],
  "Numero de Cadena": [] as string[],
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

const TEMPLATES = [
  {
    name: "Vinos",
    atributosPrincipales: [
      { key: "Cepa", value: "" },
      { key: "Año", value: "" },
    ],
    atributosInformativos: [
      { key: "Bodega", value: "" },
      { key: "Enólogo", value: "" },
      { key: "Tiempo en Barrica", value: "" },
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

const sidebarItems = [
  {
    icon: Store,
    label: "Mi Negocio",
    hasDropdown: true,
    dropdownItems: ["Punto de Venta", "Cajas"],
  },
  {
    icon: Network,
    label: "Canales Online",
    hasDropdown: true,
    dropdownItems: ["Publicaciones", "Marketing"],
  },
  {
    icon: ShoppingBag,
    label: "Ventas",
    hasDropdown: true,
    dropdownItems: ["Ventas", "Facturación", "Presupuestos", "Catálogo", "Clientes"],
  },
  {
    icon: Slack,
    label: "Postventa",
    hasDropdown: true,
    dropdownItems: ["Envíos", "Cambios, Devoluciones y Cancelaciones"],
  },
  {
    icon: PackagePlus,
    label: "Compras",
    hasDropdown: true,
    dropdownItems: ["Compras", "Proveedores"],
  },
  {
    icon: Box,
    label: "Stock",
    hasDropdown: true,
    dropdownItems: ["Artículos", "Templates y Atributos", "Depósitos"],
  },
  {
    icon: Tag,
    label: "Precios",
    hasDropdown: true,
    dropdownItems: ["Listas de Precios", "Gestión de Ofertas"],
  },
  {
    icon: TrendingUp,
    label: "BI",
    hasDropdown: true,
    dropdownItems: ["Cashflow", "Análisis de Rotación", "Performance Online", "Sugerencias de Optimización"],
  },
]

const bottomSidebarItems = [
  { icon: HelpCircle, label: "Soporte" },
  { icon: Settings, label: "Ajustes" },
]

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("articulos")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState("general")
  const [selectedDetailTab, setSelectedDetailTab] = useState<
    "info" | "atributos" | "variantes" | "stock" | "stock-variantes"
  >("info") // Added "variantes" tab type
  const [showDetail, setShowDetail] = useState(false) // State to control detail panel visibility

  const [isViewingContainer, setIsViewingContainer] = useState(false)

  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [hoveredSearch, setHoveredSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [selectAllActive, setSelectAllActive] = useState(false)
  const [showNuevoDropdown, setShowNuevoDropdown] = useState(false)
  const [showAccionesDropdown, setShowAccionesDropdown] = useState(false) // New state for Acciones Masivas dropdown
  const [itemSelected, setItemSelected] = useState([false, false, false, false])
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({})
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [skuCopied, setSkuCopied] = useState(false)
  const [codigoUniversalCopied, setCodigoUniversalCopied] = useState(false)

  const [currentView, setCurrentView] = useState<{ id: string; label: string; item: any | null }>({
    id: "articulos",
    label: "Artículos",
    item: null,
  })
  const [navigationHistory, setNavigationHistory] = useState<Array<{ id: string; label: string; item: any | null }>>([
    { id: "articulos", label: "Artículos", item: null },
  ])
  const [historyIndex, setHistoryIndex] = useState(0)

  const [depositStock, setDepositStock] = useState<{
    [itemSku: string]: {
      Ibiza: { total: number; reservado: number }
      Trujui: { total: number; reservado: number }
      Ciudadela: { total: number; reservado: number }
    }
  }>({})

  // State for the new "Descripción" field
  const [descripcion, setDescripcion] = useState("")
  // State for "Unidades por pack" toggle
  const [unidadesPorPackActive, setUnidadesPorPackActive] = useState(false)
  // State for "Volumen de la unidad" toggle and related fields
  const [volumenActive, setVolumenActive] = useState(false)
  const [volumenCantidad, setVolumenCantidad] = useState("")
  const [volumenUnidad, setVolumenUnidad] = useState("")

  const [atributosPrincipales, setAtributosPrincipales] = useState<Array<{ key: string; value: string }>>([])
  const [atributosInformativos, setAtributosInformativos] = useState<Array<{ key: string; value: string }>>([])
  // For container items - atributos principales with multiple variantes
  const [containerAtributosPrincipales, setContainerAtributosPrincipales] = useState<
    Array<{ key: string; variantes: string[] }>
  >([])
  // Temporary input state for adding new variantes
  const [varianteInput, setVarianteInput] = useState<{ [key: number]: string }>({})

  const [itemTitulo, setItemTitulo] = useState("")
  const [itemTemplate, setItemTemplate] = useState("")
  const [itemUbicacion, setItemUbicacion] = useState("")
  const [showAtributosView, setShowAtributosView] = useState(false)
  const [showIndividualAtributosView, setShowIndividualAtributosView] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSelectingTemplateForContainer, setIsSelectingTemplateForContainer] = useState(false)

  const [items, setItems] = useState([
    {
      name: "Item Sin Atributos 1",
      medida: "-",
      color: "-",
      costo: "$1,200",
      precio: "$6,200",
      total: "45",
      reservado: "8",
      disponible: "37",
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
      name: "Item Sin Atributos 2",
      medida: "-",
      color: "-",
      costo: "$800",
      precio: "$3,500",
      total: "23",
      reservado: "5",
      disponible: "18",
      hasVariants: false,
      isAgrupador: false,
      sku: "fG78hI90j12",
      codigoUniversal: "7501234567891",
      marca: "",
      proveedor: "",
      codigoProveedor: "",
      atributosPrincipales: [],
      atributosInformativos: [],
    },
    {
      name: "Hilo de Coser",
      costo: "$45",
      precio: "$120",
      total: "250",
      reservado: "30",
      disponible: "220",
      sku: "MER001",
      codigoUniversal: "7501234500001",
      atributosPrincipales: [
        { key: "Color", value: "Negro" },
        { key: "Grosor", value: "40" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Poliéster" },
        { key: "Longitud", value: "500m" },
      ],
      marca: "Coats",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "CT-HIL-NEG-40",
    },
    {
      name: "Hilo de Coser",
      costo: "$45",
      precio: "$120",
      total: "180",
      reservado: "25",
      disponible: "155",
      sku: "MER002",
      codigoUniversal: "7501234500002",
      atributosPrincipales: [
        { key: "Color", value: "Blanco" },
        { key: "Grosor", value: "40" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Poliéster" },
        { key: "Longitud", value: "500m" },
      ],
      marca: "Coats",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "CT-HIL-BLA-40",
    },
    {
      name: "Hilo de Coser",
      costo: "$45",
      precio: "$120",
      total: "120",
      reservado: "15",
      disponible: "105",
      sku: "MER003",
      codigoUniversal: "7501234500003",
      atributosPrincipales: [
        { key: "Color", value: "Rojo" },
        { key: "Grosor", value: "40" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Poliéster" },
        { key: "Longitud", value: "500m" },
      ],
      marca: "Coats",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "CT-HIL-ROJ-40",
    },
    {
      name: "Hilo de Coser",
      costo: "$48",
      precio: "$130",
      total: "95",
      reservado: "12",
      disponible: "83",
      sku: "MER004",
      codigoUniversal: "7501234500004",
      atributosPrincipales: [
        { key: "Color", value: "Azul" },
        { key: "Grosor", value: "50" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Algodón" },
        { key: "Longitud", value: "400m" },
      ],
      marca: "Gütermann",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "GT-HIL-AZU-50",
    },
    {
      name: "Botones de Plástico",
      costo: "$15",
      precio: "$45",
      total: "500",
      reservado: "80",
      disponible: "420",
      sku: "MER005",
      codigoUniversal: "7501234500005",
      atributosPrincipales: [
        { key: "Color", value: "Negro" },
        { key: "Tamaño", value: "12mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Plástico" },
        { key: "Cantidad", value: "Pack x100" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-BOT-NEG-12",
    },
    {
      name: "Botones de Plástico",
      costo: "$15",
      precio: "$45",
      total: "450",
      reservado: "70",
      disponible: "380",
      sku: "MER006",
      codigoUniversal: "7501234500006",
      atributosPrincipales: [
        { key: "Color", value: "Blanco" },
        { key: "Tamaño", value: "12mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Plástico" },
        { key: "Cantidad", value: "Pack x100" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-BOT-BLA-12",
    },
    {
      name: "Botones de Plástico",
      costo: "$18",
      precio: "$52",
      total: "320",
      reservado: "45",
      disponible: "275",
      sku: "MER007",
      codigoUniversal: "7501234500007",
      atributosPrincipales: [
        { key: "Color", value: "Transparente" },
        { key: "Tamaño", value: "15mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Plástico" },
        { key: "Cantidad", value: "Pack x100" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-BOT-TRA-15",
    },
    {
      name: "Cremallera",
      costo: "$35",
      precio: "$95",
      total: "200",
      reservado: "35",
      disponible: "165",
      sku: "MER008",
      codigoUniversal: "7501234500008",
      atributosPrincipales: [
        { key: "Color", value: "Negro" },
        { key: "Largo", value: "20cm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Metal" },
        { key: "Tipo", value: "Separable" },
      ],
      marca: "YKK",
      proveedor: "Insumos Textiles",
      codigoProveedor: "IT-CRE-NEG-20",
    },
    {
      name: "Cremallera",
      costo: "$38",
      precio: "$105",
      total: "150",
      reservado: "28",
      disponible: "122",
      sku: "MER009",
      codigoUniversal: "7501234500009",
      atributosPrincipales: [
        { key: "Color", value: "Blanco" },
        { key: "Largo", value: "25cm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Plástico" },
        { key: "Tipo", value: "No separable" },
      ],
      marca: "YKK",
      proveedor: "Insumos Textiles",
      codigoProveedor: "IT-CRE-BLA-25",
    },
    {
      name: "Cremallera",
      costo: "$42",
      precio: "$115",
      total: "180",
      reservado: "32",
      disponible: "148",
      sku: "MER010",
      codigoUniversal: "7501234500010",
      atributosPrincipales: [
        { key: "Color", value: "Azul Marino" },
        { key: "Largo", value: "30cm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Metal" },
        { key: "Tipo", value: "Separable" },
      ],
      marca: "YKK",
      proveedor: "Insumos Textiles",
      codigoProveedor: "IT-CRE-AZU-30",
    },
    {
      name: "Agujas de Coser",
      costo: "$25",
      precio: "$70",
      total: "300",
      reservado: "50",
      disponible: "250",
      sku: "MER011",
      codigoUniversal: "7501234500011",
      atributosPrincipales: [
        { key: "Tipo", value: "Universal" },
        { key: "Grosor", value: "80/12" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Acero" },
        { key: "Cantidad", value: "Pack x10" },
      ],
      marca: "Schmetz",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-AGU-UNI-80",
    },
    {
      name: "Agujas de Coser",
      costo: "$28",
      precio: "$75",
      total: "250",
      reservado: "40",
      disponible: "210",
      sku: "MER012",
      codigoUniversal: "7501234500012",
      atributosPrincipales: [
        { key: "Tipo", value: "Jeans" },
        { key: "Grosor", value: "90/14" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Acero reforzado" },
        { key: "Cantidad", value: "Pack x10" },
      ],
      marca: "Schmetz",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-AGU-JEA-90",
    },
    {
      name: "Elástico",
      costo: "$55",
      precio: "$150",
      total: "180",
      reservado: "30",
      disponible: "150",
      sku: "MER013",
      codigoUniversal: "7501234500013",
      atributosPrincipales: [
        { key: "Color", value: "Blanco" },
        { key: "Ancho", value: "20mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Poliéster/Elastano" },
        { key: "Longitud", value: "10m" },
      ],
      marca: "Prym",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "DT-ELA-BLA-20",
    },
    {
      name: "Elástico",
      costo: "$55",
      precio: "$150",
      total: "160",
      reservado: "25",
      disponible: "135",
      sku: "MER014",
      codigoUniversal: "7501234500014",
      atributosPrincipales: [
        { key: "Color", value: "Negro" },
        { key: "Ancho", value: "20mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Poliéster/Elastano" },
        { key: "Longitud", value: "10m" },
      ],
      marca: "Prym",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "DT-ELA-NEG-20",
    },
    {
      name: "Elástico",
      costo: "$68",
      precio: "$180",
      total: "120",
      reservado: "20",
      disponible: "100",
      sku: "MER015",
      codigoUniversal: "7501234500015",
      atributosPrincipales: [
        { key: "Color", value: "Blanco" },
        { key: "Ancho", value: "30mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Poliéster/Elastano" },
        { key: "Longitud", value: "10m" },
      ],
      marca: "Prym",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "DT-ELA-BLA-30",
    },
    {
      name: "Cinta al Bies",
      costo: "$32",
      precio: "$85",
      total: "220",
      reservado: "35",
      disponible: "185",
      sku: "MER016",
      codigoUniversal: "7501234500016",
      atributosPrincipales: [
        { key: "Color", value: "Negro" },
        { key: "Ancho", value: "18mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Algodón" },
        { key: "Longitud", value: "5m" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-BIE-NEG-18",
    },
    {
      name: "Cinta al Bies",
      costo: "$32",
      precio: "$85",
      total: "200",
      reservado: "30",
      disponible: "170",
      sku: "MER017",
      codigoUniversal: "7501234500017",
      atributosPrincipales: [
        { key: "Color", value: "Blanco" },
        { key: "Ancho", value: "18mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Algodón" },
        { key: "Longitud", value: "5m" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-BIE-BLA-18",
    },
    {
      name: "Cinta al Bies",
      costo: "$35",
      precio: "$92",
      total: "150",
      reservado: "22",
      disponible: "128",
      sku: "MER018",
      codigoUniversal: "7501234500018",
      atributosPrincipales: [
        { key: "Color", value: "Rojo" },
        { key: "Ancho", value: "25mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Algodón" },
        { key: "Longitud", value: "5m" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-BIE-ROJ-25",
    },
    {
      name: "Tijeras de Costura",
      costo: "$280",
      precio: "$750",
      total: "45",
      reservado: "8",
      disponible: "37",
      sku: "MER019",
      codigoUniversal: "7501234500019",
      atributosPrincipales: [
        { key: "Tipo", value: "Profesional" },
        { key: "Tamaño", value: "25cm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Acero inoxidable" },
        { key: "Uso", value: "Tela" },
      ],
      marca: "Fiskars",
      proveedor: "Insumos Textiles",
      codigoProveedor: "IT-TIJ-PRO-25",
    },
    {
      name: "Tijeras de Costura",
      costo: "$180",
      precio: "$480",
      total: "65",
      reservado: "12",
      disponible: "53",
      sku: "MER020",
      codigoUniversal: "7501234500020",
      atributosPrincipales: [
        { key: "Tipo", value: "Estándar" },
        { key: "Tamaño", value: "20cm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Acero" },
        { key: "Uso", value: "Tela" },
      ],
      marca: "Mundial",
      proveedor: "Insumos Textiles",
      codigoProveedor: "IT-TIJ-EST-20",
    },
    {
      name: "Alfileres",
      costo: "$22",
      precio: "$60",
      total: "400",
      reservado: "60",
      disponible: "340",
      sku: "MER021",
      codigoUniversal: "7501234500021",
      atributosPrincipales: [
        { key: "Tipo", value: "Cabeza Plástica" },
        { key: "Largo", value: "38mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Acero" },
        { key: "Cantidad", value: "Pack x100" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-ALF-PLA-38",
    },
    {
      name: "Alfileres",
      costo: "$18",
      precio: "$50",
      total: "350",
      reservado: "55",
      disponible: "295",
      sku: "MER022",
      codigoUniversal: "7501234500022",
      atributosPrincipales: [
        { key: "Tipo", value: "Cabeza Vidrio" },
        { key: "Largo", value: "32mm" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Acero" },
        { key: "Cantidad", value: "Pack x100" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-ALF-VID-32",
    },
    {
      name: "Dedal",
      costo: "$35",
      precio: "$95",
      total: "180",
      reservado: "25",
      disponible: "155",
      sku: "MER023",
      codigoUniversal: "7501234500023",
      atributosPrincipales: [
        { key: "Material", value: "Metal" },
        { key: "Talla", value: "M" },
      ],
      atributosInformativos: [{ key: "Tipo", value: "Tradicional" }],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-DED-MET-M",
    },
    {
      name: "Dedal",
      costo: "$28",
      precio: "$75",
      total: "200",
      reservado: "30",
      disponible: "170",
      sku: "MER024",
      codigoUniversal: "7501234500024",
      atributosPrincipales: [
        { key: "Material", value: "Plástico" },
        { key: "Talla", value: "L" },
      ],
      atributosInformativos: [{ key: "Tipo", value: "Ergonómico" }],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-DED-PLA-L",
    },
    {
      name: "Cinta Métrica",
      costo: "$45",
      precio: "$120",
      total: "150",
      reservado: "20",
      disponible: "130",
      sku: "MER025",
      codigoUniversal: "7501234500025",
      atributosPrincipales: [
        { key: "Material", value: "Fibra de Vidrio" },
        { key: "Longitud", value: "150cm" },
      ],
      atributosInformativos: [
        { key: "Tipo", value: "Retráctil" },
        { key: "Unidades", value: "cm/pulgadas" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-CIN-FIB-150",
    },
    {
      name: "Enhebrador",
      costo: "$15",
      precio: "$40",
      total: "280",
      reservado: "35",
      disponible: "245",
      sku: "MER026",
      codigoUniversal: "7501234500026",
      atributosPrincipales: [
        { key: "Tipo", value: "Manual" },
        { key: "Material", value: "Metal" },
      ],
      atributosInformativos: [{ key: "Uso", value: "Universal" }],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-ENH-MAN-MET",
    },
    {
      name: "Descosedor",
      costo: "$25",
      precio: "$65",
      total: "220",
      reservado: "30",
      disponible: "190",
      sku: "MER027",
      codigoUniversal: "7501234500027",
      atributosPrincipales: [
        { key: "Tipo", value: "Ergonómico" },
        { key: "Material", value: "Plástico/Metal" },
      ],
      atributosInformativos: [{ key: "Color", value: "Rojo" }],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-DES-ERG-ROJ",
    },
    {
      name: "Tiza de Sastre",
      costo: "$12",
      precio: "$35",
      total: "320",
      reservado: "45",
      disponible: "275",
      sku: "MER028",
      codigoUniversal: "7501234500028",
      atributosPrincipales: [
        { key: "Color", value: "Blanco" },
        { key: "Tipo", value: "Triangular" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Cera" },
        { key: "Cantidad", value: "Pack x3" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-TIZ-BLA-TRI",
    },
    {
      name: "Tiza de Sastre",
      costo: "$15",
      precio: "$42",
      total: "280",
      reservado: "40",
      disponible: "240",
      sku: "MER029",
      codigoUniversal: "7501234500029",
      atributosPrincipales: [
        { key: "Color", value: "Multicolor" },
        { key: "Tipo", value: "Lápiz" },
      ],
      atributosInformativos: [
        { key: "Material", value: "Cera" },
        { key: "Cantidad", value: "Pack x4" },
      ],
      marca: "Prym",
      proveedor: "Mercería Central",
      codigoProveedor: "MC-TIZ-MUL-LAP",
    },
    {
      name: "Bobinas Vacías",
      costo: "$8",
      precio: "$25",
      total: "500",
      reservado: "80",
      disponible: "420",
      sku: "MER030",
      codigoUniversal: "7501234500030",
      atributosPrincipales: [
        { key: "Material", value: "Plástico" },
        { key: "Tipo", value: "Universal" },
      ],
      atributosInformativos: [
        { key: "Cantidad", value: "Pack x10" },
        { key: "Color", value: "Transparente" },
      ],
      marca: "Singer",
      proveedor: "Distribuidora Textil",
      codigoProveedor: "DT-BOB-PLA-UNI",
    },
    {
      name: "Cierre YKK Metal Empavonado",
      medida: "65cm",
      color: "Negro",
      costo: "$1200",
      precio: "$6200",
      total: "30",
      reservado: "0",
      disponible: "30",
      hasVariants: false,
      isAgrupador: false,
      sku: "raD55c5t580",
      codigoUniversal: "7501234567890",
      marca: "YKK",
      modelo: "Metal Empavonado",
      formatoVenta: "unidad",
      proveedor: "Artintex",
      codigoProveedor: "ART-ME-6520",
    },
    {
      name: "Cierre YKK Metal Plata Desmontable",
      medida: "65cm",
      color: "Negro",
      costo: "$1000",
      precio: "$5790",
      total: "89",
      reservado: "10",
      disponible: "79",
      hasVariants: false,
      isAgrupador: false,
      sku: "xK92mP3w741",
      codigoUniversal: "7501234567906",
      marca: "YKK",
      modelo: "Metal Plata Desmontable",
      formatoVenta: "unidad",
      proveedor: "Artintex",
      codigoProveedor: "ART-MPD-6530",
    },
    {
      name: "Cierre YKK Metal Plata Fijo",
      medida: "16cm",
      color: "Negro",
      costo: "$400",
      precio: "$890",
      total: "200",
      reservado: "0",
      disponible: "200",
      hasVariants: false,
      isAgrupador: false,
      sku: "bN47qR8z293",
      codigoUniversal: "7501234567913",
      marca: "YKK",
      modelo: "Metal Plata Fijo",
      formatoVenta: "unidad",
      proveedor: "Artintex",
      codigoProveedor: "ART-MPF-1640",
    },
    {
      name: "Cierre YKK Aluminio",
      medida: "65cm",
      color: "Negro",
      costo: "$700",
      precio: "$3790",
      total: "57",
      reservado: "5",
      disponible: "52",
      hasVariants: true,
      isAgrupador: false,
      variantCount: 8,
      marca: "YKK",
      modelo: "Aluminio",
      formatoVenta: "unidad",
      proveedor: "Artintex",
      codigoProveedor: "ART-ALU-6550",
      variants: [
        {
          name: "Cierre YKK Aluminio",
          medida: "55cm",
          color: "Negro",
          costo: "$700",
          precio: "$3790",
          total: "45",
          reservado: "3",
          disponible: "42",
          sku: "yT65nL2k418",
          codigoUniversal: "7501234567920",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-5550",
        },
        {
          name: "Cierre YKK Aluminio",
          medida: "60cm",
          color: "Negro",
          costo: "$700",
          precio: "$3990",
          total: "62",
          reservado: "8",
          disponible: "54",
          sku: "pW83hM9v627",
          codigoUniversal: "7501234567937",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-6050",
        },
        {
          name: "Cierre YKK Aluminio",
          medida: "65cm",
          color: "Negro",
          costo: "$700",
          precio: "$3790",
          total: "57",
          reservado: "5",
          disponible: "52",
          sku: "mQ18vB7r945",
          codigoUniversal: "7501234567944",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-6550",
        },
        {
          name: "Cierre YKK Aluminio",
          medida: "70cm",
          color: "Negro",
          costo: "$750",
          precio: "$4190",
          total: "38",
          reservado: "4",
          disponible: "34",
          sku: "cH54pN3x182",
          codigoUniversal: "7501234567951",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-7050",
        },
        {
          name: "Cierre YKK Aluminio",
          medida: "75cm",
          color: "Negro",
          costo: "$800",
          precio: "$4590",
          total: "29",
          reservado: "2",
          disponible: "27",
          sku: "zL91wK6d473",
          codigoUniversal: "7501234567968",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-7550",
        },
        {
          name: "Cierre YKK Aluminio",
          medida: "80cm",
          color: "Negro",
          costo: "$850",
          precio: "$4990",
          total: "41",
          reservado: "6",
          disponible: "35",
          sku: "aF26rJ8m594",
          codigoUniversal: "7501234567975",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-8050",
        },
        {
          name: "Cierre YKK Aluminio",
          medida: "85cm",
          color: "Negro",
          costo: "$900",
          precio: "$5390",
          total: "33",
          reservado: "3",
          disponible: "30",
          sku: "uD72gX4t826",
          codigoUniversal: "7501234567982",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-8550",
        },
        {
          name: "Cierre YKK Aluminio",
          medida: "90cm",
          color: "Negro",
          costo: "$950",
          precio: "$5790",
          total: "25",
          reservado: "1",
          disponible: "24",
          sku: "iS39kZ5y167",
          codigoUniversal: "7501234567999",
          marca: "YKK",
          modelo: "Aluminio",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-ALU-9050",
        },
      ],
    },
    {
      name: "Piezas YKK",
      hasVariants: false,
      isAgrupador: true,
      itemCount: 2,
      items: [
        {
          name: "Deslizador YKK Metálico",
          material: "Metal",
          cadena: "5",
          costo: "$200",
          precio: "$600",
          total: "120",
          reservado: "15",
          disponible: "105",
          sku: "sV42jT9n268",
          codigoUniversal: "7501234568002",
          marca: "YKK",
          modelo: "Deslizador Metálico",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-DES-M50",
        },
        {
          name: "Topes YKK metálicos",
          material: "Metal",
          attribute2: "-",
          costo: "$10",
          precio: "$90",
          total: "450",
          reservado: "28",
          disponible: "422",
          sku: "qE73bY6w541",
          codigoUniversal: "7501234568019",
          marca: "YKK",
          modelo: "Topes Metálicos",
          formatoVenta: "unidad",
          proveedor: "Artintex",
          codigoProveedor: "ART-TOP-M10",
        },
      ],
    },
    {
      name: "Hilos Industriales",
      hasVariants: false,
      isAgrupador: true,
      itemCount: "1 item individual, 1 item con variantes",
      items: [
        {
          name: "Hilo M&H Industrial",
          unidades: "10 tubos",
          color: "Surtido",
          costo: "$850",
          precio: "$2400",
          total: "65",
          reservado: "8",
          disponible: "57",
          hasVariants: false,
          sku: "hU91mC4p637",
          codigoUniversal: "7501234568026",
          marca: "M&H",
          modelo: "Industrial",
          formatoVenta: "pack",
          unidadesPorPack: 10,
          proveedor: "M&H",
          codigoProveedor: "MH-IND-1085",
        },
        {
          name: "Hilo Industrial Singer",
          hasVariants: true,
          variantCount: 3,
          marca: "Singer",
          modelo: "Industrial",
          formatoVenta: "unidad",
          proveedor: "Singer",
          codigoProveedor: "SNG-IND-9032",
          variants: [
            {
              name: "Hilo Industrial Singer",
              largo: "90cm",
              color: "Negro",
              costo: "$320",
              precio: "$890",
              total: "142",
              reservado: "18",
              disponible: "124",
              sku: "nG25xW8k472",
              codigoUniversal: "7501234568033",
              marca: "Singer",
              modelo: "Industrial",
              formatoVenta: "unidad",
              proveedor: "Singer",
              codigoProveedor: "SNG-IND-90N",
            },
            {
              name: "Hilo Industrial Singer",
              largo: "90cm",
              color: "Rojo",
              costo: "$320",
              precio: "$890",
              total: "98",
              reservado: "12",
              disponible: "86",
              sku: "tY67fL3q819",
              codigoUniversal: "7501234568040",
              marca: "Singer",
              modelo: "Industrial",
              formatoVenta: "unidad",
              proveedor: "Singer",
              codigoProveedor: "SNG-IND-90R",
            },
            {
              name: "Hilo Industrial Singer",
              largo: "90cm",
              color: "Blanco",
              costo: "$320",
              precio: "$890",
              total: "156",
              reservado: "22",
              disponible: "134",
              sku: "oP46dK1m753",
              codigoUniversal: "7501234568057",
              marca: "Singer",
              modelo: "Industrial",
              formatoVenta: "unidad",
              proveedor: "Singer",
              codigoProveedor: "SNG-IND-90B",
            },
          ],
        },
      ],
    },
    {
      name: "Hilo Industrial Singer",
      largo: "90cm",
      color: "Negro",
      costo: "$320",
      precio: "$890",
      total: "124",
      reservado: "18",
      disponible: "106",
      sku: "kL23mN45o67",
      codigoUniversal: "7501234568033",
      marca: "Singer",
      modelo: "Industrial",
      formatoVenta: "unidad",
      proveedor: "Singer",
      codigoProveedor: "SNG-IND-90N",
    },
  ])

  useEffect(() => {
    const initialDepositStock: typeof depositStock = {}

    const distributeStock = (totalStock: number, reservedStock: number) => {
      const deposits = ["Ibiza", "Trujui", "Ciudadela"]
      const stockDistribution: any = {}

      let remainingTotal = totalStock
      let remainingReserved = reservedStock

      deposits.forEach((deposit, index) => {
        if (index === deposits.length - 1) {
          stockDistribution[deposit] = {
            total: remainingTotal,
            reservado: remainingReserved,
          }
        } else {
          const maxTotal = Math.floor(remainingTotal / (deposits.length - index))
          const depositTotal = Math.floor(Math.random() * (maxTotal + 1))
          const depositReserved = Math.min(Math.floor(Math.random() * (depositTotal + 1)), remainingReserved)

          stockDistribution[deposit] = {
            total: depositTotal,
            reservado: depositReserved,
          }

          remainingTotal -= depositTotal
          remainingReserved -= depositReserved
        }
      })

      return stockDistribution
    }

    items.forEach((item) => {
      if (item.isAgrupador && item.items) {
        item.items.forEach((subItem) => {
          if (subItem.sku) {
            initialDepositStock[subItem.sku] = distributeStock(
              Number.parseInt(subItem.total),
              Number.parseInt(subItem.reservado),
            )
          }
        })
      } else if (item.hasVariants && item.variants) {
        item.variants.forEach((variant) => {
          if (variant.sku) {
            initialDepositStock[variant.sku] = distributeStock(
              Number.parseInt(variant.total),
              Number.parseInt(variant.reservado),
            )
          }
        })
      } else if (item.sku) {
        initialDepositStock[item.sku] = distributeStock(Number.parseInt(item.total), Number.parseInt(item.reservado))
      }
    })

    setDepositStock(initialDepositStock)
  }, [])

  // Initialize variantItems state and related functions
  const [variantItems, setVariantItems] = useState<
    Array<{
      sku: string
      codigoUniversal: string
      descripcion: string
      foto: string
      variant1: string | null
      variant2: string | null
    }>
  >([])

  const [expandedVariantStock, setExpandedVariantStock] = useState<{ [sku: string]: boolean }>({})

  const generateVariantCombinations = () => {
    if (!selectedItem || !selectedItem.hasVariants) return []

    const attrs = containerAtributosPrincipales.filter((attr) => attr.key && attr.variantes.length > 0)

    if (attrs.length === 0) return []

    // Generate cartesian product
    if (attrs.length === 1) {
      // Single attribute case
      return attrs[0].variantes.map((v1) => ({
        sku: `${selectedItem.sku}-${v1.toLowerCase().replace(/\s+/g, "-")}`, // Generate SKU from variants
        codigoUniversal: "",
        descripcion: "",
        foto: "",
        variant1: v1,
        variant2: null,
      }))
    } else if (attrs.length === 2) {
      // Two attributes case
      const combinations: any[] = []
      attrs[0].variantes.forEach((v1) => {
        attrs[1].variantes.forEach((v2) => {
          combinations.push({
            sku: `${selectedItem.sku}-${v1.toLowerCase().replace(/\s+/g, "-")}-${v2.toLowerCase().replace(/\s+/g, "-")}`, // Generate SKU from variants
            codigoUniversal: "",
            descripcion: "",
            foto: "",
            variant1: v1,
            variant2: v2,
          })
        })
      })
      return combinations
    }

    return []
  }

  useEffect(() => {
    if (selectedItem && selectedItem.hasVariants && isViewingContainer) {
      const combinations = generateVariantCombinations()
      setVariantItems(combinations)

      // Initialize deposit stock for each variant
      const newDepositStock = { ...depositStock }
      combinations.forEach((variant) => {
        if (!newDepositStock[variant.sku]) {
          newDepositStock[variant.sku] = {
            Ibiza: { total: Math.floor(Math.random() * 50), reservado: Math.floor(Math.random() * 10) },
            Trujui: { total: Math.floor(Math.random() * 50), reservado: Math.floor(Math.random() * 10) },
            Ciudadela: { total: Math.floor(Math.random() * 50), reservado: Math.floor(Math.random() * 10) },
          }
        }
      })
      setDepositStock(newDepositStock)
    }
  }, [containerAtributosPrincipales, selectedItem, isViewingContainer])

  const toggleVariantStockExpansion = (sku: string) => {
    setExpandedVariantStock((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }))
  }

  const updateVariantField = (sku: string, field: "codigoUniversal" | "descripcion" | "foto", value: string) => {
    setVariantItems((prev) => prev.map((item) => (item.sku === sku ? { ...item, [field]: value } : item)))
  }

  const updateDepositStock = (
    sku: string,
    deposit: "Ibiza" | "Trujui" | "Ciudadela",
    field: "total" | "reservado",
    value: number,
  ) => {
    setDepositStock((prev) => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [deposit]: {
          ...prev[sku][deposit],
          [field]: value,
        },
      },
    }))
  }

  const [showMargenTooltip, setShowMargenTooltip] = useState(false)

  const [costo, setCosto] = useState("1200")
  const [margenActive, setMargenActive] = useState(false)
  const [margen, setMargen] = useState("25")
  const [precio, setPrecio] = useState("6200")
  const [iva, setIva] = useState("21")
  const [impuestoInterno, setImpuestoInterno] = useState("0")

  const [proveedor, setProveedor] = useState("")
  const [codigoProveedor, setCodigoProveedor] = useState("")

  const [marca, setMarca] = useState("")
  const [modelo, setModelo] = useState("")
  const [formatoVenta, setFormatoVenta] = useState("unidad")
  const [unidadesPorPack, setUnidadesPorPack] = useState("")
  // const [volumenActive, setVolumenActive] = useState(false) // Moved to the top with other state declarations
  // const [volumenValue, setVolumenValue] = useState("") // Renamed to volumenCantidad
  // const [volumenUnit, setVolumenUnit] = useState("") // Renamed to volumenUnidad

  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [tempLabelValue, setTempLabelValue] = useState("")
  const [atributoKey1, setAtributoKey1] = useState("")
  const [atributoKey2, setAtributoKey2] = useState("")
  const [atributoKey3, setAtributoKey3] = useState("")
  const [atributoKey4, setAtributoKey4] = useState("")
  const [atributoPrincipal1, setAtributoPrincipal1] = useState("")
  const [atributoPrincipal2, setAtributoPrincipal2] = useState("")
  const [atributoSecundario1, setAtributoSecundario1] = useState("")
  const [atributoSecundario2, setAtributoSecundario2] = useState("")

  // const [atributosPrincipales, setAtributosPrincipales] = useState<Array<{ key: string; value: string }>>([]) // Moved to the top with other state declarations
  // const [atributosInformativos, setAtributosInformativos] = useState<Array<{ key: string; value: string }>>([]) // Moved to the top with other state declarations

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md")
  const [gridSizeDropdownOpen, setGridSizeDropdownOpen] = useState(false)

  const [showNuevoItemModal, setShowNuevoItemModal] = useState(false)
  const [isNuevoItemMinimized, setIsNuevoItemMinimized] = useState(false)
  const [showNuevoItemConVariantesModal, setShowNuevoItemConVariantesModal] = useState(false)
  const [isNuevoItemConVariantesMinimized, setIsNuevoItemConVariantesMinimized] = useState(false)
  const [minimizedTabs, setMinimizedTabs] = useState<Array<{ id: string; label: string }>>([])
  const [activeNavTab, setActiveNavTab] = useState<string>("main")

  const handleOpenNuevoItem = () => {
    setShowNuevoItemModal(true)
    setIsNuevoItemMinimized(false)
    setActiveNavTab("nuevo-item")
    // Reset form fields when opening the modal
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleCloseNuevoItem = () => {
    setShowNuevoItemModal(false)
    setIsNuevoItemMinimized(false)
    setMinimizedTabs(minimizedTabs.filter((tab) => tab.id !== "nuevo-item"))
    setActiveNavTab("main")
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleMinimizeNuevoItem = () => {
    setIsNuevoItemMinimized(true)
    if (!minimizedTabs.find((tab) => tab.id === "nuevo-item")) {
      setMinimizedTabs([...minimizedTabs, { id: "nuevo-item", label: "Nuevo Item" }])
    }
    setActiveNavTab("main")
  }

  const handleOpenNuevoItemConVariantes = () => {
    setShowNuevoItemConVariantesModal(true)
    setIsNuevoItemConVariantesMinimized(false)
    setActiveNavTab("nuevo-item-variantes")
    // Reset form fields when opening the modal
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleCloseNuevoItemConVariantes = () => {
    setShowNuevoItemConVariantesModal(false)
    setIsNuevoItemConVariantesMinimized(false)
    setMinimizedTabs(minimizedTabs.filter((tab) => tab.id !== "nuevo-item-variantes"))
    setActiveNavTab("main")
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleMinimizeNuevoItemConVariantes = () => {
    setIsNuevoItemConVariantesMinimized(true)
    if (!minimizedTabs.find((tab) => tab.id === "nuevo-item-variantes")) {
      setMinimizedTabs([...minimizedTabs, { id: "nuevo-item-variantes", label: "Nuevo Item con Variantes" }])
    }
    setActiveNavTab("main")
  }

  const handleRestoreNuevoItem = () => {
    setIsNuevoItemMinimized(false)
    setMinimizedTabs(minimizedTabs.filter((tab) => tab.id !== "nuevo-item"))
    setActiveNavTab("nuevo-item")
  }

  const handleCloseTabFromNavbar = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabId === "nuevo-item") {
      handleCloseNuevoItem()
    }
  }

  useEffect(() => {
    if (selectedItem) {
      // Populate Info tab fields
      setItemTitulo(selectedItem.name || "") // Populate title field
      setMarca(selectedItem.marca || "")
      setModelo(selectedItem.modelo || "")
      setFormatoVenta(selectedItem.formatoVenta || "unidad")
      setUnidadesPorPack(selectedItem.unidadesPorPack?.toString() || "")
      setDescripcion(selectedItem.descripcion || "") // Populate description

      // Set initial state for toggles based on item data
      setUnidadesPorPackActive(selectedItem.unidadesPorPack !== undefined && selectedItem.unidadesPorPack !== null)
      setVolumenActive(selectedItem.volumenActive || false)
      setVolumenCantidad(selectedItem.volumenCantidad?.toString() || "")
      setVolumenUnidad(selectedItem.volumenUnidad || "")

      // Populate Comercial tab fields
      // Remove $ sign and parse the numeric value
      const costoValue = selectedItem.costo?.replace(/[$.,]/g, "") || "0"
      const precioValue = selectedItem.precio?.replace(/[$.,]/g, "") || "0"
      setCosto(costoValue)
      setPrecio(precioValue)
      setIva("21") // Always 21% as requested
      setMargenActive(false) // Never use margen as requested
      setProveedor(selectedItem.proveedor || "")
      setCodigoProveedor(selectedItem.codigoProveedor || "")

      if (selectedItem.atributosPrincipales && selectedItem.atributosPrincipales.length > 0) {
        setAtributosPrincipales([...selectedItem.atributosPrincipales])
      } else {
        setAtributosPrincipales([])
      }

      if (selectedItem.atributosInformativos && selectedItem.atributosInformativos.length > 0) {
        setAtributosInformativos([...selectedItem.atributosInformativos])
      } else {
        setAtributosInformativos([])
      }

      // Populate container attributes from selectedItem
      if (selectedItem.containerAttributes && selectedItem.containerAttributes.length > 0) {
        setContainerAtributosPrincipales(selectedItem.containerAttributes)
      } else {
        setContainerAtributosPrincipales([])
      }

      if (!selectedItem.isAgrupador && !selectedItem.hasVariants) {
        // For standalone items
        setShowIndividualAtributosView(
          selectedItem.atributosPrincipales?.length > 0 || selectedItem.atributosInformativos?.length > 0,
        )
        setShowAtributosView(false) // Not used for standalone items
      } else {
        // For container items (item padre)
        setShowIndividualAtributosView(false)
        setShowAtributosView(
          (selectedItem.containerAttributes && selectedItem.containerAttributes.length > 0) ||
            (selectedItem.atributosInformativos && selectedItem.atributosInformativos.length > 0),
        )
      }
    }
  }, [selectedItem])

  const updateProductTitle = () => {
    if (!selectedItem) return

    // Get base name (everything before the first attribute)
    // This is a simplified logic; in a real app, you might need a more robust way to extract the base name.
    const baseName = selectedItem.name.split(" ").slice(0, 3).join(" ")

    // Build new title
    let newTitle = baseName
    if (atributoPrincipal1) newTitle += ` ${atributoPrincipal1}`
    if (atributoPrincipal2) newTitle += ` ${atributoPrincipal2}`

    // Update the selected item's name
    // Note: In a real app, this would update the database
    console.log("[v0] Updated product title:", newTitle)
    // For demonstration purposes, we'll update a local state if needed, but typically this would be an API call.
    // For now, we just log it.
  }

  const handleDeleteMainAttribute = (index: number) => {
    if (index === 1) {
      if (atributoKey2 || atributoPrincipal2) {
        setAtributoKey1(atributoKey2)
        setAtributoPrincipal1(atributoPrincipal2)
        setAtributoKey2("")
        setAtributoPrincipal2("")
      } else {
        setAtributoKey1("")
        setAtributoPrincipal1("")
      }
    } else if (index === 2) {
      setAtributoKey2("")
      setAtributoPrincipal2("")
    }
    updateProductTitle()
  }

  // Renamed function to match new terminology and removed unused parameters
  const handleDeleteAtributosInformativos = (index: number) => {
    if (index === 1) {
      if (atributoKey4 || atributoSecundario2) {
        setAtributoKey3(atributoKey4)
        setAtributoSecundario1(atributoSecundario2)
        setAtributoKey4("")
        setAtributoSecundario2("")
      } else {
        setAtributoKey3("")
        setAtributoSecundario1("")
      }
    } else if (index === 2) {
      setAtributoKey4("")
      setAtributoSecundario2("")
    }
  }

  const handleSwapAtributosPrincipales = () => {
    // Swap both keys and values
    const tempKey = atributoKey1
    const tempValue = atributoPrincipal1
    setAtributoKey1(atributoKey2)
    setAtributoPrincipal1(atributoPrincipal2)
    setAtributoKey2(tempKey)
    setAtributoPrincipal2(tempValue)
    updateProductTitle()
  }

  const handleSwapAtributosInformativos = () => {
    // Swap both keys and values
    const tempKey = atributoKey3
    const tempValue = atributoSecundario1
    setAtributoKey3(atributoKey4)
    setAtributoSecundario1(atributoSecundario2)
    setAtributoKey4(tempKey)
    setAtributoSecundario2(tempValue)
  }

  const handleStartEditLabel = (labelId: string, currentValue: string) => {
    setEditingLabel(labelId)
    setTempLabelValue(currentValue)
  }

  // const handleSaveLabel = (labelId: string) => {
  //   if (labelId === "attr1") {
  //     setAtributoKey1(tempLabelValue)
  //     updateProductTitle(tempLabelValue, atributoPrincipal1, atributoKey2, atributoPrincipal2)
  //   } else if (labelId === "attr2") {
  //     setAtributoKey2(tempLabelValue)
  //     updateProductTitle(atributoKey1, atributoPrincipal1, tempLabelValue, atributoPrincipal2)
  //   } else if (labelId === "attr3") {
  //     setAtributoKey3(tempLabelValue)
  //   } else if (labelId === "attr4") {
  //     setAtributoKey4(tempLabelValue)
  //   }
  //   setEditingLabel(null)
  //   setTempLabelValue("")
  // }

  const calculatedPrecio =
    margenActive && costo ? (Number.parseFloat(costo) * (1 + Number.parseFloat(margen) / 100)).toFixed(2) : precio

  const precioFinalConIva = calculatedPrecio
    ? (
        Number.parseFloat(calculatedPrecio) *
        (1 + Number.parseFloat(iva) / 100) *
        (1 + Number.parseFloat(impuestoInterno) / 100)
      ).toFixed(2)
    : "0"

  const precioFinalSinIva = calculatedPrecio || "0"

  const getFilteredDropdownItems = (items: string[]) => {
    if (!searchQuery) return items
    return items.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const hasMatchingItems = (items: string[]) => {
    if (!searchQuery || !items) return false
    return items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const handleSelectAllClick = () => {
    const newState = !selectAllActive
    setSelectAllActive(newState)
    setItemSelected([newState, newState, newState, newState])
  }

  const handleItemButtonClick = (index: number) => {
    setItemSelected((prev) => {
      const newStates = [...prev]
      newStates[index] = !newStates[index]

      const allSelected = newStates.every((state) => state)
      setSelectAllActive(allSelected)

      return newStates
    })
  }

  const hasSelectedItems = itemSelected.some((selected) => selected)

  // The 'items' state is now managed at the top of the component.
  // const items = [ ... ] // This line has been removed and replaced by the state initialization.

  const isItemPage = true
  const isFolderPage = false

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousView = navigationHistory[newIndex]
      setHistoryIndex(newIndex)
      setCurrentView(previousView)

      // Update UI based on view
      if (previousView.item) {
        setSelectedItem(previousView.item)
        setShowDetail(true)
        // Update isViewingContainer state based on history
        setIsViewingContainer(previousView.item.isAgrupador || previousView.item.hasVariants || false)
        // Update item specific states based on loaded item
        setItemTitulo(previousView.item.name || "")
        setMarca(previousView.item.marca || "")
        setDescripcion(previousView.item.descripcion || "")
        setFormatoVenta(previousView.item.formatoVenta || "unidad")
        setUnidadesPorPack(previousView.item.unidadesPorPack?.toString() || "")
        setUnidadesPorPackActive(
          previousView.item.unidadesPorPack !== undefined && previousView.item.unidadesPorPack !== null,
        )
        setVolumenActive(previousView.item.volumenActive || false)
        setVolumenCantidad(previousView.item.volumenCantidad?.toString() || "")
        setVolumenUnidad(previousView.item.volumenUnidad || "")
        setProveedor(previousView.item.proveedor || "")
        setCodigoProveedor(previousView.item.codigoProveedor || "")
        // Update attributes based on previous view
        if (previousView.item.atributosPrincipales && previousView.item.atributosPrincipales.length > 0) {
          setAtributoKey1(previousView.item.atributosPrincipales[0]?.key || "")
          setAtributoPrincipal1(previousView.item.atributosPrincipales[0]?.value || "")
        } else {
          setAtributoKey1("")
          setAtributoPrincipal1("")
        }
        if (previousView.item.atributosPrincipales && previousView.item.atributosPrincipales.length > 1) {
          setAtributoKey2(previousView.item.atributosPrincipales[1]?.key || "")
          setAtributoPrincipal2(previousView.item.atributosPrincipales[1]?.value || "")
        } else {
          setAtributoKey2("")
          setAtributoPrincipal2("")
        }
        // Update container attributes
        if (previousView.item.containerAttributes && previousView.item.containerAttributes.length > 0) {
          setContainerAtributosPrincipales(previousView.item.containerAttributes)
        } else {
          setContainerAtributosPrincipales([])
        }
        // Set showAtributosView state
        setShowIndividualAtributosView(
          !(previousView.item.isAgrupador || previousView.item.hasVariants) &&
            previousView.item.atributosPrincipales?.length > 0,
        )
      } else {
        setSelectedItem(null)
        setShowDetail(false)
        setIsViewingContainer(false)
        // Reset individual item states
        setItemTitulo("")
        setMarca("")
        setModelo("")
        setFormatoVenta("unidad")
        setUnidadesPorPack("")
        setDescripcion("")
        setUnidadesPorPackActive(false)
        setVolumenActive(false)
        setVolumenCantidad("")
        setVolumenUnidad("")
        setProveedor("")
        setCodigoProveedor("")
        setAtributoKey1("")
        setAtributoPrincipal1("")
        setAtributoKey2("")
        setAtributoPrincipal2("")
        setContainerAtributosPrincipales([])
        setShowIndividualAtributosView(false)
      }
    }
  }

  const navigateForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1
      const nextView = navigationHistory[newIndex]
      setHistoryIndex(newIndex)
      setCurrentView(nextView)

      // Update UI based on view
      if (nextView.item) {
        setSelectedItem(nextView.item)
        setShowDetail(true)
        // Update isViewingContainer state based on history
        setIsViewingContainer(nextView.item.isAgrupador || nextView.item.hasVariants || false)
        // Update item specific states based on loaded item
        setItemTitulo(nextView.item.name || "")
        setMarca(nextView.item.marca || "")
        setDescripcion(nextView.item.descripcion || "")
        setFormatoVenta(nextView.item.formatoVenta || "unidad")
        setUnidadesPorPack(nextView.item.unidadesPorPack?.toString() || "")
        setUnidadesPorPackActive(nextView.item.unidadesPorPack !== undefined && nextView.item.unidadesPorPack !== null)
        setVolumenActive(nextView.item.volumenActive || false)
        setVolumenCantidad(nextView.item.volumenCantidad?.toString() || "")
        setVolumenUnidad(nextView.item.volumenUnidad || "")
        setProveedor(nextView.item.proveedor || "")
        setCodigoProveedor(nextView.item.codigoProveedor || "")
        // Update attributes based on previous view
        if (nextView.item.atributosPrincipales && nextView.item.atributosPrincipales.length > 0) {
          setAtributoKey1(nextView.item.atributosPrincipales[0]?.key || "")
          setAtributoPrincipal1(nextView.item.atributosPrincipales[0]?.value || "")
        } else {
          setAtributoKey1("")
          setAtributoPrincipal1("")
        }
        if (nextView.item.atributosPrincipales && nextView.item.atributosPrincipales.length > 1) {
          setAtributoKey2(nextView.item.atributosPrincipales[1]?.key || "")
          setAtributoPrincipal2(nextView.item.atributosPrincipales[1]?.value || "")
        } else {
          setAtributoKey2("")
          setAtributoPrincipal2("")
        }
        // Update container attributes
        if (nextView.item.containerAttributes && nextView.item.containerAttributes.length > 0) {
          setContainerAtributosPrincipales(nextView.item.containerAttributes)
        } else {
          setContainerAtributosPrincipales([])
        }
        // Set showAtributosView state
        setShowIndividualAtributosView(
          !(nextView.item.isAgrupador || nextView.item.hasVariants) && nextView.item.atributosPrincipales?.length > 0,
        )
      } else {
        setSelectedItem(null)
        setShowDetail(false)
        setIsViewingContainer(false)
        // Reset individual item states
        setItemTitulo("")
        setMarca("")
        setModelo("")
        setFormatoVenta("unidad")
        setUnidadesPorPack("")
        setDescripcion("")
        setUnidadesPorPackActive(false)
        setVolumenActive(false)
        setVolumenCantidad("")
        setVolumenUnidad("")
        setProveedor("")
        setCodigoProveedor("")
        setAtributoKey1("")
        setAtributoPrincipal1("")
        setAtributoKey2("")
        setAtributoPrincipal2("")
        setContainerAtributosPrincipales([])
        setShowIndividualAtributosView(false)
      }
    }
  }

  const handleItemClick = (
    item: any,
    tab: "info" | "atributos" | "variantes" | "stock" | "stock-variantes",
    isContainer = false,
  ) => {
    // Added "variantes" to tab type
    setSelectedItem(item)
    setIsViewingContainer(isContainer)

    // Map tab names appropriately
    if (isContainer) {
      if (tab === "info") setSelectedDetailTab("info")
      else if (tab === "atributos") setSelectedDetailTab("atributos")
      else if (tab === "variantes")
        setSelectedDetailTab("variantes") // Added variantes tab mapping
      else if (tab === "stock")
        setSelectedDetailTab("stock-variantes") // Renamed "stock" to "stock-variantes" for container context
      else setSelectedDetailTab(tab as any)
    } else {
      setSelectedDetailTab(tab as any)
    }

    setShowDetail(true)

    const itemName = getItemDisplayName(item)
    const newView = { id: `item-${item.sku || item.name}`, label: itemName, item }
    setCurrentView(newView)

    // Update individual item states when an item is clicked
    setItemTitulo(item.name || "")
    setMarca(item.marca || "")
    setModelo(item.modelo || "")
    setFormatoVenta(item.formatoVenta || "unidad")
    setUnidadesPorPack(item.unidadesPorPack?.toString() || "")
    setDescripcion(item.descripcion || "")
    setUnidadesPorPackActive(item.unidadesPorPack !== undefined && item.unidadesPorPack !== null)
    setVolumenActive(item.volumenActive || false)
    setVolumenCantidad(item.volumenCantidad?.toString() || "")
    setVolumenUnidad(item.volumenUnidad || "")
    setProveedor(item.proveedor || "")
    setCodigoProveedor(item.codigoProveedor || "")

    // Set attributes for individual items
    if (item.atributosPrincipales && item.atributosPrincipales.length > 0) {
      setAtributoKey1(item.atributosPrincipales[0]?.key || "")
      setAtributoPrincipal1(item.atributosPrincipales[0]?.value || "")
    } else {
      setAtributoKey1("")
      setAtributoPrincipal1("")
    }
    if (item.atributosPrincipales && item.atributosPrincipales.length > 1) {
      setAtributoKey2(item.atributosPrincipales[1]?.key || "")
      setAtributoPrincipal2(item.atributosPrincipales[1]?.value || "")
    } else {
      setAtributoKey2("")
      setAtributoPrincipal2("")
    }
    // Reset secondary attributes
    setAtributoKey3("")
    setAtributoSecundario1("")
    setAtributoKey4("")
    setAtributoSecundario2("")

    // Set container attributes
    if (item.containerAttributes && item.containerAttributes.length > 0) {
      setContainerAtributosPrincipales(item.containerAttributes)
    } else {
      setContainerAtributosPrincipales([])
    }

    // Set showAtributosView based on item type and existing attributes
    if (item.isAgrupador || item.hasVariants) {
      setShowIndividualAtributosView(false) // Hide attribute editor for containers initially
    } else {
      setShowIndividualAtributosView(item.atributosPrincipales?.length > 0) // Show if attributes exist for individual items
    }

    // Add to history
    const newHistory = navigationHistory.slice(0, historyIndex + 1)
    newHistory.push(newView)
    setNavigationHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleBackToGrid = () => {
    const gridView = { id: "articulos", label: "Artículos", item: null }
    setCurrentView(gridView)
    setSelectedItem(null)
    setShowDetail(false)
    setIsViewingContainer(false) // Reset container view state
    // Reset individual item states
    setItemTitulo("")
    setMarca("")
    setModelo("")
    setFormatoVenta("unidad")
    setUnidadesPorPack("")
    setDescripcion("")
    setUnidadesPorPackActive(false)
    setVolumenActive(false)
    setVolumenCantidad("")
    setVolumenUnidad("")
    setProveedor("")
    setCodigoProveedor("")
    setAtributoKey1("")
    setAtributoPrincipal1("")
    setAtributoKey2("")
    setAtributoPrincipal2("")
    setContainerAtributosPrincipales([])
    setShowIndividualAtributosView(false)

    // Add to history
    const newHistory = navigationHistory.slice(0, historyIndex + 1)
    newHistory.push(gridView)
    setNavigationHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const getItemDisplayName = (item: any) => {
    const attributes = []

    // Collect all possible attributes with values
    if (item.medida) attributes.push(item.medida)
    if (item.largo) attributes.push(item.largo)
    if (item.unidades) attributes.push(item.unidades)
    if (item.material) attributes.push(item.material)
    if (item.cadena) attributes.push(item.cadena)
    if (item.color) attributes.push(item.color)

    // Return name with attributes (only if they exist)
    const attrString = attributes.slice(0, 2).join(" ")
    return attrString ? `${item.name} ${attrString}`.trim() : item.name
  }

  const handleCopySku = async () => {
    if (selectedItem?.sku) {
      await navigator.clipboard.writeText(selectedItem.sku)
      setSkuCopied(true)
      setTimeout(() => setSkuCopied(false), 2000)
    }
    // Handle SKU Padre for container items
    else if (isViewingContainer && selectedItem?.name) {
      const skuPadre = generateSkuPadre(selectedItem.name)
      await navigator.clipboard.writeText(skuPadre)
      setSkuCopied(true)
      setTimeout(() => setSkuCopied(false), 2000)
    }
  }

  const handleCopyCodigoUniversal = async () => {
    if (selectedItem?.codigoUniversal) {
      await navigator.clipboard.writeText(selectedItem.codigoUniversal)
      setCodigoUniversalCopied(true)
      setTimeout(() => setCodigoUniversalCopied(false), 2000)
    }
  }

  const handleDropdownMouseEnter = (index: number) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setHoveredDropdown(index)
  }

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredDropdown(null)
    }, 250)
  }

  const handleSearchMouseEnter = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    setHoveredSearch(true)
  }

  const handleSearchMouseLeave = () => {
    searchTimeoutRef.current = setTimeout(() => {
      setHoveredSearch(false)
      setSearchQuery("")
    }, 250)
  }

  const getMainAttributes = (item: any) => {
    if (!item) return { attr1: null, attr2: null }

    const attributes = []

    // Collect all possible attributes
    if (item.medida) attributes.push({ key: "Medida", value: item.medida })
    if (item.largo) attributes.push({ key: "Largo", value: item.largo })
    if (item.unidades) attributes.push({ key: "Unidades", value: item.unidades })
    if (item.material) attributes.push({ key: "Material", value: item.material })
    if (item.cadena) attributes.push({ key: "Cadena", value: item.cadena })
    if (item.color) attributes.push({ key: "Color", value: item.color })

    // Return first two attributes
    return {
      attr1: attributes[0] || null,
      attr2: attributes[1] || null,
    }
  }

  const mainAttributes = getMainAttributes(selectedItem)

  const generateSkuPadre = (title: string) => {
    return title
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(" ")
      .map((word) => word.substring(0, 3))
      .join("-")
      .substring(0, 15)
  }

  const applyTemplate = (templateName: string, isContainer: boolean) => {
    const template = TEMPLATES.find((t) => t.name === templateName)
    if (!template) return

    if (isContainer) {
      // For container items, use containerAtributosPrincipales with variantes
      setContainerAtributosPrincipales(
        template.atributosPrincipales.map((attr) => ({
          key: attr.key,
          variantes: [],
        })),
      )
      setAtributosInformativos(template.atributosInformativos)
      setShowAtributosView(true)
    } else {
      // For individual items, use regular atributosPrincipales
      setAtributosPrincipales(template.atributosPrincipales)
      setAtributosInformativos(template.atributosInformativos)
      setShowIndividualAtributosView(true)
    }

    setShowTemplateModal(false)
  }

  const handleCreateNuevoItem = () => {
    // Validate required field
    if (!itemTitulo.trim()) {
      alert("El título es obligatorio")
      return
    }

    // Generate unique SKU
    const generateSku = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let sku = ""
      for (let i = 0; i < 12; i++) {
        sku += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return sku
    }

    // Generate unique codigo universal
    const generateCodigoUniversal = () => {
      return Math.floor(Math.random() * 9000000000000) + 1000000000000
    }

    let atributosPrincipalesFromTemplate: Array<{ key: string; value: string }> = []
    let atributosInformativosFromTemplate: Array<{ key: string; value: string }> = []

    if (itemTemplate) {
      const template = TEMPLATES.find((t) => t.name === itemTemplate)
      if (template) {
        // Deep copy the template attributes to avoid reference issues
        atributosPrincipalesFromTemplate = template.atributosPrincipales.map((attr) => ({ ...attr }))
        atributosInformativosFromTemplate = template.atributosInformativos.map((attr) => ({ ...attr }))
      }
    }

    // Create new item object
    const newItem = {
      name: itemTitulo,
      medida: "-",
      color: "-",
      costo: "$0",
      precio: "$0",
      total: "0",
      reservado: "0",
      disponible: "0",
      hasVariants: false,
      isAgrupador: false,
      sku: generateSku(),
      codigoUniversal: generateCodigoUniversal().toString(),
      marca: "",
      modelo: "",
      formatoVenta: "unidad",
      proveedor: "",
      codigoProveedor: "",
      atributosPrincipales: atributosPrincipalesFromTemplate,
      atributosInformativos: atributosInformativosFromTemplate,
    }

    // Add new item to items array
    setItems([...items, newItem])

    // Close modal and reset form
    handleCloseNuevoItem()
  }

  const handleCreateNuevoItemConVariantes = () => {
    // Validate required field
    if (!itemTitulo.trim()) {
      alert("El título es obligatorio")
      return
    }

    // Generate unique SKU
    const generateSku = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let sku = ""
      for (let i = 0; i < 12; i++) {
        sku += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return sku
    }

    // Generate unique codigo universal
    const generateCodigoUniversal = () => {
      return Math.floor(Math.random() * 9000000000000) + 1000000000000
    }

    // Get template attributes if template is selected
    let containerAtributosPrincipalesFromTemplate: Array<{ key: string; variantes: string[] }> = []
    let atributosInformativosFromTemplate: Array<{ key: string; value: string }> = []

    if (itemTemplate) {
      const template = TEMPLATES.find((t) => t.name === itemTemplate)
      if (template) {
        // For container items, convert atributosPrincipales to container format with empty variantes
        containerAtributosPrincipalesFromTemplate = template.atributosPrincipales.map((attr) => ({
          key: attr.key,
          variantes: [],
        }))
        atributosInformativosFromTemplate = template.atributosInformativos.map((attr) => ({ ...attr }))
      }
    }

    // Create new container item object
    const newItem = {
      name: itemTitulo,
      medida: "-",
      color: "-",
      costo: "$0",
      precio: "$0",
      total: "0",
      reservado: "0",
      disponible: "0",
      hasVariants: true,
      isAgrupador: true,
      sku: generateSku(),
      codigoUniversal: generateCodigoUniversal().toString(),
      marca: "",
      modelo: "",
      formatoVenta: "unidad",
      proveedor: "",
      codigoProveedor: "",
      atributosPrincipales: containerAtributosPrincipalesFromTemplate,
      atributosInformativos: atributosInformativosFromTemplate,
      variants: [],
    }

    // Add new item to items array
    setItems([...items, newItem])

    // Close modal and reset form
    handleCloseNuevoItemConVariantes()
  }

  useEffect(() => {
    if (selectedItem && !selectedItem.isAgrupador && !selectedItem.hasVariants) {
      if (atributosPrincipales.length === 0 && atributosInformativos.length === 0) {
        setShowIndividualAtributosView(false)
      }
    }
  }, [atributosPrincipales, atributosInformativos, selectedItem])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <div className="w-16 bg-gray-900 border-r border-gray-800 px-2 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-40">
        <div className="flex items-center justify-center py-4">
          <img src="/images/logo.png" alt="Logo" className="w-10 h-10" />
        </div>

        <div className="w-full h-px bg-gray-700 mb-2" />

        {/* Search icon */}
        <div className="relative mb-2" onMouseEnter={handleSearchMouseEnter} onMouseLeave={handleSearchMouseLeave}>
          <button
            className={`w-12 h-12 flex items-center justify-center mx-auto rounded-md transition-all ${
              hoveredSearch || searchQuery
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            } ${hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""}`}
          >
            <Search className="w-5 h-5 flex-shrink-0" />
          </button>

          {hoveredSearch && (
            <div
              className="absolute left-full top-0 w-2 h-12 z-[100]"
              onMouseEnter={handleSearchMouseEnter}
              onMouseLeave={handleSearchMouseLeave}
            />
          )}

          {hoveredSearch && (
            <div
              className="absolute left-full top-0 ml-2 w-64 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] p-3"
              onMouseEnter={handleSearchMouseEnter}
              onMouseLeave={handleSearchMouseLeave}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar módulos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* Main navigation icons */}
        <nav className="space-y-0 flex-1">
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              className={`relative transition-all duration-300 ${
                hoveredDropdown !== null && hoveredDropdown !== index && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
              }`}
              onMouseEnter={() => item.hasDropdown && handleDropdownMouseEnter(index)}
              onMouseLeave={() => item.hasDropdown && handleDropdownMouseLeave()}
            >
              <button
                className={`flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors ${
                  item.active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </button>

              {item.hasDropdown && hoveredDropdown === index && (
                <div
                  className="absolute left-full top-0 w-2 h-12 z-[100]"
                  onMouseEnter={() => handleDropdownMouseEnter(index)}
                  onMouseLeave={handleDropdownMouseLeave}
                />
              )}

              {item.hasDropdown && hoveredDropdown === index && (
                <div
                  className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] animate-in fade-in-0 slide-in-from-left-2 duration-200"
                  onMouseEnter={() => handleDropdownMouseEnter(index)}
                  onMouseLeave={handleDropdownMouseLeave}
                  style={{ minHeight: "fit-content" }}
                >
                  {/* Module title */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
                  </div>

                  {/* Dropdown items */}
                  <div className="py-2">
                    {(searchQuery ? getFilteredDropdownItems(item.dropdownItems) : item.dropdownItems).map(
                      (dropdownItem, dropdownIndex) => (
                        <button
                          key={dropdownIndex}
                          onClick={() => {
                            if (dropdownItem === "Depósitos") {
                              window.location.href = "/depositos"
                            }
                          }}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            searchQuery && dropdownItem.toLowerCase().includes(searchQuery.toLowerCase())
                              ? "text-white bg-blue-500/20 hover:bg-blue-500/30"
                              : "text-gray-300 hover:text-white hover:bg-gray-700"
                          }`}
                        >
                          {dropdownItem}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {searchQuery && !hoveredDropdown && item.dropdownItems && hasMatchingItems(item.dropdownItems) && (
                <div
                  className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100]"
                  style={{ minHeight: "fit-content" }}
                >
                  {/* Module title */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
                  </div>

                  {/* Filtered dropdown items */}
                  <div className="py-2">
                    {getFilteredDropdownItems(item.dropdownItems).map((dropdownItem, dropdownIndex) => (
                      <button
                        key={dropdownIndex}
                        onClick={() => {
                          if (dropdownItem === "Depósitos") {
                            window.location.href = "/depositos"
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-white bg-blue-500/20 hover:bg-blue-500/30"
                      >
                        {dropdownItem}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom navigation icons */}
        <nav className="space-y-2 mt-auto mb-4">
          {bottomSidebarItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <button
                className={`flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors text-gray-400 hover:text-white hover:bg-gray-800 ${
                  hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col ml-16 transition-all duration-300">
        <div
          className="border-b border-gray-800 px-8 flex items-center justify-between fixed top-0 right-0 left-0 bg-gray-950 z-30 h-12"
          style={{ marginLeft: "4rem" }}
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Back/Forward navigation */}
            <button
              onClick={navigateBack}
              disabled={historyIndex === 0}
              className={`p-1.5 rounded-md transition-colors ${
                historyIndex === 0 ? "text-gray-600" : "text-gray-400 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={navigateForward}
              disabled={historyIndex === navigationHistory.length - 1}
              className={`p-1.5 rounded-md transition-colors ${
                historyIndex === navigationHistory.length - 1 ? "text-gray-600" : "text-gray-400 cursor-pointer"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Vertical divider */}
            <div className="h-6 w-px bg-gray-700" />

            <div className="flex items-center gap-1 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                  activeNavTab === "main" ? "bg-gray-800 text-white" : "bg-gray-700/50 text-gray-400"
                }`}
              >
                <span className="text-sm whitespace-nowrap">{currentView.label}</span>
              </div>

              {minimizedTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "nuevo-item") {
                      handleRestoreNuevoItem()
                    }
                    // Handle restoring "Nuevo Item con Variantes" tab
                    if (tab.id === "nuevo-item-variantes") {
                      setIsNuevoItemConVariantesMinimized(false)
                      setActiveNavTab("nuevo-item-variantes")
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors group ${
                    activeNavTab === tab.id ? "bg-gray-800 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <span className="text-sm whitespace-nowrap">{tab.label}</span>
                  {minimizedTabs.length > 0 && (
                    <X
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleCloseTabFromNavbar(tab.id, e)}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className={`fixed top-12 right-0 left-0 bg-gray-950 z-20 transition-all duration-200 ${showNuevoItemModal && !isNuevoItemMinimized ? "blur-sm" : ""} ${showNuevoItemConVariantesModal && !isNuevoItemConVariantesMinimized ? "blur-sm" : ""}`}
          style={{ marginLeft: "4rem" }}
        >
          {/* Toolbar */}
          {!selectedItem && (
            <div className="border-b border-gray-800 flex items-center justify-between py-0 h-16">
              <div className="flex items-center gap-2 pl-8">
                <div className="relative">
                  <div onMouseEnter={() => setShowNuevoDropdown(true)} onMouseLeave={() => setShowNuevoDropdown(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo
                    </Button>

                    {showNuevoDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <div className="py-1">
                          <button
                            onClick={handleOpenNuevoItem}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Nuevo Item
                          </button>
                          <button
                            onClick={handleOpenNuevoItemConVariantes}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2"
                          >
                            <Grid3x3 className="w-4 h-4" />
                            Nuevo Item con Variantes
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Nuevo Grupo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div
                    onMouseEnter={() => setShowAccionesDropdown(true)}
                    onMouseLeave={() => setShowAccionesDropdown(false)}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Acciones Masivas
                    </Button>

                    {showAccionesDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <div className="py-1">
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Importación Masiva
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edición Masiva
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex justify-center px-8">
                <div className="relative w-full max-w-2xl">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar artículos..."
                    className="w-full pl-10 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pr-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelectedItems}
                  className={`bg-gray-800 border-gray-700 ${
                    hasSelectedItems
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                      : "text-gray-600 cursor-default opacity-50"
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Mover
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelectedItems}
                  className={`bg-gray-800 border-gray-700 ${
                    hasSelectedItems
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                      : "text-gray-600 cursor-default opacity-50"
                  }`}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelectedItems}
                  className={`bg-gray-800 border-gray-700 ${
                    hasSelectedItems
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                      : "text-gray-600 cursor-default opacity-50"
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}

          {/* Tab Header */}
          {!selectedItem && (
            <div className="px-8 pt-2 pb-2">
              <div className="flex gap-2 h-9">
                <div className="w-4 flex items-center justify-center">
                  <button
                    onClick={handleSelectAllClick}
                    className={`w-4 h-4 ${selectAllActive ? "bg-gray-400" : "bg-gray-800"} border border-gray-700 rounded-md hover:cursor-pointer transition-colors flex items-center justify-center flex-shrink-0`}
                  ></button>
                </div>
                <div
                  className={`flex-1 border-b-0 border-t-0 border-r-0 border-l-0 ${gridSize !== "lg" ? "rounded-xs" : "rounded-md"} bg-gray-900/30 border border-gray-800 overflow-hidden`}
                >
                  <div className="grid grid-cols-11 h-full">
                    <div className="col-span-5 flex items-center px-4 border-r border-gray-800">
                      <span className="text-xs uppercase tracking-wider text-gray-400">Nombre</span>
                    </div>
                    <div className="col-span-3 flex items-center px-4 border-r border-gray-800">
                      <span className="text-xs uppercase tracking-wider text-gray-400">Atributos</span>
                    </div>
                    <div className="col-span-3 flex items-center px-4">
                      <span className="text-xs uppercase tracking-wider text-gray-400">Stock</span>
                    </div>
                  </div>
                </div>
                <div className="w-[108px] relative">
                  <button
                    onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
                    className="w-full h-full bg-gray-900/30 border border-gray-800 rounded-md flex items-center justify-between px-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-gray-400">Grilla</span>
                    <span className="text-xs text-white font-medium uppercase">{gridSize}</span>
                  </button>
                  {gridSizeDropdownOpen && (
                    <div className="absolute top-full mt-1 right-0 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50">
                      <button
                        onClick={() => {
                          setGridSize("lg")
                          setGridSizeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        LG
                      </button>
                      <button
                        onClick={() => {
                          setGridSize("md")
                          setGridSizeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        MD
                      </button>
                      <button
                        onClick={() => {
                          setGridSize("sm")
                          setGridSizeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        SM
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <main
          className={`flex-1 overflow-y-auto transition-all duration-200 ${showNuevoItemModal && !isNuevoItemMinimized ? "blur-sm" : ""} ${showNuevoItemConVariantesModal && !isNuevoItemConVariantesMinimized ? "blur-sm" : ""}`}
          style={{ marginTop: !selectedItem ? "10rem" : "3rem" }}
        >
          {selectedItem ? (
            <div className="px-8 pt-6">
              <div className="grid grid-cols-10 gap-0 h-[calc(100vh-5rem)]">
                <div className="col-span-3 flex flex-col gap-4 pr-6 border-r border-gray-700 h-full overflow-hidden align">
                  {/* Name */}
                  <div>
                    <h2 className="font-semibold text-white text-lg">{getItemDisplayName(selectedItem)}</h2>
                  </div>
                  <div className="border-t border-gray-800 my-0"></div>

                  {isViewingContainer ? (
                    // Container item view
                    <>
                      <div className="mb-3 mt-0">
                        <span className="text-xs text-gray-400 mb-0">SKU Padre</span>
                        <button
                          onClick={handleCopySku}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors group w-full"
                        >
                          <span className="text-xs text-gray-300 font-mono">{generateSkuPadre(selectedItem.name)}</span>
                          {skuCopied ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-300" />
                          )}
                        </button>
                      </div>

                      {/* Descripción field */}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Descripción</label>
                        <textarea
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          className="px-3 py-2 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-900 text-sm"
                          placeholder="Descripción del producto"
                          rows={4}
                        />
                      </div>
                    </>
                  ) : (
                    // Individual item view
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-3 mt-0">
                        <div className="col-span-1">
                          <span className="text-xs text-gray-400 mb-0">SKU</span>
                          <button
                            onClick={handleCopySku}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors group"
                          >
                            <span className="text-xs text-gray-300 font-mono">{selectedItem.sku}</span>
                            {skuCopied ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-300" />
                            )}
                          </button>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs text-gray-400">Código Universal</span>
                          <button
                            onClick={handleCopyCodigoUniversal}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors group"
                          >
                            <span className="text-xs text-gray-300 font-mono">{selectedItem.codigoUniversal}</span>
                            {codigoUniversalCopied ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-300" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="self-center w-full h-[275px] bg-gray-900/50 border border-gray-800 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-gray-600 text-sm">Imagen del producto</span>
                        </div>
                      </div>

                      {/* Descripción field below photo */}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Descripción</label>
                        <textarea
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          className="px-3 py-2 border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-gray-950 border"
                          placeholder="Descripción del producto"
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="col-span-7 flex flex-col pl-6 h-full overflow-hidden">
                  <div className="flex items-center gap-0 h-10 mb-4">
                    {isViewingContainer ? (
                      <>
                        <button
                          onClick={() => setSelectedDetailTab("info")}
                          className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                            selectedDetailTab === "info"
                              ? "border-blue-500 bg-gray-900/30 text-white"
                              : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                          }`}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">Info</span>
                        </button>
                        <button
                          onClick={() => setSelectedDetailTab("atributos")}
                          className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                            selectedDetailTab === "atributos"
                              ? "border-blue-500 bg-gray-900/30 text-white"
                              : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                          }`}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">Atributos</span>
                        </button>
                        <button
                          onClick={() => setSelectedDetailTab("variantes")}
                          className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                            selectedDetailTab === "variantes"
                              ? "border-blue-500 bg-gray-900/30 text-white"
                              : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                          }`}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">Variantes</span>
                        </button>
                        <button
                          onClick={() => setSelectedDetailTab("stock-variantes")}
                          className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                            selectedDetailTab === "stock-variantes"
                              ? "border-blue-500 bg-gray-900/30 text-white"
                              : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                          }`}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">Stock</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedDetailTab("info")}
                          className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                            selectedDetailTab === "info"
                              ? "border-blue-500 bg-gray-900/30 text-white"
                              : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                          }`}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">Info</span>
                        </button>
                        <button
                          onClick={() => setSelectedDetailTab("atributos")}
                          className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                            selectedDetailTab === "atributos"
                              ? "border-blue-500 bg-gray-900/30 text-white"
                              : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                          }`}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">Atributos</span>
                        </button>
                        <button
                          onClick={() => setSelectedDetailTab("stock")}
                          className={`flex-1 h-full flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
                            selectedDetailTab === "stock"
                              ? "border-blue-500 bg-gray-900/30 text-white"
                              : "border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-900/20"
                          }`}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">Stock</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {isViewingContainer ? (
                      // Container item tab content
                      <>
                        {selectedDetailTab === "info" && (
                          <div className="h-full flex flex-col py-2">
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                              Información del Producto
                            </h3>

                            <div className="space-y-3">
                              {/* Marca and Modelo on same line */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm text-gray-400">Título</label>
                                  <input
                                    type="text"
                                    value={itemTitulo}
                                    onChange={(e) => setItemTitulo(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Cierre Metálico"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-sm text-gray-400">Marca</label>
                                  <input
                                    type="text"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: YKK"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-gray-800 my-4"></div>

                              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                Presentación
                              </h3>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Left half: Formato de venta */}
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm text-gray-400">Formato de venta</label>
                                  <select
                                    value={formatoVenta}
                                    onChange={(e) => setFormatoVenta(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                  >
                                    <option value="unidad">Unidad</option>
                                    <option value="pack">Pack</option>
                                  </select>
                                </div>

                                {/* Right half: Unidades por pack toggle and input */}
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-400">Unidades por pack</label>
                                    <button
                                      onClick={() => setUnidadesPorPackActive(!unidadesPorPackActive)}
                                      className={`w-10 h-5 rounded-full transition-colors relative ${
                                        unidadesPorPackActive ? "bg-blue-500" : "bg-gray-700"
                                      }`}
                                    >
                                      <div
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                          unidadesPorPackActive ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <input
                                    type="number"
                                    value={unidadesPorPack}
                                    onChange={(e) => {
                                      const value = Number.parseInt(e.target.value) || 1
                                      setUnidadesPorPack(value < 1 ? "1" : e.target.value)
                                    }}
                                    disabled={!unidadesPorPackActive}
                                    min="1"
                                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                      unidadesPorPackActive
                                        ? "bg-gray-800 border-gray-700 text-white"
                                        : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                                    }`}
                                    placeholder="1"
                                  />
                                </div>
                              </div>

                              {/* Volumen de la unidad toggle and fields */}
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-gray-400">Volumen de la unidad</label>
                                  <button
                                    onClick={() => setVolumenActive(!volumenActive)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${
                                      volumenActive ? "bg-blue-500" : "bg-gray-700"
                                    }`}
                                  >
                                    <div
                                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                        volumenActive ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {volumenActive && (
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex flex-col gap-2">
                                      <label className="text-sm text-gray-400">Cantidad</label>
                                      <input
                                        type="number"
                                        value={volumenCantidad}
                                        onChange={(e) => setVolumenCantidad(e.target.value)}
                                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <label className="text-sm text-gray-400">Unidad de medida</label>
                                      <select
                                        value={volumenUnidad}
                                        onChange={(e) => setVolumenUnidad(e.target.value)}
                                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                      >
                                        <option value="ml">ml</option>
                                        <option value="l">l</option>
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="cm">cm</option>
                                        <option value="m">m</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="border-t border-gray-800 my-4"></div>

                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                              Información del Proveedor
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400">Proveedor</label>
                                <input
                                  type="text"
                                  value={proveedor}
                                  onChange={(e) => setProveedor(e.target.value)}
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder="Nombre del proveedor"
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400">Código Proveedor</label>
                                <input
                                  type="text"
                                  value={codigoProveedor}
                                  onChange={(e) => setCodigoProveedor(e.target.value)}
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder="Código del item"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedDetailTab === "atributos" && (
                          <div className="h-full flex flex-col py-2">
                            {!showAtributosView &&
                            containerAtributosPrincipales.length === 0 &&
                            atributosInformativos.length === 0 ? (
                              <div className="flex flex-col items-center justify-center gap-4 h-full">
                                <button
                                  onClick={() => {
                                    setIsSelectingTemplateForContainer(true)
                                    setShowTemplateModal(true)
                                  }}
                                  className="w-64 py-3 border-2 border-dashed border-gray-700 rounded-md text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                                >
                                  Usar Template
                                </button>
                                <button
                                  onClick={() => setShowAtributosView(true)}
                                  className="w-64 py-3 border-2 border-dashed border-gray-700 rounded-md text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                                >
                                  Agregar Atributos
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <p className="text-xs text-gray-300 italic mt-1">
                                  Todos los atributos asignados acá serán comunes entre las variantes del item.
                                </p>
                                {/* Atributos principales */}
                                <div className="flex flex-col gap-3">
                                  <div>
                                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                      Atributos Principales
                                    </h3>
                                    <p className="text-xs text-gray-500 italic mt-1">
                                      Estos atributos se concatenan con el título del producto, y figuran en el segmento
                                      "Atributos" de la grilla de items.
                                    </p>
                                  </div>

                                  {containerAtributosPrincipales.map((attr, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      {/* Atributo field with autocomplete */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                              <span className={attr.key ? "" : "text-gray-500"}>
                                                {attr.key || "Ej: Color"}
                                              </span>
                                              <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandInput
                                                placeholder="Buscar o escribir..."
                                                value={attr.key}
                                                onValueChange={(value) => {
                                                  const updated = [...containerAtributosPrincipales]
                                                  updated[index].key = value
                                                  setContainerAtributosPrincipales(updated)
                                                }}
                                              />
                                              <CommandList>
                                                <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                                <CommandGroup>
                                                  {Object.keys(SAVED_ATRIBUTOS)
                                                    .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                                    .map((key) => (
                                                      <CommandItem
                                                        key={key}
                                                        value={key}
                                                        onSelect={() => {
                                                          const updated = [...containerAtributosPrincipales]
                                                          updated[index].key = key
                                                          setContainerAtributosPrincipales(updated)
                                                        }}
                                                      >
                                                        {key}
                                                      </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                      </div>

                                      {/* Variantes field with tag input */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Variantes</label>
                                        <div className="space-y-2">
                                          {/* Input with autocomplete */}
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <div className="relative">
                                                <input
                                                  type="text"
                                                  placeholder="Agregar variante..."
                                                  value={varianteInput[index] || ""}
                                                  onChange={(e) => {
                                                    setVarianteInput({ ...varianteInput, [index]: e.target.value })
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter" && varianteInput[index]?.trim()) {
                                                      e.preventDefault()
                                                      const updated = [...containerAtributosPrincipales]
                                                      if (
                                                        !updated[index].variantes.includes(varianteInput[index].trim())
                                                      ) {
                                                        updated[index].variantes.push(varianteInput[index].trim())
                                                        setContainerAtributosPrincipales(updated)
                                                      }
                                                      setVarianteInput({ ...varianteInput, [index]: "" })
                                                    }
                                                  }}
                                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                              </div>
                                            </PopoverTrigger>
                                            {attr.key &&
                                              SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] &&
                                              varianteInput[index] && (
                                                <PopoverContent className="w-[200px] p-0" align="start">
                                                  <Command>
                                                    <CommandList>
                                                      <CommandGroup>
                                                        {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                          .filter(
                                                            (val) =>
                                                              val
                                                                .toLowerCase()
                                                                .includes((varianteInput[index] || "").toLowerCase()) &&
                                                              !attr.variantes.includes(val),
                                                          )
                                                          .map((val) => (
                                                            <CommandItem
                                                              key={val}
                                                              value={val}
                                                              onSelect={() => {
                                                                const updated = [...containerAtributosPrincipales]
                                                                if (!updated[index].variantes.includes(val)) {
                                                                  updated[index].variantes.push(val)
                                                                  setContainerAtributosPrincipales(updated)
                                                                }
                                                                setVarianteInput({ ...varianteInput, [index]: "" })
                                                              }}
                                                            >
                                                              {val}
                                                            </CommandItem>
                                                          ))}
                                                      </CommandGroup>
                                                    </CommandList>
                                                  </Command>
                                                </PopoverContent>
                                              )}
                                          </Popover>

                                          {/* Display variantes as badges */}
                                          {attr.variantes.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                              {attr.variantes.map((variante, vIndex) => (
                                                <Badge
                                                  key={vIndex}
                                                  variant="secondary"
                                                  className="bg-gray-800 text-white border border-gray-700 px-2 py-1 flex items-center gap-1"
                                                >
                                                  {variante}
                                                  <button
                                                    onClick={() => {
                                                      const updated = [...containerAtributosPrincipales]
                                                      updated[index].variantes = updated[index].variantes.filter(
                                                        (_, i) => i !== vIndex,
                                                      )
                                                      setContainerAtributosPrincipales(updated)
                                                    }}
                                                    className="ml-1 hover:text-red-400"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Delete button */}
                                      <button
                                        onClick={() => {
                                          const updated = containerAtributosPrincipales.filter((_, i) => i !== index)
                                          setContainerAtributosPrincipales(updated)
                                        }}
                                        className="mt-7 p-2 text-gray-400 hover:text-red-400 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}

                                  {containerAtributosPrincipales.length < 2 && (
                                    <button
                                      onClick={() => {
                                        setContainerAtributosPrincipales([
                                          ...containerAtributosPrincipales,
                                          { key: "", variantes: [] },
                                        ])
                                      }}
                                      className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span className="text-sm">Agregar atributo</span>
                                    </button>
                                  )}
                                </div>

                                {/* Atributos Informativos */}
                                <div className="flex flex-col gap-3 pt-3 border-t border-gray-800">
                                  <div>
                                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                      Atributos Informativos
                                    </h3>
                                    <p className="text-xs text-gray-500 italic mt-1">
                                      Atributos que describen características generales del producto
                                    </p>
                                  </div>

                                  {atributosInformativos.map((attr, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      {/* Atributo field with autocomplete */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                              <span className={attr.key ? "" : "text-gray-500"}>
                                                {attr.key || "Ej: Color"}
                                              </span>
                                              <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandInput
                                                placeholder="Buscar o escribir..."
                                                value={attr.key}
                                                onValueChange={(value) => {
                                                  const updated = [...atributosInformativos]
                                                  updated[index].key = value
                                                  setAtributosInformativos(updated)
                                                }}
                                              />
                                              <CommandList>
                                                <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                                <CommandGroup>
                                                  {Object.keys(SAVED_ATRIBUTOS)
                                                    .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                                    .map((key) => (
                                                      <CommandItem
                                                        key={key}
                                                        value={key}
                                                        onSelect={() => {
                                                          const updated = [...atributosInformativos]
                                                          updated[index].key = key
                                                          setAtributosInformativos(updated)
                                                        }}
                                                      >
                                                        {key}
                                                      </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                      </div>

                                      {/* Dato field with conditional autocomplete */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Dato</label>
                                        {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] ? (
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                                <span className={attr.value ? "" : "text-gray-500"}>
                                                  {attr.value || "Ej: Negro"}
                                                </span>
                                                <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                              </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0" align="start">
                                              <Command>
                                                <CommandInput
                                                  placeholder="Buscar o escribir..."
                                                  value={attr.value}
                                                  onValueChange={(value) => {
                                                    const updated = [...atributosInformativos]
                                                    updated[index].value = value
                                                    setAtributosInformativos(updated)
                                                  }}
                                                />
                                                <CommandList>
                                                  <CommandEmpty>Presiona Enter para usar "{attr.value}"</CommandEmpty>
                                                  <CommandGroup>
                                                    {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                      .filter((val) =>
                                                        val.toLowerCase().includes(attr.value.toLowerCase()),
                                                      )
                                                      .map((val) => (
                                                        <CommandItem
                                                          key={val}
                                                          value={val}
                                                          onSelect={() => {
                                                            const updated = [...atributosInformativos]
                                                            updated[index].value = val
                                                            setAtributosInformativos(updated)
                                                          }}
                                                        >
                                                          {val}
                                                        </CommandItem>
                                                      ))}
                                                  </CommandGroup>
                                                </CommandList>
                                              </Command>
                                            </PopoverContent>
                                          </Popover>
                                        ) : (
                                          <input
                                            type="text"
                                            value={attr.value}
                                            onChange={(e) => {
                                              const updated = [...atributosInformativos]
                                              updated[index].value = e.target.value
                                              setAtributosInformativos(updated)
                                            }}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ej: Negro"
                                          />
                                        )}
                                      </div>

                                      {/* Delete button */}
                                      <button
                                        onClick={() => {
                                          const updated = atributosInformativos.filter((_, i) => i !== index)
                                          setAtributosInformativos(updated)
                                        }}
                                        className="mt-7 text-gray-500 hover:text-red-400 cursor-pointer"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}

                                  <button
                                    onClick={() => {
                                      setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
                                    }}
                                    className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm">Agregar atributo</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedDetailTab === "variantes" && (
                          <div className="h-full flex flex-col py-2">
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                              Variantes
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                              Items generados por la combinación de variantes de atributos principales.
                            </p>

                            {variantItems.length > 0 ? (
                              <div className="border border-gray-800 rounded-lg overflow-hidden">
                                {/* Header */}
                                <div className="grid grid-cols-4 bg-gray-900/50 border-b border-gray-800">
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    SKU
                                  </div>
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Código Universal
                                  </div>
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Descripción
                                  </div>
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Foto
                                  </div>
                                </div>

                                {/* Rows */}
                                {variantItems.map((variant, index) => (
                                  <div
                                    key={variant.sku}
                                    className="grid grid-cols-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-900/30"
                                  >
                                    <div className="px-4 py-3 text-sm text-gray-300 font-mono">{variant.sku}</div>
                                    <div className="px-4 py-3">
                                      <input
                                        type="text"
                                        value={variant.codigoUniversal}
                                        onChange={(e) =>
                                          updateVariantField(variant.sku, "codigoUniversal", e.target.value)
                                        }
                                        placeholder="Código..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div className="px-4 py-3">
                                      <input
                                        type="text"
                                        value={variant.descripcion}
                                        onChange={(e) => updateVariantField(variant.sku, "descripcion", e.target.value)}
                                        placeholder="Descripción..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div className="px-4 py-3">
                                      <input
                                        type="text"
                                        value={variant.foto}
                                        onChange={(e) => updateVariantField(variant.sku, "foto", e.target.value)}
                                        placeholder="URL de foto..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center py-12 text-gray-500">
                                <p className="text-sm">
                                  No hay variantes configuradas. Agrega variantes en la sección de Atributos.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedDetailTab === "stock-variantes" && (
                          <div className="h-full flex flex-col py-2">
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Stock</h3>
                            <p className="text-xs text-gray-500 mb-4">Stock por depósito de cada variante.</p>

                            {variantItems.length > 0 ? (
                              <div className="space-y-2">
                                {variantItems.map((variant) => (
                                  <div key={variant.sku} className="border border-gray-800 rounded-lg overflow-hidden">
                                    {/* Variant header - clickable to expand */}
                                    <button
                                      onClick={() => toggleVariantStockExpansion(variant.sku)}
                                      className="w-full px-4 py-3 bg-gray-900/50 hover:bg-gray-900/70 transition-colors flex items-center justify-between"
                                    >
                                      <span className="text-sm text-gray-300 font-mono">{variant.sku}</span>
                                      <ChevronDown
                                        className={`w-4 h-4 text-gray-400 transition-transform ${
                                          expandedVariantStock[variant.sku] ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>

                                    {/* Expandable stock grid */}
                                    {expandedVariantStock[variant.sku] && depositStock[variant.sku] && (
                                      <div className="border-t border-gray-800">
                                        <div className="grid grid-cols-4 bg-gray-900/30 border-b border-gray-800">
                                          <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Depósito
                                          </div>
                                          <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                            Total
                                          </div>
                                          <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                            Reservado
                                          </div>
                                          <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                            Disponible
                                          </div>
                                        </div>

                                        {(["Ibiza", "Trujui", "Ciudadela"] as const).map((deposit) => {
                                          const stock = depositStock[variant.sku][deposit]
                                          const disponible = stock.total - stock.reservado

                                          return (
                                            <div
                                              key={deposit}
                                              className="grid grid-cols-4 border-b border-gray-800 last:border-b-0"
                                            >
                                              <div className="px-4 py-3 text-sm text-gray-300">{deposit}</div>
                                              <div className="px-4 py-3 text-sm text-gray-300 text-right">
                                                <input
                                                  type="number"
                                                  value={stock.total}
                                                  onChange={(e) =>
                                                    updateDepositStock(
                                                      variant.sku,
                                                      deposit,
                                                      "total",
                                                      Number.parseInt(e.target.value) || 0,
                                                    )
                                                  }
                                                  className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded"
                                                />
                                              </div>
                                              <div className="px-4 py-3 text-sm text-gray-300 text-right">
                                                <input
                                                  type="number"
                                                  value={stock.reservado}
                                                  onChange={(e) =>
                                                    updateDepositStock(
                                                      variant.sku,
                                                      deposit,
                                                      "reservado",
                                                      Number.parseInt(e.target.value) || 0,
                                                    )
                                                  }
                                                  className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded"
                                                />
                                              </div>
                                              <div className="px-4 py-3 text-sm text-gray-300 text-right">
                                                {disponible}
                                              </div>
                                            </div>
                                          )
                                        })}

                                        <div className="grid grid-cols-4 bg-gray-900/70 font-medium">
                                          <div className="px-4 py-3 text-sm text-gray-200">Global</div>
                                          <div className="px-4 py-3 text-sm text-gray-200 text-right">
                                            {Object.values(depositStock[variant.sku]).reduce(
                                              (sum, d) => sum + d.total,
                                              0,
                                            )}
                                          </div>
                                          <div className="px-4 py-3 text-sm text-gray-200 text-right">
                                            {Object.values(depositStock[variant.sku]).reduce(
                                              (sum, d) => sum + d.reservado,
                                              0,
                                            )}
                                          </div>
                                          <div className="px-4 py-3 text-sm text-gray-200 text-right">
                                            {Object.values(depositStock[variant.sku]).reduce(
                                              (sum, d) => sum + (d.total - d.reservado),
                                              0,
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center py-12 text-gray-500">
                                <p className="text-sm">
                                  No hay variantes configuradas. Agrega variantes en la sección de Atributos.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // Individual item tab content (existing)
                      <>
                        {selectedDetailTab === "info" && (
                          <div className="h-full flex flex-col py-2">
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                              Información del Producto
                            </h3>

                            <div className="space-y-3">
                              {/* Título and Marca */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm text-gray-400">Título</label>
                                  <input
                                    type="text"
                                    value={itemTitulo}
                                    onChange={(e) => setItemTitulo(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Cierre Metálico"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-sm text-gray-400">Marca</label>
                                  <input
                                    type="text"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: YKK"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-gray-800 my-4"></div>

                              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                Presentación
                              </h3>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Left half: Formato de venta */}
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm text-gray-400">Formato de venta</label>
                                  <select
                                    value={formatoVenta}
                                    onChange={(e) => setFormatoVenta(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                  >
                                    <option value="unidad">Unidad</option>
                                    <option value="pack">Pack</option>
                                  </select>
                                </div>

                                {/* Right half: Unidades por pack toggle and input */}
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-400">Unidades por pack</label>
                                    <button
                                      onClick={() => setUnidadesPorPackActive(!unidadesPorPackActive)}
                                      className={`w-10 h-5 rounded-full transition-colors relative ${
                                        unidadesPorPackActive ? "bg-blue-500" : "bg-gray-700"
                                      }`}
                                    >
                                      <div
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                          unidadesPorPackActive ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <input
                                    type="number"
                                    value={unidadesPorPack}
                                    onChange={(e) => {
                                      const value = Number.parseInt(e.target.value) || 1
                                      setUnidadesPorPack(value < 1 ? "1" : e.target.value)
                                    }}
                                    disabled={!unidadesPorPackActive}
                                    min="1"
                                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                      unidadesPorPackActive
                                        ? "bg-gray-800 border-gray-700 text-white"
                                        : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                                    }`}
                                    placeholder="1"
                                  />
                                </div>
                              </div>

                              {/* Volumen de la unidad toggle and fields */}
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-gray-400">Volumen de la unidad</label>
                                  <button
                                    onClick={() => setVolumenActive(!volumenActive)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${
                                      volumenActive ? "bg-blue-500" : "bg-gray-700"
                                    }`}
                                  >
                                    <div
                                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                        volumenActive ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {volumenActive && (
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex flex-col gap-2">
                                      <label className="text-sm text-gray-400">Cantidad</label>
                                      <input
                                        type="number"
                                        value={volumenCantidad}
                                        onChange={(e) => setVolumenCantidad(e.target.value)}
                                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <label className="text-sm text-gray-400">Unidad de medida</label>
                                      <select
                                        value={volumenUnidad}
                                        onChange={(e) => setVolumenUnidad(e.target.value)}
                                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                      >
                                        <option value="ml">ml</option>
                                        <option value="l">l</option>
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="cm">cm</option>
                                        <option value="m">m</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="border-t border-gray-800 my-4"></div>

                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                              Información del Proveedor
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400">Proveedor</label>
                                <input
                                  type="text"
                                  value={proveedor}
                                  onChange={(e) => setProveedor(e.target.value)}
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder="Nombre del proveedor"
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400">Código Proveedor</label>
                                <input
                                  type="text"
                                  value={codigoProveedor}
                                  onChange={(e) => setCodigoProveedor(e.target.value)}
                                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder="Código del item"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedDetailTab === "atributos" && (
                          <div className="h-full flex flex-col py-2">
                            {!showIndividualAtributosView &&
                            atributosPrincipales.length === 0 &&
                            atributosInformativos.length === 0 ? (
                              <div className="flex flex-col items-center justify-center gap-4 h-full">
                                <button
                                  onClick={() => {
                                    setIsSelectingTemplateForContainer(false)
                                    setShowTemplateModal(true)
                                  }}
                                  className="w-64 py-3 border-2 border-dashed border-gray-700 rounded-md text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                                >
                                  Usar Template
                                </button>
                                <button
                                  onClick={() => setShowIndividualAtributosView(true)}
                                  className="w-64 py-3 border-2 border-dashed border-gray-700 rounded-md text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                                >
                                  Agregar Atributos
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* Atributos principales */}
                                <div className="flex flex-col gap-3">
                                  <div>
                                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                      Atributos Principales
                                    </h3>
                                    <p className="text-xs text-gray-500 italic mt-1">
                                      Estos atributos se concatenan con el título del producto, y figuran en el segmento
                                      "Atributos" de la grilla de items.
                                    </p>
                                  </div>

                                  {atributosPrincipales.map((attr, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      {/* Atributo field with autocomplete */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                              <span className={attr.key ? "" : "text-gray-500"}>
                                                {attr.key || "Ej: Color"}
                                              </span>
                                              <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandInput
                                                placeholder="Buscar o escribir..."
                                                value={attr.key}
                                                onValueChange={(value) => {
                                                  const updated = [...atributosPrincipales]
                                                  updated[index].key = value
                                                  setAtributosPrincipales(updated)
                                                  updateProductTitle()
                                                }}
                                              />
                                              <CommandList>
                                                <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                                <CommandGroup>
                                                  {Object.keys(SAVED_ATRIBUTOS)
                                                    .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                                    .map((key) => (
                                                      <CommandItem
                                                        key={key}
                                                        value={key}
                                                        onSelect={() => {
                                                          const updated = [...atributosPrincipales]
                                                          updated[index].key = key
                                                          setAtributosPrincipales(updated)
                                                          updateProductTitle()
                                                        }}
                                                      >
                                                        {key}
                                                      </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                      </div>

                                      {/* Dato field with conditional autocomplete */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Dato</label>
                                        {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] ? (
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                                <span className={attr.value ? "" : "text-gray-500"}>
                                                  {attr.value || "Ej: Negro"}
                                                </span>
                                                <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                              </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0" align="start">
                                              <Command>
                                                <CommandInput
                                                  placeholder="Buscar o escribir..."
                                                  value={attr.value}
                                                  onValueChange={(value) => {
                                                    const updated = [...atributosPrincipales]
                                                    updated[index].value = value
                                                    setAtributosPrincipales(updated)
                                                    updateProductTitle()
                                                  }}
                                                />
                                                <CommandList>
                                                  <CommandEmpty>Presiona Enter para usar "{attr.value}"</CommandEmpty>
                                                  <CommandGroup>
                                                    {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                      .filter((val) =>
                                                        val.toLowerCase().includes(attr.value.toLowerCase()),
                                                      )
                                                      .map((val) => (
                                                        <CommandItem
                                                          key={val}
                                                          value={val}
                                                          onSelect={() => {
                                                            const updated = [...atributosPrincipales]
                                                            updated[index].value = val
                                                            setAtributosPrincipales(updated)
                                                            updateProductTitle()
                                                          }}
                                                        >
                                                          {val}
                                                        </CommandItem>
                                                      ))}
                                                  </CommandGroup>
                                                </CommandList>
                                              </Command>
                                            </PopoverContent>
                                          </Popover>
                                        ) : (
                                          <input
                                            type="text"
                                            value={attr.value}
                                            onChange={(e) => {
                                              const updated = [...atributosPrincipales]
                                              updated[index].value = e.target.value
                                              setAtributosPrincipales(updated)
                                              updateProductTitle()
                                            }}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ej: Negro"
                                          />
                                        )}
                                      </div>

                                      {/* Delete button */}
                                      <button
                                        onClick={() => {
                                          const updated = atributosPrincipales.filter((_, i) => i !== index)
                                          setAtributosPrincipales(updated)
                                          updateProductTitle()
                                        }}
                                        className="mt-7 text-gray-500 hover:text-red-400 cursor-pointer"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}

                                  {/* Add button for principales (max 2) */}
                                  {atributosPrincipales.length < 2 && (
                                    <button
                                      onClick={() => {
                                        setAtributosPrincipales([...atributosPrincipales, { key: "", value: "" }])
                                      }}
                                      className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span className="text-sm">Agregar atributo</span>
                                    </button>
                                  )}
                                </div>

                                {/* Atributos informativos */}
                                <div className="flex flex-col gap-3 pt-3 border-t border-gray-800">
                                  <div>
                                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                                      Atributos Informativos
                                    </h3>
                                    <p className="text-xs text-gray-500 italic mt-1">
                                      Atributos que describen características generales del producto
                                    </p>
                                  </div>

                                  {atributosInformativos.map((attr, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      {/* Atributo field with autocomplete */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Atributo</label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                              <span className={attr.key ? "" : "text-gray-500"}>
                                                {attr.key || "Ej: Color"}
                                              </span>
                                              <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[200px] p-0" align="start">
                                            <Command>
                                              <CommandInput
                                                placeholder="Buscar o escribir..."
                                                value={attr.key}
                                                onValueChange={(value) => {
                                                  const updated = [...atributosInformativos]
                                                  updated[index].key = value
                                                  setAtributosInformativos(updated)
                                                }}
                                              />
                                              <CommandList>
                                                <CommandEmpty>Presiona Enter para usar "{attr.key}"</CommandEmpty>
                                                <CommandGroup>
                                                  {Object.keys(SAVED_ATRIBUTOS)
                                                    .filter((key) => key.toLowerCase().includes(attr.key.toLowerCase()))
                                                    .map((key) => (
                                                      <CommandItem
                                                        key={key}
                                                        value={key}
                                                        onSelect={() => {
                                                          const updated = [...atributosInformativos]
                                                          updated[index].key = key
                                                          setAtributosInformativos(updated)
                                                        }}
                                                      >
                                                        {key}
                                                      </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                      </div>

                                      {/* Dato field with conditional autocomplete */}
                                      <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-2 block">Dato</label>
                                        {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS] ? (
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <button className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                                                <span className={attr.value ? "" : "text-gray-500"}>
                                                  {attr.value || "Ej: Negro"}
                                                </span>
                                                <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                              </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0" align="start">
                                              <Command>
                                                <CommandInput
                                                  placeholder="Buscar o escribir..."
                                                  value={attr.value}
                                                  onValueChange={(value) => {
                                                    const updated = [...atributosInformativos]
                                                    updated[index].value = value
                                                    setAtributosInformativos(updated)
                                                  }}
                                                />
                                                <CommandList>
                                                  <CommandEmpty>Presiona Enter para usar "{attr.value}"</CommandEmpty>
                                                  <CommandGroup>
                                                    {SAVED_ATRIBUTOS[attr.key as keyof typeof SAVED_ATRIBUTOS]
                                                      .filter((val) =>
                                                        val.toLowerCase().includes(attr.value.toLowerCase()),
                                                      )
                                                      .map((val) => (
                                                        <CommandItem
                                                          key={val}
                                                          value={val}
                                                          onSelect={() => {
                                                            const updated = [...atributosInformativos]
                                                            updated[index].value = val
                                                            setAtributosInformativos(updated)
                                                          }}
                                                        >
                                                          {val}
                                                        </CommandItem>
                                                      ))}
                                                  </CommandGroup>
                                                </CommandList>
                                              </Command>
                                            </PopoverContent>
                                          </Popover>
                                        ) : (
                                          <input
                                            type="text"
                                            value={attr.value}
                                            onChange={(e) => {
                                              const updated = [...atributosInformativos]
                                              updated[index].value = e.target.value
                                              setAtributosInformativos(updated)
                                            }}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ej: Negro"
                                          />
                                        )}
                                      </div>

                                      {/* Delete button with X icon */}
                                      <button
                                        onClick={() => {
                                          const updated = atributosInformativos.filter((_, i) => i !== index)
                                          setAtributosInformativos(updated)
                                        }}
                                        className="mt-7 text-gray-500 hover:text-red-400 cursor-pointer"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}

                                  <button
                                    onClick={() => {
                                      setAtributosInformativos([...atributosInformativos, { key: "", value: "" }])
                                    }}
                                    className="w-full px-3 py-2 border border-dashed border-gray-700 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm">Agregar atributo</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedDetailTab === "stock" && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                              Stock por depósito
                            </h3>

                            {selectedItem?.sku && depositStock[selectedItem.sku] && (
                              <div className="border border-gray-800 rounded-lg overflow-hidden">
                                <div className="grid grid-cols-4 bg-gray-900/50 border-b border-gray-800">
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Depósito
                                  </div>
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                    Total
                                  </div>
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                    Reservado
                                  </div>
                                  <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                                    Disponible
                                  </div>
                                </div>

                                {(["Ibiza", "Trujui", "Ciudadela"] as const).map((deposit) => {
                                  const stock = depositStock[selectedItem.sku!][deposit]
                                  const disponible = stock.total - stock.reservado

                                  return (
                                    <div
                                      key={deposit}
                                      className="grid grid-cols-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-900/30"
                                    >
                                      <div className="px-4 py-3 text-sm text-gray-300">{deposit}</div>
                                      <div className="px-4 py-3 text-sm text-gray-300 text-right">
                                        <input
                                          type="number"
                                          value={stock.total}
                                          onChange={(e) =>
                                            updateDepositStock(
                                              selectedItem.sku!,
                                              deposit,
                                              "total",
                                              Number.parseInt(e.target.value) || 0,
                                            )
                                          }
                                          className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded"
                                        />
                                      </div>
                                      <div className="px-4 py-3 text-sm text-gray-300 text-right">
                                        <input
                                          type="number"
                                          value={stock.reservado}
                                          onChange={(e) =>
                                            updateDepositStock(
                                              selectedItem.sku!,
                                              deposit,
                                              "reservado",
                                              Number.parseInt(e.target.value) || 0,
                                            )
                                          }
                                          className="w-full bg-transparent text-right focus:outline-none focus:bg-gray-900/50 px-2 py-1 rounded"
                                        />
                                      </div>
                                      <div className="px-4 py-3 text-sm text-gray-300 text-right">{disponible}</div>
                                    </div>
                                  )
                                })}

                                <div className="grid grid-cols-4 bg-gray-900/70 font-medium">
                                  <div className="px-4 py-3 text-sm text-gray-200">Global</div>
                                  <div className="px-4 py-3 text-sm text-gray-200 text-right">
                                    {Object.values(depositStock[selectedItem.sku]).reduce((sum, d) => sum + d.total, 0)}
                                  </div>
                                  <div className="px-4 py-3 text-sm text-gray-200 text-right">
                                    {Object.values(depositStock[selectedItem.sku]).reduce(
                                      (sum, d) => sum + d.reservado,
                                      0,
                                    )}
                                  </div>
                                  <div className="px-4 py-3 text-sm text-gray-200 text-right">
                                    {Object.values(depositStock[selectedItem.sku]).reduce(
                                      (sum, d) => sum + (d.total - d.reservado),
                                      0,
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Items Grid */}
              <div className={`px-8 flex flex-col pb-8 mt-1 ${gridSize === "lg" ? "gap-2" : "gap-0"}`}>
                <div className={gridSize === "lg" ? "space-y-2" : "space-y-0"}>
                  {items.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleItemButtonClick(index)}
                          className={`w-4 h-4 ${itemSelected[index] ? "bg-gray-400" : "bg-gray-800"} border border-gray-700 rounded-md hover:cursor-pointer transition-colors flex items-center justify-center flex-shrink-0`}
                        ></button>

                        <div
                          className={`flex-1 ${gridSize === "lg" ? "h-18" : gridSize === "md" ? "h-12" : "h-6"} ${gridSize !== "lg" ? "rounded-xs" : "rounded-md"} grid grid-cols-11 ${
                            item.isAgrupador || item.hasVariants
                              ? // Added left border to container items based on type
                                `bg-cyan-9 border border-gray-800 hover:bg-slate-900/30 transition-colors cursor-pointer ${
                                  item.hasVariants
                                    ? "border-l-4 border-l-green-500/50"
                                    : "border-l-4 border-l-blue-500/50"
                                }`
                              : "bg-slate-900 border border-gray-800"
                          }`}
                          onClick={(e) => {
                            if (item.hasVariants || item.isAgrupador) {
                              toggleVariantExpansion(index)
                            }
                          }}
                        >
                          {/* Update container item click handler in the grid */}
                          <div
                            className={`col-span-5 flex flex-col justify-center h-full border-r border-gray-700 ${gridSize === "sm" ? "gap-0" : "gap-0.5"} px-4 cursor-pointer transition-colors ${
                              item.hasVariants || item.isAgrupador ? "hover:bg-gray-800/50" : "hover:bg-gray-800/50"
                            }`}
                            onClick={(e) => {
                              if (item.hasVariants || item.isAgrupador) {
                                // Open container detail view
                                handleItemClick(item, "info", true)
                              } else {
                                handleItemClick(item, "info", false)
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {(item.hasVariants || item.isAgrupador) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleVariantExpansion(index)
                                  }}
                                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  {expandedItems[index] ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                {item.name}
                              </span>
                            </div>
                            {gridSize !== "sm" && !item.hasVariants && !item.isAgrupador && item.sku && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(item.sku)
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-mono hover:text-gray-400 transition-colors group w-fit"
                              >
                                <span>SKU: {item.sku}</span>
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            )}
                          </div>

                          {item.hasVariants ? (
                            <>
                              <div className="col-span-3 h-full flex items-center justify-center border-r border-gray-700 px-4">
                                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                  Item con variantes
                                </span>
                              </div>

                              <div className="col-span-3 h-full flex items-center justify-center px-4">
                                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-400`}>
                                  {item.variantCount} variantes
                                </span>
                              </div>
                            </>
                          ) : item.isAgrupador ? (
                            <>
                              <div className="col-span-3 h-full flex items-center justify-center border-r border-gray-700 px-4">
                                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                  Grupo
                                </span>
                              </div>

                              <div className="col-span-3 h-full flex items-center justify-center px-4">
                                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-400`}>
                                  {item.itemCount} items
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div
                                className="col-span-3 h-full flex items-center gap-3 border-r border-gray-700 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleItemClick(item, "atributos")
                                }}
                              >
                                {item.atributosPrincipales && item.atributosPrincipales.length > 0 ? (
                                  <>
                                    {item.atributosPrincipales.map((attr, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {attr.key}
                                          </span>
                                        )}
                                        <span
                                          className={`${gridSize === "sm" ? "text-xs" : "text-sm"} ${attr.value ? "text-gray-300" : "text-gray-500"}`}
                                        >
                                          {attr.value || "-"}
                                        </span>
                                      </div>
                                    ))}
                                    {/* If only 1 atributo, show second slot as dash */}
                                    {item.atributosPrincipales.length === 1 && (
                                      <div className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {/* Empty label */}
                                          </span>
                                        )}
                                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-500`}>
                                          -
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  /* Show two dashes when no atributos */
                                  <>
                                    <div className="flex flex-col items-center gap-0.5 flex-1">
                                      <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-500`}>
                                        -
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5 flex-1">
                                      <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-500`}>
                                        -
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div
                                className="col-span-3 h-full flex items-center gap-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleItemClick(item, "stock")
                                }}
                              >
                                <div className="flex flex-col items-center gap-0.5 flex-1">
                                  {gridSize !== "sm" && (
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
                                  )}
                                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                    {item.total}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 flex-1">
                                  {gridSize !== "sm" && (
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Reservado</span>
                                  )}
                                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                    {item.reservado}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 flex-1">
                                  {gridSize !== "sm" && (
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                      Disponible
                                    </span>
                                  )}
                                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                    {item.disponible}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3 px-4">
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {item.hasVariants && expandedItems[index] && item.variants && (
                        <div className={gridSize === "lg" ? "mt-2 space-y-2" : "mt-0 space-y-0"}>
                          {item.variants.map((variant: any, variantIndex: number) => (
                            <div key={variantIndex} className="flex items-center gap-2">
                              <div className="w-4 flex-shrink-0"></div>

                              <div
                                className={`flex-1 ${gridSize === "lg" ? "h-18" : gridSize === "md" ? "h-12" : "h-6"} ${gridSize !== "lg" ? "rounded-xs" : "rounded-md"} grid grid-cols-10 bg-slate-900 border border-gray-800`}
                                style={{ marginLeft: "calc(8%)" }}
                              >
                                <div
                                  className={`col-span-4 flex flex-col justify-center h-full border-r border-gray-700 ${gridSize === "sm" ? "gap-0" : "gap-0.5"} border-l-2 border-l-green-500/50 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemClick(variant, "info")
                                  }}
                                >
                                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                    {variant.name}
                                  </span>
                                  {gridSize !== "sm" && variant.sku && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigator.clipboard.writeText(variant.sku)
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-mono hover:text-gray-400 transition-colors group w-fit"
                                    >
                                      <span>SKU: {variant.sku}</span>
                                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  )}
                                </div>

                                <div
                                  className="col-span-3 h-full flex items-center gap-3 border-r border-gray-700 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemClick(variant, "atributos")
                                  }}
                                >
                                  {variant.atributosPrincipales && variant.atributosPrincipales.length > 0 ? (
                                    variant.atributosPrincipales.map((attr, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {attr.key}
                                          </span>
                                        )}
                                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                          {attr.value}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <>
                                      <div className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            Medida
                                          </span>
                                        )}
                                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                          {variant.medida}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            Color
                                          </span>
                                        )}
                                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                          {variant.color}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>

                                <div
                                  className="col-span-3 h-full flex items-center gap-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemClick(variant, "stock")
                                  }}
                                >
                                  <div className="flex flex-col items-center gap-0.5 flex-1">
                                    {gridSize !== "sm" && (
                                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
                                    )}
                                    <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                      {variant.total}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-0.5 flex-1">
                                    {gridSize !== "sm" && (
                                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                        Reservado
                                      </span>
                                    )}
                                    <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                      {variant.reservado}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-0.5 flex-1">
                                    {gridSize !== "sm" && (
                                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                        Disponible
                                      </span>
                                    )}
                                    <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                      {variant.disponible}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 px-4">
                                <button className="text-gray-400 hover:text-white transition-colors">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-white transition-colors">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.isAgrupador && expandedItems[index] && item.items && (
                        <div className={gridSize === "lg" ? "mt-2 space-y-2" : "mt-0 space-y-0"}>
                          {item.items.map((groupItem, groupItemIndex) => (
                            <div key={groupItemIndex} className="flex items-center gap-2">
                              <div className="w-4 flex-shrink-0"></div>

                              <div
                                className={`flex-1 ${gridSize === "lg" ? "h-18" : gridSize === "md" ? "h-12" : "h-6"} ${gridSize !== "lg" ? "rounded-xs" : "rounded-md"} grid grid-cols-10 bg-slate-900 border border-gray-800`}
                                style={{ marginLeft: "calc(8%)" }}
                              >
                                <div
                                  className={`col-span-4 flex flex-col justify-center h-full border-r border-gray-700 ${gridSize === "sm" ? "gap-0" : "gap-0.5"} border-l-2 border-l-blue-500/50 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemClick(groupItem, "info")
                                  }}
                                >
                                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                    {groupItem.name}
                                  </span>
                                  {gridSize !== "sm" && groupItem.sku && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigator.clipboard.writeText(groupItem.sku)
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-mono hover:text-gray-400 transition-colors group w-fit"
                                    >
                                      <span>SKU: {groupItem.sku}</span>
                                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  )}
                                </div>

                                <div
                                  className="col-span-3 h-full flex items-center gap-3 border-r border-gray-700 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemClick(groupItem, "atributos")
                                  }}
                                >
                                  {groupItem.atributosPrincipales && groupItem.atributosPrincipales.length > 0 ? (
                                    groupItem.atributosPrincipales.map((attr, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {attr.key}
                                          </span>
                                        )}
                                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                          {attr.value}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <>
                                      <div className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {groupItem.material ? "Material" : "Medida"}
                                          </span>
                                        )}
                                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                          {groupItem.material || groupItem.medida}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-center gap-0.5 flex-1">
                                        {gridSize !== "sm" && (
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {groupItem.cadena ? "Cadena" : groupItem.unidades ? "Unidades" : "Color"}
                                          </span>
                                        )}
                                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                          {groupItem.cadena || groupItem.unidades || groupItem.color}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>

                                <div
                                  className="col-span-3 h-full flex items-center gap-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemClick(groupItem, "stock")
                                  }}
                                >
                                  <div className="flex flex-col items-center gap-0.5 flex-1">
                                    {gridSize !== "sm" && (
                                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
                                    )}
                                    <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                      {groupItem.total}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-0.5 flex-1">
                                    {gridSize !== "sm" && (
                                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                        Reservado
                                      </span>
                                    )}
                                    <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                      {groupItem.reservado}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-0.5 flex-1">
                                    {gridSize !== "sm" && (
                                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                        Disponible
                                      </span>
                                    )}
                                    <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                                      {groupItem.disponible}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 px-4">
                                <button className="text-gray-400 hover:text-white transition-colors">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-white transition-colors">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-white mb-4">Seleccionar Template</h2>
            <div className="space-y-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => applyTemplate(template.name, isSelectingTemplateForContainer)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white hover:bg-gray-750 hover:border-gray-600 transition-colors text-left"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {template.atributosPrincipales.length} principales, {template.atributosInformativos.length}{" "}
                    informativos
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showNuevoItemModal && !isNuevoItemMinimized && (
        <>
          {/* Modal Overlay */}
          <div className="fixed inset-0 bg-black/50 z-40" style={{ marginLeft: "4rem" }} />

          {/* Modal Window */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ marginLeft: "4rem" }}>
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
              {/* Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
                <h2 className="text-sm font-semibold text-white">Nuevo Item</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMinimizeNuevoItem}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCloseNuevoItem}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Título Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      Título
                      <span className="text-red-500">*</span>
                      {/* CHANGE: Add helper text below Template */}
                      <span className="text-xs text-gray-500 font-normal">Obligatorio</span>
                    </label>
                    <input
                      type="text"
                      value={itemTitulo}
                      onChange={(e) => setItemTitulo(e.target.value)}
                      placeholder="Ingresá el título del item"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="border-t border-gray-800 my-4"></div>

                  {/* Template Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Template</label>
                    {/* CHANGE: Add helper text below Template */}
                    <p className="text-xs text-gray-500">
                      Usá un template para definir la estructura de información y atributos del nuevo item
                    </p>
                    <select
                      value={itemTemplate}
                      onChange={(e) => setItemTemplate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccioná un template</option>
                      {TEMPLATES.map((template) => (
                        <option key={template.name} value={template.name}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ubicación Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Ubicación</label>
                    {/* CHANGE: Add helper text below Ubicación */}
                    <p className="text-xs text-gray-500">Ubicá el nuevo item dentro de un grupo</p>
                    <select
                      value={itemUbicacion}
                      onChange={(e) => setItemUbicacion(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccioná una ubicación</option>
                      <option value="root">Grilla de Artículos</option>
                      <option value="folder1">Carpeta 1</option>
                      <option value="folder2">Carpeta 2</option>
                      <option value="subfolder1">Subcarpeta 1</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {/* CHANGE: Center and widen Crear button with better color */}
              <div className="flex items-center justify-center px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                <Button
                  onClick={handleCreateNuevoItem}
                  className="w-64 bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  Crear
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {showNuevoItemConVariantesModal && !isNuevoItemConVariantesMinimized && (
        <>
          {/* Modal Overlay */}
          <div className="fixed inset-0 bg-black/50 z-40" style={{ marginLeft: "4rem" }} />

          {/* Modal Window */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ marginLeft: "4rem" }}>
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
              {/* Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
                <h2 className="text-sm font-semibold text-white">Nuevo Item con Variantes</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMinimizeNuevoItemConVariantes}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCloseNuevoItemConVariantes}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Título Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      Título
                      <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 font-normal">Obligatorio</span>
                    </label>
                    <input
                      type="text"
                      value={itemTitulo}
                      onChange={(e) => setItemTitulo(e.target.value)}
                      placeholder="Ingresá el título del item contenedor"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="border-t border-gray-800 my-4"></div>

                  {/* Template Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Template</label>
                    <p className="text-xs text-gray-500">
                      Usá un template para definir la estructura de información y atributos del nuevo item contenedor
                    </p>
                    <select
                      value={itemTemplate}
                      onChange={(e) => setItemTemplate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccioná un template</option>
                      {TEMPLATES.map((template) => (
                        <option key={template.name} value={template.name}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ubicación Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Ubicación</label>
                    <p className="text-xs text-gray-500">Ubicá el nuevo item dentro de un grupo</p>
                    <select
                      value={itemUbicacion}
                      onChange={(e) => setItemUbicacion(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccioná una ubicación</option>
                      <option value="root">Grilla de Artículos</option>
                      <option value="folder1">Carpeta 1</option>
                      <option value="folder2">Carpeta 2</option>
                      <option value="subfolder1">Subcarpeta 1</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                <Button
                  onClick={handleCreateNuevoItemConVariantes}
                  className="w-64 bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  Crear
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Minimized Tab for Nuevo Item con Variantes */}
      {isNuevoItemConVariantesMinimized && (
        <button
          onClick={() => {
            setIsNuevoItemConVariantesMinimized(false)
            setActiveNavTab("nuevo-item-variantes")
          }}
          className={`px-4 py-2 text-sm transition-colors border-r border-gray-700 ${
            activeNavTab === "nuevo-item-variantes"
              ? "bg-gray-800 text-white"
              : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Nuevo Item con Variantes
        </button>
      )}
    </div>
  )
}
