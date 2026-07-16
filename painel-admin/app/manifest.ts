import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Padrões B3",

    short_name: "Padrões B3",

    description:
      "Plataforma de análise estatística de ações brasileiras com scanner automático, backtests e oportunidades na B3.",

    start_url: "/",

    scope: "/",

    display: "standalone",

    orientation: "portrait-primary",

    background_color: "#05070b",

    theme_color: "#05070b",

    lang: "pt-BR",

    categories: [
      "finance",
      "business",
      "productivity",
    ],

    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}