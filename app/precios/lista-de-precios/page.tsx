"use client"
import { useState } from "react"
import { Undo2, Redo2, X, Check } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { PriceGrid } from "@/components/prices/price-grid"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { UserPanel } from "@/components/layout/user-panel"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useModals } from "@/hooks/use-modals"
import { useSidebar } from "@/hooks/use-sidebar"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import type { Item } from "@/lib/types"

export default function ListaDePreciosPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [itemCreated, setItemCreated] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  const {
    items,
    depositStock,
    updateDepositStock,
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    updateItem,
    deleteItem,
    undoDelete,
    saveDelete,
    hasUnsavedDeletes,
    deletedItems,
    isCreatingItem,
    // Change tracking functions
    editField,
    editVariantField,
    undoEdit,
    redoEdit,
    saveEdit,
    cancelEdit,
    hasUnsavedEdits,
    canUndoEdit,
    canRedoEdit,
  } = useItems()

  const { itemSelected, selectAllActive, hasSelectedItems, handleItemButtonClick, handleSelectAllClick } =
    useItemSelection(items.length)

  const {
    showNuevoItemModal,
    isNuevoItemMinimized,
    showNuevoItemConVariantesModal,
    isNuevoItemConVariantesMinimized,
    showTemplateModal,
    activeNavTab,
    minimizedTabs,
    handleOpenNuevoItem,
    handleCloseNuevoItem,
    handleMinimizeNuevoItem,
    handleRestoreNuevoItem,
    handleOpenNuevoItemConVariantes,
    handleCloseNuevoItemConVariantes,
    handleMinimizeNuevoItemConVariantes,
    setShowTemplateModal,
    setIsNuevoItemConVariantesMinimized,
    setActiveNavTab,
    handleCloseTabFromNavbar,
    itemTitulo,
    setItemTitulo,
    itemTemplate,
    setItemTemplate,
    itemUbicacion,
    setItemUbicacion,
    handleRestoreNuevoItemConVariantes,
  } = useModals()

  const {
    hoveredDropdown,
    showNuevoDropdown,
    setShowNuevoDropdown,
    showAccionesDropdown,
    setShowAccionesDropdown,
    gridSize,
    gridSizeDropdownOpen,
    setGridSizeDropdownOpen,
    setGridSize,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
    handleCloseDropdowns,
  } = useSidebar()

  const breadcrumbs = [{ label: "Precios" }, { label: "Lista de Precios", href: "/precios/lista-de-precios" }]

  const canUndo = canUndoEdit || hasUnsavedDeletes
  const canRedo = canRedoEdit
  const hasChanges = hasUnsavedEdits || hasUnsavedDeletes

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
      await new Promise((resolve) => setTimeout(resolve, 300))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePriceFieldChange = (itemSku: string, field: string, value: any) => {
    // Check if this is a variant by looking through parent items
    let isVariant = false
    let parentSku: string | undefined

    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === itemSku)
        if (variant) {
          isVariant = true
          parentSku = item.sku
          break
        }
      }
    }

    if (isVariant && parentSku) {
      editVariantField(parentSku, itemSku, field, value)
    } else {
      editField(itemSku, field, value)
    }
  }

  const handleDeleteWithTracking = (item: Item) => {
    deleteItem(item)
  }

  const handleItemClick = (item: Item) => {
    console.log("[v0] Item clicked in precios view:", item.titulo)
  }

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleRestoreTab = (tabId: string) => {
    if (tabId === "nuevo-item") {
      handleRestoreNuevoItem()
    } else if (tabId === "nuevo-item-variantes") {
      handleRestoreNuevoItemConVariantes()
    }
  }

  const handleCreateItemWithSuccess = async (itemTitulo: string, itemTemplate: string, handleClose: () => void) => {
    await handleCreateNuevoItem(itemTitulo, itemTemplate, handleClose)
    setItemCreated(true)
    setTimeout(() => setItemCreated(false), 100)
  }

  const handleCreateItemConVariantesWithSuccess = async (
    itemTitulo: string,
    itemTemplate: string,
    handleClose: () => void,
  ) => {
    await handleCreateNuevoItemConVariantes(itemTitulo, itemTemplate, handleClose)
    setItemCreated(true)
    setTimeout(() => setItemCreated(false), 100)
  }

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
          {(showNuevoItemModal || showNuevoItemConVariantesModal) && (
            <div className="absolute top-0 left-0 h-full w-full bg-black/50 z-[60] pointer-events-none rounded-lg" />
          )}
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          <div className="relative border-b border-border h-[44px] bg-white">
            <div className="px-4 flex items-center justify-between h-full">
              {/* Left: Breadcrumbs */}
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              {/* Right: URDG Buttons */}
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
                  disabled={!hasChanges || isSaving}
                  className="p-1.5 bg-muted/50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-primary px-7"
                  title="Guardar cambios"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 flex bg-slate-50 overflow-hidden">
            <PriceGrid
              items={items}
              gridSize={gridSize}
              itemSelected={itemSelected}
              expandedItems={expandedItems}
              handleItemButtonClick={handleItemButtonClick}
              toggleVariantExpansion={toggleVariantExpansion}
              selectAllActive={selectAllActive}
              handleSelectAllClick={handleSelectAllClick}
              gridSizeDropdownOpen={gridSizeDropdownOpen}
              setGridSizeDropdownOpen={setGridSizeDropdownOpen}
              setGridSize={setGridSize}
              onPriceFieldChange={handlePriceFieldChange}
            />
          </main>
        </div>
      </div>

      {/* Existing modals */}
      <TemplateModal showTemplateModal={showTemplateModal} setShowTemplateModal={setShowTemplateModal} />

      <NuevoItemModal
        showNuevoItemModal={showNuevoItemModal}
        isNuevoItemMinimized={isNuevoItemMinimized}
        handleMinimizeNuevoItem={handleMinimizeNuevoItem}
        handleCloseNuevoItem={handleCloseNuevoItem}
        itemTitulo={itemTitulo}
        setItemTitulo={setItemTitulo}
        itemTemplate={itemTemplate}
        setItemTemplate={setItemTemplate}
        itemUbicacion={itemUbicacion}
        setItemUbicacion={setItemUbicacion}
        handleCreateNuevoItem={handleCreateItemWithSuccess}
        isCreatingItem={isCreatingItem}
      />

      <NuevoItemConVariantesModal
        showNuevoItemConVariantesModal={showNuevoItemConVariantesModal}
        isNuevoItemConVariantesMinimized={isNuevoItemConVariantesMinimized}
        handleMinimizeNuevoItemConVariantes={handleMinimizeNuevoItemConVariantes}
        handleCloseNuevoItemConVariantes={handleCloseNuevoItemConVariantes}
        setIsNuevoItemConVariantesMinimized={setIsNuevoItemConVariantesMinimized}
        setActiveNavTab={setActiveNavTab}
        activeNavTab={activeNavTab}
        itemTitulo={itemTitulo}
        setItemTitulo={setItemTitulo}
        itemTemplate={itemTemplate}
        setItemTemplate={setItemTemplate}
        itemUbicacion={itemUbicacion}
        setItemUbicacion={setItemUbicacion}
        handleCreateNuevoItemConVariantes={handleCreateItemConVariantesWithSuccess}
        isCreatingItem={isCreatingItem}
      />
    </div>
  )
}
