import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { nombre, apellido_paterno, apellido_materno, email, telefono, rfc, curp, password } = await req.json();

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const existing = await queryOne("SELECT id FROM usuarios WHERE email = $1", [email]);
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, telefono, rfc, curp, password_hash, rol)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'cliente')`,
    [nombre, apellido_paterno, apellido_materno || null, email, telefono || null, rfc?.toUpperCase() || null, curp?.toUpperCase() || null, hash]
  );

  return NextResponse.json({ ok: true });
}
