"use client"

import { useState, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { useProveedores } from "@/hooks/use-proveedores"
import type { Proveedor } from "@/lib/data/proveedores"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { NuevoProveedorModal } from "@/components/modals/nuevo-proveedor-modal"
import { ProveedoresGrid } from "@/components/proveedores/proveedores-grid"
import { CheckCircle2 } from "lucide-react"
import { useAccount } from "@/lib/contexts/account-context"

function ProveedoresContent() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { currentAccount } = useAccount()
  const { proveedores, addProveedor, updateProveedor, deleteProveedor, isLoading } = useProveedores()
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; proveedor: Proveedor } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false) // Declare hasUnsavedChanges

  // Grid state
  const [gridSize, setGridSize] = useState("md")
  const [gridSizeDropdownOpen, setGridSizeDropdownOpen] = useState(false)
  const [proveedorSelected, setProveedorSelected] = useState<boolean[]>([])
  const [selectAllActive, setSelectAllActive] = useState(false)
  const [displayedProveedores, setDisplayedProveedores] = useState(proveedores) // Declare displayedProveedores

  const breadcrumbs = [{ label: "Contactos" }, { label: "Proveedores", href: "/contactos/proveedores" }]

  const handleProveedorButtonClick = (index: number) => {
    setProveedorSelected((prev) => {
      const newSelected = [...prev]
      // Ensure array is large enough
      while (newSelected.length < proveedores.length) {
        newSelected.push(false)
      }
      newSelected[index] = !newSelected[index]

      // Update selectAllActive based on selection state - true only if ALL are selected
      const allSelected = newSelected.every((s) => s)
      setSelectAllActive(allSelected)

      return newSelected
    })
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
    setShowSaveSuccess(true)
    setHasUnsavedChanges(false) // Update hasUnsavedChanges
  }

  const handleDeleteProveedor = (id: string) => {
    const proveedor = proveedores.find((p) => p.id === id)
    if (proveedor) {
      setProveedorToDelete(proveedor)
    }
  }

  const handleConfirmDelete = () => {
    if (!proveedorToDelete) return

    console.log("[v0] Individual delete starting for:", proveedorToDelete.id)
    
    // Manually filter and save to localStorage to ensure persistence and immediate UI update
    const idToDelete = proveedorToDelete.id
    const remainingProveedores = proveedores.filter((p) => p.id !== idToDelete)
    
    if (typeof window !== "undefined") {
      const storageKey = `stockio-proveedores-${currentAccount}`
      localStorage.setItem(storageKey, JSON.stringify(remainingProveedores))
      console.log("[v0] Saved remaining proveedores to localStorage after individual delete:", remainingProveedores.length)
    }
    
    // Also call the hook's delete function to update state
    deleteProveedor(idToDelete)
    
    setProveedorToDelete(null)
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 3000)
  }

  const handleCancelDelete = () => {
    setProveedorToDelete(null)
  }

  const handleBatchDeleteClick = () => {
    setShowBatchDeleteModal(true)
  }

  const handleConfirmBatchDelete = () => {
    const selectedProveedores = proveedores.filter((_, index) => proveedorSelected[index])
    const idsToDelete = selectedProveedores.map((p) => p.id)

    console.log("[v0] Batch delete starting, selected proveedores:", selectedProveedores.length)
    console.log("[v0] IDs to delete:", idsToDelete)

    // Manually filter and save to localStorage FIRST to ensure persistence
    const remainingProveedores = proveedores.filter((p) => !idsToDelete.includes(p.id))
    console.log("[v0] After filtering, remaining proveedores:", remainingProveedores.length)
    
    if (typeof window !== "undefined") {
      const storageKey = `stockio-proveedores-${currentAccount}`
      localStorage.setItem(storageKey, JSON.stringify(remainingProveedores))
      console.log("[v0] Saved remaining proveedores to localStorage after batch delete:", remainingProveedores.length)
    }

    // Call the hook's delete function for each to trigger state updates
    idsToDelete.forEach((id) => deleteProveedor(id))

    // Reset selections
    setProveedorSelected([])
    setSelectAllActive(false)
    setShowBatchDeleteModal(false)
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 3000)
  }

  const handleCancelBatchDelete = () => {
    setShowBatchDeleteModal(false)
  }

  const handleCancel = () => {
    // Implement handleCancel logic here
    setHasUnsavedChanges(false) // Update hasUnsavedChanges
  }

  const handleSave = () => {
    // Implement handleSave logic here
    setHasUnsavedChanges(false) // Update hasUnsavedChanges
  }

  const hasSelectedProveedores = proveedorSelected.some((s) => s)

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

              <div className="flex items-center gap-2 min-w-[200px] justify-end">
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Cambios Guardados</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 flex flex-col overflow-auto">
              <div className="px-8 pb-8 pt-4">
                <div className="rounded-xl border border-[rgba(228,230,235,0.5)] bg-transparent shadow-none border-none">
                  <ProveedoresGrid
                    proveedores={proveedores}
                    onAddProveedor={addProveedor}
                    onUpdateProveedor={updateProveedor}
                    onDeleteProveedor={handleDeleteProveedor}
                    gridSize={gridSize}
                    gridSizeDropdownOpen={gridSizeDropdownOpen}
                    setGridSizeDropdownOpen={setGridSizeDropdownOpen}
                    setGridSize={setGridSize}
                    onOpenNuevoProveedor={() => setShowNuevoProveedorModal(true)}
                    proveedorSelected={proveedorSelected}
                    handleProveedorButtonClick={handleProveedorButtonClick}
                    selectAllActive={selectAllActive}
                    handleSelectAllClick={handleSelectAllClick}
                    hasSelectedProveedores={hasSelectedProveedores}
                    onBatchDelete={handleBatchDeleteClick}
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
        onSave={handleSaveProveedor} // Updated handleAddProveedor to handleSaveProveedor
      />

      {/* Delete Confirmation Modal */}
      {proveedorToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={handleCancelDelete}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¿Seguro deseas eliminar el proveedor?
            </h3>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={handleCancelBatchDelete}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¿Seguro deseas eliminar los proveedores seleccionados?
            </h3>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={handleCancelBatchDelete}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
              >
                Aceptar
              </button>
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
