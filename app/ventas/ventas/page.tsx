"use client"

import { useState, useRef, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { ChevronDown, FileDown, MoreVertical, Eye } from "lucide-react"

export default function VentasPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const [showSectionMenu, setShowSectionMenu] = useState(false)
  const sectionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionMenuRef.current && !sectionMenuRef.current.contains(event.target as Node)) {
        setShowSectionMenu(false)
      }
    }
    if (showSectionMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showSectionMenu])

  const breadcrumbs = [{ label: "Ventas" }, { label: "Ventas", href: "/ventas/ventas" }]

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Utility Bar */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div />
            </div>
          </div>

          <main className="flex-1 flex flex-col bg-[rgba(250,251,253,1)] overflow-hidden">
            {/* Toolbar - styled like presupuesto detail */}
            <div className="px-6 py-4 border-b border-border/20 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title and info */}
                <div className="flex items-center gap-6">
                  {/* Venta */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Venta</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">&nbsp;</h1>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Cliente */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cliente</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-800">&nbsp;</span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Estado */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Estado</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-border/40" />

                  {/* Fecha Creación */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha Creación</span>
                    <span className="text-sm font-medium text-gray-700">&nbsp;</span>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  {/* Export */}
                  <button
                    disabled
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center opacity-50 cursor-not-allowed"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    Exportar
                  </button>

                  {/* More Options */}
                  <button
                    disabled
                    className="h-8 w-8 flex items-center justify-center text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] rounded-md opacity-50 cursor-not-allowed"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
              {/* Secciones button above grid */}
              <div className="flex items-center gap-2 mb-2">
                <div className="relative" ref={sectionMenuRef}>
                  <button
                    onClick={() => setShowSectionMenu(!showSectionMenu)}
                    className="h-8 text-xs transition-colors border shadow-sm border-[rgba(228,230,235,0.6)] gap-1.5 shrink-0 px-3 rounded-md flex items-center hover:bg-gray-100 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Secciones</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {showSectionMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                      <div className="px-3 py-1.5 text-xs text-slate-400">Sin secciones</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Empty Grid */}
              <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
                {/* Grid Header (empty - no columns) */}
                <div className="bg-slate-100 border-b border-slate-200/80 rounded-t-lg h-9" />

                {/* Empty body */}
                <div className="h-32" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
