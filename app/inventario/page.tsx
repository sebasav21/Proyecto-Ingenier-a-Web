"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Perfil } from "@/lib/types";

interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
  categorias: { nombre: string } | null;
}

interface Movimiento {
  id: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  created_at: string;
  productos: { nombre: string } | null;
}

export default function InventarioPage() {
  const supabase = createClient();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ producto_id: "", tipo: "entrada", cantidad: "", motivo: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      if (!p || (p.rol !== "inventarios" && p.rol !== "admin" && p.rol !== "general")) {
        router.push("/tienda"); return;
      }
      setPerfil(p);
      await cargarDatos();
    }
    init();
  }, []);

  async function cargarDatos() {
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from("productos").select("id, nombre, stock, precio, categorias(nombre)")
        .eq("activo", true).order("nombre"),
      supabase.from("historial_inventario")
        .select("id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, created_at, productos(nombre)")
        .order("created_at", { ascending: false }).limit(50),
    ]);
    setProductos((prods as unknown as Producto[]) ?? []);
    setMovimientos((movs as unknown as Movimiento[]) ?? []);
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const producto = productos.find((p) => p.id === Number(form.producto_id));
    if (!producto) return;

    const cantidad = Number(form.cantidad);
    let stockNuevo = producto.stock;

    if (form.tipo === "entrada") stockNuevo = producto.stock + cantidad;
    else if (form.tipo === "salida") stockNuevo = Math.max(0, producto.stock - cantidad);
    else stockNuevo = cantidad; // ajuste directo

    // Registrar movimiento
    await supabase.from("historial_inventario").insert({
      producto_id: producto.id,
      usuario_id: user.id,
      tipo: form.tipo,
      cantidad,
      stock_anterior: producto.stock,
      stock_nuevo: stockNuevo,
      motivo: form.motivo.trim() || null,
    });

    // Actualizar stock
    await supabase.from("productos").update({ stock: stockNuevo }).eq("id", producto.id);

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
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            + Registrar movimiento
          </button>
        </div>

        {/* Alertas stock bajo */}
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
                        <p className="text-xs text-gray-400">{p.categorias?.nombre}</p>
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
                    <div key={m.id} className="px-4 py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{m.productos?.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(m.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {m.motivo && <p className="text-xs text-gray-500 mt-0.5 italic">{m.motivo}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[m.tipo]}`}>
                          {m.tipo}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {m.stock_anterior} → <span className="font-bold text-gray-900">{m.stock_nuevo}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal registrar movimiento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Registrar movimiento</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <select value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecciona un producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["entrada", "salida", "ajuste"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t })}
                      className={`py-2 rounded-lg text-sm font-medium border transition ${form.tipo === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {form.tipo === "ajuste" ? "El stock se establecerá exactamente a la cantidad indicada" :
                   form.tipo === "entrada" ? "Se sumará al stock actual" : "Se restará del stock actual"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.tipo === "ajuste" ? "Nuevo stock *" : "Cantidad *"}
                </label>
                <input type="number" min="1" value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Ej. Reabastecimiento, merma, devolución..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setError(""); }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={registrarMovimiento} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
