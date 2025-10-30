import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { sku: string } }) {
  try {
    const { sku } = params

    const items = await sql`SELECT * FROM items WHERE sku = ${sku}`
    if (items.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(items[0])
  } catch (error) {
    console.error("[v0] Error fetching item:", error)
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { sku: string } }) {
  try {
    const { sku } = params
    const body = await request.json()

    await sql`
      UPDATE items SET
        name = ${body.name},
        codigo_universal = ${body.codigoUniversal || null},
        marca = ${body.marca || null},
        modelo = ${body.modelo || null},
        formato_venta = ${body.formatoVenta || null},
        proveedor = ${body.proveedor || null},
        codigo_proveedor = ${body.codigoProveedor || null},
        descripcion = ${body.descripcion || null},
        foto = ${body.foto || null},
        updated_at = NOW()
      WHERE sku = ${sku}
    `

    // Update atributos if provided
    if (body.atributosPrincipales) {
      await sql`DELETE FROM atributos_principales WHERE sku = ${sku}`
      for (const attr of body.atributosPrincipales) {
        await sql`
          INSERT INTO atributos_principales (sku, key, value)
          VALUES (${sku}, ${attr.key}, ${attr.value})
        `
      }
    }

    if (body.atributosInformativos) {
      await sql`DELETE FROM atributos_informativos WHERE sku = ${sku}`
      for (const attr of body.atributosInformativos) {
        await sql`
          INSERT INTO atributos_informativos (sku, key, value)
          VALUES (${sku}, ${attr.key}, ${attr.value || null})
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { sku: string } }) {
  try {
    const { sku } = params

    await sql`DELETE FROM atributos_principales WHERE sku = ${sku}`
    await sql`DELETE FROM atributos_informativos WHERE sku = ${sku}`
    await sql`DELETE FROM container_atributos_principales WHERE sku = ${sku}`
    await sql`DELETE FROM variant_atributos_principales WHERE variant_sku = ${sku}`
    await sql`DELETE FROM stock WHERE sku = ${sku}`
    await sql`DELETE FROM item_variants WHERE parent_sku = ${sku} OR sku = ${sku}`

    await sql`DELETE FROM items WHERE sku = ${sku}`

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
