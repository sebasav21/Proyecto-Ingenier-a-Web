"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Direccion {
  id: number;
  calle: string;
  numero_exterior: string | null;
  numero_interior: string | null;
  colonia: string | null;
  codigo_postal: string;
  municipio: string | null;
  ciudad: string;
  estado: string;
  pais: string;
  es_principal: boolean;
}

interface MetodoPago {
  id: number;
  nombre_titular: string;
  ultimos_digitos: string;
  mes_vencimiento: string;
  anio_vencimiento: string;
  es_principal: boolean;
}

const DIR_VACIO = {
  calle: "", numero_exterior: "", numero_interior: "",
  colonia: "", codigo_postal: "", municipio: "", ciudad: "", estado: "", pais: "México",
};

const PAGO_VACIO = {
  nombre_titular: "", numero_tarjeta: "", mes_vencimiento: "", anio_vencimiento: "", cvv: "",
};

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null);
  const [tab, setTab] = useState<"direcciones" | "pagos">("direcciones");

  // Direcciones
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [showDirForm, setShowDirForm] = useState(false);
  const [editandoDir, setEditandoDir] = useState<Direccion | null>(null);
  const [dirForm, setDirForm] = useState(DIR_VACIO);
  const [dirPrincipal, setDirPrincipal] = useState(false);
  const [confirmDeleteDir, setConfirmDeleteDir] = useState<number | null>(null);

  // Métodos de pago
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagoForm, setPagoForm] = useState(PAGO_VACIO);
  const [pagoPrincipal, setPagoPrincipal] = useState(false);
  const [confirmDeletePago, setConfirmDeletePago] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status !== "authenticated") return;
    cargar();
  }, [status]);

  async function cargar() {
    const [perfilRes, dirRes, pagosRes] = await Promise.all([
      fetch("/api/perfil"),
      fetch("/api/direcciones"),
      fetch("/api/metodos-pago"),
    ]);
    setPerfil(await perfilRes.json());
    setDirecciones(await dirRes.json());
    setMetodos(await pagosRes.json());
    setLoading(false);
  }

  // --- Direcciones ---
  function validateDir(): string {
    if (!dirForm.calle.trim()) return "La calle es obligatoria.";
    if (!dirForm.codigo_postal.trim() || !/^\d{5}$/.test(dirForm.codigo_postal.trim()))
      return "El código postal debe tener 5 dígitos.";
    if (!dirForm.ciudad.trim()) return "La ciudad es obligatoria.";
    if (!dirForm.estado.trim()) return "El estado es obligatorio.";
    return "";
  }

  function abrirNuevaDir() {
    setEditandoDir(null);
    setDirForm(DIR_VACIO);
    setDirPrincipal(direcciones.length === 0);
    setError("");
    setShowDirForm(true);
  }

  function abrirEditarDir(d: Direccion) {
    setEditandoDir(d);
    setDirForm({
      calle: d.calle, numero_exterior: d.numero_exterior ?? "",
      numero_interior: d.numero_interior ?? "", colonia: d.colonia ?? "",
      codigo_postal: d.codigo_postal, municipio: d.municipio ?? "",
      ciudad: d.ciudad, estado: d.estado ?? "", pais: d.pais,
    });
    setDirPrincipal(d.es_principal);
    setError("");
    setShowDirForm(true);
  }

  async function guardarDir() {
    const err = validateDir();
    if (err) { setError(err); return; }
    setSaving(true); setError("");

    if (editandoDir) {
      await fetch(`/api/direcciones/${editandoDir.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dirForm }),
      });
      if (dirPrincipal && !editandoDir.es_principal) {
        await fetch(`/api/direcciones/${editandoDir.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ set_principal: true }),
        });
      }
    } else {
      await fetch("/api/direcciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dirForm, es_principal: dirPrincipal }),
      });
    }

    setShowDirForm(false);
    setSaving(false);
    await cargar();
  }

  async function setDirPrincipalRemote(id: number) {
    await fetch(`/api/direcciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set_principal: true }),
    });
    await cargar();
  }

  async function eliminarDir(id: number) {
    await fetch(`/api/direcciones/${id}`, { method: "DELETE" });
    setConfirmDeleteDir(null);
    await cargar();
  }

  // --- Métodos de pago ---
  function validatePago(): string {
    if (!pagoForm.nombre_titular.trim()) return "El nombre del titular es obligatorio.";
    const num = pagoForm.numero_tarjeta.replace(/\s/g, "");
    if (!/^\d{16}$/.test(num)) return "El número de tarjeta debe tener 16 dígitos.";
    const mes = Number(pagoForm.mes_vencimiento);
    if (!pagoForm.mes_vencimiento || mes < 1 || mes > 12) return "El mes de vencimiento debe ser entre 01 y 12.";
    const anio = Number(pagoForm.anio_vencimiento);
    if (!pagoForm.anio_vencimiento || anio < 2024) return "El año de vencimiento no es válido.";
    if (!/^\d{3,4}$/.test(pagoForm.cvv)) return "El CVV debe tener 3 o 4 dígitos.";
    return "";
  }

  async function guardarPago() {
    const err = validatePago();
    if (err) { setError(err); return; }
    setSaving(true); setError("");

    await fetch("/api/metodos-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_titular: pagoForm.nombre_titular,
        numero_tarjeta: pagoForm.numero_tarjeta,
        mes_vencimiento: pagoForm.mes_vencimiento.padStart(2, "0"),
        anio_vencimiento: pagoForm.anio_vencimiento,
        es_principal: pagoPrincipal,
      }),
    });

    setShowPagoForm(false);
    setPagoForm(PAGO_VACIO);
    setSaving(false);
    await cargar();
  }

  async function setPagoMetodoPrincipal(id: number) {
    await fetch(`/api/metodos-pago/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set_principal: true }),
    });
    await cargar();
  }

  async function eliminarPago(id: number) {
    await fetch(`/api/metodos-pago/${id}`, { method: "DELETE" });
    setConfirmDeletePago(null);
    await cargar();
  }

  const fd = (label: string, key: keyof typeof dirForm, placeholder = "", required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && " *"}</label>
      <input type="text" value={dirForm[key]}
        onChange={(e) => setDirForm({ ...dirForm, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
    </div>
  );

  const fp = (label: string, key: keyof typeof pagoForm, type = "text", placeholder = "", maxLen?: number) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label} *</label>
      <input type={type} value={pagoForm[key]} maxLength={maxLen}
        onChange={(e) => setPagoForm({ ...pagoForm, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500" />
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
        <p className="text-sm text-gray-500 mb-6">Gestiona tus direcciones y métodos de pago</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(["direcciones", "pagos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "direcciones" ? "Direcciones" : "Métodos de pago"}
            </button>
          ))}
        </div>

        {/* TAB DIRECCIONES */}
        {tab === "direcciones" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Direcciones de entrega</h2>
              <button onClick={abrirNuevaDir}
                className="bg-guinda-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
                + Agregar
              </button>
            </div>
            {direcciones.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">No tienes direcciones guardadas.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {direcciones.map((d) => (
                  <div key={d.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {d.es_principal && (
                        <span className="inline-block bg-guinda-100 text-guinda-700 text-xs font-medium px-2 py-0.5 rounded-full mb-1">Principal</span>
                      )}
                      <p className="text-sm text-gray-900">{d.calle} {d.numero_exterior}{d.numero_interior ? ` Int. ${d.numero_interior}` : ""}</p>
                      <p className="text-sm text-gray-500">{[d.colonia, d.municipio, d.ciudad].filter(Boolean).join(", ")}</p>
                      <p className="text-sm text-gray-500">{d.estado} · CP {d.codigo_postal} · {d.pais}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 text-right">
                      {!d.es_principal && (
                        <button onClick={() => setDirPrincipalRemote(d.id)} className="text-xs text-guinda-700 hover:underline">Establecer como principal</button>
                      )}
                      <button onClick={() => abrirEditarDir(d)} className="text-xs text-gray-500 hover:underline">Editar</button>
                      <button onClick={() => setConfirmDeleteDir(d.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB MÉTODOS DE PAGO */}
        {tab === "pagos" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Métodos de pago</h2>
              <button onClick={() => { setPagoForm(PAGO_VACIO); setPagoPrincipal(metodos.length === 0); setError(""); setShowPagoForm(true); }}
                className="bg-guinda-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-guinda-800 transition">
                + Agregar
              </button>
            </div>
            {metodos.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">No tienes métodos de pago guardados.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {metodos.map((m) => (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gray-800 rounded-md flex items-center justify-center text-white text-xs font-bold">CARD</div>
                      <div>
                        {m.es_principal && (
                          <span className="inline-block bg-guinda-100 text-guinda-700 text-xs font-medium px-2 py-0.5 rounded-full mb-0.5">Principal</span>
                        )}
                        <p className="text-sm font-medium text-gray-900">•••• •••• •••• {m.ultimos_digitos}</p>
                        <p className="text-xs text-gray-500">{m.nombre_titular} · Vence {m.mes_vencimiento}/{m.anio_vencimiento}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 text-right">
                      {!m.es_principal && (
                        <button onClick={() => setPagoMetodoPrincipal(m.id)} className="text-xs text-guinda-700 hover:underline">Establecer como principal</button>
                      )}
                      <button onClick={() => setConfirmDeletePago(m.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal dirección */}
      {showDirForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">{editandoDir ? "Editar dirección" : "Nueva dirección"}</h2>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              {fd("Calle", "calle", "Av. Instituto Politécnico Nacional", true)}
              <div className="grid grid-cols-2 gap-3">
                {fd("Número exterior", "numero_exterior", "2580")}
                {fd("Número interior", "numero_interior", "Depto. 3")}
              </div>
              {fd("Colonia", "colonia", "La Laguna Ticomán")}
              <div className="grid grid-cols-2 gap-3">
                {fd("Código postal *", "codigo_postal", "07340", true)}
                {fd("Municipio / Alcaldía", "municipio", "Gustavo A. Madero")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {fd("Ciudad *", "ciudad", "Ciudad de México", true)}
                {fd("Estado *", "estado", "Ciudad de México", true)}
              </div>
              {fd("País", "pais", "México")}
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-1">
                <input type="checkbox" checked={dirPrincipal} onChange={(e) => setDirPrincipal(e.target.checked)} className="rounded border-gray-300" />
                Establecer como dirección principal
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDirForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={guardarDir} disabled={saving} className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal método de pago */}
      {showPagoForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Agregar tarjeta</h2>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              {fp("Nombre del titular", "nombre_titular", "text", "Como aparece en la tarjeta")}
              {fp("Número de tarjeta", "numero_tarjeta", "text", "1234 5678 9012 3456", 19)}
              <div className="grid grid-cols-3 gap-3">
                {fp("Mes (MM)", "mes_vencimiento", "text", "12", 2)}
                {fp("Año (YYYY)", "anio_vencimiento", "text", "2028", 4)}
                {fp("CVV", "cvv", "password", "123", 4)}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-1">
                <input type="checkbox" checked={pagoPrincipal} onChange={(e) => setPagoPrincipal(e.target.checked)} className="rounded border-gray-300" />
                Establecer como método principal
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPagoForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={guardarPago} disabled={saving} className="flex-1 bg-guinda-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-guinda-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar dirección */}
      {confirmDeleteDir !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">¿Eliminar dirección?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteDir(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => eliminarDir(confirmDeleteDir)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar método de pago */}
      {confirmDeletePago !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">¿Eliminar método de pago?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeletePago(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => eliminarPago(confirmDeletePago)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
