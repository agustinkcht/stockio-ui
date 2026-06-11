import type { Item, ItemVariant } from "@/lib/types"
import { getCategoryImage } from "@/lib/utils/category-images"

/**
 * The default item image path — shown when an item has no photos in its media array.
 * This is a display-only fallback; it is never stored in item.media.
 */
export const DEFAULT_ITEM_IMAGE = "/images/items/default-item.png"

/**
 * Returns the thumbnail URL to display for a standalone Item or an ItemVariant child.
 *
 * Priority:
 *   1. item.media[0].foto   — per-item photo (explicitly set by user)
 *   2. getCategoryImage()   — category-level fallback (icon-style)
 *   3. DEFAULT_ITEM_IMAGE   — generic product silhouette
 *
 * Parents (isAgrupador / hasVariants) do not have media and should not call this.
 */
export function getItemThumbnail(
  item: Item | ItemVariant,
  parentItem?: Item
): string {
  // 1. Per-item photo
  if (item.media && item.media.length > 0 && item.media[0].foto) {
    return item.media[0].foto
  }

  // 2. Category-based icon
  const categoria = (item as Item).categoria ?? (parentItem as Item | undefined)?.categoria
  const categoryImage = getCategoryImage(categoria)
  if (categoryImage) return categoryImage

  // 3. Generic default
  return DEFAULT_ITEM_IMAGE
}

/**
 * Returns true if the item has at least one user-uploaded photo in its media array.
 * Used to decide whether to render photos as full-bleed or icon-style.
 */
export function itemHasPhoto(item: Item | ItemVariant): boolean {
  return !!(item.media && item.media.length > 0 && item.media[0].foto)
}
