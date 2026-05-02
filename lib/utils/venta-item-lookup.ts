import type { Item, ItemVariant, VentaItem } from "@/lib/types"
import { INITIAL_ITEMS } from "@/lib/data/initial-items"

export interface ResolvedVentaItem {
  /** The catalog item that backs this venta item, if found */
  resolved: Item | ItemVariant | null
  /** When the resolved item is a variant, this is its parent item */
  parent: Item | null
  /** True when the resolved item is a variant (child) */
  isChild: boolean
}

export interface VentaItemDisplay {
  name: string
  marca?: string
  categoria?: string
  /** Atributo principal values used as tags (e.g. "Malbec", "2019") */
  tags: string[]
  resolved: Item | ItemVariant | null
  parent: Item | null
  isChild: boolean
}

/**
 * Look up a SKU in the catalog. SKUs are either:
 * - Standalone item SKU (matches `item.sku` directly)
 * - Parent SKU (matches `item.skuPrefix`)
 * - Child SKU formatted as `${parent.skuPrefix}-${variant.skuSuffix}`
 */
export function lookupCatalogItemBySku(sku: string): ResolvedVentaItem {
  if (!sku) return { resolved: null, parent: null, isChild: false }

  // Try standalone first (exact match on item.sku)
  const standalone = INITIAL_ITEMS.find((it) => !it.hasVariants && !it.isAgrupador && it.sku === sku)
  if (standalone) {
    return { resolved: standalone, parent: null, isChild: false }
  }

  // Try parent (sku === skuPrefix or sku === sku)
  const parentMatch = INITIAL_ITEMS.find(
    (it) => (it.hasVariants || it.isAgrupador) && (it.skuPrefix === sku || it.sku === sku),
  )
  if (parentMatch) {
    return { resolved: parentMatch, parent: null, isChild: false }
  }

  // Try parent + variant: sku startsWith parent.skuPrefix + "-"
  for (const parent of INITIAL_ITEMS) {
    const prefix = parent.skuPrefix || parent.sku
    if (!prefix) continue
    if (!parent.variants?.length) continue
    const fullPrefix = `${prefix}-`
    if (!sku.startsWith(fullPrefix)) continue

    const suffix = sku.slice(fullPrefix.length)
    const variant = parent.variants.find((v) => v.skuSuffix === suffix || v.sku === suffix || v.sku === sku)
    if (variant) {
      return { resolved: variant, parent, isChild: true }
    }
  }

  return { resolved: null, parent: null, isChild: false }
}

/**
 * Combines catalog lookup with the VentaItem itself to produce display fields.
 * Falls back gracefully when the catalog match is not found.
 */
export function getVentaItemDisplay(ventaItem: VentaItem): VentaItemDisplay {
  const { resolved, parent, isChild } = lookupCatalogItemBySku(ventaItem.sku)

  // Marca: prefer resolved.marca, then parent.marca
  const marca = (resolved as Item | ItemVariant | null)?.marca || parent?.marca || undefined

  // Categoria: VentaItem already carries it; fall back to resolved/parent
  const categoria =
    ventaItem.categoria ||
    (resolved as Item | ItemVariant | null)?.categoria ||
    parent?.categoria ||
    undefined

  // Tags: only meaningful for child variants — values from atributosPrincipales
  let tags: string[] = []
  if (isChild && (resolved as ItemVariant | null)?.atributosPrincipales) {
    tags = (resolved as ItemVariant).atributosPrincipales!
      .map((a) => a.value)
      .filter(Boolean)
  }

  // Prefer parent's name for variants (catalogo treats child's name as parent's name)
  const name = isChild ? parent?.name || ventaItem.name : ventaItem.name

  return {
    name,
    marca,
    categoria,
    tags,
    resolved,
    parent,
    isChild,
  }
}
