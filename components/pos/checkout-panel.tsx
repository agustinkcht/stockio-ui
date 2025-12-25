"use client"

import { useState } from "react"
import {
  User,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Percent,
  DollarSign,
  ChevronRight,
  X,
  Check,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CLIENTES } from "@/lib/data/clientes"

interface CheckoutPanelProps {
  subtotal: number
  globalDiscount: number
  globalDiscountType: "percentage" | "fixed"
  globalDiscountAmount: number
  total: number
  itemCount: number
  selectedClientId: string | null
  paymentMethod: "efectivo" | "tarjeta" | "transferencia" | "cuenta_corriente"
  onSelectClient: (clientId: string | null) => void
  onSetGlobalDiscount: (discount: number) => void
  onSetGlobalDiscountType: (type: "percentage" | "fixed") => void
  onSetPaymentMethod: (method: "efectivo" | "tarjeta" | "transferencia" | "cuenta_corriente") => void
  onCheckout: () => void
  onClear: () => void
}

export function CheckoutPanel({
  subtotal,
  globalDiscount,
  globalDiscountType,
  globalDiscountAmount,
  total,
  itemCount,
  selectedClientId,
  paymentMethod,
  onSelectClient,
  onSetGlobalDiscount,
  onSetGlobalDiscountType,
  onSetPaymentMethod,
  onCheckout,
  onClear,
}: CheckoutPanelProps) {
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [tempDiscount, setTempDiscount] = useState(globalDiscount.toString())

  const selectedClient = CLIENTES.find((c) => c.id === selectedClientId)

  const filteredClientes = CLIENTES.filter((c) => {
    if (!clientSearchQuery.trim()) return true
    const query = clientSearchQuery.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(query) ||
      c.apellido.toLowerCase().includes(query) ||
      c.razonSocial?.toLowerCase().includes(query) ||
      c.cuit?.includes(query) ||
      c.dni?.includes(query)
    )
  })

  const handleSaveDiscount = () => {
    const discount = Number.parseFloat(tempDiscount)
    if (!isNaN(discount) && discount >= 0) {
      onSetGlobalDiscount(discount)
    }
    setShowDiscountInput(false)
  }

  const paymentMethods = [
    { id: "efectivo", label: "Efectivo", icon: Banknote },
    { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
    { id: "transferencia", label: "Transfer.", icon: Building2 },
    { id: "cuenta_corriente", label: "Cta. Cte.", icon: FileText },
  ] as const

  return (
    <div className="border-t border-border/50 bg-card">
      {/* Client Selection */}
      <div className="p-4 border-b border-border/30">
        {showClientSearch ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Seleccionar Cliente</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowClientSearch(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, CUIT, DNI..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-auto space-y-1">
              {/* Consumidor Final Option */}
              <button
                className={cn(
                  "w-full text-left p-2 rounded-lg transition-colors",
                  "hover:bg-muted/50",
                  !selectedClientId && "bg-primary/10 border border-primary/30",
                )}
                onClick={() => {
                  onSelectClient(null)
                  setShowClientSearch(false)
                }}
              >
                <p className="text-sm font-medium">Consumidor Final</p>
                <p className="text-xs text-muted-foreground">Sin datos de facturación</p>
              </button>

              {filteredClientes.map((cliente) => (
                <button
                  key={cliente.id}
                  className={cn(
                    "w-full text-left p-2 rounded-lg transition-colors",
                    "hover:bg-muted/50",
                    selectedClientId === cliente.id && "bg-primary/10 border border-primary/30",
                  )}
                  onClick={() => {
                    onSelectClient(cliente.id)
                    setShowClientSearch(false)
                  }}
                >
                  <p className="text-sm font-medium">
                    {cliente.tipo === "empresa" ? cliente.razonSocial : `${cliente.nombre} ${cliente.apellido}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cliente.tipo === "empresa" ? `CUIT: ${cliente.cuit}` : `DNI: ${cliente.dni}`}
                    {" · "}
                    {cliente.condicionIva}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setShowClientSearch(true)}
          >
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              {selectedClient ? (
                <>
                  <p className="text-sm font-medium">
                    {selectedClient.tipo === "empresa"
                      ? selectedClient.razonSocial
                      : `${selectedClient.nombre} ${selectedClient.apellido}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedClient.condicionIva}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Consumidor Final</p>
                  <p className="text-xs text-muted-foreground">Toca para seleccionar cliente</p>
                </>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Payment Method */}
      <div className="p-4 border-b border-border/30">
        <p className="text-xs text-muted-foreground mb-2">Método de pago</p>
        <div className="grid grid-cols-4 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                "border border-transparent",
                paymentMethod === method.id ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/50",
              )}
              onClick={() => onSetPaymentMethod(method.id)}
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
                onClick={() => onSetGlobalDiscountType("percentage")}
              >
                <Percent className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant={globalDiscountType === "fixed" ? "default" : "ghost"}
                className="h-7 w-7"
                onClick={() => onSetGlobalDiscountType("fixed")}
              >
                <DollarSign className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveDiscount}>
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              className="text-emerald-500 hover:underline"
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
          <span className="text-xl font-bold">${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={onClear} disabled={itemCount === 0}>
          Cancelar
        </Button>
        <Button className="flex-[2]" onClick={onCheckout} disabled={itemCount === 0}>
          Cobrar ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </Button>
      </div>
    </div>
  )
}
