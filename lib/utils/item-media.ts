import type { Item, ItemVariant } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"

/**
 * The default item image — shown at render time when an item has no photos and no category icon.
 * This is display-only and is NEVER stored in item.media.
 */
export const DEFAULT_ITEM_IMAGE = "/images/items/default-item.png"

/**
 * Returns the thumbnail URL to display for a standalone Item or an ItemVariant child.
 *
 * Priority:
 *   1. item.media[0].foto      — per-item photo uploaded by the user
 *   2. getCategoryImage(cat)   — category icon (same as lista de precios / ventas)
 *   3. DEFAULT_ITEM_IMAGE      — final generic fallback
 *
 * The category fallback is display-only and is NEVER stored in item.media.
 */
export function getItemThumbnail(item: Item | ItemVariant, parentCategoria?: string): string {
  if (item.media && item.media.length > 0 && item.media[0].foto) {
    return item.media[0].foto
  }
  const cat = (item as Item).categoria || parentCategoria
  const catImage = cat ? getCategoryImage(cat) : null
  if (catImage) return catImage
  return DEFAULT_ITEM_IMAGE
}

/**
 * Returns true only if the item has at least one real user-uploaded photo.
 * Used to decide whether to render full-bleed (real photo) vs icon-style (fallback).
 */
export function itemHasPhoto(item: Item | ItemVariant): boolean {
  return !!(item.media && item.media.length > 0 && item.media[0].foto)
}
