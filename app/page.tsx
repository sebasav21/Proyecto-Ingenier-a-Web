import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar landing */}
      <nav className="bg-guinda-700 shadow-md px-6 h-16 flex items-center justify-between max-w-full">
        <div className="flex items-center gap-3">
          <Image src="/upiita-logo.png" alt="UPIITA" width={38} height={38} className="object-contain" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">UPIITA Tienda</p>
            <p className="text-guinda-200 text-xs leading-tight">Instituto Politécnico Nacional</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/auth/login" className="text-sm text-guinda-100 hover:text-white px-3 py-1.5 transition">
            Iniciar sesión
          </Link>
          <Link href="/auth/registro"
            className="text-sm bg-dorado-400 hover:bg-dorado-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-guinda-700 pb-20 pt-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-6 mb-8">
            <Image src="/upiita-logo.png" alt="UPIITA IPN" width={80} height={80} className="object-contain" />
            <Image src="/ipn-logo.jpeg" alt="IPN" width={70} height={80} className="object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 bg-guinda-800 text-dorado-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-guinda-600">
            IPN · UPIITA · Tienda Oficial
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Todo lo que necesitas<br />
            <span className="text-dorado-400">para tus materias</span>
          </h1>
          <p className="text-lg text-guinda-100 mb-10 max-w-xl mx-auto">
            Componentes electrónicos, herramientas, libros y más. Hecho para estudiantes de ingeniería del IPN.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/tienda"
              className="bg-dorado-400 hover:bg-dorado-500 text-white text-base font-medium px-8 py-3 rounded-xl transition shadow-md">
              Ver materiales
            </Link>
            <Link href="/auth/registro"
              className="border border-guinda-400 text-white text-base font-medium px-8 py-3 rounded-xl hover:bg-guinda-600 transition">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-guinda-700 text-center mb-10">Categorías disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🔌", title: "Electrónica", desc: "Arduino, sensores, componentes" },
              { icon: "🔧", title: "Herramientas", desc: "Multímetros, soldadores, pinzas" },
              { icon: "📚", title: "Libros", desc: "Manuales y guías técnicas" },
              { icon: "💻", title: "Cómputo", desc: "Cables, memorias, adaptadores" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition hover:border-guinda-200">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-semibold text-guinda-700 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-guinda-700 mb-3">¿Por qué UPIITA Tienda?</h2>
        <p className="text-gray-500 mb-10">Una plataforma pensada para la comunidad politécnica</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: "🚚", title: "Entrega en campus", desc: "Recibe tus materiales directo en UPIITA" },
            { icon: "🔒", title: "Acceso seguro", desc: "Login con Google mediante OAuth 2.0" },
            { icon: "⭐", title: "Recomendaciones", desc: "Productos destacados por materia" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-semibold text-guinda-700">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-guinda-800 py-6 text-center">
        <p className="text-guinda-200 text-sm">© 2026 UPIITA Tienda · Instituto Politécnico Nacional</p>
      </footer>
    </main>
  );
}
