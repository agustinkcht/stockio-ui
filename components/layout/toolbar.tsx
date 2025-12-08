"use client"

import { Plus, Grid3x3, Layers, MoreVertical, Upload, Download, BookOpen, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect } from "react"

interface ToolbarProps {
  showNuevoDropdown: boolean
  setShowNuevoDropdown: (value: boolean) => void
  handleOpenNuevoItem: () => void
  handleOpenNuevoItemConVariantes: () => void
  hasSelectedItems: boolean
  isExpanded?: boolean
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
  hasSelectedItems,
  isExpanded = true,
  selectAllActive,
  handleSelectAllClick,
  gridSize,
  gridSizeDropdownOpen,
  setGridSizeDropdownOpen,
  setGridSize,
}: ToolbarProps) {
  const nuevoRef = useRef<HTMLDivElement>(null)
  const moreOptionsRef = useRef<HTMLDivElement>(null)
  const massiveActionsRef = useRef<HTMLDivElement>(null)

  const [showMoreOptionsDropdown, setShowMoreOptionsDropdown] = useState(false)
  const [showMassiveActionsDropdown, setShowMassiveActionsDropdown] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nuevoRef.current && !nuevoRef.current.contains(event.target as Node)) {
        setShowNuevoDropdown(false)
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptionsDropdown(false)
      }
      if (massiveActionsRef.current && !massiveActionsRef.current.contains(event.target as Node)) {
        setShowMassiveActionsDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setShowNuevoDropdown])

  return (
    <div
      className="fixed top-[84px] bg-transparent z-30 transition-all duration-300"
      style={{ left: isExpanded ? "256px" : "64px" }}
    >
      <div className="px-8 pt-6 pb-2 flex justify-start bg-transparent">
        <div className="h-12 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm px-4 flex items-center gap-3 transition-all duration-300 mb-0">
          <div className="flex items-center gap-2 pl-5 pr-1">
            <div className="relative w-80 mr-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black opacity-100 w-3.5 h-3.5 z-10" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                className="w-full h-8 pl-9 pr-3 border shadow-sm rounded-md text-xs placeholder:text-gray-600 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all border-[rgba(202,213,227,0.842391304347826)]"
              />
            </div>

            {hasSelectedItems && (
              <div className="flex items-center gap-2 pr-3 border-r border-gray-200 animate-in fade-in-0 slide-in-from-left-5 duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <div className="relative" ref={nuevoRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNuevoDropdown(!showNuevoDropdown)}
                className="h-8 text-xs hover:bg-gray-100 transition-colors cursor-pointer border shadow-sm border-[rgba(228,230,235,0.6)]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nuevo
              </Button>

              {showNuevoDropdown && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button
                      onClick={handleOpenNuevoItem}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-gray-400" />
                      Item
                    </button>
                    <button
                      onClick={handleOpenNuevoItemConVariantes}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Grid3x3 className="w-4 h-4 text-gray-400" />
                      Item con Variantes
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <Layers className="w-4 h-4 text-gray-400" />
                      Combo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={moreOptionsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreOptionsDropdown(!showMoreOptionsDropdown)}
                className="h-8 px-2 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>

              {showMoreOptionsDropdown && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <Grid3x3 className="w-4 h-4 text-gray-400" />
                      Creación Masiva
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4 text-gray-400" />
                      Importar CSV
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <Download className="w-4 h-4 text-gray-400" />
                      Exportar CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
