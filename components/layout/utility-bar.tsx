"use client"

import { CheckCircle2, Undo2, Redo2, X, Check } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Breadcrumb } from "./breadcrumb"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface UtilityBarProps {
  hasUnsavedChanges?: boolean
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onDeshacer?: () => void
  onGuardar?: () => void
  isSaving?: boolean
  itemCreated?: boolean
  isExpanded?: boolean
  breadcrumbs?: string[] | BreadcrumbItem[]
}

export function UtilityBar({
  hasUnsavedChanges = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onDeshacer,
  onGuardar,
  isSaving = false,
  itemCreated = false,
  isExpanded = true,
  breadcrumbs,
}: UtilityBarProps) {
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showItemCreatedSuccess, setShowItemCreatedSuccess] = useState(false)
  const prevIsSavingRef = useRef(false)
  const prevItemCreatedRef = useRef(false)

  const breadcrumbItems: BreadcrumbItem[] | undefined = breadcrumbs
    ? breadcrumbs.map((item, index) => {
        if (typeof item === "string") {
          // Convert string array to proper breadcrumb format
          if (item === "Artículos" && index === 0) {
            return { label: "Inventario" }
          } else if (item === "Artículos") {
            return { label: "Artículos", href: "/" }
          } else if (item === "Todos los items") {
            return { label: "Artículos", href: "/" }
          } else if (item === "Detalle del item") {
            return { label: "Detalle del item" }
          } else if (item === "Depósitos") {
            return { label: "Depósitos", href: "/depositos" }
          }
          return { label: item }
        }
        return item
      })
    : undefined

  useEffect(() => {
    console.log("[v0] UtilityBar mounted and rendering", { isExpanded })
  }, [])

  useEffect(() => {
    if (hasUnsavedChanges) {
      setShowSaveSuccess(false)
      setShowItemCreatedSuccess(false)
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

  useEffect(() => {
    if (!prevItemCreatedRef.current && itemCreated) {
      setShowItemCreatedSuccess(true)
      prevItemCreatedRef.current = true

      const timer = setTimeout(() => {
        setShowItemCreatedSuccess(false)
        prevItemCreatedRef.current = false
      }, 3000)
      return () => clearTimeout(timer)
    }

    if (prevItemCreatedRef.current && !itemCreated) {
      prevItemCreatedRef.current = false
    }
  }, [itemCreated])

  return (
    <div className="border-b border-sidebar-border px-8 flex flex-col transition-all duration-300 bg-navbar">
      <div className="flex items-center justify-between h-[36px]">
        <div className="flex items-center">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end relative h-full min-w-[280px]">
          {isSaving && (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="w-full max-w-[240px] h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary animate-loading-bar bg-[length:200%_100%]" />
              </div>
            </div>
          )}

          {showSaveSuccess && !isSaving && (
            <div className="absolute inset-0 flex items-center justify-end pr-4 animate-fade-out">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">Cambios Guardados</span>
              </div>
            </div>
          )}

          {showItemCreatedSuccess && !isSaving && (
            <div className="absolute inset-0 flex items-center justify-end pr-4 animate-fade-out">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-success font-medium">Item creado</span>
              </div>
            </div>
          )}

          {!isSaving && !showSaveSuccess && !showItemCreatedSuccess && hasUnsavedChanges && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
              <button
                onClick={onDeshacer}
                className="px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all cursor-pointer text-red-700 text-sm font-medium"
                title="Deshacer cambios"
              >
                Deshacer
              </button>

              <button
                onClick={onGuardar}
                className="px-4 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-all cursor-pointer text-green-700 text-sm font-medium"
                title="Guardar cambios"
              >
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
