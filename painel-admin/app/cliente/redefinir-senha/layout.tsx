import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Redefinir senha",

  description:
    "Defina uma nova senha para acessar sua conta do Padrões B3 com segurança.",

  alternates: {
    canonical: "/cliente/redefinir-senha",
  },

  openGraph: {
    title: "Redefinir senha | Padrões B3",

    description:
      "Crie uma nova senha para continuar utilizando o Padrões B3.",

    url: "/cliente/redefinir-senha",
    siteName: "Padrões B3",
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Redefinir senha | Padrões B3",

    description:
      "Altere sua senha com segurança e volte a acessar sua conta.",
  },

  robots: {
    index: false,
    follow: true,
  },
};

export default function RedefinirSenhaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}