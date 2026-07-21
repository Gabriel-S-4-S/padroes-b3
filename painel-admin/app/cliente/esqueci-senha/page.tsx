"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type RespostaRecuperacao = {
  sucesso: boolean;
  mensagem?: string;
};

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] =
    useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function solicitarRecuperacao(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setCarregando(true);
    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(
        `${API_URL}/auth/esqueci-senha`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      let dados: RespostaRecuperacao;

      try {
        dados =
          (await resposta.json()) as RespostaRecuperacao;
      } catch {
        throw new Error(
          "A API retornou uma resposta inválida."
        );
      }

      if (!resposta.ok || !dados.sucesso) {
        setErro(
          dados.mensagem ??
            "Não foi possível solicitar a recuperação."
        );

        return;
      }

      setMensagem(
        dados.mensagem ??
          "Enviamos um link de recuperação para o seu e-mail."
      );
    } catch (erroDesconhecido) {
      setErro(
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
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            className="flex min-w-0 items-center gap-3"
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

            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold">
                Padrões B3
              </span>

              <span className="block text-xs text-slate-400">
                Recuperação de acesso
              </span>
            </span>
          </Link>

          <Link
            href="/cliente"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm"
          >
            Voltar ao login
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 sm:p-8">
              <p className="text-sm font-medium text-blue-400">
                Recuperação de acesso
              </p>

              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Esqueci minha senha
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Informe o e-mail cadastrado. Enviaremos
                um link para você criar uma nova senha.
              </p>

              {erro && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
                >
                  {erro}
                </div>
              )}

              {mensagem && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300"
                >
                  {mensagem}
                </div>
              )}

              <form
                onSubmit={solicitarRecuperacao}
                className="mt-7 space-y-5 sm:mt-8"
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
                    onChange={(evento) =>
                      setEmail(evento.target.value)
                    }
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={carregando}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-center font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                      Enviando...
                    </span>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </button>
              </form>

              {mensagem && (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs leading-5 text-slate-500">
                    O link pode levar alguns instantes
                    para chegar. Verifique também as
                    pastas Spam, Promoções e
                    Atualizações.
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-white/10 pt-6 text-center">
                <Link
                  href="/cliente"
                  className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Voltar para o login
                </Link>
              </div>
            </div>

            <p className="mt-6 px-2 text-center text-xs leading-5 text-slate-600">
              Por segurança, nunca informe sua senha por
              e-mail ou mensagem.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
