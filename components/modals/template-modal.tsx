"use client"

import { TEMPLATES } from "@/lib/constants"

interface TemplateModalProps {
  showTemplateModal: boolean
  setShowTemplateModal: (value: boolean) => void
}

export function TemplateModal({ showTemplateModal, setShowTemplateModal }: TemplateModalProps) {
  if (!showTemplateModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold text-white mb-4">Seleccionar Template</h2>
        <div className="space-y-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-left hover:bg-gray-700 transition-colors"
            >
              <p className="text-sm font-medium text-white">{template.name}</p>
              <p className="text-xs text-gray-400 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowTemplateModal(false)}
          className="w-full mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
