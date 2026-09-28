export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/carrito/:path*",
    "/checkout/:path*",
    "/mis-pedidos/:path*",
    "/admin/:path*",
    "/inventario/:path*",
    "/mi-cuenta/:path*",
  ],
};
