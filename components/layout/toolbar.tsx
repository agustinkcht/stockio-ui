"use client"

import { Plus, Layers, MoreHorizontal, Upload, Download } from "lucide-react"
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
      className="bg-transparent z-30 transition-all duration-300"
      style={{ left: isExpanded ? "256px" : "64px" }}
    >
      <div className="px-8 pt-6 pb-2 flex justify-start">
        <div className="h-10 relative top-[86px] bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm px-3 flex items-center gap-2 transition-all duration-300">
          <div className="flex items-center gap-1.5">
            <div className="relative" ref={nuevoRef}>
              <button
                onClick={() => setShowNuevoDropdown(!showNuevoDropdown)}
                className="h-7 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                Nuevo
              </button>

              {showNuevoDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  <button
                    onClick={handleOpenNuevoItem}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5"
                  >
                    <Plus className="w-4 h-4 text-slate-400" />
                    Item
                  </button>
                  <button
                    onClick={handleOpenNuevoItemConVariantes}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    Con Variantes
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-slate-200" />

            <div className="relative" ref={moreOptionsRef}>
              <button
                onClick={() => setShowMoreOptionsDropdown(!showMoreOptionsDropdown)}
                className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMoreOptionsDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-slate-400" />
                    Importar CSV
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-slate-400" />
                    Exportar CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
