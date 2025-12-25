// SKU Generation Utilities following SKU_GENERATION_RULES.md

/**
 * Category codes as defined in SKU_GENERATION_RULES.md
 */
const CATEGORY_CODES = {
  vinos: "VNO",
  "vino-espumante": "VNOE",
  champagne: "CHMP",
  licores: "LICR",
  whiskies: "WHKY",
  cervezas: "CVZA",
} as const

/**
 * Generates a title acronym from a product name
 * Max length: 3-7 characters, pronounceable and recognizable
 */
function generateTitleAcronym(title: string): string {
  // Remove common words that don't add value
  const genericWords = /\b(vino|licor|whisky|cerveza|champagne|ml|litro|botella)\b/gi
  let cleaned = title.replace(genericWords, "").trim()

  // Remove special characters and normalize
  cleaned = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()

  // Split into words
  const words = cleaned.split(/\s+/)

  // If single word, compress it
  if (words.length === 1) {
    const word = words[0].toUpperCase()
    if (word.length <= 7) return word
    // Take first 7 chars for long single words
    return word.substring(0, 7)
  }

  // Multi-word: create compact acronym
  // Strategy: Take significant consonants and vowels to make pronounceable
  const acronym = words
    .map((word) => {
      if (word.length <= 3) return word.toUpperCase()
      // Take first syllable or significant chars
      return word.substring(0, 3).toUpperCase()
    })
    .join("")

  // Ensure length is 3-7 chars
  if (acronym.length > 7) {
    return acronym.substring(0, 7)
  }
  if (acronym.length < 3) {
    return acronym.padEnd(3, "X")
  }

  return acronym
}

/**
 * Generates attribute code (max 4 chars)
 */
function generateAttributeCode(value: string): string {
  if (!value) return ""

  // Normalize and clean
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()

  // If it's a year (4 digits), return as-is
  if (/^\d{4}$/.test(cleaned)) return cleaned

  // If it's a number, return as-is (up to 4 chars)
  if (/^\d+$/.test(cleaned)) return cleaned.substring(0, 4)

  // Otherwise, take first 4 chars
  return cleaned.substring(0, 4)
}

/**
 * Generates SKU for a standalone item
 * Format: <CATEGORY>-<TITLE>-<ATTR1>-<ATTR2>
 */
export function generateStandaloneSKU(params: {
  category?: string
  title: string
  attr1?: string
  attr2?: string
}): string {
  const parts: string[] = []

  if (params.category) {
    const categoryCode = CATEGORY_CODES[params.category.toLowerCase() as keyof typeof CATEGORY_CODES]
    if (categoryCode) {
      parts.push(categoryCode)
    }
  }

  // 2. Title acronym
  const titleAcronym = generateTitleAcronym(params.title)
  parts.push(titleAcronym)

  // 3. Optional attributes
  if (params.attr1) {
    const attr1Code = generateAttributeCode(params.attr1)
    if (attr1Code) parts.push(attr1Code)
  }

  if (params.attr2) {
    const attr2Code = generateAttributeCode(params.attr2)
    if (attr2Code) parts.push(attr2Code)
  }

  return parts.join("-")
}

/**
 * Generates SKU for a parent/agrupador item
 * Format: <CATEGORY>-<TITLE> (no variant attributes)
 */
export function generateParentSKU(params: { category?: string; title: string }): string {
  const parts: string[] = []

  if (params.category) {
    const categoryCode = CATEGORY_CODES[params.category.toLowerCase() as keyof typeof CATEGORY_CODES]
    if (categoryCode) {
      parts.push(categoryCode)
    }
  }

  const titleAcronym = generateTitleAcronym(params.title)
  parts.push(titleAcronym)

  return parts.join("-")
}

/**
 * Validates if a SKU follows the correct format
 */
export function validateSKU(sku: string): boolean {
  // Must have at least CATEGORY-TITLE
  const parts = sku.split("-")
  if (parts.length < 2) return false

  // Category code must be 3-5 chars
  if (parts[0].length < 3 || parts[0].length > 5) return false

  // Title must be 3-7 chars
  if (parts[1].length < 3 || parts[1].length > 7) return false

  // Optional attributes must be max 4 chars each
  for (let i = 2; i < parts.length; i++) {
    if (parts[i].length > 4) return false
  }

  // Must be all uppercase
  if (sku !== sku.toUpperCase()) return false

  return true
}

/**
 * Checks if a SKU already exists in the items array
 */
export function isSkuUnique(sku: string, existingSkus: string[]): boolean {
  return !existingSkus.includes(sku)
}

/**
 * Generates a guaranteed unique SKU by appending a number if needed
 */
export function generateUniqueSKU(baseSku: string, existingSkus: string[]): string {
  if (isSkuUnique(baseSku, existingSkus)) {
    return baseSku
  }

  // Append incrementing number until unique
  let counter = 2
  let uniqueSku = `${baseSku}-${counter}`

  while (!isSkuUnique(uniqueSku, existingSkus)) {
    counter++
    uniqueSku = `${baseSku}-${counter}`
  }

  return uniqueSku
}
