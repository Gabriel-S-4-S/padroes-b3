"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch } from "@/app/services/api";

type StatusScheduler = {
  id: number;
  status: string;
  processo_iniciado_em: string | null;
  ultima_atividade_em: string | null;

  ultimo_scanner_programado: string | null;
  ultimo_scanner_inicio: string | null;
  ultimo_scanner_fim: string | null;
  ultimo_scanner_status: string | null;
  ultimo_scanner_erro: string | null;

  ultimo_scanner_candles_novos: number;
  ultimo_scanner_oportunidades: number;
  ultimo_scanner_emails_enviados: number;
  ultimo_scanner_emails_ignorados: number;
  ultimo_scanner_emails_falhas: number;

  ultimo_laboratorio_programado: string | null;
  ultimo_laboratorio_inicio: string | null;
  ultimo_laboratorio_fim: string | null;
  ultimo_laboratorio_status: string | null;
  ultimo_laboratorio_erro: string | null;

  proximo_scanner: string | null;
  proximo_laboratorio: string | null;

  atualizado_em: string;
};

type ExecucaoScheduler = {
  id: number;
  tipo: "scanner" | "laboratorio" | string;
  horario_programado: string | null;
  recuperacao: number;

  status: string;
  data_inicio: string;
  data_fim: string | null;
  duracao_segundos: number | null;

  candles_novos: number;
  oportunidades_encontradas: number;
  emails_enviados: number;
  emails_ignorados: number;
  emails_falhas: number;

  erro: string | null;
};

type RespostaScheduler = {
  sucesso: boolean;
  status: StatusScheduler;
  quantidade_execucoes: number;
  execucoes: ExecucaoScheduler[];
};

type StatusSaude =
  | "online"
  | "configurado"
  | "atencao"
  | "erro"
  | "offline"
  | string;

type ServicoSaude = {
  nome: string;
  status: StatusSaude;
  mensagem: string;
};

type RespostaSaude = {
  sucesso: boolean;
  status_geral: string;
  verificado_em: string;
  total_servicos: number;
  servicos_online: number;
  servicos_atencao: number;
  servicos_com_erro: number;
  servicos: ServicoSaude[];
};

export default function SchedulerPage() {
  const [dados, setDados] =
    useState<RespostaScheduler | null>(null);

  const [saude, setSaude] =
    useState<RespostaSaude | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [
    atualizacaoAutomatica,
    setAtualizacaoAutomatica,
  ] = useState(true);

  const carregarDados = useCallback(async () => {
    setErro("");

    try {
      const [
        respostaScheduler,
        respostaSaude,
      ] = await Promise.all([
        apiFetch<RespostaScheduler>(
          "/admin/scheduler/resumo?limite=20"
        ),
        apiFetch<RespostaSaude>(
          "/admin/saude"
        ),
      ]);

      setDados(respostaScheduler);
      setSaude(respostaSaude);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar o monitoramento do sistema."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (!atualizacaoAutomatica) {
      return;
    }

    const intervalo = window.setInterval(() => {
      carregarDados();
    }, 30000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    atualizacaoAutomatica,
    carregarDados,
  ]);

  const status = dados?.status ?? null;

  const schedulerOnline = useMemo(() => {
    if (!status) {
      return false;
    }

    return status.status !== "offline";
  }, [status]);

  const tempoOnline = useMemo(() => {
    if (!status?.processo_iniciado_em) {
      return "Não informado";
    }

    return formatarDuracaoDesde(
      status.processo_iniciado_em
    );
  }, [status]);

  const ultimaExecucao =
    dados?.execucoes?.[0] ?? null;

  return (
    <div className="p-6 lg:p-10">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Administração
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Monitoramento do sistema
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Acompanhe a saúde dos serviços, as
            execuções do scanner e o laboratório
            mensal.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 items-center gap-3 rounded-xl border border-white/10 px-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={atualizacaoAutomatica}
              onChange={(evento) =>
                setAtualizacaoAutomatica(
                  evento.target.checked
                )
              }
              className="h-4 w-4 accent-blue-600"
            />

            Atualizar a cada 30 segundos
          </label>

          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando
              ? "Atualizando..."
              : "Atualizar agora"}
          </button>
        </div>
      </header>

      {erro && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {erro}
        </div>
      )}

      <section className="mt-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <TituloSecao
            titulo="Saúde do sistema"
            descricao="Estado atual dos principais serviços da plataforma."
          />

          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-600">
              Última verificação
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {carregando
                ? "..."
                : formatarData(
                    saude?.verificado_em
                  )}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {carregando &&
            Array.from({ length: 5 }).map(
              (_, indice) => (
                <CardSaudeCarregando
                  key={indice}
                />
              )
            )}

          {!carregando &&
            saude?.servicos.map((servico) => (
              <CardSaude
                key={servico.nome}
                servico={servico}
              />
            ))}
        </div>

        {!carregando && saude && (
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <ResumoSaude
              titulo="Status geral"
              valor={formatarStatusSaude(
                saude.status_geral
              )}
              destaque={obterDestaqueSaude(
                saude.status_geral
              )}
            />

            <ResumoSaude
              titulo="Serviços disponíveis"
              valor={`${saude.servicos_online}/${saude.total_servicos}`}
              destaque="sucesso"
            />

            <ResumoSaude
              titulo="Em atenção"
              valor={String(
                saude.servicos_atencao
              )}
              destaque={
                saude.servicos_atencao > 0
                  ? "atencao"
                  : "neutro"
              }
            />

            <ResumoSaude
              titulo="Com erro"
              valor={String(
                saude.servicos_com_erro
              )}
              destaque={
                saude.servicos_com_erro > 0
                  ? "erro"
                  : "neutro"
              }
            />
          </div>
        )}
      </section>

      <section className="mt-10">
        <TituloSecao
          titulo="Scheduler"
          descricao="Estado do serviço responsável pelas execuções automáticas."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <CardStatus
            titulo="Scheduler"
            valor={
              carregando
                ? "..."
                : formatarStatusPrincipal(
                    status?.status
                  )
            }
            descricao={
              schedulerOnline
                ? "Serviço em execução"
                : "Serviço desligado"
            }
            situacao={
              schedulerOnline
                ? "sucesso"
                : "erro"
            }
          />

          <CardStatus
            titulo="Tempo online"
            valor={
              carregando
                ? "..."
                : tempoOnline
            }
            descricao="Tempo desde a inicialização"
            situacao="neutro"
          />

          <CardStatus
            titulo="Próximo scanner"
            valor={
              carregando
                ? "..."
                : formatarData(
                    status?.proximo_scanner
                  )
            }
            descricao="Próxima atualização programada"
            situacao="info"
          />

          <CardStatus
            titulo="Próximo laboratório"
            valor={
              carregando
                ? "..."
                : formatarData(
                    status?.proximo_laboratorio
                  )
            }
            descricao="Execução mensal programada"
            situacao="violet"
          />
        </div>
      </section>

      <section className="mt-10">
        <TituloSecao
          titulo="Último scanner"
          descricao="Resultado mais recente da rotina automática."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <CardNumero
            titulo="Status"
            valor={
              carregando
                ? "..."
                : formatarStatusExecucao(
                    status?.ultimo_scanner_status
                  )
            }
            descricao={formatarData(
              status?.ultimo_scanner_fim
            )}
          />

          <CardNumero
            titulo="Candles novos"
            valor={
              carregando
                ? "..."
                : status
                    ?.ultimo_scanner_candles_novos ??
                  0
            }
            descricao="Registros adicionados"
          />

          <CardNumero
            titulo="Oportunidades"
            valor={
              carregando
                ? "..."
                : status
                    ?.ultimo_scanner_oportunidades ??
                  0
            }
            descricao="Oportunidades encontradas"
          />

          <CardNumero
            titulo="E-mails enviados"
            valor={
              carregando
                ? "..."
                : status
                    ?.ultimo_scanner_emails_enviados ??
                  0
            }
            descricao={`Ignorados: ${
              status
                ?.ultimo_scanner_emails_ignorados ??
              0
            } | Falhas: ${
              status
                ?.ultimo_scanner_emails_falhas ??
              0
            }`}
          />
        </div>

        {status?.ultimo_scanner_erro && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-200">
              Último erro do scanner
            </p>

            <p className="mt-2 break-words text-sm leading-6 text-red-300/80">
              {status.ultimo_scanner_erro}
            </p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <TituloSecao
          titulo="Laboratório mensal"
          descricao="Estado da última execução do laboratório principal."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <CardNumero
            titulo="Último status"
            valor={
              carregando
                ? "..."
                : formatarStatusExecucao(
                    status
                      ?.ultimo_laboratorio_status
                  )
            }
            descricao="Resultado da execução"
          />

          <CardNumero
            titulo="Horário programado"
            valor={
              carregando
                ? "..."
                : formatarData(
                    status
                      ?.ultimo_laboratorio_programado
                  )
            }
            descricao="Primeiro sábado do mês"
          />

          <CardNumero
            titulo="Finalizado em"
            valor={
              carregando
                ? "..."
                : formatarData(
                    status
                      ?.ultimo_laboratorio_fim
                  )
            }
            descricao="Última conclusão registrada"
          />
        </div>

        {status?.ultimo_laboratorio_erro && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-200">
              Último erro do laboratório
            </p>

            <p className="mt-2 break-words text-sm leading-6 text-red-300/80">
              {status.ultimo_laboratorio_erro}
            </p>
          </div>
        )}
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Histórico de execuções
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Últimas rotinas executadas pelo
              serviço.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            {dados?.quantidade_execucoes ?? 0}{" "}
            registro(s)
          </p>
        </div>

        {carregando ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-sm text-slate-500">
                Carregando execuções...
              </p>
            </div>
          </div>
        ) : !dados?.execucoes?.length ? (
          <div className="flex min-h-72 items-center justify-center p-8 text-center">
            <p className="text-sm text-slate-400">
              Nenhuma execução registrada ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>Tipo</Th>
                  <Th>Status</Th>
                  <Th>Programado</Th>
                  <Th>Início</Th>
                  <Th>Duração</Th>
                  <Th>Candles</Th>
                  <Th>Oportunidades</Th>
                  <Th>E-mails</Th>
                  <Th>Modo</Th>
                </tr>
              </thead>

              <tbody>
                {dados.execucoes.map(
                  (execucao) => (
                    <tr
                      key={execucao.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <Td>
                        <BadgeTipo
                          tipo={execucao.tipo}
                        />
                      </Td>

                      <Td>
                        <BadgeExecucao
                          status={
                            execucao.status
                          }
                        />
                      </Td>

                      <Td>
                        {formatarData(
                          execucao.horario_programado
                        )}
                      </Td>

                      <Td>
                        {formatarData(
                          execucao.data_inicio
                        )}
                      </Td>

                      <Td>
                        {formatarDuracao(
                          execucao.duracao_segundos
                        )}
                      </Td>

                      <Td>
                        {execucao.candles_novos}
                      </Td>

                      <Td>
                        {
                          execucao.oportunidades_encontradas
                        }
                      </Td>

                      <Td>
                        <div>
                          <p className="text-sm text-slate-300">
                            {
                              execucao.emails_enviados
                            }{" "}
                            enviados
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            {
                              execucao.emails_ignorados
                            }{" "}
                            ignorados ·{" "}
                            {
                              execucao.emails_falhas
                            }{" "}
                            falhas
                          </p>
                        </div>
                      </Td>

                      <Td>
                        {execucao.recuperacao
                          ? "Recuperação"
                          : "Programada"}
                      </Td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ultimaExecucao?.erro && (
        <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <h2 className="font-medium text-red-200">
            Erro da execução mais recente
          </h2>

          <p className="mt-2 break-words text-sm leading-6 text-red-300/80">
            {ultimaExecucao.erro}
          </p>
        </section>
      )}
    </div>
  );
}

function TituloSecao({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">
        {titulo}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {descricao}
      </p>
    </div>
  );
}

function CardSaude({
  servico,
}: {
  servico: ServicoSaude;
}) {
  const destaque = obterDestaqueSaude(
    servico.status
  );

  const estilos = obterEstilosDestaque(
    destaque
  );

  return (
    <article
      className={`rounded-2xl border p-5 ${estilos.container}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">
            {servico.nome}
          </p>

          <p
            className={`mt-3 text-xl font-semibold ${estilos.texto}`}
          >
            {formatarStatusSaude(
              servico.status
            )}
          </p>
        </div>

        <span
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${estilos.indicador}`}
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        {servico.mensagem}
      </p>
    </article>
  );
}

function CardSaudeCarregando() {
  return (
    <article className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="h-4 w-24 rounded bg-white/5" />
      <div className="mt-4 h-7 w-28 rounded bg-white/5" />
      <div className="mt-5 h-3 w-full rounded bg-white/5" />
      <div className="mt-2 h-3 w-3/4 rounded bg-white/5" />
    </article>
  );
}

type DestaqueSaude =
  | "sucesso"
  | "atencao"
  | "erro"
  | "neutro";

function ResumoSaude({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque: DestaqueSaude;
}) {
  const estilos = obterEstilosDestaque(
    destaque
  );

  return (
    <article
      className={`rounded-xl border p-4 ${estilos.container}`}
    >
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p
        className={`mt-2 text-lg font-semibold ${estilos.texto}`}
      >
        {valor}
      </p>
    </article>
  );
}

function obterEstilosDestaque(
  destaque: DestaqueSaude
) {
  const estilos = {
    sucesso: {
      container:
        "border-emerald-500/20 bg-emerald-500/[0.06]",
      texto: "text-emerald-300",
      indicador: "bg-emerald-400",
    },
    atencao: {
      container:
        "border-amber-500/20 bg-amber-500/[0.06]",
      texto: "text-amber-300",
      indicador: "bg-amber-400",
    },
    erro: {
      container:
        "border-red-500/20 bg-red-500/[0.06]",
      texto: "text-red-300",
      indicador: "bg-red-400",
    },
    neutro: {
      container:
        "border-white/10 bg-white/[0.03]",
      texto: "text-white",
      indicador: "bg-slate-500",
    },
  };

  return estilos[destaque];
}

type SituacaoCard =
  | "sucesso"
  | "erro"
  | "info"
  | "violet"
  | "neutro";

function CardStatus({
  titulo,
  valor,
  descricao,
  situacao,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  situacao: SituacaoCard;
}) {
  const estilos: Record<
    SituacaoCard,
    string
  > = {
    sucesso:
      "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300",
    erro:
      "border-red-500/20 bg-red-500/[0.06] text-red-300",
    info:
      "border-blue-500/20 bg-blue-500/[0.06] text-blue-300",
    violet:
      "border-violet-500/20 bg-violet-500/[0.06] text-violet-300",
    neutro:
      "border-white/10 bg-white/[0.03] text-white",
  };

  return (
    <article
      className={`rounded-2xl border p-6 ${estilos[situacao]}`}
    >
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <p className="mt-4 break-words text-2xl font-semibold">
        {valor}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}

function CardNumero({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <p className="mt-4 break-words text-2xl font-semibold text-white">
        {valor}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}

function BadgeTipo({
  tipo,
}: {
  tipo: string;
}) {
  const laboratorio =
    tipo === "laboratorio";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        laboratorio
          ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
          : "border-blue-500/20 bg-blue-500/10 text-blue-300"
      }`}
    >
      {laboratorio
        ? "Laboratório"
        : "Scanner"}
    </span>
  );
}

function BadgeExecucao({
  status,
}: {
  status: string;
}) {
  const configuracoes: Record<
    string,
    {
      texto: string;
      classe: string;
    }
  > = {
    sucesso: {
      texto: "Sucesso",
      classe:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    },
    erro: {
      texto: "Erro",
      classe:
        "border-red-500/20 bg-red-500/10 text-red-300",
    },
    iniciada: {
      texto: "Em execução",
      classe:
        "border-blue-500/20 bg-blue-500/10 text-blue-300",
    },
    interrompida: {
      texto: "Interrompida",
      classe:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },
  };

  const configuracao =
    configuracoes[status] ?? {
      texto: formatarTexto(status),
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
    <td className="px-5 py-5 text-sm text-slate-400">
      {children}
    </td>
  );
}

function obterDestaqueSaude(
  status?: string | null
): DestaqueSaude {
  if (
    status === "online" ||
    status === "configurado"
  ) {
    return "sucesso";
  }

  if (status === "atencao") {
    return "atencao";
  }

  if (
    status === "erro" ||
    status === "offline"
  ) {
    return "erro";
  }

  return "neutro";
}

function formatarStatusSaude(
  status?: string | null
) {
  const nomes: Record<string, string> = {
    online: "Online",
    configurado: "Configurado",
    atencao: "Atenção",
    erro: "Erro",
    offline: "Offline",
  };

  if (!status) {
    return "Não informado";
  }

  return (
    nomes[status] ??
    formatarTexto(status)
  );
}

function formatarStatusPrincipal(
  status?: string | null
) {
  const nomes: Record<string, string> = {
    online: "Online",
    offline: "Offline",
    executando_scanner:
      "Executando scanner",
    executando_laboratorio:
      "Executando laboratório",
  };

  if (!status) {
    return "Não informado";
  }

  return (
    nomes[status] ??
    formatarTexto(status)
  );
}

function formatarStatusExecucao(
  status?: string | null
) {
  const nomes: Record<string, string> = {
    sucesso: "Sucesso",
    erro: "Erro",
    iniciada: "Em execução",
    interrompida: "Interrompida",
  };

  if (!status) {
    return "Nunca executado";
  }

  return (
    nomes[status] ??
    formatarTexto(status)
  );
}

function formatarData(
  dataTexto?: string | null
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

function formatarDuracao(
  segundos?: number | null
) {
  if (
    segundos === null ||
    segundos === undefined
  ) {
    return "Em andamento";
  }

  const total = Math.max(
    0,
    Math.floor(segundos)
  );

  const horas = Math.floor(
    total / 3600
  );

  const minutos = Math.floor(
    (total % 3600) / 60
  );

  const segundosRestantes =
    total % 60;

  if (horas > 0) {
    return `${horas}h ${minutos}min`;
  }

  if (minutos > 0) {
    return `${minutos}min ${segundosRestantes}s`;
  }

  return `${segundosRestantes}s`;
}

function formatarDuracaoDesde(
  dataTexto: string
) {
  const data = new Date(
    dataTexto.replace(" ", "T")
  );

  if (Number.isNaN(data.getTime())) {
    return "Não informado";
  }

  const diferenca = Math.max(
    0,
    Date.now() - data.getTime()
  );

  const minutos = Math.floor(
    diferenca / 60000
  );

  const horas = Math.floor(
    minutos / 60
  );

  const dias = Math.floor(
    horas / 24
  );

  if (dias > 0) {
    return `${dias} dia(s)`;
  }

  if (horas > 0) {
    return `${horas}h ${
      minutos % 60
    }min`;
  }

  return `${minutos}min`;
}

function formatarTexto(
  texto: string
) {
  if (!texto) {
    return "Não informado";
  }

  return texto
    .replaceAll("_", " ")
    .replace(/^./, (letra) =>
      letra.toUpperCase()
    );
}