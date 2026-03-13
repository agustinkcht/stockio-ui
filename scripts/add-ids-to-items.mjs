/**
 * add-ids-to-items.mjs
 *
 * Reads initial-items.ts, injects a unique 8-char base36 `id` field
 * as the first property of every item object (parent, child, variant).
 *
 * Strategy: use regex to find every object opening that belongs to an item
 * (i.e. has a `name:` field as one of the first properties) and insert
 * `id: "xxxxxxxx",` right after the opening brace.
 *
 * Run with: node scripts/add-ids-to-items.mjs
 */

import { readFileSync, writeFileSync } from "fs"
import { randomBytes } from "crypto"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
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
// We look for object-open braces followed (within a short window) by `name:`.
// This covers parent items, child items (items: [...]), and variants (variants: [...]).
// We replace every `{\n` + optional whitespace + `name:` with `{\n  id: "...",\n  name:`.

let count = 0

src = src.replace(
  /(\{)(\s*\n\s*)(name:)/g,
  (match, brace, whitespace, nameKey) => {
    const id = generateId()
    count++
    // Preserve the indentation of `name:` for the new `id:` line
    return `${brace}${whitespace}id: "${id}",\n${whitespace}${nameKey}`
  }
)

writeFileSync(filePath, src, "utf-8")
console.log(`Done. Injected ${count} IDs into initial-items.ts (${usedIds.size} unique).`)
