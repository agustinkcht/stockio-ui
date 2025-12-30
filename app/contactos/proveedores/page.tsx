"use client"

import { useState, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { useProveedores } from "@/hooks/use-proveedores"
import type { Proveedor } from "@/lib/data/proveedores"
import { Undo2, Redo2, X, Check } from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { NuevoProveedorModal } from "@/components/modals/nuevo-proveedor-modal"
import { ProveedoresGrid } from "@/components/proveedores/proveedores-grid"

function ProveedoresContent() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { proveedores, addProveedor, updateProveedor, deleteProveedor, isLoading } = useProveedores()
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false)

  // Grid state
  const [gridSize, setGridSize] = useState("md")
  const [gridSizeDropdownOpen, setGridSizeDropdownOpen] = useState(false)
  const [proveedorSelected, setProveedorSelected] = useState<boolean[]>(new Array(proveedores.length).fill(false))
  const [selectAllActive, setSelectAllActive] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<{ id: string; proveedor: Proveedor } | null>(null)

  const breadcrumbs = [{ label: "Contactos" }, { label: "Proveedores", href: "/contactos/proveedores" }]

  const handleProveedorButtonClick = (index: number) => {
    const newSelected = [...proveedorSelected]
    newSelected[index] = !newSelected[index]
    setProveedorSelected(newSelected)

    // Update selectAllActive based on selection state
    const allSelected = newSelected.every((s) => s)
    const noneSelected = newSelected.every((s) => !s)
    setSelectAllActive(allSelected && !noneSelected)
  }

  const handleSelectAllClick = () => {
    const newState = !selectAllActive
    setSelectAllActive(newState)
    setProveedorSelected(new Array(proveedores.length).fill(newState))
  }

  const handleSaveProveedor = (proveedorData: Omit<Proveedor, "id">) => {
    const newProveedor: Proveedor = {
      ...proveedorData,
      id: `PROV-${String(proveedores.length + 1).padStart(3, "0")}`,
      transactionCount: 0,
    }
    addProveedor(newProveedor)
    setShowNuevoProveedorModal(false)
  }

  const handleDeleteProveedor = (id: string) => {
    const proveedorToDelete = proveedores.find((p) => p.id === id)
    if (proveedorToDelete) {
      setPendingDelete({ id, proveedor: proveedorToDelete })
    }
  }

  const handleUndo = () => {
    setPendingDelete(null)
  }

  const handleSave = () => {
    if (pendingDelete) {
      deleteProveedor(pendingDelete.id)
      setPendingDelete(null)
    }
  }

  const handleCancel = () => {
    setPendingDelete(null)
  }

  const hasUnsavedChanges = pendingDelete !== null
  const canUndo = hasUnsavedChanges

  const displayedProveedores = pendingDelete ? proveedores.filter((p) => p.id !== pendingDelete.id) : proveedores

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
          {/* Navbar */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-muted/50 mr-1.5">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
                    title="Deshacer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled
                    className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
                    title="Rehacer"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-5 w-px bg-border/60" />
                <button
                  onClick={handleCancel}
                  disabled={!hasUnsavedChanges}
                  className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary px-7"
                  title="Guardar"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 flex flex-col overflow-auto">
              <div className="px-8 pb-8 pt-4">
                <div className="rounded-xl border border-[rgba(228,230,235,0.5)] bg-transparent shadow-none border-none">
                  <ProveedoresGrid
                    proveedores={displayedProveedores}
                    onAddProveedor={addProveedor}
                    onUpdateProveedor={updateProveedor}
                    onDeleteProveedor={handleDeleteProveedor}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Nuevo Proveedor Modal */}
      <NuevoProveedorModal
        isOpen={showNuevoProveedorModal}
        onClose={() => setShowNuevoProveedorModal(false)}
        onSave={handleSaveProveedor}
      />
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
