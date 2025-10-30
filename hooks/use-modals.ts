"use client"

import type React from "react"
import { useState } from "react"
import type { MinimizedTab } from "@/lib/types"

export function useModals() {
  const [showNuevoItemModal, setShowNuevoItemModal] = useState(false)
  const [isNuevoItemMinimized, setIsNuevoItemMinimized] = useState(false)
  const [showNuevoItemConVariantesModal, setShowNuevoItemConVariantesModal] = useState(false)
  const [isNuevoItemConVariantesMinimized, setIsNuevoItemConVariantesMinimized] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSelectingTemplateForContainer, setIsSelectingTemplateForContainer] = useState(false)
  const [minimizedTabs, setMinimizedTabs] = useState<MinimizedTab[]>([])
  const [activeNavTab, setActiveNavTab] = useState<string>("main")

  const [itemTitulo, setItemTitulo] = useState("")
  const [itemTemplate, setItemTemplate] = useState("")
  const [itemUbicacion, setItemUbicacion] = useState("")

  const handleOpenNuevoItem = () => {
    setShowNuevoItemModal(true)
    setIsNuevoItemMinimized(false)
    setActiveNavTab("nuevo-item")
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleCloseNuevoItem = () => {
    setShowNuevoItemModal(false)
    setIsNuevoItemMinimized(false)
    setMinimizedTabs(minimizedTabs.filter((tab) => tab.id !== "nuevo-item"))
    setActiveNavTab("main")
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleMinimizeNuevoItem = () => {
    setIsNuevoItemMinimized(true)
    if (!minimizedTabs.find((tab) => tab.id === "nuevo-item")) {
      setMinimizedTabs([...minimizedTabs, { id: "nuevo-item", label: "Nuevo Item" }])
    }
    setActiveNavTab("main")
  }

  const handleRestoreNuevoItem = () => {
    setIsNuevoItemMinimized(false)
    setMinimizedTabs(minimizedTabs.filter((tab) => tab.id !== "nuevo-item"))
    setActiveNavTab("nuevo-item")
  }

  const handleOpenNuevoItemConVariantes = () => {
    setShowNuevoItemConVariantesModal(true)
    setIsNuevoItemConVariantesMinimized(false)
    setActiveNavTab("nuevo-item-variantes")
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleCloseNuevoItemConVariantes = () => {
    setShowNuevoItemConVariantesModal(false)
    setIsNuevoItemConVariantesMinimized(false)
    setMinimizedTabs(minimizedTabs.filter((tab) => tab.id !== "nuevo-item-variantes"))
    setActiveNavTab("main")
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
  }

  const handleMinimizeNuevoItemConVariantes = () => {
    setIsNuevoItemConVariantesMinimized(true)
    if (!minimizedTabs.find((tab) => tab.id === "nuevo-item-variantes")) {
      setMinimizedTabs([...minimizedTabs, { id: "nuevo-item-variantes", label: "Nuevo Item con Variantes" }])
    }
    setActiveNavTab("main")
  }

  const handleRestoreNuevoItemConVariantes = () => {
    setIsNuevoItemConVariantesMinimized(false)
    setMinimizedTabs(minimizedTabs.filter((tab) => tab.id !== "nuevo-item-variantes"))
    setActiveNavTab("nuevo-item-variantes")
  }

  const handleCloseTabFromNavbar = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabId === "nuevo-item") {
      handleCloseNuevoItem()
    } else if (tabId === "nuevo-item-variantes") {
      handleCloseNuevoItemConVariantes()
    }
  }

  return {
    showNuevoItemModal,
    setShowNuevoItemModal,
    isNuevoItemMinimized,
    setIsNuevoItemMinimized,
    showNuevoItemConVariantesModal,
    setShowNuevoItemConVariantesModal,
    isNuevoItemConVariantesMinimized,
    setIsNuevoItemConVariantesMinimized,
    showTemplateModal,
    setShowTemplateModal,
    isSelectingTemplateForContainer,
    setIsSelectingTemplateForContainer,
    minimizedTabs,
    setMinimizedTabs,
    activeNavTab,
    setActiveNavTab,
    handleOpenNuevoItem,
    handleCloseNuevoItem,
    handleMinimizeNuevoItem,
    handleRestoreNuevoItem,
    handleOpenNuevoItemConVariantes,
    handleCloseNuevoItemConVariantes,
    handleMinimizeNuevoItemConVariantes,
    handleRestoreNuevoItemConVariantes,
    handleCloseTabFromNavbar,
    itemTitulo,
    setItemTitulo,
    itemTemplate,
    setItemTemplate,
    itemUbicacion,
    setItemUbicacion,
  }
}
