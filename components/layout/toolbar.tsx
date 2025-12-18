"use client"

import { Plus, Grid3x3, Layers, MoreVertical, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect } from "react"

interface ToolbarProps {
  showNuevoDropdown: boolean
  setShowNuevoDropdown: (value: boolean) => void
  handleOpenNuevoItem: () => void
  handleOpenNuevoItemConVariantes: () => void
  isExpanded?: boolean
}

export function Toolbar({
  showNuevoDropdown,
  setShowNuevoDropdown,
  handleOpenNuevoItem,
  handleOpenNuevoItemConVariantes,
  isExpanded = true,
}: ToolbarProps) {
  const nuevoRef = useRef<HTMLDivElement>(null)
  const moreOptionsRef = useRef<HTMLDivElement>(null)

  const [showMoreOptionsDropdown, setShowMoreOptionsDropdown] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nuevoRef.current && !nuevoRef.current.contains(event.target as Node)) {
        setShowNuevoDropdown(false)
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptionsDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setShowNuevoDropdown])

  return (
    <div
      className={`bg-transparent z-30 transition-all duration-300 opacity-100 translate-y-0`}
      style={{ left: isExpanded ? "256px" : "64px" }}
    >
      <div className="px-8 pt-6 pb-2 flex justify-start bg-transparent">
        <div className="h-12 relative top-[86px] bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm px-4 flex items-center gap-3 transition-all duration-300 mb-0">
          <div className="flex items-center gap-2 pl-5 pr-1">
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
