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

    const result = await sql`
      WITH item_data AS (
        SELECT 
          i.*,
          s.total as stock_total,
          s.reservado as stock_reservado,
          s.disponible as stock_disponible,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'key', ap.key,
                'value', ap.value
              )
            ) FILTER (WHERE ap.id IS NOT NULL),
            '[]'
          ) as atributos_principales,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'key', ai.key,
                'value', ai.value
              )
            ) FILTER (WHERE ai.id IS NOT NULL),
            '[]'
          ) as atributos_informativos,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'key', cap.key,
                'variantes', cap.variantes
              )
            ) FILTER (WHERE cap.id IS NOT NULL),
            '[]'
          ) as container_atributos
        FROM items i
        LEFT JOIN stock s ON i.sku = s.sku AND s.deposito = 'principal'
        LEFT JOIN atributos_principales ap ON i.sku = ap.sku
        LEFT JOIN atributos_informativos ai ON i.sku = ai.sku
        LEFT JOIN container_atributos_principales cap ON i.sku = cap.sku
        GROUP BY i.id, i.sku, i.name, i.codigo_universal, i.marca, i.modelo, 
                 i.formato_venta, i.proveedor, i.codigo_proveedor, i.descripcion, 
                 i.foto, i.has_variants, i.is_agrupador, i.variant_count, i.item_count,
                 i.volumen_active, i.volumen_cantidad, i.volumen_unidad,
                 i.unidades_por_pack_active, i.unidades_por_pack, i.created_at, i.updated_at,
                 s.total, s.reservado, s.disponible
      ),
      variant_data AS (
        SELECT 
          iv.parent_sku,
          json_agg(
            jsonb_build_object(
              'name', iv.name,
              'sku', iv.sku,
              'stock', jsonb_build_object(
                'total', COALESCE(vs.total::text, '0'),
                'reservado', COALESCE(vs.reservado::text, '0'),
                'disponible', COALESCE(vs.disponible::text, '0')
              ),
              'atributosPrincipales', COALESCE(
                (
                  SELECT json_agg(jsonb_build_object('key', vap.key, 'value', vap.value))
                  FROM variant_atributos_principales vap
                  WHERE vap.variant_sku = iv.sku
                ),
                '[]'
              )
            )
          ) as variants
        FROM item_variants iv
        LEFT JOIN stock vs ON iv.sku = vs.sku AND vs.deposito = 'principal'
        GROUP BY iv.parent_sku
      )
      SELECT 
        id.*,
        COALESCE(vd.variants, '[]') as variants
      FROM item_data id
      LEFT JOIN variant_data vd ON id.sku = vd.parent_sku
      ORDER BY id.created_at DESC
    `

    const transformedItems = result.map((item: any) => ({
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
      stock:
        item.stock_total !== null
          ? {
              total: String(item.stock_total),
              reservado: String(item.stock_reservado),
              disponible: String(item.stock_disponible),
            }
          : undefined,
      atributosPrincipales: item.atributos_principales,
      atributosInformativos: item.atributos_informativos,
      containerAtributosPrincipales: item.container_atributos,
      variants: item.variants,
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch items",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
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
