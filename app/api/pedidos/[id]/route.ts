import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as { rol?: string })?.rol;
  if (!session?.user || (rol !== "admin" && rol !== "general")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { estado } = await req.json();
  await query(
    "UPDATE pedidos SET estado = $1, updated_at = NOW() WHERE id = $2",
    [estado, params.id]
  );
  return NextResponse.json({ ok: true });
}
