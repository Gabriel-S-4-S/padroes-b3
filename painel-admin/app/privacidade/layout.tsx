import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Política de Privacidade",

  description:
    "Conheça a Política de Privacidade do Padrões B3. Saiba como coletamos, utilizamos, protegemos e tratamos seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).",

  keywords: [
    "Política de Privacidade",
    "LGPD",
    "Proteção de Dados",
    "Dados pessoais",
    "Privacidade",
    "Padrões B3",
    "Lei Geral de Proteção de Dados",
    "Segurança da informação",
  ],

  alternates: {
    canonical: "/privacidade",
  },

  openGraph: {
    title: "Política de Privacidade | Padrões B3",
    description:
      "Saiba como o Padrões B3 protege seus dados e trata suas informações pessoais de acordo com a LGPD.",
    url: "/privacidade",
    siteName: "Padrões B3",
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Política de Privacidade | Padrões B3",
    description:
      "Entenda como seus dados são protegidos no Padrões B3.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacidadeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}