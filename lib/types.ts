export interface Atributo {
  key: string
  value: string
}

export interface ContainerAtributo {
  key: string
  variantes: string[]
}

export interface ItemVariant {
  id?: string
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
  // SKU structure for children:
  // - `skuSuffix` is the unique part for this variant
  // - Full SKU is computed as `{parent.skuPrefix}-{skuSuffix}`
  // - `sku` is deprecated for children, kept for backwards compatibility
  sku?: string // @deprecated - use skuSuffix instead
  skuSuffix?: string // The suffix part (combined with parent's skuPrefix)
  codigoUniversal: string
  marca?: string
  modelo?: string
  formatoVenta?: string
  proveedor?: string
  codigoProveedor?: string
  atributosPrincipales?: Atributo[]
  isActive?: boolean // Whether the item is active (Activo) or paused (Pausado)
}

export interface Item {
  id?: string
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
  // SKU structure:
  // - Standalone items: use `sku` directly
  // - Parent items (hasVariants=true): use `skuPrefix` as the prefix for children
  // - Children (ItemVariant): use `skuSuffix`, full SKU = `{parent.skuPrefix}-{child.skuSuffix}`
  sku?: string // For standalone items only
  skuPrefix?: string // For parent items (the "sku padre")
  codigoUniversal?: string
  marca?: string
  categoria?: string
  modelo?: string
  formatoVenta?: string
  unidadesPorPack?: number
  volumenActive?: boolean
  volumenCantidad?: number
  volumenUnidad?: string
  vencimientoActive?: boolean
  fechaVencimiento?: string
  proveedor?: string
  codigoProveedor?: string
  descripcion?: string
  imagenUrl?: string
  atributosPrincipales?: Atributo[]
  atributosInformativos?: Atributo[]
  variants?: ItemVariant[]
  items?: (Item | ItemWithVariants)[]
  containerAtributosPrincipales?: ContainerAtributo[]
  containerAtributosInformativos?: Atributo[]
  isActive?: boolean // Whether the item is active (Activo) or paused (Pausado) - for standalone items
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
  dividerAfter?: boolean
  href?: string // For modules without sub-items (direct navigation)
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

export type PaymentMethod = "efectivo" | "posnet" | "transferencia" | "no_especificado" | "anulacion"

export interface VentaCustomCharge {
  id: number
  label: string
  value: number
}

export interface VentaItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: "percent" | "fixed" | "unit"
  total: number
  categoria?: string
}

// Tracks how many units of a given item have been delivered (running total)
export interface VentaEntregaItem {
  sku: string
  quantityEntregada: number
}

// A single delivery event (log entry), mirroring VentaCobro's structure
export interface VentaEntregaEntry {
  id: string
  fecha: string   // "YYYY-MM-DD"
  hora: string    // "HH:mm"
  items: { sku: string; quantity: number }[]
  anulacion?: boolean          // true when this entry is an undo-reversal
  anulacionTotal?: number      // absolute unit count that was reversed
  originalEntregaId?: string   // id of the delivery entry this anulacion reverses
}

// Tracks how many units of a given item have been returned (running total)
export interface VentaDevolucionItem {
  sku: string
  quantityDevuelta: number
}

// A single return event (log entry)
export interface VentaDevolucionEntry {
  id: string
  fecha: string   // "YYYY-MM-DD"
  hora: string    // "HH:mm"
  items: { sku: string; quantity: number }[]
  montoDevuelto: number
  medioPago: string
}

// A single payment entry against the venta
export interface VentaCobro {
  id: string
  fecha: string        // "YYYY-MM-DD"
  hora: string         // "HH:mm"
  medioPago: PaymentMethod
  monto: number
}

// Cliente can be an anonymous consumer or a registered account
export type VentaCliente =
  | { tipo: "consumidor_final" }
  | { tipo: "cuenta"; id: string; nombre: string }

export type VentaEstado = "en_curso" | "finalizada" | "cancelada"

export interface Venta {
  id: string
  fecha: string        // "YYYY-MM-DD"
  hora: string         // "HH:mm"
  cliente: VentaCliente
  items: VentaItem[]
  subtotal: number
  descuento: number
  descuentoTipo: "percent" | "fixed"
  envio?: number
  customCharges?: VentaCustomCharge[]
  total: number
  // Entrega: tracks delivered units per item. Missing sku = 0 delivered.
  entregaItems: VentaEntregaItem[]
  // Entrega log: ordered list of delivery events (newest last)
  entregaEntries: VentaEntregaEntry[]
  // Cobros: list of payment entries. Sum may be <= total.
  cobros: VentaCobro[]
  // Estado is derived: "finalizada" when cobros sum = total AND all items fully delivered
  estado: VentaEstado
  observaciones?: string
  facturaEmitida?: boolean
  // Origin of the venta: "manual" (default), "pdv" (point of sale), "presupuesto" (created from a presupuesto)
  origen?: "manual" | "pdv" | "presupuesto"
  // When origen === "presupuesto", this links back to the source presupuesto id
  presupuestoId?: string
  // Devoluciones: returned units per item
  devolucionItems?: VentaDevolucionItem[]
  // Devoluciones log: ordered list of return events
  devolucionEntries?: VentaDevolucionEntry[]
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

// Running received-units total per SKU
export interface CompraRecepcionItem {
  sku: string
  quantityRecepcionada: number
}

// A single reception log entry
export interface CompraRecepcionEntry {
  id: string
  fecha: string
  hora: string
  items: { sku: string; quantity: number }[]
  anulacion?: boolean
  anulacionTotal?: number
  originalRecepcionId?: string
}

// Running returned-units total per SKU
export interface CompraDevolucionItem {
  sku: string
  quantityDevuelta: number
}

// A single return log entry
export interface CompraDevolucionEntry {
  id: string
  fecha: string
  hora: string
  items: { sku: string; quantity: number }[]
  montoDevuelto: number
  medioPago: string
}

// A single payment entry against the compra
export interface CompraPago {
  id: string
  fecha: string
  hora: string
  medioPago: PaymentMethod
  monto: number
}

export type CompraEstado = "en_curso" | "finalizada" | "cancelada"

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
  envio?: number
  customCharges?: VentaCustomCharge[]
  total: number
  recepcionItems: CompraRecepcionItem[]
  recepcionEntries: CompraRecepcionEntry[]
  pagos: CompraPago[]
  estado: CompraEstado
  comprador: string
  observaciones?: string
  origen?: "manual" | "orden"
  ordenId?: string
  devolucionItems?: CompraDevolucionItem[]
  devolucionEntries?: CompraDevolucionEntry[]
}

// ===== CAJA (Cash Register) =====

export interface CajaApertura {
  saldoInicialEsperado: number
  saldoInicialContado: number
  diferenciaInicial: number
}

export interface CajaCierre {
  saldoEsperadoEfectivo: number
  saldoContadoEfectivo: number
  diferenciaEfectivo: number
  totalPosnet: number
  totalTransferencia: number
  explicacionDiferencia?: string
}

export type CajaMovimientoTipo =
  | "apertura"
  | "venta_efectivo"
  | "venta_posnet"
  | "venta_transferencia"
  | "ingreso"
  | "egreso"
  | "retiro"

export interface CajaMovimiento {
  id: string
  tipo: CajaMovimientoTipo
  monto: number
  descripcion: string
  nota?: string
  motivo?: string
  timestamp: string
  ventaId?: string
  usuario: string
  medioPago: PaymentMethod
}

export interface CajaSesion {
  id: number
  responsable: string
  estado: "activa" | "cerrada"
  apertura: CajaApertura
  cierre?: CajaCierre
  timestampApertura: string
  timestampCierre?: string
  movimientos: CajaMovimiento[]
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
  proveedores: string[]
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

// ===== ORDENES DE COMPRA =====

export type MedioPago = "efectivo" | "transferencia" | "tarjeta" | "cuenta_corriente"

export type EstadoEntrega = "prevista" | "recibida"

export interface OrdenCompraItem {
  sku: string
  name: string
  quantity: number
  quantityReceived: number // Cantidad de unidades recibidas (para entregas diferidas/parciales)
  unitPrice: number
  total: number
  categoria?: string
  thumbnail?: string
}

export interface OrdenCompra {
  id: string
  numero: number
  fechaCreacion: string
  proveedorId: string
  proveedorNombre: string
  medioPago: MedioPago
  estadoPago: number // Percentage 0-100
  estadoEntrega: EstadoEntrega
  fechaEntrega: string
  items: OrdenCompraItem[]
  importeTotal: number
}

// ===== ORDENES DE COMPRA (ODC) =====

export type EstadoOrdenDeCompra = "borrador" | "aceptada"

export interface OrdenDeCompraItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
  discount?: number
  discountType?: "percent" | "fixed" | "unit"
  total: number
  categoria?: string
  marca?: string
  thumbnail?: string
  tags?: string[] // For child item tags (e.g., variant attributes)
  isDescripcionLibre?: boolean // Whether this is a free description item (not from inventory)
}

export interface OrdenDeCompra {
  id: string
  numero: number
  fechaCreacion: string
  fechaModificacion?: string
  proveedorId: string
  proveedorNombre: string
  estado: EstadoOrdenDeCompra
  items: OrdenDeCompraItem[]
  /** Sum of item line totals before global adjustments */
  subtotal?: number
  /** Global discount value */
  descuento?: number
  descuentoTipo?: "percent" | "fixed"
  /** Shipping cost */
  envio?: number
  /** Other custom charges */
  customCharges?: VentaCustomCharge[]
  /** Grand total after all adjustments */
  importeEstimado: number
  compraId?: string
}

// ===== PRESUPUESTOS =====

export type EstadoPresupuesto = "borrador" | "aceptado" | "rechazado"

/** @deprecated Presupuesto.items now reuses VentaItem for parity with ventas. */
export type PresupuestoItem = VentaItem

// Presupuesto mirrors the Venta shape (minus entrega/cobro) so the same
// UI (list, nuevo wizard, detail) can be reused for both.
export interface Presupuesto {
  id: string
  numero: number
  fecha: string        // "YYYY-MM-DD" creation date
  hora: string         // "HH:mm"
  fechaModificacion?: string
  fechaValidez?: string
  cliente: VentaCliente
  items: VentaItem[]
  subtotal: number
  descuento: number
  descuentoTipo: "percent" | "fixed"
  envio?: number
  customCharges?: VentaCustomCharge[]
  total: number
  estado: EstadoPresupuesto
  observaciones?: string
  // Set when the presupuesto is aceptado → links to the created venta
  ventaId?: string
  // Persisted detail-page state
  itemAjustes?: Record<number, { value: number; type: "percent" | "cash" | "unit" }>
  itemIvas?: Record<number, number>
  globalDiscount?: { value: number; type: "cash" | "percent" }
}
