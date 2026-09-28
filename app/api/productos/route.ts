import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const catId = searchParams.get("categoria");
  const q = searchParams.get("q");

  let sql = `
    SELECT p.*, c.nombre AS categoria_nombre,
      COALESCE(
        json_agg(ip ORDER BY ip.es_principal DESC) FILTER (WHERE ip.id IS NOT NULL),
        '[]'
      ) AS imagenes_producto
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN imagenes_producto ip ON ip.producto_id = p.id
    WHERE p.activo = true
  `;
  const params: unknown[] = [];

  if (catId) { params.push(catId); sql += ` AND p.categoria_id = $${params.length}`; }
  if (q) { params.push(`%${q}%`); sql += ` AND p.nombre ILIKE $${params.length}`; }

  sql += " GROUP BY p.id, c.nombre ORDER BY p.id";

  const rows = await query(sql, params);
  return NextResponse.json(rows);
}
