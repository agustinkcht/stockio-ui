import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = neon(process.env.NEON_NEON_DATABASE_URL!)

    // Insert initial items
    await sql`
      INSERT INTO items (sku, titulo, marca, descripcion, has_variants, is_container) 
      VALUES 
        ('ITEM-SIN-ATRIBUTOS-1', 'Item Sin Atributos 1', 'Marca Ejemplo', 'Descripción del item sin atributos', FALSE, FALSE),
        ('VINO-TRAPICHE-GRAN-MEDALLA', 'Vino Trapiche Gran Medalla', 'Trapiche', 'Vino premium de alta calidad', TRUE, TRUE)
      ON CONFLICT (sku) DO NOTHING
    `

    // Insert variant items
    await sql`
      INSERT INTO items (sku, titulo, marca, has_variants, is_container) 
      VALUES 
        ('VINO-TRAPICHE-MALBEC-2020', 'Vino Trapiche Gran Medalla Malbec 2020', 'Trapiche', FALSE, FALSE),
        ('VINO-TRAPICHE-MALBEC-2021', 'Vino Trapiche Gran Medalla Malbec 2021', 'Trapiche', FALSE, FALSE)
      ON CONFLICT (sku) DO NOTHING
    `

    // Insert variant relationships
    await sql`
      INSERT INTO variants (parent_sku, variant_sku) 
      VALUES 
        ('VINO-TRAPICHE-GRAN-MEDALLA', 'VINO-TRAPICHE-MALBEC-2020'),
        ('VINO-TRAPICHE-GRAN-MEDALLA', 'VINO-TRAPICHE-MALBEC-2021')
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with initial data!",
    })
  } catch (error: any) {
    console.error("Database seed error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
