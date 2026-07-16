import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Entrar",

  description:
    "Acesse sua conta no Padrões B3 para consultar oportunidades em ações brasileiras, estatísticas históricas, planos e informações da assinatura.",

  alternates: {
    canonical: "/cliente",
  },

  openGraph: {
    title: "Entrar | Padrões B3",
    description:
      "Acesse sua conta para acompanhar oportunidades estatísticas em ações da B3.",
    url: "/cliente",
    siteName: "Padrões B3",
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Entrar | Padrões B3",
    description:
      "Acesse sua conta no Padrões B3 e consulte oportunidades estatísticas em ações brasileiras.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function ClienteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}