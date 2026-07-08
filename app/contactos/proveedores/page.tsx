"use client"

import { useState, useMemo, useRef, useEffect, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { useProveedores } from "@/hooks/use-proveedores"
import { useCompras } from "@/hooks/use-compras"
import { useRouter } from "next/navigation"
import type { Proveedor } from "@/lib/data/proveedores"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { NuevoProveedorModal } from "@/components/modals/nuevo-proveedor-modal"
import { EditarProveedorModal } from "@/components/modals/editar-proveedor-modal"
import { ProveedoresGrid } from "@/components/proveedores/proveedores-grid"
import {
  Plus,
  Search,
  X,
  ListFilter,
  ArrowUpDown,
  Trash2,
  CheckCircle2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "nombre" | "transacciones"
type SortDir   = "asc" | "desc"

type ActiveFilters = {
  tipo: ("particular" | "empresa") | null
  condicionIva: string | null
}

const CONDICIONES_IVA = [
  "Consumidor Final",
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProveedoresContent() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { proveedores, addProveedor, updateProveedor, deleteProveedor } = useProveedores()
  const { compras } = useCompras()
  const router = useRouter()

  // ── Search / Filter / Sort ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>("nombre")
  const [sortDir,   setSortDir]   = useState<SortDir>("asc")
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ tipo: null, condicionIva: null })

  // ── Selection ───────────────────────────────────────────────────────────────
  const [proveedorSelected, setProveedorSelected] = useState<boolean[]>([])
  const allCheckboxRef = useRef<HTMLInputElement>(null)

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [showNuevo, setShowNuevo] = useState(false)
  const [proveedorToEdit, setProveedorToEdit] = useState<Proveedor | null>(null)
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const breadcrumbs = [{ label: "Contactos" }, { label: "Proveedores", href: "/contactos/proveedores" }]

  // ── Derived lists ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = proveedores

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          (p.razonSocial?.toLowerCase().includes(q) ?? false) ||
          (p.cuit?.toLowerCase().includes(q) ?? false) ||
          (p.dni?.toLowerCase().includes(q) ?? false) ||
          (p.email?.toLowerCase().includes(q) ?? false),
      )
    }
    if (activeFilters.tipo) {
      result = result.filter((p) => p.tipo === activeFilters.tipo)
    }
    if (activeFilters.condicionIva) {
      result = result.filter((p) => p.condicionIva === activeFilters.condicionIva)
    }

    return [...result].sort((a, b) => {
      const nameA = a.tipo === "empresa" && a.razonSocial ? a.razonSocial : `${a.nombre} ${a.apellido}`
      const nameB = b.tipo === "empresa" && b.razonSocial ? b.razonSocial : `${b.nombre} ${b.apellido}`
      if (sortField === "nombre") {
        const cmp = nameA.localeCompare(nameB)
        return sortDir === "asc" ? cmp : -cmp
      } else {
        const cmp = a.transactionCount - b.transactionCount
        return sortDir === "asc" ? cmp : -cmp
      }
    })
  }, [proveedores, searchQuery, activeFilters, sortField, sortDir])

  // ── Selection helpers ───────────────────────────────────────────────────────
  const selectedCount = proveedorSelected.filter(Boolean).length
  const allSelected = filtered.length > 0 && selectedCount === filtered.length
  const someSelected = selectedCount > 0 && !allSelected

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const handleSelectAll = () => {
    const next = !allSelected
    setProveedorSelected(new Array(filtered.length).fill(next))
  }

  const handleSelectProveedor = (index: number) => {
    setProveedorSelected((prev) => {
      const next = [...prev]
      while (next.length < filtered.length) next.push(false)
      next[index] = !next[index]
      return next
    })
  }

  // Reset selections when filtered list changes
  useEffect(() => {
    setProveedorSelected([])
  }, [filtered.length])

  // ── CRUD handlers ───────────────────────────────────────────────────────────
  const flashSuccess = () => {
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handleSaveNuevo = (data: Omit<Proveedor, "id">) => {
    addProveedor({ ...data, id: `PROV-${String(proveedores.length + 1).padStart(3, "0")}`, transactionCount: 0 })
    setShowNuevo(false)
  }

  const handleConfirmDelete = () => {
    if (!proveedorToDelete) return
    deleteProveedor(proveedorToDelete.id)
    setProveedorToDelete(null)
    flashSuccess()
  }

  const handleConfirmBatchDelete = () => {
    const ids = filtered.filter((_, i) => proveedorSelected[i]).map((p) => p.id)
    ids.forEach((id) => deleteProveedor(id))
    setProveedorSelected([])
    setShowBatchDeleteModal(false)
    flashSuccess()
  }

  // ── Filter tag helpers ───────────────────────────────────────────────────────
  const hasFilters = !!activeFilters.tipo || !!activeFilters.condicionIva

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)] flex flex-col">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>

        {/* Sidebar */}
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        {/* Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">

          {/* ── Utility bar ────────────────────────────────────────────────── */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004] shrink-0">
            <div className="px-4 flex items-center justify-between h-full">
              <Breadcrumb items={breadcrumbs} />
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2 min-w-[200px] justify-end">
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Cambios guardados</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Scrollable region ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto bg-panel-content">

            {/* Top row */}
            <div className="px-8 pt-12 pb-8">
              <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                  Proveedores
                </h1>
                <button
                  type="button"
                  onClick={() => setShowNuevo(true)}
                  className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 shrink-0 rounded-lg flex items-center bg-white text-slate-900 hover:bg-panel-content cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                  Nuevo Proveedor
                </button>
              </div>
            </div>

            {/* ── Sticky bar ────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-20">

              {/* Row 1 — Search + tags + filtrar/ordenar + count */}
              <div className="relative z-10 bg-panel-content/95 backdrop-blur-sm px-8 pt-2 pb-0">
                <div className="max-w-6xl mx-auto border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">

                    {/* Search */}
                    <div className="flex items-center h-9 border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md min-w-0 overflow-hidden bg-white">
                      <div className="flex items-center gap-2 px-3 h-full w-64 bg-white">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 cursor-pointer text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active filter tags */}
                    {hasFilters && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeFilters.tipo && (
                          <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                            {activeFilters.tipo === "particular" ? "Particular" : "Empresa"}
                            <button type="button" onClick={() => setActiveFilters((f) => ({ ...f, tipo: null }))} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                              <X className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          </span>
                        )}
                        {activeFilters.condicionIva && (
                          <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 text-[11px] font-medium rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm whitespace-nowrap">
                            {activeFilters.condicionIva}
                            <button type="button" onClick={() => setActiveFilters((f) => ({ ...f, condicionIva: null }))} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                              <X className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Right: Filtrar + Ordenar + count */}
                    <div className="ml-auto flex items-center gap-2">

                      {/* Filtrar */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setFilterOpen((v) => !v)}
                          className={`h-9 text-xs border shadow-sm px-3 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors ${
                            hasFilters
                              ? "border-blue-400 text-blue-600 bg-blue-50"
                              : "border-[rgba(228,230,235,0.6)] bg-white hover:bg-panel-content text-slate-600"
                          }`}
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          Filtrar
                        </button>
                        {filterOpen && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setFilterOpen(false)} />
                            <div className="absolute top-full right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-[100] p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                              {/* Tipo de proveedor */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tipo de proveedor</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={activeFilters.tipo === "particular"}
                                    onChange={() => setActiveFilters((f) => ({ ...f, tipo: f.tipo === "particular" ? null : "particular" }))}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-slate-700">Particular</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={activeFilters.tipo === "empresa"}
                                    onChange={() => setActiveFilters((f) => ({ ...f, tipo: f.tipo === "empresa" ? null : "empresa" }))}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-slate-700">Empresa</span>
                                </label>
                              </div>
                              {/* Condición frente al IVA */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Condición frente al IVA</label>
                                {CONDICIONES_IVA.map((c) => (
                                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={activeFilters.condicionIva === c}
                                      onChange={() => setActiveFilters((f) => ({ ...f, condicionIva: f.condicionIva === c ? null : c }))}
                                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-700">{c}</span>
                                  </label>
                                ))}
                              </div>
                              {hasFilters && (
                                <button
                                  type="button"
                                  onClick={() => setActiveFilters({ tipo: null, condicionIva: null })}
                                  className="w-full text-xs text-slate-500 hover:text-slate-700 py-1 text-center cursor-pointer"
                                >
                                  Limpiar filtros
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Ordenar — split control */}
                      <div className="flex items-center border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md overflow-hidden bg-white h-9">
                        <button
                          type="button"
                          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                          title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                          className="px-2.5 h-full hover:bg-panel-content transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer flex items-center"
                        >
                          <ArrowUpDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
                        </button>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value as SortField)}
                          className="appearance-none pl-2.5 pr-2.5 text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700 h-full w-auto"
                        >
                          <option value="nombre">Nombre</option>
                          <option value="transacciones">Transacciones</option>
                        </select>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-5 bg-slate-200 shrink-0" />

                      {/* Count */}
                      <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
                        {filtered.length} {filtered.length === 1 ? "proveedor" : "proveedores"}
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Row 2 — Bulk actions + Tab header together, same bg */}
              <div className="px-8 bg-panel-content/95 backdrop-blur-sm pb-2">
                <div className="max-w-6xl mx-auto">
                  {/* Bulk actions */}
                  <div className="bg-white border border-slate-200/80 rounded-lg">
                    <div className="flex items-center gap-2 h-9">
                      <div className="flex items-center justify-center w-[4%] min-w-[40px] shrink-0">
                        <input
                          ref={allCheckboxRef}
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 rounded accent-slate-800 cursor-pointer"
                        />
                      </div>
                      <div className="w-px h-5 bg-slate-200 shrink-0" />
                      {selectedCount === 0 ? (
                        <span className="text-xs text-slate-400">Seleccioná proveedores para accionar masivamente</span>
                      ) : (
                        <>
                          <span className="text-xs text-slate-600">
                            {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
                          </span>
                          <div className="w-px h-5 bg-slate-200 shrink-0" />
                          <button
                            type="button"
                            onClick={() => setShowBatchDeleteModal(true)}
                            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer px-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar seleccionados
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Tab header */}
                  <div className="grid grid-cols-12 h-9 border border-slate-200/80 mt-2 bg-panel-content rounded-lg overflow-hidden">
                    <div className="col-span-5 flex items-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-4">Proveedor</div>
                    <div className="col-span-3 flex items-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-l border-slate-200/60 pl-3">Email</div>
                    <div className="col-span-2 flex items-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-l border-slate-200/60 pl-3">Teléfono</div>
                    <div className="col-span-2 flex items-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-l border-slate-200/60 pl-3">Transacciones</div>
                  </div>
                </div>
              </div>

            </div>
            {/* /sticky bar */}

            {/* ── Item grid ─────────────────────���─────────────────────────── */}
            <div className="px-8 pb-8">
              <div className="max-w-6xl mx-auto">

                {/* Rows */}
                  <div className="border border-slate-200/80 rounded-md overflow-hidden bg-white">
                  <ProveedoresGrid
                    proveedores={filtered}
                    compras={compras}
                    proveedorSelected={proveedorSelected}
                    onSelectProveedor={handleSelectProveedor}
                    onEditProveedor={(p) => setProveedorToEdit(p)}
                    onDeleteProveedor={(id) => setProveedorToDelete(filtered.find((p) => p.id === id) ?? null)}
                    onTransaccionesClick={(nombre) => router.push(`/compras/compras?proveedor=${encodeURIComponent(nombre)}&periodo=ninguno`)}
                  />
                </div>

              </div>
            </div>

          </div>
          {/* /scrollable region */}

        </div>
        {/* /panel */}

      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <NuevoProveedorModal
        isOpen={showNuevo}
        onClose={() => setShowNuevo(false)}
        onSave={handleSaveNuevo}
      />

      <EditarProveedorModal
        isOpen={!!proveedorToEdit}
        onClose={() => setProveedorToEdit(null)}
        proveedor={proveedorToEdit}
        onSave={(id, updates) => { updateProveedor(id, updates); setProveedorToEdit(null); flashSuccess() }}
      />

      {proveedorToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={() => setProveedorToDelete(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">¿Seguro deseas eliminar el proveedor?</h3>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button onClick={() => setProveedorToDelete(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">Cancelar</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer">Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={() => setShowBatchDeleteModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">¿Seguro deseas eliminar los proveedores seleccionados?</h3>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button onClick={() => setShowBatchDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">Cancelar</button>
              <button onClick={handleConfirmBatchDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer">Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProveedoresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando...</div>}>
      <ProveedoresContent />
    </Suspense>
  )
}
