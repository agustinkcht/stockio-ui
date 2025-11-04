import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { skus } = await request.json()

    if (!Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json({ error: "Invalid SKUs array" }, { status: 400 })
    }

    // Delete all items in a single query using IN clause
    await sql`DELETE FROM items WHERE sku = ANY(${skus})`

    return NextResponse.json({ success: true, deleted: skus.length })
  } catch (error) {
    console.error("Error batch deleting items:", error)
    return NextResponse.json({ error: "Failed to delete items" }, { status: 500 })
  }
}
