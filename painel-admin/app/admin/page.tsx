"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(
          dados?.detail ??
            dados?.mensagem ??
            "Não foi possível realizar o login."
        );
        return;
      }

      if (!dados.autenticado) {
        setMensagem(dados.mensagem ?? "Não foi possível entrar.");
        return;
      }

      if (dados.usuario?.role !== "admin") {
        setMensagem("Esta conta não possui permissão de administrador.");
        return;
      }

      if (!dados.token) {
        setMensagem("A API não retornou um token de acesso.");
        return;
      }

      localStorage.setItem("token_admin", dados.token);
      localStorage.setItem(
        "usuario_admin",
        JSON.stringify(dados.usuario)
      );

      router.push("/dashboard");
      router.refresh();
    } catch (erro) {
      console.error("Erro ao realizar login:", erro);

      setMensagem(
        "Não foi possível conectar à API. Confirme se o FastAPI está ligado."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden border-r border-white/10 bg-[#07111f] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3">
              
              <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                <Image
                  src="/logo.png"
                  alt="Padrões B3"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div>
                <h1 className="text-xl font-semibold">Padrões B3</h1>

                <p className="text-sm text-slate-400">
                  Painel administrativo
                </p>
              </div>
            </div>

            <div className="mt-28 max-w-xl">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
                Inteligência estatística
              </p>

              <h2 className="mt-5 text-5xl font-semibold leading-tight">
                Controle completo da plataforma em um só lugar.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                Gerencie usuários, assinaturas, oportunidades,
                estratégias e auditoria com segurança.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Padrões B3 — análise, confiança e controle.
          </p>
        </section>

        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <h1 className="text-2xl font-semibold">
                Padrões B3
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Painel administrativo
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-sm font-medium text-blue-400">
                Acesso restrito
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                Entrar no painel
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Utilize uma conta com permissão de administrador.
              </p>

              <form
                className="mt-8 space-y-5"
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
                    value={email}
                    onChange={(evento) =>
                      setEmail(evento.target.value)
                    }
                    placeholder="admin@padroesb3.com"
                    autoComplete="email"
                    required
                    disabled={carregando}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                    onChange={(evento) =>
                      setSenha(evento.target.value)
                    }
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                    disabled={carregando}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {mensagem && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {mensagem}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Entrando...
                    </span>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
