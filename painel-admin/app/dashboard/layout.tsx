"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { apiFetch } from "@/app/services/api";

type UsuarioAdmin = {
  id: number;
  nome: string;
  email: string;
  plano: string;
  status: string;
  expira_em: string | null;
  role: string;
  email_verificado: boolean;
};

type RespostaMinhaConta = {
  sucesso: boolean;
  usuario: UsuarioAdmin;
};

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<UsuarioAdmin | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");

  useEffect(() => {
    let componenteAtivo = true;

    async function validarSessao() {
      const token = localStorage.getItem("token_admin");

      if (!token) {
        encerrarSessao();
        return;
      }

      setCarregando(true);
      setErro("");

      try {
        const resposta =
          await apiFetch<RespostaMinhaConta>("/auth/me");

        if (!resposta.sucesso || !resposta.usuario) {
          throw new Error(
            "Não foi possível validar a conta."
          );
        }

        if (resposta.usuario.status !== "ativo") {
          throw new Error(
            "Esta conta não está ativa."
          );
        }

        if (resposta.usuario.role !== "admin") {
          throw new Error(
            "Esta conta não possui permissão de administrador."
          );
        }

        if (!componenteAtivo) {
          return;
        }

        setUsuario(resposta.usuario);

        // Atualiza os dados locais caso nome, e-mail
        // ou permissão tenham sido alterados no banco.
        localStorage.setItem(
          "usuario_admin",
          JSON.stringify(resposta.usuario)
        );
      } catch (erroDesconhecido) {
        if (!componenteAtivo) {
          return;
        }

        const mensagem =
          erroDesconhecido instanceof Error
            ? erroDesconhecido.message
            : "Não foi possível validar sua sessão.";

        setErro(mensagem);

        localStorage.removeItem("token_admin");
        localStorage.removeItem("usuario_admin");

        setTimeout(() => {
          router.replace("/admin");
        }, 1000);
      } finally {
        if (componenteAtivo) {
          setCarregando(false);
        }
      }
    }

    function encerrarSessao() {
      localStorage.removeItem("token_admin");
      localStorage.removeItem("usuario_admin");

      router.replace("/admin");
    }

    validarSessao();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-white">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="mt-4 text-sm text-slate-400">
            Validando sua sessão...
          </p>
        </div>
      </main>
    );
  }

  if (erro || !usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] p-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-200">
            Acesso não autorizado
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-300">
            {erro || "Sua sessão não é válida."}
          </p>

          <p className="mt-3 text-xs text-red-400/70">
            Redirecionando para o login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <section className="min-w-0 flex-1">
          <AdminHeader
            titulo="Painel Administrativo"
            subtitulo="Controle e monitoramento da plataforma"
            usuario={usuario}
          />

          {children}
        </section>
      </div>
    </main>
  );
}