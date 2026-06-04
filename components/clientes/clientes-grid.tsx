"use client"

import type { Cliente } from "@/lib/data/clientes"
import { Building2, User, Copy, MoreVertical } from "lucide-react"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

interface ClientesGridProps {
  clientes: Cliente[]
  clienteSelected: boolean[]
  onSelectCliente: (index: number) => void
  onEditCliente: (cliente: Cliente) => void
  onDeleteCliente: (id: string) => void
}

export function ClientesGrid({
  clientes,
  clienteSelected,
  onSelectCliente,
  onEditCliente,
  onDeleteCliente,
}: ClientesGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="divide-y divide-slate-100">
      {clientes.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">Sin clientes para mostrar.</div>
      )}
      {clientes.map((cliente, index) => {
        const isSelected = clienteSelected[index] ?? false
        const isHovered = hoveredIndex === index
        const displayName =
          cliente.tipo === "empresa" && cliente.razonSocial
            ? cliente.razonSocial
            : `${cliente.nombre} ${cliente.apellido}`
        const cuitDni = cliente.cuit
          ? `CUIT ${cliente.cuit}`
          : cliente.dni
          ? `DNI ${cliente.dni}`
          : ""

        return (
          <div
            key={cliente.id}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => {
              setHoveredIndex(null)
            }}
            className={`grid grid-cols-[40px_1fr_200px_160px_200px_44px] items-center px-4 h-[72px] transition-colors ${
              isSelected
                ? "bg-blue-50/40 border-blue-200"
                : isHovered
                ? "bg-slate-50/60"
                : ""
            }`}
          >
            {/* Checkbox */}
            <div className="flex items-center justify-center">
              <div className={`transition-opacity ${isHovered || isSelected ? "opacity-100" : "opacity-0"}`}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelectCliente(index)}
                />
              </div>
            </div>

            {/* Cliente name + meta */}
            <div className="flex items-center gap-2.5 min-w-0">
              {cliente.tipo === "empresa" ? (
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <User className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-400">{cliente.condicionIva}</span>
                  {cuitDni && (
                    <>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{cuitDni}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(cliente.cuit ?? cliente.dni ?? "", cliente.id)}
                        className="p-0.5 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                        title="Copiar"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="text-sm text-slate-500 truncate pr-2">{cliente.email || "—"}</div>

            {/* Teléfono */}
            <div className="text-sm text-slate-500 truncate pr-2">{cliente.telefono || "—"}</div>

            {/* Transacciones */}
            <div className="text-sm text-slate-500 truncate pr-2">
              {cliente.transactionCount === 0
                ? "Sin transacciones"
                : cliente.transactionCount === 1
                ? "1 transacción"
                : `${cliente.transactionCount} transacciones`}
            </div>

            {/* More options — vertical dots */}
            <div className="flex items-center justify-center">
              <div className={`relative transition-opacity ${isHovered || openMenuIndex === index ? "opacity-100" : "opacity-0"}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuIndex(openMenuIndex === index ? null : index)
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuIndex === index && (
                  <>
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => setOpenMenuIndex(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-[100] animate-in fade-in-0 slide-in-from-top-1 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuIndex(null)
                          onEditCliente(cliente)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuIndex(null)
                          onDeleteCliente(cliente.id)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
