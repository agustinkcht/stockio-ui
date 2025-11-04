"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { DynamicBar } from "@/components/layout/dynamic-bar"
import { Toolbar } from "@/components/layout/toolbar"
import { ItemsGrid } from "@/components/items/items-grid"
import { ItemDetailPanel } from "@/components/items/item-detail-panel"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useNavigation } from "@/hooks/use-navigation"
import { useModals } from "@/hooks/use-modals"
import { useSidebar } from "@/hooks/use-sidebar"
import { useItemDetail } from "@/hooks/use-item-detail"
import { useChangeTracker } from "@/hooks/use-change-tracker"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"

export default function Page() {
  const [isSaving, setIsSaving] = useState(false)
  const [itemCreated, setItemCreated] = useState(false)

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
  } = useItems()

  const { itemSelected, selectAllActive, hasSelectedItems, handleItemButtonClick, handleSelectAllClick } =
    useItemSelection(items.length)
  const { currentView, historyIndex, navigationHistory, navigateBack, navigateForward, navigateToItem } =
    useNavigation()
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
    searchQuery,
    setSearchQuery,
    hoveredSearch,
    hoveredDropdown,
    showNuevoDropdown,
    setShowNuevoDropdown,
    showAccionesDropdown,
    setShowAccionesDropdown,
    gridSize,
    gridSizeDropdownOpen,
    setGridSizeDropdownOpen,
    setGridSize,
    handleSearchMouseEnter,
    handleSearchMouseLeave,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
    getFilteredDropdownItems,
    hasMatchingItems,
  } = useSidebar()
  const {
    selectedItem,
    setSelectedItem,
    selectedDetailTab,
    expandedItems,
    toggleVariantExpansion,
    setSelectedDetailTab,
  } = useItemDetail()

  const changeTracker = useChangeTracker()

  const breadcrumbs = selectedItem ? ["Artículos", "Detalle del item"] : ["Artículos", "Todos los items"]

  const handleUndo = () => {
    const change = changeTracker.undo()
    if (change?.type === "delete") {
      undoDelete()
    }
    // TODO: Handle other change types (edit, add)
  }

  const handleRedo = () => {
    const change = changeTracker.redo()
    if (change?.type === "delete") {
      // Re-apply the delete
      deleteItem(change.data)
    }
    // TODO: Handle other change types (edit, add)
  }

  const handleDeshacer = () => {
    changeTracker.undoAll()
    if (hasUnsavedDeletes) {
      undoDelete()
    }
    // TODO: Undo all other changes
  }

  const handleGuardar = async () => {
    setIsSaving(true)

    try {
      const changes = changeTracker.saveAll()

      if (hasUnsavedDeletes) {
        await saveDelete()
      }

      // TODO: Save other changes to database

      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWithTracking = (item: Item) => {
    const originalIndex = items.findIndex((i) => i.sku === item.sku)
    changeTracker.trackChange("delete", item, { originalIndex })
    deleteItem(item)
  }

  const handleNavigateBack = () => {
    const previousView = navigateBack()
    if (previousView) {
      if (previousView.item) {
        setSelectedItem(previousView.item)
      } else {
        setSelectedItem(null)
      }
    }
  }

  const handleNavigateForward = () => {
    const nextView = navigateForward()
    if (nextView) {
      if (nextView.item) {
        setSelectedItem(nextView.item)
      } else {
        setSelectedItem(null)
      }
    }
  }

  const handleItemClickWithNavigation = (item: Item, tab = "info", isContainer?: boolean) => {
    setSelectedItem(item)
    setSelectedDetailTab(tab as any)
    navigateToItem(item)
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
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <Sidebar
        sidebarItems={SIDEBAR_ITEMS}
        bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        hoveredSearch={hoveredSearch}
        hoveredDropdown={hoveredDropdown}
        handleSearchMouseEnter={handleSearchMouseEnter}
        handleSearchMouseLeave={handleSearchMouseLeave}
        handleDropdownMouseEnter={handleDropdownMouseEnter}
        handleDropdownMouseLeave={handleDropdownMouseLeave}
        getFilteredDropdownItems={getFilteredDropdownItems}
        hasMatchingItems={hasMatchingItems}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-16 transition-all duration-300">
        <TopNav
          currentView={currentView}
          navigationHistory={navigationHistory}
          historyIndex={historyIndex}
          minimizedTabs={minimizedTabs}
          activeNavTab={activeNavTab}
          onNavigateBack={handleNavigateBack}
          onNavigateForward={handleNavigateForward}
          onRestoreTab={handleRestoreTab}
          onCloseTab={handleCloseTabFromNavbar}
        />

        {/* DynamicBar */}
        <DynamicBar
          breadcrumbs={breadcrumbs}
          hasUnsavedChanges={changeTracker.hasUnsavedChanges || hasUnsavedDeletes}
          canUndo={changeTracker.canUndo}
          canRedo={changeTracker.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDeshacer={handleDeshacer}
          onGuardar={handleGuardar}
          isSaving={isSaving}
          itemCreated={itemCreated}
        />

        {/* Toolbar (only show when no item is selected) */}
        {!selectedItem && (
          <Toolbar
            showNuevoDropdown={showNuevoDropdown}
            setShowNuevoDropdown={setShowNuevoDropdown}
            handleOpenNuevoItem={handleOpenNuevoItem}
            handleOpenNuevoItemConVariantes={handleOpenNuevoItemConVariantes}
            showAccionesDropdown={showAccionesDropdown}
            setShowAccionesDropdown={setShowAccionesDropdown}
            hasSelectedItems={hasSelectedItems}
            selectAllActive={selectAllActive}
            handleSelectAllClick={handleSelectAllClick}
            gridSize={gridSize}
            gridSizeDropdownOpen={gridSizeDropdownOpen}
            setGridSizeDropdownOpen={setGridSizeDropdownOpen}
            setGridSize={setGridSize}
          />
        )}

        {/* Main Content */}
        <main
          className={`flex-1 overflow-y-auto transition-all duration-200 ${showNuevoItemModal && !isNuevoItemMinimized ? "blur-sm" : ""} ${showNuevoItemConVariantesModal && !isNuevoItemConVariantesMinimized ? "blur-sm" : ""}`}
          style={{ marginTop: !selectedItem ? "12.5rem" : "3rem" }}
        >
          {selectedItem ? (
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
            />
          ) : (
            <ItemsGrid
              items={items}
              gridSize={gridSize}
              itemSelected={itemSelected}
              expandedItems={expandedItems}
              handleItemButtonClick={handleItemButtonClick}
              handleItemClick={handleItemClickWithNavigation}
              toggleVariantExpansion={toggleVariantExpansion}
              updateDepositStock={updateDepositStock}
              depositStock={depositStock}
              onDeleteItem={handleDeleteWithTracking}
            />
          )}
        </main>
      </div>

      {/* Modals */}
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
