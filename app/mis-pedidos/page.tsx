"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

type EstadoPedido = "pendiente" | "confirmado" | "enviado" | "entregado" | "cancelado";

interface Pedido {
  id: number;
  total: number;
  estado: EstadoPedido;
  notas: string | null;
  created_at: string;
  fecha_estimada_entrega: string | null;
  items: { nombre_producto: string; cantidad: number; precio_unitario: number }[];
  direccion: {
    calle: string; numero_exterior: string | null; colonia: string | null;
    municipio: string | null; ciudad: string; estado: string; codigo_postal: string;
  } | null;
}

const PASOS: { key: EstadoPedido; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "confirmado", label: "Confirmado" },
  { key: "enviado", label: "En camino" },
  { key: "entregado", label: "Entregado" },
];

const ESTADO_COLOR: Record<EstadoPedido, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  enviado: "bg-purple-100 text-purple-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const ESTADO_ICON: Record<EstadoPedido, string> = {
  pendiente: "🕐",
  confirmado: "✅",
  enviado: "🚚",
  entregado: "📦",
  cancelado: "❌",
};

function PasoStepper({ estado }: { estado: EstadoPedido }) {
  if (estado === "cancelado") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
        ❌ Este pedido fue cancelado
      </div>
    );
  }

  const pasoActual = PASOS.findIndex((p) => p.key === estado);

  return (
    <div className="flex items-center gap-0 mt-4">
      {PASOS.map((paso, i) => {
        const completado = i <= pasoActual;
        const esActual = i === pasoActual;
        return (
          <div key={paso.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${completado ? "bg-guinda-700 text-white" : "bg-gray-200 text-gray-400"}
                ${esActual ? "ring-2 ring-guinda-300 ring-offset-1" : ""}`}>
                {completado ? "✓" : i + 1}
              </div>
              <span className={`text-xs mt-1 text-center leading-tight
                ${completado ? "text-guinda-700 font-semibold" : "text-gray-400"}`}>
                {paso.label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < pasoActual ? "bg-guinda-700" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MisPedidosContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nuevoPedidoId = searchParams.get("nuevo");

  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(nuevoPedidoId ? Number(nuevoPedidoId) : null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;

    async function init() {
      const [perfilRes, pedidosRes] = await Promise.all([
        fetch("/api/perfil"),
        fetch("/api/pedidos"),
      ]);
      setPerfil(await perfilRes.json());
      setPedidos(await pedidosRes.json());
      setLoading(false);
    }
    init();
  }, [status]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} cartCount={0} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis pedidos</h1>
        <p className="text-sm text-gray-500 mb-6">Consulta el estado y seguimiento de tus compras</p>

        {nuevoPedidoId && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-4 mb-6 text-sm flex items-start gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <p className="font-semibold">¡Pedido #{nuevoPedidoId} confirmado!</p>
              <p className="text-green-600 mt-0.5">Tu pedido fue recibido y está siendo procesado. Puedes rastrear su estado aquí.</p>
            </div>
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
              <div key={pedido.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {/* Header del pedido */}
                <button
                  onClick={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ESTADO_ICON[pedido.estado]}</span>
                    <div>
                      <p className="font-semibold text-gray-900">Pedido #{pedido.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Realizado el {new Date(pedido.created_at).toLocaleDateString("es-MX", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLOR[pedido.estado]}`}>
                      {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
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

                {/* Detalle expandido */}
                {expandido === pedido.id && (
                  <div className="border-t border-gray-100 px-6 py-5 space-y-5">

                    {/* Stepper de seguimiento */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Seguimiento del pedido</p>
                      <PasoStepper estado={pedido.estado} />
                    </div>

                    {/* Fecha estimada de entrega */}
                    {pedido.fecha_estimada_entrega && pedido.estado !== "cancelado" && pedido.estado !== "entregado" && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        <div>
                          <p className="text-xs text-blue-500 font-medium">Entrega estimada</p>
                          <p className="text-sm font-bold text-blue-800">
                            {new Date(pedido.fecha_estimada_entrega).toLocaleDateString("es-MX", {
                              weekday: "long", day: "numeric", month: "long", year: "numeric"
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {pedido.estado === "entregado" && (
                      <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <p className="text-sm font-medium text-green-700">Tu pedido fue entregado exitosamente.</p>
                      </div>
                    )}

                    {/* Dirección de entrega */}
                    {pedido.direccion?.calle && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dirección de entrega</p>
                        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700">
                          <p>{pedido.direccion.calle} {pedido.direccion.numero_exterior}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {[pedido.direccion.colonia, pedido.direccion.municipio, pedido.direccion.ciudad, pedido.direccion.estado].filter(Boolean).join(", ")} · CP {pedido.direccion.codigo_postal}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Productos */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Productos</p>
                      <div className="space-y-2">
                        {pedido.items?.map((d, i) => (
                          <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                            <span className="text-gray-700">{d.nombre_producto} × {d.cantidad}</span>
                            <span className="font-medium text-gray-900">
                              ${(d.precio_unitario * d.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold pt-1">
                          <span>Total</span>
                          <span>${Number(pedido.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {pedido.notas && (
                      <p className="text-sm text-gray-500 italic">Nota: {pedido.notas}</p>
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
