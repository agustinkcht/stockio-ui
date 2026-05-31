"use client"

import { useEffect } from "react"
import { X, Mail, Phone, MapPin, CreditCard, Building2, User } from "lucide-react"
import { PROVEEDORES } from "@/lib/data/proveedores"

interface ProveedorModalProps {
  proveedorId: string
  onClose: () => void
}

export function ProveedorModal({ proveedorId, onClose }: ProveedorModalProps) {
  const proveedor = PROVEEDORES.find((p) => p.id === proveedorId)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  if (!proveedor) return null

  const fullName =
    proveedor.tipo === "empresa"
      ? proveedor.razonSocial ?? ""
      : `${proveedor.nombre} ${proveedor.apellido}`.trim()

  const initials =
    proveedor.tipo === "empresa"
      ? (proveedor.razonSocial ?? "?").slice(0, 2).toUpperCase()
      : `${proveedor.nombre[0] ?? ""}${proveedor.apellido[0] ?? ""}`.toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 px-6 pt-6 pb-5 border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-400"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-white">{initials}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{fullName}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 font-medium">
                  {proveedor.condicionIva}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 font-medium capitalize">
                  {proveedor.tipo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">
          {/* ID field */}
          <div className="flex items-start gap-3">
            {proveedor.tipo === "empresa" ? (
              <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            ) : (
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                {proveedor.tipo === "empresa" ? "CUIT" : "DNI"}
              </p>
              <p className="text-sm text-slate-700 font-medium">
                {proveedor.cuit ?? proveedor.dni ?? "—"}
              </p>
            </div>
          </div>

          {proveedor.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">Email</p>
                <p className="text-sm text-slate-700">{proveedor.email}</p>
              </div>
            </div>
          )}

          {proveedor.telefono && (
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">Teléfono</p>
                <p className="text-sm text-slate-700">{proveedor.telefono}</p>
              </div>
            </div>
          )}

          {(proveedor.direccion || proveedor.ciudad) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">Dirección</p>
                <p className="text-sm text-slate-700">
                  {[proveedor.direccion, proveedor.ciudad, proveedor.provincia, proveedor.codigoPostal]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">Transacciones</p>
              <p className="text-sm text-slate-700">{proveedor.transactionCount} compras</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
