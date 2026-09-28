import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await queryOne(
    `SELECT p.*, c.nombre AS categoria_nombre,
      COALESCE(
        json_agg(ip ORDER BY ip.es_principal DESC) FILTER (WHERE ip.id IS NOT NULL),
        '[]'
      ) AS imagenes_producto
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     LEFT JOIN imagenes_producto ip ON ip.producto_id = p.id
     WHERE p.id = $1
     GROUP BY p.id, c.nombre`,
    [params.id]
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
