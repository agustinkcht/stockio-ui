'use client';

interface UnsavedChangesModalProps {
  isOpen: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesModal({ isOpen, onSave, onDiscard, onCancel }: UnsavedChangesModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Guardá los cambios antes de continuar
        </h3>
        <div className="flex items-center gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
          >
            Deshacer
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors cursor-pointer"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
