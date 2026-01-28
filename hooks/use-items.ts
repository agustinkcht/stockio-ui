"use client"

import { useState, useEffect } from "react"
import { useAccount } from "@/lib/contexts/account-context"
import type { Item } from "@/lib/types"
import { TEMPLATES } from "@/lib/constants"
import { generateStandaloneSKU, generateParentSKU, generateUniqueSKU } from "@/lib/utils/sku-generator"

interface DeletedItemWithPosition {
  item: Item
  originalIndex: number
}

interface EditedItemState {
  itemSku: string
  parentSku?: string // Track if editing a child (variant)
  originalValues: Partial<Item>
  currentValues: Partial<Item>
}

async function loadInitialItems(dataSet: string): Promise<Item[]> {
  if (dataSet === "noire") {
    const { INITIAL_ITEMS } = await import("@/lib/data/initial-items-noire")
    return INITIAL_ITEMS
  }
  // Default to invino
  const { INITIAL_ITEMS } = await import("@/lib/data/initial-items-invino")
  return INITIAL_ITEMS
}

export function useItems() {
  const { currentAccount, currentUser } = useAccount()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletedItems, setDeletedItems] = useState<DeletedItemWithPosition[]>([])
  const [hasUnsavedDeletes, setHasUnsavedDeletes] = useState(false)
  const [isCreatingItem, setIsCreatingItem] = useState(false)

  const [editedItem, setEditedItem] = useState<EditedItemState | null>(null)
  const [lastUndoneEdit, setLastUndoneEdit] = useState<EditedItemState | null>(null)
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false)

  useEffect(() => {
    console.log("[v0] useItems - hasUnsavedDeletes changed to:", hasUnsavedDeletes)
    console.log("[v0] useItems - deletedItems count:", deletedItems.length)
  }, [hasUnsavedDeletes, deletedItems])

  useEffect(() => {
    console.log("[v0] useItems - hasUnsavedEdits changed to:", hasUnsavedEdits)
    console.log("[v0] useItems - editedItem:", editedItem?.itemSku)
  }, [hasUnsavedEdits, editedItem])

  const USE_MOCK_DATA = true

  const getStorageKey = () => {
    return `stockio-items-${currentAccount}`
  }

  useEffect(() => {
    const fetchItems = async () => {
      if (!currentUser) {
        setIsLoading(false)
        return
      }

      if (USE_MOCK_DATA) {
        try {
          const storageKey = getStorageKey()
          const storedItems = localStorage.getItem(storageKey)

          if (storedItems) {
            const parsedItems = JSON.parse(storedItems)
            console.log(
              `[v0] useItems - Loaded ${parsedItems.length} items from localStorage for account ${currentAccount}`,
            )
            setItems(parsedItems)
          } else {
            const INITIAL_ITEMS =
              currentAccount === "noire"
                ? await import("@/lib/data/initial-items-noire")
                : await import("@/lib/data/initial-items-invino")
            console.log(
              `[v0] useItems - Loading ${INITIAL_ITEMS.INITIAL_ITEMS.length} initial items for dataSet: ${currentAccount}`,
            )

            const itemsWithCounts = INITIAL_ITEMS.INITIAL_ITEMS.map((item: Item) => ({
              ...item,
              variantCount: item.variants?.length || 0,
              itemCount: item.items?.length || 0,
            }))

            localStorage.setItem(storageKey, JSON.stringify(itemsWithCounts))
            console.log(
              `[v0] useItems - Saved ${itemsWithCounts.length} items to localStorage for account ${currentAccount}`,
            )

            setItems(itemsWithCounts)
          }
        } catch (error) {
          console.error("[v0] Error loading items:", error)
          setItems([])
        }
        setIsLoading(false)
        return
      }
      try {
        const response = await fetch("/api/items")

        if (response.ok) {
          const data = await response.json()
          setItems(data)
        } else {
          setItems([])
        }
      } catch (error) {
        setItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [currentUser, currentAccount])

  const updateStock = (itemSku: string, field: "total" | "reservado", value: number) => {
    // First check if it's a top-level item
    let item = items.find((i) => i.sku === itemSku)
    let parentItem: Item | undefined = undefined
    let isVariant = false

    // If not found at top level, search in variants
    if (!item) {
      for (const parent of items) {
        if (parent.variants) {
          const variant = parent.variants.find((v: any) => v.sku === itemSku)
          if (variant) {
            item = variant as any
            parentItem = parent
            isVariant = true
            break
          }
        }
      }
    }

    if (!item) return

    const currentStock = item.stock || { total: "0", reservado: "0", disponible: "0" }
    const currentTotal = Number.parseInt(currentStock.total || "0")
    const currentReservado = Number.parseInt(currentStock.reservado || "0")

    const newTotal = field === "total" ? value : currentTotal
    const newReservado = field === "reservado" ? value : currentReservado
    const newDisponible = newTotal - newReservado

    const newStock = {
      total: newTotal.toString(),
      reservado: newReservado.toString(),
      disponible: newDisponible.toString(),
    }

    if (isVariant && parentItem) {
      editVariantField(parentItem.sku!, itemSku, "stock", newStock)
    } else {
      // For standalone items, use regular editField
      editField(itemSku, "stock", newStock)
    }
  }

  const handleCreateNuevoItem = async (itemTitulo: string, itemTemplate: string, handleClose: () => void) => {
    if (!itemTitulo.trim()) {
      alert("El título es obligatorio")
      return null
    }

    setIsCreatingItem(true)

    const existingSkus = items.map((item) => item.sku)
    const baseSku = generateStandaloneSKU({ title: itemTitulo })
    const sku = generateUniqueSKU(baseSku, existingSkus)

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
      sku: sku,
      codigoUniversal: generateCodigoUniversal().toString(),
      marca: "",
      modelo: "",
      formatoVenta: "unidad",
      proveedor: "",
      codigoProveedor: "",
      atributosPrincipales: atributosPrincipalesFromTemplate,
      atributosInformativos: atributosInformativosFromTemplate,
      variantCount: 0,
      itemCount: 0,
    }

    try {
      if (USE_MOCK_DATA) {
        const updatedItems = [newItem, ...items]
        localStorage.setItem(getStorageKey(), JSON.stringify(updatedItems))
        console.log("[v0] Saved new item to localStorage:", newItem.sku)
        setItems(updatedItems)
        handleClose()
        return newItem
      }

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

    const existingSkus = items.map((item) => item.sku)
    const baseSku = generateParentSKU({ title: itemTitulo })
    const sku = generateUniqueSKU(baseSku, existingSkus)

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
      sku: sku,
      codigoUniversal: generateCodigoUniversal().toString(),
      marca: "",
      modelo: "",
      formatoVenta: "unidad",
      proveedor: "",
      codigoProveedor: "",
      containerAtributosPrincipales: containerAtributosPrincipalesFromTemplate,
      atributosInformativos: atributosInformativosFromTemplate,
      variants: [],
      variantCount: 0,
      itemCount: 0,
    }

    try {
      if (USE_MOCK_DATA) {
        const updatedItems = [newItem, ...items]
        localStorage.setItem(getStorageKey(), JSON.stringify(updatedItems))
        console.log("[v0] Saved new item with variants to localStorage:", newItem.sku)
        setItems(updatedItems)
        handleClose()
        return newItem
      }

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
      if (USE_MOCK_DATA) {
        localStorage.setItem(getStorageKey(), JSON.stringify(items))
        console.log("[v0] Updated localStorage after deletion, remaining items:", items.length)
        setDeletedItems([])
        setHasUnsavedDeletes(false)
        return
      }

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

  const editField = (itemSku: string, field: string, newValue: any) => {
    console.log("[v0] useItems - editField called:", { itemSku, field, newValue })

    let parentItem: Item | undefined = undefined
    for (const item of items) {
      if (item.variants) {
        const variant = item.variants.find((v: any) => v.sku === itemSku)
        if (variant) {
          parentItem = item
          break
        }
      }
    }

    if (parentItem) {
      // This is a child item - use editVariantField instead
      editVariantField(parentItem.sku!, itemSku, field, newValue)
      return
    }

    // Regular top-level item edit
    if (!editedItem || editedItem.itemSku !== itemSku) {
      const originalItem = items.find((item) => item.sku === itemSku)
      if (!originalItem) return

      setEditedItem({
        itemSku,
        originalValues: { ...originalItem },
        currentValues: { ...originalItem, [field]: newValue },
      })
      console.log("[v0] useItems - captured original state for:", itemSku)
    } else {
      setEditedItem({
        ...editedItem,
        currentValues: { ...editedItem.currentValues, [field]: newValue },
      })
    }

    setHasUnsavedEdits(true)
    setLastUndoneEdit(null)

    setItems((prevItems) => prevItems.map((item) => (item.sku === itemSku ? { ...item, [field]: newValue } : item)))
  }

  const editVariantField = (parentSku: string, variantSku: string, field: string, newValue: any) => {
    console.log("[v0] useItems - editVariantField called:", { parentSku, variantSku, field, newValue })

    const parentItem = items.find((item) => item.sku === parentSku)
    if (!parentItem || !parentItem.variants) return

    const variantIndex = parentItem.variants.findIndex((v: any) => v.sku === variantSku)
    if (variantIndex === -1) return

    const originalVariant = parentItem.variants[variantIndex]

    if (!editedItem || editedItem.itemSku !== variantSku) {
      setEditedItem({
        itemSku: variantSku,
        parentSku: parentSku,
        originalValues: { ...originalVariant },
        currentValues: { ...originalVariant, [field]: newValue },
      })
      console.log("[v0] useItems - captured original variant state for:", variantSku)
    } else {
      setEditedItem({
        ...editedItem,
        currentValues: { ...editedItem.currentValues, [field]: newValue },
      })
    }

    setHasUnsavedEdits(true)
    setLastUndoneEdit(null)

    // Update the variant within the parent's variants array
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.sku === parentSku && item.variants) {
          const updatedVariants = item.variants.map((v: any) =>
            v.sku === variantSku ? { ...v, [field]: newValue } : v,
          )
          return { ...item, variants: updatedVariants }
        }
        return item
      }),
    )
  }

  const updateParentWithVariants = (parentSku: string, updates: Partial<Item>) => {
    console.log("[v0] useItems - updateParentWithVariants called:", { parentSku, updates })

    const parentItem = items.find((item) => item.sku === parentSku)
    if (!parentItem) return

    if (!editedItem || editedItem.itemSku !== parentSku) {
      setEditedItem({
        itemSku: parentSku,
        originalValues: { ...parentItem },
        currentValues: { ...parentItem, ...updates },
      })
    } else {
      setEditedItem({
        ...editedItem,
        currentValues: { ...editedItem.currentValues, ...updates },
      })
    }

    setHasUnsavedEdits(true)
    setLastUndoneEdit(null)

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.sku === parentSku) {
          return { ...item, ...updates }
        }
        return item
      }),
    )
  }

  const undoEdit = () => {
    if (!editedItem) return

    console.log("[v0] useItems - undoEdit called for:", editedItem.itemSku)

    setLastUndoneEdit(editedItem)

    if (editedItem.parentSku) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.sku === editedItem.parentSku && item.variants) {
            const updatedVariants = item.variants.map((v: any) =>
              v.sku === editedItem.itemSku ? { ...v, ...editedItem.originalValues } : v,
            )
            return { ...item, variants: updatedVariants }
          }
          return item
        }),
      )
    } else {
      setItems((prevItems) =>
        prevItems.map((item) => (item.sku === editedItem.itemSku ? { ...item, ...editedItem.originalValues } : item)),
      )
    }

    setEditedItem(null)
    setLastUndoneEdit(null)
    setHasUnsavedEdits(false)
  }

  const redoEdit = () => {
    if (!lastUndoneEdit) return

    console.log("[v0] useItems - redoEdit called for:", lastUndoneEdit.itemSku)

    if (lastUndoneEdit.parentSku) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.sku === lastUndoneEdit.parentSku && item.variants) {
            const updatedVariants = item.variants.map((v: any) =>
              v.sku === lastUndoneEdit.itemSku ? { ...v, ...lastUndoneEdit.currentValues } : v,
            )
            return { ...item, variants: updatedVariants }
          }
          return item
        }),
      )
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.sku === lastUndoneEdit.itemSku ? { ...item, ...lastUndoneEdit.currentValues } : item,
        ),
      )
    }

    setEditedItem(lastUndoneEdit)
    setLastUndoneEdit(null)
    setHasUnsavedEdits(true)
  }

  const saveEdit = () => {
    if (!editedItem) return

    console.log("[v0] useItems - saveEdit called for:", editedItem.itemSku)

    localStorage.setItem(getStorageKey(), JSON.stringify(items))
    console.log("[v0] useItems - saved edits to localStorage")

    setEditedItem(null)
    setLastUndoneEdit(null)
    setHasUnsavedEdits(false)
  }

  // Force save current items state to localStorage (for audit mode bulk saves)
  const forceSaveItems = () => {
    localStorage.setItem(getStorageKey(), JSON.stringify(items))
    console.log("[v0] useItems - forceSaveItems to localStorage, items count:", items.length)
    setEditedItem(null)
    setLastUndoneEdit(null)
    setHasUnsavedEdits(false)
  }

  // Bulk save stock changes (for audit mode)
  const bulkSaveStock = (changes: Record<string, { total: number; reservado: number }>) => {
    console.log("[v0] useItems - bulkSaveStock called with changes:", Object.keys(changes).length)
    
    // Apply all changes to items
    const updatedItems = items.map(item => {
      // Check if this item has a change
      if (changes[item.sku]) {
        const { total, reservado } = changes[item.sku]
        return {
          ...item,
          stock: {
            total: total.toString(),
            reservado: reservado.toString(),
            disponible: (total - reservado).toString()
          }
        }
      }
      
      // Check if any variants have changes
      if (item.variants) {
        const updatedVariants = item.variants.map((variant: any) => {
          if (changes[variant.sku]) {
            const { total, reservado } = changes[variant.sku]
            return {
              ...variant,
              stock: {
                total: total.toString(),
                reservado: reservado.toString(),
                disponible: (total - reservado).toString()
              }
            }
          }
          return variant
        })
        return { ...item, variants: updatedVariants }
      }
      
      return item
    })
    
    // Update state and persist to localStorage immediately
    setItems(updatedItems)
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedItems))
    console.log("[v0] useItems - bulkSaveStock persisted to localStorage")
    
    // Clear edit state
    setEditedItem(null)
    setLastUndoneEdit(null)
    setHasUnsavedEdits(false)
  }

  const cancelEdit = () => {
    if (!editedItem) return

    console.log("[v0] useItems - cancelEdit called for:", editedItem.itemSku)

    setItems((prevItems) =>
      prevItems.map((item) => (item.sku === editedItem.itemSku ? { ...item, ...editedItem.originalValues } : item)),
    )

    setEditedItem(null)
    setLastUndoneEdit(null)
    setHasUnsavedEdits(false)
  }

  const canUndoEdit = editedItem !== null
  const canRedoEdit = lastUndoneEdit !== null

  const reduceStock = (itemSku: string, quantityToReduce: number, parentSku?: string) => {
    console.log("[v0] useItems - reduceStock called:", { itemSku, quantityToReduce, parentSku })

    const storageKey = getStorageKey()
    const storedItems = localStorage.getItem(storageKey)
    if (!storedItems) return

    const currentItems: Item[] = JSON.parse(storedItems)

    let updated = false
    const updatedItems = currentItems.map((item) => {
      if (parentSku) {
        // It's a variant
        if (item.sku === parentSku && item.variants) {
          const updatedVariants = item.variants.map((v: any) => {
            if (v.sku === itemSku) {
              const currentTotal = Number.parseInt(v.stock?.total || "0", 10)
              const currentReservado = Number.parseInt(v.stock?.reservado || "0", 10)
              const newTotal = Math.max(0, currentTotal - quantityToReduce)
              const newDisponible = Math.max(0, newTotal - currentReservado)
              console.log(
                `[v0] useItems - reduceStock variant ${itemSku}: total ${currentTotal} -> ${newTotal}, disponible -> ${newDisponible}`,
              )
              updated = true
              return {
                ...v,
                stock: {
                  total: newTotal.toString(),
                  reservado: currentReservado.toString(),
                  disponible: newDisponible.toString(),
                },
              }
            }
            return v
          })
          return { ...item, variants: updatedVariants }
        }
      } else {
        // It's a standalone item
        if (item.sku === itemSku) {
          const currentTotal = Number.parseInt(item.stock?.total || "0", 10)
          const currentReservado = Number.parseInt(item.stock?.reservado || "0", 10)
          const newTotal = Math.max(0, currentTotal - quantityToReduce)
          const newDisponible = Math.max(0, newTotal - currentReservado)
          console.log(
            `[v0] useItems - reduceStock item ${itemSku}: total ${currentTotal} -> ${newTotal}, disponible -> ${newDisponible}`,
          )
          updated = true
          return {
            ...item,
            stock: {
              total: newTotal.toString(),
              reservado: currentReservado.toString(),
              disponible: newDisponible.toString(),
            },
          }
        }
      }
      return item
    })

    if (updated) {
      // Immediately persist to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedItems))
      console.log("[v0] useItems - reduceStock persisted to localStorage")

      // Update React state to reflect the change
      setItems(updatedItems)
    }
  }

  const increaseStock = (itemSku: string, quantityToAdd: number, parentSku?: string) => {
    console.log("[v0] useItems - increaseStock called:", { itemSku, quantityToAdd, parentSku })

    const storageKey = getStorageKey()
    const storedItems = localStorage.getItem(storageKey)
    if (!storedItems) return

    const currentItems: Item[] = JSON.parse(storedItems)

    let updated = false
    const updatedItems = currentItems.map((item) => {
      if (parentSku) {
        // It's a variant
        if (item.sku === parentSku && item.variants) {
          const updatedVariants = item.variants.map((v: any) => {
            if (v.sku === itemSku) {
              const currentTotal = Number.parseInt(v.stock?.total || "0", 10)
              const currentReservado = Number.parseInt(v.stock?.reservado || "0", 10)
              const newTotal = currentTotal + quantityToAdd
              const newDisponible = newTotal - currentReservado
              console.log(
                `[v0] useItems - increaseStock variant ${itemSku}: total ${currentTotal} -> ${newTotal}, disponible -> ${newDisponible}`,
              )
              updated = true
              return {
                ...v,
                stock: {
                  total: newTotal.toString(),
                  reservado: currentReservado.toString(),
                  disponible: newDisponible.toString(),
                },
              }
            }
            return v
          })
          return { ...item, variants: updatedVariants }
        }
      } else {
        // It's a standalone item
        if (item.sku === itemSku) {
          const currentTotal = Number.parseInt(item.stock?.total || "0", 10)
          const currentReservado = Number.parseInt(item.stock?.reservado || "0", 10)
          const newTotal = currentTotal + quantityToAdd
          const newDisponible = newTotal - currentReservado
          console.log(
            `[v0] useItems - increaseStock item ${itemSku}: total ${currentTotal} -> ${newTotal}, disponible -> ${newDisponible}`,
          )
          updated = true
          return {
            ...item,
            stock: {
              total: newTotal.toString(),
              reservado: currentReservado.toString(),
              disponible: newDisponible.toString(),
            },
          }
        }
      }
      return item
    })

    if (updated) {
      // Immediately persist to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedItems))
      console.log("[v0] useItems - increaseStock persisted to localStorage")

      // Update React state to reflect the change
      setItems(updatedItems)
    }
  }

  const updatePricing = (
    itemSku: string,
    pricingData: { costo?: number; margen?: number; iva?: number; precioFinal?: number },
    parentSku?: string,
  ) => {
    console.log("[v0] useItems - updatePricing called:", { itemSku, pricingData, parentSku })

    const storageKey = getStorageKey()
    const storedItems = localStorage.getItem(storageKey)
    if (!storedItems) return

    const currentItems: Item[] = JSON.parse(storedItems)

    let updated = false
    const updatedItems = currentItems.map((item) => {
      if (parentSku) {
        // It's a variant
        if (item.sku === parentSku && item.variants) {
          const updatedVariants = item.variants.map((v: any) => {
            if (v.sku === itemSku) {
              const currentPrecio = v.precio || { costo: 0, margen: 0, iva: 21, precioFinal: 0 }
              const newCosto = pricingData.costo !== undefined ? pricingData.costo : currentPrecio.costo
              const newMargen = pricingData.margen !== undefined ? pricingData.margen : currentPrecio.margen
              const newIva = pricingData.iva !== undefined ? pricingData.iva : currentPrecio.iva

              // Calculate precioFinal if not provided
              let newPrecioFinal = pricingData.precioFinal
              if (newPrecioFinal === undefined) {
                const costoConMargen = newCosto * (1 + newMargen / 100)
                newPrecioFinal = Math.round(costoConMargen * (1 + newIva / 100))
              }

              console.log(`[v0] useItems - updatePricing variant ${itemSku}:`, {
                costo: `${currentPrecio.costo} -> ${newCosto}`,
                margen: `${currentPrecio.margen} -> ${newMargen}`,
                iva: `${currentPrecio.iva} -> ${newIva}`,
                precioFinal: `${currentPrecio.precioFinal} -> ${newPrecioFinal}`,
              })
              updated = true
              return {
                ...v,
                precio: {
                  costo: newCosto,
                  margen: Math.round(newMargen * 10) / 10,
                  iva: newIva,
                  precioFinal: Math.round(newPrecioFinal),
                },
              }
            }
            return v
          })
          return { ...item, variants: updatedVariants }
        }
      } else {
        // It's a standalone item
        if (item.sku === itemSku) {
          const currentPrecio = item.precio || { costo: 0, margen: 0, iva: 21, precioFinal: 0 }
          const newCosto = pricingData.costo !== undefined ? pricingData.costo : currentPrecio.costo
          const newMargen = pricingData.margen !== undefined ? pricingData.margen : currentPrecio.margen
          const newIva = pricingData.iva !== undefined ? pricingData.iva : currentPrecio.iva

          // Calculate precioFinal if not provided
          let newPrecioFinal = pricingData.precioFinal
          if (newPrecioFinal === undefined) {
            const costoConMargen = newCosto * (1 + newMargen / 100)
            newPrecioFinal = Math.round(costoConMargen * (1 + newIva / 100))
          }

          console.log(`[v0] useItems - updatePricing item ${itemSku}:`, {
            costo: `${currentPrecio.costo} -> ${newCosto}`,
            margen: `${currentPrecio.margen} -> ${newMargen}`,
            iva: `${currentPrecio.iva} -> ${newIva}`,
            precioFinal: `${currentPrecio.precioFinal} -> ${newPrecioFinal}`,
          })
          updated = true
          return {
            ...item,
            precio: {
              costo: newCosto,
              margen: Math.round(newMargen * 10) / 10,
              iva: newIva,
              precioFinal: Math.round(newPrecioFinal),
            },
          }
        }
      }
      return item
    })

    if (updated) {
      // Immediately persist to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedItems))
      console.log("[v0] useItems - updatePricing persisted to localStorage")

      // Update React state to reflect the change
      setItems(updatedItems)
    }
  }

  return {
    items,
    setItems,
    updateStock,
    depositStock: undefined, // Placeholder for deposit-level stock tracking
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
    editField,
    editVariantField, // Export new function
    updateParentWithVariants, // Export new function
    undoEdit,
    redoEdit,
    saveEdit,
    forceSaveItems,
    bulkSaveStock,
    cancelEdit,
    hasUnsavedEdits,
    canUndoEdit,
    canRedoEdit,
    editedItem,
    reduceStock, // Export the new function
    increaseStock,
    updatePricing,
  }
}
