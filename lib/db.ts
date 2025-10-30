import { neon, neonConfig } from "@neondatabase/serverless"

neonConfig.fetchConnectionCache = true

if (!process.env.NEON_NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.NEON_DATABASE_URL)
