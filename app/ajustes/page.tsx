"use client"

import { Settings, DollarSign, ShoppingCart, Package } from "lucide-react"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useSettings, type CostoBehavior } from "@/lib/contexts/settings-context"

export default function AjustesPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { precios, updatePreciosSettings } = useSettings()

  const handleCostoBehaviorChange = (behavior: CostoBehavior) => {
    updatePreciosSettings({ costoBehavior: behavior })
  }

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

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white rounded-lg shadow-sm h-[calc(100vh-12px)]">
          {/* Header - Same as other pages */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={[{ label: "Ajustes", href: "/ajustes" }]} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2 min-w-[200px] justify-end">
                {/* Placeholder for future action buttons */}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            {/* Page Title */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ajustes</h1>
                <p className="text-sm text-slate-500">Configuración general del sistema</p>
              </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
              {/* Precios Section */}
              <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Precios</h2>
                    <p className="text-xs text-slate-500">Comportamiento de cálculo de precios</p>
                  </div>
                </div>
                
                <div className="px-6 py-5">
                  {/* Costo behavior setting */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-1">Al editar costo:</h3>
                      <p className="text-xs text-slate-400 mb-4">
                        Define qué campo se recalcula automáticamente cuando modificas el costo de un producto.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <label 
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          precios.costoBehavior === "preservePrecioFinal"
                            ? "border-slate-900 bg-slate-50/50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                        }`}
                        onClick={() => handleCostoBehaviorChange("preservePrecioFinal")}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          precios.costoBehavior === "preservePrecioFinal"
                            ? "border-slate-900"
                            : "border-slate-300"
                        }`}>
                          {precios.costoBehavior === "preservePrecioFinal" && (
                            <div className="w-2 h-2 rounded-full bg-slate-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-800 block">
                            Preservar precio final y modificar margen
                          </span>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            El precio de venta se mantiene fijo, el margen se ajusta según el nuevo costo.
                          </span>
                        </div>
                      </label>

                      <label 
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          precios.costoBehavior === "preserveMargen"
                            ? "border-slate-900 bg-slate-50/50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                        }`}
                        onClick={() => handleCostoBehaviorChange("preserveMargen")}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          precios.costoBehavior === "preserveMargen"
                            ? "border-slate-900"
                            : "border-slate-300"
                        }`}>
                          {precios.costoBehavior === "preserveMargen" && (
                            <div className="w-2 h-2 rounded-full bg-slate-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-800 block">
                            Preservar margen y modificar precio final
                          </span>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            El margen porcentual se mantiene fijo, el precio de venta se recalcula.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Punto de Venta Section */}
              <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Punto de Venta</h2>
                    <p className="text-xs text-slate-500">Configuración del sistema de ventas</p>
                  </div>
                </div>
                
                <div className="px-6 py-8 flex items-center justify-center">
                  <p className="text-sm text-slate-400">Próximamente</p>
                </div>
              </section>

              {/* Inventario Section */}
              <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Inventario</h2>
                    <p className="text-xs text-slate-500">Configuración de gestión de stock</p>
                  </div>
                </div>
                
                <div className="px-6 py-8 flex items-center justify-center">
                  <p className="text-sm text-slate-400">Próximamente</p>
                </div>
              </section>
            </div>
          </div>
        </div>
        </main>
        </div>
    </div>
  )
}
