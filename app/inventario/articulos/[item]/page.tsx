"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Undo2, Redo2, X, Check } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { ItemDetailPanel } from "@/components/items/item-detail-panel"
import { UserPanel } from "@/components/layout/user-panel"
import { useItems } from "@/hooks/use-items"
import { useNavigation } from "@/hooks/use-navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemParam = params.item as string

  const [isSaving, setIsSaving] = useState(false)
  const [selectedDetailTab, setSelectedDetailTab] = useState<"info" | "stock" | "precios" | "canales">("info")
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  const {
    items,
    updateStock,
    updateItem,
    deleteItem,
    undoDelete,
    saveDelete,
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

  useEffect(() => {
    if (!selectedItem && items.length > 0) {
      console.log("[v0] Item not found, redirecting. itemParam:", itemParam)
      router.push("/inventario/articulos")
    }
  }, [selectedItem, items, router, itemParam])

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const breadcrumbs = selectedItem
    ? [{ label: "Inventario" }, { label: "Artículos", href: "/inventario/articulos" }, { label: selectedItem.name }]
    : [{ label: "Inventario" }, { label: "Artículos", href: "/inventario/articulos" }]

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
    try {
      if (hasUnsavedEdits) {
        saveEdit()
      }
      if (hasUnsavedDeletes) {
        await saveDelete()
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWithTracking = (item: Item) => {
    deleteItem(item)
    router.push("/inventario/articulos")
  }

  const handleNavigateBack = () => {
    navigateBack()
  }

  const handleNavigateForward = () => {
    navigateForward()
  }

  const handleClose = () => {
    router.push("/inventario/articulos")
  }

  const handleFieldChange = (itemSku: string, field: string, value: any) => {
    editField(itemSku, field, value)
  }

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
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-muted/50 mr-1.5">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
                    title="Deshacer último cambio"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="p-1.5 hover:bg-muted rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
                    title="Rehacer último cambio"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-5 w-px bg-border/60" />

                <button
                  onClick={handleDeshacer}
                  disabled={!hasChanges}
                  className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-foreground px-7"
                  title="Deshacer cambios"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  onClick={handleGuardar}
                  disabled={!hasChanges}
                  className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary px-7"
                  title="Guardar cambios"
                >
                  <Check className="w-4 h-4" />
                </button>
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
    </div>
  )
}
