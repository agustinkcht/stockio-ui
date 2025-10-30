import type { Item } from "../types"

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
