"use client"

import type { Proveedor } from "@/lib/data/proveedores"
import type { Compra } from "@/lib/types"
import { Building2, User, Copy, MoreVertical } from "lucide-react"
import { useState, useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"

interface ProveedoresGridProps {
  proveedores: Proveedor[]
  compras: Compra[]
  proveedorSelected: boolean[]
  onSelectProveedor: (index: number) => void
  onEditProveedor: (proveedor: Proveedor) => void
  onDeleteProveedor: (id: string) => void
  onTransaccionesClick: (nombre: string) => void
}

export function ProveedoresGrid({
  proveedores,
  compras,
  proveedorSelected,
  onSelectProveedor,
  onEditProveedor,
  onDeleteProveedor,
  onTransaccionesClick,
}: ProveedoresGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)

  // Real transaction count per proveedor from compras (excluding canceladas)
  const transactionCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const compra of compras) {
      if (compra.estado === "cancelada") continue
      if (compra.proveedorId) {
        map[compra.proveedorId] = (map[compra.proveedorId] ?? 0) + 1
      }
    }
    return map
  }, [compras])

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="divide-y divide-slate-100">
      {proveedores.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">Sin proveedores para mostrar.</div>
      )}
      {proveedores.map((proveedor, index) => {
        const isSelected = proveedorSelected[index] ?? false
        const isHovered = hoveredIndex === index
        const displayName =
          proveedor.tipo === "empresa" && proveedor.razonSocial
            ? proveedor.razonSocial
            : `${proveedor.nombre} ${proveedor.apellido}`
        const cuitDni = proveedor.cuit
          ? `CUIT ${proveedor.cuit}`
          : proveedor.dni
          ? `DNI ${proveedor.dni}`
          : ""

        return (
          <div
            key={proveedor.id}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`grid grid-cols-12 items-center h-[72px] transition-colors ${
              isSelected
                ? "bg-blue-50/40 border-blue-200"
                : isHovered
                ? "bg-slate-50/60"
                : ""
            }`}
          >
            {/* Proveedor name + meta — col-span-5, inline checkbox */}
            <div className="col-span-5 flex items-center gap-2.5 min-w-0 pl-4 h-full border-r border-slate-100">
              <div className={`transition-opacity shrink-0 ${isHovered || isSelected ? "opacity-100" : "opacity-0"}`}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelectProveedor(index)}
                />
              </div>
              {proveedor.tipo === "empresa" ? (
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <User className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-400">{proveedor.condicionIva}</span>
                  {cuitDni && (
                    <>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{cuitDni}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(proveedor.cuit ?? proveedor.dni ?? "", proveedor.id)}
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

            {/* Email — col-span-3 */}
            <div className="col-span-3 text-sm text-slate-500 truncate pl-3 pr-2 border-r border-slate-100 h-full flex items-center">{proveedor.email || "—"}</div>

            {/* Teléfono — col-span-2 */}
            <div className="col-span-2 text-sm text-slate-500 truncate pl-3 pr-2 border-r border-slate-100 h-full flex items-center">{proveedor.telefono || "—"}</div>

            {/* Transacciones — col-span-2, live from compras, clickable */}
            <div className="col-span-2 pl-3 pr-2 h-full flex items-center justify-between">
              {(() => {
                const count = transactionCountMap[proveedor.id] ?? 0
                const label = count === 0 ? "Sin transacciones" : count === 1 ? "1 transacción" : `${count} transacciones`
                const clickable = count > 0
                return (
                  <button
                    type="button"
                    onClick={() => clickable && onTransaccionesClick(displayName)}
                    className={`text-sm text-left transition-colors ${
                      clickable
                        ? "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        : "text-slate-400 cursor-default"
                    }`}
                  >
                    {label}
                  </button>
                )
              })()}
              {/* More options — inside transacciones col */}
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
                          onEditProveedor(proveedor)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuIndex(null)
                          onDeleteProveedor(proveedor.id)
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
            </div>{/* /transacciones col */}
          </div>
        )
      })}
    </div>
  )
}
