import type {
  Item,
  ItemVariant,
  ItemWithVariants,
  SortFactor,
  SortFactorConfig,
  SortDirection,
  FilterConfig,
} from "../types"

/**
 * Generates a cryptographically random 7-character base-36 uppercase ID
 * prefixed by item type: STA (standalone), PAR (parent), VAR (child/variant).
 * Format: {PREFIX}{7 chars} e.g. "STA0GB8E5Z"
 */
export function generateId(type: "STA" | "PAR" | "VAR"): string {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  const code = bytes[0].toString(36).padStart(7, "0").toUpperCase()
  return `${type}${code}`
}

/**
 * Gets the full SKU for an item based on its type:
 * - Standalone items: returns `item.sku`
 * - Parent items: returns `item.skuPrefix` (not a "full" SKU, just the prefix)
 * - Child items (variants): returns `{parentSkuPrefix}-{variant.skuSuffix}`
 *
 * @param item - The item or variant to get the SKU for
 * @param parentSkuPrefix - Required for child items (variants) to compute full SKU
 * @returns The full SKU string, or undefined if not available
 */
export function getFullSku(
  item: Item | ItemVariant,
  parentSkuPrefix?: string | null
): string | undefined {
  // If parentSkuPrefix is provided, this is a child/variant
  if (parentSkuPrefix) {
    const variant = item as ItemVariant
    const suffix = variant.skuSuffix || variant.sku // fallback to sku for backwards compatibility
    if (suffix) {
      return `${parentSkuPrefix}-${suffix}`
    }
    return undefined
  }

  // For standalone or parent items
  const fullItem = item as Item

  // Standalone items use `sku` directly
  if (!fullItem.hasVariants && fullItem.sku) {
    return fullItem.sku
  }

  // Parent items use `skuPrefix` (the "sku padre")
  if (fullItem.hasVariants && fullItem.skuPrefix) {
    return fullItem.skuPrefix
  }

  // Fallback to sku field for backwards compatibility
  return fullItem.sku
}

/**
 * Gets just the SKU prefix for a parent item, or the full SKU for standalone items.
 * Use this when you need the parent's prefix to pass to getFullSku for children.
 */
export function getSkuPrefix(item: Item): string | undefined {
  if (item.hasVariants) {
    return item.skuPrefix || item.sku
  }
  return item.sku
}

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
  const getSearchableFields = (item: Item | ItemVariant, parentSkuPrefix?: string): string[] => {
    const fields: string[] = []
  
    if (item.name) fields.push(item.name)
    // Include all SKU-related fields for search
    if (item.sku) fields.push(item.sku)
    if ("skuPrefix" in item && item.skuPrefix) fields.push(item.skuPrefix)
    if ("skuSuffix" in item && item.skuSuffix) {
      fields.push(item.skuSuffix)
      // Also include computed full SKU for children
      if (parentSkuPrefix) {
        fields.push(`${parentSkuPrefix}-${item.skuSuffix}`)
      }
    }
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
            const parentPrefix = subItem.skuPrefix || subItem.sku
            const variantFields = getSearchableFields(variant, parentPrefix)
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
        const parentPrefix = item.skuPrefix || item.sku
        const variantFields = getSearchableFields(variant, parentPrefix)
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

/**
 * Sort items based on priority-based configuration
 * Applies sorting factors in order of priority
 */
export function sortItems(items: Item[], sortConfig: SortFactorConfig[]): Item[] {
  if (!sortConfig || sortConfig.length === 0) return items

  const sortedItems = [...items]

  sortedItems.sort((a, b) => {
    for (const config of sortConfig) {
      const comparison = compareItems(a, b, config.factor, config.direction)
      if (comparison !== 0) return comparison
    }
    return 0
  })

  return sortedItems
}

/**
 * Compare two items based on a specific factor and direction
 */
function compareItems(a: Item, b: Item, factor: SortFactor, direction: SortDirection): number {
  let comparison = 0

  switch (factor) {
    case "titulo":
    case "nombre":
      comparison = (a.name || "").localeCompare(b.name || "")
      break

    case "categoria":
      comparison = (a.categoria || "").localeCompare(b.categoria || "")
      break

    case "marca":
      comparison = (a.marca || "").localeCompare(b.marca || "")
      break

    case "fecha":
      // For now, we'll sort by SKU as a proxy for creation date
      // In a real app, you'd have a createdAt timestamp
      comparison = (a.sku || "").localeCompare(b.sku || "")
      break

    case "stock": {
      const stockA = Number.parseFloat(a.stock?.total || "0")
      const stockB = Number.parseFloat(b.stock?.total || "0")
      comparison = stockA - stockB
      break
    }

    case "costo": {
      const costoA = a.precio?.costo ?? a.costo ?? 0
      const costoB = b.precio?.costo ?? b.costo ?? 0
      comparison = costoA - costoB
      break
    }

    case "margen": {
      const margenA = a.precio?.margen ?? a.margen ?? 0
      const margenB = b.precio?.margen ?? b.margen ?? 0
      comparison = margenA - margenB
      break
    }

    case "precioFinal": {
      const pfA = a.precio?.precioFinal ?? a.precioVenta ?? 0
      const pfB = b.precio?.precioFinal ?? b.precioVenta ?? 0
      comparison = pfA - pfB
      break
    }
  }

  return direction === "asc" ? comparison : -comparison
}

/**
 * Filter items based on FilterConfig
 * Applies all active filters to the items list
 */
export function filterItems(items: Item[], filterConfig: FilterConfig): Item[] {
  if (
    !filterConfig ||
    (filterConfig.tipos.length === 0 &&
      filterConfig.categorias.length === 0 &&
      filterConfig.marcas.length === 0 &&
      (filterConfig.proveedores?.length || 0) === 0 &&
      filterConfig.stock.length === 0 &&
      filterConfig.depositos.length === 0)
  ) {
    return items
  }

  return items.filter((item) => {
    // Filter by tipo
    if (filterConfig.tipos.length > 0) {
      let matchesTipo = false

      if (item.isAgrupador && filterConfig.tipos.includes("agrupador")) {
        matchesTipo = true
      } else if (item.hasVariants && filterConfig.tipos.includes("variantes")) {
        matchesTipo = true
      } else if (!item.isAgrupador && !item.hasVariants && filterConfig.tipos.includes("individual")) {
        matchesTipo = true
      }

      if (!matchesTipo) return false
    }

    // Filter by categoria
    if (filterConfig.categorias.length > 0) {
      if (!item.categoria || !filterConfig.categorias.includes(item.categoria)) {
        return false
      }
    }

    // Filter by marca
    if (filterConfig.marcas.length > 0) {
      if (!item.marca || !filterConfig.marcas.includes(item.marca)) {
        return false
      }
    }

    // Filter by proveedor
    if (filterConfig.proveedores && filterConfig.proveedores.length > 0) {
      if (!(item as any).proveedor || !filterConfig.proveedores.includes((item as any).proveedor)) {
        return false
      }
    }

    // Filter by stock status
    if (filterConfig.stock.length > 0) {
      const total = Number.parseFloat((item.stock as any)?.enStock || item.stock?.total || "0")
      const disponible = Number.parseFloat(item.stock?.disponible || "0")
      const reservado = Number.parseFloat(item.stock?.reservado || "0")

      let matchesStock = false

      if (filterConfig.stock.includes("sin-stock") && total === 0) {
        matchesStock = true
      }
      if (filterConfig.stock.includes("disponible") && disponible > 0) {
        matchesStock = true
      }
      if (filterConfig.stock.includes("reservado") && reservado > 0) {
        matchesStock = true
      }
      if (filterConfig.stock.includes("sin-disponible") && disponible === 0) {
        matchesStock = true
      }

      if (!matchesStock) return false
    }

    // Filter by deposito - for now we skip this as we don't have deposito info on items
    // In the future, you would query the stock table to check if item has stock in specific depositos

    return true
  })
}

/**
 * Get unique categories from items list
 */
export function getUniqueCategorias(items: Item[]): string[] {
  const categorias = new Set<string>()

  items.forEach((item) => {
    if (item.categoria) {
      categorias.add(item.categoria)
    }

    // Also check sub-items in agrupadores
    if (item.isAgrupador && item.items) {
      item.items.forEach((subItem) => {
        if (subItem.categoria) {
          categorias.add(subItem.categoria)
        }
      })
    }
  })

  return Array.from(categorias).sort()
}

/**
 * Get unique brands from items list
 */
export function getUniqueMarcas(items: Item[]): string[] {
  const marcas = new Set<string>()

  items.forEach((item) => {
    if (item.marca) {
      marcas.add(item.marca)
    }

    // Also check sub-items in agrupadores
    if (item.isAgrupador && item.items) {
      item.items.forEach((subItem) => {
        if (subItem.marca) {
          marcas.add(subItem.marca)
        }
      })
    }
  })

  return Array.from(marcas).sort()
}

/**
* Get unique proveedores from items list
*/
export function getUniqueProveedores(items: Item[]): string[] {
  const proveedores = new Set<string>()

  items.forEach((item) => {
    if ((item as any).proveedor) {
      proveedores.add((item as any).proveedor)
    }

    // Also check sub-items in agrupadores
    if (item.isAgrupador && item.items) {
      item.items.forEach((subItem) => {
        if ((subItem as any).proveedor) {
          proveedores.add((subItem as any).proveedor)
        }
      })
    }
  })

  return Array.from(proveedores).sort()
}
