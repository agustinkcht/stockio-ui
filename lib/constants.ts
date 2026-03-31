import { Store, Box, Tag, HelpCircle, Settings, Receipt, Users, Wallet, Package, LayoutList } from "lucide-react"
import type { SidebarItem, Template } from "./types"

export const TEMPLATES: Template[] = [
  // --- VINOS ---
  {
    name: "Vinos",
    atributosPrincipales: [
      { key: "Varietal", value: "" }, // Malbec, Cabernet Sauvignon, Chardonnay, Blend...
      { key: "Año", value: "" }, // 2019, 2020, 2022
    ],
    atributosInformativos: [
      { key: "Tipo de Vino", value: "" }, // Tinto, Blanco, Rosado…
      { key: "Línea", value: "" }, // Reserva, Gran Reserva, Ícono, Joven…
      { key: "Perfil Sensorial", value: "" }, // Frutado, especiado, con madera, fresco, etc.
      { key: "Bodega", value: "" }, // Nombre de la bodega.
      { key: "Origen", value: "" }, // Valle de Uco, Luján de Cuyo, Patagonia…
      { key: "Crianza", value: "" }, // Sin crianza, 6 meses barrica, 12 meses barrica, 6 meses en vidrio, etc.
      { key: "Tipo de Barrica", value: "" }, // Tipo de barrica (si aplica) Roble francés, roble americano, 2do uso…
      { key: "Potencial de Guarda", value: "" }, // 3 años, 5 años, 10 años…
      { key: "Enólogo", value: "" }, // nombre del enólogo responsable.
      { key: "ABV", value: "" }, // 13%, 13.5%, 14%…
      { key: "Temperatura de Servicio", value: "" }, // Tinto 16–18°C, blanco 8–10°C…
      { key: "Maridaje", value: "" }, // Carnes rojas, pastas, pescados, quesos…
      { key: "Estuche", value: "" }, // Sin estuche, caja, tubo, estuche regalo…
    ],
  },

  // --- ESPUMANTES ---
  {
    name: "Espumantes",
    atributosPrincipales: [
      { key: "Dosaje", value: "" }, // Brut Nature, Extra Brut, Brut, Extra Sec, Sec, Demi Sec, Doux…
    ],
    atributosInformativos: [
      { key: "Varietal", value: "" }, // Chardonnay, Pinot Noir, Pinot Meunier, blend...
      { key: "Línea", value: "" }, // Brut Réserve, Rosé, Millésimé, Cuvée Prestige…
      { key: "Perfil Sensorial", value: "" }, // Notas cítricas, floral, mineral, frutos rojos…
      { key: "Bodega", value: "" }, // Moët & Chandon, Veuve Clicquot, Ruinart, Dom Pérignon, Krug…
      { key: "Origen", value: "" }, // Champagne, Valle de Uco...
      { key: "Crianza", value: "" }, // Sobre lías 15 meses (mínimo), 36+ meses en cuvées premium…
      { key: "Enólogo", value: "" }, // Chef de cave o enólogo responsable (si aplica)
      { key: "ABV", value: "" }, // Usualmente 12% – 12.5%
      { key: "Temperatura de Servicio", value: "" }, // 8–10°C (más frío para estilos frescos, un poco más para millésimes)
      { key: "Maridaje", value: "" }, // Mariscos, sushi, quesos suaves, aperitivos, postres (según dosaje)
      { key: "Estuche", value: "" }, // Presentación: Sin estuche, caja, tubo, estuche de regalo…
    ],
  },

  // --- LICORES ---
  {
    name: "Licores",
    atributosPrincipales: [
      { key: "Sabor", value: "" }, // Original, Coffee Edition, Orange...
    ],
    atributosInformativos: [
      { key: "Tipo de Licor", value: "" }, // Herbal/Bitter, Cream, Fruit, Aperitivo…
      { key: "Origen", value: "" }, // País o región de procedencia: Italia, Irlanda, Alemania, México…
      { key: "ABV", value: "" }, // Graduación alcohólica: 15%, 17%, 20%, 30%, 35%…
      { key: "Estuche", value: "" }, // Presentación: Sin estuche, caja, tubo, estuche de regalo…
    ],
  },

  // --- BEBIDAS BLANCAS ---
  {
    name: "Bebidas Blancas",
    atributosPrincipales: [{ key: "Sabor", value: "" }], //original, raspberri, botánicos
    atributosInformativos: [
      { key: "Tipo de Bebida Blanca", value: "" }, // Vodka, Tequila, Ron, Gin…
      { key: "Estilo", value: "" }, // London Dry, Dorado, Blanco…
      { key: "Origen", value: "" }, // Suecia
      { key: "Añejamiento", value: "" },
      { key: "ABV", value: "" }, // 37.5%, 40%, 43%…
      { key: "Estuche", value: "" },
    ],
  },
  {
    name: "Ron",
    atributosPrincipales: [{ key: "Tipo", value: "" }], // Blanco, Dorado...
    atributosInformativos: [
      { key: "Origen", value: "" }, // Suecia
      { key: "Añejamiento", value: "" },
      { key: "ABV", value: "" }, // 37.5%, 40%, 43%…
      { key: "Estuche", value: "" },
    ],
  },
  {
    name: "Tequila",
    atributosPrincipales: [{ key: "Tipo", value: "" }], // Blanco, Plata, etc.
    atributosInformativos: [
      { key: "Origen", value: "" }, // Suecia
      { key: "Añejamiento", value: "" },
      { key: "ABV", value: "" }, // 37.5%, 40%, 43%…
      { key: "Estuche", value: "" },
    ],
  },
  // --- GIN ---
  {
    name: "Gin",
    atributosPrincipales: [{ key: "Sabor", value: "" }], //original, raspberri, botánicos
    atributosInformativos: [
      { key: "Estilo", value: "" }, // London Dry, Dorado, Blanco…
      { key: "Origen", value: "" }, // Suecia
      { key: "ABV", value: "" }, // 37.5%, 40%, 43%…
      { key: "Estuche", value: "" },
    ],
  },
  // --- VODKA ---
  {
    name: "Vodka",
    atributosPrincipales: [{ key: "Sabor", value: "" }], //original, raspberri, botánicos
    atributosInformativos: [
      { key: "Origen", value: "" }, // Suecia
      { key: "ABV", value: "" }, // 37.5%, 40%, 43%…
      { key: "Estuche", value: "" },
    ],
  },

  // --- WHISKIES ---
  {
    name: "Whiskies",
    atributosPrincipales: [
      { key: "Línea", value: "" }, //Black Label, Honey...
    ],
    atributosInformativos: [
      { key: "Tipo de Whisky", value: "" }, // Scotch, Bourbon, Rye, Irish…
      { key: "Método de Elaboración", value: "" }, // Single Malt, Single Grain, Blended…
      { key: "Origen", value: "" }, // Escocia, irlanda...
      { key: "Añejamiento", value: "" }, // 3 años, 12 años, 18 años…
      { key: "Tipo de Barrica", value: "" }, // roble americano, roble europeo…
      { key: "ABV", value: "" }, // 40%, 43%, 46%, cask strength (55–60%+)…
      { key: "Estuche", value: "" }, // caja, tubo, gift box, lata...
    ],
  },

  // --- CERVEZAS ---
  {
    name: "Cervezas",
    atributosPrincipales: [
      { key: "Estilo", value: "" }, // IPA, Lager, Stout...
    ],
    atributosInformativos: [
      { key: "Color", value: "" }, // Rubia, roja, negra...
      { key: "IBU", value: "" }, //5, 21, 35...
      { key: "Origen", value: "" },
      { key: "ABV", value: "" }, // 4%, 8%
    ],
  },
]

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    icon: Store,
    label: "Mi Negocio",
    hasDropdown: true,
    dropdown: [
      { label: "Punto de Venta", href: "/mi-negocio/pdv" },
      { label: "Caja", href: "/mi-negocio/caja" },
    ],
  },
  {
    icon: Receipt,
    label: "Ventas",
    hasDropdown: true,
    dropdown: [{ label: "Ventas", href: "/ventas/ventas" }],
  },
  {
    icon: Wallet,
    label: "Compras",
    hasDropdown: true,
    dropdown: [
      { label: "Compras", href: "/compras/compras" },
      { label: "Ordenes de Compra", href: "/compras/ordenes-de-compra" },
      { label: "Portal de Compras", href: "/compras/portal-de-compras" },
    ],
  },
  {
    icon: Users,
    label: "Contactos",
    hasDropdown: true,
    dropdown: [
      { label: "Clientes", href: "/contactos/clientes" },
      { label: "Proveedores", href: "/contactos/proveedores" },
    ],
  },
  {
    icon: LayoutList,
    label: "Catálogo",
    hasDropdown: true,
    dropdown: [{ label: "Items", href: "/catalogo/items" }],
  },
  {
    icon: Tag,
    label: "Precios",
    hasDropdown: true,
    dropdown: [{ label: "Lista de Precios", href: "/precios/lista-de-precios" }],
  },
  {
    icon: Box,
    label: "Inventario",
    hasDropdown: true,
    dropdown: [
      { label: "Stock", href: "/inventario/stock" },
    ],
  },
]

export const BOTTOM_SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: HelpCircle, label: "Soporte" },
  { icon: Settings, label: "Ajustes" },
]

export const DEPOSITS = ["Torcuato", "Trujui"] as const

export const IVA_OPTIONS = ["0", "10.5", "21", "27"] as const

export const IMPUESTO_INTERNO_OPTIONS = ["0", "4", "8", "17"] as const

export const VOLUMEN_UNITS = ["ml", "L", "cm³", "m³"] as const
