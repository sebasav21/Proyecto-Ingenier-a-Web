import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UPIITA Tienda - Materiales para Ingeniería",
  description: "Tienda en línea de materiales y herramientas para estudiantes de UPIITA IPN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
