import type { MetadataRoute } from "next";

function obterUrlBase() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const urlBase = obterUrlBase();
  const agora = new Date();

  return [
    {
      url: urlBase,
      lastModified: agora,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${urlBase}/termos`,
      lastModified: agora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${urlBase}/privacidade`,
      lastModified: agora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${urlBase}/contato`,
      lastModified: agora,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}