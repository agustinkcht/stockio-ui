"use client"

import { useState, useEffect } from "react"
import type { Item, DepositStockMap } from "@/lib/types"
import { TEMPLATES } from "@/lib/constants"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"

interface DeletedItemWithPosition {
  item: Item
  originalIndex: number
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [depositStock, setDepositStock] = useState<DepositStockMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [deletedItems, setDeletedItems] = useState<DeletedItemWithPosition[]>([])
  const [hasUnsavedDeletes, setHasUnsavedDeletes] = useState(false)
  const [isCreatingItem, setIsCreatingItem] = useState(false)

  useEffect(() => {
    console.log("[v0] useItems - hasUnsavedDeletes changed to:", hasUnsavedDeletes)
    console.log("[v0] useItems - deletedItems count:", deletedItems.length)
  }, [hasUnsavedDeletes, deletedItems])

  const USE_MOCK_DATA = true

  useEffect(() => {
    const fetchItems = async () => {
      if (USE_MOCK_DATA) {
        setItems(INITIAL_ITEMS)
        setIsLoading(false)
        return
      }
      try {
        const response = await fetch("/api/items")

        if (response.ok) {
          const data = await response.json()
          setItems(data)
        } else {
          setItems(INITIAL_ITEMS)
        }
      } catch (error) {
        setItems(INITIAL_ITEMS)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  useEffect(() => {
    const initialDepositStock: DepositStockMap = {}

    const distributeStock = (totalStock: number, reservedStock: number) => {
      const deposits = ["Torcuato", "Trujui"]
      const stockDistribution: any = {}

      let remainingTotal = totalStock
      let remainingReserved = reservedStock

      deposits.forEach((deposit, index) => {
        if (index === deposits.length - 1) {
          stockDistribution[deposit] = {
            total: remainingTotal,
            reservado: remainingReserved,
          }
        } else {
          const maxTotal = Math.floor(remainingTotal / (deposits.length - index))
          const depositTotal = Math.floor(Math.random() * (maxTotal + 1))
          const depositReserved = Math.min(Math.floor(Math.random() * (depositTotal + 1)), remainingReserved)

          stockDistribution[deposit] = {
            total: depositTotal,
            reservado: depositReserved,
          }

          remainingTotal -= depositTotal
          remainingReserved -= depositReserved
        }
      })

      return stockDistribution
    }

    items.forEach((item) => {
      if (item.isAgrupador && item.items) {
        item.items.forEach((subItem) => {
          if (subItem.sku && subItem.stock) {
            initialDepositStock[subItem.sku] = distributeStock(
              Number.parseInt(subItem.stock.total || "0"),
              Number.parseInt(subItem.stock.reservado || "0"),
            )
          }
        })
      } else if (item.hasVariants && item.variants) {
        item.variants.forEach((variant) => {
          if (variant.sku && variant.stock) {
            initialDepositStock[variant.sku] = distributeStock(
              Number.parseInt(variant.stock.total),
              Number.parseInt(variant.stock.reservado),
            )
          }
        })
      } else if (item.sku && item.stock) {
        initialDepositStock[item.sku] = distributeStock(
          Number.parseInt(item.stock.total || "0"),
          Number.parseInt(item.stock.reservado || "0"),
        )
      }
    })

    setDepositStock(initialDepositStock)
  }, [items])

  const updateDepositStock = (
    sku: string,
    deposit: "Torcuato" | "Trujui",
    field: "total" | "reservado",
    value: number,
  ) => {
    setDepositStock((prev) => {
      const currentSkuStock = prev[sku] || {
        Torcuato: { total: 0, reservado: 0 },
        Trujui: { total: 0, reservado: 0 },
      }

      return {
        ...prev,
        [sku]: {
          ...currentSkuStock,
          [deposit]: {
            ...currentSkuStock[deposit],
            [field]: value,
          },
        },
      }
    })
  }

  const handleCreateNuevoItem = async (itemTitulo: string, itemTemplate: string, handleClose: () => void) => {
    if (!itemTitulo.trim()) {
      alert("El título es obligatorio")
      return null
    }

    setIsCreatingItem(true)

    const generateSku = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let sku = ""
      for (let i = 0; i < 12; i++) {
        sku += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return sku
    }

    const generateCodigoUniversal = () => {
      return Math.floor(Math.random() * 9000000000000) + 1000000000000
    }

    let atributosPrincipalesFromTemplate: Array<{ key: string; value: string }> = []
    let atributosInformativosFromTemplate: Array<{ key: string; value: string }> = []

    if (itemTemplate) {
      const template = TEMPLATES.find((t: any) => t.name === itemTemplate)
      if (template) {
        atributosPrincipalesFromTemplate = template.atributosPrincipales.map((attr: any) => ({ ...attr }))
        atributosInformativosFromTemplate = template.atributosInformativos.map((attr: any) => ({ ...attr }))
      }
    }

    const newItem: Item = {
      name: itemTitulo,
      stock: {
        total: "0",
        reservado: "0",
        disponible: "0",
      },
      hasVariants: false,
      isAgrupador: false,
      sku: generateSku(),
      codigoUniversal: generateCodigoUniversal().toString(),
      marca: "",
      modelo: "",
      formatoVenta: "unidad",
      proveedor: "",
      codigoProveedor: "",
      atributosPrincipales: atributosPrincipalesFromTemplate,
      atributosInformativos: atributosInformativosFromTemplate,
    }

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        setItems([newItem, ...items])
        handleClose()
        return newItem
      } else {
        console.error("[v0] Failed to create item")
        alert("Error al crear el item")
        return null
      }
    } catch (error) {
      console.error("[v0] Error creating item:", error)
      alert("Error al crear el item")
      return null
    } finally {
      setIsCreatingItem(false)
    }
  }

  const handleCreateNuevoItemConVariantes = async (
    itemTitulo: string,
    itemTemplate: string,
    handleClose: () => void,
  ) => {
    if (!itemTitulo.trim()) {
      alert("El título es obligatorio")
      return null
    }

    setIsCreatingItem(true)

    const generateSku = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let sku = ""
      for (let i = 0; i < 12; i++) {
        sku += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return sku
    }

    const generateCodigoUniversal = () => {
      return Math.floor(Math.random() * 9000000000000) + 1000000000000
    }

    let containerAtributosPrincipalesFromTemplate: Array<{ key: string; variantes: string[] }> = []
    let atributosInformativosFromTemplate: Array<{ key: string; value: string }> = []

    if (itemTemplate) {
      const template = TEMPLATES.find((t: any) => t.name === itemTemplate)
      if (template) {
        containerAtributosPrincipalesFromTemplate = template.atributosPrincipales.map((attr: any) => ({
          key: attr.key,
          variantes: [],
        }))
        atributosInformativosFromTemplate = template.atributosInformativos.map((attr: any) => ({ ...attr }))
      }
    }

    const newItem: Item = {
      name: itemTitulo,
      hasVariants: true,
      isAgrupador: true,
      sku: generateSku(),
      codigoUniversal: generateCodigoUniversal().toString(),
      marca: "",
      modelo: "",
      formatoVenta: "unidad",
      proveedor: "",
      codigoProveedor: "",
      containerAtributosPrincipales: containerAtributosPrincipalesFromTemplate,
      atributosInformativos: atributosInformativosFromTemplate,
      variants: [],
    }

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        setItems([newItem, ...items])
        handleClose()
        return newItem
      } else {
        console.error("[v0] Failed to create item with variants")
        alert("Error al crear el item con variantes")
        return null
      }
    } catch (error) {
      console.error("[v0] Error creating item with variants:", error)
      alert("Error al crear el item con variantes")
      return null
    } finally {
      setIsCreatingItem(false)
    }
  }

  const updateItem = async (updatedItem: Item) => {
    try {
      const response = await fetch(`/api/items/${updatedItem.sku}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      })

      if (response.ok) {
        setItems((prevItems) => prevItems.map((item) => (item.sku === updatedItem.sku ? updatedItem : item)))
      } else {
        console.error("[v0] Failed to update item")
        alert("Error al actualizar el item")
      }
    } catch (error) {
      console.error("[v0] Error updating item:", error)
      alert("Error al actualizar el item")
    }
  }

  const deleteItem = (itemToDelete: Item) => {
    console.log("[v0] useItems - deleteItem called for:", itemToDelete.name)
    const originalIndex = items.findIndex((item) => item.sku === itemToDelete.sku)
    console.log("[v0] useItems - originalIndex:", originalIndex)
    setDeletedItems((prev) => {
      const newDeleted = [...prev, { item: itemToDelete, originalIndex }]
      console.log("[v0] useItems - setDeletedItems, new count:", newDeleted.length)
      return newDeleted
    })
    setItems((prevItems) => prevItems.filter((item) => item.sku !== itemToDelete.sku))
    console.log("[v0] useItems - setting hasUnsavedDeletes to true")
    setHasUnsavedDeletes(true)
  }

  const undoDelete = () => {
    if (deletedItems.length === 0) return

    console.log("[v0] useItems - undoDelete called")
    setItems((prevItems) => {
      const newItems = [...prevItems]
      const sortedDeleted = [...deletedItems].sort((a, b) => a.originalIndex - b.originalIndex)

      sortedDeleted.forEach(({ item, originalIndex }) => {
        newItems.splice(originalIndex, 0, item)
      })

      return newItems
    })

    setDeletedItems([])
    setHasUnsavedDeletes(false)
  }

  const saveDelete = async () => {
    if (deletedItems.length === 0) return

    console.log("[v0] useItems - saveDelete called")
    try {
      const skus = deletedItems.map(({ item }) => item.sku)

      const response = await fetch("/api/items/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete items")
      }

      setDeletedItems([])
      setHasUnsavedDeletes(false)
    } catch (error) {
      console.error("Error deleting items:", error)
      undoDelete()
      alert("Error al eliminar los items")
    }
  }

  return {
    items,
    setItems,
    depositStock,
    setDepositStock,
    updateDepositStock,
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    updateItem,
    isLoading,
    deleteItem,
    undoDelete,
    saveDelete,
    hasUnsavedDeletes,
    deletedItems,
    isCreatingItem,
  }
}
