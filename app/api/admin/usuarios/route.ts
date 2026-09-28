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
    `SELECT id, nombre, apellido_paterno, apellido_materno, email, telefono, rfc, curp, rol, activo, created_at
     FROM usuarios ORDER BY created_at DESC`
  );
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, rol, activo } = await req.json();
  const validRoles = ["admin", "cliente", "inventarios", "general"];
  if (rol && !validRoles.includes(rol))
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });

  await query(
    "UPDATE usuarios SET rol = COALESCE($1, rol), activo = COALESCE($2, activo) WHERE id = $3",
    [rol ?? null, activo ?? null, id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  const selfId = (session!.user as { id: string }).id;
  if (id === selfId) return NextResponse.json({ error: "No puedes desactivar tu propia cuenta." }, { status: 400 });

  await query("UPDATE usuarios SET activo = false WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
