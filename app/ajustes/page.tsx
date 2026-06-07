"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Settings, DollarSign, LayoutDashboard, ChevronDown, Check, AlertTriangle } from "lucide-react"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { useSidebar } from "@/hooks/use-sidebar"
import { useSettings, type CostoBehavior } from "@/lib/contexts/settings-context"
import { getMesEnCursoPeriod } from "@/lib/utils/dashboard-period"
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/contexts/period-context"

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
            <p className="text-sm text-slate-500">Tenés cambios sin guardar en ajustes. Si salís ahora se perderán.</p>
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
            Volver a ajustes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── generic footer ──────────────────────────────────────────────────────────
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

export default function AjustesPage() {
  const router = useRouter()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { precios, dashboard, updatePreciosSettings, updateDashboardSettings } = useSettings()

  // ── Dashboard draft ────────────────────────────────────────────────────────
  const [dashDraft, setDashDraft] = useState(dashboard)
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false)
  const periodDropdownRef = useRef<HTMLDivElement>(null)
  const dashDirty =
    dashDraft.mesEnCursoStartDay !== dashboard.mesEnCursoStartDay ||
    dashDraft.periodoDefault !== dashboard.periodoDefault

  // sync draft when context changes (e.g. reset from outside)
  useEffect(() => { setDashDraft(dashboard) }, [dashboard])

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setPeriodDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── Precios draft ──────────────────────────────────────────────────────────
  const [preciosDraft, setPreciosDraft] = useState(precios)
  useEffect(() => { setPreciosDraft(precios) }, [precios])
  const preciosDirty = JSON.stringify(preciosDraft) !== JSON.stringify(precios)

  const selectedPeriodLabel = PERIOD_OPTIONS.find(o => o.key === dashDraft.periodoDefault)?.label ?? "Ninguno"

  // ── Navigation guard ───────────────────────────────────────────────────────
  const anyDirty = dashDirty || preciosDirty
  const [navGuardOpen, setNavGuardOpen] = useState(false)
  const pendingHrefRef = useRef<string | null>(null)

  // Browser close / refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (anyDirty) { e.preventDefault(); e.returnValue = "" }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [anyDirty])

  // Intercept <Link> and router.push by overriding click on anchors
  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!anyDirty) return
    const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute("href")
    if (!href || href.startsWith("#") || href === "/ajustes") return
    e.preventDefault()
    e.stopPropagation()
    pendingHrefRef.current = href
    setNavGuardOpen(true)
  }, [anyDirty])

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]" onClick={handlePageClick}>
      <UnsavedChangesModal
        open={navGuardOpen}
        onStay={() => setNavGuardOpen(false)}
        onLeave={() => {
          setNavGuardOpen(false)
          if (pendingHrefRef.current) router.push(pendingHrefRef.current)
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
                <Breadcrumb items={[{ label: "Ajustes", href: "/ajustes" }]} />
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
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ajustes</h1>
                  <p className="text-sm text-slate-500">Configuración general del sistema</p>
                </div>
              </div>

              <div className="space-y-6">

                {/* ── Dashboard ─────────────────────────────────────────── */}
                <section className="bg-white rounded-2xl border border-slate-200/60">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Dashboard</h2>
                      <p className="text-xs text-slate-500">Configuración del período de Mes en Curso</p>
                    </div>
                  </div>

                  <div className="px-6 py-5 space-y-6">
                    {/* Mes en Curso */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Mes en Curso</label>
                      <p className="text-xs text-slate-400 mb-4">
                        Definí el ciclo mensual de tu negocio. El período corre desde el día elegido de un mes hasta el día anterior del siguiente.
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-slate-600">Del día</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={dashDraft.mesEnCursoStartDay}
                          onChange={(e) => {
                            const v = Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
                            setDashDraft(d => ({ ...d, mesEnCursoStartDay: v }))
                          }}
                          className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm text-center font-mono font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                        />
                        <span className="text-sm text-slate-600">de un mes al día</span>
                        <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-center font-mono font-medium bg-slate-50 text-slate-700 min-w-[5rem]">
                          {dashDraft.mesEnCursoStartDay === 1 ? "último" : dashDraft.mesEnCursoStartDay - 1}
                        </div>
                        <span className="text-sm text-slate-600">del siguiente.</span>
                      </div>

                      {dashDraft.mesEnCursoStartDay >= 29 && (
                        <p className="text-xs text-amber-600 mt-3 flex items-start gap-1.5">
                          <span className="inline-block w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          En meses con menos de {dashDraft.mesEnCursoStartDay} días se tomará hasta el último día del mes.
                        </p>
                      )}

                      <div className="mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Período actual</p>
                        <p className="text-sm font-medium text-slate-800">
                          {(() => {
                            const range = getMesEnCursoPeriod(dashDraft.mesEnCursoStartDay)
                            const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
                            return `${fmt(range.start)} — ${fmt(range.end)}`
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Período por defecto — dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Período por defecto</label>
                      <p className="text-xs text-slate-400 mb-3">
                        Período que se usa al abrir vistas como Ventas por primera vez o sin filtro activo.
                      </p>

                      <div className="relative inline-block" ref={periodDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setPeriodDropdownOpen(o => !o)}
                          className="inline-flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors text-sm font-medium text-slate-800 min-w-[200px] justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Período</span>
                            <span>{selectedPeriodLabel}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${periodDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {periodDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-[9999] py-1">
                            {/* Ninguno */}
                            {[PERIOD_OPTIONS.find(o => o.key === "ninguno")!].map(option => (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => { setDashDraft(d => ({ ...d, periodoDefault: option.key })); setPeriodDropdownOpen(false) }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${dashDraft.periodoDefault === option.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                              >
                                {option.label}
                                {dashDraft.periodoDefault === option.key && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}

                            <div className="h-px bg-slate-100 my-1" />

                            {/* En curso group */}
                            <div className="px-3 pt-1 pb-1">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">En curso</span>
                            </div>
                            {PERIOD_OPTIONS.filter(o => ["hoy", "mes_en_curso", "ano_en_curso"].includes(o.key)).map(option => (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => { setDashDraft(d => ({ ...d, periodoDefault: option.key })); setPeriodDropdownOpen(false) }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${dashDraft.periodoDefault === option.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                              >
                                {option.label}
                                {dashDraft.periodoDefault === option.key && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}

                            <div className="h-px bg-slate-100 my-1" />

                            {/* Período fijo group */}
                            <div className="px-3 pt-1 pb-1">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Período fijo</span>
                            </div>
                            {PERIOD_OPTIONS.filter(o => ["7d", "30d", "ultimo_ano", "personalizado"].includes(o.key)).map(option => (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => { setDashDraft(d => ({ ...d, periodoDefault: option.key })); setPeriodDropdownOpen(false) }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${dashDraft.periodoDefault === option.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                              >
                                {option.label}
                                {dashDraft.periodoDefault === option.key && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <SectionFooter
                    dirty={dashDirty}
                    onSave={() => {
                      updateDashboardSettings({ mesEnCursoStartDay: dashDraft.mesEnCursoStartDay, periodoDefault: dashDraft.periodoDefault })
                    }}
                    onCancel={() => setDashDraft(dashboard)}
                  />
                </section>

                {/* ── Precios ────────────────────────────────────────────── */}
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
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-1">Al editar costo:</h3>
                        <p className="text-xs text-slate-400 mb-4">
                          Define qué campo se recalcula automáticamente cuando modificas el costo de un producto.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {(["preservePrecioFinal", "preserveMargen"] as CostoBehavior[]).map((behavior) => {
                          const isSelected = preciosDraft.costoBehavior === behavior
                          return (
                            <label
                              key={behavior}
                              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-slate-900 bg-slate-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"}`}
                              onClick={() => setPreciosDraft(d => ({ ...d, costoBehavior: behavior }))}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${isSelected ? "border-slate-900" : "border-slate-300"}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                {behavior === "preservePrecioFinal" ? (
                                  <>
                                    <span className="text-sm font-medium text-slate-800 block">Modificar margen, preservar precio final</span>
                                    <span className="text-xs text-slate-500 block mt-0.5">El precio de venta se mantiene fijo, el margen se ajusta según el nuevo costo.</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm font-medium text-slate-800 block">Preservar margen y modificar precio final</span>
                                    <span className="text-xs text-slate-500 block mt-0.5">El margen porcentual se mantiene fijo, el precio de venta se recalcula.</span>
                                  </>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <SectionFooter
                    dirty={preciosDirty}
                    onSave={() => updatePreciosSettings(preciosDraft)}
                    onCancel={() => setPreciosDraft(precios)}
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
