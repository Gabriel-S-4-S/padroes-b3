import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Recuperar senha",

  description:
    "Recupere o acesso à sua conta do Padrões B3. Informe seu e-mail para receber as instruções de redefinição da senha.",

  alternates: {
    canonical: "/cliente/esqueci-senha",
  },

  openGraph: {
    title: "Recuperar senha | Padrões B3",

    description:
      "Solicite a recuperação da senha da sua conta no Padrões B3.",

    url: "/cliente/esqueci-senha",
    siteName: "Padrões B3",
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Recuperar senha | Padrões B3",

    description:
      "Receba um link para redefinir a senha da sua conta no Padrões B3.",
  },

  robots: {
    index: false,
    follow: true,
  },
};

export default function EsqueciSenhaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
