# Preguntas para la defensa del proyecto
## UPIITA Tienda — Ingeniería Web 2TM3 2026/2
### Sebastián Arreguín Varela

---

## PROYECTO EN GENERAL

**¿De qué trata tu proyecto?**
Es una tienda en línea tipo Amazon llamada UPIITA Tienda, orientada a estudiantes del IPN. Permite comprar materiales para las materias: componentes electrónicos, libros, herramientas. Tiene catálogo, carrito, checkout, historial de pedidos, panel de administración y control de inventario.

---

**¿Por qué usaste Next.js en lugar de Python/Flask?**
Es una decisión técnica válida. Next.js me permitió manejar el frontend y el backend en un solo proyecto, con mejor rendimiento y una arquitectura más moderna. El objetivo del proyecto es funcionalidad correcta, y Next.js lo cumple y lo supera.

---

**¿Cómo funciona el flujo completo de una compra?**
El usuario entra al catálogo sin necesidad de cuenta, selecciona un producto, lo agrega al carrito. Al ir al checkout, si no está autenticado lo manda al login. Llena su dirección, confirma y se crea el pedido en la base de datos. Se limpia el carrito, se descuenta el stock y lo redirige a "Mis pedidos" con la confirmación.

---

**¿Qué tecnologías usaste y para qué sirve cada una?**
- **Next.js 14** — Framework principal, maneja frontend y rutas del servidor
- **TypeScript** — Tipado estático para evitar errores en tiempo de compilación
- **Supabase** — Base de datos PostgreSQL + autenticación en la nube
- **Tailwind CSS** — Estilos con clases utilitarias directamente en el HTML
- **Vercel** — Deploy automático en la nube conectado con GitHub

---

## FRONTEND

**¿Qué es Next.js y por qué lo usaste?**
Es un framework de React que permite crear aplicaciones web con renderizado del lado del servidor (SSR) y del cliente. Lo usé porque combina el frontend y las rutas API en un solo proyecto, y tiene soporte nativo para autenticación con Supabase.

---

**¿Qué es un componente cliente vs un componente servidor?**
Los Server Components se renderizan en el servidor y no pueden usar hooks de React ni interactividad. Los Client Components se marcan con "use client" y corren en el navegador — permiten useState, useEffect, eventos de click, etc. La mayoría de mis páginas son Client Components porque necesitan interactividad.

---

**¿Qué es el App Router de Next.js?**
Es el sistema de rutas basado en carpetas. Cada carpeta dentro de app/ con un archivo page.tsx se convierte en una ruta. Por ejemplo, app/tienda/page.tsx corresponde a la URL /tienda.

---

**¿Qué es Tailwind CSS?**
Es un framework de CSS utilitario. En lugar de escribir CSS en archivos separados, aplicas clases directamente en el HTML. Por ejemplo, bg-guinda-700 text-white px-4 py-2 define el color de fondo, texto blanco y padding.

---

**¿Cómo protegiste las rutas privadas?**
Con el archivo middleware.ts que intercepta todas las peticiones antes de que lleguen a las páginas. Si el usuario no tiene sesión activa e intenta entrar a /carrito, /checkout o /admin, lo redirige automáticamente al login.

---

## BACKEND

**¿Qué es Supabase?**
Es una plataforma de backend como servicio (BaaS) basada en PostgreSQL. Ofrece base de datos, autenticación, almacenamiento y APIs automáticas. Es similar a Firebase pero usa SQL en lugar de NoSQL.

---

**¿Cómo funciona la autenticación?**
Usé Supabase Auth con dos métodos: registro con email/contraseña y login con Google OAuth 2.0. Cuando el usuario inicia sesión, Supabase genera un JWT que se guarda en cookies. El middleware de Next.js verifica ese token en cada petición para proteger las rutas privadas.

---

**¿Qué es OAuth y cómo lo implementaste?**
OAuth 2.0 es un protocolo de autorización que permite a los usuarios autenticarse con su cuenta de Google sin compartir su contraseña. Configuré un proyecto en Google Cloud Console, obtuve las credenciales y las registré en Supabase. Cuando el usuario hace click en "Iniciar sesión con Google", Supabase maneja todo el flujo y regresa al usuario autenticado.

---

**¿Qué hace el middleware?**
El archivo middleware.ts intercepta todas las peticiones antes de que lleguen a las páginas. Verifica si el usuario tiene sesión activa. Si intenta acceder a /carrito, /checkout o /admin sin estar autenticado, lo redirige al login.

---

**¿Cómo se actualiza el inventario al realizar una compra?**
En el checkout, después de insertar el detalle del pedido, se consulta el stock actual de cada producto y se actualiza restando la cantidad comprada, con un mínimo de 0 para evitar stock negativo.

---

## BASE DE DATOS

**¿Cuántas tablas tiene tu base de datos y cuáles son las principales?**
14 tablas. Las principales son: perfiles (usuarios), categorias, productos, carritos, items_carrito, pedidos, detalle_pedido e historial_inventario.

---

**¿Qué es Row Level Security (RLS)?**
Es una función de PostgreSQL que restringe qué filas puede ver o modificar cada usuario. Por ejemplo, un usuario solo puede ver sus propios pedidos aunque exista una tabla con los pedidos de todos. Sin RLS, cualquier usuario podría ver datos de otros.

---

**¿Cómo se relacionan las tablas de pedido?**
Un pedido pertenece a un usuario y tiene muchos detalle_pedido. Cada detalle registra el producto, cantidad y precio al momento de la compra.

---

**¿Por qué guardas el precio en detalle_pedido y no solo la referencia al producto?**
Porque el precio puede cambiar. Si solo guardara el producto_id, al consultar el historial de un pedido antiguo mostraría el precio actual, no el que pagó el usuario. Guardar precio_unitario en el detalle preserva la integridad histórica.

---

## ROLES

**¿Cuántos roles tiene el sistema y qué puede hacer cada uno?**
Cuatro roles:
- **cliente** — puede navegar el catálogo, agregar al carrito, hacer checkout y ver sus pedidos
- **admin** — gestiona productos, pedidos y ve el dashboard con estadísticas
- **inventarios** — controla el stock (entradas, salidas, ajustes) y ve el historial de movimientos
- **general** — acceso de solo lectura al panel admin

---

**¿Cómo se valida el rol en el código?**
Al cargar cada página protegida, consulto la tabla perfiles con el user.id de la sesión activa y verifico el campo rol. Si no cumple el rol requerido, lo redirijo al catálogo.

---

## DIFICULTADES Y APRENDIZAJES

**¿Qué fue lo más difícil?**
Configurar correctamente la autenticación con el App Router de Next.js 14. El manejo de cookies entre el servidor y el cliente tiene reglas específicas y tuve que usar @supabase/ssr con configuración particular para que funcionara. También la seguridad RLS al principio bloqueaba todas las consultas porque no había configurado las políticas públicas de lectura.

---

**¿Qué fue lo más fácil?**
El diseño de la interfaz con Tailwind CSS, porque las clases utilitarias permiten hacer cambios visuales rápidamente sin salir del archivo. También la estructura de rutas de Next.js es muy intuitiva: la carpeta es la URL.

---

**¿Qué harías diferente si lo volvieras a hacer?**
Configuraría el sistema de roles desde el principio con mayor detalle, y usaría imágenes reales de productos integrando Supabase Storage desde el inicio en lugar de placeholders.

---

**¿El proyecto está en producción?**
Sí, está desplegado en Vercel en:
https://proyecto-ingenier-a-web-phi.vercel.app

El código fuente está en GitHub en:
https://github.com/sebasav21/Proyecto-Ingenier-a-Web
