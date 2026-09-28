"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Categoria {
  id: number; nombre: string; descripcion: string | null; activo: boolean;
}

const FORM_VACIO = { nombre: "", descripcion: "" };

export default function AdminCategoriasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;
    cargar();
  }, [status]);

  async function cargar() {
    const [perfilRes, catsRes] = await Promise.all([
      fetch("/api/perfil"),
      fetch("/api/admin/categorias"),
    ]);
    const p = await perfilRes.json();
    if (!p || (p.rol !== "admin" && p.rol !== "general")) { router.push("/tienda"); return; }
    setPerfil(p);
    setCategorias(await catsRes.json());
    setLoading(false);
  }

  function abrirNueva() {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setShowForm(true);
  }

  function abrirEditar(c: Categoria) {
    setEditando(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? "" });
    setError("");
    setShowForm(true);
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true); setError("");

    if (editando) {
      await fetch("/api/admin/categorias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editando.id, nombre: form.nombre, descripcion: form.descripcion, activo: editando.activo }),
      });
    } else {
      await fetch("/api/admin/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre, descripcion: form.descripcion }),
      });
    }

    setShowForm(false);
    setSaving(false);
    await cargar();
  }

  async function eliminar(c: Categoria) {
    await fetch("/api/admin/categorias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id }),
    });
    setConfirmDelete(null);
    await cargar();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activas = categorias.filter((c) => c.activo);
  const inactivas = categorias.filter((c) => !c.activo);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.push("/admin")} className="text-gray-400 hover:text-gray-600">
            ← Panel admin
          </button>
        </div>
        <div className="flex items-center justify-between mb-6 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
            <p className="text-sm text-gray-500 mt-1">Gestiona el catálogo de categorías de productos</p>
          </div>
          <button onClick={abrirNueva}
            className="bg-guinda-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
            + Nueva categoría
          </button>
        </div>

        {/* Activas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Activas ({activas.length})</p>
          </div>
          {activas.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">No hay categorías activas.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {activas.map((c) => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                    {c.descripcion && <p className="text-xs text-gray-400 mt-0.5">{c.descripcion}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => abrirEditar(c)}
                      className="text-xs text-gray-500 hover:text-gray-700 hover:underline">Editar</button>
                    <button onClick={() => setConfirmDelete(c)}
                      className="text-xs text-red-500 hover:underline">Desactivar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactivas */}
        {inactivas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inactivas ({inactivas.length})</p>
            </div>
            <div className="divide-y divide-gray-50">
              {inactivas.map((c) => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between opacity-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                    {c.descripcion && <p className="text-xs text-gray-400 mt-0.5">{c.descripcion}</p>}
                  </div>
                  <button onClick={() => abrirEditar(c)}
                    className="text-xs text-guinda-700 hover:underline">Reactivar</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">{editando ? "Editar categoría" : "Nueva categoría"}</h2>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Electrónica"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 resize-none" />
              </div>
              {editando && !editando.activo && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" defaultChecked onChange={(e) => setEditando({ ...editando, activo: e.target.checked })} className="rounded" />
                  Reactivar categoría
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={guardar} disabled={saving}
                className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación desactivar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">¿Desactivar categoría?</h2>
            <p className="text-sm text-gray-500 mb-1">Categoría: <strong>{confirmDelete.nombre}</strong></p>
            <p className="text-sm text-gray-500 mb-6">Los productos de esta categoría seguirán visibles pero sin categoría asignada.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => eliminar(confirmDelete)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
