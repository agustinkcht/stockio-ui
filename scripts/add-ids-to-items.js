/**
 * add-ids-to-items.js
 *
 * Reads initial-items.ts, injects a unique 8-char base36 `id` field
 * as the first property of every item object (parent, child, variant).
 */

const { readFileSync, writeFileSync } = require("fs")
const { randomBytes } = require("crypto")
const { resolve } = require("path")

const filePath = resolve(__dirname, "../lib/data/initial-items.ts")

// --- ID generation ---
const usedIds = new Set()

function generateId() {
  let id
  do {
    const bytes = randomBytes(6)
    const num = bytes.readUIntBE(0, 6) // 48-bit integer
    id = num.toString(36).padStart(8, "0").slice(-8)
  } while (usedIds.has(id))
  usedIds.add(id)
  return id
}

// --- Read file ---
let src = readFileSync(filePath, "utf-8")

// Guard: skip if already has id fields
if (/id:\s*"[0-9a-z]{8}"/.test(src)) {
  console.log("IDs already present in initial-items.ts — skipping.")
  process.exit(0)
}

// --- Inject IDs ---
// Find every object-open brace followed (on the next line) by `name:`.
// This covers top-level items, children, and variants.
let count = 0

src = src.replace(
  /(\{)(\s*\n\s*)(name:)/g,
  (match, brace, whitespace, nameKey) => {
    const id = generateId()
    count++
    return `${brace}${whitespace}id: "${id}",\n${whitespace}${nameKey}`
  }
)

writeFileSync(filePath, src, "utf-8")
console.log(`Done. Injected ${count} IDs into initial-items.ts (${usedIds.size} unique).`)
