"use client";
import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import GoogleLoginButton from "@/components/google-login-button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type RespostaCadastro = {
  sucesso: boolean;
  mensagem?: string;
  usuario?: {
    nome: string;
    email: string;
    plano: string;
    role: string;
  };
};

export default function CadastroClientePage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function cadastrar(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setMensagem("");

    if (nome.trim().length < 3) {
      setErro(
        "O nome deve possuir pelo menos 3 caracteres."
      );
      return;
    }

    if (senha.length < 8) {
      setErro(
        "A senha deve possuir pelo menos 8 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setErro(
        "As senhas informadas não são iguais."
      );
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(
        `${API_URL}/auth/cadastro`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            senha,
          }),
        }
      );

      let dados: RespostaCadastro;

      try {
        dados =
          (await resposta.json()) as RespostaCadastro;
      } catch {
        throw new Error(
          "A API retornou uma resposta inválida."
        );
      }

      if (!resposta.ok || !dados.sucesso) {
        setErro(
          dados.mensagem ??
            "Não foi possível criar sua conta."
        );

        return;
      }

      setMensagem(
        "Conta criada com sucesso. Redirecionando para o login..."
      );

      setTimeout(() => {
        router.replace("/cliente");
      }, 1200);
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
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden border-r border-white/10 bg-[#07111f] p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div>
            <Link
              href="/"
              aria-label="Voltar para a página inicial"
              className="inline-flex items-center gap-3"
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
                <span className="block text-xl font-semibold">
                  Padrões B3
                </span>

                <span className="block text-sm text-slate-400">
                  Cadastro gratuito
                </span>
              </span>
            </Link>

            <div className="mt-24 max-w-xl xl:mt-28">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
                Comece gratuitamente
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight xl:text-5xl">
                Crie sua conta e acompanhe oportunidades
                estatísticas.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                Conheça uma plataforma que monitora ações
                brasileiras e organiza informações históricas
                para apoiar suas decisões.
              </p>

              <div className="mt-10 space-y-4">
                <BeneficioCadastro
                  texto="Cadastro gratuito e sem cartão"
                />

                <BeneficioCadastro
                  texto="Acesso à área do cliente"
                />

                <BeneficioCadastro
                  texto="Visualização de oportunidade disponível"
                />

                <BeneficioCadastro
                  texto="Possibilidade de evoluir para o Premium"
                />
              </div>
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
                    Cadastro gratuito
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
                Nova conta
              </p>

              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Criar conta gratuita
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Cadastre-se rapidamente com o Google ou
                preencha seus dados.
              </p>

              <div className="mt-7 sm:mt-8">
                <GoogleLoginButton
                  texto="signup_with"
                  onErro={(mensagemErro) => {
                    setErro(mensagemErro);
                    setMensagem("");
                  }}
                />
              </div>

              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/10" />

                <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-slate-600">
                  ou
                </span>

                <span className="h-px flex-1 bg-white/10" />
              </div>

              {erro && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
                >
                  {erro}
                </div>
              )}

              {mensagem && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300"
                >
                  {mensagem}
                </div>
              )}

              <form
                className="mt-7 space-y-5"
                onSubmit={cadastrar}
              >
                <Campo
                  id="nome"
                  label="Nome"
                  value={nome}
                  onChange={(valor) => {
                    setNome(valor);
                    limparAvisos();
                  }}
                  placeholder="Seu nome completo"
                  disabled={carregando}
                  autoComplete="name"
                />

                <Campo
                  id="email"
                  label="E-mail"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(valor) => {
                    setEmail(valor);
                    limparAvisos();
                  }}
                  placeholder="seuemail@exemplo.com"
                  disabled={carregando}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />

                <Campo
                  id="senha"
                  label="Senha"
                  type="password"
                  value={senha}
                  onChange={(valor) => {
                    setSenha(valor);
                    limparAvisos();
                  }}
                  placeholder="Mínimo de 8 caracteres"
                  disabled={carregando}
                  autoComplete="new-password"
                />

                <Campo
                  id="confirmar-senha"
                  label="Confirmar senha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(valor) => {
                    setConfirmarSenha(valor);
                    limparAvisos();
                  }}
                  placeholder="Repita sua senha"
                  disabled={carregando}
                  autoComplete="new-password"
                />

                <p className="text-xs leading-5 text-slate-600">
                  Ao criar sua conta, você confirma que
                  utilizará as informações da plataforma
                  apenas como apoio à sua própria análise.
                </p>

                <button
                  type="submit"
                  disabled={carregando}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-center font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                      Criando conta...
                    </span>
                  ) : (
                    "Criar conta com e-mail"
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Já possui uma conta?
                </p>

                <Link
                  href="/cliente"
                  className="mt-2 inline-flex min-h-11 items-center justify-center text-sm font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Voltar para o login
                </Link>
              </div>
            </div>

            <p className="mt-6 px-2 text-center text-xs leading-5 text-slate-600">
              Investimentos em ações envolvem riscos.
              Resultados históricos não garantem resultados
              futuros.
            </p>
          </div>
        </section>
      </div>
    </main>
  );

  function limparAvisos() {
    if (erro) {
      setErro("");
    }

    if (mensagem) {
      setMensagem("");
    }
  }
}

function Campo({
  id,
  label,
  type = "text",
  inputMode,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  autoCapitalize,
  spellCheck,
}: {
  id: string;
  label: string;
  type?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  disabled: boolean;
  autoComplete?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm text-slate-300"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        placeholder={placeholder}
        required
        disabled={disabled}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function BeneficioCadastro({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-xs text-blue-300">
        ✓
      </span>

      <span className="leading-6 text-slate-300">
        {texto}
      </span>
    </div>
  );
}
