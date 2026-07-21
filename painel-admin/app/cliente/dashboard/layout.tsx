"use client";

import Image from "next/image";
import {
  ReactNode,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { apiClienteFetch } from "@/app/services/api-cliente";

type UsuarioCliente = {
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
  usuario: UsuarioCliente;
};

type ClienteLayoutProps = {
  children: ReactNode;
};

const itensMenu = [
  {
    nome: "Início",
    caminho: "/cliente/dashboard",
  },
  {
    nome: "Oportunidades",
    caminho: "/cliente/dashboard/oportunidades",
  },
  {
    nome: "Planos",
    caminho: "/cliente/dashboard/planos",
  },
  {
    nome: "Minha conta",
    caminho: "/cliente/dashboard/conta",
  },
];

export default function ClienteDashboardLayout({
  children,
}: ClienteLayoutProps) {
  const router = useRouter();
  const caminhoAtual = usePathname();

  const [usuario, setUsuario] =
    useState<UsuarioCliente | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [menuAberto, setMenuAberto] =
    useState(false);

  useEffect(() => {
    let componenteAtivo = true;

    async function validarSessao() {
      const token =
        localStorage.getItem("token_cliente");

      if (!token) {
        router.replace("/cliente");
        return;
      }

      try {
        const resposta =
          await apiClienteFetch<RespostaMinhaConta>(
            "/auth/me"
          );

        if (
          !resposta.sucesso ||
          !resposta.usuario
        ) {
          throw new Error(
            "Não foi possível validar a conta."
          );
        }

        if (
          resposta.usuario.role !== "usuario"
        ) {
          throw new Error(
            "Esta conta não possui acesso à área do cliente."
          );
        }

        if (
          resposta.usuario.status !== "ativo"
        ) {
          throw new Error(
            "Esta conta está inativa ou cancelada."
          );
        }

        if (!componenteAtivo) {
          return;
        }

        setUsuario(resposta.usuario);

        localStorage.setItem(
          "usuario_cliente",
          JSON.stringify(
            resposta.usuario
          )
        );
      } catch (erroDesconhecido) {
        if (!componenteAtivo) {
          return;
        }

        const texto =
          erroDesconhecido instanceof Error
            ? erroDesconhecido.message
            : "Não foi possível validar sua sessão.";

        setErro(texto);

        localStorage.removeItem(
          "token_cliente"
        );

        localStorage.removeItem(
          "usuario_cliente"
        );

        setTimeout(() => {
          router.replace("/cliente");
        }, 1000);
      } finally {
        if (componenteAtivo) {
          setCarregando(false);
        }
      }
    }

    validarSessao();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  useEffect(() => {
    setMenuAberto(false);
  }, [caminhoAtual]);

  useEffect(() => {
    if (!menuAberto) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  function sair() {
    localStorage.removeItem(
      "token_cliente"
    );

    localStorage.removeItem(
      "usuario_cliente"
    );

    router.replace("/cliente");
  }

  function fecharMenu() {
    setMenuAberto(false);
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="mt-4 text-sm text-slate-400">
            Validando sua conta...
          </p>
        </div>
      </main>
    );
  }

  if (erro || !usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] p-4 text-white sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center sm:p-6">
          <h1 className="font-semibold text-red-200">
            Não foi possível acessar
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-300">
            {erro ||
              "Sua sessão não é válida."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#07111f] p-6 lg:flex lg:flex-col">
          <Link
            href="/cliente/dashboard"
            className="flex items-center gap-3"
          >
            <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
              <Image
                src="/logo.png"
                alt="Padrões B3"
                fill
                className="object-contain"
                priority
              />
            </div>

            <span>
              <span className="block font-semibold">
                Padrões B3
              </span>

              <span className="block text-xs text-slate-500">
                Área do cliente
              </span>
            </span>
          </Link>

          <nav className="mt-10 space-y-2">
            {itensMenu.map((item) => {
              const ativo =
                item.caminho ===
                "/cliente/dashboard"
                  ? caminhoAtual ===
                    item.caminho
                  : caminhoAtual.startsWith(
                      item.caminho
                    );

              return (
                <Link
                  key={item.caminho}
                  href={item.caminho}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    ativo
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.nome}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Plano atual
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              {formatarPlano(
                usuario.plano
              )}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {usuario.expira_em
                ? `Válido até ${formatarData(
                    usuario.expira_em
                  )}`
                : "Conta gratuita"}
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-white/10 bg-[#05070b]/95 px-4 py-3 backdrop-blur-xl sm:min-h-20 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={
                  menuAberto
                    ? "Fechar menu"
                    : "Abrir menu"
                }
                aria-expanded={menuAberto}
                aria-controls="menu-cliente-mobile"
                onClick={() =>
                  setMenuAberto(
                    (aberto) => !aberto
                  )
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.07] lg:hidden"
              >
                <span className="relative h-5 w-5">
                  <span
                    className={`absolute left-0 top-1 h-0.5 w-5 rounded-full bg-current transition ${
                      menuAberto
                        ? "translate-y-1.5 rotate-45"
                        : ""
                    }`}
                  />

                  <span
                    className={`absolute left-0 top-2.5 h-0.5 w-5 rounded-full bg-current transition ${
                      menuAberto
                        ? "opacity-0"
                        : "opacity-100"
                    }`}
                  />

                  <span
                    className={`absolute left-0 top-4 h-0.5 w-5 rounded-full bg-current transition ${
                      menuAberto
                        ? "-translate-y-1.5 -rotate-45"
                        : ""
                    }`}
                  />
                </span>
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold sm:text-xl">
                  Área do cliente
                </h2>

                <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
                  Consulte os dados da sua
                  conta
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <div className="hidden max-w-56 text-right md:block">
                <p className="truncate text-sm font-medium">
                  {usuario.nome}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {usuario.email}
                </p>
              </div>

              <button
                type="button"
                onClick={sair}
                className="flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
              >
                Sair
              </button>
            </div>
          </header>

          {children}
        </section>
      </div>

      <aside
        id="menu-cliente-mobile"
        className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-80 flex-col border-r border-white/10 bg-[#07111f] p-5 shadow-2xl shadow-black/50 transition duration-200 lg:hidden ${
          menuAberto
            ? "visible translate-x-0"
            : "invisible -translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/cliente/dashboard"
            onClick={fecharMenu}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
              B3
            </span>

            <span className="min-w-0">
              <span className="block truncate font-semibold">
                Padrões B3
              </span>

              <span className="block text-xs text-slate-500">
                Área do cliente
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={fecharMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-xl text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            ×
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {itensMenu.map((item) => {
            const ativo =
              item.caminho ===
              "/cliente/dashboard"
                ? caminhoAtual ===
                  item.caminho
                : caminhoAtual.startsWith(
                    item.caminho
                  );

            return (
              <Link
                key={item.caminho}
                href={item.caminho}
                onClick={fecharMenu}
                className={`block rounded-xl px-4 py-3.5 text-sm transition ${
                  ativo
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.nome}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Plano atual
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              {formatarPlano(
                usuario.plano
              )}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {usuario.expira_em
                ? `Válido até ${formatarData(
                    usuario.expira_em
                  )}`
                : "Conta gratuita"}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="truncate text-sm font-medium">
              {usuario.nome}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {usuario.email}
            </p>
          </div>

          <button
            type="button"
            onClick={sair}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fecharMenu}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
    </main>
  );
}

function formatarData(
  dataTexto: string
) {
  const data = new Date(
    dataTexto.replace(" ", "T")
  );

  if (Number.isNaN(data.getTime())) {
    return dataTexto;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
    }
  ).format(data);
}

function formatarPlano(
  plano: string
) {
  const nomes: Record<
    string,
    string
  > = {
    gratis: "Grátis",
    mensal: "Premium mensal",
    anual: "Premium anual",
  };

  return nomes[plano] ?? plano;
}
