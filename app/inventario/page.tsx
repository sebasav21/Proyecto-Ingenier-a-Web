"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
  categoria_nombre: string | null;
}

interface Movimiento {
  id: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  created_at: string;
  producto_nombre: string;
}

export default function InventarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ producto_id: "", tipo: "entrada", cantidad: "", motivo: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;

    async function init() {
      const perfilRes = await fetch("/api/perfil");
      const p = await perfilRes.json();
      if (!p || !["inventarios", "admin", "general"].includes(p.rol)) { router.push("/tienda"); return; }
      setPerfil(p);
      await cargarDatos();
    }
    init();
  }, [status]);

  async function cargarDatos() {
    const res = await fetch("/api/inventario");
    const data = await res.json();
    setProductos(data.productos ?? []);
    setMovimientos(data.movimientos ?? []);
    setLoading(false);
  }

  function validate(): string {
    if (!form.producto_id) return "Selecciona un producto.";
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0)
      return "La cantidad debe ser mayor a 0.";
    return "";
  }

  async function registrarMovimiento() {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");

    await fetch("/api/inventario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        producto_id: Number(form.producto_id),
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        motivo: form.motivo.trim() || null,
      }),
    });

    setShowForm(false);
    setForm({ producto_id: "", tipo: "entrada", cantidad: "", motivo: "" });
    await cargarDatos();
    setSaving(false);
  }

  const stockBajo = productos.filter((p) => p.stock < 5);

  const TIPO_COLOR = {
    entrada: "bg-green-100 text-green-700",
    salida: "bg-red-100 text-red-700",
    ajuste: "bg-blue-100 text-blue-700",
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de inventario</h1>
            <p className="text-sm text-gray-500 mt-1">Registra entradas, salidas y ajustes de stock</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="bg-guinda-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
            + Registrar movimiento
          </button>
        </div>

        {stockBajo.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Productos con stock bajo</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {stockBajo.map((p) => (
                <span key={p.id} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  {p.nombre} — {p.stock} unidades
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="font-bold text-lg mb-4">Registrar movimiento</h2>
              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                  <select value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500">
                    <option value="">Seleccionar...</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500">
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste directo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.tipo === "ajuste" ? "Nuevo stock *" : "Cantidad *"}
                  </label>
                  <input type="number" min="1" value={form.cantidad}
                    onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <input type="text" value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                    placeholder="Opcional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={registrarMovimiento} disabled={saving}
                  className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                  {saving ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock actual */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Stock actual</h2>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Producto</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900 text-xs truncate max-w-[180px]">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.categoria_nombre}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-gray-900"}`}>
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historial */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Últimos movimientos</h2>
            </div>
            <div className="overflow-auto max-h-96">
              {movimientos.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Sin movimientos registrados</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {movimientos.map((m) => (
                    <div key={m.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{m.producto_nombre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {m.stock_anterior} → {m.stock_nuevo} unidades
                            {m.motivo && ` · ${m.motivo}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[m.tipo]}`}>
                            {m.tipo}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(m.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
