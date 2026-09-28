"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ItemCarrito {
  id: number;
  cantidad: number;
  producto_id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen: string;
}

export default function CarritoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;

    async function cargar() {
      const [perfilRes, carritoRes] = await Promise.all([
        fetch("/api/perfil"),
        fetch("/api/carrito"),
      ]);
      setPerfil(await perfilRes.json());
      setItems(await carritoRes.json());
      setLoading(false);
    }
    cargar();
  }, [status]);

  async function actualizarCantidad(itemId: number, nuevaCantidad: number) {
    if (nuevaCantidad < 1) return;
    setUpdating(itemId);
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    await fetch("/api/carrito", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto_id: item.producto_id, cantidad: nuevaCantidad - item.cantidad }),
    });
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, cantidad: nuevaCantidad } : i));
    setUpdating(null);
  }

  async function eliminarItem(itemId: number) {
    setUpdating(itemId);
    await fetch("/api/carrito", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId }),
    });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setUpdating(null);
  }

  const total = items.reduce((sum, i) => sum + Number(i.precio) * i.cantidad, 0);
  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} cartCount={totalItems} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi carrito</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
            <Link href="/tienda"
              className="bg-guinda-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-guinda-800 transition">
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    {item.imagen ? (
                      <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{item.nombre}</h3>
                    <p className="text-guinda-700 font-bold mt-1">
                      ${Number(item.precio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          disabled={updating === item.id || item.cantidad <= 1}
                          className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-30">−</button>
                        <span className="px-3 py-1 text-sm font-medium">{item.cantidad}</span>
                        <button
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          disabled={updating === item.id || item.cantidad >= item.stock}
                          className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-30">+</button>
                      </div>

                      <button
                        onClick={() => eliminarItem(item.id)}
                        disabled={updating === item.id}
                        className="text-red-400 hover:text-red-600 text-sm disabled:opacity-30">
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">
                      ${(Number(item.precio) * item.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Resumen</h2>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Productos ({totalItems})</span>
                    <span>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <Link href="/checkout"
                  className="block w-full bg-guinda-700 text-white text-center py-3 rounded-xl font-medium hover:bg-guinda-800 transition">
                  Proceder al pago
                </Link>
                <Link href="/tienda"
                  className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3">
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
