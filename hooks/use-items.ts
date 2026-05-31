"use client"

import { useState, useEffect } from "react"
import { useAccount } from "@/lib/contexts/account-context"
import type { Item } from "@/lib/types"
import { TEMPLATES } from "@/lib/constants"
import { generateStandaloneSKU, generateParentSKU, generateUniqueSKU } from "@/lib/utils/sku-generator"
import { generateId } from "@/lib/utils/item-utils"

interface DeletedItemWithPosition {
  item: Item
  originalIndex: number
}

// Helper to validate an item is a proper object with required fields
const isValidItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false
  if (!item.id && !item.sku) return false
  if (!item.name || item.name.trim() === '') return false
  return true
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
            // Filter out invalid items
            const validItems = parsedItems.filter(isValidItem)
            console.log(
              `[v0] useItems - Loaded ${validItems.length} valid items from localStorage (${parsedItems.length - validItems.length} invalid items filtered out) for account ${currentAccount}`,
            )
            // If we filtered out invalid items, save the clean list back
            if (validItems.length !== parsedItems.length) {
              localStorage.setItem(storageKey, JSON.stringify(validItems))
              console.log(`[v0] useItems - Saved cleaned items list to localStorage`)
            }
            setItems(validItems)
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

  const updateStock = (itemId: string, field: "total" | "reservado", value: number) => {
    // First check if it's a top-level item (search by id first, then sku)
    let item = items.find((i) => i.id === itemId || i.sku === itemId)
    let parentItem: Item | undefined = undefined
    let isVariant = false

    // If not found at top level, search in variants (by id first, then sku)
    if (!item) {
      for (const parent of items) {
        if (parent.variants) {
          const variant = parent.variants.find((v: any) => v.id === itemId || v.sku === itemId)
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
      // Use parent's id first (preferred for newly created items), fallback to sku
      const parentIdentifier = parentItem.id || parentItem.sku
      if (parentIdentifier) {
        editVariantField(parentIdentifier, itemId, "stock", newStock)
      }
    } else {
      // For standalone items, use regular editField
      editField(itemId, "stock", newStock)
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
      id: generateId("STA"),
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
      id: generateId("PAR"),
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
    const originalIndex = items.findIndex((item) => item.id === itemToDelete.id || item.sku === itemToDelete.sku)
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
        // Filter out any invalid items before saving
        const validItems = items.filter(isValidItem)
        localStorage.setItem(getStorageKey(), JSON.stringify(validItems))
        console.log("[v0] Updated localStorage after deletion, remaining valid items:", validItems.length)
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

    // itemSku can be a SKU or an ID for children
    let parentItem: Item | undefined = undefined
    let variantId: string | undefined = undefined
    for (const item of items) {
      if (item.variants) {
        // Search by id first (preferred for children), then by sku
        const variant = item.variants.find((v: any) => v.id === itemSku || v.sku === itemSku)
        if (variant) {
          parentItem = item
          variantId = variant.id
          break
        }
      }
    }

  if (parentItem && variantId) {
    // This is a child item - use editVariantField with id
    const parentIdentifier = parentItem.id || parentItem.sku
    if (parentIdentifier) {
      editVariantField(parentIdentifier, variantId, field, newValue)
    }
    return
  }

    // Regular top-level item edit - find by id first, then sku
    const originalItem = items.find((item) => item.id === itemSku || item.sku === itemSku)
    if (!originalItem) return

    const itemId = originalItem.id || originalItem.sku
    
    if (!editedItem || editedItem.itemSku !== itemId) {
      setEditedItem({
        itemSku: itemId!,
        originalValues: { ...originalItem },
        currentValues: { ...originalItem, [field]: newValue },
      })
      console.log("[v0] useItems - captured original state for:", itemId)
    } else {
      setEditedItem({
        ...editedItem,
        currentValues: { ...editedItem.currentValues, [field]: newValue },
      })
    }

    setHasUnsavedEdits(true)
    setLastUndoneEdit(null)

    setItems((prevItems) => prevItems.map((item) => (item.id === itemSku || item.sku === itemSku ? { ...item, [field]: newValue } : item)))
  }

  const editVariantField = (parentSku: string, variantId: string, field: string, newValue: any) => {
    console.log("[v0] useItems - editVariantField called:", { parentSku, variantId, field, newValue })

    // Find parent by id first, then sku
    const parentItem = items.find((item) => item.id === parentSku || item.sku === parentSku)
    if (!parentItem || !parentItem.variants) return

    // Find variant by id (preferred) or sku as fallback
    const variantIndex = parentItem.variants.findIndex((v: any) => v.id === variantId || v.sku === variantId)
    if (variantIndex === -1) return

    const originalVariant = parentItem.variants[variantIndex]

    if (!editedItem || editedItem.itemSku !== variantId) {
      setEditedItem({
        itemSku: variantId,
        parentSku: parentSku,
        originalValues: { ...originalVariant },
        currentValues: { ...originalVariant, [field]: newValue },
      })
      console.log("[v0] useItems - captured original variant state for:", variantId)
    } else {
      setEditedItem({
        ...editedItem,
        currentValues: { ...editedItem.currentValues, [field]: newValue },
      })
    }

    setHasUnsavedEdits(true)
    setLastUndoneEdit(null)

    // Update the variant within the parent's variants array by id
    setItems((prevItems) =>
      prevItems.map((item) => {
        if ((item.id === parentSku || item.sku === parentSku) && item.variants) {
          const updatedVariants = item.variants.map((v: any) =>
            v.id === variantId || v.sku === variantId ? { ...v, [field]: newValue } : v,
          )
          return { ...item, variants: updatedVariants }
        }
        return item
      }),
    )
  }

  const updateParentWithVariants = (parentSku: string, updates: Partial<Item>) => {
    console.log("[v0] useItems - updateParentWithVariants called:", { parentSku, updates })

    const parentItem = items.find((item) => item.id === parentSku || item.sku === parentSku)
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
        if (item.id === parentSku || item.sku === parentSku) {
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
          if ((item.id === editedItem.parentSku || item.sku === editedItem.parentSku) && item.variants) {
            const updatedVariants = item.variants.map((v: any) =>
              v.id === editedItem.itemSku || v.sku === editedItem.itemSku ? { ...v, ...editedItem.originalValues } : v,
            )
            return { ...item, variants: updatedVariants }
          }
          return item
        }),
      )
    } else {
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === editedItem.itemSku || item.sku === editedItem.itemSku ? { ...item, ...editedItem.originalValues } : item)),
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
          if ((item.id === lastUndoneEdit.parentSku || item.sku === lastUndoneEdit.parentSku) && item.variants) {
            const updatedVariants = item.variants.map((v: any) =>
              v.id === lastUndoneEdit.itemSku || v.sku === lastUndoneEdit.itemSku ? { ...v, ...lastUndoneEdit.currentValues } : v,
            )
            return { ...item, variants: updatedVariants }
          }
          return item
        }),
      )
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === lastUndoneEdit.itemSku || item.sku === lastUndoneEdit.itemSku ? { ...item, ...lastUndoneEdit.currentValues } : item,
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

    // Filter out any invalid items before saving
    const validItems = items.filter(isValidItem)
    localStorage.setItem(getStorageKey(), JSON.stringify(validItems))
    console.log("[v0] useItems - saved edits to localStorage, valid items:", validItems.length)

    setEditedItem(null)
    setLastUndoneEdit(null)
    setHasUnsavedEdits(false)
  }

  // Force save current items state to localStorage (for audit mode bulk saves)
  const forceSaveItems = () => {
    // Filter out any invalid items before saving
    const validItems = items.filter(isValidItem)
    localStorage.setItem(getStorageKey(), JSON.stringify(validItems))
    console.log("[v0] useItems - forceSaveItems to localStorage, valid items count:", validItems.length)
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
      prevItems.map((item) => (item.id === editedItem.itemSku || item.sku === editedItem.itemSku ? { ...item, ...editedItem.originalValues } : item)),
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

  const adjustStock = (itemSku: string, delta: number, parentSku?: string) => {
    const storageKey = getStorageKey()
    const storedItems = localStorage.getItem(storageKey)
    if (!storedItems) return

    const currentItems: Item[] = JSON.parse(storedItems)
    let updated = false

    const updatedItems = currentItems.map((item) => {
      if (parentSku) {
        if (item.sku === parentSku && item.variants) {
          const updatedVariants = item.variants.map((v: any) => {
            if (v.sku === itemSku) {
              const currentTotal = Number.parseInt(v.stock?.total || "0", 10)
              const currentReservado = Number.parseInt(v.stock?.reservado || "0", 10)
              const newTotal = Math.max(0, currentTotal + delta)
              const newDisponible = Math.max(0, newTotal - currentReservado)
              updated = true
              return { ...v, stock: { total: newTotal.toString(), reservado: currentReservado.toString(), disponible: newDisponible.toString() } }
            }
            return v
          })
          return { ...item, variants: updatedVariants }
        }
      } else {
        if (item.sku === itemSku) {
          const currentTotal = Number.parseInt(item.stock?.total || "0", 10)
          const currentReservado = Number.parseInt(item.stock?.reservado || "0", 10)
          const newTotal = Math.max(0, currentTotal + delta)
          const newDisponible = Math.max(0, newTotal - currentReservado)
          updated = true
          return { ...item, stock: { total: newTotal.toString(), reservado: currentReservado.toString(), disponible: newDisponible.toString() } }
        }
      }
      return item
    })

    if (updated) {
      localStorage.setItem(storageKey, JSON.stringify(updatedItems))
      setItems(updatedItems)
    }
  }

  const increaseStock = (itemSku: string, quantityToAdd: number, parentSku?: string) =>
    adjustStock(itemSku, quantityToAdd, parentSku)

  const decreaseStock = (itemSku: string, quantityToRemove: number, parentSku?: string) =>
    adjustStock(itemSku, -quantityToRemove, parentSku)

  const updatePricing = (
    itemSku: string,
    pricingData: { costo?: number; margen?: number; iva?: number; precioFinal?: number },
    parentSku?: string,
    costoBehavior?: "preserveMargen" | "preservePrecioFinal",
  ) => {
    const storageKey = getStorageKey()
    const storedItems = localStorage.getItem(storageKey)
    if (!storedItems) return

    // Helper: recalculate the derived field based on behavior
    // When only costo changes: respects costoBehavior setting
    // - preserveMargen (default): keep margen, update precioFinal
    // - preservePrecioFinal: keep precioFinal, update margen
    const applyCosting = (
      current: { costo: number; margen: number; iva: number; precioFinal: number },
      data: { costo?: number; margen?: number; iva?: number; precioFinal?: number },
    ) => {
      const newCosto = data.costo !== undefined ? data.costo : current.costo
      const newIva = data.iva !== undefined ? data.iva : current.iva

      // If precioFinal is explicitly provided, just use it directly
      if (data.precioFinal !== undefined) {
        const newPF = data.precioFinal
        const newMargen = newCosto > 0 ? Math.round(((newPF / newCosto) - 1) * 1000) / 10 : current.margen
        return { costo: newCosto, margen: newMargen, iva: newIva, precioFinal: newPF }
      }

      // If margen is explicitly provided, recalculate precioFinal from it
      if (data.margen !== undefined) {
        const newMargen = data.margen
        const newPF = Math.round(newCosto * (1 + newMargen / 100))
        return { costo: newCosto, margen: newMargen, iva: newIva, precioFinal: newPF }
      }

      // Only costo changed — honor behavior setting
      const behavior = costoBehavior ?? "preserveMargen"
      if (behavior === "preservePrecioFinal") {
        // Keep precioFinal, recalculate margen
        const keptPF = current.precioFinal
        const newMargen = newCosto > 0 ? Math.round(((keptPF / newCosto) - 1) * 1000) / 10 : current.margen
        return { costo: newCosto, margen: newMargen, iva: newIva, precioFinal: keptPF }
      } else {
        // preserveMargen: keep margen, recalculate precioFinal
        const keptMargen = current.margen
        const newPF = Math.round(newCosto * (1 + keptMargen / 100))
        return { costo: newCosto, margen: keptMargen, iva: newIva, precioFinal: newPF }
      }
    }

    const currentItems: Item[] = JSON.parse(storedItems)

    let updated = false
    const updatedItems = currentItems.map((item) => {
      if (parentSku) {
        // It's a variant
        if (item.sku === parentSku && item.variants) {
          const updatedVariants = item.variants.map((v: any) => {
            if (v.sku === itemSku) {
              const currentPrecio = v.precio || { costo: 0, margen: 0, iva: 21, precioFinal: 0 }
              const newPrecio = applyCosting(currentPrecio, pricingData)
              updated = true
              return { ...v, precio: newPrecio }
            }
            return v
          })
          return { ...item, variants: updatedVariants }
        }
      } else {
        // It's a standalone item
        if (item.sku === itemSku) {
          const currentPrecio = item.precio || { costo: 0, margen: 0, iva: 21, precioFinal: 0 }
          const newPrecio = applyCosting(currentPrecio, pricingData)
          updated = true
          return { ...item, precio: newPrecio }
        }
      }
      return item
    })

    if (updated) {
      localStorage.setItem(storageKey, JSON.stringify(updatedItems))
      setItems(updatedItems)
    }
  }

  // Bulk create multiple standalone items at once
  const bulkCreateItems = (newItemsData: Array<{
  name: string
  sku?: string
  codigoUniversal?: string
  categoria?: string
  marca?: string
  formatoVenta?: string
  unidadesPorPack?: number
  volumenActive?: boolean
  volumenCantidad?: number | string
  volumenUnidad?: string
  vencimientoActive?: boolean
  fechaVencimiento?: string
  proveedor?: string
  codigoProveedor?: string
  descripcion?: string
  atributosPrincipales?: Array<{ key: string; value: string }>
  atributosInformativos?: Array<{ key: string; value: string }>
  stockTotal?: number
  stockReservado?: number
  imagenUrl?: string
  }>) => {
    const existingSkus = items.map((item) => item.sku)
    const newSkus: string[] = []
    
    const newItems: Item[] = newItemsData.map((data) => {
      // Generate unique SKU if not provided
      let sku = data.sku?.trim()
      if (!sku) {
        const baseSku = generateStandaloneSKU({ title: data.name })
        sku = generateUniqueSKU(baseSku, [...existingSkus, ...newSkus])
      } else {
        // Ensure provided SKU is unique
        sku = generateUniqueSKU(sku, [...existingSkus, ...newSkus])
      }
      newSkus.push(sku)
      
      // Generate codigo universal if not provided
      const codigoUniversal = data.codigoUniversal?.trim() || 
        (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString()
      
      // Calculate stock disponible
      const stockTotal = data.stockTotal ?? 0
      const stockReservado = data.stockReservado ?? 0
      const stockDisponible = stockTotal - stockReservado
      
  const newItem: Item = {
  name: data.name,
  sku,
  codigoUniversal,
  categoria: data.categoria || "",
  marca: data.marca || "",
  formatoVenta: data.formatoVenta || "unidad",
  unidadesPorPack: data.unidadesPorPack || 1,
  volumenActive: data.volumenActive || false,
  volumenCantidad: data.volumenCantidad ? Number(data.volumenCantidad) : undefined,
  volumenUnidad: data.volumenUnidad || undefined,
  vencimientoActive: data.vencimientoActive || false,
  fechaVencimiento: data.fechaVencimiento || undefined,
  proveedor: data.proveedor || "",
  codigoProveedor: data.codigoProveedor || "",
  descripcion: data.descripcion || "",
  stock: {
  total: stockTotal.toString(),
  reservado: stockReservado.toString(),
  disponible: stockDisponible.toString(),
  },
  hasVariants: false,
  isAgrupador: false,
  atributosPrincipales: data.atributosPrincipales?.filter(a => a.key && a.value) || [],
  atributosInformativos: data.atributosInformativos?.filter(a => a.key && a.value) || [],
  imagenUrl: data.imagenUrl || "",
  variantCount: 0,
  itemCount: 0,
  }
      
      return newItem
    })
    
    // Add all new items at the beginning of the list
    const updatedItems = [...newItems, ...items]
    
    // Persist to localStorage
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedItems))
    console.log(`[v0] bulkCreateItems - Created ${newItems.length} items and saved to localStorage`)
    
    // Update state
    setItems(updatedItems)
    
    return newItems
  }

  // Bulk create multiple items con variantes (agrupadores with their children)
  const bulkCreateItemsConVariantes = (newItemsData: Array<{
    name: string
    sku?: string
    codigoUniversal?: string
    categoria?: string
    marca?: string
    formatoVenta?: string
    unidadesPorPack?: number
    volumenActive?: boolean
    volumenCantidad?: string
    volumenUnidad?: string
    vencimientoActive?: boolean
    fechaVencimiento?: string
    proveedor?: string
    descripcion?: string
    imagenUrl?: string
    containerAtributosPrincipales?: Array<{ key: string; variantes: string[] }>
    atributosInformativos?: Array<{ key: string; value: string; inherit?: boolean }>
    variants?: Array<{
      sku: string
      codigoUniversal?: string
      descripcion?: string
      foto?: string
      atributosPrincipales: Array<{ key: string; value: string }>
      stock?: { total: string; reservado: string; disponible: string }
      codigoProveedor?: string
      atributosInformativos?: Array<{ key: string; value: string }>
    }>
  }>) => {
    const existingSkus = items.map((item) => item.sku)
    
    const newItems = newItemsData.map((data) => {
      // Generate unique SKU for parent if not provided
      let parentSku = data.sku || ""
      if (!parentSku) {
        const baseSku = data.name
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, "")
          .split(" ")
          .map((word) => word.substring(0, 3))
          .join("-")
          .substring(0, 15)
        parentSku = generateUniqueSKU(baseSku, existingSkus)
      } else {
        parentSku = generateUniqueSKU(parentSku, existingSkus)
      }
      existingSkus.push(parentSku)
      
      // Process variants
      const processedVariants = (data.variants || []).map((variant, index) => {
        // Generate variant SKU if not provided
        let variantSku = variant.sku
        if (!variantSku) {
          const suffix = variant.atributosPrincipales
            .map(a => a.value.substring(0, 3).toUpperCase())
            .join("-")
          variantSku = `${parentSku}-${suffix}`
        }
        variantSku = generateUniqueSKU(variantSku, existingSkus)
        existingSkus.push(variantSku)
        
        // Build variant name from parent name + atributos principales
        const variantNameSuffix = variant.atributosPrincipales
          .map(a => a.value)
          .join(" ")
        const variantName = variantNameSuffix ? `${data.name} ${variantNameSuffix}` : data.name
        
        return {
          id: variant.id || generateId("VAR"),
          sku: variantSku,
          name: variantName, // Add name to variant
          codigoUniversal: variant.codigoUniversal || "",
          descripcion: variant.descripcion || data.descripcion || "",
          categoria: data.categoria || "", // Inherit parent's categoria
          marca: data.marca || "", // Inherit parent's marca
          foto: variant.foto || data.imagenUrl || "",
          fechaVencimiento: data.fechaVencimiento || "", // Inherit parent's vencimiento
          atributosPrincipales: variant.atributosPrincipales || [],
          stock: variant.stock || { total: "0", reservado: "0", disponible: "0" },
          codigoProveedor: variant.codigoProveedor || "",
          atributosInformativos: variant.atributosInformativos || [],
        }
      })
      
      const newItem: Item = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        sku: parentSku,
        codigoUniversal: data.codigoUniversal || "",
        descripcion: data.descripcion || "",
        categoria: data.categoria || "",
        marca: data.marca || "",
        formatoVenta: (data.formatoVenta as "unidad" | "pack") || "unidad",
        unidadesPorPack: data.unidadesPorPack || 1,
        volumenActive: data.volumenActive || false,
        volumenCantidad: data.volumenCantidad ? Number(data.volumenCantidad) : undefined,
        volumenUnidad: data.volumenUnidad || undefined,
        vencimientoActive: data.vencimientoActive || false,
        fechaVencimiento: data.fechaVencimiento || undefined,
        proveedor: data.proveedor || "",
        codigoProveedor: "",
        stock: { total: "0", reservado: "0", disponible: "0" },
        isAgrupador: true,
        hasVariants: processedVariants.length > 0,
        containerAtributosPrincipales: data.containerAtributosPrincipales || [],
        atributosPrincipales: [],
        atributosInformativos: data.atributosInformativos?.map(a => ({ key: a.key, value: a.value, inheritValue: a.inherit })) || [],
        imagenUrl: data.imagenUrl || "",
        variantCount: processedVariants.length,
        itemCount: processedVariants.length,
        variants: processedVariants,
      }
      
      return newItem
    })
    
    // Add all new items at the beginning of the list
    const updatedItems = [...newItems, ...items]
    
    // Persist to localStorage
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedItems))
    console.log(`[v0] bulkCreateItemsConVariantes - Created ${newItems.length} agrupadores with variants and saved to localStorage`)
    
    // Update state
    setItems(updatedItems)
    
    return newItems
  }

  // Update isActive status for multiple items by their IDs
  const updateItemsActiveStatus = (itemIds: string[], isActive: boolean) => {
    const updatedItems = items.map((item) => {
      // Check if this item (standalone) matches
      if (itemIds.includes(item.id || item.sku || "")) {
        return { ...item, isActive }
      }
      
      // Check if any variants/children match
      if (item.variants && item.variants.length > 0) {
        const updatedVariants = item.variants.map((variant) => {
          if (itemIds.includes((variant as any).id || variant.sku || "")) {
            return { ...variant, isActive }
          }
          return variant
        })
        return { ...item, variants: updatedVariants }
      }
      
      if (item.items && item.items.length > 0) {
        const updatedChildren = item.items.map((child) => {
          if (itemIds.includes((child as any).id || (child as any).sku || "")) {
            return { ...child, isActive }
          }
          return child
        })
        return { ...item, items: updatedChildren }
      }
      
      return item
    })
    
    // Persist to localStorage
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedItems))
    setItems(updatedItems)
    console.log(`[v0] updateItemsActiveStatus - Updated ${itemIds.length} items to isActive=${isActive}`)
  }

  return {
    items,
    setItems,
    updateStock,
    depositStock: undefined, // Placeholder for deposit-level stock tracking
    handleCreateNuevoItem,
    handleCreateNuevoItemConVariantes,
    bulkCreateItems,
    bulkCreateItemsConVariantes,
    updateItem,
    updateItemsActiveStatus,
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
    decreaseStock,
    updatePricing,
  }
}
