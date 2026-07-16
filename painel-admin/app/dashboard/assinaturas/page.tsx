"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch } from "@/app/services/api";

type ClassificacaoAssinatura =
  | "ativa"
  | "proxima_vencimento"
  | "vencida"
  | "cancelada"
  | "gratuita"
  | "sem_expiracao";

type Assinatura = {
  id: number;
  nome: string;
  email: string;
  plano: string;
  status: string;
  expira_em: string | null;
  data_criacao: string;
  ultimo_login: string | null;
  role: string;
  classificacao: ClassificacaoAssinatura;
};

type TotaisAssinaturas = {
  todas: number;
  mensais: number;
  anuais: number;
  ativas: number;
  proximas_vencimento: number;
  vencidas?: number;
  canceladas?: number;
  gratuitas?: number;
};

type RespostaAssinaturas = {
  quantidade: number;
  totais: TotaisAssinaturas;
  assinaturas: Assinatura[];
};

type Filtro =
  | "todas"
  | "mensais"
  | "anuais"
  | "ativas"
  | "proximas_vencimento"
  | "gratuitas";

export default function AssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<
    Assinatura[]
  >([]);

  const [totaisApi, setTotaisApi] =
    useState<TotaisAssinaturas>({
      todas: 0,
      mensais: 0,
      anuais: 0,
      ativas: 0,
      proximas_vencimento: 0,
      gratuitas: 0,
    });

  const [filtro, setFiltro] =
    useState<Filtro>("todas");

  const [pesquisa, setPesquisa] = useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [processandoEmail, setProcessandoEmail] =
    useState<string | null>(null);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregarAssinaturas = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta =
        await apiFetch<RespostaAssinaturas>(
          "/admin/assinaturas"
        );

      setAssinaturas(resposta.assinaturas ?? []);
      setTotaisApi(resposta.totais);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar as assinaturas."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAssinaturas();
  }, [carregarAssinaturas]);

  const totais = useMemo(() => {
    const gratuitasCalculadas =
      assinaturas.filter(
        (assinatura) =>
          assinatura.plano === "gratis" ||
          assinatura.classificacao === "gratuita"
      ).length;

    return {
      todas:
        totaisApi.todas ?? assinaturas.length,

      mensais:
        totaisApi.mensais ??
        assinaturas.filter(
          (assinatura) =>
            assinatura.plano === "mensal"
        ).length,

      anuais:
        totaisApi.anuais ??
        assinaturas.filter(
          (assinatura) =>
            assinatura.plano === "anual"
        ).length,

      ativas:
        totaisApi.ativas ??
        assinaturas.filter(
          (assinatura) =>
            assinatura.classificacao === "ativa"
        ).length,

      proximas_vencimento:
        totaisApi.proximas_vencimento ??
        assinaturas.filter(
          (assinatura) =>
            assinatura.classificacao ===
            "proxima_vencimento"
        ).length,

      gratuitas:
        totaisApi.gratuitas ??
        gratuitasCalculadas,
    };
  }, [assinaturas, totaisApi]);

  const assinaturasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return assinaturas.filter((assinatura) => {
      const correspondePesquisa =
        !termo ||
        assinatura.nome
          .toLowerCase()
          .includes(termo) ||
        assinatura.email
          .toLowerCase()
          .includes(termo);

      let correspondeFiltro = true;

      if (filtro === "mensais") {
        correspondeFiltro =
          assinatura.plano === "mensal";
      } else if (filtro === "anuais") {
        correspondeFiltro =
          assinatura.plano === "anual";
      } else if (filtro === "ativas") {
        correspondeFiltro =
          assinatura.plano !== "gratis" &&
          assinatura.classificacao === "ativa";
      } else if (
        filtro === "proximas_vencimento"
      ) {
        correspondeFiltro =
          assinatura.classificacao ===
          "proxima_vencimento";
      } else if (filtro === "gratuitas") {
        correspondeFiltro =
          assinatura.plano === "gratis" ||
          assinatura.classificacao === "gratuita";
      }

      return (
        correspondePesquisa &&
        correspondeFiltro
      );
    });
  }, [assinaturas, pesquisa, filtro]);

  async function alterarPlano(
    email: string,
    plano: "mensal" | "anual"
  ) {
    const confirmou = window.confirm(
      `Deseja ativar ou renovar o plano ${formatarPlano(
        plano
      )} para ${email}?`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoEmail(email);
    setErro("");
    setMensagem("");

    try {
      const resposta = await apiFetch<{
        sucesso?: boolean;
        mensagem?: string;
      }>("/assinaturas/ativar", {
        method: "POST",
        body: JSON.stringify({
          email,
          plano,
        }),
      });

      setMensagem(
        resposta.mensagem ??
          `Plano ${formatarPlano(
            plano
          )} atualizado com sucesso.`
      );

      await carregarAssinaturas();
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível atualizar o plano."
      );
    } finally {
      setProcessandoEmail(null);
    }
  }

  async function transferirParaGratis(
    email: string
  ) {
    const confirmou = window.confirm(
      `Deseja cancelar a assinatura Premium de ${email} e transferir a conta para o plano gratuito?`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoEmail(email);
    setErro("");
    setMensagem("");

    try {
      const resposta = await apiFetch<{
        sucesso?: boolean;
        mensagem?: string;
      }>("/assinaturas/cancelar", {
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      });

      setMensagem(
        resposta.mensagem ??
          "Assinatura cancelada. A conta foi transferida para o plano gratuito."
      );

      await carregarAssinaturas();
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível cancelar a assinatura."
      );
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
            Assinaturas
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Gerencie planos, vencimentos e
            transferências para o plano gratuito.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarAssinaturas}
          disabled={carregando}
          className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando
            ? "Atualizando..."
            : "Atualizar lista"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <CardFiltro
          titulo="Todas"
          valor={totais.todas}
          ativo={filtro === "todas"}
          onClick={() => setFiltro("todas")}
        />

        <CardFiltro
          titulo="Premium ativas"
          valor={totais.ativas}
          ativo={filtro === "ativas"}
          onClick={() => setFiltro("ativas")}
        />

        <CardFiltro
          titulo="Próximas do vencimento"
          valor={totais.proximas_vencimento}
          ativo={
            filtro === "proximas_vencimento"
          }
          onClick={() =>
            setFiltro("proximas_vencimento")
          }
        />

        <CardFiltro
          titulo="Mensais"
          valor={totais.mensais}
          ativo={filtro === "mensais"}
          onClick={() => setFiltro("mensais")}
        />

        <CardFiltro
          titulo="Anuais"
          valor={totais.anuais}
          ativo={filtro === "anuais"}
          onClick={() => setFiltro("anuais")}
        />

        <CardFiltro
          titulo="Gratuitas"
          valor={totais.gratuitas}
          ativo={filtro === "gratuitas"}
          onClick={() => setFiltro("gratuitas")}
        />
      </div>

      {erro && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {erro}
        </div>
      )}

      {mensagem && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {mensagem}
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Contas e assinaturas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {assinaturasFiltradas.length} resultado(s)
            </p>
          </div>

          <input
            type="search"
            value={pesquisa}
            onChange={(evento) =>
              setPesquisa(evento.target.value)
            }
            placeholder="Pesquisar nome ou e-mail"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 lg:max-w-sm"
          />
        </div>

        {carregando ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-sm text-slate-500">
                Carregando assinaturas...
              </p>
            </div>
          </div>
        ) : assinaturasFiltradas.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center p-8 text-center">
            <div>
              <p className="font-medium text-slate-300">
                Nenhuma assinatura encontrada
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Altere a pesquisa ou selecione outro
                filtro.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>Cliente</Th>
                  <Th>Plano</Th>
                  <Th>Situação</Th>
                  <Th>Expiração</Th>
                  <Th>Último login</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {assinaturasFiltradas.map(
                  (assinatura) => {
                    const processando =
                      processandoEmail ===
                      assinatura.email;

                    const planoGratuito =
                      assinatura.plano === "gratis";

                    return (
                      <tr
                        key={assinatura.id}
                        className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.02]"
                      >
                        <Td>
                          <div>
                            <p className="font-medium text-slate-200">
                              {assinatura.nome}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {assinatura.email}
                            </p>
                          </div>
                        </Td>

                        <Td>
                          <BadgePlano
                            plano={assinatura.plano}
                          />
                        </Td>

                        <Td>
                          <BadgeClassificacao
                            classificacao={
                              planoGratuito
                                ? "gratuita"
                                : assinatura.classificacao
                            }
                          />
                        </Td>

                        <Td>
                          <span className="text-sm text-slate-400">
                            {planoGratuito
                              ? "Sem vencimento"
                              : formatarData(
                                  assinatura.expira_em
                                )}
                          </span>
                        </Td>

                        <Td>
                          <span className="text-sm text-slate-400">
                            {formatarData(
                              assinatura.ultimo_login
                            )}
                          </span>
                        </Td>

                        <Td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={processando}
                              onClick={() =>
                                alterarPlano(
                                  assinatura.email,
                                  "mensal"
                                )
                              }
                              className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processando
                                ? "Aguarde..."
                                : assinatura.plano ===
                                    "mensal"
                                  ? "Renovar mensal"
                                  : "Ativar mensal"}
                            </button>

                            <button
                              type="button"
                              disabled={processando}
                              onClick={() =>
                                alterarPlano(
                                  assinatura.email,
                                  "anual"
                                )
                              }
                              className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processando
                                ? "Aguarde..."
                                : assinatura.plano ===
                                    "anual"
                                  ? "Renovar anual"
                                  : "Ativar anual"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                processando ||
                                planoGratuito
                              }
                              onClick={() =>
                                transferirParaGratis(
                                  assinatura.email
                                )
                              }
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {processando
                                ? "Aguarde..."
                                : planoGratuito
                                  ? "Plano gratuito"
                                  : "Transferir para grátis"}
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm leading-6 text-slate-500">
          Ao cancelar uma assinatura Premium, a conta
          permanece ativa e é transferida para o plano
          gratuito. Assinaturas vencidas seguem a mesma
          regra automaticamente.
        </p>
      </div>
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
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

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
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        estilos[plano] ?? estilos.gratis
      }`}
    >
      {formatarPlano(plano)}
    </span>
  );
}

function BadgeClassificacao({
  classificacao,
}: {
  classificacao: ClassificacaoAssinatura;
}) {
  const configuracoes: Record<
    ClassificacaoAssinatura,
    {
      texto: string;
      classe: string;
    }
  > = {
    ativa: {
      texto: "Premium ativa",
      classe:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    },

    proxima_vencimento: {
      texto: "Próxima do vencimento",
      classe:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },

    vencida: {
      texto: "Vencida",
      classe:
        "border-red-500/20 bg-red-500/10 text-red-300",
    },

    cancelada: {
      texto: "Cancelada",
      classe:
        "border-slate-500/20 bg-slate-500/10 text-slate-300",
    },

    gratuita: {
      texto: "Plano gratuito",
      classe:
        "border-slate-500/20 bg-slate-500/10 text-slate-300",
    },

    sem_expiracao: {
      texto: "Sem expiração",
      classe:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },
  };

  const configuracao =
    configuracoes[classificacao];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${configuracao.classe}`}
    >
      {configuracao.texto}
    </span>
  );
}

function formatarPlano(plano: string) {
  const nomes: Record<string, string> = {
    gratis: "Grátis",
    mensal: "Mensal",
    anual: "Anual",
  };

  return nomes[plano] ?? plano;
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

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}