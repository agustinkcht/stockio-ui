import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'items'
      )
    `

    if (!tablesExist[0].exists) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 503 })
    }

    // Fetch all items
    const items = await sql`
      SELECT * FROM items ORDER BY created_at DESC
    `

    // Fetch all variants
    const variants = await sql`
      SELECT * FROM item_variants
    `

    // Fetch all stock
    const stock = await sql`
      SELECT * FROM stock WHERE deposito = 'principal'
    `

    // Fetch all atributos principales
    const atributosPrincipales = await sql`
      SELECT * FROM atributos_principales
    `

    // Fetch all atributos informativos
    const atributosInformativos = await sql`
      SELECT * FROM atributos_informativos
    `

    // Fetch container atributos principales
    const containerAtributosPrincipales = await sql`
      SELECT * FROM container_atributos_principales
    `

    // Fetch variant atributos principales
    const variantAtributosPrincipales = await sql`
      SELECT * FROM variant_atributos_principales
    `

    // Transform data to match frontend structure
    const transformedItems = items.map((item: any) => {
      const itemStock = stock.find((s: any) => s.sku === item.sku)
      const itemAtributosPrincipales = atributosPrincipales.filter((a: any) => a.sku === item.sku)
      const itemAtributosInformativos = atributosInformativos.filter((a: any) => a.sku === item.sku)
      const itemContainerAtributos = containerAtributosPrincipales.filter((a: any) => a.sku === item.sku)
      const itemVariants = variants.filter((v: any) => v.parent_sku === item.sku)

      return {
        name: item.name,
        sku: item.sku,
        codigoUniversal: item.codigo_universal,
        marca: item.marca,
        modelo: item.modelo,
        formatoVenta: item.formato_venta,
        proveedor: item.proveedor,
        codigoProveedor: item.codigo_proveedor,
        descripcion: item.descripcion,
        foto: item.foto,
        hasVariants: item.has_variants,
        isAgrupador: item.is_agrupador,
        variantCount: item.variant_count,
        itemCount: item.item_count,
        volumenActive: item.volumen_active,
        volumenCantidad: item.volumen_cantidad,
        volumenUnidad: item.volumen_unidad,
        unidadesPorPackActive: item.unidades_por_pack_active,
        unidadesPorPack: item.unidades_por_pack,
        stock: itemStock
          ? {
              total: String(itemStock.total),
              reservado: String(itemStock.reservado),
              disponible: String(itemStock.disponible),
            }
          : undefined,
        atributosPrincipales: itemAtributosPrincipales.map((a: any) => ({
          key: a.key,
          value: a.value,
        })),
        atributosInformativos: itemAtributosInformativos.map((a: any) => ({
          key: a.key,
          value: a.value,
        })),
        containerAtributosPrincipales: itemContainerAtributos.map((a: any) => ({
          key: a.key,
          variantes: a.variantes,
        })),
        variants: itemVariants.map((v: any) => {
          const variantStock = stock.find((s: any) => s.sku === v.sku)
          const variantAtributos = variantAtributosPrincipales.filter((a: any) => a.variant_sku === v.sku)

          return {
            name: v.name,
            sku: v.sku,
            codigoUniversal: v.codigo_universal,
            marca: v.marca,
            modelo: v.modelo,
            formatoVenta: v.formato_venta,
            proveedor: v.proveedor,
            codigoProveedor: v.codigo_proveedor,
            stock: variantStock
              ? {
                  total: String(variantStock.total),
                  reservado: String(variantStock.reservado),
                  disponible: String(variantStock.disponible),
                }
              : undefined,
            atributosPrincipales: variantAtributos.map((a: any) => ({
              key: a.key,
              value: a.value,
            })),
          }
        }),
      }
    })

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error("[v0] Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Insert item
    await sql`
      INSERT INTO items (
        sku, name, codigo_universal, marca, modelo, formato_venta,
        proveedor, codigo_proveedor, descripcion, foto, has_variants,
        is_agrupador, variant_count, item_count
      ) VALUES (
        ${body.sku}, ${body.name}, ${body.codigoUniversal || null},
        ${body.marca || null}, ${body.modelo || null}, ${body.formatoVenta || null},
        ${body.proveedor || null}, ${body.codigoProveedor || null},
        ${body.descripcion || null}, ${body.foto || null}, ${body.hasVariants || false},
        ${body.isAgrupador || false}, ${body.variantCount || 0}, ${body.itemCount || 0}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error creating item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
