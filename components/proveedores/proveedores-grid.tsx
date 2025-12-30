"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Building2, User, MoreHorizontal, Search, Copy, X, Plus, ArrowUpDown, ListFilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NuevoProveedorModal } from "@/components/modals/nuevo-proveedor-modal"
import { EditarProveedorModal } from "@/components/modals/editar-proveedor-modal"
import { FiltrosModalProveedores } from "@/components/modals/filtros-modal-proveedores"
import { OrdenModalProveedores } from "@/components/modals/orden-modal-proveedores"
import type { Proveedor } from "@/lib/data/proveedores"
import type { FiltrosProveedores, OrdenProveedores } from "@/lib/types"

interface ProveedoresGridProps {
  proveedores: Proveedor[]
  onAddProveedor: (proveedor: Proveedor) => void
  onUpdateProveedor: (id: string, updates: Partial<Proveedor>) => void
  onDeleteProveedor: (id: string) => void
}

export function ProveedoresGrid({
  proveedores,
  onAddProveedor,
  onUpdateProveedor,
  onDeleteProveedor,
}: ProveedoresGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProveedores, setSelectedProveedores] = useState<string[]>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md")
  const [showNuevoModal, setShowNuevoModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosProveedores>({})
  const [orden, setOrden] = useState<OrdenProveedores>({ factor: "nombre", direction: "asc" })

  const [showEditModal, setShowEditModal] = useState(false)
  const [proveedorToEdit, setProveedorToEdit] = useState<Proveedor | null>(null)

  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const searchedProveedores = useMemo(() => {
    if (!searchQuery) return proveedores

    const query = searchQuery.toLowerCase()
    return proveedores.filter((proveedor) => {
      const nombre =
        proveedor.tipo === "empresa" ? proveedor.razonSocial || "" : `${proveedor.nombre} ${proveedor.apellido}`
      return (
        nombre.toLowerCase().includes(query) ||
        proveedor.email?.toLowerCase().includes(query) ||
        proveedor.telefono?.toLowerCase().includes(query) ||
        proveedor.cuit?.toLowerCase().includes(query) ||
        proveedor.dni?.toLowerCase().includes(query)
      )
    })
  }, [proveedores, searchQuery])

  const filteredProveedores = useMemo(() => {
    return searchedProveedores.filter((proveedor) => {
      if (filtros.tipo && proveedor.tipo !== filtros.tipo) return false
      if (filtros.condicionIva && proveedor.condicionIva !== filtros.condicionIva) return false
      if (filtros.ciudad && proveedor.ciudad !== filtros.ciudad) return false
      return true
    })
  }, [searchedProveedores, filtros])

  const sortedAndFilteredProveedores = useMemo(() => {
    const sorted = [...filteredProveedores]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (orden.factor) {
        case "nombre":
          const nombreA = a.tipo === "empresa" ? a.razonSocial || "" : `${a.nombre} ${a.apellido}`
          const nombreB = b.tipo === "empresa" ? b.razonSocial || "" : `${b.nombre} ${b.apellido}`
          comparison = nombreA.localeCompare(nombreB)
          break
        case "tipo":
          comparison = a.tipo.localeCompare(b.tipo)
          break
        case "condicionIva":
          comparison = a.condicionIva.localeCompare(b.condicionIva)
          break
        case "ciudad":
          comparison = (a.ciudad || "").localeCompare(b.ciudad || "")
          break
      }

      return orden.direction === "asc" ? comparison : -comparison
    })

    return sorted
  }, [filteredProveedores, orden])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderRef.current && !orderRef.current.contains(event.target as Node)) {
        setShowOrderModal(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterModal(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSelectAll = () => {
    if (selectedProveedores.length === sortedAndFilteredProveedores.length && sortedAndFilteredProveedores.length > 0) {
      setSelectedProveedores([])
    } else {
      setSelectedProveedores(sortedAndFilteredProveedores.map((p) => p.id))
    }
  }

  const handleSelectProveedor = (index: number) => {
    const proveedor = sortedAndFilteredProveedores[index]
    if (selectedProveedores.includes(proveedor.id)) {
      setSelectedProveedores(selectedProveedores.filter((id) => id !== proveedor.id))
    } else {
      setSelectedProveedores([...selectedProveedores, proveedor.id])
    }
  }

  const handleCopyCuitDni = (cuitDni: string) => {
    navigator.clipboard.writeText(cuitDni)
  }

  const handleEditProveedor = (proveedor: Proveedor) => {
    setProveedorToEdit(proveedor)
    setShowEditModal(true)
  }

  const handleSaveEdit = (id: string, updates: Partial<Proveedor>) => {
    onUpdateProveedor(id, updates)
  }

  const hasActiveFilters = Object.keys(filtros).length > 0
  const selectAllActive =
    selectedProveedores.length === sortedAndFilteredProveedores.length && sortedAndFilteredProveedores.length > 0

  const heightClass = gridSize === "sm" ? "h-[60px]" : gridSize === "md" ? "h-[80px]" : "h-[100px]"
  const textSizeClass = gridSize === "sm" ? "text-xs" : gridSize === "md" ? "text-sm" : "text-base"
  const paddingClass = gridSize === "sm" ? "px-2 py-1.5" : gridSize === "md" ? "px-3 py-2" : "px-4 py-3"

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <div className="bg-white border border-border/40 rounded-lg shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            {/* Left: Nuevo Proveedor Button with Plus icon and blue accent */}
            <Button
              onClick={() => setShowNuevoModal(true)}
              variant="ghost"
              size="sm"
              className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Nuevo Proveedor
            </Button>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black opacity-100 z-10" />
              <input
                type="text"
                placeholder="Buscar proveedores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Orden and Filtro Buttons */}
            <div className="flex items-center gap-0 flex-shrink-0">
              <div className="relative mr-3" ref={orderRef}>
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border border-gray-200/40 shadow-sm rounded-full mr-[-4px]"
                  title="Ordenar"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
                </button>
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors group cursor-pointer border shadow-sm rounded-full mr-2 ${
                    hasActiveFilters ? "border-blue-500 bg-blue-50" : "border-gray-200/40"
                  }`}
                  title="Filtros"
                >
                  <ListFilterIcon
                    className={`w-4 h-4 ${hasActiveFilters ? "text-blue-600" : "text-gray-600 group-hover:text-gray-900"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-3">
        <div className="bg-white border border-border/40 rounded-t-lg">
          <div className="grid grid-cols-[40px_1fr_180px_160px_180px_40px] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border/30">
            <div className="flex items-center justify-center">
              <Checkbox checked={selectAllActive} onCheckedChange={handleSelectAll} />
            </div>
            <div>Proveedor</div>
            <div>Email</div>
            <div>Teléfono</div>
            <div>Historial</div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setGridSize("sm")}
                className={`text-xs ${gridSize === "sm" ? "font-bold" : "font-normal"}`}
              >
                sm
              </button>
              <button
                onClick={() => setGridSize("md")}
                className={`text-xs ${gridSize === "md" ? "font-bold" : "font-normal"}`}
              >
                md
              </button>
              <button
                onClick={() => setGridSize("lg")}
                className={`text-xs ${gridSize === "lg" ? "font-bold" : "font-normal"}`}
              >
                lg
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white border border-border/40 border-t-0 rounded-b-lg">
          <div className="divide-y divide-border/30">
            {sortedAndFilteredProveedores.map((proveedor, index) => {
              const isSelected = selectedProveedores.includes(proveedor.id)
              const isHovered = hoveredIndex === index

              const displayName =
                proveedor.tipo === "empresa" ? proveedor.razonSocial || "" : `${proveedor.nombre} ${proveedor.apellido}`

              const cuitDni = proveedor.cuit ? `CUIT ${proveedor.cuit}` : proveedor.dni ? `DNI ${proveedor.dni}` : ""

              return (
                <div
                  key={proveedor.id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`grid grid-cols-[40px_1fr_180px_160px_180px_40px] gap-4 ${paddingClass} ${heightClass} items-center transition-colors ${
                    isHovered ? "bg-accent/50" : ""
                  }`}
                >
                  {/* Left selector */}
                  <div className="flex items-center justify-center">
                    <div className={`transition-opacity ${isHovered || isSelected ? "opacity-100" : "opacity-0"}`}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleSelectProveedor(index)} />
                    </div>
                  </div>

                  {/* Proveedor column with icon, name, condición IVA, and copyable CUIT/DNI */}
                  <div className="flex items-center gap-2 min-w-0">
                    {proveedor.tipo === "empresa" ? (
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`${textSizeClass} font-medium truncate`}>{displayName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{proveedor.condicionIva}</span>
                        {cuitDni && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">{cuitDni}</span>
                              <button
                                onClick={() => handleCopyCuitDni(proveedor.cuit || proveedor.dni || "")}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy CUIT/DNI"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className={`${textSizeClass} text-muted-foreground truncate`}>{proveedor.email || "-"}</div>

                  {/* Teléfono */}
                  <div className={`${textSizeClass} text-muted-foreground truncate`}>{proveedor.telefono || "-"}</div>

                  {/* Historial */}
                  <div className={`${textSizeClass} text-muted-foreground truncate`}>
                    {proveedor.transactionCount === 0
                      ? "Sin transacciones"
                      : proveedor.transactionCount === 1
                        ? "1 transacción"
                        : `${proveedor.transactionCount} transacciones`}
                  </div>

                  {/* Right side more options */}
                  <div className="flex items-center justify-end">
                    <div className={`transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProveedor(proveedor)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteProveedor(proveedor.id)}
                            className="text-destructive"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <NuevoProveedorModal isOpen={showNuevoModal} onClose={() => setShowNuevoModal(false)} onSave={onAddProveedor} />

      {showOrderModal && (
        <div ref={orderRef}>
          <OrdenModalProveedores
            isOpen={showOrderModal}
            onClose={() => setShowOrderModal(false)}
            orden={orden}
            onApply={setOrden}
          />
        </div>
      )}

      {showFilterModal && (
        <div ref={filterRef}>
          <FiltrosModalProveedores
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            filtros={filtros}
            onApply={setFiltros}
            proveedores={proveedores}
          />
        </div>
      )}

      <EditarProveedorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setProveedorToEdit(null)
        }}
        proveedor={proveedorToEdit}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
