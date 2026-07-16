"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { apiClienteFetch } from "@/app/services/api-cliente";

type Oportunidade = {
  id?: number;
  acao: string;
  estrategia: string;

  horario_compra: string;
  horario_venda: string;
  horizonte_saida: number;

  taxa_acerto: number;
  ocorrencias: number;
  acertos: number;
  falhas: number;

  retorno_medio: number;
  score: number;

  tipo_acesso?: string;
  data_geracao?: string;
};

type RespostaOportunidades = {
  plano: string;
  acesso: "gratis" | "premium";
  quantidade: number;
  oportunidades: Oportunidade[];
  mensagem?: string;
};

export default function OportunidadesClientePage() {
  const router = useRouter();

  const [dados, setDados] =
    useState<RespostaOportunidades | null>(null);

  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] =
    useState(true);
  const [erro, setErro] = useState("");

  const carregarOportunidades =
    useCallback(async () => {
      setCarregando(true);
      setErro("");

      try {
        const resposta =
          await apiClienteFetch<RespostaOportunidades>(
            "/cliente/oportunidades"
          );

        setDados(resposta);
      } catch (erroDesconhecido) {
        setErro(
          erroDesconhecido instanceof Error
            ? erroDesconhecido.message
            : "Não foi possível carregar as oportunidades."
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    carregarOportunidades();
  }, [carregarOportunidades]);

  const oportunidadesFiltradas =
    useMemo(() => {
      const oportunidades =
        dados?.oportunidades ?? [];

      const termo =
        pesquisa.trim().toLowerCase();

      if (!termo) {
        return oportunidades;
      }

      return oportunidades.filter(
        (oportunidade) => {
          return (
            oportunidade.acao
              .toLowerCase()
              .includes(termo) ||
            oportunidade.estrategia
              .toLowerCase()
              .includes(termo)
          );
        }
      );
    }, [dados, pesquisa]);

  const melhorTaxa = useMemo(() => {
    const oportunidades =
      dados?.oportunidades ?? [];

    if (oportunidades.length === 0) {
      return 0;
    }

    return Math.max(
      ...oportunidades.map(
        (oportunidade) =>
          oportunidade.taxa_acerto
      )
    );
  }, [dados]);

  const melhorRetorno = useMemo(() => {
    const oportunidades =
      dados?.oportunidades ?? [];

    if (oportunidades.length === 0) {
      return 0;
    }

    return Math.max(
      ...oportunidades.map(
        (oportunidade) =>
          oportunidade.retorno_medio
      )
    );
  }, [dados]);

  const acessoPremium =
    dados?.acesso === "premium";

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:p-10">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Scanner de mercado
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Oportunidades
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Padrões aprovados encontrados no candle
            mais recente.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarOportunidades}
          disabled={carregando}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {carregando
            ? "Atualizando..."
            : "Atualizar oportunidades"}
        </button>
      </header>

      {!carregando &&
        dados?.acesso === "gratis" && (
          <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 sm:p-5 md:flex-row md:items-center">
            <div>
              <h2 className="font-medium text-blue-200">
                Você está usando o plano gratuito
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-300/80">
                Somente uma oportunidade fica
                disponível. Assine um plano para
                visualizar todas.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/cliente/dashboard/planos"
                )
              }
              className="flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 text-center text-sm font-medium text-white transition hover:bg-blue-500 md:w-auto"
            >
              Conhecer planos
            </button>
          </section>
        )}

      {erro && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
        >
          {erro}
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Oportunidades disponíveis"
          valor={
            carregando
              ? "..."
              : dados?.quantidade ?? 0
          }
          descricao={
            acessoPremium
              ? "Acesso completo liberado"
              : "Limite do plano gratuito"
          }
          destaque="info"
        />

        <CardResumo
          titulo="Melhor taxa de acerto"
          valor={
            carregando
              ? "..."
              : `${formatarDecimal(
                  melhorTaxa
                )}%`
          }
          descricao="Maior taxa entre as oportunidades"
          destaque="sucesso"
        />

        <CardResumo
          titulo="Melhor retorno médio"
          valor={
            carregando
              ? "..."
              : `${formatarDecimal(
                  melhorRetorno
                )}%`
          }
          descricao="Resultado médio histórico"
          destaque="premium"
        />

        <CardResumo
          titulo="Seu acesso"
          valor={
            carregando
              ? "..."
              : acessoPremium
                ? "Premium"
                : "Grátis"
          }
          descricao={
            acessoPremium
              ? "Todas as oportunidades"
              : "Uma oportunidade"
          }
          destaque={
            acessoPremium
              ? "premium"
              : "neutro"
          }
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:mt-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Oportunidades atuais
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {oportunidadesFiltradas.length}{" "}
              resultado(s)
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <label
              htmlFor="pesquisar-oportunidades"
              className="sr-only"
            >
              Pesquisar ação ou estratégia
            </label>

            <input
              id="pesquisar-oportunidades"
              type="search"
              inputMode="search"
              value={pesquisa}
              onChange={(evento) =>
                setPesquisa(
                  evento.target.value
                )
              }
              placeholder="Pesquisar ação ou estratégia"
              autoComplete="off"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base text-white outline-none placeholder:text-slate-600 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-72 items-center justify-center px-4 py-12 sm:min-h-80">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-sm text-slate-500">
                Consultando oportunidades...
              </p>
            </div>
          </div>
        ) : oportunidadesFiltradas.length ===
          0 ? (
          <div className="flex min-h-72 items-center justify-center p-5 text-center sm:min-h-80 sm:p-8">
            <div className="max-w-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] font-semibold text-slate-400">
                B3
              </div>

              <h3 className="mt-5 font-medium text-slate-200">
                Nenhuma oportunidade disponível
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nenhum padrão aprovado está
                acontecendo no candle mais recente.
                Volte após uma nova execução do
                scanner.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 xl:grid-cols-2">
            {oportunidadesFiltradas.map(
              (oportunidade, indice) => (
                <CardOportunidade
                  key={
                    oportunidade.id ??
                    `${oportunidade.acao}-${indice}`
                  }
                  oportunidade={
                    oportunidade
                  }
                  posicao={indice + 1}
                />
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 sm:mt-8 sm:p-5">
        <h2 className="font-medium text-amber-200">
          Aviso importante
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-300/80">
          As informações exibidas são resultados
          estatísticos de dados históricos. Elas não
          representam promessa de lucro ou recomendação
          individual de investimento.
        </p>
      </section>
    </div>
  );
}

type DestaqueResumo =
  | "info"
  | "sucesso"
  | "premium"
  | "neutro";

function CardResumo({
  titulo,
  valor,
  descricao,
  destaque,
}: {
  titulo: string;
  valor: string | number;
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
    info: {
      container:
        "border-blue-500/20 bg-blue-500/[0.06]",
      valor: "text-blue-300",
    },
    sucesso: {
      container:
        "border-emerald-500/20 bg-emerald-500/[0.06]",
      valor: "text-emerald-300",
    },
    premium: {
      container:
        "border-violet-500/20 bg-violet-500/[0.06]",
      valor: "text-violet-300",
    },
    neutro: {
      container:
        "border-white/10 bg-white/[0.03]",
      valor: "text-white",
    },
  };

  const estilo = estilos[destaque];

  return (
    <article
      className={`min-w-0 rounded-2xl border p-5 ${estilo.container}`}
    >
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <p
        className={`mt-3 break-words text-2xl font-semibold capitalize sm:text-3xl ${estilo.valor}`}
      >
        {valor}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-600">
        {descricao}
      </p>
    </article>
  );
}

function CardOportunidade({
  oportunidade,
  posicao,
}: {
  oportunidade: Oportunidade;
  posicao: number;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
      <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white">
              {posicao}º
            </span>

            <h3 className="break-words text-xl font-semibold text-white">
              {oportunidade.acao}
            </h3>
          </div>

          <p className="mt-4 break-words text-sm leading-6 text-slate-300">
            {oportunidade.estrategia}
          </p>
        </div>

        <span className="w-fit shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Score{" "}
          {formatarDecimal(
            oportunidade.score
          )}
        </span>
      </div>

      <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2 sm:mt-6">
        <Informacao
          titulo="Compra"
          valor={`Fechamento das ${oportunidade.horario_compra}`}
        />

        <Informacao
          titulo="Venda"
          valor={`${oportunidade.horario_venda} — ${oportunidade.horizonte_saida} candle(s) depois`}
        />

        <Informacao
          titulo="Taxa de acerto"
          valor={`${formatarDecimal(
            oportunidade.taxa_acerto
          )}%`}
        />

        <Informacao
          titulo="Retorno médio"
          valor={`${formatarDecimal(
            oportunidade.retorno_medio
          )}%`}
        />

        <Informacao
          titulo="Ocorrências"
          valor={oportunidade.ocorrencias}
        />

        <Informacao
          titulo="Histórico"
          valor={`${oportunidade.acertos} acertos / ${oportunidade.falhas} falhas`}
        />
      </div>

      {oportunidade.data_geracao && (
        <div className="mt-5 border-t border-white/10 pt-4 sm:mt-6">
          <p className="text-xs leading-5 text-slate-600">
            Gerada em{" "}
            {formatarData(
              oportunidade.data_geracao
            )}
          </p>
        </div>
      )}
    </article>
  );
}

function Informacao({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="break-words text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-200">
        {valor}
      </p>
    </div>
  );
}

function formatarDecimal(
  valor: number | null | undefined
) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0));
}

function formatarData(
  dataTexto: string
) {
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