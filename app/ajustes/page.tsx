"use client"

import { Settings, DollarSign, ShoppingCart, Package, FolderOpen, Building2, User } from "lucide-react"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useSettings, type CostoBehavior, type CondicionIva } from "@/lib/contexts/settings-context"

const condicionesIva: CondicionIva[] = ["Consumidor Final", "Responsable Inscripto", "Monotributista", "Exento"]

export default function AjustesPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { miNegocio, precios, catalogo, updateMiNegocioSettings, updatePreciosSettings, updateCatalogoSettings } = useSettings()

  const handleCostoBehaviorChange = (behavior: CostoBehavior) => {
    updatePreciosSettings({ costoBehavior: behavior })
  }

  const formatCuit = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 10) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10, 11)}`
  }

  const handleCuitChange = (value: string) => {
    const formatted = formatCuit(value)
    if (formatted.replace(/\D/g, "").length <= 11) {
      updateMiNegocioSettings({ cuit: formatted })
    }
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
              {/* Mi Negocio Section */}
              <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Mi Negocio</h2>
                    <p className="text-xs text-slate-500">Información de tu empresa o emprendimiento</p>
                  </div>
                </div>
                
                <div className="px-6 py-5 space-y-5">
                  {/* Tipo de Negocio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Negocio</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateMiNegocioSettings({ tipo: "particular" })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          miNegocio.tipo === "particular"
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium text-sm">Particular</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateMiNegocioSettings({ tipo: "empresa" })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          miNegocio.tipo === "empresa"
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                        <span className="font-medium text-sm">Empresa</span>
                      </button>
                    </div>
                  </div>

                  {/* Razón Social (solo empresa) */}
                  {miNegocio.tipo === "empresa" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Razón Social</label>
                      <input
                        type="text"
                        value={miNegocio.razonSocial}
                        onChange={(e) => updateMiNegocioSettings({ razonSocial: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                  )}

                  {/* Nombre y Apellido (solo particulares) */}
                  {miNegocio.tipo === "particular" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                        <input
                          type="text"
                          value={miNegocio.nombre}
                          onChange={(e) => updateMiNegocioSettings({ nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="Nombre"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Apellido</label>
                        <input
                          type="text"
                          value={miNegocio.apellido}
                          onChange={(e) => updateMiNegocioSettings({ apellido: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="Apellido"
                        />
                      </div>
                    </div>
                  )}

                  {/* CUIT y DNI */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">CUIT</label>
                      <input
                        type="text"
                        value={miNegocio.cuit}
                        onChange={(e) => handleCuitChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="XX-XXXXXXXX-X"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">DNI</label>
                      <input
                        type="text"
                        value={miNegocio.dni}
                        onChange={(e) => updateMiNegocioSettings({ dni: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="12345678"
                      />
                    </div>
                  </div>

                  {/* Condición IVA */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Condición frente al IVA</label>
                    <select
                      value={miNegocio.condicionIva}
                      onChange={(e) => updateMiNegocioSettings({ condicionIva: e.target.value as CondicionIva })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white"
                    >
                      {condicionesIva.map((condicion) => (
                        <option key={condicion} value={condicion}>
                          {condicion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="h-px bg-slate-100 my-1" />

                  {/* Contacto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={miNegocio.email}
                        onChange={(e) => updateMiNegocioSettings({ email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                      <input
                        type="tel"
                        value={miNegocio.telefono}
                        onChange={(e) => updateMiNegocioSettings({ telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="+54 11 1234-5678"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-1" />

                  {/* Domicilio Fiscal */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Domicilio Fiscal</label>
                    <input
                      type="text"
                      value={miNegocio.direccion}
                      onChange={(e) => updateMiNegocioSettings({ direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                      placeholder="Av. Corrientes 1234, Piso 5, Dpto A"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Ciudad</label>
                      <input
                        type="text"
                        value={miNegocio.ciudad}
                        onChange={(e) => updateMiNegocioSettings({ ciudad: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="Buenos Aires"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Provincia</label>
                      <input
                        type="text"
                        value={miNegocio.provincia}
                        onChange={(e) => updateMiNegocioSettings({ provincia: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="CABA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Código Postal</label>
                      <input
                        type="text"
                        value={miNegocio.codigoPostal}
                        onChange={(e) => updateMiNegocioSettings({ codigoPostal: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="1043"
                      />
                    </div>
                  </div>
                </div>
              </section>

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

              {/* Catalogo Section */}
              <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Catálogo</h2>
                    <p className="text-xs text-slate-500">Configuración de items y productos</p>
                  </div>
                </div>
                
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    <label 
                      className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                      onClick={() => updateCatalogoSettings({ incluirVencimiento: !catalogo.incluirVencimiento })}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                        catalogo.incluirVencimiento
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-300"
                      }`}>
                        {catalogo.incluirVencimiento && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-800 block">
                          Incluir vencimiento en items
                        </span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Habilita la opción de establecer fecha de vencimiento en los productos del catálogo.
                        </span>
                      </div>
                    </label>
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
