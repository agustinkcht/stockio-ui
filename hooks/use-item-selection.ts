"use client"

import { useState } from "react"
import type { Item } from "@/lib/types"

export function useItemSelection(itemsLength?: number) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectAllActive, setSelectAllActive] = useState(false)
  const [itemSelected, setItemSelected] = useState<boolean[]>([])
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({})

  const handleSelectAllClick = () => {
    const newState = !selectAllActive
    setSelectAllActive(newState)
    if (itemsLength !== undefined) {
      setItemSelected(new Array(itemsLength).fill(newState))
    }
  }

  const handleItemButtonClick = (index: number) => {
    setItemSelected((prev) => {
      const newStates = [...prev]
      if (itemsLength !== undefined) {
        while (newStates.length < itemsLength) {
          newStates.push(false)
        }
      }
      newStates[index] = !newStates[index]

      const allSelected = newStates.every((state) => state)
      setSelectAllActive(allSelected)

      return newStates
    })
  }

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const hasSelectedItems = itemSelected.some((selected) => selected)

  return {
    selectedItem,
    setSelectedItem,
    selectAllActive,
    setSelectAllActive,
    itemSelected,
    setItemSelected,
    expandedItems,
    setExpandedItems,
    handleSelectAllClick,
    handleItemButtonClick,
    toggleVariantExpansion,
    hasSelectedItems,
  }
}
