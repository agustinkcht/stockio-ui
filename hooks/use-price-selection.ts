"use client"

import { useState, useCallback, useMemo } from "react"
import type { Item } from "@/lib/types"

interface SelectionState {
  [sku: string]: boolean
}

export function usePriceSelection(items: Item[]) {
  const [selectedItems, setSelectedItems] = useState<SelectionState>({})

  // Get all SKUs including children
  const getAllSkus = useCallback((itemList: Item[]): string[] => {
    const skus: string[] = []
    for (const item of itemList) {
      const isParent = (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0)
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
    return (item.variants && item.variants.length > 0) || (item.items && item.items.length > 0)
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

  // Handle item click based on type
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
    const allSkus = getAllSkus(items)
    if (allSkus.length === 0) return false
    return allSkus.every((sku) => selectedItems[sku])
  }, [items, selectedItems, getAllSkus])

  const somethingSelected = useMemo(() => {
    const allSkus = getAllSkus(items)
    return allSkus.some((sku) => selectedItems[sku])
  }, [items, selectedItems, getAllSkus])

  const selectAllIndeterminate = useMemo(() => {
    return somethingSelected && !selectAllActive
  }, [somethingSelected, selectAllActive])

  const handleSelectAll = useCallback(() => {
    const allSkus = getAllSkus(items)
    const shouldSelect = !selectAllActive

    setSelectedItems((prev) => {
      const newState = { ...prev }
      for (const sku of allSkus) {
        newState[sku] = shouldSelect
      }
      return newState
    })
  }, [items, selectAllActive, getAllSkus])

  // Get count of selected items
  const selectedCount = useMemo(() => {
    return Object.values(selectedItems).filter(Boolean).length
  }, [selectedItems])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedItems({})
  }, [])

  return {
    selectedItems,
    selectAllActive,
    selectAllIndeterminate,
    handleItemSelection,
    handleSelectAll,
    getSelectionState,
    isParentItem,
    selectedCount,
    hasSelectedItems: selectedCount > 0,
    clearSelection,
  }
}
