"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
  categoria_nombre: string | null;
  dias_entrega: number;
}

interface Categoria { id: number; nombre: string; }
interface Imagen { id: number; url: string; es_principal: boolean; }

export default function AdminProductosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", stock: "", categoria_id: "", dias_entrega: "3" });

  // Estado para modal de imágenes
  const [imgProducto, setImgProducto] = useState<Producto | null>(null);
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [savingImg, setSavingImg] = useState(false);

  // Confirmaciones
  const [confirmToggle, setConfirmToggle] = useState<Producto | null>(null);
  const [confirmEliminarImg, setConfirmEliminarImg] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;

    async function init() {
      const perfilRes = await fetch("/api/perfil");
      const p = await perfilRes.json();
      if (!p || (p.rol !== "admin" && p.rol !== "general")) { router.push("/tienda"); return; }
      setPerfil(p);
      await cargarDatos();
    }
    init();
  }, [status]);

  async function cargarDatos() {
    const [prodsRes, catsRes] = await Promise.all([
      fetch("/api/admin/productos"),
      fetch("/api/categorias"),
    ]);
    setProductos(await prodsRes.json());
    setCategorias(await catsRes.json());
    setLoading(false);
  }

  function abrirFormNuevo() {
    setEditando(null);
    setForm({ nombre: "", descripcion: "", precio: "", stock: "", categoria_id: "", dias_entrega: "3" });
    setShowForm(true);
  }

  function abrirFormEditar(p: Producto) {
    setEditando(p);
    setForm({ nombre: p.nombre, descripcion: "", precio: String(p.precio), stock: String(p.stock), categoria_id: "", dias_entrega: String(p.dias_entrega ?? 3) });
    setShowForm(true);
  }

  function validateForm(): string {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) < 0) return "El precio debe ser un número válido.";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) return "El stock debe ser un número válido.";
    if (form.dias_entrega && (isNaN(Number(form.dias_entrega)) || Number(form.dias_entrega) < 1)) return "Los días de entrega deben ser al menos 1.";
    return "";
  }

  async function guardar() {
    const err = validateForm();
    if (err) { alert(err); return; }
    setSaving(true);

    const body = {
      ...(editando ? { id: editando.id } : {}),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: Number(form.precio),
      stock: Number(form.stock),
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      activo: editando ? editando.activo : true,
      dias_entrega: form.dias_entrega ? Number(form.dias_entrega) : 3,
    };

    await fetch("/api/admin/productos", {
      method: editando ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setShowForm(false);
    await cargarDatos();
    setSaving(false);
  }

  async function toggleActivo(p: Producto) {
    await fetch("/api/admin/productos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, activo: !p.activo }),
    });
    setProductos((prev) => prev.map((prod) => prod.id === p.id ? { ...prod, activo: !p.activo } : prod));
    setConfirmToggle(null);
  }

  async function abrirImagenes(p: Producto) {
    setImgProducto(p);
    setNuevaUrl("");
    await cargarImagenes(p.id);
  }

  async function cargarImagenes(productoId: number) {
    const res = await fetch(`/api/admin/productos/${productoId}/imagenes`);
    setImagenes(await res.json());
  }

  async function agregarImagen() {
    if (!imgProducto || !nuevaUrl.trim()) return;
    try {
      const u = new URL(nuevaUrl.trim());
      if (!["http:", "https:"].includes(u.protocol)) throw new Error();
    } catch {
      alert("Ingresa una URL válida que comience con http:// o https://");
      return;
    }
    setSavingImg(true);
    await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: nuevaUrl }),
    });
    setNuevaUrl("");
    await cargarImagenes(imgProducto.id);
    setSavingImg(false);
  }

  async function eliminarImagen(imagenId: number) {
    if (!imgProducto) return;
    await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagen_id: imagenId }),
    });
    setConfirmEliminarImg(null);
    await cargarImagenes(imgProducto.id);
  }

  async function setPrincipal(imagenId: number) {
    if (!imgProducto) return;
    await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagen_id: imagenId }),
    });
    await cargarImagenes(imgProducto.id);
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

        {/* Modal editar/crear producto */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500">
                      <option value="">Sin categoría</option>
                      {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Días de entrega</label>
                    <input type="number" min="1" max="30" value={form.dias_entrega}
                      onChange={(e) => setForm({ ...form, dias_entrega: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
                  </div>
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

        {/* Modal gestionar imágenes */}
        {imgProducto && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">Imágenes del producto</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{imgProducto.nombre}</p>
                </div>
                <button onClick={() => setImgProducto(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              {/* Lista de imágenes */}
              {imagenes.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Sin imágenes agregadas.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {imagenes.map((img) => (
                    <div key={img.id} className={`relative rounded-xl overflow-hidden border-2 ${img.es_principal ? "border-guinda-700" : "border-gray-200"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="Imagen producto" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                      {img.es_principal && (
                        <span className="absolute top-1 left-1 bg-guinda-700 text-white text-xs px-2 py-0.5 rounded-full">Principal</span>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 flex items-center justify-between px-2 py-1.5">
                        {!img.es_principal && (
                          <button onClick={() => setPrincipal(img.id)}
                            className="text-xs text-white/80 hover:text-white">Hacer principal</button>
                        )}
                        <button onClick={() => setConfirmEliminarImg(img.id)}
                          className="text-xs text-red-300 hover:text-red-100 ml-auto">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nueva imagen */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Agregar imagen (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={nuevaUrl}
                    onChange={(e) => setNuevaUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
                    onKeyDown={(e) => e.key === "Enter" && agregarImagen()}
                  />
                  <button onClick={agregarImagen} disabled={savingImg || !nuevaUrl.trim()}
                    className="bg-guinda-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50 transition">
                    {savingImg ? "..." : "Agregar"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Pega la URL directa de la imagen (jpg, png, webp...)</p>
              </div>

              <button onClick={() => setImgProducto(null)}
                className="w-full mt-4 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Entrega</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productos.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.activo ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoria_nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(p.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-gray-900"}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.dias_entrega ?? 3}d</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => abrirFormEditar(p)}
                        className="text-guinda-700 hover:underline text-xs">Editar</button>
                      <button onClick={() => abrirImagenes(p)}
                        className="text-blue-600 hover:underline text-xs">Imágenes</button>
                      <button onClick={() => setConfirmToggle(p)}
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

      {/* Modal confirmar desactivar/activar producto */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">{confirmToggle.activo ? "¿Desactivar producto?" : "¿Activar producto?"}</h2>
            <p className="text-sm text-gray-500 mb-1"><strong>{confirmToggle.nombre}</strong></p>
            <p className="text-sm text-gray-500 mb-6">
              {confirmToggle.activo
                ? "El producto dejará de aparecer en la tienda."
                : "El producto volverá a aparecer en la tienda."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmToggle(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => toggleActivo(confirmToggle)}
                className={`flex-1 text-white py-2 rounded-lg text-sm font-medium ${confirmToggle.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                {confirmToggle.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar imagen */}
      {confirmEliminarImg !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">¿Eliminar imagen?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminarImg(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => eliminarImagen(confirmEliminarImg)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
