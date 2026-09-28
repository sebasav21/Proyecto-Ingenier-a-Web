"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Producto {
  id: number; nombre: string; descripcion: string | null; precio: number;
  stock: number; categoria_nombre: string | null;
  imagenes_producto: { url: string; es_principal: boolean }[];
}

interface Resena {
  id: number; estrellas: number; comentario: string | null; created_at: string; autor: string;
}

function Estrellas({ valor, onChange, readonly = false }: { valor: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-2xl transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          disabled={readonly}>
          {(hover || valor) >= s ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function ProductoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [promedio, setPromedio] = useState(0);
  const [totalResenas, setTotalResenas] = useState(0);
  const [miResena, setMiResena] = useState<Resena | null>(null);
  const [puedeResenar, setPuedeResenar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [resenaMsg, setResenaMsg] = useState("");

  useEffect(() => {
    async function cargar() {
      const [prodRes, resenasRes] = await Promise.all([
        fetch(`/api/productos/${id}`),
        fetch(`/api/productos/${id}/resenas`),
      ]);
      const prod = await prodRes.json();
      const resenasData = await resenasRes.json();
      setProducto(prod);
      setResenas(resenasData.resenas ?? []);
      setPromedio(resenasData.promedio ?? 0);
      setTotalResenas(resenasData.total ?? 0);
      setLoading(false);
    }
    cargar();
  }, [id]);

  useEffect(() => {
    if (!session?.user || !id) return;
    // Verificar si puede reseñar
    fetch(`/api/productos/${id}/resenas/puede`)
      .then((r) => r.json())
      .then((data) => {
        setPuedeResenar(data.puede ?? false);
        if (data.resena) {
          setMiResena(data.resena);
          setEstrellas(data.resena.estrellas);
          setComentario(data.resena.comentario ?? "");
        }
      });
  }, [session, id]);

  async function agregarAlCarrito() {
    if (!session?.user) { router.push("/auth/login"); return; }
    setAdding(true);
    await fetch("/api/carrito", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto_id: Number(id), cantidad }),
    });
    setMensaje("¡Agregado al carrito!");
    setTimeout(() => setMensaje(""), 2000);
    setAdding(false);
  }

  async function enviarResena() {
    if (!estrellas) { setResenaMsg("Selecciona una calificación."); return; }
    setEnviandoResena(true);
    setResenaMsg("");
    const res = await fetch(`/api/productos/${id}/resenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estrellas, comentario }),
    });
    const data = await res.json();
    if (!res.ok) { setResenaMsg(data.error); setEnviandoResena(false); return; }

    setResenaMsg("¡Reseña guardada!");
    // Recargar reseñas
    const r = await fetch(`/api/productos/${id}/resenas`);
    const rd = await r.json();
    setResenas(rd.resenas ?? []);
    setPromedio(rd.promedio ?? 0);
    setTotalResenas(rd.total ?? 0);
    setEnviandoResena(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!producto) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-gray-500">Producto no encontrado</p>
      <Link href="/tienda" className="text-guinda-700 hover:underline">Volver a la tienda</Link>
    </div>
  );

  const img = producto.imagenes_producto?.find((i) => i.es_principal)?.url;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-2 max-w-6xl mx-auto">
        <Link href="/tienda" className="text-guinda-700 font-bold">UPIITA Tienda</Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-500 truncate">{producto.nombre}</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Ficha del producto */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {img ? (
                <img src={img} alt={producto.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl">📦</span>
              )}
            </div>

            <div className="p-8 flex flex-col justify-between">
              <div>
                <p className="text-sm text-guinda-700 font-medium mb-2">{producto.categoria_nombre}</p>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{producto.nombre}</h1>

                {/* Calificación promedio */}
                {totalResenas > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-400 text-lg">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s}>{s <= Math.round(promedio) ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{promedio}</span>
                    <span className="text-sm text-gray-400">({totalResenas} {totalResenas === 1 ? "reseña" : "reseñas"})</span>
                  </div>
                )}

                <p className="text-gray-500 text-sm mb-6">{producto.descripcion}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  ${Number(producto.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm mb-6 ${producto.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                  {producto.stock > 0 ? `${producto.stock} disponibles` : "Sin stock"}
                </p>

                {producto.stock > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <label className="text-sm text-gray-600">Cantidad:</label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="px-3 py-1.5 hover:bg-gray-100 text-lg">−</button>
                      <span className="px-4 py-1.5 text-sm font-medium">{cantidad}</span>
                      <button onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))} className="px-3 py-1.5 hover:bg-gray-100 text-lg">+</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {mensaje && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 text-center">{mensaje}</div>
                )}
                <button onClick={agregarAlCarrito} disabled={adding || producto.stock === 0}
                  className="w-full bg-guinda-700 text-white rounded-xl py-3 font-medium hover:bg-guinda-800 disabled:opacity-50 transition">
                  {adding ? "Agregando..." : "Agregar al carrito"}
                </button>
                <Link href="/tienda" className="block text-center text-sm text-gray-500 hover:text-gray-700">← Volver a la tienda</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Calificación y reseña del usuario */}
        {puedeResenar && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {miResena ? "Tu calificación" : "Califica este producto"}
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Calificación *</p>
                <div className="text-yellow-400">
                  <Estrellas valor={estrellas} onChange={setEstrellas} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Recomendación / Comentario</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comparte tu experiencia con este producto..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 resize-none" />
              </div>
              {resenaMsg && (
                <p className={`text-sm ${resenaMsg.includes("!") ? "text-green-600" : "text-red-600"}`}>{resenaMsg}</p>
              )}
              <button onClick={enviarResena} disabled={enviandoResena}
                className="bg-guinda-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50 transition">
                {enviandoResena ? "Guardando..." : miResena ? "Actualizar reseña" : "Publicar reseña"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de reseñas */}
        {resenas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Reseñas ({totalResenas})</h2>
            <div className="space-y-4">
              {resenas.map((r) => (
                <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{r.autor.trim()}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex text-yellow-400 text-sm mb-1">
                    {[1,2,3,4,5].map((s) => <span key={s}>{s <= r.estrellas ? "★" : "☆"}</span>)}
                  </div>
                  {r.comentario && <p className="text-sm text-gray-600">{r.comentario}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
