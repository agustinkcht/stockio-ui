"use client"

import { useState, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { useClientes } from "@/hooks/use-clientes"
import type { Cliente } from "@/lib/data/clientes"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { NuevoClienteModal } from "@/components/modals/nuevo-cliente-modal"
import { ClientesGrid } from "@/components/clientes/clientes-grid"
import { CheckCircle2, Users, Plus, Search, X, Check } from "lucide-react"
import { useAccount } from "@/lib/contexts/account-context"

function ClientesContent() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { currentAccount } = useAccount()
  const { clientes, addCliente, updateCliente, deleteCliente, isLoading } = useClientes()
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)

  // Grid state
  const [gridSize, setGridSize] = useState("md")
  const [gridSizeDropdownOpen, setGridSizeDropdownOpen] = useState(false)
  const [clienteSelected, setClienteSelected] = useState<boolean[]>([])
  const [selectAllActive, setSelectAllActive] = useState(false)

  const breadcrumbs = [{ label: "Contactos" }, { label: "Clientes", href: "/contactos/clientes" }]

  const handleClienteButtonClick = (index: number) => {
    setClienteSelected((prev) => {
      const newSelected = [...prev]
      // Ensure array is large enough
      while (newSelected.length < clientes.length) {
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
    setClienteSelected(new Array(clientes.length).fill(newState))
  }

  const handleSaveCliente = (clienteData: Omit<Cliente, "id">) => {
    const newCliente: Cliente = {
      ...clienteData,
      id: `CLI-${String(clientes.length + 1).padStart(3, "0")}`,
      transactionCount: 0,
    }
    addCliente(newCliente)
    setShowNuevoClienteModal(false)
  }

  const handleDeleteCliente = (id: string) => {
    const cliente = clientes.find((c) => c.id === id)
    if (cliente) {
      setClienteToDelete(cliente)
    }
  }

  const handleCancelDelete = () => {
    setClienteToDelete(null)
  }

  const handleConfirmDelete = () => {
    if (!clienteToDelete) return

    console.log("[v0] Individual delete starting for:", clienteToDelete.id)
    
    // Manually filter and save to localStorage to ensure persistence and immediate UI update
    const idToDelete = clienteToDelete.id
    const remainingClientes = clientes.filter((c) => c.id !== idToDelete)
    
    if (typeof window !== "undefined") {
      const storageKey = `stockio-clientes-${currentAccount}`
      localStorage.setItem(storageKey, JSON.stringify(remainingClientes))
      console.log("[v0] Saved remaining clientes to localStorage after individual delete:", remainingClientes.length)
    }
    
    // Also call the hook's delete function to update state
    deleteCliente(idToDelete)
    
    setClienteToDelete(null)
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 3000)
  }

  const hasSelectedClientes = clienteSelected.some((s) => s)

  const handleBatchDeleteClick = () => {
    setShowBatchDeleteModal(true)
  }

  const handleAddCliente = (clienteData: Omit<Cliente, "id">) => {
    const newCliente: Cliente = {
      ...clienteData,
      id: `CLI-${String(clientes.length + 1).padStart(3, "0")}`,
      transactionCount: 0,
    }
    addCliente(newCliente)
    setShowNuevoClienteModal(false)
  }

  const handleCancelBatchDelete = () => {
    setShowBatchDeleteModal(false)
  }

  const handleConfirmBatchDelete = () => {
    const selectedClientes = clientes.filter((_, index) => clienteSelected[index])
    const idsToDelete = selectedClientes.map((c) => c.id)

    console.log("[v0] Batch delete starting, selected clientes:", selectedClientes.length)
    console.log("[v0] IDs to delete:", idsToDelete)

    // Manually filter and save to localStorage FIRST to ensure persistence
    const remainingClientes = clientes.filter((c) => !idsToDelete.includes(c.id))
    console.log("[v0] After filtering, remaining clientes:", remainingClientes.length)
    
    if (typeof window !== "undefined") {
      const storageKey = `stockio-clientes-${currentAccount}`
      localStorage.setItem(storageKey, JSON.stringify(remainingClientes))
      console.log("[v0] Saved remaining clientes to localStorage after batch delete:", remainingClientes.length)
    }

    // Call the hook's delete function for each to trigger state updates
    idsToDelete.forEach((id) => deleteCliente(id))

    // Reset selections
    setClienteSelected([])
    setSelectAllActive(false)
    setShowBatchDeleteModal(false)
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 3000)
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
                  <ClientesGrid
                    clientes={clientes}
                    gridSize={gridSize}
                    clienteSelected={clienteSelected}
                    handleClienteButtonClick={handleClienteButtonClick}
                    selectAllActive={selectAllActive}
                    handleSelectAllClick={handleSelectAllClick}
                    gridSizeDropdownOpen={gridSizeDropdownOpen}
                    setGridSizeDropdownOpen={setGridSizeDropdownOpen}
                    setGridSize={setGridSize}
                    onOpenNuevoCliente={() => setShowNuevoClienteModal(true)}
                    onDeleteCliente={handleDeleteCliente}
                    onUpdateCliente={updateCliente}
                    hasSelectedClientes={hasSelectedClientes}
                    onBatchDelete={handleBatchDeleteClick}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Nuevo Cliente Modal */}
      <NuevoClienteModal
        isOpen={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        onSave={handleAddCliente}
      />

      {/* Delete Confirmation Modal */}
      {clienteToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={handleCancelDelete}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¿Seguro deseas eliminar el cliente?
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
              ¿Seguro deseas eliminar los clientes seleccionados?
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

export default function ClientesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando...</div>}>
      <ClientesContent />
    </Suspense>
  )
}
