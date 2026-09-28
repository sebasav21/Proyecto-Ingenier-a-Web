import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: string })?.rol;
  if (!session?.user || (rol !== "admin" && rol !== "general")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const pedidos = await query(
    `SELECT p.id, p.total, p.estado, p.created_at, p.notas,
       u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS cliente,
       u.email,
       json_agg(json_build_object(
         'nombre_producto', dp.nombre_producto,
         'cantidad', dp.cantidad,
         'precio_unitario', dp.precio_unitario
       )) AS items
     FROM pedidos p
     JOIN usuarios u ON u.id = p.usuario_id
     LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
     GROUP BY p.id, u.nombre, u.apellido_paterno, u.email
     ORDER BY p.created_at DESC`
  );
  return NextResponse.json(pedidos);
}
