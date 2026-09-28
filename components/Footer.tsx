import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-guinda-900 text-white mt-12">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">U</span>
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">UPIITA Tienda</p>
                <p className="text-xs text-white/50 leading-tight">Instituto Politécnico Nacional</p>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Plataforma de venta de materiales y suministros escolares para la comunidad UPIITA.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Navegación</p>
            <ul className="space-y-2">
              <li><Link href="/tienda" className="text-sm text-white/70 hover:text-white transition">Catálogo</Link></li>
              <li><Link href="/carrito" className="text-sm text-white/70 hover:text-white transition">Carrito</Link></li>
              <li><Link href="/mis-pedidos" className="text-sm text-white/70 hover:text-white transition">Mis pedidos</Link></li>
              <li><Link href="/mi-cuenta" className="text-sm text-white/70 hover:text-white transition">Mi cuenta</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Contacto</p>
            <ul className="space-y-2">
              <li className="text-sm text-white/70">Av. IPN s/n, Barrio La Laguna</li>
              <li className="text-sm text-white/70">Ticomán, CDMX, C.P. 07340</li>
              <li className="text-sm text-white/70 mt-3">tienda@upiita.ipn.mx</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} UPIITA Tienda — Instituto Politécnico Nacional
          </p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="text-xs text-white/40 hover:text-white/70 transition">Iniciar sesión</Link>
            <Link href="/auth/registro" className="text-xs text-white/40 hover:text-white/70 transition">Registro</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
