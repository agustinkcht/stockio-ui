"use client"

import { ChevronRight, Undo2, Redo2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"

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
  isSaving?: boolean
  itemCreated?: boolean
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
  isSaving = false,
  itemCreated = false,
}: DynamicBarProps) {
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showItemCreatedSuccess, setShowItemCreatedSuccess] = useState(false)
  const prevIsSavingRef = useRef(false)
  const prevItemCreatedRef = useRef(false)

  useEffect(() => {
    if (hasUnsavedChanges) {
      setShowSaveSuccess(false)
      setShowItemCreatedSuccess(false)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    console.log("[v0] DynamicBar - hasUnsavedChanges:", hasUnsavedChanges)
    console.log("[v0] DynamicBar - isSaving:", isSaving)
    console.log("[v0] DynamicBar - showSaveSuccess:", showSaveSuccess)
    console.log("[v0] DynamicBar - showItemCreatedSuccess:", showItemCreatedSuccess)
    console.log("[v0] DynamicBar - itemCreated:", itemCreated)
    console.log(
      "[v0] DynamicBar - shouldShowURDG:",
      hasUnsavedChanges || isSaving || showSaveSuccess || showItemCreatedSuccess,
    )
  }, [hasUnsavedChanges, isSaving, showSaveSuccess, showItemCreatedSuccess, itemCreated])

  useEffect(() => {
    console.log("[v0] DynamicBar - isSaving changed to:", isSaving, "prevIsSaving:", prevIsSavingRef.current)
    if (prevIsSavingRef.current && !isSaving) {
      console.log("[v0] DynamicBar - Triggering save success message")
      setShowSaveSuccess(true)
      prevIsSavingRef.current = false
      const timer = setTimeout(() => {
        console.log("[v0] DynamicBar - Hiding save success message")
        setShowSaveSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    prevIsSavingRef.current = isSaving
  }, [isSaving])

  useEffect(() => {
    console.log(
      "[v0] DynamicBar - itemCreated changed to:",
      itemCreated,
      "prevItemCreated:",
      prevItemCreatedRef.current,
    )
    if (!prevItemCreatedRef.current && itemCreated) {
      console.log("[v0] DynamicBar - Triggering item created success message")
      setShowItemCreatedSuccess(true)
      prevItemCreatedRef.current = true

      const timer = setTimeout(() => {
        console.log("[v0] DynamicBar - Hiding item created success message")
        setShowItemCreatedSuccess(false)
        prevItemCreatedRef.current = false
      }, 3000)
      return () => clearTimeout(timer)
    }

    if (prevItemCreatedRef.current && !itemCreated) {
      console.log("[v0] DynamicBar - Resetting prevItemCreatedRef")
      prevItemCreatedRef.current = false
    }
  }, [itemCreated])

  const shouldShowURDG = hasUnsavedChanges || isSaving || showSaveSuccess || showItemCreatedSuccess

  return (
    <div
      className="border-b border-gray-800 px-8 flex flex-col fixed top-12 right-0 left-0 bg-gray-950 z-20"
      style={{ marginLeft: "4rem" }}
    >
      <div className="flex items-center justify-between h-[32px]">
        {/* Left 75% - Breadcrumbs */}
        <div className="flex items-center gap-2 flex-[3] text-sm text-gray-400">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className={index === breadcrumbs.length - 1 ? "text-white" : ""}>{crumb}</span>
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4" />}
            </div>
          ))}
        </div>

        {/* Right 25% - URDG Buttons (show when there are unsaved changes, saving, or showing success) */}
        {shouldShowURDG && (
          <div className="flex items-center gap-2 flex-1 justify-end relative h-full">
            {isSaving && (
              <div className="absolute inset-0 flex items-center justify-center px-2">
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 animate-loading-bar bg-[length:200%_100%]" />
                </div>
              </div>
            )}

            {showSaveSuccess && !isSaving && (
              <div className="absolute inset-0 flex items-center justify-end animate-fade-out">
                <div className="flex items-center gap-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  <span className="text-sm text-emerald-400 font-medium">Cambios guardados</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            )}

            {showItemCreatedSuccess && !isSaving && (
              <div className="absolute inset-0 flex items-center justify-end animate-fade-out">
                <div className="flex items-center gap-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  <span className="text-sm text-emerald-400 font-medium">Item creado</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            )}

            {!isSaving && !showSaveSuccess && !showItemCreatedSuccess && (
              <>
                {/* Undo/Redo icons */}
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Deshacer último cambio"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Rehacer último cambio"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="h-4 w-px bg-gray-700 mx-1" />

                {/* Deshacer/Guardar buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeshacer}
                  className="h-6 px-3 text-xs hover:bg-gray-800 cursor-pointer"
                >
                  Deshacer
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={onGuardar}
                  className="h-6 px-3 text-xs bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  Guardar
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
