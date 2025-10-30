"use client"

import { ChevronRight, Undo2, Redo2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DynamicBarProps {
  // Breadcrumb props
  breadcrumbs?: string[]

  // URDG buttons props
  hasUnsavedChanges?: boolean
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onDeshacer?: () => void
  onGuardar?: () => void
}

export function DynamicBar({
  breadcrumbs = ["Artículos", "Todos los items"],
  hasUnsavedChanges = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onDeshacer,
  onGuardar,
}: DynamicBarProps) {
  return (
    <div
      className="border-b border-gray-800 px-8 flex items-center justify-between fixed top-12 right-0 left-0 bg-gray-950 z-20 h-[32px]"
      style={{ marginLeft: "4rem" }}
    >
      {/* Left 75% - Breadcrumbs */}
      <div className="flex items-center gap-2 flex-[3] text-sm text-gray-400">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className={index === breadcrumbs.length - 1 ? "text-white" : ""}>{crumb}</span>
            {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4" />}
          </div>
        ))}
      </div>

      {/* Right 25% - URDG Buttons (only show when there are unsaved changes) */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Undo/Redo icons */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Deshacer último cambio"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Rehacer último cambio"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-gray-700 mx-1" />

          {/* Deshacer/Guardar buttons */}
          <Button variant="ghost" size="sm" onClick={onDeshacer} className="h-6 px-3 text-xs hover:bg-gray-800">
            Deshacer
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onGuardar}
            className="h-6 px-3 text-xs bg-blue-600 hover:bg-blue-700"
          >
            Guardar
          </Button>
        </div>
      )}
    </div>
  )
}
