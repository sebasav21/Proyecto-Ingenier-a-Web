"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface Imagen { id: number; url: string; es_principal: boolean; }

type EstadoPedido = "pendiente" | "confirmado" | "enviado" | "entregado" | "cancelado";
interface Pedido {
  id: number; total: number; estado: EstadoPedido; created_at: string;
  cliente: string; email: string;
  items: { nombre_producto: string; cantidad: number; precio_unitario: number }[];
}

const ESTADOS: EstadoPedido[] = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"];
const ESTADO_COLOR: Record<EstadoPedido, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-guinda-100 text-guinda-700",
  enviado: "bg-purple-100 text-purple-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};
const TIPO_COLOR = {
  entrada: "bg-green-100 text-green-700",
  salida: "bg-red-100 text-red-700",
  ajuste: "bg-blue-100 text-blue-700",
};

export default function InventarioPage() {
  const { status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [tab, setTab] = useState<"stock" | "pedidos">("stock");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Modal movimiento
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ producto_id: "", tipo: "entrada", cantidad: "", motivo: "" });
  const [error, setError] = useState("");

  // Modal editar precio
  const [editPrecio, setEditPrecio] = useState<Producto | null>(null);
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [savingPrecio, setSavingPrecio] = useState(false);

  // Modal imágenes
  const [imgProducto, setImgProducto] = useState<Producto | null>(null);
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [savingImg, setSavingImg] = useState(false);
  const [confirmEliminarImg, setConfirmEliminarImg] = useState<number | null>(null);

  // Pedidos
  const [expandido, setExpandido] = useState<number | null>(null);
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [filtroPedido, setFiltroPedido] = useState<EstadoPedido | "todos">("todos");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;
    init();
  }, [status]);

  async function init() {
    const perfilRes = await fetch("/api/perfil");
    const p = await perfilRes.json();
    if (!p || !["inventarios", "admin", "general"].includes(p.rol)) { router.push("/tienda"); return; }
    setPerfil(p);
    await cargarDatos();
  }

  async function cargarDatos() {
    const [invRes, pedidosRes] = await Promise.all([
      fetch("/api/inventario"),
      fetch("/api/admin/pedidos"),
    ]);
    const inv = await invRes.json();
    setProductos(inv.productos ?? []);
    setMovimientos(inv.movimientos ?? []);
    setPedidos(await pedidosRes.json());
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
    setSaving(true); setError("");
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

  async function guardarPrecio() {
    if (!editPrecio || !nuevoPrecio || isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) < 0) {
      setError("Ingresa un precio válido."); return;
    }
    setSavingPrecio(true);
    await fetch("/api/admin/productos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editPrecio.id, nombre: editPrecio.nombre, precio: Number(nuevoPrecio), stock: editPrecio.stock, activo: true }),
    });
    setEditPrecio(null);
    setSavingPrecio(false);
    await cargarDatos();
  }

  async function abrirImagenes(p: Producto) {
    setImgProducto(p); setNuevaUrl("");
    const res = await fetch(`/api/admin/productos/${p.id}/imagenes`);
    setImagenes(await res.json());
  }

  async function agregarImagen() {
    if (!imgProducto || !nuevaUrl.trim()) return;
    try {
      const u = new URL(nuevaUrl.trim());
      if (!["http:", "https:"].includes(u.protocol)) throw new Error();
    } catch { alert("Ingresa una URL válida (https://...)"); return; }
    setSavingImg(true);
    await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: nuevaUrl }),
    });
    setNuevaUrl("");
    const res = await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`);
    setImagenes(await res.json());
    setSavingImg(false);
  }

  async function eliminarImagen(imagenId: number) {
    if (!imgProducto) return;
    await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagen_id: imagenId }),
    });
    setConfirmEliminarImg(null);
    const res = await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`);
    setImagenes(await res.json());
  }

  async function setPrincipal(imagenId: number) {
    if (!imgProducto) return;
    await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagen_id: imagenId }),
    });
    const res = await fetch(`/api/admin/productos/${imgProducto.id}/imagenes`);
    setImagenes(await res.json());
  }

  async function cambiarEstado(pedidoId: number, nuevoEstado: EstadoPedido) {
    setActualizando(pedidoId);
    await fetch(`/api/pedidos/${pedidoId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    setPedidos((prev) => prev.map((p) => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
    setActualizando(null);
  }

  const productosFiltrados = productos.filter((p) =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria_nombre ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );
  const stockBajo = productos.filter((p) => p.stock < 5);
  const pedidosFiltrados = filtroPedido === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtroPedido);
  const pedidosHoy = pedidos.filter((p) => new Date(p.created_at).toDateString() === new Date().toDateString());

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/tienda" className="inline-flex items-center gap-1 text-sm text-guinda-700 hover:underline">
            ← Regresar al catálogo
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de inventario</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de stock, precios, imágenes y pedidos</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="bg-guinda-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
            + Registrar movimiento
          </button>
        </div>

        {stockBajo.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Productos con stock bajo</p>
            <div className="flex flex-wrap gap-2">
              {stockBajo.map((p) => (
                <span key={p.id} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  {p.nombre} — {p.stock} uds.
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {(["stock", "pedidos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "stock" ? `Stock y productos` : `Ventas del día (${pedidosHoy.length})`}
            </button>
          ))}
        </div>

        {tab === "stock" && (
          <>
            {/* Búsqueda */}
            <div className="mb-4">
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre o categoría..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 bg-white" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock actual */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-sm">Stock actual</h2>
                </div>
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Producto</th>
                        <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Precio</th>
                        <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Stock</th>
                        <th className="text-center px-4 py-2 text-xs text-gray-500 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {productosFiltrados.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-gray-900 text-xs truncate max-w-[140px]">{p.nombre}</p>
                            <p className="text-xs text-gray-400">{p.categoria_nombre}</p>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-gray-700">
                            ${Number(p.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-gray-900"}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => { setEditPrecio(p); setNuevoPrecio(String(p.precio)); setError(""); }}
                                className="text-xs text-guinda-700 hover:underline">Precio</button>
                              <button onClick={() => abrirImagenes(p)}
                                className="text-xs text-blue-600 hover:underline">Imgs</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {productosFiltrados.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">Sin resultados.</p>
                  )}
                </div>
              </div>

              {/* Historial */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-sm">Últimos movimientos</h2>
                </div>
                <div className="overflow-auto max-h-[500px]">
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
                                {m.stock_anterior} → {m.stock_nuevo} uds.{m.motivo && ` · ${m.motivo}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[m.tipo]}`}>{m.tipo}</span>
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
          </>
        )}

        {tab === "pedidos" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Ventas del día — {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}</h2>
              <select value={filtroPedido} onChange={(e) => setFiltroPedido(e.target.value as EstadoPedido | "todos")}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none">
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            {pedidosFiltrados.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">Sin pedidos con este filtro.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {pedidosFiltrados.map((p) => (
                  <div key={p.id} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pedido #{p.id} — {p.cliente}</p>
                        <p className="text-xs text-gray-400">{p.email} · {new Date(p.created_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-gray-900">${Number(p.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                        <select
                          value={p.estado}
                          onChange={(e) => cambiarEstado(p.id, e.target.value as EstadoPedido)}
                          disabled={actualizando === p.id}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-guinda-500 cursor-pointer ${ESTADO_COLOR[p.estado]}`}>
                          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <button onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                          className="text-xs text-gray-400 hover:text-gray-600">
                          {expandido === p.id ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>
                    {expandido === p.id && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1">
                        {p.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-600">
                            <span>{item.nombre_producto} × {item.cantidad}</span>
                            <span>${(Number(item.precio_unitario) * item.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal registrar movimiento */}
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
                  {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>)}
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
                <input type="text" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Opcional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={registrarMovimiento} disabled={saving}
                className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar precio */}
      {editPrecio && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1">Modificar precio</h2>
            <p className="text-sm text-gray-500 mb-4">{editPrecio.nombre}</p>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo precio *</label>
            <input type="number" min="0" step="0.01" value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 mb-6" />
            <div className="flex gap-3">
              <button onClick={() => setEditPrecio(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={guardarPrecio} disabled={savingPrecio}
                className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                {savingPrecio ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal imágenes */}
      {imgProducto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">Imágenes del producto</h2>
                <p className="text-sm text-gray-500 mt-0.5">{imgProducto.nombre}</p>
              </div>
              <button onClick={() => setImgProducto(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            {imagenes.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Sin imágenes.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {imagenes.map((img) => (
                  <div key={img.id} className={`relative rounded-xl overflow-hidden border-2 ${img.es_principal ? "border-guinda-700" : "border-gray-200"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="img" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                    {img.es_principal && <span className="absolute top-1 left-1 bg-guinda-700 text-white text-xs px-2 py-0.5 rounded-full">Principal</span>}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 flex items-center justify-between px-2 py-1.5">
                      {!img.es_principal && <button onClick={() => setPrincipal(img.id)} className="text-xs text-white/80 hover:text-white">Principal</button>}
                      <button onClick={() => setConfirmEliminarImg(img.id)} className="text-xs text-red-300 hover:text-red-100 ml-auto">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Agregar imagen (URL)</label>
              <div className="flex gap-2">
                <input type="url" value={nuevaUrl} onChange={(e) => setNuevaUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
                  onKeyDown={(e) => e.key === "Enter" && agregarImagen()} />
                <button onClick={agregarImagen} disabled={savingImg || !nuevaUrl.trim()}
                  className="bg-guinda-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                  {savingImg ? "..." : "Agregar"}
                </button>
              </div>
            </div>
            <button onClick={() => setImgProducto(null)} className="w-full mt-4 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cerrar</button>
          </div>
        </div>
      )}

      {/* Confirmar eliminar imagen */}
      {confirmEliminarImg !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">¿Eliminar imagen?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminarImg(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => eliminarImagen(confirmEliminarImg)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
