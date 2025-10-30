"use client"

import type React from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Breadcrumb } from "@/components/layout/breadcrumb"
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
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"
import { useState } from "react"

export default function Page() {
  // Initialize all hooks
  const {
    items,
    depositStock,
    updateDepositStock,
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    updateItem,
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

  const [breadcrumbDynamicContent, setBreadcrumbDynamicContent] = useState<React.ReactNode>(null)

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
    console.log("[v0] Item clicked with tab:", tab, "isContainer:", isContainer)
    console.log("[v0] Setting selectedItem to:", item.titulo)
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

        {/* Breadcrumb component between TopNav and Toolbar */}
        <Breadcrumb
          breadcrumbText={selectedItem ? "Detalle del item" : "Todos los items"}
          dynamicContent={selectedItem ? breadcrumbDynamicContent : null}
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
              onDynamicContentChange={setBreadcrumbDynamicContent}
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
        handleCreateNuevoItem={handleCreateNuevoItem}
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
        handleCreateNuevoItemConVariantes={handleCreateNuevoItemConVariantes}
      />
    </div>
  )
}
