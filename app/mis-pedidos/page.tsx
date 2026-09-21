"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Perfil, EstadoPedido } from "@/lib/types";
import { Suspense } from "react";

interface Pedido {
  id: number;
  total: number;
  estado: EstadoPedido;
  notas: string | null;
  created_at: string;
  detalle_pedido: { nombre_producto: string; cantidad: number; precio_unitario: number }[];
}

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const ESTADO_COLOR: Record<EstadoPedido, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-guinda-100 text-guinda-700",
  enviado: "bg-purple-100 text-purple-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

function MisPedidosContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nuevoPedidoId = searchParams.get("nuevo");

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(nuevoPedidoId ? Number(nuevoPedidoId) : null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      setPerfil(p);

      const { data } = await supabase
        .from("pedidos")
        .select("id, total, estado, notas, created_at, detalle_pedido(nombre_producto, cantidad, precio_unitario)")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      setPedidos((data as unknown as Pedido[]) ?? []);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} cartCount={0} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis pedidos</h1>

        {nuevoPedidoId && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
            ✅ ¡Tu pedido #{nuevoPedidoId} fue confirmado! Lo recibirás pronto.
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg mb-4">Aún no tienes pedidos</p>
            <a href="/tienda" className="bg-guinda-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-guinda-800 transition">
              Ver productos
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Pedido #{pedido.id}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(pedido.created_at).toLocaleDateString("es-MX", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLOR[pedido.estado]}`}>
                      {ESTADO_LABEL[pedido.estado]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">
                      ${Number(pedido.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandido === pedido.id ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandido === pedido.id && (
                  <div className="border-t border-gray-100 px-6 py-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Productos</h3>
                    <div className="space-y-2">
                      {pedido.detalle_pedido.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{d.nombre_producto} × {d.cantidad}</span>
                          <span className="font-medium">
                            ${(d.precio_unitario * d.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                    {pedido.notas && (
                      <p className="text-sm text-gray-500 mt-3 italic">Nota: {pedido.notas}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MisPedidosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" /></div>}>
      <MisPedidosContent />
    </Suspense>
  );
}
