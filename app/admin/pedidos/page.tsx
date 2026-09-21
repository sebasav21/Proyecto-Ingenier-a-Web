"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Perfil, EstadoPedido } from "@/lib/types";

interface Pedido {
  id: number;
  total: number;
  estado: EstadoPedido;
  created_at: string;
  perfiles: { nombre: string; apellido_paterno: string | null; email: string } | null;
  detalle_pedido: { nombre_producto: string; cantidad: number; precio_unitario: number }[];
}

const ESTADOS: EstadoPedido[] = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"];

const ESTADO_COLOR: Record<EstadoPedido, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-guinda-100 text-guinda-700",
  enviado: "bg-purple-100 text-purple-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function AdminPedidosPage() {
  const supabase = createClient();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<EstadoPedido | "todos">("todos");
  const [actualizando, setActualizando] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      if (!p || (p.rol !== "admin" && p.rol !== "general")) { router.push("/tienda"); return; }
      setPerfil(p);
      await cargarPedidos();
    }
    init();
  }, []);

  async function cargarPedidos() {
    const { data } = await supabase
      .from("pedidos")
      .select("id, total, estado, created_at, perfiles(nombre, apellido_paterno, email), detalle_pedido(nombre_producto, cantidad, precio_unitario)")
      .order("created_at", { ascending: false });
    setPedidos((data as unknown as Pedido[]) ?? []);
    setLoading(false);
  }

  async function cambiarEstado(pedidoId: number, nuevoEstado: EstadoPedido) {
    setActualizando(pedidoId);
    await supabase.from("pedidos").update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq("id", pedidoId);
    setPedidos((prev) => prev.map((p) => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
    setActualizando(null);
  }

  const pedidosFiltrados = filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-guinda-700 hover:underline">← Panel admin</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Pedidos</h1>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["todos", ...ESTADOS] as (EstadoPedido | "todos")[]).map((e) => (
            <button key={e} onClick={() => setFiltro(e)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${filtro === e ? "bg-guinda-700 text-white" : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"}`}>
              {e === "todos" ? "Todos" : e.charAt(0).toUpperCase() + e.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                ({e === "todos" ? pedidos.length : pedidos.filter((p) => p.estado === e).length})
              </span>
            </button>
          ))}
        </div>

        {/* Lista pedidos */}
        <div className="space-y-3">
          {pedidosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">No hay pedidos</div>
          ) : pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <button onClick={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
                  className="flex items-center gap-4 flex-1 text-left">
                  <div>
                    <p className="font-semibold text-gray-900">Pedido #{pedido.id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pedido.perfiles ? `${pedido.perfiles.nombre} ${pedido.perfiles.apellido_paterno ?? ""}`.trim() : "—"}
                      {" · "}
                      {new Date(pedido.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[pedido.estado]}`}>
                    {pedido.estado}
                  </span>
                </button>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-gray-900">
                    ${Number(pedido.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  <select
                    value={pedido.estado}
                    onChange={(e) => cambiarEstado(pedido.id, e.target.value as EstadoPedido)}
                    disabled={actualizando === pedido.id}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-guinda-500 disabled:opacity-50">
                    {ESTADOS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {expandido === pedido.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">📧 {pedido.perfiles?.email}</p>
                  <div className="space-y-1">
                    {pedido.detalle_pedido.map((d, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{d.nombre_producto} × {d.cantidad}</span>
                        <span className="font-medium">${(d.precio_unitario * d.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
