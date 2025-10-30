"use client"

import { useState } from "react"
import type { Item } from "@/lib/types"

export function useItemSelection() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectAllActive, setSelectAllActive] = useState(false)
  const [itemSelected, setItemSelected] = useState([false, false, false, false])
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({})

  const handleSelectAllClick = () => {
    const newState = !selectAllActive
    setSelectAllActive(newState)
    setItemSelected([newState, newState, newState, newState])
  }

  const handleItemButtonClick = (index: number) => {
    setItemSelected((prev) => {
      const newStates = [...prev]
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
