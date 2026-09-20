-- ============================================================
-- SCHEMA: Tienda E-Commerce - Ingeniería Web IPN/UPIITA
-- ============================================================

-- 1. Perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS perfiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre       VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100),
  apellido_materno VARCHAR(100),
  email        VARCHAR(255) NOT NULL,
  telefono     VARCHAR(20),
  curp         VARCHAR(18),
  rfc          VARCHAR(13),
  rol          VARCHAR(30) NOT NULL DEFAULT 'cliente'
               CHECK (rol IN ('admin', 'cliente', 'inventarios', 'general')),
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categorias de productos
CREATE TABLE IF NOT EXISTS categorias (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  activo       BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Productos
CREATE TABLE IF NOT EXISTS productos (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(255) NOT NULL,
  descripcion  TEXT,
  precio       DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Imágenes de productos
CREATE TABLE IF NOT EXISTS imagenes_producto (
  id           SERIAL PRIMARY KEY,
  producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. Direcciones de entrega
CREATE TABLE IF NOT EXISTS direcciones (
  id               SERIAL PRIMARY KEY,
  usuario_id       UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  calle            VARCHAR(255) NOT NULL,
  numero_exterior  VARCHAR(20),
  numero_interior  VARCHAR(20),
  colonia          VARCHAR(100),
  ciudad           VARCHAR(100) NOT NULL,
  estado           VARCHAR(100) NOT NULL,
  codigo_postal    VARCHAR(10) NOT NULL,
  es_principal     BOOLEAN NOT NULL DEFAULT FALSE,
  activo           BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. Métodos de pago
CREATE TABLE IF NOT EXISTS metodos_pago (
  id               SERIAL PRIMARY KEY,
  usuario_id       UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  tipo             VARCHAR(50) NOT NULL CHECK (tipo IN ('tarjeta', 'transferencia', 'efectivo')),
  ultimos_digitos  VARCHAR(4),
  marca            VARCHAR(50),
  nombre_titular   VARCHAR(100),
  token_encriptado TEXT,
  es_principal     BOOLEAN NOT NULL DEFAULT FALSE,
  activo           BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. Carritos
CREATE TABLE IF NOT EXISTS carritos (
  id           SERIAL PRIMARY KEY,
  usuario_id   UUID NOT NULL UNIQUE REFERENCES perfiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Items del carrito
CREATE TABLE IF NOT EXISTS items_carrito (
  id           SERIAL PRIMARY KEY,
  carrito_id   INTEGER NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
  producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad     INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(carrito_id, producto_id)
);

-- 9. Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id             SERIAL PRIMARY KEY,
  usuario_id     UUID NOT NULL REFERENCES perfiles(id),
  direccion_id   INTEGER REFERENCES direcciones(id),
  metodo_pago_id INTEGER REFERENCES metodos_pago(id),
  total          DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  estado         VARCHAR(50) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','confirmado','enviado','entregado','cancelado')),
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Detalle del pedido (snapshot de precio al momento de compra)
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id               SERIAL PRIMARY KEY,
  pedido_id        INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id      INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  nombre_producto  VARCHAR(255) NOT NULL,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  cantidad         INTEGER NOT NULL CHECK (cantidad > 0)
);

-- 11. Calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
  id           SERIAL PRIMARY KEY,
  usuario_id   UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  pedido_id    INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  puntuacion   INTEGER NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id, pedido_id)
);

-- 12. Recomendaciones (productos destacados por admin)
CREATE TABLE IF NOT EXISTS recomendaciones (
  id           SERIAL PRIMARY KEY,
  producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo         VARCHAR(50) NOT NULL DEFAULT 'destacado'
               CHECK (tipo IN ('destacado', 'nuevo', 'oferta')),
  orden        INTEGER NOT NULL DEFAULT 0,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Historial de inventario (movimientos de stock)
CREATE TABLE IF NOT EXISTS historial_inventario (
  id              SERIAL PRIMARY KEY,
  producto_id     INTEGER NOT NULL REFERENCES productos(id),
  usuario_id      UUID NOT NULL REFERENCES perfiles(id),
  tipo            VARCHAR(50) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad        INTEGER NOT NULL,
  stock_anterior  INTEGER NOT NULL,
  stock_nuevo     INTEGER NOT NULL,
  motivo          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notificaciones de pedidos
CREATE TABLE IF NOT EXISTS notificaciones (
  id           SERIAL PRIMARY KEY,
  usuario_id   UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  pedido_id    INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  titulo       VARCHAR(255) NOT NULL,
  mensaje      TEXT NOT NULL,
  leida        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE perfiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodos_pago          ENABLE ROW LEVEL SECURITY;
ALTER TABLE carritos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_carrito         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido        ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_inventario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones   ENABLE ROW LEVEL SECURITY;

-- Perfiles: cada usuario ve y edita solo el suyo; admins ven todos
CREATE POLICY "perfil_propio" ON perfiles
  FOR ALL USING (auth.uid() = id);

-- Direcciones: solo el dueño
CREATE POLICY "direcciones_propias" ON direcciones
  FOR ALL USING (auth.uid() = usuario_id);

-- Métodos de pago: solo el dueño
CREATE POLICY "metodos_propios" ON metodos_pago
  FOR ALL USING (auth.uid() = usuario_id);

-- Carrito: solo el dueño
CREATE POLICY "carrito_propio" ON carritos
  FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "items_carrito_propios" ON items_carrito
  FOR ALL USING (
    carrito_id IN (SELECT id FROM carritos WHERE usuario_id = auth.uid())
  );

-- Pedidos: el usuario ve los suyos
CREATE POLICY "pedidos_propios" ON pedidos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "pedidos_insert" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "detalle_pedido_propio" ON detalle_pedido
  FOR SELECT USING (
    pedido_id IN (SELECT id FROM pedidos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "detalle_pedido_insert" ON detalle_pedido
  FOR INSERT WITH CHECK (
    pedido_id IN (SELECT id FROM pedidos WHERE usuario_id = auth.uid())
  );

-- Calificaciones: el usuario ve y crea las suyas
CREATE POLICY "calificaciones_propias" ON calificaciones
  FOR ALL USING (auth.uid() = usuario_id);

-- Notificaciones: solo el dueño
CREATE POLICY "notificaciones_propias" ON notificaciones
  FOR ALL USING (auth.uid() = usuario_id);

-- Historial inventario: solo usuarios autenticados (staff)
CREATE POLICY "inventario_autenticado" ON historial_inventario
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Electrónica', 'Dispositivos y accesorios electrónicos'),
  ('Ropa', 'Prendas de vestir para todas las ocasiones'),
  ('Hogar', 'Artículos para el hogar y decoración'),
  ('Deportes', 'Equipos y ropa deportiva'),
  ('Libros', 'Libros, revistas y material educativo')
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES
  ('Auriculares Bluetooth', 'Auriculares inalámbricos con cancelación de ruido', 899.00, 25, 1),
  ('Camiseta básica negra', 'Camiseta de algodón 100%, talla M', 199.00, 50, 2),
  ('Lámpara de escritorio LED', 'Lámpara LED con ajuste de intensidad', 349.00, 15, 3),
  ('Pelota de fútbol', 'Pelota oficial talla 5', 450.00, 30, 4),
  ('Introducción a Python', 'Libro para aprender programación desde cero', 280.00, 20, 5),
  ('Mouse inalámbrico', 'Mouse ergonómico con receptor USB', 399.00, 40, 1),
  ('Sudadera con capucha', 'Sudadera unisex talla L', 459.00, 35, 2),
  ('Taza térmica', 'Taza de acero inoxidable 500ml', 149.00, 60, 3)
ON CONFLICT DO NOTHING;

INSERT INTO recomendaciones (producto_id, tipo, orden) VALUES
  (1, 'destacado', 1),
  (6, 'nuevo', 2),
  (3, 'oferta', 3),
  (5, 'destacado', 4)
ON CONFLICT DO NOTHING;
