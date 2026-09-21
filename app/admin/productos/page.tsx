"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Perfil } from "@/lib/types";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
  categorias: { nombre: string } | null;
}

interface Categoria { id: number; nombre: string; }

export default function AdminProductosPage() {
  const supabase = createClient();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", stock: "", categoria_id: "" });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      if (!p || (p.rol !== "admin" && p.rol !== "general")) { router.push("/tienda"); return; }
      setPerfil(p);
      await cargarDatos();
    }
    init();
  }, []);

  async function cargarDatos() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("productos").select("id, nombre, precio, stock, activo, categorias(nombre)").order("id"),
      supabase.from("categorias").select("id, nombre").eq("activo", true).order("nombre"),
    ]);
    setProductos((prods as unknown as Producto[]) ?? []);
    setCategorias(cats ?? []);
    setLoading(false);
  }

  function abrirFormNuevo() {
    setEditando(null);
    setForm({ nombre: "", descripcion: "", precio: "", stock: "", categoria_id: "" });
    setShowForm(true);
  }

  function abrirFormEditar(p: Producto) {
    setEditando(p);
    setForm({ nombre: p.nombre, descripcion: "", precio: String(p.precio), stock: String(p.stock), categoria_id: "" });
    setShowForm(true);
  }

  function validateForm(): string {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) < 0) return "El precio debe ser un número válido.";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) return "El stock debe ser un número válido.";
    return "";
  }

  async function guardar() {
    const err = validateForm();
    if (err) { alert(err); return; }
    setSaving(true);

    const data = {
      nombre: form.nombre.trim(),
      precio: Number(form.precio),
      stock: Number(form.stock),
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
    };

    if (editando) {
      await supabase.from("productos").update(data).eq("id", editando.id);
    } else {
      await supabase.from("productos").insert({ ...data, descripcion: form.descripcion.trim() || null });
    }

    setShowForm(false);
    await cargarDatos();
    setSaving(false);
  }

  async function toggleActivo(id: number, activo: boolean) {
    await supabase.from("productos").update({ activo: !activo }).eq("id", id);
    setProductos((prev) => prev.map((p) => p.id === id ? { ...p, activo: !activo } : p));
  }

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
            <Link href="/admin" className="text-sm text-guinda-700 hover:underline">← Panel admin</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Productos</h1>
          </div>
          <button onClick={abrirFormNuevo}
            className="bg-guinda-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
            + Nuevo producto
          </button>
        </div>

        {/* Modal formulario */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="font-bold text-lg mb-4">{editando ? "Editar producto" : "Nuevo producto"}</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
                </div>
                {!editando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 resize-none" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                    <input type="number" min="0" step="0.01" value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input type="number" min="0" value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500">
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={saving}
                  className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productos.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.activo ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categorias?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(p.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-gray-900"}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => abrirFormEditar(p)}
                        className="text-guinda-700 hover:underline text-xs">Editar</button>
                      <button onClick={() => toggleActivo(p.id, p.activo)}
                        className="text-gray-400 hover:text-gray-600 text-xs">
                        {p.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
