"use client"
import { useState } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { UtilityBar } from "@/components/layout/utility-bar"
import { PriceGrid } from "@/components/prices/price-grid"
import { NuevoItemModal } from "@/components/modals/nuevo-item-modal"
import { NuevoItemConVariantesModal } from "@/components/modals/nuevo-item-con-variantes-modal"
import { TemplateModal } from "@/components/modals/template-modal"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useModals } from "@/hooks/use-modals"
import { useSidebar } from "@/hooks/use-sidebar"
import { useChangeTracker } from "@/hooks/use-change-tracker"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
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

  const changeTracker = useChangeTracker()

  const breadcrumbs = [{ label: "Precios" }, { label: "Lista de Precios", href: "/precios/lista-de-precios" }]

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

  const handleItemClick = (item: Item) => {
    // No navigation for precios view
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
      <TopNav
        currentView="precios"
        navigationHistory={[]}
        historyIndex={0}
        minimizedTabs={minimizedTabs}
        activeNavTab={activeNavTab}
        onNavigateBack={() => {}}
        onNavigateForward={() => {}}
        onRestoreTab={handleRestoreTab}
        onCloseTab={handleCloseTabFromNavbar}
        isExpanded={false}
      />

      <div className="pt-[calc(2.5rem+6px)] px-[6px] pb-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative h-[calc(100vh-2.5rem-12px)] sticky top-[calc(2.5rem+6px)] w-auto z-[100003]"
        >
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
            itemCreated={itemCreated}
            isExpanded={false}
          />

          <main className="flex-1 bg-[rgba(250,251,253,1)] overflow-auto">
            <div className="px-8 pb-8">
              <div className="rounded-xl border border-[rgba(228,230,235,0.5)] bg-transparent shadow-none border-none">
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
                />
              </div>
            </div>
          </main>
        </div>
      </div>

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
