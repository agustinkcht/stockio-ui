"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { UtilityBar } from "@/components/layout/utility-bar"
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    console.log("[v0] Page component mounted - scroll detection ready")
  }, [])
  // </CHANGE>

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
    handleCloseDropdowns,
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

  const breadcrumbs = selectedItem
    ? [{ label: "Inventario" }, { label: "Artículos", href: "/" }, { label: "Detalle del item" }]
    : [{ label: "Inventario" }, { label: "Artículos", href: "/" }]

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

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    console.log("[v0] Scroll event fired - scrollTop:", scrollTop)
    const shouldBeScrolled = scrollTop > 50
    console.log("[v0] Setting isScrolled to:", shouldBeScrolled)
    setIsScrolled(shouldBeScrolled)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex" onClick={handleCloseDropdowns}>
      {/* Sidebar */}
      <div onClick={(e) => e.stopPropagation()}>
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
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 bg-slate-50 ${isSidebarExpanded ? "ml-64" : "ml-16"}`}
      >
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
          isExpanded={isSidebarExpanded}
        />

        {/* UtilityBar */}
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
          itemCreated={itemCreated}
          isExpanded={isSidebarExpanded}
        />

        {!selectedItem && (
          <Toolbar
            showNuevoDropdown={showNuevoDropdown}
            setShowNuevoDropdown={setShowNuevoDropdown}
            handleOpenNuevoItem={handleOpenNuevoItem}
            handleOpenNuevoItemConVariantes={handleOpenNuevoItemConVariantes}
            isExpanded={isSidebarExpanded}
            isScrolled={isScrolled}
          />
        )}

        <main
          className={`flex-1 overflow-y-auto transition-all duration-200 bg-[rgba(250,251,253,1)] ${showNuevoItemModal && !isNuevoItemMinimized ? "blur-sm" : ""} ${showNuevoItemConVariantesModal && !isNuevoItemConVariantesMinimized ? "blur-sm" : ""} ${!selectedItem ? "mt-[5.25rem]" : "mt-[5.25rem]"}`}
          onScroll={handleScroll}
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
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onFieldChange={(itemId, field, value) => updateItem(itemId, { [field]: value })}
              isSaving={isSaving}
              onDuplicate={(item) => console.log("Duplicate", item)}
              onDelete={handleDeleteWithTracking}
              variantChangeHandlers={{}}
              isExpanded={isSidebarExpanded}
            />
          ) : (
            <div className="px-8 pb-8 overflow-hidden">
              <div className="rounded-xl border mt-7 border-[rgba(228,230,235,0.5)] bg-transparent shadow-none border-none">
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
                  selectAllActive={selectAllActive}
                  handleSelectAllClick={handleSelectAllClick}
                  gridSizeDropdownOpen={gridSizeDropdownOpen}
                  setGridSizeDropdownOpen={setGridSizeDropdownOpen}
                  setGridSize={setGridSize}
                  isExpanded={isSidebarExpanded}
                  isScrolled={isScrolled}
                />
              </div>
            </div>
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
