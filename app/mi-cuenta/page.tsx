"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Direccion {
  id: number;
  calle: string;
  numero_exterior: string | null;
  numero_interior: string | null;
  colonia: string | null;
  codigo_postal: string;
  municipio: string | null;
  ciudad: string;
  pais: string;
  es_principal: boolean;
}

const FORM_VACIO = {
  calle: "", numero_exterior: "", numero_interior: "",
  colonia: "", codigo_postal: "", municipio: "", ciudad: "", estado: "", pais: "México",
};

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Direccion | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;
    cargar();
  }, [status]);

  async function cargar() {
    const [perfilRes, dirRes] = await Promise.all([
      fetch("/api/perfil"),
      fetch("/api/direcciones"),
    ]);
    setPerfil(await perfilRes.json());
    setDirecciones(await dirRes.json());
    setLoading(false);
  }

  function validate(): string {
    if (!form.calle.trim()) return "La calle es obligatoria.";
    if (!form.codigo_postal.trim() || !/^\d{5}$/.test(form.codigo_postal.trim()))
      return "El código postal debe tener 5 dígitos.";
    if (!form.ciudad.trim()) return "La ciudad es obligatoria.";
    if (!form.estado.trim()) return "El estado es obligatorio.";
    return "";
  }

  function abrirNueva() {
    setEditando(null);
    setForm(FORM_VACIO);
    setEsPrincipal(direcciones.length === 0);
    setError("");
    setShowForm(true);
  }

  function abrirEditar(d: Direccion) {
    setEditando(d);
    setForm({
      calle: d.calle, numero_exterior: d.numero_exterior ?? "",
      numero_interior: d.numero_interior ?? "", colonia: d.colonia ?? "",
      codigo_postal: d.codigo_postal, municipio: d.municipio ?? "",
      ciudad: d.ciudad, estado: (d as unknown as { estado: string }).estado ?? "", pais: d.pais,
    });
    setEsPrincipal(d.es_principal);
    setError("");
    setShowForm(true);
  }

  async function guardar() {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");

    if (editando) {
      await fetch(`/api/direcciones/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, es_principal: esPrincipal }),
      });
      if (esPrincipal && !editando.es_principal) {
        await fetch(`/api/direcciones/${editando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ set_principal: true }),
        });
      }
    } else {
      await fetch("/api/direcciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, es_principal: esPrincipal }),
      });
    }

    setShowForm(false);
    setSaving(false);
    await cargar();
  }

  async function setPrincipal(id: number) {
    await fetch(`/api/direcciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set_principal: true }),
    });
    await cargar();
  }

  async function eliminar(id: number) {
    await fetch(`/api/direcciones/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await cargar();
  }

  const f = (label: string, key: keyof typeof form, placeholder = "", required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && " *"}
      </label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
      />
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-guinda-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar perfil={perfil} cartCount={0} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi cuenta</h1>
        <p className="text-sm text-gray-500 mb-8">Gestiona tus direcciones de entrega</p>

        {/* Direcciones */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Direcciones de entrega</h2>
            <button onClick={abrirNueva}
              className="bg-guinda-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
              + Agregar
            </button>
          </div>

          {direcciones.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No tienes direcciones guardadas.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {direcciones.map((d) => (
                <div key={d.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {d.es_principal && (
                      <span className="inline-block bg-guinda-100 text-guinda-700 text-xs font-medium px-2 py-0.5 rounded-full mb-1">
                        Principal
                      </span>
                    )}
                    <p className="text-sm text-gray-900">
                      {d.calle} {d.numero_exterior}{d.numero_interior ? ` Int. ${d.numero_interior}` : ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      {[d.colonia, d.municipio, d.ciudad].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-sm text-gray-500">CP {d.codigo_postal} · {d.pais}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!d.es_principal && (
                      <button onClick={() => setPrincipal(d.id)}
                        className="text-xs text-guinda-700 hover:underline">
                        Establecer como principal
                      </button>
                    )}
                    <button onClick={() => abrirEditar(d)}
                      className="text-xs text-gray-500 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => setConfirmDelete(d.id)}
                      className="text-xs text-red-500 hover:underline">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">{editando ? "Editar dirección" : "Nueva dirección"}</h2>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              {f("Calle", "calle", "Av. Instituto Politécnico Nacional", true)}
              <div className="grid grid-cols-2 gap-3">
                {f("Número exterior", "numero_exterior", "2580")}
                {f("Número interior", "numero_interior", "Depto. 3")}
              </div>
              {f("Colonia", "colonia", "La Laguna Ticomán")}
              <div className="grid grid-cols-2 gap-3">
                {f("Código postal *", "codigo_postal", "07340", true)}
                {f("Municipio / Alcaldía", "municipio", "Gustavo A. Madero")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {f("Ciudad *", "ciudad", "Ciudad de México", true)}
                {f("Estado *", "estado", "Ciudad de México", true)}
              </div>
              {f("País", "pais", "México")}
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-1">
                <input type="checkbox" checked={esPrincipal}
                  onChange={(e) => setEsPrincipal(e.target.checked)}
                  className="rounded border-gray-300 text-guinda-700" />
                Establecer como dirección principal
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving}
                className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">¿Eliminar dirección?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmDelete)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
