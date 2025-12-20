"use client"

import { Plus, ListPlusIcon,Grid3x3, Layers, Upload } from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface StockIntelligenceWidgetsProps {
  handleOpenNuevoItem: () => void
  handleOpenNuevoItemConVariantes: () => void
  isExpanded?: boolean
}

export function StockIntelligenceWidgets({
  handleOpenNuevoItem,
  handleOpenNuevoItemConVariantes,
  isExpanded = true,
}: StockIntelligenceWidgetsProps) {
  const [showNuevoDropdown, setShowNuevoDropdown] = useState(false)
  const [showCreacionMasivaDropdown, setShowCreacionMasivaDropdown] = useState(false)
  const nuevoRef = useRef<HTMLDivElement>(null)
  const creacionMasivaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nuevoRef.current && !nuevoRef.current.contains(event.target as Node)) {
        setShowNuevoDropdown(false)
      }
      if (creacionMasivaRef.current && !creacionMasivaRef.current.contains(event.target as Node)) {
        setShowCreacionMasivaDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="bg-transparent z-30 transition-all duration-300" style={{ left: isExpanded ? "256px" : "64px" }}>
      <div className="px-8 pt-6 pb-2">
        <div className="relative top-[86px] mb-0">
          <div className="grid grid-cols-2 gap-4">
            {/* Crear Nuevo Widget */}
            <div className="relative" ref={nuevoRef}>
              <button
                onClick={() => setShowNuevoDropdown(!showNuevoDropdown)}
                className="w-full h-24 bg-white hover:bg-gray-50 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-2 group border-[rgba(225,232,240,0.5)] shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Plus className="w-5 h-5 text-blue-900" />
                </div>
                <span className="text-sm font-medium text-gray-700">Crear Nuevo</span>
              </button>

              {showNuevoDropdown && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        handleOpenNuevoItem()
                        setShowNuevoDropdown(false)
                      }}
                      className="w-full rounded-lg text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-gray-400" />
                      Item
                    </button>
                    <button
                      onClick={() => {
                        handleOpenNuevoItemConVariantes()
                        setShowNuevoDropdown(false)
                      }}
                      className="w-full rounded-lg text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Grid3x3 className="w-4 h-4 text-gray-400" />
                      Item con Variantes
                    </button>
                    <button className="w-full rounded-lg text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <Layers className="w-4 h-4 text-gray-400" />
                      Combo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Creación Masiva Widget */}
            <div className="relative" ref={creacionMasivaRef}>
              <button
                onClick={() => setShowCreacionMasivaDropdown(!showCreacionMasivaDropdown)}
                className="w-full h-24 bg-white hover:bg-gray-50 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-2 group border-[rgba(225,232,240,0.5)] shadow-sm"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors bg-blue-50">
                  <ListPlusIcon className="w-5 h-5 text-blue-900" />
                </div>
                <span className="text-sm font-medium text-gray-700">Creador Masivo </span>
              </button>

              {showCreacionMasivaDropdown && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="p-1">
                    <button className="w-full rounded-lg text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <Grid3x3 className="w-4 h-4 text-gray-400" />
                      Creador Masivo
                    </button>
                    <button className="w-full rounded-lg text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4 text-gray-400" />
                      Importar CSV
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
