"use client"

import { Undo2, Redo2, X, Check, CheckCircle2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"

interface UtilityBarProps {
  breadcrumbs: Array<{ label: string; href?: string }>
  onDeshacer?: () => void
  onGuardar?: () => void
  hasUnsavedChanges?: boolean
  canUndo?: boolean
  canRedo?: boolean
  isSaving?: boolean
}

export function UtilityBarShared({
  breadcrumbs,
  onDeshacer,
  onGuardar,
  hasUnsavedChanges = false,
  canUndo = false,
  canRedo = false,
  isSaving = false,
}: UtilityBarProps) {
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const prevIsSavingRef = useRef(false)

  useEffect(() => {
    if (hasUnsavedChanges) {
      setShowSaveSuccess(false)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      setShowSaveSuccess(true)
      prevIsSavingRef.current = false
      const timer = setTimeout(() => {
        setShowSaveSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    prevIsSavingRef.current = isSaving
  }, [isSaving])

  const handleGuardar = async () => {
    if (onGuardar) {
      await onGuardar()
    }
  }

  return (
    <div className="relative border-b border-border h-[44px] bg-white flex-shrink-0">
      <div className="px-4 flex items-center justify-between h-full">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Right: Utility Buttons + UserPanel */}
        <div className="flex items-center gap-2 justify-end">
          {showSaveSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Cambios Guardados</span>
            </div>
          )}

          {hasUnsavedChanges && !showSaveSuccess && (
            <>
              <button
                onClick={onDeshacer}
                className="px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all cursor-pointer text-red-700 text-sm font-medium"
                title="Deshacer cambios"
              >
                Deshacer
              </button>

              <button
                onClick={handleGuardar}
                className="px-4 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-all cursor-pointer text-green-700 text-sm font-medium"
                title="Guardar cambios"
              >
                Guardar
              </button>

              <div className="h-5 w-px bg-border/60" />

              <button
                onClick={onDeshacer}
                className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all cursor-pointer text-red-700 px-7"
                title="Deshacer cambios"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                onClick={handleGuardar}
                className="p-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-all cursor-pointer text-green-700 px-7"
                title="Guardar cambios"
              >
                <Check className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-border/60" />
            </>
          )}
          <UserPanel />
        </div>
      </div>
    </div>
  )
}
