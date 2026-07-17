"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import GoogleLoginButton from "@/components/google-login-button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

export default function LoginClientePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [carregando, setCarregando] =
    useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token_cliente");

    if (token) {
      router.replace("/cliente/dashboard");
    }
  }, [router]);

  async function fazerLogin(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const resposta = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            senha,
          }),
        }
      );

      let dados;

      try {
        dados = await resposta.json();
      } catch {
        throw new Error(
          "A API retornou uma resposta inválida."
        );
      }

      if (!resposta.ok) {
        setMensagem(
          dados?.detail ??
            dados?.mensagem ??
            "Não foi possível entrar."
        );

        return;
      }

      if (!dados.autenticado) {
        setMensagem(
          dados.mensagem ??
            "E-mail ou senha incorretos."
        );

        return;
      }

      if (dados.usuario?.role !== "usuario") {
        setMensagem(
          "Esta conta é administrativa. Utilize o painel de administração."
        );

        return;
      }

      if (!dados.token) {
        setMensagem(
          "A API não retornou o token de acesso."
        );

        return;
      }

      localStorage.setItem(
        "token_cliente",
        dados.token
      );

      localStorage.setItem(
        "usuario_cliente",
        JSON.stringify(dados.usuario)
      );

      router.replace("/cliente/dashboard");
      router.refresh();
    } catch (erroDesconhecido) {
      console.error(
        "Erro no login do cliente:",
        erroDesconhecido
      );

      setMensagem(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível conectar à plataforma. Confirme se a API está ligada."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden border-r border-white/10 bg-[#07111f] p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div>
            <Link
              href="/"
              aria-label="Voltar para a página inicial"
              className="inline-flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold">
                B3
              </span>

              <span>
                <span className="block text-xl font-semibold">
                  Padrões B3
                </span>

                <span className="block text-sm text-slate-400">
                  Área do cliente
                </span>
              </span>
            </Link>

            <div className="mt-24 max-w-xl xl:mt-28">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
                Inteligência estatística
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight xl:text-5xl">
                Identifique oportunidades com base
                em padrões históricos.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                Consulte oportunidades, acompanhe sua
                assinatura e acesse análises estatísticas
                em um único lugar.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Padrões B3 — análise estatística aplicada
            ao mercado.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-md">
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <Link
                href="/"
                aria-label="Voltar para a página inicial"
                className="flex min-w-0 items-center gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
                  B3
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-lg font-semibold">
                    Padrões B3
                  </span>

                  <span className="block text-xs text-slate-400">
                    Área do cliente
                  </span>
                </span>
              </Link>

              <Link
                href="/"
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Voltar
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 sm:p-8">
              <p className="text-sm font-medium text-blue-400">
                Bem-vindo
              </p>

              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Acessar minha conta
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Entre rapidamente com sua conta Google
                ou utilize seu e-mail e senha.
              </p>

              <div className="mt-7 sm:mt-8">
                <GoogleLoginButton
                  texto="continue_with"
                />
              </div>

              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/10" />

                <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-slate-600">
                  ou
                </span>

                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form
                className="space-y-5"
                onSubmit={fazerLogin}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    E-mail
                  </label>

                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(evento) => {
                      setEmail(
                        evento.target.value
                      );

                      if (mensagem) {
                        setMensagem("");
                      }
                    }}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={carregando}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="senha"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Senha
                  </label>

                  <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(evento) => {
                      setSenha(
                        evento.target.value
                      );

                      if (mensagem) {
                        setMensagem("");
                      }
                    }}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                    disabled={carregando}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/cliente/esqueci-senha"
                    className="inline-flex min-h-11 items-center text-sm font-medium text-blue-400 transition hover:text-blue-300"
                  >
                    Esqueci minha senha
                  </Link>
                </div>

                {mensagem && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
                  >
                    {mensagem}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-center font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                      Entrando...
                    </span>
                  ) : (
                    "Entrar com e-mail"
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Ainda não possui uma conta?
                </p>

                <Link
                  href="/cliente/cadastro"
                  className="mt-2 inline-flex min-h-11 items-center justify-center text-sm font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Criar conta gratuita
                </Link>
              </div>
            </div>

            <p className="mt-6 px-2 text-center text-xs leading-5 text-slate-600">
              As informações apresentadas pela plataforma
              não constituem recomendação de investimento.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}