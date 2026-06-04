"use client"

import { useState, useMemo, useRef, useEffect, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { useClientes } from "@/hooks/use-clientes"
import { useVentas } from "@/hooks/use-ventas"
import { useRouter } from "next/navigation"
import type { Cliente } from "@/lib/data/clientes"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { NuevoClienteModal } from "@/components/modals/nuevo-cliente-modal"
import { EditarClienteModal } from "@/components/modals/editar-cliente-modal"
import { ClientesGrid } from "@/components/clientes/clientes-grid"
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

function ClientesContent() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes()
  const { ventas } = useVentas()
  const router = useRouter()

  // ── Search / Filter / Sort ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortField, setSortField]  = useState<SortField>("nombre")
  const [sortDir,   setSortDir]    = useState<SortDir>("asc")
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ tipo: null, condicionIva: null })

  // ── Selection ───────────────────────────────────────────────────────────────
  const [clienteSelected, setClienteSelected] = useState<boolean[]>([])
  const allCheckboxRef = useRef<HTMLInputElement>(null)

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [showNuevo, setShowNuevo] = useState(false)
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const breadcrumbs = [{ label: "Contactos" }, { label: "Clientes", href: "/contactos/clientes" }]

  // ── Derived lists ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = clientes

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.apellido.toLowerCase().includes(q) ||
          (c.razonSocial?.toLowerCase().includes(q) ?? false) ||
          (c.cuit?.toLowerCase().includes(q) ?? false) ||
          (c.dni?.toLowerCase().includes(q) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false),
      )
    }
    if (activeFilters.tipo) {
      result = result.filter((c) => c.tipo === activeFilters.tipo)
    }
    if (activeFilters.condicionIva) {
      result = result.filter((c) => c.condicionIva === activeFilters.condicionIva)
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
  }, [clientes, searchQuery, activeFilters, sortField, sortDir])

  // ── Selection helpers ───────────────────────────────────────────────────────
  const selectedCount = clienteSelected.filter(Boolean).length
  const allSelected = filtered.length > 0 && selectedCount === filtered.length
  const someSelected = selectedCount > 0 && !allSelected

  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const handleSelectAll = () => {
    const next = !allSelected
    setClienteSelected(new Array(filtered.length).fill(next))
  }

  const handleSelectCliente = (index: number) => {
    setClienteSelected((prev) => {
      const next = [...prev]
      while (next.length < filtered.length) next.push(false)
      next[index] = !next[index]
      return next
    })
  }

  // Reset selections when filtered list changes
  useEffect(() => {
    setClienteSelected([])
  }, [filtered.length])

  // ── CRUD handlers ───────────────────────────────────────────────────────────
  const flashSuccess = () => {
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handleSaveNuevo = (data: Omit<Cliente, "id">) => {
    addCliente({ ...data, id: `CLI-${String(clientes.length + 1).padStart(3, "0")}`, transactionCount: 0 })
    setShowNuevo(false)
  }

  const handleConfirmDelete = () => {
    if (!clienteToDelete) return
    deleteCliente(clienteToDelete.id)
    setClienteToDelete(null)
    flashSuccess()
  }

  const handleConfirmBatchDelete = () => {
    const ids = filtered.filter((_, i) => clienteSelected[i]).map((c) => c.id)
    ids.forEach((id) => deleteCliente(id))
    setClienteSelected([])
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
          <div className="flex-1 overflow-y-auto bg-slate-50">

            {/* Top row */}
            <div className="px-8 pt-12 pb-8">
              <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                  Clientes
                </h1>
                <button
                  type="button"
                  onClick={() => setShowNuevo(true)}
                  className="h-9 px-4 text-sm font-semibold transition-colors border shadow-sm border-[rgba(228,230,235,0.8)] gap-2 shrink-0 rounded-lg flex items-center bg-white text-slate-900 hover:bg-slate-50 cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
                  Nuevo Cliente
                </button>
              </div>
            </div>

            {/* ── Sticky bar ────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-20">

              {/* Row 1 — Search + tags + filtrar/ordenar + count */}
              <div className="relative z-10 bg-slate-50/95 backdrop-blur-sm px-8 py-2">
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
                              : "border-[rgba(228,230,235,0.6)] bg-white hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          Filtrar
                        </button>
                        {filterOpen && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setFilterOpen(false)} />
                            <div className="absolute top-full right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-[100] p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                              {/* Tipo de cliente */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tipo de cliente</label>
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

                      {/* Ordenar — split control: direction toggle + field select */}
                      <div className="flex items-center border border-[rgba(228,230,235,0.6)] shadow-sm rounded-md overflow-hidden bg-white h-9">
                        <button
                          type="button"
                          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                          title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                          className="px-2.5 h-full hover:bg-slate-50 transition-colors border-r border-[rgba(228,230,235,0.6)] cursor-pointer flex items-center"
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
                        {filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Row 2 — Bulk actions */}
              <div className="px-8">
                <div className="max-w-6xl mx-auto bg-white border border-slate-200/80 border-t-0 rounded-b-md">
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
                      <span className="text-xs text-slate-400">Seleccioná clientes para accionar masivamente</span>
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
              </div>

            </div>
            {/* /sticky bar */}

            {/* ── Item grid ───────────────────────────────────────────────── */}
            <div className="px-8 pt-2 pb-8">
              <div className="max-w-6xl mx-auto">

                {/* Table header — no all-selector, no grid size */}
                <div className="grid grid-cols-[minmax(40px,4%)_1fr_200px_160px_200px_44px] px-4 py-2 border border-slate-200/80 rounded-t-md bg-slate-50/60">
                  <div />
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Cliente</div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Teléfono</div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Historial</div>
                  <div />
                </div>

                {/* Rows — connected to header (no gap) */}
                <div className="border border-slate-200/80 border-t-0 rounded-b-md overflow-hidden bg-white">
                  <ClientesGrid
                    clientes={filtered}
                    ventas={ventas}
                    clienteSelected={clienteSelected}
                    onSelectCliente={handleSelectCliente}
                    onEditCliente={(c) => setClienteToEdit(c)}
                    onDeleteCliente={(id) => setClienteToDelete(filtered.find((c) => c.id === id) ?? null)}
                    onTransaccionesClick={(nombre) => router.push(`/ventas/ventas?cliente=${encodeURIComponent(nombre)}&periodo=ninguno`)}
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
      <NuevoClienteModal
        isOpen={showNuevo}
        onClose={() => setShowNuevo(false)}
        onSave={handleSaveNuevo}
      />

      <EditarClienteModal
        isOpen={!!clienteToEdit}
        onClose={() => setClienteToEdit(null)}
        cliente={clienteToEdit}
        onSave={(id, updates) => { updateCliente(id, updates); setClienteToEdit(null); flashSuccess() }}
      />

      {clienteToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={() => setClienteToDelete(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">¿Seguro deseas eliminar el cliente?</h3>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button onClick={() => setClienteToDelete(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">Cancelar</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer">Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={() => setShowBatchDeleteModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">¿Seguro deseas eliminar los clientes seleccionados?</h3>
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

export default function ClientesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando...</div>}>
      <ClientesContent />
    </Suspense>
  )
}
