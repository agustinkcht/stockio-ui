"use client"

import { Settings, DollarSign, ShoppingCart, Package, FolderOpen, Building2, User, Camera, LayoutDashboard } from "lucide-react"
import Image from "next/image"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useSettings, type CostoBehavior, type CondicionIva } from "@/lib/contexts/settings-context"
import { getMesEnCursoPeriod } from "@/lib/utils/dashboard-period"

const condicionesIva: CondicionIva[] = ["Consumidor Final", "Responsable Inscripto", "Monotributista", "Exento"]

export default function AjustesPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { miNegocio, precios, catalogo, stock, dashboard, updateMiNegocioSettings, updatePreciosSettings, updateCatalogoSettings, updateStockSettings, updateDashboardSettings } = useSettings()

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
              {/* Dashboard Section */}
              <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Dashboard</h2>
                    <p className="text-xs text-slate-500">Configuración del período de Mes en Curso</p>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Mes en Curso
                    </label>
                    <p className="text-xs text-slate-400 mb-4">
                      Definí el ciclo mensual de tu negocio. El período corre desde el día elegido de un mes hasta el día anterior del siguiente.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-slate-600">Del día</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dashboard.mesEnCursoStartDay}
                        onChange={(e) => {
                          const v = Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
                          updateDashboardSettings({ mesEnCursoStartDay: v })
                        }}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm text-center font-mono font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                      />
                      <span className="text-sm text-slate-600">de un mes al día</span>
                      <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-center font-mono font-medium bg-slate-50 text-slate-700 min-w-[5rem]">
                        {dashboard.mesEnCursoStartDay === 1
                          ? "último"
                          : dashboard.mesEnCursoStartDay - 1}
                      </div>
                      <span className="text-sm text-slate-600">del siguiente.</span>
                    </div>

                    {dashboard.mesEnCursoStartDay >= 29 && (
                      <p className="text-xs text-amber-600 mt-3 flex items-start gap-1.5">
                        <span className="inline-block w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        En meses con menos de {dashboard.mesEnCursoStartDay} días se tomará hasta el último día del mes.
                      </p>
                    )}

                    <div className="mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Período actual</p>
                      <p className="text-sm font-medium text-slate-800">
                        {(() => {
                          const range = getMesEnCursoPeriod(dashboard.mesEnCursoStartDay)
                          const fmt = (d: Date) =>
                            d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
                          return `${fmt(range.start)} — ${fmt(range.end)}`
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

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
                  {/* Photo and App Name */}
                  <div className="flex items-start gap-5">
                    {/* Photo */}
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200">
                        {miNegocio.fotoUrl ? (
                          <Image
                            src={miNegocio.fotoUrl}
                            alt="Logo del negocio"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                        onClick={() => {
                          const url = prompt("URL de la imagen:", miNegocio.fotoUrl)
                          if (url !== null) updateMiNegocioSettings({ fotoUrl: url })
                        }}
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    
                    {/* App Name */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del Negocio</label>
                      <input
                        type="text"
                        value={miNegocio.nombreApp}
                        onChange={(e) => updateMiNegocioSettings({ nombreApp: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="Nombre de tu negocio"
                      />
                      <p className="text-xs text-slate-500 mt-1">Este nombre aparecerá en la aplicación</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Tipo de Negocio - Selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Negocio</label>
                    <select
                      value={miNegocio.tipo}
                      onChange={(e) => updateMiNegocioSettings({ tipo: e.target.value as "particular" | "empresa" })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white"
                    >
                      <option value="particular">Particular</option>
                      <option value="empresa">Empresa</option>
                    </select>
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
                            Modificar margen, preservar precio final
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

              {/* Stock Section */}
              <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Stock</h2>
                    <p className="text-xs text-slate-500">Configuración de gestión de inventario</p>
                  </div>
                </div>
                
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock Mínimo por Defecto</label>
                      <p className="text-xs text-slate-400 mb-3">
                        Cantidad mínima de stock deseada. Al llegar a este nivel, se muestra una alerta para re-abastecer.
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          value={stock.stockMinimoPorDefecto}
                          onChange={(e) => updateStockSettings({ stockMinimoPorDefecto: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        />
                        <span className="text-sm text-slate-500">unidades</span>
                      </div>
                    </div>
                  </div>
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
