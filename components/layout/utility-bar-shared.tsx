"use client"

import { User, Undo2, Redo2, X, Check } from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"

interface UtilityBarProps {
  breadcrumbs: Array<{ label: string; href?: string }>
  onUndo?: () => void
  onRedo?: () => void
  onDeshacer?: () => void
  onGuardar?: () => void
  canUndo?: boolean
  canRedo?: boolean
  hasUnsavedChanges?: boolean
}

export function UtilityBarShared({
  breadcrumbs,
  onUndo,
  onRedo,
  onDeshacer,
  onGuardar,
  canUndo = false,
  canRedo = false,
  hasUnsavedChanges = false,
}: UtilityBarProps) {
  return (
    <div className="relative border-b border-border h-[44px] bg-white flex-shrink-0">
      <div className="px-4 flex items-center justify-between h-full">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Center: User Info Panel - Blur & Transparent */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-[-2px]">
          <div className="flex items-center gap-3 px-4 bg-background/60 backdrop-blur-md border border-border/50 rounded-lg py-1 shadow-md">
            <div className="p-1.5 bg-muted/80 rounded-md">
              <User className="w-4 h-4 text-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">In Vino Veritás</span>
          </div>
        </div>

        {/* Right: Utility Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-muted/50 mr-1.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
              title="Deshacer último cambio"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
              title="Rehacer último cambio"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-border/60" />

          <button
            onClick={onDeshacer}
            disabled={!hasUnsavedChanges}
            className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
            title="Deshacer cambios"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={onGuardar}
            disabled={!hasUnsavedChanges}
            className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary px-7"
            title="Guardar cambios"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
