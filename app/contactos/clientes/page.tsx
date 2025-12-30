"use client"

import { useState, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { UserPanel } from "@/components/layout/user-panel"
import { useClientes } from "@/hooks/use-clientes"
import type { Cliente } from "@/lib/data/clientes"
import { Undo2, Redo2, X, Check } from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { NuevoClienteModal } from "@/components/modals/nuevo-cliente-modal"
import { ClientesGrid } from "@/components/clientes/clientes-grid"

function ClientesContent() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { clientes, addCliente, updateCliente, deleteCliente, isLoading } = useClientes()
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)

  // Grid state
  const [gridSize, setGridSize] = useState("md")
  const [gridSizeDropdownOpen, setGridSizeDropdownOpen] = useState(false)
  const [clienteSelected, setClienteSelected] = useState<boolean[]>(new Array(clientes.length).fill(false))
  const [selectAllActive, setSelectAllActive] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<{ id: string; cliente: Cliente } | null>(null)

  const breadcrumbs = [{ label: "Contactos" }, { label: "Clientes", href: "/contactos/clientes" }]

  const handleClienteButtonClick = (index: number) => {
    const newSelected = [...clienteSelected]
    newSelected[index] = !newSelected[index]
    setClienteSelected(newSelected)

    // Update selectAllActive based on selection state
    const allSelected = newSelected.every((s) => s)
    const noneSelected = newSelected.every((s) => !s)
    setSelectAllActive(allSelected && !noneSelected)
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
    const clienteToDelete = clientes.find((c) => c.id === id)
    if (clienteToDelete) {
      setPendingDelete({ id, cliente: clienteToDelete })
    }
  }

  const handleUndo = () => {
    setPendingDelete(null)
  }

  const handleSave = () => {
    if (pendingDelete) {
      deleteCliente(pendingDelete.id)
      setPendingDelete(null)
    }
  }

  const handleCancel = () => {
    setPendingDelete(null)
  }

  const hasUnsavedChanges = pendingDelete !== null
  const canUndo = hasUnsavedChanges

  const displayedClientes = pendingDelete ? clientes.filter((c) => c.id !== pendingDelete.id) : clientes

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
                  <ClientesGrid
                    clientes={displayedClientes}
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
        onSave={handleSaveCliente}
      />
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
