// This script resets clientes and proveedores in localStorage
// Run this from the browser console to reload fresh data with transactionCount

console.log("[v0] Resetting clientes and proveedores for invino account...")

// Clear clientes
localStorage.removeItem("stockio-clientes-invino")
console.log("[v0] Cleared stockio-clientes-invino")

// Clear proveedores
localStorage.removeItem("stockio-proveedores-invino")
console.log("[v0] Cleared stockio-proveedores-invino")

console.log("[v0] Done! Reload the page to see the updated data with transaction counts.")
