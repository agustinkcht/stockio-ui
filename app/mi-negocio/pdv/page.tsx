"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ProductSearch } from "@/components/pos/product-search"
import { CartPanel } from "@/components/pos/cart-panel"
import { CheckoutPanel } from "@/components/pos/checkout-panel"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useItems } from "@/hooks/use-items"
import { usePOS } from "@/hooks/use-pos"
import { useVentas } from "@/hooks/use-ventas"
import { useClientes } from "@/hooks/use-clientes"
import { useCaja } from "@/hooks/use-caja"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import type { VentaItem } from "@/lib/types"

export default function PuntoDeVentaPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { items, reduceStock } = useItems()
  const { addVenta } = useVentas()
  const { clientes, getClienteById, incrementTransactionCount } = useClientes()
  const { sesionActiva, agregarMovimiento } = useCaja()
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false)
  const [isCartExpanded, setIsCartExpanded] = useState(false)

  const {
    cart,
    selectedClientId,
    globalDiscount,
    globalDiscountType,
    paymentMethod,
    subtotal,
    globalDiscountAmount,
    total,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    updateItemDiscount,
    clearCart,
    setSelectedClientId,
    setGlobalDiscount,
    setGlobalDiscountType,
    setPaymentMethod,
  } = usePOS()

  const breadcrumbs = [{ label: "Mi Negocio" }, { label: "Punto de Venta", href: "/mi-negocio/pdv" }]

  const handleCheckout = () => {
    if (cart.length === 0) return

    // 1. Reduce stock for each item
    cart.forEach((cartItem) => {
      const sku = cartItem.variant?.sku || cartItem.item.sku
      if (!sku) return

      if (cartItem.variant) {
        // It's a variant - find the parent item
        const parentItem = items.find((i) => i.variants?.some((v) => v.sku === sku))
        if (parentItem) {
          reduceStock(sku, cartItem.quantity, parentItem.sku)
        }
      } else {
        // It's a standalone item
        reduceStock(sku, cartItem.quantity)
      }
    })

    // 2. Create venta items
    const ventaItems: VentaItem[] = cart.map((cartItem) => ({
      sku: cartItem.variant?.sku || cartItem.item.sku || "",
      name: cartItem.variant?.name || cartItem.item.name,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unitPrice,
      discount: cartItem.discount,
      discountType: cartItem.discountType === "percentage" ? "percent" : "fixed",
      total: cartItem.subtotal,
      categoria: cartItem.item.categoria,
    }))

    // 3. Get client info
    const cliente = selectedClientId ? getClienteById(selectedClientId) : null
    const clienteNombre = cliente
      ? cliente.tipo === "empresa"
        ? cliente.razonSocial || ""
        : `${cliente.nombre} ${cliente.apellido}`
      : "Consumidor Final"

    // 4. Create the venta record
    const now = new Date()
    const fecha = now.toISOString().split("T")[0]
    const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

    const venta = addVenta({
      fecha,
      hora,
      clienteId: selectedClientId || "CONSUMIDOR_FINAL",
      clienteNombre,
      items: ventaItems,
      subtotal,
      descuento: globalDiscount,
      descuentoTipo: globalDiscountType === "percentage" ? "percent" : "fixed",
      total,
      metodoPago: paymentMethod,
      estado: "completada",
      vendedor: "Admin",
    })

    // 5. Add movimiento to caja if session is active and payment affects caja
    if (sesionActiva && venta && paymentMethod !== "cuenta_corriente") {
      const medioPago = paymentMethod === "tarjeta" ? "posnet" : paymentMethod
      let tipo: "venta_efectivo" | "venta_posnet" | "venta_transferencia"
      
      if (medioPago === "efectivo") {
        tipo = "venta_efectivo"
      } else if (medioPago === "posnet") {
        tipo = "venta_posnet"
      } else {
        tipo = "venta_transferencia"
      }

      agregarMovimiento({
        tipo,
        monto: total,
        descripcion: `Venta POS #${venta.id}`,
        ventaId: venta.id,
        medioPago,
      })
    }

    // 6. Increment transaction count for the client
    if (selectedClientId) {
      incrementTransactionCount(selectedClientId)
    }

    // Show success and clear cart
    setShowCheckoutSuccess(true)
    setTimeout(() => {
      setShowCheckoutSuccess(false)
      clearCart()
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        {/* Sidebar - Full height */}
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        {/* Main Content with integrated navbar */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              {/* Left: Breadcrumbs */}
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              {/* Center: User Info Panel - Blur & Transparent */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              {/* Right: Empty */}
              <div />
            </div>
          </div>

          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Product Search Panel - Left Side */}
            <div className={`flex-1 flex flex-col border-r border-border/30 transition-all duration-300`}>
              <ProductSearch items={items} onAddToCart={addToCart} />
            </div>

            {/* Cart & Checkout Panel - Right Side */}
            <div
              className={`flex flex-col bg-card transition-all duration-300 ${isCartExpanded ? "w-[50vw]" : "w-[380px]"}`}
            >
              {/* Cart Header */}
              <div className="p-4 border-b border-border/50 flex items-center gap-3 justify-between py-3.5">
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setIsCartExpanded(!isCartExpanded)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title={isCartExpanded ? "Contraer panel" : "Expandir panel"}
                >
                  {isCartExpanded ? (
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Orden Actual</h2>
                    <p className="text-xs text-muted-foreground">
                      {itemCount === 0 ? "Sin productos" : `${itemCount} producto${itemCount > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <CartPanel
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onUpdatePrice={updatePrice}
                onUpdateDiscount={updateItemDiscount}
              />

              {/* Checkout Section */}
              <CheckoutPanel
                subtotal={subtotal}
                globalDiscount={globalDiscount}
                globalDiscountType={globalDiscountType}
                globalDiscountAmount={globalDiscountAmount}
                total={total}
                itemCount={itemCount}
                selectedClientId={selectedClientId}
                paymentMethod={paymentMethod}
                onSelectClient={setSelectedClientId}
                onSetGlobalDiscount={setGlobalDiscount}
                onSetGlobalDiscountType={setGlobalDiscountType}
                onSetPaymentMethod={setPaymentMethod}
                onCheckout={handleCheckout}
                onClear={clearCart}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Checkout Success Overlay */}
      {showCheckoutSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100004]">
          <div className="bg-white rounded-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Venta Completada</h3>
            <p className="text-muted-foreground">
              Total: ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
