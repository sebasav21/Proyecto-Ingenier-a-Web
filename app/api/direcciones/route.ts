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
    `SELECT * FROM direcciones WHERE usuario_id = $1 AND activo = true ORDER BY es_principal DESC, id ASC`,
    [userId]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { calle, numero_exterior, numero_interior, colonia, codigo_postal, municipio, ciudad, pais, es_principal } = await req.json();

  if (!calle || !ciudad || !codigo_postal) {
    return NextResponse.json({ error: "Calle, ciudad y código postal son obligatorios." }, { status: 400 });
  }

  if (es_principal) {
    await query("UPDATE direcciones SET es_principal = false WHERE usuario_id = $1", [userId]);
  }

  const existentes = await query("SELECT id FROM direcciones WHERE usuario_id = $1 AND activo = true", [userId]);
  const hacerPrincipal = es_principal || existentes.length === 0;

  const row = await queryOne(
    `INSERT INTO direcciones (usuario_id, calle, numero_exterior, numero_interior, colonia, codigo_postal, municipio, ciudad, pais, es_principal)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [userId, calle, numero_exterior || null, numero_interior || null, colonia || null, codigo_postal, municipio || null, ciudad, pais || "México", hacerPrincipal]
  );

  return NextResponse.json(row);
}
