export type Rol = "admin" | "cliente" | "inventarios" | "general";

export interface Perfil {
  id: string;
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  email: string;
  telefono: string | null;
  curp: string | null;
  rfc: string | null;
  rol: Rol;
  activo: boolean;
  created_at: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  categoria_id: number | null;
  activo: boolean;
  created_at: string;
  categorias?: Categoria;
  imagenes_producto?: ImagenProducto[];
}

export interface ImagenProducto {
  id: number;
  producto_id: number;
  url: string;
  es_principal: boolean;
}

export interface Direccion {
  id: number;
  usuario_id: string;
  calle: string;
  numero_exterior: string | null;
  numero_interior: string | null;
  colonia: string | null;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  es_principal: boolean;
  activo: boolean;
}

export interface ItemCarrito {
  id: number;
  carrito_id: number;
  producto_id: number;
  cantidad: number;
  productos?: Producto;
}

export type EstadoPedido = "pendiente" | "confirmado" | "enviado" | "entregado" | "cancelado";

export interface Pedido {
  id: number;
  usuario_id: string;
  direccion_id: number | null;
  total: number;
  estado: EstadoPedido;
  notas: string | null;
  created_at: string;
  updated_at: string;
  detalle_pedido?: DetallePedido[];
  direcciones?: Direccion;
}

export interface DetallePedido {
  id: number;
  pedido_id: number;
  producto_id: number | null;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
}
