"use client"
import { useState } from "react"
import { Package, Search, X, Check, AlertCircle, CheckCircle2 } from "lucide-react"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import type { Item } from "@/lib/types"
import { Sidebar } from "@/components/layout/sidebar"
import { PriceGrid } from "@/components/prices/price-grid"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { UserPanel } from "@/components/layout/user-panel"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useModals } from "@/hooks/use-modals"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useSidebar } from "@/hooks/use-sidebar"

export default function ListaDePreciosPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [itemCreated, setItemCreated] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const {
    items,
    depositStock,
    updateDepositStock,
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    updateItem,
    deleteItem,
    undoDelete,
    saveDelete: saveDeletedItemsHook,
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
    setShowSaveSuccess(false)
    try {
      if (hasUnsavedEdits) {
        await sleep(800)
        saveEdit()
      }
      if (hasUnsavedDeletes) {
        await sleep(800)
        await saveDeletedItemsHook()
      }
      
      setShowSaveSuccess(true)
      setTimeout(() => {
        setShowSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("[v0] Error saving changes:", error)
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

  const { showNavigationModal, handleSaveAndNavigate, handleDiscardAndNavigate, handleCancelNavigation } =
    useNavigationGuard({
      hasUnsavedChanges: hasChanges,
      onSave: handleGuardar,
      onDiscard: handleDeshacer,
    })

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
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-all cursor-pointer text-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Guardar cambios"
                    >
                      Guardar
                    </button>
                  </>
                )}
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

      <UnsavedChangesModal
        isOpen={showNavigationModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
      />
    </div>
  )
}
