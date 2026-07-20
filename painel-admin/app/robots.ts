import type { MetadataRoute } from "next";

function obterUrlBase() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const urlBase = obterUrlBase();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
          "/cliente/dashboard",
          "/api",
        ],
      },
    ],

    sitemap: `${urlBase}/sitemap.xml`,
  };
}
