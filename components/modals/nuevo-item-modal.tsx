"use client"
import { Minus, X } from "lucide-react"
import { TEMPLATES } from "@/lib/constants"
import { LoadingBar } from "@/components/ui/loading-bar"
import { useEffect, useRef } from "react"

interface NuevoItemModalProps {
  showNuevoItemModal: boolean
  isNuevoItemMinimized: boolean
  handleMinimizeNuevoItem: () => void
  handleCloseNuevoItem: () => void
  itemTitulo: string
  setItemTitulo: (value: string) => void
  itemTemplate: string
  setItemTemplate: (value: string) => void
  itemUbicacion: string
  setItemUbicacion: (value: string) => void
  handleCreateNuevoItem: (itemTitulo: string, itemTemplate: string, handleClose: () => void) => void
  isCreatingItem?: boolean
}

export function NuevoItemModal({
  showNuevoItemModal,
  isNuevoItemMinimized,
  handleMinimizeNuevoItem,
  handleCloseNuevoItem,
  itemTitulo,
  setItemTitulo,
  itemTemplate,
  setItemTemplate,
  itemUbicacion,
  setItemUbicacion,
  handleCreateNuevoItem: handleCreate,
  isCreatingItem = false,
}: NuevoItemModalProps) {
  const tituloInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showNuevoItemModal && !isNuevoItemMinimized) {
      setTimeout(() => {
        tituloInputRef.current?.focus()
      }, 100)
    }
  }, [showNuevoItemModal, isNuevoItemMinimized])

  if (!showNuevoItemModal || isNuevoItemMinimized) return null

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" style={{ marginLeft: "4rem" }} />

      {/* Modal Window */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ marginLeft: "4rem" }}>
        <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
          {/* Title Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary rounded-t-lg">
            <h2 className="text-sm font-semibold text-foreground">Nuevo Item</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMinimizeNuevoItem}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseNuevoItem}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isCreatingItem && (
            <div className="px-4 pt-2">
              <LoadingBar />
            </div>
          )}

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Título Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  Título
                  <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground font-normal">Obligatorio</span>
                </label>
                <input
                  ref={tituloInputRef}
                  type="text"
                  value={itemTitulo}
                  onChange={(e) => setItemTitulo(e.target.value)}
                  placeholder="Ingresá el título del item"
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="border-t border-border my-4"></div>

              {/* Template Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Template</label>
                <p className="text-xs text-muted-foreground">
                  Usá un template para definir la estructura de información y atributos del nuevo item
                </p>
                <select
                  value={itemTemplate}
                  onChange={(e) => setItemTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                >
                  <option value="">Seleccioná un template</option>
                  {TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ubicación Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ubicación</label>
                <p className="text-xs text-muted-foreground">Ubicá el nuevo item dentro de un grupo</p>
                <select
                  value={itemUbicacion}
                  onChange={(e) => setItemUbicacion(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                >
                  <option key="empty" value="">
                    Seleccioná una ubicación
                  </option>
                  <option key="root" value="root">
                    Grilla de Artículos
                  </option>
                  <option key="folder1" value="folder1">
                    Carpeta 1
                  </option>
                  <option key="folder2" value="folder2">
                    Carpeta 2
                  </option>
                  <option key="subfolder1" value="subfolder1">
                    Subcarpeta 1
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center px-6 py-4 border-t border-border bg-secondary/50">
            <button
              onClick={() => handleCreate(itemTitulo, itemTemplate, handleCloseNuevoItem)}
              disabled={isCreatingItem || !itemTitulo.trim()}
              className="w-64 bg-primary hover:bg-primary/90 text-primary-foreground border-0 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreatingItem ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
