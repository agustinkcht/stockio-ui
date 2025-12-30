"use client"

import { useState, useMemo, useRef, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useItems } from "@/hooks/use-items"
import { useCompras } from "@/hooks/use-compras"
import { useProveedores } from "@/hooks/use-proveedores"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import {
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Percent,
  Receipt,
  DollarSign,
  Plus,
  Trash2,
  Store,
  Minus,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  X,
  Building2,
  User,
  Check,
} from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getCategoryImage } from "@/lib/utils/category-images"
import Image from "next/image"
import type { Item, ItemVariant } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PROVEEDORES, type Proveedor } from "@/lib/data/proveedores" // Changed from 'proveedores' to 'PROVEEDORES' to match existing const name
import { cn } from "@/lib/utils"

// Cart item type for compra
interface CompraCartItem {
  id: string
  name: string
  sku: string
  isExisting: boolean
  quantity: number
  costo: number
  margen: number
  iva: number
  precioFinal: number
  categoria?: string
  showPriceDetails: boolean
  updatePriceList: boolean // Track if should update price list data
}

function PortalDeComprasContent() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { items, increaseStock, updatePricing } = useItems()
  const { addCompra } = useCompras()
  const { proveedores, incrementProveedorTransaction } = useProveedores()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  // Cart state
  const [cart, setCart] = useState<CompraCartItem[]>([])
  const [isCartExpanded, setIsCartExpanded] = useState(false)

  // Provider state
  const [showProviderSearch, setShowProviderSearch] = useState(false)
  const [providerSearchQuery, setProviderSearchQuery] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<Proveedor | null>(null)
  const [customProviderName, setCustomProviderName] = useState("")

  // Discount state
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [globalDiscountType, setGlobalDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [tempDiscount, setTempDiscount] = useState("0")

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia" | "cuenta_corriente">(
    "efectivo",
  )

  // Success state
  const [showSuccess, setShowSuccess] = useState(false)

  const breadcrumbs = [{ label: "Compras" }, { label: "Portal de Compras", href: "/compras/portal-de-compras" }]

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items

    const query = searchQuery.toLowerCase()
    return items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(query)
      const skuMatch = item.sku?.toLowerCase().includes(query)
      const marcaMatch = item.marca?.toLowerCase().includes(query)
      const categoriaMatch = item.categoria?.toLowerCase().includes(query)
      const variantMatch = item.variants?.some(
        (v) => v.name?.toLowerCase().includes(query) || v.sku?.toLowerCase().includes(query),
      )
      return nameMatch || skuMatch || marcaMatch || categoriaMatch || variantMatch
    })
  }, [items, searchQuery])

  // Filter providers based on search - use proveedores from hook instead of PROVEEDORES constant
  const filteredProviders = useMemo(() => {
    const providersList = proveedores.length > 0 ? proveedores : PROVEEDORES
    if (!providerSearchQuery.trim()) return providersList
    const query = providerSearchQuery.toLowerCase()
    return providersList.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(query) ||
        p.apellido?.toLowerCase().includes(query) ||
        p.razonSocial?.toLowerCase().includes(query) ||
        p.cuit?.includes(query) ||
        p.dni?.includes(query),
    )
  }, [proveedores, providerSearchQuery])

  // Check if search query could be a new product
  const canCreateNewProduct = searchQuery.trim().length > 0 && filteredItems.length === 0

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.costo * item.quantity, 0)
  const globalDiscountAmount =
    globalDiscountType === "percentage" ? (subtotal * globalDiscount) / 100 : Math.min(globalDiscount, subtotal)
  const total = subtotal - globalDiscountAmount
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const getFullTitle = (item: Item | ItemVariant): string => {
    let fullTitle = item.name
    if (item.atributosPrincipales && Array.isArray(item.atributosPrincipales)) {
      const attributeValues = item.atributosPrincipales
        .map((attr) => attr.value)
        .filter((value) => value && value.trim() !== "")
        .join(" ")
      if (attributeValues) {
        fullTitle = `${fullTitle} ${attributeValues}`
      }
    }
    return fullTitle
  }

  const toggleExpanded = (sku: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(sku)) {
        next.delete(sku)
      } else {
        next.add(sku)
      }
      return next
    })
  }

  // Add existing item to cart
  const addExistingItemToCart = (item: Item, variant?: ItemVariant) => {
    const targetItem = variant || item
    const sku = targetItem.sku || ""
    const existingCartItem = cart.find((ci) => ci.sku === sku)

    if (existingCartItem) {
      setCart((prev) => prev.map((ci) => (ci.sku === sku ? { ...ci, quantity: ci.quantity + 1 } : ci)))
    } else {
      const precio = targetItem.precio || { costo: 0, margen: 0, iva: 21, precioFinal: 0 }
      const newCartItem: CompraCartItem = {
        id: `${sku}-${Date.now()}`,
        name: variant ? getFullTitle(variant) : getFullTitle(item),
        sku,
        isExisting: true,
        quantity: 1,
        costo: precio.costo || 0,
        margen: precio.margen || 0,
        iva: precio.iva || 21,
        precioFinal: precio.precioFinal || 0,
        categoria: item.categoria,
        showPriceDetails: false,
        updatePriceList: false,
      }
      setCart((prev) => [...prev, newCartItem])
    }
  }

  // Add new (non-existing) product to cart
  const addNewProductToCart = () => {
    if (!searchQuery.trim()) return

    const newCartItem: CompraCartItem = {
      id: `new-${Date.now()}`,
      name: searchQuery.trim(),
      sku: `NUEVO-${Date.now()}`,
      isExisting: false,
      quantity: 1,
      costo: 0,
      margen: 0,
      iva: 21,
      precioFinal: 0,
      showPriceDetails: true,
      updatePriceList: false,
    }
    setCart((prev) => [...prev, newCartItem])
    setSearchQuery("")
  }

  // Update cart item
  const updateCartItem = (id: string, updates: Partial<CompraCartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates }

          if ("precioFinal" in updates && !("costo" in updates) && !("margen" in updates) && !("iva" in updates)) {
            const costoBase = updated.costo || 0
            if (costoBase > 0) {
              const costoConIva = costoBase * (1 + updated.iva / 100)
              const margenCalculado = (updated.precioFinal / costoConIva - 1) * 100
              updated.margen = margenCalculado
            }
          }
          // Recalculate precioFinal if costo, margen, or iva changed
          else if ("costo" in updates || "margen" in updates || "iva" in updates) {
            const costoConMargen = updated.costo * (1 + updated.margen / 100)
            updated.precioFinal = costoConMargen * (1 + updated.iva / 100)
          }

          return updated
        }
        return item
      }),
    )
  }

  // Remove from cart
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  // Update quantity
  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQty }
        }
        return item
      }),
    )
  }

  // Toggle price details visibility
  const togglePriceDetails = (id: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, showPriceDetails: !item.showPriceDetails } : item)),
    )
  }

  // Handle save discount
  const handleSaveDiscount = () => {
    const discount = Number.parseFloat(tempDiscount)
    if (!isNaN(discount) && discount >= 0) {
      setGlobalDiscount(discount)
    }
    setShowDiscountInput(false)
  }

  const handleCheckout = () => {
    if (cart.length === 0) return

    console.log("[v0] Portal de Compras - Processing compra:", {
      cartItems: cart.length,
      selectedProvider: selectedProvider?.id || customProviderName,
      paymentMethod,
      total,
    })

    // 1. INCREASE STOCK FOR EACH ITEM (opposite of PDV)
    for (const cartItem of cart) {
      if (cartItem.isExisting) {
        // Find the original item to get parent SKU if it's a variant
        const originalItem = items.find(
          (item) => item.sku === cartItem.sku || item.variants?.some((v: ItemVariant) => v.sku === cartItem.sku),
        )

        if (originalItem) {
          const isVariant = originalItem.variants?.some((v: ItemVariant) => v.sku === cartItem.sku)
          const parentSku = isVariant ? originalItem.sku : undefined

          // Increase stock
          increaseStock(cartItem.sku, cartItem.quantity, parentSku)

          // 2. UPDATE PRICING IN PRICE LIST (if checkbox is checked)
          if (cartItem.updatePriceList) {
            // Get original pricing to compare
            let originalPricing = originalItem.precio
            if (isVariant) {
              const variant = originalItem.variants?.find((v: ItemVariant) => v.sku === cartItem.sku)
              originalPricing = variant?.precio
            }

            const pricingUpdates: { costo?: number; margen?: number; iva?: number; precioFinal?: number } = {}

            // Check if costo changed
            if (cartItem.costo !== originalPricing?.costo) {
              pricingUpdates.costo = cartItem.costo
            }

            // If toggle was active and user changed margen/iva/precioFinal, update those too
            if (cartItem.showPriceDetails) {
              if (cartItem.margen !== originalPricing?.margen) {
                pricingUpdates.margen = cartItem.margen
              }
              if (cartItem.iva !== originalPricing?.iva) {
                pricingUpdates.iva = cartItem.iva
              }
              if (Math.round(cartItem.precioFinal) !== originalPricing?.precioFinal) {
                pricingUpdates.precioFinal = Math.round(cartItem.precioFinal)
              }
            }

            // Only update if there are changes
            if (Object.keys(pricingUpdates).length > 0) {
              updatePricing(cartItem.sku, pricingUpdates, parentSku)
              console.log(`[v0] Portal de Compras - Updated pricing for ${cartItem.sku}:`, pricingUpdates)
            }
          }
        }
      }
    }

    // 3. CREATE COMPRA RECORD
    const now = new Date()
    const compraData = {
      fecha: now.toISOString().split("T")[0],
      hora: now.toTimeString().split(" ")[0].substring(0, 5),
      proveedorId: selectedProvider?.id || "PROV-NEW",
      proveedorNombre: selectedProvider
        ? getProviderDisplayName(selectedProvider)
        : customProviderName || "Sin proveedor",
      items: cart.map((cartItem) => ({
        sku: cartItem.sku,
        name: cartItem.name,
        quantity: cartItem.quantity,
        unitPrice: cartItem.costo,
        discount: 0,
        discountType: "percent" as const,
        total: cartItem.costo * cartItem.quantity,
        categoria: cartItem.categoria,
      })),
      subtotal,
      descuento: globalDiscount,
      descuentoTipo: globalDiscountType === "percentage" ? ("percent" as const) : ("fixed" as const),
      total,
      metodoPago: paymentMethod,
      estado: "completada" as const,
      comprador: "Admin",
    }

    addCompra(compraData)
    console.log("[v0] Portal de Compras - Created compra record")

    // 4. UPDATE PROVEEDOR TRANSACTION COUNT
    if (selectedProvider) {
      incrementProveedorTransaction(selectedProvider.id)
      console.log(`[v0] Portal de Compras - Incremented transaction count for proveedor: ${selectedProvider.id}`)
    }

    // 5. SHOW SUCCESS AND RESET
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setCart([])
      setSelectedProvider(null)
      setCustomProviderName("")
      setGlobalDiscount(0)
      router.push("/compras/compras")
    }, 2000)
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    setSelectedProvider(null)
    setCustomProviderName("")
    setGlobalDiscount(0)
  }

  const paymentMethods = [
    // Removed Banknote, CreditCard, ArrowRightLeft, FileText icons
    { id: "efectivo", label: "Efectivo", icon: Store }, // Using Store icon as a placeholder
    { id: "tarjeta", label: "Tarjeta", icon: Receipt }, // Using Receipt icon as a placeholder
    { id: "transferencia", label: "Transfer.", icon: DollarSign }, // Using DollarSign icon as a placeholder
    { id: "cuenta_corriente", label: "Cta. Cte.", icon: Percent }, // Using Percent icon as a placeholder
  ] as const

  const getProviderDisplayName = (provider: Proveedor): string => {
    if (provider.tipo === "empresa" && provider.razonSocial) {
      return provider.razonSocial
    }
    return `${provider.nombre} ${provider.apellido}`
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        {/* Sidebar */}
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Header */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-1.5"></div>
            </div>
          </div>

          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Product Search Panel - Left Side */}
            <div className="flex-1 flex flex-col border-r border-border/30">
              {/* Search Header */}
              <div className="p-4 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    type="text"
                    placeholder="Buscar productos o escribir nuevo... (⌘K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {/* Option to add new product if no results */}
                {canCreateNewProduct && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors mb-2"
                    onClick={addNewProductToCart}
                  >
                    <div className="w-10 h-10 rounded-md bg-amber-100 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-amber-800">Agregar producto nuevo</p>
                      <p className="text-xs text-amber-600">"{searchQuery}" no existe - agregar a la compra</p>
                    </div>
                  </div>
                )}

                {filteredItems.length === 0 && !canCreateNewProduct ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Package className="h-12 w-12 mb-2 opacity-30" />
                    <p className="text-sm">Busca productos para agregar</p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const hasVariants = item.hasVariants && item.variants && item.variants.length > 0
                    const isExpanded = expandedItems.has(item.sku || "")

                    return (
                      <div key={item.sku} className="rounded-lg overflow-hidden">
                        {/* Main Item Row */}
                        <div
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all",
                            "hover:bg-muted/50 cursor-pointer group",
                            hasVariants && isExpanded && "rounded-b-none bg-muted/30",
                          )}
                          onClick={() => (hasVariants ? toggleExpanded(item.sku || "") : addExistingItemToCart(item))}
                        >
                          {/* Product Image */}
                          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                            <Image
                              src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {hasVariants ? item.name : getFullTitle(item)}
                              </p>
                              {hasVariants && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {item.variants?.length} var.
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{item.sku}</span>
                              {item.marca && <span className="text-xs text-muted-foreground">· {item.marca}</span>}
                            </div>
                          </div>

                          {/* Price (Costo) */}
                          <div className="text-right flex-shrink-0">
                            {!hasVariants && (
                              <>
                                <p className="text-xs text-muted-foreground">Costo</p>
                                <p className="font-semibold text-sm">
                                  ${item.precio?.costo?.toLocaleString("es-AR") || "0"}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Action */}
                          {hasVariants ? (
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isExpanded && "rotate-180",
                              )}
                            />
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                addExistingItemToCart(item)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Variants */}
                        {hasVariants && isExpanded && (
                          <div className="bg-muted/20 border-t border-border/30">
                            {item.variants?.map((variant) => (
                              <div
                                key={variant.sku}
                                className="flex items-center gap-3 p-3 pl-8 transition-all hover:bg-muted/50 cursor-pointer group"
                                onClick={() => addExistingItemToCart(item, variant)}
                              >
                                <div className="w-8 h-8 rounded bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                  <Image
                                    src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                    alt={variant.name}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{getFullTitle(variant)}</p>
                                  <p className="text-xs text-muted-foreground">{variant.sku}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs text-muted-foreground">Costo</p>
                                  <p className="font-semibold text-sm">
                                    ${variant.precio?.costo?.toLocaleString("es-AR") || "0"}
                                  </p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    addExistingItemToCart(item, variant)
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Cart & Checkout Panel - Right Side */}
            <div
              className={`flex flex-col bg-card transition-all duration-300 ${isCartExpanded ? "w-[50vw]" : "w-[420px]"}`}
            >
              {/* Cart Header */}
              <div className="p-4 border-b border-border/50 flex items-center gap-3 justify-between py-3.5">
                <button
                  onClick={() => setIsCartExpanded(!isCartExpanded)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title={isCartExpanded ? "Contraer panel" : "Expandir panel"}
                >
                  {isCartExpanded ? (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Nueva Compra</h2>
                    <p className="text-xs text-muted-foreground">
                      {itemCount === 0 ? "Sin productos" : `${itemCount} producto${itemCount > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                    <Package className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Agrega productos a la compra</p>
                    <p className="text-xs mt-1">Busca existentes o escribe nuevos</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-muted/30 rounded-lg overflow-hidden">
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Product Image/Icon */}
                            <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                              {item.isExisting ? (
                                <Image
                                  src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <Plus className="h-4 w-4 text-amber-600" />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                {!item.isExisting && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                    Nuevo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{item.sku}</p>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Quantity & Costo Row */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Costo input - without checkbox now */}
                              <input
                                type="number"
                                value={item.costo}
                                onChange={(e) =>
                                  updateCartItem(item.id, { costo: Number.parseFloat(e.target.value) || 0 })
                                }
                                className="w-32 px-2 py-0.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                placeholder="0"
                                step="1"
                              />

                              {/* Toggle Price Details */}
                              <button
                                onClick={() => togglePriceDetails(item.id)}
                                className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                                title={item.showPriceDetails ? "Ocultar detalles" : "Mostrar margen, IVA y precio"}
                              >
                                {item.showPriceDetails ? (
                                  <ToggleRight className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Price Details (Expandable) */}
                          {item.showPriceDetails && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                              {!isCartExpanded ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Margen %</span>
                                    <input
                                      type="number"
                                      value={item.margen}
                                      onChange={(e) =>
                                        updateCartItem(item.id, { margen: Number.parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-16 h-6 px-2 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-right"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">IVA %</span>
                                    <select
                                      value={item.iva}
                                      onChange={(e) =>
                                        updateCartItem(item.id, { iva: Number.parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-16 h-6 px-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                    >
                                      <option value={0}>0%</option>
                                      <option value={10.5}>10.5%</option>
                                      <option value={21}>21%</option>
                                      <option value={27}>27%</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs font-medium">Precio Final</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">$</span>
                                      <input
                                        type="number"
                                        value={item.precioFinal}
                                        onChange={(e) =>
                                          updateCartItem(item.id, {
                                            precioFinal: Number.parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-20 h-6 px-2 text-xs border rounded bg-amber-50/50 font-semibold text-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-right"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {/* Headers */}
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="text-xs font-medium text-muted-foreground">Margen %</div>
                                    <div className="text-xs font-medium text-muted-foreground">IVA %</div>
                                    <div className="text-xs font-medium text-muted-foreground">Precio Final</div>
                                  </div>

                                  {/* Inputs */}
                                  <div className="grid grid-cols-3 gap-3">
                                    {/* Margen */}
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={item.margen}
                                        onChange={(e) =>
                                          updateCartItem(item.id, { margen: Number.parseFloat(e.target.value) || 0 })
                                        }
                                        className="w-full h-7 px-2 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-muted-foreground">%</span>
                                    </div>

                                    {/* IVA */}
                                    <select
                                      value={item.iva}
                                      onChange={(e) =>
                                        updateCartItem(item.id, { iva: Number.parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-full h-7 px-2 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                    >
                                      <option value={0}>0%</option>
                                      <option value={10.5}>10.5%</option>
                                      <option value={21}>21%</option>
                                      <option value={27}>27%</option>
                                    </select>

                                    {/* Precio Final */}
                                    <div className="flex items-center gap-1 bg-amber-50/50 rounded px-2 py-1">
                                      <span className="text-xs text-muted-foreground">$</span>
                                      <input
                                        type="number"
                                        value={item.precioFinal}
                                        onChange={(e) =>
                                          updateCartItem(item.id, {
                                            precioFinal: Number.parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full h-6 px-1 text-xs border-0 bg-transparent font-semibold text-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Line Total */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                            {/* Actualizar datos checkbox - always visible for existing products */}
                            {item.isExisting && (
                              <label className="flex items-center gap-1.5 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={item.updatePriceList}
                                  onChange={(e) => updateCartItem(item.id, { updatePriceList: e.target.checked })}
                                  className="w-3 h-3 rounded border-muted-foreground/30 text-amber-600 focus:ring-amber-500/50 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                                  Actualizar datos en listas de precios
                                </span>
                              </label>
                            )}

                            <span className="text-sm font-semibold">
                              ${(item.costo * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Section */}
              <div className="border-t border-border/50 bg-card">
                {/* Provider Selection */}
                <div className="p-4 border-b border-border/30 py-2">
                  {showProviderSearch ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Seleccionar Proveedor</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setShowProviderSearch(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar o escribir nuevo proveedor..."
                          value={providerSearchQuery}
                          onChange={(e) => setProviderSearchQuery(e.target.value)}
                          className="pl-9"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-auto space-y-1">
                        {/* Option to add custom provider */}
                        {providerSearchQuery.trim() && filteredProviders.length === 0 && (
                          <button
                            className="w-full text-left p-2 rounded-lg transition-colors hover:bg-amber-50 border border-amber-200 bg-amber-50/50"
                            onClick={() => {
                              setCustomProviderName(providerSearchQuery.trim())
                              setSelectedProvider(null)
                              setShowProviderSearch(false)
                            }}
                          >
                            <p className="text-sm font-medium text-amber-800">
                              Agregar "{providerSearchQuery}" como proveedor
                            </p>
                            <p className="text-xs text-amber-600">Nuevo proveedor</p>
                          </button>
                        )}

                        {filteredProviders.map((provider) => (
                          <button
                            key={provider.id}
                            className={cn(
                              "w-full text-left p-2 rounded-lg transition-colors",
                              "hover:bg-muted/50",
                              selectedProvider?.id === provider.id && "bg-amber-500/10 border border-amber-500/30",
                            )}
                            onClick={() => {
                              setSelectedProvider(provider)
                              setCustomProviderName("")
                              setShowProviderSearch(false)
                            }}
                          >
                            <p className="text-sm font-medium">{getProviderDisplayName(provider)}</p>
                            <p className="text-xs text-muted-foreground">
                              {provider.tipo === "empresa" ? `CUIT: ${provider.cuit}` : `DNI: ${provider.dni}`}
                              {" · "}
                              {provider.condicionIva}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      onClick={() => setShowProviderSearch(true)}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                        {selectedProvider?.tipo === "empresa" || customProviderName ? (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        {selectedProvider ? (
                          <>
                            <p className="text-sm font-medium">{getProviderDisplayName(selectedProvider)}</p>
                            <p className="text-xs text-muted-foreground">{selectedProvider.condicionIva}</p>
                          </>
                        ) : customProviderName ? (
                          <>
                            <p className="text-sm font-medium">{customProviderName}</p>
                            <p className="text-xs text-amber-600">Nuevo proveedor</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">Sin proveedor</p>
                            <p className="text-xs text-muted-foreground">Toca para seleccionar</p>
                          </>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Payment Method */}
                <div className="p-4 border-b border-border/30 py-2">
                  <p className="text-xs text-muted-foreground mb-2">Método de pago</p>
                  <div className="grid grid-cols-4 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                          "border border-transparent",
                          paymentMethod === method.id ? "bg-amber-500 text-white" : "bg-muted/30 hover:bg-muted/50",
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <method.icon className="h-4 w-4" />
                        <span className="text-[10px]">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                    <span>${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Global Discount */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    {showDiscountInput ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={tempDiscount}
                          onChange={(e) => setTempDiscount(e.target.value)}
                          className="h-7 w-20 text-sm"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant={globalDiscountType === "percentage" ? "default" : "ghost"}
                          className="h-7 w-7"
                          onClick={() => setGlobalDiscountType("percentage")}
                        >
                          <Percent className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant={globalDiscountType === "fixed" ? "default" : "ghost"}
                          className="h-7 w-7"
                          onClick={() => setGlobalDiscountType("fixed")}
                        >
                          <DollarSign className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveDiscount}>
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-amber-500 hover:underline"
                        onClick={() => {
                          setTempDiscount(globalDiscount.toString())
                          setShowDiscountInput(true)
                        }}
                      >
                        {globalDiscount > 0
                          ? `-$${globalDiscountAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                          : "Agregar"}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">
                      ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={clearCart}
                    disabled={itemCount === 0}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-[2] bg-amber-500 hover:bg-amber-600"
                    onClick={handleCheckout}
                    disabled={itemCount === 0}
                  >
                    Registrar ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100004]">
          <div className="bg-white rounded-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Compra Registrada</h3>
            <p className="text-muted-foreground">
              Total: ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PortalDeComprasPage() {
  return (
    <Suspense fallback={null}>
      <PortalDeComprasContent />
    </Suspense>
  )
}
