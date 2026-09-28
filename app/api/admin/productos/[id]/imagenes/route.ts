export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

function isAdmin(session: Session | null) {
  const rol = (session?.user as { rol?: string })?.rol;
  return session?.user && (rol === "admin" || rol === "general" || rol === "inventarios");
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rows = await query(
    "SELECT id, url, es_principal FROM imagenes_producto WHERE producto_id = $1 ORDER BY es_principal DESC, id ASC",
    [params.id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: "URL requerida." }, { status: 400 });

  // Si es la primera imagen, marcarla como principal
  const [{ count }] = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM imagenes_producto WHERE producto_id = $1",
    [params.id]
  );
  const esPrincipal = Number(count) === 0;

  const row = await queryOne(
    "INSERT INTO imagenes_producto (producto_id, url, es_principal) VALUES ($1, $2, $3) RETURNING *",
    [params.id, url.trim(), esPrincipal]
  );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { imagen_id } = await req.json();
  // Quitar principal de todas, luego poner en la elegida
  await query("UPDATE imagenes_producto SET es_principal = false WHERE producto_id = $1", [params.id]);
  await query("UPDATE imagenes_producto SET es_principal = true WHERE id = $1 AND producto_id = $2", [imagen_id, params.id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { imagen_id } = await req.json();
  await query("DELETE FROM imagenes_producto WHERE id = $1 AND producto_id = $2", [imagen_id, params.id]);

  // Si se eliminó la principal, promover la siguiente
  await query(
    `UPDATE imagenes_producto SET es_principal = true
     WHERE producto_id = $1 AND id = (SELECT id FROM imagenes_producto WHERE producto_id = $1 ORDER BY id LIMIT 1)
       AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE producto_id = $1 AND es_principal = true)`,
    [params.id]
  );
  return NextResponse.json({ ok: true });
}
