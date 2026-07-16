"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/app/services/api";

type RegistroAuditoria = {
  id: number;
  tipo: string;
  acao: string;
  usuario_email: string | null;
  responsavel: string | null;
  detalhes: string | null;
  data_criacao: string;
};

type RespostaAuditoria = {
  quantidade: number;
  registros: RegistroAuditoria[];
};

type FiltroTipo = "todos" | "assinatura" | "usuario" | "autenticacao";

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [limite, setLimite] = useState(100);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarAuditoria = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch<RespostaAuditoria>(
        `/admin/auditoria?limite=${limite}`
      );

      setRegistros(resposta.registros);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar a auditoria."
      );
    } finally {
      setCarregando(false);
    }
  }, [limite]);

  useEffect(() => {
    carregarAuditoria();
  }, [carregarAuditoria]);

  const registrosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return registros.filter((registro) => {
      const correspondePesquisa =
        !termo ||
        registro.acao.toLowerCase().includes(termo) ||
        registro.tipo.toLowerCase().includes(termo) ||
        registro.usuario_email?.toLowerCase().includes(termo) ||
        registro.responsavel?.toLowerCase().includes(termo) ||
        registro.detalhes?.toLowerCase().includes(termo);

      const correspondeTipo =
        filtroTipo === "todos" || registro.tipo === filtroTipo;

      return correspondePesquisa && correspondeTipo;
    });
  }, [registros, pesquisa, filtroTipo]);

  const totais = useMemo(() => {
    return {
      todos: registros.length,
      assinatura: registros.filter(
        (registro) => registro.tipo === "assinatura"
      ).length,
      usuario: registros.filter(
        (registro) => registro.tipo === "usuario"
      ).length,
      autenticacao: registros.filter(
        (registro) => registro.tipo === "autenticacao"
      ).length,
    };
  }, [registros]);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Segurança e controle
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Auditoria
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Consulte o histórico de ações realizadas na plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarAuditoria}
          disabled={carregando}
          className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? "Atualizando..." : "Atualizar registros"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardFiltro
          titulo="Todos"
          valor={totais.todos}
          ativo={filtroTipo === "todos"}
          onClick={() => setFiltroTipo("todos")}
        />

        <CardFiltro
          titulo="Assinaturas"
          valor={totais.assinatura}
          ativo={filtroTipo === "assinatura"}
          onClick={() => setFiltroTipo("assinatura")}
        />

        <CardFiltro
          titulo="Usuários"
          valor={totais.usuario}
          ativo={filtroTipo === "usuario"}
          onClick={() => setFiltroTipo("usuario")}
        />

        <CardFiltro
          titulo="Autenticação"
          valor={totais.autenticacao}
          ativo={filtroTipo === "autenticacao"}
          onClick={() => setFiltroTipo("autenticacao")}
        />
      </div>

      {erro && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {erro}
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 xl:flex-row xl:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Histórico de atividades
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {registrosFiltrados.length} registro(s) encontrado(s)
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <input
              type="search"
              value={pesquisa}
              onChange={(evento) => setPesquisa(evento.target.value)}
              placeholder="Pesquisar atividade"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 sm:min-w-80"
            />

            <select
              value={limite}
              onChange={(evento) => setLimite(Number(evento.target.value))}
              className="h-11 rounded-xl border border-white/10 bg-[#0a0e15] px-4 text-sm text-slate-300 outline-none focus:border-blue-500"
            >
              <option value={20}>20 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={250}>250 registros</option>
              <option value={500}>500 registros</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-sm text-slate-500">
                Carregando auditoria...
              </p>
            </div>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center p-8 text-center">
            <div>
              <p className="font-medium text-slate-300">
                Nenhum registro encontrado
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Altere a pesquisa ou selecione outro filtro.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {registrosFiltrados.map((registro) => (
              <article
                key={registro.id}
                className="p-5 transition hover:bg-white/[0.02]"
              >
                <div className="flex flex-col justify-between gap-5 xl:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <BadgeTipo tipo={registro.tipo} />

                      <h3 className="font-medium text-slate-200">
                        {formatarAcao(registro.acao)}
                      </h3>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {registro.detalhes ?? "Nenhum detalhe informado."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                      <span>
                        Usuário:{" "}
                        <strong className="font-medium text-slate-300">
                          {registro.usuario_email ?? "Não informado"}
                        </strong>
                      </span>

                      <span>
                        Responsável:{" "}
                        <strong className="font-medium text-slate-300">
                          {registro.responsavel ?? "sistema"}
                        </strong>
                      </span>

                      <span>
                        Registro #{registro.id}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 xl:text-right">
                    <p className="text-sm text-slate-300">
                      {formatarData(registro.data_criacao)}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {formatarTempoRelativo(registro.data_criacao)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type CardFiltroProps = {
  titulo: string;
  valor: number;
  ativo: boolean;
  onClick: () => void;
};

function CardFiltro({
  titulo,
  valor,
  ativo,
  onClick,
}: CardFiltroProps) {
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

function BadgeTipo({ tipo }: { tipo: string }) {
  const configuracoes: Record<
    string,
    {
      texto: string;
      classe: string;
    }
  > = {
    assinatura: {
      texto: "Assinatura",
      classe:
        "border-blue-500/20 bg-blue-500/10 text-blue-300",
    },
    usuario: {
      texto: "Usuário",
      classe:
        "border-violet-500/20 bg-violet-500/10 text-violet-300",
    },
    autenticacao: {
      texto: "Autenticação",
      classe:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },
  };

  const configuracao = configuracoes[tipo] ?? {
    texto: tipo,
    classe:
      "border-slate-500/20 bg-slate-500/10 text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${configuracao.classe}`}
    >
      {configuracao.texto}
    </span>
  );
}

function formatarAcao(acao: string) {
  const nomes: Record<string, string> = {
    ativar_assinatura: "Assinatura ativada",
    renovar_assinatura: "Assinatura renovada",
    cancelar_assinatura: "Assinatura cancelada",
    criar_usuario: "Usuário criado",
    promover_admin: "Usuário promovido a administrador",
    alterar_senha: "Senha alterada",
    redefinir_senha: "Senha redefinida",
    login: "Login realizado",
    login_falhou: "Tentativa de login recusada",
  };

  return (
    nomes[acao] ??
    acao
      .replaceAll("_", " ")
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}

function formatarData(dataTexto: string) {
  const data = converterData(dataTexto);

  if (!data) {
    return dataTexto;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(data);
}

function formatarTempoRelativo(dataTexto: string) {
  const data = converterData(dataTexto);

  if (!data) {
    return "";
  }

  const diferencaMilissegundos = Date.now() - data.getTime();
  const diferencaMinutos = Math.floor(
    diferencaMilissegundos / (1000 * 60)
  );

  if (diferencaMinutos < 1) {
    return "Agora";
  }

  if (diferencaMinutos < 60) {
    return `Há ${diferencaMinutos} minuto(s)`;
  }

  const diferencaHoras = Math.floor(diferencaMinutos / 60);

  if (diferencaHoras < 24) {
    return `Há ${diferencaHoras} hora(s)`;
  }

  const diferencaDias = Math.floor(diferencaHoras / 24);

  return `Há ${diferencaDias} dia(s)`;
}

function converterData(dataTexto: string) {
  const data = new Date(dataTexto.replace(" ", "T"));

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}