export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ puede: false });

  const userId = (session.user as { id: string }).id;
  const productoId = Number(params.id);

  const compra = await queryOne(
    `SELECT dp.id FROM detalle_pedido dp
     JOIN pedidos p ON p.id = dp.pedido_id
     WHERE p.usuario_id = $1 AND dp.producto_id = $2 AND p.estado != 'cancelado'
     LIMIT 1`,
    [userId, productoId]
  );

  if (!compra) return NextResponse.json({ puede: false });

  const resena = await queryOne(
    "SELECT id, estrellas, comentario FROM resenas WHERE usuario_id = $1 AND producto_id = $2",
    [userId, productoId]
  );

  return NextResponse.json({ puede: true, resena: resena ?? null });
}
