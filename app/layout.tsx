import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "family-so — Sistema Operativo Familiar",
  description:
    "Un solo lugar para que Guille y China planifiquen, decidan, ejecuten y midan la vida en familia.",
  manifest: "/manifest.webmanifest",
  applicationName: "family-so",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  // Hace que iOS abra la app a pantalla completa (sin barra de Safari)
  // cuando se agrega a la pantalla de inicio.
  appleWebApp: {
    capable: true,
    title: "family-so",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
  // Ocupa toda la pantalla respetando el notch/safe-area del iPhone.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
