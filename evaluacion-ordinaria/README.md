# UPIITA Tienda - Evaluación Ordinaria
## Ingeniería Web 2TM3 2026/2

**Alumno:** Sebastián Arreguín Varela  
**Repositorio:** https://github.com/sebasav21/Proyecto-Ingenier-a-Web  
**Aplicación en producción:** https://proyecto-ingenier-a-web-phi.vercel.app

---

## Descripción del proyecto

UPIITA Tienda es una plataforma de comercio electrónico tipo Amazon desarrollada para la comunidad estudiantil del Instituto Politécnico Nacional — UPIITA. Permite a los estudiantes adquirir materiales necesarios para sus materias: componentes electrónicos, herramientas, libros técnicos y más.

---

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Next.js 14 (App Router) | Framework frontend/backend |
| TypeScript | Tipado estático |
| Supabase (PostgreSQL) | Base de datos + autenticación |
| Row Level Security (RLS) | Seguridad a nivel de fila |
| Google OAuth 2.0 | Inicio de sesión con Google |
| Tailwind CSS | Estilos y diseño |
| Vercel | Deploy en la nube |

---

## Funcionalidades implementadas

### Para clientes
- Catálogo público con búsqueda y filtros por categoría
- Detalle de producto con selección de cantidad
- Carrito de compras con actualización en tiempo real
- Checkout con dirección de entrega y validaciones
- Historial de pedidos propios
- Registro por email y login con Google OAuth

### Para administradores
- Dashboard con estadísticas (productos, pedidos, usuarios, ingresos)
- Gestión de productos (crear, editar, activar/desactivar)
- Gestión de pedidos con cambio de estado (pendiente → confirmado → enviado → entregado)

### Para inventarios
- Panel de control de stock
- Registro de movimientos: entrada, salida y ajuste
- Historial de movimientos con fecha y motivo
- Alertas de productos con stock bajo

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| `cliente` | Catálogo, carrito, checkout, mis pedidos |
| `admin` | Todo lo anterior + panel de administración completo |
| `inventarios` | Panel de inventario y control de stock |
| `general` | Acceso de solo lectura al panel admin |

---

## Base de datos

14 tablas en PostgreSQL con Row Level Security habilitado:

`perfiles`, `categorias`, `productos`, `imagenes_producto`, `recomendaciones`, `direcciones`, `metodos_pago`, `carritos`, `items_carrito`, `pedidos`, `detalle_pedido`, `calificaciones`, `historial_inventario`, `notificaciones`

El esquema completo se encuentra en: [`supabase/schema.sql`](../supabase/schema.sql)  
Los datos de prueba en: [`supabase/seed.sql`](../supabase/seed.sql)

---

## Estructura del proyecto

```
Proyecto-Ingenier-a-Web/
├── app/
│   ├── page.tsx              # Landing page
│   ├── tienda/               # Catálogo de productos
│   ├── producto/[id]/        # Detalle de producto
│   ├── carrito/              # Carrito de compras
│   ├── checkout/             # Proceso de pago
│   ├── mis-pedidos/          # Historial de pedidos
│   ├── auth/                 # Login y registro
│   ├── admin/                # Panel de administración
│   └── inventario/           # Panel de inventario
├── components/
│   └── Navbar.tsx            # Barra de navegación
├── lib/
│   ├── supabase/             # Clientes Supabase
│   └── types.ts              # Tipos TypeScript
├── supabase/
│   ├── schema.sql            # Esquema de la base de datos
│   └── seed.sql              # Datos de prueba
├── documentacion/            # Entregas anteriores (1er y 2do parcial)
└── evaluacion-ordinaria/     # Esta carpeta
```

---

## Entregables previos

Los archivos de las entregas parciales se encuentran en la carpeta [`/documentacion`](../documentacion/):
- `IngenieriaWeb_1erDepto.pdf` — Primera entrega parcial
- `IngenieriaWeb_2doDepto_ArreguínVarela.pdf` — Segunda entrega parcial
- `app.py` y `login.html` — Prototipo original en Python/Flask
- `Basededatos.sql` — Diseño original de base de datos en SQL Server
