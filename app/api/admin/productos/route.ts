export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

function isAdmin(session: Session | null) {
  const rol = (session?.user as { rol?: string })?.rol;
  return session?.user && (rol === "admin" || rol === "general");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rows = await query(
    `SELECT p.*, c.nombre AS categoria_nombre
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     ORDER BY p.id`
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const row = await queryOne(
    `INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, activo, dias_entrega)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [body.nombre, body.descripcion, body.precio, body.stock, body.categoria_id, body.activo ?? true, body.dias_entrega ?? 3]
  );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  await query(
    `UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, stock=$4, categoria_id=$5, activo=$6, dias_entrega=COALESCE($7, dias_entrega)
     WHERE id=$8`,
    [body.nombre, body.descripcion, body.precio, body.stock, body.categoria_id, body.activo, body.dias_entrega ?? null, body.id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  await query("UPDATE productos SET activo = false WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
