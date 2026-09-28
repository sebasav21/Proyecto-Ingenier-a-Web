export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

function hasAccess(session: Session | null) {
  const rol = (session?.user as { rol?: string })?.rol;
  return session?.user && ["admin", "general", "inventarios"].includes(rol ?? "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!hasAccess(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const [productos, movimientos] = await Promise.all([
    query(
      `SELECT p.id, p.nombre, p.stock, p.precio, c.nombre AS categoria_nombre
       FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = true ORDER BY p.nombre`
    ),
    query(
      `SELECT h.*, p.nombre AS producto_nombre
       FROM historial_inventario h
       JOIN productos p ON p.id = h.producto_id
       ORDER BY h.created_at DESC LIMIT 50`
    ),
  ]);

  return NextResponse.json({ productos, movimientos });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!hasAccess(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const userId = (session!.user as { id: string }).id;
  const { producto_id, tipo, cantidad, motivo } = await req.json();

  const [prod] = await query<{ stock: number }>(
    "SELECT stock FROM productos WHERE id = $1",
    [producto_id]
  );
  if (!prod) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  let stockNuevo = prod.stock;
  if (tipo === "entrada") stockNuevo = prod.stock + cantidad;
  else if (tipo === "salida") stockNuevo = Math.max(0, prod.stock - cantidad);
  else stockNuevo = cantidad;

  await query(
    `INSERT INTO historial_inventario (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [producto_id, userId, tipo, cantidad, prod.stock, stockNuevo, motivo ?? null]
  );
  await query("UPDATE productos SET stock = $1 WHERE id = $2", [stockNuevo, producto_id]);

  return NextResponse.json({ ok: true });
}
