"use client"

import { Plus, Edit, Upload, ArrowLeftRight, Pencil, Trash2, Grid3x3, Layers, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToolbarProps {
  showNuevoDropdown: boolean
  setShowNuevoDropdown: (value: boolean) => void
  handleOpenNuevoItem: () => void
  handleOpenNuevoItemConVariantes: () => void
  showAccionesDropdown: boolean
  setShowAccionesDropdown: (value: boolean) => void
  hasSelectedItems: boolean
  selectAllActive: boolean
  handleSelectAllClick: () => void
  gridSize: string
  gridSizeDropdownOpen: boolean
  setGridSizeDropdownOpen: (value: boolean) => void
  setGridSize: (size: string) => void
}

export function Toolbar({
  showNuevoDropdown,
  setShowNuevoDropdown,
  handleOpenNuevoItem,
  handleOpenNuevoItemConVariantes,
  showAccionesDropdown,
  setShowAccionesDropdown,
  hasSelectedItems,
  selectAllActive,
  handleSelectAllClick,
  gridSize,
  gridSizeDropdownOpen,
  setGridSizeDropdownOpen,
  setGridSize,
}: ToolbarProps) {
  return (
    <div className="fixed top-22 right-0 left-0 bg-gray-950 z-20" style={{ marginLeft: "4rem" }}>
      {/* Action Toolbar */}
      <div className="border-b border-gray-800 flex items-center justify-between py-0 h-11">
        <div className="flex items-center gap-2 pl-8">
          <div className="relative">
            <div onMouseEnter={() => setShowNuevoDropdown(true)} onMouseLeave={() => setShowNuevoDropdown(false)}>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>

              {showNuevoDropdown && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button
                      onClick={handleOpenNuevoItem}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Item
                    </button>
                    <button
                      onClick={handleOpenNuevoItemConVariantes}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <Grid3x3 className="w-4 h-4" />
                      Nuevo Item con Variantes
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Nuevo Grupo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <div onMouseEnter={() => setShowAccionesDropdown(true)} onMouseLeave={() => setShowAccionesDropdown(false)}>
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
        </div>

        <div className="flex-1 flex justify-center px-8 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar artículos..."
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

      {/* Grid Header */}
      <div className="px-8 pt-2 pb-2">
        <div className="flex gap-2 h-9">
          <div className="w-4 flex items-center justify-center">
            <button
              onClick={handleSelectAllClick}
              className={`w-4 h-4 ${selectAllActive ? "bg-gray-400" : "bg-gray-800"} border border-gray-700 rounded-md hover:cursor-pointer transition-colors flex items-center justify-center flex-shrink-0`}
            ></button>
          </div>
          <div
            className={`flex-1 border-b-0 border-t-0 border-r-0 border-l-0 ${gridSize !== "lg" ? "rounded-xs" : "rounded-md"} bg-gray-900/30 border border-gray-800 overflow-hidden`}
          >
            <div className="grid grid-cols-11 h-full">
              <div className="col-span-5 flex items-center px-4 border-r border-gray-800">
                <span className="text-xs uppercase tracking-wider text-gray-400">Título</span>
              </div>
              <div className="col-span-3 flex items-center px-4 border-r border-gray-800">
                <span className="text-xs uppercase tracking-wider text-gray-400">Atributos</span>
              </div>
              <div className="col-span-3 flex items-center px-4">
                <span className="text-xs uppercase tracking-wider text-gray-400">Stock</span>
              </div>
            </div>
          </div>
          <div className="w-[108px] relative">
            <button
              onClick={() => setGridSizeDropdownOpen(!gridSizeDropdownOpen)}
              className="w-full h-full bg-gray-900/30 border border-gray-800 rounded-md flex items-center justify-between px-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
              <span className="text-xs text-gray-400">Grilla</span>
              <span className="text-xs text-white font-medium uppercase">{gridSize}</span>
            </button>
            {gridSizeDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    setGridSize("lg")
                    setGridSizeDropdownOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  LG
                </button>
                <button
                  onClick={() => {
                    setGridSize("md")
                    setGridSizeDropdownOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  MD
                </button>
                <button
                  onClick={() => {
                    setGridSize("sm")
                    setGridSizeDropdownOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  SM
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
