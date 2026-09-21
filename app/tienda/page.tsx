"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Perfil } from "@/lib/types";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
  categorias: { nombre: string } | null;
  imagenes_producto: { url: string; es_principal: boolean }[];
}

interface Categoria {
  id: number;
  nombre: string;
}

export default function TiendaPage() {
  const supabase = createClient();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
        setPerfil(p);
        const { data: carrito } = await supabase.from("carritos").select("id").eq("usuario_id", user.id).single();
        if (carrito) {
          const { count } = await supabase.from("items_carrito").select("*", { count: "exact", head: true }).eq("carrito_id", carrito.id);
          setCartCount(count ?? 0);
        }
      }
      const { data: cats, error: catsError } = await supabase.from("categorias").select("*").eq("activo", true).order("nombre");
      console.log("Categorias:", cats, "Error:", catsError);
      setCategorias(cats ?? []);
      await cargarProductos(null, "");
      setLoading(false);
    }
    init();
  }, []);

  async function cargarProductos(catId: number | null, q: string) {
    let query = supabase
      .from("productos")
      .select("*, categorias(nombre), imagenes_producto(url, es_principal)")
      .eq("activo", true)
      .order("id");
    if (catId) query = query.eq("categoria_id", catId);
    if (q) query = query.ilike("nombre", `%${q}%`);
    const { data, error } = await query;
    console.log("Productos:", data, "Error:", error);
    setProductos((data as Producto[]) ?? []);
  }

  async function filtrarCategoria(id: number | null) {
    setCategoriaActiva(id);
    await cargarProductos(id, busqueda);
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    await cargarProductos(categoriaActiva, busqueda);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} cartCount={cartCount} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <form onSubmit={buscar} className="mb-4 sm:hidden">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
          />
        </form>

        <div className="flex gap-6">
          <aside className="hidden md:block w-48 shrink-0">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Categorías</h3>
            <ul className="space-y-1">
              <li>
                <button onClick={() => filtrarCategoria(null)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg ${!categoriaActiva ? "bg-guinda-50 text-guinda-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                  Todos
                </button>
              </li>
              {categorias.map((cat) => (
                <li key={cat.id}>
                  <button onClick={() => filtrarCategoria(cat.id)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg ${categoriaActiva === cat.id ? "bg-guinda-50 text-guinda-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                    {cat.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !productos.length ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg font-medium">No se encontraron productos</p>
                <button onClick={() => filtrarCategoria(null)} className="text-guinda-700 text-sm mt-2 hover:underline">
                  Ver todos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {productos.map((p) => {
                  const img = p.imagenes_producto?.find((i) => i.es_principal)?.url;
                  return (
                    <Link key={p.id} href={`/producto/${p.id}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {img ? (
                          <img src={img} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">📦</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-400 mb-0.5">{p.categorias?.nombre}</p>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-guinda-700">
                          {p.nombre}
                        </h3>
                        <p className="text-base font-bold text-gray-900 mt-1">
                          ${Number(p.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                        {p.stock === 0 && <span className="text-xs text-red-500">Sin stock</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
