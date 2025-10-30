"use client"

import { useState, useRef } from "react"
import { SIDEBAR_ITEMS } from "@/lib/constants"

export function useSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [hoveredSearch, setHoveredSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md")
  const [gridSizeDropdownOpen, setGridSizeDropdownOpen] = useState(false)
  const [showNuevoDropdown, setShowNuevoDropdown] = useState(false)
  const [showAccionesDropdown, setShowAccionesDropdown] = useState(false)

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDropdownMouseEnter = (index: number) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setHoveredDropdown(index)
  }

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredDropdown(null)
    }, 250)
  }

  const handleSearchMouseEnter = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    setHoveredSearch(true)
  }

  const handleSearchMouseLeave = () => {
    searchTimeoutRef.current = setTimeout(() => {
      setHoveredSearch(false)
      setSearchQuery("")
    }, 250)
  }

  const getFilteredDropdownItems = (index: number) => {
    const item = SIDEBAR_ITEMS[index]
    if (!item?.dropdown) return []

    if (!searchQuery.trim()) return item.dropdown

    return item.dropdown.filter((dropdownItem) => dropdownItem.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const hasMatchingItems = (index: number) => {
    return getFilteredDropdownItems(index).length > 0
  }

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    hoveredDropdown,
    setHoveredDropdown,
    hoveredSearch,
    setHoveredSearch,
    searchQuery,
    setSearchQuery,
    gridSize,
    setGridSize,
    gridSizeDropdownOpen,
    setGridSizeDropdownOpen,
    showNuevoDropdown,
    setShowNuevoDropdown,
    showAccionesDropdown,
    setShowAccionesDropdown,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
    handleSearchMouseEnter,
    handleSearchMouseLeave,
    getFilteredDropdownItems,
    hasMatchingItems,
  }
}
