"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Perfil } from "@/lib/types";

interface ItemCarrito {
  id: number;
  cantidad: number;
  productos: { id: number; nombre: string; precio: number };
}

export default function CheckoutPage() {
  const supabase = createClient();
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [carritoId, setCarritoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    calle: "", numero_exterior: "", numero_interior: "",
    colonia: "", ciudad: "", estado: "", codigo_postal: "",
    notas: "",
  });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      setPerfil(p);

      const { data: carrito } = await supabase
        .from("carritos").select("id").eq("usuario_id", user.id).single();
      if (!carrito) { router.push("/tienda"); return; }
      setCarritoId(carrito.id);

      const { data } = await supabase
        .from("items_carrito")
        .select("id, cantidad, productos(id, nombre, precio)")
        .eq("carrito_id", carrito.id);

      if (!data || data.length === 0) { router.push("/carrito"); return; }
      setItems(data as unknown as ItemCarrito[]);
      setLoading(false);
    }
    init();
  }, []);

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const total = items.reduce((sum, i) => sum + i.productos.precio * i.cantidad, 0);

    // Guardar dirección
    const { data: direccion } = await supabase.from("direcciones").insert({
      usuario_id: user.id,
      calle: form.calle.trim(),
      numero_exterior: form.numero_exterior.trim(),
      numero_interior: form.numero_interior.trim() || null,
      colonia: form.colonia.trim() || null,
      ciudad: form.ciudad.trim(),
      estado: form.estado.trim(),
      codigo_postal: form.codigo_postal.trim(),
    }).select("id").single();

    // Crear pedido
    const { data: pedido } = await supabase.from("pedidos").insert({
      usuario_id: user.id,
      direccion_id: direccion?.id ?? null,
      total,
      estado: "pendiente",
      notas: form.notas.trim() || null,
    }).select("id").single();

    if (!pedido) { setError("Error al crear el pedido."); setProcesando(false); return; }

    // Guardar detalle
    const detalles = items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.productos.id,
      nombre_producto: i.productos.nombre,
      precio_unitario: i.productos.precio,
      cantidad: i.cantidad,
    }));
    await supabase.from("detalle_pedido").insert(detalles);

    // Descontar stock de cada producto
    for (const item of items) {
      const { data: prod } = await supabase
        .from("productos").select("stock").eq("id", item.productos.id).single();
      if (prod) {
        const nuevoStock = Math.max(0, prod.stock - item.cantidad);
        await supabase.from("productos").update({ stock: nuevoStock }).eq("id", item.productos.id);
      }
    }

    // Limpiar carrito
    if (carritoId) {
      await supabase.from("items_carrito").delete().eq("carrito_id", carritoId);
    }

    // Notificación
    await supabase.from("notificaciones").insert({
      usuario_id: user.id,
      pedido_id: pedido.id,
      titulo: "Pedido confirmado",
      mensaje: `Tu pedido #${pedido.id} fue recibido y está siendo procesado.`,
    });

    router.push(`/mis-pedidos?nuevo=${pedido.id}`);
  }

  const total = items.reduce((sum, i) => sum + i.productos.precio * i.cantidad, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const campo = (label: string, key: string, placeholder = "", required = true, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && " *"}
      </label>
      <input
        type={type}
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
          {/* Formulario */}
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

          {/* Resumen */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Tu pedido</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.productos.nombre} × {item.cantidad}
                    </span>
                    <span className="font-medium shrink-0">
                      ${(item.productos.precio * item.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
