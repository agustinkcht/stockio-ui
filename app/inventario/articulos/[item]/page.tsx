"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { UtilityBar } from "@/components/layout/utility-bar"
import { ItemDetailPanel } from "@/components/items/item-detail-panel"
import { useItems } from "@/hooks/use-items"
import { useNavigation } from "@/hooks/use-navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { useChangeTracker } from "@/hooks/use-change-tracker"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemParam = params.item as string

  const [isSaving, setIsSaving] = useState(false)
  const [selectedDetailTab, setSelectedDetailTab] = useState<"info" | "stock" | "precios" | "canales">("info")
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  const { items, depositStock, updateDepositStock, updateItem, deleteItem, undoDelete, saveDelete, hasUnsavedDeletes } =
    useItems()

  const { currentView, historyIndex, navigationHistory, navigateBack, navigateForward } = useNavigation()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()

  const changeTracker = useChangeTracker()

  const selectedItem = items.find((item) => item.sku === itemParam)

  useEffect(() => {
    if (!selectedItem && items.length > 0) {
      router.push("/inventario/articulos")
    }
  }, [selectedItem, items, router])

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
    const change = changeTracker.undo()
    if (change?.type === "delete") {
      undoDelete()
    }
  }

  const handleRedo = () => {
    const change = changeTracker.redo()
    if (change?.type === "delete") {
      deleteItem(change.data)
    }
  }

  const handleDeshacer = () => {
    changeTracker.undoAll()
    if (hasUnsavedDeletes) {
      undoDelete()
    }
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    try {
      const changes = changeTracker.saveAll()
      if (hasUnsavedDeletes) {
        await saveDelete()
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWithTracking = (item: Item) => {
    const originalIndex = items.findIndex((i) => i.sku === item.sku)
    changeTracker.trackChange("delete", item, { originalIndex })
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

  if (!selectedItem) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <TopNav
        currentView={currentView}
        navigationHistory={navigationHistory}
        historyIndex={historyIndex}
        minimizedTabs={[]}
        activeNavTab="main"
        onNavigateBack={handleNavigateBack}
        onNavigateForward={handleNavigateForward}
        onRestoreTab={() => {}}
        onCloseTab={() => {}}
        isExpanded={false}
      />

      <div className="pt-[calc(2.5rem+6px)] px-[6px] pb-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative h-[calc(100vh-2.5rem-12px)] sticky top-[calc(2.5rem+6px)] z-[100003]"
        >
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-2.5rem-12px)] overflow-hidden relative z-10">
          <UtilityBar
            breadcrumbs={breadcrumbs}
            hasUnsavedChanges={changeTracker.hasUnsavedChanges || hasUnsavedDeletes}
            canUndo={changeTracker.canUndo}
            canRedo={changeTracker.canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDeshacer={handleDeshacer}
            onGuardar={handleGuardar}
            isSaving={isSaving}
            itemCreated={false}
            isExpanded={false}
          />

          <main className="flex-1 bg-[rgba(250,251,253,1)] overflow-auto">
            <ItemDetailPanel
              selectedItem={selectedItem}
              selectedDetailTab={selectedDetailTab}
              setSelectedDetailTab={setSelectedDetailTab}
              expandedItems={expandedItems}
              toggleVariantExpansion={toggleVariantExpansion}
              depositStock={depositStock}
              updateDepositStock={updateDepositStock}
              updateItem={updateItem}
              allItems={items}
              item={selectedItem}
              onClose={handleClose}
              onFieldChange={(itemId, field, value) => updateItem(itemId, { [field]: value })}
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
