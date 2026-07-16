"use client";

import { useEffect, useState } from "react";

import { apiClienteFetch } from "@/app/services/api-cliente";

type UsuarioCliente = {
  nome: string;
  email: string;
  plano: string;
  expira_em: string | null;
};

type Plano = {
  id: "gratis" | "mensal" | "anual";
  nome: string;
  preco: string;
  periodo: string;
  descricao: string;
  destaque?: string;
  beneficios: string[];
};

type PlanoBackend = {
  id: string;
  nome: string;
  preco_centavos: number;
  preco_formatado: string;
  periodicidade: string;
  duracao_dias: number | null;
  descricao: string;
  beneficios: string[];
};

type CheckoutMercadoPago = {
  preferencia_id: string;
  referencia_externa: string;
  url_pagamento: string;
  modo_teste: boolean;
};

type RespostaIniciarAssinatura = {
  sucesso: boolean;
  pagamento_disponivel?: boolean;
  mensagem: string;
  plano?: PlanoBackend;
  checkout?: CheckoutMercadoPago;
};

const planos: Plano[] = [
  {
    id: "gratis",
    nome: "Grátis",
    preco: "R$ 0",
    periodo: "para sempre",
    descricao:
      "Ideal para conhecer a plataforma e acompanhar oportunidades limitadas.",
    beneficios: [
      "Acesso a 1 oportunidade quando houver sinal disponível",
      "Visualização da taxa de acerto da oportunidade",
      "Visualização do retorno médio histórico",
      "Acesso à área do cliente",
      "Alteração e recuperação de senha",
    ],
  },
  {
    id: "mensal",
    nome: "Premium Mensal",
    preco: "R$ 20",
    periodo: "por mês",
    descricao:
      "Acesso completo às oportunidades sem compromisso anual.",
    destaque: "Mais flexível",
    beneficios: [
      "Acesso a todas as oportunidades disponíveis",
      "Visualização completa das estatísticas",
      "Alertas de novas oportunidades enviados por e-mail",
      "Taxa de acerto, retorno médio e quantidade de ocorrências",
      "Acesso enquanto a assinatura estiver ativa",
      "Cancelamento a qualquer momento",
    ],
  },
  {
    id: "anual",
    nome: "Premium Anual",
    preco: "R$ 180",
    periodo: "por ano",
    descricao:
      "A melhor opção para quem deseja economizar no longo prazo.",
    destaque: "Melhor custo-benefício",
    beneficios: [
      "Todos os benefícios do plano mensal",
      "Alertas de novas oportunidades enviados por e-mail",
      "Acesso completo por 12 meses",
      "Equivale a R$ 15 por mês",
      "Economia de R$ 60 em comparação ao plano mensal",
      "Menos preocupação com renovações mensais",
      "Acesso contínuo às oportunidades Premium",
    ],
  },
];

export default function PlanosPage() {
  const [usuario, setUsuario] =
    useState<UsuarioCliente | null>(null);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [processandoPlano, setProcessandoPlano] =
    useState<string | null>(null);

  useEffect(() => {
    const usuarioSalvo =
      localStorage.getItem("usuario_cliente");

    if (!usuarioSalvo) {
      return;
    }

    try {
      const dadosUsuario =
        JSON.parse(usuarioSalvo) as UsuarioCliente;

      setUsuario(dadosUsuario);
    } catch {
      setUsuario(null);
    }
  }, []);

  async function selecionarPlano(plano: Plano) {
    if (processandoPlano) {
      return;
    }

    setMensagem("");
    setErro("");

    if (plano.id === "gratis") {
      setMensagem(
        "O plano gratuito já está disponível automaticamente para todas as contas."
      );
      return;
    }

    if (usuario?.plano === plano.id) {
      setMensagem(
        `O plano ${plano.nome} já é o seu plano atual.`
      );
      return;
    }

    setProcessandoPlano(plano.id);

    try {
      const resposta =
        await apiClienteFetch<RespostaIniciarAssinatura>(
          "/assinaturas/iniciar",
          {
            method: "POST",
            body: JSON.stringify({
              plano: plano.id,
            }),
          }
        );

      if (
        resposta.pagamento_disponivel &&
        resposta.checkout?.url_pagamento
      ) {
        window.location.href =
          resposta.checkout.url_pagamento;

        return;
      }

      setMensagem(resposta.mensagem);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível iniciar o pagamento."
      );
    } finally {
      setProcessandoPlano(null);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:p-10">
      <header>
        <p className="text-sm font-medium text-blue-400">
          Assinaturas
        </p>

        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          Escolha seu plano
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Escolha a opção que melhor combina com a forma
          como você pretende utilizar o Padrões B3.
        </p>
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
          className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-300"
        >
          {mensagem}
        </div>
      )}

      <section className="mt-6 grid gap-5 sm:mt-8 xl:grid-cols-3">
        {planos.map((plano) => {
          const planoAtual =
            usuario?.plano === plano.id;

          const destaque =
            plano.id === "anual";

          const processando =
            processandoPlano === plano.id;

          return (
            <article
              key={plano.id}
              className={`relative flex min-w-0 flex-col rounded-2xl border p-5 sm:p-6 ${
                destaque
                  ? "border-blue-500/40 bg-blue-500/[0.08]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                <p className="text-sm font-medium text-slate-400">
                  {plano.nome}
                </p>

                {plano.destaque && (
                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
                      destaque
                        ? "border-blue-400/30 bg-blue-500/10 text-blue-300"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {plano.destaque}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1">
                <span className="break-words text-3xl font-semibold text-white sm:text-4xl">
                  {plano.preco}
                </span>

                <span className="pb-1 text-sm text-slate-500">
                  {plano.periodo}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400 xl:min-h-12">
                {plano.descricao}
              </p>

              <div className="mt-6 border-t border-white/10 pt-6">
                <h2 className="text-sm font-semibold text-white">
                  Benefícios do plano
                </h2>

                <ul className="mt-4 space-y-3">
                  {plano.beneficios.map(
                    (beneficio) => (
                      <li
                        key={beneficio}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />

                        <span>
                          {beneficio}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="mt-auto pt-8">
                <button
                  type="button"
                  onClick={() =>
                    selecionarPlano(plano)
                  }
                  disabled={
                    planoAtual ||
                    processando ||
                    processandoPlano !== null
                  }
                  className={`flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-center text-sm font-medium transition ${
                    planoAtual
                      ? "cursor-not-allowed border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : destaque
                        ? "bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  }`}
                >
                  {planoAtual
                    ? "Plano atual"
                    : processando
                      ? "Abrindo pagamento..."
                      : plano.id === "gratis"
                        ? "Plano gratuito"
                        : "Escolher plano"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:mt-8 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          Comparação rápida
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          O plano anual oferece os mesmos recursos do mensal,
          com economia de R$ 60 ao longo de 12 meses.
        </p>

        <div className="mt-5 grid gap-4 sm:mt-6 md:grid-cols-3">
          <Resumo
            titulo="Grátis"
            valor="1 oportunidade"
            descricao="Acesso limitado"
            destaque="neutro"
          />

          <Resumo
            titulo="Mensal"
            valor="R$ 20/mês"
            descricao="Acesso Premium completo"
            destaque="info"
          />

          <Resumo
            titulo="Anual"
            valor="R$ 15/mês"
            descricao="Cobrança única de R$ 180"
            destaque="premium"
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4 sm:mt-8 sm:p-5">
        <h2 className="font-medium text-emerald-200">
          Pagamento seguro
        </h2>

        <p className="mt-2 text-sm leading-6 text-emerald-300/70">
          Ao escolher um plano Premium, você será
          direcionado ao ambiente de pagamento do Mercado
          Pago. O acesso é liberado automaticamente após a
          aprovação.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 sm:mt-8 sm:p-5">
        <h2 className="font-medium text-amber-200">
          Informações importantes
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-300/80">
          As oportunidades são baseadas em análises
          estatísticas de dados históricos. Nenhum plano
          representa garantia de lucro ou recomendação
          individual de investimento.
        </p>
      </section>
    </div>
  );
}

type DestaqueResumo =
  | "neutro"
  | "info"
  | "premium";

function Resumo({
  titulo,
  valor,
  descricao,
  destaque,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  destaque: DestaqueResumo;
}) {
  const estilos: Record<
    DestaqueResumo,
    {
      container: string;
      valor: string;
    }
  > = {
    neutro: {
      container:
        "border-white/5 bg-black/20",
      valor: "text-slate-200",
    },
    info: {
      container:
        "border-blue-500/15 bg-blue-500/[0.05]",
      valor: "text-blue-300",
    },
    premium: {
      container:
        "border-violet-500/15 bg-violet-500/[0.05]",
      valor: "text-violet-300",
    },
  };

  const estilo = estilos[destaque];

  return (
    <article
      className={`min-w-0 rounded-xl border p-4 ${estilo.container}`}
    >
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p
        className={`mt-2 break-words text-lg font-medium ${estilo.valor}`}
      >
        {valor}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}