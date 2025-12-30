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
  precio?: {
    costo: number
    margen: number
    iva: number
    precioFinal: number
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
  precio?: {
    costo: number
    margen: number
    iva: number
    precioFinal: number
  }
  hasVariants?: boolean
  isAgrupador?: boolean
  variantCount?: number
  itemCount?: number | string
  sku?: string
  codigoUniversal?: string
  marca?: string
  categoria?: string
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
    Torcuato: DepositStock
    Trujui: DepositStock
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
  dropdown?: DropdownItem[]
  dropdownItems?: string[] // Deprecated, keeping for backward compatibility
  active?: boolean
}

export interface DropdownItem {
  label: string
  href: string
}

export interface MinimizedTab {
  id: string
  label: string
}

export type DetailTab = "info" | "atributos" | "variantes" | "stock" | "stock-variantes"

export type GridSize = "sm"

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

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "cuenta_corriente"

export interface VentaItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: "percent" | "fixed"
  total: number
  categoria?: string
}

export interface Venta {
  id: string
  fecha: string
  hora: string
  clienteId: string
  clienteNombre: string
  items: VentaItem[]
  subtotal: number
  descuento: number
  descuentoTipo: "percent" | "fixed"
  total: number
  metodoPago: PaymentMethod
  estado: "completada" | "pendiente" | "cancelada"
  vendedor: string
  observaciones?: string
}

export interface CompraItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: "percent" | "fixed"
  total: number
  categoria?: string
}

export interface Compra {
  id: string
  fecha: string
  hora: string
  proveedorId: string
  proveedorNombre: string
  items: CompraItem[]
  subtotal: number
  descuento: number
  descuentoTipo: "percent" | "fixed"
  total: number
  metodoPago: PaymentMethod
  estado: "completada" | "pendiente" | "cancelada"
  comprador: string
  observaciones?: string
}

export type SortFactor = "titulo" | "categoria" | "marca" | "fecha" | "stock" | "costo" | "margen" | "precioFinal"

export type SortDirection = "asc" | "desc"

export interface SortFactorConfig {
  factor: SortFactor
  direction: SortDirection
}

export interface SortConfig {
  priorities: SortFactorConfig[]
}

export type ItemTipo = "individual" | "variantes" | "agrupador"

export type StockFilter = "sin-stock" | "disponible" | "reservado"

export interface FilterConfig {
  tipos: ItemTipo[]
  categorias: string[]
  marcas: string[]
  stock: StockFilter[]
  depositos: string[]
}

export type ClienteSortFactor = "nombre" | "tipo" | "condicionIva" | "ciudad"

export interface ClienteSortFactorConfig {
  factor: ClienteSortFactor
  direction: SortDirection
}

export interface ClienteFilterConfig {
  tipos: ("particular" | "empresa")[]
  condicionesIva: string[]
  ciudades: string[]
}

export type ProveedorSortFactor = "nombre" | "tipo" | "condicionIva" | "ciudad"

export interface ProveedorSortFactorConfig {
  factor: ProveedorSortFactor
  direction: SortDirection
}

export interface ProveedorFilterConfig {
  tipos: ("particular" | "empresa")[]
  condicionesIva: string[]
  ciudades: string[]
}

export interface FiltrosClientes {
  tipo?: "particular" | "empresa"
  condicionIva?: string
  ciudad?: string
}

export interface OrdenClientes {
  factor: ClienteSortFactor
  direction: SortDirection
}

export interface FiltrosProveedores {
  tipo?: "particular" | "empresa"
  condicionIva?: string
  ciudad?: string
}

export interface OrdenProveedores {
  factor: ProveedorSortFactor
  direction: SortDirection
}
