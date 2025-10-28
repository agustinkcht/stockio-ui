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
  ChevronDown,
  Network,
  MessageCircle,
  Bell,
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
  ArrowLeftRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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

export default function DepositosPage() {
  const [selectedChannel, setSelectedChannel] = useState("general")
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [hoveredSearch, setHoveredSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectAllActive, setSelectAllActive] = useState(false)
  const [showNuevoDropdown, setShowNuevoDropdown] = useState(false)
  const [showAccionesDropdown, setShowAccionesDropdown] = useState(false)
  const [itemSelected, setItemSelected] = useState([false, false, false])

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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <div className="w-16 bg-gray-900 border-r border-gray-800 px-2 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-40">
        <div className="flex items-center justify-center py-4">
          <img src="/images/logo.png" alt="Logo" className="w-10 h-10" />
        </div>

        <div className="w-full h-px bg-gray-700 mb-2" />

        <div className="relative mb-2 mt-4" onMouseEnter={handleSearchMouseEnter} onMouseLeave={handleSearchMouseLeave}>
          <button
            className={`w-12 h-12 flex items-center justify-center mx-auto rounded-md transition-all ${
              hoveredSearch || searchQuery
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            } ${hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""}`}
          >
            <Search className="w-5 h-5 flex-shrink-0" />
          </button>

          {hoveredSearch && (
            <div
              className="absolute left-full top-0 w-2 h-12 z-[100]"
              onMouseEnter={handleSearchMouseEnter}
              onMouseLeave={handleSearchMouseLeave}
            />
          )}

          {hoveredSearch && (
            <div
              className="absolute left-full top-0 ml-2 w-64 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] p-3"
              onMouseEnter={handleSearchMouseEnter}
              onMouseLeave={handleSearchMouseLeave}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar módulos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <nav className="space-y-0 flex-1">
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              className={`relative transition-all duration-300 ${
                hoveredDropdown !== null && hoveredDropdown !== index && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
              }`}
              onMouseEnter={() => item.hasDropdown && handleDropdownMouseEnter(index)}
              onMouseLeave={() => item.hasDropdown && handleDropdownMouseLeave()}
            >
              <button
                className={`flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors ${
                  item.active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </button>

              {item.hasDropdown && hoveredDropdown === index && (
                <div
                  className="absolute left-full top-0 w-2 h-12 z-[100]"
                  onMouseEnter={() => handleDropdownMouseEnter(index)}
                  onMouseLeave={handleDropdownMouseLeave}
                />
              )}

              {item.hasDropdown && hoveredDropdown === index && (
                <div
                  className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] animate-in fade-in-0 slide-in-from-left-2 duration-200"
                  onMouseEnter={() => handleDropdownMouseEnter(index)}
                  onMouseLeave={handleDropdownMouseLeave}
                  style={{ minHeight: "fit-content" }}
                >
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
                  </div>

                  <div className="py-2">
                    {(searchQuery ? getFilteredDropdownItems(item.dropdownItems) : item.dropdownItems).map(
                      (dropdownItem, dropdownIndex) => (
                        <button
                          key={dropdownIndex}
                          onClick={() => {
                            if (dropdownItem === "Artículos") {
                              window.location.href = "/"
                            } else if (dropdownItem === "Depósitos") {
                              window.location.href = "/depositos"
                            }
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            searchQuery && dropdownItem.toLowerCase().includes(searchQuery.toLowerCase())
                              ? "text-white bg-blue-500/20 hover:bg-blue-500/30"
                              : "text-gray-300 hover:text-white hover:bg-gray-700"
                          }`}
                        >
                          {dropdownItem}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {searchQuery && !hoveredDropdown && item.dropdownItems && hasMatchingItems(item.dropdownItems) && (
                <div
                  className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100]"
                  style={{ minHeight: "fit-content" }}
                >
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
                  </div>

                  <div className="py-2">
                    {getFilteredDropdownItems(item.dropdownItems).map((dropdownItem, dropdownIndex) => (
                      <button
                        key={dropdownIndex}
                        onClick={() => {
                          if (dropdownItem === "Artículos") {
                            window.location.href = "/"
                          } else if (dropdownItem === "Depósitos") {
                            window.location.href = "/depositos"
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-white bg-blue-500/20 hover:bg-blue-500/30"
                      >
                        {dropdownItem}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <nav className="space-y-2 mt-auto mb-4">
          {bottomSidebarItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <button
                className={`flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors text-gray-400 hover:text-white hover:bg-gray-800 ${
                  hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col ml-16 transition-all duration-300">
        <div
          className="h-24 border-b border-gray-800 px-8 flex items-center justify-between fixed top-0 right-0 left-0 bg-gray-950 z-30"
          style={{ marginLeft: "4rem" }}
        >
          <div>
            <h1 className="text-3xl font-bold text-white">NOIRE</h1>
            <p className="text-gray-400">Admin</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="appearance-none bg-gray-900 border border-gray-700 rounded-md px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="mercadolibre">MercadoLibre</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="pdv">PDV</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className="h-9 border-b border-gray-800 flex items-center px-8 fixed right-0 left-0 z-30 bg-gray-950"
          style={{ top: "6rem", marginLeft: "4rem" }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white font-medium cursor-pointer transition-colors">Depósitos</span>
          </div>
        </div>

        <div
          className="h-18 border-b border-gray-800 flex items-center fixed right-0 left-0 z-30 bg-gray-950"
          style={{ top: "8.25rem", marginLeft: "4rem" }}
        >
          <div className="flex items-center gap-2 pl-8">
            <button
              onClick={handleSelectAllClick}
              className={`w-4 h-4 ${selectAllActive ? "bg-gray-400" : "bg-gray-800"} border border-gray-700 rounded-md hover:cursor-pointer transition-colors flex items-center justify-center flex-shrink-0`}
            ></button>

            <div
              className="relative"
              onMouseEnter={() => setShowNuevoDropdown(true)}
              onMouseLeave={() => setShowNuevoDropdown(false)}
            >
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>

              {showNuevoDropdown && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Nuevo Depósito
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Acciones Masivas
              </Button>

              {showAccionesDropdown && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Importación Masiva
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar depósitos..."
                className="w-full pl-10 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pr-8">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelectedItems}
              className={`bg-gray-800 border-gray-700 ${
                hasSelectedItems
                  ? "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                  : "text-gray-600 cursor-default opacity-50"
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Mover
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelectedItems}
              className={`bg-gray-800 border-gray-700 ${
                hasSelectedItems
                  ? "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                  : "text-gray-600 cursor-default opacity-50"
              }`}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelectedItems}
              className={`bg-gray-800 border-gray-700 ${
                hasSelectedItems
                  ? "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                  : "text-gray-600 cursor-default opacity-50"
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-gray-950 overflow-y-auto" style={{ marginTop: "12.75rem" }}>
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
        </div>
      </div>
    </div>
  )
}
