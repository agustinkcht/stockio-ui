export const ITEM_FALLBACK_PHOTO = "/images/item-fallback.png"

/**
 * Returns the primary photo for an item.
 * Reads media[0].photo when present, otherwise falls back to the default fallback image.
 */
export function getItemPhoto(item?: { media?: { photo: string; descripcion: string }[] }): string {
  const photo = item?.media?.[0]?.photo
  return photo && photo.trim() !== "" ? photo : ITEM_FALLBACK_PHOTO
}

/**
 * Maps category names to their corresponding bottle image URLs
 * Returns the appropriate category image based on the item's category
 */
export function getCategoryImage(category?: string): string {
  if (!category) return "/images/categories/default.jpg"

  const normalized = category.toLowerCase().trim()

  // Category to image mapping
  const categoryMap: Record<string, string> = {
    vinos: "/images/categories/vinos.jpg",
    vino: "/images/categories/vinos.jpg",
    espumantes: "/images/categories/espumantes.jpg",
    espumante: "/images/categories/espumantes.jpg",
    gin: "/images/categories/gin.jpg",
    vodka: "/images/categories/vodka.jpg",
    whiskies: "/images/categories/whisky.jpg",
    whisky: "/images/categories/whisky.jpg",
    whiskey: "/images/categories/whisky.jpg",
    ron: "/images/categories/ron.jpg",
    tequila: "/images/categories/tequila.jpg",
    licores: "/images/categories/licores.jpg",
    licor: "/images/categories/licores.jpg",
    cervezas: "/images/categories/cervezas.jpg",
    cerveza: "/images/categories/cervezas.jpg",
    "bebidas blancas": "/images/categories/bebidas-blancas.jpg",
  }

  return categoryMap[normalized] || "/images/categories/default.jpg"
}
