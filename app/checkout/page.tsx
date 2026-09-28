"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ItemCarrito {
  id: number; cantidad: number; producto_id: number; nombre: string; precio: number;
}
interface Direccion {
  id: number; calle: string; numero_exterior: string | null; colonia: string | null;
  municipio: string | null; ciudad: string; estado: string; codigo_postal: string; es_principal: boolean;
}
interface MetodoPago {
  id: number; nombre_titular: string; ultimos_digitos: string;
  mes_vencimiento: string; anio_vencimiento: string; es_principal: boolean;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const [direccionId, setDireccionId] = useState<number | null>(null);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null);
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;

    async function init() {
      const [perfilRes, carritoRes, dirRes, pagosRes] = await Promise.all([
        fetch("/api/perfil"),
        fetch("/api/carrito"),
        fetch("/api/direcciones"),
        fetch("/api/metodos-pago"),
      ]);
      const cart = await carritoRes.json();
      if (!cart.length) { router.push("/carrito"); return; }

      const dirs: Direccion[] = await dirRes.json();
      const pagos: MetodoPago[] = await pagosRes.json();

      setPerfil(await perfilRes.json());
      setItems(cart);
      setDirecciones(dirs);
      setMetodos(pagos);
      setDireccionId(dirs.find((d) => d.es_principal)?.id ?? dirs[0]?.id ?? null);
      setMetodoPagoId(pagos.find((p) => p.es_principal)?.id ?? pagos[0]?.id ?? null);
      setLoading(false);
    }
    init();
  }, [status]);

  function validate(): string {
    if (!direccionId) return "Selecciona una dirección de entrega. Puedes agregar una en Mi cuenta.";
    if (!metodoPagoId) return "Selecciona un método de pago. Puedes agregar uno en Mi cuenta.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setProcesando(true);
    setError("");

    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas: notas.trim() || null, direccion_id: direccionId, metodo_pago_id: metodoPagoId }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al crear el pedido."); setProcesando(false); return; }

    router.push(`/mis-pedidos?nuevo=${data.id}`);
  }

  const total = items.reduce((sum, i) => sum + Number(i.precio) * i.cantidad, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} cartCount={0} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            {/* Dirección */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Dirección de entrega</h2>
                <a href="/mi-cuenta" className="text-xs text-guinda-700 hover:underline">+ Agregar nueva</a>
              </div>
              {direcciones.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                  No tienes direcciones guardadas.{" "}
                  <a href="/mi-cuenta" className="font-medium underline">Agregar una ahora</a>
                </div>
              ) : (
                <div className="space-y-2">
                  {direcciones.map((d) => (
                    <label key={d.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition
                      ${direccionId === d.id ? "border-guinda-700 bg-guinda-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="direccion" value={d.id} checked={direccionId === d.id}
                        onChange={() => setDireccionId(d.id)} className="mt-0.5 accent-guinda-700" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {d.calle} {d.numero_exterior}
                          {d.es_principal && <span className="ml-2 text-xs text-guinda-700 font-normal">(Principal)</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[d.colonia, d.municipio, d.ciudad, d.estado].filter(Boolean).join(", ")} · CP {d.codigo_postal}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Método de pago</h2>
                <a href="/mi-cuenta" className="text-xs text-guinda-700 hover:underline">+ Agregar nuevo</a>
              </div>
              {metodos.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                  No tienes métodos de pago guardados.{" "}
                  <a href="/mi-cuenta" className="font-medium underline">Agregar uno ahora</a>
                </div>
              ) : (
                <div className="space-y-2">
                  {metodos.map((m) => (
                    <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                      ${metodoPagoId === m.id ? "border-guinda-700 bg-guinda-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="metodo_pago" value={m.id} checked={metodoPagoId === m.id}
                        onChange={() => setMetodoPagoId(m.id)} className="accent-guinda-700" />
                      <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-white text-xs font-bold">CARD</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">•••• •••• •••• {m.ultimos_digitos}
                          {m.es_principal && <span className="ml-2 text-xs text-guinda-700 font-normal">(Principal)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{m.nombre_titular} · Vence {m.mes_vencimiento}/{m.anio_vencimiento}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Notas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Notas del pedido</h2>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                placeholder="Instrucciones especiales de entrega (opcional)..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={procesando}
              className="w-full bg-guinda-700 text-white py-3 rounded-xl font-medium hover:bg-guinda-800 disabled:opacity-50 transition text-sm">
              {procesando ? "Procesando pedido..." : "Confirmar pedido"}
            </button>
          </div>

          {/* Resumen */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Tu pedido</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{item.nombre} × {item.cantidad}</span>
                    <span className="font-medium shrink-0">
                      ${(Number(item.precio) * item.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-xs text-green-600 mt-1">✓ Envío gratis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
