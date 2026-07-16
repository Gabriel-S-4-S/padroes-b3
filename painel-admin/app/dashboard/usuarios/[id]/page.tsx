"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/app/services/api";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  plano: string;
  status: string;
  expira_em: string | null;
  data_criacao: string;
  ultimo_login: string | null;
  role: "usuario" | "admin";
  email_verificado: boolean;
};

type RespostaUsuario = {
  usuario: Usuario;
};

type RespostaAtualizacao = {
  sucesso: boolean;
  mensagem: string;
  usuario: Usuario;
};

type RespostaRedefinirSenha = {
  sucesso: boolean;
  mensagem: string;
};

export default function EditarUsuarioPage() {
  const router = useRouter();
  const parametros = useParams<{ id: string }>();

  const usuarioId = Number(parametros.id);

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"usuario" | "admin">(
    "usuario"
  );
  const [emailVerificado, setEmailVerificado] =
    useState(false);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [redefinindoSenha, setRedefinindoSenha] =
    useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregarUsuario = useCallback(async () => {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      setErro("Identificador de usuário inválido.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch<RespostaUsuario>(
        `/admin/usuarios/${usuarioId}`
      );

      const dados = resposta.usuario;

      setUsuario(dados);
      setNome(dados.nome);
      setEmail(dados.email);
      setRole(dados.role);
      setEmailVerificado(dados.email_verificado);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar o usuário."
      );
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    carregarUsuario();
  }, [carregarUsuario]);

  async function salvarUsuario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (salvando || !usuario) {
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      const resposta =
        await apiFetch<RespostaAtualizacao>(
          `/admin/usuarios/${usuarioId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              nome: nome.trim(),
              email: email.trim().toLowerCase(),
              role,
              email_verificado: emailVerificado,
            }),
          }
        );

      setUsuario(resposta.usuario);
      setNome(resposta.usuario.nome);
      setEmail(resposta.usuario.email);
      setRole(resposta.usuario.role);
      setEmailVerificado(
        resposta.usuario.email_verificado
      );

      setMensagem(resposta.mensagem);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível atualizar o usuário."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function redefinirSenha(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (redefinindoSenha || !usuario) {
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
      setErro("As senhas informadas não são iguais.");
      return;
    }

    const confirmou = window.confirm(
      `Deseja redefinir a senha de ${usuario.email}?`
    );

    if (!confirmou) {
      return;
    }

    setRedefinindoSenha(true);

    try {
      const resposta =
        await apiFetch<RespostaRedefinirSenha>(
          `/admin/usuarios/${usuarioId}/redefinir-senha`,
          {
            method: "POST",
            body: JSON.stringify({
              nova_senha: novaSenha,
            }),
          }
        );

      setNovaSenha("");
      setConfirmarSenha("");
      setMensagem(resposta.mensagem);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível redefinir a senha."
      );
    } finally {
      setRedefinindoSenha(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="mt-4 text-sm text-slate-500">
            Carregando usuário...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-6 lg:p-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-lg font-semibold text-red-200">
            Usuário não disponível
          </h1>

          <p className="mt-2 text-sm text-red-300">
            {erro || "Não foi possível encontrar este usuário."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/usuarios")
            }
            className="mt-5 rounded-xl border border-red-400/20 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
          >
            Voltar para usuários
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Administração
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Editar usuário
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Atualize os dados e as permissões da conta.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/usuarios")
          }
          className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Voltar para usuários
        </button>
      </div>

      {erro && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {mensagem}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-semibold text-white">
            {obterInicial(usuario.nome)}
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            {usuario.nome}
          </h2>

          <p className="mt-1 break-all text-sm text-slate-500">
            {usuario.email}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <BadgePlano plano={usuario.plano} />

            <BadgeStatus status={usuario.status} />

            <BadgeRole role={usuario.role} />
          </div>

          <div className="mt-7 space-y-5 border-t border-white/10 pt-6">
            <Informacao
              titulo="Identificador"
              valor={`#${usuario.id}`}
            />

            <Informacao
              titulo="Data de criação"
              valor={formatarData(usuario.data_criacao)}
            />

            <Informacao
              titulo="Último login"
              valor={formatarData(usuario.ultimo_login)}
            />

            <Informacao
              titulo="Expiração"
              valor={formatarData(usuario.expira_em)}
            />

            <Informacao
              titulo="E-mail verificado"
              valor={
                usuario.email_verificado ? "Sim" : "Não"
              }
            />
          </div>
        </aside>

        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-8">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Dados da conta
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Altere nome, e-mail e permissão.
              </p>
            </div>

            <form
              onSubmit={salvarUsuario}
              className="mt-7 space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <CampoTexto
                  id="nome"
                  label="Nome"
                  value={nome}
                  onChange={setNome}
                  placeholder="Nome do usuário"
                  disabled={salvando}
                />

                <CampoTexto
                  id="email"
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="usuario@exemplo.com"
                  disabled={salvando}
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Permissão
                </label>

                <select
                  id="role"
                  value={role}
                  onChange={(evento) =>
                    setRole(
                      evento.target.value as
                        | "usuario"
                        | "admin"
                    )
                  }
                  disabled={salvando}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0e15] px-4 text-sm text-white outline-none transition focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="usuario">Usuário</option>
                  <option value="admin">
                    Administrador
                  </option>
                </select>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <input
                  type="checkbox"
                  checked={emailVerificado}
                  onChange={(evento) =>
                    setEmailVerificado(
                      evento.target.checked
                    )
                  }
                  disabled={salvando}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-200">
                    E-mail verificado
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Marque quando a propriedade do endereço de
                    e-mail estiver confirmada.
                  </span>
                </span>
              </label>

              <div className="flex justify-end border-t border-white/10 pt-6">
                <button
                  type="submit"
                  disabled={salvando}
                  className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-8">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Redefinir senha
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Defina uma senha temporária para esta conta.
              </p>
            </div>

            <form
              onSubmit={redefinirSenha}
              className="mt-7 space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <CampoTexto
                  id="nova-senha"
                  label="Nova senha"
                  type="password"
                  value={novaSenha}
                  onChange={setNovaSenha}
                  placeholder="Mínimo de 8 caracteres"
                  disabled={redefinindoSenha}
                />

                <CampoTexto
                  id="confirmar-senha"
                  label="Confirmar nova senha"
                  type="password"
                  value={confirmarSenha}
                  onChange={setConfirmarSenha}
                  placeholder="Repita a nova senha"
                  disabled={redefinindoSenha}
                />
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm leading-6 text-amber-200">
                  A senha atual será substituída imediatamente.
                  Informe a nova senha ao usuário por um canal
                  seguro e oriente-o a alterá-la após o acesso.
                </p>
              </div>

              <div className="flex justify-end border-t border-white/10 pt-6">
                <button
                  type="submit"
                  disabled={
                    redefinindoSenha ||
                    novaSenha.length < 8 ||
                    confirmarSenha.length < 8
                  }
                  className="h-11 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {redefinindoSenha
                    ? "Redefinindo..."
                    : "Redefinir senha"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

type CampoTextoProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  disabled?: boolean;
};

function CampoTexto({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
}: CampoTextoProps) {
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
        autoComplete={
          type === "password" ? "new-password" : undefined
        }
        className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-60"
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
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-1 break-words text-sm text-slate-300">
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
  const estilos: Record<string, string> = {
    gratis:
      "border-slate-500/20 bg-slate-500/10 text-slate-300",
    mensal:
      "border-blue-500/20 bg-blue-500/10 text-blue-300",
    anual:
      "border-violet-500/20 bg-violet-500/10 text-violet-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        estilos[plano] ?? estilos.gratis
      }`}
    >
      {plano}
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
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        ativo
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
      }`}
    >
      {status}
    </span>
  );
}

function BadgeRole({
  role,
}: {
  role: string;
}) {
  const admin = role === "admin";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        admin
          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
          : "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {role}
    </span>
  );
}

function obterInicial(nome: string) {
  const nomeLimpo = nome.trim();

  if (!nomeLimpo) {
    return "?";
  }

  return nomeLimpo.charAt(0).toUpperCase();
}

function formatarData(dataTexto: string | null) {
  if (!dataTexto) {
    return "Não informado";
  }

  const data = new Date(dataTexto.replace(" ", "T"));

  if (Number.isNaN(data.getTime())) {
    return dataTexto;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}