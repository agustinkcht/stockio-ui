"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Package, Plus, Search, X, Check, CheckCircle2 } from "lucide-react"
import { useAccount } from "@/lib/contexts/account-context"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CatalogoGrid } from "@/components/catalogo/catalogo-grid"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { UserPanel } from "@/components/layout/user-panel"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useModals } from "@/hooks/use-modals"
import { useSidebar } from "@/hooks/use-sidebar"
import { useChangeTracker } from "@/hooks/use-change-tracker"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function CatalogoPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [itemCreated, setItemCreated] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "info" } | null>(null)
  const { currentAccount } = useAccount()

  const showStatusMessage = (text: string, type: "success" | "info" = "success") => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const {
    items,
    depositStock,
    updateDepositStock,
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    updateItem,
    deleteItem,
    undoDelete,
    saveDelete: saveDeletedItems,
    hasUnsavedDeletes,
    deletedItems,
    isCreatingItem,
    updateStock,
    editField,
    editVariantField,
    saveEdit,
    cancelEdit,
    hasUnsavedEdits,
    updateItemsActiveStatus,
  } = useItems()

  const {
    selectAllActive,
    selectAllIndeterminate,
    hasSelectedItems,
    handleSelectAll,
    handleItemSelection,
    getSelectionState,
    getSelectedSkus,
    clearSelection,
  } = useItemSelection(items)

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

  const changeTracker = useChangeTracker()

  // Use the built-in hasUnsavedEdits from useItems for precio/stock changes
  const hasChanges = hasUnsavedEdits || hasUnsavedDeletes

  // Handle precio updates - check if it's a variant or standalone
  const handleUpdatePrecio = useCallback((itemId: string, precio: { costo: number; margen: number; iva: number; precioFinal: number }) => {
    // Check if this is a variant by looking through parent items
    let isVariant = false
    let parentSku: string | undefined

    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.id === itemId || v.sku === itemId)
        if (variant) {
          isVariant = true
          parentSku = item.sku
          editVariantField(parentSku, variant.sku, "precio", precio)
          return
        }
      }
    }

    // Not a variant, use regular editField
    editField(itemId, "precio", precio)
  }, [items, editField, editVariantField])

  // Handle stock updates - uses the built-in tracking from useItems
  const handleUpdateStockWithTracking = useCallback((itemSku: string, field: "total" | "reservado", value: number) => {
    // Check if this is a variant
    let isVariant = false
    let parentSku: string | undefined

    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === itemSku)
        if (variant) {
          isVariant = true
          parentSku = item.sku
          // For variants, update the stock field via editVariantField
          const currentStock = variant.stock || { total: 0, reservado: 0, disponible: 0 }
          const newStock = {
            ...currentStock,
            [field]: value,
            disponible: field === "total" ? value - currentStock.reservado : currentStock.total - value
          }
          editVariantField(parentSku, itemSku, "stock", newStock)
          return
        }
      }
    }

    // Not a variant - find the item and update
    const item = items.find(i => i.sku === itemSku)
    if (item) {
      const currentStock = item.stock || { total: 0, reservado: 0, disponible: 0 }
      const newStock = {
        ...currentStock,
        [field]: value,
        disponible: field === "total" ? value - currentStock.reservado : currentStock.total - value
      }
      editField(itemSku, "stock", newStock)
    }
  }, [items, editField, editVariantField])

  // Navigation guard for unsaved changes
  const {
    showNavigationModal,
    handleSaveAndNavigate,
    handleDiscardAndNavigate,
    handleCancelNavigation,
  } = useNavigationGuard({
    hasUnsavedChanges: hasChanges,
    onSave: async () => {
      await handleGuardar()
    },
    onDiscard: () => {
      handleDeshacer()
    },
  })

  useEffect(() => {
    setGridSize("md")
  }, [setGridSize])

  const breadcrumbs = [{ label: "Catálogo" }, { label: "Items", href: "/catalogo/items" }]

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
      await sleep(800)

      // Save precio/stock edits
      if (hasUnsavedEdits) {
        saveEdit()
      }

      // Save deleted items
      if (hasUnsavedDeletes) {
        await saveDeletedItems()
      }

      changeTracker.undoAll()
      
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

  const handleDeleteWithTracking = (item: Item) => {
    setItemToDelete(item)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    const originalIndex = items.findIndex((i) => i.sku === itemToDelete.sku)
    changeTracker.trackChange("delete", itemToDelete, { originalIndex })
    deleteItem(itemToDelete)

    await sleep(500)

    // Manually save to localStorage to ensure persistence
    const skuToDelete = itemToDelete.sku
    const remainingItems = items.filter((item) => item.sku !== skuToDelete)
    
    if (typeof window !== "undefined") {
      const storageKey = `stockio-items-${currentAccount}`
      localStorage.setItem(storageKey, JSON.stringify(remainingItems))
    }

    await saveDeletedItems()

    setItemToDelete(null)
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 3000)
  }

  const handleCancelDelete = () => {
    setItemToDelete(null)
  }

  const handleBatchDeleteClick = () => {
    setShowBatchDeleteModal(true)
  }

  const handleConfirmBatchDelete = async () => {
    const skusToDelete = getSelectedSkus()

    // Find items to delete (including children within parents)
    const itemsToDelete: Item[] = []
    for (const sku of skusToDelete) {
      // Check standalone items
      const standaloneItem = items.find((item) => item.sku === sku)
      if (standaloneItem) {
        itemsToDelete.push(standaloneItem)
        continue
      }
      // Check children within parents
      for (const item of items) {
        if (item.variants) {
          const variant = item.variants.find((v: any) => v.sku === sku)
          if (variant) {
            itemsToDelete.push(variant)
          }
        }
        if (item.items) {
          const groupItem = item.items.find((i: any) => i.sku === sku)
          if (groupItem) {
            itemsToDelete.push(groupItem)
          }
        }
      }
    }

    // Delete items from state
    for (const item of itemsToDelete) {
      deleteItem(item)
    }

    // Wait for state updates
    await sleep(800)

    // Manually filter and save to localStorage to ensure persistence
    const remainingItems = items.filter((item) => !skusToDelete.includes(item.sku))
    
    if (typeof window !== "undefined") {
      const storageKey = `stockio-items-${currentAccount}`
      localStorage.setItem(storageKey, JSON.stringify(remainingItems))
    }

    // Now save deleted items state (to clear the deletedItems array)
    await saveDeletedItems()

    // Reset selections completely
    clearSelection()

    setShowBatchDeleteModal(false)
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 3000)
  }

  const handleCancelBatchDelete = () => {
    setShowBatchDeleteModal(false)
  }

  const handleItemClick = (item: Item) => {
    router.push(`/catalogo/items/${item.id}`)
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
    const newItem = await handleCreateNuevoItem(itemTitulo, itemTemplate, handleClose)
    if (newItem) {
      router.push(`/catalogo/items/${newItem.id}`)
    }
    setItemCreated(true)
    setTimeout(() => setItemCreated(false), 100)
  }

  const handleCreateItemConVariantesWithSuccess = async (
    itemTitulo: string,
    itemTemplate: string,
    handleClose: () => void,
  ) => {
    const newItem = await handleCreateNuevoItemConVariantes(itemTitulo, itemTemplate, handleClose)
    if (newItem) {
      router.push(`/catalogo/items/${newItem.id}`)
    }
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
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              {/* Left: Breadcrumbs */}
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>

              {/* Right: D-G Buttons + Success Message */}
              <div className="flex items-center gap-2 min-w-[280px] justify-end">
                {isSaving && (
                  <div className="w-full max-w-[200px] h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary animate-loading-bar bg-[length:200%_100%]" />
                  </div>
                )}
                
                {showSaveSuccess && !isSaving && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Cambios Guardados</span>
                  </div>
                )}

                {statusMessage && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-right-2 duration-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{statusMessage.text}</span>
                  </div>
                )}

                {/* Deshacer/Guardar buttons - appear when there are unsaved changes */}
                {hasChanges && !isSaving && !showSaveSuccess && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                    <button
                      onClick={handleDeshacer}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      Deshacer
                    </button>
                    <button
                      onClick={handleGuardar}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 flex flex-col overflow-auto">
              <div className="px-8 pb-8 pt-4">
                <div className="rounded-xl border border-[rgba(228,230,235,0.5)] bg-transparent shadow-none border-none">
                  <CatalogoGrid
                    items={items}
                    gridSize={gridSize}
                    expandedItems={expandedItems}
                    onDeleteItem={handleDeleteWithTracking}
                    handleItemClick={handleItemClick}
                    toggleVariantExpansion={toggleVariantExpansion}
                    selectAllActive={selectAllActive}
                    selectAllIndeterminate={selectAllIndeterminate}
                    handleSelectAll={handleSelectAll}
                    handleItemSelection={handleItemSelection}
                    getSelectionState={getSelectionState}
                    gridSizeDropdownOpen={gridSizeDropdownOpen}
                    setGridSizeDropdownOpen={setGridSizeDropdownOpen}
                    setGridSize={setGridSize}
                    isExpanded={false}
                    handleOpenNuevoItem={handleOpenNuevoItem}
                    handleOpenNuevoItemConVariantes={handleOpenNuevoItemConVariantes}
                    hasSelectedItems={hasSelectedItems}
                    onBatchDelete={handleBatchDeleteClick}
                    onUpdateStock={handleUpdateStockWithTracking}
                    onUpdatePrecio={handleUpdatePrecio}
                    getSelectedSkus={getSelectedSkus}
                    onPauseItems={(ids) => {
                        updateItemsActiveStatus(ids, false)
                        clearSelection()
                        showStatusMessage(`${ids.length} ${ids.length === 1 ? "item pausado" : "items pausados"}`)
                      }}
                    onReactivateItems={(ids) => {
                        updateItemsActiveStatus(ids, true)
                        clearSelection()
                        showStatusMessage(`${ids.length} ${ids.length === 1 ? "item reactivado" : "items reactivados"}`)
                      }}
                  />
                </div>
              </div>
            </div>
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

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={handleCancelDelete}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¿Seguro deseas eliminar el item?
            </h3>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100010]" onClick={handleCancelBatchDelete}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¿Seguro deseas eliminar los items seleccionados?
            </h3>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={handleCancelBatchDelete}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Navigation Modal */}
      <UnsavedChangesModal
        isOpen={showNavigationModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
      />
    </div>
  )
}
