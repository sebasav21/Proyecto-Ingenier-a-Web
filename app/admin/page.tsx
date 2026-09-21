"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Perfil } from "@/lib/types";

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [stats, setStats] = useState({ productos: 0, pedidos: 0, usuarios: 0, ingresos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      if (!p || (p.rol !== "admin" && p.rol !== "general")) {
        router.push("/tienda"); return;
      }
      setPerfil(p);

      const [{ count: productos }, { count: pedidos }, { count: usuarios }, { data: ingresos }] = await Promise.all([
        supabase.from("productos").select("*", { count: "exact", head: true }).eq("activo", true),
        supabase.from("pedidos").select("*", { count: "exact", head: true }),
        supabase.from("perfiles").select("*", { count: "exact", head: true }),
        supabase.from("pedidos").select("total"),
      ]);

      const totalIngresos = (ingresos ?? []).reduce((sum: number, p: { total: number }) => sum + Number(p.total), 0);
      setStats({ productos: productos ?? 0, pedidos: pedidos ?? 0, usuarios: usuarios ?? 0, ingresos: totalIngresos });
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de administración</h1>
        <p className="text-gray-500 text-sm mb-8">Gestiona productos, pedidos y usuarios de UPIITA Tienda</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Productos activos", value: stats.productos, icon: "📦" },
            { label: "Pedidos totales", value: stats.pedidos, icon: "🛒" },
            { label: "Usuarios", value: stats.usuarios, icon: "👤" },
            { label: "Ingresos totales", value: `$${stats.ingresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, icon: "💰" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/productos"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group">
            <div className="text-3xl mb-3">📦</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-guinda-700">Gestionar productos</h2>
            <p className="text-sm text-gray-500 mt-1">Agregar, editar o desactivar productos del catálogo</p>
          </Link>

          <Link href="/admin/pedidos"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group">
            <div className="text-3xl mb-3">📋</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-guinda-700">Gestionar pedidos</h2>
            <p className="text-sm text-gray-500 mt-1">Ver y actualizar el estado de los pedidos</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
