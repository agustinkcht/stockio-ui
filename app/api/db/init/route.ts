import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = neon(process.env.NEON_NEON_DATABASE_URL!)

    // Create items table
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(255) UNIQUE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        marca VARCHAR(255),
        descripcion TEXT,
        image_url TEXT,
        has_variants BOOLEAN DEFAULT FALSE,
        is_container BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create variants table
    await sql`
      CREATE TABLE IF NOT EXISTS variants (
        id SERIAL PRIMARY KEY,
        parent_sku VARCHAR(255) REFERENCES items(sku) ON DELETE CASCADE,
        variant_sku VARCHAR(255) UNIQUE NOT NULL REFERENCES items(sku) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create stock table
    await sql`
      CREATE TABLE IF NOT EXISTS stock (
        id SERIAL PRIMARY KEY,
        item_sku VARCHAR(255) REFERENCES items(sku) ON DELETE CASCADE,
        deposito VARCHAR(255) NOT NULL,
        cantidad INTEGER DEFAULT 0,
        UNIQUE(item_sku, deposito)
      )
    `

    // Create attributes table
    await sql`
      CREATE TABLE IF NOT EXISTS item_attributes (
        id SERIAL PRIMARY KEY,
        item_sku VARCHAR(255) REFERENCES items(sku) ON DELETE CASCADE,
        attribute_type VARCHAR(50) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value TEXT,
        is_locked BOOLEAN DEFAULT FALSE
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku)`
    await sql`CREATE INDEX IF NOT EXISTS idx_variants_parent ON variants(parent_sku)`
    await sql`CREATE INDEX IF NOT EXISTS idx_stock_item ON stock(item_sku)`
    await sql`CREATE INDEX IF NOT EXISTS idx_attributes_item ON item_attributes(item_sku)`

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully!",
    })
  } catch (error: any) {
    console.error("Database init error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
