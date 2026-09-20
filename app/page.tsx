import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 h-14 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-blue-700 text-lg">UPIITA Tienda</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
            Iniciar sesión
          </Link>
          <Link href="/auth/registro"
            className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-lg hover:bg-blue-800 transition">
            Crear cuenta
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span>🏫</span> IPN · UPIITA
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Todo lo que necesitas<br />
          <span className="text-blue-700">para tus materias</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          Componentes electrónicos, herramientas, libros y más. Hecho para estudiantes de ingeniería.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/tienda"
            className="bg-blue-700 text-white text-base font-medium px-8 py-3 rounded-xl hover:bg-blue-800 transition">
            Ver materiales
          </Link>
          <Link href="/auth/registro"
            className="border border-gray-300 text-gray-700 text-base font-medium px-8 py-3 rounded-xl hover:bg-gray-50 transition">
            Crear cuenta
          </Link>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon: "🔌", title: "Electrónica", desc: "Arduino, sensores, componentes" },
            { icon: "🔧", title: "Herramientas", desc: "Multímetros, soldadores, pinzas" },
            { icon: "📚", title: "Libros", desc: "Manuales y guías técnicas" },
            { icon: "💻", title: "Cómputo", desc: "Cables, memorias, adaptadores" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Por qué UPIITA Tienda?</h2>
        <p className="text-gray-500 mb-8">Una plataforma pensada para la comunidad politécnica</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "🚚", title: "Entrega en campus", desc: "Recibe tus materiales directo en UPIITA" },
            { icon: "🔒", title: "Acceso seguro", desc: "Login con Google mediante OAuth 2.0" },
            { icon: "⭐", title: "Recomendaciones", desc: "Productos destacados por materia" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
