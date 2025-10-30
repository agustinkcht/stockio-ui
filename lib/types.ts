export interface Atributo {
  key: string
  value: string
}

export interface ContainerAtributo {
  key: string
  variantes: string[]
}

export interface ItemVariant {
  name: string
  stock: {
    total: string
    reservado: string
    disponible: string
  }
  sku: string
  codigoUniversal: string
  marca?: string
  modelo?: string
  formatoVenta?: string
  proveedor?: string
  codigoProveedor?: string
  atributosPrincipales?: Atributo[]
}

export interface Item {
  name: string
  stock?: {
    total: string
    reservado: string
    disponible: string
  }
  hasVariants?: boolean
  isAgrupador?: boolean
  variantCount?: number
  itemCount?: number | string
  sku?: string
  codigoUniversal?: string
  marca?: string
  modelo?: string
  formatoVenta?: string
  proveedor?: string
  codigoProveedor?: string
  atributosPrincipales?: Atributo[]
  atributosInformativos?: Atributo[]
  variants?: ItemVariant[]
  items?: (Item | ItemWithVariants)[]
  containerAtributosPrincipales?: ContainerAtributo[]
  containerAtributosInformativos?: Atributo[]
}

export interface ItemWithVariants extends Item {
  hasVariants: true
  variants: ItemVariant[]
}

export interface DepositStock {
  total: number
  reservado: number
}

export interface DepositStockMap {
  [itemSku: string]: {
    Ibiza: DepositStock
    Trujui: DepositStock
    Ciudadela: DepositStock
  }
}

export interface VariantItem {
  sku: string
  codigoUniversal: string
  descripcion: string
  foto: string
  variant1: string | null
  variant2: string | null
}

export interface NavigationView {
  id: string
  label: string
  item: Item | null
}

export interface Template {
  name: string
  atributosPrincipales: Atributo[]
  atributosInformativos: Atributo[]
}

export interface SidebarItem {
  icon: any
  label: string
  hasDropdown?: boolean
  dropdownItems?: string[]
  active?: boolean
}

export interface MinimizedTab {
  id: string
  label: string
}

export type DetailTab = "info" | "atributos" | "variantes" | "stock" | "stock-variantes"

export type GridSize = "sm" | "md" | "lg"

export type FormatoVenta = "unidad" | "pack"

export interface StockMovement {
  id: string
  fecha: string
  tipo: "entrada" | "salida" | "ajuste" | "transferencia"
  deposito: string
  depositoDestino?: string
  items: StockMovementItem[]
  motivo?: string
  observaciones?: string
  usuario: string
}

export interface StockMovementItem {
  sku: string
  descripcion: string
  cantidad: number
  depositoOrigen?: string
  depositoDestino?: string
}

export interface StockAdjustment {
  sku: string
  deposito: string
  cantidadActual: number
  cantidadNueva: number
  diferencia: number
  motivo: string
  observaciones?: string
}
