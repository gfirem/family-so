import type { MetadataRoute } from "next";

// Manifest PWA: permite "Agregar a inicio de pantalla" en iPhone/Android.
// La app abre a pantalla completa (standalone) como un ícono nativo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "family-so — Sistema Operativo Familiar",
    short_name: "family-so",
    description:
      "Un solo lugar para planificar, decidir, ejecutar y medir la vida en familia.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f6f2",
    theme_color: "#059669",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
