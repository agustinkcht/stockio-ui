"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronRight, Package, CheckCircle2 } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { ItemDetailPanel } from "@/components/items/item-detail-panel"
import { UserPanel } from "@/components/layout/user-panel"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { useItems } from "@/hooks/use-items"
import { useNavigation } from "@/hooks/use-navigation"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemParam = params.item as string

  const [isSaving, setIsSaving] = useState(false)
  const [selectedDetailTab, setSelectedDetailTab] = useState<"info" | "stock" | "precios" | "canales">("info")
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

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
  } = useItems()

  const { currentView, historyIndex, navigationHistory, navigateBack, navigateForward } = useNavigation()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const selectedItem =
    items.find((item) => item.sku === itemParam) ||
    items.flatMap((item) => item.variants || []).find((variant) => variant.sku === itemParam)

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
    router.push("/stock/stock")
  }

  const handleNavigateBack = () => {
    navigateBack()
  }

  const handleNavigateForward = () => {
    navigateForward()
  }

  const handleClose = () => {
    router.push("/stock/stock")
  }

  const handleFieldChange = (itemSku: string, field: string, value: any) => {
    editField(itemSku, field, value)
  }

  const hasUnsavedChanges = hasUnsavedEdits || hasUnsavedDeletes
  const { showNavigationModal, handleSaveAndNavigate, handleDiscardAndNavigate, handleCancelNavigation } =
    useNavigationGuard({
      hasUnsavedChanges,
      onSave: handleGuardar,
      onDiscard: handleDeshacer,
    })

  useEffect(() => {
    if (!selectedItem && items.length > 0) {
      console.log("[v0] Item not found, redirecting. itemParam:", itemParam)
      router.push("/stock/stock")
    }
  }, [selectedItem, items, router, itemParam])

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const breadcrumbs = selectedItem
    ? [{ label: "Stock" }, { label: "Stock", href: "/stock/stock" }, { label: selectedItem.name }]
    : [{ label: "Stock" }, { label: "Stock", href: "/stock/stock" }]

  if (!selectedItem) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const canUndo = canUndoEdit || hasUnsavedDeletes
  const canRedo = canRedoEdit
  const hasChanges = hasUnsavedEdits || hasUnsavedDeletes

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          <div className="relative h-[44px] bg-transparent">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
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

                {hasChanges && !showSaveSuccess && (
                  <>
                    <button
                      onClick={handleDeshacer}
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
                  </>
                )}
              </div>
            </div>
          </div>

          <main className="flex-1 bg-[rgba(250,251,253,1)] overflow-auto">
            <ItemDetailPanel
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
            />
          </main>
        </div>
      </div>

      <UnsavedChangesModal
        isOpen={showNavigationModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
      />
    </div>
  )
}
