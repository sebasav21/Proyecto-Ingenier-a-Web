"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Resumen { total_ventas: string; num_pedidos: string; unidades_vendidas: string; }
interface ProductoVenta { nombre_producto: string; unidades: string; ingresos: string; }
interface VentaDia { fecha: string; total: string; pedidos: string; }
interface MasVendido { nombre_producto: string; unidades: string; }

export default function AdminReportesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const [filtroMes, setFiltroMes] = useState(mesActual);
  const [filtroDia, setFiltroDia] = useState("");
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [porProducto, setPorProducto] = useState<ProductoVenta[]>([]);
  const [porDia, setPorDia] = useState<VentaDia[]>([]);
  const [masVendido, setMasVendido] = useState<MasVendido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;
    init();
  }, [status]);

  async function init() {
    const perfilRes = await fetch("/api/perfil");
    const p = await perfilRes.json();
    if (!p || (p.rol !== "admin" && p.rol !== "general")) { router.push("/tienda"); return; }
    setPerfil(p);
    await cargar(filtroMes, "");
    setLoading(false);
  }

  async function cargar(mes: string, dia: string) {
    const params = new URLSearchParams();
    if (dia) params.set("dia", dia);
    else if (mes) params.set("mes", mes);
    const res = await fetch(`/api/admin/reportes?${params}`);
    const data = await res.json();
    setResumen(data.resumen);
    setPorProducto(data.porProducto ?? []);
    setPorDia(data.porDia ?? []);
    setMasVendido(data.masVendidoMes ?? null);
  }

  function aplicarFiltro() {
    cargar(filtroMes, filtroDia);
  }

  function limpiar() {
    setFiltroDia("");
    setFiltroMes(mesActual);
    cargar(mesActual, "");
  }

  const maxVentas = Math.max(...porProducto.map((p) => Number(p.unidades)), 1);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => router.push("/admin")} className="text-gray-400 hover:text-gray-600 text-sm mb-4 block">
          ← Panel admin
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reporte de ventas</h1>
        <p className="text-sm text-gray-500 mb-6">Consulta el desempeño de ventas por mes o día</p>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mes</label>
            <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Día específico (opcional)</label>
            <input type="date" value={filtroDia} onChange={(e) => setFiltroDia(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
          </div>
          <button onClick={aplicarFiltro}
            className="bg-guinda-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
            Aplicar filtro
          </button>
          <button onClick={limpiar}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
            Limpiar
          </button>
        </div>

        {/* Producto más vendido del mes */}
        {masVendido && (
          <div className="bg-guinda-700 text-white rounded-xl p-5 mb-6 flex items-center gap-4">
            <span className="text-4xl">🏆</span>
            <div>
              <p className="text-xs text-guinda-200 font-medium uppercase tracking-wide">Producto más vendido del mes</p>
              <p className="text-lg font-bold mt-0.5">{masVendido.nombre_producto}</p>
              <p className="text-guinda-200 text-sm">{masVendido.unidades} unidades vendidas</p>
            </div>
          </div>
        )}

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total en ventas", value: `$${Number(resumen?.total_ventas ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, icon: "💰" },
            { label: "Pedidos", value: resumen?.num_pedidos ?? 0, icon: "🛒" },
            { label: "Unidades vendidas", value: resumen?.unidades_vendidas ?? 0, icon: "📦" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas por producto */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Ventas por producto</h2>
            </div>
            {porProducto.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Sin ventas en este periodo.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {porProducto.map((p, i) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-900 truncate flex-1 mr-2">{p.nombre_producto}</p>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-gray-900">{p.unidades} uds.</p>
                        <p className="text-xs text-gray-400">${Number(p.ingresos).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-guinda-700 rounded-full"
                        style={{ width: `${(Number(p.unidades) / maxVentas) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ventas por día */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Ventas por día</h2>
            </div>
            {porDia.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Sin ventas en este periodo.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {porDia.map((d, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(d.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-gray-400">{d.pedidos} {Number(d.pedidos) === 1 ? "pedido" : "pedidos"}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      ${Number(d.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
