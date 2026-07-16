"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type RespostaRedefinicao = {
  sucesso: boolean;
  mensagem: string;
};

function RedefinirSenhaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const tokenUrl = searchParams.get("token");

    if (tokenUrl) {
      setToken(tokenUrl);
    }
  }, [searchParams]);

  async function redefinirSenha(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setMensagem("");

    if (!token.trim()) {
      setErro(
        "Informe o token de recuperação."
      );
      return;
    }

    if (novaSenha.length < 8) {
      setErro(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro(
        "As senhas informadas não são iguais."
      );
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(
        `${API_URL}/auth/redefinir-senha`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token: token.trim(),
            nova_senha: novaSenha,
          }),
        }
      );

      let dados: RespostaRedefinicao;

      try {
        dados =
          (await resposta.json()) as RespostaRedefinicao;
      } catch {
        throw new Error(
          "A API retornou uma resposta inválida."
        );
      }

      if (!resposta.ok || !dados.sucesso) {
        setErro(
          dados.mensagem ??
            "Não foi possível redefinir a senha."
        );
        return;
      }

      setNovaSenha("");
      setConfirmarSenha("");

      setMensagem(
        "Senha redefinida com sucesso. Redirecionando para o login..."
      );

      setTimeout(() => {
        router.replace("/cliente");
      }, 1500);
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
        <header className="flex items-center justify-between gap-4">
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
                Recuperação de acesso
              </span>
            </span>
          </Link>

          <Link
            href="/cliente"
            className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm"
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
                Redefinir senha
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Informe o token recebido e escolha
                uma nova senha segura.
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
                onSubmit={redefinirSenha}
                className="mt-7 space-y-5 sm:mt-8"
              >
                <Campo
                  id="token"
                  label="Token de recuperação"
                  value={token}
                  onChange={setToken}
                  placeholder="Cole o token recebido"
                  disabled={carregando}
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  spellCheck={false}
                />

                <Campo
                  id="nova-senha"
                  label="Nova senha"
                  type="password"
                  value={novaSenha}
                  onChange={setNovaSenha}
                  placeholder="Mínimo de 8 caracteres"
                  disabled={carregando}
                  autoComplete="new-password"
                />

                <Campo
                  id="confirmar-senha"
                  label="Confirmar nova senha"
                  type="password"
                  value={confirmarSenha}
                  onChange={setConfirmarSenha}
                  placeholder="Repita a nova senha"
                  disabled={carregando}
                  autoComplete="new-password"
                />

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm leading-6 text-amber-200">
                    Use uma senha diferente das anteriores e
                    não compartilhe seu token de recuperação.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    carregando ||
                    !token.trim() ||
                    novaSenha.length < 8 ||
                    confirmarSenha.length < 8
                  }
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-center font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                      Redefinindo...
                    </span>
                  ) : (
                    "Redefinir senha"
                  )}
                </button>
              </form>

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
              O token de recuperação é temporário e deve
              ser utilizado apenas por você.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={<CarregandoRedefinicao />}
    >
      <RedefinirSenhaConteudo />
    </Suspense>
  );
}

function CarregandoRedefinicao() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070b] px-4 text-white">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

        <p className="mt-4 text-sm text-slate-400">
          Carregando recuperação de senha...
        </p>
      </div>
    </main>
  );
}

function Campo({
  id,
  label,
  type = "text",
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