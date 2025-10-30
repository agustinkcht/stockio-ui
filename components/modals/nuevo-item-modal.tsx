"use client"
import { Minus, X } from "lucide-react"
import { TEMPLATES } from "@/lib/constants"

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
}: NuevoItemModalProps) {
  if (!showNuevoItemModal || isNuevoItemMinimized) return null

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" style={{ marginLeft: "4rem" }} />

      {/* Modal Window */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ marginLeft: "4rem" }}>
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
          {/* Title Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
            <h2 className="text-sm font-semibold text-white">Nuevo Item</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMinimizeNuevoItem}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseNuevoItem}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Título Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  Título
                  <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 font-normal">Obligatorio</span>
                </label>
                <input
                  type="text"
                  value={itemTitulo}
                  onChange={(e) => setItemTitulo(e.target.value)}
                  placeholder="Ingresá el título del item"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border-t border-gray-800 my-4"></div>

              {/* Template Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Template</label>
                <p className="text-xs text-gray-500">
                  Usá un template para definir la estructura de información y atributos del nuevo item
                </p>
                <select
                  value={itemTemplate}
                  onChange={(e) => setItemTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
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
                <label className="text-sm font-medium text-gray-300">Ubicación</label>
                <p className="text-xs text-gray-500">Ubicá el nuevo item dentro de un grupo</p>
                <select
                  value={itemUbicacion}
                  onChange={(e) => setItemUbicacion(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">Seleccioná una ubicación</option>
                  <option value="root">Grilla de Artículos</option>
                  <option value="folder1">Carpeta 1</option>
                  <option value="folder2">Carpeta 2</option>
                  <option value="subfolder1">Subcarpeta 1</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center px-6 py-4 border-t border-gray-700 bg-gray-800/50">
            <button
              onClick={() => handleCreate(itemTitulo, itemTemplate, handleCloseNuevoItem)}
              className="w-64 bg-blue-600 hover:bg-blue-700 text-white border-0 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
