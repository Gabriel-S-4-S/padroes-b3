"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { apiClienteFetch } from "@/app/services/api-cliente";

type StatusPagamento =
  | "criado"
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"
  | string;

type Pagamento = {
  id: number;
  plano: string;
  valor_centavos: number;
  moeda: string;

  preferencia_id: string | null;
  referencia_externa: string;
  pagamento_id: string | null;

  status: StatusPagamento;
  status_detalhe: string | null;

  meio_pagamento: string | null;
  tipo_pagamento: string | null;

  modo_teste: number | boolean;

  data_criacao: string;
  data_atualizacao: string;
  data_aprovacao: string | null;

  processado: number | boolean;
  data_processamento: string | null;
};

type RespostaPagamentos = {
  quantidade: number;
  pagamentos: Pagamento[];
};

type UsuarioCliente = {
  id: number;
  nome: string;
  email: string;
  plano: string;
  status: string;
  expira_em: string | null;
  role: string;
  email_verificado: boolean;
};

type RespostaMinhaConta = {
  sucesso: boolean;
  usuario: UsuarioCliente;
};

type EstadoPagina =
  | "verificando"
  | "aguardando"
  | "aprovado"
  | "recusado"
  | "erro";

const INTERVALO_CONSULTA = 5000;
const LIMITE_CONSULTAS_AUTOMATICAS = 60;

export default function ResultadoPagamentoPage() {
  const router = useRouter();
  const parametros = useSearchParams();

  const referenciaUrl =
    parametros.get("external_reference") ??
    parametros.get("referencia");

  const pagamentoIdUrl =
    parametros.get("payment_id") ??
    parametros.get("collection_id");

  const resultadoUrl = parametros.get("resultado");

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [pagamentoAtual, setPagamentoAtual] =
    useState<Pagamento | null>(null);

  const [estado, setEstado] =
    useState<EstadoPagina>("verificando");

  const [mensagem, setMensagem] = useState(
    "Consultando o status do pagamento..."
  );

  const [erro, setErro] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [ultimaConsulta, setUltimaConsulta] =
    useState<Date | null>(null);

  const quantidadeConsultas = useRef(0);
  const pagamentoConfirmado = useRef(false);

  const atualizarConta = useCallback(async () => {
    const resposta =
      await apiClienteFetch<RespostaMinhaConta>("/auth/me");

    localStorage.setItem(
      "usuario_cliente",
      JSON.stringify(resposta.usuario)
    );

    window.dispatchEvent(
      new CustomEvent("usuario-cliente-atualizado", {
        detail: resposta.usuario,
      })
    );

    return resposta.usuario;
  }, []);

  const encontrarPagamentoRelacionado = useCallback(
    (lista: Pagamento[]) => {
      if (referenciaUrl) {
        const encontrado = lista.find(
          (pagamento) =>
            pagamento.referencia_externa === referenciaUrl
        );

        if (encontrado) {
          return encontrado;
        }
      }

      if (pagamentoIdUrl) {
        const encontrado = lista.find(
          (pagamento) =>
            String(pagamento.pagamento_id) ===
            String(pagamentoIdUrl)
        );

        if (encontrado) {
          return encontrado;
        }
      }

      return lista[0] ?? null;
    },
    [referenciaUrl, pagamentoIdUrl]
  );

  const consultarPagamento = useCallback(
    async (consultaManual = false) => {
      if (consultando || pagamentoConfirmado.current) {
        return;
      }

      setConsultando(true);

      if (consultaManual) {
        setErro("");
        setMensagem("Atualizando o status do pagamento...");
      }

      try {
        const resposta =
          await apiClienteFetch<RespostaPagamentos>(
            "/pagamentos/meus?limite=20"
          );

        const lista = resposta.pagamentos ?? [];

        setPagamentos(lista);

        const pagamento =
          encontrarPagamentoRelacionado(lista);

        setPagamentoAtual(pagamento);
        setUltimaConsulta(new Date());

        if (!pagamento) {
          setEstado("aguardando");
          setMensagem(
            "Ainda não encontramos o pagamento. Aguarde alguns instantes e verifique novamente."
          );
          return;
        }

        const status = pagamento.status?.toLowerCase();

        if (
          status === "approved" &&
          Boolean(pagamento.processado)
        ) {
          pagamentoConfirmado.current = true;

          const usuarioAtualizado = await atualizarConta();

          setEstado("aprovado");
          setMensagem(
            `Pagamento aprovado. Seu plano ${formatarPlano(
              usuarioAtualizado.plano
            )} foi ativado com sucesso.`
          );

          return;
        }

        if (status === "approved") {
          setEstado("aguardando");
          setMensagem(
            "O pagamento foi aprovado e o sistema está concluindo a ativação do plano."
          );
          return;
        }

        if (
          [
            "rejected",
            "cancelled",
            "refunded",
            "charged_back",
          ].includes(status)
        ) {
          setEstado("recusado");
          setMensagem(
            obterMensagemStatus(
              status,
              pagamento.status_detalhe
            )
          );
          return;
        }

        setEstado("aguardando");
        setMensagem(
          obterMensagemStatus(
            status,
            pagamento.status_detalhe
          )
        );
      } catch (erroDesconhecido) {
        setEstado("erro");

        setErro(
          erroDesconhecido instanceof Error
            ? erroDesconhecido.message
            : "Não foi possível consultar o pagamento."
        );
      } finally {
        setConsultando(false);
      }
    },
    [
      consultando,
      encontrarPagamentoRelacionado,
      atualizarConta,
    ]
  );

  useEffect(() => {
    consultarPagamento();

    const intervalo = window.setInterval(() => {
      if (pagamentoConfirmado.current) {
        window.clearInterval(intervalo);
        return;
      }

      quantidadeConsultas.current += 1;

      if (
        quantidadeConsultas.current >=
        LIMITE_CONSULTAS_AUTOMATICAS
      ) {
        window.clearInterval(intervalo);

        setMensagem(
          "A confirmação está levando mais tempo que o esperado. Você pode verificar novamente manualmente."
        );

        return;
      }

      consultarPagamento();
    }, INTERVALO_CONSULTA);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [consultarPagamento]);

  const configuracao = useMemo(
    () => obterConfiguracao(estado),
    [estado]
  );

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-3xl">
        <section
          className={`rounded-2xl border p-6 text-center lg:p-10 ${configuracao.classeContainer}`}
        >
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold ${configuracao.classeIcone}`}
          >
            {estado === "verificando" || consultando ? (
              <span className="h-7 w-7 animate-spin rounded-full border-3 border-current border-t-transparent" />
            ) : (
              configuracao.icone
            )}
          </div>

          <p className="mt-6 text-sm font-medium text-blue-400">
            Pagamento
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">
            {configuracao.titulo}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
            {mensagem}
          </p>

          {erro && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left text-sm text-red-300"
            >
              {erro}
            </div>
          )}

          {pagamentoAtual && (
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
              <Informacao
                titulo="Plano"
                valor={formatarPlano(
                  pagamentoAtual.plano
                )}
              />

              <Informacao
                titulo="Valor"
                valor={formatarDinheiro(
                  pagamentoAtual.valor_centavos
                )}
              />

              <Informacao
                titulo="Status"
                valor={formatarStatus(
                  pagamentoAtual.status
                )}
              />

              <Informacao
                titulo="Forma de pagamento"
                valor={formatarMeioPagamento(
                  pagamentoAtual.meio_pagamento
                )}
              />

              <Informacao
                titulo="Criado em"
                valor={formatarData(
                  pagamentoAtual.data_criacao
                )}
              />

              <Informacao
                titulo="Aprovado em"
                valor={formatarData(
                  pagamentoAtual.data_aprovacao
                )}
              />
            </div>
          )}

          {ultimaConsulta && (
            <p className="mt-6 text-xs text-slate-500">
              Última verificação:{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                timeStyle: "medium",
              }).format(ultimaConsulta)}
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {estado !== "aprovado" && (
              <button
                type="button"
                onClick={() =>
                  consultarPagamento(true)
                }
                disabled={consultando}
                className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {consultando
                  ? "Verificando..."
                  : "Verificar novamente"}
              </button>
            )}

            {estado === "aprovado" ? (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/cliente/dashboard/oportunidades"
                  )
                }
                className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Ver oportunidades
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/cliente/dashboard/planos"
                  )
                }
                className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Voltar aos planos
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                router.push("/cliente/dashboard")
              }
              className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Ir para o início
            </button>
          </div>
        </section>

        {pagamentos.length > 1 && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-semibold text-white">
              Pagamentos recentes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Últimas tentativas registradas nesta conta.
            </p>

            <div className="mt-5 divide-y divide-white/5">
              {pagamentos.slice(0, 5).map((pagamento) => (
                <div
                  key={pagamento.id}
                  className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {formatarPlano(pagamento.plano)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatarData(
                        pagamento.data_criacao
                      )}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm text-slate-300">
                      {formatarDinheiro(
                        pagamento.valor_centavos
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatarStatus(pagamento.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {resultadoUrl === "sucesso" &&
          estado !== "aprovado" && (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
              O retorno do checkout informa que o pagamento foi
              enviado, mas a assinatura só será liberada após a
              confirmação oficial do Mercado Pago.
            </div>
          )}
      </div>
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
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-slate-200">
        {valor}
      </p>
    </div>
  );
}

function obterConfiguracao(estado: EstadoPagina) {
  if (estado === "aprovado") {
    return {
      titulo: "Plano ativado",
      icone: "OK",
      classeContainer:
        "border-emerald-500/20 bg-emerald-500/10",
      classeIcone:
        "bg-emerald-500/20 text-emerald-300",
    };
  }

  if (estado === "recusado") {
    return {
      titulo: "Pagamento não aprovado",
      icone: "X",
      classeContainer:
        "border-red-500/20 bg-red-500/10",
      classeIcone: "bg-red-500/20 text-red-300",
    };
  }

  if (estado === "erro") {
    return {
      titulo: "Não foi possível verificar",
      icone: "!",
      classeContainer:
        "border-red-500/20 bg-red-500/10",
      classeIcone: "bg-red-500/20 text-red-300",
    };
  }

  return {
    titulo:
      estado === "verificando"
        ? "Verificando pagamento"
        : "Aguardando confirmação",
    icone: "...",
    classeContainer:
      "border-blue-500/20 bg-blue-500/10",
    classeIcone: "bg-blue-500/20 text-blue-300",
  };
}

function obterMensagemStatus(
  status: string,
  detalhe: string | null
) {
  const mensagens: Record<string, string> = {
    criado:
      "O checkout foi criado. Conclua o pagamento no Mercado Pago.",
    pending:
      "O pagamento está pendente e será liberado após a aprovação.",
    authorized:
      "O pagamento foi autorizado e está aguardando processamento.",
    in_process:
      "O pagamento está sendo analisado pelo Mercado Pago.",
    in_mediation:
      "O pagamento está em análise.",
    rejected:
      "O pagamento foi recusado. Verifique os dados e tente novamente.",
    cancelled:
      "O pagamento foi cancelado.",
    refunded:
      "O pagamento foi devolvido.",
    charged_back:
      "O pagamento foi estornado.",
  };

  return (
    mensagens[status] ??
    detalhe ??
    "O pagamento ainda está aguardando confirmação."
  );
}

function formatarPlano(plano: string) {
  const nomes: Record<string, string> = {
    gratis: "Grátis",
    mensal: "Premium Mensal",
    anual: "Premium Anual",
  };

  return nomes[plano] ?? plano;
}

function formatarStatus(status: string) {
  const nomes: Record<string, string> = {
    criado: "Checkout criado",
    pending: "Pendente",
    approved: "Aprovado",
    authorized: "Autorizado",
    in_process: "Em processamento",
    in_mediation: "Em análise",
    rejected: "Recusado",
    cancelled: "Cancelado",
    refunded: "Devolvido",
    charged_back: "Estornado",
  };

  return nomes[status] ?? status;
}

function formatarMeioPagamento(
  meioPagamento: string | null
) {
  if (!meioPagamento) {
    return "Ainda não informado";
  }

  const nomes: Record<string, string> = {
    pix: "PIX",
    visa: "Cartão Visa",
    master: "Cartão Mastercard",
    amex: "Cartão American Express",
    elo: "Cartão Elo",
    bolbradesco: "Boleto",
    account_money: "Saldo Mercado Pago",
  };

  return (
    nomes[meioPagamento] ??
    meioPagamento.replaceAll("_", " ")
  );
}

function formatarDinheiro(valorCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100);
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