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
