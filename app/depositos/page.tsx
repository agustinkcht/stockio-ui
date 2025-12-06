"use client"

import { useState, useRef } from "react"
import {
  Search,
  ShoppingBag,
  Store,
  Box,
  TrendingUp,
  Settings,
  HelpCircle,
  Network,
  Plus,
  Upload,
  Edit,
  BarChart3,
  Tag,
  Layers,
  Pencil,
  Trash2,
  MoreHorizontal,
  Building,
  Warehouse,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UtilityBar } from "@/components/layout/utility-bar"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"

const sidebarItems = [
  {
    icon: BarChart3,
    label: "Dashboard",
    hasDropdown: false,
  },
  {
    icon: ShoppingBag,
    label: "Ventas",
    hasDropdown: true,
    dropdownItems: ["Ventas", "Facturación", "Envíos", "Presupuestos", "Clientes"],
  },
  {
    icon: Box,
    label: "Stock",
    hasDropdown: true,
    dropdownItems: ["Artículos", "Depósitos", "Compras", "Catálogo", "Proveedores"],
  },
  {
    icon: Tag,
    label: "Precios",
    hasDropdown: true,
    dropdownItems: ["Listas de Precios"],
  },
  {
    icon: Network,
    label: "Canales Online",
    hasDropdown: true,
    dropdownItems: ["Publicaciones", "Marketing"],
  },
  {
    icon: Store,
    label: "Mi Negocio",
    hasDropdown: true,
    dropdownItems: ["Punto de Venta", "Cajas", "Gastos y Servicios", "Personal"],
  },
  {
    icon: TrendingUp,
    label: "BI",
    hasDropdown: true,
    dropdownItems: ["Cashflow", "Rotación", "Performance Online", "Optimización"],
  },
]

const bottomSidebarItems = [
  { icon: HelpCircle, label: "Soporte" },
  { icon: Settings, label: "Ajustes" },
]

const breadcrumbs = [{ label: "Inventario" }, { label: "Depósitos", href: "/depositos" }]

export default function DepositosPage() {
  const [selectedChannel, setSelectedChannel] = useState("general")
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [hoveredSearch, setHoveredSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectAllActive, setSelectAllActive] = useState(false)
  const [showNuevoDropdown, setShowNuevoDropdown] = useState(false)
  const [showAccionesDropdown, setShowAccionesDropdown] = useState(false)
  const [itemSelected, setItemSelected] = useState([false, false, false])
  const [changeTracker, setChangeTracker] = useState({ hasUnsavedChanges: false, canUndo: false, canRedo: false })
  const [isSaving, setIsSaving] = useState(false)
  const [itemCreated, setItemCreated] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const depositos = [
    {
      nombre: "Ibiza",
      icon: Building,
      direccion: "Angel Delía 1190, Muñiz",
      estado: "Activo",
      canales: [
        { name: "ML", active: true },
        { name: "E-Com", active: true },
        { name: "PDV", active: false },
      ],
      stock: {
        total: 45280,
        reservado: 8450,
        disponible: 36830,
      },
    },
    {
      nombre: "Trujui",
      icon: Warehouse,
      direccion: "Ruta 8, Km 23, San Miguel",
      estado: "Activo",
      canales: [
        { name: "ML", active: false },
        { name: "E-Com", active: false },
        { name: "PDV", active: false },
      ],
      stock: {
        total: 62150,
        reservado: 12300,
        disponible: 49850,
      },
    },
    {
      nombre: "Ciudadela",
      icon: Store,
      direccion: "Av. Rivadavia 2050, CABA",
      estado: "Activo",
      canales: [
        { name: "ML", active: false },
        { name: "E-Com", active: false },
        { name: "PDV", active: true },
      ],
      stock: {
        total: 38920,
        reservado: 5670,
        disponible: 33250,
      },
    },
  ]

  const handleSelectAllClick = () => {
    const newState = !selectAllActive
    setSelectAllActive(newState)
    setItemSelected([newState, newState, newState])
  }

  const handleItemButtonClick = (index: number) => {
    setItemSelected((prev) => {
      const newStates = [...prev]
      newStates[index] = !newStates[index]
      const allSelected = newStates.every((state) => state)
      setSelectAllActive(allSelected)
      return newStates
    })
  }

  const hasSelectedItems = itemSelected.some((selected) => selected)

  const handleDropdownMouseEnter = (index: number) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setHoveredDropdown(index)
  }

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredDropdown(null)
    }, 250)
  }

  const handleSearchMouseEnter = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    setHoveredSearch(true)
  }

  const handleSearchMouseLeave = () => {
    searchTimeoutRef.current = setTimeout(() => {
      setHoveredSearch(false)
      setSearchQuery("")
    }, 250)
  }

  const getFilteredDropdownItems = (items: string[]) => {
    if (!searchQuery) return items
    return items.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const hasMatchingItems = (items: string[]) => {
    return items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const handleUndo = () => {
    // Implement undo functionality
  }

  const handleRedo = () => {
    // Implement redo functionality
  }

  const handleDeshacer = () => {
    // Implement deshacer functionality
  }

  const handleGuardar = () => {
    // Implement guardar functionality
  }

  return (
    <div className="min-h-screen bg-slate-50 text-foreground flex">
      <div>
        <Sidebar
          sidebarItems={sidebarItems}
          bottomSidebarItems={bottomSidebarItems}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          hoveredSearch={hoveredSearch}
          hoveredDropdown={hoveredDropdown}
          handleSearchMouseEnter={handleSearchMouseEnter}
          handleSearchMouseLeave={handleSearchMouseLeave}
          handleDropdownMouseEnter={handleDropdownMouseEnter}
          handleDropdownMouseLeave={handleDropdownMouseLeave}
          getFilteredDropdownItems={getFilteredDropdownItems}
          hasMatchingItems={hasMatchingItems}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />
      </div>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 bg-slate-50 ${isSidebarExpanded ? "ml-64" : "ml-16"}`}
      >
        <TopNav
          currentView="depositos"
          navigationHistory={[]}
          historyIndex={0}
          minimizedTabs={[]}
          activeNavTab="depositos"
          onNavigateBack={() => {}}
          onNavigateForward={() => {}}
          onRestoreTab={() => {}}
          onCloseTab={() => {}}
          isExpanded={isSidebarExpanded}
        />

        {/* UtilityBar */}
        <UtilityBar
          breadcrumbs={breadcrumbs}
          hasUnsavedChanges={changeTracker.hasUnsavedChanges || hasSelectedItems}
          canUndo={changeTracker.canUndo}
          canRedo={changeTracker.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDeshacer={handleDeshacer}
          onGuardar={handleGuardar}
          isSaving={isSaving}
          itemCreated={itemCreated}
          isExpanded={isSidebarExpanded}
        />

        <div
          className="h-18 border-b border-border flex items-center fixed right-0 left-0 z-20 bg-white"
          style={{ top: "8.25rem", marginLeft: isSidebarExpanded ? "16rem" : "4rem" }}
        >
          <div className="flex items-center gap-2 pl-8">
            <button
              onClick={handleSelectAllClick}
              className={`w-4 h-4 ${selectAllActive ? "bg-gray-400" : "bg-white"} border border-border rounded-md hover:cursor-pointer transition-colors flex items-center justify-center flex-shrink-0`}
            ></button>

            <div
              className="relative"
              onMouseEnter={() => setShowNuevoDropdown(true)}
              onMouseLeave={() => setShowNuevoDropdown(false)}
            >
              <Button variant="outline" size="sm" className="bg-white border-border text-foreground hover:bg-gray-100">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>

              {showNuevoDropdown && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-border rounded-md shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Nuevo Depósito
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Nuevo Grupo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setShowAccionesDropdown(true)}
              onMouseLeave={() => setShowAccionesDropdown(false)}
            >
              <Button variant="outline" size="sm" className="bg-white border-border text-foreground hover:bg-gray-100">
                <Edit className="w-4 h-4 mr-2" />
                Acciones Masivas
              </Button>

              {showAccionesDropdown && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-border rounded-md shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Importación Masiva
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edición Masiva
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex justify-center px-8">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black opacity-100 z-10 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar depósitos..."
                className="w-full pl-10 pr-4 py-1.5 bg-white backdrop-blur-sm border border-border rounded-md text-gray-600 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pr-8">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelectedItems}
              className={`bg-white border-border ${
                hasSelectedItems
                  ? "text-foreground hover:bg-gray-100 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto transition-all duration-200 bg-slate-50 mt-[12.75rem] px-8 pb-8">
          <div className="px-8 pt-1.5">
            <div className="flex items-center gap-2 h-10 mb-2 mt-0">
              <div className="w-4 flex-shrink-0"></div>

              <div className="flex-1 h-full bg-gray-900/30 border border-gray-800 rounded-md grid grid-cols-11 border-none">
                <div className="col-span-2 flex items-center h-full border-r border-gray-700 gap-2 px-4">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Nombre</span>
                </div>

                <div className="col-span-3 h-full flex items-center justify-center border-r border-gray-700 px-4">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Dirección</span>
                </div>

                <div className="col-span-3 h-full flex items-center justify-center border-r border-gray-700 px-4">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Stock</span>
                </div>

                <div className="col-span-3 h-full flex items-center justify-center px-4">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Canales de Venta</span>
                </div>
              </div>

              <div className="w-[108px] flex-shrink-0"></div>
            </div>
          </div>

          <div className="px-8">
            <div className="space-y-2 pb-8">
              {depositos.map((deposito, index) => (
                <div key={index} className="flex items-center gap-2">
                  <button
                    onClick={() => handleItemButtonClick(index)}
                    className={`w-4 h-4 ${itemSelected[index] ? "bg-gray-400" : "bg-gray-800"} border border-gray-700 rounded-md hover:cursor-pointer transition-colors flex items-center justify-center flex-shrink-0`}
                  ></button>

                  <div className="flex-1 h-18 rounded-md grid grid-cols-11 bg-slate-900 border border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <div className="col-span-2 flex items-center h-full border-r border-gray-700 gap-2 px-4">
                      <deposito.icon className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span className="text-sm text-gray-300">{deposito.nombre}</span>
                    </div>

                    <div className="col-span-3 h-full flex items-center justify-center border-r border-gray-700 px-4">
                      <span className="text-sm text-gray-300">{deposito.direccion}</span>
                    </div>

                    <div className="col-span-3 h-full flex items-center justify-evenly gap-3 border-r border-gray-700 px-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
                        <span className="text-sm text-gray-300">{deposito.stock.total.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Reservado</span>
                        <span className="text-sm text-gray-300">{deposito.stock.reservado.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Disponible</span>
                        <span className="text-sm text-gray-300">{deposito.stock.disponible.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="col-span-3 h-full flex items-center justify-center gap-2 px-4">
                      {deposito.canales.map((canal, canalIndex) => (
                        <span
                          key={canalIndex}
                          className={`text-xs px-2 py-1 rounded ${
                            canal.active
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-gray-800 text-gray-500 border border-gray-700"
                          }`}
                        >
                          {canal.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
