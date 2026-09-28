export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const rows = await query(
    `SELECT * FROM metodos_pago WHERE usuario_id = $1 AND activo = true ORDER BY es_principal DESC, id ASC`,
    [userId]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { nombre_titular, numero_tarjeta, mes_vencimiento, anio_vencimiento, es_principal } = await req.json();

  if (!nombre_titular || !numero_tarjeta || !mes_vencimiento || !anio_vencimiento) {
    return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
  }

  const ultimos = String(numero_tarjeta).replace(/\s/g, "").slice(-4);

  const existentes = await query("SELECT id FROM metodos_pago WHERE usuario_id = $1 AND activo = true", [userId]);
  const hacerPrincipal = es_principal || existentes.length === 0;

  if (hacerPrincipal) {
    await query("UPDATE metodos_pago SET es_principal = false WHERE usuario_id = $1", [userId]);
  }

  const row = await queryOne(
    `INSERT INTO metodos_pago (usuario_id, tipo, nombre_titular, ultimos_digitos, mes_vencimiento, anio_vencimiento, es_principal)
     VALUES ($1, 'tarjeta', $2, $3, $4, $5, $6) RETURNING *`,
    [userId, nombre_titular, ultimos, mes_vencimiento, anio_vencimiento, hacerPrincipal]
  );

  return NextResponse.json(row);
}
