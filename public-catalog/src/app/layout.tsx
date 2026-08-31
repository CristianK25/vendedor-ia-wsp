import type { Metadata } from "next";
import "./globals.css";

// Metadata base global para el sitio
export const metadata: Metadata = {
  title: "Catálogo de Vehículos | AutoLead",
  description: "Catálogo oficial de vehículos disponibles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
