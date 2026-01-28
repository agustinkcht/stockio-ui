"use client"

import { useState, useCallback, useMemo } from "react"
import type { Item } from "@/lib/types"

interface SelectionState {
  [sku: string]: boolean
}

export function useItemSelection(items: Item[]) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectionState>({})
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({})

  // Get all SKUs including children (only selectable items - standalone and children)
  const getAllSelectableSkus = useCallback((itemList: Item[]): string[] => {
    const skus: string[] = []
    for (const item of itemList) {
      const isParent = (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0) || item.hasVariants || item.isAgrupador
      if (isParent) {
        // Only add children SKUs for parent items
        const children = item.variants || item.items || []
        for (const child of children) {
          if (child.sku) {
            skus.push(child.sku)
          }
        }
      } else if (item.sku) {
        // Add standalone item SKU
        skus.push(item.sku)
      }
    }
    return skus
  }, [])

  // Get children SKUs for a parent item
  const getChildrenSkus = useCallback((item: Item): string[] => {
    const children = item.variants || item.items || []
    return children.filter((child) => child.sku).map((child) => child.sku!)
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
      const childrenSkus = getChildrenSkus(item)
      if (childrenSkus.length === 0) return false
      return childrenSkus.every((sku) => selectedItems[sku])
    },
    [selectedItems, getChildrenSkus]
  )

  // Check if a parent has some (but not all) children selected
  const areSomeChildrenSelected = useCallback(
    (item: Item): boolean => {
      const childrenSkus = getChildrenSkus(item)
      if (childrenSkus.length === 0) return false
      const selectedCount = childrenSkus.filter((sku) => selectedItems[sku]).length
      return selectedCount > 0 && selectedCount < childrenSkus.length
    },
    [selectedItems, getChildrenSkus]
  )

  // Handle selecting/deselecting a standalone item
  const handleStandaloneSelection = useCallback((sku: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }))
  }, [])

  // Handle selecting/deselecting a parent (selects/deselects all children)
  const handleParentSelection = useCallback(
    (item: Item) => {
      const childrenSkus = getChildrenSkus(item)
      const allSelected = areAllChildrenSelected(item)

      setSelectedItems((prev) => {
        const newState = { ...prev }
        for (const sku of childrenSkus) {
          newState[sku] = !allSelected
        }
        return newState
      })
    },
    [getChildrenSkus, areAllChildrenSelected]
  )

  // Handle selecting/deselecting a child item
  const handleChildSelection = useCallback((sku: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }))
  }, [])

  // Handle item selection based on type
  const handleItemSelection = useCallback(
    (item: Item, isChild: boolean = false) => {
      if (isChild && item.sku) {
        handleChildSelection(item.sku)
      } else if (isParentItem(item)) {
        handleParentSelection(item)
      } else if (item.sku) {
        handleStandaloneSelection(item.sku)
      }
    },
    [isParentItem, handleParentSelection, handleChildSelection, handleStandaloneSelection]
  )

  // Get selection state for an item
  const getSelectionState = useCallback(
    (item: Item, isChild: boolean = false): { checked: boolean; indeterminate: boolean } => {
      if (isChild && item.sku) {
        return { checked: !!selectedItems[item.sku], indeterminate: false }
      }

      if (isParentItem(item)) {
        const allSelected = areAllChildrenSelected(item)
        const someSelected = areSomeChildrenSelected(item)
        return { checked: allSelected, indeterminate: someSelected }
      }

      return { checked: !!selectedItems[item.sku!], indeterminate: false }
    },
    [selectedItems, isParentItem, areAllChildrenSelected, areSomeChildrenSelected]
  )

  // Select all / deselect all
  const selectAllActive = useMemo(() => {
    const allSkus = getAllSelectableSkus(items)
    if (allSkus.length === 0) return false
    return allSkus.every((sku) => selectedItems[sku])
  }, [items, selectedItems, getAllSelectableSkus])

  const somethingSelected = useMemo(() => {
    const allSkus = getAllSelectableSkus(items)
    return allSkus.some((sku) => selectedItems[sku])
  }, [items, selectedItems, getAllSelectableSkus])

  const selectAllIndeterminate = useMemo(() => {
    return somethingSelected && !selectAllActive
  }, [somethingSelected, selectAllActive])

  const handleSelectAll = useCallback(() => {
    const allSkus = getAllSelectableSkus(items)
    const shouldSelect = !selectAllActive

    setSelectedItems((prev) => {
      const newState = { ...prev }
      for (const sku of allSkus) {
        newState[sku] = shouldSelect
      }
      return newState
    })
  }, [items, selectAllActive, getAllSelectableSkus])

  // Get count of selected items
  const selectedCount = useMemo(() => {
    return Object.values(selectedItems).filter(Boolean).length
  }, [selectedItems])

  // Get array of selected SKUs
  const getSelectedSkus = useCallback((): string[] => {
    return Object.entries(selectedItems)
      .filter(([, isSelected]) => isSelected)
      .map(([sku]) => sku)
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
