/**
 * Generates a stable, unique 8-character base36 ID using the Web Crypto API.
 * Base36 uses digits 0-9 and letters a-z, giving 36^8 = ~2.8 trillion possible IDs.
 */
export function generateId(existingIds?: Set<string>): string {
  let id: string
  do {
    const bytes = new Uint8Array(6)
    crypto.getRandomValues(bytes)
    // Convert 6 random bytes (48 bits) to a number, then to base36
    let num = 0n
    for (const byte of bytes) {
      num = (num << 8n) | BigInt(byte)
    }
    id = num.toString(36).padStart(8, "0").slice(-8)
  } while (existingIds?.has(id))

  existingIds?.add(id)
  return id
}
