"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/app/services/api";

type Estrategia = {
  id: number;
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
  maior_lucro: number;
  maior_prejuizo: number;
  ultima_ocorrencia: string | null;
  score: number;
  data_criacao: string;
};

type RespostaEstrategias = {
  quantidade: number;
  estrategias: Estrategia[];
};

type Ordenacao =
  | "score"
  | "taxa_acerto"
  | "ocorrencias"
  | "retorno_medio"
  | "ultima_ocorrencia";

export default function EstrategiasPage() {
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("score");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarEstrategias = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch<RespostaEstrategias>(
        "/admin/estrategias"
      );

      setEstrategias(resposta.estrategias);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar as estratégias."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstrategias();
  }, [carregarEstrategias]);

  const estrategiasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    const lista = estrategias.filter((estrategia) => {
      if (!termo) {
        return true;
      }

      return (
        estrategia.acao.toLowerCase().includes(termo) ||
        estrategia.estrategia.toLowerCase().includes(termo)
      );
    });

    return [...lista].sort((a, b) => {
      if (ordenacao === "ultima_ocorrencia") {
        return (
          converterTimestamp(b.ultima_ocorrencia) -
          converterTimestamp(a.ultima_ocorrencia)
        );
      }

      return Number(b[ordenacao] ?? 0) - Number(a[ordenacao] ?? 0);
    });
  }, [estrategias, pesquisa, ordenacao]);

  const resumo = useMemo(() => {
    if (estrategias.length === 0) {
      return {
        quantidade: 0,
        melhorTaxa: 0,
        maiorAmostra: 0,
        melhorRetorno: 0,
      };
    }

    return {
      quantidade: estrategias.length,
      melhorTaxa: Math.max(
        ...estrategias.map((item) => item.taxa_acerto)
      ),
      maiorAmostra: Math.max(
        ...estrategias.map((item) => item.ocorrencias)
      ),
      melhorRetorno: Math.max(
        ...estrategias.map((item) => item.retorno_medio)
      ),
    };
  }, [estrategias]);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Laboratório evolutivo
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Estratégias
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Padrões aprovados pelos critérios estatísticos do sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarEstrategias}
          disabled={carregando}
          className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? "Atualizando..." : "Atualizar estratégias"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Estratégias aprovadas"
          valor={carregando ? "..." : resumo.quantidade}
          descricao="Melhor saída mantida por padrão"
        />

        <CardResumo
          titulo="Melhor taxa de acerto"
          valor={
            carregando
              ? "..."
              : `${formatarDecimal(resumo.melhorTaxa)}%`
          }
          descricao="Maior taxa entre os padrões"
        />

        <CardResumo
          titulo="Maior amostra"
          valor={carregando ? "..." : resumo.maiorAmostra}
          descricao="Maior número de ocorrências"
        />

        <CardResumo
          titulo="Melhor retorno médio"
          valor={
            carregando
              ? "..."
              : `${formatarDecimal(resumo.melhorRetorno)}%`
          }
          descricao="Maior retorno médio histórico"
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
              Padrões aprovados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {estrategiasFiltradas.length} resultado(s)
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <input
              type="search"
              value={pesquisa}
              onChange={(evento) => setPesquisa(evento.target.value)}
              placeholder="Pesquisar ação ou padrão"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 sm:min-w-72"
            />

            <select
              value={ordenacao}
              onChange={(evento) =>
                setOrdenacao(evento.target.value as Ordenacao)
              }
              className="h-11 rounded-xl border border-white/10 bg-[#0a0e15] px-4 text-sm text-slate-300 outline-none focus:border-blue-500"
            >
              <option value="score">Ordenar por score</option>
              <option value="taxa_acerto">
                Ordenar por taxa de acerto
              </option>
              <option value="ocorrencias">
                Ordenar por ocorrências
              </option>
              <option value="retorno_medio">
                Ordenar por retorno médio
              </option>
              <option value="ultima_ocorrencia">
                Ordenar por última ocorrência
              </option>
            </select>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-sm text-slate-500">
                Carregando estratégias...
              </p>
            </div>
          </div>
        ) : estrategiasFiltradas.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center p-8 text-center">
            <div>
              <p className="font-medium text-slate-300">
                Nenhuma estratégia encontrada
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Execute o laboratório ou altere a pesquisa.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 p-5 xl:grid-cols-2">
            {estrategiasFiltradas.map((estrategia, indice) => (
              <CardEstrategia
                key={estrategia.id ?? `${estrategia.acao}-${indice}`}
                estrategia={estrategia}
                posicao={indice + 1}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type CardResumoProps = {
  titulo: string;
  valor: string | number;
  descricao: string;
};

function CardResumo({
  titulo,
  valor,
  descricao,
}: CardResumoProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-400">{titulo}</p>

      <p className="mt-3 text-3xl font-semibold text-white">
        {valor}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {descricao}
      </p>
    </article>
  );
}

function CardEstrategia({
  estrategia,
  posicao,
}: {
  estrategia: Estrategia;
  posicao: number;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-semibold">
              {posicao}º
            </span>

            <h3 className="text-xl font-semibold text-white">
              {estrategia.acao}
            </h3>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            {estrategia.estrategia}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Score {formatarDecimal(estrategia.score)}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Info
          titulo="Compra"
          valor={estrategia.horario_compra}
        />

        <Info
          titulo="Venda"
          valor={`${estrategia.horario_venda} — ${estrategia.horizonte_saida} candle(s) depois`}
        />

        <Info
          titulo="Taxa de acerto"
          valor={`${formatarDecimal(estrategia.taxa_acerto)}%`}
        />

        <Info
          titulo="Retorno médio"
          valor={`${formatarDecimal(estrategia.retorno_medio)}%`}
        />

        <Info
          titulo="Ocorrências"
          valor={estrategia.ocorrencias}
        />

        <Info
          titulo="Acertos e falhas"
          valor={`${estrategia.acertos} / ${estrategia.falhas}`}
        />

        <Info
          titulo="Maior lucro"
          valor={`${formatarDecimal(estrategia.maior_lucro)}%`}
        />

        <Info
          titulo="Maior prejuízo"
          valor={`${formatarDecimal(estrategia.maior_prejuizo)}%`}
          negativo
        />
      </div>

      <div className="mt-6 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row">
        <div>
          <p className="text-xs text-slate-600">
            Última ocorrência
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {formatarData(estrategia.ultima_ocorrencia)}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-slate-600">
            Laboratório executado em
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {formatarData(estrategia.data_criacao)}
          </p>
        </div>
      </div>
    </article>
  );
}

function Info({
  titulo,
  valor,
  negativo = false,
}: {
  titulo: string;
  valor: string | number;
  negativo?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p
        className={`mt-2 text-sm font-medium ${
          negativo ? "text-red-300" : "text-slate-200"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function formatarDecimal(valor: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0));
}

function formatarData(dataTexto: string | null) {
  if (!dataTexto) {
    return "Não informada";
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

function converterTimestamp(dataTexto: string | null) {
  if (!dataTexto) {
    return 0;
  }

  const data = new Date(dataTexto.replace(" ", "T"));

  return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}