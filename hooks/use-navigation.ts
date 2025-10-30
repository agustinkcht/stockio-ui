"use client"

import { useState } from "react"
import type { NavigationView, Item } from "@/lib/types"
import { getItemDisplayName } from "@/lib/utils/item-utils"

export function useNavigation() {
  const [currentView, setCurrentView] = useState<NavigationView>({
    id: "articulos",
    label: "Artículos",
    item: null,
  })
  const [navigationHistory, setNavigationHistory] = useState<NavigationView[]>([
    { id: "articulos", label: "Artículos", item: null },
  ])
  const [historyIndex, setHistoryIndex] = useState(0)

  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousView = navigationHistory[newIndex]
      setHistoryIndex(newIndex)
      setCurrentView(previousView)
      return previousView
    }
    return null
  }

  const navigateForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1
      const nextView = navigationHistory[newIndex]
      setHistoryIndex(newIndex)
      setCurrentView(nextView)
      return nextView
    }
    return null
  }

  const navigateToItem = (item: Item) => {
    const itemName = getItemDisplayName(item)
    const newView = { id: `item-${item.sku || item.name}`, label: itemName, item }
    setCurrentView(newView)

    const newHistory = navigationHistory.slice(0, historyIndex + 1)
    newHistory.push(newView)
    setNavigationHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const navigateToGrid = () => {
    const gridView = { id: "articulos", label: "Artículos", item: null }
    setCurrentView(gridView)

    const newHistory = navigationHistory.slice(0, historyIndex + 1)
    newHistory.push(gridView)
    setNavigationHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  return {
    currentView,
    setCurrentView,
    navigationHistory,
    historyIndex,
    navigateBack,
    navigateForward,
    navigateToItem,
    navigateToGrid,
  }
}
