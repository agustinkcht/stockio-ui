"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useItems } from "@/hooks/use-items"
import { useItemSelection } from "@/hooks/use-item-selection"
import { useNavigation } from "@/hooks/use-navigation"
import { useModals } from "@/hooks/use-modals"
import { useSidebar } from "@/hooks/use-sidebar"
import { useItemDetail } from "@/hooks/use-item-detail"
import { useChangeTracker } from "@/hooks/use-change-tracker"
import type { Item } from "@/lib/types"

export default function Page() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [itemCreated, setItemCreated] = useState(false)

  useEffect(() => {
    router.push("/precios/lista-de-precios")
  }, [router])

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
    const newItem = await handleCreateNuevoItem(itemTitulo, itemTemplate, handleClose)
    if (newItem) {
      handleItemClickWithNavigation(newItem, "info")
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
      handleItemClickWithNavigation(newItem, "info")
    }
    setItemCreated(true)
    setTimeout(() => setItemCreated(false), 100)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  )
}
