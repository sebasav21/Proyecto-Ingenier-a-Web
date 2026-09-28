export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const productoId = Number(params.id);
  const resenas = await query(
    `SELECT r.id, r.estrellas, r.comentario, r.created_at,
       u.nombre || ' ' || COALESCE(u.apellido_paterno, '') AS autor
     FROM resenas r
     JOIN usuarios u ON u.id = r.usuario_id
     WHERE r.producto_id = $1
     ORDER BY r.created_at DESC`,
    [productoId]
  );
  const promedio = await queryOne<{ promedio: string; total: string }>(
    `SELECT ROUND(AVG(estrellas)::numeric, 1) AS promedio, COUNT(*) AS total FROM resenas WHERE producto_id = $1`,
    [productoId]
  );
  return NextResponse.json({ resenas, promedio: Number(promedio?.promedio ?? 0), total: Number(promedio?.total ?? 0) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const productoId = Number(params.id);
  const { estrellas, comentario } = await req.json();

  if (estrellas === undefined || estrellas < 0 || estrellas > 5)
    return NextResponse.json({ error: "Calificación inválida (0-5)." }, { status: 400 });

  // Verificar que el usuario haya comprado el producto
  const compra = await queryOne(
    `SELECT dp.id FROM detalle_pedido dp
     JOIN pedidos p ON p.id = dp.pedido_id
     WHERE p.usuario_id = $1 AND dp.producto_id = $2 AND p.estado != 'cancelado'
     LIMIT 1`,
    [userId, productoId]
  );
  if (!compra) return NextResponse.json({ error: "Solo puedes calificar productos que hayas comprado." }, { status: 403 });

  // Una reseña por usuario por producto
  const existente = await queryOne("SELECT id FROM resenas WHERE usuario_id = $1 AND producto_id = $2", [userId, productoId]);
  if (existente) {
    await query(
      "UPDATE resenas SET estrellas = $1, comentario = $2 WHERE usuario_id = $3 AND producto_id = $4",
      [estrellas, comentario?.trim() || null, userId, productoId]
    );
  } else {
    await query(
      "INSERT INTO resenas (usuario_id, producto_id, estrellas, comentario) VALUES ($1, $2, $3, $4)",
      [userId, productoId, estrellas, comentario?.trim() || null]
    );
  }

  return NextResponse.json({ ok: true });
}
