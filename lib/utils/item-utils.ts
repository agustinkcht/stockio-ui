import type { Item, ItemVariant, ItemWithVariants } from "../types"

export function getItemDisplayName(item: Item): string {
  const attributes = []

  if (item.largo) attributes.push(item.largo)
  if (item.material && item.material !== "-") attributes.push(item.material)
  if (item.unidades) attributes.push(item.unidades)
  if (item.cadena) attributes.push(`Cadena ${item.cadena}`)

  if (attributes.length > 0) {
    return `${item.name} - ${attributes.join(" ")}`
  }

  return item.name
}

export function getMainAttributes(item: Item): string {
  const attrs = []
  if (item.largo) attrs.push(item.largo)
  if (item.material && item.material !== "-") attrs.push(item.material)
  if (item.unidades) attrs.push(item.unidades)
  if (item.cadena) attrs.push(`Cadena ${item.cadena}`)
  return attrs.join(" • ") || "-"
}

export function generateSkuPadre(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(" ")
    .map((word) => word.substring(0, 3))
    .join("-")
    .substring(0, 15)
}

export function getFilteredDropdownItems(items: string[], searchQuery: string): string[] {
  if (!searchQuery) return items
  return items.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
}

export function hasMatchingItems(items: string[], searchQuery: string): boolean {
  if (!searchQuery || !items) return false
  return items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
}

/**
 * Flexible search function that matches items across multiple fields
 * Supports partial matching and word combinations
 * Filters variants within agrupadores to only show matching ones
 *
 * Example: "pro malb" will match "Proemio Grand Reserve" + "Malbec" variant
 * Example: "absolut rasp" will show Absolut agrupador with only Raspberry variant
 */
export function searchItems(items: Item[], searchQuery: string): Item[] {
  if (!searchQuery || !searchQuery.trim()) return items

  // Split search query into individual words and normalize
  const searchWords = searchQuery
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  // Helper function to check if search words match against fields
  const matchesSearch = (fields: string[]): boolean => {
    const combinedText = fields.join(" ").toLowerCase()
    return searchWords.every((word) => combinedText.includes(word))
  }

  // Helper function to collect searchable fields from an item
  const getSearchableFields = (item: Item | ItemVariant): string[] => {
    const fields: string[] = []

    if (item.name) fields.push(item.name)
    if (item.sku) fields.push(item.sku)
    if (item.marca) fields.push(item.marca)
    if ("categoria" in item && item.categoria) fields.push(item.categoria)
    if ("modelo" in item && item.modelo) fields.push(item.modelo)
    if ("proveedor" in item && item.proveedor) fields.push(item.proveedor)

    if (item.atributosPrincipales) {
      item.atributosPrincipales.forEach((attr) => {
        fields.push(attr.key)
        fields.push(attr.value)
      })
    }

    if ("atributosInformativos" in item && item.atributosInformativos) {
      item.atributosInformativos.forEach((attr) => {
        fields.push(attr.key)
        fields.push(attr.value)
      })
    }

    return fields
  }

  const results: Item[] = []

  for (const item of items) {
    if (item.isAgrupador && item.items) {
      const matchingSubItems: (Item | ItemWithVariants)[] = []

      for (const subItem of item.items) {
        const subItemFields = getSearchableFields(subItem)

        if (subItem.hasVariants && subItem.variants) {
          const matchingVariants: ItemVariant[] = []

          for (const variant of subItem.variants) {
            const variantFields = getSearchableFields(variant)
            const combinedFields = [...subItemFields, ...variantFields]

            if (matchesSearch(combinedFields)) {
              matchingVariants.push(variant)
            }
          }

          if (matchingVariants.length > 0) {
            matchingSubItems.push({
              ...subItem,
              variants: matchingVariants,
              variantCount: matchingVariants.length,
            })
          }
        } else {
          if (matchesSearch(subItemFields)) {
            matchingSubItems.push(subItem)
          }
        }
      }

      if (matchingSubItems.length > 0) {
        results.push({
          ...item,
          items: matchingSubItems,
          itemCount: matchingSubItems.length,
        })
      }
    } else if (item.hasVariants && item.variants) {
      const baseFields = getSearchableFields(item)
      const matchingVariants: ItemVariant[] = []

      for (const variant of item.variants) {
        const variantFields = getSearchableFields(variant)
        const combinedFields = [...baseFields, ...variantFields]

        if (matchesSearch(combinedFields)) {
          matchingVariants.push(variant)
        }
      }

      if (matchingVariants.length > 0) {
        results.push({
          ...item,
          variants: matchingVariants,
          variantCount: matchingVariants.length,
        })
      }
    } else {
      const itemFields = getSearchableFields(item)
      if (matchesSearch(itemFields)) {
        results.push(item)
      }
    }
  }

  return results
}
