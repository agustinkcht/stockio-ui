"use client"
import { Minus, X } from "lucide-react"
import { LoadingBar } from "@/components/ui/loading-bar"
import { useEffect, useRef } from "react"

interface NuevoItemConVariantesModalProps {
  showNuevoItemConVariantesModal: boolean
  isNuevoItemConVariantesMinimized: boolean
  handleMinimizeNuevoItemConVariantes: () => void
  handleCloseNuevoItemConVariantes: () => void
  setIsNuevoItemConVariantesMinimized: (value: boolean) => void
  setActiveNavTab: (tab: string) => void
  activeNavTab: string
  itemTitulo: string
  setItemTitulo: (value: string) => void
  itemTemplate: string
  setItemTemplate: (value: string) => void
  handleCreateNuevoItemConVariantes: (itemTitulo: string, itemTemplate: string, handleClose: () => void) => void
  isCreatingItem?: boolean
}

export function NuevoItemConVariantesModal({
  showNuevoItemConVariantesModal,
  isNuevoItemConVariantesMinimized,
  handleMinimizeNuevoItemConVariantes,
  handleCloseNuevoItemConVariantes,
  setIsNuevoItemConVariantesMinimized,
  setActiveNavTab,
  activeNavTab,
  itemTitulo,
  setItemTitulo,
  itemTemplate,
  setItemTemplate,
  handleCreateNuevoItemConVariantes: handleCreate,
  isCreatingItem = false,
}: NuevoItemConVariantesModalProps) {
  const tituloInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showNuevoItemConVariantesModal && !isNuevoItemConVariantesMinimized) {
      setTimeout(() => {
        tituloInputRef.current?.focus()
      }, 100)
    }
  }, [showNuevoItemConVariantesModal, isNuevoItemConVariantesMinimized])

  if (!showNuevoItemConVariantesModal) return null

  if (isNuevoItemConVariantesMinimized) {
    return (
      <button
        onClick={() => {
          setIsNuevoItemConVariantesMinimized(false)
          setActiveNavTab("nuevo-item-variantes")
        }}
        className={`px-4 py-2 text-sm transition-colors border-r border-border ${
          activeNavTab === "nuevo-item-variantes"
            ? "bg-accent text-foreground"
            : "bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        Nuevo Item con Variantes
      </button>
    )
  }

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" style={{ marginLeft: "4rem" }} />

      {/* Modal Window */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ marginLeft: "4rem" }}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Nuevo Item con Variantes</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Crea un nuevo item contenedor con variantes en tu inventario
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMinimizeNuevoItemConVariantes}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseNuevoItemConVariantes}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isCreatingItem && (
            <div className="px-6 pt-2">
              <LoadingBar />
            </div>
          )}

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Título Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  Título
                  <span className="text-red-600">*</span>
                  <span className="text-xs text-gray-500 font-normal">Obligatorio</span>
                </label>
                <input
                  ref={tituloInputRef}
                  type="text"
                  value={itemTitulo}
                  onChange={(e) => setItemTitulo(e.target.value)}
                  placeholder="Ingresá el título del item contenedor"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => handleCreate(itemTitulo, itemTemplate, handleCloseNuevoItemConVariantes)}
              disabled={isCreatingItem || !itemTitulo.trim()}
              className="w-64 bg-blue-600 hover:bg-blue-700 text-white border-0 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreatingItem ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
