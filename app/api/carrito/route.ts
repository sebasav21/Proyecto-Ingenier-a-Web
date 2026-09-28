import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

async function getOrCreateCart(userId: string) {
  let carrito = await queryOne<{ id: number }>(
    "SELECT id FROM carritos WHERE usuario_id = $1",
    [userId]
  );
  if (!carrito) {
    carrito = await queryOne<{ id: number }>(
      "INSERT INTO carritos (usuario_id) VALUES ($1) RETURNING id",
      [userId]
    );
  }
  return carrito!.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const carrito = await queryOne<{ id: number }>(
    "SELECT id FROM carritos WHERE usuario_id = $1",
    [userId]
  );
  if (!carrito) return NextResponse.json([]);

  const items = await query(
    `SELECT ic.id, ic.cantidad, p.id AS producto_id, p.nombre, p.precio, p.stock,
       COALESCE((SELECT url FROM imagenes_producto WHERE producto_id = p.id AND es_principal = true LIMIT 1), '') AS imagen
     FROM items_carrito ic
     JOIN productos p ON p.id = ic.producto_id
     WHERE ic.carrito_id = $1`,
    [carrito.id]
  );
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { producto_id, cantidad = 1 } = await req.json();

  const carritoId = await getOrCreateCart(userId);

  const existing = await queryOne<{ id: number; cantidad: number }>(
    "SELECT id, cantidad FROM items_carrito WHERE carrito_id = $1 AND producto_id = $2",
    [carritoId, producto_id]
  );

  if (existing) {
    await query(
      "UPDATE items_carrito SET cantidad = $1 WHERE id = $2",
      [existing.cantidad + cantidad, existing.id]
    );
  } else {
    await query(
      "INSERT INTO items_carrito (carrito_id, producto_id, cantidad) VALUES ($1, $2, $3)",
      [carritoId, producto_id, cantidad]
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { item_id } = await req.json();
  await query("DELETE FROM items_carrito WHERE id = $1", [item_id]);
  return NextResponse.json({ ok: true });
}
