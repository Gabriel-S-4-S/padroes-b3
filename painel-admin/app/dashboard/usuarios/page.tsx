"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

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
  role: string;
  email_verificado: boolean;
};

type RespostaUsuarios = {
  quantidade: number;
  usuarios: Usuario[];
};

type TipoFiltro =
  | "todos"
  | "gratis"
  | "mensal"
  | "anual"
  | "cancelado";

export default function UsuariosPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");

  const [carregando, setCarregando] = useState(true);
  const [processandoEmail, setProcessandoEmail] = useState<
    string | null
  >(null);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregarUsuarios = useCallback(async () => {
    setErro("");
    setCarregando(true);

    try {
      const resposta = await apiFetch<RespostaUsuarios>(
        "/admin/usuarios"
      );

      setUsuarios(resposta.usuarios);
    } catch (erroDesconhecido) {
      const texto =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar os usuários.";

      setErro(texto);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const correspondePesquisa =
        !termo ||
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo);

      const correspondeFiltro =
        filtro === "todos" ||
        (filtro === "cancelado"
          ? usuario.status === "cancelado"
          : usuario.plano === filtro);

      return correspondePesquisa && correspondeFiltro;
    });
  }, [usuarios, pesquisa, filtro]);

  const totais = useMemo(() => {
    return {
      todos: usuarios.length,

      gratis: usuarios.filter(
        (usuario) => usuario.plano === "gratis"
      ).length,

      mensal: usuarios.filter(
        (usuario) =>
          usuario.plano === "mensal" &&
          usuario.status === "ativo"
      ).length,

      anual: usuarios.filter(
        (usuario) =>
          usuario.plano === "anual" &&
          usuario.status === "ativo"
      ).length,

      cancelado: usuarios.filter(
        (usuario) => usuario.status === "cancelado"
      ).length,
    };
  }, [usuarios]);

  async function ativarAssinatura(
    email: string,
    plano: "mensal" | "anual"
  ) {
    const confirmou = window.confirm(
      `Deseja ativar o plano ${plano} para ${email}?`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoEmail(email);
    setMensagem("");
    setErro("");

    try {
      await apiFetch("/assinaturas/ativar", {
        method: "POST",
        body: JSON.stringify({
          email,
          plano,
        }),
      });

      setMensagem(`Plano ${plano} ativado com sucesso.`);
      await carregarUsuarios();
    } catch (erroDesconhecido) {
      const texto =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível ativar a assinatura.";

      setErro(texto);
    } finally {
      setProcessandoEmail(null);
    }
  }

  async function cancelarAssinatura(email: string) {
    const confirmou = window.confirm(
      `Deseja cancelar a assinatura de ${email}?`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoEmail(email);
    setMensagem("");
    setErro("");

    try {
      await apiFetch("/assinaturas/cancelar", {
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      });

      setMensagem("Assinatura cancelada com sucesso.");
      await carregarUsuarios();
    } catch (erroDesconhecido) {
      const texto =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível cancelar a assinatura.";

      setErro(texto);
    } finally {
      setProcessandoEmail(null);
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Administração
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Usuários
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Consulte contas e gerencie assinaturas da plataforma.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/usuarios/novo")
            }
            className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Novo usuário
          </button>

          <button
            type="button"
            onClick={carregarUsuarios}
            disabled={carregando}
            className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando
              ? "Atualizando..."
              : "Atualizar lista"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CardResumo
          titulo="Todos"
          valor={totais.todos}
          ativo={filtro === "todos"}
          onClick={() => setFiltro("todos")}
        />

        <CardResumo
          titulo="Gratuitos"
          valor={totais.gratis}
          ativo={filtro === "gratis"}
          onClick={() => setFiltro("gratis")}
        />

        <CardResumo
          titulo="Mensais"
          valor={totais.mensal}
          ativo={filtro === "mensal"}
          onClick={() => setFiltro("mensal")}
        />

        <CardResumo
          titulo="Anuais"
          valor={totais.anual}
          ativo={filtro === "anual"}
          onClick={() => setFiltro("anual")}
        />

        <CardResumo
          titulo="Cancelados"
          valor={totais.cancelado}
          ativo={filtro === "cancelado"}
          onClick={() => setFiltro("cancelado")}
        />
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

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Contas cadastradas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {usuariosFiltrados.length} usuário(s) encontrado(s)
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <input
              type="search"
              value={pesquisa}
              onChange={(evento) =>
                setPesquisa(evento.target.value)
              }
              placeholder="Pesquisar nome ou e-mail"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-sm text-slate-500">
                Carregando usuários...
              </p>
            </div>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center p-8 text-center">
            <div>
              <p className="font-medium text-slate-300">
                Nenhum usuário encontrado
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Altere a pesquisa ou selecione outro filtro.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>Usuário</Th>
                  <Th>Plano</Th>
                  <Th>Status</Th>
                  <Th>Permissão</Th>
                  <Th>Expiração</Th>
                  <Th>Último login</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const processando =
                    processandoEmail === usuario.email;

                  return (
                    <tr
                      key={usuario.id}
                      className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.02]"
                    >
                      <Td>
                        <div>
                          <p className="font-medium text-slate-200">
                            {usuario.nome}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {usuario.email}
                          </p>
                        </div>
                      </Td>

                      <Td>
                        <BadgePlano plano={usuario.plano} />
                      </Td>

                      <Td>
                        <BadgeStatus status={usuario.status} />
                      </Td>

                      <Td>
                        <span className="text-sm capitalize text-slate-300">
                          {usuario.role}
                        </span>
                      </Td>

                      <Td>
                        <span className="text-sm text-slate-400">
                          {formatarData(usuario.expira_em)}
                        </span>
                      </Td>

                      <Td>
                        <span className="text-sm text-slate-400">
                          {formatarData(usuario.ultimo_login)}
                        </span>
                      </Td>

                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={processando}
                            onClick={() =>
                              router.push(
                                `/dashboard/usuarios/${usuario.id}`
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={processando}
                            onClick={() =>
                              ativarAssinatura(
                                usuario.email,
                                "mensal"
                              )
                            }
                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Mensal
                          </button>

                          <button
                            type="button"
                            disabled={processando}
                            onClick={() =>
                              ativarAssinatura(
                                usuario.email,
                                "anual"
                              )
                            }
                            className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Anual
                          </button>

                          <button
                            type="button"
                            disabled={
                              processando ||
                              usuario.status === "cancelado"
                            }
                            onClick={() =>
                              cancelarAssinatura(usuario.email)
                            }
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {processando
                              ? "Aguarde..."
                              : "Cancelar"}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

type CardResumoProps = {
  titulo: string;
  valor: number;
  ativo: boolean;
  onClick: () => void;
};

function CardResumo({
  titulo,
  valor,
  ativo,
  onClick,
}: CardResumoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        ativo
          ? "border-blue-500/40 bg-blue-500/10"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <p className="text-sm text-slate-400">{titulo}</p>

      <p className="mt-3 text-3xl font-semibold text-white">
        {valor}
      </p>
    </button>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-5 py-5 align-middle">
      {children}
    </td>
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
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${
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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        ativo
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ativo ? "bg-emerald-400" : "bg-red-400"
        }`}
      />

      {status}
    </span>
  );
}

function formatarData(dataTexto: string | null) {
  if (!dataTexto) {
    return "Não informado";
  }

  const data = new Date(
    dataTexto.replace(" ", "T")
  );

  if (Number.isNaN(data.getTime())) {
    return dataTexto;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}