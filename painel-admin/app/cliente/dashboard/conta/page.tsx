"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { apiClienteFetch } from "@/app/services/api-cliente";

type UsuarioCliente = {
  id: number;
  nome: string;
  email: string;
  plano: string;
  status: string;
  expira_em: string | null;
  data_criacao: string;
  ultimo_login: string | null;
  role: string;
  email_verificado: boolean;
};

type RespostaMinhaConta = {
  sucesso: boolean;
  usuario: UsuarioCliente;
};

type RespostaAlterarSenha = {
  sucesso: boolean;
  mensagem: string;
};

export default function MinhaContaPage() {
  const [usuario, setUsuario] =
    useState<UsuarioCliente | null>(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [alterandoSenha, setAlterandoSenha] =
    useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const temporizadorMensagem = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const carregarConta = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta =
        await apiClienteFetch<RespostaMinhaConta>(
          "/auth/me"
        );

      setUsuario(resposta.usuario);

      localStorage.setItem(
        "usuario_cliente",
        JSON.stringify(resposta.usuario)
      );
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar sua conta."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarConta();

    return () => {
      if (temporizadorMensagem.current) {
        clearTimeout(
          temporizadorMensagem.current
        );
      }
    };
  }, [carregarConta]);

  function exibirMensagemSucesso(
    texto: string
  ) {
    setMensagem(texto);

    if (temporizadorMensagem.current) {
      clearTimeout(
        temporizadorMensagem.current
      );
    }

    temporizadorMensagem.current =
      setTimeout(() => {
        setMensagem("");
      }, 5000);
  }

  async function alterarSenha(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (alterandoSenha) {
      return;
    }

    setErro("");
    setMensagem("");

    if (novaSenha.length < 8) {
      setErro(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro(
        "As novas senhas não são iguais."
      );
      return;
    }

    if (senhaAtual === novaSenha) {
      setErro(
        "A nova senha deve ser diferente da senha atual."
      );
      return;
    }

    setAlterandoSenha(true);

    try {
      const resposta =
        await apiClienteFetch<RespostaAlterarSenha>(
          "/auth/alterar-senha",
          {
            method: "POST",
            body: JSON.stringify({
              senha_atual: senhaAtual,
              nova_senha: novaSenha,
            }),
          }
        );

      if (!resposta.sucesso) {
        setErro(
          resposta.mensagem ??
            "Não foi possível alterar a senha."
        );
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      exibirMensagemSucesso(
        "Senha trocada com sucesso."
      );
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível alterar a senha."
      );
    } finally {
      setAlterandoSenha(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10 sm:px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="mt-4 text-sm text-slate-500">
            Carregando sua conta...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:p-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:p-6">
          <h1 className="text-lg font-semibold text-red-200">
            Conta indisponível
          </h1>

          <p className="mt-2 text-sm leading-6 text-red-300">
            {erro ||
              "Não foi possível carregar sua conta."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:p-10">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Perfil
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Minha conta
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Consulte seus dados e altere sua senha.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarConta}
          disabled={carregando}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Atualizar dados
        </button>
      </header>

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
          className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium leading-6 text-emerald-300"
        >
          {mensagem}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:mt-8 xl:grid-cols-3">
        <aside className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-semibold text-white sm:h-20 sm:w-20 sm:text-3xl">
            {obterInicial(usuario.nome)}
          </div>

          <h2 className="mt-5 break-words text-xl font-semibold text-white">
            {usuario.nome}
          </h2>

          <p className="mt-1 break-all text-sm leading-6 text-slate-500">
            {usuario.email}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <BadgePlano
              plano={usuario.plano}
            />

            <BadgeStatus
              status={usuario.status}
            />

            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                usuario.email_verificado
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-300"
              }`}
            >
              {usuario.email_verificado
                ? "E-mail verificado"
                : "E-mail não verificado"}
            </span>
          </div>

          <div className="mt-7 space-y-5 border-t border-white/10 pt-6">
            <Informacao
              titulo="Plano"
              valor={formatarPlano(
                usuario.plano
              )}
            />

            <Informacao
              titulo="Vencimento"
              valor={formatarData(
                usuario.expira_em
              )}
            />

            <Informacao
              titulo="Conta criada em"
              valor={formatarData(
                usuario.data_criacao
              )}
            />

            <Informacao
              titulo="Último login"
              valor={formatarData(
                usuario.ultimo_login
              )}
            />

            <Informacao
              titulo="Status"
              valor={formatarTexto(
                usuario.status
              )}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-5 sm:space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-white">
              Dados pessoais
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Informações cadastradas na plataforma.
            </p>

            <div className="mt-6 grid gap-4 sm:mt-7 md:grid-cols-2">
              <CampoLeitura
                titulo="Nome"
                valor={usuario.nome}
              />

              <CampoLeitura
                titulo="E-mail"
                valor={usuario.email}
              />

              <CampoLeitura
                titulo="Plano atual"
                valor={formatarPlano(
                  usuario.plano
                )}
              />

              <CampoLeitura
                titulo="Validade"
                valor={
                  usuario.expira_em
                    ? formatarData(
                        usuario.expira_em
                      )
                    : "Conta gratuita sem vencimento"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-white">
              Alterar senha
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Para sua segurança, informe a senha atual.
            </p>

            <form
              onSubmit={alterarSenha}
              className="mt-6 space-y-5 sm:mt-7 sm:space-y-6"
            >
              <CampoSenha
                id="senha-atual"
                label="Senha atual"
                value={senhaAtual}
                onChange={setSenhaAtual}
                placeholder="Digite sua senha atual"
                disabled={alterandoSenha}
                autoComplete="current-password"
              />

              <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                <CampoSenha
                  id="nova-senha"
                  label="Nova senha"
                  value={novaSenha}
                  onChange={setNovaSenha}
                  placeholder="Mínimo de 8 caracteres"
                  disabled={alterandoSenha}
                  autoComplete="new-password"
                />

                <CampoSenha
                  id="confirmar-senha"
                  label="Confirmar nova senha"
                  value={confirmarSenha}
                  onChange={setConfirmarSenha}
                  placeholder="Repita a nova senha"
                  disabled={alterandoSenha}
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm leading-6 text-amber-200">
                  Use uma senha diferente das anteriores e evite compartilhar seus dados de acesso.
                </p>
              </div>

              <div className="flex border-t border-white/10 pt-5 sm:justify-end sm:pt-6">
                <button
                  type="submit"
                  disabled={
                    alterandoSenha ||
                    !senhaAtual ||
                    novaSenha.length < 8 ||
                    confirmarSenha.length < 8
                  }
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-center text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {alterandoSenha
                    ? "Alterando senha..."
                    : "Alterar senha"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function CampoLeitura({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-200">
        {valor}
      </p>
    </div>
  );
}

function CampoSenha({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  disabled: boolean;
  autoComplete: string;
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
        type="password"
        value={value}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        placeholder={placeholder}
        required
        disabled={disabled}
        autoComplete={autoComplete}
        className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function Informacao({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-1 break-words text-sm leading-6 text-slate-300">
        {valor}
      </p>
    </div>
  );
}

function BadgePlano({
  plano,
}: {
  plano: string;
}) {
  const estilos: Record<
    string,
    string
  > = {
    gratis:
      "border-slate-500/20 bg-slate-500/10 text-slate-300",

    mensal:
      "border-blue-500/20 bg-blue-500/10 text-blue-300",

    anual:
      "border-violet-500/20 bg-violet-500/10 text-violet-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        estilos[plano] ??
        estilos.gratis
      }`}
    >
      {formatarPlano(plano)}
    </span>
  );
}

function BadgeStatus({
  status,
}: {
  status: string;
}) {
  const ativo = status === "ativo";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        ativo
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
      }`}
    >
      {formatarTexto(status)}
    </span>
  );
}

function obterInicial(nome: string) {
  const nomeLimpo = nome.trim();

  if (!nomeLimpo) {
    return "?";
  }

  return nomeLimpo
    .charAt(0)
    .toUpperCase();
}

function formatarPlano(
  plano: string
) {
  const nomes: Record<
    string,
    string
  > = {
    gratis: "Grátis",
    mensal: "Mensal",
    anual: "Anual",
  };

  return (
    nomes[plano] ??
    formatarTexto(plano)
  );
}

function formatarTexto(
  texto: string
) {
  if (!texto) {
    return "Não informado";
  }

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1).toLowerCase()
  );
}

function formatarData(
  dataTexto: string | null
) {
  if (!dataTexto) {
    return "Não informado";
  }

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
      timeStyle: "short",
    }
  ).format(data);
}