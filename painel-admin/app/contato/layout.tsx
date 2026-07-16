import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com o Padrões B3 para dúvidas sobre acesso, assinaturas, pagamentos, privacidade e funcionamento da plataforma.",
  alternates: {
    canonical: "/contato",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContatoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}