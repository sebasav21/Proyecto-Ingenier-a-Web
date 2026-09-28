"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Usuario {
  id: string; nombre: string; apellido_paterno: string | null; apellido_materno: string | null;
  email: string; telefono: string | null; rfc: string | null; curp: string | null;
  rol: string; activo: boolean; created_at: string;
}

const ROL_COLOR: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  general: "bg-purple-100 text-purple-700",
  inventarios: "bg-blue-100 text-blue-700",
  cliente: "bg-gray-100 text-gray-600",
};

const ROLES = ["admin", "general", "inventarios", "cliente"];

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nuevoRol, setNuevoRol] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;
    cargar();
  }, [status]);

  async function cargar() {
    const [perfilRes, usersRes] = await Promise.all([
      fetch("/api/perfil"),
      fetch("/api/admin/usuarios"),
    ]);
    const p = await perfilRes.json();
    if (!p || (p.rol !== "admin" && p.rol !== "general")) { router.push("/tienda"); return; }
    setPerfil(p);
    setUsuarios(await usersRes.json());
    setLoading(false);
  }

  async function cambiarRol() {
    if (!editando || !nuevoRol) return;
    setSaving(true);
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editando.id, rol: nuevoRol }),
    });
    setEditando(null);
    setSaving(false);
    await cargar();
  }

  async function desactivar(u: Usuario) {
    await fetch("/api/admin/usuarios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id }),
    });
    setConfirmDelete(null);
    await cargar();
  }

  async function reactivar(u: Usuario) {
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, activo: true }),
    });
    await cargar();
  }

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.rol.includes(q);
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => router.push("/admin")} className="text-gray-400 hover:text-gray-600 text-sm mb-4 block">
          ← Panel admin
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">{usuarios.length} usuarios registrados</p>
          </div>
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 w-64" />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">RFC / CURP</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.nombre} {u.apellido_paterno}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                    {u.telefono && <p className="text-xs text-gray-400">{u.telefono}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {u.rfc && <p className="text-xs text-gray-600">RFC: {u.rfc}</p>}
                    {u.curp && <p className="text-xs text-gray-600">CURP: {u.curp}</p>}
                    {!u.rfc && !u.curp && <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_COLOR[u.rol] ?? "bg-gray-100 text-gray-600"}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditando(u); setNuevoRol(u.rol); }}
                        className="text-xs text-guinda-700 hover:underline">Cambiar rol</button>
                      {u.activo ? (
                        <button onClick={() => setConfirmDelete(u)}
                          className="text-xs text-red-500 hover:underline">Desactivar</button>
                      ) : (
                        <button onClick={() => reactivar(u)}
                          className="text-xs text-green-600 hover:underline">Reactivar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No se encontraron usuarios.</p>
          )}
        </div>
      </div>

      {/* Modal cambiar rol */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1">Cambiar rol</h2>
            <p className="text-sm text-gray-500 mb-4">{editando.nombre} {editando.apellido_paterno}</p>
            <div className="space-y-2 mb-6">
              {ROLES.map((r) => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                  ${nuevoRol === r ? "border-guinda-700 bg-guinda-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="rol" value={r} checked={nuevoRol === r}
                    onChange={() => setNuevoRol(r)} className="accent-guinda-700" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{r}</p>
                    <p className="text-xs text-gray-400">
                      {r === "admin" && "Acceso total al sistema"}
                      {r === "general" && "Acceso a productos y pedidos"}
                      {r === "inventarios" && "Acceso a inventario y ventas del día"}
                      {r === "cliente" && "Compras y seguimiento de pedidos"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={cambiarRol} disabled={saving}
                className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar desactivar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">¿Desactivar usuario?</h2>
            <p className="text-sm text-gray-500 mb-1"><strong>{confirmDelete.nombre} {confirmDelete.apellido_paterno}</strong></p>
            <p className="text-sm text-gray-500 mb-6">El usuario no podrá iniciar sesión hasta que sea reactivado.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => desactivar(confirmDelete)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
