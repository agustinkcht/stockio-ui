"use client"

import type { Cliente } from "@/lib/data/clientes"
import type { ClienteFilterConfig, ClienteSortFactorConfig } from "@/lib/types"
import { Search, X, MoreHorizontal, Copy, Building2, User, Plus, ArrowUpDown, ListFilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect, useMemo } from "react"
import { OrdenModalClientes } from "@/components/modals/orden-modal-clientes"
import { FiltrosModalClientes } from "@/components/modals/filtros-modal-clientes"
import { EditarClienteModal } from "@/components/modals/editar-cliente-modal"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const condicionIvaColors: Record<string, string> = {
  "Consumidor Final": "bg-slate-100 text-slate-700",
  "Responsable Inscripto": "bg-blue-50 text-blue-700",
  Monotributista: "bg-amber-50 text-amber-700",
  Exento: "bg-purple-50 text-purple-700",
}

interface ClientesGridProps {
  clientes: Cliente[]
  gridSize: string
  clienteSelected: boolean[]
  handleClienteButtonClick: (index: number) => void
  selectAllActive: boolean
  handleSelectAllClick: () => void
  gridSizeDropdownOpen: boolean
  setGridSizeDropdownOpen: (value: boolean) => void
  setGridSize: (size: string) => void
  onOpenNuevoCliente: () => void
  onDeleteCliente: (id: string) => void
  onUpdateCliente: (id: string, updates: Partial<Cliente>) => void
  hasSelectedClientes?: boolean
  onBatchDelete?: () => void
}

export function ClientesGrid({
  clientes,
  gridSize,
  clienteSelected,
  handleClienteButtonClick,
  selectAllActive,
  handleSelectAllClick,
  gridSizeDropdownOpen,
  setGridSizeDropdownOpen,
  setGridSize,
  onOpenNuevoCliente,
  onDeleteCliente,
  onUpdateCliente,
  hasSelectedClientes = false,
  onBatchDelete,
}: ClientesGridProps) {
  const orderRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [showEditModal, setShowEditModal] = useState(false)
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null)

  const [activeFilters, setActiveFilters] = useState<ClienteFilterConfig>({
    tipos: [],
    condicionesIva: [],
    ciudades: [],
  })

  const [sortPriorities, setSortPriorities] = useState<ClienteSortFactorConfig[]>([
    { factor: "nombre", direction: "asc" },
  ])

  const availableCondiciones = useMemo(() => {
    const condiciones = new Set(clientes.map((c) => c.condicionIva))
    return Array.from(condiciones).sort()
  }, [clientes])

  const availableCiudades = useMemo(() => {
    const ciudades = new Set(clientes.filter((c) => c.ciudad).map((c) => c.ciudad!))
    return Array.from(ciudades).sort()
  }, [clientes])

  const searchedClientes = useMemo(() => {
    if (!searchTerm) return clientes
    const searchLower = searchTerm.toLowerCase()
    return clientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(searchLower) ||
        cliente.apellido.toLowerCase().includes(searchLower) ||
        (cliente.razonSocial?.toLowerCase().includes(searchLower) ?? false) ||
        (cliente.cuit?.toLowerCase().includes(searchLower) ?? false) ||
        (cliente.dni?.toLowerCase().includes(searchLower) ?? false) ||
        (cliente.email?.toLowerCase().includes(searchLower) ?? false),
    )
  }, [clientes, searchTerm])

  const filteredClientes = useMemo(() => {
    let result = searchedClientes

    if (activeFilters.tipos.length > 0) {
      result = result.filter((c) => activeFilters.tipos.includes(c.tipo))
    }
    if (activeFilters.condicionesIva.length > 0) {
      result = result.filter((c) => activeFilters.condicionesIva.includes(c.condicionIva))
    }
    if (activeFilters.ciudades.length > 0) {
      result = result.filter((c) => c.ciudad && activeFilters.ciudades.includes(c.ciudad))
    }

    return result
  }, [searchedClientes, activeFilters])

  const sortedAndFilteredClientes = useMemo(() => {
    const result = [...filteredClientes]

    result.sort((a, b) => {
      for (const { factor, direction } of sortPriorities) {
        let comparison = 0

        switch (factor) {
          case "nombre":
            const nameA = a.tipo === "empresa" && a.razonSocial ? a.razonSocial : `${a.nombre} ${a.apellido}`
            const nameB = b.tipo === "empresa" && b.razonSocial ? b.razonSocial : `${b.nombre} ${b.apellido}`
            comparison = nameA.localeCompare(nameB)
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

        if (comparison !== 0) {
          return direction === "asc" ? comparison : -comparison
        }
      }
      return 0
    })

    return result
  }, [filteredClientes, sortPriorities])

  const hasActiveFilters =
    activeFilters.tipos.length > 0 || activeFilters.condicionesIva.length > 0 || activeFilters.ciudades.length > 0

  const heightClass = gridSize === "sm" ? "h-[60px]" : gridSize === "md" ? "h-[80px]" : "h-[100px]"
  const textSizeClass = gridSize === "sm" ? "text-xs" : gridSize === "md" ? "text-sm" : "text-base"
  const paddingClass = gridSize === "sm" ? "px-2 py-1.5" : gridSize === "md" ? "px-3 py-2" : "px-4 py-3"

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <div className="bg-white border border-border/40 rounded-lg shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            {/* Left: Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onOpenNuevoCliente}
                variant="ghost"
                size="sm"
                className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] hover:bg-gray-100 cursor-pointer gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Nuevo Cliente
              </Button>

              {hasSelectedClientes && (
                <Button
                  onClick={onBatchDelete}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs transition-colors border shadow-sm bg-red-50 hover:bg-red-100 border-red-200 text-red-700 cursor-pointer"
                >
                  Eliminar
                </Button>
              )}
            </div>

            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black opacity-100 z-10" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-9 pr-9 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all duration-300 border-[rgba(202,213,227,0.842391304347826)]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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
              <Checkbox checked={selectAllActive} onCheckedChange={handleSelectAllClick} />
            </div>
            <div>Cliente</div>
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
            {sortedAndFilteredClientes.map((cliente, index) => {
              const isSelected = clienteSelected[index]
              const isHovered = hoveredIndex === index

              const displayName = getClienteDisplayName(cliente)
              const cuitDni = cliente.cuit ? `CUIT ${cliente.cuit}` : cliente.dni ? `DNI ${cliente.dni}` : ""

              return (
                <div
                  key={cliente.id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`grid grid-cols-[40px_1fr_180px_160px_180px_40px] gap-4 ${paddingClass} ${heightClass} items-center transition-colors ${
                    isHovered ? "bg-accent/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className={`transition-opacity ${isHovered || isSelected ? "opacity-100" : "opacity-0"}`}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleClienteButtonClick(index)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {cliente.tipo === "empresa" ? (
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`${textSizeClass} font-medium truncate`}>{displayName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{cliente.condicionIva}</span>
                        {cuitDni && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">{cuitDni}</span>
                              <button
                                onClick={() => handleCopyCuitDni(cliente.cuit || cliente.dni || "")}
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

                  <div className={`${textSizeClass} text-muted-foreground truncate`}>{cliente.email || "-"}</div>

                  <div className={`${textSizeClass} text-muted-foreground truncate`}>{cliente.telefono || "-"}</div>

                  <div className={`${textSizeClass} text-muted-foreground truncate`}>
                    {cliente.transactionCount === 0
                      ? "Sin transacciones"
                      : cliente.transactionCount === 1
                        ? "1 transacción"
                        : `${cliente.transactionCount} transacciones`}
                  </div>

                  <div className="flex items-center justify-end">
                    <div className={`transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setClienteToEdit(cliente)
                            setShowEditModal(true)
                          }}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteCliente(cliente.id)} className="text-destructive">
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

      {showOrderModal && (
        <div ref={orderRef}>
          <OrdenModalClientes
            isOpen={showOrderModal}
            onClose={() => setShowOrderModal(false)}
            sortPriorities={sortPriorities}
            onApply={setSortPriorities}
          />
        </div>
      )}

      {showFilterModal && (
        <div ref={filterRef}>
          <FiltrosModalClientes
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            filters={activeFilters}
            onApply={setActiveFilters}
            availableCondiciones={availableCondiciones}
            availableCiudades={availableCiudades}
          />
        </div>
      )}

      <EditarClienteModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setClienteToEdit(null)
        }}
        cliente={clienteToEdit}
        onSave={(id, updates) => onUpdateCliente(id, updates)}
      />
    </div>
  )
}

function getClienteDisplayName(cliente: Cliente): string {
  if (cliente.tipo === "empresa" && cliente.razonSocial) {
    return cliente.razonSocial
  }
  return `${cliente.nombre} ${cliente.apellido}`
}

function handleCopyCuitDni(cuitDni: string) {
  navigator.clipboard.writeText(cuitDni)
}
