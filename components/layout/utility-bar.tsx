"use client"

import { Undo2, Redo2, CheckCircle2, X, Check } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Breadcrumb } from "./breadcrumb"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface UtilityBarProps {
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
    <div
      className="border-b border-border px-8 flex flex-col fixed top-12 right-0 left-0 backdrop-blur-md z-40 transition-all duration-300 bg-[rgba(253,254,254,1)]"
      style={{ left: isExpanded ? "256px" : "64px", width: isExpanded ? "calc(100% - 256px)" : "calc(100% - 64px)" }}
    >
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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-success font-medium">Cambios guardados</span>
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

          {!isSaving && !showSaveSuccess && !showItemCreatedSuccess && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-navbar-accent/30 mr-1.5">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-1.5 hover:bg-navbar-accent rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-navbar-foreground hover:scale-105"
                  title="Deshacer último cambio"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-1.5 hover:bg-navbar-accent rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-navbar-foreground hover:scale-105 mr-0"
                  title="Rehacer último cambio"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-5 w-px bg-border/60" />

              <button
                onClick={onDeshacer}
                disabled={!hasUnsavedChanges}
                className="p-1.5 bg-primary/10 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-navbar-foreground hover:scale-105 px-7 ml-[-6px]"
                title="Deshacer cambios"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                onClick={onGuardar}
                disabled={!hasUnsavedChanges}
                className="p-1.5 bg-primary/10 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary hover:scale-105 px-7 ml-0 mr-px"
                title="Guardar cambios"
              >
                <Check className="w-4 h-4 ml-0 mr-0" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
