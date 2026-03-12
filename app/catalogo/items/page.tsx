"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, Plus, Search, X, Check, CheckCircle2 } from "lucide-react"
import { useAccount } from "@/lib/contexts/account-context"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { ItemsGrid } from "@/components/items/items-grid"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { UserPanel } from "@/components/layout/user-panel"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useModals } from "@/hooks/use-modals"
import { useSidebar } from "@/hooks/use-sidebar"
import { useChangeTracker } from "@/hooks/use-change-tracker"
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
  const { currentAccount } = useAccount()
  
  // Audit mode state
  const [hasAuditChanges, setHasAuditChanges] = useState(false)
  const [auditPendingCount, setAuditPendingCount] = useState(0)

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
    bulkSaveStock,
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

  useEffect(() => {
    setGridSize("md")
  }, [setGridSize])

  // Audit mode handlers
  const handleAuditChangesUpdate = (hasChanges: boolean, pendingCount: number) => {
    setHasAuditChanges(hasChanges)
    setAuditPendingCount(pendingCount)
  }

  const handleAuditSave = async (changes: Record<string, { total: number; reservado: number }>) => {
    setIsSaving(true)
    try {
      await sleep(600)
      
      // Use bulkSaveStock - it handles both standalone and variant items atomically
      // and persists directly to localStorage
      bulkSaveStock(changes)
      
      // Clear audit changes in the grid
      ;(window as any).__auditClearHandler?.()
      
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    } catch (error) {
      console.error("[v0] Error saving audit changes:", error)
    } finally {
      setIsSaving(false)
      setHasAuditChanges(false)
      setAuditPendingCount(0)
    }
  }

  const handleAuditDiscard = () => {
    // Audit changes are discarded internally in ItemsGrid
    setHasAuditChanges(false)
    setAuditPendingCount(0)
  }

  const handleAuditGuardar = () => {
    // Trigger save from window handler
    ;(window as any).__auditSaveHandler?.()
  }

  const handleAuditDeshacer = () => {
    // Trigger discard from window handler
    ;(window as any).__auditDiscardHandler?.()
  }

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
    if (hasUnsavedDeletes) {
      undoDelete()
    }
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    setShowSaveSuccess(false)

    try {
      await sleep(800)

      if (hasUnsavedDeletes) {
        await saveDeletedItems()
      }

      changeTracker.commitAll()
      
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
    router.push(`/catalogo/items/${item.sku}`)
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
      router.push(`/catalogo/items/${newItem.sku}`)
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
      router.push(`/catalogo/items/${newItem.sku}`)
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

                {hasAuditChanges && !showSaveSuccess && !isSaving && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                    <button
                      onClick={handleAuditDeshacer}
                      className="px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all cursor-pointer text-red-700 text-sm font-medium"
                      title="Deshacer cambios"
                    >
                      Deshacer
                    </button>

                    <button
                      onClick={handleAuditGuardar}
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

          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 flex flex-col overflow-auto">
              <div className="px-8 pb-8 pt-4">
                <div className="rounded-xl border border-[rgba(228,230,235,0.5)] bg-transparent shadow-none border-none">
                  <ItemsGrid
                    items={items}
                    gridSize={gridSize}
                    depositStock={depositStock}
                    updateDepositStock={updateDepositStock}
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
                    onUpdateStock={updateStock}
                    onAuditChangesUpdate={handleAuditChangesUpdate}
                    onAuditSave={handleAuditSave}
                    onAuditDiscard={handleAuditDiscard}
                    getSelectedSkus={getSelectedSkus}
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
    </div>
  )
}
