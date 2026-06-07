"use client"

import { useState, useCallback, useMemo } from "react"
import type { Item } from "@/lib/types"

interface SelectionState {
  [id: string]: boolean
}

export function useItemSelection(items: Item[]) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectionState>({})
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({})

  // Resolve the stable identifier for any item — always prefer id
  const getItemId = useCallback((item: any): string | undefined => {
    return item.id || item.sku
  }, [])

  // Get all selectable IDs (children IDs for parents, own ID for standalone)
  const getAllSelectableIds = useCallback((itemList: Item[]): string[] => {
    const ids: string[] = []
    for (const item of itemList) {
      const isParent = (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0) || item.hasVariants || item.isAgrupador
      if (isParent) {
        const children = item.variants || item.items || []
        for (const child of children) {
          const id = (child as any).id || (child as any).sku
          if (id) ids.push(id)
        }
      } else {
        const id = (item as any).id || item.sku
        if (id) ids.push(id)
      }
    }
    return ids
  }, [])

  // Get children IDs for a parent item
  const getChildrenIds = useCallback((item: Item): string[] => {
    const children = item.variants || item.items || []
    return children
      .map((child) => (child as any).id || (child as any).sku)
      .filter(Boolean) as string[]
  }, [])

  // Check if item is a parent
  const isParentItem = useCallback((item: Item): boolean => {
    return (item.variants && item.variants.length > 0) || 
           (item.items && item.items.length > 0) || 
           item.hasVariants || 
           item.isAgrupador
  }, [])

  // Check if a parent has all children selected
  const areAllChildrenSelected = useCallback(
    (item: Item): boolean => {
      const childrenIds = getChildrenIds(item)
      if (childrenIds.length === 0) return false
      return childrenIds.every((id) => selectedItems[id])
    },
    [selectedItems, getChildrenIds]
  )

  // Check if a parent has some (but not all) children selected
  const areSomeChildrenSelected = useCallback(
    (item: Item): boolean => {
      const childrenIds = getChildrenIds(item)
      if (childrenIds.length === 0) return false
      const selectedCount = childrenIds.filter((id) => selectedItems[id]).length
      return selectedCount > 0 && selectedCount < childrenIds.length
    },
    [selectedItems, getChildrenIds]
  )

  // Handle selecting/deselecting a standalone item
  const handleStandaloneSelection = useCallback((id: string) => {
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Handle selecting/deselecting a parent (selects/deselects all children)
  // Dash (indeterminate) → deselect all; Empty → select all; Checked → deselect all
  const handleParentSelection = useCallback(
    (item: Item) => {
      const childrenIds = getChildrenIds(item)
      const allSelected = areAllChildrenSelected(item)
      const someSelected = areSomeChildrenSelected(item)
      // If indeterminate (dash) or all selected (check) → deselect all; otherwise select all
      const shouldSelect = !allSelected && !someSelected
      setSelectedItems((prev) => {
        const next = { ...prev }
        for (const id of childrenIds) next[id] = shouldSelect
        return next
      })
    },
    [getChildrenIds, areAllChildrenSelected, areSomeChildrenSelected]
  )

  // Handle selecting/deselecting a child item
  const handleChildSelection = useCallback((id: string) => {
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Handle item selection based on type
  const handleItemSelection = useCallback(
    (item: Item, isChild: boolean = false) => {
      const id = getItemId(item)
      if (isChild && id) {
        handleChildSelection(id)
      } else if (isParentItem(item)) {
        handleParentSelection(item)
      } else if (id) {
        handleStandaloneSelection(id)
      }
    },
    [getItemId, isParentItem, handleParentSelection, handleChildSelection, handleStandaloneSelection]
  )

  // Get selection state for an item
  const getSelectionState = useCallback(
    (item: Item, isChild: boolean = false): { checked: boolean; indeterminate: boolean } => {
      const id = getItemId(item)
      if (isChild) {
        return { checked: id ? !!selectedItems[id] : false, indeterminate: false }
      }
      if (isParentItem(item)) {
        return {
          checked: areAllChildrenSelected(item),
          indeterminate: areSomeChildrenSelected(item),
        }
      }
      return { checked: id ? !!selectedItems[id] : false, indeterminate: false }
    },
    [getItemId, selectedItems, isParentItem, areAllChildrenSelected, areSomeChildrenSelected]
  )

  // Select all / deselect all
  const selectAllActive = useMemo(() => {
    const allIds = getAllSelectableIds(items)
    if (allIds.length === 0) return false
    return allIds.every((id) => selectedItems[id])
  }, [items, selectedItems, getAllSelectableIds])

  const somethingSelected = useMemo(() => {
    const allIds = getAllSelectableIds(items)
    return allIds.some((id) => selectedItems[id])
  }, [items, selectedItems, getAllSelectableIds])

  const selectAllIndeterminate = useMemo(() => {
    return somethingSelected && !selectAllActive
  }, [somethingSelected, selectAllActive])

  const handleSelectAll = useCallback(() => {
    const allIds = getAllSelectableIds(items)
    // If indeterminate (dash) or all selected (check) → deselect all; otherwise select all
    const shouldSelect = !selectAllActive && !selectAllIndeterminate
    setSelectedItems((prev) => {
      const next = { ...prev }
      for (const id of allIds) next[id] = shouldSelect
      return next
    })
  }, [items, selectAllActive, selectAllIndeterminate, getAllSelectableIds])

  // Get count of selected items
  const selectedCount = useMemo(() => {
    return Object.values(selectedItems).filter(Boolean).length
  }, [selectedItems])

  // Get array of selected IDs
  const getSelectedSkus = useCallback((): string[] => {
    return Object.entries(selectedItems)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id)
  }, [selectedItems])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedItems({})
  }, [])

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const hasSelectedItems = selectedCount > 0

  return {
    selectedItem,
    setSelectedItem,
    selectedItems,
    selectAllActive,
    selectAllIndeterminate,
    expandedItems,
    setExpandedItems,
    handleSelectAll,
    handleItemSelection,
    getSelectionState,
    isParentItem,
    toggleVariantExpansion,
    hasSelectedItems,
    selectedCount,
    getSelectedSkus,
    clearSelection,
  }
}
