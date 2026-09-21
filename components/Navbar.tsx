"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Perfil } from "@/lib/types";
import { useState } from "react";

interface Props {
  perfil: Perfil | null;
  cartCount?: number;
}

export default function Navbar({ perfil, cartCount = 0 }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-guinda-700 border-b border-guinda-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo + nombre */}
        <Link href="/tienda" className="flex items-center gap-3 shrink-0">
          <Image src="/upiita-logo.png" alt="UPIITA" width={36} height={36} className="object-contain" />
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">UPIITA Tienda</p>
            <p className="text-guinda-200 text-xs leading-tight">Instituto Politécnico Nacional</p>
          </div>
        </Link>

        {/* Búsqueda */}
        <div className="flex-1 max-w-sm hidden sm:block">
          <form action="/tienda" method="get">
            <input
              name="q"
              placeholder="Buscar productos..."
              className="w-full bg-guinda-800 border border-guinda-600 text-white placeholder-guinda-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-dorado-400"
            />
          </form>
        </div>

        <div className="flex items-center gap-3">
          {/* Carrito */}
          <Link href="/carrito" className="relative p-2 hover:bg-guinda-600 rounded-lg transition">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-dorado-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Usuario */}
          {perfil ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm font-medium hover:bg-guinda-600 rounded-lg px-2 py-1.5 transition"
              >
                <div className="w-7 h-7 bg-dorado-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {perfil.nombre[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-white">{perfil.nombre}</span>
                <svg className="w-4 h-4 text-guinda-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link href="/mis-pedidos" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mis pedidos</Link>
                  {(perfil.rol === "admin" || perfil.rol === "general") && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Panel Admin</Link>
                  )}
                  {perfil.rol === "inventarios" && (
                    <Link href="/inventario" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Inventario</Link>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login"
              className="bg-dorado-400 hover:bg-dorado-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
