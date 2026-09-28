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

  const rows = await query("SELECT * FROM categorias ORDER BY nombre");
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { nombre, descripcion } = await req.json();
  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const row = await queryOne(
    "INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *",
    [nombre.trim(), descripcion?.trim() || null]
  );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, nombre, descripcion, activo } = await req.json();
  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  await query(
    "UPDATE categorias SET nombre=$1, descripcion=$2, activo=$3 WHERE id=$4",
    [nombre.trim(), descripcion?.trim() || null, activo ?? true, id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  await query("UPDATE categorias SET activo = false WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
