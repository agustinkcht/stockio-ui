// This script clears the clientes localStorage cache for the invino account
// This will force the app to reload the initial clientes from the data file

const storageKey = "stockio-clientes-invino"
localStorage.removeItem(storageKey)
console.log(`[v0] Cleared localStorage key: ${storageKey}`)
console.log("[v0] Refresh the page to see the new clientes")
