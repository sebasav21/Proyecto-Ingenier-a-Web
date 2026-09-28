import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const pedidos = await query(
    `SELECT p.*,
       json_agg(json_build_object(
         'nombre_producto', dp.nombre_producto,
         'cantidad', dp.cantidad,
         'precio_unitario', dp.precio_unitario
       )) AS items
     FROM pedidos p
     LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
     WHERE p.usuario_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { notas } = await req.json();

  const carrito = await queryOne<{ id: number }>(
    "SELECT id FROM carritos WHERE usuario_id = $1",
    [userId]
  );
  if (!carrito) return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });

  const items = await query<{
    producto_id: number; nombre: string; precio: number; cantidad: number; stock: number;
  }>(
    `SELECT ic.producto_id, p.nombre, p.precio, ic.cantidad, p.stock
     FROM items_carrito ic JOIN productos p ON p.id = ic.producto_id
     WHERE ic.carrito_id = $1`,
    [carrito.id]
  );

  if (!items.length) return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });

  const total = items.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0);

  const pedido = await queryOne<{ id: number }>(
    "INSERT INTO pedidos (usuario_id, total, notas) VALUES ($1, $2, $3) RETURNING id",
    [userId, total, notas ?? null]
  );

  for (const item of items) {
    await query(
      "INSERT INTO detalle_pedido (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad) VALUES ($1,$2,$3,$4,$5)",
      [pedido!.id, item.producto_id, item.nombre, item.precio, item.cantidad]
    );
    const nuevoStock = Math.max(0, item.stock - item.cantidad);
    await query("UPDATE productos SET stock = $1 WHERE id = $2", [nuevoStock, item.producto_id]);
  }

  await query("DELETE FROM items_carrito WHERE carrito_id = $1", [carrito.id]);

  return NextResponse.json({ id: pedido!.id });
}
