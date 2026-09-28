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
    await query("UPDATE metodos_pago SET es_principal = false WHERE usuario_id = $1", [userId]);
    await query("UPDATE metodos_pago SET es_principal = true WHERE id = $1 AND usuario_id = $2", [id, userId]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const id = Number(params.id);
  await query("UPDATE metodos_pago SET activo = false WHERE id = $1 AND usuario_id = $2", [id, userId]);
  return NextResponse.json({ ok: true });
}
