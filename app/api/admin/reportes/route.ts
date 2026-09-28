export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

function isAdmin(session: Session | null) {
  const rol = (session?.user as { rol?: string })?.rol;
  return session?.user && (rol === "admin" || rol === "general");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");   // YYYY-MM
  const dia = searchParams.get("dia");   // YYYY-MM-DD

  let wherePedido = "WHERE p.estado != 'cancelado'";
  const params: string[] = [];

  if (dia) {
    params.push(dia);
    wherePedido += ` AND DATE(p.created_at) = $${params.length}`;
  } else if (mes) {
    params.push(mes);
    wherePedido += ` AND TO_CHAR(p.created_at, 'YYYY-MM') = $${params.length}`;
  }

  // Resumen general
  const [resumen] = await query<{ total_ventas: string; num_pedidos: string; unidades_vendidas: string }>(
    `SELECT
       COALESCE(SUM(p.total), 0) AS total_ventas,
       COUNT(DISTINCT p.id) AS num_pedidos,
       COALESCE(SUM(dp.cantidad), 0) AS unidades_vendidas
     FROM pedidos p
     LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
     ${wherePedido}`,
    params
  );

  // Ventas por producto
  const porProducto = await query<{ nombre_producto: string; unidades: string; ingresos: string }>(
    `SELECT dp.nombre_producto, SUM(dp.cantidad) AS unidades, SUM(dp.cantidad * dp.precio_unitario) AS ingresos
     FROM detalle_pedido dp
     JOIN pedidos p ON p.id = dp.pedido_id
     ${wherePedido}
     GROUP BY dp.nombre_producto
     ORDER BY unidades DESC`,
    params
  );

  // Ventas por día (para gráfico)
  const porDia = await query<{ fecha: string; total: string; pedidos: string }>(
    `SELECT DATE(p.created_at) AS fecha, SUM(p.total) AS total, COUNT(*) AS pedidos
     FROM pedidos p
     ${wherePedido}
     GROUP BY DATE(p.created_at)
     ORDER BY fecha ASC`,
    params
  );

  // Producto más vendido por mes (siempre, sin filtro de día)
  const masMes = mes || (dia ? dia.slice(0, 7) : null);
  let masVendidoMes = null;
  if (masMes) {
    const [mv] = await query<{ nombre_producto: string; unidades: string }>(
      `SELECT dp.nombre_producto, SUM(dp.cantidad) AS unidades
       FROM detalle_pedido dp
       JOIN pedidos p ON p.id = dp.pedido_id
       WHERE p.estado != 'cancelado' AND TO_CHAR(p.created_at, 'YYYY-MM') = $1
       GROUP BY dp.nombre_producto ORDER BY unidades DESC LIMIT 1`,
      [masMes]
    );
    masVendidoMes = mv ?? null;
  }

  return NextResponse.json({ resumen, porProducto, porDia, masVendidoMes });
}
