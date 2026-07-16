import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Termos de Uso",

  description:
    "Consulte os Termos de Uso do Padrões B3 e conheça as regras de acesso, assinaturas, pagamentos, riscos, responsabilidades e utilização da plataforma.",

  keywords: [
    "Termos de Uso",
    "Padrões B3",
    "regras da plataforma",
    "assinatura Padrões B3",
    "pagamento Padrões B3",
    "análise de ações",
    "riscos de investimento",
    "ações da B3",
    "Bolsa de Valores",
  ],

  alternates: {
    canonical: "/termos",
  },

  openGraph: {
    title: "Termos de Uso | Padrões B3",

    description:
      "Conheça as condições de acesso e utilização da plataforma Padrões B3, incluindo assinaturas, pagamentos e responsabilidades.",

    url: "/termos",
    siteName: "Padrões B3",
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Termos de Uso | Padrões B3",

    description:
      "Consulte as condições de acesso, assinaturas, pagamentos e utilização do Padrões B3.",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function TermosLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}