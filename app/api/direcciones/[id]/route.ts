export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const id = Number(params.id);
  const body = await req.json();

  if (body.set_principal) {
    await query("UPDATE direcciones SET es_principal = false WHERE usuario_id = $1", [userId]);
    await query("UPDATE direcciones SET es_principal = true WHERE id = $1 AND usuario_id = $2", [id, userId]);
    return NextResponse.json({ ok: true });
  }

  const { calle, numero_exterior, numero_interior, colonia, codigo_postal, municipio, ciudad, estado, pais } = body;
  await query(
    `UPDATE direcciones SET calle=$1, numero_exterior=$2, numero_interior=$3, colonia=$4,
     codigo_postal=$5, municipio=$6, ciudad=$7, estado=$8, pais=$9 WHERE id=$10 AND usuario_id=$11`,
    [calle, numero_exterior || null, numero_interior || null, colonia || null, codigo_postal, municipio || null, ciudad, estado, pais || "México", id, userId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const id = Number(params.id);
  await query("UPDATE direcciones SET activo = false WHERE id = $1 AND usuario_id = $2", [id, userId]);
  return NextResponse.json({ ok: true });
}
