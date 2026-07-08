"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import { ChevronRight, Package, CheckCircle2 } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CatalogoItemDetailPanel } from "@/components/items/catalogo-item-detail-panel"
import { UserPanel } from "@/components/layout/user-panel"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { useItems } from "@/hooks/use-items"
import { useNavigation } from "@/hooks/use-navigation"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function CatalogoItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemParam = params.id as string

  const [isSaving, setIsSaving] = useState(false)
  const [selectedDetailTab, setSelectedDetailTab] = useState<"info" | "stock" | "precios" | "canales">("info")
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [toastLabel, setToastLabel] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((label: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastLabel(label)
    toastTimerRef.current = setTimeout(() => setToastLabel(null), 3000)
  }, [])

  const {
    items,
    updateStock,
    updateItem,
    deleteItem,
    undoDelete,
    saveDelete: saveDeletedItems,
    hasUnsavedDeletes,
    editField,
    undoEdit,
    redoEdit,
    saveEdit,
    cancelEdit,
    hasUnsavedEdits,
    canUndoEdit,
    canRedoEdit,
    forceSaveItems,
  } = useItems()

  const { currentView, historyIndex, navigationHistory, navigateBack, navigateForward } = useNavigation()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const selectedItem =
    items.find((item) => item.id === itemParam) ||
    items.flatMap((item) => item.variants || []).find((variant) => variant.id === itemParam)

  const handleUndo = () => {
    if (canUndoEdit) {
      undoEdit()
    } else if (hasUnsavedDeletes) {
      undoDelete()
    }
  }

  const handleRedo = () => {
    if (canRedoEdit) {
      redoEdit()
    }
  }

  const handleDeshacer = () => {
    if (hasUnsavedEdits) {
      cancelEdit()
    }
    if (hasUnsavedDeletes) {
      undoDelete()
    }
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    setShowSaveSuccess(false)
    try {
      if (hasUnsavedEdits) {
        await sleep(800)
        saveEdit()
      }
      if (hasUnsavedDeletes) {
        await sleep(800)
        await saveDeletedItems()
      }
      
      setShowSaveSuccess(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error("[v0] Error saving changes:", error)
    } finally {
      setIsSaving(false)
      setShowSaveSuccess(false)
    }
  }

  const handleDeleteWithTracking = (item: Item) => {
    deleteItem(item)
    const label = item.hasVariants || item.isAgrupador ? "agrupador" : "item"
    router.push(`/catalogo/items?deleted=${encodeURIComponent(item.name)}&tipo=${label}`)
  }

  const hasUnsavedChanges = hasUnsavedEdits || hasUnsavedDeletes
  const { showNavigationModal, handleSaveAndNavigate, handleDiscardAndNavigate, handleCancelNavigation } =
    useNavigationGuard({
      hasUnsavedChanges,
      onSave: handleGuardar,
      onDiscard: handleDeshacer,
    })

  // Guarded navigation — shows modal if there are unsaved changes, otherwise navigates directly
  const guardedNavigate = (href: string) => {
    if (hasUnsavedChanges) {
      router.push(href) // router.push is intercepted by useNavigationGuard when hasUnsavedChanges is true
    } else {
      router.push(href)
    }
  }

  const handleNavigateBack = () => {
    if (hasUnsavedChanges) {
      // Use the guarded router.push which is already intercepted
      const prev = navigationHistory[historyIndex - 1]
      if (prev?.item) {
        router.push(`/catalogo/items/${prev.item.id || prev.item.sku}`)
      } else if (historyIndex > 0) {
        router.push("/catalogo/items")
      }
    } else {
      navigateBack()
    }
  }

  const handleNavigateForward = () => {
    if (hasUnsavedChanges) {
      const next = navigationHistory[historyIndex + 1]
      if (next?.item) {
        router.push(`/catalogo/items/${next.item.id || next.item.sku}`)
      } else {
        router.push("/catalogo/items")
      }
    } else {
      navigateForward()
    }
  }

  const handleClose = () => {
    router.push("/catalogo/items")
  }

  const handleFieldChange = (itemSku: string, field: string, value: any) => {
    editField(itemSku, field, value)
  }

  useEffect(() => {
    if (!selectedItem && items.length > 0) {
      router.push("/catalogo/items")
    }
  }, [selectedItem, items, router, itemParam])

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const breadcrumbs = selectedItem
    ? [{ label: "Catálogo" }, { label: "Items", href: "/catalogo/items" }, { label: selectedItem.name }]
    : [{ label: "Catálogo" }, { label: "Items", href: "/catalogo/items" }]

  if (!selectedItem) {
    // While redirecting to a static sub-route or waiting for items, show nothing.
    return <div className="min-h-screen bg-[rgb(243,242,238)]" />
  }

  const canUndo = canUndoEdit || hasUnsavedDeletes
  const canRedo = canRedoEdit
  const hasChanges = hasUnsavedEdits || hasUnsavedDeletes

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="flex h-screen" onClick={handleCloseDropdowns}>
        <div onClick={(e) => e.stopPropagation()} className="relative h-screen sticky top-0 z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white h-screen overflow-hidden relative z-10">
          <div className="relative h-[44px] bg-white">
            <div className="px-8 h-full flex items-center justify-between">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} onNavigate={guardedNavigate} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2 min-w-[200px] justify-end">
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Cambios Guardados</span>
                  </div>
                )}
              <UserPanel />
            </div>
          </div>

          <main className="flex-1 bg-[rgba(250,251,253,1)] overflow-auto">
            <CatalogoItemDetailPanel
              selectedItem={selectedItem}
              selectedDetailTab={selectedDetailTab}
              setSelectedDetailTab={setSelectedDetailTab}
              expandedItems={expandedItems}
              toggleVariantExpansion={toggleVariantExpansion}
              updateStock={updateStock}
              updateItem={updateItem}
              allItems={items}
              item={selectedItem}
              onClose={handleClose}
              onFieldChange={handleFieldChange}
              isSaving={isSaving}
              onDuplicate={(item) => console.log("Duplicate", item)}
              onDelete={handleDeleteWithTracking}
              variantChangeHandlers={{}}
              isExpanded={false}
              onSaveNow={forceSaveItems}
              onShowToast={showToast}
            />
          </main>
        </div>
      </div>

      {/* Cambios guardados floating toast */}
      {toastLabel && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className="relative flex items-stretch rounded-2xl overflow-hidden"
            style={{ background: "#0d0f12", boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)", minWidth: "280px" }}
          >
            <div className="w-[3px] shrink-0" style={{ background: "linear-gradient(to bottom, #34d399, #059669)" }} />
            <div className="flex items-center gap-3.5 px-5 py-4">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: "#34d399" }} strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-tight" style={{ color: "#f1f5f9", letterSpacing: "-0.01em" }}>Cambios guardados</p>
                <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(148,163,184,0.7)" }}>{toastLabel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        isOpen={showNavigationModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
      />
    </div>
  )
}
