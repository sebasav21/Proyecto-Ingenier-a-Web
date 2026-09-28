import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const rows = await query("SELECT * FROM categorias WHERE activo = true ORDER BY nombre");
  return NextResponse.json(rows);
}
