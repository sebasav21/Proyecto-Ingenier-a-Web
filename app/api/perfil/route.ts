import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(null);

  const userId = (session.user as { id: string }).id;
  const perfil = await queryOne(
    "SELECT id, nombre, apellido_paterno, apellido_materno, email, telefono, rol FROM usuarios WHERE id = $1",
    [userId]
  );
  return NextResponse.json(perfil);
}
