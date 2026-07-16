import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Criar conta gratuita",

  description:
    "Crie gratuitamente sua conta no Padrões B3 e conheça uma plataforma de análise estatística de ações brasileiras com backtests e oportunidades na Bolsa de Valores.",

  alternates: {
    canonical: "/cliente/cadastro",
  },

  openGraph: {
    title: "Criar conta gratuita | Padrões B3",

    description:
      "Crie sua conta gratuita e consulte oportunidades estatísticas em ações brasileiras.",

    url: "/cliente/cadastro",
    siteName: "Padrões B3",
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Criar conta gratuita | Padrões B3",

    description:
      "Conheça o Padrões B3 e acompanhe oportunidades baseadas em padrões históricos de ações brasileiras.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function CadastroLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}