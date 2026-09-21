"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Producto } from "@/lib/types";

export default function ProductoPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    supabase
      .from("productos")
      .select("*, categorias(nombre), imagenes_producto(url, es_principal)")
      .eq("id", id)
      .single()
      .then(({ data }) => { setProducto(data); setLoading(false); });
  }, [id]);

  async function agregarAlCarrito() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    setAdding(true);

    // Obtener o crear carrito
    let { data: carrito } = await supabase
      .from("carritos").select("id").eq("usuario_id", user.id).single();

    if (!carrito) {
      const { data } = await supabase
        .from("carritos").insert({ usuario_id: user.id }).select("id").single();
      carrito = data;
    }

    if (!carrito) { setAdding(false); return; }

    // Agregar o actualizar item
    const { data: existing } = await supabase
      .from("items_carrito")
      .select("id, cantidad")
      .eq("carrito_id", carrito.id)
      .eq("producto_id", id)
      .single();

    if (existing) {
      await supabase.from("items_carrito")
        .update({ cantidad: existing.cantidad + cantidad })
        .eq("id", existing.id);
    } else {
      await supabase.from("items_carrito")
        .insert({ carrito_id: carrito.id, producto_id: id, cantidad });
    }

    setMensaje("¡Agregado al carrito!");
    setTimeout(() => setMensaje(""), 2000);
    setAdding(false);
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
        <Link href="/tienda" className="text-guinda-700 font-bold">TiendaWeb</Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-500 truncate">{producto.nombre}</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Imagen */}
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {img ? (
                <img src={img} alt={producto.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl">📦</span>
              )}
            </div>

            {/* Info */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <p className="text-sm text-guinda-700 font-medium mb-2">
                  {(producto.categorias as { nombre: string } | null)?.nombre}
                </p>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{producto.nombre}</h1>
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
                      <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                        className="px-3 py-1.5 hover:bg-gray-100 text-lg">−</button>
                      <span className="px-4 py-1.5 text-sm font-medium">{cantidad}</span>
                      <button onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                        className="px-3 py-1.5 hover:bg-gray-100 text-lg">+</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {mensaje && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 text-center">
                    {mensaje}
                  </div>
                )}
                <button
                  onClick={agregarAlCarrito}
                  disabled={adding || producto.stock === 0}
                  className="w-full bg-guinda-700 text-white rounded-xl py-3 font-medium hover:bg-guinda-800 disabled:opacity-50 transition"
                >
                  {adding ? "Agregando..." : "Agregar al carrito"}
                </button>
                <Link href="/tienda"
                  className="block text-center text-sm text-gray-500 hover:text-gray-700">
                  ← Volver a la tienda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
