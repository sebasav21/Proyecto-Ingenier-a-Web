"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface ItemCarrito {
  id: number;
  cantidad: number;
  producto_id: number;
  nombre: string;
  precio: number;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    calle: "", numero_exterior: "", numero_interior: "",
    colonia: "", ciudad: "", estado: "", codigo_postal: "",
    notas: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;

    async function init() {
      const [perfilRes, carritoRes] = await Promise.all([
        fetch("/api/perfil"),
        fetch("/api/carrito"),
      ]);
      const p = await perfilRes.json();
      const cart = await carritoRes.json();
      setPerfil(p);
      if (!cart.length) { router.push("/carrito"); return; }
      setItems(cart);
      setLoading(false);
    }
    init();
  }, [status]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): string {
    if (!form.calle.trim()) return "La calle es obligatoria.";
    if (!form.numero_exterior.trim()) return "El número exterior es obligatorio.";
    if (!form.ciudad.trim()) return "La ciudad es obligatoria.";
    if (!form.estado.trim()) return "El estado es obligatorio.";
    if (!form.codigo_postal.trim() || !/^\d{5}$/.test(form.codigo_postal)) return "El código postal debe tener 5 dígitos.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setProcesando(true);
    setError("");

    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas: form.notas.trim() || null }),
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

  const campo = (label: string, key: string, placeholder = "", required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && " *"}
      </label>
      <input
        type="text"
        value={form[key as keyof typeof form]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} cartCount={0} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 mb-2">Dirección de entrega</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {campo("Calle", "calle", "Av. Instituto Politécnico Nacional")}
              <div className="grid grid-cols-2 gap-3">
                {campo("Número exterior", "numero_exterior", "2580")}
                {campo("Número interior", "numero_interior", "Depto 3", false)}
              </div>
              {campo("Colonia", "colonia", "La Laguna Ticomán", false)}
              <div className="grid grid-cols-2 gap-3">
                {campo("Ciudad", "ciudad", "Ciudad de México")}
                {campo("Estado", "estado", "CDMX")}
              </div>
              {campo("Código postal", "codigo_postal", "07340")}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas del pedido</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => set("notas", e.target.value)}
                  placeholder="Instrucciones especiales de entrega..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={procesando}
                className="w-full bg-guinda-700 text-white py-3 rounded-xl font-medium hover:bg-guinda-800 disabled:opacity-50 transition mt-2">
                {procesando ? "Procesando pedido..." : "Confirmar pedido"}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Tu pedido</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.nombre} × {item.cantidad}
                    </span>
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
    </div>
  );
}
