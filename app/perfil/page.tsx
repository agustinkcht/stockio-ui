"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Building2, Camera, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useSettings, type CondicionIva } from "@/lib/contexts/settings-context"

const condicionesIva: CondicionIva[] = ["Consumidor Final", "Responsable Inscripto", "Monotributista", "Exento"]

// ─── unsaved changes nav-guard modal ─────────────────────────────────────────
function UnsavedChangesModal({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onStay} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Guardá los cambios antes de continuar</h2>
            <p className="text-sm text-slate-500">Tenés cambios sin guardar en perfil. Si salís ahora se perderán.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onLeave}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Salir sin guardar
          </button>
          <button
            type="button"
            onClick={onStay}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Volver al perfil
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── section footer ───────────────────────────────────────────────────────────
function SectionFooter({ dirty, onSave, onCancel }: { dirty: boolean; onSave: () => void; onCancel: () => void }) {
  if (!dirty) return null
  return (
    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
      >
        Guardar
      </button>
    </div>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { miNegocio, updateMiNegocioSettings } = useSettings()

  // ── Mi Negocio draft ───────────────────────────────────────────────────────
  const [negocioDraft, setNegocioDraft] = useState(miNegocio)
  useEffect(() => { setNegocioDraft(miNegocio) }, [miNegocio])
  const negocioDirty = JSON.stringify(negocioDraft) !== JSON.stringify(miNegocio)

  const formatCuit = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 10) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10, 11)}`
  }

  // ── Navigation guard ───────────────────────────────────────────────────────
  const [navGuardOpen, setNavGuardOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (negocioDirty) { e.preventDefault(); e.returnValue = "" }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [negocioDirty])

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!negocioDirty) return
    const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute("href")
    if (!href || href.startsWith("#") || href === "/perfil") return
    e.preventDefault()
    e.stopPropagation()
    setPendingHref(href)
    setNavGuardOpen(true)
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]" onClick={handlePageClick}>
      <UnsavedChangesModal
        open={navGuardOpen}
        onStay={() => setNavGuardOpen(false)}
        onLeave={() => {
          setNavGuardOpen(false)
          if (pendingHref) router.push(pendingHref)
        }}
      />
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
          {/* Header */}
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={[{ label: "Perfil", href: "/perfil" }]} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <UserPanel />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8 bg-slate-50">
            <div className="max-w-3xl mx-auto">
              {/* Page Title */}
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Perfil</h1>
                  <p className="text-sm text-slate-500">Configuración general del perfil</p>
                </div>
              </div>

              <div className="space-y-6">

                {/* ── Mi Negocio ─────────────────────────────────────────── */}
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
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200">
                          {negocioDraft.fotoUrl ? (
                            <Image src={negocioDraft.fotoUrl} alt="Logo del negocio" width={80} height={80} className="w-full h-full object-cover" />
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
                            const url = prompt("URL de la imagen:", negocioDraft.fotoUrl)
                            if (url !== null) setNegocioDraft(d => ({ ...d, fotoUrl: url }))
                          }}
                        >
                          <Camera className="w-5 h-5 text-white" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del Negocio</label>
                        <input
                          type="text"
                          value={negocioDraft.nombreApp}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, nombreApp: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="Nombre de tu negocio"
                        />
                        <p className="text-xs text-slate-500 mt-1">Este nombre aparecerá en la aplicación</p>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Negocio</label>
                      <select
                        value={negocioDraft.tipo}
                        onChange={(e) => setNegocioDraft(d => ({ ...d, tipo: e.target.value as "particular" | "empresa" }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white"
                      >
                        <option value="particular">Particular</option>
                        <option value="empresa">Empresa</option>
                      </select>
                    </div>

                    {negocioDraft.tipo === "empresa" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Razón Social</label>
                        <input
                          type="text"
                          value={negocioDraft.razonSocial}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, razonSocial: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="Nombre de la empresa"
                        />
                      </div>
                    )}

                    {negocioDraft.tipo === "particular" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                          <input
                            type="text"
                            value={negocioDraft.nombre}
                            onChange={(e) => setNegocioDraft(d => ({ ...d, nombre: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                            placeholder="Nombre"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Apellido</label>
                          <input
                            type="text"
                            value={negocioDraft.apellido}
                            onChange={(e) => setNegocioDraft(d => ({ ...d, apellido: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                            placeholder="Apellido"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">CUIT</label>
                        <input
                          type="text"
                          value={negocioDraft.cuit}
                          onChange={(e) => {
                            const formatted = formatCuit(e.target.value)
                            if (formatted.replace(/\D/g, "").length <= 11) setNegocioDraft(d => ({ ...d, cuit: formatted }))
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="XX-XXXXXXXX-X"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">DNI</label>
                        <input
                          type="text"
                          value={negocioDraft.dni}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, dni: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="12345678"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Condición frente al IVA</label>
                      <select
                        value={negocioDraft.condicionIva}
                        onChange={(e) => setNegocioDraft(d => ({ ...d, condicionIva: e.target.value as CondicionIva }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white"
                      >
                        {condicionesIva.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input
                          type="email"
                          value={negocioDraft.email}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="email@ejemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                        <input
                          type="tel"
                          value={negocioDraft.telefono}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, telefono: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="+54 11 1234-5678"
                        />
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Domicilio Fiscal</label>
                      <input
                        type="text"
                        value={negocioDraft.direccion}
                        onChange={(e) => setNegocioDraft(d => ({ ...d, direccion: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        placeholder="Av. Corrientes 1234, Piso 5, Dpto A"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Ciudad</label>
                        <input
                          type="text"
                          value={negocioDraft.ciudad}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, ciudad: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="Buenos Aires"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Provincia</label>
                        <input
                          type="text"
                          value={negocioDraft.provincia}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, provincia: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="CABA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Código Postal</label>
                        <input
                          type="text"
                          value={negocioDraft.codigoPostal}
                          onChange={(e) => setNegocioDraft(d => ({ ...d, codigoPostal: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                          placeholder="1043"
                        />
                      </div>
                    </div>
                  </div>

                  <SectionFooter
                    dirty={negocioDirty}
                    onSave={() => updateMiNegocioSettings(negocioDraft)}
                    onCancel={() => setNegocioDraft(miNegocio)}
                  />
                </section>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
