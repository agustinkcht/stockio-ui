import type { Item, ItemVariant } from "@/lib/types"

/**
 * The default item image — shown at render time when an item has no photos.
 * This is display-only and is NEVER stored in item.media.
 */
export const DEFAULT_ITEM_IMAGE = "/images/items/default-item.png"

/**
 * Returns the thumbnail URL to display for a standalone Item or an ItemVariant child.
 *
 * Priority:
 *   1. item.media[0].foto  — per-item photo uploaded by the user
 *   2. DEFAULT_ITEM_IMAGE  — generic fallback (never stored, render-only)
 *
 * Category plays no role. Parents (isAgrupador / hasVariants) should not call this.
 */
export function getItemThumbnail(item: Item | ItemVariant): string {
  if (item.media && item.media.length > 0 && item.media[0].foto) {
    return item.media[0].foto
  }
  return DEFAULT_ITEM_IMAGE
}

/**
 * Returns true only if the item has at least one real user-uploaded photo.
 * Used to decide whether to render full-bleed (real photo) vs icon-style (fallback).
 */
export function itemHasPhoto(item: Item | ItemVariant): boolean {
  return !!(item.media && item.media.length > 0 && item.media[0].foto)
}
